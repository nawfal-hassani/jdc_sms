/**
 * Gestionnaire de thème et d'apparence
 */
import { getThemePreference, getColorPreference, AVAILABLE_COLORS } from './config.js';
import { showAlert } from '../utils/helpers.js';

// Système de thème
export function initThemeSystem() {
  // Ajouter un bouton toggle dans le DOM s'il n'existe pas déjà
  if (!document.querySelector('.dark-mode-toggle')) {
    const darkModeToggle = document.createElement('div');
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    document.body.appendChild(darkModeToggle);
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }
  
  // Appliquer le thème initial
  applyStoredTheme();
  
  // Écouter les changements de préférences système
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  if (darkModeMediaQuery) {
    darkModeMediaQuery.addEventListener('change', function(e) {
      if (getThemePreference() === 'system') {
        document.body.classList.toggle('dark-mode', e.matches);
      }
    });
  }
}

// Appliquer le thème stocké
export function applyStoredTheme() {
  const theme = getThemePreference();
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
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
export function toggleDarkMode() {
  const currentTheme = getThemePreference();
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (currentTheme === 'system') {
    setTheme(prefersDark ? 'light' : 'dark');
  } else if (currentTheme === 'dark') {
    setTheme('light');
  } else {
    setTheme('dark');
  }
}

// Définir un thème
export function setTheme(theme) {
  localStorage.setItem('theme', theme);
  applyStoredTheme();
  updateThemeButtons();
  // Notification désactivée
  // showAlert(`Thème ${theme === 'light' ? 'clair' : theme === 'dark' ? 'sombre' : 'système'} appliqué`);
}

// Mettre à jour l'apparence des boutons de thème
export function updateThemeButtons() {
  const currentTheme = getThemePreference();
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

// Système de couleurs
export function initColorSystem() {
  // Appliquer la couleur stockée
  applyStoredColor();
}

// Appliquer la couleur stockée
export function applyStoredColor() {
  const colorId = getColorPreference();
  const colorValue = AVAILABLE_COLORS[colorId];
  
  if (colorValue) {
    applyColor(colorId, colorValue);
  }
}

// Appliquer une couleur
export function applyColor(colorId, colorValue) {
  // Définir les variables CSS
  document.documentElement.style.setProperty('--primary', colorValue);
  document.documentElement.style.setProperty('--dark', colorValue);
  
  // Définir une couleur secondaire appropriée
  const secondaryColors = {
    '#2c3e50': '#3498db',
    '#3498db': '#2980b9',
    '#16a085': '#1abc9c',
    '#8e44ad': '#9b59b6',
    '#c0392b': '#e74c3c'
  };
  
  if (secondaryColors[colorValue]) {
    document.documentElement.style.setProperty('--secondary', secondaryColors[colorValue]);
  }
  
  // Mettre à jour l'apparence des éléments qui utilisent directement les couleurs
  document.querySelectorAll('.sidebar').forEach(sidebar => {
    sidebar.style.backgroundColor = colorValue;
  });
}

// Définir une nouvelle couleur
export function setColor(colorId, colorValue) {
  localStorage.setItem('preferredColor', colorId);
  applyColor(colorId, colorValue);
  
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
  // showAlert(`Couleur ${colorNames[colorId] || colorId} appliquée`);
}

// Mettre à jour l'apparence des boutons de couleur
export function updateColorButtons() {
  const currentColorId = getColorPreference();
  document.querySelectorAll('.color-option').forEach(btn => {
    btn.classList.remove('active');
    
    if (btn.id === currentColorId) {
      btn.classList.add('active');
    }
  });
}