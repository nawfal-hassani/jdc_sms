const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const fs = require('fs').promises;
const path = require('path');

const CREDITS_FILE = path.join(__dirname, '../../data/user-credits.json');

// Charger les crédits utilisateurs
async function loadCredits() {
  try {
    const data = await fs.readFile(CREDITS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Sauvegarder les crédits
async function saveCredits(credits) {
  try {
    await fs.writeFile(CREDITS_FILE, JSON.stringify(credits, null, 2));
  } catch (error) {
    console.error('Erreur sauvegarde crédits:', error);
  }
}

// Ajouter des crédits à un utilisateur
async function addCreditsToUser(userId, amount, transaction) {
  const credits = await loadCredits();
  
  if (!credits[userId]) {
    credits[userId] = {
      balance: 0,
      totalPurchased: 0,
      transactions: []
    };
  }

  credits[userId].balance += amount;
  credits[userId].totalPurchased += amount;
  credits[userId].transactions.push({
    ...transaction,
    amount: amount,
    date: new Date().toISOString(),
  });

  await saveCredits(credits);
  return credits[userId];
}

/**
 * GET /api/stripe/packs
 * Liste des packs disponibles
 */
router.get('/packs', (req, res) => {
  res.json({
    success: true,
    packs: Object.values(stripeService.SMS_PACKS)
  });
});

/**
 * GET /api/stripe/subscriptions
 * Liste des abonnements disponibles
 */
router.get('/subscriptions', (req, res) => {
  res.json({
    success: true,
    subscriptions: Object.values(stripeService.SUBSCRIPTIONS)
  });
});

/**
 * POST /api/stripe/create-checkout
 * Créer une session de paiement
 */
router.post('/create-checkout', async (req, res) => {
  try {
    const { userId, packId, type = 'pack' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    const successUrl = `${req.protocol}://${req.get('host')}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${req.protocol}://${req.get('host')}/payment-cancel`;

    let session;

    if (type === 'subscription') {
      session = await stripeService.createSubscriptionCheckout(
        userId,
        packId,
        successUrl,
        cancelUrl
      );
    } else {
      session = await stripeService.createCheckoutSession(
        userId,
        packId,
        successUrl,
        cancelUrl
      );
    }

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Erreur création checkout:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stripe/webhook
 * Recevoir les événements Stripe
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = require('stripe')(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('❌ Erreur signature webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Traiter l'événement
  try {
    await stripeService.handleWebhook(event, addCreditsToUser);
    res.json({ received: true });
  } catch (error) {
    console.error('Erreur traitement webhook:', error);
    res.status(500).json({ error: 'Erreur traitement webhook' });
  }
});

/**
 * GET /api/stripe/credits/:userId
 * Récupérer le solde de crédits d'un utilisateur
 */
router.get('/credits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const credits = await loadCredits();

    const userCredits = credits[userId] || {
      balance: 0,
      totalPurchased: 0,
      transactions: []
    };

    res.json({
      success: true,
      credits: userCredits
    });

  } catch (error) {
    console.error('Erreur récupération crédits:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stripe/use-credits
 * Utiliser des crédits (déduire)
 */
router.post('/use-credits', async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: 'userId et amount requis' });
    }

    const credits = await loadCredits();

    if (!credits[userId] || credits[userId].balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Crédits insuffisants'
      });
    }

    credits[userId].balance -= amount;
    credits[userId].transactions.push({
      type: 'usage',
      amount: -amount,
      date: new Date().toISOString(),
      description: 'Envoi SMS'
    });

    await saveCredits(credits);

    res.json({
      success: true,
      newBalance: credits[userId].balance
    });

  } catch (error) {
    console.error('Erreur utilisation crédits:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stripe/portal/:customerId
 * Créer un lien vers le portail client Stripe
 */
router.get('/portal/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const returnUrl = `${req.protocol}://${req.get('host')}/billing`;

    const session = await stripeService.createCustomerPortal(customerId, returnUrl);

    res.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('Erreur création portail:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
