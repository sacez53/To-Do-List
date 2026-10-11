# Politique de Sécurité & Signalement de Vulnérabilités

## 1. Versions prises en charge

Les correctifs de sécurité sont appliqués en priorité sur la version de production active :

| Version | Prise en charge |
| :--- | :--- |
| **5.x (Production)** | :white_check_mark: Support actif |
| < 5.0 | :x: Fin de support |

## 2. Principes de sécurité appliqués

- **Chiffrement de bout en bout (E2EE) :** Les tâches sont chiffrées côté client avec l'algorithme symétrique **AES-256-GCM** via la Web Crypto API (`crypto.subtle`). La clé symétrique est dérivée localement et n'est jamais transmise au serveur.
- **Hachage des mots de passe :** Algorithme **PBKDF2** (100 000 itérations, SHA-256) avec un sel cryptographique aléatoire de 16 octets conformément aux recommandations de la CNIL (délibération n° 2022-100).
- **Minimisation des données :** Aucune collecte d'adresses e-mail, de numéros de téléphone ou de données bancaires.
- **Stockage technique :** Utilisation exclusive de `sessionStorage`, `localStorage` et de l'API Cache du Service Worker pour le mode hors-ligne. Aucun traceur publicitaire tiers.

## 3. Signalement responsable d'une vulnérabilité (Responsible Disclosure)

Si vous découvrez une vulnérabilité de sécurité ou un incident potentiel affectant l'application ou l'infrastructure Firebase :

1. **Ne divulguez pas publiquement la faille** avant qu'un correctif n'ait été déployé.
2. Ouvrez une notification de sécurité privée ou contactez le responsable du projet par e-mail : `[À COMPLÉTER : contact-securite@domaine.fr]` ou via une *Security Advisory* privée sur GitHub ([github.com/sacez53/To-Do-List/security/advisories](https://github.com/sacez53/To-Do-List/security/advisories)).
3. Veuillez inclure dans votre signalement :
   - Une description détaillée du problème et du composant affecté ;
   - Les étapes de reproduction ou un scénario de test (PoC) ;
   - L'impact potentiel sur la confidentialité ou l'intégrité des données.

Un accusé de réception vous sera transmis dans un délai de 48 heures ouvrées, et un correctif sera publié dans les meilleurs délais.
