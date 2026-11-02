// Hidden Electron renderer, isolated profile, mocked Push API and local HTTP.
// No OS permission prompt, real push subscription, or cloud write is performed.
const { app,BrowserWindow,session }=require('electron');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'todo-push-ui-')));
let server,win;let missingConfig=false;const calls=[];
async function run(){
  const key=Buffer.alloc(32,7).toString('base64'),publicKey=Buffer.concat([Buffer.from([4]),Buffer.alloc(64,8)]).toString('base64url');
  server=http.createServer(async(req,res)=>{
    const url=new URL(req.url,'http://localhost');
    res.setHeader('Content-Type','application/json');
    const origin=`http://127.0.0.1:${server.address().port}`;
    if(url.pathname.endsWith('/assets/json/push.json'))return res.end(JSON.stringify({apiBaseUrl:missingConfig?'':origin+'/api'}));
    if(url.pathname.endsWith('/assets/json/firebase.json'))return res.end(JSON.stringify({url:origin+'/firebase'}));
    if(url.pathname.startsWith('/firebase/'))return res.end(JSON.stringify([{id:'task-1',text:'Secret title',notes:'Private notes',status:'todo',due:'2027-11-02',dueTime:'12:00'}]));
    if(url.pathname==='/api/config')return res.end(JSON.stringify({publicKey}));
    if(url.pathname.startsWith('/api/')){let data='';for await(const chunk of req)data+=chunk;calls.push({path:url.pathname,headers:req.headers,data:data?JSON.parse(data):null});return res.end(JSON.stringify({ok:true,scheduled:1,accepted:true}));}
    const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
    try{
      let body=fs.readFileSync(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
      if(file.endsWith('.html')){
        missingConfig=url.searchParams.has('missingConfig');
        const ios=url.searchParams.has('ios');
        const bootstrap=`<script>sessionStorage.setItem('auth','true');sessionStorage.setItem('username','testuser');sessionStorage.setItem('encKey','${key}');localStorage.removeItem('todo_push_device_v1');window.__permissionCalls=0;Object.defineProperty(navigator,'userAgent',{value:'${ios?'iPhone OS 17':'Android Chrome'}'});const fakeSubscription={options:{applicationServerKey:Uint8Array.from(atob('${publicKey}'.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)).buffer},toJSON:()=>({endpoint:'https://fcm.googleapis.com/test',keys:{p256dh:'test',auth:'test'}}),unsubscribe:async()=>true};let subscribed=false;const reg={active:true,pushManager:{getSubscription:async()=>subscribed?fakeSubscription:null,subscribe:async()=>{subscribed=true;return fakeSubscription;}}};Object.defineProperty(navigator,'serviceWorker',{value:{register:async()=>reg,getRegistration:async()=>reg,ready:Promise.resolve(reg)}});Object.defineProperty(window,'PushManager',{value:function(){}});Object.defineProperty(window,'Notification',{value:{permission:'granted',requestPermission:()=>{window.__permissionCalls++;return Promise.resolve('granted')}}});</script>`;
        body=body.toString().replace('<head>','<head>'+bootstrap);
      }
      res.end(body);
    }catch(_){res.statusCode=404;res.end('{}');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
  session.defaultSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!details.url.startsWith(origin)}));
  win=new BrowserWindow({show:false,width:390,height:844,webPreferences:{contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}});
  const js=code=>win.webContents.executeJavaScript(code);
  async function waitFor(code){for(let i=0;i<100;i++){if(await js(code))return;await new Promise(r=>setTimeout(r,50));}throw new Error('Timeout: '+code);}
  await win.loadURL(origin+'/pages/settings.html');await waitFor('!document.getElementById("push-enable").disabled');
  assert.equal(await js('window.__permissionCalls'),0);
  await js('document.querySelector("[data-tab=tab-notifications]").click();document.getElementById("push-enable").click()');
  await waitFor('document.getElementById("push-status").textContent.startsWith("Notifications activées.")');assert.equal(await js('window.__permissionCalls'),1);
  assert.ok(calls.some(c=>c.path==='/api/subscriptions'));
  assert.equal(await js('document.documentElement.scrollWidth<=window.innerWidth'),true);
  const scheduled=calls.find(c=>c.path==='/api/schedule'&&c.data.reminders.length);assert.ok(scheduled);assert.equal(JSON.stringify(scheduled).includes('Secret title'),false);assert.equal(JSON.stringify(scheduled).includes('Private notes'),false);assert.ok(!scheduled.headers.authorization.includes(key));
  await js('document.getElementById("push-test").click()');await waitFor('document.getElementById("push-status").textContent.includes("acceptée")');
  await js('document.getElementById("push-disable").click()');await waitFor('document.getElementById("push-status").textContent.includes("désactivées")');
  await win.loadURL(origin+'/pages/settings.html?ios=1');await waitFor('document.getElementById("push-status").textContent.includes("écran d’accueil")');
  assert.equal(await js('document.getElementById("push-enable").disabled'),true);assert.equal(await js('window.__permissionCalls'),0);
  await win.loadURL(origin+'/pages/settings.html?missingConfig=1');await waitFor('document.getElementById("push-status").textContent.includes("configurer")');
  assert.equal(await js('document.getElementById("push-enable").disabled'),true);
  assert.equal(await js('document.getElementById("btn-change-username").disabled'),false);
  console.log('Push UI passed: opt-in click, registration, private metadata, test, disable, iOS installation gate.');
}
app.whenReady().then(run).then(()=>{win?.destroy();server?.close();app.exit(0);}).catch(e=>{console.error(e);win?.destroy();server?.close();app.exit(1);});
