# Correctifs de l'audit — v5.4.3

Date : 3 novembre 2026. Périmètre : corrections du produit existant ; aucune fonctionnalité du catalogue `FONCTIONNALITES_PROPOSEES.md` n'est ajoutée.

## Correctifs livrés

| Référence de l'audit | Changement |
|---|---|
| F01 | Réponses HTTP vérifiées, erreurs affichées, absence de faux succès de sauvegarde/suppression ; expiration réseau après 15 secondes |
| F02 | État local de récupération chiffré, reprise après échec/rechargement, fusion des changements portant sur des tâches distinctes, écritures conditionnelles Firebase avec ETag et nouvelles tentatives sur HTTP 412 |
| F03 | Le tri conserve la valeur zéro de la priorité haute |
| F04 | Les filtres de dates excluent les tâches sans date ; bornes inclusives ; plage inversée signalée |
| F05 | Couche de données partagée par tâches, calendrier, exports et archives ; statuts harmonisés ; archives exclues du calendrier |
| F06 | Retard tenant compte de l'heure locale dans la liste et son tri ; changement de mois depuis le premier jour pour éviter les sauts de mois courts |
| F07 | Toutes les fermetures de confirmation nettoient les callbacks, y compris Échap et clic sur le fond |
| F08 | Export de `created` avec compatibilité `createdAt` ; tentative de synchronisation avant export ; confirmation explicite avant export d'une copie locale ; protection des cellules CSV commençant par un caractère de formule |
| F09 | Copie d'identifiant vers un emplacement vide uniquement, vérification conditionnelle avant suppression de l'ancien ; changement de mot de passe refusé sans clé ; tâches et mot de passe modifiés ensemble par écriture conditionnelle ; cache rechiffré |
| U01–U04 | Boutons de consultation utilisables au clavier, focus des dialogues, retour au déclencheur, avertissement sur édition non enregistrée, labels et états ARIA, texte secondaire plus contrasté, tailles de lecture et cibles améliorées |
| U05 | Connexion et inscription ouvrent directement l'application ; ancienne page d'attente redirigée sans animation artificielle |
| U06 | Défilement horizontal contenu aux vues larges, formulaire sur une colonne sur petits écrans, cibles Modifier agrandies |
| U07 | Message distinct pour une liste vide et des filtres sans résultat ; compteur de familles de filtres |
| U08 | Réduction des animations respectée ; messages principaux des paramètres et de l'expiration traduits ; attributs accessibles traduits ; suppression des balises dans les traductions textuelles |
| D02 | Titres du calendrier et recherche rendus sans interprétation HTML ; identifiants d'URL encodés ; validation des dates/heures et des identifiants ; suppression des callbacks HTML interpolés dans les commentaires |
| D03 | Migration du cache de tâches en clair vers une enveloppe chiffrée ; clé obligatoire ; aucun envoi de tâches en clair ; état en attente conservé chiffré après déconnexion |
| T01–T02 | Précache complété, variantes d'URL prises en compte, JSON actualisés en ligne, nettoyage limité aux caches de l'application ; pas de remplacement forcé du worker d'une session ouverte |
| T03 | Recherche temporisée, délais d'animation plafonnés, absence de réécriture du cache s'il n'a pas changé |
| T04 | Documentation et versions alignées, tests sur les fonctions réellement livrées et recette Chromium avec serveur fictif |

## Choix de comportement

- Si deux appareils modifient la même tâche différemment, aucune version distante n'est écrasée. La copie locale est conservée chiffrée et le statut explique le conflit. L'export existant permet de conserver cette copie. Aucune nouvelle interface de résolution de conflit n'a été ajoutée.
- La synchronisation effectue des reprises à la reconnexion, au retour sur la fenêtre et périodiquement sur l'écran visible. Elle ne prétend pas fournir un abonnement temps réel.
- Un ancien cache en clair dont l'historique est inconnu est conservé prudemment : si sa fusion avec le serveur est ambiguë, l'application signale un conflit plutôt que de choisir silencieusement.
- La copie chiffrée reste sur l'appareil après déconnexion pour protéger les modifications non encore envoyées. La clé est retirée de la session. Un compte connecté sur un poste compromis reste exposé au code exécuté pendant sa session.
- Lors d'un changement d'identifiant interrompu entre copie et suppression, l'ancien compte est conservé si sa version a changé. Une copie du nouveau compte peut alors subsister ; aucune suppression automatique de récupération n'est tentée.

## Limites et points encore ouverts

1. **D01 — Droits Firebase : non vérifiés et non déployés.** Le dépôt ne contient ni règles serveur ni intégration d'identité serveur. La vérification de mot de passe côté navigateur n'est pas une autorisation Firebase. La mise en place d'une identité serveur et d'une migration des comptes exige la configuration du projet Firebase et une intervention de déploiement coordonnée. Ne pas présenter ce point comme corrigé. Aucune donnée de production n'a été consultée ou modifiée pendant ces travaux.
2. La protection contre les écritures concurrentes exige que tous les clients utilisent cette version. Un ancien client capable d'écrire sans condition peut toujours écraser des données. Fermer les anciens onglets et remplacer les anciennes versions Windows est nécessaire pour bénéficier des correctifs.
3. Les conflits sur une même tâche sont arrêtés et préservés ; leur résolution automatique et une interface dédiée ne sont pas ajoutées. Les verrous locaux utilisent Web Locks lorsqu'il est disponible ; la recette cible Chromium/Electron. Les autres navigateurs restent à vérifier.
4. Les pages d'information publiques restent principalement françaises ; une traduction éditoriale complète n'est pas incluse. Les champs légaux « À COMPLÉTER » nécessitent les informations de l'éditeur et n'ont pas été inventés.
5. Aucune certification d'accessibilité, recette avec lecteur d'écran, mesure Lighthouse en production ni audit juridique n'est revendiqué. Le calendrier conserve une signalisation de retard par jour pour ses groupes de journées ; l'heure précise reste affichée sur les tâches.
6. La mémorisation de vues/filtres, une sélection de colonne mobile, une corbeille et les autres nouvelles fonctions sont volontairement exclues. Le bouton et la page d'export existants sont conservés.
7. Les styles intégrés et les polices externes ne sont pas entièrement restructurés. Les modifications de performance sont ciblées ; aucun gain chiffré en production n'est annoncé.
8. La reprise hors ligne nécessite une session et une clé encore disponibles. Une première connexion ne peut pas être effectuée sans serveur.

## Vérification

- `node --test tests/audit-regressions.cjs` : neuf tests ciblés (HTTP, cache chiffré, reprise, conflits, écritures concurrentes, migration, compte supprimé, modifications rapides, tri/dates et validité des scripts/précache).
- `tests/audit-ui.cjs`, lancé avec le moteur Electron installé : pages réelles servies localement, partition de navigateur isolée, Firebase fictif, aucune requête de production. Consultation/édition des trois vues, suppression annulée par Échap, rendu textuel, création, édition non enregistrée, focus, HTTP 403, largeur mobile, navigation mensuelle, statuts, rotation du mot de passe et export JSON vérifiés. Aucune erreur de console applicative sur cette recette.
- Captures de vérification : `output/playwright/audit-desktop.png` et `output/playwright/audit-mobile.png`, avec tâches fictives.
- La recette ne remplace pas un test sur le Firebase déployé et des appareils physiques.

## Livraison Windows

Sources partagées copiées dans `win_app`, portable immédiat actualisé dans `win_app/release/ToDoList-win32-x64/resources/app`, sources archivées dans `win_app/versions/v5.4.3` et portable versionné dans `win_app/release/v5.4.3/ToDoList-win32-x64`.

Le portable réutilise le moteur Electron déjà installé, avec ses ressources applicatives actualisées ; aucune dépendance Electron n'est mise à niveau. Les anciennes archives sont conservées. Aucun nouvel installeur NSIS n'est généré par cette livraison.

Référence du mécanisme conditionnel : [documentation Firebase — écritures avec ETag](https://firebase.google.com/docs/database/rest/save-data#updating_data_with_conditional_requests).
