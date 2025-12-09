# 🚀 Guide de Déploiement Render - JDC SMS

## 🔍 Problème résolu

Ton dashboard ne pouvait pas envoyer de SMS car :
1. ❌ L'API SMS backend n'était pas déployée
2. ❌ La variable `SMS_API_URL` n'était pas configurée
3. ❌ Les credentials Twilio n'étaient pas renseignées

## ✅ Solution : Déployer l'API SMS + Dashboard

### Étape 1 : Créer les services sur Render

#### Option A : Déploiement automatique avec render.yaml

1. **Connecte-toi sur [Render](https://dashboard.render.com)**

2. **Créer un Blueprint** :
   - Clique sur **"New" → "Blueprint"**
   - Sélectionne ton repo GitHub `nawfal-hassani/jdc_test-`
   - **Root Directory** : `JDC/smsjdc`
   - Render va détecter automatiquement le `render.yaml`

3. **Configurer les variables d'environnement** :

   **Pour `jdc-sms-api` (l'API SMS backend) :**
   ```
   TWILIO_ACCOUNT_SID=AC...  (depuis https://console.twilio.com)
   TWILIO_AUTH_TOKEN=...     (depuis https://console.twilio.com)
   TWILIO_PHONE_NUMBER=+33... (ton numéro Twilio)
   ```

   **Pour `jdc-sms-dashboard` :**
   ```
   SMS_API_URL=https://jdc-sms-api.onrender.com/api  (URL de ton API)
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+33...
   STRIPE_SECRET_KEY=sk_live_...  (depuis https://dashboard.stripe.com)
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. **Déployer** :
   - Clique sur **"Apply"**
   - Render va déployer les 2 services automatiquement

---

#### Option B : Déploiement manuel (étape par étape)

##### 🔌 Service 1 : API SMS Backend

1. **New Web Service**
   - Name: `jdc-sms-api`
   - Root Directory: `JDC/sms-api`
   - Environment: `Node`
   - Region: `Frankfurt`
   - Branch: `main`
   - Build Command: `npm install`
   - Start Command: `node server.js`

2. **Environment Variables** :
   ```
   NODE_ENV=production
   PORT=3000
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+33...
   SMS_PROVIDER=twilio
   ```

3. **Déployer** et noter l'URL (ex: `https://jdc-sms-api.onrender.com`)

---

##### 📱 Service 2 : Dashboard SMS

1. **New Web Service**
   - Name: `jdc-sms-dashboard`
   - Root Directory: `JDC/smsjdc`
   - Environment: `Node`
   - Region: `Frankfurt`
   - Branch: `main`
   - Build Command: `npm install`
   - Start Command: `node server.js`

2. **Environment Variables** :
   ```
   NODE_ENV=production
   PORT=3030
   SMS_API_URL=https://jdc-sms-api.onrender.com/api
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+33...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   JWT_SECRET=(généré automatiquement)
   SESSION_SECRET=(généré automatiquement)
   ```

3. **Déployer**

---

### Étape 2 : Obtenir tes clés Twilio

1. **Créer un compte Twilio** :
   - Va sur https://www.twilio.com/try-twilio
   - Inscris-toi gratuitement

2. **Obtenir tes credentials** :
   - Dashboard Twilio → **Account Info**
   - Copie :
     - `Account SID` (ex: AC1234567890abcdef)
     - `Auth Token` (clique "Show" pour voir)

3. **Acheter un numéro de téléphone** :
   - Dashboard → **Phone Numbers** → **Buy a Number**
   - Choisis un numéro avec capacité SMS
   - Copie le numéro (format: +33612345678)

4. **Version gratuite** :
   - Twilio offre 15.50$ de crédit gratuit
   - Tu peux envoyer des SMS uniquement vers des numéros vérifiés
   - Pour la prod, il faut upgrader le compte

---

### Étape 3 : Vérifier le déploiement

1. **Tester l'API SMS** :
   ```bash
   curl https://jdc-sms-api.onrender.com/api/check
   ```
   Réponse attendue :
   ```json
   {
     "status": "ok",
     "message": "API SMS opérationnelle"
   }
   ```

2. **Tester le Dashboard** :
   - Ouvre `https://jdc-sms-dashboard.onrender.com`
   - Connecte-toi avec tes identifiants
   - Essaie d'envoyer un SMS de test

3. **Vérifier les logs** :
   - Render Dashboard → Ton service → **Logs**
   - Cherche les erreurs éventuelles

---

## 🐛 Problèmes courants

### Erreur : "API SMS non disponible"

**Cause** : L'API SMS n'est pas démarrée ou l'URL est incorrecte

**Solution** :
1. Vérifie que `jdc-sms-api` est bien déployé et en ligne (vert)
2. Vérifie la variable `SMS_API_URL` dans le dashboard
3. L'URL doit être : `https://jdc-sms-api.onrender.com/api` (sans slash final)

---

### Erreur : "Twilio authentication failed"

**Cause** : Credentials Twilio incorrectes

**Solution** :
1. Vérifie que tu as copié les bonnes clés depuis Twilio Console
2. Pas d'espaces avant/après les clés
3. Le `TWILIO_ACCOUNT_SID` commence par `AC`
4. Redéploie après avoir changé les variables

---

### Erreur : "Unable to create record: Invalid 'To' phone number"

**Cause** : Format du numéro incorrect

**Solution** :
1. Le numéro doit être au format international : `+33612345678`
2. Pas d'espaces, pas de tirets
3. Commence toujours par `+`

---

### SMS ne s'envoie pas (compte gratuit Twilio)

**Cause** : Numéro destinataire non vérifié

**Solution** :
1. Twilio gratuit → seuls les numéros vérifiés reçoivent des SMS
2. Dashboard Twilio → **Phone Numbers** → **Verified Caller IDs**
3. Ajoute ton numéro de test
4. Twilio t'enverra un code de vérification

---

### Service "Suspended" sur Render

**Cause** : Render Free Tier met en veille après 15min d'inactivité

**Solution** :
1. Le service redémarre automatiquement à la prochaine requête (délai 30s)
2. Pour éviter ça : Upgrade vers un plan payant (~7$/mois)
3. Ou : Utilise un service de ping (ex: cron-job.org) pour garder actif

---

## 🔒 Sécurité

### Variables sensibles

**❌ Ne jamais committer** :
- `TWILIO_AUTH_TOKEN`
- `STRIPE_SECRET_KEY`
- `JWT_SECRET`

**✅ Toujours** :
- Utiliser les variables d'environnement Render
- Activer "Sync: false" pour les secrets
- Générer des secrets forts (JWT, Session)

---

## 📊 Monitoring

### Voir les logs en temps réel

```bash
# Via Render CLI (optionnel)
npm install -g render-cli
render login
render logs jdc-sms-dashboard --tail
```

### Alertes

Configure des alertes sur Render :
- Dashboard → Service → **Settings** → **Notifications**
- Ajoute ton email pour recevoir les alertes de crash

---

## 💰 Coûts

### Plan Free Tier (0$/mois)
- ✅ 750h de compute/mois (suffisant pour 1 service)
- ✅ Mise en veille après 15min d'inactivité
- ✅ 100GB bandwidth/mois
- ⚠️ Un seul service web gratuit par compte

### Plan Starter (7$/mois par service)
- ✅ Toujours actif (pas de veille)
- ✅ Meilleure performance
- ✅ Support prioritaire

### Recommandation
- **Dev/Test** : Plan Free OK
- **Production** : Upgrade vers Starter pour API SMS (critique)

---

## 🎯 Checklist de déploiement

- [ ] Compte Twilio créé et vérifié
- [ ] Numéro Twilio acheté
- [ ] Clés Twilio copiées (SID, Token, Phone)
- [ ] Service `jdc-sms-api` déployé sur Render
- [ ] Variables Twilio configurées dans `jdc-sms-api`
- [ ] Service `jdc-sms-dashboard` déployé sur Render
- [ ] Variable `SMS_API_URL` pointant vers l'API
- [ ] Test d'envoi SMS réussi
- [ ] Stripe configuré (pour paiements)
- [ ] Logs vérifiés (pas d'erreurs)

---

## 🆘 Besoin d'aide ?

1. **Logs Render** : Vérifie toujours les logs en premier
2. **Twilio Console** : Vérifie l'historique des SMS envoyés
3. **Issues GitHub** : [Ouvrir une issue](https://github.com/nawfal-hassani/jdc_test-/issues)
4. **Email** : nawfal.hassani@epitech.eu

---

## 🚀 Prochaines étapes

Une fois le déploiement fonctionnel :

1. **Custom Domain** :
   - Dashboard Render → **Settings** → **Custom Domain**
   - Ajoute ton domaine (ex: `sms.jdc-occitanie.com`)

2. **SSL Certificate** :
   - Activé automatiquement par Render (Let's Encrypt)

3. **CI/CD** :
   - Déploiement automatique à chaque push sur `main`
   - Déjà configuré par défaut

4. **Monitoring** :
   - Intégrer Sentry pour tracking d'erreurs
   - Ajouter Google Analytics

---

<div align="center">

**Bon déploiement ! 🎉**

[⬆ Retour en haut](#-guide-de-déploiement-render---jdc-sms)

</div>
