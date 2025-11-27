# Guide d'utilisation du Makefile JDC

Ce Makefile permet de simplifier l'installation, le lancement et la gestion des dépendances du projet JDC (API, dashboard, etc.). Voici comment l'utiliser et ce que fait chaque commande :

## 1. Installation des dépendances

```sh
make install
```
- Installe automatiquement toutes les dépendances nécessaires pour chaque sous-projet (API, dashboard, etc.).
- Équivaut à faire `npm install` ou `yarn install` dans chaque dossier concerné.

## 2. Lancer le dashboard

```sh
make run
```
- Démarre le serveur principal du dashboard (exécute le fichier `server.js` dans `JDC/smsjdc/`).
- Peut aussi lancer d'autres services si configuré dans le Makefile.

## 3. Nettoyer les dépendances

```sh
make clean
```
- Supprime les dossiers `node_modules` et les fichiers de dépendances générés pour repartir sur une base propre.

## 4. Autres commandes possibles

- `make test` : lance les tests unitaires si définis dans le Makefile.
- `make build` : construit les assets ou prépare le projet pour la production (si la règle existe).

## 5. Fonctionnement général

- Le Makefile automatise les tâches courantes pour éviter d'avoir à répéter les mêmes commandes dans chaque sous-dossier.
- Il détecte les sous-projets et exécute les commandes nécessaires dans chacun d'eux.
- Tu peux ouvrir le fichier `Makefile` à la racine du projet pour voir ou modifier les règles.

**Astuce :**
- Tape simplement `make` pour voir la liste des commandes disponibles (si la règle `.PHONY: help` existe).

---

**En résumé :**
- `make install` → installe tout
- `make run` → lance le dashboard
- `make clean` → nettoie les dépendances
- `make test` → lance les tests (si dispo)

N'hésite pas à adapter le Makefile selon tes besoins !
