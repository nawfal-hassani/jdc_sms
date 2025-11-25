/**
 * Routes d'administration
 * Gestion des utilisateurs (réservé aux administrateurs)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const userHistoryService = require('../services/userHistoryService');

/**
 * Middleware pour vérifier les droits admin
 */
const requireAdmin = authMiddleware.requireAdmin;

/**
 * @route   GET /api/admin/users
 * @desc    Obtenir la liste de tous les utilisateurs
 * @access  Admin only
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    await authController.getUsers(req, res);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    Créer un nouvel utilisateur
 * @access  Admin only
 */
router.post('/users', requireAdmin, async (req, res) => {
  try {
    await authController.createUser(req, res);
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Admin only
 */
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    await authController.updateUser(req, res);
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Admin only
 */
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    await authController.deleteUser(req, res);
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route   GET /api/admin/statistics
 * @desc    Obtenir les statistiques de tous les utilisateurs
 * @access  Admin only
 */
router.get('/statistics', requireAdmin, async (req, res) => {
  try {
    const histories = await userHistoryService.getAllHistories();
    const statistics = {};

    for (const [userEmail, history] of Object.entries(histories)) {
      const stats = {
        total: history.length,
        delivered: history.filter(sms => sms.status === 'delivered' || sms.status === 'success').length,
        failed: history.filter(sms => sms.status === 'failed' || sms.status === 'error').length,
        pending: history.filter(sms => sms.status === 'pending').length,
      };
      stats.successRate = stats.total > 0 
        ? Math.round((stats.delivered / stats.total) * 100) 
        : 0;
      
      statistics[userEmail] = stats;
    }

    res.json({
      success: true,
      statistics: statistics
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route   GET /api/admin/users/:email/history
 * @desc    Obtenir l'historique d'un utilisateur spécifique
 * @access  Admin only
 */
router.get('/users/:email/history', requireAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    const history = await userHistoryService.loadUserHistory(email);

    res.json({
      success: true,
      email: email,
      history: history,
      count: history.length
    });
  } catch (error) {
    console.error('Erreur récupération historique utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:email/history
 * @desc    Vider l'historique d'un utilisateur
 * @access  Admin only
 */
router.delete('/users/:email/history', requireAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    await userHistoryService.clearUserHistory(email);

    res.json({
      success: true,
      message: `Historique de ${email} vidé avec succès`
    });
  } catch (error) {
    console.error('Erreur vidage historique utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route   GET /api/admin/users/:email/export
 * @desc    Exporter l'historique d'un utilisateur en CSV
 * @access  Admin only
 */
router.get('/users/:email/export', requireAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    const csv = await userHistoryService.exportUserHistoryToCsv(email);

    if (!csv) {
      return res.status(404).json({
        success: false,
        message: 'Aucun historique à exporter'
      });
    }

    const filename = `historique_${email}_${Date.now()}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM pour Excel
  } catch (error) {
    console.error('Erreur export historique utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
