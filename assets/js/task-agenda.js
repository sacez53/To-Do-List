// Calendar copies are built locally; no account or encryption key is shared.
window.TaskAgenda = (() => {
  const compact = value => value.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  function event(task, date = task.due, time = task.dueTime) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("date");
    const start = new Date(`${date}T${time || "00:00"}:00`);
    const localDay = d => `${String(d.getFullYear()).padStart(4, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!Number.isFinite(start.getTime()) || localDay(start) !== date || (time && (!/^\d{2}:\d{2}$/.test(time) || start.getHours() !== Number(time.slice(0, 2)) || start.getMinutes() !== Number(time.slice(3))))) throw new Error("date");
    const end = new Date(start);
    if (time) end.setTime(start.getTime() + 60 * 60 * 1000);
    else end.setDate(end.getDate() + 1);
    return { title: String(task.text || ""), notes: String(task.notes || ""), id: String(task.id), allDay: !time,
      start: time ? start.toISOString() : date, end: time ? end.toISOString() : localDay(end) };
  }
  function links(item) {
    const google = new URL("https://calendar.google.com/calendar/render");
    google.search = new URLSearchParams({ action: "TEMPLATE", text: item.title, details: item.notes, dates: `${compact(item.start)}/${compact(item.end)}` });
    const outlook = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
    const html = text => text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])).replace(/\r?\n/g, "<br>");
    outlook.search = new URLSearchParams({ path: "/calendar/action/compose", rru: "addevent", subject: item.title, body: html(item.notes), startdt: item.start, enddt: item.end, allday: String(item.allDay) });
    return { google: google.href, outlook: outlook.href };
  }
  function ics(item, now = new Date()) {
    const escape = value => value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
    // Fold by UTF-8 octets without splitting a Unicode code point (RFC 5545).
    const fold = line => {
      let result = "", bytes = 0;
      for (const char of line) {
        const size = new TextEncoder().encode(char).length;
        if (bytes + size > 75) { result += "\r\n "; bytes = 1; }
        result += char; bytes += size;
      }
      return result;
    };
    const type = item.allDay ? ";VALUE=DATE" : "";
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ma To-Do List//Agenda//FR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      `UID:${encodeURIComponent(item.id)}@todo-list.local`, `DTSTAMP:${compact(now.toISOString())}`,
      `DTSTART${type}:${compact(item.start)}`, `DTEND${type}:${compact(item.end)}`,
      `SUMMARY:${escape(item.title)}`, `DESCRIPTION:${escape(item.notes)}`, "END:VEVENT", "END:VCALENDAR"].map(fold).join("\r\n") + "\r\n";
  }
  return { event, links, ics };
})();
