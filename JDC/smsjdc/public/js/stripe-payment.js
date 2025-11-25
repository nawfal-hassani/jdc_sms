// Service Stripe Frontend
class StripePaymentService {
  constructor() {
    this.stripePublicKey = null;
    this.loadStripeScript();
  }

  // Charger le script Stripe.js
  loadStripeScript() {
    if (document.getElementById('stripe-js')) return;

    const script = document.createElement('script');
    script.id = 'stripe-js';
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    document.head.appendChild(script);
  }

  // Récupérer les packs SMS disponibles
  async getPacks() {
    try {
      const response = await fetch('/api/stripe/packs');
      const data = await response.json();
      
      console.log('📦 Réponse API packs:', data);
      
      if (data.success && data.packs) {
        console.log('✅ Packs chargés:', data.packs.length);
        return data.packs;
      } else {
        console.error('❌ Format de réponse invalide:', data);
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur chargement packs:', error);
      return [];
    }
  }

  // Récupérer les abonnements disponibles
  async getSubscriptions() {
    try {
      const response = await fetch('/api/stripe/subscriptions');
      const data = await response.json();
      return data.subscriptions;
    } catch (error) {
      console.error('Erreur chargement abonnements:', error);
      return [];
    }
  }

  // Créer une session de paiement et rediriger vers Stripe
  async purchasePack(userId, packId, type = 'pack') {
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          packId: packId,
          type: type
        })
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Erreur création session');
      }

    } catch (error) {
      console.error('Erreur achat pack:', error);
      throw error;
    }
  }

  // Créer une session d'abonnement et rediriger vers Stripe
  async purchaseSubscription(userId, subscriptionId) {
    try {
      const response = await fetch('/api/stripe/create-subscription-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          subscriptionId: subscriptionId
        })
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Erreur création session abonnement');
      }

    } catch (error) {
      console.error('Erreur achat abonnement:', error);
      throw error;
    }
  }

  // Récupérer le solde de crédits
  async getCredits(userId) {
    try {
      const response = await fetch(`/api/stripe/credits/${userId}`);
      const data = await response.json();
      return data.credits;
    } catch (error) {
      console.error('Erreur récupération crédits:', error);
      return { balance: 0, totalPurchased: 0, transactions: [] };
    }
  }

  // Afficher les packs dans le DOM
  async displayPacks(containerId, userId) {
    console.log('🎯 displayPacks appelé - containerId:', containerId, 'userId:', userId);
    
    const packs = await this.getPacks();
    console.log('📦 Packs reçus:', packs);
    
    const container = document.getElementById(containerId);
    console.log('📍 Container trouvé:', container ? 'OUI' : 'NON');

    if (!container) {
      console.error('❌ Container non trouvé:', containerId);
      return;
    }

    if (!packs || packs.length === 0) {
      console.warn('⚠️ Aucun pack à afficher');
      container.innerHTML = '<p style="text-align: center; color: #999;">Aucun pack disponible pour le moment.</p>';
      return;
    }

    console.log(`✅ Affichage de ${packs.length} packs`);

    container.innerHTML = packs.map(pack => `
      <div class="pack-card">
        <div class="pack-badge">
          ${pack.id === 'pack_1000' ? '<span class="popular-badge">🔥 Populaire</span>' : ''}
        </div>
        <h3>${pack.name}</h3>
        <div class="pack-price">
          <span class="price-amount">${(pack.price / 100).toFixed(2)}€</span>
        </div>
        <div class="pack-details">
          <p><strong>${pack.sms} SMS</strong></p>
          <p class="price-per-sms">${pack.pricePerSms}€ / SMS</p>
        </div>
        <button 
          class="btn btn-primary purchase-pack-btn" 
          data-pack-id="${pack.id}"
          data-user-id="${userId}">
          <i class="fas fa-shopping-cart"></i> Acheter
        </button>
        <p class="pack-savings">
          ${this.calculateSavings(pack)}
        </p>
      </div>
    `).join('');

    // Attacher les événements
    container.querySelectorAll('.purchase-pack-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const packId = e.target.dataset.packId;
        const userId = e.target.dataset.userId;
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirection...';

        try {
          await this.purchasePack(userId, packId);
        } catch (error) {
          alert('Erreur lors de la création du paiement : ' + error.message);
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Acheter';
        }
      });
    });
  }

  // Calculer les économies
  calculateSavings(pack) {
    const basePrice = 0.08; // Prix de référence
    const savings = ((basePrice - pack.pricePerSms) / basePrice * 100).toFixed(0);
    
    if (savings > 0) {
      return `💰 Économisez ${savings}%`;
    }
    return '';
  }

  // Afficher le solde de crédits
  async displayCredits(elementId, userId) {
    const credits = await this.getCredits(userId);
    const element = document.getElementById(elementId);

    if (element) {
      element.textContent = credits.balance.toLocaleString('fr-FR');
    }

    return credits;
  }
}

// Initialiser le service
window.stripePaymentService = new StripePaymentService();

// Gérer le succès du paiement
if (window.location.pathname === '/payment-success') {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  if (sessionId) {
    showNotification('✅ Paiement réussi ! Vos crédits SMS ont été ajoutés.', 'success');
    
    // Rediriger vers la page de facturation après 3 secondes
    setTimeout(() => {
      window.location.href = '/#billing-tab';
    }, 3000);
  }
}

// Gérer l'annulation du paiement
if (window.location.pathname === '/payment-cancel') {
  showNotification('⚠️ Paiement annulé. Aucun débit n\'a été effectué.', 'warning');
  
  setTimeout(() => {
    window.location.href = '/#billing-tab';
  }, 3000);
}
