// ══════════════════════════════════════════════════════
//  I18N.JS — Internationalisation (Français / Anglais)
// ══════════════════════════════════════════════════════

const I18N_DICTIONARY = {
  fr: {
    "creation_steps": "Étapes de création",
    "creation_title": "Titre",
    "creation_date": "Échéance",
    "creation_details": "Détails",
    "creation_step": "Étape {current} sur {total} · {name}",
    "creation_hint_title": "Un titre suffit. Les autres informations sont facultatives.",
    "creation_hint_date": "Ajoutez une échéance si vous en avez besoin. L’heure est facultative.",
    "creation_hint_details": "Complétez ce qui vous est utile. Vous pourrez aussi le faire plus tard.",
    "creation_next": "Continuer",
    "creation_back": "Précédent",
    "creation_skip_date": "Sans échéance",
    "creation_create_now": "Créer maintenant",
    "creation_date_required": "Choisissez une date pour cette heure, ou effacez l’heure.",
    "creation_date_invalid": "Vérifiez la date et l’heure saisies.",
    "creation_save_failed": "La tâche n’a pas été enregistrée. Votre saisie est conservée ; réessayez.",

    "filter_short": "Filtres",
    "skip_content": "Aller aux tâches",
    "workspace_navigation": "Navigation de l’espace",
    "workspace_label": "Mon espace",
    "workspace_note": "Une tâche à la fois.",
    "workspace_tasks": "Vos tâches",
    "workspace_controls": "Affichage et filtres",
    "scope_today_short": "Ce jour",
    "scope_upcoming_short": "À venir",
    "scope_all_short": "Toutes",
    "scope_trash_short": "Corbeille",
    "auth_intro_title": "Vos idées ont leur place ici.",
    "auth_intro_text": "Notez ce qui vous vient. Retrouvez ensuite vos priorités dans un espace à vous.",
    "auth_intro_note": "Sur le Web comme sur Windows.",

    "scope_trash": "Corbeille",
    "scope_trash_description": "Restaurables pendant 30 jours. Au-delà, suppression définitive au prochain accès ou à la prochaine synchronisation.",
    "trash_empty": "La corbeille est vide.",
    "trash_move": "Mettre à la corbeille",
    "trash_restore": "Restaurer",
    "trash_permanent": "Supprimer définitivement",
    "trash_permanent_title": "Supprimer définitivement cette tâche ?",
    "trash_permanent_description": "Le titre, les notes et les dates seront effacés. Cette action ne peut pas être annulée.",
    "trash_dates": "Supprimée le {deleted} · Fin de conservation : {expires}",
    "trash_notice": "Annulation de suppression",
    "trash_undo": "Annuler",
    "trash_moved": "Tâche placée dans la corbeille pour 30 jours.",
    "trash_restored": "« {title} » a été restaurée avec ses informations d’origine.",
    "trash_purged": "« {title} » a été supprimée définitivement.",
    "trash_unavailable": "Cette tâche a expiré ou a été supprimée définitivement. Elle ne peut plus être restaurée.",

    "board_scroll_hint": "Faites glisser pour voir les autres colonnes.",
    "quick_label": "Ajouter une tâche",
    "quick_placeholder": "Que devez-vous faire ?",
    "quick_add": "Ajouter",
    "quick_hint": "Entrée : ajouter sans échéance.",
    "quick_full": "Formulaire complet",
    "quick_details": "Compléter les détails",
    "quick_required": "Saisissez un titre pour créer la tâche.",
    "quick_created": "Tâche « {title} » créée sans échéance. Retrouvez-la dans Toutes les tâches ou complétez ses détails.",
    "quick_failed": "La tâche n’a pas été enregistrée. Votre titre est conservé ; réessayez.",
    "quick_discard": "Abandonner le titre non enregistré dans la saisie rapide ?",
    "shortcuts_help": "Raccourcis clavier",
    "shortcuts_quick": "Rejoindre la saisie rapide",
    "shortcuts_full": "Ouvrir le formulaire complet",
    "shortcuts_show_help": "Afficher cette aide",
    "shortcuts_shift": "Maj",
    "shortcuts_context": "Les raccourcis sont ignorés dans les champs de saisie et les dialogues. Échap ferme un dialogue ; Tab permet de parcourir les commandes.",
    "shortcuts_enable": "Activer les raccourcis",
    "shortcuts_local": "Ce choix est mémorisé pour ce compte sur cet appareil.",
    "shortcuts_not_saved": "Le choix est appliqué pour cette page, mais sa mémorisation sur cet appareil a échoué.",

    "scope_navigation": "Période des tâches",
    "scope_today": "Aujourd’hui",
    "scope_upcoming": "À venir",
    "scope_all": "Toutes les tâches",
    "scope_overdue": "En retard",
    "scope_today_description": "Les tâches actives en retard, puis celles du jour.",
    "scope_upcoming_description": "Les tâches actives à partir de demain, par échéance.",
    "scope_all_description": "Toutes vos tâches non archivées, y compris celles sans échéance, terminées ou annulées.",
    "scope_result_one": "1 tâche affichée",
    "global_progress": "Progression globale",
    "scope_results": "{count} tâches affichées",
    "scope_today_empty": "Aucune tâche active en retard ou prévue aujourd’hui. Retrouvez les autres dans Toutes les tâches.",
    "scope_upcoming_empty": "Aucune tâche active prévue après aujourd’hui. Les tâches sans date sont dans Toutes les tâches.",
    "schedule_tomorrow": "Reporter à demain",
    "schedule_choose": "Choisir une date",
    "schedule_keep_time": "L’heure {time} sera conservée.",
    "schedule_no_time": "Aucune heure définie : seule la date sera modifiée.",
    "schedule_saved": "Échéance modifiée pour « {title} » : {date}.",
    "schedule_unavailable": "Cette tâche n’est plus active ou votre session a expiré. Fermez ce dialogue pour continuer.",

    // Navigation & Header
    "app_title": "To‑Do List",
    "space_of": "Espace de",
    "loading": "Chargement...",
    "syncing": "Synchronisation...",
    "synced": "Synchronisé",
    "offline": "Hors-ligne",
    "calendar": "Calendrier",
    "settings": "Paramètres",
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
    "view_list": "Liste",
    "view_kanban": "Kanban",
    "view_table": "Tableau",

    // Filtres avancés
    "adv_filters": "Filtres avancés",
    "reset_filters": "Réinitialiser",
    "filter_status": "Statut",
    "filter_priority": "Priorité",
    "filter_due": "Date d'échéance",
    "filter_before": "Avant le",
    "filter_after": "Après le",
    "filter_others": "Autres",
    "filter_with_notes": "Avec notes",
    "filter_no_due": "Sans date",

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
    "clear_search": "Effacer la recherche",
    "sort_label": "Trier les tâches",
    "empty_tasks": "Aucune tâche.",
    "empty_tasks_sub": "Créez une tâche avec le bouton + ci-dessous",
    "search_no_results": "Aucun résultat pour « {query} »",

    // Modales
    "modal_new_task": "Nouvelle tâche",
    "modal_edit_task": "Modifier la tâche",
    "modal_view_task": "Détail de la tâche",
    "modal_summary": "Récapitulatif",
    "recap_no_due": "Aucune date d'échéance",
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
    "confirm_delete_title": "Mettre cette tâche à la corbeille ?",
    "confirm_delete_desc": "Vous pourrez la restaurer pendant 30 jours.",

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
    "rules_security": "Sécurité & Confidentialité : Chiffrement AES-256-GCM de bout en bout. Aucun e-mail n'est collecté. En cas d'oubli de mot de passe, vos tâches ne pourront pas être récupérées.",
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
    "tab_account": "Compte",
    "tab_display": "Affichage",
    "tab_archive": "Archives",
    "tab_danger": "Danger",
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
    "danger_text": "La suppression de votre compte effacera définitivement toutes vos tâches et données. Cette action est irréversible.",
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
    "creation_steps": "Creation steps",
    "creation_title": "Title",
    "creation_date": "Due date",
    "creation_details": "Details",
    "creation_step": "Step {current} of {total} · {name}",
    "creation_hint_title": "A title is enough. Everything else is optional.",
    "creation_hint_date": "Add a due date if needed. The time is optional.",
    "creation_hint_details": "Fill in what you need. You can also do this later.",
    "creation_next": "Continue",
    "creation_back": "Previous",
    "creation_skip_date": "No due date",
    "creation_create_now": "Create now",
    "creation_date_required": "Choose a date for this time, or clear the time.",
    "creation_date_invalid": "Check the date and time.",
    "creation_save_failed": "The task was not saved. Your entries are kept; try again.",

    "filter_short": "Filters",
    "skip_content": "Skip to tasks",
    "workspace_navigation": "Workspace navigation",
    "workspace_label": "My workspace",
    "workspace_note": "One task at a time.",
    "workspace_tasks": "Your tasks",
    "workspace_controls": "Views and filters",
    "scope_today_short": "Today",
    "scope_upcoming_short": "Next",
    "scope_all_short": "All",
    "scope_trash_short": "Trash",
    "auth_intro_title": "A place for your ideas.",
    "auth_intro_text": "Write down what comes to mind. Find your priorities in your own workspace.",
    "auth_intro_note": "On the Web and Windows.",

    "scope_trash": "Trash",
    "scope_trash_description": "Restorable for 30 days. After that, permanently removed on the next access or sync.",
    "trash_empty": "The trash is empty.",
    "trash_move": "Move to trash",
    "trash_restore": "Restore",
    "trash_permanent": "Delete permanently",
    "trash_permanent_title": "Permanently delete this task?",
    "trash_permanent_description": "The title, notes and dates will be erased. This cannot be undone.",
    "trash_dates": "Deleted {deleted} · Retention ends: {expires}",
    "trash_notice": "Undo deletion",
    "trash_undo": "Undo",
    "trash_moved": "Task moved to the trash for 30 days.",
    "trash_restored": "“{title}” was restored with its original information.",
    "trash_purged": "“{title}” was permanently deleted.",
    "trash_unavailable": "This task expired or was permanently deleted. It can no longer be restored.",

    "board_scroll_hint": "Swipe to see the other columns.",
    "quick_label": "Add a task",
    "quick_placeholder": "What do you need to do?",
    "quick_add": "Add",
    "quick_hint": "Enter: add without a due date.",
    "quick_full": "Full form",
    "quick_details": "Add details",
    "quick_required": "Enter a title to create the task.",
    "quick_created": "Task “{title}” created without a due date. Find it in All tasks or add its details.",
    "quick_failed": "The task could not be saved. Your title is kept; please try again.",
    "quick_discard": "Discard the unsaved quick-entry title?",
    "shortcuts_help": "Keyboard shortcuts",
    "shortcuts_quick": "Focus quick entry",
    "shortcuts_full": "Open the full form",
    "shortcuts_show_help": "Show this help",
    "shortcuts_shift": "Shift",
    "shortcuts_context": "Shortcuts are ignored in text fields and dialogs. Escape closes a dialog; Tab moves between controls.",
    "shortcuts_enable": "Enable shortcuts",
    "shortcuts_local": "This preference is saved for this account on this device.",
    "shortcuts_not_saved": "The preference applies to this page, but could not be saved on this device.",

    "scope_navigation": "Task period",
    "scope_today": "Today",
    "scope_upcoming": "Upcoming",
    "scope_all": "All tasks",
    "scope_overdue": "Overdue",
    "scope_today_description": "Active overdue tasks first, then today’s tasks.",
    "scope_upcoming_description": "Active tasks from tomorrow onwards, ordered by due date.",
    "scope_all_description": "All unarchived tasks, including undated, completed and cancelled tasks.",
    "scope_result_one": "1 task shown",
    "global_progress": "Overall progress",
    "scope_results": "{count} tasks shown",
    "scope_today_empty": "No active overdue tasks or tasks due today. Find other tasks in All tasks.",
    "scope_upcoming_empty": "No active tasks due after today. Undated tasks are in All tasks.",
    "schedule_tomorrow": "Move to tomorrow",
    "schedule_choose": "Choose a date",
    "schedule_keep_time": "The time {time} will be kept.",
    "schedule_no_time": "No time set: only the date will change.",
    "schedule_saved": "Due date updated for “{title}”: {date}.",
    "schedule_unavailable": "This task is no longer active or your session has expired. Close this dialog to continue.",

    // Navigation & Header
    "app_title": "To‑Do List",
    "space_of": "Workspace of",
    "loading": "Loading...",
    "syncing": "Syncing...",
    "synced": "Synced",
    "offline": "Offline",
    "calendar": "Calendar",
    "settings": "Settings",
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
    "view_list": "List",
    "view_kanban": "Kanban",
    "view_table": "Table",

    // Advanced filters
    "adv_filters": "Advanced filters",
    "reset_filters": "Reset",
    "filter_status": "Status",
    "filter_priority": "Priority",
    "filter_due": "Due date",
    "filter_before": "Before",
    "filter_after": "After",
    "filter_others": "Other",
    "filter_with_notes": "With notes",
    "filter_no_due": "No date",

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
    "clear_search": "Clear search",
    "sort_label": "Sort tasks",
    "empty_tasks": "No tasks.",
    "empty_tasks_sub": "Create a task using the + button below",
    "search_no_results": "No results for \"{query}\"",

    // Modals
    "modal_new_task": "New task",
    "modal_edit_task": "Edit task",
    "modal_view_task": "Task details",
    "modal_summary": "Summary",
    "recap_no_due": "No due date",
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
    "confirm_delete_title": "Move this task to the trash?",
    "confirm_delete_desc": "You can restore it for 30 days.",

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
    "rules_security": "Security & Privacy: End-to-end AES-256-GCM encryption. No email is collected. If you forget your password, tasks cannot be recovered.",
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
    "tab_account": "Account",
    "tab_display": "Display",
    "tab_archive": "Archives",
    "tab_danger": "Danger",
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
    "danger_text": "Deleting your account will permanently erase all your tasks and data. This action is irreversible.",
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
      el.textContent = val;
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
    const res = await TodoRuntime.fetch("../assets/json/firebase.json");
    const config = await res.json();
    if (config && config.url) fbUrl = config.url.replace(/\/$/, "");
    if (!fbUrl) return;

    await TodoRuntime.fetch(`${fbUrl}/users/${encodeURIComponent(username)}/lang.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lang)
    });
  } catch (err) {
    throw err;
  }
}

/**
 * Initialisation automatique au chargement
 */
document.addEventListener("DOMContentLoaded", () => {
  applyTranslations();
});
