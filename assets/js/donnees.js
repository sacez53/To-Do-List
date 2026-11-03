// ══════════════════════════════════════════════════════
//  DONNEES.JS — Portabilité RGPD & Gestion des données
// ══════════════════════════════════════════════════════

(function() {
  const currentUser = sessionStorage.getItem("username") || "";
  const isLoggedIn  = !!sessionStorage.getItem("auth");

  const btnExportJson = document.getElementById("export-json");
  const btnExportCsv  = document.getElementById("export-csv");
  const btnDelete     = document.getElementById("btn-delete-account");
  const modalOverlay  = document.getElementById("confirm-overlay");
  const btnConfirm    = document.getElementById("confirm-action");
  const btnCancel     = document.getElementById("cancel-action");

  // Vérification de connexion
  function ensureAuth() {
    if (!isLoggedIn || !currentUser) {
      alert("Veuillez vous connecter pour exporter ou gérer vos données.");
      window.location.href = "./login.html?redirect=donnees.html";
      return false;
    }
    return true;
  }

  // Récupération des tâches locales ou déchiffrées
  function getTodos() {
    const raw = localStorage.getItem(`todos_${currentUser}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw) || [];
    } catch (e) {
      console.error("Erreur lecture tâches locales:", e);
      return [];
    }
  }

  // ── 1. Export JSON (Art. 20 RGPD) ─────────────────────
  function exportAsJson() {
    if (!ensureAuth()) return;
    const todos = getTodos();

    const exportData = {
      application: "Ma To-Do List",
      versionFormat: "1.0",
      exportDate: new Date().toISOString(),
      utilisateur: currentUser,
      totalTaches: todos.length,
      donnees: todos.map(t => ({
        id: t.id || "",
        texte: t.text || "",
        statut: t.status || "todo",
        priorite: t.priority || "normal",
        echeanceDate: t.due || "",
        echeanceHeure: t.dueTime || "",
        notes: t.notes || "",
        archivee: !!t.archived,
        creeLe: t.createdAt || ""
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, `todo-list-export-${currentUser}-${getDateSlug()}.json`);
  }

  // ── 2. Export CSV (Art. 20 RGPD) ──────────────────────
  function exportAsCsv() {
    if (!ensureAuth()) return;
    const todos = getTodos();

    const headers = ["ID", "Titre", "Statut", "Priorite", "Date echeance", "Heure echeance", "Notes", "Archivee", "Date creation"];
    const rows = todos.map(t => [
      escapeCsv(t.id || ""),
      escapeCsv(t.text || ""),
      escapeCsv(t.status || "todo"),
      escapeCsv(t.priority || "normal"),
      escapeCsv(t.due || ""),
      escapeCsv(t.dueTime || ""),
      escapeCsv(t.notes || ""),
      escapeCsv(t.archived ? "oui" : "non"),
      escapeCsv(t.createdAt || "")
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `todo-list-export-${currentUser}-${getDateSlug()}.csv`);
  }

  function escapeCsv(val) {
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  }

  function getDateSlug() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── 3. Suppression du compte (Zone de danger) ─────────
  async function getFirebaseUrl() {
    const res = await fetch("../assets/json/firebase.json");
    const config = await res.json();
    return (config.url || "").replace(/\/$/, "");
  }

  function openDeleteModal() {
    if (!ensureAuth()) return;
    if (modalOverlay) {
      modalOverlay.classList.add("active");
    }
  }

  function closeDeleteModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove("active");
    }
  }

  async function confirmDeleteAccount() {
    if (!ensureAuth()) return;
    btnConfirm.disabled = true;
    btnConfirm.textContent = "Suppression en cours...";

    try {
      const fbUrl = await getFirebaseUrl();
      if (fbUrl) {
        await fetch(`${fbUrl}/users/${encodeURIComponent(currentUser)}.json`, {
          method: "DELETE"
        });
      }

      // Nettoie le cache local
      localStorage.removeItem(`todos_${currentUser}`);
      localStorage.removeItem(`calendarView_${currentUser}`);
      sessionStorage.clear();

      alert("Votre compte et toutes vos données ont été définitivement supprimés.");
      window.location.href = "../index.html";
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert("Une erreur est survenue lors de la suppression. Veuillez réessayer ou utiliser la section Paramètres.");
      btnConfirm.disabled = false;
      btnConfirm.textContent = "Confirmer";
      closeDeleteModal();
    }
  }

  // ── Événements ────────────────────────────────────────
  if (btnExportJson) btnExportJson.addEventListener("click", exportAsJson);
  if (btnExportCsv)  btnExportCsv.addEventListener("click", exportAsCsv);
  if (btnDelete)     btnDelete.addEventListener("click", openDeleteModal);
  if (btnCancel)     btnCancel.addEventListener("click", closeDeleteModal);
  if (btnConfirm)    btnConfirm.addEventListener("click", confirmDeleteAccount);

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeDeleteModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay && modalOverlay.classList.contains("active")) {
      closeDeleteModal();
    }
  });
})();
