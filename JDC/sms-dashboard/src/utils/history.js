/**
 * history.js
 * 
 * Service de gestion de l'historique local des SMS et tokens
 * Gère l'enregistrement, le chargement et la fusion de l'historique local avec l'API
 * 
 * @module utils/history
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier d'historique
const HISTORY_FILE_PATH = path.join(process.cwd(), 'sms-history.json');

// Historique local des SMS et tokens envoyés
let localHistory = [];

/**
 * Charge l'historique local depuis le fichier sms-history.json
 */
function loadHistory() {
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
}

/**
 * Sauvegarde l'historique local dans un fichier
 */
function saveLocalHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(localHistory, null, 2), 'utf8');
  } catch (err) {
    console.error('Erreur lors de la sauvegarde de l\'historique:', err);
  }
}

/**
 * Ajoute une entrée à l'historique local
 * 
 * @param {Object} smsData - Les données du SMS ou token à ajouter
 * @returns {Object} L'entrée ajoutée avec un ID et timestamp
 */
function addToLocalHistory(smsData) {
  // Ajouter un ID unique et un timestamp si non présents
  const newSms = {
    id: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...smsData
  };
  
  // Ajouter au début de l'historique
  localHistory.unshift(newSms);
  
  // Limiter à 100 messages maximum
  if (localHistory.length > 100) {
    localHistory = localHistory.slice(0, 100);
  }
  
  // Sauvegarder l'historique mis à jour
  saveLocalHistory();
  
  return newSms;
}

/**
 * Retourne l'historique local complet
 * 
 * @returns {Array} Historique local des SMS et tokens
 */
function getLocalHistory() {
  return localHistory;
}

/**
 * Fusionne l'historique local avec les données de l'API
 * 
 * @param {Array} apiData - Les données d'historique provenant de l'API
 * @returns {Array} L'historique combiné et trié
 */
function mergeWithApiData(apiData) {
  // Créer une copie de l'historique local
  let combinedHistory = [...localHistory];
  
  // Parcourir les données de l'API
  apiData.forEach(apiSms => {
    // Vérifier si ce SMS existe déjà dans l'historique local
    const exists = combinedHistory.some(localSms => 
      (apiSms.id && localSms.id === apiSms.id) || 
      (apiSms.to && apiSms.timestamp && localSms.to === apiSms.to && localSms.timestamp === apiSms.timestamp)
    );
    
    // Ajouter uniquement s'il n'existe pas déjà
    if (!exists) {
      combinedHistory.push({
        ...apiSms,
        source: 'api'
      });
    }
  });
  
  // Trier l'historique par date (du plus récent au plus ancien)
  combinedHistory.sort((a, b) => {
    const dateA = new Date(a.timestamp || a.date || a.createdAt || 0);
    const dateB = new Date(b.timestamp || b.date || b.createdAt || 0);
    return dateB - dateA; // Ordre décroissant
  });
  
  return combinedHistory;
}

// Charger l'historique au démarrage
loadHistory();

module.exports = {
  addToLocalHistory,
  getLocalHistory,
  mergeWithApiData
};