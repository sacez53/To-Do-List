// Draft-only assistant and manual subtasks. Saving remains owned by the task form.
let subtaskDraft = [];
let aiController = null;
let aiProposal = null;
let aiSource = null;
const subtasksEditor = document.getElementById('subtasks-editor');
const aiResult = document.getElementById('ai-result');
const aiFeedback = document.getElementById('ai-feedback');
const aiCode = document.getElementById('ai-access-code');
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
function resetTaskAssistant(task = null) {
  cancelTaskAI(); subtaskDraft = (task?.subtasks || []).map(s => ({ ...s })); renderSubtasks();
  document.getElementById('ai-tools').open = false;
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
function cancelTaskAI() {
  aiController?.abort(); aiController = null; aiProposal = null; aiSource = null;
  aiResult.hidden = true; aiResult.replaceChildren(); aiFeedback.textContent = '';
  document.querySelectorAll('[data-ai-mode]').forEach(button => { button.disabled = false; });
  document.getElementById('ai-cancel').hidden = true;
}
document.getElementById('ai-cancel').addEventListener('click', cancelTaskAI);
for (const button of document.querySelectorAll('[data-ai-mode]')) button.addEventListener('click', async () => {
  if (aiController || modalSaving || !sessionStorage.getItem('auth') || !validateModalTitle()) return;
  if (!aiCode.value.trim()) { aiFeedback.textContent = t('ai_code_required'); aiCode.focus(); return; }
  cancelTaskAI();
  const controller = new AbortController(); aiController = controller;
  const timer = setTimeout(() => controller.abort(), 45000);
  aiSource = modalValues(); const source = aiSource;
  document.querySelectorAll('[data-ai-mode]').forEach(b => { b.disabled = true; });
  document.getElementById('ai-cancel').hidden = false; aiFeedback.textContent = t('ai_loading');
  const now = new Date(); const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  try {
    const proposal = await TaskAI.propose({ mode: button.dataset.aiMode, text: modalText.value.trim(), notes: modalNotes.value,
      language: getLanguage(), today, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }, aiCode.value.trim(), controller.signal);
    if (aiController !== controller || !sessionStorage.getItem('auth')) return;
    if (modalValues() !== source) { aiFeedback.textContent = t('ai_stale'); return; }
    aiProposal = { ...proposal, mode: button.dataset.aiMode }; aiResult.hidden = false;
    const preview = document.createElement('p');
    preview.textContent = aiProposal.mode === 'phrase' ? `${proposal.text} · ${proposal.due || t('recap_no_due')} ${proposal.dueTime || ''} · ${PRIORITY_LABEL[proposal.priority]}${proposal.notes ? '\n' + proposal.notes : ''}` : t('ai_select');
    aiResult.append(preview);
    for (const text of proposal.subtasks) {
      const label = document.createElement('label'); label.className = 'ai-choice';
      const check = document.createElement('input'); check.type = 'checkbox'; check.checked = true; check.value = text;
      label.append(check, document.createTextNode(text)); aiResult.append(label);
    }
    const apply = document.createElement('button'); apply.type = 'button'; apply.className = 'btn-save'; apply.textContent = t('ai_apply');
    apply.addEventListener('click', () => {
      if (!aiProposal || modalSaving) return;
      if (modalValues() !== aiSource) { aiFeedback.textContent = t('ai_stale'); return; }
      const selected = [...aiResult.querySelectorAll('input:checked')].map(el => el.value);
      const existing = new Set(subtaskDraft.map(s => s.text.trim().toLocaleLowerCase()));
      const additions = selected.filter(text => !existing.has(text.toLocaleLowerCase()));
      if (subtaskDraft.length + additions.length > 30) { aiFeedback.textContent = t('ai_too_many'); return; }
      if (aiProposal.mode === 'phrase') {
        modalText.value = aiProposal.text; modalDue.value = aiProposal.due || ''; modalDueTime.value = aiProposal.dueTime || '';
        modalPriority.value = aiProposal.priority; modalNotes.value = aiProposal.notes;
      }
      subtaskDraft.push(...additions.map(text => ({ id: crypto.randomUUID(), text, done: false })));
      renderSubtasks(); cancelTaskAI(); aiFeedback.textContent = t('ai_applied');
      if (creatingTask) { creationStep = additions.length ? 2 : 1; updateCreationWizard(true); } else modalText.focus();
    });
    aiResult.append(apply); aiFeedback.textContent = t('ai_review');
  } catch (error) {
    if (aiController !== controller) return;
    const messages = { unconfigured: 'ai_unconfigured', '401': 'ai_access_error', '403': 'ai_access_error', '429': 'ai_limit', invalid: 'ai_invalid' };
    aiFeedback.textContent = t(error.name === 'AbortError' ? 'ai_timeout' : messages[error.message] || 'ai_failed');
  } finally {
    clearTimeout(timer);
    if (aiController === controller) {
      aiController = null; document.querySelectorAll('[data-ai-mode]').forEach(b => { b.disabled = false; }); document.getElementById('ai-cancel').hidden = true;
    }
  }
});
document.getElementById('quick-add-ai').addEventListener('click', () => {
  if (quickBusy || !taskStore || !sessionStorage.getItem('auth')) return;
  openFullQuickCreation(); document.getElementById('ai-tools').open = true; modalText.focus();
});
window.addEventListener('sessionExpired', () => { aiCode.value = ''; cancelTaskAI(); subtaskDraft = []; });
window.addEventListener('pagehide', () => { aiCode.value = ''; cancelTaskAI(); });
window.addEventListener('languageChanged', () => { renderSubtasks(); cancelTaskAI(); });
