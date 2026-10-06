// MIRA shared Supabase configuration (publishable client key only)
window.MIRA_SUPABASE={
  url:'https://xjspokwtikefpgwczehp.supabase.co',
  key:'sb_publishable_ZBpq_GYBalp6mItfAKRCDA_UT2Qedou'
};
window.MiraCloud={
  async request(path,options={}){
    const c=window.MIRA_SUPABASE;
    const headers={apikey:c.key,Authorization:'Bearer '+c.key,'Content-Type':'application/json',Prefer:'return=representation',...(options.headers||{})};
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
  async remove(id){return this.request('mira_records?id=eq.'+encodeURIComponent(id),{method:'DELETE'});}
};