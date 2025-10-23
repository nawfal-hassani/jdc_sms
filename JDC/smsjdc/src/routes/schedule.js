// BACKEND
/**
 * Routeur pour la gestion des SMS planifiés
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Chemin du fichier stockant les messages planifiés
const SCHEDULED_MESSAGES_FILE = path.join(__dirname, '../../data/scheduled-messages.json');

// Middleware pour s'assurer que le fichier existe
function ensureFileExists() {
  if (!fs.existsSync(SCHEDULED_MESSAGES_FILE)) {
    fs.writeFileSync(SCHEDULED_MESSAGES_FILE, '[]', 'utf8');
  }
}

// Charger les messages planifiés depuis le fichier
function loadScheduledMessages() {
  ensureFileExists();
  try {
    const data = fs.readFileSync(SCHEDULED_MESSAGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors du chargement des messages planifiés:', error);
    return [];
  }
}

// Sauvegarder les messages planifiés dans le fichier
function saveScheduledMessages(messages) {
  try {
    fs.writeFileSync(SCHEDULED_MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des messages planifiés:', error);
    return false;
  }
}

/**
 * @route   GET /api/schedule
 * @desc    Récupérer tous les messages planifiés
 * @access  Public
 */
router.get('/', (req, res) => {
  try {
    const messages = loadScheduledMessages();
    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages planifiés:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des messages planifiés'
    });
  }
});

/**
 * @route   POST /api/schedule
 * @desc    Créer un nouveau message planifié
 * @access  Public
 */
router.post('/', (req, res) => {
  try {
    const newMessage = req.body;
    
    // Validation de base
    if (!newMessage.to || !newMessage.message || !newMessage.scheduledDate) {
      return res.status(400).json({
        success: false,
        error: 'Les champs destinataire, message et date de planification sont requis'
      });
    }
    
    // S'assurer que l'ID est unique
    if (!newMessage.id) {
      newMessage.id = `sch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    
    // Ajouter la date de création si elle n'existe pas
    if (!newMessage.createdAt) {
      newMessage.createdAt = new Date().toISOString();
    }
    
    // Charger les messages existants
    const messages = loadScheduledMessages();
    
    // Ajouter le nouveau message
    messages.push(newMessage);
    
    // Sauvegarder les messages mis à jour
    if (saveScheduledMessages(messages)) {
      res.json({
        success: true,
        message: 'Message planifié avec succès',
        data: newMessage
      });
    } else {
      throw new Error('Erreur lors de la sauvegarde du message planifié');
    }
  } catch (error) {
    console.error('Erreur lors de la création du message planifié:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création du message planifié'
    });
  }
});

/**
 * @route   GET /api/schedule/:id
 * @desc    Récupérer un message planifié par son ID
 * @access  Public
 */
router.get('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const messages = loadScheduledMessages();
    
    // Rechercher le message par son ID
    const message = messages.find(msg => msg.id === id);
    
    if (message) {
      res.json(message);
    } else {
      res.status(404).json({
        success: false,
        error: 'Message planifié non trouvé'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du message planifié:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération du message planifié'
    });
  }
});

/**
 * @route   PUT /api/schedule/:id
 * @desc    Mettre à jour un message planifié
 * @access  Public
 */
router.put('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const updatedMessage = req.body;
    
    // Charger les messages existants
    const messages = loadScheduledMessages();
    
    // Trouver l'index du message à mettre à jour
    const index = messages.findIndex(msg => msg.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Message planifié non trouvé'
      });
    }
    
    // Mettre à jour le message
    messages[index] = {
      ...messages[index],
      ...updatedMessage,
      id: id, // Conserver l'ID original
      updatedAt: new Date().toISOString()
    };
    
    // Sauvegarder les messages mis à jour
    if (saveScheduledMessages(messages)) {
      res.json({
        success: true,
        message: 'Message planifié mis à jour avec succès',
        data: messages[index]
      });
    } else {
      throw new Error('Erreur lors de la sauvegarde du message planifié mis à jour');
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message planifié:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du message planifié'
    });
  }
});

/**
 * @route   DELETE /api/schedule/:id
 * @desc    Supprimer un message planifié
 * @access  Public
 */
router.delete('/:id', (req, res) => {
  try {
    const id = req.params.id;
    
    // Charger les messages existants
    const messages = loadScheduledMessages();
    
    // Filtrer le message à supprimer
    const filteredMessages = messages.filter(msg => msg.id !== id);
    
    // Vérifier si un message a été supprimé
    if (filteredMessages.length === messages.length) {
      return res.status(404).json({
        success: false,
        error: 'Message planifié non trouvé'
      });
    }
    
    // Sauvegarder les messages mis à jour
    if (saveScheduledMessages(filteredMessages)) {
      res.json({
        success: true,
        message: 'Message planifié supprimé avec succès'
      });
    } else {
      throw new Error('Erreur lors de la suppression du message planifié');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du message planifié:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression du message planifié'
    });
  }
});

module.exports = router;