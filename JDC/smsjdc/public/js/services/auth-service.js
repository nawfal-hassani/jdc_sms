/**
 * Service d'authentification pour le JDC SMS Dashboard
 * Gère les appels API liés à l'authentification et la gestion des sessions
 */

const authService = {
    /**
     * Authentification par email et mot de passe
     * @param {string} email - Email de l'utilisateur
     * @param {string} password - Mot de passe
     * @param {boolean} remember - Se souvenir de l'utilisateur
     * @returns {Promise} - Promesse avec les données d'authentification
     */
    async login(email, password, remember = false) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, remember }),
            });

            const data = await response.json();

            if (data.success && data.token) {
                // Stocker les informations d'authentification
                this.saveAuthData(data.token, data.user, data.expiresIn);
            }

            return data;
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            throw error;
        }
    },

    /**
     * Demande d'envoi d'un code SMS pour authentification
     * @param {string} phone - Numéro de téléphone
     * @returns {Promise} - Promesse avec la réponse du serveur
     */
    async requestSmsCode(phone) {
        try {
            const response = await fetch('/api/auth/request-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone }),
            });

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la demande de code SMS:', error);
            throw error;
        }
    },

    /**
     * Vérification d'un code SMS et authentification
     * @param {string} phone - Numéro de téléphone
     * @param {string} code - Code SMS reçu
     * @returns {Promise} - Promesse avec les données d'authentification
     */
    async verifySmsCode(phone, code) {
        try {
            const response = await fetch('/api/auth/verify-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone, code }),
            });

            const data = await response.json();

            if (data.success && data.token) {
                // Stocker les informations d'authentification
                this.saveAuthData(data.token, data.user, data.expiresIn);
            }

            return data;
        } catch (error) {
            console.error('Erreur lors de la vérification du code SMS:', error);
            throw error;
        }
    },

    /**
     * Vérification de la validité d'un token d'authentification
     * @param {string} token - Token à vérifier
     * @returns {Promise} - Promesse avec les données d'utilisateur
     */
    async verifyToken(token = this.getToken()) {
        if (!token) {
            return { success: false, message: 'Aucun token disponible' };
        }

        try {
            const response = await fetch('/api/auth/verify-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la vérification du token:', error);
            throw error;
        }
    },

    /**
     * Déconnexion (suppression du token côté serveur et local)
     * @returns {Promise} - Promesse avec la réponse du serveur
     */
    async logout() {
        const token = this.getToken();
        
        if (!token) {
            return { success: true, message: 'Déjà déconnecté' };
        }

        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            // Supprimer les données d'authentification locales
            this.clearAuthData();

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            this.clearAuthData();
            throw error;
        }
    },

    /**
     * Stocker les informations d'authentification dans localStorage
     * @param {string} token - Token d'authentification
     * @param {Object} user - Données utilisateur
     * @param {number} expiresIn - Durée de validité du token en millisecondes
     */
    saveAuthData(token, user, expiresIn) {
        const expiryDate = new Date(Date.now() + expiresIn).toISOString();
        
        localStorage.setItem('jdc_auth_token', token);
        localStorage.setItem('jdc_auth_user', JSON.stringify(user));
        localStorage.setItem('jdc_auth_expiry', expiryDate);
    },

    /**
     * Récupérer le token d'authentification
     * @returns {string|null} - Token d'authentification ou null
     */
    getToken() {
        const token = localStorage.getItem('jdc_auth_token');
        const expiry = localStorage.getItem('jdc_auth_expiry');
        
        if (!token || !expiry) {
            return null;
        }
        
        // Vérifier si le token a expiré
        const expiryDate = new Date(expiry);
        if (Date.now() > expiryDate.getTime()) {
            this.clearAuthData();
            return null;
        }
        
        return token;
    },

    /**
     * Récupérer les informations utilisateur
     * @returns {Object|null} - Données utilisateur ou null
     */
    getUser() {
        const userString = localStorage.getItem('jdc_auth_user');
        const expiry = localStorage.getItem('jdc_auth_expiry');
        
        if (!userString || !expiry) {
            return null;
        }
        
        // Vérifier si les données ont expiré
        const expiryDate = new Date(expiry);
        if (Date.now() > expiryDate.getTime()) {
            this.clearAuthData();
            return null;
        }
        
        return JSON.parse(userString);
    },

    /**
     * Vérifier si l'utilisateur est authentifié
     * @returns {boolean} - True si authentifié, false sinon
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Effacer les données d'authentification du localStorage
     */
    clearAuthData() {
        localStorage.removeItem('jdc_auth_token');
        localStorage.removeItem('jdc_auth_user');
        localStorage.removeItem('jdc_auth_expiry');
    },

    /**
     * Vérifier si l'utilisateur a un rôle spécifique
     * @param {string} role - Rôle à vérifier (ex: 'admin')
     * @returns {boolean} - True si l'utilisateur a le rôle, false sinon
     */
    hasRole(role) {
        const user = this.getUser();
        return user && user.role === role;
    }
};

// Exposer le service d'authentification globalement
window.authService = authService;

// Exporter le service
export default authService;