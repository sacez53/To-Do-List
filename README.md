# Ma To-Do List — v6.0.1

Gestionnaire de tâches personnel en HTML, CSS et JavaScript, disponible sur le Web et sous Windows avec Electron.

## Commandes des tâches — v6.0.1

La Liste, le Kanban et le Tableau affichent seulement Modifier comme action sur une tâche. Les statuts sont des badges informatifs. Le titre ouvre le résumé, où les tâches actives disposent de Reporter à demain et Choisir une date. La nouvelle échéance et une confirmation s’affichent dans ce résumé après enregistrement. Les tâches terminées, annulées ou en corbeille n’ont pas ces commandes.

Toutes les tâches reste la vue par défaut. Les copies Web et Windows utilisent la version 6.0.1, avec le cache Web v25. Les sources et le portable sont archivés dans les dossiers Windows correspondants, sans remplacer la version 6.0.0.

## Refonte de l’interface — v6.0.0

L’application ouvre Toutes les tâches par défaut. Aujourd’hui et À venir restent accessibles dans la navigation. Le thème sombre et la typographie monospace sont conservés. Sur ordinateur, une barre latérale regroupe les périodes, la corbeille et les liens du compte. Le contenu occupe la largeur disponible jusqu’à 1440 px. La saisie rapide précède les commandes de recherche et d’affichage ; la progression globale suit les tâches.

À 700 px et moins, les quatre périodes tiennent sur une rangée. Les liens Calendrier et Paramètres restent visibles. Une barre d’ajout fixe ouvre le formulaire complet ; elle se masque pendant la saisie ou l’ouverture d’un dialogue. Les commandes de vue et les filtres partagent une rangée. Les tâches disposent d’actions tactiles d’au moins 44 px ; le Tableau prend la forme de cartes et le Kanban défile horizontalement.

L’accueil présente un aperçu statique, identifié comme tel. La connexion, les paramètres et les pages d’information reprennent les mêmes couleurs et les mêmes bordures. Les styles communs sont dans `assets/css/interface.css`, chargé après les styles historiques. Les libellés de navigation sont disponibles en français et en anglais. Le titre d’une tâche ouvre toujours son résumé en lecture seule ; Modifier ouvre le formulaire éditable.

La recette conserve les 24 tests de logique et les parcours Chromium de N01, N02 et N03. Les contrôles de mise en page couvrent 320 à 1920 px, les limites entre téléphone et ordinateur, ainsi que les dialogues à hauteur réduite. Les captures sont dans `output/playwright/`. Ces vérifications utilisent Chromium local et des données fictives ; aucun appareil iOS ou Android physique n’a été testé.

La version Web utilise le cache v24. Les sources Windows, le portable immédiat et les dossiers `win_app/versions/v6.0.0/` et `win_app/release/v6.0.0/` sont alignés. Aucun nouvel installeur NSIS n’est généré.

## Corbeille et annulation — v5.7.0

Supprimer une tâche la place dans la Corbeille avec un horodatage `deletedAt`. Une notification Annuler permet de la récupérer immédiatement. L’onglet Corbeille affiche la date de suppression et la fin de conservation, avec Restaurer et Supprimer définitivement. Le titre y ouvre un résumé en lecture seule.

Les tâches restent restaurables **30 jours**. La restauration restitue le titre, les notes, le statut, les priorités, les dates, l’heure et l’état archivé. Pendant leur séjour dans la corbeille, elles sont exclues des listes actives, des statistiques, du calendrier et des archives. Les exports incluent les tâches encore en corbeille avec leur date de suppression.

À 30 jours, la restauration est refusée ; le contenu est purgé au prochain accès ou à la prochaine synchronisation. Il n’y a pas de tâche serveur planifiée : aucun effacement physique à une heure précise n’est promis quand aucun client ne fonctionne. Une suppression définitive manuelle demande une confirmation séparée. La suppression du compte conserve son propre parcours.

Le schéma de tâches 2 conserve des marqueurs chiffrés `{ id, purgedAt }` sans titre, notes ou dates d’échéance. Ces marqueurs sont conservés sans limite de durée pour couvrir des appareils restés hors ligne longtemps. Une suppression définitive l’emporte sur une ancienne édition ou restauration ; le cache local et sa base de fusion sont nettoyés des champs supprimés. Une restauration faite hors ligne reste provisoire jusqu’à la synchronisation et peut être refusée si la tâche a été supprimée définitivement ailleurs.

Fermer les anciens onglets et mettre à jour tous les appareils Windows avant d’utiliser la corbeille : les anciennes versions ne connaissent pas ce schéma. Le chiffrement et les écritures conditionnelles ne remplacent pas les droits d’accès Firebase décrits plus bas.

La recette comprend 24 tests de logique et les parcours Chromium : annulation, restauration exacte, limite des 30 jours, conflit entre appareils, conservation des marqueurs, calendrier, archives et affichage mobile. Sur téléphone, les quatre onglets se répartissent sur deux rangées.

## Adaptation téléphone — v5.6.1

À 600 px et moins, le haut de page est compact, les trois périodes tiennent sur une rangée et la progression globale passe après les tâches. Les commandes d’une tâche sont alignées sur trois colonnes. La vue Tableau devient une série de cartes avec leurs libellés ; le Kanban se parcourt horizontalement par colonnes.

Le bouton flottant est remplacé par une barre d’ajout en bas sur téléphone. Elle se masque pendant la saisie et dans les dialogues. Les champs gardent une taille de texte de 16 px, les commandes tactiles disposent d’au moins 44 px de hauteur et les dialogues défilent dans le viewport visible, avec leurs actions accessibles. Le calendrier et les onglets des paramètres sont aussi ajustés.

La recette locale vérifie les largeurs 320, 375, 390, 430 et 600 px, une hauteur réduite à 420 px et le paysage. Ce sont des contrôles Chromium avec captures, sans certification sur des appareils physiques iOS/Android. Les captures sont dans `output/playwright/phone-*.png`.

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

Le portable courant est `win_app/release/ToDoList-win32-x64/ToDoList.exe`. Le portable de cette livraison est conservé dans `win_app/release/v5.7.0/ToDoList-win32-x64/`. Les sources sont archivées dans `win_app/versions/v5.7.0/`. Les anciennes versions ne sont pas supprimées.

Cette livraison actualise les ressources du portable avec le moteur Electron existant. Elle ne génère pas de nouvel installeur NSIS. Les scripts historiques de construction restent dans `win_app/package.json` ; leur exécution nécessite les dépendances et outils de construction appropriés.

## Validation

```powershell
node --test tests/audit-regressions.cjs
.\win_app\node_modules\electron\dist\electron.exe tests/audit-ui.cjs
```

La recette UI utilise les pages locales et un serveur Firebase fictif ; elle ne modifie aucune donnée distante. Elle vérifie la corbeille, la saisie rapide, les raccourcis, les modales, les trois vues, les vues par date, les reports, le calendrier, le changement de mot de passe et l’export. Les captures de contrôle se trouvent dans `output/playwright/`. Aucun score Lighthouse ni certification d'accessibilité n'est annoncé.

## Documents du projet

- [Audit initial v5.4.2](AUDIT_SITE_WEB.md)
- [Corrections v5.4.3 et points restant ouverts](CORRECTIFS_AUDIT.md)
- [Catalogue des fonctionnalités et statut de livraison](FONCTIONNALITES_PROPOSEES.md)
- [Règles du projet](AGENTS.md)

Créé par Sacha G. — 2026.
