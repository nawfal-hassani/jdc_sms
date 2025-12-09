# 🚀 Configuration Render - Guide Étape par Étape

## ✅ CE QUE VOUS DEVEZ FAIRE MAINTENANT

---

## 📱 ÉTAPE 1 : Récupérer vos identifiants Twilio (5 minutes)

### 1. Ouvrez Twilio Console
👉 [https://console.twilio.com/](https://console.twilio.com/)

### 2. Copiez ces 3 informations :

#### A. Account SID
- **Où ?** En haut à droite de la page
- **Ressemble à :** `AC1234567890abcdef1234567890abcd`
- **Action :** Cliquez sur l'icône 📋 pour copier
- **Notez-le ici :** ___________________________________

#### B. Auth Token
- **Où ?** Juste en dessous de Account SID
- **Action :** Cliquez sur **"View"** puis copiez
- **Ressemble à :** `abcdef1234567890abcdef1234567890`
- **Notez-le ici :** ___________________________________

#### C. Votre numéro Twilio
- **Où ?** Menu gauche → **Phone Numbers** → **Manage** → **Active numbers**
- **Format :** `+33612345678` (SANS ESPACES !)
- **Exemple :** Si c'est `+33 6 12 34 56 78`, enlevez les espaces → `+33612345678`
- **Notez-le ici :** ___________________________________

---

## 🔧 ÉTAPE 2 : Configurer jdc-sms-api (10 minutes)

### 1. Allez sur Render Dashboard
👉 [https://dashboard.render.com/](https://dashboard.render.com/)

### 2. Cliquez sur votre service **jdc-sms-api**

### 3. Dans le menu de gauche, cliquez sur **"Environment"**

### 4. Ajoutez ces variables UNE PAR UNE :

#### Variable 1 : NODE_ENV
```
Cliquez "Add Environment Variable"
Key:   NODE_ENV
Value: production
```

#### Variable 2 : PORT
```
Cliquez "Add Environment Variable"
Key:   PORT
Value: 3000
```

#### Variable 3 : TWILIO_SID ⚠️ IMPORTANT
```
Cliquez "Add Environment Variable"
Key:   TWILIO_SID
Value: [COLLEZ VOTRE ACCOUNT SID ICI]
```

#### Variable 4 : TWILIO_TOKEN ⚠️ IMPORTANT
```
Cliquez "Add Environment Variable"
Key:   TWILIO_TOKEN
Value: [COLLEZ VOTRE AUTH TOKEN ICI]
```

#### Variable 5 : TWILIO_PHONE ⚠️ IMPORTANT
```
Cliquez "Add Environment Variable"
Key:   TWILIO_PHONE
Value: [COLLEZ VOTRE NUMÉRO SANS ESPACES, ex: +33612345678]
```

#### Variable 6 : SMS_PROVIDER
```
Cliquez "Add Environment Variable"
Key:   SMS_PROVIDER
Value: twilio
```

#### Variable 7 : API_KEY (DÉJÀ FAIT ✅)
```
Vous avez déjà :
Key:   API_KEY
Value: b98ae93f943269afc484f298415ae5d4
```

### 5. Cliquez sur **"Save Changes"** en bas

### 6. Attendez 2-3 minutes que le service redémarre

---

## 🎨 ÉTAPE 3 : Configurer jdc-sms-dashboard (10 minutes)

### 1. Sur Render Dashboard, cliquez sur votre service **jdc-sms-dashboard**

### 2. Dans le menu de gauche, cliquez sur **"Environment"**

### 3. Ajoutez ces variables UNE PAR UNE :

#### Variable 1 : NODE_ENV
```
Cliquez "Add Environment Variable"
Key:   NODE_ENV
Value: production
```

#### Variable 2 : PORT
```
Cliquez "Add Environment Variable"
Key:   PORT
Value: 3030
```

#### Variable 3 : SMS_API_URL
```
Cliquez "Add Environment Variable"
Key:   SMS_API_URL
Value: https://jdc-sms-api.onrender.com/api
```
⚠️ Remplacez `jdc-sms-api` par le nom exact de votre service API si différent

#### Variable 4 : SMS_API_KEY ⚠️ IMPORTANT
```
Cliquez "Add Environment Variable"
Key:   SMS_API_KEY
Value: b98ae93f943269afc484f298415ae5d4
```
(C'est la même valeur que API_KEY de l'API)

#### Variable 5 : JWT_SECRET
```
Cliquez "Add Environment Variable"
Key:   JWT_SECRET
☑️  Cochez "Generate Value" (ne tapez rien dans Value)
```

#### Variable 6 : SESSION_SECRET
```
Cliquez "Add Environment Variable"
Key:   SESSION_SECRET
☑️  Cochez "Generate Value" (ne tapez rien dans Value)
```

### 4. Cliquez sur **"Save Changes"** en bas

### 5. Attendez 2-3 minutes que le service redémarre

---

## 🎯 ÉTAPE 4 : Vérification (5 minutes)

### 1. Vérifier que l'API fonctionne
Ouvrez dans votre navigateur :
```
https://jdc-sms-api.onrender.com/api/health
```

Vous devriez voir :
```json
{
  "status": "ok",
  "service": "SMS API"
}
```

### 2. Vérifier que le Dashboard fonctionne
Ouvrez dans votre navigateur :
```
https://jdc-sms-dashboard.onrender.com
```

Vous devriez voir la page de connexion du Dashboard ✅

### 3. Vérifier les logs

#### Pour l'API :
1. Allez sur le service **jdc-sms-api** sur Render
2. Cliquez sur **"Logs"** dans le menu
3. Cherchez :
```
✅ Server listening on port 3000
✅ Twilio client initialized
```

#### Pour le Dashboard :
1. Allez sur le service **jdc-sms-dashboard** sur Render
2. Cliquez sur **"Logs"** dans le menu
3. Cherchez :
```
✅ Server running on port 3030
✅ Connected to SMS API
```

---

## 🎉 ÉTAPE 5 : Test d'envoi de SMS

1. Connectez-vous au Dashboard : `https://jdc-sms-dashboard.onrender.com`

2. Allez dans l'onglet **"Envoyer SMS"**

3. Testez avec :
   - **Destinataire :** Votre numéro de téléphone (format +33...)
   - **Message :** "Test depuis Render"

4. Cliquez **"Envoyer"**

5. Vous devriez recevoir le SMS ! 📱

---

## ❌ EN CAS D'ERREUR

### Erreur : "TWILIO_SID is not defined"
→ Vous avez oublié d'ajouter `TWILIO_SID` dans les variables de l'API
→ Retournez à l'ÉTAPE 2, Variable 3

### Erreur : "Invalid credentials"
→ Vérifiez que `TWILIO_SID` et `TWILIO_TOKEN` sont corrects sur Twilio Console
→ Retournez à l'ÉTAPE 1 et re-copiez-les

### Erreur : "Invalid phone number"
→ Le numéro doit être `+33612345678` (SANS ESPACES)
→ Retournez à l'ÉTAPE 2, Variable 5

### Erreur : "Cannot connect to SMS API"
→ Vérifiez que `SMS_API_URL` est correct dans le Dashboard
→ Retournez à l'ÉTAPE 3, Variable 3

### Le service est "Suspended" ou "Failed"
→ Consultez les logs (menu **"Logs"** du service)
→ Cherchez l'erreur exacte dans les dernières lignes

---

## 📋 CHECKLIST FINALE

Cochez quand c'est fait :

### API (jdc-sms-api)
- [ ] NODE_ENV = production
- [ ] PORT = 3000
- [ ] TWILIO_SID = (votre SID Twilio)
- [ ] TWILIO_TOKEN = (votre Token Twilio)
- [ ] TWILIO_PHONE = (format +33612345678)
- [ ] SMS_PROVIDER = twilio
- [ ] API_KEY = b98ae93f943269afc484f298415ae5d4

### Dashboard (jdc-sms-dashboard)
- [ ] NODE_ENV = production
- [ ] PORT = 3030
- [ ] SMS_API_URL = https://jdc-sms-api.onrender.com/api
- [ ] SMS_API_KEY = b98ae93f943269afc484f298415ae5d4
- [ ] JWT_SECRET = (généré par Render)
- [ ] SESSION_SECRET = (généré par Render)

### Tests
- [ ] L'API répond sur /api/health
- [ ] Le Dashboard s'affiche dans le navigateur
- [ ] Les logs de l'API montrent "Twilio initialized"
- [ ] Les logs du Dashboard montrent "Connected to SMS API"
- [ ] Test d'envoi de SMS réussi

---

## 🚀 TEMPS TOTAL : ~30 MINUTES

Étape 1 : 5 minutes (Twilio)
Étape 2 : 10 minutes (API)
Étape 3 : 10 minutes (Dashboard)
Étape 4 : 5 minutes (Vérification)

---

**Vous êtes bloqué quelque part ? Dites-moi à quelle étape !** 😊
