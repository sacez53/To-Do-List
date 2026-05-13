// ══════════════════════════════════════════
//  BURGER-MENU.JS — Dropdown intégré dans nav
// ══════════════════════════════════════════

(function () {
  const path    = window.location.pathname.split("/").pop() || "index.html";
  const isRoot  = !window.location.pathname.includes("/html/");

  const LINKS = [
    { href: isRoot ? "./html/commentaires.html" : "./commentaires.html", label: "Commentaires", icon: "💬", key: "commentaires.html" },
    { href: isRoot ? "./html/apropos.html"      : "./apropos.html",      label: "À propos",     icon: "◉",  key: "apropos.html"     },
    { href: isRoot ? "./html/developpeur.html"  : "./developpeur.html",  label: "Développeur",  icon: "⌨",  key: "developpeur.html"  },
  ];

  const CSS = `
    /* ── Wrapper relatif ── */
    .bm-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    /* ── Bouton ── */
    .bm-trigger {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 4px;
      width: 36px;
      height: 36px;
      background: transparent;
      border: 1px solid #2a2a2a;
      border-radius: 3px;
      cursor: pointer;
      padding: 6px;
      flex-shrink: 0;
      transition: border-color 160ms ease, background 160ms ease;
    }

    .bm-trigger span {
      display: block;
      width: 14px;
      height: 1px;
      background: #7a7a7a;
      border-radius: 1px;
      transition: background 160ms ease, transform 200ms ease, opacity 160ms ease;
      transform-origin: center;
    }

    .bm-wrap.bm-open .bm-trigger {
      border-color: #444;
      background: #111;
    }
    .bm-wrap.bm-open .bm-trigger span { background: #ddd; }

    /* Lignes → croix quand ouvert */
    .bm-wrap.bm-open .bm-trigger span:nth-child(1) { transform: translateY(5px) rotate(45deg); background: #fff; }
    .bm-wrap.bm-open .bm-trigger span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .bm-wrap.bm-open .bm-trigger span:nth-child(3) { transform: translateY(-5px) rotate(-45deg); background: #fff; }

    /* ── Dropdown ── */
    .bm-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 200px;
      background: #0a0a0a;
      border: 1px solid #222;
      border-radius: 3px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,.75);
      opacity: 0;
      transform: translateY(-6px) scale(.98);
      pointer-events: none;
      transition: opacity 180ms ease, transform 180ms ease;
      z-index: 9999;
    }

    .bm-wrap.bm-open .bm-dropdown {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    /* ── Liens ── */
    .bm-label {
      font-family: "IBM Plex Mono","Courier New",monospace;
      font-size: 0.55rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #3a3a3a;
      padding: 0.5rem 1rem 0.3rem;
      border-bottom: 1px solid #111;
    }

    .bm-link {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.7rem 1rem;
      text-decoration: none;
      color: #9a9a9a;
      font-family: "IBM Plex Mono","Courier New",monospace;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      white-space: nowrap;
      border-bottom: 1px solid #111;
      transition: color 130ms ease, background 130ms ease, padding-left 130ms ease;
      position: relative;
    }
    .bm-link:last-child { border-bottom: none; }
    .bm-link:hover { color: #fff; background: #131313; padding-left: 1.25rem; }

    .bm-link.bm-active { color: #4ade80; }
    .bm-link.bm-active::before {
      content: "";
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 2px;
      background: #4ade80;
    }

    .bm-icon  { font-size: .85rem; flex-shrink: 0; }
    .bm-arrow { margin-left: auto; font-size: .65rem; color: #333; transition: color 130ms ease; }
    .bm-link:hover .bm-arrow { color: #666; }
  `;

  // ── CSS ──
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  // ── HTML ──
  const linksHtml = LINKS.map(l => {
    const active = path === l.key ? "bm-active" : "";
    return `<a href="${l.href}" class="bm-link ${active}">
      <span class="bm-icon">${l.icon}</span>
      <span>${l.label}</span>
      <span class="bm-arrow">→</span>
    </a>`;
  }).join("");

  const wrap = document.createElement("div");
  wrap.className = "bm-wrap";
  wrap.innerHTML = `
    <button class="bm-trigger" aria-label="Menu" aria-haspopup="true" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <nav class="bm-dropdown" aria-label="Navigation secondaire">
      <div class="bm-label">Pages</div>
      ${linksHtml}
    </nav>
  `;

  // ── Injection dans la nav existante ──
  // Cherche dans cet ordre : .nav-links, .header-actions, .v2-header-actions, .top-bar, nav, header
  const targets = [".nav-links", ".header-actions", ".v2-header-actions", ".top-bar", "nav", "header"];
  let injected = false;
  for (const sel of targets) {
    const el = document.querySelector(sel);
    if (el) {
      el.appendChild(wrap);
      injected = true;
      break;
    }
  }
  // Fallback : fixed top-right
  if (!injected) {
    wrap.style.cssText = "position:fixed;top:.75rem;right:1rem;z-index:9999;";
    document.body.appendChild(wrap);
  }

  // ── Click fallback (mobile) ──
  const trigger = wrap.querySelector(".bm-trigger");

  trigger.addEventListener("click", e => {
    e.stopPropagation();
    const isOpen = wrap.classList.toggle("bm-open");
    trigger.setAttribute("aria-expanded", isOpen);
  });

  document.addEventListener("click", () => {
    wrap.classList.remove("bm-open");
    trigger.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      wrap.classList.remove("bm-open");
      trigger.setAttribute("aria-expanded", "false");
    }
  });

  wrap.querySelector(".bm-dropdown").addEventListener("click", e => e.stopPropagation());
})();
