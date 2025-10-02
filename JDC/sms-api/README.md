# SMS API

API pour récupérer un token d'authentification et l'envoyer par SMS.

## Fonctionnalités

- ✅ Récupération de token depuis une API externe
- ✅ Envoi de SMS via Twilio ou autre fournisseur
- ✅ Combinaison des deux : récupération + envoi de token par SMS

## Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn
- Compte Twilio ou autre fournisseur SMS

## Installation

1. Cloner le dépôt
```bash
git clone <votre-repo-git>
cd sms-api
```

2. Installer les dépendances
```bash
npm install
```

3. Configuration
   - Copier le fichier `.env.example` en `.env` (s'il existe)
   - Remplir les variables d'environnement avec vos informations

## Structure du projet

```
sms-api/
│
├── src/
│   ├── routes/
│   │   └── sms.js         # Définition des routes (ex: /send-sms)
│   ├── services/
│   │   └── smsProvider.js # Logique d'envoi (Twilio, OVH, etc.)
│   ├── app.js             # Configuration de l'app Express
│   └── server.js          # Point d'entrée (lance le serveur)
│
├── .env                   # Variables d'environnement (API keys)
├── package.json
└── README.md
```

## Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## API Endpoints

### GET /api/status
Vérifier que l'API est en ligne.

### POST /api/send-sms
Envoyer un SMS simple.

**Corps de la requête:**
```json
{
  "to": "+33612345678",
  "message": "Votre message ici"
}
```

### POST /api/get-token
Récupérer un token d'authentification.

**Corps de la requête (optionnel):**
```json
{
  "apiUrl": "https://exemple.com/auth",
  "username": "utilisateur",
  "password": "motdepasse"
}
```

### POST /api/send-token-by-sms
Récupérer un token et l'envoyer par SMS.

**Corps de la requête:**
```json
{
  "phoneNumber": "+33612345678",
  "apiUrl": "https://exemple.com/auth", // optionnel
  "credentials": {
    "username": "utilisateur",
    "password": "motdepasse"
  }, // optionnel
  "messagePrefix": "Votre code est: ", // optionnel
  "hideToken": true // optionnel
}
```

## Variables d'environnement

```
# Configuration du serveur
PORT=3000

# API d'authentification
AUTH_API_URL=https://exemple.com/api/auth
AUTH_USERNAME=votre_nom_utilisateur
AUTH_PASSWORD=votre_mot_de_passe

# Twilio (si utilisé)
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token
TWILIO_PHONE=+33XXXXXXXXX

# Autre fournisseur SMS (si utilisé)
SMS_API_URL=https://api.service-sms.com/send
SMS_API_KEY=your_api_key
```

## Déploiement

Cette API peut être facilement déployée sur:
- Heroku
- Render
- Railway
- AWS Elastic Beanstalk
- DigitalOcean App Platform

## Sécurité

⚠️ Ne jamais exposer vos clés API dans le code source.
⚠️ Utilisez HTTPS en production.
⚠️ Pensez à implémenter une authentification pour l'API en production.
