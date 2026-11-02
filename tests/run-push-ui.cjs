const {spawn}=require('node:child_process');const path=require('node:path');
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const child=spawn(require('../win_app/node_modules/electron'),[path.join(__dirname,'push-ui.cjs')],{env,stdio:'inherit',windowsHide:true});
child.on('exit',code=>process.exitCode=code??1);child.on('error',error=>{console.error(error);process.exitCode=1;});
