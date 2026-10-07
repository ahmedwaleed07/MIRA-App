// MIRA shared Supabase configuration (publishable client key only)
window.MIRA_SUPABASE={
  url:'https://xjspokwtikefpgwczehp.supabase.co',
  key:'sb_publishable_ZBpq_GYBalp6mItfAKRCDA_UT2Qedou'
};
window.MiraCloud={
  session:null,
  sessionKey(){const p=location.pathname;return /business\.html$/i.test(p)?'mira_merchant_session':/admin\.html$/i.test(p)?'mira_admin_session':'mira_customer_session'},
  loadSession(){try{this.session=JSON.parse(localStorage.getItem(this.sessionKey())||'null')}catch(e){this.session=null}return this.session},
  token(){return this.session&&this.session.access_token?this.session.access_token:window.MIRA_SUPABASE.key},
  payload(){try{const t=this.session&&this.session.access_token;if(!t)return null;const p=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(decodeURIComponent(escape(atob(p))))}catch(e){return null}},
  requireAuth(){const p=this.payload();if(!p||p.role!=='authenticated'||!p.sub)throw new Error('Authenticated Supabase session required. Please sign out and sign in again.');return p},
  async signIn(email,password){
    const c=window.MIRA_SUPABASE;
    const r=await fetch(c.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    if(!r.ok)throw new Error(await r.text());
    this.session=await r.json();localStorage.setItem(this.sessionKey(),JSON.stringify(this.session));return this.session;
  },
  async startOtp({email='',phone='',createUser=false,data={}}={}){
    const c=window.MIRA_SUPABASE;
    const body=email?{email,create_user:createUser,data}:{phone,create_user:createUser,data};
    const r=await fetch(c.url+'/auth/v1/otp',{method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!r.ok)throw new Error(await r.text());
    const t=await r.text();return t?JSON.parse(t):{};
  },
  async verifyOtp({email='',phone='',token=''}={}){
    const c=window.MIRA_SUPABASE;
    const body=email?{email,token,type:'email'}:{phone,token,type:'sms'};
    const r=await fetch(c.url+'/auth/v1/verify',{method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!r.ok)throw new Error(await r.text());
    this.session=await r.json();localStorage.setItem(this.sessionKey(),JSON.stringify(this.session));return this.session;
  },
  signOut(){this.session=null;localStorage.removeItem(this.sessionKey())},
  async refreshSession(){
    if(!this.session?.refresh_token)throw new Error('Session expired. Please sign in again.');
    const c=window.MIRA_SUPABASE;
    const r=await fetch(c.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:this.session.refresh_token})});
    if(!r.ok){this.signOut();throw new Error('Session expired. Please sign in again.')}
    this.session=await r.json();localStorage.setItem(this.sessionKey(),JSON.stringify(this.session));return this.session;
  },
  tokenExpired(skewSeconds=30){const p=this.payload();return !!(p&&p.exp&&Date.now()/1000>=Number(p.exp)-skewSeconds)},
  async ensureFreshSession(){if(this.session?.access_token&&this.tokenExpired())await this.refreshSession();return this.session},
  async request(path,options={}){
    const c=window.MIRA_SUPABASE;
    const requireAuth=!!options.requireAuth;
    if(requireAuth)this.requireAuth();
    if(this.session?.access_token&&this.tokenExpired())await this.refreshSession();
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
  async upload(file,folder='misc'){
    const c=window.MIRA_SUPABASE;
    if(this.session?.access_token&&this.tokenExpired())await this.refreshSession();
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
