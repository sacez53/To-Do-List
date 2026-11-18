# Directives du projet To-Do List

## 1. Périmètre

Le projet est une application web uniquement. Les changements concernent les fichiers à la racine, `pages/` et `assets/`, ainsi que les tests et la documentation associés.

L'application Windows est abandonnée. Ne pas recréer `win_app`, de paquet Electron, de lanceur ou d'installeur Windows. Les anciennes obligations de synchronisation et d'archivage Windows sont supprimées.

## 2. Numéro de version et cache

À chaque mise à jour, incrémenter le numéro de version web selon le versionnage sémantique : patch pour un correctif, mineure pour une évolution fonctionnelle, majeure pour une refonte structurante.

Aligner la version dans `assets/json/version.json`, `package.json`, `package-lock.json`, le titre du `README.md` et les valeurs affichées par défaut dans les pages HTML.

Incrémenter aussi `CACHE_NAME = 'todo-list-cache-v...'` dans `sw.js`. Aligner les suffixes `?v=...` du précache et des pages HTML sur ce nouveau numéro de cache.

## 3. Vérification

Exécuter `npm test` pour les tests de logique. Après une modification d'un parcours ou d'une page, exécuter aussi `npm run test:ui`. Cette recette utilise un navigateur isolé et un serveur Firebase fictif.

Le site est statique : aucun paquet d'application de bureau n'est nécessaire pour le lancer ou le publier.

## 4. Comportement des tâches et modales

- Un clic sur le nom ou le texte d'une tâche ouvre uniquement le résumé en lecture seule, avec le titre, les badges, l'échéance et les notes.
- Le bouton « Modifier » ouvre le formulaire éditable avec Enregistrer, Annuler et Supprimer.
- Le bouton « Modifier » du résumé ouvre ce même formulaire d'édition.
