# 🚀 Guide de déploiement sur Render.com

## Prérequis
- Un compte Render.com (gratuit)
- Votre dépôt GitHub est à jour
- Vos clés API Twilio et Stripe (optionnel pour commencer)

## 📝 Étapes de déploiement

### 1. Créer un compte Render
1. Allez sur https://render.com
2. Cliquez sur "Get Started for Free"
3. Connectez-vous avec GitHub

### 2. Déployer l'application

#### Option A : Déploiement automatique (Blueprint)
1. Dans Render Dashboard, cliquez sur "New +"
2. Sélectionnez "Blueprint"
3. Connectez votre repo GitHub `nawfal-hassani/jdc_test-`
4. Sélectionnez le dossier `smsjdc`
5. Render détecte automatiquement `render.yaml`
6. Cliquez sur "Apply"

#### Option B : Déploiement manuel
1. Dans Render Dashboard, cliquez sur "New +"
2. Sélectionnez "Web Service"
3. Connectez votre repo GitHub `nawfal-hassani/jdc_test-`
4. Configuration :
   - **Name**: `jdc-sms-dashboard`
   - **Region**: Frankfurt (Europe)
   - **Branch**: main
   - **Root Directory**: `smsjdc`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
5. Cliquez sur "Create Web Service"

### 3. Configurer les variables d'environnement

Dans l'interface Render, allez dans "Environment" et ajoutez :

**Variables obligatoires :**
```
NODE_ENV=production
PORT=3030
```

**Variables pour Twilio (SMS) :**
```
TWILIO_ACCOUNT_SID=votre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=+33xxxxxxxxx
```

**Variables pour Stripe (Paiements) :**
```
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**⚠️ Note :** Vous pouvez déployer SANS Twilio et Stripe pour commencer. Les fonctionnalités SMS et paiement afficheront simplement des messages d'erreur élégants.

### 4. Déploiement

1. Cliquez sur "Save Changes"
2. Render va automatiquement :
   - Cloner votre repo
   - Installer les dépendances (`npm install`)
   - Démarrer le serveur (`node server.js`)
3. Attendez 2-3 minutes ⏱️

### 5. Accéder à votre application

Une fois déployé, Render vous donne une URL :
```
https://jdc-sms-dashboard.onrender.com
```

🎉 **Votre application est en ligne !**

## 🔄 Déploiement automatique

Chaque fois que vous faites un `git push` sur la branche `main`, Render redéploie automatiquement !

```bash
git add -A
git commit -m "Update"
git push origin main
# ⏱️ Render redéploie automatiquement
```

## ⚠️ Limitations du plan gratuit

- ✅ SSL/HTTPS inclus
- ✅ 750h/mois (suffisant)
- ✅ 512 MB RAM
- ⚠️ Le service dort après 15 min d'inactivité
- ⚠️ Premier visiteur attend ~30 secondes (réveil)

**Solution :** Passez au plan Starter (7$/mois) pour éviter la mise en veille

## 🆙 Passer au plan payant (optionnel)

Si vous avez des vrais clients :
1. Allez dans "Settings" → "Plan"
2. Choisissez "Starter" (7$/mois)
3. Avantages :
   - Pas de mise en veille
   - 1 GB RAM
   - Plus rapide

## 🔧 Dépannage

**Le service ne démarre pas ?**
- Vérifiez les logs dans Render Dashboard
- Vérifiez que `PORT` utilise `process.env.PORT`

**Erreur de mémoire ?**
- Plan gratuit = 512 MB max
- Réduisez les dépendances ou passez au plan payant

**WebSocket ne fonctionne pas ?**
- Render supporte WebSocket nativement
- Vérifiez que votre URL utilise `wss://` (pas `ws://`)

## 📚 Ressources

- Documentation Render : https://render.com/docs
- Support : https://render.com/support

---

**Fait avec ❤️ par JDC SMS**
