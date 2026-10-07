// MIRA shared Supabase configuration (publishable client key only)
window.MIRA_SUPABASE={
  url:'https://xjspokwtikefpgwczehp.supabase.co',
  key:'sb_publishable_ZBpq_GYBalp6mItfAKRCDA_UT2Qedou'
};
window.MiraCloud={
  session:null,
  sessionKey(){return /business\.html$/i.test(location.pathname)?'mira_merchant_session':'mira_admin_session'},
  loadSession(){try{this.session=JSON.parse(localStorage.getItem(this.sessionKey())||'null')}catch(e){this.session=null}return this.session},
  token(){return this.session&&this.session.access_token?this.session.access_token:window.MIRA_SUPABASE.key},
  async signIn(email,password){
    const c=window.MIRA_SUPABASE;
    const r=await fetch(c.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:c.key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
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
  async request(path,options={}){
    const c=window.MIRA_SUPABASE;
    const headers={apikey:c.key,Authorization:'Bearer '+this.token(),'Content-Type':'application/json',Prefer:'return=representation',...(options.headers||{})};
    const r=await fetch(c.url+'/rest/v1/'+path,{...options,headers});
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
    const ext=((file.name||'image.jpg').split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
    const path=folder+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,9)+'.'+ext;
    const r=await fetch(c.url+'/storage/v1/object/mira-media/'+path,{
      method:'POST',
      headers:{apikey:c.key,Authorization:'Bearer '+this.token(),'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},
      body:file
    });
    if(!r.ok)throw new Error(await r.text());
    return c.url+'/storage/v1/object/public/mira-media/'+path;
  }
};
window.MiraCloud.loadSession();
