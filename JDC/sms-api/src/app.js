import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import smsRoutes from "./routes/sms.js";

// Chargement des variables d'environnement
dotenv.config();

const app = express();

// Configuration des middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Routes publiques
app.use("/api/status", (req, res) => {
  res.json({
    status: "online",
    service: "SMS API",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Désactiver l'authentification - accès direct aux routes
app.use("/api", smsRoutes);

// Route par défaut
app.get("/", (req, res) => {
  res.json({
    message: "API SMS de JDC Longdoc",
    endpoints: {
      status: "/api/status",
      sendSms: "/api/send-sms",
      sendTokenBySms: "/api/send-token-by-sms",
      check: "/api/check"
    }
  });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Erreur serveur",
    message: err.message
  });
});

// Middleware pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route non trouvée"
  });
});

export default app;
