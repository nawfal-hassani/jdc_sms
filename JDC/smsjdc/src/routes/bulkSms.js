/**
 * Routes pour l'envoi groupé de SMS
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const csvParser = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: function (req, file, cb) {
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez CSV ou Excel.'));
    }
  }
});

/**
 * Upload et parsing d'un fichier CSV/Excel pour envoi groupé
 * @route POST /api/bulk-sms/upload
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    let data;

    try {
      if (fileExtension === '.csv') {
        data = await parseCSVFile(filePath);
      } else if (['.xlsx', '.xls'].includes(fileExtension)) {
        data = await parseExcelFile(filePath);
      } else {
        throw new Error('Format de fichier non supporté');
      }

      // Nettoyer le fichier uploadé
      fs.unlinkSync(filePath);

      // Valider les données
      const validatedData = validateBulkData(data);

      return res.json({
        success: true,
        data: validatedData,
        stats: {
          total: validatedData.length,
          valid: validatedData.filter(d => d.valid).length,
          invalid: validatedData.filter(d => !d.valid).length
        }
      });

    } catch (parseError) {
      // Nettoyer le fichier en cas d'erreur
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw parseError;
    }

  } catch (error) {
    console.error('Erreur lors du traitement du fichier:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement du fichier',
      error: error.message
    });
  }
});

/**
 * Parser un fichier CSV
 */
function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => {
        // Normaliser les clés en minuscules
        const normalized = {};
        Object.keys(data).forEach(key => {
          normalized[key.toLowerCase().trim()] = data[key];
        });
        results.push(normalized);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Parser un fichier Excel
 */
function parseExcelFile(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Normaliser les clés en minuscules
      const normalizedData = data.map(row => {
        const normalized = {};
        Object.keys(row).forEach(key => {
          normalized[key.toLowerCase().trim()] = row[key];
        });
        return normalized;
      });

      resolve(normalizedData);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Valider les données d'envoi groupé
 */
function validateBulkData(data) {
  return data.map((row, index) => {
    const errors = [];

    // Extraire le numéro de téléphone
    const phone = row.phone || row.telephone || row.tel || row.numero || row.number || '';

    // Extraire le message
    const message = row.message || row.texte || row.text || row.sms || row.contenu || '';

    // Extraire le nom (optionnel)
    const name = row.name || row.nom || row.prenom || row.firstname || '';

    // Valider le téléphone
    if (!phone) {
      errors.push('Numéro de téléphone manquant');
    } else {
      const cleanPhone = phone.toString().replace(/\s+/g, '');
      // Format international E.164
      if (!/^\+?[1-9]\d{1,14}$/.test(cleanPhone)) {
        errors.push('Numéro de téléphone invalide (format international requis)');
      }
    }

    // Valider le message
    if (!message) {
      errors.push('Message manquant');
    } else if (message.toString().length > 160) {
      errors.push('Message trop long (max 160 caractères)');
    }

    return {
      lineNumber: index + 1,
      phone: phone.toString(),
      message: message.toString(),
      name: name.toString(),
      valid: errors.length === 0,
      errors: errors
    };
  });
}

/**
 * Envoi groupé de SMS (batch processing)
 * @route POST /api/bulk-sms/send
 */
router.post('/send', async (req, res) => {
  try {
    const { recipients, delay = 1000 } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Liste de destinataires invalide ou vide'
      });
    }

    // Filtrer uniquement les entrées valides
    const validRecipients = recipients.filter(r => r.valid);

    if (validRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun destinataire valide dans la liste'
      });
    }

    // Retourner immédiatement et traiter en arrière-plan
    res.json({
      success: true,
      message: `Envoi de ${validRecipients.length} SMS en cours`,
      total: validRecipients.length
    });

    // Traiter l'envoi en arrière-plan
    processBulkSending(validRecipients, delay);

  } catch (error) {
    console.error('Erreur lors de l\'envoi groupé:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi groupé',
      error: error.message
    });
  }
});

/**
 * Traiter l'envoi groupé en arrière-plan
 */
async function processBulkSending(recipients, delay) {
  const axios = require('axios');
  const SMS_API_URL = process.env.SMS_API_URL || 'http://localhost:3000/api';

  for (const recipient of recipients) {
    try {
      await axios.post(`${SMS_API_URL}/send-sms`, {
        to: recipient.phone,
        message: recipient.message
      });

      console.log(`SMS envoyé avec succès vers ${recipient.phone}`);

      // Attendre avant le prochain envoi
      await new Promise(resolve => setTimeout(resolve, delay));

    } catch (error) {
      console.error(`Erreur lors de l'envoi vers ${recipient.phone}:`, error.message);
    }
  }

  console.log('Envoi groupé terminé');
}

/**
 * Obtenir un template CSV
 * @route GET /api/bulk-sms/template
 */
router.get('/template', (req, res) => {
  const template = 'phone,message,name\n+33612345678,"Bonjour, ceci est un message de test",Jean Dupont\n+33698765432,"Deuxième message de test",Marie Martin';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=template_envoi_groupe.csv');
  res.send(template);
});

module.exports = router;
