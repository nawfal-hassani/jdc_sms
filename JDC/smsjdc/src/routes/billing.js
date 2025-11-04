/**
 * Routes pour la gestion des crédits SMS et abonnements
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const CREDITS_FILE = path.join(DATA_DIR, 'user-credits.json');
const PACKS_FILE = path.join(DATA_DIR, 'sms-packs.json');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');
const INVOICES_FILE = path.join(DATA_DIR, 'invoices.json');

// Charger les données
function loadJSON(file) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
    return [];
  } catch (error) {
    console.error('Erreur lecture fichier:', file, error);
    return [];
  }
}

function saveJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Erreur écriture fichier:', file, error);
    return false;
  }
}

/**
 * GET /api/billing/credits/:email
 * Récupérer les crédits d'un utilisateur
 */
router.get('/credits/:email', (req, res) => {
  try {
    const { email } = req.params;
    const credits = loadJSON(CREDITS_FILE);
    const userCredit = credits.find(c => c.user_email === email);
    
    if (!userCredit) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: userCredit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des crédits',
      error: error.message
    });
  }
});

/**
 * GET /api/billing/packs
 * Récupérer tous les packs SMS disponibles
 */
router.get('/packs', (req, res) => {
  try {
    const packs = loadJSON(PACKS_FILE);
    res.json({
      success: true,
      data: packs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des packs',
      error: error.message
    });
  }
});

/**
 * GET /api/billing/subscriptions
 * Récupérer tous les plans d'abonnement
 */
router.get('/subscriptions', (req, res) => {
  try {
    const subscriptions = loadJSON(SUBSCRIPTIONS_FILE);
    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des abonnements',
      error: error.message
    });
  }
});

/**
 * POST /api/billing/purchase
 * Acheter un pack SMS
 */
router.post('/purchase', (req, res) => {
  try {
    const { email, pack_id, promo_code } = req.body;
    
    // Charger les données
    const credits = loadJSON(CREDITS_FILE);
    const packs = loadJSON(PACKS_FILE);
    const invoices = loadJSON(INVOICES_FILE);
    
    // Trouver l'utilisateur
    let userCredit = credits.find(c => c.user_email === email);
    if (!userCredit) {
      // Créer un nouveau compte crédit
      userCredit = {
        id: credits.length + 1,
        user_email: email,
        current_balance: 0,
        total_purchased: 0,
        total_sent: 0,
        subscription: null,
        alert_settings: {
          enabled: true,
          low_balance_threshold: 100,
          critical_balance_threshold: 10,
          email_notifications: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      credits.push(userCredit);
    }
    
    // Trouver le pack
    const pack = packs.find(p => p.id === pack_id);
    if (!pack) {
      return res.status(404).json({
        success: false,
        message: 'Pack non trouvé'
      });
    }
    
    // Appliquer le code promo si fourni
    let finalPrice = pack.price;
    let discount = 0;
    if (promo_code) {
      // TODO: Vérifier le code promo dans une base de données
      // Pour l'instant, codes exemple
      const promoCodes = {
        'BIENVENUE': 0.10, // -10%
        'SEB': 0.05        // -5%
      };
      
      if (promoCodes[promo_code.toUpperCase()]) {
        discount = promoCodes[promo_code.toUpperCase()];
        finalPrice = pack.price * (1 - discount);
      }
    }
    
    // Créer la facture
    const invoice = {
      id: `INV-${Date.now()}`,
      user_email: email,
      type: 'sms_pack',
      pack_id: pack_id,
      quantity: pack.quantity,
      unit_price: pack.price,
      promo_code: promo_code || null,
      discount_percent: discount * 100,
      subtotal: pack.price,
      discount_amount: pack.price * discount,
      total_ht: finalPrice,
      total_ttc: finalPrice * 1.20, // TVA 20%
      status: 'pending', // pending, paid, failed
      payment_method: null,
      created_at: new Date().toISOString(),
      paid_at: null
    };
    
    invoices.push(invoice);
    
    // Mettre à jour les crédits (simuler le paiement réussi)
    invoice.status = 'paid';
    invoice.paid_at = new Date().toISOString();
    invoice.payment_method = 'credit_card';
    
    const creditIndex = credits.findIndex(c => c.user_email === email);
    credits[creditIndex].current_balance += pack.quantity;
    credits[creditIndex].total_purchased += pack.quantity;
    credits[creditIndex].updated_at = new Date().toISOString();
    
    // Sauvegarder
    saveJSON(CREDITS_FILE, credits);
    saveJSON(INVOICES_FILE, invoices);
    
    res.json({
      success: true,
      message: `${pack.quantity} SMS ajoutés à votre compte`,
      data: {
        invoice: invoice,
        new_balance: credits[creditIndex].current_balance
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'achat',
      error: error.message
    });
  }
});

/**
 * POST /api/billing/subscribe
 * S'abonner à un plan
 */
router.post('/subscribe', (req, res) => {
  try {
    const { email, plan_id, billing_cycle } = req.body;
    
    const credits = loadJSON(CREDITS_FILE);
    const subscriptions = loadJSON(SUBSCRIPTIONS_FILE);
    const invoices = loadJSON(INVOICES_FILE);
    
    // Trouver le plan
    const plan = subscriptions.find(s => s.id === plan_id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }
    
    // Trouver ou créer l'utilisateur
    let userCredit = credits.find(c => c.user_email === email);
    if (!userCredit) {
      userCredit = {
        id: credits.length + 1,
        user_email: email,
        current_balance: 0,
        total_purchased: 0,
        total_sent: 0,
        subscription: null,
        alert_settings: {
          enabled: true,
          low_balance_threshold: 100,
          critical_balance_threshold: 10,
          email_notifications: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      credits.push(userCredit);
    }
    
    const price = billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    const startDate = new Date();
    const nextBilling = new Date();
    const trialEnd = new Date();
    
    trialEnd.setDate(trialEnd.getDate() + 30);
    
    if (billing_cycle === 'yearly') {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    } else {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    }
    
    // Créer l'abonnement
    const subscription = {
      plan: plan_id,
      status: 'trial', // trial, active, cancelled, expired
      billing_cycle: billing_cycle,
      start_date: startDate.toISOString(),
      next_billing: nextBilling.toISOString(),
      trial_end: trialEnd.toISOString()
    };
    
    // Créer la facture
    const invoice = {
      id: `INV-${Date.now()}`,
      user_email: email,
      type: 'subscription',
      plan_id: plan_id,
      billing_cycle: billing_cycle,
      quantity: 1,
      unit_price: price,
      promo_code: null,
      discount_percent: 0,
      subtotal: price,
      discount_amount: 0,
      total_ht: price,
      total_ttc: price * 1.20,
      status: 'pending',
      payment_method: null,
      created_at: new Date().toISOString(),
      paid_at: null
    };
    
    invoices.push(invoice);
    
    // Mettre à jour l'abonnement
    const creditIndex = credits.findIndex(c => c.user_email === email);
    credits[creditIndex].subscription = subscription;
    credits[creditIndex].current_balance += plan.sms_included;
    credits[creditIndex].updated_at = new Date().toISOString();
    
    saveJSON(CREDITS_FILE, credits);
    saveJSON(INVOICES_FILE, invoices);
    
    res.json({
      success: true,
      message: `Abonnement ${plan.name} activé avec 30 jours d'essai gratuit`,
      data: {
        subscription: subscription,
        invoice: invoice,
        new_balance: credits[creditIndex].current_balance
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la souscription',
      error: error.message
    });
  }
});

/**
 * GET /api/billing/invoices/:email
 * Récupérer les factures d'un utilisateur
 */
router.get('/invoices/:email', (req, res) => {
  try {
    const { email } = req.params;
    const invoices = loadJSON(INVOICES_FILE);
    
    const userInvoices = invoices.filter(inv => inv.user_email === email);
    
    res.json({
      success: true,
      data: userInvoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
      error: error.message
    });
  }
});

/**
 * PUT /api/billing/alert-settings/:email
 * Mettre à jour les paramètres d'alerte
 */
router.put('/alert-settings/:email', (req, res) => {
  try {
    const { email } = req.params;
    const { enabled, low_balance_threshold, critical_balance_threshold, email_notifications } = req.body;
    
    const credits = loadJSON(CREDITS_FILE);
    const creditIndex = credits.findIndex(c => c.user_email === email);
    
    if (creditIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    credits[creditIndex].alert_settings = {
      enabled: enabled !== undefined ? enabled : credits[creditIndex].alert_settings.enabled,
      low_balance_threshold: low_balance_threshold || credits[creditIndex].alert_settings.low_balance_threshold,
      critical_balance_threshold: critical_balance_threshold || credits[creditIndex].alert_settings.critical_balance_threshold,
      email_notifications: email_notifications !== undefined ? email_notifications : credits[creditIndex].alert_settings.email_notifications
    };
    
    credits[creditIndex].updated_at = new Date().toISOString();
    
    saveJSON(CREDITS_FILE, credits);
    
    res.json({
      success: true,
      message: 'Paramètres d\'alerte mis à jour',
      data: credits[creditIndex].alert_settings
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres',
      error: error.message
    });
  }
});

module.exports = router;
