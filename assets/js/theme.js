// Apply the cached account preference before the page is painted.
(() => {
  const configUrl = new URL('../json/firebase.json', document.currentScript.src).href;
  const valid = value => value === 'light' || value === 'dark';
  const user = () => sessionStorage.getItem('auth') ? sessionStorage.getItem('username') : null;
  const cacheKey = username => `theme_${username}`;
  let revision = 0;
  let current = 'dark';
  function cached(username) {
    try { return localStorage.getItem(cacheKey(username)); } catch { return null; }
  }
  function apply(value) {
    current = valid(value) ? value : 'dark';
    document.documentElement.dataset.theme = current;
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.content = current === 'light' ? '#f6f7f9' : '#080808';
    });
    window.dispatchEvent(new CustomEvent('themechange', { detail: current }));
  }
  function remember(username, value) {
    apply(value);
    try { localStorage.setItem(cacheKey(username), current); } catch { /* The database remains authoritative. */ }
  }
  async function endpoint(username) {
    const config = await (await TodoRuntime.fetch(configUrl)).json();
    if (!config.url) throw new Error('Firebase non configuré.');
    return `${config.url.replace(/\/$/, '')}/users/${encodeURIComponent(username)}/theme.json`;
  }
  async function load() {
    const username = user();
    if (!username) return current;
    const started = revision;
    try {
      const value = await (await TodoRuntime.fetch(await endpoint(username))).json();
      if (started === revision && username === user()) remember(username, valid(value) ? value : 'dark');
    } catch { /* Keep the last saved appearance when offline. */ }
    return current;
  }
  async function save(value) {
    const username = user();
    if (!username || !valid(value)) throw new Error('Préférence indisponible.');
    revision++;
    await TodoRuntime.fetch(await endpoint(username), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value)
    });
    if (username === user()) remember(username, value);
  }
  window.TodoTheme = {
    get: () => current, save,
    // Called only after successful authentication with the account's data.
    accept(username, value) { revision++; remember(username, valid(value) ? value : 'dark'); }
  };
  apply(user() ? cached(user()) : 'dark');
  document.addEventListener('DOMContentLoaded', () => {
    apply(current);
    TodoTheme.ready = load();
  });
})();
