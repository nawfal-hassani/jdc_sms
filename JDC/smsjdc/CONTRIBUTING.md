# 🤝 Guide de Contribution

Merci de votre intérêt pour contribuer à **JDC SMS Dashboard** ! Ce document vous guidera à travers le processus de contribution.

## 📋 Table des matières

- [Code de Conduite](#-code-de-conduite)
- [Comment contribuer](#-comment-contribuer)
- [Configuration de l'environnement](#️-configuration-de-lenvironnement)
- [Standards de code](#-standards-de-code)
- [Processus de Pull Request](#-processus-de-pull-request)
- [Conventions de commit](#-conventions-de-commit)
- [Rapport de bugs](#-rapport-de-bugs)
- [Suggestions de fonctionnalités](#-suggestions-de-fonctionnalités)

---

## 📜 Code de Conduite

Ce projet adhère à un code de conduite. En participant, vous vous engagez à respecter ces règles :

- **Respectueux** : Soyez respectueux envers tous les contributeurs
- **Constructif** : Les critiques doivent être constructives
- **Inclusif** : Accueillir les nouveaux contributeurs
- **Professionnel** : Maintenir un environnement professionnel

---

## 🚀 Comment contribuer

Il existe plusieurs façons de contribuer :

### 1. Signaler un bug 🐛

Si vous trouvez un bug, ouvrez une **issue** avec :
- Description claire du problème
- Étapes pour reproduire
- Comportement attendu vs observé
- Screenshots si applicable
- Environnement (OS, navigateur, version Node.js)

[Créer une issue de bug →](https://github.com/nawfal-hassani/jdc_test-/issues/new?template=bug_report.md)

### 2. Proposer une fonctionnalité ✨

Pour une nouvelle fonctionnalité :
- Ouvrez une **issue** de type "Feature Request"
- Décrivez le besoin et le cas d'usage
- Proposez une solution si possible
- Discutez avec les mainteneurs avant de coder

[Proposer une fonctionnalité →](https://github.com/nawfal-hassani/jdc_test-/issues/new?template=feature_request.md)

### 3. Améliorer la documentation 📝

- Corriger des fautes
- Ajouter des exemples
- Clarifier des sections
- Traduire dans d'autres langues

### 4. Contribuer au code 💻

- Corriger des bugs
- Implémenter des fonctionnalités
- Améliorer les performances
- Écrire des tests

---

## ⚙️ Configuration de l'environnement

### Prérequis

- **Node.js** >= 14.0.0
- **npm** ou **yarn**
- **Git**
- Éditeur de code (VS Code recommandé)

### Fork et Clone

```bash
# 1. Fork le repo sur GitHub (bouton "Fork")

# 2. Cloner votre fork
git clone https://github.com/VOTRE_USERNAME/jdc_test-.git
cd jdc_test-/JDC/smsjdc

# 3. Ajouter l'upstream
git remote add upstream https://github.com/nawfal-hassani/jdc_test-.git

# 4. Installer les dépendances
npm install

# 5. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés de test
```

### Lancer le projet en développement

```bash
# Terminal 1 : Démarrer l'API SMS (si nécessaire)
cd ../sms-api
npm start

# Terminal 2 : Démarrer le dashboard
cd ../smsjdc
npm run dev
```

Accédez à `http://localhost:3030`

---

## 📐 Standards de code

### Style de code

- **Indentation** : 2 espaces (pas de tabs)
- **Quotes** : Simple quotes `'...'` pour JS, double quotes `"..."` pour HTML
- **Semicolons** : Toujours terminer par `;`
- **Nommage** :
  - Variables/fonctions : `camelCase`
  - Constantes : `SCREAMING_SNAKE_CASE`
  - Classes : `PascalCase`
  - Fichiers : `kebab-case.js`

### Exemple de code bien formaté

```javascript
// ✅ Bon
const sendSms = async (phoneNumber, message) => {
  try {
    const response = await apiService.sendSms(phoneNumber, message);
    return response.data;
  } catch (error) {
    console.error('Erreur envoi SMS:', error);
    throw error;
  }
};

// ❌ Mauvais
function send_sms(phone,msg){
return apiService.sendSms(phone,msg).then(res=>res.data).catch(err=>{throw err})
}
```

### Linter (optionnel)

Si vous installez ESLint :

```bash
npm install --save-dev eslint
npx eslint --init
```

Configuration `.eslintrc.json` recommandée :

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"]
  }
}
```

---

## 🔄 Processus de Pull Request

### 1. Créer une branche

```bash
# Toujours partir de main à jour
git checkout main
git pull upstream main

# Créer une branche descriptive
git checkout -b feature/nom-de-la-fonctionnalite
# ou
git checkout -b fix/description-du-bug
```

### 2. Faire vos modifications

- **Un commit = une logique** : Ne pas mélanger plusieurs changements
- **Tester localement** : Vérifier que tout fonctionne
- **Suivre les conventions** : Respecter le style de code

### 3. Committer vos changements

```bash
git add .
git commit -m "feat: ajout fonctionnalité X"
```

Voir [Conventions de commit](#-conventions-de-commit) ci-dessous.

### 4. Pousser vers votre fork

```bash
git push origin feature/nom-de-la-fonctionnalite
```

### 5. Ouvrir une Pull Request

1. Allez sur votre fork sur GitHub
2. Cliquez sur **"Compare & pull request"**
3. Remplissez le template :
   - **Titre clair** : `feat: Ajout de la planification SMS`
   - **Description** : Expliquez QUOI et POURQUOI
   - **Screenshots** : Si changement visuel
   - **Tests** : Indiquer comment tester
4. Liez l'issue correspondante : `Fixes #123`

### 6. Review et ajustements

- Les mainteneurs vont review votre PR
- Répondez aux commentaires
- Faites les modifications demandées
- Une fois approuvé, votre PR sera mergée !

---

## 📝 Conventions de commit

Nous suivons **[Conventional Commits](https://www.conventionalcommits.org/)**.

### Format

```
<type>(<scope>): <subject>

[body optionnel]

[footer optionnel]
```

### Types

| Type | Description | Exemple |
|------|-------------|---------|
| `feat` | Nouvelle fonctionnalité | `feat: ajout planification SMS` |
| `fix` | Correction de bug | `fix: correction affichage historique` |
| `docs` | Documentation seulement | `docs: mise à jour README` |
| `style` | Formatage, espaces, ; | `style: ajout semicolons` |
| `refactor` | Refactoring sans changement fonctionnel | `refactor: simplifier logique envoi` |
| `perf` | Amélioration performance | `perf: optimiser requêtes API` |
| `test` | Ajout/modification tests | `test: ajouter tests unitaires` |
| `build` | Build système, dépendances | `build: mise à jour npm packages` |
| `ci` | CI/CD configuration | `ci: ajout GitHub Actions` |
| `chore` | Tâches maintenance | `chore: nettoyage fichiers` |

### Exemples

```bash
# Bons exemples ✅
git commit -m "feat(bulk-sms): ajout upload fichier Excel"
git commit -m "fix(auth): correction bug déconnexion"
git commit -m "docs: ajout exemples API dans README"
git commit -m "refactor(dashboard): simplifier composant charts"

# Mauvais exemples ❌
git commit -m "update"
git commit -m "fix bug"
git commit -m "WIP"
```

### Scope (optionnel)

Le scope précise le module concerné :
- `auth` - Authentification
- `sms` - Envoi SMS
- `bulk-sms` - Envoi groupé
- `schedule` - Planification
- `billing` - Facturation
- `dashboard` - Interface dashboard
- `api` - Routes API

---

## 🐛 Rapport de bugs

### Avant de rapporter

1. **Chercher** dans les [issues existantes](https://github.com/nawfal-hassani/jdc_test-/issues)
2. **Tester** avec la dernière version
3. **Reproduire** sur une installation propre

### Template de bug report

```markdown
**Description du bug**
Une description claire du problème.

**Étapes pour reproduire**
1. Aller à '...'
2. Cliquer sur '...'
3. Remplir le champ '...'
4. Voir l'erreur

**Comportement attendu**
Ce qui devrait se passer normalement.

**Comportement observé**
Ce qui se passe réellement.

**Screenshots**
Si applicable, ajoutez des captures d'écran.

**Environnement**
- OS: [ex. Ubuntu 22.04]
- Navigateur: [ex. Chrome 120]
- Version Node.js: [ex. 18.17.0]
- Version du projet: [ex. 1.0.0]

**Contexte additionnel**
Toute information supplémentaire utile.
```

---

## 💡 Suggestions de fonctionnalités

### Template de feature request

```markdown
**Fonctionnalité souhaitée**
Une description claire de ce que vous voulez.

**Problème résolu**
Quel problème cette fonctionnalité résout-elle ?

**Solution proposée**
Comment imaginez-vous la solution ?

**Alternatives considérées**
Quelles autres solutions avez-vous envisagées ?

**Contexte additionnel**
Screenshots, mockups, exemples d'autres projets.
```

---

## 🧪 Tests

### Écrire des tests

```bash
# Créer un fichier de test
# Exemple : src/services/__tests__/api.test.js

const apiService = require('../api');

describe('API Service', () => {
  test('sendSms devrait envoyer un SMS', async () => {
    const result = await apiService.sendSms('+33612345678', 'Test');
    expect(result.success).toBe(true);
  });
});
```

### Lancer les tests

```bash
npm test                    # Tous les tests
npm test -- api.test.js     # Test spécifique
npm run test:watch          # Mode watch
npm run test:coverage       # Avec coverage
```

---

## 📦 Releases

Les mainteneurs gèrent les releases via **GitHub Releases**.

### Versioning

Nous suivons [Semantic Versioning](https://semver.org/) :
- **MAJOR** (v2.0.0) : Changements incompatibles
- **MINOR** (v1.1.0) : Nouvelles fonctionnalités compatibles
- **PATCH** (v1.0.1) : Corrections de bugs

---

## 🏆 Reconnaissance

Les contributeurs sont listés dans :
- [Contributors page](https://github.com/nawfal-hassani/jdc_test-/graphs/contributors)
- Section "Remerciements" du README
- Notes de release pour contributions majeures

---

## 📞 Besoin d'aide ?

- 💬 **Discord** : [Rejoindre le serveur](https://discord.gg/jdc) (à venir)
- 📧 **Email** : dev@jdc.com
- 📖 **Documentation** : [Wiki](https://github.com/nawfal-hassani/jdc_test-/wiki)
- 💡 **Discussions** : [GitHub Discussions](https://github.com/nawfal-hassani/jdc_test-/discussions)

---

## 📚 Ressources utiles

- [Documentation Express.js](https://expressjs.com/)
- [Documentation Socket.io](https://socket.io/docs/)
- [Documentation Stripe](https://stripe.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/)
- [JavaScript Guide](https://javascript.info/)

---

<div align="center">

**Merci de contribuer à JDC SMS Dashboard ! 🎉**

[⬆ Retour en haut](#-guide-de-contribution)

</div>
