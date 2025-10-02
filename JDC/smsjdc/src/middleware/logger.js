/**
 * logger.js
 * 
 * Middleware de journalisation des requêtes
 * Enregistre les informations sur chaque requête entrante
 * 
 * @module middleware/logger
 */

/**
 * Middleware pour enregistrer les détails de chaque requête
 * 
 * @param {Object} req - L'objet requête Express
 * @param {Object} res - L'objet réponse Express
 * @param {Function} next - La fonction pour passer au middleware suivant
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url, ip } = req;
  
  console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip}`);
  
  // Après l'envoi de la réponse
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} ${statusCode} - ${duration}ms`);
  });
  
  next();
}

module.exports = requestLogger;