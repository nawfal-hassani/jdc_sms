const express = require('express');
const router = express.Router();

// Configuration de l'IA (Google Gemini - Gratuit)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Contexte métier JDC pour l'IA
const JDC_CONTEXT = `
Tu es l'assistant virtuel de JDC SMS, une plateforme professionnelle d'envoi de SMS.

INFORMATIONS IMPORTANTES SUR JDC :

1. SERVICES OFFERTS :
   - Envoi de SMS simples
   - Envoi de tokens d'authentification (codes OTP)
   - Envoi groupé de SMS (via fichier CSV/Excel)
   - Planification d'envois SMS
   - Historique détaillé des envois
   - Achats de packs SMS et abonnements

2. NOS AGENCES (4 en Occitanie) :
   - TOULOUSE : Parc d'Activité du Cassé 1, 14 rue du Cassé, 31240 ST JEAN
     Tel: 05 62 89 33 44, Email: contact@jdcoccitanie.fr
   - MONTPELLIER : 113 rue Emile Julien, 34070 MONTPELLIER
     Tel: 04 67 20 21 84, Email: contact@jdclr.com
   - PERPIGNAN : 1420 Avenue de la Salanque, 66000 PERPIGNAN
     Tel: 04 68 50 23 33, Email: contact@jdcoccitanie.fr
   - RODEZ : 57 Av. de Rodez, 12450 LUC-LA-PRIMAUBE
     Tel: 05 62 89 33 44, Email: contact@jdcoccitanie.fr
   
   Horaires : Lun-Ven 8h30-12h30, 14h-18h (Fermé le weekend)

3. INFORMATIONS TECHNIQUES :
   - Format téléphone : International (+33612345678)
   - 1 SMS = 160 caractères
   - Fichiers acceptés : CSV, Excel (.xlsx, .xls)
   - Colonnes requises : "phone" et "message"
   - Paiements : Carte bancaire, PayPal, Virement
   - Service en ligne 24/7

INSTRUCTIONS :
- Réponds de manière concise et professionnelle
- Utilise des emojis avec parcimonie (📱 💳 🏢 ⏰)
- Si question sur facturation, encourage l'achat de packs
- Si problème technique, suggère de contacter le support
- Donne toujours des réponses précises basées sur ces informations
`;

// Route pour le chat avec l'IA
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Si pas de clé API Gemini, utiliser le mode de base
    if (!GEMINI_API_KEY) {
      return res.json({
        response: "Je suis en mode de base. Pour activer l'IA avancée, ajoutez une clé API Gemini gratuite dans le fichier .env.\n\nObtenez votre clé sur : https://makersuite.google.com/app/apikey",
        source: 'fallback'
      });
    }

    // Construire l'historique de conversation pour le contexte
    const conversationHistory = history.slice(-5).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    // Appel à l'API Google Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: JDC_CONTEXT }]
          },
          ...conversationHistory,
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur API Gemini:', errorData);
      
      // Fallback si erreur API
      return res.json({
        response: "Désolé, je rencontre un problème technique. Voici quelques liens utiles :\n\n📱 Envoi SMS : Onglet 'Envoyer un SMS'\n💳 Achats : Onglet 'Gestion des Achats'\n📊 Historique : Onglet 'Historique'\n\nPour une assistance immédiate : contact@jdcoccitanie.fr",
        source: 'fallback'
      });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Désolé, je n\'ai pas pu générer une réponse.';

    res.json({
      response: aiResponse,
      source: 'gemini'
    });

  } catch (error) {
    console.error('Erreur chatbot:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      response: "Une erreur s'est produite. Veuillez réessayer ou contacter le support : contact@jdcoccitanie.fr"
    });
  }
});

// Route pour obtenir le statut de l'IA
router.get('/status', (req, res) => {
  res.json({
    aiEnabled: !!GEMINI_API_KEY,
    provider: GEMINI_API_KEY ? 'Google Gemini' : 'None',
    mode: GEMINI_API_KEY ? 'AI-powered' : 'Basic knowledge base'
  });
});

module.exports = router;
