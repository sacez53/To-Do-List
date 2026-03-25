const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const dueDateInput = document.getElementById("due-date");
const list = document.getElementById("todo-list");
const todoCountEl = document.getElementById("todo-count");
const doneCountEl = document.getElementById("done-count");
const overdueCountEl = document.getElementById("overdue-count");
const filterBtns = document.querySelectorAll(".filter-btn");

let todos = JSON.parse(localStorage.getItem("todos")) || [];
let currentFilter = "all";

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const todo = {
    id: Date.now(),
    text: text,
    done: false,
    dueDate: dueDateInput.value || null,
    created: new Date().toISOString()
  };

  todos.push(todo);
  saveTodos();
  render();
  form.reset();
  input.focus();
});

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    render();
  });
});

function getDateStatus(dueDate) {
  if (!dueDate) return "none";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  if (due < today) return "overdue";
  if (due.getTime() === today.getTime()) return "today";
  return "future";
}

function formatDate(dateStr) {
  if (!dateStr) return "Pas de date";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function render() {
  list.innerHTML = "";
  
  todos.forEach(todo => {
    // Filtres
    if (currentFilter === "active" && todo.done) return;
    if (currentFilter === "done" && !todo.done) return;
    if (currentFilter === "overdue" && !todo.done && getDateStatus(todo.dueDate) !== "overdue") return;

    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.id = todo.id;

    const left = document.createElement("div");
    left.className = "todo-left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.done;

    const span = document.createElement("span");
    span.className = `todo-text ${todo.done ? "done" : ""}`;
    span.textContent = todo.text;

    // Date d'échéance
    let dateEl = null;
    if (todo.dueDate) {
      dateEl = document.createElement("span");
      dateEl.className = `todo-date ${getDateStatus(todo.dueDate)}`;
      dateEl.textContent = formatDate(todo.dueDate);
    }

    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      saveTodos();
      render();
    });

    left.appendChild(checkbox);
    left.appendChild(span);
    if (dateEl) left.appendChild(dateEl);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "todo-delete";
    deleteBtn.textContent = "Supprimer";

    deleteBtn.addEventListener("click", () => {
      todos = todos.filter(t => t.id !== todo.id);
      saveTodos();
      render();
    });

    li.appendChild(left);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });

  updateCounters();
}

function updateCounters() {
  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  const overdue = todos.filter(t => !t.done && getDateStatus(t.dueDate) === "overdue").length;
  
  todoCountEl.textContent = `${total} tâches`;
  doneCountEl.textContent = `${done} terminées`;
  overdueCountEl.textContent = `${overdue} urgentes`;
}

// Initialise au chargement
render();