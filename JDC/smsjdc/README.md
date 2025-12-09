<div align="center">
  <img src="public/assets/JDC-Occitanie.png" alt="JDC Occitanie Logo" width="200"/>
  
  # 📱 JDC SMS Dashboard
  
  ### Plateforme complète de gestion d'envoi de SMS pour entreprises
  
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
  [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/nawfal-hassani/jdc_test-/graphs/commit-activity)
  
  [Demo](#-demo) • [Installation](#-installation) • [Documentation](#-documentation) • [API](#-api-reference) • [Contribuer](#-contributing)
  
</div>

---

## 🌟 À propos

**JDC SMS Dashboard** est une solution moderne et complète pour gérer l'envoi de SMS en masse, tokens d'authentification, et suivre vos campagnes en temps réel. Conçu pour les entreprises qui ont besoin d'une interface intuitive et puissante pour leurs communications SMS.

### ✨ Fonctionnalités principales

- 🚀 **Envoi de SMS en masse** - Upload CSV/Excel et envoi groupé avec suivi en temps réel
- 🔐 **Authentification robuste** - Système JWT avec rôles (Admin/Utilisateur)
- 📅 **Planification intelligente** - Planifiez vos SMS à l'avance avec calendrier interactif
- 💳 **Paiement intégré** - Achat de crédits SMS via Stripe
- 📊 **Analytics détaillées** - Tableaux de bord avec Chart.js, statistiques en temps réel
- 🎨 **Interface moderne** - Design responsive avec thèmes personnalisables
- 🔔 **Notifications temps réel** - Socket.io pour les mises à jour live
- 🌍 **Support international** - Intl-tel-input pour validation numéros mondiaux
- 📂 **Export avancé** - CSV, Excel, PDF pour vos rapports
- 🔒 **Sécurisé** - Helmet.js, rate-limiting, validation des inputs

---

## 🎯 Cas d'usage

- **Entreprises** : Notifications clients, campagnes marketing, alertes
- **E-commerce** : Confirmations de commande, codes promos, suivi livraison
- **Authentification** : Envoi de codes 2FA, réinitialisation mot de passe
- **Événementiel** : Rappels, invitations, confirmations de présence
- **SaaS** : Alertes système, notifications utilisateurs

---

## 🚀 Quick Start

### Prérequis

- **Node.js** >= 14.0.0
- **npm** ou **yarn**
- Compte **Stripe** (pour les paiements)
- API SMS (fournie séparément dans `/sms-api`)

### Installation

```bash
# 1. Cloner le repository
git clone https://github.com/nawfal-hassani/jdc_test-.git
cd jdc_test-/JDC/smsjdc

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés

# 4. Démarrer le serveur
npm start

# Ou en mode développement avec hot-reload
npm run dev
```

Le dashboard sera accessible sur **http://localhost:3030** 🎉

---

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
# Serveur
PORT=3030                                    # Port du dashboard
NODE_ENV=development                         # development | production

# API SMS
SMS_API_URL=http://localhost:3000/api       # URL de votre API SMS
SMS_API_KEY=votre_cle_api_secrete           # Clé d'authentification API

# Stripe (Paiements)
STRIPE_SECRET_KEY=sk_test_...               # Clé secrète Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...          # Clé publique Stripe
STRIPE_WEBHOOK_SECRET=whsec_...             # Secret webhook Stripe

# Base de données (optionnel)
DATABASE_URL=./data                          # Chemin vers dossier data

# Sécurité
JWT_SECRET=votre_secret_jwt_super_securise  # Secret pour tokens JWT
SESSION_SECRET=votre_secret_session         # Secret pour sessions
```

### Structure du projet

```
smsjdc/
├── 📁 data/                      # Données persistantes (JSON)
│   ├── users.json                # Utilisateurs et comptes
│   ├── sms-history.json          # Historique des envois
│   ├── scheduled-messages.json   # Messages planifiés
│   ├── subscriptions.json        # Abonnements Stripe
│   └── invoices.json             # Factures
├── 📁 public/                    # Frontend statique
│   ├── 📁 assets/                # Images et logos
│   ├── 📁 css/                   # Styles CSS
│   │   ├── style.css             # Styles principaux
│   │   └── 📁 components/        # Styles par composant
│   ├── 📁 js/                    # JavaScript client
│   │   ├── app.js                # Point d'entrée
│   │   ├── 📁 modules/           # Modules (charts, filters)
│   │   ├── 📁 services/          # Services API
│   │   └── 📁 utils/             # Utilitaires
│   ├── index.html                # Dashboard principal
│   ├── login.html                # Page de connexion
│   └── admin.html                # Panel administrateur
├── 📁 src/                       # Backend Node.js
│   ├── 📁 routes/                # Routes Express
│   │   ├── auth.js               # Authentification
│   │   ├── sms.js                # Envoi SMS
│   │   ├── bulkSms.js            # Envoi groupé
│   │   ├── schedule.js           # Planification
│   │   ├── billing.js            # Facturation
│   │   └── stripe.js             # Intégration Stripe
│   ├── 📁 services/              # Logique métier
│   │   ├── api.js                # Client API SMS
│   │   ├── bulkSmsService.js     # Service envoi groupé
│   │   └── userHistoryService.js # Gestion historique
│   ├── 📁 middleware/            # Middlewares Express
│   │   ├── auth.js               # Authentification JWT
│   │   ├── security.js           # Helmet, CORS
│   │   └── error.js              # Gestion erreurs
│   ├── 📁 controllers/           # Contrôleurs
│   │   └── authController.js     # Auth & utilisateurs
│   └── 📁 utils/                 # Utilitaires backend
├── 📁 uploads/                   # Fichiers CSV/Excel uploadés
├── .env.example                  # Template environnement
├── package.json                  # Dépendances npm
├── server.js                     # Point d'entrée serveur
└── README.md                     # Ce fichier
```

---

## 📖 Documentation

### Utilisation

#### 1️⃣ Connexion

Accédez à `http://localhost:3030/login.html` et connectez-vous avec vos identifiants.

**Compte par défaut** (à changer en production) :
- Email : `admin@jdc.com`
- Mot de passe : `admin123`

#### 2️⃣ Envoyer un SMS simple

```javascript
// Via l'interface : Onglet "Envoyer un SMS"
// Ou via API :

fetch('http://localhost:3030/api/send-sms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    to: '+33612345678',
    message: 'Bonjour, ceci est un test !'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

#### 3️⃣ Envoi groupé (Bulk SMS)

1. Préparez un fichier CSV avec les colonnes : `phone`, `message`, `name` (optionnel)
2. Téléchargez un modèle : Onglet **Envoi Groupé** → **Télécharger modèle CSV**
3. Uploadez votre fichier via drag & drop
4. Prévisualisez et lancez l'envoi

**Format CSV attendu :**
```csv
phone,message,name
+33612345678,Bonjour {name} !,Alice
+33698765432,Votre code promo: NOEL25,Bob
```

#### 4️⃣ Planification

1. Onglet **Planification**
2. Sélectionnez date, heure, destinataire, message
3. Cliquez sur **Planifier l'envoi**
4. Le SMS sera envoyé automatiquement à l'heure prévue

#### 5️⃣ Acheter des crédits SMS

1. Onglet **Gestion des Achats**
2. Choisissez un pack SMS
3. Paiement sécurisé via Stripe
4. Crédits ajoutés instantanément

---

## 🔌 API Reference

### Authentification

Toutes les requêtes nécessitent un token JWT dans le header :

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Endpoints principaux

#### 🔐 Authentification

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### 📱 Envoi SMS

```http
POST /api/send-sms
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "to": "+33612345678",
  "message": "Votre message ici"
}

Response:
{
  "success": true,
  "messageId": "msg_abc123",
  "status": "sent",
  "credits": 1
}
```

#### 🔑 Envoi Token

```http
POST /api/send-token
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "to": "+33612345678",
  "token": "123456"
}

Response:
{
  "success": true,
  "messageId": "msg_xyz789",
  "expiresIn": 300
}
```

#### 📤 Envoi Groupé

```http
POST /api/bulk-sms/upload
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

file: [CSV/Excel file]

Response:
{
  "success": true,
  "validCount": 150,
  "invalidCount": 5,
  "preview": [...]
}
```

```http
POST /api/bulk-sms/send
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "data": [...],
  "delay": 1000
}

Response (Stream):
{
  "progress": 50,
  "sent": 75,
  "failed": 2,
  "current": {...}
}
```

#### 📅 Planification

```http
POST /api/schedule
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "phone": "+33612345678",
  "message": "Rappel: RDV demain 14h",
  "scheduledAt": "2025-12-10T14:00:00Z"
}

Response:
{
  "success": true,
  "scheduleId": "sch_abc123",
  "scheduledAt": "2025-12-10T14:00:00Z"
}
```

```http
GET /api/schedule
Authorization: Bearer YOUR_TOKEN

Response:
[
  {
    "id": "sch_abc123",
    "phone": "+33612345678",
    "message": "...",
    "scheduledAt": "2025-12-10T14:00:00Z",
    "status": "pending"
  }
]
```

```http
DELETE /api/schedule/:id
Authorization: Bearer YOUR_TOKEN

Response:
{
  "success": true,
  "message": "Scheduled message deleted"
}
```

#### 📊 Historique

```http
GET /api/history
Authorization: Bearer YOUR_TOKEN

Response:
[
  {
    "id": "msg_123",
    "type": "SMS",
    "to": "+33612345678",
    "message": "...",
    "status": "delivered",
    "sentAt": "2025-12-08T10:30:00Z"
  }
]
```

#### 💳 Stripe / Facturation

```http
POST /api/stripe/create-checkout-session
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "packId": "pack_500"
}

Response:
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

```http
GET /api/billing/balance
Authorization: Bearer YOUR_TOKEN

Response:
{
  "balance": 350,
  "currency": "sms"
}
```

### Codes d'erreur

| Code | Description |
|------|-------------|
| 200  | Succès |
| 201  | Créé avec succès |
| 400  | Requête invalide |
| 401  | Non authentifié |
| 403  | Non autorisé |
| 404  | Ressource introuvable |
| 429  | Trop de requêtes (rate limit) |
| 500  | Erreur serveur |

---

## 🛠️ Technologies utilisées

### Frontend
- **HTML5** / **CSS3** - Interface responsive
- **JavaScript** (Vanilla) - Logique client
- **Chart.js** - Graphiques et analytics
- **Socket.io Client** - Temps réel
- **Intl-tel-input** - Validation téléphone internationale
- **Font Awesome** - Icônes
- **SheetJS (xlsx)** - Lecture fichiers Excel

### Backend
- **Node.js** (>= 14.0.0)
- **Express.js** - Framework web
- **Socket.io** - WebSockets temps réel
- **JWT** - Authentification
- **bcrypt** - Hachage mots de passe
- **Stripe** - Paiements en ligne
- **Multer** - Upload fichiers
- **Helmet** - Sécurité HTTP
- **express-validator** - Validation inputs
- **express-rate-limit** - Protection DDoS
- **Morgan** - Logs HTTP
- **dotenv** - Variables environnement

### Outils
- **nodemon** - Hot-reload développement
- **ESLint** - Linter JavaScript (optionnel)
- **Prettier** - Formatage code (optionnel)

---

## 🧪 Tests

### Lancer les tests

```bash
# Tests unitaires (à venir)
npm test

# Tests d'intégration (à venir)
npm run test:integration

# Coverage (à venir)
npm run test:coverage
```

### Test manuel

1. **Envoi SMS** : Testez avec votre propre numéro
2. **Envoi groupé** : Utilisez le template CSV fourni
3. **Planification** : Planifiez un SMS dans 5 minutes
4. **Paiement Stripe** : Utilisez les cartes de test Stripe :
   - Succès : `4242 4242 4242 4242`
   - Échec : `4000 0000 0000 0002`

---

## 🚢 Déploiement

### Heroku

```bash
# 1. Installer Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Créer une app
heroku create jdc-sms-dashboard

# 4. Configurer les variables
heroku config:set SMS_API_URL=https://your-api.com/api
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set JWT_SECRET=your_super_secret

# 5. Déployer
git push heroku main

# 6. Ouvrir
heroku open
```

### Railway

1. Connectez votre repo GitHub sur [Railway](https://railway.app)
2. Configurez les variables d'environnement
3. Déployez automatiquement

### Docker

```dockerfile
# Dockerfile (à créer)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3030
CMD ["node", "server.js"]
```

```bash
# Build et run
docker build -t jdc-sms-dashboard .
docker run -p 3030:3030 --env-file .env jdc-sms-dashboard
```

---

## 🤝 Contributing

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines.

### Comment contribuer

1. **Fork** le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add: Amazing feature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une **Pull Request**

### Conventions de commit

Nous suivons [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage, point-virgule manquant
- `refactor:` Refactorisation du code
- `test:` Ajout de tests
- `chore:` Tâches de maintenance

---

## 🐛 Bugs & Support

Rencontrez-vous un problème ? Deux options :

1. **Ouvrir une issue** : [GitHub Issues](https://github.com/nawfal-hassani/jdc_test-/issues)
2. **Contacter le support** : support@jdc.com

### Issues connues

- [ ] Tests unitaires à implémenter
- [ ] Documentation API Swagger à générer
- [ ] Support i18n (multilingue) en cours

---

## 📜 Licence

Ce projet est sous licence **MIT**. Consultez le fichier [LICENSE](LICENSE) pour plus de détails.

```
MIT License

Copyright (c) 2025 JDC Occitanie - Nawfal Hassani

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Auteurs & Contact

### Équipe

- **Nawfal Hassani** - *Lead Developer* - [@nawfal-hassani](https://github.com/nawfal-hassani)
- **JDC Occitanie** - *Organisation* - [jdc-occitanie.com](https://jdc-occitanie.com)

### Liens

- 🌐 **Site web** : [jdc-occitanie.com](https://jdc-occitanie.com)
- 📧 **Email** : nawfal.hassani@epitech.eu
- 💼 **LinkedIn** : [Nawfal Hassani](https://linkedin.com/in/nawfal-hassani)
- 🐙 **GitHub** : [@nawfal-hassani](https://github.com/nawfal-hassani)

---

## ⭐ Remerciements

Merci à tous les contributeurs qui ont aidé à construire cette plateforme !

Si ce projet vous aide, n'hésitez pas à lui donner une ⭐ sur GitHub !

---

## 🗺️ Roadmap

### Version 1.1 (Q1 2026)
- [ ] Chatbot IA intégré pour assistance
- [ ] Templates de SMS personnalisables
- [ ] A/B Testing de messages
- [ ] Statistiques avancées (taux d'ouverture, clics)

### Version 1.2 (Q2 2026)
- [ ] API publique documentée (Swagger)
- [ ] Webhooks personnalisés
- [ ] Intégration CRM (Salesforce, HubSpot)
- [ ] Support multilingue (FR/EN/ES/AR)

### Version 2.0 (Q3 2026)
- [ ] Application mobile (React Native)
- [ ] Campagnes automatisées
- [ ] Machine Learning pour optimisation envois
- [ ] WhatsApp & Telegram support

---

<div align="center">
  
  **Fait avec ❤️ par l'équipe JDC Occitanie**
  
  [⬆ Retour en haut](#-jdc-sms-dashboard)
  
</div>
