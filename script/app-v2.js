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

// Modales
const modalOverlay  = document.getElementById("modal-overlay");
const modalClose    = document.getElementById("modal-close");
const modalHeading  = document.getElementById("modal-heading");
const modalText     = document.getElementById("modal-text");
const modalStatus   = document.getElementById("modal-status");
const modalPriority = document.getElementById("modal-priority");
const modalDue      = document.getElementById("modal-due");
const modalNotes    = document.getElementById("modal-notes");
const modalSave     = document.getElementById("modal-save");
const modalDelete   = document.getElementById("modal-delete");
const confirmOverlay= document.getElementById("confirm-overlay");
const confirmYes    = document.getElementById("confirm-yes");
const confirmNo     = document.getElementById("confirm-no");

// ── État ──
let todos        = [];
let firebaseUrl  = null;
let encKey       = null;
let syncTimeout  = null;
let editingId    = null;
let currentView  = "list";   // list | kanban | table
let searchQuery  = "";
let currentSort  = "status";

// Filtres avancés
let filterStatuses   = [];  // [] = tous
let filterPriorities = [];  // [] = toutes
let filterDueBefore  = "";
let filterDueAfter   = "";
let filterHasNotes   = false;
let filterNoDue      = false;

// ── Constantes ──
const STATUS_ORDER = ["inprogress","todo","waiting","done","cancelled"];
const STATUS_INFO  = {
  todo:       { label:"À faire",     icon:"📋" },
  inprogress: { label:"En cours",    icon:"⚡" },
  waiting:    { label:"En attente",  icon:"⏳" },
  done:       { label:"Terminé",     icon:"✅" },
  cancelled:  { label:"Annulé",      icon:"❌" }
};
const PRIORITY_ORDER = { high:0, normal:1, low:2 };
const PRIORITY_LABEL = { high:"🔴 Haute", normal:"— Normale", low:"🔵 Basse" };
const KANBAN_COLS = [
  { id:"todo",       label:"À faire",    icon:"📋" },
  { id:"inprogress", label:"En cours",   icon:"⚡" },
  { id:"waiting",    label:"En attente", icon:"⏳" },
  { id:"done",       label:"Terminé",    icon:"✅" },
  { id:"cancelled",  label:"Annulé",     icon:"❌" }
];

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
async function init() {
  if (userLabel) userLabel.textContent = currentUser;

  const encKeyB64 = sessionStorage.getItem("encKey");
  if (encKeyB64) {
    try { encKey = await importKey(encKeyB64); } catch(e) { console.warn(e); }
  }

  try {
    const r = await fetch("../json/firebase.json");
    const cfg = r.ok ? await r.json() : {};
    if (cfg.url && cfg.url.trim()) {
      firebaseUrl = cfg.url.replace(/\/$/, "");
      await loadFromFirebase();
    } else {
      setSyncStatus("offline");
      todos = JSON.parse(localStorage.getItem(`todos_${currentUser}`)) || [];
    }
  } catch(e) {
    setSyncStatus("error");
    todos = JSON.parse(localStorage.getItem(`todos_${currentUser}`)) || [];
  }

  render();
}

// ══════════════════════════════════════════
//  FIREBASE
// ══════════════════════════════════════════
function todosPath() {
  return `${firebaseUrl}/users/${encodeURIComponent(currentUser)}/todos.json`;
}

async function loadFromFirebase() {
  setSyncStatus("syncing");
  try {
    const res  = await fetch(todosPath());
    const data = await res.json();
    if (!data) {
      todos = [];
    } else if (isEncrypted(data)) {
      todos = encKey ? await decryptData(data, encKey) : [];
    } else if (Array.isArray(data)) {
      todos = data;
    } else if (typeof data === "object") {
      todos = Object.values(data).filter(v => v && typeof v === "object");
    }
    localStorage.setItem(`todos_${currentUser}`, JSON.stringify(todos));
    setSyncStatus("synced");
  } catch(e) {
    setSyncStatus("error");
    todos = JSON.parse(localStorage.getItem(`todos_${currentUser}`)) || [];
  }
}

async function saveToFirebase() {
  if (!firebaseUrl) return;
  clearTimeout(syncTimeout);
  setSyncStatus("syncing");
  syncTimeout = setTimeout(async () => {
    try {
      const body = encKey
        ? JSON.stringify(await encryptData(todos, encKey))
        : JSON.stringify(todos);
      await fetch(todosPath(), { method:"PUT", headers:{"Content-Type":"application/json"}, body });
      setSyncStatus("synced");
    } catch(e) { setSyncStatus("error"); }
  }, 800);
}

function saveTodos() {
  localStorage.setItem(`todos_${currentUser}`, JSON.stringify(todos));
  saveToFirebase();
}

function setSyncStatus(s) {
  if (!syncDot || !syncLabel) return;
  syncDot.className = `v2-sync-dot v2-sync-${s}`;
  const labels = { syncing:"Sync...", synced:"Synchronisé", error:"Hors ligne", offline:"Local" };
  syncLabel.textContent = labels[s] || "";
}

// ══════════════════════════════════════════
//  FILTRES & TRI
// ══════════════════════════════════════════
function applyFilters(arr) {
  return arr.filter(t => {
    if (filterStatuses.length   && !filterStatuses.includes(t.status)) return false;
    if (filterPriorities.length && !filterPriorities.includes(t.priority || "normal")) return false;
    if (filterHasNotes  && !(t.notes && t.notes.trim())) return false;
    if (filterNoDue     && t.due) return false;
    if (filterDueBefore && t.due && t.due > filterDueBefore) return false;
    if (filterDueAfter  && t.due && t.due < filterDueAfter)  return false;
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
    case "az":           return copy.sort((a,b) => a.text.localeCompare(b.text, "fr"));
    case "za":           return copy.sort((a,b) => b.text.localeCompare(a.text, "fr"));
    case "created-desc": return copy.sort((a,b) => (a.created||0) < (b.created||0) ? 1 : -1);
    case "created-asc":  return copy.sort((a,b) => (a.created||0) > (b.created||0) ? 1 : -1);
    case "priority":     return copy.sort((a,b) => (PRIORITY_ORDER[a.priority||"normal"]||1) - (PRIORITY_ORDER[b.priority||"normal"]||1));
    case "due-asc":      return copy.sort((a,b) => {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due > b.due ? 1 : -1;
    });
    case "overdue-first": return copy.sort((a,b) => {
      const today = new Date().toISOString().slice(0,10);
      const aOver = a.due && a.due < today ? -1 : 1;
      const bOver = b.due && b.due < today ? -1 : 1;
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
function getDueInfo(due) {
  if (!due) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const d    = new Date(due + "T00:00:00");
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0)  return { label:"En retard",    cls:"due-overdue" };
  if (diff === 0) return { label:"Aujourd'hui", cls:"due-today" };
  if (diff === 1) return { label:"Demain",       cls:"due-soon" };
  if (diff <= 3)  return { label:`Dans ${diff}j`,cls:"due-soon" };
  return { label: d.toLocaleDateString("fr-FR",{day:"numeric",month:"short"}), cls:"due-ok" };
}

// ══════════════════════════════════════════
//  RENDU PRINCIPAL
// ══════════════════════════════════════════
function render() {
  updateStats();
  const visible = applySort(applyFilters(todos));

  boardEl.className = `v2-board v2-board--${currentView}`;
  boardEl.innerHTML = "";

  if (currentView === "kanban") renderKanban(visible);
  else if (currentView === "table") renderTable(visible);
  else renderList(visible);

  updateFilterBadge();
}

function updateStats() {
  const total = todos.length;
  const done  = todos.filter(t => t.status === "done").length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  if (statTotal)    statTotal.textContent    = `${total} tâche${total>1?"s":""}`;
  if (statDone)     statDone.textContent     = `${done} terminée${done>1?"s":""}`;
  if (statProgress) statProgress.textContent = `${pct}%`;
  if (progressBar)  progressBar.style.width  = pct + "%";
}

// ── Vue Liste ──
function renderList(items) {
  if (items.length === 0) {
    boardEl.innerHTML = `<p class="v2-empty">${searchQuery ? `Aucun résultat pour « ${searchQuery} »` : "Aucune tâche."}</p>`;
    return;
  }
  const ul = document.createElement("ul");
  ul.className = "v2-list";
  items.forEach((todo, i) => {
    const info    = STATUS_INFO[todo.status] || STATUS_INFO.todo;
    const dueInfo = getDueInfo(todo.due);
    const prio    = todo.priority || "normal";
    const li = document.createElement("li");
    li.className = "v2-item";
    li.style.animationDelay = `${i*30}ms`;
    li.innerHTML = `
      <div class="v2-item-left">
        <button class="v2-badge v2-badge--${todo.status}" title="Changer le statut">${info.icon} ${info.label}</button>
        <div class="v2-item-body">
          <span class="v2-item-text ${todo.status === "done" ? "v2-done" : ""} ${todo.status === "cancelled" ? "v2-cancelled" : ""}">${escHtml(todo.text)}</span>
          <div class="v2-item-meta">
            ${prio !== "normal" ? `<span class="v2-prio v2-prio--${prio}">${PRIORITY_LABEL[prio]}</span>` : ""}
            ${dueInfo ? `<span class="v2-due ${dueInfo.cls}">📅 ${dueInfo.label}</span>` : ""}
            ${todo.notes && todo.notes.trim() ? `<span class="v2-note-icon" title="${escHtml(todo.notes)}">📝</span>` : ""}
          </div>
          ${todo.notes && todo.notes.trim() ? `<span class="v2-note-preview">${escHtml(todo.notes.slice(0, 80))}${todo.notes.length > 80 ? "…" : ""}</span>` : ""}
        </div>
      </div>
      <button class="v2-edit-btn">Détails</button>
    `;
    li.querySelector(".v2-badge").addEventListener("click", e => {
      e.stopPropagation();
      todo.status = todo.status === "done" ? "todo" : "done";
      saveTodos(); render();
    });
    li.querySelector(".v2-edit-btn").addEventListener("click", e => { e.stopPropagation(); openModal(todo.id); });
    li.addEventListener("click", () => openModal(todo.id));
    ul.appendChild(li);
  });
  boardEl.appendChild(ul);
}

// ── Vue Kanban ──
function renderKanban(items) {
  const wrap = document.createElement("div");
  wrap.className = "v2-kanban";
  KANBAN_COLS.forEach(col => {
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
      list.innerHTML = `<p class="v2-kanban-empty">Vide</p>`;
    } else {
      colItems.forEach(todo => {
        const dueInfo = getDueInfo(todo.due);
        const prio    = todo.priority || "normal";
        const card = document.createElement("div");
        card.className = "v2-card";
        card.innerHTML = `
          <p class="v2-card-text ${todo.status === "done" ? "v2-done" : ""}">${escHtml(todo.text)}</p>
          <div class="v2-card-meta">
            ${prio !== "normal" ? `<span class="v2-prio v2-prio--${prio}">${PRIORITY_LABEL[prio]}</span>` : ""}
            ${dueInfo ? `<span class="v2-due ${dueInfo.cls}">📅 ${dueInfo.label}</span>` : ""}
            ${todo.notes && todo.notes.trim() ? `<span class="v2-note-icon">📝</span>` : ""}
          </div>
        `;
        card.addEventListener("click", () => openModal(todo.id));
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
    boardEl.innerHTML = `<p class="v2-empty">Aucune tâche.</p>`;
    return;
  }
  const table = document.createElement("table");
  table.className = "v2-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Tâche</th>
        <th>Statut</th>
        <th>Priorité</th>
        <th>Échéance</th>
        <th>Notes</th>
        <th></th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement("tbody");
  items.forEach(todo => {
    const info    = STATUS_INFO[todo.status] || STATUS_INFO.todo;
    const dueInfo = getDueInfo(todo.due);
    const prio    = todo.priority || "normal";
    const tr = document.createElement("tr");
    tr.className = "v2-table-row";
    tr.innerHTML = `
      <td class="v2-table-text">
        <span class="${todo.status === "done" ? "v2-done" : ""} ${todo.status === "cancelled" ? "v2-cancelled" : ""}">${escHtml(todo.text)}</span>
      </td>
      <td><span class="v2-badge v2-badge--${todo.status}">${info.icon} ${info.label}</span></td>
      <td>${prio !== "normal" ? `<span class="v2-prio v2-prio--${prio}">${PRIORITY_LABEL[prio]}</span>` : `<span class="v2-muted">—</span>`}</td>
      <td>${dueInfo ? `<span class="v2-due ${dueInfo.cls}">${dueInfo.label}</span>` : `<span class="v2-muted">—</span>`}</td>
      <td>${todo.notes && todo.notes.trim() ? `<span class="v2-note-icon" title="${escHtml(todo.notes)}">📝</span>` : `<span class="v2-muted">—</span>`}</td>
      <td><button class="v2-edit-btn">Détails</button></td>
    `;
    tr.querySelector(".v2-edit-btn").addEventListener("click", e => { e.stopPropagation(); openModal(todo.id); });
    tr.addEventListener("click", () => openModal(todo.id));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  boardEl.appendChild(table);
}

// ══════════════════════════════════════════
//  FILTRES AVANCÉS — PANEL
// ══════════════════════════════════════════
function buildFilterPanel() {
  const panel = document.getElementById("v2-filter-panel");

  // Statuts
  const statusWrap = panel.querySelector("#fp-statuses");
  Object.entries(STATUS_INFO).forEach(([id, info]) => {
    const label = document.createElement("label");
    label.className = "v2-fp-check";
    label.innerHTML = `<input type="checkbox" value="${id}"> ${info.icon} ${info.label}`;
    label.querySelector("input").addEventListener("change", e => {
      if (e.target.checked) filterStatuses.push(id);
      else filterStatuses = filterStatuses.filter(s => s !== id);
      render();
    });
    statusWrap.appendChild(label);
  });

  // Priorités
  const prioWrap = panel.querySelector("#fp-priorities");
  [["high","🔴 Haute"],["normal","— Normale"],["low","🔵 Basse"]].forEach(([id,lbl]) => {
    const label = document.createElement("label");
    label.className = "v2-fp-check";
    label.innerHTML = `<input type="checkbox" value="${id}"> ${lbl}`;
    label.querySelector("input").addEventListener("change", e => {
      if (e.target.checked) filterPriorities.push(id);
      else filterPriorities = filterPriorities.filter(p => p !== id);
      render();
    });
    prioWrap.appendChild(label);
  });

  // Date avant
  panel.querySelector("#fp-due-before").addEventListener("change", e => { filterDueBefore = e.target.value; render(); });
  panel.querySelector("#fp-due-after").addEventListener("change",  e => { filterDueAfter  = e.target.value; render(); });
  panel.querySelector("#fp-has-notes").addEventListener("change",  e => { filterHasNotes  = e.target.checked; render(); });
  panel.querySelector("#fp-no-due").addEventListener("change",     e => { filterNoDue     = e.target.checked; render(); });
}

function updateFilterBadge() {
  const count = filterStatuses.length + filterPriorities.length
    + (filterDueBefore ? 1 : 0) + (filterDueAfter ? 1 : 0)
    + (filterHasNotes ? 1 : 0) + (filterNoDue ? 1 : 0);
  const badge = document.getElementById("v2-filter-count");
  if (badge) {
    badge.textContent = count > 0 ? count : "";
    badge.style.display = count > 0 ? "inline-flex" : "none";
  }
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
  render();
}

// ══════════════════════════════════════════
//  MODALES
// ══════════════════════════════════════════
function openModal(id = null) {
  if (id === null) {
    editingId = null;
    modalHeading.textContent  = "Nouvelle tâche";
    modalSave.textContent     = "Créer";
    modalText.value           = "";
    modalStatus.value         = "todo";
    modalPriority.value       = "normal";
    modalDue.value            = "";
    modalNotes.value          = "";
    modalDelete.style.display = "none";
  } else {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    editingId = id;
    modalHeading.textContent  = "Modifier la tâche";
    modalSave.textContent     = "Enregistrer";
    modalText.value           = todo.text;
    modalStatus.value         = todo.status;
    modalPriority.value       = todo.priority || "normal";
    modalDue.value            = todo.due || "";
    modalNotes.value          = todo.notes || "";
    modalDelete.style.display = "";
  }
  modalOverlay.classList.add("open");
  document.body.classList.add("modal-open");
  setTimeout(() => modalText.focus(), 60);
}

function closeModal() {
  modalOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
  editingId = null;
}

function openConfirm(onConfirm) {
  confirmOverlay.classList.add("open");
  document.body.classList.add("modal-open");
  const doConfirm = () => { cleanup(); onConfirm(); };
  const doCancel  = () => cleanup();
  function cleanup() {
    confirmOverlay.classList.remove("open");
    document.body.classList.remove("modal-open");
    confirmYes.removeEventListener("click", doConfirm);
    confirmNo.removeEventListener("click",  doCancel);
  }
  confirmYes.addEventListener("click", doConfirm);
  confirmNo.addEventListener("click",  doCancel);
}

// ══════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════
viewBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    currentView = btn.dataset.view;
    viewBtns.forEach(b => b.classList.toggle("active", b === btn));
    render();
  });
});

sortSelect.addEventListener("change", () => { currentSort = sortSelect.value; render(); });

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  searchClear.style.display = searchQuery ? "" : "none";
  render();
});
searchClear.addEventListener("click", () => {
  searchInput.value = ""; searchQuery = "";
  searchClear.style.display = "none";
  searchInput.focus(); render();
});

filterToggle.addEventListener("click", () => {
  filterPanel.classList.toggle("open");
  filterToggle.classList.toggle("active");
});

filterReset.addEventListener("click", resetFilters);

fabAdd.addEventListener("click", () => openModal(null));
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });
confirmOverlay.addEventListener("click", e => { if (e.target === confirmOverlay) { confirmOverlay.classList.remove("open"); document.body.classList.remove("modal-open"); } });
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); confirmOverlay.classList.remove("open"); } });

modalSave.addEventListener("click", () => {
  const newText = modalText.value.trim();
  if (!newText) { modalText.focus(); return; }
  if (editingId === null) {
    todos.push({ id:Date.now(), text:newText, status:modalStatus.value, priority:modalPriority.value, due:modalDue.value||null, notes:modalNotes.value.trim(), created:new Date().toISOString() });
  } else {
    const idx = todos.findIndex(t => t.id === editingId);
    if (idx !== -1) Object.assign(todos[idx], { text:newText, status:modalStatus.value, priority:modalPriority.value, due:modalDue.value||null, notes:modalNotes.value.trim() });
  }
  saveTodos(); render(); closeModal();
});

modalDelete.addEventListener("click", () => {
  if (!editingId) return;
  const id = editingId;
  closeModal();
  openConfirm(() => { todos = todos.filter(t => t.id !== id); saveTodos(); render(); });
});

document.getElementById("v2-logout-btn").addEventListener("click", () => {
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

// ── Lancement ──
buildFilterPanel();
init();
