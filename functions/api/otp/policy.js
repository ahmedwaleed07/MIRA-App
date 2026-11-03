import {POLICY,respond,backendReady,senderReady} from "../../_lib/mira-otp.js";
export const onRequestGet=async({request,env})=>respond(request,{channel:'whatsapp',backendReady:backendReady(env),providerReady:senderReady(env),sendingEnabled:senderReady(env),...POLICY});
export const onRequestOptions=async({request})=>respond(request,{},204);
