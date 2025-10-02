/**
 * Module principal de l'application
 */
import { initThemeSystem, initColorSystem } from './core/theme-manager.js';
import { checkApiStatus } from './core/api-service.js';
import { showAlert } from './utils/helpers.js';

// Attendre que le document soit prêt
document.addEventListener('DOMContentLoaded', function() {
  // Initialiser la navigation
  setupTabNavigation();
  
  // Initialiser le dashboard principal
  initDashboard();
  
  // Initialiser les autres modules
  initSmsModule();
  initTokenModule();
  initHistoryModule();
  initSettingsModule();
  
  // Initialiser le gestionnaire de thème
  initThemeSystem();
  initColorSystem();
  
  console.log('Application initialisée');
});

// Fonctions importées de app.js sans modification
// Elles continueront à fonctionner comme avant

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
}