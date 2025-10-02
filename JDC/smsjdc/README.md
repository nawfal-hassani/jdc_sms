# Dashboard SMS JDC

Un tableau de bord moderne pour gérer et surveiller l'envoi de SMS via l'API SMS JDC. Cette application permet d'envoyer des SMS, des tokens d'authentification et de suivre l'historique des messages envoyés.

## Fonctionnalités

- ✨ Interface utilisateur moderne et responsive
- 📊 Statistiques en temps réel
- 📱 Envoi de SMS et de tokens d'authentification
- 📜 Historique complet des envois
- 🔄 Stockage local pour fonctionnement hors-ligne
- 🌓 Mode sombre / Mode clair
- 🎨 Thèmes de couleurs personnalisables
- ⚙️ Paramètres configurables

## Technologies utilisées

- **Frontend**: HTML5, CSS3, JavaScript pur (sans framework)
- **Backend**: Node.js avec Express.js
- **Stockage**: Fichier JSON local
- **Bibliothèques**:
  - FontAwesome pour les icônes
  - Axios pour les requêtes HTTP

## Structure du projet

```
sms-dashboard/
├── data/                  # Données persistantes
│   └── sms-history.json   # Historique local des SMS
├── public/                # Fichiers statiques
│   ├── assets/            # Images et ressources
│   ├── css/               # Feuilles de style CSS
│   │   ├── components/    # Styles pour les composants spécifiques
│   │   ├── layout/        # Styles de mise en page
│   │   └── themes/        # Thèmes et variables
│   ├── js/                # JavaScript client
│   │   ├── core/          # Fonctionnalités de base et configuration
│   │   ├── modules/       # Modules fonctionnels (graphiques, etc.)
│   │   │   └── charts.js  # Gestion des graphiques du dashboard
│   │   ├── services/      # Services (API, etc.)
│   │   │   └── api-service.js # Communication avec l'API SMS
│   │   ├── utils/         # Fonctions utilitaires
│   │   │   └── formatters.js # Formatage (dates, numéros, etc.)
│   │   └── app.js         # Point d'entrée JavaScript
│   └── index.html         # Page HTML principale
├── .env                   # Variables d'environnement (non commité)
├── package.json           # Dépendances et scripts
├── README.md              # Documentation
└── server.js              # Serveur Express
```

## Installation

1. Cloner le dépôt
```bash
git clone <url-du-repo>
cd sms-dashboard
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
# Créer un fichier .env avec le contenu suivant
PORT=3030
SMS_API_URL=http://localhost:3000/api
```

4. Démarrer le serveur
```bash
node server.js
# Ou avec nodemon pour le développement
nodemon server.js
```

Le dashboard sera accessible à l'adresse [http://localhost:3030](http://localhost:3030)

## Configuration

### Variables d'environnement

| Variable     | Description                    | Valeur par défaut           |
|-------------|--------------------------------|----------------------------|
| PORT        | Port du serveur                | 3030                       |
| SMS_API_URL | URL de l'API SMS               | http://localhost:3000/api  |
| SMS_API_KEY | Clé d'API (optionnelle)        | -                          |

### API SMS

Le dashboard se connecte à l'API SMS qui doit être en cours d'exécution. Assurez-vous que l'API est démarrée avant d'utiliser le dashboard.

Pour démarrer l'API SMS :
```bash
cd ../sms-api
npm start
```

## Utilisation

### Tableau de bord

Le tableau de bord principal affiche les statistiques d'envoi de SMS et l'état de l'API.

### Envoi de SMS

1. Cliquez sur l'onglet "Envoyer un SMS" dans la barre latérale
2. Saisissez le numéro de téléphone au format international (ex: +33612345678)
3. Rédigez votre message
4. Cliquez sur "Envoyer le SMS"

### Envoi de token

1. Cliquez sur l'onglet "Envoyer un Token" dans la barre latérale
2. Saisissez le numéro de téléphone au format international
3. Entrez le token à envoyer
4. Cliquez sur "Envoyer le Token"

### Historique

L'onglet "Historique" affiche tous les SMS et tokens envoyés, avec leur statut et la date d'envoi.

### Paramètres

Dans l'onglet "Paramètres", vous pouvez configurer :
- L'URL de l'API
- La clé API
- Le message par défaut
- Le préfixe de token
- Le thème (clair, sombre ou système)
- La couleur principale de l'interface

## API

Le serveur expose les endpoints suivants :

| Méthode | Endpoint              | Description                     | Paramètres                        |
|---------|----------------------|---------------------------------|-----------------------------------|
| GET     | /api/status          | Vérifier l'état de l'API SMS     | -                                 |
| POST    | /api/send-sms        | Envoyer un SMS                   | `to`: numéro, `message`: texte    |
| POST    | /api/send-token      | Envoyer un token par SMS         | `phoneNumber`: numéro, `token`: code |
| GET     | /api/sms/history     | Récupérer l'historique des SMS   | -                                 |

## Intégration avec d'autres systèmes

Pour intégrer ce dashboard avec d'autres systèmes, utilisez les endpoints REST exposés par le serveur. Les communications se font via JSON et le serveur gère déjà la fusion des données d'historique local avec les données distantes de l'API.

## Développement

### Architecture Modulaire

Le frontend a été restructuré pour suivre une architecture modulaire basée sur les modules ES6 :

#### Modules JavaScript

- **core/** : Fonctionnalités fondamentales et configuration
  - `config.js` : Configuration générale de l'application
  - `theme-manager.js` : Gestion des thèmes (clair/sombre)

- **modules/** : Composants autonomes
  - `charts.js` : Création et gestion des graphiques avec Chart.js

- **services/** : Communication avec les API
  - `api-service.js` : Communication avec l'API SMS

- **utils/** : Fonctions utilitaires
  - `formatters.js` : Formatage des données (dates, numéros, etc.)

#### Utilisation des Modules ES6

```javascript
// Import d'un module
import { initCharts } from './modules/charts.js';

// Utilisation
initCharts();
```

### Modifier le frontend

Le frontend est construit avec JavaScript pur en utilisant des modules ES6 pour plus de légèreté et de maintenabilité :

1. Éditez les fichiers dans leurs dossiers respectifs dans `/public/js/`
2. Assurez-vous d'exporter/importer correctement les fonctions et classes
3. Rafraîchissez le navigateur pour voir les changements

### Modifier le backend

Le backend est un serveur Express simple avec une structure claire :

1. Éditez `server.js` pour modifier les routes ou la logique de traitement
2. Redémarrez le serveur pour appliquer les changements

## Licence

Ce projet est sous licence ISC.