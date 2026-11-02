import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { createWorker,sendPush,validateSubscription } from '../push-server/worker.mjs';
const require=createRequire(import.meta.url);
const model=require('../assets/js/push-model.js');

function database() {
  const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../push-server/schema.sql',import.meta.url),'utf8'));
  function statement(query,parameters=[]) {
    return { bind:(...args)=>statement(query,args),first:async()=>sql.prepare(query).get(...parameters)||null,all:async()=>({results:sql.prepare(query).all(...parameters)}),run:async()=>sql.prepare(query).run(...parameters) };
  }
  return {prepare:statement,batch:async statements=>{sql.exec('BEGIN');try{const rows=[];for(const s of statements)rows.push(await s.run());sql.exec('COMMIT');return rows;}catch(e){sql.exec('ROLLBACK');throw e;}},sql};
}
async function fixtures() {
  const pair=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
  const p256dh=Buffer.from(await crypto.subtle.exportKey('raw',pair.publicKey)).toString('base64url');
  const vapid=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  return {subscription:{endpoint:'https://web.push.apple.com/test-subscription',keys:{p256dh,auth:Buffer.alloc(16,5).toString('base64url')}},publicKey:Buffer.from(await crypto.subtle.exportKey('raw',vapid.publicKey)).toString('base64url'),privateKey:(await crypto.subtle.exportKey('jwk',vapid.privateKey)).d};
}
async function setup(send=async()=>new Response('',{status:201})) {
  const fixture=await fixtures(),DB=database(),worker=createWorker(send);
  const env={DB,ALLOWED_ORIGINS:'https://example.com',VAPID_SUBJECT:'mailto:test@example.com',VAPID_PUBLIC_KEY:fixture.publicKey,VAPID_PRIVATE_KEY:fixture.privateKey};
  const token='a'.repeat(43),deviceKey='b'.repeat(43),id='11111111-1111-4111-8111-111111111111';
  async function request(path,body,options={}) {
    return worker.fetch(new Request('https://push.example.com'+path,{method:options.method||'POST',headers:{Origin:options.origin||'https://example.com',Authorization:'Bearer '+(options.token||token),'X-Device-Key':options.deviceKey||deviceKey,'Content-Type':'application/json',...(options.headers||{})},body:body===undefined?undefined:JSON.stringify(body)}),env);
  }
  const subscribe=()=>request('/subscriptions',{id,subscription:fixture.subscription,lang:'fr'});
  return {fixture,DB,worker,env,token,deviceKey,id,request,subscribe};
}
test('iOS requires Home Screen installation; Android is supported without an iOS gate',()=>{
  const env={secure:true,serviceWorker:true,pushManager:true,notifications:true};
  assert.equal(model.support({...env,ios:true,standalone:false}),'push_ios_install');
  assert.equal(model.support({...env,ios:true,standalone:true}),null);
  assert.equal(model.support({...env,ios:false,standalone:true}),null);
  assert.equal(model.support({...env,secure:false}),'push_https');
});
test('reminders use local date/time, default to 9 am, exclude completed/archived tasks and contain no titles',()=>{
  const now=new Date(2026,10,2,0).getTime();
  const rows=model.reminders([{id:1,text:'secret',notes:'private',due:'2026-11-02',dueTime:'10:30',status:'todo'},{id:2,due:'2026-11-02',status:'todo'},{id:3,due:'2026-11-02',status:'done'},{id:4,due:'2026-11-02',archived:true},{id:5,due:'2026-02-31'},{id:6,due:'2026-11-02',dueTime:'bad'}],now);
  assert.equal(rows.length,2);assert.equal(new Date(rows[0].dueAt).getHours(),9);assert.equal(new Date(rows[1].dueAt).getMinutes(),30);
  assert.equal(JSON.stringify(rows).includes('secret'),false);assert.equal(JSON.stringify(rows).includes('private'),false);
});
test('Web Push payload uses real aes128gcm/VAPID encryption accepted by Apple and Chrome',async()=>{
  const f=await fixtures();let captured;
  const response=await sendPush(f.subscription,{VAPID_SUBJECT:'mailto:test@example.com',VAPID_PUBLIC_KEY:f.publicKey,VAPID_PRIVATE_KEY:f.privateKey},{body:'Test notification'},async(url,options)=>{captured={url,options};return new Response('',{status:201});});
  assert.equal(response.status,201);const headers=new Headers(captured.options.headers);
  assert.equal(headers.get('Content-Encoding'),'aes128gcm');assert.match(headers.get('Authorization'),/^vapid /);assert.equal(headers.get('TTL'),'900');
  assert.equal(captured.options.redirect,'error');assert.equal(Buffer.from(captured.options.body).includes(Buffer.from('Test notification')),false);
});
test('subscribe, schedule and cron delivery are persistent and deduplicated',async()=>{
  const sent=[],a=await setup(async(subscription,env,payload)=>{sent.push(payload);return new Response('',{status:201});});
  assert.equal((await a.subscribe()).status,200);
  const dueAt=Date.now()-1000;
  assert.equal((await a.request('/schedule',{reminders:[{taskId:'task-1',dueAt}]})).status,200);
  await a.worker.scheduled({scheduledTime:Date.now()},a.env);assert.equal(sent.length,1);assert.equal(sent[0].taskId,'task-1');
  await a.request('/schedule',{reminders:[{taskId:'task-1',dueAt}]});
  await a.worker.scheduled({scheduledTime:Date.now()+1000},a.env);assert.equal(sent.length,1);
  assert.equal(a.DB.sql.prepare('SELECT COUNT(*) AS n FROM deliveries WHERE delivered_at IS NOT NULL').get().n,1);
});
test('completion/deletion cancels a reminder and rescheduling creates a new delivery',async()=>{
  const sent=[],a=await setup(async(s,e,p)=>{sent.push(p);return new Response('',{status:201});});await a.subscribe();
  const dueAt=Date.now()-1000;
  await a.request('/schedule',{reminders:[{taskId:'task-1',dueAt}]});await a.request('/schedule',{reminders:[]});
  await a.worker.scheduled({scheduledTime:Date.now()},a.env);assert.equal(sent.length,0);
  await a.request('/schedule',{reminders:[{taskId:'task-1',dueAt:dueAt+500}]});
  await a.worker.scheduled({scheduledTime:Date.now()+1000},a.env);assert.equal(sent.length,1);
});
test('200 simultaneous deadlines are bundled in one push without losing reminders',async()=>{
  const sent=[],a=await setup(async(s,e,p)=>{sent.push(p);return new Response('',{status:201});});await a.subscribe();
  const dueAt=Date.now()-1000;
  const reminders=Array.from({length:200},(_,i)=>({taskId:'task-'+i,dueAt}));
  assert.equal((await a.request('/schedule',{reminders})).status,200);
  await a.worker.scheduled({scheduledTime:Date.now()},a.env);
  assert.equal(sent.length,1);assert.match(sent[0].body,/200/);assert.equal(sent[0].taskId,null);
  assert.equal(a.DB.sql.prepare('SELECT COUNT(*) AS n FROM deliveries WHERE delivered_at IS NOT NULL').get().n,200);
});
test('temporary provider failure retries; expired subscriptions are removed',async()=>{
  let calls=0;const a=await setup(async()=>new Response('',{status:++calls===1?503:201}));await a.subscribe();
  await a.request('/schedule',{reminders:[{taskId:'task-1',dueAt:Date.now()-1000}]});const now=Date.now();
  await a.worker.scheduled({scheduledTime:now},a.env);await a.worker.scheduled({scheduledTime:now+1000},a.env);assert.equal(calls,1);
  await a.worker.scheduled({scheduledTime:now+61000},a.env);assert.equal(calls,2);
  const expired=await setup(async()=>new Response('',{status:410}));await expired.subscribe();
  assert.equal((await expired.request('/test',{id:expired.id})).status,410);
  assert.equal(expired.DB.sql.prepare('SELECT COUNT(*) AS n FROM subscriptions').get().n,0);
});
test('capabilities isolate accounts and per-device keys protect removal and takeover',async()=>{
  const a=await setup();await a.subscribe();
  assert.equal((await a.request('/subscriptions/'+a.id,undefined,{method:'DELETE',deviceKey:'c'.repeat(43)})).status,403);
  assert.equal((await a.request('/test',{id:a.id},{token:'c'.repeat(43)})).status,404);
  assert.equal((await a.request('/schedule',{reminders:[{taskId:'other',dueAt:Date.now()+1000}]},{token:'c'.repeat(43)})).status,200);
  assert.equal(a.DB.sql.prepare('SELECT COUNT(*) AS n FROM reminders').get().n,0);
  assert.equal((await a.request('/subscriptions',{id:a.id,subscription:a.fixture.subscription},{deviceKey:'c'.repeat(43)})).status,409);
  assert.equal((await a.request('/account',undefined,{method:'DELETE'})).status,200);
  assert.equal(a.DB.sql.prepare('SELECT COUNT(*) AS n FROM subscriptions').get().n,0);
});
test('untrusted origins, SSRF endpoints, malformed reminders and unbounded registration are rejected',async()=>{
  const a=await setup();assert.equal((await a.request('/config',undefined,{method:'GET',origin:'https://evil.example'})).status,403);
  assert.throws(()=>validateSubscription({...a.fixture.subscription,endpoint:'https://127.0.0.1/admin'}));
  assert.throws(()=>validateSubscription({...a.fixture.subscription,endpoint:'https://fcm.googleapis.com.evil.example/'}));
  await a.subscribe();assert.equal((await a.request('/schedule',{reminders:[{taskId:'x',dueAt:'bad'}]})).status,400);
  for(let i=0;i<42;i++)await a.request('/schedule',{reminders:[]});
  assert.equal((await a.request('/schedule',{reminders:[]})).status,429);
});
test('service worker shows visible pushes and constrains clicks to the app',async()=>{
  const events=new Map(),shown=[],opened=[];
  const scope='https://example.com/To-Do-List/';
  const self={location:{origin:'https://example.com'},registration:{scope,showNotification:async(title,options)=>shown.push({title,options})},clients:{matchAll:async()=>[],openWindow:async url=>opened.push(url)},addEventListener:(name,fn)=>events.set(name,fn)};
  vm.runInNewContext(readFileSync(new URL('../sw.js',import.meta.url),'utf8'),{self,URL,Promise});
  let work;events.get('push')({data:{json:()=>({body:'Due now',taskId:'one&two',tag:'same'})},waitUntil:promise=>work=promise});await work;
  assert.equal(shown.length,1);assert.equal(new URL(shown[0].options.data.url).searchParams.get('viewTask'),'one&two');
  events.get('notificationclick')({notification:{close:()=>{},data:{url:'https://evil.example/'}},waitUntil:promise=>work=promise});await work;
  assert.equal(opened[0],scope+'pages/app-v2.html');
});
