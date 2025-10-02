import { Router } from "express";
import { sendSms, sendTokenBySms } from "../services/smsProvider.js";

const router = Router();

/**
 * Route pour envoyer un SMS
 */
router.post("/send-sms", async (req, res) => {
  try {
    const { to, message } = req.body;
    
    const result = await sendSms(to, message);
    const timestamp = new Date().toISOString();
    
    res.json({
      success: true,
      message: `SMS envoyé avec succès à ${to}`,
      result,
      timestamp
    });
  } catch (error) {
    console.error(`Erreur route /send-sms: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Route pour envoyer un token par SMS
 */
router.post("/send-token-by-sms", async (req, res) => {
  try {
    const { phoneNumber, token } = req.body;
    
    // Validation basique
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: "Numéro de téléphone requis" 
      });
    }

    // Envoi du token (utilise celui fourni ou en génère un si non fourni)
    const result = await sendTokenBySms(phoneNumber, token);
    
    res.json({
      success: true,
      message: `Token envoyé par SMS à ${phoneNumber}`,
      ...result
    });
  } catch (error) {
    console.error(`Erreur: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Route pour vérifier l'état du service
 */
router.get("/check", (req, res) => {
  res.json({
    status: "operational",
    service: "SMS Service JDC",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

export default router;
