# 🔍 Checklist de vérification - SMS toujours en échec sur Render

## ✅ Variables ajoutées sur Render (jdc-sms-api)

- [x] TWILIO_SID = ACac14b925b6b77bec40a578c4dcfef095
- [x] TWILIO_TOKEN = c71c857624bd97f7d93f281cab987719
- [x] TWILIO_PHONE = +19514717077

---

## 🔍 ÉTAPES DE VÉRIFICATION

### 1. Le service a-t-il redémarré ?

Après avoir ajouté les variables, Render DOIT redémarrer le service.

**Vérification :**
- Sur Render Dashboard → Service `jdc-sms-api`
- Regardez le statut en haut : Doit être **"Live"** (vert)
- Si c'est "Building" ou "Deploying" → Attendez encore

**⏱️ Temps de redémarrage : 2-3 minutes**

---

### 2. Les logs montrent-ils que Twilio est configuré ?

**Action :**
1. Render Dashboard → `jdc-sms-api`
2. Cliquez sur **"Logs"** (menu gauche)
3. Cherchez cette ligne :

**✅ DOIT VOIR :**
```
✅ Twilio configuré avec succès
Mode de fonctionnement: PRODUCTION
```

**❌ SI VOUS VOYEZ :**
```
ERREUR: TWILIO_SID et TWILIO_TOKEN doivent être configurés
```
→ Les variables ne sont pas prises en compte

**Solution si erreur :**
- Les variables sont peut-être mal orthographiées
- Vérifiez : `TWILIO_SID` (pas `TWILIO_ACCOUNT_SID`)
- Vérifiez : `TWILIO_TOKEN` (pas `TWILIO_AUTH_TOKEN`)
- Vérifiez : `TWILIO_PHONE` (pas `TWILIO_PHONE_NUMBER`)

---

### 3. L'API est-elle accessible ?

**Test dans votre navigateur :**
```
https://jdc-sms-api.onrender.com/api/status
```

**✅ DOIT AFFICHER :**
```json
{
  "status": "online",
  "service": "SMS API",
  "version": "1.0.0"
}
```

**❌ SI ERREUR :**
- "Service Unavailable" → L'API n'est pas démarrée
- "Application failed to respond" → Erreur au démarrage
→ Consultez les logs

---

### 4. Test d'envoi direct via l'API

**Test avec curl (depuis votre terminal local) :**

```bash
curl -X POST https://jdc-sms-api.onrender.com/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"+33VOTRE_NUMERO","message":"Test depuis curl"}'
```

Remplacez `+33VOTRE_NUMERO` par votre vrai numéro.

**✅ SI ÇA MARCHE :**
Le problème vient du Dashboard (pas de l'API)

**❌ SI ÇA ÉCHOUE :**
Le problème vient de l'API ou de Twilio

**Réponse attendue :**
```json
{
  "success": true,
  "messageId": "SM...",
  "timestamp": "..."
}
```

**Si erreur Twilio :**
```json
{
  "success": false,
  "error": "Unable to create record: The 'To' number +33... is not a valid phone number."
}
```
→ Problème de numéro (voir point 5)

---

### 5. Compte Twilio Trial - Numéro vérifié ?

**⚠️ IMPORTANT : Votre numéro Twilio est américain (+1)**

Si vous avez un **compte Trial (gratuit)**, vous ne pouvez envoyer QUE vers :
1. Des numéros américains (+1)
2. Des numéros **vérifiés** dans Twilio Console

**Pour envoyer vers un numéro français (+33) :**

1. Allez sur [console.twilio.com](https://console.twilio.com/)
2. Menu gauche → **"Phone Numbers"** → **"Verified Caller IDs"**
3. Cliquez **"Add a new number"**
4. Entrez votre numéro français (+33...)
5. Twilio vous envoie un code par SMS
6. Entrez le code pour vérifier
7. Maintenant vous pouvez envoyer vers ce numéro

**OU**

Achetez un numéro français sur Twilio :
1. Menu **"Buy a Number"**
2. Sélectionnez **France (+33)**
3. Achetez un numéro (~1€/mois)
4. Utilisez ce numéro dans `TWILIO_PHONE`

---

### 6. Logs du Dashboard

Quand vous essayez d'envoyer un SMS depuis le Dashboard :

**Action :**
1. Render Dashboard → `jdc-sms-dashboard`
2. Cliquez sur **"Logs"**
3. Essayez d'envoyer un SMS
4. Regardez les logs en temps réel

**Logs attendus :**

**✅ Succès :**
```
📤 Envoi SMS par user@example.com: { to: '+33...', message: '...' }
```

**❌ Erreur :**
```
Erreur envoi SMS: connect ECONNREFUSED
```
→ Le Dashboard ne peut pas joindre l'API

```
Erreur envoi SMS: Request failed with status code 400
```
→ L'API rejette la requête (vérifiez les paramètres)

```
Erreur envoi SMS: The 'To' number is not a valid phone number
```
→ Problème de numéro (voir point 5)

---

## 🎯 DIAGNOSTIC RAPIDE

### Scénario A : L'API ne démarre pas

**Symptômes :**
- `https://jdc-sms-api.onrender.com/api/status` ne répond pas
- Logs montrent : `ERREUR: TWILIO_SID et TWILIO_TOKEN doivent être configurés`

**Solution :**
1. Vérifiez l'orthographe EXACTE des variables :
   - `TWILIO_SID` (pas TWILIO_ACCOUNT_SID)
   - `TWILIO_TOKEN` (pas TWILIO_AUTH_TOKEN)
   - `TWILIO_PHONE` (pas TWILIO_PHONE_NUMBER)
2. Re-sauvegardez les variables
3. Redéployez manuellement : **"Manual Deploy"** → **"Deploy latest commit"**

---

### Scénario B : L'API démarre mais les SMS échouent

**Symptômes :**
- `https://jdc-sms-api.onrender.com/api/status` répond ✅
- Logs montrent : `✅ Twilio configuré avec succès`
- Mais les SMS échouent quand même

**Causes possibles :**

#### B1. Numéro non vérifié (compte Trial)
**Solution :** Vérifiez le numéro de destination sur Twilio Console

#### B2. Format de numéro incorrect
**Solution :** Format international obligatoire : `+33612345678` (pas d'espaces)

#### B3. Compte Twilio suspendu ou sans crédit
**Solution :** Vérifiez votre compte sur console.twilio.com

#### B4. Le Dashboard ne contacte pas l'API
**Solution :** Vérifiez `SMS_API_URL` dans `jdc-sms-dashboard` → Environment
Doit être : `https://jdc-sms-api.onrender.com/api`

---

## 📋 INFORMATIONS DONT J'AI BESOIN

Pour vous aider davantage, envoyez-moi :

### 1. Logs de jdc-sms-api (30 dernières lignes)

```
Render Dashboard → jdc-sms-api → Logs → Copiez les logs
```

Cherchez particulièrement :
- `✅ Twilio configuré avec succès` ou `ERREUR: TWILIO_SID`
- Messages d'erreur lors de l'envoi

### 2. Logs de jdc-sms-dashboard quand vous tentez d'envoyer

```
Render Dashboard → jdc-sms-dashboard → Logs → Tentez d'envoyer un SMS → Copiez les logs
```

### 3. Résultat du test curl

```bash
curl -X POST https://jdc-sms-api.onrender.com/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"+33VOTRE_NUMERO","message":"Test"}'
```

Copiez la réponse complète.

### 4. Capture d'écran des variables d'environnement

```
Render Dashboard → jdc-sms-api → Environment → Screenshot (masquez les valeurs sensibles)
```

Montrez-moi juste les **NOMS** des variables (pas les valeurs).

---

## 🚀 ACTION IMMÉDIATE

1. **Vérifiez que le service est "Live"** (pas "Building")
2. **Ouvrez les Logs de jdc-sms-api**
3. **Cherchez "✅ Twilio configuré" OU "ERREUR: TWILIO"**
4. **Copiez-moi les 20 dernières lignes des logs**

**Dites-moi ce que vous voyez dans les logs de jdc-sms-api !** 🔍
