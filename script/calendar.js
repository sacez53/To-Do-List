// ══════════════════════════════════════════════════════
//  CALENDAR.JS
// ══════════════════════════════════════════════════════

// ─── Session ───────────────────────────────────────────
let currentUser = sessionStorage.getItem("username") || "";
const userLabel = document.getElementById("user-label");
if (userLabel) userLabel.textContent = currentUser;

// ─── Variables d'état ──────────────────────────────────
let todos = JSON.parse(localStorage.getItem(`todos_${currentUser}`)) || [];
let currentCalendarDate = new Date();
let selectedCalendarDate = null;
let calendarViewType = localStorage.getItem(`calendarView_${currentUser}`) || "grid";

// ─── Références DOM ────────────────────────────────────
const calendarPrev       = document.getElementById("calendar-prev");
const calendarNext       = document.getElementById("calendar-next");
const calendarHeading    = document.getElementById("calendar-heading");
const calendarGrid       = document.getElementById("calendar-grid");

const calendarViewGridBtn    = document.getElementById("calendar-view-grid");
const calendarViewPlanBtn    = document.getElementById("calendar-view-planning");
const calendarGridContainer  = document.getElementById("calendar-grid-container");
const calendarPlanContainer  = document.getElementById("calendar-planning-container");
const calendarPlanningList   = document.getElementById("calendar-planning-list");

// ─── Utilitaires ───────────────────────────────────────
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Lundi = 0
}
function getStatusInfo(status) {
  switch(status) {
    case "done":       return { icon: "✓" };
    case "in-progress":return { icon: "↻" };
    default:           return { icon: "○" };
  }
}

// ─── Logique d'affichage ───────────────────────────────
function updateCalendarView() {
  if (calendarViewType === "grid") {
    calendarGridContainer.style.display = "block";
    calendarPlanContainer.style.display = "none";
    calendarViewGridBtn.classList.add("active");
    calendarViewPlanBtn.classList.remove("active");
    renderCalendarGrid();
  } else {
    calendarGridContainer.style.display = "none";
    calendarPlanContainer.style.display = "block";
    calendarViewGridBtn.classList.remove("active");
    calendarViewPlanBtn.classList.add("active");
    renderPlanning();
  }
}

function renderPlanning() {
  calendarPlanningList.innerHTML = "";
  
  const planningTasks = todos.filter(t => t.due && t.status !== "done" && t.status !== "cancelled");
  
  if (planningTasks.length === 0) {
    calendarPlanningList.innerHTML = "<p style='text-align:center; color:var(--text-faint); margin-top:2rem;'>Aucune tâche planifiée.</p>";
    return;
  }
  
  planningTasks.sort((a, b) => new Date(a.due) - new Date(b.due));
  
  const groupedTasks = {};
  planningTasks.forEach(t => {
    if (!groupedTasks[t.due]) groupedTasks[t.due] = [];
    groupedTasks[t.due].push(t);
  });
  
  const todayZero = new Date(); todayZero.setHours(0,0,0,0);
  const todayStr = `${todayZero.getFullYear()}-${String(todayZero.getMonth() + 1).padStart(2, '0')}-${String(todayZero.getDate()).padStart(2, '0')}`;
  
  Object.keys(groupedTasks).forEach(dateStr => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "planning-date-group";
    
    const header = document.createElement("div");
    header.className = "planning-date-header";
    
    const d = new Date(dateStr + "T00:00:00");
    const isOverdue = (d - todayZero) < 0;
    const isToday = dateStr === todayStr;
    
    if (isOverdue) header.classList.add("overdue");
    if (isToday) header.classList.add("today");
    
    const displayDate = d.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });
    header.textContent = isToday ? `Aujourd'hui (${displayDate})` : (isOverdue ? `En retard (${displayDate})` : displayDate);
    
    groupDiv.appendChild(header);
    
    const ul = document.createElement("ul");
    ul.className = "calendar-tasks-list";
    
    groupedTasks[dateStr].forEach(t => {
      const li = document.createElement("li");
      const info = getStatusInfo(t.status);
      li.innerHTML = `<span>${info.icon}</span> <span>${t.text}</span>`;
      
      li.style.cursor = "pointer";
      li.addEventListener("click", () => {
        // Redirige vers app.html et ouvre la modale
        window.location.href = `app.html?editTask=${t.id}`;
      });
      
      ul.appendChild(li);
    });
    
    groupDiv.appendChild(ul);
    calendarPlanningList.appendChild(groupDiv);
  });
}

function renderCalendarGrid() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  calendarHeading.textContent = `${monthNames[month]} ${year}`;
  
  calendarGrid.innerHTML = "";
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Cellules du mois précédent
  for (let i = 0; i < firstDay; i++) {
    const d = daysInPrevMonth - firstDay + i + 1;
    const cell = document.createElement("div");
    cell.className = "calendar-cell other-month";
    cell.textContent = d;
    calendarGrid.appendChild(cell);
  }
  
  // Cellules du mois en cours
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    cell.textContent = i;
    
    if (dateStr === todayStr) {
      cell.classList.add("today");
    }
    
    const dayTasks = todos.filter(t => t.due === dateStr && t.status !== "done" && t.status !== "cancelled");
    if (dayTasks.length > 0) {
      cell.classList.add("has-tasks");
      const dot = document.createElement("div");
      dot.className = "calendar-task-dot";
      
      const isOverdue = dayTasks.some(t => {
        const d = new Date(t.due + "T00:00:00");
        const todayZero = new Date(); todayZero.setHours(0,0,0,0);
        return (d - todayZero) < 0;
      });
      if (isOverdue) cell.classList.add("has-overdue");
      
      cell.appendChild(dot);
    }
    
    cell.addEventListener("click", () => {
      // Sur la vue distincte, au lieu d'afficher une petite liste sous le calendrier,
      // on peut rediriger vers le planning pour cette date, ou ouvrir un panel,
      // ou simplement ne rien faire de spécial et laisser la vue planning s'en charger.
      // Option: basculer en vue planning au clic sur une date avec tâches.
      if (dayTasks.length > 0) {
        calendarViewType = "planning";
        localStorage.setItem(`calendarView_${currentUser}`, "planning");
        updateCalendarView();
        // Optionnel: scroller jusqu'à la date dans le planning.
      }
    });

    const tooltip = document.createElement("div");
    tooltip.className = "calendar-tooltip";
    if (dayTasks.length > 0) {
      let listHtml = `<ul style="list-style: none; padding: 0; margin: 0;">`;
      dayTasks.forEach(t => {
         const info = getStatusInfo(t.status);
         listHtml += `<li style="margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${info.icon} ${t.text}</li>`;
      });
      listHtml += `</ul>`;
      tooltip.innerHTML = listHtml;
    } else {
      tooltip.innerHTML = `<span style="color: var(--text-faint); font-style: italic;">Aucune tâche</span>`;
    }
    cell.appendChild(tooltip);
    
    calendarGrid.appendChild(cell);
  }
  
  // Cellules du mois suivant
  const totalCells = firstDay + daysInMonth;
  const nextMonthCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= nextMonthCells; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell other-month";
    cell.textContent = i;
    calendarGrid.appendChild(cell);
  }
}

// ─── Événements ────────────────────────────────────────
calendarViewGridBtn.addEventListener("click", () => {
  calendarViewType = "grid";
  localStorage.setItem(`calendarView_${currentUser}`, "grid");
  updateCalendarView();
});

calendarViewPlanBtn.addEventListener("click", () => {
  calendarViewType = "planning";
  localStorage.setItem(`calendarView_${currentUser}`, "planning");
  updateCalendarView();
});

calendarPrev.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderCalendarGrid();
});

calendarNext.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderCalendarGrid();
});

// Initialisation
updateCalendarView();
