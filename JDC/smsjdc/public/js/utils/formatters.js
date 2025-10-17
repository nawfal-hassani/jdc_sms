// FRONTEND
/**
 * Fonctions utilitaires pour le traitement des données
 */

/**
 * Formater un numéro de téléphone
 * @param {string} phone - Le numéro de téléphone à formater
 * @returns {string} Numéro formaté
 */
export function formatPhoneNumber(phone) {
  // Suppression des caractères non numériques
  const cleaned = ('' + phone).replace(/\D/g, '');
  
  // Vérification de la longueur
  const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (match) {
    return match[1] + ' ' + match[2] + ' ' + match[3] + ' ' + match[4] + ' ' + match[5];
  }
  return phone;
}

/**
 * Formater une date
 * @param {string|Date} date - Date à formater
 * @returns {string} Date formatée
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Tronquer un texte à une longueur spécifique
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Texte tronqué
 */
export function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Générer un ID unique
 * @returns {string} ID unique
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Formater un nombre avec séparateur de milliers
 * @param {number} number - Nombre à formater
 * @returns {string} Nombre formaté
 */
export function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Calculer l'écart de temps de manière lisible
 * @param {string|Date} date - Date à comparer avec maintenant
 * @returns {string} Écart de temps lisible
 */
export function timeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) {
    return 'À l\'instant';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }
  
  return formatDate(date);
}