# To-Do List Windows — v5.4.3

Lancer le portable : `release/ToDoList-win32-x64/ToDoList.exe`.
La copie versionnée se trouve dans `release/v5.4.3/ToDoList-win32-x64/` et les sources dans `versions/v5.4.3/`.

Cette version applique les corrections de l'audit Web : sauvegardes conditionnelles, cache chiffré, calendrier, tris, exports, modales, clavier et contraste. Elle n'ajoute aucune fonction du catalogue de propositions.

Les anciennes archives sont conservées. Le portable utilise le moteur Electron existant avec des ressources actualisées ; aucun nouvel installeur NSIS n'est généré. Fermer les anciennes versions avant d'utiliser le nouveau portable.

Les comptes utilisent encore la vérification historique côté navigateur. Les règles et l'identité serveur Firebase doivent être vérifiées séparément. Voir `CORRECTIFS_AUDIT.md` à la racine du projet pour les limites et la recette.

Le `ToDoList.exe` à la racine est le lanceur historique ; pour lancer une version archivée précise, utiliser l'exécutable situé dans son dossier de release versionné.
