# Service IA sur Cloudflare Workers

Le site reste sur GitHub Pages. Le Worker `todo-list-ai` reçoit les demandes de création par phrase et de décomposition, puis appelle Gemini. Sa source est `server/worker.mjs` ; il importe le validateur partagé `assets/js/task-ai.js`.

## Déploiement préparé

- Worker : `todo-list-ai`, compte `e51df5764417cc81e8e2ac3682f493cb`.
- Adresse : `https://todo-list-ai.sacez53-todo.workers.dev/api/ai`.
- Base D1 : `todo-list-ai-quota`, identifiant `e44f138e-050a-4eb8-86c4-b454224b37bd`, binding `AI_QUOTA`.
- Schéma : `server/schema.sql`.

Le Worker et D1 ont été créés via le connecteur Cloudflare. Les modules déployés sont `server/worker.mjs` et `assets/js/task-ai.js` ; les noms de modules doivent conserver ces chemins pour résoudre l’import. Les réglages publics et bindings sont dans `server/cloudflare-metadata.json`, au format de métadonnées de l’API de téléversement Workers. Ce fichier n’est pas une configuration Wrangler ou cf.

La date de compatibilité est `2026-11-19`, avec `nodejs_compat` pour la comparaison des jetons. Les journaux d’invocation et les traces Cloudflare sont activés. Le code n’écrit ni les demandes ni les secrets dans les journaux.

## Activation

Dans [Cloudflare → todo-list-ai → Settings → Variables and Secrets](https://dash.cloudflare.com/e51df5764417cc81e8e2ac3682f493cb/workers/services/view/todo-list-ai/production/settings), ajoutez deux variables de type **Secret** :

| Nom | Valeur |
| --- | --- |
| `GEMINI_API_KEY` | Votre clé Google AI Studio. Ne la placez pas dans le dépôt ou le fichier JSON du site. |
| `AI_ACCESS_CODE` | Un code aléatoire distinct de la clé Google, de 24 à 256 caractères, à communiquer aux personnes autorisées à utiliser l’IA. |

Le Worker renvoie HTTP 503 tant qu’un secret manque. Il ne fait alors aucun appel à Google. Si Cloudflare le demande, déployez les changements de secrets.

Les réglages publics sont déjà définis : `GEMINI_MODEL=gemini-4-hydrogen` et `ALLOWED_ORIGINS=https://sacez53.github.io`. Le modèle a une offre gratuite publiée par Google ; l’accès et les quotas dépendent du projet Google. Vérifiez le niveau de facturation du projet avant utilisation. Aucun modèle de remplacement ni nouvel essai automatique n’est utilisé en cas d’échec.

L’adresse est déjà renseignée dans `assets/json/ai.json`. Les changements du site doivent encore être publiés sur GitHub Pages pour que l’interface actuelle utilise ce Worker. L’origine autorisée ne contient ni chemin ni barre finale. Pour un autre domaine, adaptez `ALLOWED_ORIGINS` ; plusieurs origines peuvent être séparées par une virgule.

## Code d’accès et quotas

Le code d’accès commun est demandé dans le panneau IA et reste en mémoire dans l’onglet. Il n’est enregistré ni dans Firebase ni dans le stockage du navigateur. Il ne donne pas accès à la clé Gemini. Un utilisateur autorisé peut néanmoins redistribuer ce code : changez-le dans les secrets du Worker pour le révoquer. Les comptes historiques du site n’ont pas de session serveur vérifiable ; le service ne considère pas le simple indicateur `sessionStorage.auth` comme une autorisation.

Le service limite les demandes à six par minute UTC et par adresse de connexion, avec un plafond de cent appels par jour UTC pour l’ensemble du Worker. Des incréments conditionnels atomiques dans D1 empêchent les appels simultanés de dépasser ces plafonds. Les compteurs survivent aux redéploiements et sont partagés entre les instances du Worker. Un appel tenté auprès de Google compte même si Google le refuse. La requête et la réponse sont limitées respectivement à 16 Kio et 256 Kio.

D1 contient seulement les compteurs journaliers et les empreintes journalières des adresses de connexion. Il ne contient aucun titre, aucune note et aucune sous-tâche. Les compteurs des périodes précédentes sont effacés lors des prochains appels acceptés. Une erreur D1 refuse la demande et ne déclenche pas d’appel à Google.

Ces plafonds ne garantissent pas la gratuité si le projet Google a un niveau payant ou si les tarifs changent. Pour ouvrir le service à un large public, remplacez le code commun par une authentification serveur avec droits et quotas par compte.

## Données transmises

Une demande contient le titre et les notes du formulaire, avec la date locale, le fuseau horaire et la langue. Elle ne contient ni identifiant de compte ni liste des tâches. Le Worker transmet ces informations à Google par HTTPS. La requête Gemini utilise `store: false` ; cela n’annule pas les règles de traitement et de conservation de Google. N’envoyez pas de données sensibles.

Le client et le Worker contrôlent la structure, les limites de texte et la validité des dates des réponses. Une sortie incorrecte, un refus du modèle ou un dépassement de quota ne modifie pas le formulaire.

Documentation : [Interactions REST](https://ai.google.dev/gemini-api/docs/quickstart), [réponses structurées](https://ai.google.dev/gemini-api/docs/structured-output), [tarifs](https://ai.google.dev/gemini-api/docs/pricing), [secrets Workers](https://developers.cloudflare.com/workers/configuration/secrets/), [binding D1](https://developers.cloudflare.com/d1/worker-api/).

## Vérification

`npm test` comprend des tests du gestionnaire du Worker, avec le fournisseur Gemini simulé et une base SQLite locale pour exécuter les requêtes de quotas. Node.js 22.13 ou plus récent est requis pour ces tests. Ils vérifient aussi les appels parallèles et la remise à zéro des périodes. La compilation du Worker est validée lors de son téléversement Cloudflare.

`npm run test:ui` vérifie le parcours dans un navigateur isolé avec des réponses IA simulées. L’appel réel à Google reste à vérifier après l’ajout des secrets. Les tests ne lisent pas de clé Google et n’appellent pas ce service externe.
