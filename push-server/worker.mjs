import { buildPushPayload } from '@block65/webcrypto-web-push';

const encoder = new TextEncoder();
const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
const error = (status,code) => { throw Object.assign(new Error(code),{status}); };
const keyValid = value => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
export function validateSubscription(value) {
  if (!value || typeof value.endpoint !== 'string' || value.endpoint.length > 2048) error(400,'Invalid subscription');
  const url = new URL(value.endpoint);
  const allowed = ['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'];
  if (url.protocol !== 'https:' || url.port || url.username || url.password || !allowed.some(host=>url.hostname===host || (host==='web.push.apple.com' && url.hostname.endsWith('.push.apple.com')))) error(400,'Invalid push endpoint');
  if (!/^[A-Za-z0-9_-]{87}$/.test(value.keys?.p256dh || '') || !/^[A-Za-z0-9_-]{22}$/.test(value.keys?.auth || '')) error(400,'Invalid push keys');
  return { endpoint:url.href,keys:{p256dh:value.keys.p256dh,auth:value.keys.auth},expirationTime:null };
}
export async function projectReminders(rows,now=Date.now()) {
  if (!Array.isArray(rows) || rows.length>200) error(400,'Too many reminders');
  const seen=new Set();
  return Promise.all(rows.map(async row=>{
    if (!row || typeof row.taskId!=='string' || row.taskId.length>200 || !row.taskId || !Number.isSafeInteger(row.dueAt) || row.dueAt<now-15*60000 || row.dueAt>now+10*366*86400000) error(400,'Invalid reminder');
    const key=await hash(row.taskId+':'+row.dueAt);
    if(seen.has(key))error(400,'Duplicate reminder');seen.add(key);
    return {key,taskId:row.taskId,dueAt:row.dueAt};
  }));
}
async function rateLimit(db,ip,now) {
  const id=await hash(ip),window=Math.floor(now/60000);
  const row=await db.prepare(`INSERT INTO rate_limits(id,window,count) VALUES(?,?,1)
    ON CONFLICT(id) DO UPDATE SET window=excluded.window,count=CASE WHEN rate_limits.window=excluded.window THEN rate_limits.count+1 ELSE 1 END RETURNING count`).bind(id,window).first();
  if(row.count>40)error(429,'Too many requests');
}
export async function sendPush(subscription,env,data,send=fetch) {
  validateSubscription(subscription);
  const payload=await buildPushPayload({data:JSON.stringify(data),options:{ttl:900}},subscription,{subject:env.VAPID_SUBJECT,publicKey:env.VAPID_PUBLIC_KEY,privateKey:env.VAPID_PRIVATE_KEY});
  // Redirects are forbidden: a stored endpoint cannot turn into an SSRF proxy.
  return send(subscription.endpoint,{...payload,redirect:'error',signal:AbortSignal.timeout(15000)});
}
export function notification(row,test=false) {
  const en=row.lang==='en';
  return {
    title:'Ma To-Do List',
    body:test ? (en?'Push notifications are working on this device.':'Les notifications push fonctionnent sur cet appareil.') : row.count>1 ? (en?`${row.count} tasks are due. Open your list.`:`${row.count} tâches arrivent à échéance. Ouvrez votre liste.`) : (en?'A task is due. Open your list to see it.':'Une tâche arrive à échéance. Ouvrez votre liste pour la consulter.'),
    taskId:test || row.count>1 ? null : row.task_id,
    tag:test?'todo-push-test':'todo-reminder-'+row.reminder_key,
  };
}
export function createWorker(deliver=sendPush) {
  return {
    async fetch(request,env) {
      const origin=request.headers.get('Origin');
      const allowed=(env.ALLOWED_ORIGINS||'').split(',').map(value=>value.trim());
      const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
      if(origin && !allowed.includes(origin))return Response.json({error:'Origin refused'},{status:403,headers});
      if(origin)headers['Access-Control-Allow-Origin']=origin;
      headers['Access-Control-Allow-Headers']='Content-Type,Authorization,X-Device-Key';
      headers['Access-Control-Allow-Methods']='GET,POST,DELETE,OPTIONS';
      const respond=(value,status=200)=>Response.json(value,{status,headers});
      if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
      try {
        const path=new URL(request.url).pathname;
        if(path==='/config' && request.method==='GET') {
          if(!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY)error(503,'Push service not configured');
          return respond({publicKey:env.VAPID_PUBLIC_KEY});
        }
        if(!['POST','DELETE'].includes(request.method))error(405,'Method not allowed');
        if(Number(request.headers.get('Content-Length')||0)>60000)error(413,'Payload too large');
        const text=request.method==='POST'?await request.text():'';
        if(text.length>60000)error(413,'Payload too large');
        const body=text?JSON.parse(text):{};
        const now=Date.now(),db=env.DB;
        await rateLimit(db,request.headers.get('CF-Connecting-IP')||'local',now);
        const deviceKey=request.headers.get('X-Device-Key');
        if(path.startsWith('/subscriptions/') && request.method==='DELETE') {
          if(!keyValid(deviceKey))error(401,'Device key required');
          const id=decodeURIComponent(path.slice('/subscriptions/'.length));
          const existing=await db.prepare('SELECT device_key_hash FROM subscriptions WHERE id=?').bind(id).first();
          if(existing && existing.device_key_hash!==await hash(deviceKey))error(403,'Device key refused');
          await db.prepare('DELETE FROM subscriptions WHERE id=?').bind(id).run();
          return respond({ok:true});
        }
        const secret=/^Bearer ([A-Za-z0-9_-]{43})$/.exec(request.headers.get('Authorization')||'')?.[1];
        if(!secret)error(401,'Reminder capability required');
        const owner=await hash(secret);
        if(path==='/account' && request.method==='DELETE') {
          await db.batch([db.prepare('DELETE FROM reminders WHERE owner_id=?').bind(owner),db.prepare('DELETE FROM subscriptions WHERE owner_id=?').bind(owner)]);
          return respond({ok:true});
        }
        if(path==='/subscriptions' && request.method==='POST') {
          if(!keyValid(deviceKey) || !/^[a-f0-9-]{36}$/i.test(body.id||''))error(400,'Invalid device');
          const subscription=validateSubscription(body.subscription),deviceHash=await hash(deviceKey);
          const existing=await db.prepare('SELECT id,device_key_hash FROM subscriptions WHERE id=? OR endpoint=?').bind(body.id,subscription.endpoint).first();
          if(existing && (existing.id!==body.id || existing.device_key_hash!==deviceHash))error(409,'Subscription already registered');
          const count=await db.prepare('SELECT COUNT(*) AS n FROM subscriptions WHERE owner_id=?').bind(owner).first();
          if(!existing && count.n>=10)error(400,'Device limit reached');
          await db.prepare(`INSERT INTO subscriptions(id,device_key_hash,owner_id,endpoint,subscription,lang,updated_at) VALUES(?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id,endpoint=excluded.endpoint,subscription=excluded.subscription,lang=excluded.lang,updated_at=excluded.updated_at`).bind(body.id,deviceHash,owner,subscription.endpoint,JSON.stringify(subscription),body.lang==='en'?'en':'fr',now).run();
          return respond({ok:true});
        }
        if(path==='/schedule' && request.method==='POST') {
          const subscribed=await db.prepare('SELECT id FROM subscriptions WHERE owner_id=? LIMIT 1').bind(owner).first();
          if(!subscribed)return respond({scheduled:0});
          const rows=await projectReminders(body.reminders,now),json=JSON.stringify(rows);
          await db.batch([
            db.prepare(`DELETE FROM reminders WHERE owner_id=? AND reminder_key NOT IN (SELECT json_extract(value,'$.key') FROM json_each(?))`).bind(owner,json),
            db.prepare(`INSERT INTO reminders(owner_id,reminder_key,task_id,due_at)
              SELECT ?,json_extract(value,'$.key'),json_extract(value,'$.taskId'),json_extract(value,'$.dueAt') FROM json_each(?) WHERE true
              ON CONFLICT(owner_id,reminder_key) DO NOTHING`).bind(owner,json)
          ]);
          return respond({scheduled:rows.length});
        }
        if(path==='/test' && request.method==='POST') {
          if(!keyValid(deviceKey))error(401,'Device key required');
          const row=await db.prepare('SELECT * FROM subscriptions WHERE id=? AND owner_id=? AND device_key_hash=?').bind(body.id,owner,await hash(deviceKey)).first();
          if(!row)error(404,'Subscription not found');
          const sent=await deliver(JSON.parse(row.subscription),env,notification(row,true));
          if([404,410].includes(sent.status)){await db.prepare('DELETE FROM subscriptions WHERE id=?').bind(row.id).run();error(410,'Subscription expired');}
          if(!sent.ok)error(502,'Push provider refused');
          return respond({accepted:true});
        }
        error(404,'Not found');
      } catch(e) { return respond({error:e.status?e.message:'Push service unavailable'},e.status||503); }
    },
    async scheduled(event,env) {
      const now=event.scheduledTime||Date.now(),db=env.DB;
      // Bundle simultaneous deadlines per device: 200 tasks at 9am should
      // produce one useful push, not exhaust the free tier or lose 155 tasks.
      const {results}=await db.prepare(`SELECT s.*,MIN(r.due_at) AS first_due FROM reminders r JOIN subscriptions s ON s.owner_id=r.owner_id
        LEFT JOIN deliveries d ON d.owner_id=r.owner_id AND d.subscription_id=s.id AND d.reminder_key=r.reminder_key
        WHERE r.due_at<=? AND r.due_at>? AND s.updated_at>? AND d.delivered_at IS NULL AND COALESCE(d.lease_until,0)<=? AND COALESCE(d.retry_at,0)<=?
        GROUP BY s.id ORDER BY first_due LIMIT 3`).bind(now,now-900000,now-90*86400000,now,now).all();
      for(const row of results) {
        const due=await db.prepare(`SELECT r.reminder_key,r.task_id FROM reminders r
          LEFT JOIN deliveries d ON d.owner_id=r.owner_id AND d.subscription_id=? AND d.reminder_key=r.reminder_key
          WHERE r.owner_id=? AND r.due_at<=? AND r.due_at>? AND d.delivered_at IS NULL AND COALESCE(d.lease_until,0)<=? AND COALESCE(d.retry_at,0)<=?
          ORDER BY r.due_at,r.reminder_key LIMIT 200`).bind(row.id,row.owner_id,now,now-900000,now,now).all();
        const keys=JSON.stringify(due.results.map(task=>task.reminder_key));
        const claimed=await db.prepare(`INSERT INTO deliveries(owner_id,subscription_id,reminder_key,lease_until,attempts)
          SELECT ?,?,value,?,1 FROM json_each(?) WHERE true
          ON CONFLICT(owner_id,subscription_id,reminder_key) DO UPDATE SET lease_until=excluded.lease_until,attempts=deliveries.attempts+1
          WHERE deliveries.delivered_at IS NULL AND deliveries.lease_until<=? AND deliveries.retry_at<=? RETURNING reminder_key,attempts`).bind(row.owner_id,row.id,now+120000,keys,now,now).all();
        if(!claimed.results.length)continue;
        const acceptedKeys=new Set(claimed.results.map(item=>item.reminder_key));
        const first=due.results.find(task=>acceptedKeys.has(task.reminder_key));
        const selected=JSON.stringify([...acceptedKeys]);
        try {
          const sent=await deliver(JSON.parse(row.subscription),env,notification({...row,...first,count:acceptedKeys.size}));
          if([404,410].includes(sent.status)){await db.prepare('DELETE FROM subscriptions WHERE id=?').bind(row.id).run();continue;}
          if(!sent.ok)throw new Error('Provider refused');
          await db.prepare('UPDATE deliveries SET delivered_at=?,lease_until=0 WHERE owner_id=? AND subscription_id=? AND reminder_key IN (SELECT value FROM json_each(?))').bind(now,row.owner_id,row.id,selected).run();
        } catch(_) {
          const attempts=Math.max(...claimed.results.map(item=>item.attempts));
          await db.prepare('UPDATE deliveries SET lease_until=0,retry_at=? WHERE owner_id=? AND subscription_id=? AND reminder_key IN (SELECT value FROM json_each(?))').bind(now+Math.min(600000,60000*2**Math.min(attempts-1,3)),row.owner_id,row.id,selected).run();
        }
      }
      // Cleanup once a day, rather than spending free-tier writes each minute.
      if(new Date(now).getUTCHours()===3 && new Date(now).getUTCMinutes()===0)await db.batch([
        db.prepare('DELETE FROM deliveries WHERE reminder_key NOT IN (SELECT reminder_key FROM reminders) OR delivered_at<?').bind(now-30*86400000),
        db.prepare('DELETE FROM reminders WHERE due_at<? OR owner_id NOT IN (SELECT owner_id FROM subscriptions)').bind(now-86400000),
        db.prepare('DELETE FROM subscriptions WHERE updated_at<?').bind(now-90*86400000),
        db.prepare('DELETE FROM rate_limits WHERE window<?').bind(Math.floor(now/60000)-1440)
      ]);
    }
  };
}
export default createWorker();
