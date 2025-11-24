const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Prix des packs SMS (en centimes)
const SMS_PACKS = {
  pack_100: {
    id: 'pack_100',
    name: 'Pack 100 SMS',
    sms: 100,
    price: 600, // 6€
    pricePerSms: 0.06
  },
  pack_500: {
    id: 'pack_500',
    name: 'Pack 500 SMS',
    sms: 500,
    price: 2500, // 25€
    pricePerSms: 0.05
  },
  pack_1000: {
    id: 'pack_1000',
    name: 'Pack 1000 SMS',
    sms: 1000,
    price: 4500, // 45€
    pricePerSms: 0.045
  },
  pack_5000: {
    id: 'pack_5000',
    name: 'Pack 5000 SMS',
    sms: 5000,
    price: 20000, // 200€
    pricePerSms: 0.04
  },
  pack_10000: {
    id: 'pack_10000',
    name: 'Pack 10000 SMS',
    sms: 10000,
    price: 35000, // 350€
    pricePerSms: 0.035
  }
};

// Abonnements mensuels
const SUBSCRIPTIONS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 2900, // 29€/mois
    sms: 500,
    priceId: null // Sera créé dans Stripe
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 9900, // 99€/mois
    sms: 2500,
    priceId: null
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29900, // 299€/mois
    sms: 10000,
    priceId: null
  }
};

/**
 * Créer une session de paiement Stripe pour un pack SMS
 */
async function createCheckoutSession(userId, packId, successUrl, cancelUrl) {
  try {
    const pack = SMS_PACKS[packId];
    
    if (!pack) {
      throw new Error('Pack SMS invalide');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: pack.name,
              description: `${pack.sms} SMS à ${pack.pricePerSms}€/SMS`,
              images: ['https://your-domain.com/assets/sms-pack.png'],
            },
            unit_amount: pack.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        packId: packId,
        smsAmount: pack.sms.toString(),
        type: 'sms_pack'
      },
      billing_address_collection: 'required',
      locale: 'fr',
    });

    return session;
  } catch (error) {
    console.error('Erreur création session Stripe:', error);
    throw error;
  }
}

/**
 * Créer une session d'abonnement
 */
async function createSubscriptionCheckout(userId, subscriptionId, successUrl, cancelUrl) {
  try {
    const subscription = SUBSCRIPTIONS[subscriptionId];
    
    if (!subscription) {
      throw new Error('Abonnement invalide');
    }

    // Créer ou récupérer le produit et le prix dans Stripe
    let priceId = subscription.priceId;
    
    if (!priceId) {
      // Créer le produit
      const product = await stripe.products.create({
        name: `Abonnement ${subscription.name}`,
        description: `${subscription.sms} SMS/mois`,
      });

      // Créer le prix récurrent
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: subscription.price,
        currency: 'eur',
        recurring: {
          interval: 'month',
        },
      });

      priceId = price.id;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        subscriptionId: subscriptionId,
        smsAmount: subscription.sms.toString(),
        type: 'subscription'
      },
      billing_address_collection: 'required',
      locale: 'fr',
    });

    return session;
  } catch (error) {
    console.error('Erreur création abonnement Stripe:', error);
    throw error;
  }
}

/**
 * Gérer les webhooks Stripe
 */
async function handleWebhook(event, addCreditsToUser) {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.metadata.userId;
        const smsAmount = parseInt(session.metadata.smsAmount);
        const type = session.metadata.type;

        console.log(`✅ Paiement réussi pour user ${userId}: ${smsAmount} SMS`);
        
        // Ajouter les crédits à l'utilisateur
        await addCreditsToUser(userId, smsAmount, {
          type: type,
          packId: session.metadata.packId || session.metadata.subscriptionId,
          amount: session.amount_total / 100,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
        });
        
        break;

      case 'invoice.payment_succeeded':
        // Abonnement renouvelé automatiquement
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        console.log(`✅ Renouvellement abonnement ${subscriptionId}`);
        
        // Créditer les SMS mensuels
        // TODO: Implémenter la logique de renouvellement
        
        break;

      case 'invoice.payment_failed':
        // Échec de paiement d'abonnement
        const failedInvoice = event.data.object;
        
        console.log(`❌ Échec paiement abonnement`, failedInvoice);
        
        // TODO: Envoyer email d'alerte
        
        break;

      case 'customer.subscription.deleted':
        // Abonnement annulé
        const deletedSubscription = event.data.object;
        
        console.log(`🚫 Abonnement annulé`, deletedSubscription);
        
        // TODO: Mettre à jour le statut utilisateur
        
        break;

      default:
        console.log(`Event non géré: ${event.type}`);
    }
  } catch (error) {
    console.error('Erreur traitement webhook:', error);
    throw error;
  }
}

/**
 * Récupérer les informations d'un client Stripe
 */
async function getCustomerInfo(customerId) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Erreur récupération client:', error);
    throw error;
  }
}

/**
 * Créer un portail client Stripe (pour gérer abonnements)
 */
async function createCustomerPortal(customerId, returnUrl) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session;
  } catch (error) {
    console.error('Erreur création portail client:', error);
    throw error;
  }
}

module.exports = {
  SMS_PACKS,
  SUBSCRIPTIONS,
  createCheckoutSession,
  createSubscriptionCheckout,
  handleWebhook,
  getCustomerInfo,
  createCustomerPortal,
};
