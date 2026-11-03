// MIRA OTP anti-abuse and data protection on Cloudflare Pages + D1.
export const POLICY={spacingSeconds:60,maxSends:3,windowSeconds:1800,ipMaxSends:12,ipWindowSeconds:3600,codeLifetimeSeconds:300,maxWrongCodes:5};
export const validPhone=p=>/^\+[1-9]\d{7,14}$/.test(p);
export function permittedOrigin(origin){
 if(!origin)return true;
 try{const u=new URL(origin);return(
  u.protocol==='https:'&&(
    u.hostname==='ahmedwaleed07.github.io'||
    u.hostname==='mira-app-dz5.pages.dev'||
    u.hostname.endsWith('.mira-app-dz5.pages.dev')||
    u.hostname==='mira.asas360.com')
  )||(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname))||
  (['capacitor:','ionic:'].includes(u.protocol)&&u.hostname==='localhost');}
 catch{return false;}
}
export function respond(request,data,status=200,extra={}){
 const origin=request.headers.get('Origin')||'';
 const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin',
  'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,X-Requested-With'});
 if(origin&&permittedOrigin(origin))headers.set('Access-Control-Allow-Origin',origin);
 for(const [k,v] of Object.entries(extra))headers.set(k,String(v));
 return new Response(status===204?null:JSON.stringify(data),{status,headers});
}
export async function hmac(value,secret){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const b=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));
 return Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');
}
export const backendReady=e=>!!(e?.MIRA_OTP_DB&&typeof e.MIRA_OTP_PEPPER==='string'&&e.MIRA_OTP_PEPPER.length>=32);
export const senderReady=e=>backendReady(e)&&!!(e.MIRA_OTP_SENDER?.fetch&&e.MIRA_TURNSTILE_SECRET);
export async function turnstileVerified(e,token,ip){
 if(!e.MIRA_TURNSTILE_SECRET||typeof token!=='string'||token.length<10)return false;
 const form=new FormData();form.set('secret',e.MIRA_TURNSTILE_SECRET);form.set('response',token);
 if(ip)form.set('remoteip',ip);
 const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form});
 return r.ok&&(await r.json()).success===true;
}
export async function reserveSend(db,phoneHash,ipHash,now,id){
 // The conditional INSERT is a single serialized D1 write, safe across browsers and devices.
 const sql="INSERT INTO mira_otp_send_log(id,phone_hmac,ip_hmac,created_at,status) "+
 "SELECT ?,?,?,?,'reserved' WHERE "+
 "(SELECT COUNT(*) FROM mira_otp_send_log WHERE phone_hmac=? AND created_at>? AND status IN ('reserved','sent'))<3 AND "+
 "NOT EXISTS(SELECT 1 FROM mira_otp_send_log WHERE phone_hmac=? AND created_at>? AND status IN ('reserved','sent')) AND "+
 "(SELECT COUNT(*) FROM mira_otp_send_log WHERE ip_hmac=? AND created_at>? AND status IN ('reserved','sent'))<12 RETURNING id";
 return db.prepare(sql).bind(id,phoneHash,ipHash,now,phoneHash,now-1800,phoneHash,now-60,ipHash,now-3600).first();
}
export async function sendWait(db,phoneHash,ipHash,now){
 const p=await db.prepare("SELECT MAX(created_at) AS latest,MIN(created_at) AS earliest,COUNT(*) AS n FROM mira_otp_send_log WHERE phone_hmac=? AND created_at>? AND status IN ('reserved','sent')").bind(phoneHash,now-1800).first();
 if(p?.latest!=null&&now-p.latest<60)return {error:'otp_rate_limited',reason:'minute',retryAfterSeconds:60-(now-p.latest)};
 if((p?.n||0)>=3)return {error:'otp_rate_limited',reason:'cooldown',retryAfterSeconds:1800-(now-p.earliest)};
 const ip=await db.prepare("SELECT MIN(created_at) AS earliest,COUNT(*) AS n FROM mira_otp_send_log WHERE ip_hmac=? AND created_at>? AND status IN ('reserved','sent')").bind(ipHash,now-3600).first();
 return {error:'otp_rate_limited',reason:'ip_limit',retryAfterSeconds:Math.max(1,3600-(now-ip.earliest))};
}
export async function failReservation(db,id){
 await db.prepare("UPDATE mira_otp_send_log SET status='failed' WHERE id=? AND status='reserved'").bind(id).run();
 await db.prepare("DELETE FROM mira_otp_challenges WHERE id=?").bind(id).run();
}
