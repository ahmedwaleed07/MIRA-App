import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {default:sender}=await import('../cloudflare/mira-whatsapp-sender/src/index.js');
const origin='https://mira-otp-internal/send';
const cfg={META_WHATSAPP_ACCESS_TOKEN:'secret_mock',META_PHONE_NUMBER_ID:'123456789012345',META_GRAPH_VERSION:'v25.0',META_TEMPLATE_LANGUAGE:'ar'};
const payload={phone:'+9647810000000',code:'123456',template:'mira_authentication',mode:'signup'};
let calls=0,body;
const oldFetch=globalThis.fetch;
globalThis.fetch=async (url,options)=>{
 calls++;body=JSON.parse(options.body);
 assert.equal(url,'https://graph.facebook.com/v25.0/123456789012345/messages');
 assert.equal(options.headers.Authorization,'Bearer secret_mock');
 return new Response(JSON.stringify({messages:[{id:'wamid.test'}]}),{status:200});
};
try{
 const make=(data)=>new Request(origin,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 assert.equal((await sender.fetch(make(payload),{},{})).status,503,'unset token must prevent sends');
 assert.equal((await sender.fetch(make({...payload,code:'12345'}),cfg)).status,400);
 assert.equal((await sender.fetch(make({...payload,phone:'07771234567'}),cfg)).status,400);
 assert.equal((await sender.fetch(make({...payload,template:'other_template'}),cfg)).status,400);
 assert.equal((await sender.fetch(make({...payload,mode:'reset_password'}),cfg)).status,400);
 assert.equal(calls,0,'invalid requests must never hit Meta');
 assert.equal((await sender.fetch(make(payload),cfg)).status,202);
 assert.equal(calls,1);
 assert.equal(body.to,'9647810000000');
 assert.equal(body.template.name,'mira_authentication');
 assert.equal(body.template.language.code,'ar');
 assert.deepEqual(body.template.components.map(x=>x.parameters[0].text),['123456','123456']);
 globalThis.fetch=async()=>new Response('{}',{status:429});
 assert.equal((await sender.fetch(make(payload),cfg)).status,502,'Meta provider errors must not appear successful');
 globalThis.fetch=async()=>new Response('{}',{status:200});
 assert.equal((await sender.fetch(make(payload),cfg)).status,502,'Meta must confirm a message id');
 assert.match(readFileSync('cloudflare/mira-whatsapp-sender/wrangler.toml','utf8'),/workers_dev\s*=\s*false/);
 assert.match(readFileSync('functions/api/otp/request.js','utf8'),/MIRA_OTP_SENDER\.fetch/);
 assert.match(readFileSync('functions/_lib/mira-otp.js','utf8'),/MIRA_TURNSTILE_SECRET/);
 console.log('PASS MIRA Meta WhatsApp adapter: fail-closed, 6-digit OTP, private Worker, copy code, error cases');
}finally{globalThis.fetch=oldFetch}
