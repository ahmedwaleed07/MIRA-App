import {POLICY,validPhone,permittedOrigin,respond,hmac,backendReady,senderReady,turnstileVerified,reserveSend,sendWait,failReservation} from "../../_lib/mira-otp.js";
export const onRequestOptions=async({request})=>respond(request,{},204);
export async function onRequestPost({request,env}){
 if(!permittedOrigin(request.headers.get('Origin')||''))return respond(request,{error:'origin_not_allowed'},403);
 if(!backendReady(env))return respond(request,{error:'otp_not_configured'},503);
 // Never charge or generate a code without the official WhatsApp adapter and bot challenge.
 if(!senderReady(env))return respond(request,{error:'whatsapp_provider_not_configured'},503);
 let input;try{input=await request.json()}catch{return respond(request,{error:'invalid_json'},400)}
 const phone=String(input?.phone||'').trim(),mode=String(input?.mode||'');
 if(!validPhone(phone)||!['signin','signup'].includes(mode))return respond(request,{error:'invalid_phone_or_mode'},400);
 const ip=request.headers.get('CF-Connecting-IP')||'unknown';
 if(!await turnstileVerified(env,input?.turnstileToken,ip))return respond(request,{error:'verification_challenge_required'},403);
 const db=env.MIRA_OTP_DB,now=Math.floor(Date.now()/1000);
 const [phoneHash,ipHash]=await Promise.all([hmac('phone:'+phone,env.MIRA_OTP_PEPPER),hmac('ip:'+ip,env.MIRA_OTP_PEPPER)]);
 try{
  const registered=await db.prepare('SELECT 1 AS found FROM mira_otp_registered WHERE phone_hmac=?').bind(phoneHash).first();
  // No signup OTP for a registered phone. Do not reveal registration via the API.
  // Import verified existing customers before enabling the WhatsApp sender binding.
  if((mode==='signup'&&registered)||(mode==='signin'&&!registered))
   return respond(request,{ok:true,challengeId:crypto.randomUUID()});
  const id=crypto.randomUUID(),reserved=await reserveSend(db,phoneHash,ipHash,now,id);
  if(!reserved){const wait=await sendWait(db,phoneHash,ipHash,now);return respond(request,wait,429,{'Retry-After':Math.ceil(wait.retryAfterSeconds)})}
  const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);
  const code=String(bytes[0]%1000000).padStart(6,'0');
  const codeHash=await hmac(phoneHash+':'+id+':'+code,env.MIRA_OTP_PEPPER);
  try{
   await db.prepare('INSERT INTO mira_otp_challenges(id,phone_hmac,mode,code_hmac,issued_at,expires_at) VALUES(?,?,?,?,?,?)')
    .bind(id,phoneHash,mode,codeHash,now,now+POLICY.codeLifetimeSeconds).run();
   // MIRA_OTP_SENDER is a dedicated Cloudflare service binding. It must be backed by
   // an approved official WhatsApp Authentication-template adapter; never browser secrets.
   const result=await env.MIRA_OTP_SENDER.fetch('https://mira-otp-internal/send',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,code,template:'mira_authentication',mode})
   });
   if(!result.ok){await failReservation(db,id);return respond(request,{error:'otp_send_failed'},503)}
   await db.prepare("UPDATE mira_otp_send_log SET status='sent' WHERE id=? AND status='reserved'").bind(id).run();
   return respond(request,{ok:true,challengeId:id,retryAfterSeconds:POLICY.spacingSeconds});
  }catch(error){await failReservation(db,id);console.error('MIRA OTP provider unavailable',error);return respond(request,{error:'otp_send_unavailable'},503)}
 }catch(error){console.error('MIRA OTP rate-limit error',error);return respond(request,{error:'otp_temporarily_unavailable'},503)}
}
