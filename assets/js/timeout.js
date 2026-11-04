(async function() {
  // Actif uniquement si l'utilisateur est connecté
  if (!sessionStorage.getItem("auth")) return;

  let timeoutMinutes = 5; // Valeur par défaut
  
  try {
    const res = await TodoRuntime.fetch("../assets/json/security.json");
    const config = await res.json();
    if (typeof config.timeoutMinutes === 'number') {
      timeoutMinutes = config.timeoutMinutes;
    }
  } catch (err) {
    console.warn("Erreur lors du chargement de security.json pour le timeout:", err);
  }

  const TIMEOUT_MS = timeoutMinutes * 60 * 1000;
  let inactivityTimer;
  let isDisconnected = false;

  function resetTimer() {
    if (isDisconnected) return;
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(handleTimeout, TIMEOUT_MS);
  }

  function handleTimeout() {
    isDisconnected = true;
    window.dispatchEvent(new Event("sessionExpired"));
    
    // Déconnecter l'utilisateur
    sessionStorage.removeItem("auth");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("encKey");
    sessionStorage.removeItem("encSalt");

    // Retirer les écouteurs pour éviter des déclenchements multiples
    document.removeEventListener("mousemove", resetTimer);
    document.removeEventListener("keydown", resetTimer);
    document.removeEventListener("click", resetTimer);
    document.removeEventListener("scroll", resetTimer);
    document.removeEventListener("touchstart", resetTimer);

    showDisconnectPopup();
  }

  function showDisconnectPopup() {
    // Si l'overlay existe déjà, on ne fait rien
    if (document.getElementById("timeout-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "timeout-overlay";
    overlay.className = "timeout-overlay";

    const modal = document.createElement("div");
    modal.className = "modal timeout-modal";

    const icon = document.createElement("div");
    icon.textContent = "◷";
    icon.className = "timeout-symbol";

    const title = document.createElement("h2");
    title.textContent = TodoRuntime.message("Session expirée", "Session expired");
    title.className = "modal-heading";

    const text = document.createElement("p");
    text.textContent = TodoRuntime.message(`Session expirée après ${timeoutMinutes} minutes d’inactivité.`, `Session expired after ${timeoutMinutes} minutes of inactivity.`);
    text.className = "timeout-message";

    const btn = document.createElement("button");
    btn.textContent = TodoRuntime.message("Se reconnecter", "Sign in again");
    btn.className = "btn-save";
    
    btn.addEventListener("click", () => {
      if (typeof window.transitionTo === "function") {
        window.transitionTo("./login.html");
      } else {
        window.location.href = "./login.html";
      }
    });

    modal.appendChild(icon);
    modal.appendChild(title);
    modal.appendChild(text);
    modal.appendChild(btn);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    // Bloquer le scroll derrière la modale
    document.body.style.overflow = "hidden";

    // Animation d'entrée
    requestAnimationFrame(() => {
      overlay.classList.add("visible");
    });
  }

  // Écouteurs d'activité utilisateur
  document.addEventListener("mousemove", resetTimer);
  document.addEventListener("keydown", resetTimer);
  document.addEventListener("click", resetTimer);
  document.addEventListener("scroll", resetTimer);
  document.addEventListener("touchstart", resetTimer);

  // Lancement initial
  resetTimer();
})();
