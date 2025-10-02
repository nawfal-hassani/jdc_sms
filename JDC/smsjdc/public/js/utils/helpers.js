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

// Afficher une alerte
export function showAlert(message, type = 'info') {
  const alertsContainer = document.getElementById('alerts-container');
  if (!alertsContainer) return;
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <i class="fas fa-${type === 'info' ? 'info-circle' : type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}
    <button class="alert-dismiss"><i class="fas fa-times"></i></button>
  `;
  
  // Ajouter un bouton pour fermer l'alerte
  const dismissBtn = alert.querySelector('.alert-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', function() {
      alert.remove();
    });
  }
  
  // Ajouter l'alerte au conteneur
  alertsContainer.appendChild(alert);
  
  // Supprimer automatiquement après 5 secondes
  setTimeout(() => {
    if (alert.parentNode) {
      alert.remove();
    }
  }, 5000);
}