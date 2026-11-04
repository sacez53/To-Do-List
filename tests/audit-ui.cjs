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
window.__alerts=[];window.alert=msg=>__alerts.push(msg);window.confirm=()=>true;
const originalFetch=window.fetch.bind(window);
window.fetch=async(url,options={})=>{
 if(String(url).includes('firebase.json'))return Response.json({url:'https://fixture.invalid'});
 if(String(url).includes('fixture.invalid')){
  if(__fixture.failure)return new Response('{}',{status:__fixture.failure});
  if(options.method==='PUT'){if(options.headers['if-match']!==String(__fixture.version))return new Response('{}',{status:412});__fixture.account=JSON.parse(options.body);__fixture.version++;}
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
app.whenReady().then(async()=>{
 try {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port,partition='audit-'+Date.now();
  session.fromPartition(partition).webRequest.onBeforeRequest((details,callback)=>callback({cancel:!details.url.startsWith('http://127.0.0.1:')&&!details.url.startsWith('data:')}));
  win=new BrowserWindow({show:false,width:1040,height:800,webPreferences:{partition,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}});
  win.webContents.on('console-message',(_event,level,message)=>{if(level===3)errors.push(message);});
  await win.loadURL(`http://127.0.0.1:${port}/pages/app-v2.html`);
  await until('!!taskStore && todos.length===2 && !syncRunning');
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
  await until('todos.length===1 && !syncRunning');assert.equal(await run('todos[0].id'),'a');
  await run('currentView="list";searchQuery="<img src=x onerror=alert(1)>";render()');
  assert.equal(await run('boardEl.querySelector("img")===null'),true);
  await run('searchQuery="";render();fabAdd.click();modalText.value="Created via form";modalSave.click()');
  await until('todos.length===2 && !modalOverlay.classList.contains("open") && !syncRunning');
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
  await run('currentCalendarDate=new Date(2026,0,31);calendarNext.click()');assert.equal(await run('currentCalendarDate.getMonth()'),1);
  await run('calendarViewType="planning";updateCalendarView()');assert.equal(await run('calendarPlanningList.querySelector("b")===null'),true);
  assert.equal(await run('getStatusInfo("inprogress").icon'),'↻');
  await win.loadURL(`http://127.0.0.1:${port}/pages/settings.html`);
  await until('!!archiveStore');
  assert.equal(await run('typeof saveArchivedChanges'), 'function');
  await run(`(async()=>{const salt=generateSalt();__fixture.account.salt=salt;__fixture.account.password=await hashPasswordPBKDF2('old-password',salt);document.getElementById('old-password').value='old-password';document.getElementById('new-password').value='new-password';document.getElementById('confirm-new-password').value='new-password';btnChangePassword.click();})()`);
  await until('!btnChangePassword.disabled && document.getElementById("msg-password").textContent.includes("✓")');
  assert.equal(await run('(async()=>{const key=await importKey(sessionStorage.getItem("encKey"));return (await decryptData(__fixture.account.todos,key)).length})()'),2);
  assert.equal(await run('localStorage.getItem("todo_state_audit").includes("Task A")'),false);
  await win.loadURL(`http://127.0.0.1:${port}/pages/donnees.html`);
  await run('window.__export=null;URL.createObjectURL=blob=>{window.__export=blob;return "blob:audit"};HTMLAnchorElement.prototype.click=function(){};document.getElementById("export-json").click()');
  await until('!!window.__export');
  assert.equal(await run('(async()=>JSON.parse(await __export.text()).donnees.find(t=>t.id==="a").creeLe)()'),'2026-01-01T12:00:00Z');
  await win.loadURL(`http://127.0.0.1:${port}/win_app/src/app.html`);
  await until('!!taskStore && todos.length===2 && !syncRunning');
  await run('setTaskScope("all");document.querySelector(".task-summary").click()');
  assert.equal(await run('modalBody.style.display'),'none');
  await run('modalEditBtn.click()');assert.equal(await run('modalBody.style.display'),'flex');
  await run('closeModal(true)');
  console.log('UI PASS: three views, summary/edit, deletion cancellation, safe text, creation, dirty form, focus, HTTP 403, mobile fit, calendar month/status, password rotation and JSON export.');
  console.log('Console errors:',JSON.stringify(errors));
  win.destroy();server.close();app.exit(errors.length?1:0);
 }catch(error){console.error(error);win?.destroy();server.close();app.exit(1);}
});

