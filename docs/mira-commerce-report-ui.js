/* MIRA: a report action on every live merchant offer and store detail page. */
(()=>{'use strict';
function init(){
 const path=location.pathname.split('/').pop();
 const type=path==='offer.html'?'offer':path==='store.html'?'store':null;
 if(!type)return;
 const id=new URLSearchParams(location.search).get('id')||'';
 if(!/^[A-Za-z0-9_-]{1,150}$/.test(id))return;
 const root=document.querySelector('main.app');if(!root)return;
 const code=localStorage.getItem('mira_lang')||'en';
 const names={ar:'الإبلاغ عن هذا الإعلان',en:'Report this listing',es:'Denunciar este anuncio',ru:'Пожаловаться на объявление',tr:'Bu ilanı bildir'};
 const wrap=document.createElement('div');
 wrap.style.cssText='max-width:430px;margin:10px auto 35px;padding:0 16px;text-align:center';
 const button=document.createElement('button');button.type='button';button.className='mira-report-trigger';
 button.dataset.miraReport=type;button.dataset.reportId=id;button.textContent=names[code]||names.en;
 wrap.append(button);root.append(wrap);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();