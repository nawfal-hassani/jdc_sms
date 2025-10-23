// FRONTEND
/**
 * Fonctions utilitaires pour l'historique SMS
 */

// Fonction pour supprimer une entrée de l'historique
function deleteHistoryEntry(id, rowElement) {
  // Demander confirmation avant de supprimer
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée de l\'historique ?')) {
    return;
  }
  
  // Appliquer une classe visuelle pour montrer que l'élément est en cours de suppression
  rowElement.classList.add('deleting');
  
  // Appeler l'API pour supprimer l'entrée
  fetch(`/api/sms/history/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(result => {
    // Si la suppression a réussi, supprimer la ligne du tableau
    if (result.success) {
      rowElement.classList.add('deleted');
      
      // Animation de disparition
      setTimeout(() => {
        rowElement.style.height = rowElement.offsetHeight + 'px';
        rowElement.style.opacity = '0';
        
        setTimeout(() => {
          rowElement.style.height = '0';
          rowElement.style.padding = '0';
          rowElement.style.margin = '0';
          
          setTimeout(() => {
            rowElement.remove();
            
            // Si c'était la dernière ligne, afficher le message "Aucun SMS"
            const historyTableBody = document.querySelector('#history-table tbody');
            if (historyTableBody && historyTableBody.querySelectorAll('tr').length === 0) {
              historyTableBody.innerHTML = `
                <tr>
                  <td colspan="6" style="text-align: center; padding: 20px;">
                    <i class="fas fa-info-circle"></i> Aucun SMS dans l'historique.
                  </td>
                </tr>
              `;
            }
            
            // Mettre à jour les statistiques si possible
            if (window.historyModule && typeof window.historyModule.refreshHistoryTable === 'function') {
              setTimeout(() => window.historyModule.refreshHistoryTable(), 500);
            }
            
          }, 300);
        }, 200);
      }, 100);
      
    } else {
      // Si la suppression a échoué, rétablir l'apparence
      rowElement.classList.remove('deleting');
      alert('Erreur lors de la suppression: ' + (result.message || 'Une erreur est survenue'));
    }
  })
  .catch(error => {
    console.error('Erreur lors de la suppression:', error);
    rowElement.classList.remove('deleting');
    alert('Erreur lors de la suppression: ' + error.message);
  });
}