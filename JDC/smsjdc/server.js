// BACKEND
/**
 * Serveur de Dashboard SMS - Point d'entrée principal
 * Ce serveur Express sert l'interface de dashboard SMS et proxie les requêtes vers l'API SMS.
 * Il gère également une historique locale des SMS envoyés.
 */

const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');
// Configuration de base
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3030;
const SMS_API_URL = process.env.SMS_API_URL || 'http://localhost:3000/api';

// Configuration des chemins
const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE_PATH = path.join(DATA_DIR, 'sms-history.json');

// Créer le répertoire data s'il n'existe pas 
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Historique local des SMS et tokens envoyés
let localHistory = [];

// Charger l'historique local depuis le fichier s'il existe
try {
  if (fs.existsSync(HISTORY_FILE_PATH)) {
    const historyData = fs.readFileSync(HISTORY_FILE_PATH, 'utf8');
    localHistory = JSON.parse(historyData);
    console.log(`Historique local chargé: ${localHistory.length} messages`);
  } else {
    console.log('Aucun fichier d\'historique trouvé, création d\'un nouvel historique');
  }
} catch (err) {
  console.error('Erreur lors du chargement de l\'historique local:', err);
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Importation des routes
const authRoutes = require('./src/routes/auth');
const scheduleRoutes = require('./src/routes/schedule');
const bulkSmsRoutes = require('./src/routes/bulkSms');

// Routes d'authentification et planification
app.use('/api/auth', authRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/bulk-sms', bulkSmsRoutes);

// Utilitaires pour la gestion de l'historique
const historyManager = {
  // Sauvegarder l'historique dans un fichier
  save() {
    try {
      // Créer le répertoire data s'il n'existe pas encore
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(localHistory, null, 2), 'utf8');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de l\'historique:', err);
    }
  },
  
  // Ajouter un message à l'historique
  add(messageData) {
    const newMessage = {
      id: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...messageData
    };
    
    // Ajouter au début de l'historique
    localHistory.unshift(newMessage);
    
    // Limiter à 100 messages maximum
    if (localHistory.length > 100) {
      localHistory = localHistory.slice(0, 100);
    }
    
    // Sauvegarder l'historique mis à jour
    this.save();
    
    return newMessage;
  },
  
  // Fusionner les données d'API avec l'historique local
  mergeApiData(apiData) {
    if (!Array.isArray(apiData)) return [];
    
    let newData = [...localHistory];
    
    apiData.forEach(apiMessage => {
      // Vérifier si ce message existe déjà dans l'historique local
      const exists = newData.some(localMsg => 
        (apiMessage.id && localMsg.id === apiMessage.id) || 
        (apiMessage.to && apiMessage.timestamp && 
         localMsg.to === apiMessage.to && 
         localMsg.timestamp === apiMessage.timestamp)
      );
      
      // Ajouter uniquement s'il n'existe pas déjà
      if (!exists) {
        newData.push({
          ...apiMessage,
          source: 'api'
        });
      }
    });
    
    return newData;
  },
  
  // Normaliser les données d'API
  normalizeApiData(data) {
    if (Array.isArray(data)) {
      return data;
    } else if (data && data.history && Array.isArray(data.history)) {
      return data.history;
    } else if (data && data.messages && Array.isArray(data.messages)) {
      return data.messages;
    }
    return [];
  }
};

// Routes API

// Vérifier le statut de l'API
app.get('/api/status', async (req, res) => {
  try {
    const response = await axios.get(`${SMS_API_URL}/check`);
    res.json(response.data);
  } catch (error) {
    res.json({ 
      status: 'offline',
      message: 'API non disponible',
      version: 'N/A',
      timestamp: new Date().toISOString()
    });
  }
});

// Envoyer un SMS
app.post('/api/send-sms', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Numéro de téléphone et message requis' 
      });
    } 
    
    console.log('Envoi SMS:', { to, message: message.substring(0, 20) + '...' });
    const response = await axios.post(`${SMS_API_URL}/send-sms`, { to, message });
    
    // Ajouter à l'historique local
    const smsRecord = {
      type: 'SMS',
      to: to,
      message: message,
      status: response.data.success ? 'delivered' : 'failed',
      source: 'dashboard',
      // Ajouter d'autres infos de la réponse si disponibles
      ...(response.data.messageId && { messageId: response.data.messageId })
    };
    
    historyManager.add(smsRecord);
    
    res.json(response.data);
  } catch (error) {
    console.error('Erreur envoi SMS:', error.message);
    
    // Ajouter à l'historique local même en cas d'erreur
    const smsRecord = {
      type: 'SMS',
      to: req.body.to || '',
      message: req.body.message || '',
      status: 'failed',
      error: error.message,
      source: 'dashboard'
    };
    
    historyManager.add(smsRecord);
    
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de l\'envoi du SMS' 
    });
  }
});

// Envoyer un token par SMS
app.post('/api/send-token', async (req, res) => {
  try {
    const { phoneNumber, token } = req.body;
    
    if (!phoneNumber || !token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Numéro de téléphone et token requis' 
      });
    }
    
    console.log('Envoi token:', { phoneNumber, token });
    const response = await axios.post(`${SMS_API_URL}/send-token-by-sms`, { phoneNumber, token });
    
    // Ajouter à l'historique local
    const tokenRecord = {
      type: 'Token',
      to: phoneNumber,
      message: `Votre code d'authentification JDC est: ${token}`,
      token: token,
      status: response.data.success ? 'delivered' : 'failed',
      source: 'dashboard',
      // Ajouter d'autres infos de la réponse si disponibles
      ...(response.data.messageId && { messageId: response.data.messageId })
    };
    
    historyManager.add(tokenRecord);
    
    res.json(response.data);
  } catch (error) {
    console.error('Erreur envoi token:', error.message);
    
    // Ajouter à l'historique local même en cas d'erreur
    const tokenRecord = {
      type: 'Token',
      to: req.body.phoneNumber || '',
      token: req.body.token || '',
      message: req.body.token ? `Votre code d'authentification JDC est: ${req.body.token}` : '',
      status: 'failed',
      error: error.message,
      source: 'dashboard'
    };
    
    historyManager.add(tokenRecord);
    
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de l\'envoi du token' 
    });
  }
});

// Ajouter la méthode remove() au gestionnaire d'historique
historyManager.remove = function(id) {
  // Rechercher le message dans l'historique local
  const initialLength = localHistory.length;
  localHistory = localHistory.filter(item => {
    // Vérifier si l'id correspond à celui recherché
    return item.id !== id;
  });
  
  // Si la taille du tableau a changé, un élément a été supprimé
  const removed = initialLength > localHistory.length;
  
  // Sauvegarder le nouvel historique dans le fichier
  if (removed) {
    this.save();
  }
  
  return removed;
};

// Fonction pour convertir l'historique au format CSV
historyManager.toCSV = function(data) {
  if (!Array.isArray(data) || data.length === 0) return '';
  
  // Définir les en-têtes du CSV
  const headers = ['Date', 'Type', 'Destinataire', 'Contenu', 'Statut'];
  
  // Fonction pour échapper les virgules et les guillemets dans les valeurs CSV
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    value = String(value);
    // Si la valeur contient une virgule, un guillemet ou un saut de ligne, on l'entoure de guillemets
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // On double les guillemets dans la valeur
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  
  // Générer la ligne d'en-tête
  let csv = headers.join(',') + '\n';
  
  // Générer les lignes de données
  data.forEach(item => {
    const timestamp = item.timestamp || item.date || item.createdAt || new Date().toISOString();
    const type = item.type || (item.token ? 'Token' : 'SMS');
    const recipient = item.to || item.recipient || item.phoneNumber || '';
    const content = item.message || item.body || item.content || '';
    const status = item.status || 'pending';
    
    const row = [
      new Date(timestamp).toLocaleString('fr-FR'),
      escapeCSV(type),
      escapeCSV(recipient),
      escapeCSV(content),
      escapeCSV(status)
    ];
    
    csv += row.join(',') + '\n';
  });
  
  return csv;
};

// Récupérer l'historique des SMS
app.get('/api/sms/history', async (req, res) => {
  try {
    // Données à retourner (commencer par l'historique local)
    let historyData = [...localHistory];
    
    // Essayer de récupérer l'historique depuis l'API
    try {
      // Essayer d'abord avec le premier endpoint
      const response = await axios.get(`${SMS_API_URL}/history`);
      const apiData = historyManager.normalizeApiData(response.data);
      historyData = historyManager.mergeApiData(apiData);
    } catch (firstError) {
      console.log('Premier endpoint historique échoué, essai avec le second...');
      
      // Si le premier endpoint échoue, essayer avec le second
      try {
        const response = await axios.get(`${SMS_API_URL}/sms-history`);
        const apiData = historyManager.normalizeApiData(response.data);
        historyData = historyManager.mergeApiData(apiData);
      } catch (secondError) {
        console.log('Échec de récupération depuis l\'API, utilisation de l\'historique local');
      }
    }
    
    // Trier l'historique par date (du plus récent au plus ancien)
    historyData.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.date || a.createdAt || 0);
      const dateB = new Date(b.timestamp || b.date || b.createdAt || 0);
      return dateB - dateA; // Ordre décroissant
    });
    
    res.json(historyData);
  } catch (error) {
    console.error('Erreur récupération historique:', error.message);
    
    // Si tout échoue, retourner au moins l'historique local
    if (localHistory.length > 0) {
      res.json(localHistory);
    } else {
      res.status(500).json({ 
        error: 'Impossible de récupérer l\'historique des SMS',
        message: error.message 
      });
    }
  }
});

// Endpoint pour supprimer une entrée de l'historique
app.delete('/api/sms/history/:id', (req, res) => {
  try {
    const id = req.params.id;
    const result = historyManager.remove(id);
    
    if (result) {
      res.json({ success: true, message: 'Entrée supprimée avec succès' });
    } else {
      res.status(404).json({ success: false, message: 'Entrée non trouvée' });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression',
      error: error.message 
    });
  }
});

// Endpoint pour exporter l'historique au format CSV
app.get('/api/sms/history/export', async (req, res) => {
  try {
    // Récupérer l'historique complet comme pour /api/sms/history
    let historyData = [...localHistory];
    
    // Essayer de récupérer l'historique depuis l'API si possible
    try {
      const response = await axios.get(`${SMS_API_URL}/history`);
      const apiData = historyManager.normalizeApiData(response.data);
      historyData = historyManager.mergeApiData(apiData);
    } catch (error) {
      try {
        const response = await axios.get(`${SMS_API_URL}/sms-history`);
        const apiData = historyManager.normalizeApiData(response.data);
        historyData = historyManager.mergeApiData(apiData);
      } catch (secondError) {
        console.log('Utilisation de l\'historique local uniquement pour l\'export');
      }
    }
    
    // Trier l'historique par date (du plus récent au plus ancien)
    historyData.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.date || a.createdAt || 0);
      const dateB = new Date(b.timestamp || b.date || b.createdAt || 0);
      return dateB - dateA;
    });
    
    // Convertir l'historique en CSV
    const csv = historyManager.toCSV(historyData);
    
    // Configurer les en-têtes HTTP pour télécharger un fichier CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sms-history.csv');
    
    // Envoyer le fichier CSV
    res.send(csv);
  } catch (error) {
    console.error('Erreur lors de l\'export de l\'historique:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'export de l\'historique',
      error: error.message 
    });
  }
});

// Route de connexion
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route d'administration
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Route par défaut pour l'application SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`📱 Dashboard SMS démarré sur http://localhost:${PORT}`);
  console.log(`🔌 Connecté à l'API SMS: ${SMS_API_URL}`);
});