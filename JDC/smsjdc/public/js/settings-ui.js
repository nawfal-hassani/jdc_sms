// FRONTEND
/**
 * settings-ui.js - Gestion complète des paramètres et du thème du Dashboard JDC
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log("Settings UI chargé");
  
  // ==== INITIALISATION DE LA NAVIGATION ====
  setupTabNavigation();
  
  // ==== CONFIGURATION DU THÈME ====
  setupThemeSystem();
  
  // ==== CONFIGURATION DES COULEURS ====
  setupColorSystem();
  
  // ==== CONFIGURATION DU FORMULAIRE DE PARAMÈTRES ====
  setupSettingsForm();
  
  // Note: La configuration du bouton de déconnexion est gérée après la création
  // dynamique du bouton à la fin du fichier
  
  // ==== FONCTIONS ====
  
  // Configuration du bouton de déconnexion
  function setupLogoutButton() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', function() {
        // Vérifie si le service d'authentification est disponible
        if (window.authService && typeof window.authService.logout === 'function') {
          // Afficher une confirmation
          if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            window.authService.logout()
              .then(result => {
                console.log('Déconnexion réussie:', result);
                // Rediriger vers la page de connexion
                window.location.href = '/login';
              })
              .catch(error => {
                console.error('Erreur lors de la déconnexion:', error);
                alert('Une erreur est survenue lors de la déconnexion.');
              });
          }
        } else {
          console.error('Le service d\'authentification n\'est pas disponible.');
          // Redirection basique en cas d'absence du service d'authentification
          window.location.href = '/login';
        }
      });
    }
  }
  
  // Navigation entre les onglets
  function setupTabNavigation() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', function(e) {
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
    
    // Vérifier l'onglet actif au chargement (pour les rechargements de page)
    const activeTabLink = document.querySelector('.nav-link.active');
    if (activeTabLink && activeTabLink.getAttribute('data-tab')) {
      showTab(activeTabLink.getAttribute('data-tab'));
    }
  }
  
  // Afficher un onglet spécifique
  function showTab(tabId) {
    // Masquer tous les onglets
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.style.display = 'none';
    });
    
    // Afficher l'onglet demandé
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
      activeTab.style.display = 'block';
    }
    
    // Si c'est l'onglet des paramètres, mettre à jour l'UI
    if (tabId === 'settings-tab') {
      updateThemeButtons();
      setupColorButtons(); // Reconfigurer les boutons de couleur
    }
  }
  
  // ==== SYSTÈME DE THÈME ====
  
  function setupThemeSystem() {
    // Ajouter un bouton toggle dans le DOM s'il n'existe pas déjà
    if (!document.querySelector('.dark-mode-toggle')) {
      const darkModeToggle = document.createElement('div');
      darkModeToggle.className = 'dark-mode-toggle';
      darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      document.body.appendChild(darkModeToggle);
      
      // Ajouter l'écouteur d'événement
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
  }
  
  // Obtenir le thème actuel
  function getTheme() {
    return localStorage.getItem('theme') || 'system';
  }
  
  // Définir un nouveau thème
  function setTheme(theme) {
    localStorage.setItem('theme', theme);
    applyStoredTheme();
    updateThemeButtons();
    // Notification désactivée
    // showNotification(`Thème ${theme === 'light' ? 'clair' : theme === 'dark' ? 'sombre' : 'système'} appliqué`);
  }
  
  // Appliquer le thème stocké
  function applyStoredTheme() {
    const theme = getTheme();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Appliquer le mode sombre ou clair
    if (theme === 'dark' || (theme === 'system' && prefersDark)) {
      document.body.classList.add('dark-mode');
      updateDarkModeToggle(true);
    } else {
      document.body.classList.remove('dark-mode');
      updateDarkModeToggle(false);
    }
  }
  
  // Mettre à jour l'apparence du bouton toggle
  function updateDarkModeToggle(isDark) {
    const toggle = document.querySelector('.dark-mode-toggle');
    if (toggle) {
      toggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
  }
  
  // Basculer le mode sombre
  function toggleDarkMode() {
    const currentTheme = getTheme();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (currentTheme === 'system') {
      // Si on est en mode système, passer à un mode explicite
      setTheme(prefersDark ? 'light' : 'dark');
    } else if (currentTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }
  
  // Mettre à jour l'apparence des boutons de thème
  function updateThemeButtons() {
    const currentTheme = getTheme();
    const themeLightBtn = document.getElementById('theme-light');
    const themeDarkBtn = document.getElementById('theme-dark');
    const themeSystemBtn = document.getElementById('theme-system');
    
    // Réinitialiser tous les boutons
    [themeLightBtn, themeDarkBtn, themeSystemBtn].forEach(btn => {
      if (btn) {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      }
    });
    
    // Mettre en évidence le bouton actif
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
  
  // ==== SYSTÈME DE COULEURS ====
  
  function setupColorSystem() {
    // Ajouter les styles CSS pour les options de couleur s'ils n'existent pas
    addColorStyles();
    
    // Configurer les boutons de couleur
    setupColorButtons();
    
    // Appliquer la couleur stockée
    applyStoredColor();
  }
  
  // Ajouter les styles CSS pour les boutons de couleur
  function addColorStyles() {
    if (!document.getElementById('color-picker-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'color-picker-styles';
      styleEl.textContent = `
        .color-option {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .color-option:hover {
          transform: scale(1.1);
        }
        
        .color-option.active {
          border: 2px solid #fff;
          box-shadow: 0 0 0 2px var(--primary);
        }
      `;
      document.head.appendChild(styleEl);
    }
  }
  
  // Configurer les boutons de couleur
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
    const colorPickerContainer = document.querySelector('#settings-tab .form-group:last-child > div:last-child');
    
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
    
    // Ajouter un identifiant au conteneur pour faciliter la sélection
    if (colorPickerContainer && !colorPickerContainer.id) {
      colorPickerContainer.id = 'color-picker';
    }
    
    // Mettre à jour l'apparence des boutons
    updateColorButtons();
  }
  
  // Obtenir la couleur actuelle
  function getColor() {
    return localStorage.getItem('preferredColor') || 'color-navy';
  }
  
  // Définir une nouvelle couleur
  function setColor(colorId, colorValue) {
    console.log(`Définir la couleur: ${colorId}`);
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
    
    // Afficher une notification
    const colorNames = {
      'color-navy': 'Bleu Marine',
      'color-blue': 'Bleu',
      'color-green': 'Vert',
      'color-purple': 'Violet',
      'color-red': 'Rouge'
    };
    
    // Notification désactivée
    // showNotification(`Couleur ${colorNames[colorId] || colorId} appliquée`);
  }
  
  // Appliquer la couleur stockée
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
  
  // Mettre à jour l'apparence des boutons de couleur
  function updateColorButtons() {
    const currentColorId = getColor();
    document.querySelectorAll('.color-option').forEach(btn => {
      btn.classList.remove('active');
      btn.style.border = '2px solid transparent';
      
      if (btn.id === currentColorId) {
        btn.classList.add('active');
        btn.style.border = '2px solid white';
      }
    });
  }
  
  // ==== FORMULAIRE DE PARAMÈTRES ====
  
  function setupSettingsForm() {
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      // Charger les valeurs enregistrées
      loadSettingsValues();
      
      // Configurer le formulaire
      settingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveSettingsValues();
      });
    }
  }
  
  // Charger les valeurs des paramètres
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
  
  // Sauvegarder les valeurs des paramètres
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
    // showNotification('Paramètres enregistrés avec succès', 'success');
  }
  
  // ==== UTILITAIRES ====
  
  // Afficher une notification
  function showNotification(message, type = 'info') {
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
  
  // Ajouter la section Session avec le bouton de déconnexion
  if (document.getElementById('settings-tab')) {
    const sessionSection = document.createElement('div');
    sessionSection.className = 'card';
    sessionSection.style.marginTop = '20px';
    sessionSection.innerHTML = `
      <div class="card-header">
        <h2 class="card-title">Session</h2>
      </div>
      <div class="card-content">
        <div class="form-group">
          <button id="logout-button-settings" class="btn btn-danger" style="width: 100%; margin-top: 10px;">
            <i class="fas fa-sign-out-alt"></i> Déconnexion
          </button>
        </div>
      </div>
    `;
    document.getElementById('settings-tab').appendChild(sessionSection);
    
    // Configuration du bouton de déconnexion dans les paramètres
    const logoutButtonSettings = document.getElementById('logout-button-settings');
    if (logoutButtonSettings) {
      logoutButtonSettings.addEventListener('click', function() {
        // Appeler la même fonction que le bouton principal
        const mainLogoutButton = document.getElementById('logout-button');
        if (mainLogoutButton) {
          mainLogoutButton.click();
        } else {
          // Fallback si le bouton principal n'existe pas
          if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            window.location.href = '/login.html';
          }
        }
      });
    }
  }
});