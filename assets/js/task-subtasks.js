// Manual subtasks. Saving remains owned by the task form.
let subtaskDraft = [];
const subtasksEditor = document.getElementById('subtasks-editor');
function subtaskValues() { return subtaskDraft.filter(s => s.text.trim()).map(s => ({ ...s, text: s.text.trim() })); }
function renderSubtasks() {
  subtasksEditor.replaceChildren();
  subtaskDraft.forEach((item, index) => {
    const row = document.createElement('div'); row.className = 'subtask-row';
    const check = document.createElement('input'); check.type = 'checkbox'; check.checked = item.done;
    check.setAttribute('aria-label', t('subtask_done', { number: index + 1 }));
    check.addEventListener('change', () => { item.done = check.checked; });
    const input = document.createElement('input'); input.type = 'text'; input.className = 'modal-input'; input.maxLength = 300;
    input.value = item.text; input.setAttribute('aria-label', t('subtask_title', { number: index + 1 }));
    input.addEventListener('input', () => { item.text = input.value; });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn-delete'; remove.textContent = t('btn_delete');
    remove.setAttribute('aria-label', t('subtask_remove', { number: index + 1 }));
    remove.addEventListener('click', () => { subtaskDraft.splice(index, 1); renderSubtasks(); (subtasksEditor.querySelectorAll('input[type=text]')[index] || document.getElementById('subtask-add')).focus(); });
    row.append(check, input, remove); subtasksEditor.append(row);
  });
  document.getElementById('subtask-add').disabled = subtaskDraft.length >= 30;
}
document.getElementById('subtask-add').addEventListener('click', () => {
  if (subtaskDraft.length >= 30 || modalSaving) return;
  subtaskDraft.push({ id: crypto.randomUUID(), text: '', done: false }); renderSubtasks();
  subtasksEditor.querySelectorAll('input[type=text]')[subtaskDraft.length - 1].focus();
});
function resetSubtasks(task = null) {
  subtaskDraft = (task?.subtasks || []).map(s => ({ ...s })); renderSubtasks();
  const recap = document.getElementById('recap-subtasks'); recap.replaceChildren();
  if (task?.subtasks?.length) {
    const heading = document.createElement('p'); heading.textContent = subtaskProgress(task); recap.append(heading);
    const list = document.createElement('ul');
    for (const item of task.subtasks) { const li = document.createElement('li'); li.textContent = `${item.done ? '☑' : '☐'} ${item.text}`; list.append(li); }
    recap.append(list);
  }
}
function subtaskProgress(task) {
  const items = task.subtasks || [];
  return t('subtask_progress', { done: items.filter(s => s.done).length, total: items.length });
}

window.addEventListener('sessionExpired', () => { subtaskDraft = []; });
window.addEventListener('languageChanged', renderSubtasks);
