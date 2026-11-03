// MIRA verified user self-service deletion. The privileged key stays exclusively in this Edge Function.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const allowHeaders="authorization, apikey, content-type, x-client-info";
const respond=(data,status=200,origin="*")=>new Response(JSON.stringify(data),{
 status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":origin,
 "Access-Control-Allow-Headers":allowHeaders,"Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}
});
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin")||"*";
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":allowHeaders,"Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}});
 if(req.method!=="POST")return respond({error:"Method not allowed"},405,origin);
 const url=Deno.env.get("SUPABASE_URL"),publishable=Deno.env.get("SUPABASE_ANON_KEY"),serviceRole=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!publishable||!serviceRole)return respond({error:"Configuration unavailable"},503,origin);
 const authorization=req.headers.get("authorization")||"";
 if(!authorization.startsWith("Bearer "))return respond({error:"Sign in required"},401,origin);
 let payload:any;
 try{payload=await req.json()}catch{return respond({error:"Invalid request"},400,origin)}
 if(payload?.confirmation!=="DELETE")return respond({error:"Explicit confirmation is required"},400,origin);
 const token=authorization.slice(7);
 const authClient=createClient(url,publishable,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await authClient.auth.getUser(token);
 if(authError||!user?.id)return respond({error:"Session expired or invalid"},401,origin);
 const admin=createClient(url,serviceRole,{auth:{persistSession:false,autoRefreshToken:false}});
 // Store and platform administrators must transfer ownership before closing an account.
 const [merchants,moderators]=await Promise.all([
  admin.from("mira_merchants").select("user_id").eq("user_id",user.id).limit(1),
  admin.from("mira_notification_admins").select("user_id").eq("user_id",user.id).limit(1)
 ]);
 if(merchants.error||moderators.error)return respond({error:"Unable to verify account permissions"},503,origin);
 if(merchants.data?.length||moderators.data?.length)return respond({error:"merchant_or_admin_account",message:"Transfer administrative or merchant responsibilities before deleting this account."},409,origin);
 try{
  // Remove exact per-listing photo paths (two nested UUID folders), not just parent directory objects.
  for(const [bucket,table] of [["mira-friday-items","mira_friday_listings"],["mira-car-direct","mira_car_direct_listings"]] as const){
   const {data:listings,error:listError}=await admin.from(table).select("image_paths").eq("seller_id",user.id);
   if(listError)throw listError;
   const paths=[...new Set((listings||[]).flatMap((row:any)=>Array.isArray(row.image_paths)?row.image_paths:[]))]
     .filter((path:any)=>typeof path==="string"&&path.startsWith(user.id+"/"));
   for(let start=0;start<paths.length;start+=100){
    const {error:removeError}=await admin.storage.from(bucket).remove(paths.slice(start,start+100));
    if(removeError)throw removeError;
   }
  }
  // Retain operational order references only in anonymized form.
  const {error:orderError}=await admin.from("mira_orders").update({
   customer_name:"Deleted MIRA account",phone_primary:"Deleted",phone_secondary:null,
   governorate_city:"Deleted",full_address:"Deleted",landmark:"Deleted",customer_note:null,
  }).eq("customer_user_id",user.id);
  if(orderError)throw orderError;
  const {error:deleteError}=await admin.auth.admin.deleteUser(user.id);
  if(deleteError)throw deleteError;
  return respond({deleted:true},200,origin);
 }catch(error){
  console.error("MIRA delete account failed",error);
  return respond({error:"Account deletion failed; please contact support."},500,origin);
 }
});
