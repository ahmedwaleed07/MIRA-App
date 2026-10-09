// MIRA customer auth workflow helpers. No visual assets or UI styling.
(function(){
'use strict';
const DESTINATIONS=new Set(['home.html','market.html','city.html','interests.html','categories.html','category.html','section.html','search.html','store.html','offer.html','saved.html','profile.html','edit-profile.html','cart.html','checkout.html','orders.html']);
const PENDING_KEY='mira_pending_otp';
const PENDING_LIFETIME=15*60*1000;
function safeReturn(value,fallback='home.html'){
  const fallbackName=DESTINATIONS.has(fallback)?fallback:'home.html';
  if(typeof value!=='string'||!value.trim())return fallbackName;
  const input=value.trim();
  if(/[\u0000-\u001f\\]/.test(input)||/%(?:2f|5c|2e)/i.test(input)||input.startsWith('//'))return fallbackName;
  try{
    const url=new URL(input,location.href),base=new URL('.',location.href);
    if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return fallbackName;
    const name=url.pathname.slice(base.pathname.length);
    if(!DESTINATIONS.has(name))return fallbackName;
    return name+url.search+url.hash;
  }catch(_){return fallbackName}
}
function validEmail(value){
 const v=String(value||'').trim().toLowerCase();
 return v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)?v:'';
}
function normalizePhone(code,value){
 const dial=String(code||'').replace(/[^\d+]/g,''),raw=String(value||'').replace(/[^\d]/g,'');
 if(!/^\+[1-9]\d{0,3}$/.test(dial)||!raw)return '';
 const local=raw.replace(/^0+/,'');
 const full=dial+local;
 return /^\+[1-9]\d{7,14}$/.test(full)?full:'';
}
function setReturn(raw,fallback='home.html'){
 const dest=safeReturn(raw,fallback);
 if(raw){sessionStorage.setItem('mira_auth_return',dest);localStorage.setItem('mira_auth_return',dest)}
 return dest;
}
function getReturn(fallback='home.html'){
 return safeReturn(sessionStorage.getItem('mira_auth_return')||localStorage.getItem('mira_auth_return')||'',fallback);
}
function clearReturn(){sessionStorage.removeItem('mira_auth_return');localStorage.removeItem('mira_auth_return')}
function setPending({via,mode,target,profile={}}){
 if(!['email','phone'].includes(via)||!['signin','signup'].includes(mode)||!target)throw Error('Invalid verification request');
 const request={via,mode,target,profile:mode==='signup'?profile:{},createdAt:Date.now()};
 sessionStorage.setItem(PENDING_KEY,JSON.stringify(request));
 // Keep historical session keys for compatibility with older deployed tabs.
 sessionStorage.setItem('mira_otp_via',via);sessionStorage.setItem('mira_otp_mode',mode);
 sessionStorage.setItem('mira_otp_target',target);
 if(mode==='signup')sessionStorage.setItem('mira_signup_profile',JSON.stringify(profile));
 else sessionStorage.removeItem('mira_signup_profile');
 return request;
}
function getPending(){
 try{
  const p=JSON.parse(sessionStorage.getItem(PENDING_KEY)||'null');
  if(!p||!['email','phone'].includes(p.via)||!['signin','signup'].includes(p.mode)||!p.target||!Number.isFinite(p.createdAt)||Date.now()-p.createdAt>PENDING_LIFETIME||p.createdAt>Date.now()+60000)return null;
  return p;
 }catch(_){return null}
}
function clearPending(){
 for(const k of [PENDING_KEY,'mira_otp_via','mira_otp_mode','mira_otp_target','mira_signup_profile'])sessionStorage.removeItem(k);
}
async function getVerifiedCustomer(){
 const cloud=window.MiraCloud;
 if(!cloud.session?.access_token)return null;
 await cloud.ensureFreshSession();
 const payload=cloud.payload();
 if(!payload||payload.role!=='authenticated'||!payload.sub){cloud.signOut();return null}
 return cloud.getCurrentUser();
}
function finish(returnTo,fallback='home.html'){
 const destination=safeReturn(returnTo||getReturn(fallback),fallback);
 clearPending();clearReturn();
 return destination;
}
window.MiraAuthFlow={safeReturn,validEmail,normalizePhone,setReturn,getReturn,clearReturn,setPending,getPending,clearPending,getVerifiedCustomer,finish};
})();