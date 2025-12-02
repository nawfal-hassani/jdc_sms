/**
 * Middleware de sécurité pour l'application
 * Gestion de la validation, rate limiting, et sécurité générale
 */

const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter pour les tentatives de connexion
 * Limite: 10 tentatives par 5 minutes par IP
 */
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 tentatives max
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Réessayez dans 5 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour les requêtes SMS
 * Limite: 3 SMS par 5 minutes par IP
 */
const smsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 SMS max
  message: {
    success: false,
    message: 'Trop de demandes de code SMS. Réessayez dans 5 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter général pour l'API
 * Limite: 100 requêtes par 15 minutes par IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max
  message: {
    success: false,
    message: 'Trop de requêtes. Réessayez plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Validation pour la connexion par email/mot de passe
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
];

/**
 * Validation pour la demande de code SMS
 */
const validateSmsRequest = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Numéro de téléphone requis')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Format de numéro de téléphone invalide (format international attendu)'),
];

/**
 * Validation pour la vérification du code SMS
 */
const validateSmsVerification = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Numéro de téléphone requis')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Format de numéro de téléphone invalide'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Code requis')
    .isLength({ min: 6, max: 6 })
    .withMessage('Le code doit contenir exactement 6 chiffres')
    .isNumeric()
    .withMessage('Le code doit être numérique'),
];

/**
 * Validation pour la création d'utilisateur
 */
const validateUserCreation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nom requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Format de numéro de téléphone invalide'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Rôle invalide (user ou admin uniquement)'),
];

/**
 * Validation pour la mise à jour d'utilisateur
 */
const validateUserUpdate = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Format de numéro de téléphone invalide'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Rôle invalide (user ou admin uniquement)'),
];

/**
 * Middleware pour vérifier les erreurs de validation
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Middleware pour sanitizer les données HTML (XSS protection)
 */
const sanitizeInput = (req, res, next) => {
  // Fonction pour nettoyer récursivement les objets
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Échapper les caractères HTML dangereux
      return obj
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    
    return obj;
  };
  
  // Sanitize body, query, params
  if (req.body) req.body = sanitize({ ...req.body });
  if (req.query) req.query = sanitize({ ...req.query });
  if (req.params) req.params = sanitize({ ...req.params });
  
  next();
};

module.exports = {
  loginLimiter,
  smsLimiter,
  apiLimiter,
  validateLogin,
  validateSmsRequest,
  validateSmsVerification,
  validateUserCreation,
  validateUserUpdate,
  handleValidationErrors,
  sanitizeInput,
};
