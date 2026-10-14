// ═══════════════════════════════════════════════════════
//  TRANSITIONS.JS
//  Transitions fluides entre les pages.
//  À charger en <head> sur chaque page du site.
// ═══════════════════════════════════════════════════════

(function () {
  'use strict';

  /* ── Styles de l'overlay ── */
  const style = document.createElement('style');
  style.textContent = `
    #pt-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: #080808;
      opacity: 1;
      pointer-events: all;
      transition: opacity 300ms ease;
      will-change: opacity;
    }
    #pt-overlay.pt-visible { opacity: 1; pointer-events: all; }
    #pt-overlay.pt-hidden  { opacity: 0; pointer-events: none; }
  `;
  document.head.appendChild(style);

  /* ── Overlay ── */
  const overlay = document.createElement('div');
  overlay.id = 'pt-overlay';
  // Ajout direct sur <html> pour être au-dessus de tout
  document.documentElement.appendChild(overlay);

  /* ── Garde : éviter les doubles navigations ── */
  let navigating = false;

  /* ── Entrée : fondu de disparition de l'overlay ── */
  function pageEnter() {
    // Double rAF pour forcer le reflow et déclencher la transition CSS
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('pt-hidden');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pageEnter);
  } else {
    pageEnter();
  }

  /* ── Sortie : fondu vers le noir puis navigation ── */
  function navigateTo(url, delay) {
    if (navigating) return;
    navigating = true;
    delay = delay !== undefined ? delay : 320;

    overlay.classList.remove('pt-hidden');
    overlay.classList.add('pt-visible');

    setTimeout(function () {
      window.location.href = url;
    }, delay);
  }

  /* ── API publique ── */
  window.transitionTo = navigateTo;

  /* ── Interception des clics sur les liens internes ── */
  document.addEventListener('click', function (e) {
    // Remonte jusqu'à un <a>
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href) return;

    // Ignorer : ancres, mailto/tel, target="_blank", téléchargements
    if (
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      link.target === '_blank' ||
      link.hasAttribute('download')
    ) return;

    // Ignorer les URLs externes
    try {
      var resolved = new URL(href, window.location.href);
      if (resolved.origin !== window.location.origin) return;
    } catch (_) { return; }

    e.preventDefault();
    navigateTo(link.href);
  }, true); // capture pour intercepter avant tout autre handler

})();
