/* Shared, dependency-free reminder projection. Never includes titles or notes. */
(function (root) {
  function reminders(tasks, now = Date.now()) {
    if (!Array.isArray(tasks)) return [];
    return tasks.filter(task => task && !task.archived && !['done', 'cancelled'].includes(task.status)).flatMap(task => {
      if (task.id == null || String(task.id).length === 0) return [];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(task.due || '')) return [];
      const time = task.dueTime || '09:00';
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return [];
      const date = new Date(`${task.due}T${time}:00`);
      const dueAt = date.getTime();
      if (!Number.isFinite(dueAt) || date.getFullYear() !== Number(task.due.slice(0,4)) || date.getMonth() + 1 !== Number(task.due.slice(5,7)) || date.getDate() !== Number(task.due.slice(8,10)) || dueAt < now - 15 * 60000) return [];
      return [{ taskId: String(task.id), dueAt }];
    }).sort((a,b) => a.dueAt - b.dueAt);
  }
  function support(env) {
    if (!env.secure) return 'push_https';
    if (env.ios && !env.standalone) return 'push_ios_install';
    if (!env.serviceWorker || !env.pushManager || !env.notifications) return 'push_unsupported';
    return null;
  }
  const model = { reminders, support };
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  else root.TodoPushModel = model;
})(typeof globalThis === 'undefined' ? this : globalThis);
