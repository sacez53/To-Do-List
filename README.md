# Ma To-Do List — v5.4.3

Gestionnaire de tâches personnel en HTML, CSS et JavaScript, disponible sur le Web et sous Windows avec Electron.

## Fonctions existantes

- Vues Liste, Kanban et Tableau ; recherche et filtres combinés.
- Cinq statuts, trois priorités, notes, échéances avec heure.
- Résumé en lecture seule au clic sur le titre ; formulaire au bouton Modifier.
- Calendrier mensuel et planning ; archives dans les paramètres.
- Interface principale français/anglais ; pages d'information principalement françaises.
- Exports JSON et CSV sur la page Gestion des données.

## Données et synchronisation

Les tâches sont chiffrées côté client en AES-256-GCM avant sauvegarde. La clé est dérivée du mot de passe et conservée pendant la session. Le cache local et les modifications en attente sont chiffrés ; une ancienne copie locale en clair est migrée lors de sa lecture.

La version 5.4.3 contrôle les réponses HTTP et utilise les ETag Firebase pour éviter les écrasements concurrents. Les modifications de tâches distinctes sont fusionnées ; un conflit sur la même tâche est signalé et la copie locale conservée. La synchronisation reprend au retour du réseau et de la fenêtre ; elle n'est pas un abonnement temps réel.

**Limite serveur :** l'authentification historique est vérifiée côté navigateur. Les règles d'accès Firebase ne sont pas fournies dans ce dépôt et n'ont pas été validées. Le chiffrement ne remplace pas l'autorisation côté serveur. Voir [le relevé des corrections et limites](CORRECTIFS_AUDIT.md).

Le mode hors ligne permet de reprendre des tâches déjà mises en cache tant qu'une session avec sa clé reste disponible ; une première connexion nécessite le serveur. Après une mise à jour, fermer les anciens onglets pour activer le nouveau worker. Les anciennes applications Windows doivent également être remplacées.

## Lancement Web

Servir le dossier avec un serveur HTTP local ou un hébergement statique HTTPS. L'entrée est `index.html`. La configuration de base se trouve dans `assets/json/firebase.json` ; les règles serveur doivent être adaptées et vérifiées séparément.

## Windows

Le portable courant est `win_app/release/ToDoList-win32-x64/ToDoList.exe`. Le portable de cette livraison est conservé dans `win_app/release/v5.4.3/ToDoList-win32-x64/`. Les sources sont archivées dans `win_app/versions/v5.4.3/`. Les anciennes versions ne sont pas supprimées.

Cette livraison actualise les ressources du portable avec le moteur Electron existant. Elle ne génère pas de nouvel installeur NSIS. Les scripts historiques de construction restent dans `win_app/package.json` ; leur exécution nécessite les dépendances et outils de construction appropriés.

## Validation

```powershell
node --test tests/audit-regressions.cjs
.\win_app\node_modules\electron\dist\electron.exe tests/audit-ui.cjs
```

La recette UI utilise les pages locales et un serveur Firebase fictif ; elle ne modifie aucune donnée distante. Elle vérifie les modales, les trois vues, le calendrier, le changement de mot de passe et l'export. Les captures de contrôle se trouvent dans `output/playwright/`. Aucun score Lighthouse ni certification d'accessibilité n'est annoncé.

## Documents du projet

- [Audit initial v5.4.2](AUDIT_SITE_WEB.md)
- [Corrections v5.4.3 et points restant ouverts](CORRECTIFS_AUDIT.md)
- [Propositions de fonctionnalités, non implémentées](FONCTIONNALITES_PROPOSEES.md)
- [Règles du projet](AGENTS.md)

Créé par Sacha G. — 2026.
