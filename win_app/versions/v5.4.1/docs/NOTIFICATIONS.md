# Notifications push — offre gratuite, v5.4

Cette fonctionnalité ajoute des rappels aux tâches existantes, sans changer
l'authentification Firebase. Le site peut rester sur GitHub Pages. L'envoi est
assuré par un Worker Cloudflare et une base D1, tous deux disponibles sur le
plan **Workers Free**. Aucun projet Firebase Blaze n'est nécessaire.

Le code est préparé, mais il faut déployer le service sur votre propre compte
Cloudflare gratuit avant d'activer les notifications sur les téléphones.
Un service worker seul ne peut pas se réveiller à une heure donnée pour envoyer
une notification quand l'application est fermée : le déclencheur serveur est
indispensable.

## 1. Préparer le compte gratuit

Créer un compte Cloudflare et conserver l'offre Workers Free. Ne pas activer
Workers Paid. Le projet n'utilise ni Queues, ni R2, ni service Firebase payant.
Les quotas Free sont des plafonds : s'ils sont atteints, le service est limité
plutôt que de basculer automatiquement sur une offre payante.

Depuis la racine du projet :

```powershell
cd push-server
npm ci
npx wrangler login
npx wrangler d1 create todo-push
```

Copier le `database_id` retourné dans `push-server/wrangler.toml`, à la place de
`REMPLACER_PAR_IDENTIFIANT_D1`. Conserver `binding = "DB"`.

Créer les tables :

```powershell
npx wrangler d1 execute todo-push --remote --file schema.sql
```

## 2. Créer les clés Web Push

```powershell
npm run keys
```

Cela crée `.dev.vars`, un fichier **privé ignoré par Git**. Le script n'affiche
pas la clé privée et refuse d'écraser une paire existante.

Ajouter les deux valeurs du fichier aux secrets du Worker, avec les commandes
interactives suivantes. Coller la valeur correspondante lorsque Wrangler la
demande, sans la mettre dans la ligne de commande :

```powershell
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
```

La clé publique peut être distribuée aux navigateurs ; la clé privée doit
rester dans Cloudflare Secrets et dans votre sauvegarde privée. Ne pas copier
`.dev.vars` dans le site, Windows ou une archive publique.

`VAPID_SUBJECT` contient un contact d'administration. Par défaut :
`mailto:sachaguitter@gmail.com`. Modifier ce contact si nécessaire.

## 3. Déployer et relier le site

```powershell
npm run deploy
```

Copier l'URL HTTPS `https://todo-list-push.<votre-sous-domaine>.workers.dev` dans
`assets/json/push.json` :

```json
{
  "apiBaseUrl": "https://todo-list-push.VOTRE-SOUS-DOMAINE.workers.dev"
}
```

Ne pas ajouter de route `/config` à cette valeur. L'application utilise
automatiquement les routes du service et récupère sa clé publique.

Le Cron `* * * * *` vérifie les rappels chaque minute. Les modifications de Cron
peuvent prendre quelques minutes à se propager. Les origines autorisées dans
`wrangler.toml` sont celles de GitHub Pages, du développement local et de
l'application Windows existante (`null` pour ses pages locales). Ajouter
l'origine exacte, sans chemin, si le domaine du site change.

Publier ensuite les fichiers Web modifiés. Pour la copie Windows, reporter le
même `push.json` dans `win_app/assets/json/` et dans les ressources du portable
actuel. Les archives déjà créées conservent la configuration de leur version.

Sans URL configurée, seule la section Notifications signale la configuration
manquante : la connexion et la gestion des tâches continuent à fonctionner.

## 4. Activer sur Android

1. Ouvrir le site HTTPS dans Google Chrome.
2. Installer l'application depuis le menu de Chrome, puis ouvrir son icône.
3. Se connecter, aller dans **Paramètres → Notifications**.
4. Appuyer sur **Activer sur cet appareil** et autoriser les notifications.
5. Appuyer sur **Envoyer un test**.

## 5. Activer sur iPhone / iPad

1. Utiliser **iOS / iPadOS 16.4 ou plus récent**.
2. Dans Chrome, ouvrir le menu de partage puis **Ajouter à l'écran d'accueil**.
   Si cette option n'est pas proposée par la version de Chrome utilisée, ouvrir
   la même adresse dans Safari et utiliser Partager → Ajouter à l'écran d'accueil.
3. **Ouvrir l'icône ajoutée**, pas un simple onglet Chrome.
4. Se connecter, ouvrir Paramètres → Notifications, puis appuyer sur Activer.
5. Autoriser la demande iOS et envoyer une notification de test.

La demande d'autorisation part d'un clic explicite, comme exigé sur iOS.
Vérifier également les réglages Notifications et les modes Concentration du
téléphone si le système n'affiche pas de bannière.

## Fonctionnement et confidentialité

- Un rappel est prévu à la date et à l'heure de la tâche. Sans heure, il est
  prévu à **9 h dans le fuseau de l'appareil qui synchronise les échéances**.
- Les tâches terminées, annulées ou archivées n'ont pas de rappel.
- Une modification ou suppression en ligne remplace la programmation.
- Chaque téléphone doit donner son propre accord. Maximum : 10 appareils par
  canal de rappels et 200 échéances actives dans cette configuration gratuite.
- Le service reçoit les échéances UTC, des identifiants de tâches, la langue et
  les abonnements techniques Web Push. **Aucun titre, aucune note, aucun mot de
  passe et aucune clé de chiffrement des tâches ne lui sont transmis.**
- Une capacité dédiée aux rappels est dérivée de la clé de session avec HMAC et
  un contexte séparé. Son empreinte identifie le canal ; le service n'accède pas
  à Firebase. Chaque appareil possède aussi une clé de gestion aléatoire, pour
  empêcher une autre installation de le désactiver ou de reprendre son abonnement.
- Les appareils du même compte et mot de passe alimentent le même canal ; les
  changements faits dans une session Web ou Windows ouverte actualisent aussi
  les rappels des téléphones abonnés. La synchronisation des tâches reste celle
  de l'application existante : rouvrir une session en ligne après un changement
  effectué hors ligne pour transmettre la programmation.
- Un changement de mot de passe ou une suppression du compte tente de retirer
  l'ancien canal. Réactiver les appareils après un changement de mot de passe.
  Si le réseau a empêché le retrait, désactiver les notifications du téléphone
  dans ses réglages système pour les couper immédiatement.
- Les rappels continuent après fermeture de l'app ou expiration de la session.
  Le bouton Désactiver les retire uniquement pour l'appareil courant.
- Les abonnements inactifs depuis 90 jours sont retirés quotidiennement. Les
  anciennes échéances sont nettoyées quotidiennement ; les confirmations
  d'envoi sont conservées au maximum 30 jours. Les empreintes d'IP utilisées
  pour limiter les demandes sont nettoyées quotidiennement.

## Délais et vérification réelle

Le service gratuit traite jusqu'à trois notifications par minute, afin de
rester adapté au budget CPU du plan Free. Plusieurs rappels simultanés peuvent
donc arriver avec quelques minutes de décalage. Un rappel peut être repris dans
les quinze minutes suivant son échéance. Le push n'est pas une alarme à la
seconde : réseau, économie d'énergie, réglages du téléphone et quotas peuvent
retarder ou empêcher l'affichage.

Après déploiement, tester sur un vrai Android et un vrai iPhone : créer une
tâche à quelques minutes, fermer l'application, verrouiller le téléphone,
attendre le rappel et appuyer dessus. Tester aussi une tâche annulée avant
l'échéance et la désactivation sur un appareil.

## Tests locaux

```powershell
cd push-server
npm test
npx wrangler deploy --dry-run --outdir dist
```

Les tests utilisent une vraie base SQLite en mémoire, le chiffrement Web Push
réel et des réponses réseau simulées. Ils ne remplacent pas un test sur les
téléphones et le compte Cloudflare déployé.

Références officielles :
- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/workers/configuration/cron-triggers/

## Correctif v5.4.1 — adresse active

Le sous-domaine précédent `todo-sacez53.workers.dev` ne publiait pas les Workers.
Le service est maintenant disponible sur :

https://todo-list-push.sacez53-todo.workers.dev

Cette adresse est renseignée dans `assets/json/push.json`. Le point `/config`
a été vérifié avec une réponse HTTP 200 et l’origine GitHub Pages autorisée.
Après mise à jour de la PWA, réessayer Paramètres → Notifications → Activer.
