# To-Do List Windows — v5.6.0

Lancer le portable : `release/ToDoList-win32-x64/ToDoList.exe`.
La copie versionnée se trouve dans `release/v5.6.0/ToDoList-win32-x64/` et les sources dans `versions/v5.6.0/`.

Cette version ajoute N02 : saisie rapide avec Entrée, protection contre le double appui, reprise du brouillon dans le formulaire complet et aide des raccourcis. N rejoint la saisie rapide, Maj+N ouvre le formulaire complet, ? ouvre l’aide. Les raccourcis sont ignorés dans les champs et les dialogues, et désactivables depuis l’aide. Le choix est mémorisé pour ce compte sur cet appareil. Aucune interprétation de dates en langage naturel.

N01 reste disponible : Aujourd’hui (retards puis tâches du jour), À venir (à partir de demain) et Toutes les tâches, avec Reporter à demain et Choisir une date. Les tâches terminées/annulées sont exclues des vues actives ; les heures et autres champs sont conservés. Les règles utilisent le jour local et se recalculent autour de minuit.

Les anciennes archives sont conservées. Le portable utilise le moteur Electron existant avec des ressources actualisées ; aucun nouvel installeur NSIS n'est généré. Fermer les anciennes versions avant d'utiliser le nouveau portable.

Les comptes utilisent encore la vérification historique côté navigateur. Les règles et l'identité serveur Firebase doivent être vérifiées séparément. Voir `CORRECTIFS_AUDIT.md` à la racine du projet pour les limites et la recette.

Le `ToDoList.exe` à la racine est le lanceur historique ; pour lancer une version archivée précise, utiliser l'exécutable situé dans son dossier de release versionné.
