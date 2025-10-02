/**
 * api.js
 * 
 * Service pour communiquer avec l'API SMS externe
 * Gère toutes les interactions avec l'API SMS JDC
 * 
 * @module services/api
 */

const axios = require('axios');

// URL de l'API SMS (définie à partir des variables d'environnement dans index.js)
let SMS_API_URL;

/**
 * Initialise le service API avec l'URL appropriée
 * 
 * @param {string} apiUrl - L'URL de base de l'API SMS
 */
function initialize(apiUrl) {
  SMS_API_URL = apiUrl;
  console.log(`Service API initialisé avec: ${SMS_API_URL}`);
}

/**
 * Vérifie le statut de l'API SMS
 * 
 * @returns {Promise<Object>} Statut de l'API
 */
async function checkStatus() {
  try {
    const response = await axios.get(`${SMS_API_URL}/check`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la vérification du statut de l\'API:', error.message);
    return { 
      status: 'offline',
      message: 'API non disponible',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Envoie un SMS via l'API
 * 
 * @param {string} to - Le numéro de téléphone du destinataire
 * @param {string} message - Le contenu du message à envoyer
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendSms(to, message) {
  try {
    const response = await axios.post(`${SMS_API_URL}/send-sms`, { to, message });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du SMS:', error.message);
    throw error;
  }
}

/**
 * Envoie un token par SMS
 * 
 * @param {string} phoneNumber - Le numéro de téléphone du destinataire
 * @param {string} token - Le token à envoyer
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendToken(phoneNumber, token) {
  try {
    const response = await axios.post(`${SMS_API_URL}/send-token-by-sms`, { phoneNumber, token });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du token:', error.message);
    throw error;
  }
}

/**
 * Récupère l'historique des SMS depuis l'API
 * 
 * @returns {Promise<Array>} Liste des SMS
 */
async function fetchHistory() {
  // Tableau pour stocker les données de l'API
  let apiData = [];
  
  // Essayer d'abord avec le endpoint /history
  try {
    const response = await axios.get(`${SMS_API_URL}/history`);
    console.log('Réponse historique SMS obtenue:', response.data);
    
    // Normaliser les données de l'API
    if (Array.isArray(response.data)) {
      apiData = response.data;
    } else if (response.data && response.data.history && Array.isArray(response.data.history)) {
      apiData = response.data.history;
    } else if (response.data && response.data.messages && Array.isArray(response.data.messages)) {
      apiData = response.data.messages;
    }
    
    return apiData;
    
  } catch (firstError) {
    console.log('Premier endpoint d\'historique a échoué, essai avec le second...');
    
    // Si le premier endpoint échoue, essayer avec /sms-history
    try {
      const response = await axios.get(`${SMS_API_URL}/sms-history`);
      console.log('Réponse historique SMS obtenue (second endpoint):', response.data);
      
      // Normaliser les données de l'API
      if (Array.isArray(response.data)) {
        apiData = response.data;
      } else if (response.data && response.data.history && Array.isArray(response.data.history)) {
        apiData = response.data.history;
      } else if (response.data && response.data.messages && Array.isArray(response.data.messages)) {
        apiData = response.data.messages;
      }
      
      return apiData;
      
    } catch (secondError) {
      console.log('Les deux endpoints d\'historique ont échoué');
      return [];
    }
  }
}

module.exports = {
  initialize,
  checkStatus,
  sendSms,
  sendToken,
  fetchHistory
};