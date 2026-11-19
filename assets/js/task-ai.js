// Only the configured application server receives requests. No Gemini key in the browser.
(typeof window !== "undefined" ? window : globalThis).TaskAI = (() => {
  function validate(value) {
    if (!value || typeof value.text !== "string" || !value.text.trim() || value.text.length > 500 ||
        typeof value.notes !== "string" || value.notes.length > 8000 ||
        !["low", "normal", "high"].includes(value.priority) ||
        !Array.isArray(value.subtasks) || value.subtasks.length > 30 ||
        value.subtasks.some(s => typeof s !== "string" || !s.trim() || s.length > 300)) throw new Error("invalid");
    if (value.due !== null) {
      if (typeof value.due !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.due) ||
          !Number.isFinite(Date.parse(value.due)) || new Date(value.due).toISOString().slice(0, 10) !== value.due) throw new Error("invalid");
    }
    if (value.dueTime !== null && (typeof value.dueTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.dueTime) || !value.due)) throw new Error("invalid");
    return { text: value.text.trim(), notes: value.notes, priority: value.priority, due: value.due,
      dueTime: value.dueTime, subtasks: [...new Set(value.subtasks.map(s => s.trim()))] };
  }
  async function propose(payload, code, signal) {
    const config = await (await TodoRuntime.fetch("../assets/json/ai.json", { signal })).json();
    if (!config.endpoint) throw new Error("unconfigured");
    const endpoint = new URL(config.endpoint, location.href);
    if (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && ["localhost", "127.0.0.1"].includes(endpoint.hostname))) throw new Error("unconfigured");
    const response = await fetch(endpoint, { method: "POST", signal, cache: "no-store", credentials: "omit",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${code}` }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error([401, 403, 429, 503].includes(response.status) ? String(response.status) : "request");
    try { return validate(await response.json()); } catch (_) { throw new Error("invalid"); }
  }
  return { validate, propose };
})();
