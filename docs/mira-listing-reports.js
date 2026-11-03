/* MIRA report button, reason branches and free-text details. */
(()=>{'use strict';
const langs={
ar:['إبلاغ','الإبلاغ عن الإعلان','سبب البلاغ','اختر السبب','تفاصيل البلاغ','إرسال البلاغ','إلغاء','تم استلام بلاغك.','سجّل دخولك أولاً.','تعذر إرسال البلاغ.','احتيال','محتوى ممنوع','معلومات مضللة','إعلان مكرر','إساءة أو تحرش','سبب آخر'],
en:['Report','Report listing','Reason','Select reason','Report details','Send report','Cancel','Your report was received.','Sign in first.','Could not send report.','Fraud or scam','Prohibited content','Misleading content','Duplicate listing','Harassment or abuse','Other'],
es:['Denunciar','Denunciar anuncio','Motivo','Seleccionar','Descripción','Enviar','Cancelar','Denuncia recibida.','Inicia sesión.','No se pudo enviar.','Fraude','Contenido prohibido','Información engañosa','Duplicado','Acoso','Otro'],
ru:['Жалоба','Пожаловаться на объявление','Причина','Выбрать','Описание','Отправить','Отмена','Жалоба отправлена.','Войдите в аккаунт.','Ошибка отправки.','Мошенничество','Запрещено','Обман','Дубликат','Оскорбление','Другое'],
tr:['Bildir','İlanı bildir','Neden','Neden seçin','Açıklama','Gönder','İptal','Bildirim alındı.','Önce giriş yapın.','Bildirilemedi.','Dolandırıcılık','Yasaklı içerik','Yanıltıcı ilan','Tekrar eden ilan','Taciz','Diğer']};
const reasons=['fraud','prohibited','misleading','duplicate','harassment','other'];
const labels=()=>langs[localStorage.getItem('mira_lang')]||langs.en;
let overlay,selected,previous;
function mount(){
 if(overlay)return;
 const css=document.createElement('style');
 css.textContent='.mira-report-trigger{background:#fff!important;border:1px solid #dcb3c4!important;color:#800020!important;padding:10px 12px!important;border-radius:12px!important;margin-inline-start:8px!important;font:700 12px Poppins,sans-serif!important;cursor:pointer!important}.mira-report-overlay[hidden]{display:none!important}.mira-report-overlay{position:fixed;z-index:50000;inset:0;background:#250612aa;display:flex;align-items:center;justify-content:center;padding:16px}.mira-report-panel{background:#fff9fc;border:1px solid #eecadb;box-shadow:0 20px 55px #300c2050;border-radius:20px;max-width:420px;width:100%;padding:22px;color:#612139;font-family:Poppins,sans-serif}.mira-report-panel h2{color:#800020;font-size:20px}.mira-report-panel label{display:block;margin:14px 0 7px;font-size:12px;font-weight:700}.mira-report-panel select,.mira-report-panel textarea{box-sizing:border-box;display:block;width:100%;padding:12px;border:1px solid #e2bccb;border-radius:11px;color:#612139;background:white;font:inherit}.mira-report-panel textarea{min-height:100px;resize:vertical}.mira-report-actions{display:flex;gap:12px;margin-top:15px}.mira-report-actions button{flex:1;padding:12px;border:0;border-radius:11px;background:#800020;color:white;font-weight:700;cursor:pointer}.mira-report-actions button[type=button]{background:#ffe8f0;color:#800020}';
 document.head.append(css);
 overlay=document.createElement('div');overlay.hidden=true;overlay.className='mira-report-overlay';
 overlay.innerHTML='<div class="mira-report-panel" role="dialog" aria-modal="true" aria-labelledby="miraReportTitle"><h2 id="miraReportTitle"></h2><form id="miraReportForm"><label for="miraReportReason" id="miraReportReasonLabel"></label><select id="miraReportReason" required></select><label for="miraReportDetails" id="miraReportDetailsLabel"></label><textarea id="miraReportDetails" maxlength="1000"></textarea><div class="mira-report-actions"><button type="button" id="miraReportCancel"></button><button type="submit" id="miraReportSend"></button></div><p id="miraReportFeedback" role="status" aria-live="polite"></p></form></div>';
 document.body.append(overlay);
 document.getElementById('miraReportCancel').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 document.addEventListener('keydown',e=>{if(!overlay.hidden&&e.key==='Escape')close()});
 document.getElementById('miraReportForm').onsubmit=submit;
}
function close(){overlay.hidden=true;selected=null;previous?.focus()}
function open(type,id,button){
 if(!['car','friday'].includes(type)||!/^[0-9a-f-]{36}$/i.test(id))return;
 mount();selected={type,id};previous=button;const l=labels();
 for(const [name,index] of Object.entries({miraReportTitle:1,miraReportReasonLabel:2,miraReportDetailsLabel:4,miraReportSend:5,miraReportCancel:6}))document.getElementById(name).textContent=l[index];
 const reasonsSelect=document.getElementById('miraReportReason');
 reasonsSelect.replaceChildren(new Option(l[3],''),...reasons.map((reason,i)=>new Option(l[i+10],reason)));
 reasonsSelect.value='';document.getElementById('miraReportDetails').value='';document.getElementById('miraReportFeedback').textContent='';overlay.hidden=false;reasonsSelect.focus();
}
async function submit(e){e.preventDefault();if(!selected)return;
 const l=labels(),button=document.getElementById('miraReportSend'),feedback=document.getElementById('miraReportFeedback'),reason=document.getElementById('miraReportReason').value,details=document.getElementById('miraReportDetails').value.trim();
 if(!reasons.includes(reason))return;button.disabled=true;
 try{
  await MiraCloud.ensureFreshSession();
  const user=await MiraCloud.getCurrentUser();
  if(!user?.id)throw Error('login');
  await MiraCloud.request('mira_listing_reports',{method:'POST',requireAuth:true,body:JSON.stringify({reporter_id:user.id,target_type:selected.type,target_id:selected.id,reason,details})});
  feedback.textContent=l[7];setTimeout(()=>{if(!overlay.hidden)close()},1100);
 }catch(err){
  feedback.textContent=err.message==='login'?l[8]:l[9];
  if(err.message==='login')setTimeout(()=>location.href='signin.html?return='+encodeURIComponent(location.pathname.split('/').pop()),1500);
 }finally{button.disabled=false}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-mira-report]');if(b)open(b.dataset.miraReport,b.dataset.reportId,b)});
})();