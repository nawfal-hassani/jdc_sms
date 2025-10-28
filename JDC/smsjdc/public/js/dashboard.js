// FRONTEND
// Variables globales
// L'historique est maintenant géré côté serveur
let statisticsData = {
  totalSent: 0,
  successful: 0,
  failed: 0,
  pending: 0
};

// Initialisation du dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Vérifier le statut de l'API
  checkApiStatus();
  
  // Initialiser les graphiques
  initCharts();
  
  // Ajouter les événements
  setupEventListeners();
  
  // Simuler des données pour la démo
  simulateData();
  
  // Calculer et afficher les variations hebdomadaires
  updateWeeklyChanges();
});

// Vérifier le statut de l'API
function checkApiStatus() {
  fetch('/api/status')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const statusIndicator = document.getElementById('api-status');
      const statusText = document.getElementById('status-text');
      
      if (data.status === 'online' || data.status === 'operational') {
        statusIndicator.classList.add('success');
        statusIndicator.classList.remove('danger');
        statusText.textContent = 'En ligne';
      } else {
        statusIndicator.classList.add('danger');
        statusIndicator.classList.remove('success');
        statusText.textContent = 'Hors ligne';
      }
      
      // Mettre à jour les autres informations
      if (data.version) {
        document.getElementById('api-version').textContent = data.version;
      }
      
      document.getElementById('last-check').textContent = new Date().toLocaleString();
    })
    .catch(error => {
      console.error('Erreur de vérification du statut:', error);
      const statusIndicator = document.getElementById('api-status');
      const statusText = document.getElementById('status-text');
      statusIndicator.classList.add('danger');
      statusIndicator.classList.remove('success');
      statusText.textContent = 'Non connecté';
      
      // Afficher une alerte
      showAlert('Impossible de se connecter à l\'API SMS. Vérifiez que le serveur est en cours d\'exécution.', 'danger');
    });
}

// Initialiser les graphiques avec Chart.js
// Variables globales pour les graphiques
let dailyChart = null;
let typesChart = null;
let successChart = null;

function initCharts() {
  // Initialiser les graphiques vides
  initDailyChart();
  initTypesChart();
  initSuccessChart();
  
  // Charger les vraies données
  updateChartsWithRealData();
}

// Graphique des SMS envoyés par jour
function initDailyChart() {
  const ctxDaily = document.getElementById('chart-daily');
  if (ctxDaily) {
    dailyChart = new Chart(ctxDaily, {
      type: 'line',
      data: {
        labels: getLast7Days(),
        datasets: [{
          label: 'SMS envoyés',
          data: [0, 0, 0, 0, 0, 0, 0],
          fill: true,
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderColor: '#3498db',
          tension: 0.4,
          pointBackgroundColor: '#3498db'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }
}

// Graphique des types de SMS
function initTypesChart() {
  const ctxTypes = document.getElementById('chart-types');
  if (ctxTypes) {
    typesChart = new Chart(ctxTypes, {
      type: 'doughnut',
      data: {
        labels: ['SMS Simple', 'Tokens', 'Notifications'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: [
            '#3498db',
            '#2ecc71',
            '#f39c12'
          ],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          }
        },
        cutout: '70%'
      }
    });
  }
}

// Graphique des taux de succès
function initSuccessChart() {
  const ctxSuccess = document.getElementById('chart-success');
  if (ctxSuccess) {
    successChart = new Chart(ctxSuccess, {
      type: 'bar',
      data: {
        labels: getLast7Days(),
        datasets: [{
          label: 'Succès',
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: '#2ecc71'
        }, {
          label: 'Échecs',
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: '#e74c3c'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            stacked: false,
            ticks: {
              precision: 0
            }
          },
          x: {
            stacked: false
          }
        }
      }
    });
  }
}

// Mettre à jour les graphiques avec les vraies données
async function updateChartsWithRealData() {
  try {
    const response = await fetch('/api/sms/history');
    if (!response.ok) {
      console.error('Erreur lors de la récupération de l\'historique');
      return;
    }
    
    const history = await response.json();
    console.log('📊 Mise à jour des graphiques avec', history.length, 'entrées');
    
    // Préparer les données pour les 7 derniers jours
    const days = getLast7DaysData();
    const dailyData = new Array(7).fill(0);
    const successData = new Array(7).fill(0);
    const failedData = new Array(7).fill(0);
    
    // Compter les types de SMS
    let smsSimple = 0;
    let tokens = 0;
    let notifications = 0;
    
    // Parcourir l'historique
    history.forEach(entry => {
      const entryDate = new Date(entry.timestamp || entry.date || entry.createdAt);
      const dayIndex = getDayIndex(entryDate, days);
      
      if (dayIndex >= 0) {
        // Compter par jour
        dailyData[dayIndex]++;
        
        // Compter succès/échecs
        if (entry.status === 'success' || entry.status === 'delivered') {
          successData[dayIndex]++;
        } else if (entry.status === 'failed' || entry.status === 'error') {
          failedData[dayIndex]++;
        }
      }
      
      // Compter les types (sur toute la période)
      if (entry.type === 'token') {
        tokens++;
      } else if (entry.message && (entry.message.includes('notification') || entry.message.includes('alerte'))) {
        notifications++;
      } else {
        smsSimple++;
      }
    });
    
    // Mettre à jour le graphique journalier
    if (dailyChart) {
      dailyChart.data.datasets[0].data = dailyData;
      dailyChart.update();
    }
    
    // Mettre à jour le graphique des types
    if (typesChart) {
      typesChart.data.datasets[0].data = [smsSimple, tokens, notifications];
      typesChart.update();
    }
    
    // Mettre à jour le graphique de succès
    if (successChart) {
      successChart.data.datasets[0].data = successData;
      successChart.data.datasets[1].data = failedData;
      successChart.update();
    }
    
    console.log('✅ Graphiques mis à jour avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des graphiques:', error);
  }
}

// Obtenir les 7 derniers jours avec leurs dates
function getLast7DaysData() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    days.push(date);
  }
  return days;
}

// Trouver l'index du jour pour une date donnée
function getDayIndex(date, days) {
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < days.length; i++) {
    if (dateOnly.getTime() === days[i].getTime()) {
      return i;
    }
  }
  return -1;
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
  // Formulaire d'envoi de SMS
  const smsForm = document.getElementById('sms-form');
  if (smsForm) {
    smsForm.addEventListener('submit', handleSendSms);
    
    // Compteur de caractères
    const messageInput = document.getElementById('message');
    const charCounter = document.getElementById('char-counter');
    
    if (messageInput && charCounter) {
      messageInput.addEventListener('input', function() {
        const count = this.value.length;
        const smsCount = Math.ceil(count / 160);
        charCounter.textContent = `${count} caractères (${smsCount} SMS)`;
      });
    }
  }
  
  // Formulaire d'envoi de token
  const tokenForm = document.getElementById('token-form');
  if (tokenForm) {
    tokenForm.addEventListener('submit', handleSendToken);
  }
  
  // Bouton d'actualisation du statut
  const refreshButton = document.getElementById('refresh-status');
  if (refreshButton) {
    refreshButton.addEventListener('click', checkApiStatus);
  }
  
  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      // Si c'est un lien vers un onglet
      if (this.getAttribute('data-tab')) {
        e.preventDefault();
        const tabId = this.getAttribute('data-tab');
        showTab(tabId);
        
        // Marquer le lien comme actif
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });
  
  // Initialiser sur le premier onglet
  const firstTabLink = document.querySelector('.nav-link[data-tab]');
  if (firstTabLink) {
    firstTabLink.click();
  }
}

// Gestion de l'envoi de SMS
function handleSendSms(e) {
  e.preventDefault();
  
  const phoneInput = document.getElementById('phone');
  const messageInput = document.getElementById('message');
  const submitBtn = document.querySelector('#sms-form button[type="submit"]');
  const resultDiv = document.getElementById('sms-result');
  
  // Valider les entrées
  if (!validatePhone(phoneInput.value)) {
    showAlert('Numéro de téléphone invalide. Utilisez le format international (ex: +33612345678)', 'danger', resultDiv);
    return;
  }
  
  if (!messageInput.value.trim()) {
    showAlert('Le message ne peut pas être vide.', 'danger', resultDiv);
    return;
  }
  
  // Désactiver le bouton et afficher le chargement
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loader"></span> Envoi...';
  resultDiv.innerHTML = '';
  
  // Envoyer la requête à l'API via le proxy local
  fetch('/api/send-sms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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
      showAlert(`SMS envoyé avec succès à ${phoneInput.value}`, 'success', resultDiv);
      
      // Réinitialiser le formulaire
      messageInput.value = '';
      
      // Mettre à jour les statistiques
      updateStats(true);
      
      // Déclencher un événement pour informer les autres modules
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
      showAlert(`Erreur: ${data.error || 'Une erreur est survenue'}`, 'danger', resultDiv);
      updateStats(false);
    }
  })
  .catch(error => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Envoyer le SMS';
    showAlert(`Erreur: ${error.message}`, 'danger', resultDiv);
    updateStats(false);
  });
}

// Gestion de l'envoi de token
function handleSendToken(e) {
  e.preventDefault();
  
  const phoneInput = document.getElementById('token-phone');
  const tokenInput = document.getElementById('token');
  const submitBtn = document.querySelector('#token-form button[type="submit"]');
  const resultDiv = document.getElementById('token-result');
  
  // Valider les entrées
  if (!validatePhone(phoneInput.value)) {
    showAlert('Numéro de téléphone invalide. Utilisez le format international (ex: +33612345678)', 'danger', resultDiv);
    return;
  }
  
  if (!tokenInput.value.trim()) {
    showAlert('Le token ne peut pas être vide.', 'danger', resultDiv);
    return;
  }
  
  // Désactiver le bouton et afficher le chargement
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loader"></span> Envoi...';
  resultDiv.innerHTML = '';
  
  // Envoyer la requête à l'API via le proxy local
  fetch('/api/send-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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
      showAlert(`Token envoyé avec succès à ${phoneInput.value}`, 'success', resultDiv);
      
      // Réinitialiser le formulaire
      tokenInput.value = '';
      
      // Mettre à jour les statistiques
      updateStats(true);
      
      // Déclencher un événement pour mettre à jour l'historique
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
      
      // Déclencher un événement pour informer les autres modules
      document.dispatchEvent(new CustomEvent('sms-sent', {
        detail: { success: true }
      }));
    } else {
      showAlert(`Erreur: ${data.error || 'Une erreur est survenue'}`, 'danger', resultDiv);
      updateStats(false);
    }
  })
  .catch(error => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Envoyer le Token';
    showAlert(`Erreur: ${error.message}`, 'danger', resultDiv);
    updateStats(false);
  });
}

// Validation du numéro de téléphone
function validatePhone(phone) {
  // Format international simple (commençant par +)
  return /^\+[1-9]\d{1,14}$/.test(phone.trim());
}

// Afficher une alerte (désactivée)
function showAlert(message, type, container = null) {
  // Fonction désactivée à la demande de l'utilisateur
  // Ne fait rien, pas de notifications
  return;
  
  // Code original désactivé
  /*
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.innerHTML = `
    ${message}
    <button class="alert-dismiss">&times;</button>
  `;
  
  // Ajouter au conteneur spécifié ou au corps du document
  if (container) {
    container.innerHTML = '';
    container.appendChild(alertDiv);
  } else {
    const alertsContainer = document.getElementById('alerts-container') || document.body;
    alertsContainer.appendChild(alertDiv);
  }
  
  // Ajouter l'événement pour fermer l'alerte
  const dismissButton = alertDiv.querySelector('.alert-dismiss');
  if (dismissButton) {
    dismissButton.addEventListener('click', function() {
      alertDiv.remove();
    });
  }
  
  // Disparaître après 5 secondes si ce n'est pas une erreur
  if (type !== 'danger') {
    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }
  */
}

// Afficher un onglet spécifique
function showTab(tabId) {
  // Cacher tous les onglets
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
  });
  
  // Afficher l'onglet demandé
  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.style.display = 'block';
    
    // Déclencher un événement pour informer les autres modules
    document.dispatchEvent(new CustomEvent('tab-changed', {
      detail: { tabId: tabId }
    }));
    
    // Si c'est l'onglet des paramètres, s'assurer que les boutons sont correctement initialisés
    if (tabId === 'settings-tab') {
      // Mettre à jour les boutons de thème
      const currentTheme = localStorage.getItem('theme') || 'system';
      document.querySelectorAll('#theme-light, #theme-dark, #theme-system').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      });
      const activeThemeBtn = document.getElementById(`theme-${currentTheme}`);
      if (activeThemeBtn) {
        activeThemeBtn.classList.remove('btn-secondary');
        activeThemeBtn.classList.add('btn-primary');
      }
      
      // Mettre à jour les options de couleur
      const currentColor = localStorage.getItem('preferredColor') || 'color-navy';
      document.querySelectorAll('.color-option').forEach(option => {
        option.style.border = '2px solid transparent';
      });
      const activeColorOption = document.getElementById(currentColor);
      if (activeColorOption) {
        activeColorOption.style.border = '2px solid white';
      }
    }
  }
}

// Mettre à jour les statistiques
function updateStats(success) {
  statisticsData.totalSent++;
  if (success) {
    statisticsData.successful++;
  } else {
    statisticsData.failed++;
  }
  
  // Mettre à jour les éléments DOM
  document.getElementById('stat-total').textContent = statisticsData.totalSent;
  document.getElementById('stat-success').textContent = statisticsData.successful;
  document.getElementById('stat-failed').textContent = statisticsData.failed;
  
  // Calculer le pourcentage de réussite
  const successRate = statisticsData.totalSent > 0 
    ? Math.round((statisticsData.successful / statisticsData.totalSent) * 100) 
    : 0;
  document.getElementById('stat-rate').textContent = `${successRate}%`;
  
  // Mettre à jour les variations hebdomadaires et les graphiques après un délai court
  // pour laisser le temps à l'historique de se mettre à jour
  setTimeout(() => {
    updateWeeklyChanges();
    updateChartsWithRealData();
  }, 1000);
}

// Les fonctions d'historique ont été déplacées vers history.js

// Fonction pour la compatibilité avec l'ancien code
function addToHistory(entry) {
  // Déclencher un événement pour informer les modules d'historique
  document.dispatchEvent(new CustomEvent(entry.type === 'token' ? 'token-sent' : 'sms-sent', {
    detail: { 
      success: entry.status === 'success',
      data: entry
    }
  }));
}

// Obtenir les 7 derniers jours pour les graphiques
function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
  }
  return days;
}

// Simuler des données pour la démonstration
function simulateData() {
  // Simuler des statistiques initiales
  statisticsData = {
    totalSent: 152,
    successful: 146,
    failed: 6,
    pending: 0
  };
  
  // Mettre à jour les statistiques dans l'UI
  document.getElementById('stat-total').textContent = statisticsData.totalSent;
  document.getElementById('stat-success').textContent = statisticsData.successful;
  document.getElementById('stat-failed').textContent = statisticsData.failed;
  document.getElementById('stat-rate').textContent = '96%';
  
  // Simuler l'historique
  const phoneNumbers = ['+33612345678', '+33687654321', '+33723456789', '+33745678912'];
  const messages = [
    'Votre rendez-vous est confirmé pour demain à 14h.',
    'Votre commande a été expédiée. Suivez-la avec le code: ABC123',
    'Rappel: Paiement de facture attendu avant le 30/09.',
    'Votre code de vérification est: 953421',
    'JDC vous informe que votre document est prêt.'
  ];
  
  // Générer un historique fictif
  for (let i = 0; i < 20; i++) {
    const isSuccess = Math.random() > 0.1; // 90% de réussite
    const isToken = Math.random() > 0.7;   // 30% de tokens
    
    const date = new Date();
    date.setMinutes(date.getMinutes() - i * 30); // Espacer les messages
    
    if (isToken) {
      // Simuler un envoi de token
      addToHistory({
        type: 'token',
        to: phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)],
        token: Math.floor(100000 + Math.random() * 900000).toString(),
        status: isSuccess ? 'success' : 'failed',
        date: date
      });
    } else {
      // Simuler un envoi de SMS
      addToHistory({
        type: 'sms',
        to: phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        status: isSuccess ? 'success' : 'failed',
        date: date
      });
    }
  }
  
  // Calculer et afficher les variations hebdomadaires
  updateWeeklyChanges();
}

// Fonction pour calculer les statistiques de la semaine dernière et cette semaine
async function calculateWeeklyStats() {
  try {
    // Récupérer l'historique depuis le serveur
    const response = await fetch('/api/sms/history');
    if (!response.ok) {
      throw new Error('Impossible de récupérer l\'historique');
    }
    
    const history = await response.json();
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    console.log('📊 Calcul des statistiques hebdomadaires');
    console.log('📅 Aujourd\'hui:', now.toLocaleDateString());
    console.log('📅 Il y a 1 semaine:', oneWeekAgo.toLocaleDateString());
    console.log('📅 Il y a 2 semaines:', twoWeeksAgo.toLocaleDateString());
    console.log('📝 Nombre d\'entrées dans l\'historique:', history.length);
    
    // Stats de cette semaine (7 derniers jours)
    const thisWeek = {
      total: 0,
      successful: 0,
      failed: 0
    };
    
    // Stats de la semaine dernière (7 jours précédents)
    const lastWeek = {
      total: 0,
      successful: 0,
      failed: 0
    };
    
    // Parcourir l'historique et compter
    history.forEach(entry => {
      const entryDate = new Date(entry.timestamp || entry.date);
      
      if (entryDate >= oneWeekAgo) {
        // Cette semaine
        thisWeek.total++;
        if (entry.status === 'success' || entry.status === 'delivered') {
          thisWeek.successful++;
        } else if (entry.status === 'failed' || entry.status === 'error') {
          thisWeek.failed++;
        }
      } else if (entryDate >= twoWeeksAgo && entryDate < oneWeekAgo) {
        // Semaine dernière
        lastWeek.total++;
        if (entry.status === 'success' || entry.status === 'delivered') {
          lastWeek.successful++;
        } else if (entry.status === 'failed' || entry.status === 'error') {
          lastWeek.failed++;
        }
      }
    });
    
    // Calculer les taux de réussite
    const thisWeekRate = thisWeek.total > 0 ? (thisWeek.successful / thisWeek.total) * 100 : 0;
    const lastWeekRate = lastWeek.total > 0 ? (lastWeek.successful / lastWeek.total) * 100 : 0;
    
    console.log('📈 Cette semaine:', thisWeek);
    console.log('📉 Semaine dernière:', lastWeek);
    console.log('💯 Taux cette semaine:', thisWeekRate.toFixed(1) + '%');
    console.log('💯 Taux semaine dernière:', lastWeekRate.toFixed(1) + '%');
    
    return {
      thisWeek,
      lastWeek,
      changes: {
        total: calculatePercentageChange(lastWeek.total, thisWeek.total),
        successful: calculatePercentageChange(lastWeek.successful, thisWeek.successful),
        failed: calculatePercentageChange(lastWeek.failed, thisWeek.failed),
        rate: thisWeekRate - lastWeekRate
      }
    };
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques hebdomadaires:', error);
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      thisWeek: { total: 0, successful: 0, failed: 0 },
      lastWeek: { total: 0, successful: 0, failed: 0 },
      changes: { total: 0, successful: 0, failed: 0, rate: 0 }
    };
  }
}

// Calculer le pourcentage de changement entre deux valeurs
function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) {
    return newValue > 0 ? 100 : 0;
  }
  return ((newValue - oldValue) / oldValue) * 100;
}

// Mettre à jour l'affichage des variations hebdomadaires
async function updateWeeklyChanges() {
  const stats = await calculateWeeklyStats();
  
  // Mettre à jour Total SMS Envoyés
  updateStatChange('stat-total-change', stats.changes.total, stats.lastWeek.total);
  
  // Mettre à jour SMS Délivrés
  updateStatChange('stat-success-change', stats.changes.successful, stats.lastWeek.successful);
  
  // Mettre à jour SMS Échoués
  updateStatChange('stat-failed-change', stats.changes.failed, stats.lastWeek.failed);
  
  // Mettre à jour Taux de réussite
  updateStatChange('stat-rate-change', stats.changes.rate, stats.lastWeek.total);
}

// Mettre à jour un élément de statistique avec le bon style
function updateStatChange(elementId, changeValue, previousValue = 0) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Si pas de données précédentes, afficher "Nouveau"
  if (previousValue === 0 && changeValue === 100) {
    element.className = 'stat-change positive';
    element.innerHTML = '<i class="fas fa-star"></i> Nouveau cette semaine';
    return;
  }
  
  const absValue = Math.abs(changeValue);
  const roundedValue = Math.round(absValue * 10) / 10; // Arrondir à 1 décimale
  
  // Déterminer la classe CSS et l'icône
  let className = '';
  let icon = '';
  let prefix = '';
  
  if (changeValue > 0) {
    className = 'positive';
    icon = '<i class="fas fa-arrow-up"></i>';
    prefix = '+';
  } else if (changeValue < 0) {
    className = 'negative';
    icon = '<i class="fas fa-arrow-down"></i>';
    prefix = '';
  } else {
    className = 'neutral';
    icon = '<i class="fas fa-minus"></i>';
    prefix = '';
  }
  
  // Pour les SMS échoués, inverser la logique des couleurs (moins c'est mieux)
  if (elementId === 'stat-failed-change') {
    if (changeValue > 0) {
      className = 'negative'; // Plus d'échecs = mauvais
    } else if (changeValue < 0) {
      className = 'positive'; // Moins d'échecs = bon
    }
  }
  
  // Mettre à jour l'élément
  element.className = `stat-change ${className}`;
  element.innerHTML = `${icon} ${prefix}${roundedValue}% cette semaine`;
}

// Rafraîchir les statistiques toutes les 5 minutes
setInterval(updateWeeklyChanges, 5 * 60 * 1000);
