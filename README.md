<div align="center">
  <img src="assets/logo/list-todo.svg" alt="Ma To-Do List Logo" width="120">

  <h1>✨ Ma To-Do List — v5.2 ✨</h1>
  
  <!-- ANIMATION TYPING TEXT (Plugin Externe) -->
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.herokuapp.com?font=IBM+Plex+Mono&weight=600&size=20&pause=1500&color=EFEFEF&center=true&vCenter=true&width=600&lines=L'exp%C3%A9rience+ultime+de+gestion+de+t%C3%A2ches.;Web+PWA+%26+App+Windows+native+autonome.;Bilingue+Fran%C3%A7ais+%2F+Anglais+dynamique.;Chiffrement+de+bout+en+bout+AES-256-GCM.;Synchronisation+Firebase+en+temps+r%C3%A9el." alt="Typing SVG" />
  </a>

  <p>
    <a href="https://sacez53.github.io/To-Do-List/"><img src="https://img.shields.io/badge/Status-En_Ligne-2ea44f?style=for-the-badge&logo=vercel" alt="Status" /></a>
    <img src="https://img.shields.io/badge/Version-v5.2-blue?style=for-the-badge" alt="Version v5.2" />
    <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Windows-informational?style=for-the-badge&logo=windows" alt="Platform" />
    <img src="https://img.shields.io/badge/Langues-FR%20%7C%20EN-green?style=for-the-badge" alt="Langues FR / EN" />
    <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="Vanilla JS" /></a>
    <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Database-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" /></a>
    <img src="https://img.shields.io/badge/Chiffrement-AES--256--GCM-red?style=for-the-badge" alt="Chiffrement AES-256-GCM" />
  </p>

  <p>
    <!-- BADGES DYNAMIQUES GITHUB -->
    <img src="https://img.shields.io/github/repo-size/sacez53/To-Do-List?style=flat-square&color=3b82f6" alt="Repo Size">
    <img src="https://img.shields.io/github/last-commit/sacez53/To-Do-List?style=flat-square&color=f97316" alt="Last Commit">
    <img src="https://img.shields.io/github/license/sacez53/To-Do-List?style=flat-square&color=22c55e" alt="License">
    <img src="https://visitor-badge.laobi.icu/badge?page_id=sacez53.To-Do-List&color=8b5cf6" alt="Visiteurs">
  </p>

  <p>
    <a href="#-aperçu-de-linterface">Aperçu</a> •
    <a href="#-fonctionnalités-majeures">Fonctionnalités</a> •
    <a href="#-application-windows-win_app">App Windows</a> •
    <a href="#-stack-technique">Stack Technique</a> •
    <a href="#%EF%B8%8F-installation-et-lancement">Installation</a> •
    <a href="#-historique-des-versions">Historique</a> •
    <a href="#-à-propos-de-lauteur">Auteur</a>
  </p>
</div>

<br>

> **Ma To-Do List** est un gestionnaire de tâches moderne, performant et multi-plateforme. Disponible en **Progressive Web App (PWA)** et en **Application Windows native autonome**, il associe synchronisation temps réel, chiffrement de bout en bout et interface monochrome soignée en Dark Mode.

---

## 📸 Aperçu de l'Interface

<div align="center">
  <img src="https://via.placeholder.com/800x400/080808/efefef?text=UI+Dashboard+v5.2+-+Vues+Liste+%2F+Kanban+%2F+Tableau" alt="Aperçu Dashboard v5.2" width="85%" style="border-radius: 8px; border: 1px solid #1e1e1e; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);">
</div>

---

## 🚀 Pourquoi utiliser cette To-Do List ?

### ⚡ Performante, Multi-Vues & Responsive
Consultez vos tâches selon vos habitudes grâce à 3 modes d'affichage complets : **Liste dynamique**, **Tableau Kanban** par colonnes de statut, ou **Tableau de données interactif**.

### 🌐 Bilingue Français 🇫🇷 / Anglais 🇬🇧
Support multilingue complet (`i18n`). Choix de la langue dès l'inscription, modifiable dans les paramètres, mémorisé en base Firebase pour votre compte et demandé lors de l'installation sous Windows.

### 🔒 Sécurité & Confidentialité de Bout en Bout
Zéro adresse e-mail collectée. Mots de passe dérivés par **PBKDF2** avec sel cryptographique unique par compte. Toutes les tâches sont chiffrées côté client en **AES-256-GCM** via la `Web Crypto API` avant toute transmission.

### ☁️ Synchronisation Temps Réel & Mode Hors-Ligne
Connectée à **Firebase Realtime Database**, toute modification sur smartphone se reflète immédiatement sur PC. En cas de coupure réseau, l'application continue de fonctionner en local (`localStorage`).

---

## 🛠 Fonctionnalités Majeures

- 👁️ **Vues Multiples V2 :** Basculez en un clic entre la **Liste**, le **Kanban** et le **Tableau**.
- 🔍 **Double modale ergonomique :**
  - **Clic sur le texte d'une tâche** : Ouvre un **récapitulatif en lecture seule** (titre complet, badges statut/priorité, date et heure d'échéance, notes et date de création).
  - **Clic sur le bouton « Modifier »** : Ouvre le formulaire d'édition complet (champs modifiables, sauvegarde, suppression).
- ⚙️ **Filtres Avancés Multi-Critères :** Filtrage combiné par statut, niveau de priorité, date d'échéance (avant/après), présence de notes et tâches sans date.
- 📋 **Statuts & Cycles Rapides :** 5 états (`À faire ➔ En cours ➔ En attente ➔ Terminé ➔ Annulé`) modifiables d'un simple clic sur le badge.
- 📅 **Calendrier Dédié :** Vue mensuelle avec pastilles de statuts et vue planning chronologique détaillée.
- 🚨 **Indicateurs d'Échéance Intelligents :** Alertes dynamiques (*En retard*, *Aujourd'hui*, *Demain*, *Dans Xj*).
- 📊 **Statistiques & Progression :** Compteur de tâches actives, tâches terminées et jauge de complétion visuelle en direct.
- 🌑 **Dark Mode Terminal :** Typographie IBM Plex Mono, contraste certifié WCAG AA.

---

## 💻 Application Windows (`win_app`)

L'application est déclinée sous forme d'application de bureau Windows autonome complète :
- **Installeur Officiel (`To-Do List Setup 5.2.0.exe`) :** Assistant d'installation NSIS avec boîte de dialogue de choix de langue (Français / English), raccourcis Bureau et Menu Démarrer.
- **Version Portable Autonome (`ToDoList-win32-x64`) :** Exécutable prêt à l'emploi sans prérequis ni installation de Node.js.
- **Lanceur Natif Rapide (`ToDoList.exe`) :** Lanceur compilé C# avec détection intelligente des chemins d'exécution.
- **Archives Versionnées :** Dossiers conservés dans `win_app/versions/` et `win_app/release/` pour un suivi historique strict.

---

## 🧬 Stack Technique

| Domaine | Technologies | Rôle |
| :--- | :--- | :--- |
| 🌐 **Web Front-End** | HTML5, CSS3, JavaScript ES2022 Vanilla | Interface sémantique, V2 Multi-vues, i18n |
| 💻 **Bureau Windows** | Electron 44, NSIS, C# (.NET) | Application de bureau autonome, Installeur Setup.exe |
| 🔒 **Cryptographie** | Web Crypto API (AES-256-GCM, PBKDF2) | Chiffrement client E2E, hachage sécurisé |
| ☁️ **Cloud Backend** | Firebase Realtime Database | Synchronisation multi-appareils temps réel |
| 📱 **PWA** | Service Worker (v13), Web Manifest | Cache intelligent, support hors-ligne, installable |

---

## 📁 Structure du Répertoire

```text
📦 To-Do-List
 ┣ 📂 assets
 ┃ ┣ 📂 css           # Feuilles de style (style2.css, transitions...)
 ┃ ┣ 📂 icons         # Icônes multi-résolutions (192px, 512px, ICO)
 ┃ ┣ 📂 js            # Logique métier (app-v2.js, i18n.js, crypto.js, calendar.js...)
 ┃ ┣ 📂 json          # version.json, firebase.json, security.json
 ┃ ┗ 📂 logo          # Identité visuelle vectorielle SVG
 ┣ 📂 pages           # Vues Web (app-v2.html, login.html, calendar.html, settings.html...)
 ┣ 📂 win_app         # Application Windows native
 ┃ ┣ 📂 build         # Code source du lanceur (launcher.cs) & script NSIS (installer.nsh)
 ┃ ┣ 📂 dist          # Installeur officiel généré (To-Do List Setup 5.2.0.exe)
 ┃ ┣ 📂 release       # Build portable décompressé (ToDoList-win32-x64) & releases
 ┃ ┣ 📂 src           # Pages applicatives épurées pour bureau
 ┃ ┣ 📂 versions      # Archives des versions Windows (v5.0/, v5.1/, v5.2/)
 ┃ ┣ 📜 main.js       # Processus principal Electron
 ┃ ┣ 📜 package.json  # Configuration npm, scripts et builder
 ┃ ┗ 📜 ToDoList.exe  # Lanceur natif rapide
 ┣ 📜 index.html      # Page d'accueil vitrine
 ┣ 📜 manifest.json   # Manifeste PWA
 ┣ 📜 sw.js           # Service Worker (Cache v13)
 ┗ 📜 README.md       # Documentation officielle
```

---

## ⚙️ Installation et Lancement

### 🌐 Utilisation Web (PWA)
1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/sacez53/To-Do-List.git
   ```
2. **Configuration Firebase :**
   Dans `assets/json/firebase.json`, renseignez l'URL de votre base Realtime Database.
3. **Lancer l'application :**
   Ouvrez le projet avec un serveur local (ex: *Live Server* dans VS Code) ou accédez à la version hébergée sur GitHub Pages.

### 💻 Application Windows
1. **Depuis l'installeur officiel :**
   Exécutez `win_app/dist/To-Do List Setup 5.2.0.exe` (ou depuis `win_app/release/v5.2/`).
2. **Version portable :**
   Lancez directement `win_app/release/ToDoList-win32-x64/ToDoList.exe` ou `win_app/ToDoList.exe`.
3. **Recompiler en tant que développeur :**
   ```powershell
   cd win_app
   npm install
   npm run build:all   # Génère le package portable et l'installeur officiel Setup.exe
   ```

---

## 📜 Historique des Versions

- **v5.2** *(Octobre 2026)* : Support bilingue complet Français / Anglais (`i18n`), sélection de la langue dans l'installeur Windows officiel NSIS, synchronisation de la langue en base de données Firebase, fiabilisation de l'application de bureau et résolutions des redirections.
- **v5.1** *(Octobre 2026)* : Création de l'installeur Windows officiel autonome (`To-Do List Setup.exe`), organisation modulaire et automatisations des scripts de build.
- **v5.0** *(Octobre 2026)* : Portabilité de bureau Windows native autonome via Electron, lanceur rapide `ToDoList.exe`, versioning et archivage systématique des releases.
- **v4.0** *(Octobre 2026)* : Refonte majeure V2 — Vues Liste, Kanban et Tableau interactif, filtres avancés multi-critères, modale récapitulatif en lecture seule vs modale d'édition, chiffrement client AES-256-GCM et dérivation de clé PBKDF2 avec sel unique.
- **v3.0** *(Mai 2026)* : Intégration de la page Calendrier dédiée avec vue mensuelle et vue planning chronologique.
- **v2.0** *(Avril 2026)* : Refonte monochrome terminal, pages d'information et paramètres, authentification Firebase.
- **v1.0** *(Février 2026)* : Première version opérationnelle avec gestion des tâches, échéances et priorités.

---

## 👨‍💻 À Propos de l'Auteur

Conçu et développé par **Sacha G.**  
*Étudiant BUT MMI, Développeur Web passionné et Photographe Professionnel basé à Laval (France).*

<p>
  <a href="https://github.com/sacez53">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <a href="https://www.instagram.com/sacha.guitter.photo/">
    <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram" />
  </a>
</p>

---

<div align="center">
  <small>Distribué sous licence MIT. ©️ 2026 Sacha G.</small><br>
  <b>Si ce projet vous plaît, n'hésitez pas à laisser une ⭐ sur le dépôt GitHub !</b>
</div>
