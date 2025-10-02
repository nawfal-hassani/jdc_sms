/**
 * error.js
 * 
 * Middleware de gestion des erreurs
 * Capture et traite les erreurs du serveur de manière centralisée
 * 
 * @module middleware/error
 */

/**
 * Middleware pour capturer les erreurs non traitées
 * 
 * @param {Error} err - L'objet d'erreur
 * @param {Object} req - L'objet requête Express
 * @param {Object} res - L'objet réponse Express
 * @param {Function} next - La fonction pour passer au middleware suivant
 */
function errorHandler(err, req, res, next) {
  // Log de l'erreur
  console.error('Erreur serveur:', err.message);
  console.error(err.stack);
  
  // Réponse d'erreur
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Erreur serveur interne',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

/**
 * Middleware pour capturer les routes non trouvées
 * 
 * @param {Object} req - L'objet requête Express
 * @param {Object} res - L'objet réponse Express
 */
function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: `Route non trouvée: ${req.originalUrl}`
  });
}

module.exports = {
  errorHandler,
  notFound
};