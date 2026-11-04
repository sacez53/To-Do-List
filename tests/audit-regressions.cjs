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
