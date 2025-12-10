// FRONTEND
/**
 * Gestion de l'historique des SMS pour le Dashboard JDC
 */
document.addEventListener('DOMContentLoaded', function() {
  // Références aux éléments du DOM
  const historyTab = document.getElementById('history-tab');
  const historyTable = document.getElementById('history-table');
  const historyTabLink = document.querySelector('.nav-link[data-tab="history-tab"]');
  let historyTableBody;
  
  // Variable pour stocker l'historique complet (utile pour le filtrage)
  let fullHistoryData = [];
  
  // Fonction pour formater la date
  function formatDate(dateString) {
    const date = new Date(dateString || Date.now());
    return date.toLocaleString('fr-FR');
  }
  
  // Fonction pour déterminer la classe de statut
  function getStatusClass(status) {
    switch(status ? status.toLowerCase() : '') {
      case 'delivered':
      case 'success':
      case 'livré':
        return 'success';
      case 'failed':
      case 'échec':
      case 'error':
        return 'danger';
      case 'pending':
      case 'en attente':
        return 'warning';
      default:
        return '';
    }
  }
  
  // Fonction pour mettre à jour les statistiques du dashboard
  function updateDashboardStats(data) {
    if (!Array.isArray(data)) return;
    
    const total = data.length;
    const delivered = data.filter(sms => {
      const status = (sms.status || '').toLowerCase();
      return status === 'delivered' || status === 'success' || status === 'livré';
    }).length;
    const failed = data.filter(sms => {
      const status = (sms.status || '').toLowerCase();
      return status === 'failed' || status === 'error' || status === 'échec';
    }).length;
    const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    
    // Mettre à jour les compteurs de statistiques
    const statTotal = document.getElementById('stat-total');
    const statSuccess = document.getElementById('stat-success');
    const statFailed = document.getElementById('stat-failed');
    const statRate = document.getElementById('stat-rate');
    
    if (statTotal) statTotal.textContent = total;
    if (statSuccess) statSuccess.textContent = delivered;
    if (statFailed) statFailed.textContent = failed;
    if (statRate) statRate.textContent = `${rate}%`;
  }
  
  // Utilise la fonction showNotification globale définie dans notification.js
  
  // Fonction pour créer ou mettre à jour le bouton de rafraîchissement
  function setupRefreshButton() {
    let refreshButton = document.querySelector('#history-tab .card-actions button');
    
    // Créer un bouton de rafraîchissement s'il n'existe pas déjà
    if (!refreshButton) {
      refreshButton = document.createElement('button');
      refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Rafraîchir';
      refreshButton.className = 'btn btn-secondary';
      
      const cardActions = document.querySelector('#history-tab .card-actions');
      if (cardActions) {
        // Ajouter le bouton au début du conteneur d'actions
        cardActions.prepend(refreshButton);
      }
    }
    
    // Ajouter/remplacer l'écouteur d'événement pour le bouton de rafraîchissement
    refreshButton.addEventListener('click', function() {
      loadSmsHistory();
      showNotification('Actualisation de l\'historique...', 'info');
    });
    
    return refreshButton;
  }
  
  // Fonction pour charger l'historique des SMS
  async function loadSmsHistory() {
    try {
      // Identifier le corps du tableau
      historyTableBody = historyTable.querySelector('tbody');
      
      if (!historyTableBody) {
        console.error('Corps du tableau d\'historique non trouvé');
        return;
      }
      
      // Afficher l'indicateur de chargement
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px;">
            <div class="loader" style="margin-bottom: 10px;"></div>
            <p>Chargement de l'historique...</p>
          </td>
        </tr>
      `;
      
      // 🔑 Récupérer le token d'authentification
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Token d\'authentification non trouvé. Veuillez vous reconnecter.');
      }
      
      // Obtenir l'historique depuis l'API avec le token
      const response = await fetch('/api/sms/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        // Si le premier endpoint échoue, essayer un autre endpoint alternatif
        const altResponse = await fetch('/api/sms-history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!altResponse.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return processResponse(await altResponse.json());
      }
      
      // Traiter la réponse
      const data = await response.json();
      return processResponse(data);
      
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      
      // Afficher un message d'erreur
      if (historyTableBody) {
        historyTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 20px;">
              <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> Erreur lors du chargement de l'historique.
                <br>
                <small>${error.message}</small>
                <br><br>
                <button class="btn btn-secondary btn-sm retry-btn">
                  <i class="fas fa-redo"></i> Réessayer
                </button>
              </div>
            </td>
          </tr>
        `;
        
        // Ajouter un écouteur d'événement au bouton "Réessayer"
        const retryBtn = historyTableBody.querySelector('.retry-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', loadSmsHistory);
        }
      }
      
      showNotification('Erreur lors du chargement de l\'historique', 'danger');
    }
    
    // Fonction pour traiter la réponse et mettre à jour l'interface
    function processResponse(data) {
      let smsData = [];
      
      // Gérer différents formats de réponse API
      if (data && Array.isArray(data)) {
        smsData = data;
      } else if (data && data.history && Array.isArray(data.history)) {
        smsData = data.history;
      } else if (data && data.messages && Array.isArray(data.messages)) {
        smsData = data.messages;
      }
      
      // Stocker l'historique complet pour le filtrage
      fullHistoryData = [...smsData];
      
      // Vider le tableau
      historyTableBody.innerHTML = '';
      
      // Mettre à jour les statistiques du dashboard
      updateDashboardStats(smsData);
      
      // 🔔 Émettre un événement pour notifier que l'historique est chargé
      document.dispatchEvent(new CustomEvent('history-updated', {
        detail: { count: smsData.length }
      }));
      
      // Si des données sont disponibles, les afficher
      if (smsData.length > 0) {
        smsData.forEach(sms => {
          const row = document.createElement('tr');
          
          // Normaliser les propriétés pour gérer différents formats d'API
          const timestamp = sms.timestamp || sms.date || sms.createdAt;
          const recipient = sms.to || sms.recipient || sms.phoneNumber || '';
          const content = sms.message || sms.body || sms.content || '';
          const status = sms.status || 'pending';
          const type = sms.type || (content.includes('code') ? 'Token' : 'SMS');
          
          // Créer les cellules de la ligne avec bouton de suppression
          const messageId = sms.id || sms._id || `${type}-${Date.parse(timestamp)}-${recipient.replace(/\D/g, '')}`;
          
          row.innerHTML = `
            <td>${formatDate(timestamp)}</td>
            <td>${type}</td>
            <td>${recipient}</td>
            <td>${content.length > 50 ? content.substring(0, 47) + '...' : content}</td>
            <td><span class="status ${getStatusClass(status)}">${status}</span></td>
            <td class="actions">
              <button class="btn-delete" title="Supprimer cette entrée">
                <i class="fas fa-trash-alt"></i>
              </button>
            </td>
          `;
          
          // Stocker l'ID dans les attributs de données
          row.setAttribute('data-message-id', messageId);
          
          // Ajouter un titre au survol pour le contenu complet
          if (content.length > 50) {
            row.querySelector('td:nth-child(4)').title = content;
          }
          
          // Ajouter un écouteur d'événement pour le bouton de suppression
          const deleteBtn = row.querySelector('.btn-delete');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              deleteHistoryEntry(messageId, row);
            });
          }
          
          historyTableBody.appendChild(row);
        });
      } else {
        // Aucun SMS dans l'historique
        historyTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 20px;">
              <i class="fas fa-info-circle"></i> Aucun SMS dans l'historique.
            </td>
          </tr>
        `;
      }
    }
  }
  
  // Initialiser le bouton de rafraîchissement
  const refreshButton = setupRefreshButton();
  
  // Charger l'historique quand l'onglet est activé
  if (historyTabLink) {
    historyTabLink.addEventListener('click', function() {
      // Si nous venons de passer à l'onglet d'historique, charger les données
      setTimeout(() => {
        if (historyTab.style.display !== 'none') {
          loadSmsHistory();
        }
      }, 100);
    });
  }
  
  // Fonction pour supprimer une entrée de l'historique
  function deleteHistoryEntry(messageId, row) {
    console.log('🗑️ Demande de suppression pour l\'ID:', messageId);
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée de l\'historique ?')) {
      return;
    }

    console.log('📡 Envoi de la requête DELETE à:', `/api/sms/history/${messageId}`);

    // Appeler l'API pour supprimer l'entrée
    fetch(`/api/sms/history/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('📥 Réponse du serveur:', data);
      if (data.success) {
        // Supprimer visuellement la ligne du tableau
        if (row && row.parentNode) {
          row.classList.add('fade-out');
          setTimeout(() => {
            row.remove();
            
            // Recharger l'historique pour mettre à jour les stats
            loadSmsHistory();
            
            // Afficher une notification de succès
            if (window.showToast) {
              window.showToast('Entrée supprimée avec succès', 'success');
            }
          }, 300);
        }
      } else {
        console.error('Erreur lors de la suppression:', data.message);
        if (window.showToast) {
          window.showToast('Erreur lors de la suppression: ' + data.message, 'error');
        } else {
          alert('Erreur lors de la suppression: ' + data.message);
        }
      }
    })
    .catch(error => {
      console.error('Erreur lors de la suppression:', error);
      if (window.showToast) {
        window.showToast('Erreur lors de la suppression', 'error');
      } else {
        alert('Erreur lors de la suppression');
      }
    });
  }

  // Charger l'historique si l'onglet est déjà actif au chargement
  if (historyTab && historyTab.style.display !== 'none' && historyTable) {
    loadSmsHistory();
  }
  
  // S'abonner à l'événement personnalisé pour mettre à jour l'historique après l'envoi d'un SMS
  document.addEventListener('sms-sent', function(event) {
    // Récupérer les données du SMS envoyé
    const smsData = event.detail.smsData;
    
    // Attendre un peu avant de recharger pour laisser le temps à l'API de traiter la demande
    setTimeout(loadSmsHistory, 1000);
  });
  
  // S'abonner à l'événement personnalisé pour mettre à jour l'historique après l'envoi d'un token
  document.addEventListener('token-sent', function(event) {
    // Récupérer les données du token envoyé
    const tokenData = event.detail.tokenData;
    
    // Attendre un peu avant de recharger pour laisser le temps à l'API de traiter la demande
    setTimeout(loadSmsHistory, 1000);
  });
  
  // Exposer les données d'historique et les fonctions pour le module de filtres
  window.historyModule = {
    getFullHistoryData: function() {
      return fullHistoryData;
    },
    refreshHistoryTable: function() {
      loadSmsHistory();
    }
  };
});