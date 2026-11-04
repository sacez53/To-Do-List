// Focus management for all existing overlay dialogs, including timeout dialogs.
(() => {
  let active = null, trigger = null;
  const controls = el => [...el.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')]
    .filter(node => node.getClientRects().length);
  function update() {
    const next = [...document.querySelectorAll('.modal-overlay.open,.modal-overlay.active,#timeout-overlay')].pop() || null;
    if (next === active) return;
    if (next) {
      if (!active) trigger = document.activeElement;
      active = next;
      next.setAttribute('role', next.getAttribute('role') || 'dialog');
      next.setAttribute('aria-modal', 'true');
      const heading = next.querySelector('h2');
      if (heading) { heading.id ||= 'dialog-heading-' + Math.random().toString(36).slice(2); next.setAttribute('aria-labelledby', heading.id); }
      (controls(next)[0] || next).focus();
    } else {
      active = null;
      if (trigger?.isConnected) trigger.focus();
      else document.getElementById('v2-fab')?.focus();
      trigger = null;
    }
    document.body.classList.toggle('modal-open', !!next);
  }
  document.addEventListener('keydown', event => {
    if (!active || event.key !== 'Tab') return;
    const list = controls(active);
    if (!list.length) { event.preventDefault(); return; }
    const first = list[0], last = list[list.length - 1];
    if (event.shiftKey && (document.activeElement === first || !active.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !active.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('focusin', event => { if (active && !active.contains(event.target)) controls(active)[0]?.focus(); });
  document.addEventListener('DOMContentLoaded', () => { new MutationObserver(update).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] }); update(); });
})();
