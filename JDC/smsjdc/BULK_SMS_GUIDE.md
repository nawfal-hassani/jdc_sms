# Envoi Groupé de SMS - Guide d'utilisation

## Vue d'ensemble

La fonctionnalité d'envoi groupé permet d'envoyer des SMS à plusieurs destinataires en une seule opération via l'import d'un fichier CSV ou Excel.

## Fonctionnalités

✅ **Import de fichiers**
- Support des formats CSV, Excel (.xlsx, .xls)
- Glisser-déposer ou sélection de fichier
- Template CSV téléchargeable

✅ **Validation automatique**
- Vérification des numéros de téléphone (format international)
- Validation de la longueur des messages (max 160 caractères)
- Détection des champs manquants

✅ **Prévisualisation**
- Tableau récapitulatif avant envoi
- Statistiques : valides, invalides, total
- Possibilité d'ignorer les entrées invalides

✅ **Suivi en temps réel**
- Barre de progression
- Statistiques en direct (réussis, échecs)
- Journal d'envoi détaillé
- Estimation du temps restant

✅ **Contrôles d'envoi**
- Pause/Reprise de l'envoi
- Arrêt d'urgence
- Délai configurable entre les envois

✅ **Export de rapport**
- Rapport CSV des résultats
- Statistiques finales complètes

## Format du fichier

### Colonnes requises

Le fichier doit contenir les colonnes suivantes (l'ordre et la casse n'ont pas d'importance) :

| Colonne | Alternatives acceptées | Obligatoire | Description |
|---------|----------------------|-------------|-------------|
| `phone` | `telephone`, `tel`, `numero`, `number` | ✅ Oui | Numéro au format international (+33...) |
| `message` | `texte`, `text`, `sms`, `contenu` | ✅ Oui | Contenu du SMS (max 160 caractères) |
| `name` | `nom`, `prenom`, `firstname` | ❌ Non | Nom du destinataire (pour référence) |

### Exemple de fichier CSV

```csv
phone,message,name
+33612345678,"Bonjour, ceci est un message de test",Jean Dupont
+33698765432,"Deuxième message de test",Marie Martin
+33654321098,"Troisième message",Pierre Durand
```

### Exemple de fichier Excel

| phone | message | name |
|-------|---------|------|
| +33612345678 | Bonjour, ceci est un message de test | Jean Dupont |
| +33698765432 | Deuxième message de test | Marie Martin |
| +33654321098 | Troisième message | Pierre Durand |

## Utilisation

### Étape 1 : Préparer le fichier

1. Téléchargez le template CSV depuis l'interface
2. Remplissez-le avec vos données
3. Vérifiez que les numéros sont au format international (+33...)
4. Vérifiez que les messages ne dépassent pas 160 caractères

### Étape 2 : Importer le fichier

1. Cliquez sur l'onglet "Envoi Groupé" dans la sidebar
2. Glissez-déposez votre fichier ou cliquez sur "Choisir un fichier"
3. Attendez le chargement et la validation

### Étape 3 : Prévisualiser

1. Consultez les statistiques (valides/invalides)
2. Parcourez le tableau de prévisualisation
3. Vérifiez les erreurs éventuelles
4. Configurez les options :
   - ☑️ Ignorer les entrées invalides
   - ⏱️ Délai entre les envois (recommandé : 1000ms)

### Étape 4 : Envoyer

1. Cliquez sur "Envoyer les SMS"
2. Suivez la progression en temps réel
3. Utilisez Pause/Reprendre si nécessaire
4. Cliquez sur Arrêter en cas d'urgence

### Étape 5 : Consulter les résultats

1. Visualisez les statistiques finales
2. Exportez le rapport au format CSV
3. Lancez un nouvel envoi groupé si besoin

## Paramètres

### Délai entre les envois

Le délai entre chaque envoi permet de :
- Respecter les limites de taux de l'API SMS
- Éviter d'être bloqué par les opérateurs
- Répartir la charge sur le serveur

**Recommandations :**
- Minimum : 100ms (pour tests uniquement)
- Recommandé : 1000ms (1 seconde)
- Maximum : 10000ms (10 secondes)

## Validation des données

### Numéro de téléphone

✅ **Formats valides :**
- `+33612345678`
- `+33 6 12 34 56 78`
- `33612345678`

❌ **Formats invalides :**
- `0612345678` (pas de format international)
- `+33 6 12` (trop court)
- `abc123` (caractères non numériques)

### Message

✅ **Messages valides :**
- Longueur : 1 à 160 caractères
- Tout type de texte (Unicode supporté)
- Emojis acceptés (comptent comme plusieurs caractères)

❌ **Messages invalides :**
- Vide
- Plus de 160 caractères

## Gestion des erreurs

### Erreurs de fichier

- **"Format de fichier non supporté"**
  - Solution : Utilisez uniquement .csv, .xlsx ou .xls

- **"Le fichier est vide"**
  - Solution : Assurez-vous que le fichier contient des données

- **"Colonnes manquantes"**
  - Solution : Vérifiez que les colonnes `phone` et `message` sont présentes

### Erreurs de validation

- **"Numéro de téléphone invalide"**
  - Solution : Utilisez le format international (+33...)

- **"Message trop long"**
  - Solution : Réduisez le message à 160 caractères maximum

- **"Champ manquant"**
  - Solution : Remplissez tous les champs obligatoires

### Erreurs d'envoi

- **"Erreur lors de l'envoi"**
  - Solution : Vérifiez la connexion à l'API SMS
  - Solution : Vérifiez que l'API SMS est démarrée

- **"Quota dépassé"**
  - Solution : Attendez que le quota soit réinitialisé
  - Solution : Contactez l'administrateur pour augmenter le quota

## Limitations

- **Taille maximale du fichier :** 5 MB
- **Nombre maximum de destinataires :** Pas de limite technique (dépend de l'API SMS)
- **Longueur du message :** 160 caractères maximum
- **Formats supportés :** CSV, Excel (.xlsx, .xls)

## Bonnes pratiques

1. **Testez avec un petit échantillon** avant d'envoyer à tous vos destinataires
2. **Vérifiez vos données** avant l'import (numéros, messages)
3. **Utilisez le template** fourni pour garantir la compatibilité
4. **Respectez un délai** raisonnable entre les envois (1 seconde recommandé)
5. **Exportez le rapport** pour conserver une trace des envois
6. **Surveillez les quotas** de votre API SMS

## Support

Pour toute question ou problème, consultez :
- La documentation principale du dashboard
- Les logs du serveur en cas d'erreur
- Le journal d'envoi dans l'interface

## API Endpoints

### Upload et validation

```http
POST /api/bulk-sms/upload
Content-Type: multipart/form-data

file: [fichier CSV ou Excel]
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "lineNumber": 1,
      "phone": "+33612345678",
      "message": "Test",
      "name": "Jean Dupont",
      "valid": true,
      "errors": []
    }
  ],
  "stats": {
    "total": 100,
    "valid": 98,
    "invalid": 2
  }
}
```

### Télécharger le template

```http
GET /api/bulk-sms/template
```

**Réponse :** Fichier CSV template

## Changelog

### Version 1.0.0 (28 octobre 2025)
- ✨ Première version de l'envoi groupé
- 📁 Support CSV et Excel
- ✅ Validation automatique
- 📊 Suivi en temps réel
- 📥 Export de rapport
- ⏸️ Contrôles Pause/Stop
