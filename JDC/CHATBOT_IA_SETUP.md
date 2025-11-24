# 🤖 Configuration de l'IA Chatbot (Google Gemini - GRATUIT)

## Pourquoi ajouter l'IA ?

L'IA rend le chatbot **beaucoup plus intelligent** :
- ✅ Comprend les questions complexes et mal formulées
- ✅ Conversations naturelles et contextuelles
- ✅ Réponses personnalisées et détaillées
- ✅ S'adapte aux besoins de chaque utilisateur
- ✅ **100% GRATUIT** avec Google Gemini

## 📝 Comment obtenir votre clé API Gemini GRATUITE

### Étape 1 : Créer un compte Google AI Studio

1. Allez sur : **https://makersuite.google.com/app/apikey**
2. Connectez-vous avec votre compte Google (ou créez-en un)
3. Acceptez les conditions d'utilisation

### Étape 2 : Générer votre clé API

1. Cliquez sur **"Create API Key"** (Créer une clé API)
2. Sélectionnez un projet Google Cloud (ou créez-en un nouveau)
3. Copiez la clé API générée (format : `AIzaSy...`)

### Étape 3 : Ajouter la clé dans votre projet

1. Ouvrez le fichier `.env` dans le dossier `JDC/smsjdc/`
2. Trouvez la ligne :
   ```
   GEMINI_API_KEY=
   ```
3. Collez votre clé après le `=` :
   ```
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
4. Sauvegardez le fichier

### Étape 4 : Redémarrer le serveur

```bash
cd JDC
make stop
make run
```

## ✅ C'est tout !

Votre chatbot utilise maintenant l'IA de Google Gemini !

## 📊 Quotas gratuits

Google Gemini offre **gratuitement** :
- ✅ **60 requêtes par minute**
- ✅ **1500 requêtes par jour**
- ✅ **1 million de requêtes par mois** (limite souple)

C'est largement suffisant pour un usage professionnel normal !

## 🔄 Mode hybride intelligent

Le chatbot fonctionne en **mode hybride** :
1. **Sans clé API** : Base de connaissances locale (rapide mais limitée)
2. **Avec clé API** : IA Google Gemini (intelligent et conversationnel)

Le système bascule automatiquement en mode local si l'IA n'est pas disponible.

## 🛡️ Sécurité

- ⚠️ **NE JAMAIS** commiter le fichier `.env` sur Git (déjà dans `.gitignore`)
- 🔒 La clé API est privée et sécurisée côté serveur
- 🚫 Les clés ne sont jamais exposées au navigateur

## 🆘 Besoin d'aide ?

Si vous avez des problèmes :
1. Vérifiez que la clé est correctement copiée (sans espaces)
2. Redémarrez le serveur après modification du `.env`
3. Consultez les logs du serveur : `make logs`

---

**Profitez de votre chatbot intelligent ! 🚀**
