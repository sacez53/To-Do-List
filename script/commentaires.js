// ══════════════════════════════════════════
//  COMMENTAIRES.JS  — avec système de notation
// ══════════════════════════════════════════

let firebaseUrl = null;
const currentUser = sessionStorage.getItem("username") || null;
const isLoggedIn  = !!sessionStorage.getItem("auth");

const listEl    = document.getElementById("comments-list");
const formEl    = document.getElementById("comment-form");
const inputEl   = document.getElementById("comment-input");
const submitEl  = document.getElementById("comment-submit");
const authMsg   = document.getElementById("comment-auth-msg");
const countEl   = document.getElementById("comment-count");
const emptyEl   = document.getElementById("comments-empty");
const loadEl    = document.getElementById("comments-loading");
const charEl    = document.getElementById("char-count");
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
    const badge = document.getElementById("comment-username-badge");
    if (badge) badge.textContent = "@" + currentUser;
    // Initialise l'avatar
    const avatar = document.querySelector(".compose-avatar");
    if (avatar && currentUser) avatar.textContent = currentUser.charAt(0).toUpperCase();
  } else {
    authMsg.style.display = "flex";
    formEl.style.display  = "none";
  }
}

// ══════════════════════════════════════════
//  CHARGEMENT
// ══════════════════════════════════════════
async function loadComments() {
  loadEl.style.display = "block";
  listEl.innerHTML = "";
  try {
    const res  = await fetch(`${firebaseUrl}/comments.json`);
    const data = await res.json();
    loadEl.style.display = "none";

    if (!data) {
      emptyEl.style.display = "block";
      countEl.textContent = "0 avis";
      renderRatingSummary([]);
      return;
    }

    // Firebase renvoie un objet { key: comment }
    const comments = Object.entries(data)
      .map(([id, c]) => ({ id, ...c }))
      .filter(c => c.text && c.username)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const ratedComments = comments.filter(c => c.rating > 0);
    const totalAvis = ratedComments.length;
    countEl.textContent = `${comments.length} avis${comments.length > 1 ? "" : ""}`;

    renderRatingSummary(ratedComments);

    if (comments.length === 0) {
      emptyEl.style.display = "block";
      return;
    }

    emptyEl.style.display = "none";
    comments.forEach(c => listEl.appendChild(buildCard(c)));

    // Expose les données pour l'index.html
    exposeRatingDataForIndex(ratedComments, comments);

  } catch(e) {
    loadEl.style.display = "none";
    showError("Erreur lors du chargement.");
  }
}

// ══════════════════════════════════════════
//  RÉSUMÉ NOTATION
// ══════════════════════════════════════════
function renderRatingSummary(ratedComments) {
  const summaryEl = document.getElementById("rating-summary");
  if (!summaryEl) return;

  if (ratedComments.length === 0) {
    summaryEl.style.display = "none";
    return;
  }

  summaryEl.style.display = "";

  const total = ratedComments.length;
  const sum   = ratedComments.reduce((acc, c) => acc + (c.rating || 0), 0);
  const avg   = sum / total;

  // Affichage score
  const avgEl    = document.getElementById("rating-avg");
  const starsEl  = document.getElementById("rating-avg-stars");
  const countLbl = document.getElementById("rating-count-label");

  if (avgEl)    avgEl.textContent = avg.toFixed(1);
  if (starsEl)  starsEl.innerHTML = renderStarsHtml(avg, 1.1);
  if (countLbl) countLbl.textContent = `${total} avis noté${total > 1 ? "s" : ""}`;

  // Distribution par étoile
  const barsEl = document.getElementById("rating-bars");
  if (!barsEl) return;
  barsEl.innerHTML = "";

  for (let star = 5; star >= 1; star--) {
    const n   = ratedComments.filter(c => Math.round(c.rating) === star).length;
    const pct = total > 0 ? (n / total) * 100 : 0;

    const row = document.createElement("div");
    row.className = "rating-bar-row";
    row.innerHTML = `
      <span class="rating-bar-label">${star}</span>
      <span style="color:var(--star);font-size:.7rem;">★</span>
      <div class="rating-bar-track">
        <div class="rating-bar-fill" style="width:0%" data-pct="${pct.toFixed(1)}"></div>
      </div>
      <span class="rating-bar-n">${n}</span>
    `;
    barsEl.appendChild(row);
  }

  // Animation des barres (légère)
  requestAnimationFrame(() => {
    barsEl.querySelectorAll(".rating-bar-fill").forEach(bar => {
      bar.style.width = bar.dataset.pct + "%";
    });
  });
}

// ══════════════════════════════════════════
//  EXPOSITION POUR INDEX.HTML
//  Écrit dans localStorage la moyenne + quelques commentaires récents
// ══════════════════════════════════════════
function exposeRatingDataForIndex(ratedComments, allComments) {
  try {
    const total = ratedComments.length;
    const sum   = ratedComments.reduce((acc, c) => acc + (c.rating || 0), 0);
    const avg   = total > 0 ? sum / total : null;

    // 3 commentaires les plus récents avec note
    const topComments = allComments
      .filter(c => c.rating > 0 && c.text && c.text.trim().length > 10)
      .slice(0, 3)
      .map(c => ({ username: c.username, text: c.text.slice(0, 120), rating: c.rating }));

    const payload = { avg, total, topComments, updatedAt: Date.now() };
    localStorage.setItem("appRatingData", JSON.stringify(payload));
  } catch(e) { /* silencieux */ }
}

// ══════════════════════════════════════════
//  CONSTRUCTION CARTE
// ══════════════════════════════════════════
function buildCard(c) {
  const el = document.createElement("article");
  el.className = "cm-card";
  const date = new Date(c.createdAt);
  const fmt  = date.toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" })
             + " · " + date.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });

  const isMine = isLoggedIn && currentUser === c.username;
  const delBtn = isMine
    ? `<button class="cm-delete" onclick="deleteComment('${c.id}')" title="Supprimer" aria-label="Supprimer">✕</button>`
    : "";

  const starsHtml = c.rating
    ? `<div class="cm-stars" title="${c.rating}/5 étoiles">${renderStarsHtml(c.rating, .75)}</div>`
    : "";

  el.innerHTML = `
    <div class="cm-card-header">
      <div class="cm-avatar">${c.username.charAt(0).toUpperCase()}</div>
      <div class="cm-card-meta">
        <span class="cm-username">@${escHtml(c.username)}</span>
        <span class="cm-date">${fmt}</span>
      </div>
      ${starsHtml}
      ${delBtn}
    </div>
    <p class="cm-text">${escHtml(c.text).replace(/\n/g, "<br>")}</p>
  `;
  return el;
}

// ══════════════════════════════════════════
//  RENDU ÉTOILES (HTML)
// ══════════════════════════════════════════
function renderStarsHtml(rating, size = .75) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.round(rating);
    html += `<span class="cm-star ${filled ? "filled" : "empty"}" style="font-size:${size}rem;">★</span>`;
  }
  return html;
}

// ══════════════════════════════════════════
//  SUPPRESSION
// ══════════════════════════════════════════
window.deleteComment = async function(id) {
  if (!isLoggedIn || !firebaseUrl) return;
  if (!confirm("Voulez-vous vraiment supprimer cet avis ?")) return;
  try {
    const res = await fetch(`${firebaseUrl}/comments/${id}.json`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erreur");
    await loadComments();
  } catch(e) {
    showFormError("Erreur lors de la suppression.");
  }
};

// ══════════════════════════════════════════
//  DÉCONNEXION
// ══════════════════════════════════════════
window.logoutComment = function() {
  sessionStorage.removeItem("auth");
  sessionStorage.removeItem("username");
  sessionStorage.removeItem("encKey");
  sessionStorage.removeItem("encSalt");
  window.location.reload();
};

// ══════════════════════════════════════════
//  ENVOI
// ══════════════════════════════════════════
async function postComment(text, rating) {
  if (!isLoggedIn || !firebaseUrl) return;

  submitEl.disabled = true;
  submitEl.textContent = "Envoi...";

  const comment = {
    username:  currentUser,
    text:      text.trim(),
    rating:    rating,      // 1–5 ou null
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
    // Reset étoiles
    document.querySelectorAll("#stars-input input[type=radio]").forEach(r => r.checked = false);
    submitEl.disabled = true;

    await loadComments();
    listEl.scrollIntoView({ behavior: "smooth", block: "start" });

  } catch(e) {
    showFormError("Erreur lors de l'envoi. Réessaie.");
  } finally {
    submitEl.disabled = false;
    submitEl.textContent = "Publier";
  }
}

// ══════════════════════════════════════════
//  VALIDATION FORMULAIRE
// ══════════════════════════════════════════
function validateForm() {
  const len    = inputEl ? inputEl.value.trim().length : 0;
  const rating = getSelectedRating();
  submitEl.disabled = len === 0 || len > MAX_CHARS || rating === null;
}

function getSelectedRating() {
  const checked = document.querySelector("#stars-input input[type=radio]:checked");
  return checked ? parseInt(checked.value, 10) : null;
}

// Compteur de caractères
inputEl && inputEl.addEventListener("input", () => {
  const len = inputEl.value.length;
  charEl.textContent = `${len} / ${MAX_CHARS}`;
  charEl.style.color = len > MAX_CHARS * 0.9 ? "#f87171" : "";
  validateForm();
});

// Étoiles
document.querySelectorAll("#stars-input input[type=radio]").forEach(radio => {
  radio.addEventListener("change", () => {
    const starErr = document.getElementById("star-error");
    if (starErr) starErr.style.display = "none";
    validateForm();
  });
});

// Soumission
formEl && formEl.addEventListener("submit", e => {
  e.preventDefault();
  const text   = inputEl.value.trim();
  const rating = getSelectedRating();

  if (!text || text.length > MAX_CHARS) return;

  const starErr = document.getElementById("star-error");
  if (rating === null) {
    if (starErr) { starErr.style.display = "inline"; }
    return;
  }

  postComment(text, rating);
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
