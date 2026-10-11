// ══════════════════════════════════════════
//  BURGER-MENU.JS — Menu Responsive Mobile & Desktop
// ══════════════════════════════════════════

(function () {
  const path    = window.location.pathname.split("/").pop() || "index.html";
  const isRoot  = !window.location.pathname.includes("/pages/") && !window.location.pathname.includes("/html/");

  const LINKS = [
    { href: isRoot ? "./index.html"              : "../index.html",       label: "Accueil",        icon: "🏠", key: "index.html"        },
    { href: isRoot ? "./pages/app-v2.html"       : "./app-v2.html",       label: "Application",    icon: "📋", key: "app-v2.html"       },
    { href: isRoot ? "./pages/commentaires.html" : "./commentaires.html", label: "Commentaires",   icon: "💬", key: "commentaires.html"  },
    { href: isRoot ? "./pages/apropos.html"      : "./apropos.html",      label: "À propos",       icon: "◉",  key: "apropos.html"      },
    { href: isRoot ? "./pages/donnees.html"      : "./donnees.html",      label: "Mes Données",    icon: "📦", key: "donnees.html"      },
    { href: isRoot ? "./pages/confidentialite.html" : "./confidentialite.html", label: "Confidentialité", icon: "🔒", key: "confidentialite.html" },
    { href: isRoot ? "./pages/mentions-legales.html" : "./mentions-legales.html", label: "Mentions Légales", icon: "⚖️", key: "mentions-legales.html" },
    { href: isRoot ? "./pages/cgu.html"          : "./cgu.html",          label: "CGU",            icon: "📄", key: "cgu.html"           },
    { href: isRoot ? "./pages/developpeur.html"  : "./developpeur.html",  label: "Développeur",    icon: "⌨",  key: "developpeur.html"   },
  ];

  const CSS = `
    /* ── Wrapper relatif ── */
    .bm-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    /* ── Bouton déclencheur ── */
    .bm-trigger {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 4px;
      width: 44px;
      height: 44px;
      min-width: 44px;
      min-height: 44px;
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
      width: 15px;
      height: 1px;
      background: #888;
      border-radius: 1px;
      transition: background 160ms ease, transform 200ms ease, opacity 160ms ease;
      transform-origin: center;
    }

    .bm-wrap.bm-open .bm-trigger {
      border-color: #555;
      background: #141414;
    }
    .bm-wrap.bm-open .bm-trigger span { background: #eee; }

    /* Lignes transformées en croix */
    .bm-wrap.bm-open .bm-trigger span:nth-child(1) { transform: translateY(5px) rotate(45deg); background: #fff; }
    .bm-wrap.bm-open .bm-trigger span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .bm-wrap.bm-open .bm-trigger span:nth-child(3) { transform: translateY(-5px) rotate(-45deg); background: #fff; }

    /* ── Dropdown Desktop ── */
    .bm-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 230px;
      max-width: calc(100vw - 20px);
      max-height: calc(100dvh - 80px);
      max-height: calc(100vh - 80px);
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      background: #0a0a0a;
      border: 1px solid #222;
      border-radius: 3px;
      box-shadow: 0 8px 32px rgba(0,0,0,.85);
      opacity: 0;
      transform: translateY(-6px) scale(.98);
      pointer-events: none;
      transition: opacity 180ms ease, transform 180ms ease;
      z-index: 99999;
    }

    .bm-wrap.bm-open .bm-dropdown {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    /* Scrollbar discrète */
    .bm-dropdown::-webkit-scrollbar {
      width: 4px;
    }
    .bm-dropdown::-webkit-scrollbar-track {
      background: #0a0a0a;
    }
    .bm-dropdown::-webkit-scrollbar-thumb {
      background: #2a2a2a;
      border-radius: 2px;
    }

    /* ── Header du menu ── */
    .bm-handle {
      display: none;
    }

    .bm-label {
      font-family: "IBM Plex Mono","Courier New",monospace;
      font-size: 0.58rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #666;
      padding: 0.65rem 1rem 0.45rem;
      border-bottom: 1px solid #161616;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .bm-close-btn {
      display: none;
      background: transparent;
      border: none;
      color: #777;
      font-size: 0.85rem;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }
    .bm-close-btn:hover { color: #fff; }

    /* ── Liens ── */
    .bm-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.8rem 1rem;
      text-decoration: none;
      color: #9a9a9a;
      font-family: "IBM Plex Mono","Courier New",monospace;
      font-size: 0.73rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      white-space: nowrap;
      border-bottom: 1px solid #141414;
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

    .bm-backdrop {
      display: none;
    }

    /* ══════════════════════════════════════════
       OPTIMISATION MOBILE (< 600px)
       Affichage tiroir bas (Bottom Sheet) complet
       ══════════════════════════════════════════ */
    @media (max-width: 600px) {
      .bm-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 220ms ease;
        z-index: 99998;
      }

      .bm-wrap.bm-open .bm-backdrop {
        opacity: 1;
        pointer-events: all;
      }

      .bm-dropdown {
        position: fixed;
        top: auto;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100vw;
        max-width: 100vw;
        min-width: 100vw;
        max-height: 85dvh;
        max-height: 85vh;
        border-radius: 14px 14px 0 0;
        border: 1px solid #2a2a2a;
        border-bottom: none;
        background: #0d0d0d;
        box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.95);
        transform: translateY(105%);
        transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease;
        padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
        z-index: 99999;
      }

      .bm-wrap.bm-open .bm-dropdown {
        transform: translateY(0);
        opacity: 1;
      }

      .bm-handle {
        display: block;
        width: 38px;
        height: 4px;
        background: #333;
        border-radius: 2px;
        margin: 10px auto 4px auto;
      }

      .bm-label {
        padding: 0.75rem 1.25rem 0.5rem;
        font-size: 0.65rem;
      }

      .bm-close-btn {
        display: block;
      }

      .bm-link {
        padding: 0.9rem 1.25rem;
        font-size: 0.78rem;
      }
    }

    body.bm-locked {
      overflow: hidden;
    }
  `;

  // ── Injection CSS ──
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
    <button class="bm-trigger" aria-label="Menu de navigation" aria-haspopup="true" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <div class="bm-backdrop" aria-hidden="true"></div>
    <nav class="bm-dropdown" aria-label="Menu principal">
      <div class="bm-handle" aria-hidden="true"></div>
      <div class="bm-label">
        <span>Navigation</span>
        <button class="bm-close-btn" aria-label="Fermer le menu">✕</button>
      </div>
      ${linksHtml}
    </nav>
  `;

  // ── Injection dans la page ──
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
  if (!injected) {
    wrap.style.cssText = "position:fixed;top:.75rem;right:1rem;z-index:9999;";
    document.body.appendChild(wrap);
  }

  // ── Gestion de l'état ouvert / fermé ──
  const trigger  = wrap.querySelector(".bm-trigger");
  const backdrop = wrap.querySelector(".bm-backdrop");
  const closeBtn = wrap.querySelector(".bm-close-btn");

  function openMenu() {
    wrap.classList.add("bm-open");
    trigger.setAttribute("aria-expanded", "true");
    if (window.innerWidth <= 600) {
      document.body.classList.add("bm-locked");
    }
  }

  function closeMenu() {
    wrap.classList.remove("bm-open");
    trigger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("bm-locked");
  }

  trigger.addEventListener("click", e => {
    e.stopPropagation();
    const isOpen = wrap.classList.contains("bm-open");
    if (isOpen) closeMenu();
    else openMenu();
  });

  if (backdrop) backdrop.addEventListener("click", closeMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  document.addEventListener("click", e => {
    if (!wrap.contains(e.target)) closeMenu();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeMenu();
  });

  wrap.querySelector(".bm-dropdown").addEventListener("click", e => {
    if (e.target.closest(".bm-link")) {
      closeMenu();
    }
    e.stopPropagation();
  });
})();
