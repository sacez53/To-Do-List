// Encrypted local recovery state and conditional Firebase writes.
// The existing encrypted cloud array remains compatible with previous releases.
window.TodoData = (() => {
  const clone = value => JSON.parse(JSON.stringify(value));
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function normalize(value) {
    if (value == null) return [];
    const list = Array.isArray(value) ? value : Object.values(value);
    if (!list.every(t => t && t.id != null && typeof t.text === "string" && ["string", "number"].includes(typeof t.id))) throw new Error("Invalid task data");
    if (list.some(t => (t.due && !/^\d{4}-\d{2}-\d{2}$/.test(t.due)) ||
      (t.dueTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(t.dueTime)))) throw new Error("Invalid task date/time");
    if (new Set(list.map(t => String(t.id))).size !== list.length) throw new Error("Duplicate task IDs");
    return list.map(t => ({ ...t, status: t.status === "in-progress" ? "inprogress" :
      (["todo", "inprogress", "waiting", "done", "cancelled"].includes(t.status) ? t.status : "todo"),
      priority: ["high", "normal", "low"].includes(t.priority) ? t.priority : "normal",
      notes: typeof t.notes === "string" ? t.notes : "" }));
  }
  function merge(base, local, remote) {
    const byId = arr => new Map(arr.map(t => [String(t.id), t]));
    const b = byId(base), l = byId(local), r = byId(remote);
    for (const id of new Set([...b.keys(), ...l.keys()])) {
      if (equal(b.get(id), l.get(id))) continue;
      if (!equal(b.get(id), r.get(id)) && !equal(l.get(id), r.get(id))) {
        throw new Error(TodoRuntime.message("Conflit de synchronisation : vos changements sont conservés sur cet appareil. Exportez-les avant de poursuivre.", "Sync conflict: your changes are kept on this device. Export them before continuing."));
      }
      if (l.has(id)) r.set(id, l.get(id)); else r.delete(id);
    }
    return [...r.values()];
  }
  async function open(user) {
    const keyB64 = sessionStorage.getItem("encKey");
    if (!keyB64) throw new Error(TodoRuntime.message("Clé de chiffrement absente. Reconnectez-vous.", "Encryption key missing. Please sign in again."));
    const key = await importKey(keyB64);
    const storageKey = `todo_state_${user}`;
    let state = { base: [], local: [], pending: false };
    const saved = localStorage.getItem(storageKey);
    if (saved) state = await decryptData(JSON.parse(saved), key);
    else {
      const legacy = localStorage.getItem(`todos_${user}`);
      if (legacy) { state.local = normalize(JSON.parse(legacy)); state.pending = state.local.length > 0; }
    }
    state.base = normalize(state.base); state.local = normalize(state.local);
    let config = null, queue = Promise.resolve();
    let submitted = clone(state.local);
    async function persist(next) {
      if (equal(next, state) && localStorage.getItem(storageKey)) return;
      const encrypted = await encryptData(next, key);
      localStorage.setItem(storageKey, JSON.stringify(encrypted));
      localStorage.removeItem(`todos_${user}`);
      state = clone(next);
    }
    // Migrate old plaintext only after encrypted storage has succeeded.
    if (!saved) {
      const migrate = async () => {
        const existing = localStorage.getItem(storageKey);
        if (existing) state = await decryptData(JSON.parse(existing), key);
        else await persist(state);
      };
      if (navigator.locks) await navigator.locks.request(storageKey, migrate); else await migrate();
    }
    const serial = action => {
      const run = async () => {
        const latest = localStorage.getItem(storageKey);
        if (latest) state = await decryptData(JSON.parse(latest), key);
        return action();
      };
      const result = queue.then(() => navigator.locks ? navigator.locks.request(storageKey, run) : run());
      queue = result.catch(() => {});
      return result;
    };
    async function url() {
      if (!config) config = await (await TodoRuntime.fetch("../assets/json/firebase.json")).json();
      if (!config.url) throw new Error("Firebase non configuré");
      return config.url.replace(/\/$/, "") + "/users/" + encodeURIComponent(user) + ".json";
    }
    async function decode(value) {
      return normalize(isEncrypted(value) ? await decryptData(value, key) : value);
    }
    return {
      read: () => clone(state.local),
      pending: () => !!state.pending,
      save: tasks => {
        const snapshot = normalize(clone(tasks)), previous = clone(submitted);
        submitted = clone(snapshot);
        return serial(() => persist({ ...state, local: merge(previous, snapshot, state.local), pending: true }));
      },
      sync: () => serial(async () => {
        const before = clone(submitted);
        const endpoint = await url();
        for (let attempt = 0; attempt < 3; attempt++) {
          const response = await TodoRuntime.fetch(endpoint, { headers: { "X-Firebase-ETag": "true" } });
          const account = await response.json();
          if (!account || !account.password) throw new Error(TodoRuntime.message("Compte indisponible. Reconnectez-vous.", "Account unavailable. Sign in again."));
          // Never recreate a deleted account or overwrite data encrypted with a new password.
          const remote = await decode(account.todos);
          if (!state.pending) { await persist({ base: remote, local: remote, pending: false }); if (equal(submitted, before)) submitted = clone(remote); return clone(remote); }
          const combined = merge(state.base, state.local, remote);
          const etag = response.headers.get("ETag");
          if (!etag) throw new Error("Missing Firebase ETag");
          try {
            await TodoRuntime.fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json", "if-match": etag },
              body: JSON.stringify({ ...account, todos: await encryptData(combined, key) }) });
          } catch (error) { if (error.status === 412) continue; throw error; }
          await persist({ base: combined, local: combined, pending: false });
          if (equal(submitted, before)) submitted = clone(combined);
          return clone(combined);
        }
        throw new Error(TodoRuntime.message("Synchronisation occupée. Changements conservés localement.", "Sync busy. Changes kept locally."));
      })
    };
  }
  return { open, normalize, merge };
})();
