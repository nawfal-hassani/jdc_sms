// BACKEND
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
const userHistoryService = require('../services/userHistoryService');
const authController = require('../controllers/authController');

/**
 * @route   POST /api/send-sms
 * @desc    Envoyer un SMS via l'API
 * @access  Authenticated
 */
router.post('/send-sms', authController.authenticate, async (req, res) => {
  try {
    console.log('Requête envoi SMS reçue:', req.body);
    const { to, message } = req.body;
    
    const response = await apiService.sendSms(to, message);
    console.log('Réponse API SMS:', response);
    
    // Ajouter à l'historique de l'utilisateur
    await userHistoryService.addSmsToHistory(req.user.email, {
      type: 'SMS',
      to: to,
      message: message,
      status: response.success ? 'delivered' : 'failed',
      source: 'dashboard',
      userName: req.user.name || req.user.email,
      ...(response.messageId && { messageId: response.messageId })
    });
    
    res.json(response);
  } catch (error) {
    console.error('Erreur envoi SMS:', error.message);
    
    // Ajouter à l'historique même en cas d'erreur
    try {
      await userHistoryService.addSmsToHistory(req.user.email, {
        type: 'SMS',
        to: req.body.to || '',
        message: req.body.message || '',
        status: 'failed',
        error: error.message,
        source: 'dashboard',
        userName: req.user.name || req.user.email
      });
    } catch (historyError) {
      console.error('Erreur sauvegarde historique:', historyError);
    }
    
    res.status(500).json({ error: 'Erreur lors de l\'envoi du SMS' });
  }
});

/**
 * @route   POST /api/send-token
 * @desc    Envoyer un token par SMS
 * @access  Authenticated
 */
router.post('/send-token', authController.authenticate, async (req, res) => {
  try {
    const { phoneNumber, token } = req.body;
    const response = await apiService.sendToken(phoneNumber, token);
    
    // Ajouter à l'historique de l'utilisateur
    await userHistoryService.addSmsToHistory(req.user.email, {
      type: 'Token',
      to: phoneNumber,
      message: `Votre code d'authentification JDC est: ${token}`,
      token: token,
      status: response.success ? 'delivered' : 'failed',
      source: 'dashboard',
      userName: req.user.name || req.user.email,
      ...(response.messageId && { messageId: response.messageId })
    });
    
    res.json(response);
  } catch (error) {
    console.error('Erreur envoi token:', error.message);
    
    // Ajouter à l'historique même en cas d'erreur
    try {
      await userHistoryService.addSmsToHistory(req.user.email, {
        type: 'Token',
        to: req.body.phoneNumber || '',
        token: req.body.token || '',
        message: req.body.token ? `Votre code d'authentification JDC est: ${req.body.token}` : '',
        status: 'failed',
        error: error.message,
        source: 'dashboard',
        userName: req.user.name || req.user.email
      });
    } catch (historyError) {
      console.error('Erreur sauvegarde historique:', historyError);
    }
    
    res.status(500).json({ error: 'Erreur lors de l\'envoi du token' });
  }
});

/**
 * @route   GET /api/sms/history
 * @desc    Récupérer l'historique des SMS de l'utilisateur connecté
 * @access  Authenticated
 */
router.get('/history', authController.authenticate, async (req, res) => {
  try {
    console.log('Requête historique SMS reçue pour:', req.user.email);
    
    // Récupérer l'historique de l'utilisateur depuis userHistoryService
    const userHistory = await userHistoryService.loadUserHistory(req.user.email);
    
    res.json(userHistory);
  } catch (error) {
    console.error('Erreur récupération historique:', error.message);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de l\'historique',
      message: error.message 
    });
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