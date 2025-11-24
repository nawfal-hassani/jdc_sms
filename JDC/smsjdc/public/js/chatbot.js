// Chatbot pour l'assistance client JDC
class ChatbotAssistant {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.knowledgeBase = this.initKnowledgeBase();
    this.init();
  }

  init() {
    this.createChatbotUI();
    this.attachEventListeners();
    this.loadWelcomeMessage();
  }

  initKnowledgeBase() {
    return {
      // Questions fréquentes sur les SMS
      sms: {
        keywords: ['sms', 'envoyer', 'message', 'envoi', 'texte', 'destinataire'],
        responses: [
          {
            question: "Comment envoyer un SMS ?",
            answer: "Pour envoyer un SMS, allez dans l'onglet 'Envoyer un SMS', entrez le numéro au format international (+33...) et votre message. Cliquez sur 'Envoyer le SMS'."
          },
          {
            question: "Quel est le format du numéro ?",
            answer: "Le numéro doit être au format international, par exemple : +33612345678 pour la France. N'oubliez pas le + au début !"
          },
          {
            question: "Combien de caractères par SMS ?",
            answer: "Un SMS standard contient 160 caractères. Si votre message est plus long, il sera divisé en plusieurs SMS."
          }
        ]
      },

      // Questions sur les tokens
      token: {
        keywords: ['token', 'code', 'authentification', 'verification', 'otp'],
        responses: [
          {
            question: "Comment envoyer un token ?",
            answer: "Allez dans l'onglet 'Envoyer un Token', entrez le numéro de téléphone et le code. Vous pouvez aussi générer un token aléatoire avec le bouton dé 🎲."
          },
          {
            question: "Qu'est-ce qu'un token ?",
            answer: "Un token est un code d'authentification temporaire (ex: 123456) envoyé par SMS pour vérifier l'identité d'un utilisateur."
          }
        ]
      },

      // Questions sur l'envoi groupé
      bulk: {
        keywords: ['groupé', 'masse', 'plusieurs', 'csv', 'excel', 'fichier', 'bulk'],
        responses: [
          {
            question: "Comment faire un envoi groupé ?",
            answer: "Allez dans 'Envoi Groupé', uploadez un fichier CSV ou Excel contenant les colonnes 'phone' et 'message'. Vous pouvez télécharger un modèle pour vous guider."
          },
          {
            question: "Quel format de fichier ?",
            answer: "Les formats acceptés sont CSV, Excel (.xlsx, .xls). Votre fichier doit contenir au minimum les colonnes 'phone' et 'message'."
          },
          {
            question: "Combien de SMS puis-je envoyer d'un coup ?",
            answer: "Vous pouvez envoyer autant de SMS que votre solde le permet. Un délai de 1 seconde est recommandé entre chaque envoi."
          }
        ]
      },

      // Questions sur la planification
      schedule: {
        keywords: ['planifier', 'programmer', 'plus tard', 'date', 'heure', 'schedule'],
        responses: [
          {
            question: "Comment planifier un SMS ?",
            answer: "Dans l'onglet 'Planification', vous pouvez programmer l'envoi d'un SMS à une date et heure précises. Le SMS sera envoyé automatiquement au moment choisi."
          },
          {
            question: "Puis-je annuler un SMS planifié ?",
            answer: "Oui ! Dans la section 'Messages planifiés', vous pouvez voir tous vos envois programmés et les annuler si nécessaire."
          }
        ]
      },

      // Questions sur le solde et la facturation
      billing: {
        keywords: ['solde', 'crédit', 'acheter', 'pack', 'prix', 'facture', 'paiement', 'abonnement'],
        responses: [
          {
            question: "Comment voir mon solde SMS ?",
            answer: "Votre solde SMS est affiché en haut de la sidebar et dans l'onglet 'Gestion des Achats'. Il se met à jour automatiquement après chaque envoi."
          },
          {
            question: "Comment acheter des SMS ?",
            answer: "Allez dans 'Gestion des Achats' > 'Acheter des SMS'. Choisissez un pack, suivez les étapes et procédez au paiement sécurisé."
          },
          {
            question: "Quels sont les modes de paiement ?",
            answer: "Nous acceptons les cartes bancaires, PayPal et les virements bancaires. Tous les paiements sont sécurisés par SSL."
          },
          {
            question: "Les abonnements, c'est quoi ?",
            answer: "Les abonnements vous donnent un crédit SMS mensuel à prix réduit. Vous pouvez essayer gratuitement pendant 30 jours !"
          }
        ]
      },

      // Questions sur l'historique
      history: {
        keywords: ['historique', 'voir', 'envoyés', 'passé', 'archive', 'statut'],
        responses: [
          {
            question: "Où voir mes SMS envoyés ?",
            answer: "L'onglet 'Historique' affiche tous vos SMS envoyés avec leur statut (délivré, échoué, en attente). Vous pouvez filtrer et exporter les données."
          },
          {
            question: "Comment filtrer l'historique ?",
            answer: "Cliquez sur 'Filtrer' dans l'onglet Historique. Vous pouvez filtrer par type, statut, numéro ou contenu du message."
          },
          {
            question: "Puis-je exporter l'historique ?",
            answer: "Oui ! Cliquez sur 'Exporter' dans l'historique pour télécharger vos données au format CSV ou Excel."
          }
        ]
      },

      // Questions techniques
      technical: {
        keywords: ['problème', 'erreur', 'bug', 'marche pas', 'fonctionne pas', 'aide'],
        responses: [
          {
            question: "Mon SMS n'est pas arrivé",
            answer: "Vérifiez le statut dans l'Historique. Si le SMS est en 'échec', vérifiez le numéro (format international). Votre solde doit aussi être suffisant."
          },
          {
            question: "Le site est lent/ne répond pas",
            answer: "Essayez de rafraîchir la page (F5). Si le problème persiste, vérifiez votre connexion internet ou contactez le support technique."
          },
          {
            question: "J'ai oublié mon mot de passe",
            answer: "Utilisez le lien 'Mot de passe oublié' sur la page de connexion. Un email de réinitialisation vous sera envoyé."
          }
        ]
      },

      // Informations générales
      general: {
        keywords: ['jdc', 'service', 'qui', 'quoi', 'information', 'contact'],
        responses: [
          {
            question: "C'est quoi JDC SMS ?",
            answer: "JDC SMS est une plateforme d'envoi de SMS professionnelle. Elle permet d'envoyer des SMS simples, des tokens d'authentification et des envois groupés."
          },
          {
            question: "Comment contacter le support ?",
            answer: "Pour toute question, vous pouvez nous contacter par email à support@jdc.com ou utiliser ce chatbot pour obtenir de l'aide instantanée."
          }
        ]
      }
    };
  }

  createChatbotUI() {
    const html = `
      <div class="chatbot-container">
        <button class="chatbot-toggle" id="chatbot-toggle">
          <i class="fas fa-comments"></i>
          <span class="chatbot-badge" id="chatbot-badge" style="display: none;">1</span>
        </button>
        
        <div class="chatbot-window" id="chatbot-window">
          <div class="chatbot-header">
            <div class="chatbot-avatar">
              <i class="fas fa-robot"></i>
            </div>
            <div class="chatbot-info">
              <h3>Assistant JDC</h3>
              <p>Ici pour vous aider 24/7</p>
            </div>
          </div>
          
          <div class="chatbot-messages" id="chatbot-messages">
            <!-- Messages will be added here -->
          </div>
          
          <div class="chatbot-input-area">
            <input 
              type="text" 
              class="chatbot-input" 
              id="chatbot-input" 
              placeholder="Posez votre question..."
              autocomplete="off"
            >
            <button class="chatbot-send-btn" id="chatbot-send">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  attachEventListeners() {
    const toggle = document.getElementById('chatbot-toggle');
    const sendBtn = document.getElementById('chatbot-send');
    const input = document.getElementById('chatbot-input');

    toggle.addEventListener('click', () => this.toggleChatbot());
    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  toggleChatbot() {
    this.isOpen = !this.isOpen;
    const window = document.getElementById('chatbot-window');
    const toggle = document.getElementById('chatbot-toggle');
    const badge = document.getElementById('chatbot-badge');

    if (this.isOpen) {
      window.classList.add('active');
      toggle.classList.add('active');
      toggle.innerHTML = '<i class="fas fa-times"></i>';
      badge.style.display = 'none';
      this.scrollToBottom();
    } else {
      window.classList.remove('active');
      toggle.classList.remove('active');
      toggle.innerHTML = '<i class="fas fa-comments"></i>';
    }
  }

  loadWelcomeMessage() {
    setTimeout(() => {
      this.addBotMessage(
        "👋 Bonjour ! Je suis l'assistant virtuel JDC. Comment puis-je vous aider aujourd'hui ?",
        [
          { text: "📱 Envoyer un SMS", action: "sms_help" },
          { text: "💳 Acheter des crédits", action: "billing_help" },
          { text: "📊 Voir l'historique", action: "history_help" },
          { text: "❓ Autre question", action: "general_help" }
        ]
      );
    }, 500);
  }

  sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();

    if (!message) return;

    this.addUserMessage(message);
    input.value = '';

    // Simule le "typing"
    this.showTyping();

    setTimeout(() => {
      this.hideTyping();
      this.processMessage(message);
    }, 1000 + Math.random() * 1000);
  }

  processMessage(message) {
    const messageLower = message.toLowerCase();
    let bestMatch = null;
    let maxScore = 0;

    // Cherche la meilleure correspondance dans la base de connaissances
    for (const [category, data] of Object.entries(this.knowledgeBase)) {
      const score = data.keywords.reduce((acc, keyword) => {
        return acc + (messageLower.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        bestMatch = data.responses;
      }
    }

    if (maxScore > 0 && bestMatch) {
      // Trouve la réponse la plus pertinente
      const response = bestMatch[Math.floor(Math.random() * bestMatch.length)];
      this.addBotMessage(
        `<strong>${response.question}</strong><br><br>${response.answer}`,
        this.getContextualQuickReplies(messageLower)
      );
    } else {
      // Message par défaut si aucune correspondance
      this.addBotMessage(
        "Je ne suis pas sûr de comprendre votre question. Voici quelques sujets sur lesquels je peux vous aider :",
        [
          { text: "📱 SMS & Envois", action: "sms_help" },
          { text: "🔐 Tokens", action: "token_help" },
          { text: "📤 Envoi groupé", action: "bulk_help" },
          { text: "⏰ Planification", action: "schedule_help" },
          { text: "💳 Facturation", action: "billing_help" },
          { text: "🧑‍💻 Support technique", action: "support" }
        ]
      );
    }
  }

  getContextualQuickReplies(message) {
    const replies = [];

    if (message.includes('sms') || message.includes('envoyer')) {
      replies.push({ text: "💬 Format du numéro", action: "phone_format" });
      replies.push({ text: "📊 Voir historique", action: "go_history" });
    }

    if (message.includes('crédit') || message.includes('solde') || message.includes('acheter')) {
      replies.push({ text: "💳 Acheter maintenant", action: "go_billing" });
      replies.push({ text: "📋 Voir mon solde", action: "check_balance" });
    }

    replies.push({ text: "❓ Autre question", action: "general_help" });

    return replies;
  }

  handleQuickReply(action) {
    const actions = {
      sms_help: () => this.processMessage("comment envoyer un sms"),
      token_help: () => this.processMessage("comment envoyer un token"),
      bulk_help: () => this.processMessage("comment faire un envoi groupé"),
      schedule_help: () => this.processMessage("comment planifier un sms"),
      billing_help: () => this.processMessage("comment acheter des sms"),
      history_help: () => this.processMessage("où voir mes sms envoyés"),
      general_help: () => this.processMessage("aide générale"),
      support: () => {
        this.addBotMessage(
          "📞 Pour contacter notre support technique :<br><br>" +
          "📧 Email: support@jdc.com<br>" +
          "📱 Téléphone: +33 1 23 45 67 89<br>" +
          "⏰ Disponible 24/7"
        );
      },
      phone_format: () => {
        this.addBotMessage(
          "Le numéro de téléphone doit être au format international :<br><br>" +
          "✅ Correct: +33612345678<br>" +
          "❌ Incorrect: 0612345678<br><br>" +
          "N'oubliez pas le + au début !"
        );
      },
      go_history: () => {
        window.showTab('history-tab');
        this.addBotMessage("Je vous ai redirigé vers l'historique des envois 📊");
      },
      go_billing: () => {
        window.showTab('billing-tab');
        this.addBotMessage("Je vous ai redirigé vers la page d'achat de crédits SMS 💳");
      },
      check_balance: () => {
        const balance = document.getElementById('billing-balance')?.textContent || '0';
        this.addBotMessage(
          `Votre solde actuel est de <strong>${balance} SMS</strong> 📱<br><br>` +
          "Besoin de recharger ? Visitez l'onglet 'Gestion des Achats'."
        );
      }
    };

    if (actions[action]) {
      actions[action]();
    }
  }

  addUserMessage(text) {
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    const html = `
      <div class="chatbot-message user">
        <div class="message-content">
          ${text}
          <div class="message-time">${time}</div>
        </div>
      </div>
    `;

    const messagesContainer = document.getElementById('chatbot-messages');
    messagesContainer.insertAdjacentHTML('beforeend', html);
    this.scrollToBottom();
  }

  addBotMessage(text, quickReplies = []) {
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    let quickRepliesHtml = '';
    if (quickReplies.length > 0) {
      quickRepliesHtml = '<div class="chatbot-quick-replies">';
      quickReplies.forEach(reply => {
        quickRepliesHtml += `
          <button class="quick-reply-btn" data-action="${reply.action}">
            ${reply.text}
          </button>
        `;
      });
      quickRepliesHtml += '</div>';
    }

    const html = `
      <div class="chatbot-message bot">
        <div class="message-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
          ${text}
          <div class="message-time">${time}</div>
          ${quickRepliesHtml}
        </div>
      </div>
    `;

    const messagesContainer = document.getElementById('chatbot-messages');
    messagesContainer.insertAdjacentHTML('beforeend', html);

    // Attache les événements aux boutons de réponse rapide
    if (quickReplies.length > 0) {
      const buttons = messagesContainer.querySelectorAll('.quick-reply-btn[data-action]');
      buttons.forEach(btn => {
        if (!btn.hasAttribute('data-listener')) {
          btn.setAttribute('data-listener', 'true');
          btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            this.handleQuickReply(action);
          });
        }
      });
    }

    this.scrollToBottom();
  }

  showTyping() {
    const html = `
      <div class="chatbot-typing" id="chatbot-typing">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;

    const messagesContainer = document.getElementById('chatbot-messages');
    messagesContainer.insertAdjacentHTML('beforeend', html);
    this.scrollToBottom();
  }

  hideTyping() {
    const typing = document.getElementById('chatbot-typing');
    if (typing) typing.remove();
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('chatbot-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Initialise le chatbot au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  window.chatbot = new ChatbotAssistant();
});
