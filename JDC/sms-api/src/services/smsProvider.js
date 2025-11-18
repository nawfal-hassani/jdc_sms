import dotenv from "dotenv";

dotenv.config();

// Configuration Twilio (obligatoire)
const twilio = await import("twilio");
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;

if (!accountSid || !authToken) {
  throw new Error("ERREUR: TWILIO_SID et TWILIO_TOKEN doivent être configurés dans le fichier .env");
}

const twilioClient = twilio.default(accountSid, authToken);
console.log("✅ Twilio configuré avec succès");
console.log("Mode de fonctionnement: PRODUCTION");

/**
 * Envoie un SMS via Twilio ou simule l'envoi si Twilio n'est pas configuré
 * @param {string} to - Numéro de téléphone du destinataire
 * @param {string} message - Contenu du SMS
 * @returns {Promise} - Résultat de l'envoi
 */
async function sendSmsViaTwilio(to, message) {
  // Utiliser le message par défaut si aucun message n'est fourni
  if (!message || message.trim() === '') {
    message = "Votre commande est prête à être récupérée";
    console.log("Message vide détecté, utilisation du message par défaut");
  }
  
  try {
    // Ajouter la signature d'entreprise
    if (!message.includes("JDC")) {
      message = `${message}\n- JDC Longdoc`;
    }
    
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: to
    });

    console.log(`SMS envoyé avec Twilio: ${result.sid}`);
    return { 
      success: true, 
      sid: result.sid,
      timestamp: new Date().toISOString() 
    };
  } catch (error) {
    console.error(`Erreur Twilio: ${error.message}`);
    throw error;
  }
}

/**
 * Envoie un SMS en utilisant Twilio
 * @param {string} to - Numéro de téléphone du destinataire
 * @param {string} message - Contenu du SMS
 * @returns {Promise} - Résultat de l'envoi
 */
export async function sendSms(to, message) {
  // Valeurs par défaut
  if (!to || to.trim() === '') {
    throw new Error("Numéro de téléphone requis");
  }
  
  if (!message || message.trim() === '') {
    message = 'Votre commande est prête à être récupérée';
  }
  
  // Vérification basique du format du numéro
  if (!to.match(/^\+[1-9]\d{1,14}$/)) {
    throw new Error("Format de numéro invalide. Utilisez le format international (ex: +33612345678)");
  }

  // Envoi du SMS
  return sendSmsViaTwilio(to, message);
}

/**
 * Génère un token aléatoire de 6 chiffres
 * @returns {string} - Token généré
 */
export function generateToken() {
  // Génère un token de 6 chiffres
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Envoie un token par SMS
 * @param {string} phoneNumber - Numéro de téléphone du destinataire
 * @param {string} userToken - Token fourni par l'utilisateur (optionnel)
 * @returns {Promise} - Résultat de l'opération
 */
export async function sendTokenBySms(phoneNumber, userToken) {
  try {
    // Utilise le token fourni par l'utilisateur ou génère un nouveau token
    const token = userToken && userToken.trim() ? userToken.trim() : generateToken();
    
    // Prépare et envoie le message
    const message = `Votre code d'authentification JDC est: ${token}`;
    const result = await sendSms(phoneNumber, message);
    
    return {
      success: true,
      token: "******", // Masquer le token par sécurité
      sms: result
    };
  } catch (error) {
    console.error(`Erreur lors de l'envoi du token: ${error.message}`);
    throw error;
  }
}
