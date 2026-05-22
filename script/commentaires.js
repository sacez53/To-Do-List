// ══════════════════════════════════════════
//  COMMENTAIRES.JS
// ══════════════════════════════════════════

let firebaseUrl = null;
const currentUser = sessionStorage.getItem("username") || null;
const isLoggedIn  = !!sessionStorage.getItem("auth");

const listEl   = document.getElementById("comments-list");
const formEl   = document.getElementById("comment-form");
const inputEl  = document.getElementById("comment-input");
const submitEl = document.getElementById("comment-submit");
const authMsg  = document.getElementById("comment-auth-msg");
const countEl  = document.getElementById("comment-count");
const emptyEl  = document.getElementById("comments-empty");
const loadEl   = document.getElementById("comments-loading");
const charEl   = document.getElementById("char-count");
const MAX_CHARS = 500;

// ── Init ──
async function init() {
  updateAuthUI();
  try {
    const r = await fetch("../json/firebase.json");
    const cfg = r.ok ? await r.json() : {};
    if (cfg.url && cfg.url.trim()) {
      firebaseUrl = cfg.url.replace(/\/$/, "");
      await loadComments();
    } else {
      showError("Firebase non configuré.");
    }
  } catch(e) {
    showError("Impossible de charger les commentaires.");
  }
}

// ── Auth UI ──
function updateAuthUI() {
  if (isLoggedIn) {
    authMsg.style.display = "none";
    formEl.style.display  = "flex";
    document.getElementById("comment-username-badge").textContent = "@" + currentUser;
  } else {
    authMsg.style.display = "flex";
    formEl.style.display  = "none";
  }
}

// ── Charger commentaires ──
async function loadComments() {
  loadEl.style.display = "block";
  listEl.innerHTML = "";
  try {
    const res  = await fetch(`${firebaseUrl}/comments.json`);
    const data = await res.json();
    loadEl.style.display = "none";

    if (!data) {
      emptyEl.style.display = "block";
      countEl.textContent = "0 commentaire";
      return;
    }

    // Firebase renvoie un objet { key: comment }
    const comments = Object.entries(data)
      .map(([id, c]) => ({ id, ...c }))
      .filter(c => c.text && c.username)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    countEl.textContent = `${comments.length} commentaire${comments.length > 1 ? "s" : ""}`;

    if (comments.length === 0) {
      emptyEl.style.display = "block";
      return;
    }

    emptyEl.style.display = "none";
    comments.forEach(c => listEl.appendChild(buildCard(c)));
  } catch(e) {
    loadEl.style.display = "none";
    showError("Erreur lors du chargement.");
  }
}

// ── Construire carte ──
function buildCard(c) {
  const el = document.createElement("article");
  el.className = "cm-card";
  const date = new Date(c.createdAt);
  const fmt  = date.toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" })
             + " · " + date.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });

  const isMine = isLoggedIn && currentUser === c.username;
  const delBtn = isMine ? `<button class="cm-delete" onclick="deleteComment('${c.id}')" title="Supprimer ce commentaire" aria-label="Supprimer">✕</button>` : '';

  el.innerHTML = `
    <div class="cm-card-header">
      <div class="cm-avatar">${c.username.charAt(0).toUpperCase()}</div>
      <div class="cm-card-meta">
        <span class="cm-username">@${escHtml(c.username)}</span>
        <span class="cm-date">${fmt}</span>
      </div>
      ${delBtn}
    </div>
    <p class="cm-text">${escHtml(c.text).replace(/\n/g, "<br>")}</p>
  `;
  return el;
}

// ── Supprimer un commentaire ──
window.deleteComment = async function(id) {
  if (!isLoggedIn || !firebaseUrl) return;
  if (!confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
  
  try {
    const res = await fetch(`${firebaseUrl}/comments/${id}.json`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Erreur");
    await loadComments();
  } catch (e) {
    showFormError("Erreur lors de la suppression.");
  }
};

// ── Déconnexion de la page ──
window.logoutComment = function() {
  sessionStorage.removeItem("auth");
  sessionStorage.removeItem("username");
  sessionStorage.removeItem("encKey");
  sessionStorage.removeItem("encSalt");
  window.location.reload();
};

// ── Poster un commentaire ──
async function postComment(text) {
  if (!isLoggedIn || !firebaseUrl) return;

  submitEl.disabled = true;
  submitEl.textContent = "Envoi...";

  const comment = {
    username:  currentUser,
    text:      text.trim(),
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch(`${firebaseUrl}/comments.json`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(comment)
    });

    if (!res.ok) throw new Error("Erreur réseau");

    inputEl.value = "";
    charEl.textContent = `0 / ${MAX_CHARS}`;
    await loadComments();
    listEl.scrollIntoView({ behavior: "smooth", block: "start" });

  } catch(e) {
    showFormError("Erreur lors de l'envoi. Réessaie.");
  } finally {
    submitEl.disabled = false;
    submitEl.textContent = "Publier";
  }
}

// ── Compteur de caractères ──
inputEl && inputEl.addEventListener("input", () => {
  const len = inputEl.value.length;
  charEl.textContent = `${len} / ${MAX_CHARS}`;
  charEl.style.color = len > MAX_CHARS * 0.9 ? "#f87171" : "";
  submitEl.disabled = len === 0 || len > MAX_CHARS;
});

// ── Soumission ──
formEl && formEl.addEventListener("submit", e => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text || text.length > MAX_CHARS) return;
  postComment(text);
});

// ── Helpers ──
function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function showError(msg) {
  loadEl.style.display = "none";
  listEl.innerHTML = `<p class="cm-error">${msg}</p>`;
}

function showFormError(msg) {
  const el = document.getElementById("form-error");
  if (el) { el.textContent = msg; el.style.display = "block"; setTimeout(() => el.style.display = "none", 4000); }
}

// ── Lancement ──
init();
