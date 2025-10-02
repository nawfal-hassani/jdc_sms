import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const client = twilio(accountSid, authToken);

/**
 * Envoie un SMS au numéro spécifié
 * @param {string} to - Numéro de téléphone du destinataire au format international
 * @param {string} message - Contenu du message à envoyer
 * @returns {Promise} - Réponse de l'API Twilio
 */
export async function sendSms(to, message) {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to,
    });
    console.log(`SMS envoyé avec succès, SID: ${result.sid}`);
    return result;
  } catch (error) {
    console.error(`Erreur d'envoi SMS: ${error.message}`);
    throw error;
  }
}

/**
 * Envoie un token par SMS
 * @param {string} to - Numéro de téléphone du destinataire
 * @param {string} token - Token à envoyer
 * @returns {Promise} - Réponse de l'API Twilio
 */
export async function sendToken(to, token) {
  const message = `Votre code d'authentification JDC est: ${token}`;
  return sendSms(to, message);
}
