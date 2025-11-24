# Configuration Stripe - Guide Complet

## 📋 Étapes de Configuration

### 1. Créer un Compte Stripe

1. Allez sur https://dashboard.stripe.com/register
2. Créez votre compte (email, mot de passe, pays: France)
3. Activez votre compte (vérification email)
4. Remplissez les informations de votre entreprise

### 2. Récupérer les Clés API

#### Mode Test (pour le développement)

1. Connectez-vous à https://dashboard.stripe.com
2. Allez dans **Développeurs** → **Clés API**
3. Copiez les clés suivantes :
   - **Clé publiable** : `pk_test_...`
   - **Clé secrète** : `sk_test_...`

#### Mode Production (pour la mise en ligne)

⚠️ À utiliser UNIQUEMENT après avoir activé votre compte Stripe complètement

1. Activez le mode "Live" dans le dashboard
2. Récupérez les clés de production :
   - **Clé publiable** : `pk_live_...`
   - **Clé secrète** : `sk_live_...`

### 3. Configurer les Variables d'Environnement

Éditez le fichier `/JDC/smsjdc/.env` :

```env
# Stripe Configuration (Mode Test)
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE
STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIABLE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK
```

**⚠️ IMPORTANT** : 
- NE JAMAIS commit le fichier `.env` sur GitHub
- Utilisez les clés de TEST pour le développement
- Passez aux clés LIVE uniquement en production

### 4. Configurer les Webhooks

Les webhooks permettent à Stripe de notifier votre serveur des événements (paiements réussis, échecs, etc.)

#### En Local (Développement)

1. Installez Stripe CLI :
   ```bash
   # Sur Linux
   wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
   tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
   sudo mv stripe /usr/local/bin/
   ```

2. Connectez Stripe CLI à votre compte :
   ```bash
   stripe login
   ```

3. Redirigez les webhooks vers votre serveur local :
   ```bash
   stripe listen --forward-to http://localhost:3030/api/stripe/webhook
   ```

4. Copiez le secret webhook affiché (`whsec_...`) dans votre `.env`

#### En Production (VPS)

1. Allez dans **Développeurs** → **Webhooks** dans le dashboard Stripe
2. Cliquez sur **+ Ajouter un endpoint**
3. URL du endpoint : `https://votre-domaine.com/api/stripe/webhook`
4. Sélectionnez les événements à écouter :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copiez le **Secret de signature** et ajoutez-le dans votre `.env` en production

### 5. Tester l'Intégration

#### Cartes de Test Stripe

Utilisez ces cartes pour tester :

| Carte | Numéro | CVC | Date | Résultat |
|-------|--------|-----|------|----------|
| Visa | `4242 4242 4242 4242` | N'importe | Futur | Succès |
| Visa (3D Secure) | `4000 0027 6000 3184` | N'importe | Futur | Succès avec authentification |
| Visa (échec) | `4000 0000 0000 0002` | N'importe | Futur | Échec de paiement |
| Mastercard | `5555 5555 5555 4444` | N'importe | Futur | Succès |

#### Test du Flow Complet

1. Démarrez votre serveur :
   ```bash
   cd /home/hassani/jdc_test-/JDC/smsjdc
   npm start
   ```

2. Ouvrez http://localhost:3030 dans votre navigateur

3. Allez dans l'onglet **Facturation**

4. Cliquez sur **Acheter** pour un pack

5. Utilisez la carte de test `4242 4242 4242 4242`

6. Vérifiez que :
   - Le paiement réussit
   - Vous êtes redirigé vers `/payment-success.html`
   - Les crédits sont ajoutés à votre compte
   - Le webhook a été reçu (vérifiez les logs du serveur)

### 6. Vérifications de Sécurité

✅ **Checklist de Sécurité** :

- [ ] `.env` est dans `.gitignore`
- [ ] Les clés secrètes ne sont jamais dans le code frontend
- [ ] Les webhooks sont signés et vérifiés
- [ ] HTTPS activé en production
- [ ] Les montants sont validés côté serveur
- [ ] Les userId sont vérifiés avant d'ajouter des crédits

### 7. Passer en Production

#### Avant de Passer en LIVE :

1. **Activez votre compte Stripe** :
   - Fournissez les documents requis
   - Complétez les informations fiscales
   - Activez les paiements en production

2. **Remplacez les clés dans `.env`** :
   ```env
   STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_LIVE
   STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_LIVE
   ```

3. **Configurez le webhook de production** (voir étape 4)

4. **Testez avec de vrais paiements** (petits montants)

5. **Surveillez le dashboard Stripe** pour les paiements et erreurs

## 📊 Tarification Stripe

### Frais par Transaction

| Type | Frais |
|------|-------|
| Carte européenne | 1,4% + 0,25 € |
| Carte hors Europe | 2,9% + 0,25 € |
| SEPA Direct Debit | 0,8% (max 5€) |

### Exemple de Calcul

**Pack 100 SMS - 6,00 €** :
- Montant facturé : 6,00 €
- Frais Stripe : (6,00 × 1,4%) + 0,25 = 0,084 + 0,25 = **0,334 €**
- Vous recevez : 6,00 - 0,334 = **5,666 €**
- Coût SMS wholesale : 100 × 0,02 = 2,00 €
- Profit net : 5,666 - 2,00 = **3,666 €** (61% de marge)

## 🔗 Ressources Utiles

- **Dashboard Stripe** : https://dashboard.stripe.com
- **Documentation API** : https://stripe.com/docs/api
- **Webhooks** : https://stripe.com/docs/webhooks
- **Cartes de test** : https://stripe.com/docs/testing
- **Stripe CLI** : https://stripe.com/docs/stripe-cli

## 🆘 Support

En cas de problème :

1. **Vérifiez les logs du serveur** pour les erreurs
2. **Consultez les webhooks** dans le dashboard Stripe
3. **Testez avec Stripe CLI** en local
4. **Contactez le support Stripe** (très réactif)

## ✅ Checklist de Mise en Service

- [ ] Compte Stripe créé et vérifié
- [ ] Clés API de test récupérées
- [ ] Variables d'environnement configurées
- [ ] Stripe CLI installé et configuré
- [ ] Webhook local testé avec succès
- [ ] Paiement test réussi
- [ ] Crédits ajoutés correctement
- [ ] Pages de succès/annulation fonctionnelles
- [ ] Logs du serveur vérifiés
- [ ] Prêt pour la production ✨

---

**Note** : Gardez ce document à jour avec vos configurations spécifiques !
