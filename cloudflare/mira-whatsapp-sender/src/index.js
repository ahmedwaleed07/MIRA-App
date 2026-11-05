// MIRA WhatsApp OTP sender (internal service binding only).
// Keep workers_dev=false and do not add a public route or customer-facing API.
const otpPattern=/^\d{6}$/;
const phonePattern=/^\+[1-9]\d{7,14}$/;
const answer=(status)=>new Response(null,{status,headers:{'Cache-Control':'no-store'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(request.method!=='POST'||url.origin!=='https://mira-otp-internal'||url.pathname!=='/send')return answer(404);
  // Explicit kill switch: deploying or binding the Worker never enables paid messaging.
  if(env.MIRA_META_SENDING_ENABLED!=='true')return answer(503);
  if(!env.META_WHATSAPP_ACCESS_TOKEN||
     !/^\d{6,25}$/.test(env.META_PHONE_NUMBER_ID||'')||
     !/^v\d{1,2}\.\d{1,2}$/.test(env.META_GRAPH_VERSION||'')||
     !/^[a-z]{2}(?:_[A-Z]{2})?$/.test(env.META_TEMPLATE_LANGUAGE||'')){
    return answer(503);
  }
  let payload;
  try{payload=await request.json()}catch{return answer(400)}
  const {phone,code,mode,template}=payload||{};
  if(!phonePattern.test(phone||'')||!otpPattern.test(code||'')||
     !['signin','signup'].includes(mode)||template!=='mira_authentication')return answer(400);
  // For Meta's approved AUTHENTICATION copy-code template, pass the OTP in
  // BOTH the body placeholder and copy-code button placeholder.
  const outgoing={
   messaging_product:'whatsapp',
   recipient_type:'individual',
   to:phone.slice(1),
   type:'template',
   template:{
    name:'mira_authentication',
    language:{code:env.META_TEMPLATE_LANGUAGE},
    components:[
     {type:'body',parameters:[{type:'text',text:code}]},
     {type:'button',sub_type:'url',index:'0',parameters:[{type:'text',text:code}]}
    ]
   }
  };
  try{
   const response=await fetch('https://graph.facebook.com/'+env.META_GRAPH_VERSION+'/'+env.META_PHONE_NUMBER_ID+'/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+env.META_WHATSAPP_ACCESS_TOKEN},
    body:JSON.stringify(outgoing)
   });
   if(!response.ok)return answer(502);
   const data=await response.json();
   if(!data?.messages?.[0]?.id)return answer(502);
   // Accepted by Meta, not proof of delivery. Never log OTP, phone or token.
   return answer(202);
  }catch{return answer(503)}
 }
};
