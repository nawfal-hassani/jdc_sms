# Test de l'Intégration Stripe

## ✅ Checklist d'Installation

Vérifiez que tous ces éléments sont en place :

- [x] **Backend**
  - [x] Package Stripe installé (`npm install stripe`)
  - [x] Service Stripe créé (`/src/services/stripeService.js`)
  - [x] Routes Stripe créées (`/src/routes/stripe.js`)
  - [x] Routes intégrées au serveur (`server.js`)
  - [x] Variables d'environnement configurées (`.env`)

- [x] **Frontend**
  - [x] Service de paiement créé (`/public/js/stripe-payment.js`)
  - [x] CSS ajouté (`/public/css/components/stripe-payment.css`)
  - [x] Scripts intégrés à `index.html`
  - [x] Pages de succès/annulation créées

## 🧪 Tests à Effectuer

### 1. Configuration Initiale

```bash
# 1. Vérifier que le package Stripe est installé
cd /home/hassani/jdc_test-/JDC/smsjdc
npm list stripe

# 2. Vérifier que les fichiers existent
ls -la src/services/stripeService.js
ls -la src/routes/stripe.js
ls -la public/js/stripe-payment.js

# 3. Configurer les clés Stripe dans .env
nano .env
# Ajouter vos clés de test Stripe
```

### 2. Test du Backend

```bash
# Démarrer le serveur
npm start

# Dans un autre terminal, tester les endpoints
curl http://localhost:3030/api/stripe/packs
curl http://localhost:3030/api/stripe/subscriptions
```

**Réponses attendues :**
- `/api/stripe/packs` : Liste de 5 packs SMS
- `/api/stripe/subscriptions` : Liste de 3 plans d'abonnement

### 3. Test du Frontend

1. **Ouvrir l'application** : http://localhost:3030

2. **Aller dans l'onglet Facturation**

3. **Vérifier l'affichage des packs** :
   - Les 5 packs doivent s'afficher avec leur prix
   - Le pack "POPULAIRE" doit avoir un badge
   - Les boutons "Acheter" doivent être présents

4. **Tester le flow de paiement** :
   - Cliquer sur "Acheter" pour un pack
   - Vérifier la redirection vers Stripe Checkout
   - Utiliser la carte de test : `4242 4242 4242 4242`
   - Vérifier la redirection vers `/payment-success.html`

### 4. Test des Webhooks (Local)

```bash
# Installer Stripe CLI
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/

# Se connecter à Stripe
stripe login

# Rediriger les webhooks vers le serveur local
stripe listen --forward-to http://localhost:3030/api/stripe/webhook
```

**Dans un autre terminal, simuler un webhook :**
```bash
stripe trigger checkout.session.completed
```

**Vérifier dans les logs du serveur :**
- Le webhook doit être reçu
- Les crédits doivent être ajoutés à l'utilisateur
- Le fichier `data/user-credits.json` doit être mis à jour

### 5. Test des Cartes de Test Stripe

| Test | Carte | CVC | Date | Résultat Attendu |
|------|-------|-----|------|------------------|
| Succès | `4242 4242 4242 4242` | 123 | 12/34 | ✅ Paiement réussi |
| 3D Secure | `4000 0027 6000 3184` | 123 | 12/34 | ✅ Avec authentification |
| Échec | `4000 0000 0000 0002` | 123 | 12/34 | ❌ Paiement refusé |
| Mastercard | `5555 5555 5555 4444` | 123 | 12/34 | ✅ Paiement réussi |

## 🐛 Dépannage

### Erreur : "Stripe is not defined"

**Solution :** Vérifiez que les clés sont bien dans `.env` :
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Erreur : "Module 'stripe' not found"

**Solution :**
```bash
cd /home/hassani/jdc_test-/JDC/smsjdc
npm install stripe
```

### Webhooks non reçus

**Solution :**
1. Vérifiez que Stripe CLI est en cours d'exécution
2. Vérifiez le secret webhook dans `.env`
3. Regardez les logs du serveur pour les erreurs

### Les packs ne s'affichent pas

**Solution :**
1. Ouvrez la console du navigateur (F12)
2. Vérifiez les erreurs JavaScript
3. Testez manuellement l'API : `curl http://localhost:3030/api/stripe/packs`

### Erreur de redirection après paiement

**Solution :**
1. Vérifiez que les URLs de succès/annulation sont correctes
2. Vérifiez que les fichiers `payment-success.html` et `payment-cancel.html` existent
3. Testez manuellement : http://localhost:3030/payment-success.html

## 📊 Validation Finale

### Backend

- [ ] Le serveur démarre sans erreur
- [ ] `/api/stripe/packs` renvoie 5 packs
- [ ] `/api/stripe/subscriptions` renvoie 3 plans
- [ ] `/api/stripe/create-checkout` crée une session
- [ ] Les webhooks sont reçus et traités
- [ ] Les crédits sont ajoutés après paiement

### Frontend

- [ ] Les packs s'affichent correctement
- [ ] Le bouton "Acheter" fonctionne
- [ ] La redirection vers Stripe Checkout fonctionne
- [ ] Les pages de succès/annulation s'affichent
- [ ] Le solde SMS est mis à jour après achat

### Sécurité

- [ ] `.env` est dans `.gitignore`
- [ ] Les clés secrètes ne sont pas dans le code frontend
- [ ] Les webhooks sont signés et vérifiés
- [ ] Les montants sont validés côté serveur

## 🚀 Prochaines Étapes

Une fois tous les tests passés :

1. **Créer un compte Stripe réel** : https://dashboard.stripe.com/register
2. **Récupérer les clés de production** (pk_live_... et sk_live_...)
3. **Configurer les webhooks en production**
4. **Activer le compte Stripe** (fournir documents KYC)
5. **Déployer sur VPS** avec HTTPS
6. **Tester avec de vrais paiements** (petits montants)

## 📝 Notes

- Utilisez TOUJOURS les clés de TEST en développement
- Ne commitez JAMAIS le fichier `.env`
- Surveillez le dashboard Stripe pour les paiements
- Gardez les logs du serveur pour le débogage

---

**Date de création :** $(date)
**Version Stripe SDK :** $(npm list stripe | grep stripe)
