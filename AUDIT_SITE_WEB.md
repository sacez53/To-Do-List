# Audit du site Ma To-Do List

Date : 3 novembre 2026 — version Web déclarée : v5.4.2.

## 1. Conclusion

Le site possède un socle fonctionnel riche pour un outil personnel : trois vues des tâches, recherche, filtres combinés, calendrier, chiffrement client et export des données. La séparation entre consultation et modification des tâches est correctement prévue dans les trois vues.

La priorité est de fiabiliser les données et les retours utilisateur avant d'étendre le produit. La synchronisation annoncée comme « temps réel » n'est pas implémentée comme telle dans la vue V2 ; les écritures remplacent la liste entière et certains échecs HTTP sont présentés comme des succès. L'accessibilité clavier et la lisibilité nécessitent également un travail transversal.

## 2. Méthode et limites

- Analyse du dépôt local : accueil, application V2, redirection historique, connexion, accueil intermédiaire, calendrier, paramètres, gestion des données et pages d'information ; scripts partagés, CSS, manifeste et service worker.
- Vérifications exécutées avec Node sur les fonctions réelles `applySort` et `applyFilters`, extraites du fichier source sans réécriture ; calcul de contraste ; analyse syntaxique de tous les scripts de `assets/js` ; vérification d'existence des chemins du précache.
- Aucun compte créé, aucune donnée distante modifiée et aucune requête d'investigation adressée à Firebase.
- Le lancement de Playwright n'a pas abouti pendant l'audit. Aucun parcours dans un navigateur, capture d'écran, lecteur d'écran, mesure Lighthouse ou test mobile réel n'est donc revendiqué. Les appréciations UI reposent sur les styles et le balisage ; les risques de débordement doivent être confirmés visuellement.
- Les règles Firebase déployées, en-têtes HTTP, droits serveur, performances en production et conformité juridique ne sont pas certifiés par cet audit.
- Les sources Windows n'ont pas fait l'objet d'un audit exhaustif. Toute future correction produit devra être synchronisée et versionnée conformément à `AGENTS.md`.
- Ce livrable est documentaire : aucun fichier de l'application ni numéro de version n'a été modifié.

Niveaux : **P0** bloquant avant une diffusion plus large ; **P1** à corriger prochainement ; **P2** amélioration planifiable. « Confirmé » signifie établi par le code ou un contrôle ciblé, sans impliquer une reproduction navigateur.

## 3. Inventaire fonctionnel

| Domaine | Présent dans le code | Appréciation |
|---|---|---|
| Compte | Inscription, connexion, changement d'identifiant et de mot de passe, suppression | Parcours disponibles, fiabilité réseau à renforcer |
| Tâches | Création, consultation, édition, suppression, notes, priorité, date et heure | Base cohérente ; pas de restauration visible en V2 |
| Statuts | À faire, en cours, en attente, terminé, annulé | Modèle riche, vocabulaire divergent dans le calendrier |
| Affichage | Liste, Kanban, tableau | Adapté à plusieurs usages ; Kanban sans déplacement direct des cartes |
| Organisation | Recherche titre/notes, tris, filtres combinés | Tri priorité défectueux ; filtres de dates ambigus |
| Calendrier | Grille mensuelle et planning | Basé sur le cache local ; navigation date → planning imprécise |
| Données | Export JSON et CSV | Déjà disponible ; date de création incorrectement mappée |
| Langues | Dictionnaires FR/EN et préférence de compte | Couverture incomplète des écrans et messages |
| PWA | Manifeste, icônes, service worker, cache | Installation prévue ; parcours hors ligne incomplet |
| Confidentialité | AES-GCM, dérivation PBKDF2, expiration de session | Cache local en clair et dépendance aux droits serveur |

## 4. Points positifs à préserver

- Identité graphique homogène : fond sombre, typographie monospace, surfaces et espacements partagés.
- Recherche, vues et filtres accessibles depuis l'écran des tâches, sans passage par les paramètres.
- Présence de labels sur les champs de la modale et d'un rôle de dialogue sur la modale principale.
- Titres et notes de la modale récapitulative insérés avec `textContent` ; titres des tâches échappés dans plusieurs rendus V2.
- Confirmation avant suppression d'une tâche et distinction des états de synchronisation.
- Horaires d'échéance pris en compte dans le tri chronologique.
- Exports dans deux formats et pages d'information accessibles depuis les pieds de page.

## 5. Fiabilité, fonctionnalités et données

### F01 — P1 — Synchronisation pouvant annoncer un faux succès — confirmé

**Source :** `assets/js/app-v2.js:166–200`, `assets/js/settings.js`, `assets/js/donnees.js:130`.

Les écritures `fetch` ne vérifient pas systématiquement `response.ok`. Une réponse HTTP 401, 403 ou 500 ne déclenche pas automatiquement le `catch`. L'indicateur peut afficher « synchronisé » après un refus ; la suppression du compte peut annoncer un succès et effacer le cache local alors que la suppression distante a échoué. La lecture de la liste ne vérifie pas non plus le statut avant d'interpréter le JSON.

**Action :** centraliser les requêtes, vérifier le statut, valider le contenu et distinguer erreur réseau, refus et erreur serveur. Préserver les données locales jusqu'à confirmation.

**Validation :** simuler 403, 500 et coupure réseau ; aucun succès ne doit être affiché et une reprise doit être possible.

### F02 — P1 — Conflits et perte de modifications entre appareils — confirmé par l'architecture

**Source :** `assets/js/app-v2.js`, `init`, `loadFromFirebase`, `saveToFirebase`.

La liste est chargée à l'initialisation puis remplacée entièrement par `PUT`, avec temporisation de 800 ms. Aucun abonnement temps réel, version de document, fusion ni file persistante de modifications n'apparaît dans ce script. Deux appareils partis du même état peuvent écraser leurs changements respectifs. Une modification locale hors ligne peut aussi être écrasée au prochain chargement distant. Fermer la page pendant la temporisation peut empêcher l'envoi.

**Action :** journal local durable, identifiants stables, stratégie explicite de résolution des conflits et synchronisation par tâche compatible avec le chiffrement.

**Validation :** deux sessions modifient des tâches différentes, dont une hors ligne ; les changements des deux sessions survivent à la reconnexion et au rechargement.

### F03 — P1 — Tri « Priorité » incorrect — reproduit avec le code réel

**Source :** `assets/js/app-v2.js:240`, branche `priority`.

`PRIORITY_ORDER.high` vaut `0`, mais `|| 1` le transforme en `1`, comme la priorité normale. Le contrôle `[normal, high]` reste `[normal, high]` après le tri.

**Action :** utiliser un traitement des valeurs absentes qui conserve zéro, par exemple `??`. Vérifier haute → normale → basse dans les trois vues.

### F04 — P2 — Filtres de dates ambigus — reproduit avec le code réel

**Source :** `assets/js/app-v2.js:223`.

Le filtre « Avant le » conserve une tâche sans échéance ; même logique pour « Après le ». Le libellé peut suggérer que seules les tâches datées sont incluses. Les bornes sont inclusives et une plage inversée n'est pas signalée.

**Action :** définir la règle produit, expliciter l'inclusion des tâches sans date et signaler une plage incohérente. Tester bornes, absence de date et combinaison avec « Sans date ».

### F05 — P1 — Calendrier non synchronisé et statuts divergents — confirmé

**Source :** `assets/js/calendar.js`, initialisation et `getStatusInfo`.

Le calendrier lit uniquement `localStorage` au chargement. Il n'effectue pas de lecture distante ni de rafraîchissement à la modification du cache. Il reconnaît `in-progress`, alors que la V2 produit `inprogress` : le pictogramme d'une tâche en cours retombe sur la valeur par défaut. Les tâches archivées ne sont pas exclues des sélections du calendrier comme elles le sont en V2.

**Action :** partager le modèle des statuts et la couche de données ; harmoniser l'archivage et rafraîchir le calendrier.

### F06 — P2 — Dates et heures traitées de façon inégale — confirmé

**Source :** `assets/js/app-v2.js`, `getDueInfo`, tri `overdue-first` ; `assets/js/calendar.js`, boutons précédent/suivant.

Le badge de retard compare les jours et ignore une heure déjà passée aujourd'hui. Le tri des retards utilise une date UTC (`toISOString`) tandis que les badges utilisent le jour local. La navigation mensuelle applique `setMonth` à une date conservant le jour courant : depuis un 31, un mois court peut être sauté.

**Action :** normaliser les dates locales, définir la précision du retard et fixer le jour au premier avant de changer de mois. Tester minuit local, changement d'heure et 31 janvier → février.

### F07 — P1 — Annulation de suppression laissant des callbacks actifs — confirmé par lecture

**Source :** `assets/js/app-v2.js:728`, fermeture de `confirmOverlay` et touche Échap.

`openConfirm` retire les écouteurs uniquement via sa fonction `cleanup`, appelée par les deux boutons. Fermer par le fond ou Échap masque la modale sans ce nettoyage. Après annulation d'une suppression A puis confirmation d'une suppression B, les callbacks des deux ouvertures peuvent s'exécuter.

**Action :** fermeture unique qui nettoie toujours les événements. Reproduire la séquence A → Échap → B → confirmer ; seule B doit disparaître.

### F08 — P2 — Export incomplet et potentiellement ancien — confirmé

**Source :** `assets/js/donnees.js:27–81` ; création dans `assets/js/app-v2.js`.

L'export lit `createdAt` alors que la V2 écrit `created` : la date de création est vide pour ces tâches. L'export lit uniquement le cache local ; il ne garantit pas de contenir les dernières modifications d'un autre appareil. Le JSON d'export utilise des noms différents du modèle interne ; aucun import compatible n'est proposé.

**Action :** unifier le schéma, versionner le format et afficher la fraîcheur des données exportées. Vérifier toutes les colonnes avec une tâche complète.

### F09 — P1 — Opérations de compte insuffisamment atomiques — confirmé par lecture

**Source :** `assets/js/settings.js`, changement d'identifiant et de mot de passe.

Le changement d'identifiant copie le compte puis supprime l'ancien nœud sans vérifier le succès HTTP de la copie. Le changement de mot de passe peut continuer sans clé de déchiffrement disponible ; avec des tâches chiffrées, il faut empêcher tout changement qui laisserait les données sous l'ancienne clé.

**Action :** bloquer en cas de clé absente ou de déchiffrement impossible, vérifier chaque réponse et rendre la migration atomique ou récupérable. Valider sur données fictives avec échec entre les étapes.

## 6. UI, UX et accessibilité

### U01 — P1 — Consultation des tâches inaccessible au clavier dans plusieurs vues — confirmé

**Source :** `assets/js/app-v2.js`, `renderList`, `renderKanban`, `renderTable` ; `assets/js/calendar.js`.

Les clics sur des textes, cartes, lignes et cellules sont liés à des éléments non interactifs sans équivalent clavier explicite. La présence du bouton Modifier ne remplace pas l'accès au résumé en lecture seule.

**Action :** utiliser des boutons ou liens nommés pour consulter, sans englober d'autres boutons ; rendre les dates pertinentes accessibles au clavier. Critère : création, consultation, édition et suppression réalisables sans souris.

### U02 — P1 — Gestion du focus des modales incomplète — confirmé

**Source :** `assets/js/app-v2.js`, `openModal`, `closeModal`, `openConfirm` ; `pages/app-v2.html:1059,1134`.

Le champ titre reçoit le focus en édition, mais il n'y a pas de confinement du focus, de restauration au déclencheur ni de gestion équivalente en consultation/confirmation. Le dialogue de confirmation n'a pas de nom relié à son titre. La fermeture par le fond ou Échap peut abandonner une édition sans avertissement.

**Action :** adopter un composant de dialogue partagé, gérer focus initial, Tab/Maj+Tab, retour au déclencheur et modifications non enregistrées.

### U03 — P1 — Contraste et taille des textes à revoir — contraste calculé

**Source :** `assets/css/style2.css:15–17` ; styles intégrés de `pages/app-v2.html`.

Le couple `#6e6e6e` / `#080808` donne environ **3,93:1**, contrairement au commentaire annonçant 4,6:1. Il est insuffisant pour le texte courant au seuil AA de 4,5:1. Des styles utilisent `.55rem` à `.7rem` : risque de lecture difficile, à confirmer selon chaque usage et fond effectif. Le calcul d'un couple ne constitue pas un audit de contraste de tous les composants.

**Action :** éclaircir le texte secondaire, augmenter les tailles utiles et tester zoom 200 %, interfaces désactivées, badges et formulaires.

### U04 — P2 — États et contrôles insuffisamment décrits — confirmé

**Source :** `pages/app-v2.html`, recherche, tri, filtres, boutons de vue et synchronisation.

La recherche repose sur un placeholder, le tri n'a pas de label associé, les dates des filtres ont des labels sans `for`. L'ouverture des filtres et la sélection de vue sont exprimées par classes CSS sans état ARIA équivalent. La synchronisation n'est pas une région d'annonce dynamique.

**Action :** labels persistants, `aria-expanded`, `aria-controls`, `aria-pressed` et région de statut adaptée ; donner un nom explicite au bouton d'effacement de recherche.

### U05 — P2 — Chargement intermédiaire artificiel — confirmé

**Source :** `pages/welcome.html:877`, `STEPS`, `tick` ; redirection de `assets/js/login.js`.

L'animation attend 3 500 ms, puis ajoute des délais de transition. Ses étapes « Connexion à Firebase » et « Synchronisation des tâches » dépendent d'un chronomètre, pas de l'avancement réel de ces opérations. Elle ralentit l'accès et suggère une garantie que l'écran ne vérifie pas.

**Action :** ouvrir directement les tâches et afficher un chargement lié aux requêtes réelles ; réserver l'accueil pédagogique à la première utilisation.

### U06 — P2 — Mobile et Kanban : densité et déplacement horizontal — à vérifier visuellement

**Source :** `pages/app-v2.html`, `.v2-kanban` (largeur minimale 800 px), `.v2-kanban-col`, styles des boutons Modifier.

Le Kanban à cinq colonnes implique une navigation horizontale sur téléphone. Certains boutons Modifier réduisent explicitement leur hauteur et leur padding. Le formulaire conserve des lignes à deux colonnes : leur confort sur écran étroit reste à contrôler.

**Action :** privilégier la liste sur téléphone, rendre le défilement du Kanban perceptible, proposer une sélection de colonne et agrandir les cibles. Tester 320, 375, 768 et 1440 px, orientation paysage et clavier virtuel.

### U07 — P2 — États vides et filtres peu pédagogiques — confirmé

**Source :** `assets/js/app-v2.js`, `renderList`, `renderKanban`, `renderTable`, `updateFilterBadge`.

« Aucune tâche » peut correspondre à un compte vide ou à des filtres qui cachent tout. Le compteur additionne les valeurs cochées, pas les familles de filtres. Vue, tri et filtres sont réinitialisés à chaque chargement de la V2.

**Action :** distinguer liste vide et aucun résultat, proposer Créer/Réinitialiser, montrer les filtres actifs et mémoriser les préférences par compte.

### U08 — P2 — Traduction et mouvements incomplets — confirmé dans les sources examinées

**Source :** `assets/js/settings.js`, `assets/js/timeout.js`, `assets/js/calendar.js`, `index.html`, `pages/welcome.html`, `assets/js/transitions.js`.

Plusieurs messages et écrans restent en français malgré le choix anglais. Les feuilles et transitions examinées ne prévoient pas de traitement `prefers-reduced-motion`. L'accueil met en avant AES/PBKDF2 et les plateformes avant les bénéfices d'usage.

**Action :** inventorier toutes les chaînes, traduire aussi erreurs et attributs accessibles, respecter la réduction des animations ; reformuler le premier écran autour d'organiser, retrouver et planifier ses tâches.

## 7. Confiance, rendu et exposition des données

### D01 — P0 — Authentification et droits serveur à vérifier avant diffusion — risque architectural

**Source :** `assets/js/login.js`, lecture de `/users/<identifiant>.json`, vérification du hash côté navigateur et indicateur `sessionStorage.auth` ; appels REST des autres scripts.

Aucun jeton d'identité serveur n'est transmis dans les appels examinés. Un indicateur de session local n'est pas une preuve d'identité pour Firebase. La possibilité effective de lire ou écrire les comptes dépend des règles déployées, absentes de ce contrôle. Il serait incorrect de conclure que la base est ouverte sans les examiner.

**Action :** examiner les règles sur un environnement autorisé, garantir l'isolation par utilisateur authentifié et refuser les opérations non autorisées côté serveur. Conserver le chiffrement client en complément. Critère : une requête sans identité et un utilisateur B ne peuvent ni lire ni modifier le compte A.

### D02 — P1 — Données injectées dans du HTML sans échappement — confirmé

**Source :** `assets/js/calendar.js`, `renderPlanning` et infobulles ; `assets/js/app-v2.js:328`, message de recherche sans résultat ; interpolation dans `assets/js/i18n.js`.

Le calendrier insère `t.text` directement via `innerHTML`. La V2 insère aussi la requête de recherche dans un message traduit rendu en HTML. Un contenu contenant des balises peut être interprété comme du balisage. L'exploitation exacte et les protections de production n'ont pas été testées dans un navigateur.

**Action :** construire les nœuds et affecter les textes avec `textContent`, séparer les données du balisage. Valider que `<b>exemple</b>` apparaît littéralement, puis réaliser un contrôle dédié sur environnement de test.

### D03 — P1 — Chiffrement cloud et confidentialité locale à distinguer — confirmé

**Source :** `assets/js/app-v2.js:180,204`, déconnexion ; `assets/js/crypto.js`, export de clé.

Les tâches déchiffrées restent dans `localStorage` après déconnexion ; la clé est exportée en `sessionStorage`. Le code autorise aussi une sauvegarde distante en clair si `encKey` est absente. La présence d'AES-GCM ne suffit donc pas à garantir que tous les chemins conservent les données chiffrées.

**Action :** refuser l'envoi en clair, définir une politique de cache sur poste partagé et expliquer précisément ce que couvre le chiffrement. Tester la déconnexion et la clé absente sans exposer de données réelles.

## 8. PWA, performance et maintenance

### T01 — P1 — Parcours hors ligne incomplet — confirmé par les références

**Source :** `sw.js`, `pages/app-v2.html`, `assets/js/login.js`.

Le précache inclut les scripts/CSS sans suffixe, tandis que la V2 demande des URL avec `?v=18`. Ces clés de cache diffèrent : une ressource peut manquer hors ligne avant sa première récupération sous cette URL. `login.js`, les configurations JSON et `welcome.html` ne figurent pas dans le précache. Le cache à l'usage peut masquer certains manques après une visite en ligne, sans garantir un parcours complet. La connexion exige de toute façon le serveur.

**Action :** définir les parcours hors ligne supportés, aligner les URL et prévoir des réponses de secours. Tester une installation neuve puis chaque page hors ligne ; distinguer première connexion et reprise d'une session existante.

### T02 — P2 — Stratégie de cache et mise à jour à encadrer — confirmé

**Source :** `sw.js`, `fetch`, `activate`.

L'activation supprime tous les caches dont le nom diffère, sans filtrer ceux appartenant à l'application. Sur une origine partagée, cela peut affecter d'autres applications. Les JSON sont traités en cache d'abord et peuvent rester anciens jusqu'au prochain changement de cache. `skipWaiting`/`clients.claim` impose immédiatement le nouveau worker.

**Action :** limiter la suppression au préfixe de l'application, définir la fraîcheur par type de ressource et proposer une mise à jour après sauvegarde des changements.

### T03 — P2 — Performance à mesurer et rendu à rationaliser — potentiel confirmé, coût non mesuré

**Source :** `assets/js/app-v2.js`, `render`, recherche ; `pages/app-v2.html`, styles intégrés ; chargement Google Fonts.

Chaque frappe refiltre, retrie et reconstruit toute la liste et ses écouteurs ; chaque sauvegarde sérialise toute la collection. Le coût grandit avec le nombre de tâches. Les styles intégrés volumineux compliquent la réutilisation ; les polices externes ajoutent une dépendance réseau. Aucune valeur de LCP, INP, CLS ou poids transféré n'a été mesurée.

**Action :** mesurer d'abord sur 100, 1 000 puis 5 000 tâches fictives ; optimiser ensuite les chemins coûteux (rendu incrémental, délégation d'événements, pagination si nécessaire), partager les composants et envisager des polices locales.

### T04 — P2 — Documentation et vérification automatisée insuffisantes — confirmé

**Source :** `README.md`, `assets/json/version.json`, `test.js`, `test2.js`.

Le README présente v5.2 alors que le fichier Web déclare v5.4.2, annonce du temps réel non retrouvé dans la V2 et utilise une image de démonstration externe de substitution. Les deux petits scripts de test réimplémentent une logique d'archivage avec `console.log` sans assertions ; ils ne vérifient pas les parcours réels.

**Action :** aligner les promesses documentaires, ajouter de vraies captures et une validation ciblée des fonctions et parcours à risque. Automatiser le contrôle de parité Web/Windows et la préparation des versions, sans supprimer les archives précédentes.

## 9. Visibilité et pages publiques

L'accueil contient titre, description et métadonnées Open Graph ; le sitemap référence uniquement l'accueil. Pour les pages publiques utiles, vérifier titres/descriptions propres, URL canoniques et cohérence des aperçus sociaux. Les écrans privés n'ont pas vocation à être promus dans les moteurs. La qualité réelle de l'indexation et les réponses HTTP restent à vérifier sur le déploiement.

Les pages de confidentialité et de gestion des données constituent une bonne base de transparence. Leurs promesses doivent être rapprochées du cache local, des données réellement exportées, des polices externes et des mécanismes réels d'authentification. Ce rapprochement technique ne vaut pas validation juridique.

## 10. Plan d'action recommandé

| Lot | Travail | Critère de sortie |
|---|---|---|
| 1 — Intégrité et accès | D01, F01, F02, F07, F09, D02, D03 | Droits vérifiés, pas de faux succès, pas de suppression multiple ni perte de changement sur les scénarios ciblés |
| 2 — Fonctions quotidiennes | F03 à F06, F08, T01 | Tris et dates corrects, calendrier cohérent, export complet, parcours hors ligne documenté |
| 3 — Usage et accessibilité | U01 à U08 | Parcours au clavier, textes lisibles, mobile vérifié, chargement honnête et traductions cohérentes |
| 4 — Entretien | T02 à T04, pages publiques | Cache maîtrisé, mesures reproductibles, documentation et versions alignées |

## 11. Recette à réaliser après corrections

1. Créer une tâche avec tous les champs ; cliquer son titre → résumé uniquement ; cliquer Modifier → édition ; répéter en liste, Kanban et tableau.
2. Modifier puis annuler ; tester Échap et clic sur le fond ; vérifier conservation des changements déjà enregistrés et avertissement sur brouillon.
3. Supprimer A, annuler par Échap, ouvrir B puis confirmer : B seule est supprimée.
4. Vérifier tris, recherche avec caractères spéciaux, filtres combinés et absence de résultats.
5. Vérifier aujourd'hui avant/après l'heure limite, minuit local, mois courts et statuts du calendrier.
6. Simuler refus HTTP, mode avion, fermeture rapide et modifications simultanées entre deux appareils.
7. Exporter une tâche complète et comparer chaque champ ; vérifier la fraîcheur annoncée et l'absence de perte d'accents.
8. Tester clavier seul, lecteur d'écran, zoom 200 %, réduction des animations, FR/EN et petits écrans.
9. Vérifier installation PWA, reprise hors ligne et mise à jour depuis la version précédente.
10. Réaliser les tests de compte sur des données fictives et contrôler l'isolation serveur sur environnement autorisé.

### Résultats des contrôles effectivement exécutés

| Contrôle | Résultat |
|---|---|
| Tri réel : entrée normale puis haute | Haute ne remonte pas : défaut reproduit |
| Filtre réel « avant le » avec une tâche sans date | Tâche conservée : comportement confirmé |
| Contraste théorique `#6e6e6e` / `#080808` | 3,93:1 |
| Analyse syntaxique des scripts `assets/js/*.js` | Réussie ; ne garantit pas leur fonctionnement dans le navigateur |
| Existence des chemins déclarés dans le précache | Tous existent ; ne garantit pas les variantes d'URL ni le fonctionnement hors ligne |
| Parcours navigateur, production, lecteur d'écran, performances | Non exécutés |

## 12. Suivi des corrections — v5.4.3 (3 novembre 2026)

Correctifs appliqués au client Web et reportés dans Windows. Le détail de livraison et les limites restantes sont dans `CORRECTIFS_AUDIT.md`. Les constats ci-dessus décrivent l’état v5.4.2 au moment de l’audit ; ils ne constituent pas un constat renouvelé après correction.
