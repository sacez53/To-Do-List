const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const source = name => fs.readFileSync(`assets/js/${name}.js`, 'utf8');
const storage = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,String(v)), removeItem: k => map.delete(k) }; };
function context(local = storage(), server = { account: {password:'hash',todos:[]}, version:0 }) {
  const ctx = { console, crypto:webcrypto, TextEncoder, TextDecoder, btoa, atob, Response, AbortSignal,
    document:{documentElement:{lang:'fr'}}, localStorage:local, sessionStorage:storage(), navigator:{}, window:{} };
  ctx.fetch = async (url, options = {}) => {
    if (url.includes('firebase.json')) return Response.json({url:'https://fixture.invalid'});
    if (server.failure) return new Response('{}',{status:server.failure});
    if (options.method === 'PUT') {
      if (server.race) { server.race = false; server.version++; return new Response('{}',{status:412}); }
      if (options.headers['if-match'] !== String(server.version)) return new Response('{}',{status:412});
      server.account = JSON.parse(options.body); server.version++;
    }
    return Response.json(server.account,{headers:{ETag:String(server.version)}});
  };
  vm.createContext(ctx);
  for (const name of ['runtime','crypto','task-store']) { vm.runInContext(source(name),ctx); Object.assign(ctx,ctx.window); }
  ctx.sessionStorage.setItem('encKey',btoa(String.fromCharCode(...new Uint8Array(32).fill(7))));
  return ctx;
}
const plain = value => JSON.parse(JSON.stringify(value));
test('HTTP errors reject instead of acknowledging a save',async () => {
  const ctx=context(); ctx.fetch=async()=>new Response('{}',{status:403});
  await assert.rejects(ctx.TodoRuntime.fetch('/test'),{status:403});
});
test('encrypted recovery survives reopening and retries a failed request', async () => {
  const local=storage(), server={account:{password:'hash',todos:[]},version:0};
  const ctx=context(local,server), store=await ctx.TodoData.open('alice');
  await store.sync(); await store.save([{id:'a',text:'Private notes'}]);
  assert(!local.getItem('todo_state_alice').includes('Private notes'));
  server.failure=500; await assert.rejects(store.sync()); assert(store.pending());
  delete server.failure;
  const restored=await context(local,server).TodoData.open('alice');
  assert.equal(restored.read()[0].text,'Private notes'); await restored.sync();
  assert.equal(restored.pending(),false); assert(server.account.todos.iv);
});
test('two devices preserve independent edits and conditional retries',async () => {
  const server={account:{password:'hash',todos:[{id:'a',text:'A'},{id:'b',text:'B'}]},version:0};
  const a=await context(storage(),server).TodoData.open('alice'), b=await context(storage(),server).TodoData.open('alice');
  await a.sync(); await b.sync();
  const la=a.read(),lb=b.read();la[0].text='A edited';lb[1].text='B edited';
  await a.save(la);await b.save(lb);await a.sync();server.race=true;await b.sync();
  assert.deepEqual(plain((await a.sync()).map(t=>t.text)),['A edited','B edited']);
});
test('same-task conflicts keep local work without overwriting remote',async () => {
  const server={account:{password:'hash',todos:[{id:'a',text:'Original'}]},version:0};
  const a=await context(storage(),server).TodoData.open('alice'),b=await context(storage(),server).TodoData.open('alice');
  await a.sync();await b.sync();await a.save([{id:'a',text:'First edit'}]);await b.save([{id:'a',text:'Second edit'}]);await a.sync();
  await assert.rejects(b.sync(),/Conflit/);assert.equal(b.read()[0].text,'Second edit');assert(b.pending());
});
test('legacy plaintext migrates only after encryption; missing keys cannot open',async () => {
  const local=storage();local.setItem('todos_alice',JSON.stringify([{id:1,text:'Legacy'}]));
  const ctx=context(local);await ctx.TodoData.open('alice');assert.equal(local.getItem('todos_alice'),null);assert(!local.getItem('todo_state_alice').includes('Legacy'));
  ctx.sessionStorage.removeItem('encKey');await assert.rejects(ctx.TodoData.open('alice'),/Clé/);
});
test('deleted account cannot be recreated by a pending client',async () => {
  const server={account:null,version:0},store=await context(storage(),server).TodoData.open('alice');
  await store.save([{id:1,text:'Offline'}]);await assert.rejects(store.sync(),/Compte/);assert.equal(server.account,null);
});
test('rapid successive local edits remain ordered without a false conflict',async () => {
  const ctx=context(), store=await ctx.TodoData.open('alice');await store.sync();
  const first=store.save([{id:'a',text:'First'}]);
  const second=store.save([{id:'a',text:'Second'}]);
  await Promise.all([first,second]);await store.sync();assert.equal(store.read()[0].text,'Second');
});
function fn(name) { const s=source('app-v2'),start=s.indexOf(`function ${name}(`);return s.slice(start,s.indexOf('\n}',start)+2); }
test('real priority sort, date filters, and overdue helper',()=>{
  const ctx={TaskDates:dates(),scopeNow:new Date(),PRIORITY_ORDER:{high:0,normal:1,low:2},currentSort:'priority',getLanguage:()=> 'fr',Date,
    filterStatuses:[],filterPriorities:[],filterHasNotes:false,filterNoDue:false,filterDueBefore:'2026-11-03',filterDueAfter:'',searchQuery:''};
  vm.createContext(ctx);for(const name of ['applySort','applyFilters','isOverdue'])vm.runInContext(fn(name),ctx);
  assert.deepEqual(plain(ctx.applySort([{text:'N',priority:'normal'},{text:'H',priority:'high'},{text:'L',priority:'low'}]).map(t=>t.priority)),['high','normal','low']);
  assert.equal(ctx.applyFilters([{text:'Undated',due:null}]).length,0);
  assert.equal(ctx.isOverdue('2000-01-01','12:00','todo'),true);assert.equal(ctx.isOverdue('2000-01-01','12:00','done'),false);
});
test('all shipped JS parses and service worker precache paths exist',()=>{
  for(const file of fs.readdirSync('assets/js').filter(f=>f.endsWith('.js')))new vm.Script(source(file.slice(0,-3)),{filename:file});
  const ctx={self:{addEventListener(){}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('sw.js','utf8')+'\nglobalThis.paths=urlsToCache;',ctx);
  for(const path of ctx.paths)assert(fs.existsSync(path.split('?')[0]),path);
});

function dates() {
  const ctx={window:{},Date};vm.createContext(ctx);vm.runInContext(source('task-dates'),ctx);return ctx.window.TaskDates;
}
test('N01: today includes overdue and current tasks; upcoming excludes today and inactive tasks',()=>{
  const d=dates(), now=new Date(2026,10,4,12);
  const tasks=[
    {id:'past',due:'2026-11-03',status:'todo'},
    {id:'today',due:'2026-11-04',status:'inprogress'},
    {id:'future',due:'2026-11-05',status:'waiting'},
    {id:'undated',status:'todo'},
    {id:'done',due:'2026-11-04',status:'done'},
    {id:'cancelled',due:'2026-11-05',status:'cancelled'},
    {id:'archived',due:'2026-11-04',status:'todo',archived:true}
  ];
  assert.deepEqual(tasks.filter(t=>d.matches(t,'today',now)).map(t=>t.id),['past','today']);
  assert.deepEqual(tasks.filter(t=>d.matches(t,'upcoming',now)).map(t=>t.id),['future']);
  assert.deepEqual(tasks.filter(t=>d.matches(t,'all',now)).map(t=>t.id),['past','today','future','undated','done','cancelled']);
});
test('N01: local midnight moves tasks from upcoming to today, then to overdue',()=>{
  const previous=process.env.TZ;process.env.TZ='Europe/Paris';
  try {
    const d=dates(), task={due:'2026-11-04',status:'todo'};
    const before=new Date(2026,10,3,23,59,59,999),after=new Date(2026,10,4,0,0);
    assert(d.matches(task,'upcoming',before));assert(!d.matches(task,'today',before));
    assert(d.matches(task,'today',after));assert(!d.matches(task,'upcoming',after));
    assert(!d.overdue(task.due,null,task.status,new Date(2026,10,4,23,59,59,999)));
    assert(d.overdue(task.due,null,task.status,new Date(2026,10,5,0,0)));
    assert.equal(d.nextTick(before),21);
  } finally { if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous; }
});
test('N01: local dates and tomorrow remain correct across DST, month and year changes',()=>{
  const previous=process.env.TZ;
  try {
    process.env.TZ='Europe/Paris';const d=dates();
    assert.equal(d.tomorrow(new Date(2026,2,28,23,30)),'2026-03-29');
    assert.equal(d.tomorrow(new Date(2026,9,24,23,30)),'2026-10-25');
    assert.equal(d.tomorrow(new Date(2026,0,31,23,30)),'2026-02-01');
    assert.equal(d.tomorrow(new Date(2026,11,31,23,30)),'2027-01-01');
    process.env.TZ='America/New_York';
    assert.equal(d.day(new Date('2026-11-04T02:30:00Z')),'2026-11-03');
    assert.equal(d.tomorrow(new Date('2026-11-04T02:30:00Z')),'2026-11-04');
  } finally { if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous; }
});
test('N01: timed tasks expire at their local deadline and inactive tasks never show overdue',()=>{
  const d=dates();
  assert(!d.overdue('2026-11-04','12:00','todo',new Date(2026,10,4,11,59,59)));
  assert(d.overdue('2026-11-04','12:00','todo',new Date(2026,10,4,12,0)));
  for(const status of ['done','cancelled'])assert(!d.overdue('2026-11-03','12:00',status,new Date(2026,10,4,12)));
  const tasks=[{due:'2026-11-05',dueTime:null},{due:'2026-11-05',dueTime:'09:00'},{due:'2026-11-04',dueTime:null}];
  assert.equal(tasks.sort(d.compare)[0].due,'2026-11-04');assert.equal(tasks[1].dueTime,'09:00');
});

function captureKeys() {
  const ctx={window:{}};vm.createContext(ctx);vm.runInContext(source('quick-capture'),ctx);return ctx.window.QuickCaptureKeys;
}
test('N02: documented keys route to quick entry, full form and help',()=>{
  const keys=captureKeys();
  assert.equal(keys.action({key:'n'},true,null,false),'quick');
  assert.equal(keys.action({key:'N',shiftKey:true},true,null,false),'full');
  assert.equal(keys.action({key:'?',shiftKey:true},true,null,false),'help');
  assert.equal(keys.action({key:'x'},true,null,false),null);
});
test('N02: shortcuts respect preferences, dialogs, composition and browser modifiers',()=>{
  const keys=captureKeys();
  assert.equal(keys.action({key:'n'},false,null,false),null);
  assert.equal(keys.action({key:'n'},true,null,true),null);
  for(const flag of ['ctrlKey','altKey','metaKey','repeat','isComposing','defaultPrevented'])assert.equal(keys.action({key:'n',[flag]:true},true,null,false),null,flag);
  assert.equal(keys.action({key:'n',keyCode:229},true,null,false),null);
});
test('N02: editable fields keep their keystrokes',()=>{
  const keys=captureKeys();
  assert.equal(keys.action({key:'N',shiftKey:true},true,{isContentEditable:true},false),null);
  assert.equal(keys.action({key:'?'},true,{closest:()=>({})},false),null);
  assert.equal(keys.action({key:'n'},true,{closest:()=>null},false),'quick');
});

test('N03: trash and restore preserve every task field; obsolete undo generations are refused',()=>{
  const d=context().TodoData, now=new Date();
  const original={id:'x',text:'Title',status:'waiting',priority:'high',due:'2026-12-15',dueTime:'09:45',notes:'Private notes',created:'2026-01-01T12:00:00.000Z',archived:true};
  const deleted=d.trash(original,now);
  assert.equal(original.deletedAt,undefined);assert.equal(deleted.deletedAt,now.toISOString());
  assert.deepEqual(plain(d.restore(deleted,now,deleted.deletionId)),original);
  assert.throws(()=>d.restore(deleted,now,'stale-undo'));
  assert.throws(()=>d.restore(d.purge(deleted),now));
});
test('N03: retention closes exactly at 30 days, converting content into a minimal marker',()=>{
  const d=context().TodoData, start=new Date('2026-10-01T12:00:00.000Z'), deleted=d.trash({id:'x',text:'Secret',notes:'Private'},start);
  const end=new Date(start.getTime()+d.RETENTION_MS);
  assert(d.inTrash(deleted,new Date(end.getTime()-1)));assert(!d.inTrash(deleted,end));
  assert.throws(()=>d.restore(deleted,end));
  assert.deepEqual(Object.keys(d.expire([deleted],end)[0]).sort(),['id','purgedAt']);
});
test('N03: concurrent delete/edit stays in trash; permanent markers dominate every merge',()=>{
  const d=context().TodoData, original={id:'x',text:'Original'}, deleted=d.trash(original), edited={...original,text:'Edited offline'}, marker=d.purge(deleted);
  assert(d.merge([original],[edited],[deleted])[0].deletedAt);
  assert(d.merge([original],[deleted],[edited])[0].deletedAt);
  for(const args of [[[deleted],[original],[marker]],[[deleted],[marker],[original]],[[marker],[],[original]]])assert.deepEqual(plain(d.merge(...args)),[plain(marker)]);
});
test('N03: an offline restore cannot resurrect a task purged by another device',async()=>{
  const server={account:{password:'hash',todos:[{id:'x',text:'Secret',notes:'Private',status:'waiting',due:'2026-12-01',dueTime:'10:00'}]},version:0};
  const ca=context(storage(),server),cb=context(storage(),server),a=await ca.TodoData.open('alice'),b=await cb.TodoData.open('alice');
  await a.sync();await a.save([ca.TodoData.trash(a.read()[0])]);await a.sync();await b.sync();
  const offlineRestore=cb.TodoData.restore(b.read()[0]);
  await a.save([ca.TodoData.purge(a.read()[0])]);await a.sync();
  await b.save([offlineRestore]);await b.sync();
  assert(b.read()[0].purgedAt);assert.equal(b.read()[0].text,undefined);
  await a.sync();assert(a.read()[0].purgedAt);
});
test('N03: an ordinary restore syncs with its original dates, notes and status',async()=>{
  const server={account:{password:'hash',todos:[{id:'x',text:'Keep',status:'inprogress',notes:'Notes',due:'2026-12-01',dueTime:'10:00'}]},version:0};
  const ca=context(storage(),server),cb=context(storage(),server),a=await ca.TodoData.open('alice'),b=await cb.TodoData.open('alice');
  await a.sync();const original=plain(a.read()[0]);await a.save([ca.TodoData.trash(original)]);await a.sync();await b.sync();
  await b.save([cb.TodoData.restore(b.read()[0])]);await b.sync();
  assert.deepEqual(plain(await a.sync()),[original]);
});
test('N03: marker omission is repaired and no deleted content remains in either cache snapshot',async()=>{
  const local=storage(),server={account:{password:'hash',todos:[{id:'x',text:'Secret',notes:'Private'}]},version:0},ctx=context(local,server),store=await ctx.TodoData.open('alice');
  await store.sync();await store.save([ctx.TodoData.trash(store.read()[0])]);await store.sync();await store.save([ctx.TodoData.purge(store.read()[0])]);await store.sync();
  const key=await ctx.importKey(ctx.sessionStorage.getItem('encKey'));
  const state=await ctx.decryptData(JSON.parse(local.getItem('todo_state_alice')),key);
  assert(!JSON.stringify(state).includes('Secret'));assert(!JSON.stringify(state).includes('Private'));
  server.account.todos=[];server.version++;
  await store.sync();assert(store.read()[0].purgedAt);
  const remote=await ctx.decryptData(server.account.todos,key);assert(remote[0].purgedAt);
});
test('N03: expiration persists offline and is synchronized when the network returns',async()=>{
  const old=new Date(Date.now()-31*86400000),ctx=context(),store=await ctx.TodoData.open('alice');
  await store.save([ctx.TodoData.trash({id:'old',text:'Expired'},old)]);
  assert(store.read()[0].purgedAt);assert(store.pending());
  await store.sync();assert(!store.pending());assert.equal(store.read()[0].text,undefined);
});
test('N03: date scopes hide both trash and permanent deletion markers',()=>{
  const d=dates(),now=new Date(),base={id:'x',status:'todo',due:d.day(now)};
  for(const task of [{...base,deletedAt:now.toISOString()},{id:'x',purgedAt:now.toISOString()}])for(const scope of ['all','today','upcoming'])assert(!d.matches(task,scope,now));
});
