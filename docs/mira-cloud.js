// MIRA shared Supabase configuration (publishable client key only)
window.MIRA_SUPABASE={
  url:'https://xjspokwtikefpgwczehp.supabase.co',
  key:'sb_publishable_ZBpq_GYBalp6mItfAKRCDA_UT2Qedou'
};
window.MiraCloud={
  session:null,
  sessionKey(){const p=location.pathname;return /business\.html$/i.test(p)?'mira_merchant_session':/admin\.html$/i.test(p)?'mira_admin_session':'mira_customer_session'},
  // Customer/Merchant: checked stores session, never passwords, across browser restarts.
  // Unchecked uses tab-only sessionStorage. Admin is unchanged.
  isMerchant(){return /business\.html$/i.test(location.pathname)},
  isCustomer(){return !/(?:business|admin)\.html$/i.test(location.pathname)},
  rememberKey(){return this.isMerchant()?'mira_merchant_remember_me':'mira_customer_remember_me'},
  rememberMe(){
    if(!this.isMerchant()&&!this.isCustomer())return true;
    return localStorage.getItem(this.rememberKey())!=='false';
  },
  setRememberMe(enabled){
    if(!this.isMerchant()&&!this.isCustomer())return;
    localStorage.setItem(this.rememberKey(),enabled?'true':'false');
    if(this.session)this.saveSession();
    else if(!enabled)localStorage.removeItem(this.sessionKey());
  },
  saveSession(){
    if(!this.session)return;
    const key=this.sessionKey(),serialized=JSON.stringify(this.session);
    if((this.isMerchant()||this.isCustomer())&&!this.rememberMe()){
      sessionStorage.setItem(key,serialized);
      localStorage.removeItem(key);
    }else{
      localStorage.setItem(key,serialized);
      sessionStorage.removeItem(key);
    }
  },
  loadSession(){
    try{
      const key=this.sessionKey();
      if((this.isMerchant()||this.isCustomer())&&!this.rememberMe()){
        localStorage.removeItem(key);
        this.session=JSON.parse(sessionStorage.getItem(key)||'null');
      }else{
        this.session=JSON.parse(localStorage.getItem(key)||'null');
        if(!this.session&&sessionStorage.getItem(key)){
          this.session=JSON.parse(sessionStorage.getItem(key));
          this.saveSession();
        }
      }
    }catch(e){this.session=null}
    return this.session;
  },
  rememberedSession(){
    if(!this.rememberMe()||(!this.isMerchant()&&!this.isCustomer()))return null;
    try{
      const data=JSON.parse(localStorage.getItem(this.sessionKey())||'null');
      return data?.access_token&&data?.refresh_token?data:null;
    }catch(_){return null}
  },
  // Share newly rotated tokens when another browser tab refreshes a remembered login.
  syncRememberedSession(){
    const stored=this.rememberedSession();
    if(!stored||stored.refresh_token===this.session?.refresh_token)return false;
    const prior=this.session,oldUser=this.payload()?.sub;
    this.session=stored;
    const p=this.payload();
    if(!p||p.role!=='authenticated'||!p.sub||(oldUser&&p.sub!==oldUser)||this.tokenExpired(20)){
      this.session=prior;return false;
    }
    return true;
  },
  token(){return this.session&&this.session.access_token?this.session.access_token:window.MIRA_SUPABASE.key},
  payload(){try{const t=this.session&&this.session.access_token;if(!t)return null;const p=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(decodeURIComponent(escape(atob(p))))}catch(e){return null}},
  requireAuth(){const p=this.payload();if(!p||p.role!=='authenticated'||!p.sub)throw new Error('Authenticated Supabase session required. Please sign out and sign in again.');return p},
  // Store a session only after its returned JWT is checked.
  acceptSession(data){
    if(!data||typeof data.access_token!=='string'||!data.refresh_token)throw new Error('The authentication service did not return a complete session.');
    const previous=this.session;
    this.session=data;
    const p=this.payload();
    if(!p||p.role!=='authenticated'||!p.sub){
      this.session=previous;
      throw new Error('The authentication service returned an invalid session.');
    }
    this.saveSession();
    return this.session;
  },
  async getCurrentUser(){
    if(!this.session?.access_token)return null;
    const c=window.MIRA_SUPABASE;
    let response;
    try{response=await fetch(c.url+'/auth/v1/user',{headers:{apikey:c.key,Authorization:'Bearer '+this.session.access_token}})}
    catch(_){throw new Error('Could not reach the authentication service. Please check your connection.')}
    if(response.status===401||response.status===403){
      if(this.syncRememberedSession())
        response=await fetch(c.url+'/auth/v1/user',{headers:{apikey:c.key,Authorization:'Bearer '+this.session.access_token}});
      if((response.status===401||response.status===403)&&this.session?.refresh_token&&this.tokenExpired(120)){
        await this.refreshSession();
        response=await fetch(c.url+'/auth/v1/user',{headers:{apikey:c.key,Authorization:'Bearer '+this.session.access_token}});
      }
      if(response.status===401||response.status===403){this.signOut();return null}
    }
    if(!response.ok)throw new Error('Could not verify your account. Please try again.');
    const user=await response.json(),p=this.payload();
    if(!user?.id||!p?.sub||user.id!==p.sub){this.signOut();return null}
    if(!this.session.user||this.session.user.id!==user.id){this.session.user=user;this.saveSession()}
    return user;
  },
  async signIn(email,password){
    const c=window.MIRA_SUPABASE;
    const r=await fetch(c.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    if(!r.ok)throw new Error(await r.text());
    this.acceptSession(await r.json());return this.session;
  },
  async startOtp({email='',phone='',createUser=false,data={},redirectTo=''}={}){
    const c=window.MIRA_SUPABASE;
    const body=email?{email,create_user:createUser,data}:{phone,create_user:createUser,data};
    const suffix=redirectTo?'?redirect_to='+encodeURIComponent(redirectTo):'';
    const r=await fetch(c.url+'/auth/v1/otp'+suffix,{method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!r.ok)throw new Error(await r.text());
    const t=await r.text();return t?JSON.parse(t):{};
  },
  async verifyOtp({email='',phone='',token=''}={}){
    const c=window.MIRA_SUPABASE;
    const body=email?{email,token,type:'email'}:{phone,token,type:'sms'};
    const r=await fetch(c.url+'/auth/v1/verify',{method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!r.ok)throw new Error(await r.text());
    this.acceptSession(await r.json());return this.session;
  },
  signOut(){
    this.session=null;
    localStorage.removeItem(this.sessionKey());
    sessionStorage.removeItem(this.sessionKey());
  },
  refreshPromise:null,
  async refreshSession(){
    // Only one refresh per tab, and a Web Lock serializes rotations across tabs.
    if(this.refreshPromise)return this.refreshPromise;
    const run=async()=>{
      if(!this.session?.refresh_token)throw new Error('Session expired. Please sign in again.');
      if(this.syncRememberedSession())return this.session;
      const original=this.session,usedRefresh=original.refresh_token,c=window.MIRA_SUPABASE;
      let r;
      try{
        r=await fetch(c.url+'/auth/v1/token?grant_type=refresh_token',{
          method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},
          body:JSON.stringify({refresh_token:usedRefresh})
        });
      }catch(_){throw new Error('Could not reach the login service. Please check your connection.')}
      if(this.syncRememberedSession())return this.session;
      if(this.session!==original||this.session?.refresh_token!==usedRefresh)
        throw new Error('Your sign-in session changed. Please try again.');
      if(!r.ok){
        if([400,401,403,422].includes(r.status)){
          if(this.syncRememberedSession())return this.session;
          this.signOut();throw new Error('Session expired. Please sign in again.');
        }
        throw new Error('Could not reach the login service. Please try again.');
      }
      this.acceptSession(await r.json());
      return this.session;
    };
    const execute=async()=>{
      const locks=typeof navigator!=='undefined'&&navigator.locks;
      if(this.rememberMe()&&locks&&typeof locks.request==='function')
        return locks.request('mira-session-refresh:'+this.sessionKey(),{mode:'exclusive'},async()=>{
          if(this.syncRememberedSession())return this.session;
          return run();
        });
      return run();
    };
    this.refreshPromise=execute();
    try{return await this.refreshPromise}finally{this.refreshPromise=null}
  },
  tokenExpired(skewSeconds=30){
    if(!this.session?.access_token)return false;
    const p=this.payload();
    const expiration=Number(p?.exp||this.session.expires_at||0);
    return !expiration||Date.now()/1000>=expiration-skewSeconds;
  },
  async ensureFreshSession(){
    if(this.session?.access_token&&this.tokenExpired(120)){
      if(!this.syncRememberedSession())await this.refreshSession();
    }
    return this.session;
  },
  async request(path,options={}){
    const c=window.MIRA_SUPABASE;
    const requireAuth=!!options.requireAuth;
    if(requireAuth)this.requireAuth();
    if(this.session?.access_token&&this.tokenExpired()&&!this.syncRememberedSession())await this.refreshSession();
    const clean={...options};delete clean.requireAuth;
    const send=async()=>{
      const headers={apikey:c.key,Authorization:'Bearer '+this.token(),'Content-Type':'application/json',Prefer:'return=representation',...(clean.headers||{})};
      return fetch(c.url+'/rest/v1/'+path,{...clean,headers});
    };
    let r=await send();
    if(!r.ok&&this.session?.refresh_token&&(r.status===401||r.status===403)){
      const body=await r.text();
      if(/JWT expired|PGRST303|invalid JWT|token.*expired/i.test(body)){
        await this.refreshSession();
        r=await send();
      }else throw new Error(body);
    }
    if(!r.ok)throw new Error(await r.text());
    const t=await r.text();return t?JSON.parse(t):[];
  },
  async list(kind){
    const rows=await this.request('mira_records?kind=eq.'+encodeURIComponent(kind)+'&select=id,data,updated_at&order=updated_at.desc');
    return rows.map(r=>({...r.data,id:r.id}));
  },
  async upsert(kind,item){
    const body={id:item.id,kind,data:item,updated_at:new Date().toISOString()};
    return this.request('mira_records?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(body)});
  },
  async remove(id){return this.request('mira_records?id=eq.'+encodeURIComponent(id),{method:'DELETE'});},
  async syncTaxonomy(){
    const rows=await this.list('taxonomy');
    const rec=rows.find(x=>x.id==='taxonomy-current')||rows[0];
    const items=rec&&(rec.items||rec.taxonomy);
    if(Array.isArray(items)&&items.length){
      const next=JSON.stringify(items),prev=localStorage.getItem('mira_taxonomy')||'';
      localStorage.setItem('mira_taxonomy',next);
      window.MIRA_TAXONOMY=items;
      if(prev!==next)window.dispatchEvent(new CustomEvent('mira-taxonomy-synced',{detail:{items}}));
      return items;
    }
    return window.MIRA_TAXONOMY||[];
  },
  async saveTaxonomy(items){
    if(!Array.isArray(items)||!items.length)throw new Error('Taxonomy cannot be empty.');
    await this.upsert('taxonomy',{id:'taxonomy-current',items,updatedAt:new Date().toISOString()});
    localStorage.setItem('mira_taxonomy',JSON.stringify(items));
    window.MIRA_TAXONOMY=items;
    return items;
  },
  async upload(file,folder='misc'){
    const c=window.MIRA_SUPABASE;
    if(this.session?.access_token&&this.tokenExpired()&&!this.syncRememberedSession())await this.refreshSession();
    const ext=((file.name||'image.jpg').split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
    const path=folder+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,9)+'.'+ext;
    const send=()=>fetch(c.url+'/storage/v1/object/mira-media/'+path,{
      method:'POST',
      headers:{apikey:c.key,Authorization:'Bearer '+this.token(),'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},
      body:file
    });
    let r=await send();
    if(!r.ok&&this.session?.refresh_token&&(r.status===401||r.status===403)){
      const body=await r.text();
      if(/JWT expired|invalid JWT|token.*expired/i.test(body)){await this.refreshSession();r=await send()}else throw new Error(body)
    }
    if(!r.ok)throw new Error(await r.text());
    return c.url+'/storage/v1/object/public/mira-media/'+path;
  }
};
window.MiraCloud.loadSession();
// Keep remembered tabs in sync: signing out in one tab signs out its peers.
if(typeof window.addEventListener==='function')window.addEventListener('storage',event=>{
  const cloud=window.MiraCloud;
  if(event.key!==cloud.sessionKey()||!cloud.rememberMe())return;
  if(!event.newValue){cloud.session=null;return}
  cloud.syncRememberedSession();
});
window.MiraCloud.syncTaxonomy().catch(e=>console.warn('MIRA taxonomy sync failed',e));
