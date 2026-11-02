// The private key is written only to an ignored local file, never to stdout.
import { writeFile } from 'node:fs/promises';
const pair = await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
const publicKey = Buffer.from(await crypto.subtle.exportKey('raw',pair.publicKey)).toString('base64url');
const privateKey = (await crypto.subtle.exportKey('jwk',pair.privateKey)).d;
await writeFile(new URL('.dev.vars',import.meta.url),`VAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}\n`,{flag:'wx',mode:0o600});
console.log('Clés créées dans push-server/.dev.vars (fichier privé, ignoré par Git).');
