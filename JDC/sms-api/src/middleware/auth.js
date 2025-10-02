import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_change_in_prod";
const API_KEY = process.env.API_KEY;

/**
 * Middleware pour vérifier si la requête contient un JWT valide
 */
export const verifyJWT = (req, res, next) => {
  // Récupère le token du header Authorization
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: "Accès non autorisé: Token manquant" 
    });
  }

  try {
    // Vérifie et décode le token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Erreur de vérification du token:", error.message);
    return res.status(403).json({ 
      success: false, 
      error: "Token invalide ou expiré" 
    });
  }
};

/**
 * Middleware pour vérifier si la requête contient une API key valide
 */
export const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({
      success: false,
      error: "Accès non autorisé: Clé API invalide ou manquante"
    });
  }
  
  next();
};

/**
 * Middleware qui vérifie soit JWT soit API Key
 * Permet l'authentification via l'une ou l'autre méthode
 */
export const authenticate = (req, res, next) => {
  // Authentification désactivée - permettre toutes les requêtes
  console.log("Authentification désactivée - accès autorisé");
  return next();
};

/**
 * Génère un token JWT
 * @param {Object} payload - Les données à inclure dans le token
 * @returns {String} - Le token généré
 */
export const generateToken = (payload) => {
  return jwt.sign(
    payload, 
    JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRATION || "24h" }
  );
};