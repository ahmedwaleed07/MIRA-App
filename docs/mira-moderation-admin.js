/* MIRA Admin: human-first moderation. AI suggestions can be added later, never auto-approve. */
(()=>{'use strict';
const $=id=>document.getElementById(id),root=$('miraModerationQueue'),status=$('miraModerationStatus'),refresh=$('miraModerationRefresh');
if(!root||!status||!refresh)return;
const translations={
 ar:{pending:'إعلانات تنتظر التدقيق',reports:'بلاغات قيد المراجعة',refresh:'تحديث',empty:'ماكو طلبات معلقة حالياً.',denied:'تحتاج صلاحية أدمن معتمدة.',error:'تعذّر تحميل قائمة التدقيق.',approve:'موافقة ونشر',reject:'رفض',hide:'إخفاء الإعلان',note:'ملاحظة التدقيق (اختياري)',mark:'تمت المراجعة',dismiss:'استبعاد البلاغ',loading:'جارِ جلب البيانات...',saved:'تم حفظ القرار.',failed:'تعذّر تنفيذ القرار.',friday:'سوق الجمعة',car:'بيع مباشر للسيارات',offers:'عروض المتاجر'},
 en:{pending:'Listings awaiting review',reports:'Open reports',refresh:'Refresh',empty:'Nothing is awaiting review.',denied:'Authorized MIRA Admin account required.',error:'Could not load moderation queue.',approve:'Approve & publish',reject:'Reject',hide:'Hide listing',note:'Review note (optional)',mark:'Mark reviewed',dismiss:'Dismiss report',loading:'Loading moderation queue...',saved:'Decision saved.',failed:'Could not save decision.',friday:'Friday Market',car:'Direct Car Sale',offers:'Merchant Offers'},
 es:{pending:'Anuncios pendientes',reports:'Denuncias abiertas',refresh:'Actualizar',empty:'Sin anuncios pendientes.',denied:'Se requiere administrador.',error:'No se pudo cargar.',approve:'Aprobar y publicar',reject:'Rechazar',hide:'Ocultar anuncio',note:'Nota de revisión',mark:'Revisado',dismiss:'Descartar denuncia',loading:'Cargando...',saved:'Decisión guardada.',failed:'Error al guardar.',friday:'Mercado del viernes',car:'Venta directa de autos',offers:'Ofertas'},
 ru:{pending:'Ожидают проверки',reports:'Жалобы',refresh:'Обновить',empty:'Нет ожидающих объявлений.',denied:'Требуется доступ администратора.',error:'Ошибка загрузки.',approve:'Одобрить',reject:'Отклонить',hide:'Скрыть',note:'Примечание',mark:'Проверено',dismiss:'Отклонить жалобу',loading:'Загрузка...',saved:'Решение сохранено.',failed:'Ошибка сохранения.',friday:'Пятничный рынок',car:'Продажа авто',offers:'Предложения'},
 tr:{pending:'Onay bekleyen ilanlar',reports:'Açık bildirimler',refresh:'Yenile',empty:'Bekleyen ilan yok.',denied:'Yetkili yönetici hesabı gerekli.',error:'Liste yüklenemedi.',approve:'Onayla ve yayınla',reject:'Reddet',hide:'İlanı gizle',note:'İnceleme notu',mark:'İncelendi',dismiss:'Bildirimi reddet',loading:'Yükleniyor...',saved:'Karar kaydedildi.',failed:'Karar kaydedilemedi.',friday:'Cuma Pazarı',car:'Doğrudan Araç Satışı',offers:'Teklifler'}
};
const labels=()=>translations[localStorage.getItem('mira_lang')]||translations.en;
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const REASONS={fraud:'Fraud / احتيال',prohibited:'Prohibited / ممنوع',misleading:'Misleading / تضليل',duplicate:'Duplicate / مكرر',harassment:'Harassment / إساءة',other:'Other / أخرى'};
let state={friday:[],car:[],offer:[],reports:[]},loaded=false,loading=false;
const show=message=>{status.textContent=message||''};
async function authorized(){
 const cloud=window.MiraCloud;
 if(!cloud?.session?.access_token)return false;
 await cloud.ensureFreshSession();
 const user=await cloud.getCurrentUser();if(!user?.id)return false;
 const rows=await cloud.request('mira_notification_admins?user_id=eq.'+encodeURIComponent(user.id)+'&select=user_id',{requireAuth:true});
 return Array.isArray(rows)&&rows.some(x=>x.user_id===user.id);
}
async function load(){
 if(loading)return;loading=true;loaded=false;show(labels().loading);refresh.disabled=true;
 try{
  if(!await authorized()){root.replaceChildren();show(labels().denied);return}
  const cloud=window.MiraCloud;
  const [friday,car,records,reports]=await Promise.all([
   cloud.request('mira_friday_listings?select=id,seller_id,title,description,status,price_iqd,created_at&status=eq.pending&order=created_at.asc&limit=100',{requireAuth:true}),
   cloud.request('mira_car_direct_listings?select=id,seller_id,make,model,model_year,description,status,price_iqd,created_at&status=eq.pending&order=created_at.asc&limit=100',{requireAuth:true}),
   cloud.request('mira_records?kind=eq.offer&select=id,data,updated_at&order=updated_at.desc&limit=250',{requireAuth:true}),
   cloud.request('mira_listing_reports?select=id,reporter_id,target_type,target_id,reason,details,status,created_at&status=eq.open&order=created_at.asc&limit=100',{requireAuth:true})
  ]);
  state={friday,car,offer:records.filter(x=>x.data?.status==='pending'),reports};loaded=true;
  render();show('');
 }catch(e){root.replaceChildren();show(labels().error);console.warn('MIRA moderation loading failed',e)}
 finally{loading=false;refresh.disabled=false}
}
function render(){
 const l=labels(),rows=[...state.friday.map(x=>({...x,kind:'friday',label:x.title})),...state.car.map(x=>({...x,kind:'car',label:[x.make,x.model,x.model_year].filter(Boolean).join(' ')})),...state.offer.map(x=>({...x,kind:'offer',label:x.data?.title||x.id}))];
 let html='<h3 style="margin:20px 0 10px;color:#800020">'+escapeHtml(l.pending)+' ('+rows.length+')</h3>';
 html+=rows.map(x=>{
  const description=x.kind==='offer'?x.data?.description:x.description;
  return '<article class="mira-review-card"><div><strong>'+escapeHtml(x.label)+'</strong><small>'+escapeHtml(l[x.kind])+' · '+escapeHtml(String(x.id).slice(0,10))+'</small></div><p>'+escapeHtml(description||'').slice(0,800)+'</p><label>'+escapeHtml(l.note)+'</label><textarea rows="2" maxlength="1000" data-mira-review-note="'+escapeHtml(x.kind)+':'+escapeHtml(x.id)+'"></textarea><div class="mira-review-actions"><button type="button" data-mira-review-kind="'+escapeHtml(x.kind)+'" data-mira-review-id="'+escapeHtml(x.id)+'" data-mira-review-status="active">'+escapeHtml(l.approve)+'</button><button type="button" class="soft" data-mira-review-kind="'+escapeHtml(x.kind)+'" data-mira-review-id="'+escapeHtml(x.id)+'" data-mira-review-status="rejected">'+escapeHtml(l.reject)+'</button></div></article>';
 }).join('');
 if(!rows.length)html+='<p>'+escapeHtml(l.empty)+'</p>';
 html+='<h3 style="margin:22px 0 10px;color:#800020">'+escapeHtml(l.reports)+' ('+state.reports.length+')</h3>';
 html+=state.reports.map(x=>
  '<article class="mira-review-card"><strong>'+escapeHtml(REASONS[x.reason]||x.reason)+'</strong><small>'+escapeHtml(l[x.target_type])+' · '+escapeHtml(String(x.target_id).slice(0,12))+'</small><p>'+escapeHtml(x.details||'—')+'</p><label>'+escapeHtml(l.note)+'</label><textarea rows="2" maxlength="1000" data-mira-report-note="'+escapeHtml(x.id)+'"></textarea><div class="mira-review-actions"><button type="button" data-mira-resolve-id="'+escapeHtml(x.id)+'" data-mira-resolve-as="actioned">'+escapeHtml(l.hide)+'</button><button type="button" class="soft" data-mira-resolve-id="'+escapeHtml(x.id)+'" data-mira-resolve-as="dismissed">'+escapeHtml(l.dismiss)+'</button></div></article>'
 ).join('');
 root.innerHTML=html;
}
async function review(kind,id,decision,button){
 if(!loaded||!['friday','car','offer'].includes(kind)||!['active','rejected'].includes(decision))return;
 const cloud=window.MiraCloud;button.disabled=true;const l=labels();
 const note=root.querySelector('textarea[data-mira-review-note="'+kind+':'+id+'"]')?.value.trim()||'';
 try{
  const data=state[kind].find(x=>x.id===id);if(!data)throw Error('Listing not found');
  if(kind==='offer'){
   const item={...data.data,status:decision};
   await cloud.request('mira_records?id=eq.'+encodeURIComponent(id),{method:'PATCH',requireAuth:true,body:JSON.stringify({data:item,updated_at:new Date().toISOString()})});
  }else{
   const table=kind==='car'?'mira_car_direct_listings':'mira_friday_listings';
   await cloud.request(table+'?id=eq.'+encodeURIComponent(id),{method:'PATCH',requireAuth:true,body:JSON.stringify({status:decision,review_note:note})});
   await cloud.request('mira_listing_review_events',{method:'POST',requireAuth:true,body:JSON.stringify({
    recipient_user_id:data.seller_id,listing_type:kind,listing_id:id,event_type:decision==='active'?'approved':'rejected',note
   })});
  }
  show(l.saved);await load();
 }catch(e){show(l.failed);console.warn('MIRA moderation decision failed',e)}
 finally{button.disabled=false}
}
async function resolve(id,result,button){
 if(!loaded)return;const report=state.reports.find(x=>x.id===id);if(!report)return;
 const cloud=window.MiraCloud;button.disabled=true;
 try{
  if(result==='actioned'){
   const table=report.target_type==='car'?'mira_car_direct_listings':'mira_friday_listings';
   const rows=await cloud.request(table+'?id=eq.'+encodeURIComponent(report.target_id)+'&select=id,seller_id',{requireAuth:true});
   if(rows?.length){
    await cloud.request(table+'?id=eq.'+encodeURIComponent(report.target_id),{method:'PATCH',requireAuth:true,body:JSON.stringify({status:'hidden'})});
    await cloud.request('mira_listing_review_events',{method:'POST',requireAuth:true,body:JSON.stringify({recipient_user_id:rows[0].seller_id,listing_type:report.target_type,listing_id:report.target_id,event_type:'hidden',note:'Reported listing hidden after moderation.'})});
   }
  }
  const note=root.querySelector('textarea[data-mira-report-note="'+id+'"]')?.value.trim()||'';
  await cloud.request('mira_listing_reports?id=eq.'+encodeURIComponent(id),{method:'PATCH',requireAuth:true,body:JSON.stringify({status:result,admin_note:note,resolved_at:new Date().toISOString()})});
  show(labels().saved);await load();
 }catch(e){show(labels().failed);console.warn('MIRA report review failed',e)}
 finally{button.disabled=false}
}
root.addEventListener('click',e=>{
 const reviewButton=e.target.closest('[data-mira-review-id]');
 if(reviewButton){void review(reviewButton.dataset.miraReviewKind,reviewButton.dataset.miraReviewId,reviewButton.dataset.miraReviewStatus,reviewButton);return}
 const reportButton=e.target.closest('[data-mira-resolve-id]');
 if(reportButton)void resolve(reportButton.dataset.miraResolveId,reportButton.dataset.miraResolveAs,reportButton);
});
refresh.onclick=load;
document.querySelector('[data-panel="moderation"]')?.addEventListener('click',load);
})();