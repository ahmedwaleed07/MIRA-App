import {permittedOrigin,respond,hmac,backendReady} from "../../_lib/mira-otp.js";
export const onRequestOptions=async({request})=>respond(request,{},204);
export async function onRequestPost({request,env}){
 if(!permittedOrigin(request.headers.get('Origin')||''))return respond(request,{error:'origin_not_allowed'},403);
 if(!backendReady(env))return respond(request,{error:'otp_not_configured'},503);
 let input;try{input=await request.json()}catch{return respond(request,{error:'invalid_json'},400)}
 const challengeId=String(input?.challengeId||''),code=String(input?.code||'');
 if(!/^[0-9a-f-]{36}$/i.test(challengeId)||!/^\d{6}$/.test(code))return respond(request,{error:'invalid_code'},400);
 const db=env.MIRA_OTP_DB,now=Math.floor(Date.now()/1000);
 try{
  const challenge=await db.prepare(
   "SELECT c.phone_hmac,c.mode,c.code_hmac FROM mira_otp_challenges c "+
   "INNER JOIN mira_otp_send_log l ON l.id=c.id WHERE c.id=? AND c.expires_at>? "+
   "AND c.used_at IS NULL AND c.wrong_attempts<5 AND l.status='sent'"
  ).bind(challengeId,now).first();
  if(!challenge)return respond(request,{error:'invalid_or_expired_code'},400);
  const candidate=await hmac(challenge.phone_hmac+':'+challengeId+':'+code,env.MIRA_OTP_PEPPER);
  if(candidate!==challenge.code_hmac){
   await db.prepare('UPDATE mira_otp_challenges SET wrong_attempts=MIN(wrong_attempts+1,5) WHERE id=? AND used_at IS NULL')
    .bind(challengeId).run();
   return respond(request,{error:'invalid_or_expired_code'},400);
  }
  const used=await db.prepare('UPDATE mira_otp_challenges SET used_at=? WHERE id=? AND used_at IS NULL AND expires_at>? AND wrong_attempts<5 RETURNING phone_hmac,mode')
   .bind(now,challengeId,now).first();
  if(!used)return respond(request,{error:'invalid_or_expired_code'},400);
  if(used.mode==='signup')await db.prepare('INSERT INTO mira_otp_registered(phone_hmac,registered_at,verified_at) VALUES(?,?,?) ON CONFLICT(phone_hmac) DO UPDATE SET verified_at=excluded.verified_at').bind(used.phone_hmac,now,now).run();
  // Verification is an identity proof only: don't pretend it is an authenticated
  // MIRA customer session. Session/account migration is a separate launch blocker.
  return respond(request,{verified:true,authSessionReady:false});
 }catch(error){console.error('MIRA Cloudflare verification error',error);return respond(request,{error:'verification_unavailable'},503)}
}
