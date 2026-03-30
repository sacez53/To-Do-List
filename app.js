// ──────────────────────────────────────────────
// Références DOM
// ──────────────────────────────────────────────
const form             = document.getElementById("todo-form");
const input            = document.getElementById("todo-input");
const statusSelect     = document.getElementById("status-select");
const list             = document.getElementById("todo-list");
const todoCountEl      = document.getElementById("todo-count");
const doneCountEl      = document.getElementById("done-count");
const inprogressCountEl = document.getElementById("inprogress-count");
const filterBtns       = document.querySelectorAll(".filter-btn");
const syncDot          = document.getElementById("sync-dot");
const syncLabel        = document.getElementById("sync-label");

// Modale
const modalOverlay = document.getElementById("modal-overlay");
const modalClose   = document.getElementById("modal-close");
const modalText    = document.getElementById("modal-text");
const modalStatus  = document.getElementById("modal-status");
const modalNotes   = document.getElementById("modal-notes");
const modalSave    = document.getElementById("modal-save");
const modalDelete  = document.getElementById("modal-delete");

// ──────────────────────────────────────────────
// État
// ──────────────────────────────────────────────
let todos         = JSON.parse(localStorage.getItem("todos")) || [];
let currentFilter = "all";
let editingId     = null;
let firebaseUrl   = null;
let syncTimeout   = null;

// ──────────────────────────────────────────────
// Initialisation (charge config puis Firebase)
// ──────────────────────────────────────────────
async function init() {
  try {
    const res    = await fetch("./config.json");
    const config = await res.json();

    if (config.firebaseUrl && config.firebaseUrl.trim() !== "") {
      firebaseUrl = config.firebaseUrl.replace(/\/$/, "");
      await loadFromFirebase();
    } else {
      setSyncStatus("offline");
    }
  } catch (e) {
    console.warn("Erreur config.json :", e);
    setSyncStatus("offline");
  }

  render();
}

// ──────────────────────────────────────────────
// Sync Firebase — Chargement
// ──────────────────────────────────────────────
async function loadFromFirebase() {
  setSyncStatus("syncing");
  try {
    const res  = await fetch(`${firebaseUrl}/todos.json`);
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      todos = data;
      localStorage.setItem("todos", JSON.stringify(todos));
    } else if (data && typeof data === "object" && !Array.isArray(data)) {
      // Firebase peut retourner un objet au lieu d'un tableau
      todos = Object.values(data);
      localStorage.setItem("todos", JSON.stringify(todos));
    }

    setSyncStatus("synced");
  } catch (e) {
    console.warn("Erreur chargement Firebase :", e);
    setSyncStatus("error");
    // Fallback localStorage déjà chargé
  }
}

// ──────────────────────────────────────────────
// Sync Firebase — Sauvegarde (debounce 800ms)
// ──────────────────────────────────────────────
async function saveToFirebase() {
  if (!firebaseUrl) return;

  clearTimeout(syncTimeout);
  setSyncStatus("syncing");

  syncTimeout = setTimeout(async () => {
    try {
      await fetch(`${firebaseUrl}/todos.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todos)
      });
      setSyncStatus("synced");
    } catch (e) {
      console.warn("Erreur sync Firebase :", e);
      setSyncStatus("error");
    }
  }, 800);
}

// ──────────────────────────────────────────────
// Indicateur de sync
// ──────────────────────────────────────────────
function setSyncStatus(status) {
  if (!syncDot || !syncLabel) return;

  syncDot.className   = `sync-dot sync-${status}`;
  const labels = {
    syncing: "Sync...",
    synced:  "Synchronisé",
    error:   "Hors ligne",
    offline: "Local"
  };
  syncLabel.textContent = labels[status] || "";
}

// ──────────────────────────────────────────────
// Sauvegarde locale + Firebase
// ──────────────────────────────────────────────
function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
  saveToFirebase();
}

// ──────────────────────────────────────────────
// Ajout d'une tâche
// ──────────────────────────────────────────────
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const todo = {
    id:      Date.now(),
    text:    text,
    status:  statusSelect.value,
    notes:   "",
    created: new Date().toISOString()
  };

  todos.push(todo);
  saveTodos();
  render();
  form.reset();
  statusSelect.value = "todo";
  input.focus();
});

// ──────────────────────────────────────────────
// Filtres
// ──────────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    render();
  });
});

// ──────────────────────────────────────────────
// Labels de statut
// ──────────────────────────────────────────────
const STATUS_LABELS = {
  todo:       { label: "À faire",    icon: "📋" },
  inprogress: { label: "En cours",   icon: "⚡" },
  waiting:    { label: "En attente", icon: "⏳" },
  done:       { label: "Terminé",    icon: "✅" },
  cancelled:  { label: "Annulé",     icon: "❌" }
};

function getStatusInfo(status) {
  return STATUS_LABELS[status] || STATUS_LABELS["todo"];
}

// ──────────────────────────────────────────────
// Rendu de la liste
// ──────────────────────────────────────────────
function render() {
  list.innerHTML = "";

  const filtered = todos.filter(todo => {
    if (currentFilter === "all") return true;
    return todo.status === currentFilter;
  });

  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.className = "todo-empty";
    empty.textContent = "Aucune tâche dans cette catégorie.";
    list.appendChild(empty);
    updateCounters();
    return;
  }

  filtered.forEach(todo => {
    const info = getStatusInfo(todo.status);

    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.id = todo.id;

    const left = document.createElement("div");
    left.className = "todo-left";

    const badge = document.createElement("span");
    badge.className = "todo-badge";
    badge.textContent = `${info.icon} ${info.label}`;

    const textWrap = document.createElement("div");
    textWrap.className = "todo-text-wrap";

    const span = document.createElement("span");
    span.className = `todo-text ${todo.status === "done" ? "done" : ""} ${todo.status === "cancelled" ? "cancelled" : ""}`;
    span.textContent = todo.text;
    textWrap.appendChild(span);

    if (todo.notes && todo.notes.trim()) {
      const notePreview = document.createElement("span");
      notePreview.className = "todo-note-preview";
      notePreview.textContent = todo.notes.length > 70
        ? todo.notes.slice(0, 70) + "…"
        : todo.notes;
      textWrap.appendChild(notePreview);
    }

    left.appendChild(badge);
    left.appendChild(textWrap);

    const editBtn = document.createElement("button");
    editBtn.className = "todo-edit";
    editBtn.textContent = "Détails";
    editBtn.setAttribute("aria-label", `Voir les détails de "${todo.text}"`);

    editBtn.addEventListener("click", e => { e.stopPropagation(); openModal(todo.id); });
    li.addEventListener("click", () => openModal(todo.id));

    li.appendChild(left);
    li.appendChild(editBtn);
    list.appendChild(li);
  });

  updateCounters();
}

// ──────────────────────────────────────────────
// Compteurs
// ──────────────────────────────────────────────
function updateCounters() {
  const total      = todos.length;
  const done       = todos.filter(t => t.status === "done").length;
  const inprogress = todos.filter(t => t.status === "inprogress").length;

  todoCountEl.textContent      = `${total} tâche${total > 1 ? "s" : ""}`;
  doneCountEl.textContent      = `${done} terminée${done > 1 ? "s" : ""}`;
  inprogressCountEl.textContent = `${inprogress} en cours`;
}

// ──────────────────────────────────────────────
// Modale
// ──────────────────────────────────────────────
function openModal(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  editingId          = id;
  modalText.value    = todo.text;
  modalStatus.value  = todo.status;
  modalNotes.value   = todo.notes || "";

  modalOverlay.classList.add("open");
  document.body.classList.add("modal-open");
  modalText.focus();
}

function closeModal() {
  modalOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
  editingId = null;
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

modalSave.addEventListener("click", () => {
  if (!editingId) return;
  const idx = todos.findIndex(t => t.id === editingId);
  if (idx === -1) return;

  const newText = modalText.value.trim();
  if (!newText) return;

  todos[idx].text   = newText;
  todos[idx].status = modalStatus.value;
  todos[idx].notes  = modalNotes.value.trim();

  saveTodos();
  render();
  closeModal();
});

modalDelete.addEventListener("click", () => {
  if (!editingId) return;
  todos = todos.filter(t => t.id !== editingId);
  saveTodos();
  render();
  closeModal();
});

// ──────────────────────────────────────────────
// Lancement
// ──────────────────────────────────────────────
init();