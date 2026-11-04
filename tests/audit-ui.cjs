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
if(new URLSearchParams(location.search).has('guest')){sessionStorage.removeItem('auth');sessionStorage.removeItem('username');}
window.__fixture={account:{password:'hash',todos:[{id:'a',text:'Task A',status:'todo',priority:'normal',notes:'Notes',created:'2026-01-01T12:00:00Z'},{id:'b',text:'<b>Literal task</b>',status:'inprogress',priority:'high',notes:'',due:'2026-11-03'}]},version:0};
if(sessionStorage.getItem("__keepFixture"))window.__fixture=JSON.parse(sessionStorage.getItem("__keepFixture"));
window.__alerts=[];window.alert=msg=>__alerts.push(msg);window.confirm=()=>true;
const originalFetch=window.fetch.bind(window);
window.fetch=async(url,options={})=>{
 if(String(url).includes('firebase.json'))return Response.json({url:'https://fixture.invalid'});
 if(String(url).includes('security.json')&&new URLSearchParams(location.search).has('timeout'))return Response.json({timeoutMinutes:0.02});
 if(String(url).includes('fixture.invalid')){
  if(String(url).endsWith('/comments.json'))return Response.json({demo:{text:'Une présentation plus claire, sur téléphone aussi.',username:'demo',createdAt:'2026-11-04T10:00:00Z'}});
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
async function checkCreationWizard() {
  win.setContentSize(390,844);await new Promise(r=>setTimeout(r,100));
  await run('window.__wizardOriginal=JSON.parse(JSON.stringify(todos));window.__wizardStart=todos.length;openModal(null)');
  await new Promise(r=>setTimeout(r,100));
  assert.equal(await run('modalOverlay.classList.contains("creation-wizard") && creationStep===0'),true);
  assert.equal(await run('[modalStatus,modalDue,modalNotes].every(field=>!field.getClientRects().length)'),true);
  await run('creationNext.click();modalSave.click()');
  assert.equal(await run('creationStep===0 && todos.length===__wizardStart && modalText.getAttribute("aria-invalid")==="true"'),true);
  await run('modalText.value="Préparer <b>le dossier</b>";modalText.dispatchEvent(new Event("input"));modalText.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",isComposing:true,bubbles:true,cancelable:true}));modalText.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",repeat:true,bubbles:true,cancelable:true}))');
  assert.equal(await run('creationStep'),0);
  await run('modalText.focus()');
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Enter'});
  win.webContents.sendInputEvent({type:'char',keyCode:'\r'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Enter'});
  await until('creationStep===1');
  assert.equal(await run('creationStep===1 && document.activeElement===modalDue'),true);
  assert.equal(await run('document.getElementById("creation-title-preview").querySelector("b")===null'),true);
  await run('modalDueTime.value="09:30";creationNext.click()');
  assert.equal(await run('creationStep===1 && creationError.textContent.length>0'),true);
  await run('modalDue.value="2026-12-14";creationNext.click();modalStatus.value="waiting";modalPriority.value="high";modalNotes.value="Note conservée"+String.fromCharCode(10)+"Deuxième ligne";creationBack.click()');
  assert.equal(await run('modalDue.value+" "+modalDueTime.value'),'2026-12-14 09:30');
  await run('creationBack.click()');assert.equal(await run('modalText.value'),'Préparer <b>le dossier</b>');
  await run('creationNext.click();creationNext.click();setLanguage("en")');
  assert.equal(await run('document.getElementById("creation-step-status").textContent.includes("Step 3 of 3")'),true);
  assert.equal(await run('modalNotes.value'),'Note conservée\nDeuxième ligne');
  await run('setLanguage("fr")');
  win.setContentSize(1040,900);await new Promise(r=>setTimeout(r,120));
  assert.equal(await run('!modalOverlay.classList.contains("creation-wizard") && [modalText,modalDue,modalStatus,modalNotes].every(field=>field.getClientRects().length)'),true);
  win.setContentSize(390,844);await new Promise(r=>setTimeout(r,120));
  assert.equal(await run('modalOverlay.classList.contains("creation-wizard") && creationStep===2'),true);
  await run('modalSave.focus()');
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Tab'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Tab'});
  await until('document.activeElement===modalClose');
  await run('modalSave.click();modalSave.click()');
  await until('!modalSaving && !modalOverlay.classList.contains("open") && !syncRunning && !localWrites');
  assert.equal(await run('todos.length'),await run('__wizardStart+1'));
  assert.deepEqual(await run('(()=>{const task=todos.find(t=>t.text==="Préparer <b>le dossier</b>");return [task.status,task.priority,task.due,task.dueTime,task.notes]})()'),['waiting','high','2026-12-14','09:30','Note conservée\nDeuxième ligne']);
  await run('quickTitle.value="Créer en un geste";quickFull.click();modalSave.click()');
  await until('!modalSaving && !modalOverlay.classList.contains("open") && !syncRunning');
  assert.equal(await run('quickTitle.value'),'');
  assert.deepEqual(await run('(()=>{const task=todos.find(t=>t.text==="Créer en un geste");return [task.status,task.priority,task.due,task.dueTime,task.notes]})()'),['todo','normal',null,null,'']);
  await run('quickTitle.value="Brouillon conservé";quickFull.click();creationNext.click();modalDue.value="2026-12-15";window.confirm=()=>false;modalClose.click()');
  assert.equal(await run('modalOverlay.classList.contains("open") && creationStep===1'),true);
  await run('window.confirm=()=>true;modalClose.click();quickFull.click()');
  assert.equal(await run('modalText.value==="Brouillon conservé" && creationStep===0 && modalDue.value===""'),true);
  await run('closeModal(true);quickTitle.value="";openModal(null);modalText.value="Création à réessayer";creationNext.click();creationNext.click();modalNotes.value="Garder ce texte";window.__realWizardSave=taskStore.save;taskStore.save=async()=>{throw new Error("fixture wizard failure")};modalSave.click()');
  await until('!modalSaving');
  assert.equal(await run('!todos.some(t=>t.text==="Création à réessayer") && creationStep===2 && modalNotes.value==="Garder ce texte" && creationError.textContent.length>0'),true);
  await run('taskStore.save=__realWizardSave;modalSave.click()');
  await until('!modalSaving && !modalOverlay.classList.contains("open") && !syncRunning');
  assert.equal(await run('todos.filter(t=>t.text==="Création à réessayer").length'),1);
  for(const [width,height] of [[320,420],[390,640],[600,812]]) {
    win.setContentSize(width,height);await new Promise(r=>setTimeout(r,100));
    await run('openModal(null);modalText.value="Préparer la réunion"');
    for(let step=0;step<3;step++) {
      await new Promise(r=>setTimeout(r,280));
      assert.equal(await run('(()=>{const r=modalOverlay.querySelector(".modal").getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight+1 && r.left>=0 && r.right<=innerWidth+1})()'),true,`creation step ${step} outside ${width}x${height}: `+await run('JSON.stringify({rect:modalOverlay.querySelector(".modal").getBoundingClientRect().toJSON(),height:innerHeight,viewport:getComputedStyle(document.documentElement).getPropertyValue("--task-viewport-height"),max:getComputedStyle(modalOverlay.querySelector(".modal")).maxHeight})'));
      assert.equal(await run('[creationBack,creationNext,modalSave].filter(b=>b.getClientRects().length).every(b=>b.getBoundingClientRect().height>=44)'),true);
      assert.equal(await run('[...modalBody.querySelectorAll("input,select,textarea"),creationBack,creationNext,modalSave].filter(b=>b.getClientRects().length).every(b=>{const r=b.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth+1})'),true,`creation controls overflow at ${width}, step ${step}: `+await run('JSON.stringify([creationBack,creationNext,modalSave].map(b=>({id:b.id,rect:b.getBoundingClientRect().toJSON()})))'));
      await run('modalSave.scrollIntoView({block:"nearest"})');
      assert.equal(await run('[creationBack,creationNext,modalSave].filter(b=>b.getClientRects().length).every(b=>{const r=b.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight+1})'),true,`creation actions unreachable at ${width}, step ${step}`);
      if(width===390)await fs.promises.writeFile(path.join(out,`creation-phone-step-${step+1}.png`),(await win.webContents.capturePage()).toPNG());
      if(step<2)await run('creationNext.click()');
    }
    await run('closeModal(true)');
  }
  await run('todos=__wizardOriginal;saveTodos()');await until('!syncRunning && !localWrites && !taskStore.pending()');
  win.setContentSize(1040,900);await new Promise(r=>setTimeout(r,100));
  console.log('CREATION PASS: phone steps, optional details, required title/date validation, back navigation, FR/EN, desktop resize, focus trap, exact fields, duplicate guard, save failure/retry and draft cancellation.');
}
async function checkDesktopLayouts() {
  for(const width of [701,768,1040,1440,1920]) {
    win.setContentSize(width,1000);await new Promise(r=>setTimeout(r,100));
    await run('document.body.focus();window.scrollTo(0,0)');
    assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,`desktop overflow at ${width}`);
    assert.equal(await run('document.querySelector(".workspace-sidebar").getBoundingClientRect().right<document.querySelector(".workspace-main").getBoundingClientRect().left'),true,`sidebar overlap at ${width}`);
    assert.equal(await run('getComputedStyle(document.querySelector(".v2-add-dock")).position'),'static');
    assert.equal(await run('getComputedStyle(filterPanel).display'),'none');
    await run('filterToggle.click()');
    assert.equal(await run('getComputedStyle(filterPanel).display'),'grid');
    assert.equal(await run('filterReset.getBoundingClientRect().right<=innerWidth'),true);
    await run('filterToggle.click()');
    if(width===1440) await fs.promises.writeFile(path.join(out,'redesign-desktop-1440.png'),(await win.webContents.capturePage()).toPNG());
  }
  win.setContentSize(1040,900);await new Promise(r=>setTimeout(r,100));
  console.log('DESKTOP PASS: 701/768/1040/1440/1920px, sidebar separation, compact capture, filter panel and page fit.');
}
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
    for(const dialog of ['edit','summary','schedule','help']) {
      await run(dialog==='edit'?'openModal("late","edit")':dialog==='summary'?'openModal("late","view")':dialog==='schedule'?'openScheduleDialog("late")':'openShortcutHelp()');
      await new Promise(r=>setTimeout(r,250));
      const overlay = ['edit','summary'].includes(dialog)?'modal-overlay':dialog==='schedule'?'schedule-overlay':'shortcuts-overlay';
      assert.equal(await run(`(()=>{const r=document.getElementById('${overlay}').querySelector('.modal').getBoundingClientRect();return r.top>=-1 && r.bottom<=innerHeight+1 && r.left>=0 && r.right<=innerWidth+1})()`),true,`${dialog} outside ${width}x${height}`);
      const control=dialog==='edit'?'modal-save':dialog==='summary'?'modal-close-recap-btn':dialog==='schedule'?'schedule-save':'shortcuts-close';
      await run(`document.getElementById('${control}').scrollIntoView({block:'nearest'})`);
      assert.equal(await run(`(()=>{const r=document.getElementById('${control}').getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight+1})()`),true,`${dialog} action unreachable`);
      if(dialog==='summary' && width===320)await fs.promises.writeFile(path.join(out,'summary-phone.png'),(await win.webContents.capturePage()).toPNG());
      if(dialog==='edit' && height===420)await fs.promises.writeFile(path.join(out,'phone-edit-short-height.png'),(await win.webContents.capturePage()).toPNG());
      await run(['edit','summary'].includes(dialog)?'closeModal(true)':dialog==='schedule'?'closeScheduleDialog()':'closeShortcutHelp()');
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
  await checkCreationWizard();
  assert.equal(await run('currentScope'),'all');
  assert.equal(await run('boardEl.querySelector(".v2-item[data-task-id=a]")!==null'),true);
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
  assert.equal(await run('recapSchedule.hidden && !recapSchedule.querySelector("button")'),true);
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
  await checkDesktopLayouts();
  assert.deepEqual(await run('[...boardEl.querySelectorAll(".v2-item")].map(row=>row.dataset.taskId)'),['late','today']);
  assert.equal(await run('boardEl.querySelector(".v2-day-heading--overdue").textContent.startsWith("En retard")'),true);
  for(const view of ['list','kanban','table']) {
    await run(`document.querySelector('[data-view="${view}"]').click()`);
    assert.equal(await run('boardEl.querySelectorAll("[data-task-action=tomorrow]").length'),0);
    assert.equal(await run('boardEl.querySelectorAll("[data-task-action=choose]").length'),0);
    assert.equal(await run('[...boardEl.querySelectorAll("button:not(.task-summary)")].every(b=>b.classList.contains("v2-edit-btn"))'),true);
    await run('boardEl.querySelector(".task-summary[data-task-id=late]").click()');
    assert.equal(await run('modalBody.style.display'),'none');
    assert.equal(await run('recapSchedule.querySelectorAll("button").length'),2);
    await run('closeModal(true)');
  }
  await run('document.querySelector("[data-view=list]").click();setTaskScope("upcoming")');
  assert.deepEqual(await run('[...boardEl.querySelectorAll(".v2-item")].map(row=>row.dataset.taskId)'),['future']);
  await run('setTaskScope("all")');
  assert.equal(await run('boardEl.querySelector("[data-task-id=undated]")!==null'),true);
  assert.equal(await run('boardEl.querySelector("[data-task-id=done] [data-task-action=tomorrow]")===null'),true);
  for(const id of ['done','cancelled']) {
    await run(`openModal('${id}','view')`);
    assert.equal(await run('recapSchedule.hidden && !recapSchedule.querySelector("button")'),true);
    await run('closeModal(true)');
  }

  await run('setLanguage("en")');assert.equal(await run('document.getElementById("v2-scope-heading").textContent'),'All tasks');
  await run('setLanguage("fr");setTaskScope("today")');
  await new Promise(r=>setTimeout(r,550));
  await fs.promises.writeFile(path.join(out,'n01-desktop.png'),(await win.webContents.capturePage()).toPNG());
  win.setContentSize(375,900);await new Promise(r=>setTimeout(r,100));
  assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true);
  assert.equal(await run('getComputedStyle(boardEl.querySelector(".v2-item")).flexDirection'),'column');
  assert.equal(await run('boardEl.querySelector(".v2-item-body").getBoundingClientRect().width>150'),true);
  await fs.promises.writeFile(path.join(out,'n01-mobile.png'),(await win.webContents.capturePage()).toPNG());
  await run('boardEl.querySelector(".task-summary[data-task-id=late]").click();recapSchedule.querySelector("[data-task-action=tomorrow]").focus();recapSchedule.querySelector("[data-task-action=tomorrow]").click()');
  await until('!localWrites && !syncRunning && todos.find(t=>t.id==="late").due===TaskDates.tomorrow()');
  assert.equal(await run('boardEl.querySelector(".v2-item[data-task-id=late]")===null'),true);
  assert.deepEqual(await run('(()=>{const task=todos.find(t=>t.id==="late");return [task.dueTime,task.status,task.priority,task.notes]})()'),['08:30','todo','high','Keep these notes']);
  assert.equal(await run('(async()=>{const reopened=await TodoData.open("audit");return reopened.read().find(t=>t.id==="late").due===TaskDates.tomorrow()})()'),true);
  assert.equal(await run('modalOverlay.classList.contains("open") && recapScheduleFeedback.textContent.includes("Dossier en retard")'),true);
  assert.equal(await run('document.activeElement.dataset.taskAction'),'tomorrow');
  assert.equal(await run('recapDue.textContent.includes("Demain")'),true);
  await run('closeModal(true);setTaskScope("upcoming");boardEl.querySelector(".task-summary[data-task-id=future]").click();recapSchedule.querySelector("[data-task-action=choose]").click()');
  assert.equal(await run('document.getElementById("schedule-overlay").classList.contains("open")'),true);
  assert.equal(await run('modalOverlay.classList.contains("open")'),true);
  await run('document.getElementById("schedule-date").value=TaskDates.day();document.getElementById("schedule-cancel").click()');
  assert.equal(await run('todos.find(t=>t.id==="future").due===TaskDates.tomorrow()'),true);
  await run('document.querySelector("[data-task-id=future][data-task-action=choose]").click();document.getElementById("schedule-date").value=TaskDates.day();document.getElementById("schedule-form").requestSubmit()');
  await until('reschedulingId===null && !syncRunning && !localWrites');
  assert.equal(await run('todos.find(t=>t.id==="future").dueTime'),'09:00');
  assert.equal(await run('boardEl.querySelector(".v2-item[data-task-id=future]")===null'),true);
  assert.equal(await run('recapScheduleFeedback.textContent.includes("Envoyer les documents")'),true);
  await run('closeModal(true);setTaskScope("today");document.querySelector("[data-task-id=today][data-task-action=edit]").click();modalStatus.value="done";modalSave.click()');
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
  await run(`(async()=>{await archiveStore.sync();const current=archiveStore.read();current.push({id:'archive-ui',text:'Archive récupérable avec un titre plus long pour vérifier le retour à la ligne sur téléphone',notes:'Archive notes',status:'done',archived:true});await archiveStore.save(current);await archiveStore.sync();updateArchivedView();document.querySelector('[data-tab="tab-archive"]').click();})()`);
  assert.equal(await run('[...document.querySelectorAll(".archive-item-actions button")].every(b=>b.getBoundingClientRect().height>=44)'),true);
  assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true);
  await fs.promises.writeFile(path.join(out,'phone-settings-archive-populated.png'),(await win.webContents.capturePage()).toPNG());
  await run('document.querySelectorAll("#archived-tasks-container button")[1].click()');
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
  for(const page of ['pages/login.html','index.html','pages/calendar.html','pages/settings.html','pages/apropos.html','pages/developpeur.html','pages/confidentialite.html','pages/mentions-legales.html','pages/cgu.html','pages/donnees.html','pages/commentaires.html']) {
    await win.loadURL(`http://127.0.0.1:${port}/${page}`);
    await new Promise(r=>setTimeout(r,450));
    const name=path.basename(page,'.html').replace('index','home');
    for(const width of [320,390,1440]) {
      win.setContentSize(width,width===320?740:900);await new Promise(r=>setTimeout(r,150));
      await run('window.scrollTo(0,0)');
      assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,`${page} overflows at ${width}`);
      assert.equal(await run('(()=>{const brand=document.querySelector(".site-header .workspace-brand").getBoundingClientRect(),nav=document.querySelector(".site-header-actions").getBoundingClientRect();return brand.right<=nav.left+1 || brand.bottom<=nav.top+1})()'),true,`header overlaps at ${page} ${width}`);
      if(await run('!!document.querySelector(".bm-trigger")')) {
        assert.equal(await run('getComputedStyle(document.querySelector(".bm-dropdown")).display'),'none');
        await run('document.querySelector(".bm-trigger").click()');
        await new Promise(r=>setTimeout(r,300));
        assert.equal(await run('(()=>{const r=document.querySelector(".bm-dropdown").getBoundingClientRect();return r.left>=0 && r.right<=innerWidth+1})()'),true,`navigation outside ${page} at ${width}`);
        await run('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
        assert.equal(await run('document.activeElement===document.querySelector(".bm-trigger")'),true);
        await new Promise(r=>setTimeout(r,100));
      }
      if(width!==320) await fs.promises.writeFile(path.join(out,`${width===390?'phone':'desktop'}-${name}.png`),(await win.webContents.capturePage()).toPNG());
      if(page==='pages/donnees.html') {
        await run('document.getElementById("btn-delete-account").click()');
        await new Promise(r=>setTimeout(r,150));
        assert.equal(await run('getComputedStyle(document.getElementById("confirm-overlay")).display'),'flex');
        assert.equal(await run('(()=>{const r=document.querySelector("#confirm-overlay .modal").getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight+1 && r.left>=0 && r.right<=innerWidth+1})()'),true,`data dialog outside ${width}`);
        await run('document.getElementById("cancel-action").click()');
        assert.equal(await run('document.getElementById("confirm-overlay").classList.contains("active")'),false);
      }
      if(page==='pages/login.html') {
        await run('document.getElementById("tab-register").click()');
        assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,`registration overflows at ${width}`);
        await run('document.getElementById("tab-login").click()');
      }
      if(page==='pages/settings.html') {
        for(const tab of ['display','archive','danger']) {
          await run(`document.querySelector('[data-tab="tab-${tab}"]').click()`);
          await new Promise(r=>setTimeout(r,100));
          assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,`${tab} preferences overflow at ${width}`);
          assert.equal(await run(`document.querySelector('#tab-${tab} .settings-section').getBoundingClientRect().height>100`),true);
          if(width===390) await fs.promises.writeFile(path.join(out,`phone-settings-${tab}.png`),(await win.webContents.capturePage()).toPNG());
        }
        await run('document.querySelector("[data-tab=tab-account]").click()');
      }
    }
  }
  await win.loadURL(`http://127.0.0.1:${port}/pages/commentaires.html?guest=1`);
  await until('getComputedStyle(document.getElementById("comment-auth-msg")).display==="flex"');
  for(const width of [320,390,1440]) {
    win.setContentSize(width,900);await new Promise(r=>setTimeout(r,100));
    assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,`guest comments overflow at ${width}`);
    assert.equal(await run('getComputedStyle(document.getElementById("comment-form")).display'),'none');
    if(width===390) await fs.promises.writeFile(path.join(out,'phone-comments-guest.png'),(await win.webContents.capturePage()).toPNG());
  }
  await win.loadURL(`http://127.0.0.1:${port}/pages/app-v2.html?timeout=1`);
  await until('!!document.getElementById("timeout-overlay")');
  for(const [width,height] of [[320,420],[390,844],[1440,900]]) {
    win.setContentSize(width,height);await new Promise(r=>setTimeout(r,200));
    assert.equal(await run('(()=>{const r=document.querySelector(".timeout-modal").getBoundingClientRect();return r.left>=0 && r.right<=innerWidth+1 && r.top>=0 && r.bottom<=innerHeight+1})()'),true,`timeout dialog outside ${width}x${height}`);
    assert.equal(await run('document.querySelector(".timeout-modal button").getBoundingClientRect().height>=44'),true);
    if(width===390) await fs.promises.writeFile(path.join(out,'phone-session-expired.png'),(await win.webContents.capturePage()).toPNG());
  }
  console.log('SHARED UI PASS: login/registration, home, calendar, settings, information and data pages at 320/390/1440px.');
  console.log('UI PASS: three views, summary/edit, deletion cancellation, safe text, creation, dirty form, focus, HTTP 403, mobile fit, calendar month/status, password rotation and JSON export.');
  console.log('Console errors:',JSON.stringify(errors));
  win.destroy();server.close();app.exit(errors.length?1:0);
 }catch(error){console.error(error);try{console.error('Layout debug:',await run('JSON.stringify({page:location.pathname,width:innerWidth,overflow:[...document.querySelectorAll("body *")].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,id:e.id,cls:e.className,right:e.getBoundingClientRect().right})).slice(0,15)})'));await fs.promises.writeFile(path.join(out,'failure.png'),(await win.webContents.capturePage()).toPNG());}catch(_){}win?.destroy();server.close();app.exit(1);}
});

