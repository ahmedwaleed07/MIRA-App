/* MIRA in-app order notifications. No device-push delivery implied. */
(function(){
'use strict';
const PREFIX='mira_notifications_v1:';
const LIMIT=100;
const RECENT_DAYS=14;
const STATUS=new Set(['new','accepted','preparing','ready','out_for_delivery','completed','cancelled']);
const TEXT={
 en:{new:'Order received',accepted:'Order confirmed',preparing:'Order preparing',ready:'Order shipped',out_for_delivery:'Out for delivery',completed:'Order delivered',cancelled:'Order cancelled',merchantNew:'New customer order',order:'Order'},
 ar:{new:'تم استلام الطلب',accepted:'تم تأكيد الطلب',preparing:'الطلب قيد التحضير',ready:'تم شحن الطلب',out_for_delivery:'الطلب بالطريق إليك',completed:'تم تسليم الطلب',cancelled:'تم إلغاء الطلب',merchantNew:'طلب جديد من زبون',order:'طلب'},
 es:{new:'Pedido recibido',accepted:'Pedido confirmado',preparing:'Preparando pedido',ready:'Pedido enviado',out_for_delivery:'En reparto',completed:'Pedido entregado',cancelled:'Pedido cancelado',merchantNew:'Nuevo pedido',order:'Pedido'},
 ru:{new:'Заказ получен',accepted:'Заказ подтверждён',preparing:'Заказ готовится',ready:'Заказ отправлен',out_for_delivery:'Курьер в пути',completed:'Заказ доставлен',cancelled:'Заказ отменён',merchantNew:'Новый заказ',order:'Заказ'},
 tr:{new:'Sipariş alındı',accepted:'Sipariş onaylandı',preparing:'Sipariş hazırlanıyor',ready:'Sipariş gönderildi',out_for_delivery:'Sipariş yolda',completed:'Sipariş teslim edildi',cancelled:'Sipariş iptal edildi',merchantNew:'Yeni müşteri siparişi',order:'Sipariş'}
};
function context(role,owner){
 if(!['customer','merchant'].includes(role))throw Error('Invalid notification role');
 if(typeof owner!=='string'||!owner.trim())throw Error('Signed-in account required for notifications');
 return PREFIX+role+':'+encodeURIComponent(owner.trim());
}
function empty(){return {initialized:false,snapshots:{},items:[]}}
function read(role,owner){
 const key=context(role,owner);
 try{
  const p=JSON.parse(localStorage.getItem(key)||'null');
  if(!p||!Array.isArray(p.items)||!p.snapshots||typeof p.snapshots!=='object')return empty();
  return {initialized:!!p.initialized,snapshots:p.snapshots,items:p.items.slice(0,LIMIT)};
 }catch(_){return empty()}
}
function write(role,owner,state){
 state.items=state.items.slice(0,LIMIT);
 localStorage.setItem(context(role,owner),JSON.stringify(state));
 updateBadges(role,owner);
 try{window.dispatchEvent(new CustomEvent('mira-notifications-changed',{detail:{role,owner}}))}catch(_){}
}
function validTime(row){
 const raw=Date.parse(row.created_at||row.updated_at||'');
 return Number.isFinite(raw)&&raw<=Date.now()+60000&&Date.now()-raw<RECENT_DAYS*86400000;
}
function notification(role,row,status,at){
 const id=String(row.id||'');
 return {id:id+':'+status+':'+String(at||''),orderId:id,status,
  kind:role==='merchant'?'merchantNew':'automatic',
  at:at||new Date().toISOString(),read:false};
}
function observe(role,owner,rows){
 if(!Array.isArray(rows))throw Error('Order notifications need an array of verified orders');
 const state=read(role,owner),initial=!state.initialized;
 let changed=!state.initialized;
 for(const row of rows.slice(0,250)){
  if(!row||row.id==null||!STATUS.has(row.status))continue;
  const id=String(row.id),old=state.snapshots[id],nowStatus=row.status;
  const isNew=!old,isDifferent=!!old&&old.status!==nowStatus;
  if(!isNew&&!isDifferent)continue;
  const at=isDifferent?(row.updated_at||new Date().toISOString()):(row.created_at||new Date().toISOString());
  state.snapshots[id]={status:nowStatus,at};
  changed=true;
  if(role==='merchant'&&nowStatus!=='new')continue;
  if(isNew&&initial&&!validTime(row))continue;
  const msg=notification(role,row,nowStatus,at);
  if(!state.items.some(n=>n.id===msg.id))state.items.unshift(msg);
 }
 if(changed){
  state.initialized=true;
  state.items.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  // Bound client storage even for accounts with many orders.
  const snapshotKeys=Object.keys(state.snapshots);
  if(snapshotKeys.length>500){
   const keep=new Set(rows.slice(0,500).map(x=>String(x.id)));
   for(const k of snapshotKeys)if(!keep.has(k))delete state.snapshots[k];
  }
  write(role,owner,state);
 }
 return state.items;
}
function observeHistory(owner,rows,customerOrders){
 if(!Array.isArray(rows))throw Error('Order status history response must be an array');
 const allowed=new Set(customerOrders.map(o=>String(o.id)));
 const state=read('customer',owner);
 let changed=false;
 for(const entry of rows.slice(0,200)){
  if(!entry?.id||!entry.order_id||!STATUS.has(entry.status)||!allowed.has(String(entry.order_id)))continue;
  if(!validTime({created_at:entry.created_at}))continue;
  const id='order-status:'+String(entry.id),orderId=String(entry.order_id),status=entry.status;
  const matching=state.items.find(item=>item.id===id);
  if(matching)continue;
  const legacy=state.items.find(item=>item.kind==='automatic'&&item.orderId===orderId&&item.status===status&&item.id.startsWith(orderId+':'));
  state.items=state.items.filter(item=>item!==legacy);
  state.items.unshift({id,orderId,status,kind:'automatic',at:entry.created_at,read:legacy?.read||false});
  changed=true;
 }
 if(changed){
  state.items.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  write('customer',owner,state);
 }
 return state.items;
}
function observeManual(owner,rows,market){
 if(!Array.isArray(rows))throw Error('Manual messages must come from Supabase');
 const state=read('customer',owner);
 const active=new Set();
 const chosenMarket=String(market||'').toUpperCase();
 for(const row of rows.slice(0,200)){
  if(!row||!row.id||!row.title||!row.body)continue;
  if(row.audience==='market'&&String(row.market_code||'').toUpperCase()!==chosenMarket)continue;
  if(row.audience==='user'&&String(row.recipient_user_id)!==String(owner))continue;
  const published=Date.parse(row.published_at||'');
  if(!Number.isFinite(published)||published>Date.now()+60000)continue;
  if(row.expires_at&&Date.parse(row.expires_at)<=Date.now())continue;
  const id='manual:'+String(row.id);
  active.add(id);
  let item=state.items.find(n=>n.id===id);
  if(!item){
   item={id,orderId:'',status:'',kind:'manual',title:String(row.title).slice(0,120),
    body:String(row.body).slice(0,700),destination:safeDestination(row.destination),
    at:row.published_at,read:false};
   state.items.unshift(item);
  }else{
   item.title=String(row.title).slice(0,120);
   item.body=String(row.body).slice(0,700);
   item.destination=safeDestination(row.destination);
  }
 }
 state.items=state.items.filter(n=>n.kind!=='manual'||active.has(n.id));
 state.items.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
 write('customer',owner,state);
 return state.items;
}
function safeDestination(raw){
 if(typeof raw!=='string')return 'home.html';
 const path=raw.trim();
 return /^(home|orders|offer|categories|saved|profile)\.html(?:\?[a-zA-Z0-9_%=&.+-]{1,250})?$/.test(path)?path:'home.html';
}
function list(role,owner){return read(role,owner).items}
function unread(role,owner){return list(role,owner).filter(n=>!n.read).length}
async function persistRead(owner,keys){
 const cloud=window.MiraCloud,p=cloud?.payload?.();
 if(!cloud?.session?.access_token||String(p?.sub)!==String(owner)||p.role!=='authenticated')return false;
 const valid=keys.filter(id=>typeof id==='string'&&id.length>0&&id.length<=180).slice(0,100);
 if(!valid.length)return true;
 await cloud.request('mira_notification_reads?on_conflict=user_id,event_key',{
  method:'POST',requireAuth:true,keepalive:true,
  headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
  body:JSON.stringify(valid.map(event_key=>({user_id:owner,event_key})))
 });
 return true;
}
async function syncReadReceipts(owner){
 const cloud=window.MiraCloud;
 const records=await cloud.request('mira_notification_reads?user_id=eq.'+encodeURIComponent(owner)+'&select=event_key&order=read_at.desc&limit=250',{requireAuth:true});
 const remote=new Set(records.filter(r=>typeof r.event_key==='string').map(r=>r.event_key));
 const state=read('customer',owner);
 let changed=false;
 for(const item of state.items){
  if(remote.has(item.id)&&!item.read){item.read=true;changed=true}
 }
 if(changed)write('customer',owner,state);
 const pending=state.items.filter(item=>item.read&&!remote.has(item.id)).map(item=>item.id);
 if(pending.length)await persistRead(owner,pending);
 return true;
}
function markRead(role,owner,id){
 const state=read(role,owner),item=state.items.find(n=>n.id===id);
 if(item&&!item.read){item.read=true;write(role,owner,state);if(role==='customer')void persistRead(owner,[item.id]).catch(e=>console.warn('Notification read sync will retry:',e.message))}
}
function markAllRead(role,owner){
 const state=read(role,owner);
 if(state.items.some(n=>!n.read)){const pending=state.items.filter(n=>!n.read).map(n=>n.id);state.items.forEach(n=>n.read=true);write(role,owner,state);if(role==='customer')void persistRead(owner,pending).catch(e=>console.warn('Notification read sync will retry:',e.message))}
}
function language(){const l=localStorage.getItem('mira_lang')||'en';return TEXT[l]||TEXT.en}
function label(n){const t=language();return n.kind==='manual'?n.title:n.kind==='merchantNew'?t.merchantNew:(t[n.status]||t.new)}
function orderLabel(n){return language().order+' #'+String(n.orderId).slice(0,8).toUpperCase()}
function updateBadges(role,owner){
 const count=unread(role,owner);
 document.querySelectorAll('[data-mira-notification-count]').forEach(el=>{
  const wants=el.getAttribute('data-mira-notification-role')||'customer';
  if(wants!==role)return;
  el.textContent=count>99?'99+':String(count);
  el.hidden=!count;
  el.setAttribute('aria-label',String(count)+' unread notifications');
 });
}
async function syncCustomer(){
 const cloud=window.MiraCloud;
 if(!cloud?.session?.access_token)return null;
 // Requests require a valid customer JWT; do not use the service/anon key for private data.
 await cloud.ensureFreshSession();
 const p=cloud.payload();
 if(!p?.sub||p.role!=='authenticated')return null;
 const owner=String(p.sub);
 const result=await cloud.request('mira_orders?customer_user_id=eq.'+encodeURIComponent(owner)+'&select=id,status,created_at,updated_at&order=created_at.desc&limit=100',{requireAuth:true});
 observe('customer',owner,result);
 let historyError=null;
 try{
  const history=await cloud.request('mira_order_status_history?select=id,order_id,status,created_at&order=created_at.desc&limit=100',{requireAuth:true});
  observeHistory(owner,history,result);
 }catch(e){historyError=e;console.warn('MIRA status history unavailable:',e.message)}
 let manualError=null;
 try{
  const market=String(localStorage.getItem('mira_market')||'IQ').toUpperCase();
  const selectors='or=(audience.eq.all,and(audience.eq.market,market_code.eq.'+encodeURIComponent(market)+'),and(audience.eq.user,recipient_user_id.eq.'+encodeURIComponent(owner)+'))';
  const manual=await cloud.request('mira_manual_notifications?'+selectors+'&select=id,title,body,audience,market_code,recipient_user_id,destination,published_at,expires_at&order=published_at.desc&limit=100',{requireAuth:true});
  observeManual(owner,manual,market);
 }catch(e){manualError=e;console.warn('MIRA manual notifications unavailable:',e.message)}
 let readsError=null;
 try{await syncReadReceipts(owner)}
 catch(e){readsError=e;console.warn('MIRA cross-device read receipts unavailable:',e.message)}
 return {owner,count:unread('customer',owner),items:list('customer',owner),manualError,historyError,readsError};
}
async function watchCustomer({interval=30000,onUpdate}={}){
 let active=false;
 async function sync(){
  if(active||document.visibilityState==='hidden')return;
  active=true;
  try{
   const state=await syncCustomer();
   if(typeof onUpdate==='function')onUpdate(null,state);
  }catch(e){if(typeof onUpdate==='function')onUpdate(e,null)}
  finally{active=false}
 }
 await sync();
 const timer=setInterval(sync,Math.max(interval,15000));
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void sync()});
 return ()=>clearInterval(timer);
}
window.MiraNotifications={observe,observeHistory,observeManual,list,unread,markRead,markAllRead,label,orderLabel,updateBadges,safeDestination,syncCustomer,syncReadReceipts,watchCustomer};
})();