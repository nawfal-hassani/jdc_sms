/**
 * Middleware d'authentification pour protéger les routes de l'API
 */

const authController = require('../controllers/authController');

/**
 * Middleware pour protéger les routes nécessitant une authentification
 * - Vérifie la présence d'un token valide
 * - Ajoute les informations utilisateur à l'objet requête
 */
const authMiddleware = {
    /**
     * Middleware pour toutes les routes nécessitant une authentification
     */
    requireAuth: (req, res, next) => {
        authController.authenticate(req, res, next);
    },

    /**
     * Middleware pour les routes nécessitant des droits d'administrateur
     */
    requireAdmin: (req, res, next) => {
        // D'abord, vérifier l'authentification
        authController.authenticate(req, res, (err) => {
            if (err) {
                return next(err);
            }

            // Ensuite, vérifier le rôle
            if (req.user && req.user.role === 'admin') {
                return next();
            }

            // Si l'utilisateur n'est pas administrateur
            return res.status(403).json({
                success: false,
                message: 'Accès refusé : droits d\'administrateur requis'
            });
        });
    }
};

module.exports = authMiddleware;