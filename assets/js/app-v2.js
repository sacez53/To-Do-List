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
    const r = await fetch("../assets/json/firebase.json");
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

  const urlParams = new URLSearchParams(window.location.search);
  const viewTaskId = urlParams.get("viewTask");
  const editTaskId = urlParams.get("editTask");
  if (viewTaskId) {
    const idNum = parseInt(viewTaskId, 10);
    openModal(idNum, "view");
  } else if (editTaskId) {
    const idNum = parseInt(editTaskId, 10);
    openModal(idNum, "edit");
  }
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
    if (t.archived) return false;
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
      if (a.due !== b.due) return a.due > b.due ? 1 : -1;
      // Même date → trier par heure
      const at = a.dueTime || "23:59";
      const bt = b.dueTime || "23:59";
      return at > bt ? 1 : at < bt ? -1 : 0;
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
function getDueInfo(due, dueTime, status) {
  if (!due) return null;
  const d = new Date(due + "T00:00:00");
  const timeSuffix = dueTime ? ` ⏱ ${dueTime}` : "";
  const dateStr = d.toLocaleDateString("fr-FR",{day:"numeric",month:"short"});
  
  if (status === "done" || status === "cancelled") {
    return { label: `Prévu le ${dateStr}` + timeSuffix, cls: "due-ok" };
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  
  if (diff < 0)  return { label:"En retard" + timeSuffix,    cls:"due-overdue" };
  if (diff === 0) return { label:"Aujourd'hui" + timeSuffix, cls:"due-today" };
  if (diff === 1) return { label:"Demain" + timeSuffix,       cls:"due-soon" };
  if (diff <= 3)  return { label:`Dans ${diff}j` + timeSuffix, cls:"due-soon" };
  return { label: dateStr + timeSuffix, cls:"due-ok" };
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
  const activeTodos = todos.filter(t => !t.archived);
  const total = activeTodos.length;
  const done  = activeTodos.filter(t => t.status === "done").length;
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
    // Failsafe removed
    const info    = STATUS_INFO[todo.status] || STATUS_INFO.todo;
    const dueInfo = getDueInfo(todo.due, todo.dueTime, todo.status);
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
      <button class="v2-edit-btn">Modifier</button>
    `;
    li.querySelector(".v2-badge").addEventListener("click", e => {
      e.stopPropagation();
      const cycle = ["todo", "inprogress", "waiting", "done", "cancelled"];
      todo.status = cycle[(cycle.indexOf(todo.status) + 1) % cycle.length];
      saveTodos(); render();
    });
    li.querySelector(".v2-edit-btn").addEventListener("click", e => { e.stopPropagation(); openModal(todo.id, "edit"); });
    li.addEventListener("click", () => openModal(todo.id, "view"));
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
        // Failsafe removed
        const dueInfo = getDueInfo(todo.due, todo.dueTime, todo.status);
        const prio    = todo.priority || "normal";
        const card = document.createElement("div");
        card.className = "v2-card";
        card.innerHTML = `
          <div class="v2-card-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:.4rem;">
            <p class="v2-card-text ${todo.status === "done" ? "v2-done" : ""}" style="margin-bottom:0;flex:1;">${escHtml(todo.text)}</p>
            <button class="v2-edit-btn v2-card-edit-btn" title="Modifier la tâche" style="min-height:unset;padding:.2rem .45rem;font-size:.65rem;flex-shrink:0;">Modifier</button>
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
    // Failsafe removed
    const info    = STATUS_INFO[todo.status] || STATUS_INFO.todo;
    const dueInfo = getDueInfo(todo.due, todo.dueTime, todo.status);
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
      <td><button class="v2-edit-btn">Modifier</button></td>
    `;
    tr.querySelector(".v2-edit-btn").addEventListener("click", e => { e.stopPropagation(); openModal(todo.id, "edit"); });
    tr.addEventListener("click", () => openModal(todo.id, "view"));
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
  if (id === null) {
    editingId = null;
    modalHeading.textContent = "Nouvelle tâche";
    modalSave.textContent = "Créer";
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
    setTimeout(() => modalText.focus(), 60);
    return;
  }

  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  editingId = id;

  if (mode === "view") {
    // ── Mode récapitulatif ──
    modalHeading.textContent = "Récapitulatif";

    if (recapTitle) {
      recapTitle.textContent = todo.text;
      recapTitle.className = "modal-recap-title" +
        (todo.status === "done" ? " v2-done" : "") +
        (todo.status === "cancelled" ? " v2-cancelled" : "");
    }

    if (recapStatus) {
      const info = STATUS_INFO[todo.status] || STATUS_INFO.todo;
      recapStatus.textContent = `${info.icon} ${info.label}`;
      recapStatus.className = `v2-badge v2-badge--${todo.status}`;
    }

    if (recapPriority) {
      const prio = todo.priority || "normal";
      if (prio !== "normal") {
        recapPriority.textContent = PRIORITY_LABEL[prio];
        recapPriority.className = `v2-prio v2-prio--${prio}`;
        recapPriority.style.display = "";
      } else {
        recapPriority.textContent = "— Normale";
        recapPriority.className = "v2-prio";
        recapPriority.style.display = "";
      }
    }

    if (recapDue) {
      const dueInfo = getDueInfo(todo.due, todo.dueTime, todo.status);
      if (dueInfo) {
        const d = new Date(todo.due + "T00:00:00");
        const dateFull = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
        const timeSuffix = todo.dueTime ? ` ⏱ ${todo.dueTime}` : "";
        recapDue.textContent = `📅 ${dateFull}${timeSuffix} (${dueInfo.label})`;
        recapDue.className = `v2-due ${dueInfo.cls}`;
        recapDue.style.display = "";
      } else {
        recapDue.textContent = "📅 Aucune date d'échéance";
        recapDue.className = "v2-due due-ok";
        recapDue.style.display = "";
      }
    }

    if (recapNotes) {
      if (todo.notes && todo.notes.trim()) {
        recapNotes.textContent = todo.notes;
        recapNotes.classList.remove("is-empty");
      } else {
        recapNotes.textContent = "Aucune note";
        recapNotes.classList.add("is-empty");
      }
    }

    if (recapMeta) {
      if (todo.created) {
        const d = new Date(todo.created);
        const dateStr = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        recapMeta.textContent = `Créée le ${dateStr} à ${timeStr}`;
        recapMeta.style.display = "";
      } else {
        recapMeta.style.display = "none";
      }
    }

    if (modalRecap) modalRecap.style.display = "flex";
    if (modalBody) modalBody.style.display = "none";

    if (modalEditBtn) modalEditBtn.style.display = "";
    if (modalCloseRecapBtn) modalCloseRecapBtn.style.display = "";
    modalSave.style.display = "none";
    if (modalCancelEditBtn) modalCancelEditBtn.style.display = "none";
    modalDelete.style.display = "none";
  } else {
    // ── Mode édition ──
    modalHeading.textContent = "Modifier la tâche";
    modalSave.textContent = "Enregistrer";
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
  const dueTimeVal = modalDueTime ? (modalDueTime.value || null) : null;
  if (editingId === null) {
    todos.push({ id:Date.now(), text:newText, status:modalStatus.value, priority:modalPriority.value, due:modalDue.value||null, dueTime:dueTimeVal, notes:modalNotes.value.trim(), created:new Date().toISOString() });
  } else {
    const idx = todos.findIndex(t => t.id === editingId);
    if (idx !== -1) Object.assign(todos[idx], { text:newText, status:modalStatus.value, priority:modalPriority.value, due:modalDue.value||null, dueTime:dueTimeVal, notes:modalNotes.value.trim() });
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

// Listeners removed
