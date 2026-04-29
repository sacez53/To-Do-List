(async function() {
  // Actif uniquement si l'utilisateur est connecté
  if (!sessionStorage.getItem("auth")) return;

  let timeoutMinutes = 5; // Valeur par défaut
  
  try {
    const res = await fetch("../json/config.json");
    const config = await res.json();
    if (typeof config.timeoutMinutes === 'number') {
      timeoutMinutes = config.timeoutMinutes;
    }
  } catch (err) {
    console.warn("Erreur lors du chargement de config.json pour le timeout:", err);
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
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999999;
      background: rgba(8, 8, 8, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 300ms ease;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
      background: #0f0f0f;
      border: 1px solid #2e2e2e;
      padding: 2.5rem 2rem;
      border-radius: 4px;
      text-align: center;
      max-width: 90vw;
      width: 400px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      transform: translateY(20px);
      transition: transform 300ms ease;
    `;

    const icon = document.createElement("div");
    icon.textContent = "⏳";
    icon.style.cssText = `
      font-size: 2.5rem;
      margin-bottom: 1rem;
    `;

    const title = document.createElement("h2");
    title.textContent = "Session expirée";
    title.style.cssText = `
      font-size: 1.2rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #efefef;
      margin-bottom: 0.8rem;
      font-family: "IBM Plex Mono", monospace;
    `;

    const text = document.createElement("p");
    text.textContent = `Vous avez été déconnecté suite à ${timeoutMinutes} minute${timeoutMinutes > 1 ? 's' : ''} d'inactivité pour des raisons de sécurité.`;
    text.style.cssText = `
      font-size: 0.85rem;
      color: #9a9a9a;
      line-height: 1.5;
      margin-bottom: 2rem;
      font-family: "IBM Plex Mono", monospace;
    `;

    const btn = document.createElement("button");
    btn.textContent = "Se reconnecter";
    btn.style.cssText = `
      background: #fff;
      color: #000;
      border: none;
      padding: 0.8rem 1.5rem;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      cursor: pointer;
      border-radius: 2px;
      transition: background 160ms ease, color 160ms ease;
      font-family: "IBM Plex Mono", monospace;
    `;
    
    // Effet de hover
    btn.onmouseover = () => { btn.style.background = "#000"; btn.style.color = "#fff"; btn.style.border = "1px solid #fff"; };
    btn.onmouseout = () => { btn.style.background = "#fff"; btn.style.color = "#000"; btn.style.border = "none"; };

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
      overlay.style.opacity = "1";
      modal.style.transform = "translateY(0)";
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
