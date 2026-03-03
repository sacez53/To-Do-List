const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addTodo(text);
  input.value = "";
  input.focus();
});

function addTodo(text) {
  const li = document.createElement("li");
  li.className = "todo-item";

  const left = document.createElement("div");
  left.className = "todo-left";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "todo-checkbox";

  const span = document.createElement("span");
  span.className = "todo-text";
  span.textContent = text;

  checkbox.addEventListener("change", () => {
    span.classList.toggle("done", checkbox.checked);
  });

  left.appendChild(checkbox);
  left.appendChild(span);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "todo-delete";
  deleteBtn.textContent = "Supprimer";

  deleteBtn.addEventListener("click", () => {
    li.remove();
  });

  li.appendChild(left);
  li.appendChild(deleteBtn);

  list.appendChild(li);
}
