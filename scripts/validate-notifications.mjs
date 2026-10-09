import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(p,'utf8');
const script=read('docs/mira-notifications.js');
new vm.Script(script,{filename:'mira-notifications.js'});
new vm.Script(read('docs/mira-admin-notifications.js'),{filename:'mira-admin-notifications.js'});
console.log('PASS notification scripts parse as JavaScript');

function storage(){
 const map=new Map();
 return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
}
function context(){
 const localStorage=storage();
 localStorage.setItem('mira_market','IQ');
 const ctx={localStorage,Date,JSON,Math,URL,console,
  document:{querySelectorAll:()=>[],visibilityState:'visible'},
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},
  dispatchEvent:()=>{},window:null,
 };
 ctx.window=ctx;
 vm.createContext(ctx);vm.runInContext(script,ctx);
 return ctx;
}
const c=context(),n=c.MiraNotifications,now=new Date().toISOString();
const order={id:'order-001',status:'new',created_at:now,updated_at:now};
n.observe('customer','customer-A',[order]);
assert.equal(n.unread('customer','customer-A'),1);
assert.equal(n.list('customer','customer-A')[0].kind,'automatic');
n.observe('customer','customer-A',[order]);
assert.equal(n.unread('customer','customer-A'),1,'poll must not duplicate same order event');
const updated={...order,status:'accepted',updated_at:new Date(Date.now()+500).toISOString()};
n.observe('customer','customer-A',[updated]);
assert.equal(n.unread('customer','customer-A'),2,'status update must generate new event');
assert.equal(n.unread('customer','customer-B'),0,'customer accounts must have separate inboxes');
const oldest=n.list('customer','customer-A')[1];
n.markRead('customer','customer-A',oldest.id);
assert.equal(n.unread('customer','customer-A'),1);
console.log('PASS auto order-received/status-changed alerts, no poll duplicates, per-customer unread persistence');

const campaigns=[
 {id:'all',title:'New MIRA experience',body:'Discover new products',audience:'all',destination:'home.html',published_at:now},
 {id:'iq',title:'Iraq offers',body:'Selected deals',audience:'market',market_code:'IQ',destination:'offer.html?id=a-1',published_at:now},
 {id:'de',title:'Germany offers',body:'Not for this country',audience:'market',market_code:'DE',destination:'home.html',published_at:now},
 {id:'direct',title:'Your notice',body:'For customer A only',audience:'user',recipient_user_id:'customer-A',destination:'orders.html',published_at:now},
 {id:'different',title:'Private B',body:'Not for customer A',audience:'user',recipient_user_id:'customer-B',destination:'home.html',published_at:now}
];
n.observeManual('customer-A',campaigns,'IQ');
let manual=n.list('customer','customer-A').filter(i=>i.kind==='manual');
assert.equal(manual.length,3);
assert.deepEqual(new Set(manual.map(x=>x.id)),new Set(['manual:all','manual:iq','manual:direct']));
assert.equal(n.safeDestination('https://evil.example/'), 'home.html');
assert.equal(n.safeDestination('offer.html?id=x-1'),'offer.html?id=x-1');
n.observeManual('customer-A',campaigns,'IQ');
assert.equal(n.list('customer','customer-A').filter(x=>x.kind==='manual').length,3);
n.markAllRead('customer','customer-A');
assert.equal(n.unread('customer','customer-A'),0);
n.observeManual('customer-A',campaigns,'IQ');
assert.equal(n.unread('customer','customer-A'),0,'read admin notices must not reappear as unread on refresh');
n.observeManual('customer-A',campaigns,'CA');
assert.equal(n.list('customer','customer-A').filter(x=>x.kind==='manual').length,2,'market-targeted notices should not appear in a different selected market');
console.log('PASS separate manual notices: broadcast, market, individual; read flags, country changes, safe internal links');

n.observe('merchant','store-A',[order]);
assert.equal(n.unread('merchant','store-A'),1);
n.observe('merchant','store-A',[updated]);
assert.equal(n.unread('merchant','store-A'),1,'store should not receive repeated status change alerts');
assert.equal(n.unread('merchant','store-B'),0);
console.log('PASS merchant new-order alerts separate from customer messages');

const schema=read('supabase/migrations/20261009_mira_manual_notifications.sql');
for(const table of ['mira_manual_notifications','mira_notification_admins'])
 assert.ok(schema.includes('public.'+table),'missing table '+table);
for(const key of ["('all','market','user')","mira_can_publish_notification","recipient_user_id=auth.uid()","created_by=auth.uid()","enable row level security","revoke all on public.mira_manual_notifications from anon"])
 assert.ok(schema.includes(key),'manual notification authorization missing '+key);
assert.ok(!/grant\s+insert\s+on\s+public\.mira_notification_admins/i.test(schema),'untrusted clients must not be able to grant themselves publishing access');
console.log('PASS SQL RLS: only allow-listed admins can publish; customers read global/market/own targeted messages');

const home=read('docs/home.html'),profile=read('docs/profile.html'),inbox=read('docs/notifications.html'),admin=read('docs/admin.html'),business=read('docs/business.html'),auth=read('docs/mira-auth-flow.js');
assert.ok(home.includes('data-mira-notification-count')&&home.includes('mira-notifications.js'));
assert.ok(profile.includes("notifications.html"));
assert.ok(inbox.includes('data-filter="automatic"')&&inbox.includes('data-filter="manual"')&&inbox.includes('mira-notifications.js'));
assert.ok(admin.includes('id="adminNotifyForm"')&&admin.includes('data-panel="notifications"')&&admin.includes('mira-admin-notifications.js'));
assert.ok(auth.includes("'notifications.html'"),'sign-in return allowlist must include inbox');
assert.ok(business.includes("MiraNotifications.observe('merchant'")&&business.includes('businessNotificationList'));
console.log('PASS customer Home bell, profile access, inbox filters, Admin composer, merchant order alerts');
const trace=[];
c.MiraCloud={session:{access_token:'test-token'},ensureFreshSession:async()=>{},
 payload:()=>({sub:'customer-A',role:'authenticated'}),
 request:async (query,options)=>{
  trace.push({query,options});
  if(query.startsWith('mira_orders?'))return [order];
  if(query.startsWith('mira_manual_notifications?'))return campaigns.slice(0,2);
  throw Error('Unexpected query');
 }};
await n.syncCustomer();
assert.equal(trace.length,2);
assert.ok(trace.every(x=>x.options.requireAuth===true),'notifications API must require authenticated user');
assert.ok(trace[0].query.includes('customer_user_id=eq.customer-A'));
console.log('PASS both automatic and curated messages loaded through authenticated Supabase requests');
