/**
 * cashpad.js
 * 
 * Routes pour l'intégration avec CashPad
 * Gère les requêtes spécifiques au format CashPad
 * 
 * @module routes/cashpad
 */

const express = require('express');
const router = express.Router();
const apiService = require('../services/api');
const historyService = require('../utils/history');

/**
 * Middleware d'authentification pour CashPad
 * Vérifie que la requête contient une clé API valide
 */
function authenticateCashpad(req, res, next) {
  const { apiKey } = req.body;
  
  if (!apiKey || apiKey !== process.env.CASHPAD_API_KEY) {
    return res.status(401).json({ 
      success: false, 
      error: "Accès non autorisé. Clé API invalide ou manquante." 
    });
  }
  
  next();
}

/**
 * @route   POST /api/cashpad/send-sms
 * @desc    Endpoint pour CashPad: Envoyer un SMS
 * @access  Private (authentifié)
 */
router.post('/send-sms', authenticateCashpad, async (req, res) => {
  try {
    console.log('Requête CashPad reçue:', req.body);
    const { to, message } = req.body;
    
    // Valider les paramètres
    if (!to || !message) {
      return res.status(400).json({ 
        success: false, 
        error: "Les paramètres 'to' et 'message' sont requis" 
      });
    }
    
    // Envoyer le SMS via l'API
    const response = await apiService.sendSms(to, message);
    console.log('Réponse SMS CashPad:', response);
    
    // Ajouter à l'historique local
    const smsRecord = {
      type: 'SMS',
      to: to,
      message: message,
      status: response.success ? 'delivered' : 'failed',
      source: 'cashpad',
      // Ajouter d'autres infos de la réponse si disponibles
      ...(response.messageId && { messageId: response.messageId })
    };
    
    historyService.addToLocalHistory(smsRecord);
    
    // Répondre avec un format compatible CashPad
    res.json({
      success: response.success,
      messageId: response.messageId || `cashpad-${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur CashPad:', error.message);
    
    // Ajouter à l'historique local même en cas d'erreur
    const smsRecord = {
      type: 'SMS',
      to: req.body.to || '',
      message: req.body.message || '',
      status: 'failed',
      error: error.message,
      source: 'cashpad'
    };
    
    historyService.addToLocalHistory(smsRecord);
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'envoi du SMS',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/cashpad/status
 * @desc    Vérifier le statut du service pour CashPad
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = await apiService.checkStatus();
    res.json({
      success: true,
      status: status.status || 'online',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ 
      success: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;