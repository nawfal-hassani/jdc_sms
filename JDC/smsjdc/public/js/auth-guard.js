/**
 * Middleware d'authentification côté client
 * Vérifie si l'utilisateur est connecté et redirige vers la page de connexion si nécessaire
 */

(function() {
    'use strict';

    // Fonction pour vérifier si on est sur la page de connexion
    function isLoginPage() {
        return window.location.pathname === '/login.html' || 
               window.location.pathname === '/';
    }

    // Fonction pour obtenir le token d'authentification
    function getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    // Fonction pour obtenir les informations utilisateur
    function getUser() {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Fonction pour vérifier le token auprès du serveur
    async function verifyToken(token) {
        try {
            const response = await fetch('/api/auth/verify-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Erreur lors de la vérification du token:', error);
            return false;
        }
    }

    // Fonction pour déconnecter l'utilisateur
    async function logout(redirectToLogin = true) {
        const token = getAuthToken();

        if (token) {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token })
                });
            } catch (error) {
                console.error('Erreur lors de la déconnexion:', error);
            }
        }

        // Nettoyer le stockage local
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');

        if (redirectToLogin) {
            window.location.href = '/login.html';
        }
    }

    // Fonction pour initialiser les informations utilisateur dans l'interface
    function initializeUserInfo() {
        const user = getUser();
        if (!user) return;

        // Mettre à jour le nom d'utilisateur dans l'interface
        const userNameElements = document.querySelectorAll('[data-user-name]');
        userNameElements.forEach(el => {
            el.textContent = user.name || user.email;
        });

        // Mettre à jour l'email
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        userEmailElements.forEach(el => {
            el.textContent = user.email;
        });

        // Mettre à jour le rôle
        const userRoleElements = document.querySelectorAll('[data-user-role]');
        userRoleElements.forEach(el => {
            el.textContent = user.role === 'admin' ? 'Administrateur' : 'Utilisateur';
        });

        // Afficher/masquer les éléments selon le rôle
        if (user.role !== 'admin') {
            document.querySelectorAll('[data-require-admin]').forEach(el => {
                el.style.display = 'none';
            });
        } else {
            // Afficher le bouton Administration pour les admins
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = '';
            });
        }
    }

    // Fonction pour gérer les boutons de déconnexion
    function setupLogoutButtons() {
        const logoutButtons = document.querySelectorAll('[data-logout]');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.preventDefault();
                await logout();
            });
        });
    }

    // Vérification de l'authentification au chargement de la page
    async function checkAuth() {
        const token = getAuthToken();

        // Si on est sur la page de connexion
        if (isLoginPage()) {
            // Si l'utilisateur a un token valide, le rediriger vers le dashboard
            if (token) {
                const isValid = await verifyToken(token);
                if (isValid) {
                    window.location.href = '/index.html';
                } else {
                    // Token invalide, le nettoyer
                    await logout(false);
                }
            }
            return;
        }

        // Si on n'est pas sur la page de connexion
        if (!token) {
            // Pas de token, rediriger vers la page de connexion
            window.location.href = '/login.html';
            return;
        }

        // Vérifier la validité du token
        const isValid = await verifyToken(token);
        if (!isValid) {
            // Token invalide, déconnecter et rediriger
            await logout();
            return;
        }

        // Token valide, initialiser l'interface
        initializeUserInfo();
        setupLogoutButtons();
    }

    // Exposer les fonctions utiles globalement
    window.authGuard = {
        getToken: getAuthToken,
        getUser: getUser,
        logout: logout,
        checkAuth: checkAuth,
        initializeUserInfo: initializeUserInfo
    };

    // Vérifier l'authentification au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuth);
    } else {
        checkAuth();
    }

    // Intercepter tous les appels fetch pour ajouter le token d'authentification
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options = {}] = args;
        
        // Ne pas ajouter le token pour les requêtes d'authentification
        if (typeof url === 'string' && !url.includes('/auth/')) {
            const token = getAuthToken();
            if (token) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                };
            }
        }
        
        return originalFetch(url, options)
            .then(response => {
                // Si réponse 401 (non autorisé), déconnecter l'utilisateur
                if (response.status === 401) {
                    logout();
                }
                return response;
            });
    };

})();
