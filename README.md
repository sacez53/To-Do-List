# Ma To-Do List — v5.6.0

Gestionnaire de tâches personnel en HTML, CSS et JavaScript, disponible sur le Web et sous Windows avec Electron.

## Saisie rapide et raccourcis — v5.6.0

Le champ Ajouter une tâche crée une tâche avec son seul titre, via Entrée ou Ajouter. Un titre vide est refusé. La tâche est créée à l’état À faire, avec une priorité normale et sans échéance ; la confirmation permet de compléter ses détails. Elle est également disponible dans Toutes les tâches. Un double appui ne crée pas de doublon ; le focus reste dans le champ pour saisir la suivante.

Formulaire complet et le bouton + reprennent le titre en cours. Annuler conserve le brouillon ; enregistrer le formulaire le retire de la saisie rapide. Les mentions telles que « demain à 14 h » restent du texte : aucune date n’est interprétée.

| Raccourci | Action |
|---|---|
| `N` | Rejoindre le champ de saisie rapide |
| `Maj+N` | Ouvrir le formulaire complet |
| `?` | Afficher l’aide des raccourcis |

Les raccourcis sont ignorés dans les champs de saisie, les zones éditables et les dialogues. Le bouton Raccourcis clavier ouvre l’aide et permet de les désactiver ; ce choix est mémorisé par compte sur l’appareil. Les boutons restent accessibles avec Tab et Entrée. Échap ferme les dialogues.

## Aujourd’hui et À venir — v5.5.0

L’application ouvre Aujourd’hui : tâches actives en retard, puis échéances du jour. À venir affiche les tâches actives dont la date est après aujourd’hui, avec un tri chronologique initial. Toutes les tâches conserve aussi les tâches sans échéance, terminées et annulées. Les tâches archivées restent dans les paramètres.

Les trois raccourcis se combinent avec les vues Liste/Kanban/Tableau, la recherche et les filtres existants. Reporter à demain enregistre directement la nouvelle date ; Choisir une date demande une confirmation dans un dialogue dédié. L’heure, les notes, la priorité et le statut sont conservés. Le résumé reste en lecture seule.

Les jours sont calculés dans le fuseau local. Une tâche sans heure devient en retard au lendemain ; une tâche avec heure devient en retard lorsque cette heure est atteinte. L’écran se recalcule chaque minute et au retour sur la fenêtre, y compris autour de minuit. Une tâche terminée ou annulée disparaît des deux vues actives.

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

Le portable courant est `win_app/release/ToDoList-win32-x64/ToDoList.exe`. Le portable de cette livraison est conservé dans `win_app/release/v5.6.0/ToDoList-win32-x64/`. Les sources sont archivées dans `win_app/versions/v5.6.0/`. Les anciennes versions ne sont pas supprimées.

Cette livraison actualise les ressources du portable avec le moteur Electron existant. Elle ne génère pas de nouvel installeur NSIS. Les scripts historiques de construction restent dans `win_app/package.json` ; leur exécution nécessite les dépendances et outils de construction appropriés.

## Validation

```powershell
node --test tests/audit-regressions.cjs
.\win_app\node_modules\electron\dist\electron.exe tests/audit-ui.cjs
```

La recette UI utilise les pages locales et un serveur Firebase fictif ; elle ne modifie aucune donnée distante. Elle vérifie la saisie rapide, les raccourcis, les modales, les trois vues, les vues par date, les reports, le calendrier, le changement de mot de passe et l’export. Les captures de contrôle se trouvent dans `output/playwright/`. Aucun score Lighthouse ni certification d'accessibilité n'est annoncé.

## Documents du projet

- [Audit initial v5.4.2](AUDIT_SITE_WEB.md)
- [Corrections v5.4.3 et points restant ouverts](CORRECTIFS_AUDIT.md)
- [Catalogue des fonctionnalités et statut de livraison](FONCTIONNALITES_PROPOSEES.md)
- [Règles du projet](AGENTS.md)

Créé par Sacha G. — 2026.
