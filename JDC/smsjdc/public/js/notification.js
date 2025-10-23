// FRONTEND
/**
 * Notification Manager - Gestion centralisée des notifications pour l'application JDC SMS Dashboard
 */

// Rendre la fonction showNotification disponible globalement
window.showNotification = function(message, type = 'info') {
  const alertsContainer = document.getElementById('alerts-container');
  if (!alertsContainer) {
    console.log(`Notification (${type}):`, message);
    return;
  }
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <i class="fas fa-${type === 'info' ? 'info-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle'}"></i> ${message}
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
};