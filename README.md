<div align="center">
  <img src="JDC/smsjdc/public/assets/JDC-Occitanie.png" alt="JDC Occitanie Logo" width="200"/>
  
  # 🏢 JDC Test - Écosystème SMS Complet
  
  ### Plateforme complète de gestion d'envoi de SMS pour entreprises
  
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
  [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/nawfal-hassani/jdc_test-/graphs/commit-activity)
  
</div>

---

## 🌟 Vue d'ensemble

**JDC Test** est un écosystème complet pour la gestion d'envoi de SMS en masse. Il comprend :
- 📱 **Dashboard Web** - Interface moderne pour gérer vos campagnes SMS
- 🔌 **API REST** - Backend pour l'envoi de SMS via différents providers
- 🔑 **Service Token** - Génération et envoi de tokens d'authentification

Ce projet est développé par **JDC Occitanie** pour offrir une solution professionnelle, sécurisée et évolutive.

---

## 📦 Composants du projet

### 1️⃣ [📱 Dashboard SMS](/JDC/smsjdc)

Interface web complète pour gérer vos SMS :

**Fonctionnalités principales :**
- ✨ Envoi de SMS unitaire et en masse
- 📊 Dashboard avec analytics en temps réel
- 📅 Planification d'envois
- 💳 Paiement intégré (Stripe)
- 🔐 Authentification JWT (Admin/Utilisateur)
- 📂 Import CSV/Excel pour envoi groupé
- 📈 Historique et statistiques détaillées

**Technologies :** Node.js, Express, Socket.io, Chart.js, Stripe

👉 **[Voir la documentation complète du Dashboard →](/JDC/smsjdc/README.md)**

---

### 2️⃣ [🔌 API SMS](/JDC/sms-api)

API REST pour l'envoi de SMS via différents providers :

**Fonctionnalités :**
- 📤 Envoi de SMS via Orange API, Twilio, etc.
- 🔄 Gestion des providers multiples
- 📊 Suivi des envois et webhooks
- 🔒 Authentification par clé API
- 📝 Swagger documentation

**Technologies :** Node.js, Express, Axios

👉 **[Voir la documentation de l'API →](/JDC/sms-api/README.md)**

---

### 3️⃣ [🔑 Service Token](/JDC/token_sms_app)

Service Python pour la génération et l'envoi de tokens d'authentification :

**Fonctionnalités :**
- 🎲 Génération de tokens aléatoires sécurisés
- 📨 Envoi via SMS
- ⏱️ Gestion de l'expiration
- 🔐 Validation de tokens

**Technologies :** Python, Flask

👉 **[Voir la documentation du Service Token →](/JDC/token_sms_app/README.md)**

---

## 🚀 Quick Start - Démarrage rapide

### Prérequis

- **Node.js** >= 14.0.0
- **Python** >= 3.8 (pour le service token)
- **npm** ou **yarn**
- Clés API SMS (Orange, Twilio, etc.)

### Installation complète

```bash
# 1. Cloner le repository
git clone https://github.com/nawfal-hassani/jdc_test-.git
cd jdc_test-

# 2. Installer les dépendances de l'API SMS
cd JDC/sms-api
npm install
cp .env.example .env
# Éditer .env avec vos clés API

# 3. Installer les dépendances du Dashboard
cd ../smsjdc
npm install
cp .env.example .env
# Éditer .env avec vos configurations

# 4. (Optionnel) Installer le service Token
cd ../token_sms_app
pip install -r requirements.txt
cp .env.example .env
```

### Lancement

```bash
# Terminal 1 : Démarrer l'API SMS
cd JDC/sms-api
npm start
# → http://localhost:3000

# Terminal 2 : Démarrer le Dashboard
cd JDC/smsjdc
npm start
# → http://localhost:3030

# Terminal 3 : (Optionnel) Démarrer le service Token
cd JDC/token_sms_app
python main.py
# → http://localhost:5000
```

---

## 📁 Structure du projet

```
jdc_test-/
├── 📁 JDC/
│   ├── 📁 smsjdc/              # 📱 Dashboard SMS Web
│   │   ├── public/             # Frontend (HTML/CSS/JS)
│   │   ├── src/                # Backend Node.js
│   │   ├── data/               # Données JSON (historique, users)
│   │   ├── server.js           # Point d'entrée
│   │   ├── package.json
│   │   └── README.md           # 👈 Documentation complète
│   │
│   ├── 📁 sms-api/             # 🔌 API REST SMS
│   │   ├── src/                # Code source API
│   │   ├── tests/              # Tests unitaires
│   │   ├── server.js
│   │   ├── package.json
│   │   └── README.md           # 👈 Documentation API
│   │
│   └── 📁 token_sms_app/       # 🔑 Service Token Python
│       ├── main.py             # Point d'entrée Flask
│       ├── requirements.txt
│       └── README.md           # 👈 Documentation Token
│
├── .gitignore
├── LICENSE
└── README.md                   # 👈 Vous êtes ici
```

---

## 🎯 Architecture globale

```
┌─────────────────┐
│   Utilisateur   │
│   (Navigateur)  │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────────────┐
│  📱 Dashboard SMS       │
│  (Node.js + Express)    │
│  Port: 3030             │
└──────────┬──────────────┘
           │
           │ API REST
           ▼
┌─────────────────────────┐       ┌──────────────────┐
│  🔌 API SMS             │──────▶│  Provider SMS    │
│  (Node.js + Express)    │       │  (Orange, Twilio)│
│  Port: 3000             │       └──────────────────┘
└──────────┬──────────────┘
           │
           │ HTTP Request
           ▼
┌─────────────────────────┐
│  🔑 Service Token       │
│  (Python + Flask)       │
│  Port: 5000             │
└─────────────────────────┘
```

---

## 🔐 Sécurité

- **Authentification JWT** : Tokens sécurisés pour le dashboard
- **Rate limiting** : Protection contre les abus
- **Helmet.js** : Sécurisation des headers HTTP
- **Validation des inputs** : express-validator
- **CORS** : Configuration stricte
- **Variables d'environnement** : Clés sensibles dans .env

---

## 💳 Paiement & Facturation

Le dashboard intègre **Stripe** pour :
- Achat de packs SMS (100, 500, 1000, 5000, 10000)
- Abonnements mensuels
- Gestion des factures
- Alertes de crédit bas

---

## 📊 Fonctionnalités avancées

### Dashboard SMS
- 📈 **Analytics** : Graphiques Chart.js avec statistiques détaillées
- 🔔 **Notifications temps réel** : Socket.io pour les mises à jour live
- 📅 **Planification** : Envoi différé avec calendrier
- 📤 **Envoi groupé** : Upload CSV/Excel avec validation
- 🌍 **Support international** : intl-tel-input pour tous les pays
- 🎨 **Thèmes** : Mode clair/sombre personnalisable

### API SMS
- 🔄 **Multi-provider** : Support de plusieurs fournisseurs SMS
- 📊 **Webhooks** : Notifications de statut d'envoi
- 🔑 **Authentication** : Clés API sécurisées
- 📝 **Swagger** : Documentation interactive

---

## 🧪 Tests

```bash
# Tests du Dashboard
cd JDC/smsjdc
npm test

# Tests de l'API
cd JDC/sms-api
npm test

# Tests du service Token
cd JDC/token_sms_app
python -m pytest
```

---

## 🚢 Déploiement

### Déploiement rapide sur Heroku

```bash
# Dashboard
cd JDC/smsjdc
heroku create jdc-sms-dashboard
git push heroku main

# API SMS
cd JDC/sms-api
heroku create jdc-sms-api
git push heroku main
```

### Docker Compose (recommandé)

```yaml
# docker-compose.yml (à créer)
version: '3.8'
services:
  api:
    build: ./JDC/sms-api
    ports:
      - "3000:3000"
    env_file:
      - ./JDC/sms-api/.env
  
  dashboard:
    build: ./JDC/smsjdc
    ports:
      - "3030:3030"
    depends_on:
      - api
    env_file:
      - ./JDC/smsjdc/.env
  
  token-service:
    build: ./JDC/token_sms_app
    ports:
      - "5000:5000"
    env_file:
      - ./JDC/token_sms_app/.env
```

```bash
docker-compose up -d
```

---

## 🤝 Contributing

Les contributions sont bienvenues ! Consultez le guide de contribution de chaque projet :

- [Dashboard CONTRIBUTING.md](/JDC/smsjdc/CONTRIBUTING.md)
- [API CONTRIBUTING.md](/JDC/sms-api/CONTRIBUTING.md)

### Process de contribution

1. **Fork** le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez (`git commit -m 'feat: Add amazing feature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrez une **Pull Request**

---

## 📜 Licence

Ce projet est sous licence **MIT**. Voir [LICENSE](LICENSE) pour plus de détails.

```
MIT License - Copyright (c) 2025 JDC Occitanie
```

---

## 👥 Auteurs & Contact

### Équipe

- **Nawfal Hassani** - *Lead Developer* - [@nawfal-hassani](https://github.com/nawfal-hassani)
- **JDC Occitanie** - *Organisation*

### Liens

- 🌐 **Site web** : [jdc-occitanie.com](https://jdc-occitanie.com)
- 📧 **Email** : nawfal.hassani@epitech.eu
- 💼 **LinkedIn** : [Nawfal Hassani](https://linkedin.com/in/nawfal-hassani)
- 🐙 **GitHub** : [@nawfal-hassani](https://github.com/nawfal-hassani)
- 📱 **Demo** : [demo.jdc-occitanie.com](https://demo.jdc-occitanie.com) (à venir)

---

## 🐛 Support

Besoin d'aide ?

1. 📖 **Documentation** : Consultez les README de chaque projet
2. 🐛 **Bug** : [Ouvrir une issue](https://github.com/nawfal-hassani/jdc_test-/issues)
3. 💬 **Questions** : [GitHub Discussions](https://github.com/nawfal-hassani/jdc_test-/discussions)
4. 📧 **Email** : support@jdc.com

---

## 🗺️ Roadmap 2026

### Q1 2026
- [ ] Interface mobile (React Native)
- [ ] Chatbot IA intégré
- [ ] Templates SMS personnalisables
- [ ] API GraphQL

### Q2 2026
- [ ] Intégration CRM (Salesforce, HubSpot)
- [ ] Support multilingue (FR/EN/ES/AR)
- [ ] Webhooks personnalisés
- [ ] Statistiques avancées (ML)

### Q3 2026
- [ ] WhatsApp Business API
- [ ] Telegram Bot integration
- [ ] Campagnes marketing automatisées
- [ ] A/B Testing de messages

---

## ⭐ Star History

Si ce projet vous aide, donnez-lui une ⭐ sur GitHub !

[![Star History Chart](https://api.star-history.com/svg?repos=nawfal-hassani/jdc_test-&type=Date)](https://star-history.com/#nawfal-hassani/jdc_test-&Date)

---

## 📚 Documentation détaillée

- 📱 **[Dashboard SMS - Documentation complète →](/JDC/smsjdc/README.md)**
- 🔌 **[API SMS - Documentation API →](/JDC/sms-api/README.md)**
- 🔑 **[Service Token - Documentation →](/JDC/token_sms_app/README.md)**

---

<div align="center">



[⬆ Retour en haut](#-jdc-test---écosystème-sms-complet)

</div>
