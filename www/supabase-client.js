// Supabase adapter for MIRA. Falls back to local prototype behavior when unconfigured.
(function(){
  const cfg=window.MIRA_SUPABASE_CONFIG||{};
  const sdk=window.supabase;
  const enabled=!!(sdk&&cfg.url&&cfg.anonKey);
  const client=enabled?sdk.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;

  async function getSession(){
    if(!client)return null;
    const {data,error}=await client.auth.getSession();
    if(error)throw error;
    return data.session||null;
  }
  async function signInEmail(email,fullName){
    if(!client)return {demo:true};
    const redirect=location.origin+location.pathname;
    const {data,error}=await client.auth.signInWithOtp({
      email,
      options:{
        emailRedirectTo:redirect,
        shouldCreateUser:true,
        data:fullName?{full_name:fullName}:undefined
      }
    });
    if(error)throw error;
    return data;
  }
  async function signInPhone(phone,fullName){
    if(!client)return {demo:true};
    const {data,error}=await client.auth.signInWithOtp({
      phone,
      options:{data:fullName?{full_name:fullName}:undefined}
    });
    if(error)throw error;
    return data;
  }
  async function verifyPhone(phone,token){
    if(!client)return {demo:true};
    const {data,error}=await client.auth.verifyOtp({phone,token,type:'sms'});
    if(error)throw error;
    return data;
  }
  async function signOut(){
    if(!client)return;
    const {error}=await client.auth.signOut();
    if(error)throw error;
  }
  async function insertOrder(order){
    if(!client)return {demo:true};
    const session=await getSession();
    if(!session)throw new Error('Authentication required');
    const {data,error}=await client.from('orders').insert({
      customer_id:session.user.id,
      merchant_id:order.merchant_id||null,
      market:order.market||'Iraq',
      currency:order.currency||'IQD',
      customer_name:order.delivery.name,
      phone_primary:order.delivery.phone1,
      phone_secondary:order.delivery.phone2||null,
      governorate:order.delivery.governorate,
      area:order.delivery.area,
      address:order.delivery.address,
      subtotal:order.subtotal||0,
      delivery_fee:order.delivery_fee||0
    }).select().single();
    if(error)throw error;
    if(order.items?.length){
      const rows=order.items.map(x=>({
        order_id:data.id,
        product_ref:String(x.id),
        product_title:x.title||'Product',
        quantity:x.qty||1,
        unit_price:x.unit_price||0,
        currency:order.currency||'IQD',
        attributes:x.attributes||{},
        snapshot:x.snapshot||{}
      }));
      const {error:itemError}=await client.from('order_items').insert(rows);
      if(itemError)throw itemError;
    }
    return data;
  }

  window.MIRA_DB={enabled,client,getSession,signInEmail,signInPhone,verifyPhone,signOut,insertOrder};
})();
