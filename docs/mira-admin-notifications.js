/* MIRA Admin composer: database-enforced publisher allow-list; no client admin bypass. */
(function(){
'use strict';
const el=id=>document.getElementById(id);
const CONFIG={form:'adminNotifyForm',title:'adminNotifyTitle',body:'adminNotifyBody',
 audience:'adminNotifyAudience',market:'adminNotifyMarket',marketField:'adminNotifyMarketField',
 user:'adminNotifyUser',userField:'adminNotifyUserField',destination:'adminNotifyDestination',
 result:'adminNotifyResult',history:'adminNotifyHistory',access:'adminNotifyAccess',send:'adminNotifySend'};
let authorized=false,checkedUser='',checking=false,sending=false;
const safeText=text=>String(text||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function updateFields(){
 const audience=el(CONFIG.audience)?.value;
 if(el(CONFIG.marketField))el(CONFIG.marketField).hidden=audience!=='market';
 if(el(CONFIG.userField))el(CONFIG.userField).hidden=audience!=='user';
}
function message(text){if(el(CONFIG.result))el(CONFIG.result).textContent=text}
function safeDestination(input){
 const value=String(input||'home.html').trim();
 return /^(home|orders|offer|categories|saved|profile)\.html(?:\?[a-zA-Z0-9_%=&.+-]{1,250})?$/.test(value)?value:'';
}
async function history(){
 if(!authorized)return;
 const root=el(CONFIG.history);
 try{
  const rows=await MiraCloud.request('mira_manual_notifications?select=id,title,body,audience,market_code,recipient_user_id,published_at&order=published_at.desc&limit=20',{requireAuth:true});
  root.innerHTML=rows.length?rows.map(n=>'<div class="mira-admin-history-item"><b>'+safeText(n.title)+'</b>'+
   safeText(n.body)+'<br><small>To: '+safeText(n.audience==='market'?'Market '+n.market_code:n.audience==='user'?'Customer '+n.recipient_user_id:'All customers')+
   ' · '+safeText(new Date(n.published_at).toLocaleString())+'</small></div>').join(''):
   '<div class="mira-admin-notice">No MIRA messages published yet.</div>';
 }catch(e){root.textContent='Could not retrieve published messages: '+(e.message||String(e))}
}
async function init(){
 if(checking)return;
 if(!window.MiraCloud?.session?.access_token)return;
 const button=el(CONFIG.send);
 if(!button)return;
 checking=true;button.disabled=true;authorized=false;
 el(CONFIG.access).textContent='Checking authorization with Supabase…';
 try{
  const user=await MiraCloud.getCurrentUser();
  if(!user?.id)throw Error('The administrator session could not be verified.');
  const rows=await MiraCloud.request('mira_notification_admins?user_id=eq.'+encodeURIComponent(user.id)+'&select=user_id',{requireAuth:true});
  if(!Array.isArray(rows)||!rows.some(r=>r.user_id===user.id))throw Error('This account is not authorized to publish MIRA notifications. An owner must grant your Auth UUID in Supabase.');
  authorized=true;checkedUser=user.id;
  el(CONFIG.access).textContent='Authorized to publish customer notifications.';
  button.disabled=false;
  await history();
 }catch(e){
  checkedUser='';
  el(CONFIG.access).textContent='Publishing unavailable: '+(e.message||String(e));
  el(CONFIG.history).textContent='No authorized messages available.';
 }finally{checking=false}
}
async function submit(event){
 event?.preventDefault?.();
 if(!authorized||sending)return;
 const title=el(CONFIG.title).value.trim(),body=el(CONFIG.body).value.trim();
 const audience=el(CONFIG.audience).value;
 const market=audience==='market'?el(CONFIG.market).value:null;
 const recipient=audience==='user'?el(CONFIG.user).value.trim():null;
 const dest=safeDestination(el(CONFIG.destination).value);
 if(!title||title.length>120||!body||body.length>700)return message('Enter a title (1–120) and message (1–700 characters).');
 if(!['all','market','user'].includes(audience))return message('Select a valid audience.');
 if(audience==='market'&&!/^[A-Z]{2}$/.test(market||''))return message('Select a shopping country.');
 if(audience==='user'&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recipient||''))
  return message('Enter a valid Supabase customer UUID.');
 if(!dest)return message('Choose a valid internal MIRA destination such as home.html or offer.html?id=123.');
 const button=el(CONFIG.send);
 sending=true;button.disabled=true;
 message('Publishing to Supabase…');
 try{
  // Verify the admin session and allow-list at publish time too.
  const user=await MiraCloud.getCurrentUser();
  if(!user||user.id!==checkedUser)throw Error('Your admin session changed. Please sign in again.');
  const row={title,body,audience,market_code:market,recipient_user_id:recipient,destination:dest};
  const response=await MiraCloud.request('mira_manual_notifications?select=id,audience,title',{
   method:'POST',requireAuth:true,headers:{Prefer:'return=representation'},body:JSON.stringify(row)});
  if(!Array.isArray(response)||response.length!==1||!response[0].id||response[0].audience!==audience)
   throw Error('Supabase did not confirm this notification. Check the publication history before retrying.');
  message('Published successfully. Customers will see the message in their MIRA inbox on the next sync.');
  el(CONFIG.title).value='';el(CONFIG.body).value='';
  await history();
 }catch(e){message('Could not publish: '+(e.message||String(e)))}
 finally{sending=false;button.disabled=!authorized}
}
document.addEventListener('DOMContentLoaded',()=>{
 el(CONFIG.audience)?.addEventListener('change',updateFields);
 el(CONFIG.form)?.addEventListener('submit',submit);
 updateFields();
 if(window.MiraCloud?.session?.access_token)void init();
});
window.MIRAAdminNotifications={init,updateFields};
})();