/**
 * index.js
 * 
 * Point d'entrée principal du serveur Dashboard SMS JDC
 * Configure et lance le serveur Express avec tous les middlewares et routes
 * 
 * @module server
 */

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Services et utilitaires
const apiService = require('./services/api');
const requestLogger = require('./middleware/logger');
const { errorHandler, notFound } = require('./middleware/error');
const smsRoutes = require('./routes/sms');
const cashpadRoutes = require('./routes/cashpad');

// Charger les variables d'environnement
dotenv.config();

// Créer l'application Express
const app = express();
const PORT = process.env.PORT || 3030;
const SMS_API_URL = process.env.SMS_API_URL || 'http://localhost:3000/api';

// Initialiser les services
apiService.initialize(SMS_API_URL);

// Configurer les middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configurer les routes
app.use('/api', smsRoutes);
app.use('/api/cashpad', cashpadRoutes);

// Route par défaut pour servir l'interface utilisateur
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Gestion des routes non trouvées
app.use(notFound);

// Gestion des erreurs
app.use(errorHandler);

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Dashboard JDC démarré sur http://localhost:${PORT}`);
  console.log(`API SMS configurée sur: ${SMS_API_URL}`);
});

// Exporter l'app pour les tests
module.exports = app;