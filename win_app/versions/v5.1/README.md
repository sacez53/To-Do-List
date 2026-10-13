# To-Do List — Application Windows

Cette version de l'application a été spécialement conçue pour tourner sous forme d'application de bureau Windows native autonome.

---

## 🚀 Comment lancer l'application

Vous disposez de deux manières simples de lancer l'application :

1. **Directement depuis la racine de `win_app` :**
   - Double-cliquez sur `ToDoList.exe` situé à la racine du dossier `win_app`.
2. **Depuis le dossier autonome (`release`) :**
   - Ouvrez le dossier `win_app/release/ToDoList-win32-x64/`
   - Double-cliquez sur `ToDoList.exe`.
   - *Ce dossier peut être déplacé, archivé ou copié sur n'importe quel PC Windows sans avoir besoin d'installer Node.js.*

---

## 📁 Structure des dossiers

Le dossier `win_app` est structuré de façon claire et modulaire :

```text
win_app/
├── assets/          # Styles (CSS), scripts (JS), polices et icônes
├── build/           # Code source du lanceur (launcher.cs) et scripts de build
├── dist/            # Fichiers générés par l'installeur (To-Do List Setup.exe)
├── node_modules/    # Dépendances Electron
├── release/         # Builds autonomes packagés (ToDoList-win32-x64) et releases versionnées
├── src/             # Pages HTML de l'application (login.html, app.html, calendar.html, settings.html)
├── versions/        # Archives des versions précédentes (v5.0/, v5.1/, etc.)
├── main.js          # Point d'entrée Electron
├── package.json     # Configuration npm et scripts de build
├── README.md        # Documentation de l'application Windows
└── ToDoList.exe     # Lanceur natif rapide
```

---

## 📱 Contenu de l'application

L'application a été allégée et épurée pour se concentrer uniquement sur l'expérience applicative :

- **Page de Connexion / Inscription (`src/login.html`) :**
  - Première vue au lancement de l'application.
  - Connexion avec identifiant et mot de passe.
  - Inscription sécurisée avec chiffrement de bout en bout AES-256-GCM et PBKDF2.
  - Redirection directe vers la To-Do List après authentification.
- **Application To-Do List (`src/app.html`) :**
  - Interface moderne v2 complète (Liste, Kanban, Tableau).
  - Synchronisation temps réel avec Firebase RTDB.
  - Recherche, tri, filtres avancés, échéances et notes.
  - Accès direct au **Calendrier** (`src/calendar.html`) et aux **Paramètres** (`src/settings.html`).
  - Bouton **Déconnexion** ramenant immédiatement à l'écran de connexion.
- **Pages exclues :**
  - La page d'accueil marketing (`index.html` vitrine) a été supprimée.
  - Toutes les pages de règles et mentions légales (`cgu.html`, `confidentialite.html`, `mentions-legales.html`, `commentaires.html`, etc.) ainsi que leurs liens ont été retirés.

---

## 🛠️ Recompilation et Création de l'Installeur

Si vous modifiez le code source de l'application :
- **Lancer en mode développement :**
  ```powershell
  npm start
  ```
- **Recompiler le package exécutable autonome :**
  ```powershell
  npm run package
  ```
- **Générer l'installeur Windows officiel (`Setup.exe`) :**
  ```powershell
  npm run installer
  ```
  *L'installeur généré se trouve dans le dossier `win_app/dist/` (ex: `To-Do List Setup 5.1.0.exe`).*
- **Tout compiler (package portable + installeur) :**
  ```powershell
  npm run build:all
  ```
