const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const todoCountEl = document.getElementById("todo-count");
const doneCountEl = document.getElementById("done-count");
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
    created: new Date().toISOString()
  };

  todos.push(todo);
  saveTodos();
  render();
  input.value = "";
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

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function render() {
  list.innerHTML = "";
  
  todos.forEach(todo => {
    if (currentFilter === "active" && todo.done) return;
    if (currentFilter === "done" && !todo.done) return;

    const li = document.createElement("li");
    li.className = `todo-item ${currentFilter !== "all" ? "" : ""}`;
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

    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      saveTodos();
      render();
    });

    left.appendChild(checkbox);
    left.appendChild(span);

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
  todoCountEl.textContent = `${total} tâches`;
  doneCountEl.textContent = `${done} terminées`;
}

// Charge les tâches au démarrage
render();