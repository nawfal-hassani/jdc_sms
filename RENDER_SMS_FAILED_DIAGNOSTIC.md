# 🔍 Diagnostic : SMS échouent sur Render mais marchent en local

## ❓ Problème
- ✅ **En LOCAL** : Les SMS s'envoient avec succès
- ❌ **Sur RENDER** : Les SMS échouent avec "failed"

---

## 🎯 Causes possibles (par ordre de probabilité)

### 1. ⚠️ Variables d'environnement Twilio manquantes ou incorrectes ⭐ **CAUSE #1**

**Sur Render, l'API ne trouve pas les credentials Twilio**

#### Vérification :

1. **Allez sur Render Dashboard** : [https://dashboard.render.com/](https://dashboard.render.com/)

2. **Cliquez sur votre service `jdc-sms-api`**

3. **Allez dans "Environment"** (menu gauche)

4. **Vérifiez que ces 3 variables existent :**

| Variable | Doit être définie ? | Valeur attendue |
|----------|---------------------|-----------------|
| `TWILIO_SID` | ✅ OUI | `AC...` (commence par AC) |
| `TWILIO_TOKEN` | ✅ OUI | Token de 32 caractères |
| `TWILIO_PHONE` | ✅ OUI | `+33...` (format international) |

#### Si les variables MANQUENT ou sont VIDES :

**C'est ça le problème !** L'API ne peut pas envoyer de SMS sans ces credentials.

**Solution :**

```
1. Sur Render, service jdc-sms-api
2. Environment → Add Environment Variable
3. Ajoutez :
   - Key: TWILIO_SID     Value: [Votre Account SID de Twilio]
   - Key: TWILIO_TOKEN   Value: [Votre Auth Token de Twilio]
   - Key: TWILIO_PHONE   Value: [Votre numéro Twilio, ex: +33612345678]
4. Cliquez "Save Changes"
5. Attendez 2-3 minutes que le service redémarre
6. Testez à nouveau
```

---

### 2. 🌐 L'API Render n'est pas démarrée ou inaccessible ⭐ **CAUSE #2**

**Le Dashboard essaie de contacter l'API mais elle ne répond pas**

#### Test :

Ouvrez dans votre navigateur :
```
https://jdc-sms-api.onrender.com/api/status
```

**✅ Si vous voyez :**
```json
{
  "status": "online",
  "service": "SMS API",
  "version": "1.0.0"
}
```
→ L'API est bien démarrée, passez au point suivant

**❌ Si vous voyez :**
- "Service Unavailable" 
- "Application failed to respond"
- Une page d'erreur Render

→ **L'API n'est pas déployée ou a échoué au démarrage**

**Solution :**

1. Allez sur [dashboard.render.com](https://dashboard.render.com/)
2. Cliquez sur `jdc-sms-api`
3. Cliquez sur **"Logs"** dans le menu gauche
4. Cherchez des erreurs de démarrage, notamment :
   ```
   ERREUR: TWILIO_SID et TWILIO_TOKEN doivent être configurés
   ```
5. Si cette erreur apparaît → Retour au Point 1 (variables manquantes)

---

### 3. 🔗 URL de l'API incorrecte dans le Dashboard ⭐ **CAUSE #3**

**Le Dashboard envoie la requête vers la mauvaise URL**

#### Vérification :

1. Sur Render Dashboard, cliquez sur `jdc-sms-dashboard`
2. Allez dans "Environment"
3. Vérifiez la variable `SMS_API_URL`

**✅ Doit être :**
```
https://jdc-sms-api.onrender.com/api
```

**❌ NE DOIT PAS être :**
- `http://jdc-sms-api.onrender.com/api` (http au lieu de https)
- `http://localhost:3000/api` (URL locale)
- `https://jdc-sms-api.onrender.com` (sans /api à la fin)

**Si l'URL est incorrecte :**

1. Cliquez sur "Edit" à côté de `SMS_API_URL`
2. Changez la valeur pour : `https://jdc-sms-api.onrender.com/api`
3. Cliquez "Save Changes"
4. Attendez 2-3 minutes
5. Testez à nouveau

---

### 4. 🔐 API_KEY manquante ou ne correspond pas

**Le Dashboard et l'API n'utilisent pas la même clé**

#### Vérification :

1. Sur service `jdc-sms-api` → Environment → Notez la valeur de `API_KEY`
2. Sur service `jdc-sms-dashboard` → Environment → Vérifiez `SMS_API_KEY`

**Les deux valeurs doivent être IDENTIQUES**

**Si différentes :**

1. Copiez la valeur de `API_KEY` depuis `jdc-sms-api`
2. Allez sur `jdc-sms-dashboard` → Environment
3. Modifiez `SMS_API_KEY` avec la même valeur
4. Cliquez "Save Changes"

---

### 5. 🚫 Services Render en mode "Suspended" (Free Tier)

**Sur le plan gratuit, les services s'endorment après 15 minutes d'inactivité**

#### Symptômes :
- Premier envoi après inactivité : ❌ Échec
- Deuxième envoi immédiatement après : ✅ Succès

#### Test :

1. Attendez 20 minutes sans utiliser l'app
2. Essayez d'envoyer un SMS
3. Si ça échoue, attendez 30 secondes
4. Réessayez → Si ça marche maintenant, c'est le cold start

**Solution :**
- C'est normal sur le plan Free
- Pour éviter, upgradez vers un plan payant
- Ou utilisez un service comme [Uptime Robot](https://uptimerobot.com/) pour ping votre API toutes les 10 minutes

---

## 🛠️ Procédure de diagnostic étape par étape

### Étape 1 : Vérifier que l'API est en ligne

```bash
curl https://jdc-sms-api.onrender.com/api/status
```

**✅ Réponse attendue :**
```json
{"status":"online","service":"SMS API"}
```

**❌ Si erreur :** Allez voir les logs de `jdc-sms-api` sur Render

---

### Étape 2 : Vérifier les variables Twilio sur l'API

1. Render Dashboard → `jdc-sms-api` → Environment
2. Vérifiez : `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_PHONE`
3. **Si manquantes :** C'est le problème !

---

### Étape 3 : Tester l'API directement

**Test avec curl :**

```bash
curl -X POST https://jdc-sms-api.onrender.com/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"+33612345678","message":"Test depuis curl"}'
```

Remplacez `+33612345678` par votre vrai numéro.

**✅ Si ça marche :** Le problème vient du Dashboard (API_KEY ou SMS_API_URL)

**❌ Si ça échoue :** Le problème vient de l'API (Twilio credentials)

---

### Étape 4 : Vérifier les logs Render

#### Logs de l'API :

1. Render Dashboard → `jdc-sms-api` → Logs
2. Cherchez :
   ```
   ✅ Twilio configuré avec succès
   ```
3. Si absent, cherchez :
   ```
   ERREUR: TWILIO_SID et TWILIO_TOKEN doivent être configurés
   ```

#### Logs du Dashboard :

1. Render Dashboard → `jdc-sms-dashboard` → Logs
2. Après tentative d'envoi, cherchez :
   ```
   📤 Envoi SMS par user@example.com
   Erreur envoi SMS: ...
   ```

---

## 🎯 Solution la plus probable

**Dans 90% des cas, le problème est :**

### ⚠️ Les variables TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE ne sont PAS configurées sur Render

**Pourquoi ?**

Le fichier `render.yaml` contient :
```yaml
- key: TWILIO_SID
  sync: false
```

`sync: false` signifie que **VOUS devez ajouter manuellement ces variables** dans l'interface Render.

**Solution rapide (5 minutes) :**

1. **Allez sur Twilio Console** : [https://console.twilio.com/](https://console.twilio.com/)
   - Copiez votre **Account SID**
   - Copiez votre **Auth Token** (cliquez "View")
   - Copiez votre **numéro Twilio** (menu Phone Numbers)

2. **Allez sur Render Dashboard** : [https://dashboard.render.com/](https://dashboard.render.com/)
   - Cliquez sur `jdc-sms-api`
   - Allez dans "Environment"
   - Cliquez "Add Environment Variable"

3. **Ajoutez ces 3 variables :**
   ```
   Key: TWILIO_SID
   Value: [VOTRE ACCOUNT SID]
   
   Key: TWILIO_TOKEN
   Value: [VOTRE AUTH TOKEN]
   
   Key: TWILIO_PHONE
   Value: +33612345678 (VOTRE NUMÉRO, format +33... SANS ESPACES)
   ```

4. **Cliquez "Save Changes"**

5. **Attendez 2-3 minutes** que le service redémarre

6. **Testez l'envoi de SMS**

---

## 📋 Checklist de vérification

Cochez au fur et à mesure :

### Sur jdc-sms-api :
- [ ] Service en statut "Live" (vert) sur Render
- [ ] `https://jdc-sms-api.onrender.com/api/status` répond
- [ ] Variable `TWILIO_SID` définie (commence par AC)
- [ ] Variable `TWILIO_TOKEN` définie (32 caractères)
- [ ] Variable `TWILIO_PHONE` définie (format +33...)
- [ ] Logs montrent "✅ Twilio configuré avec succès"

### Sur jdc-sms-dashboard :
- [ ] Service en statut "Live" (vert) sur Render
- [ ] Variable `SMS_API_URL` = `https://jdc-sms-api.onrender.com/api`
- [ ] Variable `SMS_API_KEY` définie (même valeur que API_KEY de l'API)

### Test final :
- [ ] Connexion au Dashboard sur Render
- [ ] Envoi d'un SMS de test
- [ ] SMS reçu avec succès 📱

---

## 🆘 Si ça ne marche toujours pas

**Envoyez-moi :**

1. **Logs de jdc-sms-api** (30 dernières lignes) :
   - Render Dashboard → jdc-sms-api → Logs → Copiez

2. **Logs de jdc-sms-dashboard** après tentative d'envoi :
   - Render Dashboard → jdc-sms-dashboard → Logs → Copiez

3. **Capture des variables d'environnement** (masquez les valeurs sensibles) :
   - jdc-sms-api → Environment → Liste des variables

4. **Message d'erreur exact** affiché dans le Dashboard

---

**Commencez par vérifier le Point 1 (Variables Twilio) - c'est le problème dans 90% des cas !** 🎯
