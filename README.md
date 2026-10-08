<div align="center">
  <img src="assets/logo/list-todo.svg" alt="Ma To-Do List Logo" width="120">

  <h1>✨ Ma To-Do List ✨</h1>
  
  <!-- ANIMATION TYPING TEXT (Plugin Externe) -->
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.herokuapp.com?font=IBM+Plex+Mono&weight=600&size=20&pause=1500&color=EFEFEF&center=true&vCenter=true&width=600&lines=L'exp%C3%A9rience+ultime+de+gestion+de+t%C3%A2ches.;Progressive+Web+App+(PWA)+autonome.;Synchronisation+Firebase+en+temps+r%C3%A9el.;Code+100%25+Vanilla+JS+sans+framework.;Un+design+sombre+premium+(Glassmorphism)." alt="Typing SVG" />
  </a>

  <p>
    <a href="https://sacez53.github.io/To-Do-List/"><img src="https://img.shields.io/badge/Status-En_Ligne-2ea44f?style=for-the-badge&logo=vercel" alt="Status" /></a>
    <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="Vanilla JS" /></a>
    <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Database-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Design-Glassmorphism-8A2BE2?style=for-the-badge&logo=figma&logoColor=white" alt="Design" /></a>
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
    <a href="#-fonctionnalités-détaillées">Fonctionnalités</a> •
    <a href="#%EF%B8%8F-installation-pour-les-développeurs">Installation</a> •
    <a href="#-à-propos-de-lauteur">Auteur</a>
  </p>
</div>

<br>

> **Ma To-Do List** n'est pas qu'un simple gestionnaire de tâches. C'est une véritable **Progressive Web App (PWA)**, codée de zéro, qui allie la puissance d'une synchronisation Cloud en temps réel à l'élégance d'une interface minimaliste en Glassmorphism.

---

## 📸 Aperçu de l'Interface

*(💡 Remplace ce bloc par tes propres captures d'écran en glissant-déposant les images sur GitHub)*
<div align="center">
  <img src="https://via.placeholder.com/800x400/080808/efefef?text=UI+Dashboard+-+Ins%C3%A9rer+une+Capture+d'%C3%A9cran+ici" alt="Aperçu Dashboard" width="85%" style="border-radius: 8px; border: 1px solid #1e1e1e; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);">
</div>

---

## 🚀 Pourquoi utiliser cette To-Do List ?

### ⚡ Performante & Autonome (PWA)
Pas besoin d'App Store. Naviguez sur le site via Chrome ou Safari et cliquez sur **Installer**. Grâce à son `Service Worker`, l'application gère un cache intelligent : elle s'ouvre instantanément et **fonctionne parfaitement hors-ligne**.

### 🔒 Sécurité & Multi-Comptes
Une véritable **sécurité de bout-en-bout**. Vos mots de passe sont hachés côté client via la `Web Crypto API` (SHA-256) avant même de toucher la base de données. Chaque utilisateur possède son espace strictement hermétique.

### ☁️ Magie du Temps Réel
Connectée à **Firebase Realtime Database**, toute modification sur votre smartphone apparaît instantanément sur votre ordinateur. Plus de rafraîchissement manuel : la donnée est vivante. 

---

## 🛠 Fonctionnalités Détaillées

<details open>
<summary><b>📂 Afficher les fonctionnalités principales</b></summary><br>

- 📋 **Cycles de Statuts :** Cliquez sur le statut d'une tâche pour cycler d'un geste : `À faire ➔ En cours ➔ En attente ➔ Terminé ➔ Annulé`.
- ➕ **Modale de Gestion (CRUD) :** Édition avancée avec Titre, Notes illimitées, Priorité, et Date d'échéance.
- 📅 **Vues Calendrier :** Un planning chronologique et une grille mensuelle pour ne rater aucune échéance.
- 🔍 **Moteur de Recherche Intégré :** Trouvez instantanément une tâche grâce au filtre en temps réel (sur le titre et les notes).
- 🚨 **Indicateurs d'Échéance :** Badges dynamiques qui s'affichent si la tâche est *en retard*, prévue pour *aujourd'hui*, ou *à venir*.
- 📊 **Barre de Progression :** Suivi visuel de l'accomplissement global (calculé en direct).
- 🌑 **Dark Mode Premium :** Couleurs de fond `#080808` et surfaces `#0f0f0f` pour réduire la fatigue visuelle (contraste certifié WCAG AA).

</details>

---

## 🧬 Architecture & Stack Technique

Un projet purement **Vanilla**, sans frameworks lourds (ni React, ni Vue), prouvant qu'il est possible de créer une application web complexe, ultra-réactive et maintenable uniquement avec les standards natifs d'aujourd'hui.

<!-- PLUGIN STATISTIQUES LANGAGES AUX COULEURS DU SITE -->
<div align="center">
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=sacez53&repo=To-Do-List&layout=compact&theme=radical&hide_border=true&bg_color=080808&title_color=EFEFEF&text_color=9A9A9A&icon_color=EFEFEF" alt="Langages les plus utilisés">
</div>

| Couche | Technologies Utilisées | Rôle |
| :--- | :--- | :--- |
| 🌐 **Front-End** | HTML5, CSS3, ES2022 Vanilla | Structure sémantique, Grid/Flexbox, Logique asynchrone |
| ☁️ **Back-End** | Firebase Realtime DB | Persistance Cloud & Synchronisation Temps Réel |
| 🧠 **Navigateur** | localStorage, Web Crypto API | Mode Hors-Ligne & Hachage des mots de passe |
| 📱 **Mobile** | PWA, Service Worker, Web Manifest | Installation App, Cache réseau, Responsive Design |

---

## 📁 Structure du Répertoire

L'arborescence suit les meilleures pratiques de développement web :

```text
📦 To-Do-List
 ┣ 📂 assets
 ┃ ┣ 📂 css        # Feuilles de style modulaires
 ┃ ┣ 📂 icons      # Icônes PWA générées (192x, 512x, Maskable)
 ┃ ┣ 📂 js         # Logique métier (app, crypto, calendar...)
 ┃ ┣ 📂 json       # Configurations (Firebase, UI, Sécurité)
 ┃ ┗ 📂 logo       # Identité visuelle (SVG)
 ┣ 📂 pages        # Vues HTML (dashboard, login, calendar...)
 ┣ 📜 index.html   # Point d'entrée de la Web App
 ┣ 📜 manifest.json# Manifeste d'installation PWA
 ┗ 📜 sw.js        # Service Worker (stratégie Network/Cache)
```

---

## ⚙️ Installation (Pour les développeurs)

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/sacez53/To-Do-List.git
   ```
2. **Configurer la base de données** :
   Dans `assets/json/firebase.json`, remplacez l'URL par la vôtre. *(Astuce : Laissez vide pour tester l'app 100% hors-ligne via le localStorage !)*
3. **Lancer le serveur** :
   Ouvrez le projet via *Live Server* (VS Code) ou déployez-le sur *GitHub Pages*.

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

<!-- CARTE STATS REPOSITORY AUX COULEURS DU SITE -->
<div align="center">
  <img src="https://github-readme-stats.vercel.app/api/pin/?username=sacez53&repo=To-Do-List&theme=radical&hide_border=true&bg_color=080808&title_color=EFEFEF&text_color=9A9A9A&icon_color=EFEFEF" alt="Repo Stats">
</div>

---

<div align="center">
  <small>Distribué sous la licence MIT. ©️ 2026 Sacha G.</small><br>
  <b>Si ce projet vous plaît, n'hésitez pas à laisser une ⭐ sur le dépôt GitHub !</b>
</div>
