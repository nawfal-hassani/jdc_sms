import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import smsRoutes from "./routes/sms.js";

// Chargement des variables d'environnement
dotenv.config();

const app = express();

// Middleware pour parser le JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Activation de CORS pour permettre les requêtes depuis d'autres domaines
app.use(cors());

// Servir les fichiers statiques du dossier public
app.use(express.static("public"));

// Routes de l'API
app.use("/api", smsRoutes);

// Route par défaut
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "./public" });
});

// Gestionnaire d'erreur 404 pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route non trouvée" });
});

export default app;
