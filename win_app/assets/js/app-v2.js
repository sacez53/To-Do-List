// ══════════════════════════════════════════
//  APP-V2.JS — Nouvelle vue tâches
//  Dépend de crypto.js (chargé avant)
// ══════════════════════════════════════════

const currentUser = sessionStorage.getItem("username") || "compte";

// ── DOM ──
const viewBtns     = document.querySelectorAll(".v2-view-btn");
const sortSelect   = document.getElementById("v2-sort");
const searchInput  = document.getElementById("v2-search");
const searchClear  = document.getElementById("v2-search-clear");
const boardEl      = document.getElementById("v2-board");
const syncDot      = document.getElementById("v2-sync-dot");
const syncLabel    = document.getElementById("v2-sync-label");
const userLabel    = document.getElementById("v2-user-label");
const fabAdd       = document.getElementById("v2-fab");
const filterPanel  = document.getElementById("v2-filter-panel");
const filterToggle = document.getElementById("v2-filter-toggle");
const filterReset  = document.getElementById("v2-filter-reset");
const statTotal    = document.getElementById("v2-stat-total");
const statDone     = document.getElementById("v2-stat-done");
const statProgress = document.getElementById("v2-stat-progress");
const progressBar  = document.getElementById("v2-progress-bar");
const quickForm = document.getElementById("quick-add-form");
const quickTitle = document.getElementById("quick-add-title");
const quickSubmit = document.getElementById("quick-add-submit");
const quickFull = document.getElementById("quick-add-full");
const quickError = document.getElementById("quick-add-error");
const quickStatus = document.getElementById("quick-add-status");
const quickDetails = document.getElementById("quick-add-details");
const shortcutsOverlay = document.getElementById("shortcuts-overlay");
const shortcutsEnabled = document.getElementById("shortcuts-enabled");

// Modales
const modalOverlay  = document.getElementById("modal-overlay");
const modalClose    = document.getElementById("modal-close");
const modalHeading  = document.getElementById("modal-heading");
const modalText     = document.getElementById("modal-text");
const modalStatus   = document.getElementById("modal-status");
const modalPriority = document.getElementById("modal-priority");
const modalDue      = document.getElementById("modal-due");
const modalDueTime  = document.getElementById("modal-due-time");
const modalNotes    = document.getElementById("modal-notes");
const modalSave     = document.getElementById("modal-save");
const modalDelete   = document.getElementById("modal-delete");
const confirmOverlay= document.getElementById("confirm-overlay");
const confirmYes    = document.getElementById("confirm-yes");
const confirmNo     = document.getElementById("confirm-no");
const modalBody          = document.getElementById("modal-body");
const modalEditBtn       = document.getElementById("modal-edit-btn");
const modalCloseRecapBtn = document.getElementById("modal-close-recap-btn");
const modalCancelEditBtn = document.getElementById("modal-cancel-edit-btn");
const modalRecap         = document.getElementById("modal-recap");
const recapTitle         = document.getElementById("recap-title");
const recapStatus        = document.getElementById("recap-status");
const recapPriority      = document.getElementById("recap-priority");
const recapDue           = document.getElementById("recap-due");
const recapNotes         = document.getElementById("recap-notes");
const recapMeta          = document.getElementById("recap-meta");

// ── État ──
let todos        = [];
let firebaseUrl  = null;
let encKey       = null;
let syncTimeout  = null;
let editingId    = null;
let currentView  = "list";   // list | kanban | table
let searchQuery  = "";
let currentSort  = "due-asc";
let currentScope = "today";
let scopeNow = new Date();
let clockTimer = null;
let reschedulingId = null;
let rescheduleBusy = false;
let lastSyncStatus = "syncing";
let lastSyncDetail = "";
let quickBusy = false;
let quickComposing = false;
let quickEnterHeld = false;
let quickCreatedId = null;
let quickModalDraft = null;
let trashBusy = false;
let lastTrashed = null;
const shortcutsKey = `todo_shortcuts_${currentUser}`;
try { shortcutsEnabled.checked = localStorage.getItem(shortcutsKey) !== "false"; } catch (_) { /* Usable without preference storage. */ }

// Filtres avancés
let filterStatuses   = [];  // [] = tous
let filterPriorities = [];  // [] = toutes
let filterDueBefore  = "";
let filterDueAfter   = "";
let filterHasNotes   = false;
let filterNoDue      = false;

// ── Constantes ──
// ── Constantes & Traductions dynamiques ──
const STATUS_ORDER = ["inprogress","todo","waiting","done","cancelled"];
const PRIORITY_ORDER = { high:0, normal:1, low:2 };

function getStatusInfo(s) {
  const icons = { todo:"📋", inprogress:"⚡", waiting:"⏳", done:"✅", cancelled:"❌" };
  const labels = {
    todo: t("status_todo"),
    inprogress: t("status_inprogress"),
    waiting: t("status_waiting"),
    done: t("status_done"),
    cancelled: t("status_cancelled")
  };
  return { label: labels[s] || s, icon: icons[s] || "○" };
}

function getPriorityLabel(p) {
  const map = {
    high: "🔴 " + t("prio_high"),
    normal: "— " + t("prio_normal"),
    low: "🔵 " + t("prio_low")
  };
  return map[p] || p;
}

function getKanbanCols() {
  return [
    { id:"todo",       label: t("status_todo"),       icon:"📋" },
    { id:"inprogress", label: t("status_inprogress"), icon:"⚡" },
    { id:"waiting",    label: t("status_waiting"),    icon:"⏳" },
    { id:"done",       label: t("status_done"),       icon:"✅" },
    { id:"cancelled",  label: t("status_cancelled"),  icon:"❌" }
  ];
}

const STATUS_INFO = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === "string") return getStatusInfo(prop);
    return target[prop];
  }
});

const PRIORITY_LABEL = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === "string") return getPriorityLabel(prop);
    return target[prop];
  }
});

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
let taskStore = null;
let savingLocal = Promise.resolve();
let syncRunning = false;
let localRevision = 0;
let localWrites = 0;
let modalSnapshot = null;
let confirmCleanup = null;
function modalValues() { return JSON.stringify([modalText.value, modalStatus.value, modalPriority.value, modalDue.value, modalDueTime?.value, modalNotes.value]); }
async function init() {
  fabAdd.disabled = true;
  if (userLabel) userLabel.textContent = currentUser;
  try {
    taskStore = await TodoData.open(currentUser);
    todos = taskStore.read();
    fabAdd.disabled = false;
    quickTitle.disabled = false; quickSubmit.disabled = false; quickFull.disabled = false;
    refreshTaskClock();
    await refreshTasks();
    const params = new URLSearchParams(window.location.search);
    if (params.get("viewTask")) openModal(params.get("viewTask"), "view");
    else if (params.get("editTask")) openModal(params.get("editTask"), "edit");
  } catch (error) { setSyncStatus("error", error.message); }
}
async function refreshTasks() {
  if (!taskStore || syncRunning || !sessionStorage.getItem("auth")) return;
  syncRunning = true;
  const revision = localRevision;
  setSyncStatus("syncing");
  try {
    await savingLocal;
    const result = await taskStore.sync();
    if (revision === localRevision) { todos = result; render(); }
    setSyncStatus(taskStore.pending() ? "offline" : "synced");
  } catch (error) { setSyncStatus("error", error.message); }
  finally { syncRunning = false; }
}
function saveTodos() {
  if (!taskStore || !sessionStorage.getItem("auth")) return Promise.resolve(false);
  localRevision++;
  localWrites++;
  const snapshot = JSON.parse(JSON.stringify(todos));
  setSyncStatus("syncing");
  savingLocal = savingLocal.catch(() => {}).then(() => taskStore.save(snapshot));
  return savingLocal.then(() => { refreshTasks(); return true; }).catch(error => {
    setSyncStatus("error", error.message);
    alert(TodoRuntime.message("Enregistrement local impossible. Gardez cette page ouverte : ", "Local save failed. Keep this page open: ") + error.message);
    return false;
  }).finally(() => { localWrites--; });
}
window.addEventListener("online", refreshTasks);
window.addEventListener("focus", refreshTasks);

window.addEventListener("beforeunload", event => {
  if (trashBusy || quickBusy || quickTitle.value.trim() || rescheduleBusy || localWrites || taskStore?.pending() || (modalSnapshot && modalValues() !== modalSnapshot)) { event.preventDefault(); event.returnValue = ""; }
});
// Refresh existing sync status while the page is visible; no new product view.
setInterval(() => { if (!document.hidden && !modalOverlay.classList.contains("open")) refreshTasks(); }, 30000);

function setSyncStatus(s, detail = "") {
  lastSyncStatus = s; lastSyncDetail = detail;
  if (!syncDot || !syncLabel) return;
  syncDot.className = `v2-sync-dot v2-sync-${s}`;
  const labels = {
    syncing: t("syncing"),
    synced:  t("synced"),
    error:   TodoRuntime.message("Erreur de synchronisation", "Sync failed"),
    offline: t("offline")
  };
  syncLabel.textContent = detail || labels[s] || "";
}

// ══════════════════════════════════════════
//  FILTRES & TRI
// ══════════════════════════════════════════
function applyFilters(arr) {
  return arr.filter(t => {
    if (t.archived || t.deletedAt || t.purgedAt) return false;
    if (filterStatuses.length   && !filterStatuses.includes(t.status)) return false;
    if (filterPriorities.length && !filterPriorities.includes(t.priority || "normal")) return false;
    if (filterHasNotes  && !(t.notes && t.notes.trim())) return false;
    if (filterNoDue     && t.due) return false;
    if (filterDueBefore && (!t.due || t.due > filterDueBefore)) return false;
    if (filterDueAfter && (!t.due || t.due < filterDueAfter))  return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.text.toLowerCase().includes(q) && !(t.notes||"").toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function applySort(arr) {
  const copy = [...arr];
  switch(currentSort) {
    case "az":           return copy.sort((a,b) => a.text.localeCompare(b.text, getLanguage()));
    case "za":           return copy.sort((a,b) => b.text.localeCompare(a.text, getLanguage()));
    case "created-desc": return copy.sort((a,b) => (a.created||0) < (b.created||0) ? 1 : -1);
    case "created-asc":  return copy.sort((a,b) => (a.created||0) > (b.created||0) ? 1 : -1);
    case "priority":     return copy.sort((a,b) => (PRIORITY_ORDER[a.priority||"normal"] ?? 1) - (PRIORITY_ORDER[b.priority||"normal"] ?? 1));
    case "due-asc":      return copy.sort((a,b) => {
      return TaskDates.compare(a, b);
    });
    case "overdue-first": return copy.sort((a,b) => {
      const aOver = isOverdue(a.due, a.dueTime, a.status) ? -1 : 1;
      const bOver = isOverdue(b.due, b.dueTime, b.status) ? -1 : 1;
      return aOver - bOver;
    });
    case "notes-first":  return copy.sort((a,b) => {
      const an = a.notes && a.notes.trim() ? 0 : 1;
      const bn = b.notes && b.notes.trim() ? 0 : 1;
      return an - bn;
    });
    default: // status
      return copy.sort((a,b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
  }
}

// ══════════════════════════════════════════
//  HELPERS DATE
// ══════════════════════════════════════════
function isOverdue(due, time, status) {
  return TaskDates.overdue(due, time, status, scopeNow);
}
function getDueInfo(due, dueTime, status) {
  if (!due) return null;
  const d = new Date(due + "T00:00:00");
  const timeSuffix = dueTime ? ` ⏱ ${dueTime}` : "";
  const isEn = getLanguage() === "en";
  const locale = isEn ? "en-US" : "fr-FR";
  const dateStr = d.toLocaleDateString(locale, {day:"numeric",month:"short"});
  
  if (status === "done" || status === "cancelled") {
    return { label: (isEn ? `Scheduled ${dateStr}` : `Prévu le ${dateStr}`) + timeSuffix, cls: "due-ok" };
  }

  const today = new Date(scopeNow); today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  
  if (isOverdue(due, dueTime, status)) return { label: (isEn ? "Overdue" : "En retard") + timeSuffix,    cls:"due-overdue" };
  if (diff === 0) return { label: (isEn ? "Today" : "Aujourd'hui") + timeSuffix, cls:"due-today" };
  if (diff === 1) return { label: (isEn ? "Tomorrow" : "Demain") + timeSuffix,       cls:"due-soon" };
  if (diff <= 3)  return { label: (isEn ? `In ${diff}d` : `Dans ${diff}j`) + timeSuffix, cls:"due-soon" };
  return { label: dateStr + timeSuffix, cls:"due-ok" };
}

function addScheduleActions(container, task) {
  if (!TaskDates.active(task)) return;
  const actions = document.createElement("div");
  actions.className = "v2-schedule-actions";
  for (const [action, label] of [["tomorrow", "schedule_tomorrow"], ["choose", "schedule_choose"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "v2-schedule-btn";
    button.dataset.taskId = String(task.id);
    button.dataset.taskAction = action;
    button.textContent = t(label);
    button.setAttribute("aria-label", `${t(label)} : ${task.text}`);
    button.addEventListener("click", async event => {
      event.stopPropagation();
      if (action === "choose") { openScheduleDialog(task.id); return; }
      button.disabled = true;
      try { await changeTaskDate(task.id, TaskDates.tomorrow()); }
      finally { button.disabled = false; }
    });
    actions.appendChild(button);
  }
  container.appendChild(actions);
}

async function changeTaskDate(id, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || TaskDates.day(new Date(date + "T12:00:00")) !== date) return false;
  const task = todos.find(task => String(task.id) === String(id));
  if (!task || !TaskDates.active(task) || !sessionStorage.getItem("auth")) return false;
  const oldDate = task.due;
  task.due = date;
  const saved = await saveTodos();
  if (!saved && task.due === date) task.due = oldDate;
  render();
  if (saved) {
    const formatted = new Date(date + "T12:00:00").toLocaleDateString(getLanguage() === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });
    document.getElementById("v2-schedule-feedback").textContent = t("schedule_saved", { title: task.text, date: formatted });
  }
  return saved;
}

function openScheduleDialog(id) {
  const task = todos.find(task => String(task.id) === String(id));
  if (!taskStore || !task || !TaskDates.active(task) || !sessionStorage.getItem("auth")) return;
  reschedulingId = task.id;
  const date = document.getElementById("schedule-date");
  date.value = task.due || TaskDates.day();
  date.setCustomValidity("");
  document.getElementById("schedule-error").textContent = "";
  document.getElementById("schedule-task-title").textContent = task.text;
  document.getElementById("schedule-time-hint").textContent = task.dueTime ? t("schedule_keep_time", { time: task.dueTime }) : t("schedule_no_time");
  document.getElementById("schedule-overlay").classList.add("open");
  setTimeout(() => date.focus(), 0);
}

function closeScheduleDialog() {
  if (rescheduleBusy) return;
  reschedulingId = null;
  document.getElementById("schedule-overlay").classList.remove("open");
}
document.getElementById("schedule-cancel").addEventListener("click", closeScheduleDialog);
document.getElementById("schedule-overlay").addEventListener("click", event => {
  if (event.target === event.currentTarget) closeScheduleDialog();
});
document.getElementById("schedule-date").addEventListener("input", event => event.target.setCustomValidity(""));
document.getElementById("schedule-form").addEventListener("submit", async event => {
  event.preventDefault();
  const date = document.getElementById("schedule-date");
  if (rescheduleBusy || reschedulingId === null || !date.reportValidity()) return;
  const task = todos.find(task => String(task.id) === String(reschedulingId));
  if (!task || !TaskDates.active(task) || !sessionStorage.getItem("auth")) {
    document.getElementById("schedule-error").textContent = t("schedule_unavailable");
    return;
  }
  rescheduleBusy = true;
  document.getElementById("schedule-save").disabled = true;
  document.getElementById("schedule-cancel").disabled = true;
  try {
    const saved = await changeTaskDate(reschedulingId, date.value);
    rescheduleBusy = false;
    if (saved) closeScheduleDialog();
  } finally {
    rescheduleBusy = false;
    document.getElementById("schedule-save").disabled = false;
    document.getElementById("schedule-cancel").disabled = false;
  }
});

// ══════════════════════════════════════════
//  RENDU PRINCIPAL
// ══════════════════════════════════════════
function trashDate(value) {
  return new Date(value).toLocaleString(getLanguage() === "en" ? "en-US" : "fr-FR", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}
function renderTrash(items) {
  if (!items.length) {
    const empty = document.createElement("p"); empty.className = "v2-empty"; empty.textContent = t("trash_empty");
    boardEl.appendChild(empty); return;
  }
  const list = document.createElement("ul"); list.className = "v2-trash-list";
  [...items].sort((a,b) => b.deletedAt.localeCompare(a.deletedAt)).forEach(task => {
    const item = document.createElement("li"); item.className = "v2-trash-card"; item.dataset.taskId = String(task.id);
    const title = document.createElement("button"); title.type = "button"; title.className = "task-summary";
    title.dataset.taskId = String(task.id); title.dataset.taskAction = "summary"; title.textContent = task.text;
    title.addEventListener("click", () => openModal(task.id, "view"));
    const meta = document.createElement("p"); meta.className = "v2-trash-meta";
    meta.textContent = t("trash_dates", { deleted: trashDate(task.deletedAt), expires: trashDate(Date.parse(task.deletedAt) + TodoData.RETENTION_MS) });
    const actions = document.createElement("div"); actions.className = "v2-trash-actions";
    for (const [action, label] of [["restore", "trash_restore"], ["purge", "trash_permanent"]]) {
      const button = document.createElement("button"); button.type = "button";
      button.className = "v2-capture-link"; button.dataset.taskId = String(task.id); button.dataset.taskAction = action;
      button.textContent = t(label); button.setAttribute("aria-label", `${t(label)} : ${task.text}`); button.disabled = trashBusy;
      button.addEventListener("click", () => {
        if (action === "restore") mutateTrash(task.id, "restore", task.deletionId);
        else openConfirm(() => mutateTrash(task.id, "purge"), { title: t("trash_permanent_title"), description: t("trash_permanent_description"), label: t("trash_permanent") });
      });
      actions.appendChild(button);
    }
    item.append(title, meta, actions); list.appendChild(item);
  });
  boardEl.appendChild(list);
}
async function mutateTrash(id, action, deletionId = null) {
  if (trashBusy || !taskStore || !sessionStorage.getItem("auth")) return false;
  const before = todos.find(task => String(task.id) === String(id));
  if (!before) return false;
  trashBusy = true;
  document.getElementById("trash-undo").disabled = true;
  try {
    if (action === "purge" && !TodoData.inTrash(before)) throw new Error(t("trash_unavailable"));
    const changed = action === "trash" ? TodoData.trash(before) : action === "restore" ? TodoData.restore(before, new Date(), deletionId) : TodoData.purge(before);
    todos = todos.map(task => String(task.id) === String(id) ? changed : task);
    const revision = localRevision;
    if (!await saveTodos()) {
      todos = todos.map(task => String(task.id) === String(id) ? before : task);
      render(); return false;
    }
    if (localRevision === revision + 1) todos = taskStore.read();
    const stored = todos.find(task => String(task.id) === String(id));
    if (action === "restore" && (!stored || TodoData.removed(stored))) {
      document.getElementById("trash-feedback").textContent = t("trash_unavailable"); render(); return false;
    }
    if (action === "trash" && stored?.deletedAt && !stored.purgedAt) {
      document.getElementById("trash-feedback").textContent = "";
      lastTrashed = { id: stored.id, deletionId: stored.deletionId };
      document.getElementById("trash-notice-text").textContent = t("trash_moved", { title: before.text });
      document.getElementById("trash-notice").hidden = false;
    } else {
      if (lastTrashed && String(lastTrashed.id) === String(id)) document.getElementById("trash-notice").hidden = true;
      document.getElementById("trash-feedback").textContent = t(action === "restore" ? "trash_restored" : "trash_purged", { title: before.text });
    }
    render(); return true;
  } catch (error) {
    document.getElementById("trash-feedback").textContent = error.message;
    document.getElementById("trash-notice-text").textContent = error.message;
    return false;
  } finally {
    trashBusy = false;
    document.querySelectorAll(".v2-trash-actions button,#trash-undo").forEach(button => button.disabled = false);
  }
}
function moveTaskToTrash(id) { return mutateTrash(id, "trash"); }
document.getElementById("trash-undo").addEventListener("click", () => {
  if (lastTrashed) mutateTrash(lastTrashed.id, "restore", lastTrashed.deletionId);
});
document.getElementById("trash-notice-close").addEventListener("click", () => { document.getElementById("trash-notice").hidden = true; });

function setTaskScope(scope) {
  if (!["today", "upcoming", "all", "trash"].includes(scope)) return;
  currentScope = scope;
  currentSort = scope === "all" ? "status" : "due-asc";
  sortSelect.value = currentSort;
  render();
}
function render() {
  scopeNow = new Date();
  const focused = document.activeElement;
  const focusId = focused?.dataset.taskId;
  const focusAction = focused?.dataset.taskAction;
  const showingTrash = currentScope === "trash";
  document.body.classList.toggle("trash-view", showingTrash);
  updateStats();
  if (editingId !== null && todos.some(task => String(task.id) === String(editingId) && task.purgedAt)) closeModal(true);
  const scoped = todos.filter(task => currentScope === "trash" ? TodoData.inTrash(task, scopeNow) : TaskDates.matches(task, currentScope, scopeNow));
  const visible = applySort(applyFilters(scoped));
  // Keep the urgent group first even when a secondary sort is chosen.
  if (currentScope === "today") visible.sort((a, b) =>
    Number(isOverdue(b.due, b.dueTime, b.status)) - Number(isOverdue(a.due, a.dueTime, a.status)));
  document.querySelectorAll("[data-scope]").forEach(button => {
    const selected = button.dataset.scope === currentScope;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.querySelector(".v2-scope-count").textContent = todos.filter(task => button.dataset.scope === "trash" ? TodoData.inTrash(task, scopeNow) : TaskDates.matches(task, button.dataset.scope, scopeNow)).length;
  });
  document.getElementById("v2-scope-heading").textContent = t("scope_" + currentScope);
  document.getElementById("v2-scope-description").textContent = t("scope_" + currentScope + "_description");
  const resultCount = showingTrash ? scoped.length : visible.length;
  document.getElementById("v2-scope-results").textContent = t(resultCount === 1 ? "scope_result_one" : "scope_results", { count: resultCount });
  document.getElementById("v2-board-scroll-hint").hidden = showingTrash || currentView !== "kanban";
  boardEl.tabIndex = !showingTrash && currentView === "kanban" ? 0 : -1;
  boardEl.setAttribute("role", "region");
  boardEl.setAttribute("aria-label", t(showingTrash ? "scope_trash" : "view_" + currentView));
  boardEl.className = showingTrash ? "v2-board v2-board--trash" : `v2-board v2-board--${currentView}`;
  boardEl.innerHTML = "";
  if (showingTrash) renderTrash(scoped);
  else if (!visible.length) renderEmpty();
  else if (currentView === "kanban") renderKanban(visible);
  else if (currentView === "table") renderTable(visible);
  else if (currentScope === "today") {
    const late = visible.filter(task => isOverdue(task.due, task.dueTime, task.status));
    const today = visible.filter(task => !isOverdue(task.due, task.dueTime, task.status));
    for (const [label, items] of [["scope_overdue", late], ["scope_today", today]]) {
      if (!items.length) continue;
      const heading = document.createElement("h3");
      heading.className = "v2-day-heading" + (label === "scope_overdue" ? " v2-day-heading--overdue" : "");
      heading.textContent = `${t(label)} · ${items.length}`;
      boardEl.appendChild(heading);
      renderList(items);
    }
  } else renderList(visible);
  updateFilterBadge();
  boardEl.querySelectorAll(".v2-item,.v2-card,.v2-table-row").forEach(row => {
    for (const [selector, action] of [[".task-summary", "summary"], [".v2-edit-btn", "edit"], ["button.v2-badge", "status"]]) {
      const button = row.querySelector(selector);
      if (button) { button.dataset.taskId = row.dataset.taskId; button.dataset.taskAction = action; }
    }
  });
  if (focusId && focusAction) {
    const replacement = [...boardEl.querySelectorAll("[data-task-action]")].find(button => button.dataset.taskId === focusId && button.dataset.taskAction === focusAction);
    (replacement || document.querySelector(`[data-scope="${currentScope}"]`))?.focus();
  }
}
function refreshTaskClock() {
  clearTimeout(clockTimer);
  if (taskStore && sessionStorage.getItem("auth")) {
    if (todos.some(task => TodoData.expired(task))) {
      todos = TodoData.expire(todos);
      const revision = localRevision;
      saveTodos().then(saved => { if (saved && localRevision === revision + 1) todos = taskStore.read(); render(); });
    }
    render();
  }
  clockTimer = setTimeout(refreshTaskClock, TaskDates.nextTick());
}
window.addEventListener("focus", refreshTaskClock);
document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshTaskClock(); });


function updateStats() {
  const activeTodos = todos.filter(t => !t.archived && !t.deletedAt && !t.purgedAt);
  const total = activeTodos.length;
  const done  = activeTodos.filter(t => t.status === "done").length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  if (statTotal)    statTotal.textContent    = t("stat_tasks", { count: total, s: total > 1 ? "s" : "" });
  if (statDone)     statDone.textContent     = t("stat_done", { count: done, s: done > 1 ? "s" : "" });
  if (statProgress) statProgress.textContent = `${pct}%`;
  if (progressBar)  progressBar.style.width  = pct + "%";
}

function renderEmpty() {
  const p = document.createElement("p"); p.className = "v2-empty";
  const hasFilters = searchQuery || filterStatuses.length || filterPriorities.length || filterDueBefore || filterDueAfter || filterHasNotes || filterNoDue;
  if (currentScope !== "all" && !hasFilters) {
    p.textContent = t("scope_" + currentScope + "_empty");
    boardEl.replaceChildren(p);
    return;
  }
  p.textContent = searchQuery ? t("search_no_results", { query: searchQuery }) :
    (todos.some(t => !t.archived && !t.deletedAt && !t.purgedAt) ? TodoRuntime.message("Aucun résultat avec ces filtres. Réinitialisez les filtres pour retrouver vos tâches.", "No matches for these filters. Reset filters to see your tasks.") : t("empty_tasks"));
  boardEl.replaceChildren(p);
}
// ── Vue Liste ──
function renderList(items) {
  if (items.length === 0) {
    renderEmpty();
    return;
  }
  const ul = document.createElement("ul");
  ul.className = "v2-list";
  items.forEach((todo, i) => {
    // Task content is rendered as text or escaped HTML.
    const info    = STATUS_INFO[todo.status] || STATUS_INFO.todo;
    const dueInfo = getDueInfo(todo.due, todo.dueTime, todo.status);
    const prio    = todo.priority || "normal";
    const li = document.createElement("li");
    li.className = "v2-item";
    li.dataset.taskId = String(todo.id);
    li.style.animationDelay = `${Math.min(i, 10)*20}ms`;
    li.innerHTML = `
      <div class="v2-item-left">
        <button class="v2-badge v2-badge--${todo.status}" title="${t("badge_status_title")}">${info.icon} ${info.label}</button>
        <div class="v2-item-body" title="${t("task_recap_title")}">
          <button type="button" class="task-summary v2-item-text ${todo.status === "done" ? "v2-done" : ""} ${todo.status === "cancelled" ? "v2-cancelled" : ""}">${escHtml(todo.text)}</button>
          <div class="v2-item-meta">
            ${prio !== "normal" ? `<span class="v2-prio v2-prio--${prio}">${PRIORITY_LABEL[prio]}</span>` : ""}
            ${dueInfo ? `<span class="v2-due ${dueInfo.cls}">📅 ${dueInfo.label}</span>` : ""}
            ${todo.notes && todo.notes.trim() ? `<span class="v2-note-icon" title="${escHtml(todo.notes)}">📝</span>` : ""}
          </div>
          ${todo.notes && todo.notes.trim() ? `<span class="v2-note-preview">${escHtml(todo.notes.slice(0, 80))}${todo.notes.length > 80 ? "…" : ""}</span>` : ""}
        </div>
      </div>
      <button class="v2-edit-btn" title="${t("edit_task_title")}">${t("btn_edit")}</button>
    `;
    li.querySelector(".v2-badge").addEventListener("click", e => {
      e.stopPropagation();
      const cycle = ["todo", "inprogress", "waiting", "done", "cancelled"];
      todo.status = cycle[(cycle.indexOf(todo.status) + 1) % cycle.length];
      saveTodos(); render();
    });
    li.querySelector(".v2-edit-btn").addEventListener("click", e => { e.stopPropagation(); openModal(todo.id, "edit"); });
    const actions = document.createElement("div"); actions.className = "v2-task-controls";
    actions.appendChild(li.querySelector(".v2-edit-btn"));
    addScheduleActions(actions, todo);
    li.appendChild(actions);
    li.addEventListener("click", () => openModal(todo.id, "view"));
    ul.appendChild(li);
  });
  boardEl.appendChild(ul);
}

// ── Vue Kanban ──
function renderKanban(items) {
  const wrap = document.createElement("div");
  wrap.className = "v2-kanban";
  getKanbanCols().forEach(col => {
    const colItems = items.filter(t => t.status === col.id);
    const colEl = document.createElement("div");
    colEl.className = "v2-kanban-col";
    colEl.innerHTML = `
      <div class="v2-kanban-header">
        <span>${col.icon} ${col.label}</span>
        <span class="v2-kanban-count">${colItems.length}</span>
      </div>
    `;
    const list = document.createElement("div");
    list.className = "v2-kanban-list";
    if (colItems.length === 0) {
      list.innerHTML = `<p class="v2-kanban-empty">${t("kanban_empty")}</p>`;
    } else {
      colItems.forEach(todo => {
        // Task content is rendered as text or escaped HTML.
        const dueInfo = getDueInfo(todo.due, todo.dueTime, todo.status);
        const prio    = todo.priority || "normal";
        const card = document.createElement("div");
        card.className = "v2-card";
        card.dataset.taskId = String(todo.id);
        card.innerHTML = `
          <div class="v2-card-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:.4rem;">
            <button type="button" class="task-summary v2-card-text ${todo.status === "done" ? "v2-done" : ""}" style="margin-bottom:0;flex:1;cursor:pointer;" title="${t("task_recap_title")}">${escHtml(todo.text)}</button>
            <button class="v2-edit-btn v2-card-edit-btn" title="${t("edit_task_title")}" style="min-height:44px;padding:.4rem .6rem;font-size:.8rem;flex-shrink:0;">${t("btn_edit")}</button>
          </div>
          <div class="v2-card-meta">
            ${prio !== "normal" ? `<span class="v2-prio v2-prio--${prio}">${PRIORITY_LABEL[prio]}</span>` : ""}
            ${dueInfo ? `<span class="v2-due ${dueInfo.cls}">📅 ${dueInfo.label}</span>` : ""}
            ${todo.notes && todo.notes.trim() ? `<span class="v2-note-icon">📝</span>` : ""}
          </div>
        `;
        const cardEditBtn = card.querySelector(".v2-card-edit-btn");
        if (cardEditBtn) {
          cardEditBtn.addEventListener("click", e => {
            e.stopPropagation();
            openModal(todo.id, "edit");
          });
        }
        addScheduleActions(card, todo);
        card.addEventListener("click", () => openModal(todo.id, "view"));
        list.appendChild(card);
      });
    }
    colEl.appendChild(list);
    wrap.appendChild(colEl);
  });
  boardEl.appendChild(wrap);
}

// ── Vue Tableau ──
function renderTable(items) {
  if (items.length === 0) {
    renderEmpty();
    return;
  }
  const table = document.createElement("table");
  table.className = "v2-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>${t("table_col_task")}</th>
        <th>${t("table_col_status")}</th>
        <th>${t("table_col_priority")}</th>
        <th>${t("table_col_due")}</th>
        <th>${t("table_col_notes")}</th>
        <th></th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement("tbody");
  items.forEach(todo => {
    // Task content is rendered as text or escaped HTML.
    const info    = STATUS_INFO[todo.status] || STATUS_INFO.todo;
    const dueInfo = getDueInfo(todo.due, todo.dueTime, todo.status);
    const prio    = todo.priority || "normal";
    const tr = document.createElement("tr");
    tr.className = "v2-table-row";
    tr.dataset.taskId = String(todo.id);
    tr.innerHTML = `
      <td class="v2-table-text" title="${t("task_recap_title")}">
        <button type="button" class="task-summary ${todo.status === "done" ? "v2-done" : ""} ${todo.status === "cancelled" ? "v2-cancelled" : ""}">${escHtml(todo.text)}</button>
      </td>
      <td><button class="v2-badge v2-badge--${todo.status}" title="${t("badge_status_title")}" style="background:transparent;cursor:pointer;">${info.icon} ${info.label}</button></td>
      <td>${prio !== "normal" ? `<span class="v2-prio v2-prio--${prio}">${PRIORITY_LABEL[prio]}</span>` : `<span class="v2-muted">—</span>`}</td>
      <td>${dueInfo ? `<span class="v2-due ${dueInfo.cls}">${dueInfo.label}</span>` : `<span class="v2-muted">—</span>`}</td>
      <td>${todo.notes && todo.notes.trim() ? `<span class="v2-note-icon" title="${escHtml(todo.notes)}">📝</span>` : `<span class="v2-muted">—</span>`}</td>
      <td><button class="v2-edit-btn" title="${t("edit_task_title")}">${t("btn_edit")}</button></td>
    `;
    [t("table_col_task"), t("table_col_status"), t("table_col_priority"), t("table_col_due"), t("table_col_notes"), ""].forEach((label, index) => tr.cells[index].dataset.label = label);
    const tbBadge = tr.querySelector(".v2-badge");
    if (tbBadge) {
      tbBadge.addEventListener("click", e => {
        e.stopPropagation();
        const cycle = ["todo", "inprogress", "waiting", "done", "cancelled"];
        todo.status = cycle[(cycle.indexOf(todo.status) + 1) % cycle.length];
        saveTodos(); render();
      });
    }
    tr.querySelector(".v2-edit-btn").addEventListener("click", e => { e.stopPropagation(); openModal(todo.id, "edit"); });
    addScheduleActions(tr.lastElementChild, todo);
    tr.addEventListener("click", () => openModal(todo.id, "view"));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  table.setAttribute("role", "table");
  table.querySelectorAll("thead,tbody").forEach(group => group.setAttribute("role", "rowgroup"));
  table.querySelectorAll("tr").forEach(row => row.setAttribute("role", "row"));
  table.querySelectorAll("th").forEach(cell => cell.setAttribute("role", "columnheader"));
  table.querySelectorAll("td").forEach(cell => cell.setAttribute("role", "cell"));
  boardEl.appendChild(table);
}

// ══════════════════════════════════════════
//  FILTRES AVANCÉS — PANEL
// ══════════════════════════════════════════
function buildFilterPanel() {
  const panel = document.getElementById("v2-filter-panel");

  // Statuts
  const statusWrap = panel.querySelector("#fp-statuses");
  statusWrap.innerHTML = "";
  STATUS_ORDER.forEach(id => {
    const info = getStatusInfo(id);
    const label = document.createElement("label");
    label.className = "v2-fp-check";
    label.innerHTML = `<input type="checkbox" value="${id}" ${filterStatuses.includes(id) ? "checked" : ""}> ${info.icon} ${info.label}`;
    label.querySelector("input").addEventListener("change", e => {
      if (e.target.checked) filterStatuses.push(id);
      else filterStatuses = filterStatuses.filter(s => s !== id);
      render();
    });
    statusWrap.appendChild(label);
  });

  // Priorités
  const prioWrap = panel.querySelector("#fp-priorities");
  prioWrap.innerHTML = "";
  [["high","🔴 " + t("prio_high")],["normal","— " + t("prio_normal")],["low","🔵 " + t("prio_low")]].forEach(([id,lbl]) => {
    const label = document.createElement("label");
    label.className = "v2-fp-check";
    label.innerHTML = `<input type="checkbox" value="${id}" ${filterPriorities.includes(id) ? "checked" : ""}> ${lbl}`;
    label.querySelector("input").addEventListener("change", e => {
      if (e.target.checked) filterPriorities.push(id);
      else filterPriorities = filterPriorities.filter(p => p !== id);
      render();
    });
    prioWrap.appendChild(label);
  });

  // Date avant
  const dueBefore = panel.querySelector("#fp-due-before");
  if (!dueBefore.dataset.bound) {
    dueBefore.dataset.bound = "1";
    dueBefore.addEventListener("change", e => { filterDueBefore = e.target.value; validateDates(); render(); });
    panel.querySelector("#fp-due-after").addEventListener("change",  e => { filterDueAfter  = e.target.value; validateDates(); render(); });
    panel.querySelector("#fp-has-notes").addEventListener("change",  e => { filterHasNotes  = e.target.checked; render(); });
    panel.querySelector("#fp-no-due").addEventListener("change",     e => { filterNoDue     = e.target.checked; render(); });
  }
}

function updateFilterBadge() {
  const count = Number(filterStatuses.length > 0) + Number(filterPriorities.length > 0)
    + (filterDueBefore ? 1 : 0) + (filterDueAfter ? 1 : 0)
    + (filterHasNotes ? 1 : 0) + (filterNoDue ? 1 : 0);
  const badge = document.getElementById("v2-filter-count");
  if (badge) {
    badge.textContent = count > 0 ? count : "";
    badge.style.display = count > 0 ? "inline-flex" : "none";
  }
}

function validateDates() {
  const after = document.getElementById("fp-due-after");
  const invalid = filterDueBefore && filterDueAfter && filterDueAfter > filterDueBefore;
  after.setCustomValidity(invalid ? TodoRuntime.message("La date de début doit précéder la date de fin.", "Start date must be before end date.") : "");
  after.reportValidity();
}
function resetFilters() {
  filterStatuses   = [];
  filterPriorities = [];
  filterDueBefore  = "";
  filterDueAfter   = "";
  filterHasNotes   = false;
  filterNoDue      = false;
  document.querySelectorAll("#v2-filter-panel input[type=checkbox]").forEach(cb => cb.checked = false);
  document.querySelectorAll("#v2-filter-panel input[type=date]").forEach(d => d.value = "");
  validateDates();
  render();
}

// ══════════════════════════════════════════
//  MODALES
// ══════════════════════════════════════════

// Événements boutons de modale
if (modalEditBtn) {
  modalEditBtn.addEventListener("click", () => {
    if (editingId !== null) openModal(editingId, "edit");
  });
}

if (modalCloseRecapBtn) {
  modalCloseRecapBtn.addEventListener("click", closeModal);
}

if (modalCancelEditBtn) {
  modalCancelEditBtn.addEventListener("click", () => {
    if (editingId !== null) {
      openModal(editingId, "view");
    } else {
      closeModal();
    }
  });
}

function openModal(id = null, mode = 'edit') {
  quickModalDraft = null;
  if (!taskStore || !sessionStorage.getItem("auth")) return;
  modalSnapshot = null;
  if (id === null) {
    editingId = null;
    modalHeading.textContent = t("modal_new_task");
    modalSave.textContent = t("btn_create");
    if (modalCancelEditBtn) modalCancelEditBtn.textContent = t("btn_cancel");
    modalText.value = "";
    modalStatus.value = "todo";
    modalPriority.value = "normal";
    modalDue.value = "";
    if (modalDueTime) modalDueTime.value = "";
    modalNotes.value = "";

    if (modalRecap) modalRecap.style.display = "none";
    if (modalBody) modalBody.style.display = "flex";

    modalSave.style.display = "";
    if (modalCancelEditBtn) modalCancelEditBtn.style.display = "";
    modalDelete.style.display = "none";
    if (modalEditBtn) modalEditBtn.style.display = "none";
    if (modalCloseRecapBtn) modalCloseRecapBtn.style.display = "none";

    modalOverlay.classList.add("open");
    document.body.classList.add("modal-open");
    modalSnapshot = modalValues();
    setTimeout(() => modalText.focus(), 60);
    return;
  }

  const todo = todos.find(t => String(t.id) === String(id));
  if (!todo || todo.purgedAt || (mode !== "view" && todo.deletedAt)) return;
  editingId = todo.id;

  if (mode === "view") {
    // ── Mode récapitulatif ──
    modalHeading.textContent = t("modal_summary");
    if (modalEditBtn) modalEditBtn.textContent = t("btn_edit");
    if (modalCloseRecapBtn) modalCloseRecapBtn.textContent = t("btn_close");

    if (recapTitle) {
      recapTitle.textContent = todo.text;
      recapTitle.className = "modal-recap-title" +
        (todo.status === "done" ? " v2-done" : "") +
        (todo.status === "cancelled" ? " v2-cancelled" : "");
    }

    if (recapStatus) {
      const info = STATUS_INFO[todo.status] || STATUS_INFO.todo;
      recapStatus.textContent = `${info.icon} ${info.label}`;
      recapStatus.className = `v2-badge v2-badge--${todo.status || 'todo'}`;
    }

    if (recapPriority) {
      const prio = todo.priority || "normal";
      if (prio !== "normal") {
        recapPriority.textContent = PRIORITY_LABEL[prio] || prio;
        recapPriority.className = `v2-prio v2-prio--${prio}`;
        recapPriority.style.display = "";
      } else {
        recapPriority.textContent = t("recap_prio_normal");
        recapPriority.className = "v2-prio";
        recapPriority.style.display = "";
      }
    }

    if (recapDue) {
      const dueInfo = getDueInfo(todo.due, todo.dueTime, todo.status);
      if (dueInfo && todo.due) {
        let dateFull = todo.due;
        try {
          const parts = todo.due.split("-");
          if (parts.length === 3) {
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            const locale = getLanguage() === "en" ? "en-US" : "fr-FR";
            dateFull = d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
          }
        } catch(e) {}
        const timeSuffix = todo.dueTime ? ` ⏱ ${todo.dueTime}` : "";
        recapDue.textContent = `📅 ${dateFull}${timeSuffix} (${dueInfo.label})`;
        recapDue.className = `v2-due ${dueInfo.cls}`;
        recapDue.style.display = "";
      } else {
        recapDue.textContent = t("recap_no_due");
        recapDue.className = "v2-due due-ok";
        recapDue.style.display = "";
      }
    }

    if (recapNotes) {
      if (todo.notes && todo.notes.trim()) {
        recapNotes.textContent = todo.notes;
        recapNotes.classList.remove("is-empty");
      } else {
        recapNotes.textContent = t("recap_no_notes");
        recapNotes.classList.add("is-empty");
      }
    }

    if (recapMeta) {
      if (todo.created) {
        const d = new Date(todo.created);
        const locale = getLanguage() === "en" ? "en-US" : "fr-FR";
        const dateStr = d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        recapMeta.textContent = t("recap_created", { date: dateStr, time: timeStr });
        recapMeta.style.display = "";
      } else {
        recapMeta.style.display = "none";
      }
    }

    if (modalRecap) modalRecap.style.display = "flex";
    if (modalBody) modalBody.style.display = "none";

    if (modalEditBtn) modalEditBtn.style.display = todo.deletedAt ? "none" : "";
    if (modalCloseRecapBtn) modalCloseRecapBtn.style.display = "";
    modalSave.style.display = "none";
    if (modalCancelEditBtn) modalCancelEditBtn.style.display = "none";
    modalDelete.style.display = "none";
  } else {
    // ── Mode édition ──
    modalHeading.textContent = t("modal_edit_task");
    modalSave.textContent = t("btn_save");
    if (modalCancelEditBtn) modalCancelEditBtn.textContent = t("btn_cancel");
    if (modalDelete) modalDelete.textContent = t("btn_delete");
    modalText.value = todo.text;
    modalStatus.value = todo.status;
    modalPriority.value = todo.priority || "normal";
    modalDue.value = todo.due || "";
    if (modalDueTime) modalDueTime.value = todo.dueTime || "";
    modalNotes.value = todo.notes || "";

    if (modalRecap) modalRecap.style.display = "none";
    if (modalBody) modalBody.style.display = "flex";

    modalSave.style.display = "";
    if (modalCancelEditBtn) modalCancelEditBtn.style.display = "";
    modalDelete.style.display = "";
    if (modalEditBtn) modalEditBtn.style.display = "none";
    if (modalCloseRecapBtn) modalCloseRecapBtn.style.display = "none";

    setTimeout(() => modalText.focus(), 60);
  }

  modalOverlay.classList.add("open");
  document.body.classList.add("modal-open");
  if (mode === "edit") modalSnapshot = modalValues();
}

function closeModal(force = false) {
  if (force !== true && modalSnapshot && modalValues() !== modalSnapshot && !confirm(TodoRuntime.message("Abandonner les modifications non enregistrées ?", "Discard unsaved changes?"))) return false;
  modalSnapshot = null;
  quickModalDraft = null;
  modalOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
  editingId = null;
  return true;
}

function openConfirm(onConfirm, options = {}) {
  confirmOverlay.querySelector("h2").textContent = options.title || t("confirm_delete_title");
  confirmOverlay.querySelector("p").textContent = options.description || t("confirm_delete_desc");
  confirmYes.textContent = options.label || t("trash_move");
  confirmCleanup?.();
  confirmOverlay.classList.add("open");
  document.body.classList.add("modal-open");
  const doConfirm = () => { cleanup(); onConfirm(); };
  const doCancel  = () => cleanup();
  function cleanup() {
    confirmCleanup = null;
    confirmOverlay.classList.remove("open");
    document.body.classList.remove("modal-open");
    confirmYes.removeEventListener("click", doConfirm);
    confirmNo.removeEventListener("click",  doCancel);
  }
  confirmCleanup = cleanup;
  confirmYes.addEventListener("click", doConfirm);
  confirmNo.addEventListener("click",  doCancel);
}

// ══════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════
function showQuickSuccess(task) {
  quickCreatedId = task.id;
  quickStatus.textContent = t("quick_created", { title: task.text });
  quickDetails.hidden = false;
}

quickTitle.addEventListener("input", () => {
  quickError.textContent = "";
  quickTitle.removeAttribute("aria-invalid");
});
quickTitle.addEventListener("compositionstart", () => { quickComposing = true; });
quickTitle.addEventListener("compositionend", () => { quickComposing = false; });
quickTitle.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;
  if (event.isComposing || quickComposing || event.keyCode === 229 || event.repeat || quickEnterHeld) event.preventDefault();
  else quickEnterHeld = true;
});
quickTitle.addEventListener("keyup", event => { if (event.key === "Enter") quickEnterHeld = false; });
quickTitle.addEventListener("blur", () => { quickEnterHeld = false; });
quickForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (quickBusy || quickComposing || !taskStore || !sessionStorage.getItem("auth")) return;
  const title = quickTitle.value.trim();
  if (!title) {
    quickError.textContent = t("quick_required");
    quickTitle.setAttribute("aria-invalid", "true");
    quickTitle.focus();
    return;
  }
  // Set the guard synchronously, before encryption or storage yields control.
  quickBusy = true;
  const restoreFocus = [quickTitle, quickSubmit].includes(document.activeElement);
  quickTitle.readOnly = true;
  quickSubmit.disabled = true;
  quickFull.disabled = true;
  quickForm.setAttribute("aria-busy", "true");
  quickError.textContent = "";
  const task = { id: crypto.randomUUID(), text: title, status: "todo", priority: "normal", due: null, dueTime: null, notes: "", created: new Date().toISOString() };
  todos.push(task);
  try {
    const saved = await saveTodos();
    if (!sessionStorage.getItem("auth")) return;
    if (saved) {
      quickTitle.value = "";
      quickTitle.removeAttribute("aria-invalid");
      showQuickSuccess(task);
    } else {
      todos = todos.filter(item => item.id !== task.id);
      quickError.textContent = t("quick_failed");
    }
    render();
  } finally {
    quickBusy = false;
    quickTitle.readOnly = false;
    const ready = !!taskStore && !!sessionStorage.getItem("auth");
    quickTitle.disabled = !ready;
    quickSubmit.disabled = !ready;
    quickFull.disabled = !ready;
    quickForm.setAttribute("aria-busy", "false");
    if (restoreFocus && ready && !document.querySelector(".modal-overlay.open") && [quickTitle, quickSubmit, document.body].includes(document.activeElement)) quickTitle.focus();
  }
});

function openFullQuickCreation() {
  if (quickBusy || !taskStore || !sessionStorage.getItem("auth")) return;
  const draft = quickTitle.value;
  openModal(null);
  modalText.value = draft;
  quickModalDraft = draft;
  modalSnapshot = modalValues();
}
quickFull.addEventListener("click", openFullQuickCreation);
quickDetails.addEventListener("click", () => {
  if (quickCreatedId !== null) openModal(quickCreatedId, "edit");
});

function openShortcutHelp() { shortcutsOverlay.classList.add("open"); }
function closeShortcutHelp() { shortcutsOverlay.classList.remove("open"); }
document.getElementById("shortcuts-open").addEventListener("click", openShortcutHelp);
document.getElementById("shortcuts-close").addEventListener("click", closeShortcutHelp);
shortcutsOverlay.addEventListener("click", event => { if (event.target === shortcutsOverlay) closeShortcutHelp(); });
shortcutsEnabled.addEventListener("change", () => {
  try {
    localStorage.setItem(shortcutsKey, String(shortcutsEnabled.checked));
    document.getElementById("shortcuts-error").textContent = "";
  } catch (_) {
    document.getElementById("shortcuts-error").textContent = t("shortcuts_not_saved");
  }
});
document.addEventListener("keydown", event => {
  if (quickBusy || !sessionStorage.getItem("auth")) return;
  const target = event.composedPath()[0] || document.activeElement;
  const action = QuickCaptureKeys.action(event, shortcutsEnabled.checked, target,
    !!document.querySelector(".modal-overlay.open,.modal-overlay.active,#timeout-overlay"));
  if (!action || (action !== "help" && !taskStore)) return;
  event.preventDefault();
  if (action === "help") openShortcutHelp();
  else if (action === "full") openFullQuickCreation();
  else quickTitle.focus();
});

viewBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    currentView = btn.dataset.view;
    viewBtns.forEach(b => { b.classList.toggle("active", b === btn); b.setAttribute("aria-pressed", String(b === btn)); });
    render();
  });
});

sortSelect.addEventListener("change", () => { currentSort = sortSelect.value; render(); });

let searchTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchQuery = searchInput.value.trim().toLowerCase();
  searchClear.style.display = searchQuery ? "" : "none";
  searchTimer = setTimeout(render, 100);
});
searchClear.addEventListener("click", () => {
  clearTimeout(searchTimer);
  searchInput.value = ""; searchQuery = "";
  searchClear.style.display = "none";
  searchInput.focus(); render();
});

filterToggle.addEventListener("click", () => {
  filterPanel.classList.toggle("open");
  filterToggle.classList.toggle("active");
  filterToggle.setAttribute("aria-expanded", String(filterPanel.classList.contains("open")));
});

filterReset.addEventListener("click", resetFilters);

fabAdd.addEventListener("click", openFullQuickCreation);
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });
confirmOverlay.addEventListener("click", e => { if (e.target === confirmOverlay) { confirmCleanup?.(); } });
document.addEventListener("keydown", e => { if (e.key === "Escape") { if (shortcutsOverlay.classList.contains("open")) { closeShortcutHelp(); return; } if (reschedulingId !== null) { closeScheduleDialog(); return; } if (confirmCleanup) confirmCleanup(); else closeModal(); } });

modalSave.addEventListener("click", async () => {
  if (modalSave.disabled) return;
  modalSave.disabled = true;
  try {
  const newText = modalText.value.trim();
  if (!newText) { modalText.focus(); return; }
  const dueTimeVal = modalDueTime ? (modalDueTime.value || null) : null;
  if (editingId === null) {
    todos.push({ id:crypto.randomUUID(), text:newText, status:modalStatus.value, priority:modalPriority.value, due:modalDue.value||null, dueTime:dueTimeVal, notes:modalNotes.value.trim(), created:new Date().toISOString() });
  } else {
    const idx = todos.findIndex(t => String(t.id) === String(editingId));
    if (idx !== -1) Object.assign(todos[idx], { text:newText, status:modalStatus.value, priority:modalPriority.value, due:modalDue.value||null, dueTime:dueTimeVal, notes:modalNotes.value.trim() });
  }
  if (await saveTodos()) {
    if (editingId === null && quickModalDraft !== null && quickTitle.value === quickModalDraft) quickTitle.value = "";
    render(); closeModal(true);
  }
  } finally { modalSave.disabled = false; }
});

modalDelete.addEventListener("click", () => {
  if (editingId === null) return;
  const id = editingId;
  if (!closeModal()) return;
  openConfirm(() => moveTaskToTrash(id));
});

document.getElementById("v2-logout-btn").addEventListener("click", async () => {
  if (!closeModal()) return;
  if (quickTitle.value.trim() && !confirm(t("quick_discard"))) return;
  quickTitle.value = "";
  try { await savingLocal; } catch (_) { return; }
  sessionStorage.removeItem("auth");
  sessionStorage.removeItem("username");
  sessionStorage.removeItem("encKey");
  sessionStorage.removeItem("encSalt");
  if (window.transitionTo) window.transitionTo("./login.html");
  else window.location.href = "./login.html";
});

// ── Utilitaire ──
function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

window.addEventListener("sessionExpired", () => {
  quickTitle.value = ""; quickTitle.disabled = true; quickSubmit.disabled = true; quickFull.disabled = true;
  quickStatus.textContent = ""; quickError.textContent = ""; quickDetails.hidden = true; document.getElementById("trash-notice").hidden = true; closeShortcutHelp();
  clearTimeout(clockTimer); closeScheduleDialog(); modalSnapshot = null; closeModal(true); confirmCleanup?.(); boardEl.replaceChildren(); todos = []; fabAdd.disabled = true; });
document.querySelectorAll("[data-scope]").forEach(button => button.addEventListener("click", () => setTaskScope(button.dataset.scope)));
sortSelect.value = currentSort;
// Keep sheets within the visible viewport when a phone keyboard reduces it.
function updateTaskInputFocus() {
  document.body.classList.toggle("task-input-focused", !!document.activeElement?.matches("input,textarea,select"));
}
document.addEventListener("focusin", updateTaskInputFocus);
document.addEventListener("focusout", () => queueMicrotask(updateTaskInputFocus));
function updateTaskViewport() {
  updateTaskInputFocus();
  const viewport = window.visualViewport;
  document.documentElement.style.setProperty("--task-viewport-height", `${viewport?.height || window.innerHeight}px`);
  document.documentElement.style.setProperty("--task-viewport-top", `${viewport?.offsetTop || 0}px`);
}
window.addEventListener("resize", updateTaskViewport);
window.visualViewport?.addEventListener("resize", updateTaskViewport);
window.visualViewport?.addEventListener("scroll", updateTaskViewport);
updateTaskViewport();
// ── Lancement ──
buildFilterPanel();
init();

window.addEventListener("languageChanged", () => {
  setSyncStatus(lastSyncStatus, lastSyncDetail);
  const captured = todos.find(task => task.id === quickCreatedId);
  if (captured && !quickDetails.hidden) showQuickSuccess(captured);
  buildFilterPanel();
  render();
});
