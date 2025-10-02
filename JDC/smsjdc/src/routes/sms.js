/**
 * sms.js
 * 
 * Routes pour la gestion des SMS
 * Gère l'envoi de SMS et la récupération de l'historique
 * 
 * @module routes/sms
 */

const express = require('express');
const router = express.Router();
const apiService = require('../services/api');
const historyService = require('../utils/history');

/**
 * @route   POST /api/send-sms
 * @desc    Envoyer un SMS via l'API
 * @access  Public
 */
router.post('/send-sms', async (req, res) => {
  try {
    console.log('Requête envoi SMS reçue:', req.body);
    const { to, message } = req.body;
    
    const response = await apiService.sendSms(to, message);
    console.log('Réponse API SMS:', response);
    
    // Ajouter à l'historique local
    const smsRecord = {
      type: 'SMS',
      to: to,
      message: message,
      status: response.success ? 'delivered' : 'failed',
      source: 'dashboard',
      // Ajouter d'autres infos de la réponse si disponibles
      ...(response.messageId && { messageId: response.messageId })
    };
    
    historyService.addToLocalHistory(smsRecord);
    
    res.json(response);
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
    
    historyService.addToLocalHistory(smsRecord);
    
    res.status(500).json({ error: 'Erreur lors de l\'envoi du SMS' });
  }
});

/**
 * @route   POST /api/send-token
 * @desc    Envoyer un token par SMS
 * @access  Public
 */
router.post('/send-token', async (req, res) => {
  try {
    const { phoneNumber, token } = req.body;
    const response = await apiService.sendToken(phoneNumber, token);
    
    // Ajouter à l'historique local
    const tokenRecord = {
      type: 'Token',
      to: phoneNumber,
      message: `Votre code d'authentification JDC est: ${token}`,
      token: token,
      status: response.success ? 'delivered' : 'failed',
      source: 'dashboard',
      // Ajouter d'autres infos de la réponse si disponibles
      ...(response.messageId && { messageId: response.messageId })
    };
    
    historyService.addToLocalHistory(tokenRecord);
    
    res.json(response);
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
    
    historyService.addToLocalHistory(tokenRecord);
    
    res.status(500).json({ error: 'Erreur lors de l\'envoi du token' });
  }
});

/**
 * @route   GET /api/sms/history
 * @desc    Récupérer l'historique des SMS
 * @access  Public
 */
router.get('/history', async (req, res) => {
  try {
    console.log('Requête historique SMS reçue');
    
    // Récupérer l'historique local
    const localHistory = historyService.getLocalHistory();
    
    // Récupérer l'historique de l'API
    const apiData = await apiService.fetchHistory();
    
    // Fusionner les données
    const combinedHistory = historyService.mergeWithApiData(apiData);
    
    res.json(combinedHistory);
  } catch (error) {
    console.error('Erreur récupération historique:', error.message);
    
    // Si tout échoue, retourner au moins l'historique local
    const localHistory = historyService.getLocalHistory();
    
    if (localHistory.length > 0) {
      console.log('Retour de l\'historique local uniquement en raison d\'une erreur');
      res.json(localHistory);
    } else {
      res.status(500).json({ 
        error: 'Erreur lors de la récupération de l\'historique',
        message: error.message 
      });
    }
  }
});

/**
 * @route   GET /api/status
 * @desc    Vérifier le statut de l'API SMS
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = await apiService.checkStatus();
    res.json(status);
  } catch (error) {
    res.json({ 
      status: 'offline',
      message: 'API non disponible',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;