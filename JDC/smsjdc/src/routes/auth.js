/**
 * Routes d'authentification pour le JDC SMS Dashboard
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @route   POST /api/auth/login
 * @desc    Authentification par email/mot de passe
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/request-sms
 * @desc    Demande d'envoi d'un code SMS pour authentification
 * @access  Public
 */
router.post('/request-sms', authController.requestSmsCode);

/**
 * @route   POST /api/auth/verify-sms
 * @desc    Vérification d'un code SMS et authentification
 * @access  Public
 */
router.post('/verify-sms', authController.verifySmsCode);

/**
 * @route   POST /api/auth/verify-token
 * @desc    Vérification de la validité d'un token
 * @access  Public
 */
router.post('/verify-token', authController.verifyToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion (invalidation du token)
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/auth/register
 * @desc    Création d'un nouvel utilisateur
 * @access  Admin (à sécuriser davantage)
 */
router.post('/register', authController.createUser);

/**
 * @route   GET /api/auth/users
 * @desc    Récupérer la liste des utilisateurs
 * @access  Admin
 */
router.get('/users', authController.getUsers);

/**
 * @route   PUT /api/auth/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Admin
 */
router.put('/users/:id', authController.updateUser);

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Admin
 */
router.delete('/users/:id', authController.deleteUser);

module.exports = router;