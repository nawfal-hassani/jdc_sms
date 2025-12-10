// BACKEND
/**
 * Serveur de Dashboard SMS - Point d'entrée principal
 * Ce serveur Express sert l'interface de dashboard SMS et proxie les requêtes vers l'API SMS.
 * Il gère également une historique locale des SMS envoyés.
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');
const helmet = require('helmet');
const authController = require('./src/controllers/authController');

// Configuration de base
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
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

// Configuration de sécurité avec Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "https://cdn.jsdelivr.net", "blob:"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*", "https://cdn.jsdelivr.net"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Importation des routes
const authRoutes = require('./src/routes/auth');
const scheduleRoutes = require('./src/routes/schedule');
const bulkSmsRoutes = require('./src/routes/bulkSms');
const billingRoutes = require('./src/routes/billing');
const chatbotRoutes = require('./src/routes/chatbot');
const stripeRoutes = require('./src/routes/stripe');
const adminRoutes = require('./src/routes/admin');

// Importation du service d'historique par utilisateur
const userHistoryService = require('./src/services/userHistoryService');

// Routes d'authentification et planification
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/bulk-sms', bulkSmsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/stripe', stripeRoutes);

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
app.post('/api/send-sms', authController.authenticate, async (req, res) => {
  try {
    const { to, message } = req.body;
    const userEmail = req.user.email; // Récupérer l'email de l'utilisateur connecté
    
    if (!to || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Numéro de téléphone et message requis' 
      });
    } 
    
    console.log(`📤 Envoi SMS par ${userEmail}:`, { to, message: message.substring(0, 20) + '...' });
    const response = await axios.post(`${SMS_API_URL}/send-sms`, { to, message });
    
    // Ajouter à l'historique de l'utilisateur
    await userHistoryService.addSmsToHistory(userEmail, {
      type: 'SMS',
      to: to,
      message: message,
      status: response.data.success ? 'delivered' : 'failed',
      source: 'dashboard',
      userName: req.user.name,
      messageId: response.data.messageId || null
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Erreur envoi SMS:', error.message);
    
    // Ajouter à l'historique de l'utilisateur même en cas d'erreur
    await userHistoryService.addSmsToHistory(req.user.email, {
      type: 'SMS',
      to: req.body.to || '',
      message: req.body.message || '',
      status: 'failed',
      error: error.message,
      source: 'dashboard',
      userName: req.user.name
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de l\'envoi du SMS' 
    });
  }
});

// Envoyer un token par SMS
app.post('/api/send-token', authController.authenticate, async (req, res) => {
  try {
    const { phoneNumber, token } = req.body;
    const userEmail = req.user.email; // Récupérer l'email de l'utilisateur connecté
    
    if (!phoneNumber || !token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Numéro de téléphone et token requis' 
      });
    }
    
    console.log(`📤 Envoi token par ${userEmail}:`, { phoneNumber, token });
    const response = await axios.post(`${SMS_API_URL}/send-token-by-sms`, { phoneNumber, token });
    
    // Ajouter à l'historique de l'utilisateur
    await userHistoryService.addSmsToHistory(userEmail, {
      type: 'Token',
      to: phoneNumber,
      message: `Votre code d'authentification JDC est: ${token}`,
      token: token,
      status: response.data.success ? 'delivered' : 'failed',
      source: 'dashboard',
      userName: req.user.name,
      messageId: response.data.messageId || null
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Erreur envoi token:', error.message);
    
    // Ajouter à l'historique de l'utilisateur même en cas d'erreur
    await userHistoryService.addSmsToHistory(req.user.email, {
      type: 'Token',
      to: req.body.phoneNumber || '',
      token: req.body.token || '',
      message: req.body.token ? `Votre code d'authentification JDC est: ${req.body.token}` : '',
      status: 'failed',
      error: error.message,
      source: 'dashboard',
      userName: req.user.name
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error || 'Erreur lors de l\'envoi du token' 
    });
  }
});

// Ajouter la méthode remove() au gestionnaire d'historique
historyManager.remove = function(id) {
  console.log('🗑️ Tentative de suppression de l\'ID:', id);
  console.log('📊 Nombre d\'entrées avant suppression:', localHistory.length);
  
  // Log des premiers IDs pour debug
  if (localHistory.length > 0) {
    console.log('🔍 Premiers IDs dans l\'historique:', localHistory.slice(0, 3).map(item => item.id));
  }
  
  // Rechercher le message dans l'historique local
  const initialLength = localHistory.length;
  localHistory = localHistory.filter(item => {
    // Vérifier si l'id correspond à celui recherché
    const keep = item.id !== id;
    if (!keep) {
      console.log('✅ Entrée trouvée et supprimée:', item.id);
    }
    return keep;
  });
  
  // Si la taille du tableau a changé, un élément a été supprimé
  const removed = initialLength > localHistory.length;
  
  console.log('📊 Nombre d\'entrées après suppression:', localHistory.length);
  console.log('✅ Suppression réussie?', removed);
  
  // Sauvegarder le nouvel historique dans le fichier
  if (removed) {
    this.save();
    console.log('💾 Historique sauvegardé dans le fichier');
  } else {
    console.log('❌ Aucune entrée supprimée - ID non trouvé');
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
app.get('/api/sms/history', authController.authenticate, async (req, res) => {
  try {
    // Récupérer l'email de l'utilisateur connecté
    const userEmail = req.user.email;
    const userRole = req.user.role;
    
    console.log(`📊 Récupération historique pour: ${userEmail} (${userRole})`);
    
    // Si admin, charger tous les historiques
    if (userRole === 'admin') {
      const allHistories = await userHistoryService.getAllHistories();
      let combinedHistory = [];
      
      for (const [email, history] of Object.entries(allHistories)) {
        combinedHistory = combinedHistory.concat(history);
      }
      
      // Trier par date (du plus récent au plus ancien)
      combinedHistory.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0);
        const dateB = new Date(b.timestamp || 0);
        return dateB - dateA;
      });
      
      console.log(`👑 Admin: affichage de tout l'historique (${combinedHistory.length} SMS)`);
      return res.json(combinedHistory);
    }
    
    // Utilisateur normal: charger son propre historique
    const userHistory = await userHistoryService.loadUserHistory(userEmail);
    console.log(`🔒 Historique chargé: ${userHistory.length} SMS pour ${userEmail}`);
    
    res.json(userHistory);
  } catch (error) {
    console.error('Erreur récupération historique:', error.message);
    res.status(500).json({ 
      error: 'Impossible de récupérer l\'historique des SMS',
      message: error.message 
    });
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

// Configuration WebSocket pour l'envoi groupé
const bulkSmsService = require('./src/services/bulkSmsService');

io.on('connection', (socket) => {
  console.log(`🔌 Client connecté: ${socket.id}`);

  // Joindre une room pour un job spécifique
  socket.on('join-job', (jobId) => {
    socket.join(`job:${jobId}`);
    console.log(`Client ${socket.id} a rejoint le job ${jobId}`);
    
    // Envoyer l'état actuel du job
    const jobStatus = bulkSmsService.getJobStatus(jobId);
    if (jobStatus) {
      socket.emit('bulk-sms-update', {
        type: 'status',
        jobId: jobId,
        job: jobStatus
      });
    }
  });

  // Quitter une room
  socket.on('leave-job', (jobId) => {
    socket.leave(`job:${jobId}`);
    console.log(`Client ${socket.id} a quitté le job ${jobId}`);
  });

  // Mettre en pause un job
  socket.on('pause-job', (jobId) => {
    try {
      const status = bulkSmsService.pauseJob(jobId);
      io.to(`job:${jobId}`).emit('bulk-sms-update', {
        type: 'paused',
        jobId: jobId,
        job: status
      });
    } catch (error) {
      socket.emit('bulk-sms-error', {
        jobId: jobId,
        error: error.message
      });
    }
  });

  // Reprendre un job
  socket.on('resume-job', (jobId) => {
    try {
      const status = bulkSmsService.resumeJob(jobId);
      io.to(`job:${jobId}`).emit('bulk-sms-update', {
        type: 'resumed',
        jobId: jobId,
        job: status
      });
    } catch (error) {
      socket.emit('bulk-sms-error', {
        jobId: jobId,
        error: error.message
      });
    }
  });

  // Arrêter un job
  socket.on('stop-job', (jobId) => {
    try {
      const status = bulkSmsService.stopJob(jobId);
      io.to(`job:${jobId}`).emit('bulk-sms-update', {
        type: 'stopped',
        jobId: jobId,
        job: status
      });
    } catch (error) {
      socket.emit('bulk-sms-error', {
        jobId: jobId,
        error: error.message
      });
    }
  });

  // Obtenir le statut d'un job
  socket.on('get-job-status', (jobId) => {
    const status = bulkSmsService.getJobStatus(jobId);
    socket.emit('job-status', {
      jobId: jobId,
      status: status
    });
  });

  // Obtenir les résultats d'un job
  socket.on('get-job-results', (jobId) => {
    const results = bulkSmsService.getJobResults(jobId);
    socket.emit('job-results', {
      jobId: jobId,
      results: results
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client déconnecté: ${socket.id}`);
  });
});

// Rendre io accessible dans les routes
app.set('io', io);

// Démarrer le serveur
server.listen(PORT, '0.0.0.0', () => {
  console.log(`📱 Dashboard SMS démarré sur http://0.0.0.0:${PORT}`);
  console.log(`🔌 Connecté à l'API SMS: ${SMS_API_URL}`);
  console.log(`🌐 WebSocket activé pour le suivi en temps réel`);
});