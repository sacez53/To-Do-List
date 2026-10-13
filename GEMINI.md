# Directives et Règles du Projet To-Do List

Ce fichier contient les consignes persistantes et obligatoires pour l'assistant IA sur ce projet.

---

## 1. Incrémentation Systématique des Numéros de Version (Web & Windows)

> [!IMPORTANT]
> **RÈGLE OBLIGATOIRE (MÉMOIRE DU PROJET)** :
> À chaque mise à jour, ajout de fonctionnalité, modification ou correction de bug :
> 1. **Incrémenter systématiquement le numéro de version** des applications Web et Windows (respecter le versionnage sémantique : patch pour un correctif, mineure pour une nouvelle fonctionnalité, majeure pour une refonte structurante).
> 2. **Aligner et mettre à jour le numéro de version dans tous les fichiers cibles** :
>    - `assets/json/version.json` (application Web)
>    - `win_app/assets/json/version.json` (application Windows)
>    - `win_app/package.json` (champ `"version"`)
>    - `sw.js` (incrémenter `CACHE_NAME = 'todo-list-cache-v...'` et les suffixes `?v=...` pour invalider le cache des navigateurs)
>    - `win_app/release/ToDoList-win32-x64/resources/app/package.json` et `win_app/release/ToDoList-win32-x64/resources/app/assets/json/version.json` (version portable immédiate).

---

## 2. Gestion des Versions de l'Application Windows (`win_app`)

> [!IMPORTANT]
> **RÈGLE OBLIGATOIRE (MÉMOIRE DU PROJET)** :
> À chaque nouvelle version de l'application (incrémentation de version) :
> 1. **Créer systématiquement un nouveau dossier de version** pour l'application Windows dans `win_app/versions/<version>/` (ex. `win_app/versions/v5.0/`, `win_app/versions/v5.1/`, etc.).
> 2. Y archiver l'ensemble des fichiers de l'application Windows pour cette version (`src/`, `main.js`, `package.json`, `assets/`, `build/`, `ToDoList.exe`, `README.md`).
> 3. Créer également le dossier de release correspondant dans `win_app/release/<version>/` contenant le build packagé (`ToDoList-win32-x64`).
> 4. Ne jamais écraser ou supprimer les dossiers des versions précédentes : chaque version doit conserver son propre dossier d'archive daté/versionné.

---

## 3. Synchronisation Web & Application Windows

- Toute amélioration ou correction apportée à l'application web (`pages/app-v2.html`, `assets/js/app-v2.js`, `assets/css/style2.css`, `assets/js/calendar.js`) doit impérativement être synchronisée dans les fichiers correspondants de `win_app` (`win_app/src/app.html`, `win_app/assets/js/app-v2.js`, etc.).
- Les fichiers modifiés dans `win_app` doivent également être copiés dans `win_app/release/ToDoList-win32-x64/resources/app/` pour que l'exécutable portable reflète immédiatement les changements.

---

## 4. Comportement des Tâches et Modales

- **Clic sur le nom / texte d'une tâche** : Ouvre **uniquement** la modale de visualisation (résumé / récapitulatif en lecture seule avec le titre, les badges, l'échéance et les notes).
- **Clic sur le bouton « Modifier »** : Ouvre **impérativement** la modale de modification (champs éditables, Enregistrer, Annuler, Supprimer).
- Dans la modale de résumé, un bouton « Modifier » permet également de basculer vers la modale d'édition.
