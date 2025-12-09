# 🚀 Checklist Déploiement Render - Correction Erreurs

## ⚠️ Problèmes identifiés et corrigés

### 1. Noms des variables d'environnement Twilio incorrects
- ❌ **Avant** : `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- ✅ **Après** : `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_PHONE`

### 2. Fichier render.yaml mal placé
- ❌ **Avant** : `/JDC/smsjdc/render.yaml`
- ✅ **Après** : `/render.yaml` (à la racine)

### 3. Chemins relatifs incorrects
- ❌ **Avant** : `cd ../sms-api && npm install`
- ✅ **Après** : `rootDir: JDC/sms-api` + `npm install`

---

## 📋 Étapes de déploiement sur Render

### Étape 1 : Supprimer les anciens services (si existants)

1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Supprimez les services `jdc-sms-api` et `jdc-sms-dashboard` s'ils existent
3. Cela évite les conflits de configuration

### Étape 2 : Créer un nouveau Blueprint

1. Sur Render Dashboard, cliquez **"New +"** → **"Blueprint"**
2. Connectez votre repository GitHub : `nawfal-hassani/jdc_test-`
3. Render détectera automatiquement le `render.yaml` à la racine
4. Cliquez sur **"Apply"**

### Étape 3 : Configurer les variables d'environnement

#### Pour `jdc-sms-api` :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `TWILIO_SID` | `AC...` | Account SID depuis [Twilio Console](https://console.twilio.com/) |
| `TWILIO_TOKEN` | `...` | Auth Token depuis Twilio Console |
| `TWILIO_PHONE` | `+33XXXXXXXXX` | Votre numéro Twilio (format international) |

**Comment obtenir vos credentials Twilio :**
1. Allez sur [console.twilio.com](https://console.twilio.com/)
2. Copiez **Account SID** → Collez dans `TWILIO_SID`
3. Cliquez sur "View" sous **Auth Token** → Collez dans `TWILIO_TOKEN`
4. Allez dans **Phone Numbers** → Copiez votre numéro actif → Collez dans `TWILIO_PHONE`

#### Pour `jdc-sms-dashboard` :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` ou `sk_live_...` | Clé secrète Stripe (optionnel pour tests) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` ou `pk_live_...` | Clé publique Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Secret webhook Stripe |

**Note** : Les variables `JWT_SECRET`, `SESSION_SECRET`, et `API_KEY` sont générées automatiquement par Render.

### Étape 4 : Attendre le déploiement

1. **jdc-sms-api** se déploie en premier (environ 2-3 minutes)
2. **jdc-sms-dashboard** se déploie ensuite (environ 2-3 minutes)
3. Surveillez les logs pour vérifier qu'il n'y a pas d'erreurs

### Étape 5 : Vérification

#### Tester l'API :

```bash
curl https://jdc-sms-api.onrender.com/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "service": "SMS API",
  "timestamp": "2025-12-09T..."
}
```

#### Tester le Dashboard :

Ouvrez dans votre navigateur : `https://jdc-sms-dashboard.onrender.com`

---

## 🔍 Dépannage

### Erreur : "Cannot find module"

**Cause** : Les dépendances ne sont pas installées correctement.

**Solution** :
1. Vérifiez que `package.json` existe dans le bon dossier
2. Vérifiez les logs du build sur Render
3. Dans Render, cliquez sur **"Manual Deploy"** → **"Clear build cache & deploy"**

### Erreur : "TWILIO_SID is not defined"

**Cause** : Variables d'environnement mal configurées.

**Solution** :
1. Allez dans **Settings** de votre service sur Render
2. Vérifiez que `TWILIO_SID`, `TWILIO_TOKEN`, et `TWILIO_PHONE` sont bien définies
3. Redéployez le service

### Erreur : "Failed to send SMS"

**Cause** : Credentials Twilio invalides ou numéro non vérifié.

**Solution** :
1. Vérifiez vos credentials sur [Twilio Console](https://console.twilio.com/)
2. Si compte Trial : Vérifiez que le numéro destinataire est dans la liste des numéros vérifiés
3. Vérifiez le solde de votre compte Twilio

### Erreur : "Cannot connect to API"

**Cause** : L'URL de l'API n'est pas correcte ou l'API n'est pas déployée.

**Solution** :
1. Vérifiez que `jdc-sms-api` est bien déployé et actif
2. Vérifiez que `SMS_API_URL` dans le Dashboard pointe vers `https://jdc-sms-api.onrender.com/api`
3. Testez l'API directement avec curl (voir ci-dessus)

### Service en "Failed" ou "Suspended"

**Cause** : Erreur de démarrage ou Free Tier inactif trop longtemps.

**Solution** :
1. Consultez les logs : **Logs** dans le menu du service
2. Cherchez l'erreur exacte dans les dernières lignes
3. Si inactif : Le service redémarre automatiquement à la prochaine requête (peut prendre 30-60 secondes)

---

## 📊 Logs utiles

### Voir les logs en direct

1. Allez sur votre service sur Render
2. Cliquez sur **"Logs"** dans le menu de gauche
3. Les logs s'affichent en temps réel

### Logs importants à surveiller

#### Démarrage réussi de l'API :
```
✅ API SMS démarrée sur le port 3000
✅ Twilio configuré avec le numéro +33XXXXXXXXX
```

#### Démarrage réussi du Dashboard :
```
✅ Dashboard démarré sur le port 3030
✅ Connexion à l'API SMS: https://jdc-sms-api.onrender.com/api
```

#### Erreurs communes :
```
❌ Error: Cannot find module 'express'
→ Solution: Clear build cache et redéployer

❌ Error: TWILIO_SID is not defined
→ Solution: Ajouter les variables d'environnement Twilio

❌ Error: connect ECONNREFUSED
→ Solution: Vérifier que l'API est bien déployée et l'URL est correcte
```

---

## ✅ Checklist finale

- [ ] `render.yaml` est à la racine du repo (`/render.yaml`)
- [ ] Variables Twilio configurées : `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_PHONE`
- [ ] Blueprint déployé sur Render
- [ ] Les deux services sont en statut **"Live"** (vert)
- [ ] L'API répond sur `https://jdc-sms-api.onrender.com/api/health`
- [ ] Le Dashboard est accessible sur `https://jdc-sms-dashboard.onrender.com`
- [ ] Test d'envoi de SMS réussi depuis le Dashboard

---

## 🎯 Résumé des changements appliqués

### Fichier : `render.yaml` (à la racine)

```yaml
services:
  # API SMS Backend
  - type: web
    name: jdc-sms-api
    env: node
    region: frankfurt
    plan: free
    rootDir: JDC/sms-api           # ✅ Chemin absolu depuis la racine
    buildCommand: npm install       # ✅ Simplifié
    startCommand: npm start         # ✅ Utilise le script du package.json
    envVars:
      - key: TWILIO_SID            # ✅ Nom correct
      - key: TWILIO_TOKEN          # ✅ Nom correct
      - key: TWILIO_PHONE          # ✅ Nom correct

  # Dashboard SMS
  - type: web
    name: jdc-sms-dashboard
    env: node
    region: frankfurt
    plan: free
    rootDir: JDC/smsjdc            # ✅ Chemin absolu
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: SMS_API_URL
        value: https://jdc-sms-api.onrender.com/api  # ✅ URL correcte
```

---

## 📞 Besoin d'aide ?

Si vous rencontrez toujours des problèmes :

1. **Consultez les logs** sur Render (menu **"Logs"** du service)
2. **Vérifiez les variables d'environnement** (menu **"Environment"**)
3. **Testez l'API en local** : `cd JDC/sms-api && npm start`
4. **Testez le Dashboard en local** : `cd JDC/smsjdc && npm start`

Si tout fonctionne en local mais pas sur Render, le problème vient des variables d'environnement ou de la configuration Render.

---

**Prochaine étape** : Commitez et pushez les changements, puis suivez les étapes ci-dessus pour déployer sur Render ! 🚀
