// FRONTEND
/**
 * Gestionnaire de l'API
 */

// Configuration de l'API
const API_CONFIG = {
  BASE_URL: localStorage.getItem('apiEndpoint') || 'http://localhost:3000/api',
  TIMEOUT: 10000 // 10 secondes
};

/**
 * Effectue une requête à l'API avec gestion des erreurs et du timeout
 * @param {string} endpoint - Point de terminaison de l'API
 * @param {Object} options - Options fetch
 * @returns {Promise} - Promesse avec la réponse
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  try {
    // Créer un contrôleur d'abandon pour le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    // Ajouter le signal d'abandon aux options
    const fetchOptions = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    // Ajouter la clé API si disponible
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey) {
      fetchOptions.headers['X-API-Key'] = apiKey;
    }
    
    // Effectuer la requête
    const response = await fetch(url, fetchOptions);
    
    // Annuler le timeout
    clearTimeout(timeoutId);
    
    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }
    
    // Retourner les données
    return response.json();
  } catch (error) {
    // Gérer les erreurs spécifiques
    if (error.name === 'AbortError') {
      throw new Error(`La requête a expiré après ${API_CONFIG.TIMEOUT}ms`);
    }
    
    // Propager l'erreur
    throw error;
  }
}

/**
 * Envoyer un SMS via l'API
 * @param {Object} data - Données du SMS
 * @returns {Promise} - Promesse avec la réponse
 */
export function sendSms(data) {
  return apiRequest('/send-sms', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Envoyer un token via l'API
 * @param {Object} data - Données du token
 * @returns {Promise} - Promesse avec la réponse
 */
export function sendToken(data) {
  return apiRequest('/send-token', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Récupérer l'historique des SMS
 * @returns {Promise} - Promesse avec la réponse
 */
export function getSmsHistory() {
  return apiRequest('/sms/history')
    .catch(() => apiRequest('/sms-history')); // Essayer un point de terminaison alternatif en cas d'échec
}

/**
 * Vérifier le statut de l'API
 * @returns {Promise} - Promesse avec la réponse
 */
export function checkApiStatus() {
  return apiRequest('/status');
}

/**
 * Initialiser la configuration de l'API
 * @param {Object} config - Configuration de l'API
 */
export function initApiConfig(config) {
  if (config.baseUrl) localStorage.setItem('apiEndpoint', config.baseUrl);
  if (config.apiKey) localStorage.setItem('apiKey', config.apiKey);
}