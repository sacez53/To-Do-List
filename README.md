<div align="center">
  <img src="assets/logo/list-todo.svg" alt="Logo" width="80" height="80">
  
  # ✨ Ma To-Do List
  
  **Une application de gestion de tâches minimaliste, performante et synchronisée.**
  
  [![PWA Ready](https://img.shields.io/badge/PWA-Ready-8A2BE2?style=for-the-badge&logo=pwa)](https://sacez53.github.io/To-Do-List/)
  [![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://sacez53.github.io/To-Do-List/)
  [![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
  [![Démo Live](https://img.shields.io/badge/Démo_Live-2ea44f?style=for-the-badge)](https://sacez53.github.io/To-Do-List/)
</div>

---

Application web conçue de zéro en **HTML5 / CSS3 / JavaScript Vanilla**, offrant une expérience utilisateur fluide avec **authentification multi-utilisateurs**, **synchronisation temps réel** (Firebase) et **support PWA complet** (installable sur mobile/desktop).

## 🌟 Fonctionnalités Principales

| 🚀 Fonctionnalité | 📝 Détail |
|:---|:---|
| 📱 **Progressive Web App (PWA)** | Installable sur Android/iOS/Desktop. Fonctionne même avec une connexion instable grâce au Service Worker ! |
| 🔐 **Authentification** | Inscription & Connexion sécurisées (hashage SHA-256 côté client via Web Crypto API). |
| 👤 **Multi-utilisateurs** | Chaque compte dispose d'un espace isolé et privé. |
| ☁️ **Synchronisation Temps Réel** | Connecté à Firebase Realtime Database pour une sync multi-appareils. |
| 💾 **Mode Hors-Ligne** | Fallback localStorage complet. Vos données restent accessibles sans internet. |
| ➕ **Gestion Avancée (CRUD)** | Créer, modifier, supprimer des tâches avec une modale ergonomique. |
| 📋 **Cycles de Statuts** | Changez rapidement de statut : *À faire ➔ En cours ➔ En attente ➔ Terminé ➔ Annulé*. |
| 🔴 **Priorités & Échéances** | Indicateurs visuels intelligents (Retard, Aujourd'hui, Bientôt). |
| 🔍 **Recherche & Filtres** | Filtrage par statut et recherche instantanée dans les titres et notes. |
| 📅 **Vues Calendrier** | Planning et grille mensuelle pour visualiser vos échéances. |
| 🌑 **Dark Mode Premium** | Design glassmorphism, sombre, reposant pour les yeux avec des animations fluides. |

---

## 🚀 Démo Live

🔗 **[Accéder à l'application web](https://sacez53.github.io/To-Do-List/)**

> 💡 **Astuce Mobile :** Ouvrez le lien sur votre smartphone, allez dans les options du navigateur et cliquez sur **"Installer l'application"** pour l'ajouter à votre écran d'accueil comme une vraie application native !

---

## 🛠️ Stack Technique

```text
  📄 HTML5       🎨 CSS3       ⚙️ JavaScript      ☁️ Firebase     📱 PWA
Structure       Design        Logique           Database       Offline
```

- **Sémantique & Accessibilité** : HTML5 moderne
- **Design & Animations** : CSS3 pur, CSS Variables, Flexbox/Grid
- **Logique Client** : ES2022 Vanilla (Async/Await), Web Crypto API
- **Stockage Local** : `localStorage` (données), `sessionStorage` (auth)
- **Stockage Cloud** : Firebase Realtime Database
- **Performances** : Service Worker (`sw.js`) avec stratégie de cache "Network First / Cache First"

---

## 📁 Structure du Projet

L'arborescence respecte les standards modernes de développement web :

```text
To-Do-List/
├── 📄 index.html             # Point d'entrée (Landing page & redirection)
├── 📄 manifest.json          # Manifeste PWA (Installation mobile/desktop)
├── 📄 sw.js                  # Service Worker (Cache offline)
├── 📁 pages/                 # Toutes les vues HTML
│   ├── app.html              # Tableau de bord principal
│   ├── login.html            # Interface d'authentification
│   ├── calendar.html         # Vues calendrier
│   └── ...                   
└── 📁 assets/                # Ressources statiques
    ├── 📁 css/               # Feuilles de style (style.css, style2.css)
    ├── 📁 js/                # Logique (app.js, login.js, crypto.js...)
    ├── 📁 json/              # Fichiers de configuration (Firebase, Version...)
    ├── 📁 logo/              # Logos SVG et PNG
    └── 📁 icons/             # Icônes générées pour la PWA (192x, 512x, Maskable)
```

---

## ⚙️ Installation & Configuration

### 1. Cloner le projet
```bash
git clone https://github.com/sacez53/To-Do-List.git
cd To-Do-List
```

### 2. Lier Firebase (Optionnel)
Modifiez le fichier `assets/json/firebase.json` avec l'URL de votre base de données Realtime Database :
```json
{
  "firebaseUrl": "https://VOTRE-PROJET.europe-west1.firebasedatabase.app/"
}
```
*Si vous laissez ce champ vide, l'application fonctionnera à 100% en local (localStorage).*

### 3. Lancer l'application
Le projet ne nécessitant aucun framework lourd, ouvrez simplement `index.html` avec **Live Server** sur VS Code, ou déployez le dossier sur **GitHub Pages / Vercel / Netlify**.

*(⚠️ Note : La PWA et le Service Worker nécessitent un hébergement en HTTPS pour s'activer).*

---

## 👨‍💻 Auteur

**Sacha G.**  
*Étudiant BUT MMI · Développeur Web · Photographe*  
📍 Laval, Pays de la Loire, France

[![GitHub](https://img.shields.io/badge/GitHub-sacez53-181717?style=for-the-badge&logo=github)](https://github.com/sacez53)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/sacha.guitter.photo/)

---

<div align="center">
  <p><i>Conçu avec passion en Vanilla JS.</i></p>
  <p>MIT License © 2026 Sacha G.</p>
</div>
