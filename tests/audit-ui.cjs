// Runs real pages in the installed Electron/Chromium runtime with an isolated,
// in-memory partition and a fake Firebase endpoint. No production requests.
const { app, BrowserWindow, session } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
app.disableHardwareAcceleration();
const root = path.resolve(__dirname,'..');
const out = path.join(root,'output','playwright');
app.setPath('userData',path.join(root,'output','audit-electron-profile'));
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
fs.mkdirSync(out,{recursive:true});
const bootstrap = `<script>
sessionStorage.setItem('auth','true');sessionStorage.setItem('username','audit');if(!sessionStorage.getItem('encKey'))sessionStorage.setItem('encKey',btoa(String.fromCharCode(...new Uint8Array(32).fill(7))));sessionStorage.setItem('lang','fr');
window.__fixture={account:{password:'hash',todos:[{id:'a',text:'Task A',status:'todo',priority:'normal',notes:'Notes',created:'2026-01-01T12:00:00Z'},{id:'b',text:'<b>Literal task</b>',status:'inprogress',priority:'high',notes:'',due:'2026-11-03'}]},version:0};
if(sessionStorage.getItem("__keepFixture"))window.__fixture=JSON.parse(sessionStorage.getItem("__keepFixture"));
window.__alerts=[];window.alert=msg=>__alerts.push(msg);window.confirm=()=>true;
const originalFetch=window.fetch.bind(window);
window.fetch=async(url,options={})=>{
 if(String(url).includes('firebase.json'))return Response.json({url:'https://fixture.invalid'});
 if(String(url).includes('fixture.invalid')){
  if(__fixture.failure)return new Response('{}',{status:__fixture.failure});
  if(options.method==='PUT'){if(options.headers['if-match']!==String(__fixture.version))return new Response('{}',{status:412});__fixture.account=JSON.parse(options.body);__fixture.version++;if(sessionStorage.getItem("__keepFixture"))sessionStorage.setItem("__keepFixture",JSON.stringify(__fixture));}
  return Response.json(__fixture.account,{headers:{ETag:String(__fixture.version)}});
 }
 return originalFetch(url,options);
};
</script>`;
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\/$/, '/index.html');
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  const ext=path.extname(file),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
  res.setHeader('Content-Type',mime[ext]||'application/octet-stream');
  let content=fs.readFileSync(file);if(ext==='.html')content=content.toString().replace('<head>','<head>'+bootstrap);
  res.end(content);
});
let win,errors=[];
const run=code=>win.webContents.executeJavaScript(code,true);
async function until(code){for(let i=0;i<150;i++){if(await run(code))return;await new Promise(r=>setTimeout(r,40));}throw new Error('Timed out: '+code);}
async function checkPhoneLayouts() {
  for (const width of [320,375,390,430,600]) {
    win.setContentSize(width,812);
    await new Promise(r=>setTimeout(r,100));
    await run('document.body.tabIndex=-1;document.body.focus();setTaskScope("today");document.querySelector("[data-view=list]").click();window.scrollTo(0,0)');
    assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,`page overflow at ${width}`);
    assert.equal(await run('parseFloat(getComputedStyle(quickTitle).fontSize)>=16'),true);
    assert.equal(await run('quickTitle.getBoundingClientRect().width>=150'),true);
    assert.equal(await run('boardEl.querySelector(".v2-item").getBoundingClientRect().top<760'),true,`tasks too low at ${width}`);
    assert.equal(await run('document.querySelector(".v2-overall-progress").getBoundingClientRect().top>boardEl.getBoundingClientRect().bottom'),true);
    assert.equal(await run('[...boardEl.querySelector(".v2-task-controls").querySelectorAll("button")].every(b=>b.getBoundingClientRect().height>=44 && b.getBoundingClientRect().width>=44)'),true);
    await run('document.querySelector("[data-view=table]").click()');
    assert.equal(await run('getComputedStyle(boardEl.querySelector(".v2-table-row")).display'),'grid');
    assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,`table overflow at ${width}`);
    assert.equal(await run('boardEl.querySelector("td:nth-child(2)").dataset.label.length>0'),true);
    await run('document.querySelector("[data-view=kanban]").click()');
    assert.equal(await run('boardEl.scrollWidth>boardEl.clientWidth'),true);
    assert.equal(await run('boardEl.getBoundingClientRect().right<=innerWidth'),true);
    await run('boardEl.scrollLeft=260');
    assert.equal(await run('boardEl.scrollLeft>0'),true);
  }
  win.setContentSize(390,844);await new Promise(r=>setTimeout(r,100));
  await run('document.querySelector("[data-view=list]").click();document.body.focus();window.scrollTo(0,0)');
  await new Promise(r=>setTimeout(r,300));
  await fs.promises.writeFile(path.join(out,'phone-390.png'),(await win.webContents.capturePage()).toPNG());
  await run('boardEl.querySelector(".v2-item").scrollIntoView({block:"center"})');
  await fs.promises.writeFile(path.join(out,'phone-task-actions.png'),(await win.webContents.capturePage()).toPNG());
  await run('document.querySelector("[data-view=table]").click();boardEl.scrollIntoView({block:"start"})');
  await fs.promises.writeFile(path.join(out,'phone-table.png'),(await win.webContents.capturePage()).toPNG());
  await run('document.querySelector("[data-view=list]").click()');
  for(const [width,height] of [[320,640],[390,420],[844,390]]) {
    win.setContentSize(width,height);await new Promise(r=>setTimeout(r,100));
    if(width>600) continue; // Landscape is checked for page fit below.
    for(const dialog of ['edit','schedule','help']) {
      await run(dialog==='edit'?'openModal("late","edit")':dialog==='schedule'?'openScheduleDialog("late")':'openShortcutHelp()');
      await new Promise(r=>setTimeout(r,250));
      const overlay = dialog==='edit'?'modal-overlay':dialog==='schedule'?'schedule-overlay':'shortcuts-overlay';
      assert.equal(await run(`(()=>{const r=document.getElementById('${overlay}').querySelector('.modal').getBoundingClientRect();return r.top>=-1 && r.bottom<=innerHeight+1 && r.left>=0 && r.right<=innerWidth+1})()`),true,`${dialog} outside ${width}x${height}`);
      const control=dialog==='edit'?'modal-save':dialog==='schedule'?'schedule-save':'shortcuts-close';
      await run(`document.getElementById('${control}').scrollIntoView({block:'nearest'})`);
      assert.equal(await run(`(()=>{const r=document.getElementById('${control}').getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight+1})()`),true,`${dialog} action unreachable`);
      if(dialog==='edit' && height===420)await fs.promises.writeFile(path.join(out,'phone-edit-short-height.png'),(await win.webContents.capturePage()).toPNG());
      await run(dialog==='edit'?'closeModal(true)':dialog==='schedule'?'closeScheduleDialog()':'closeShortcutHelp()');
      await new Promise(r=>setTimeout(r,80));
    }
  }
  assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true);
  win.setContentSize(390,844);await new Promise(r=>setTimeout(r,100));
  // The offscreen window has no OS focus: dispatch the field focus event explicitly.
  await run('quickTitle.focus();quickTitle.dispatchEvent(new FocusEvent("focusin",{bubbles:true}))');
  assert.equal(await run('getComputedStyle(fabAdd).visibility'),'hidden');
  await run('document.body.focus();document.body.dispatchEvent(new FocusEvent("focusin",{bubbles:true}));window.scrollTo(0,0)');
  win.setContentSize(1040,900);await new Promise(r=>setTimeout(r,100));
  console.log('PHONE PASS: 320/375/390/430/600px, visible first task, three layouts, touch targets, reachable dialogs at 420px height, landscape fit and input/FAB separation.');
}
app.whenReady().then(async()=>{
 try {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port,partition='audit-'+Date.now();
  session.fromPartition(partition).webRequest.onBeforeRequest((details,callback)=>callback({cancel:!details.url.startsWith('http://127.0.0.1:')&&!details.url.startsWith('data:')}));
  win=new BrowserWindow({show:false,width:1040,height:800,webPreferences:{partition,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}});
  win.webContents.on('console-message',(_event,level,message)=>{if(level===3)errors.push(message);});
  await win.loadURL(`http://127.0.0.1:${port}/pages/app-v2.html`);
  await until('!!taskStore && todos.filter(t=>!TodoData.removed(t)).length===2 && !syncRunning');
  assert.equal(await run('currentScope'),'today');
  assert.equal(await run('boardEl.querySelector(".v2-item[data-task-id=a]")===null'),true);
  await run('setTaskScope("all")');
  assert.equal(await run('localStorage.getItem("todos_audit")'),null);
  assert.equal(await run('localStorage.getItem("todo_state_audit").includes("Task A")'),false);
  for(const view of ['list','kanban','table']){
   await run(`document.querySelector('[data-view="${view}"]').click();document.querySelector('.task-summary').click()`);
   assert.equal(await run('modalRecap.style.display'),'flex');assert.equal(await run('modalBody.style.display'),'none');
   await run('modalEditBtn.click()');assert.equal(await run('modalBody.style.display'),'flex');await run('closeModal(true)');
  }
  await run('openModal("a","edit");modalDelete.click();document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}));openModal("b","edit");modalDelete.click();confirmYes.click()');
  await until('todos.filter(t=>!TodoData.removed(t)).length===1 && !syncRunning');assert.equal(await run('todos.find(t=>!TodoData.removed(t)).id'),'a');
  await run('currentView="list";searchQuery="<img src=x onerror=alert(1)>";render()');
  assert.equal(await run('boardEl.querySelector("img")===null'),true);
  await run('searchQuery="";render();fabAdd.click();modalText.value="Created via form";modalSave.click()');
  await until('todos.filter(t=>!TodoData.removed(t)).length===2 && !modalOverlay.classList.contains("open") && !syncRunning');
  await run('openModal("a","edit");modalText.value="Unsaved";window.confirm=()=>false;modalClose.click()');assert.equal(await run('modalOverlay.classList.contains("open")'),true);
  await run('window.confirm=()=>true;closeModal(true);openModal("a","view")');
  await new Promise(r=>setTimeout(r,80));
  await run('document.querySelector("#modal-overlay button:not([style*=none])").focus()');
  assert.equal(await run('modalOverlay.contains(document.activeElement)'),true);
  await run('closeModal(true);currentView="list";render()');
  await run('__fixture.failure=403;refreshTasks()');assert((await run('syncLabel.textContent')).includes('403'));
  await run('delete __fixture.failure');
  await run('refreshTasks()'); await new Promise(r=>setTimeout(r,550));
  console.log('Visual state:',await run('JSON.stringify({overlay:getComputedStyle(document.getElementById("pt-overlay")).opacity,item:getComputedStyle(document.querySelector(".v2-item")).opacity,images:[...boardEl.querySelectorAll("img")].map(i=>i.outerHTML)})'));
  await fs.promises.writeFile(path.join(out,'audit-desktop.png'),(await win.webContents.capturePage()).toPNG());
  win.setContentSize(375,812);await new Promise(r=>setTimeout(r,120));
  assert.equal(await run('document.documentElement.scrollWidth<=window.innerWidth'),true);
  await fs.promises.writeFile(path.join(out,'audit-mobile.png'),(await win.webContents.capturePage()).toPNG());
  await run('mutateTrash("b","restore")');await until('!syncRunning && !trashBusy');
  // N02: use actual Enter events for the quick-entry form.
  win.setContentSize(1040,900);
  await run('window.__captureStart=todos.length;quickTitle.focus();quickTitle.value="   ";quickForm.requestSubmit()');
  assert.equal(await run('todos.length===__captureStart'),true);
  assert.equal(await run('quickTitle.getAttribute("aria-invalid")'),'true');
  await run('quickTitle.value="Appeler demain à 14 h <b>littéral</b>";quickTitle.dispatchEvent(new Event("input"));quickTitle.focus()');
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Enter'});
  win.webContents.sendInputEvent({type:'char',keyCode:'\r'});
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Enter',isAutoRepeat:true});
  win.webContents.sendInputEvent({type:'char',keyCode:'\r'});
  win.webContents.sendInputEvent({type:'keyUp',keyCode:'Enter'});
  await until('!quickBusy && todos.length===__captureStart+1 && !syncRunning');
  assert.equal(await run('todos.filter(t=>t.text==="Appeler demain à 14 h <b>littéral</b>").length'),1);
  assert.equal(await run('todos.find(t=>t.id===quickCreatedId).due'),null);
  assert.equal(await run('quickTitle.value'), '');
  assert.equal(await run('document.activeElement===quickTitle'),true);
  assert.equal(await run('quickStatus.textContent.includes("Toutes les tâches")'),true);
  assert.equal(await run('quickStatus.querySelector("b")===null'),true);
  await win.webContents.insertText('Deuxième capture');
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Enter'});
  win.webContents.sendInputEvent({type:'char',keyCode:'\r'});
  win.webContents.sendInputEvent({type:'keyUp',keyCode:'Enter'});
  await until('!quickBusy && todos.length===__captureStart+2 && !syncRunning');
  await run('quickDetails.click()');
  assert.equal(await run('modalBody.style.display'),'flex');
  assert.equal(await run('modalText.value'),'Deuxième capture');
  await run('closeModal(true);quickTitle.value="Brouillon à compléter";quickFull.click()');
  assert.equal(await run('modalText.value'),'Brouillon à compléter');
  await run('closeModal(true)');
  assert.equal(await run('quickTitle.value'),'Brouillon à compléter');
  await run('quickFull.click();modalSave.click()');
  await until('!modalOverlay.classList.contains("open") && !syncRunning && !localWrites');
  assert.equal(await run('quickTitle.value'),'');
  assert.equal(await run('todos.filter(t=>t.text==="Brouillon à compléter").length'),1);
  // An unavailable local save keeps the draft, without an unsaved duplicate.
  await run('window.__realTaskSave=taskStore.save;taskStore.save=async()=>{throw new Error("fixture local failure")};quickTitle.value="À réessayer";quickForm.requestSubmit()');
  await until('!quickBusy');
  assert.equal(await run('quickTitle.value'),'À réessayer');
  assert.equal(await run('todos.some(t=>t.text==="À réessayer")'),false);
  assert.equal(await run('quickError.textContent.length>0'),true);
  await run('taskStore.save=__realTaskSave;quickForm.requestSubmit();quickForm.requestSubmit()');
  await until('!quickBusy && !syncRunning && todos.some(t=>t.text==="À réessayer")');
  assert.equal(await run('todos.filter(t=>t.text==="À réessayer").length'),1);
  // Composition Enter and shortcut keys must not interrupt text editing.
  await run('quickTitle.value="Composition";quickTitle.dispatchEvent(new CompositionEvent("compositionstart"));quickForm.requestSubmit()');
  assert.equal(await run('todos.some(t=>t.text==="Composition")'),false);
  await run('quickTitle.dispatchEvent(new CompositionEvent("compositionend"));quickTitle.value="";searchInput.focus();searchInput.dispatchEvent(new KeyboardEvent("keydown",{key:"N",shiftKey:true,bubbles:true,cancelable:true}))');
  assert.equal(await run('document.activeElement===searchInput && !modalOverlay.classList.contains("open")'),true);
  await run('openModal(null)');
  await new Promise(r=>setTimeout(r,80));
  await run('modalNotes.focus();modalNotes.dispatchEvent(new KeyboardEvent("keydown",{key:"n",bubbles:true,cancelable:true}))');
  assert.equal(await run('document.activeElement===modalNotes'),true);
  await run('closeModal(true)');
  await new Promise(r=>setTimeout(r,80));
  await run('document.body.tabIndex=-1;document.body.focus();document.dispatchEvent(new KeyboardEvent("keydown",{key:"n",bubbles:true,cancelable:true}))');
  assert.equal(await run('document.activeElement===quickTitle'),true);
  await run('document.body.focus();document.dispatchEvent(new KeyboardEvent("keydown",{key:"N",shiftKey:true,bubbles:true,cancelable:true}))');
  assert.equal(await run('modalOverlay.classList.contains("open")'),true);
  await run('closeModal(true)');
  await new Promise(r=>setTimeout(r,80));
  await run('document.body.focus();document.dispatchEvent(new KeyboardEvent("keydown",{key:"?",bubbles:true,cancelable:true}))');
  assert.equal(await run('shortcutsOverlay.classList.contains("open")'),true);
  await new Promise(r=>setTimeout(r,250));
  await fs.promises.writeFile(path.join(out,'n02-shortcuts.png'),(await win.webContents.capturePage()).toPNG());
  await run('shortcutsEnabled.checked=false;shortcutsEnabled.dispatchEvent(new Event("change"));closeShortcutHelp()');
  await new Promise(r=>setTimeout(r,80));
  await run('document.body.focus();document.dispatchEvent(new KeyboardEvent("keydown",{key:"n",bubbles:true,cancelable:true}))');
  assert.equal(await run('document.activeElement===quickTitle'),false);
  assert.equal(await run('localStorage.getItem(shortcutsKey)'),'false');
  await win.loadURL(`http://127.0.0.1:${port}/pages/app-v2.html`);
  await until('!!taskStore && !syncRunning && todos.filter(t=>!TodoData.removed(t)).length===2');
  assert.equal(await run('shortcutsEnabled.checked'),false);
  // Help remains keyboard-accessible when its shortcut is disabled.
  await run('document.getElementById("shortcuts-open").focus()');
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Enter'});
  win.webContents.sendInputEvent({type:'char',keyCode:'\r'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Enter'});
  await until('shortcutsOverlay.classList.contains("open")');
  await run('shortcutsEnabled.focus()');
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Space'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Space'});
  await until('shortcutsEnabled.checked');
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});
  await until('!shortcutsOverlay.classList.contains("open")');
  await run('setLanguage("en")');assert.equal(await run('document.getElementById("quick-add-label").textContent'),'Add a task');
  await run('setLanguage("fr");document.body.focus()');
  await new Promise(r=>setTimeout(r,350));
  await fs.promises.writeFile(path.join(out,'n02-desktop.png'),(await win.webContents.capturePage()).toPNG());
  win.setContentSize(375,900);await new Promise(r=>setTimeout(r,100));
  assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true);
  assert.equal(await run('quickTitle.getBoundingClientRect().width>150'),true);
  await fs.promises.writeFile(path.join(out,'n02-mobile.png'),(await win.webContents.capturePage()).toPNG());
  console.log('N02 PASS: native Enter, duplicate protection, required title, literal text, focus, full-form draft, local-save retry, composition, contextual shortcuts, persistent opt-out, keyboard help and FR/EN.');
  // N03: exercise deletion, undo, calendar exclusion, restore and final removal.
  win.setContentSize(1040,900);
  await run(`(async()=>{
    const task={id:'trash-ui',text:'Tâche récupérable <b>littérale</b>',status:'waiting',priority:'high',due:TaskDates.day(),dueTime:'09:15',notes:'Notes à conserver',created:'2026-01-01T12:00:00.000Z',archived:false};
    window.__trashOriginal=JSON.parse(JSON.stringify(task));todos.push(task);await saveTodos();setTaskScope('all');
    openModal(task.id,'edit');modalDelete.click();confirmYes.click();
  })()`);
  await until('!trashBusy && !syncRunning && !!todos.find(t=>t.id==="trash-ui").deletedAt');
  assert.equal(await run('boardEl.querySelector("[data-task-id=trash-ui]")===null'),true);
  assert.equal(await run('document.getElementById("trash-notice").hidden'),false);
  await run('document.getElementById("trash-undo").click()');
  await until('!trashBusy && !syncRunning && !todos.find(t=>t.id==="trash-ui").deletedAt');
  assert.deepEqual(await run('JSON.parse(JSON.stringify(todos.find(t=>t.id==="trash-ui")))'),await run('__trashOriginal'));
  await run('openModal("trash-ui","edit");modalDelete.click();confirmYes.click()');
  await until('!trashBusy && !syncRunning && !!todos.find(t=>t.id==="trash-ui").deletedAt');
  await run('sessionStorage.setItem("__keepFixture",JSON.stringify(__fixture))');
  await win.loadURL(`http://127.0.0.1:${port}/pages/calendar.html`);
  await until('calendarStore && !calendarLoading');
  await run('calendarViewType="planning";updateCalendarView()');
  assert.equal(await run('calendarPlanningList.textContent.includes("Tâche récupérable")'),false);
  await win.loadURL(`http://127.0.0.1:${port}/pages/app-v2.html`);
  await until('taskStore && !syncRunning');
  await run('setTaskScope("trash")');
  assert.equal(await run('boardEl.querySelector("[data-task-id=trash-ui]")!==null'),true);
  assert.equal(await run('document.getElementById("v2-scope-description").textContent.includes("30 jours")'),true);
  await run('boardEl.querySelector("[data-task-id=trash-ui] .task-summary").click()');
  assert.equal(await run('modalEditBtn.style.display'),'none');
  assert.equal(await run('modalBody.style.display'),'none');
  assert.equal(await run('recapNotes.textContent'),'Notes à conserver');
  await run('closeModal(true);boardEl.querySelector("[data-task-id=trash-ui] [data-task-action=restore]").click()');
  await until('!trashBusy && !syncRunning && !todos.find(t=>t.id==="trash-ui").deletedAt');
  assert.equal(await run('todos.find(t=>t.id==="trash-ui").dueTime'),'09:15');
  await run('openModal("trash-ui","edit");modalDelete.click();confirmYes.click()');
  await until('!trashBusy && !syncRunning && !!todos.find(t=>t.id==="trash-ui").deletedAt');
  await new Promise(r=>setTimeout(r,350));
  await fs.promises.writeFile(path.join(out,'trash-desktop.png'),(await win.webContents.capturePage()).toPNG());
  win.setContentSize(320,740);await new Promise(r=>setTimeout(r,100));
  await run('document.body.focus();window.scrollTo(0,0)');
  assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true);
  assert.equal(await run('[...boardEl.querySelectorAll(".v2-trash-actions button")].every(b=>b.getBoundingClientRect().height>=44)'),true);
  assert.equal(await run('getComputedStyle(document.querySelector(".v2-toolbar")).display'),'none');
  await fs.promises.writeFile(path.join(out,'trash-phone.png'),(await win.webContents.capturePage()).toPNG());
  await run('boardEl.querySelector("[data-task-id=trash-ui] [data-task-action=purge]").click();confirmNo.click()');
  assert.equal(await run('!!todos.find(t=>t.id==="trash-ui").deletedAt'),true);
  await run('boardEl.querySelector("[data-task-id=trash-ui] [data-task-action=purge]").click();confirmYes.click()');
  await until('!trashBusy && !syncRunning && !!todos.find(t=>t.id==="trash-ui").purgedAt');
  assert.deepEqual(await run('Object.keys(todos.find(t=>t.id==="trash-ui")).sort()'),['id','purgedAt']);
  assert.equal(await run('mutateTrash("trash-ui","restore")'),false);
  assert.equal(await run('todos.find(t=>t.id==="trash-ui").text'),undefined);
  await run('sessionStorage.removeItem("__keepFixture");document.getElementById("trash-notice").hidden=true;setTaskScope("today");document.getElementById("trash-feedback").textContent=""');
  console.log('N03 PASS: soft deletion, Undo, exact restoration, calendar exclusion, read-only trash summary, 30-day notice, mobile actions, permanent-delete confirmation and non-restorable marker.');
  // N01: use local calendar dates, independent of the day this suite is run.
  win.setContentSize(1040,900);
  await run(`(async()=>{
    const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
    todos=[
      {id:'late',text:'Dossier en retard',status:'todo',due:TaskDates.day(yesterday),dueTime:'08:30',priority:'high',notes:'Keep these notes'},
      {id:'today',text:'Préparer la réunion',status:'todo',due:TaskDates.day(),priority:'normal',notes:''},
      {id:'future',text:'Envoyer les documents',status:'waiting',due:TaskDates.tomorrow(),dueTime:'09:00',priority:'normal',notes:'Future notes'},
      {id:'undated',text:'Une idée sans date',status:'todo',priority:'low',notes:''},
      {id:'done',text:'Déjà terminé',status:'done',due:TaskDates.day(),notes:''},
      {id:'cancelled',text:'Annulé',status:'cancelled',due:TaskDates.tomorrow(),notes:''},
      {id:'archived',text:'Archivé',status:'todo',archived:true,due:TaskDates.day(),notes:''}
    ];
    await saveTodos();setTaskScope('today');
  })()`);
  await until('!syncRunning && !taskStore.pending()');
  await checkPhoneLayouts();
  assert.deepEqual(await run('[...boardEl.querySelectorAll(".v2-item")].map(row=>row.dataset.taskId)'),['late','today']);
  assert.equal(await run('boardEl.querySelector(".v2-day-heading--overdue").textContent.startsWith("En retard")'),true);
  for(const view of ['list','kanban','table']) {
    await run(`document.querySelector('[data-view="${view}"]').click()`);
    assert.equal(await run('boardEl.querySelectorAll("[data-task-action=tomorrow]").length'),2);
    assert.equal(await run('boardEl.querySelectorAll("[data-task-action=choose]").length'),2);
  }
  await run('document.querySelector("[data-view=list]").click();setTaskScope("upcoming")');
  assert.deepEqual(await run('[...boardEl.querySelectorAll(".v2-item")].map(row=>row.dataset.taskId)'),['future']);
  await run('setTaskScope("all")');
  assert.equal(await run('boardEl.querySelector("[data-task-id=undated]")!==null'),true);
  assert.equal(await run('boardEl.querySelector("[data-task-id=done] [data-task-action=tomorrow]")===null'),true);
  await run('setLanguage("en")');assert.equal(await run('document.getElementById("v2-scope-heading").textContent'),'All tasks');
  await run('setLanguage("fr");setTaskScope("today")');
  await new Promise(r=>setTimeout(r,550));
  await fs.promises.writeFile(path.join(out,'n01-desktop.png'),(await win.webContents.capturePage()).toPNG());
  win.setContentSize(375,900);await new Promise(r=>setTimeout(r,100));
  assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true);
  assert.equal(await run('getComputedStyle(boardEl.querySelector(".v2-item")).flexDirection'),'column');
  assert.equal(await run('boardEl.querySelector(".v2-item-body").getBoundingClientRect().width>150'),true);
  await fs.promises.writeFile(path.join(out,'n01-mobile.png'),(await win.webContents.capturePage()).toPNG());
  await run('document.querySelector("[data-task-id=late][data-task-action=tomorrow]").click()');
  await until('!localWrites && !syncRunning && todos.find(t=>t.id==="late").due===TaskDates.tomorrow()');
  assert.equal(await run('boardEl.querySelector(".v2-item[data-task-id=late]")===null'),true);
  assert.deepEqual(await run('(()=>{const task=todos.find(t=>t.id==="late");return [task.dueTime,task.status,task.priority,task.notes]})()'),['08:30','todo','high','Keep these notes']);
  assert.equal(await run('(async()=>{const reopened=await TodoData.open("audit");return reopened.read().find(t=>t.id==="late").due===TaskDates.tomorrow()})()'),true);
  await run('setTaskScope("upcoming");document.querySelector("[data-task-id=future][data-task-action=choose]").click()');
  assert.equal(await run('document.getElementById("schedule-overlay").classList.contains("open")'),true);
  assert.equal(await run('modalOverlay.classList.contains("open")'),false);
  await run('document.getElementById("schedule-date").value=TaskDates.day();document.getElementById("schedule-cancel").click()');
  assert.equal(await run('todos.find(t=>t.id==="future").due===TaskDates.tomorrow()'),true);
  await run('document.querySelector("[data-task-id=future][data-task-action=choose]").click();document.getElementById("schedule-date").value=TaskDates.day();document.getElementById("schedule-form").requestSubmit()');
  await until('reschedulingId===null && !syncRunning && !localWrites');
  assert.equal(await run('todos.find(t=>t.id==="future").dueTime'),'09:00');
  assert.equal(await run('boardEl.querySelector(".v2-item[data-task-id=future]")===null'),true);
  await run('setTaskScope("today");document.querySelector("[data-task-id=today][data-task-action=edit]").click();modalStatus.value="done";modalSave.click()');
  await until('!modalOverlay.classList.contains("open") && !syncRunning && !localWrites');
  assert.equal(await run('boardEl.querySelector(".v2-item[data-task-id=today]")===null'),true);
  // Advance the local clock to tomorrow's midnight while keeping the page open.
  await run(`window.__RealDate=Date;const next=new Date();next.setDate(next.getDate()+1);next.setHours(0,0,0,0);window.__clock=next.getTime();
    window.Date=class extends __RealDate{constructor(...args){super(...(args.length?args:[__clock]));}static now(){return __clock;}};refreshTaskClock();`);
  assert.equal(await run('boardEl.querySelector(".v2-item[data-task-id=late]")!==null'),true);
  assert.equal(await run('boardEl.querySelector(".v2-item[data-task-id=future] .due-overdue")!==null'),true);
  await run('window.Date=__RealDate;refreshTaskClock()');
  console.log('N01 PASS: scopes, ordering, exclusions, all layouts, FR/EN, tomorrow, chosen date, cancellation, field preservation, completed task removal and live midnight refresh.');
  await win.loadURL(`http://127.0.0.1:${port}/pages/calendar.html`);
  await until('calendarStore && !calendarLoading');
  win.setContentSize(320,740);await new Promise(r=>setTimeout(r,100));
  assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true);
  await fs.promises.writeFile(path.join(out,'phone-calendar.png'),(await win.webContents.capturePage()).toPNG());
  await run('currentCalendarDate=new Date(2026,0,31);calendarNext.click()');assert.equal(await run('currentCalendarDate.getMonth()'),1);
  await run('calendarViewType="planning";updateCalendarView()');assert.equal(await run('calendarPlanningList.querySelector("b")===null'),true);
  assert.equal(await run('getStatusInfo("inprogress").icon'),'↻');
  await win.loadURL(`http://127.0.0.1:${port}/pages/settings.html`);
  await until('!!archiveStore');
  assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true);
  assert.equal(await run('[...document.querySelectorAll(".settings-tab-btn")].every(b=>b.getBoundingClientRect().height>=44)'),true);
  await new Promise(r=>setTimeout(r,450));
  await fs.promises.writeFile(path.join(out,'phone-settings.png'),(await win.webContents.capturePage()).toPNG());
  assert.equal(await run('typeof saveArchivedChanges'), 'function');
  await run(`(async()=>{await archiveStore.sync();const current=archiveStore.read();current.push({id:'archive-ui',text:'Archive récupérable',notes:'Archive notes',status:'done',archived:true});await archiveStore.save(current);await archiveStore.sync();updateArchivedView();document.querySelector('[data-tab="tab-archive"]').click();document.querySelectorAll('#archived-tasks-container button')[1].click();})()`);
  await until('!!archiveStore.read().find(t=>t.id==="archive-ui").deletedAt && !!document.getElementById("archive-trash-undo")');
  await run('document.getElementById("archive-trash-undo").click()');
  await until('!document.getElementById("archive-trash-undo") && !archiveStore.read().find(t=>t.id==="archive-ui").deletedAt');
  assert.equal(await run('archiveStore.read().find(t=>t.id==="archive-ui").archived'),true);
  await run(`(async()=>{await archiveStore.save(archiveStore.read().filter(t=>t.id!=="archive-ui"));await archiveStore.sync();updateArchivedView();document.querySelector('[data-tab="tab-account"]').click();})()`);
  await run(`(async()=>{const salt=generateSalt();__fixture.account.salt=salt;__fixture.account.password=await hashPasswordPBKDF2('old-password',salt);document.getElementById('old-password').value='old-password';document.getElementById('new-password').value='new-password';document.getElementById('confirm-new-password').value='new-password';btnChangePassword.click();})()`);
  await until('!btnChangePassword.disabled && document.getElementById("msg-password").textContent.includes("✓")');
  assert.equal(await run('(async()=>{const key=await importKey(sessionStorage.getItem("encKey"));return (await decryptData(__fixture.account.todos,key)).filter(t=>!TodoData.removed(t)).length})()'),2);
  assert.equal(await run('localStorage.getItem("todo_state_audit").includes("Task A")'),false);
  await win.loadURL(`http://127.0.0.1:${port}/pages/donnees.html`);
  await run('window.__export=null;URL.createObjectURL=blob=>{window.__export=blob;return "blob:audit"};HTMLAnchorElement.prototype.click=function(){};document.getElementById("export-json").click()');
  await until('!!window.__export');
  assert.equal(await run('(async()=>JSON.parse(await __export.text()).donnees.find(t=>t.id==="a").creeLe)()'),'2026-01-01T12:00:00Z');
  await win.loadURL(`http://127.0.0.1:${port}/win_app/src/app.html`);
  await until('!!taskStore && todos.filter(t=>!TodoData.removed(t)).length===2 && !syncRunning');
  await run('setTaskScope("all");document.querySelector(".task-summary").click()');
  assert.equal(await run('modalBody.style.display'),'none');
  await run('modalEditBtn.click()');assert.equal(await run('modalBody.style.display'),'flex');
  await run('closeModal(true)');
  for(const page of ['pages/login.html','index.html']) {
    await win.loadURL(`http://127.0.0.1:${port}/${page}`);
    await new Promise(r=>setTimeout(r,450));
    assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,`${page} overflows on phone`);
    await fs.promises.writeFile(path.join(out,page==='index.html'?'phone-home.png':'phone-login.png'),(await win.webContents.capturePage()).toPNG());
  }
  console.log('UI PASS: three views, summary/edit, deletion cancellation, safe text, creation, dirty form, focus, HTTP 403, mobile fit, calendar month/status, password rotation and JSON export.');
  console.log('Console errors:',JSON.stringify(errors));
  win.destroy();server.close();app.exit(errors.length?1:0);
 }catch(error){console.error(error);try{console.error('Capture debug:',await run('JSON.stringify({count:todos.length,busy:quickBusy,value:quickTitle.value,error:quickError.textContent,active:document.activeElement.id,width:innerWidth,body:document.body.className,dock:document.querySelector(".v2-add-dock")?getComputedStyle(document.querySelector(".v2-add-dock")).display:null,alerts:window.__alerts,sync:syncLabel.textContent})'));}catch(_){}win?.destroy();server.close();app.exit(1);}
});

