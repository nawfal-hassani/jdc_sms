/**
 * Service pour la gestion des requêtes API
 */

const API_BASE_URL = 'http://localhost:3030/api';

/**
 * Envoyer une requête à l'API
 * @param {string} endpoint - Point d'entrée de l'API
 * @param {Object} options - Options de la requête fetch
 * @returns {Promise<any>} Réponse de l'API
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Options par défaut
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    // Vérifier si la réponse est OK (status 200-299)
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
    }
    
    // Essayer de parser la réponse comme JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la requête API:', error);
    throw error;
  }
}

/**
 * Service API pour les SMS
 */
export const smsService = {
  /**
   * Récupérer l'historique des SMS
   * @returns {Promise<Array>} Liste des SMS
   */
  getHistory: async () => {
    return apiRequest('/sms/history');
  },
  
  /**
   * Envoyer un nouveau SMS
   * @param {Object} smsData - Données du SMS à envoyer
   * @returns {Promise<Object>} Confirmation d'envoi
   */
  sendSms: async (smsData) => {
    return apiRequest('/sms/send', {
      method: 'POST',
      body: JSON.stringify(smsData)
    });
  },
  
  /**
   * Récupérer les statistiques des SMS
   * @returns {Promise<Object>} Statistiques des SMS
   */
  getStats: async () => {
    return apiRequest('/sms/stats');
  },
  
  /**
   * Vérifier le statut d'un SMS
   * @param {string} smsId - ID du SMS
   * @returns {Promise<Object>} Statut du SMS
   */
  checkStatus: async (smsId) => {
    return apiRequest(`/sms/status/${smsId}`);
  }
};