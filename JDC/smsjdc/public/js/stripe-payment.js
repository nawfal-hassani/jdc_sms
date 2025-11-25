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
    
    const container = document.getElementById(containerId);
    console.log('📍 Container trouvé:', container ? 'OUI' : 'NON');

    if (!container) {
      console.error('❌ Container non trouvé:', containerId);
      return;
    }

    const packs = await this.getPacks();
    console.log('📦 Packs reçus:', packs);

    if (!packs || packs.length === 0) {
      console.warn('⚠️ Aucun pack à afficher');
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <div style="font-size: 72px; margin-bottom: 20px;">🚧</div>
          <h2 style="font-size: 28px; margin-bottom: 15px; font-weight: 700;">Système de paiement en cours de configuration</h2>
          <p style="font-size: 18px; opacity: 0.95; max-width: 600px; margin: 0 auto 25px;">
            Notre plateforme de paiement Stripe est actuellement en cours de mise en place.
          </p>
          <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 20px; max-width: 500px; margin: 0 auto; backdrop-filter: blur(10px);">
            <p style="font-size: 16px; margin: 0 0 10px 0;">
              <i class="fas fa-clock" style="margin-right: 8px;"></i>
              <strong>Cette fonctionnalité sera bientôt disponible</strong>
            </p>
            <p style="font-size: 14px; opacity: 0.9; margin: 0;">
              Vous pourrez acheter des SMS et souscrire à nos abonnements dès que la configuration sera terminée.
            </p>
          </div>
          <div style="margin-top: 30px;">
            <button id="back-to-dashboard-btn" style="display: inline-block; background: white; color: #667eea; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; border: none; cursor: pointer; transition: transform 0.2s;">
              <i class="fas fa-arrow-left" style="margin-right: 8px;"></i>
              Retour au Dashboard
            </button>
          </div>
        </div>
      `;
      
      // Ajouter l'événement au bouton retour
      const backBtn = container.querySelector('#back-to-dashboard-btn');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          if (typeof showTab === 'function') {
            showTab('dashboard-tab', true);
          }
          if (typeof saveActiveTab === 'function') {
            saveActiveTab('dashboard-tab');
          }
        });
        
        // Effet hover
        backBtn.addEventListener('mouseenter', () => {
          backBtn.style.transform = 'scale(1.05)';
        });
        backBtn.addEventListener('mouseleave', () => {
          backBtn.style.transform = 'scale(1)';
        });
      }
      
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
          // Message d'erreur personnalisé si Stripe n'est pas configuré
          if (error.message.includes('Stripe n\'est pas configuré') || error.message.includes('pas configuré')) {
            this.showStripeNotConfiguredModal();
          } else {
            alert('❌ Erreur lors de la création du paiement : ' + error.message);
          }
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

  // Afficher un modal élégant quand Stripe n'est pas configuré
  showStripeNotConfiguredModal() {
    // Créer le modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
      <div style="background: white; border-radius: 16px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s ease;">
        <div style="font-size: 64px; margin-bottom: 20px;">🚧</div>
        <h2 style="font-size: 24px; color: #333; margin-bottom: 15px; font-weight: 700;">Système de paiement en configuration</h2>
        <p style="font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 25px;">
          Notre plateforme de paiement <strong style="color: #635BFF;">Stripe</strong> est actuellement en cours de mise en place.
        </p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #635BFF;">
          <p style="font-size: 14px; color: #555; margin: 0;">
            <i class="fas fa-info-circle" style="color: #635BFF; margin-right: 8px;"></i>
            Cette fonctionnalité sera disponible très prochainement. Vous pourrez alors acheter des SMS et souscrire à nos abonnements.
          </p>
        </div>
        <button id="stripe-modal-close-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 40px; border-radius: 25px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
          <i class="fas fa-check" style="margin-right: 8px;"></i>
          Compris
        </button>
      </div>
    `;

    // Ajouter l'événement au bouton "Compris"
    const closeBtn = modal.querySelector('#stripe-modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.remove();
      });
      
      // Effet hover
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.transform = 'scale(1.05)';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.transform = 'scale(1)';
      });
    }

    // Ajouter les animations CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Fermer en cliquant sur le fond
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
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
