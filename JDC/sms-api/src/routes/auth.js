import { Router } from "express";
import { generateToken } from "../middleware/auth.js";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: S'authentifier et obtenir un token JWT
 *     description: Authentifie l'utilisateur et génère un token JWT pour accéder aux endpoints protégés
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Authentification réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Authentification réussie
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: admin
 *       400:
 *         description: Paramètres manquants
 *       401:
 *         description: Identifiants invalides
 *       500:
 *         description: Erreur serveur
 */
router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validation des entrées
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Paramètres manquants: 'username' et 'password' sont requis." 
      });
    }
    
    // En environnement réel, remplacez cette partie par une vérification dans une base de données
    // Ici, nous utilisons les valeurs définies dans le fichier .env à des fins de démonstration
    const validUsername = process.env.AUTH_USERNAME;
    const validPassword = process.env.AUTH_PASSWORD;
    
    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({
        success: false,
        error: "Identifiants invalides"
      });
    }
    
    // Génération du token
    const user = { id: 1, username }; // Dans un environnement réel, récupérez l'utilisateur depuis la BD
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: "Authentification réussie",
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error(`Erreur route /auth/login: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Vérifie la validité d'un token JWT
 *     description: Vérifie si le token fourni est valide et retourne les informations utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token JWT à vérifier
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Résultat de la vérification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *       400:
 *         description: Token manquant
 *       500:
 *         description: Erreur serveur
 */
router.post("/verify", (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token manquant dans la requête"
      });
    }
    
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_change_in_prod";
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({
        success: true,
        valid: true,
        user: decoded
      });
    } catch (err) {
      res.json({
        success: true,
        valid: false,
        error: err.message
      });
    }
  } catch (error) {
    console.error(`Erreur route /auth/verify: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;