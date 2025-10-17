// FRONTEND
/**
 * Fonctions utilitaires partagées
 */

// Valider un numéro de téléphone
export function validatePhone(phone) {
  // Format international simple : +33612345678
  return /^\+\d{10,15}$/.test(phone);
}

// Formatter une date
export function formatDate(dateString) {
  const date = new Date(dateString || Date.now());
  return date.toLocaleString('fr-FR');
}

// Formater un numéro de téléphone pour l'affichage
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Nettoyer le numéro (garder seulement les chiffres)
  const cleaned = ('' + phone).replace(/\D/g, '');
  
  // Format français: XX XX XX XX XX
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  
  // Pour les numéros internationaux
  if (cleaned.startsWith('33') && cleaned.length === 11) {
    return '+33 ' + cleaned.substring(2).replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  
  return phone;
}

// Afficher une alerte (désactivée)
export function showAlert(message, type = 'info') {
  // Fonction désactivée à la demande de l'utilisateur
  // Ne fait rien, pas de notifications
  return;
}