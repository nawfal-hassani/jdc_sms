# Guide de configuration après le clonage du projet

## 1. Installation des dépendances

Après avoir cloné le dépôt, lance la commande suivante à la racine du projet :

```sh
make install
```

Cela installera toutes les dépendances nécessaires pour chaque sous-projet (API, dashboard, etc.).

---

## 2. Fichier `.env` à remplir

Pour que l'application fonctionne correctement, tu dois créer un fichier `.env` dans le dossier `JDC/smsjdc/` (ou à la racine de chaque service si besoin).

### Exemple de contenu pour `JDC/smsjdc/.env` :

```
# Port d'écoute du serveur
PORT=3030

# URL de l'API SMS (adapter si tu utilises Railway, Render, etc.)
SMS_API_URL=http://localhost:3000/api

# Clé secrète pour les tokens JWT
JWT_SECRET=une_chaine_secrete_a_modifier

# (Optionnel) Autres variables selon ton besoin
# STRIPE_SECRET_KEY=sk_test_...
# ...
```

**À adapter selon ton environnement !**

- Si tu déploies sur Render, Railway, etc., adapte les URLs et secrets.
- Ne partage jamais le `.env` sur GitHub.

---

## 3. Lancement du projet

Pour démarrer le dashboard :

```sh
cd JDC/smsjdc
node server.js
```

Ou utilise `make run` à la racine si disponible.

---

## 4. Résumé des fichiers à remplir

- `JDC/smsjdc/.env` : obligatoire (voir exemple ci-dessus)
- (Optionnel) `.env` dans d'autres sous-dossiers si tu as plusieurs services

---

**Besoin d'aide ?**

- Vérifie les README.md de chaque dossier
- Contacte le mainteneur du projet si tu as un doute sur une variable
