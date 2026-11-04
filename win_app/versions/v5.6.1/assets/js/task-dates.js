// Calendar dates always refer to the user's local day, never a UTC slice.
window.TaskDates = (() => {
  const pad = number => String(number).padStart(2, "0");
  function day(date = new Date()) {
    return `${String(date.getFullYear()).padStart(4, "0")}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  function tomorrow(now = new Date()) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    return day(date);
  }
  function active(task) {
    return !task.archived && !["done", "cancelled"].includes(task.status);
  }
  function overdue(due, time, status, now = new Date()) {
    if (!due || ["done", "cancelled"].includes(status)) return false;
    const today = day(now);
    if (due !== today) return due < today;
    return !!time && new Date(`${due}T${time}:00`).getTime() <= now.getTime();
  }
  function matches(task, scope, now = new Date()) {
    if (task.archived) return false;
    if (scope === "all") return true;
    if (!active(task) || !task.due) return false;
    return scope === "today" ? task.due <= day(now) : scope === "upcoming" && task.due > day(now);
  }
  function compare(a, b) {
    if (!a.due || !b.due) return Number(!a.due) - Number(!b.due);
    return a.due.localeCompare(b.due) || (a.dueTime || "23:59:59").localeCompare(b.dueTime || "23:59:59");
  }
  function nextTick(now = new Date()) {
    // Recompute at each local minute, including midnight and DST transitions.
    return 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 20;
  }
  return { day, tomorrow, active, overdue, matches, compare, nextTick };
})();
