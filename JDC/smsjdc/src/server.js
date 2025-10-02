import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur SMSJDC démarré sur le port ${PORT}`);
  console.log(`📱 Interface web accessible sur http://localhost:${PORT}`);
  console.log(`🔌 API accessible sur http://localhost:${PORT}/api`);
});
