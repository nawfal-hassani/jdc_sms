// FRONTEND
  // app.js - Point d'entrée principal de l'application client

// Attendre que le document soit prêt
document.addEventListener('DOMContentLoaded', function() {
  // Initialiser la navigation
  setupTabNavigation();
  
  // Initialiser le dashboard principal
  initDashboard();
  
  // Initialiser le module d'envoi de SMS
  initSmsModule();
  
  // Initialiser le module d'envoi de tokens
  initTokenModule();
  
  // Initialiser le module d'historique
  initHistoryModule();
  
  // Initialiser le module de paramètres
  initSettingsModule();
  
  // Initialiser le gestionnaire de thème
  initThemeManager();
});

// Navigation entre les onglets
function setupTabNavigation() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Récupérer l'ID de l'onglet à afficher
      const tabId = this.getAttribute('data-tab');
      if (!tabId) return;
      
      // Masquer tous les onglets
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
      });
      
      // Afficher l'onglet demandé
      const activeTab = document.getElementById(tabId);
      if (activeTab) {
        activeTab.style.display = 'block';
      }
      
      // Mettre à jour les liens de navigation
      document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
      });
      
      this.classList.add('active');
      
      // Déclencher un événement pour informer les autres modules
      document.dispatchEvent(new CustomEvent('tab-changed', {
        detail: { tabId }
      }));
    });
  });
}

// Initialiser le dashboard principal
function initDashboard() {
  // Vérifier le statut de l'API au chargement
  checkApiStatus();
  
  // Initialiser les graphiques
  initCharts();
  
  // Configurer le bouton de rafraîchissement du statut
  const refreshStatusBtn = document.getElementById('refresh-status');
  if (refreshStatusBtn) {
    refreshStatusBtn.addEventListener('click', checkApiStatus);
  }
  
  // Configurer le bouton d'exportation du graphique
  const dashboardExportBtn = document.querySelector('#dashboard-tab .card:nth-child(2) .card-actions button');
  if (dashboardExportBtn && dashboardExportBtn.textContent.includes('Exporter')) {
    dashboardExportBtn.addEventListener('click', function() {
      exportSmsHistory();
    });
  }
}

// Vérifier le statut de l'API
function checkApiStatus() {
  const statusIndicator = document.getElementById('api-status');
  const statusText = document.getElementById('status-text');
  const apiVersionEl = document.getElementById('api-version');
  const apiUrlEl = document.getElementById('api-url');
  const lastCheckEl = document.getElementById('last-check');
  
  if (!statusIndicator || !statusText) return;
  
  // Afficher l'état "en cours de vérification"
  statusIndicator.className = 'badge pending';
  statusText.textContent = 'Vérification en cours...';
  
  // Appeler l'API pour vérifier son statut
  fetch('/api/status')
    .then(response => response.json())
    .then(data => {
      // Mettre à jour les informations de statut
      const status = data.status || 'unknown';
      
      statusIndicator.className = `badge ${status === 'online' ? 'success' : status === 'offline' ? 'danger' : 'warning'}`;
      statusText.textContent = status === 'online' ? 'API en ligne' : 
                             status === 'offline' ? 'API hors ligne' : 'Statut inconnu';
      
      // Mettre à jour les autres informations
      if (apiVersionEl) apiVersionEl.textContent = data.version || 'Non disponible';
      if (apiUrlEl) apiUrlEl.textContent = SMS_API_URL || 'http://localhost:3000/api';
      if (lastCheckEl) lastCheckEl.textContent = new Date().toLocaleString();
    })
    .catch(error => {
      statusIndicator.className = 'badge danger';
      statusText.textContent = 'Erreur de connexion';
      console.error('Erreur lors de la vérification du statut:', error);
    });
}

// Importer le module des graphiques
import { initCharts } from './modules/charts.js';

// Module d'envoi de SMS
function initSmsModule() {
  const smsForm = document.getElementById('sms-form');
  const phoneInput = document.getElementById('phone');
  const messageInput = document.getElementById('message');
  const charCounter = document.getElementById('char-counter');
  const smsPreviewText = document.getElementById('sms-preview-text');
  
  if (!smsForm || !phoneInput || !messageInput) return;
  
  // Mettre à jour le compteur de caractères lors de la saisie
  messageInput.addEventListener('input', function() {
    updateCharCounter(this.value, charCounter);
    
    // Mettre à jour l'aperçu
    if (smsPreviewText) {
      smsPreviewText.textContent = this.value || "Votre message s'affichera ici...";
    }
  });
  
  // Gérer la soumission du formulaire
  smsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    sendSms();
  });
  
  // Fonction d'envoi de SMS
  function sendSms() {
    // Valider les entrées
    if (!validatePhone(phoneInput.value)) {
      showAlert('Numéro de téléphone invalide. Format international requis (ex: +33612345678)', 'danger');
      return;
    }
    
    if (!messageInput.value.trim()) {
      showAlert('Le message ne peut pas être vide.', 'danger');
      return;
    }
    
    // Désactiver le bouton et afficher le chargement
    const submitBtn = smsForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loader"></span> Envoi...';
    
    // Envoyer la requête à l'API
    fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phoneInput.value.trim(),
        message: messageInput.value.trim()
      })
    })
    .then(response => response.json())
    .then(data => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Envoyer le SMS';
      
      if (data.success) {
        showAlert(`SMS envoyé avec succès à ${phoneInput.value}`, 'success');
        messageInput.value = '';
        updateCharCounter('', charCounter);
        if (smsPreviewText) smsPreviewText.textContent = "Votre message s'affichera ici...";
        
        // Mettre à jour les statistiques
        updateStats(true);
        
        // Informer les autres modules
        document.dispatchEvent(new CustomEvent('sms-sent', {
          detail: { 
            success: true,
            smsData: {
              type: 'SMS',
              to: phoneInput.value,
              message: messageInput.value,
              status: 'success',
              date: new Date()
            }
          }
        }));
      } else {
        showAlert(`Erreur: ${data.error || 'Échec de l\'envoi du SMS'}`, 'danger');
        
        // Mettre à jour les statistiques
        updateStats(false);
        
        // Informer les autres modules
        document.dispatchEvent(new CustomEvent('sms-sent', {
          detail: { success: false }
        }));
      }
    })
    .catch(error => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Envoyer le SMS';
      showAlert(`Erreur: ${error.message}`, 'danger');
      
      // Informer les autres modules
      document.dispatchEvent(new CustomEvent('sms-sent', {
        detail: { success: false }
      }));
    });
  }
  
  // Mettre à jour le compteur de caractères
  function updateCharCounter(text, counterElement) {
    if (!counterElement) return;
    
    const length = text.length;
    const smsCount = Math.ceil(length / 160);
    
    counterElement.textContent = `${length} caractères (${smsCount} SMS)`;
  }
}

// Module d'envoi de tokens
function initTokenModule() {
  const tokenForm = document.getElementById('token-form');
  const phoneInput = document.getElementById('token-phone');
  const tokenInput = document.getElementById('token');
  const tokenPreview = document.getElementById('token-preview');
  const generateTokenBtn = document.getElementById('generate-token');
  
  if (!tokenForm || !phoneInput || !tokenInput) return;
  
  // Mettre à jour l'aperçu lors de la saisie
  tokenInput.addEventListener('input', function() {
    if (tokenPreview) {
      tokenPreview.textContent = this.value || '------';
    }
  });
  
  // Configurer le bouton de génération de token
  if (generateTokenBtn) {
    generateTokenBtn.addEventListener('click', function() {
      // Générer un token aléatoire à 6 chiffres
      const randomToken = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Mettre à jour le champ et l'aperçu
      tokenInput.value = randomToken;
      if (tokenPreview) {
        tokenPreview.textContent = randomToken;
      }
      
      // Animation visuelle pour indiquer que le token a été généré
      generateTokenBtn.classList.add('btn-success');
      setTimeout(() => {
        generateTokenBtn.classList.remove('btn-success');
      }, 500);
    });
  }
  
  // Gérer la soumission du formulaire
  tokenForm.addEventListener('submit', function(e) {
    e.preventDefault();
    sendToken();
  });
  
  // Fonction d'envoi de token
  function sendToken() {
    // Valider les entrées
    if (!validatePhone(phoneInput.value)) {
      showAlert('Numéro de téléphone invalide. Format international requis (ex: +33612345678)', 'danger');
      return;
    }
    
    if (!tokenInput.value.trim()) {
      showAlert('Le token ne peut pas être vide.', 'danger');
      return;
    }
    
    // Désactiver le bouton et afficher le chargement
    const submitBtn = tokenForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loader"></span> Envoi...';
    
    // Envoyer la requête à l'API
    fetch('/api/send-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: phoneInput.value.trim(),
        token: tokenInput.value.trim()
      })
    })
    .then(response => response.json())
    .then(data => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Envoyer le Token';
      
      if (data.success) {
        showAlert(`Token envoyé avec succès à ${phoneInput.value}`, 'success');
        tokenInput.value = '';
        if (tokenPreview) tokenPreview.textContent = '------';
        
        // Mettre à jour les statistiques
        updateStats(true);
        
        // Informer les autres modules
        document.dispatchEvent(new CustomEvent('token-sent', {
          detail: { 
            success: true,
            tokenData: {
              type: 'Token',
              to: phoneInput.value,
              token: tokenInput.value,
              status: 'success',
              date: new Date()
            }
          }
        }));
      } else {
        showAlert(`Erreur: ${data.error || 'Échec de l\'envoi du token'}`, 'danger');
        
        // Mettre à jour les statistiques
        updateStats(false);
        
        // Informer les autres modules
        document.dispatchEvent(new CustomEvent('token-sent', {
          detail: { success: false }
        }));
      }
    })
    .catch(error => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Envoyer le Token';
      showAlert(`Erreur: ${error.message}`, 'danger');
      
      // Informer les autres modules
      document.dispatchEvent(new CustomEvent('token-sent', {
        detail: { success: false }
      }));
    });
  }
}

// Module d'historique
function initHistoryModule() {
  // Référence aux éléments DOM
  const historyTab = document.getElementById('history-tab');
  const historyTable = document.getElementById('history-table');
  const historyTabLink = document.querySelector('.nav-link[data-tab="history-tab"]');
  
  if (!historyTab || !historyTable) return;
  
  // Charger l'historique quand l'onglet est activé
  if (historyTabLink) {
    historyTabLink.addEventListener('click', function() {
      setTimeout(loadSmsHistory, 100);
    });
  }
  
  // Charger l'historique si l'onglet est déjà actif au chargement
  if (historyTab.style.display !== 'none') {
    loadSmsHistory();
  }
  
  // S'abonner aux événements d'envoi pour mettre à jour l'historique
  document.addEventListener('sms-sent', function() {
    setTimeout(loadSmsHistory, 1000);
  });
  
  document.addEventListener('token-sent', function() {
    setTimeout(loadSmsHistory, 1000);
  });
  
    // Créer ou mettre à jour le bouton de rafraîchissement
  const cardActions = historyTab.querySelector('.card-actions');
  if (cardActions) {
    let refreshButton = cardActions.querySelector('button:first-child');
    if (!refreshButton) {
      refreshButton = document.createElement('button');
      refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Rafraîchir';
      cardActions.prepend(refreshButton);
    }
    
    refreshButton.addEventListener('click', function() {
      loadSmsHistory();
      // Notification désactivée
      // showAlert('Actualisation de l\'historique...', 'info');
    });
    
    // Configurer le bouton d'exportation
    const exportButton = cardActions.querySelector('button:nth-child(2)');
    if (exportButton && exportButton.textContent.includes('Exporter')) {
      exportButton.addEventListener('click', function() {
        exportSmsHistory();
      });
    }
    const exportButtons = cardActions.querySelectorAll('button');
    exportButtons.forEach(button => {
      if (button.innerHTML.includes('fa-download') || button.textContent.includes('Exporter')) {
        button.addEventListener('click', function() {
          exportSmsHistory();
        });
      }
    });
  }
  
  // Le mode suppression a été retiré, les boutons de suppression sont toujours visibles
  
  // Fonction pour exporter l'historique (utilisée par tous les boutons d'exportation)
  function exportSmsHistory() {
    // Méthode 1: Redirection simple - plus fiable dans tous les navigateurs
    window.location.href = '/api/sms/history/export';
    return false;
  }

  // Fonction pour initialiser les boutons de suppression
  function initDeleteButtons() {
    // Obtenir une référence directe à la table d'historique
    const historyTable = document.getElementById('history-table');
    if (!historyTable) return;
    
    // Sélectionner tous les boutons de suppression
    const deleteButtons = historyTable.querySelectorAll('.btn-delete');
    console.log(`${deleteButtons.length} boutons de suppression trouvés`);
    
    // Ajouter un écouteur d'événement à chaque bouton
    deleteButtons.forEach(button => {
      const row = button.closest('tr');
      const messageId = row.dataset.messageId;
      
      // Supprimer les écouteurs existants pour éviter les doublons
      button.replaceWith(button.cloneNode(true));
      const newButton = row.querySelector('.btn-delete');
      
      // Ajouter un nouvel écouteur
      newButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log(`Suppression de l'entrée ${messageId}`);
        deleteHistoryEntry(messageId, row);
      });
    });
  }

  // Fonction pour charger l'historique
  function loadSmsHistory() {
    const historyTableBody = historyTable.querySelector('tbody');
    if (!historyTableBody) return;
    
    // Afficher l'indicateur de chargement
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px;">
          <div class="loader"></div>
          <p>Chargement de l'historique...</p>
        </td>
      </tr>
    `;
    
    // Récupérer l'historique depuis l'API
    fetch('/api/sms/history')
      .then(response => {
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        return response.json();
      })
      .then(data => {
        // Vider le tableau
        historyTableBody.innerHTML = '';
        
        // Mettre à jour les statistiques
        updateDashboardStats(data);
        
        // Si des données sont disponibles, les afficher
        if (data.length > 0) {
          data.forEach(sms => {
            const row = document.createElement('tr');
            
            // Normaliser les propriétés
            const timestamp = sms.timestamp || sms.date || sms.createdAt;
            const recipient = sms.to || sms.recipient || sms.phoneNumber || '';
            const content = sms.message || sms.body || sms.content || '';
            const status = sms.status || 'pending';
            const type = sms.type || (content.includes('code') ? 'Token' : 'SMS');
            
            // Créer la ligne
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
            
            // Générer un ID unique si aucun n'est défini
            const messageId = sms.id || sms._id || `${type}-${Date.parse(timestamp)}-${recipient.replace(/\D/g, '')}`;
            row.dataset.messageId = messageId;
            
            // Ajouter un titre au survol pour le contenu complet
            if (content.length > 50) {
              row.querySelector('td:nth-child(4)').title = content;
            }
            
            // Ajouter l'écouteur d'événement pour le bouton de suppression
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
          
          // Initialiser les boutons de suppression après avoir ajouté toutes les lignes
          initDeleteButtons();
          
          // Déclencher un événement pour informer que l'historique a été chargé
          // Les autres modules pourront réagir à cet événement (comme le module de filtrage)
          document.dispatchEvent(new CustomEvent('history-loaded', {
            detail: { data }
          }));
        } else {
          // Aucun SMS dans l'historique
          historyTableBody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; padding: 20px;">
                <i class="fas fa-info-circle"></i> Aucun SMS dans l'historique.
              </td>
            </tr>
          `;
        }
      })
      .catch(error => {
        console.error('Erreur lors du chargement de l\'historique:', error);
        
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
      });
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
  
  // Fonction pour supprimer une entrée de l'historique
  async function deleteHistoryEntry(id, rowElement) {
    // Demander confirmation avant de supprimer
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée de l\'historique ?')) {
      return;
    }
    
    try {
      // Appliquer une classe visuelle pour montrer que l'élément est en cours de suppression
      rowElement.classList.add('deleting');
      
      // Appeler l'API pour supprimer l'entrée
      const response = await fetch(`/api/sms/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
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
              if (historyTableBody.querySelectorAll('tr').length === 0) {
                historyTableBody.innerHTML = `
                  <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">
                      <i class="fas fa-info-circle"></i> Aucun SMS dans l'historique.
                    </td>
                  </tr>
                `;
              }
              
              // Mettre à jour les statistiques
              updateDashboardStats([...historyTableBody.querySelectorAll('tr[data-message-id]')]);
            }, 300);
          }, 200);
        }, 100);
        
        console.log('Entrée supprimée avec succès');
      } else {
        throw new Error(result.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      rowElement.classList.remove('deleting');
      console.error(`Erreur: ${error.message}`);
    }
  }
}

// Module de paramètres
function initSettingsModule() {
  const settingsForm = document.getElementById('settings-form');
  if (!settingsForm) return;
  
  // Charger les valeurs enregistrées
  loadSettingsValues();
  
  // Configurer le formulaire
  settingsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    saveSettingsValues();
  });
  
  // Initialiser le système de thème
  setupThemeSystem();
  
  // Initialiser le système de couleurs
  setupColorSystem();
  
  // Fonctions pour les paramètres
  function loadSettingsValues() {
    const apiEndpoint = localStorage.getItem('apiEndpoint') || 'http://localhost:3000/api';
    const apiKey = localStorage.getItem('apiKey') || '';
    const defaultMessage = localStorage.getItem('defaultMessage') || '';
    const tokenPrefix = localStorage.getItem('tokenPrefix') || "Votre code d'authentification JDC est: ";
    
    const apiEndpointInput = document.getElementById('api-endpoint');
    const apiKeyInput = document.getElementById('api-key');
    const defaultMessageInput = document.getElementById('default-message');
    const tokenPrefixInput = document.getElementById('default-prefix');
    
    if (apiEndpointInput) apiEndpointInput.value = apiEndpoint;
    if (apiKeyInput) apiKeyInput.value = apiKey;
    if (defaultMessageInput) defaultMessageInput.value = defaultMessage;
    if (tokenPrefixInput) tokenPrefixInput.value = tokenPrefix;
  }
  
  function saveSettingsValues() {
    const apiEndpointInput = document.getElementById('api-endpoint');
    const apiKeyInput = document.getElementById('api-key');
    const defaultMessageInput = document.getElementById('default-message');
    const tokenPrefixInput = document.getElementById('default-prefix');
    
    if (apiEndpointInput) localStorage.setItem('apiEndpoint', apiEndpointInput.value);
    if (apiKeyInput) localStorage.setItem('apiKey', apiKeyInput.value);
    if (defaultMessageInput) localStorage.setItem('defaultMessage', defaultMessageInput.value);
    if (tokenPrefixInput) localStorage.setItem('tokenPrefix', tokenPrefixInput.value);
    
    // Notification désactivée
    // showAlert('Paramètres enregistrés avec succès', 'success');
  }
}

// Gestionnaire de thème
function initThemeManager() {
  setupThemeSystem();
  setupColorSystem();
}

// Système de thème
function setupThemeSystem() {
  // Ajouter un bouton toggle dans le DOM s'il n'existe pas déjà
  if (!document.querySelector('.dark-mode-toggle')) {
    const darkModeToggle = document.createElement('div');
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    document.body.appendChild(darkModeToggle);
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }
  
  // Récupérer les boutons de thème dans les paramètres
  const themeLightBtn = document.getElementById('theme-light');
  const themeDarkBtn = document.getElementById('theme-dark');
  const themeSystemBtn = document.getElementById('theme-system');
  
  // Configurer les écouteurs d'événements pour les boutons
  if (themeLightBtn) {
    themeLightBtn.addEventListener('click', function() {
      setTheme('light');
    });
  }
  
  if (themeDarkBtn) {
    themeDarkBtn.addEventListener('click', function() {
      setTheme('dark');
    });
  }
  
  if (themeSystemBtn) {
    themeSystemBtn.addEventListener('click', function() {
      setTheme('system');
    });
  }
  
  // Appliquer le thème initial
  applyStoredTheme();
  
  // Écouter les changements de préférences système
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  if (darkModeMediaQuery) {
    darkModeMediaQuery.addEventListener('change', function(e) {
      if (getTheme() === 'system') {
        document.body.classList.toggle('dark-mode', e.matches);
      }
    });
  }
  
  // Fonctions du système de thème
  function getTheme() {
    return localStorage.getItem('theme') || 'system';
  }
  
  function setTheme(theme) {
    localStorage.setItem('theme', theme);
    applyStoredTheme();
    updateThemeButtons();
    // Notification désactivée
    // showAlert(`Thème ${theme === 'light' ? 'clair' : theme === 'dark' ? 'sombre' : 'système'} appliqué`);
  }
  
  function applyStoredTheme() {
    const theme = getTheme();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'dark' || (theme === 'system' && prefersDark)) {
      document.body.classList.add('dark-mode');
      updateDarkModeToggle(true);
    } else {
      document.body.classList.remove('dark-mode');
      updateDarkModeToggle(false);
    }
  }
  
  function updateDarkModeToggle(isDark) {
    const toggle = document.querySelector('.dark-mode-toggle');
    if (toggle) {
      toggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
  }
  
  function toggleDarkMode() {
    const currentTheme = getTheme();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (currentTheme === 'system') {
      setTheme(prefersDark ? 'light' : 'dark');
    } else if (currentTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }
  
  function updateThemeButtons() {
    const currentTheme = getTheme();
    const themeLightBtn = document.getElementById('theme-light');
    const themeDarkBtn = document.getElementById('theme-dark');
    const themeSystemBtn = document.getElementById('theme-system');
    
    [themeLightBtn, themeDarkBtn, themeSystemBtn].forEach(btn => {
      if (btn) {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      }
    });
    
    if (currentTheme === 'light' && themeLightBtn) {
      themeLightBtn.classList.remove('btn-secondary');
      themeLightBtn.classList.add('btn-primary');
    } else if (currentTheme === 'dark' && themeDarkBtn) {
      themeDarkBtn.classList.remove('btn-secondary');
      themeDarkBtn.classList.add('btn-primary');
    } else if (currentTheme === 'system' && themeSystemBtn) {
      themeSystemBtn.classList.remove('btn-secondary');
      themeSystemBtn.classList.add('btn-primary');
    }
  }
}

// Système de couleurs
function setupColorSystem() {
  // Configurer les boutons de couleur
  setupColorButtons();
  
  // Appliquer la couleur stockée
  applyStoredColor();
  
  // Fonctions du système de couleurs
  function setupColorButtons() {
    // Définir les couleurs disponibles
    const colors = [
      { id: 'color-navy', color: '#2c3e50' },
      { id: 'color-blue', color: '#3498db' },
      { id: 'color-green', color: '#16a085' },
      { id: 'color-purple', color: '#8e44ad' },
      { id: 'color-red', color: '#c0392b' }
    ];
    
    // Sélectionner le conteneur des couleurs
    const colorPickerContainer = document.getElementById('color-picker');
    
    if (colorPickerContainer) {
      // Vider le conteneur
      colorPickerContainer.innerHTML = '';
      
      // Ajouter les boutons de couleur
      colors.forEach(color => {
        const colorBtn = document.createElement('div');
        colorBtn.id = color.id;
        colorBtn.className = 'color-option';
        colorBtn.style.backgroundColor = color.color;
        colorBtn.addEventListener('click', function() {
          setColor(color.id, color.color);
        });
        colorPickerContainer.appendChild(colorBtn);
      });
    }
    
    // Mettre à jour l'apparence des boutons
    updateColorButtons();
  }
  
  function getColor() {
    return localStorage.getItem('preferredColor') || 'color-navy';
  }
  
  function setColor(colorId, colorValue) {
    localStorage.setItem('preferredColor', colorId);
    
    // Appliquer la couleur
    document.documentElement.style.setProperty('--primary', colorValue);
    document.documentElement.style.setProperty('--dark', colorValue);
    
    // Définir une couleur secondaire appropriée
    if (colorValue === '#2c3e50') document.documentElement.style.setProperty('--secondary', '#3498db');
    if (colorValue === '#3498db') document.documentElement.style.setProperty('--secondary', '#2980b9');
    if (colorValue === '#16a085') document.documentElement.style.setProperty('--secondary', '#1abc9c');
    if (colorValue === '#8e44ad') document.documentElement.style.setProperty('--secondary', '#9b59b6');
    if (colorValue === '#c0392b') document.documentElement.style.setProperty('--secondary', '#e74c3c');
    
    // Mettre à jour l'apparence des éléments qui utilisent directement les couleurs
    document.querySelectorAll('.sidebar').forEach(sidebar => {
      sidebar.style.backgroundColor = colorValue;
    });
    
    // Mettre à jour l'apparence des boutons
    updateColorButtons();
    
    // Notification désactivée
    const colorNames = {
      'color-navy': 'Bleu Marine',
      'color-blue': 'Bleu',
      'color-green': 'Vert',
      'color-purple': 'Violet',
      'color-red': 'Rouge'
    };
    
    // showAlert(`Couleur ${colorNames[colorId] || colorId} appliquée`);
  }
  
  function applyStoredColor() {
    const colorId = getColor();
    const colors = {
      'color-navy': '#2c3e50',
      'color-blue': '#3498db',
      'color-green': '#16a085',
      'color-purple': '#8e44ad',
      'color-red': '#c0392b'
    };
    
    if (colors[colorId]) {
      setColor(colorId, colors[colorId]);
    }
  }
  
  function updateColorButtons() {
    const currentColorId = getColor();
    document.querySelectorAll('.color-option').forEach(btn => {
      btn.classList.remove('active');
      
      if (btn.id === currentColorId) {
        btn.classList.add('active');
      }
    });
  }
}

// Fonctions utilitaires

// Mettre à jour les statistiques
function updateStats(success) {
  // Cette fonction peut être étendue pour mettre à jour des compteurs en temps réel
}

// Valider un numéro de téléphone
function validatePhone(phone) {
  // Format international simple : +33612345678
  return /^\+\d{10,15}$/.test(phone);
}

// Fonction d'alerte désactivée - ne fait rien
function showAlert(message, type = 'info') {
  // Fonction désactivée à la demande de l'utilisateur
  // Ne fait rien, pas de notifications
  return;
}

// Configuration globale
const SMS_API_URL = localStorage.getItem('apiEndpoint') || 'http://localhost:3000/api';