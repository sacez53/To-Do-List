# ✅ To-Do List — Premium Multi-User Web App

[![GitHub Pages](https://img.shields.io/badge/Démo-Live-brightgreen)](https://sacez53.github.io/To-Do-List/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-orange)](https://firebase.google.com/)
[![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-100%25-yellow)](https://sacez53.github.io/To-Do-List/)
[![Responsive](https://img.shields.io/badge/Responsive-✅-blue)](https://sacez53.github.io/To-Do-List/)

Application de gestion de tâches **premium** et **responsive**, conçue en **HTML5 / CSS3 / JavaScript vanilla**, avec **authentification multi-utilisateurs** et **synchronisation temps réel via Firebase Realtime Database**.

---

## ✨ Fonctionnalités

| Fonctionnalité | Détail |
|---|---|
| 🔐 **Authentification** | Inscription / Connexion sécurisées (hash SHA-256 côté client) |
| 👤 **Multi-utilisateurs** | Chaque compte a ses propres tâches isolées |
| ☁️ **Sync Firebase** | Synchronisation temps réel entre appareils |
| 💾 **Fallback localStorage** | Fonctionne hors-ligne si Firebase indisponible |
| ➕ **CRUD complet** | Créer, lire, modifier, supprimer des tâches via modale |
| 📋 **Statuts multiples** | À faire · En cours · En attente · Terminé · Annulé |
| 🔴 **Priorités** | Haute / Normale / Basse |
| 📅 **Dates d'échéance** | Alertes visuelles (En retard / Aujourd'hui / Bientôt) |
| 📝 **Notes** | Champ de notes libre par tâche |
| 🔍 **Recherche** | Recherche en temps réel dans les titres et notes |
| 🗂️ **Filtres** | Par statut (Toutes / En cours / Terminées…) |
| 🔃 **Tri** | Par date de création, priorité, échéance ou statut |
| 📊 **Barre de progression** | Pourcentage de tâches terminées |
| 🌑 **Design sombre premium** | Interface glassmorphism, animations fluides |
| 📱 **Responsive** | Mobile-first, navigation optimisée |
| 🔄 **Indicateur de sync** | Statut de synchronisation Firebase en temps réel |

---

## 🚀 Démo Live

```
https://sacez53.github.io/To-Do-List/
```

> 🔐 Crée un compte, connecte-toi, et retrouve tes tâches sur n'importe quel appareil.

---

## 🛠️ Stack Technique

```
HTML5        CSS3         Vanilla JS     Firebase
  📄           🎨             ⚙️              ☁️
Structure    Design        Logique      Base de données
```

| Technologie | Usage |
|---|---|
| **HTML5 sémantique** | Structure des pages |
| **CSS3 custom** | Design, animations, responsive |
| **JavaScript ES2022** | Logique, async/await, Web Crypto API |
| **Firebase Realtime DB** | Persistance cloud & sync multi-device |
| **localStorage** | Persistance locale & fallback offline |
| **sessionStorage** | Gestion de session utilisateur |
| **Web Crypto API** | Hash SHA-256 des mots de passe |

---

## 📁 Structure du Projet

```
To-Do-List/
├── index.html          # 🔀 Redirection automatique vers login.html
├── login.html          # 🔐 Page d'authentification (connexion + inscription)
├── login.js            # ⚙️  Logique auth (Firebase, SHA-256, validation)
├── app.html            # 🗂️  Interface principale de gestion des tâches
├── app.js              # ⚙️  Logique tâches (CRUD, filtres, tri, sync Firebase)
├── config.json         # 🔧 URL Firebase Realtime Database
├── style/
│   ├── style.css       # 🎨 Styles de la page de login
│   └── style2.css      # 🎨 Styles de l'application principale
├── logo/               # 🖼️  Assets logo
└── README.md           # 📖 Documentation
```

---

## ⚙️ Installation & Configuration

### 1. Cloner le repo

```bash
git clone https://github.com/sacez53/To-Do-List
cd To-Do-List
```

### 2. Configurer Firebase

Édite `config.json` avec l'URL de ta Firebase Realtime Database :

```json
{
  "firebaseUrl": "https://ton-projet-default-rtdb.europe-west1.firebasedatabase.app/"
}
```

> **Sans Firebase** : laisse `firebaseUrl` vide ou supprime-le – l'app fonctionne en mode local (localStorage uniquement).

### 3. Règles Firebase recommandées

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

> ⚠️ Pour la production, restreindre les règles d'accès Firebase.

### 4. Lancer

Ouvre `index.html` dans le navigateur ou utilise **Live Server** (VS Code).

---

## 🔐 Système d'Authentification

- **Inscription** : username (3–20 caractères alphanumériques) + mot de passe (min. 5 caractères)
- **Hachage** : le mot de passe est hashé en SHA-256 via la **Web Crypto API** avant envoi
- **Stockage** : `{ password: hash, todos: [...] }` dans Firebase sous `/users/{username}/`
- **Session** : gérée par `sessionStorage` (expirée à la fermeture du navigateur)
- **Isolation** : les tâches de chaque utilisateur sont strictement séparées

---

## 🗄️ Structure des Données Firebase

```json
{
  "users": {
    "sacha": {
      "password": "<sha256_hash>",
      "todos": [
        {
          "id": 1711800000000,
          "text": "Livraison album client Dupont",
          "status": "inprogress",
          "priority": "high",
          "due": "2026-04-01",
          "notes": "Exporter en JPEG 72dpi pour le web",
          "created": "2026-03-30T17:00:00.000Z"
        }
      ]
    }
  }
}
```

---

## 🎮 Utilisation

```
1. 🔐 Connexion / Inscription sur login.html
2. ➕ Cliquer sur le bouton + pour créer une tâche
3. 📋 Renseigner : titre, statut, priorité, date d'échéance, notes
4. 🔍 Rechercher une tâche via la barre de recherche
5. 🗂️  Filtrer par statut via les boutons de filtre
6. 🔃 Trier par date, priorité, échéance ou statut
7. 📊 Suivre la progression globale via la barre de progression
8. 🔄 Toutes les modifications se synchronisent automatiquement avec Firebase
9. 🚪 Se déconnecter via le bouton de déconnexion
```

---

## 📱 Responsive Design

| Écran | Comportement |
|---|---|
| **Mobile** < 480px | Navigation compacte, tâches pleine largeur |
| **Tablette** < 768px | Layout adaptatif, compteurs centrés |
| **Desktop** > 1024px | Interface centrée, max-width optimisée |

---

## 👨‍💻 Auteur

**Sacha G.**
*Étudiant BUT MMI · Photographe professionnel*
📍 Laval, Pays de la Loire, France

[![GitHub](https://img.shields.io/badge/GitHub-sacez53-black)](https://github.com/sacez53)

---

## 📄 Licence

```
MIT License © 2026 Sacha G.
Libre d'utilisation, modification et intégration.
⭐ N'hésite pas à star le repo si le projet t'est utile !
```