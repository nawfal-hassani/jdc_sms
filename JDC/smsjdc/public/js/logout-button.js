// FRONTEND
/**
 * Gestion du bouton de déconnexion pour le Dashboard JDC
 */
document.addEventListener('DOMContentLoaded', function() {
  // Ajouter un bouton de déconnexion dans le header
  const userProfile = document.querySelector('.user-profile');
  if (userProfile) {
    // Créer le bouton de déconnexion
    const logoutButton = document.createElement('button');
    logoutButton.id = 'logout-button';
    logoutButton.className = 'logout-button';
    logoutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Déconnexion';
    
    // Ajouter le bouton à côté du profil utilisateur
    userProfile.appendChild(logoutButton);
    
    // Ajouter le CSS pour le bouton
    const style = document.createElement('style');
    style.textContent = `
      .logout-button {
        background-color: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-color);
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 10px;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.3s ease;
      }
      
      .logout-button:hover {
        background-color: var(--danger-color);
        border-color: var(--danger-color);
        color: white;
      }
      
      @media (max-width: 768px) {
        .logout-button {
          padding: 4px 8px;
          font-size: 0.85rem;
        }
        
        .logout-button i {
          margin-right: 0;
        }
        
        .logout-button span {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Ajouter l'écouteur d'événement pour la déconnexion
    logoutButton.addEventListener('click', function() {
      // Demander confirmation
      const confirmLogout = confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
      
      if (confirmLogout) {
        // Récupérer le token d'authentification du localStorage
        const token = localStorage.getItem('authToken');
        
        // Si pas de token, simplement rediriger
        if (!token) {
          console.log('Aucun token trouvé, redirection directe');
          window.location.href = '/login.html';
          return;
        }
        
        // Appeler l'API de déconnexion avec le token
        fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ token: token })
        })
        .then(response => {
          if (response.ok) {
            // Supprimer le token du localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            
            // Rediriger vers la page de connexion
            window.location.href = '/login.html';
          } else {
            throw new Error('Échec de la déconnexion');
          }
        })
        .catch(error => {
          console.error('Erreur lors de la déconnexion:', error);
          
          // Tentative de déconnexion de secours
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          // Rediriger quand même vers la page de connexion
          window.location.href = '/login.html';
        });
      }
    });
  }
});