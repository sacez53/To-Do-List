/* Optional Web Push. This module does not change account authentication. */
window.TodoPush = (() => {
  const scriptUrl = document.currentScript.src;
  const storageKey = 'todo_push_device_v1';
  let configPromise, syncTimer, busy = false, queuedTasks, lastProjection;
  const language = () => typeof getLanguage === 'function' ? getLanguage() : 'fr';
  const label = key => typeof t === 'function' ? t(key) : key;
  function device() { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch (_) { return null; } }
  function reason() {
    if (location.protocol === 'file:' || /electron/i.test(navigator.userAgent)) return 'push_unsupported';
    return TodoPushModel.support({ secure: window.isSecureContext, ios: /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1), standalone: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true, serviceWorker: 'serviceWorker' in navigator, pushManager: 'PushManager' in window, notifications: 'Notification' in window });
  }
  async function config() {
    if (!configPromise) configPromise = fetch(new URL('../json/push.json', scriptUrl), { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error(label('push_config'));
      const value = await response.json();
      if (!value.apiBaseUrl) throw new Error(label('push_config'));
      const url = new URL(value.apiBaseUrl);
      if (url.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(url.hostname)) throw new Error(label('push_https'));
      return { apiBaseUrl: url.href.replace(/\/$/, '') };
    }).catch(error => { configPromise = null; throw error; });
    return configPromise;
  }
  function bytes(value) { return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')), char => char.charCodeAt(0)); }
  function base64url(value) { return btoa(String.fromCharCode(...value)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
  async function owner() {
    const raw = sessionStorage.getItem('encKey');
    if (!raw || !sessionStorage.getItem('username')) throw new Error(label('push_signin'));
    // Domain-separated capability: the original task encryption key never leaves
    // the browser. The push service has no access to the Firebase account.
    const key = await crypto.subtle.importKey('raw', bytes(raw), { name:'HMAC',hash:'SHA-256' }, false, ['sign']);
    return base64url(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('todo-list:web-push:v1'))));
  }
  async function api(path, body, options = {}) {
    const cfg = await config();
    const headers = { 'Content-Type':'application/json' };
    if (!options.public) headers.Authorization = 'Bearer ' + await owner();
    if (options.deviceKey) headers['X-Device-Key'] = options.deviceKey;
    const response = await fetch(cfg.apiBaseUrl + path, { method: options.method || 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body), cache:'no-store', signal: AbortSignal.timeout(12000) });
    if (!response.ok) {
      const error = new Error(label(response.status === 410 ? 'push_expired' : response.status === 429 ? 'push_rate' : 'push_error'));
      error.status = response.status; throw error;
    }
    return response.status === 204 ? {} : response.json();
  }
  async function registration() {
    const result = await navigator.serviceWorker.register(new URL('../../sw.js',scriptUrl), { scope: new URL('../../',scriptUrl).pathname });
    if (!result.active) await Promise.race([navigator.serviceWorker.ready, new Promise((_,reject) => setTimeout(() => reject(new Error(label('push_error'))),15000))]);
    return result;
  }
  const setStatus = (key, error = false) => {
    const el = document.getElementById('push-status');
    if (el) { el.textContent = label(key); el.dataset.state = error ? 'error' : 'info';el.dataset.key=key; }
    const testButton=document.getElementById('push-test');
    if (testButton && ['push_enabled','push_disabled','push_disabled_cleanup'].includes(key)) testButton.disabled=key!=='push_enabled' || !!reason();
  };
  async function enable() {
    const unsupported = reason(); if (unsupported) throw new Error(label(unsupported));
    // Called directly by the user's click, before any network await (iOS).
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error(label('push_denied'));
    const [{ publicKey }, reg] = await Promise.all([api('/config',undefined,{ public:true,method:'GET' }),registration()]);
    let subscription = await reg.pushManager.getSubscription();
    if (subscription && base64url(new Uint8Array(subscription.options.applicationServerKey || [])) !== publicKey) { await subscription.unsubscribe(); subscription = null; }
    if (!subscription) subscription = await reg.pushManager.subscribe({ userVisibleOnly:true,applicationServerKey:bytes(publicKey) });
    const saved = device() || { id:crypto.randomUUID(), key:base64url(crypto.getRandomValues(new Uint8Array(32))) };
    // Retain recovery credentials even if registration fails after subscribe().
    localStorage.setItem(storageKey,JSON.stringify({ ...saved, enabled:false }));
    await api('/subscriptions',{ id:saved.id,subscription:subscription.toJSON(),lang:language() },{ deviceKey:saved.key });
    localStorage.setItem(storageKey,JSON.stringify({ ...saved,enabled:true,user:sessionStorage.getItem('username') }));
    lastProjection = null;
    await flush(await freshTasks());
    setStatus('push_enabled');
  }
  async function disable() {
    const saved = device();
    // Revoke the browser subscription first, so opting out still works offline.
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration(new URL('../../',scriptUrl));
      const subscription = await reg?.pushManager.getSubscription();
      if (subscription && !await subscription.unsubscribe()) throw new Error(label('push_error'));
    }
    if (saved) {
      try { await api('/subscriptions/' + encodeURIComponent(saved.id),undefined,{ method:'DELETE',deviceKey:saved.key,public:true }); }
      catch (_) { localStorage.setItem(storageKey,JSON.stringify({...saved,enabled:false}));lastProjection=null;setStatus('push_disabled_cleanup');return; }
    }
    localStorage.removeItem(storageKey); lastProjection = null; setStatus('push_disabled');
  }
  function readTasks() {
    try { return JSON.parse(localStorage.getItem('todos_' + sessionStorage.getItem('username')) || '[]'); } catch (_) { return []; }
  }
  async function freshTasks() {
    const fail = () => new Error(label('push_sync_error'));
    const response = await fetch(new URL('../json/firebase.json',scriptUrl),{cache:'no-store'});
    if (!response.ok) throw fail();
    const cfg=await response.json(),user=sessionStorage.getItem('username');
    if (!cfg.url || !user) throw fail();
    const result=await fetch(cfg.url.replace(/\/$/,'')+'/users/'+encodeURIComponent(user)+'/todos.json',{cache:'no-store'});
    if (!result.ok) throw fail();
    const value=await result.json();
    if (value===null) return [];
    const tasks=isEncrypted(value) ? await decryptData(value,await importKey(sessionStorage.getItem('encKey'))) : Array.isArray(value) ? value : Object.values(value);
    if (!Array.isArray(tasks) || tasks.some(task => !task || typeof task!=='object')) throw fail();
    return tasks;
  }
  async function flush(tasks) {
    if (busy) { queuedTasks = tasks; return; }
    if (!sessionStorage.getItem('encKey')) return;
    busy = true;
    try {
      const reminders = TodoPushModel.reminders(tasks);
      if (reminders.length > 200) throw new Error(label('push_limit'));
      const projection = JSON.stringify(reminders);
      if (projection === lastProjection) return;
      await api('/schedule',{ reminders });
      lastProjection = projection;
      if (document.getElementById('push-status') && device()?.enabled) setStatus('push_enabled');
    } finally {
      busy = false;
      if (queuedTasks) { const next = queuedTasks; queuedTasks = null; void flush(next).catch(() => setStatus('push_sync_error',true)); }
    }
  }
  function sync(tasks) {
    clearTimeout(syncTimer);
    // Debounce metadata only; do not postpone the application's task saving.
    syncTimer = setTimeout(() => flush(tasks).catch(() => setStatus('push_sync_error',true)),1000);
  }
  async function test() {
    const saved = device(); if (!saved?.enabled) throw new Error(label('push_enable_first'));
    await api('/test',{ id:saved.id },{ deviceKey:saved.key }); setStatus('push_test_sent');
  }
  async function clearAccount() {
    await api('/account',undefined,{method:'DELETE'});
    localStorage.removeItem(storageKey);lastProjection=null;setStatus('push_disabled');
  }
  function renameLocalUser(previous,next) {
    const saved=device();
    if(saved?.user===previous)localStorage.setItem(storageKey,JSON.stringify({...saved,user:next}));
  }
  async function mount() {
    const unsupported = reason();
    if (document.getElementById('push-enable')) {
      document.getElementById('push-enable').disabled=true; document.getElementById('push-test').disabled=true;
      for (const [id,action] of [['push-enable',enable],['push-disable',disable],['push-test',test]]) {
        document.getElementById(id).addEventListener('click', async event => {
          const button=event.currentTarget; button.disabled=true;
          try { await action(); } catch (error) { const el=document.getElementById('push-status');el.textContent=error.message;el.dataset.state='error'; }
          finally { button.disabled=false; }
        });
      }
      if (unsupported) { setStatus(unsupported); document.getElementById('push-enable').disabled=true; document.getElementById('push-test').disabled=true; }
      else {
        try {
          await config(); document.getElementById('push-enable').disabled=false;
          const saved=device();
          setStatus(saved?.enabled && saved.user !== sessionStorage.getItem('username') ? 'push_other_account' : saved?.enabled && Notification.permission === 'granted' ? 'push_enabled' : 'push_disabled');
        }
        catch (error) { document.getElementById('push-status').textContent=error.message; document.getElementById('push-enable').disabled=true; document.getElementById('push-test').disabled=true; }
      }
    }
    if (device()?.enabled && device().user === sessionStorage.getItem('username') && !unsupported && Notification.permission === 'granted') {
      try {
        const reg=await registration(), subscription=await reg.pushManager.getSubscription();
        if (subscription) { const saved=device();await api('/subscriptions',{ id:saved.id,subscription:subscription.toJSON(),lang:language() },{ deviceKey:saved.key }); }
        else setStatus('push_expired',true);
      } catch (_) { setStatus('push_sync_error',true); }
    }
    // The tasks page publishes its loaded state. Settings must read Firebase
    // before replacing schedules: a new device may have an empty local cache.
    if (document.getElementById('push-enable') && sessionStorage.getItem('encKey')) {
      try { sync(await freshTasks()); } catch (_) { /* Keep the existing schedule. */ }
    }
  }
  window.addEventListener('todoTasksChanged',event => sync(event.detail));
  window.addEventListener('online',async () => { lastProjection=null;try { sync(document.getElementById('v2-board') ? readTasks() : await freshTasks()); } catch (_) { setStatus('push_sync_error',true); } });
  window.addEventListener('languageChanged',async () => {
    const el=document.getElementById('push-status');if(el?.dataset.key)setStatus(el.dataset.key,el.dataset.state==='error');
    const saved=device();
    if(saved?.enabled && saved.user===sessionStorage.getItem('username') && !reason()) {
      try { const reg=await navigator.serviceWorker.getRegistration(new URL('../../',scriptUrl));const subscription=await reg?.pushManager.getSubscription();if(subscription)await api('/subscriptions',{id:saved.id,subscription:subscription.toJSON(),lang:language()},{deviceKey:saved.key}); } catch(_) { setStatus('push_sync_error',true); }
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount); else mount();
  return { enable,disable,test,sync,owner,clearAccount,renameLocalUser };
})();
