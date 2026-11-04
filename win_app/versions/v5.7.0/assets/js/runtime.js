// Shared error handling. An HTTP error must never be reported as a successful save.
window.TodoRuntime = {
  async fetch(url, options = {}) {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), ...options, cache: "no-store" });
    if (!response.ok) {
      const en = document.documentElement.lang === "en";
      const error = new Error((en ? "Request failed (HTTP " : "Échec de la requête (HTTP ") + response.status + ").");
      error.status = response.status;
      throw error;
    }
    return response;
  },
  message(fr, en) { return document.documentElement.lang === "en" ? en : fr; },
  safePage(value, fallback) {
    return /^(app(?:-v2)?|calendar|settings|donnees|commentaires)\.html$/.test(value || "") ? "./" + value : fallback;
  }
};
