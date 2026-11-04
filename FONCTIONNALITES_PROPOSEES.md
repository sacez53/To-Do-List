# Fonctionnalités proposées pour Ma To-Do List

Date : 3 novembre 2026 — référence : dépôt Web v5.4.2.

## 1. Orientation

Le produit gagnerait à aider l'utilisateur à décider quoi faire aujourd'hui, à capturer ses tâches rapidement et à retrouver ses données sans inquiétude. N01 est livrée en v5.5.0 ; les autres ajouts ci-dessous restent des propositions. Ils complètent l'audit dans `AUDIT_SITE_WEB.md`.

La recherche, les trois vues, les priorités, les notes, les échéances avec heure, le calendrier et les exports JSON/CSV existent déjà : ils ne sont pas comptés comme nouveautés.

Avant d'ajouter des fonctions qui écrivent des données, traiter la fiabilité réseau, les conflits de synchronisation, l'isolation des comptes et les insertions HTML identifiés dans l'audit. Toute implémentation devra respecter la synchronisation Web/Windows, le versionnage et les archives prévus dans `AGENTS.md`.

## 2. Comparaison des propositions

Les tailles sont relatives : **S** = modification ciblée ; **M** = plusieurs composants ou évolution de schéma ; **L** = architecture, synchronisation ou service externe. Elles ne constituent pas des devis. Le classement reflète l'intérêt présumé pour un gestionnaire personnel, à confirmer par des retours utilisateurs.

| ID | Proposition | Bénéfice | Taille | Priorité |
|---|---|---|---|---|
| N01 | Vues Aujourd'hui et À venir | Choisir rapidement la prochaine tâche | M | Haute |
| N02 | Saisie rapide et raccourcis | Capturer une idée sans casser son rythme | S | Haute |
| N03 | Corbeille et annulation | Récupérer une suppression involontaire | M | Haute |
| N04 | Sous-tâches et checklist | Décomposer un travail trop vaste | M | Haute |
| N05 | Projets et étiquettes | Séparer travail, études et personnel | M | Haute |
| N06 | Filtres enregistrés et vue préférée | Retrouver son organisation quotidienne | S à M | Haute |
| N07 | Import avec aperçu et sauvegarde restaurable | Reprendre ses données et changer d'appareil | M | Haute |
| N08 | Tâches récurrentes | Éviter les saisies répétitives | M | Moyenne |
| N09 | Rappels opt-in | Anticiper une échéance | L | Moyenne |
| N10 | Déplacement des cartes Kanban | Changer de statut directement | M | Moyenne |
| N11 | Actions groupées | Nettoyer une liste volumineuse | M | Moyenne |
| N12 | Thème clair et confort de lecture | Adapter le site à son environnement | M | Moyenne |
| N13 | Mode découverte sans compte | Comprendre le produit avant inscription | M | Moyenne |
| N14 | Export calendrier ICS | Retrouver les échéances dans son agenda | M | Moyenne |
| N15 | Historique et centre de synchronisation | Comprendre et récupérer ses changements | L | Moyenne |
| N16 | Mode concentration | Travailler sur une seule tâche | S à M | Basse |
| N17 | Partage collaboratif | Organiser un projet à plusieurs | L | Exploratoire |

## 3. Spécifications des ajouts prioritaires

### N01 — Aujourd'hui et À venir

**Livré le 4 novembre 2026 en v5.5.0.** Aujourd’hui inclut les retards et le jour local ; À venir commence demain. Les commandes de report conservent l’heure et les autres champs.

**Usage :** ouvrir l'application et voir les retards, les tâches du jour puis les prochaines échéances.

**Première version :** raccourcis de vues intelligentes construits à partir des dates et statuts existants ; commandes Reporter à demain et Choisir une date. Les tâches terminées et annulées sont exclues par défaut. Les tâches sans échéance restent accessibles dans Toutes les tâches.

**Acceptation :** une échéance aujourd'hui apparaît dans Aujourd'hui, un retard est explicitement signalé, une tâche terminée sort des tâches actives ; les règles restent cohérentes autour de minuit local.

**Dépendances :** harmonisation des dates de l'audit F06. Distinguer à terme « prévu pour aujourd'hui » et « doit être terminé aujourd'hui » si les utilisateurs le demandent.

### N02 — Saisie rapide et raccourcis

**Usage :** ajouter une tâche avec un seul champ puis compléter les détails plus tard.

**Première version :** champ de saisie rapide, Entrée pour créer, accès visible au formulaire complet ; raccourci documenté pour ouvrir la création et aide des raccourcis. Ne pas déclencher de raccourci lorsque l'utilisateur écrit dans un champ.

**Acceptation :** titre obligatoire, retour visible après création, aucun doublon sur double appui, focus conservé pour saisir la tâche suivante. Les raccourcis sont désactivables et utilisables sans souris.

**À différer :** compréhension de phrases telles que « demain à 14 h » ; une mauvaise interprétation peut créer une échéance inattendue.

### N03 — Corbeille et annulation

**Usage :** récupérer une tâche supprimée par erreur.

**Première version :** suppression logique avec `deletedAt`, notification Annuler et écran Corbeille. Proposer une durée de conservation clairement affichée, par exemple 30 jours, après décision produit. La suppression définitive du compte suit un parcours distinct.

**Acceptation :** restaurer une tâche restitue notes, statut et dates ; elle disparaît des listes actives et du calendrier pendant son séjour dans la corbeille. La restauration se synchronise sans ressusciter une suppression définitive sur un autre appareil.

**Dépendances :** stratégie de conflits et schéma commun. Prévoir des marqueurs de suppression pour les clients hors ligne.

### N04 — Sous-tâches et checklist

**Usage :** découper « Préparer le dossier » en étapes terminables.

**Première version :** checklist dans l'édition et le résumé, compteur 2/5 dans les cartes, ajout/suppression et réorganisation des éléments. Une seule profondeur suffit au départ.

**Acceptation :** cocher un élément ne termine pas implicitement le parent ; l'utilisateur choisit explicitement de terminer la tâche. Checklist comprise dans le chiffrement, l'export et la restauration.

### N05 — Projets et étiquettes

**Usage :** séparer les contextes tout en gardant une vue globale.

**Première version :** un projet facultatif et plusieurs étiquettes par tâche ; filtres correspondants, vue Toutes les tâches et projet par défaut. Le nom reste visible même avec une couleur.

**Acceptation :** renommer un projet conserve ses tâches ; supprimer un projet propose de déplacer les tâches ou de conserver celles-ci sans projet. Les données restent compatibles avec les tâches anciennes.

**Dépendances :** migration versionnée et adaptation des trois vues, du calendrier, des exports et de Windows.

### N06 — Filtres enregistrés et vue préférée

**Usage :** retrouver « Études, priorité haute, cette semaine » en un clic.

**Première version :** nommer une combinaison de filtres, recherche et tri ; choisir sa vue d'ouverture ; afficher des pastilles de filtres supprimables individuellement.

**Acceptation :** les préférences survivent au rechargement, sont séparées par compte et peuvent être réinitialisées. L'état « aucun résultat » propose de retirer les filtres.

**Dépendances :** clarifier les règles des dates et corriger le tri avant d'enregistrer ses résultats.

### N07 — Import avec aperçu et sauvegarde restaurable

**Usage :** restaurer un export existant ou migrer depuis une autre liste.

**Première version :** import du JSON réellement produit par le site, aperçu avant écriture, validation du schéma, bilan des erreurs et choix Fusionner/Remplacer. Fournir une sauvegarde préalable ; ajouter ensuite le CSV avec correspondance des colonnes.

**Acceptation :** export → import restitue chaque champ, y compris création, notes, heures et archives. Les doublons sont détectés ; un fichier invalide ou trop volumineux est refusé sans toucher aux données. L'aperçu affiche les contenus comme du texte.

**Dépendances :** corriger `created`/`createdAt`, versionner le format et définir la reprise en cas d'échec. Une sauvegarde chiffrée doit indiquer clairement la clé ou le secret nécessaire à sa restauration.

## 4. Ajouts de deuxième étape

### N08 — Tâches récurrentes

Commencer par quotidien, hebdomadaire et mensuel. À la complétion, générer la prochaine occurrence avec un identifiant propre. Définir si la cadence part de la date planifiée ou de la date de complétion. Prévoir « cette occurrence » et « toute la série ». Tester les 29/30/31, années bissextiles, changements d'heure et complétions simultanées pour éviter les doublons.

### N09 — Rappels opt-in

Choisir un rappel par tâche et afficher les permissions dans les paramètres. Commencer par les rappels dans l'application ouverte. Pour notifier application fermée, concevoir séparément une solution serveur/push : une simple minuterie de page ne constitue pas une garantie. Minimiser les informations visibles sur l'écran verrouillé et éviter de transmettre les titres déchiffrés au serveur par défaut. Tester refus de permission, fuseau horaire, report et suppression.

### N10 — Déplacement des cartes Kanban

Déplacer une carte entre colonnes et proposer la même action via un menu de statut au clavier et au tactile. Conserver strictement les règles du projet : clic sur le texte → résumé ; bouton Modifier → édition. Prévoir indication de dépôt, annulation et traitement explicite d'une synchronisation échouée. Ne pas faire dépendre une action du glisser-déposer seul.

### N11 — Actions groupées

Sélectionner plusieurs tâches pour changer de statut, reporter une échéance, affecter un projet ou supprimer. Afficher le nombre sélectionné et préciser si l'action touche les résultats filtrés ou toutes les tâches. Offrir une annulation ; vérifier que les tâches masquées ne sont jamais modifiées implicitement.

### N12 — Thème clair et confort de lecture

Ajouter clair/sombre/système, taille de texte et densité confortable/compacte. Partager les tokens entre pages et Windows. Respecter la préférence système de réduction des animations. Valider contrastes, focus, badges et formulaires dans chaque thème ; conserver les réglages par utilisateur. Les corrections minimales d'accessibilité de l'audit restent nécessaires même sans cette fonctionnalité.

### N13 — Mode découverte sans compte

Ouvrir un espace local avec quelques tâches fictives et un bouton Réinitialiser la démo. Indiquer clairement que les données ne sont pas synchronisées. Lors d'une inscription, proposer explicitement de reprendre les tâches locales après aperçu. Séparer les données de démonstration des données réelles ; aucun envoi Firebase avant un choix explicite.

### N14 — Export calendrier ICS

Proposer un téléchargement des échéances sélectionnées compatible avec les agendas courants. Respecter les tâches sans heure et les fuseaux horaires, exclure notes privées par défaut et expliquer qu'un fichier importé ne se met pas à jour automatiquement. Tester accents, caractères spéciaux et journées entières. Une synchronisation bidirectionnelle est un projet ultérieur distinct, avec gestion des autorisations et conflits.

### N15 — Historique et centre de synchronisation

Montrer dernière synchronisation réussie, changements en attente, erreurs et bouton Réessayer. Enrichir ensuite avec un historique des changements et restauration d'une version. Éviter un journal serveur en clair des titres et notes ; limiter sa durée de conservation. Un appareil hors ligne doit afficher « enregistré sur cet appareil » plutôt qu'un succès cloud. Cette proposition complète la correction indispensable des faux succès, elle ne la remplace pas.

## 5. Pistes à valider avant investissement

### N16 — Mode concentration

Afficher une tâche, sa checklist et éventuellement un minuteur de travail. Démarrer sans statistiques complexes ni score de productivité. Valider l'intérêt auprès d'utilisateurs qui ont déjà une liste organisée ; mesurer l'usage volontaire de ce mode, sans collecte des contenus de tâches.

### N17 — Partage collaboratif

Projets partagés, attribution et commentaires pourraient élargir le produit, mais changent son positionnement personnel. Il faut d'abord concevoir invitations, rôles, révocation, synchronisation concurrente et partage des clés de chiffrement. Une URL publique contenant les tâches n'est pas un substitut à cette architecture. Ne pas lancer avant validation du besoin et de l'isolation des comptes.

## 6. Feuille de route proposée

| Étape | Contenu | Condition avant la suite |
|---|---|---|
| A — Fiabilisation | Correctifs prioritaires de l'audit | Données préservées, statuts réseau honnêtes et parcours clavier utilisables |
| B — Utilité immédiate | N01, N02, N06 | Retrouver et créer une tâche avec peu d'étapes |
| C — Organisation et récupération | N03, N04, N05, N07 | Schéma migrable, restauration vérifiée et parité Windows |
| D — Routines et confort | N08, N10, N11, N12, N14 | Usage confirmé et recette mobile complète |
| E — Services plus complexes | N09, N15 ; exploration N13/N16/N17 selon retours | Architecture, coût d'exploitation et besoin validés |

## 7. Comment choisir les prochains ajouts

Observer quelques utilisateurs réaliser trois actions : noter une nouvelle tâche, choisir quoi faire aujourd'hui et retrouver une tâche ancienne. Relever les étapes inutiles, incompréhensions et erreurs sans enregistrer les contenus privés. Prioriser les fonctions qui résolvent un problème récurrent observé.

Pour chaque lot, définir une mesure simple : temps pour créer une tâche, réussite pour retrouver une tâche, restauration réussie après suppression, nombre de conflits non résolus. La collecte peut commencer par une recette manuelle ; une télémétrie éventuelle devra être minimisée et explicitée. Les tailles et priorités ci-dessus restent des hypothèses produit jusqu'à cette validation.
