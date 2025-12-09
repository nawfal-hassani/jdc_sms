# 📋 Template Variables Render - Copier-Coller

## 🔧 SERVICE : jdc-sms-api

### COPIEZ-COLLEZ CES LIGNES UNE PAR UNE :

```
Key: NODE_ENV
Value: production
---
Key: PORT
Value: 3000
---
Key: TWILIO_SID
Value: [VOTRE_ACCOUNT_SID_TWILIO_ICI]
---
Key: TWILIO_TOKEN
Value: [VOTRE_AUTH_TOKEN_TWILIO_ICI]
---
Key: TWILIO_PHONE
Value: [VOTRE_NUMERO_FORMAT_+33612345678]
---
Key: SMS_PROVIDER
Value: twilio
---
Key: API_KEY
Value: b98ae93f943269afc484f298415ae5d4
```

---

## 🎨 SERVICE : jdc-sms-dashboard

### COPIEZ-COLLEZ CES LIGNES UNE PAR UNE :

```
Key: NODE_ENV
Value: production
---
Key: PORT
Value: 3030
---
Key: SMS_API_URL
Value: https://jdc-sms-api.onrender.com/api
---
Key: SMS_API_KEY
Value: b98ae93f943269afc484f298415ae5d4
---
Key: JWT_SECRET
☑️  Cochez "Generate Value"
---
Key: SESSION_SECRET
☑️  Cochez "Generate Value"
```

---

## 📝 OÙ TROUVER VOS IDENTIFIANTS TWILIO ?

1. **Account SID** → [https://console.twilio.com/](https://console.twilio.com/) (en haut à droite)
2. **Auth Token** → Cliquez "View" sous Account SID
3. **Numéro** → Menu Phone Numbers → Active numbers (format +33612345678 SANS ESPACES)

---

## ✅ APRÈS CONFIGURATION

### Test API :
Ouvrez : https://jdc-sms-api.onrender.com/api/health

### Test Dashboard :
Ouvrez : https://jdc-sms-dashboard.onrender.com

---

## 🆘 AIDE RAPIDE

**Erreur "TWILIO_SID is not defined"**
→ Ajoutez TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE dans l'API

**Erreur "Invalid phone number"**
→ Format : +33612345678 (SANS ESPACES)

**Erreur "Cannot connect to API"**
→ Vérifiez SMS_API_URL dans le Dashboard

---

**Temps estimé : 20 minutes** ⏱️
