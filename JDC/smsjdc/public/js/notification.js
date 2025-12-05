// FRONTEND
/**
 * Notification Manager - Gestion centralisée des notifications pour l'application JDC SMS Dashboard
 */

// Rendre la fonction showNotification disponible globalement
window.showNotification = function(message, type = 'info') {
  console.log(`[NOTIFICATION] Affichage d'une notification ${type}:`, message);
  
  // Vérifier ou créer le conteneur d'alertes
  let alertsContainer = document.getElementById('alerts-container');
  
  if (!alertsContainer) {
    console.warn('[NOTIFICATION] Conteneur alerts-container non trouvé, création...');
    alertsContainer = document.createElement('div');
    alertsContainer.id = 'alerts-container';
    document.body.appendChild(alertsContainer);
    console.log('[NOTIFICATION] Conteneur créé et ajouté au body');
  }
  
  // Créer l'alerte
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  
  // Déterminer l'icône selon le type
  let iconClass = 'info-circle';
  if (type === 'success') iconClass = 'check-circle';
  else if (type === 'danger' || type === 'error') iconClass = 'exclamation-circle';
  else if (type === 'warning') iconClass = 'exclamation-triangle';
  
  alert.innerHTML = `
    <i class="fas fa-${iconClass}"></i>
    <span>${message}</span>
    <button class="alert-dismiss"><i class="fas fa-times"></i></button>
  `;
  
  // Ajouter un bouton pour fermer l'alerte
  const dismissBtn = alert.querySelector('.alert-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', function() {
      console.log('[NOTIFICATION] Fermeture manuelle de l\'alerte');
      alert.remove();
    });
  }
  
  // Ajouter l'alerte au conteneur
  alertsContainer.appendChild(alert);
  console.log('[NOTIFICATION] Alerte ajoutée au conteneur');
  
  // Supprimer automatiquement après 5 secondes
  setTimeout(() => {
    if (alert.parentNode) {
      console.log('[NOTIFICATION] Suppression automatique de l\'alerte');
      alert.remove();
    }
  }, 5000);
};

// Log de confirmation du chargement
console.log('[NOTIFICATION] Module de notifications chargé - window.showNotification disponible');

// Notification de test désactivée
// La fonction showNotification est prête à être utilisée par les autres modules