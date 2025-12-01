/**
 * Script de vérification de l'authentification pour l'index.html
 * Ce script redirige vers la page de connexion si l'utilisateur n'est pas authentifié
 */

import authService from './services/auth-service.js';

// Fonction pour vérifier l'authentification de l'utilisateur
async function checkAuthentication() {
  try {
    const isAuthenticated = authService.isAuthenticated();
    
    if (!isAuthenticated) {
      // Rediriger vers la page de connexion
      window.location.href = '/login';
      return;
    }
    
    // Récupérer l'utilisateur du localStorage en premier pour affichage immédiat
    const storedUser = authService.getUser();
    if (storedUser) {
      updateUserProfile(storedUser);
    }
    
    // Vérifier la validité du token avec le serveur
    const token = authService.getToken();
    if (token) {
      const response = await authService.verifyToken(token);
      
      if (!response.success) {
        // Token invalide ou expiré, rediriger vers la page de connexion
        authService.clearAuthData();
        window.location.href = '/login';
        return;
      }
      
      // Mettre à jour les informations utilisateur avec les données du serveur
      updateUserProfile(response.user);
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    // En cas d'erreur, rediriger vers la page de connexion
    authService.clearAuthData();
    window.location.href = '/login';
  }
}

// Mise à jour du profil utilisateur dans la page
function updateUserProfile(user) {
  if (!user) return;
  
  // Récupérer les éléments du DOM (avec IDs et classes pour compatibilité)
  const userNameElement = document.getElementById('user-name') || document.querySelector('.user-name');
  const userRoleElement = document.getElementById('user-role') || document.querySelector('.user-role');
  const userAvatarElement = document.getElementById('user-avatar') || document.querySelector('.user-avatar');
  
  if (userNameElement) {
    userNameElement.textContent = user.name || 'Utilisateur';
  }
  
  if (userRoleElement) {
    userRoleElement.textContent = user.role === 'admin' ? 'Administrateur' : 'Utilisateur';
  }
  
  if (userAvatarElement) {
    // Créer les initiales à partir du nom
    const initials = (user.name || 'Utilisateur')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
      
    userAvatarElement.textContent = initials;
  }
  
  // Afficher le lien Administration si admin
  const adminLinks = document.querySelectorAll('.admin-only');
  if (user.role === 'admin') {
    adminLinks.forEach(el => el.style.display = '');
  } else {
    adminLinks.forEach(el => el.style.display = 'none');
  }
}

// Ajouter un événement pour la déconnexion
document.addEventListener('DOMContentLoaded', function() {
  // Vérifier l'authentification au chargement de la page
  checkAuthentication();
  
  // Ajouter un élément de déconnexion dans le menu
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (sidebarNav) {
    const logoutItem = document.createElement('li');
    logoutItem.className = 'nav-item logout-item';
    logoutItem.innerHTML = `
      <a href="#" class="nav-link logout-link">
        <i class="fas fa-sign-out-alt nav-icon"></i>
        <span>Déconnexion</span>
      </a>
    `;
    sidebarNav.appendChild(logoutItem);
    
    // Ajouter l'événement de déconnexion
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', async function(event) {
        event.preventDefault();
        
        try {
          await authService.logout();
          // Rediriger vers la page de connexion
          window.location.href = '/login';
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
          alert('Une erreur est survenue lors de la déconnexion.');
        }
      });
    }
  }
});

// Exporter la fonction de vérification
export { checkAuthentication };