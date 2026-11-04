// ══════════════════════════════════════════
//  BURGER-MENU.JS — Menu Vertical Responsive
// ══════════════════════════════════════════

(function () {
  const path    = window.location.pathname.split("/").pop() || "index.html";
  const isRoot  = !window.location.pathname.includes("/pages/") && !window.location.pathname.includes("/html/");

  const LINKS = [
    { href: isRoot ? "./index.html"              : "../index.html",       label: "Accueil", key: "index.html"        },
    { href: isRoot ? "./pages/app-v2.html"       : "./app-v2.html",       label: "Application", key: "app-v2.html"       },
    { href: isRoot ? "./pages/calendar.html"     : "./calendar.html",     label: "Calendrier", key: "calendar.html"     },
    { href: isRoot ? "./pages/settings.html"     : "./settings.html",     label: "Paramètres",  key: "settings.html"     },
    { href: isRoot ? "./pages/donnees.html"      : "./donnees.html",      label: "Mes Données", key: "donnees.html"      },
    { href: isRoot ? "./pages/commentaires.html" : "./commentaires.html", label: "Commentaires", key: "commentaires.html"  },
    { href: isRoot ? "./pages/apropos.html"      : "./apropos.html",      label: "À propos",  key: "apropos.html"      },
    { href: isRoot ? "./pages/confidentialite.html" : "./confidentialite.html", label: "Confidentialité", key: "confidentialite.html" },
    { href: isRoot ? "./pages/mentions-legales.html" : "./mentions-legales.html", label: "Mentions Légales", key: "mentions-legales.html" },
    { href: isRoot ? "./pages/cgu.html"          : "./cgu.html",          label: "CGU", key: "cgu.html"           },
    { href: isRoot ? "./pages/developpeur.html"  : "./developpeur.html",  label: "Développeur",  key: "developpeur.html"   },
  ];

  // ── HTML ──
  const linksHtml = LINKS.map(l => {
    const active = path === l.key ? "bm-active" : "";
    return `<a href="${l.href}" class="bm-link ${active}"${active ? ' aria-current="page"' : ""}>
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
  const dropdown = wrap.querySelector(".bm-dropdown");

  function openMenu() {
    wrap.classList.add("bm-open");
    trigger.setAttribute("aria-expanded", "true");
    if (window.innerWidth <= 600) {
      document.body.classList.add("bm-locked");
    }
    dropdown.querySelector(".bm-link")?.focus();
  }

  function closeMenu() {
    const restoreFocus = dropdown.contains(document.activeElement);
    wrap.classList.remove("bm-open");
    trigger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("bm-locked");
    if (restoreFocus) trigger.focus({ preventScroll: true });
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
    if (!wrap.classList.contains("bm-open")) return;
    if (e.key === "Escape") { e.preventDefault(); closeMenu(); }
    if (e.key === "Tab" && window.innerWidth <= 600) {
      const controls = [...dropdown.querySelectorAll("button,a")].filter(el => el.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  wrap.querySelector(".bm-dropdown").addEventListener("click", e => {
    if (e.target.closest(".bm-link")) {
      closeMenu();
    }
    e.stopPropagation();
  });
})();
