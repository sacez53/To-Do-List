// N02: keep keyboard routing separate from task creation and persistence.
window.QuickCaptureKeys = {
  action(event, enabled, target, dialogOpen) {
    if (!enabled || dialogOpen || event.defaultPrevented || event.repeat || event.isComposing || event.keyCode === 229 || event.ctrlKey || event.metaKey || event.altKey) return null;
    if (target?.isContentEditable || target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')) return null;
    if (event.key === "?") return "help";
    if (event.key?.toLowerCase() === "n") return event.shiftKey ? "full" : "quick";
    return null;
  }
};
