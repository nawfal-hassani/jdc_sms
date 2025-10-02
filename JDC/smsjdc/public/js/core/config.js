/**
 * Configuration de l'application
 */

// Configuration de l'API
export const API_CONFIG = {
  BASE_URL: localStorage.getItem('apiEndpoint') || 'http://localhost:3000/api',
  KEY: localStorage.getItem('apiKey') || '',
  TIMEOUT: 10000 // 10 secondes
};

// Configuration des tokens
export const TOKEN_CONFIG = {
  PREFIX: localStorage.getItem('tokenPrefix') || "Votre code d'authentification JDC est: ",
  LENGTH: 6
};

// Configuration du thème
export function getThemePreference() {
  return localStorage.getItem('theme') || 'system';
}

export function getColorPreference() {
  return localStorage.getItem('preferredColor') || 'color-navy';
}

// Couleurs disponibles
export const AVAILABLE_COLORS = {
  'color-navy': '#2c3e50',
  'color-blue': '#3498db',
  'color-green': '#16a085',
  'color-purple': '#8e44ad',
  'color-red': '#c0392b'
};