// ══════════════════════════════════════════════════════
//  I18N.JS — Internationalisation (Français / Anglais)
// ══════════════════════════════════════════════════════

const I18N_DICTIONARY = {
  fr: {
    "push_other_account": "Cet appareil reçoit les rappels d’un autre compte. Désactivez-les ou activez ce compte sur cet appareil.",
    "push_disabled_cleanup": "Notifications désactivées sur cet appareil. Le retrait de l’abonnement côté serveur reste à confirmer lorsque la connexion sera rétablie.",

    "push_tab": "🔔 Notifications",
    "push_title": "Notifications push",
    "push_help": "Android : installez l’application depuis Chrome. iPhone : iOS 16.4 minimum, ajoutez le site à l’écran d’accueil puis ouvrez son icône.",
    "push_timing": "Un rappel à l’échéance, ou à 9 h si la tâche n’a pas d’heure. Les rappels fonctionnent aussi quand l’application est fermée, avec une connexion Internet.",
    "push_privacy": "Le service reçoit uniquement les dates et les identifiants techniques. Les notifications ne montrent ni le titre ni les notes.",
    "push_enable": "Activer sur cet appareil",
    "push_disable": "Désactiver sur cet appareil",
    "push_test": "Envoyer un test",
    "push_enabled": "Notifications activées. Les rappels continuent après la fermeture ou la déconnexion.",
    "push_disabled": "Notifications désactivées sur cet appareil.",
    "push_https": "Les notifications nécessitent une connexion HTTPS.",
    "push_ios_install": "Sur iPhone ou iPad : utilisez iOS 16.4 ou plus récent, ajoutez le site à l’écran d’accueil, puis ouvrez cette icône pour activer les notifications. Un onglet Chrome ne suffit pas.",
    "push_unsupported": "Les notifications push ne sont pas disponibles dans cet environnement. Sur iPhone, iOS 16.4 minimum est nécessaire.",
    "push_config": "Le service gratuit de notifications reste à configurer. Consultez le guide docs/NOTIFICATIONS.md du projet. La gestion des tâches reste disponible.",
    "push_denied": "Autorisation refusée. Vous pouvez autoriser les notifications dans les réglages de cette application ou du navigateur.",
    "push_error": "Impossible de confirmer l’opération. Vérifiez la connexion et réessayez.",
    "push_sync_error": "Rappels non synchronisés : ouvrez l’application en ligne et réessayez.",
    "push_test_sent": "Notification de test acceptée par le service d’envoi. Vérifiez les notifications de votre téléphone.",
    "push_enable_first": "Activez d’abord les notifications sur cet appareil.",
    "push_expired": "L’abonnement a expiré. Réactivez les notifications sur cet appareil.",
    "push_rate": "Trop de demandes. Réessayez dans une minute.",
    "push_signin": "Connectez-vous pour gérer vos rappels.",
    "push_limit": "La version gratuite est prévue pour 200 échéances actives au maximum.",

    // Navigation & Header
    "app_title": "To‑Do List",
    "space_of": "Espace de",
    "loading": "Chargement...",
    "syncing": "Synchronisation...",
    "synced": "Synchronisé",
    "offline": "Hors-ligne",
    "calendar": "📅 Calendrier",
    "settings": "⛯ Paramètres",
    "logout": "Déconnexion",
    "back_to_app": "← Retour à l'App",
    "back_to_home": "← Accueil",
    "home": "Accueil",
    "my_space": "Mon espace",
    "login_or_register": "Connexion ou inscription",

    // Stats
    "stat_tasks": "{count} tâche{s}",
    "stat_done": "{count} terminée{s}",

    // Recherche et Tri
    "search_placeholder": "Rechercher...",
    "sort_status": "Statut",
    "sort_az": "A → Z",
    "sort_za": "Z → A",
    "sort_recent": "Récents",
    "sort_old": "Anciens",
    "sort_priority": "Priorité ↑",
    "sort_due": "Échéance ↑",
    "sort_overdue_first": "Retards d'abord",
    "sort_notes_first": "Notes en premier",

    // Vues
    "view_list": "☰ Liste",
    "view_kanban": "⬛ Kanban",
    "view_table": "⊞ Tableau",

    // Filtres avancés
    "adv_filters": "⚙ Filtres avancés",
    "reset_filters": "Réinitialiser",
    "filter_status": "Statut",
    "filter_priority": "Priorité",
    "filter_due": "Date d'échéance",
    "filter_before": "Avant le",
    "filter_after": "Après le",
    "filter_others": "Autres",
    "filter_with_notes": "📝 Avec notes",
    "filter_no_due": "📅 Sans date",

    // Statuts
    "status_todo": "À faire",
    "status_inprogress": "En cours",
    "status_waiting": "En attente",
    "status_done": "Terminé",
    "status_cancelled": "Annulé",

    // Priorités
    "prio_normal": "Normale",
    "prio_high": "Haute",
    "prio_low": "Basse",

    // Tableau & Kanban
    "table_col_task": "Tâche",
    "table_col_status": "Statut",
    "table_col_priority": "Priorité",
    "table_col_due": "Échéance",
    "table_col_notes": "Notes",
    "table_col_actions": "Actions",
    "kanban_empty": "Vide",
    "empty_tasks": "Aucune tâche.",
    "empty_tasks_sub": "Créez une tâche avec le bouton + ci-dessous",
    "search_no_results": "Aucun résultat pour « {query} »",

    // Modales
    "modal_new_task": "Nouvelle tâche",
    "modal_edit_task": "Modifier la tâche",
    "modal_view_task": "Détail de la tâche",
    "modal_summary": "Récapitulatif",
    "recap_no_due": "📅 Aucune date d'échéance",
    "recap_no_notes": "Aucune note",
    "recap_created": "Créée le {date} à {time}",
    "recap_prio_normal": "— Priorité normale",
    "badge_status_title": "Changer le statut",
    "task_recap_title": "Cliquer pour voir le résumé",
    "edit_task_title": "Modifier la tâche",
    "modal_field_title": "Titre",
    "modal_placeholder_title": "Nom de la tâche...",
    "modal_field_status": "Statut",
    "modal_field_priority": "Priorité",
    "modal_field_due": "Date d'échéance",
    "modal_field_time": "Heure",
    "modal_field_optional": "(optionnel)",
    "modal_field_notes": "Notes",
    "modal_placeholder_notes": "Ajouter une note...",
    "btn_create": "Créer",
    "btn_save": "Enregistrer",
    "btn_edit": "Modifier",
    "btn_close": "Fermer",
    "btn_cancel": "Annuler",
    "btn_delete": "Supprimer",

    // Modale confirmation suppression
    "confirm_delete_title": "Supprimer la tâche ?",
    "confirm_delete_desc": "Cette action est irréversible.",

    // Connexion & Inscription
    "tab_login": "Connexion",
    "tab_register": "Créer un compte",
    "field_username": "Identifiant",
    "field_password": "Mot de passe",
    "field_confirm_password": "Confirmer le mot de passe",
    "field_language": "Langue",
    "placeholder_username": "votre_identifiant",
    "placeholder_password": "••••••••",
    "placeholder_password_min": "min. 6 caractères",
    "btn_show": "voir",
    "btn_hide": "cacher",
    "btn_login": "Se connecter",
    "btn_register": "Créer mon compte",
    "rules_username": "3 à 20 caractères · lettres, chiffres, _ et - uniquement",
    "rules_security": "🔒 <strong>Sécurité & Confidentialité :</strong> Chiffrement AES-256-GCM de bout en bout. Aucun e-mail n'est collecté. En cas d'oubli de mot de passe, vos tâches ne pourront pas être récupérées.",
    "hint_account": "Chaque compte dispose de ses propres tâches",
    "error_fill_fields": "Remplissez tous les champs.",
    "error_user_not_found": "Identifiant introuvable.",
    "error_wrong_pass": "Mot de passe incorrect.",
    "error_invalid_user": "Identifiant invalide (3–20 car., lettres/chiffres/_/-).",
    "error_pass_match": "Les mots de passe ne correspondent pas.",
    "error_pass_short": "Mot de passe trop court (min. {min} caractères).",
    "error_user_taken": "Cet identifiant est déjà utilisé.",
    "success_account_created": "Compte créé ! Redirection...",

    // Paramètres
    "settings_title": "Paramètres",
    "settings_subtitle": "Compte & Sécurité",
    "tab_account": "👤 Compte",
    "tab_display": "👁️ Affichage",
    "tab_archive": "📦 Archives",
    "tab_danger": "⚠️ Danger",
    "sec_username_title": "Identifiant",
    "sec_username_sub": "Modifier votre nom d'utilisateur",
    "label_new_username": "Nouvel identifiant",
    "label_confirm_pass": "Confirmer avec votre mot de passe",
    "btn_change_username": "Changer d'identifiant",
    "sec_pass_title": "Mot de passe",
    "sec_pass_sub": "Modifier votre mot de passe — re-chiffre toutes vos tâches",
    "label_old_pass": "Mot de passe actuel",
    "label_new_pass": "Nouveau mot de passe",
    "btn_change_pass": "Changer le mot de passe",
    "sec_display_title": "Préférences d'affichage",
    "sec_display_sub": "Personnaliser l'apparence et la langue de l'application",
    "label_calendar_view": "Vue par défaut du calendrier",
    "opt_view_grid": "Mois (Grille)",
    "opt_view_planning": "Planning (Liste chronologique)",
    "label_app_language": "Langue de l'application",
    "btn_save_display": "Enregistrer les préférences",
    "saved_preferences": "Préférences enregistrées avec succès.",
    "sec_archive_title": "Archives",
    "sec_archive_sub": "Gérer vos tâches terminées et archivées",
    "btn_archive_done": "Archiver toutes les tâches terminées",
    "no_archived_tasks": "Aucune tâche archivée.",
    "sec_danger_title": "Zone de danger",
    "sec_danger_sub": "Actions irréversibles",
    "danger_text": "La suppression de votre compte effacera définitivement toutes vos tâches et données. Cette action est <strong>irréversible</strong>.",
    "btn_delete_account": "Supprimer mon compte",

    // Calendrier
    "calendar_title": "Calendrier",
    "calendar_overview": "Vue d'ensemble",
    "view_month": "Mois",
    "view_planning": "Planning",
    "prev_month": "Mois précédent",
    "next_month": "Mois suivant",
    "no_planning_tasks": "Aucune tâche planifiée.",
    "days_short": ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    "months": ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],

    // Footer
    "footer_privacy": "Confidentialité",
    "footer_legal": "Mentions Légales",
    "footer_cgu": "CGU",
    "footer_data": "Gestion des données"
  },
  en: {
    "push_other_account": "This device receives reminders for another account. Disable them or enable this account on the device.",
    "push_disabled_cleanup": "Notifications disabled on this device. Server-side subscription removal still needs confirmation when connectivity returns.",

    "push_tab": "🔔 Notifications",
    "push_title": "Push notifications",
    "push_help": "Android: install the app from Chrome. iPhone: requires iOS 16.4 or later; add the site to your Home Screen, then open its icon.",
    "push_timing": "A reminder at the due time, or at 9 am for tasks without a time. Reminders can arrive while the app is closed, with an Internet connection.",
    "push_privacy": "The service receives only dates and technical identifiers. Notifications reveal neither task titles nor notes.",
    "push_enable": "Enable on this device",
    "push_disable": "Disable on this device",
    "push_test": "Send a test",
    "push_enabled": "Notifications enabled. Reminders continue after closing the app or signing out.",
    "push_disabled": "Notifications disabled on this device.",
    "push_https": "Notifications require HTTPS.",
    "push_ios_install": "On iPhone or iPad: use iOS 16.4 or later, add the site to the Home Screen and open that icon to enable notifications. A Chrome tab is not enough.",
    "push_unsupported": "Push notifications are unavailable in this environment. iPhone requires iOS 16.4 or later.",
    "push_config": "The free notification service still needs configuration. See the project guide docs/NOTIFICATIONS.md. Task management remains available.",
    "push_denied": "Permission denied. Allow notifications in the app or browser settings.",
    "push_error": "The operation could not be confirmed. Check the connection and try again.",
    "push_sync_error": "Reminders are not synchronized: open the app online and try again.",
    "push_test_sent": "Test notification accepted by the push service. Check your phone notifications.",
    "push_enable_first": "Enable notifications on this device first.",
    "push_expired": "The subscription expired. Enable notifications again on this device.",
    "push_rate": "Too many requests. Try again in a minute.",
    "push_signin": "Sign in to manage reminders.",
    "push_limit": "The free configuration supports up to 200 active due dates.",

    // Navigation & Header
    "app_title": "To‑Do List",
    "space_of": "Workspace of",
    "loading": "Loading...",
    "syncing": "Syncing...",
    "synced": "Synced",
    "offline": "Offline",
    "calendar": "📅 Calendar",
    "settings": "⛯ Settings",
    "logout": "Log out",
    "back_to_app": "← Back to App",
    "back_to_home": "← Home",
    "home": "Home",
    "my_space": "My space",
    "login_or_register": "Sign in or create account",

    // Stats
    "stat_tasks": "{count} task{s}",
    "stat_done": "{count} completed",

    // Search and Sort
    "search_placeholder": "Search...",
    "sort_status": "Status",
    "sort_az": "A → Z",
    "sort_za": "Z → A",
    "sort_recent": "Newest",
    "sort_old": "Oldest",
    "sort_priority": "Priority ↑",
    "sort_due": "Due date ↑",
    "sort_overdue_first": "Overdue first",
    "sort_notes_first": "Notes first",

    // Views
    "view_list": "☰ List",
    "view_kanban": "⬛ Kanban",
    "view_table": "⊞ Table",

    // Advanced filters
    "adv_filters": "⚙ Advanced filters",
    "reset_filters": "Reset",
    "filter_status": "Status",
    "filter_priority": "Priority",
    "filter_due": "Due date",
    "filter_before": "Before",
    "filter_after": "After",
    "filter_others": "Other",
    "filter_with_notes": "📝 With notes",
    "filter_no_due": "📅 No date",

    // Statuses
    "status_todo": "To do",
    "status_inprogress": "In progress",
    "status_waiting": "Waiting",
    "status_done": "Done",
    "status_cancelled": "Cancelled",

    // Priorities
    "prio_normal": "Normal",
    "prio_high": "High",
    "prio_low": "Low",

    // Table & Kanban
    "table_col_task": "Task",
    "table_col_status": "Status",
    "table_col_priority": "Priority",
    "table_col_due": "Due date",
    "table_col_notes": "Notes",
    "table_col_actions": "Actions",
    "kanban_empty": "Empty",
    "empty_tasks": "No tasks.",
    "empty_tasks_sub": "Create a task using the + button below",
    "search_no_results": "No results for \"{query}\"",

    // Modals
    "modal_new_task": "New task",
    "modal_edit_task": "Edit task",
    "modal_view_task": "Task details",
    "modal_summary": "Summary",
    "recap_no_due": "📅 No due date",
    "recap_no_notes": "No notes",
    "recap_created": "Created on {date} at {time}",
    "recap_prio_normal": "— Normal priority",
    "badge_status_title": "Change status",
    "task_recap_title": "Click to view summary",
    "edit_task_title": "Edit task",
    "modal_field_title": "Title",
    "modal_placeholder_title": "Task title...",
    "modal_field_status": "Status",
    "modal_field_priority": "Priority",
    "modal_field_due": "Due date",
    "modal_field_time": "Time",
    "modal_field_optional": "(optional)",
    "modal_field_notes": "Notes",
    "modal_placeholder_notes": "Add a note...",
    "btn_create": "Create",
    "btn_save": "Save",
    "btn_edit": "Edit",
    "btn_close": "Close",
    "btn_cancel": "Cancel",
    "btn_delete": "Delete",

    // Delete confirmation modal
    "confirm_delete_title": "Delete task?",
    "confirm_delete_desc": "This action cannot be undone.",

    // Login & Register
    "tab_login": "Sign in",
    "tab_register": "Register",
    "field_username": "Username",
    "field_password": "Password",
    "field_confirm_password": "Confirm password",
    "field_language": "Language",
    "placeholder_username": "your_username",
    "placeholder_password": "••••••••",
    "placeholder_password_min": "min. 6 characters",
    "btn_show": "show",
    "btn_hide": "hide",
    "btn_login": "Sign in",
    "btn_register": "Create account",
    "rules_username": "3 to 20 characters · letters, numbers, _ and - only",
    "rules_security": "🔒 <strong>Security & Privacy:</strong> End-to-end AES-256-GCM encryption. No email is collected. If you forget your password, tasks cannot be recovered.",
    "hint_account": "Each account has its own private tasks",
    "error_fill_fields": "Please fill in all fields.",
    "error_user_not_found": "Username not found.",
    "error_wrong_pass": "Incorrect password.",
    "error_invalid_user": "Invalid username (3–20 chars, letters/digits/_/-).",
    "error_pass_match": "Passwords do not match.",
    "error_pass_short": "Password too short (min. {min} characters).",
    "error_user_taken": "This username is already taken.",
    "success_account_created": "Account created! Redirecting...",

    // Settings
    "settings_title": "Settings",
    "settings_subtitle": "Account & Security",
    "tab_account": "👤 Account",
    "tab_display": "👁️ Display",
    "tab_archive": "📦 Archives",
    "tab_danger": "⚠️ Danger",
    "sec_username_title": "Username",
    "sec_username_sub": "Change your username",
    "label_new_username": "New username",
    "label_confirm_pass": "Confirm with your password",
    "btn_change_username": "Change username",
    "sec_pass_title": "Password",
    "sec_pass_sub": "Change your password — re-encrypts all your tasks",
    "label_old_pass": "Current password",
    "label_new_pass": "New password",
    "btn_change_pass": "Change password",
    "sec_display_title": "Display preferences",
    "sec_display_sub": "Customize application appearance and language",
    "label_calendar_view": "Default calendar view",
    "opt_view_grid": "Month (Grid)",
    "opt_view_planning": "Schedule (Timeline)",
    "label_app_language": "Application language",
    "btn_save_display": "Save preferences",
    "saved_preferences": "Preferences saved successfully.",
    "sec_archive_title": "Archives",
    "sec_archive_sub": "Manage completed and archived tasks",
    "btn_archive_done": "Archive all completed tasks",
    "no_archived_tasks": "No archived tasks.",
    "sec_danger_title": "Danger zone",
    "sec_danger_sub": "Irreversible actions",
    "danger_text": "Deleting your account will permanently erase all your tasks and data. This action is <strong>irreversible</strong>.",
    "btn_delete_account": "Delete my account",

    // Calendar
    "calendar_title": "Calendar",
    "calendar_overview": "Overview",
    "view_month": "Month",
    "view_planning": "Schedule",
    "prev_month": "Previous month",
    "next_month": "Next month",
    "no_planning_tasks": "No scheduled tasks.",
    "days_short": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],

    // Footer
    "footer_privacy": "Privacy Policy",
    "footer_legal": "Legal Notice",
    "footer_cgu": "Terms of Service",
    "footer_data": "Data Management"
  }
};

/**
 * Récupère la langue active :
 * 1. sessionStorage("lang")
 * 2. localStorage("lang")
 * 3. Langue du navigateur (si anglaise -> en, sinon fr)
 */
function getLanguage() {
  const s = sessionStorage.getItem("lang");
  if (s === "en" || s === "fr") return s;
  const l = localStorage.getItem("lang");
  if (l === "en" || l === "fr") return l;
  const nav = (navigator.language || navigator.userLanguage || "").toLowerCase();
  return nav.startsWith("en") ? "en" : "fr";
}

/**
 * Change la langue active et notifie l'application
 */
function setLanguage(lang) {
  if (lang !== "en" && lang !== "fr") lang = "fr";
  sessionStorage.setItem("lang", lang);
  localStorage.setItem("lang", lang);
  document.documentElement.lang = lang;
  applyTranslations();
  window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
}

/**
 * Traduit une clé
 */
function t(key, params = {}) {
  const lang = getLanguage();
  const dict = I18N_DICTIONARY[lang] || I18N_DICTIONARY.fr;
  let text = dict[key] !== undefined ? dict[key] : (I18N_DICTIONARY.fr[key] || key);

  if (typeof text === "string" && params) {
    Object.keys(params).forEach(k => {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), params[k]);
    });
  }
  return text;
}

/**
 * Applique les traductions aux éléments DOM avec attributs data-i18n
 */
function applyTranslations(root = document) {
  const lang = getLanguage();
  document.documentElement.lang = lang;

  root.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const val = t(key);
    if (val !== undefined) {
      if (val.includes("<") && val.includes(">")) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    }
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    const val = t(key);
    if (val) el.placeholder = val;
  });

  root.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    const val = t(key);
    if (val) el.title = val;
  });

  root.querySelectorAll("[data-i18n-aria]").forEach(el => {
    const key = el.getAttribute("data-i18n-aria");
    const val = t(key);
    if (val) el.setAttribute("aria-label", val);
  });
}

/**
 * Sauvegarde la langue dans Firebase Realtime Database
 */
async function syncUserLanguageToFirebase(username, lang) {
  try {
    if (!username || !lang) return;
    let fbUrl = null;
    const res = await fetch("../assets/json/firebase.json");
    const config = await res.json();
    if (config && config.url) fbUrl = config.url.replace(/\/$/, "");
    if (!fbUrl) return;

    await fetch(`${fbUrl}/users/${encodeURIComponent(username)}/lang.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lang)
    });
  } catch (err) {
    console.warn("Impossible de synchroniser la langue avec Firebase:", err);
  }
}

/**
 * Initialisation automatique au chargement
 */
document.addEventListener("DOMContentLoaded", () => {
  applyTranslations();
});
