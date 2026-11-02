/* MIRA unified footer language control – five languages, all user/business/admin pages. */
(()=>{'use strict';
const languages={ar:'العربية',en:'English',es:'Español',ru:'Русский',tr:'Türkçe'};
const codes=Object.keys(languages);
const globe='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18"/></svg>';
function selectedLanguage(){try{const value=localStorage.getItem('mira_lang');if(codes.includes(value))return value}catch(_){}
 const page=new URLSearchParams(location.search).get('lang');
 return codes.includes(page)?page:(codes.includes(document.documentElement.lang)?document.documentElement.lang:'en');
}
function init(){
 if(document.getElementById('miraFooterLanguage'))return;
 let language=selectedLanguage();
 // Remove the deprecated header selector if a cached localization script created one.
 const legacyHeader=document.getElementById('miraLocaleToggle');
 if(legacyHeader){const container=legacyHeader.closest('.mira-locale-wrap')||legacyHeader.parentElement;if(container&&container!==document.body)container.remove();}
 const nav=document.querySelector('nav.bottom');
 const brandedFooter=!nav&&(document.querySelector('footer.brand-footer')||document.querySelector('.footer-brand')||document.querySelector('footer:not(.mira-language-site-footer)'));
 const isPortal=document.body.classList.contains('mira-business')||document.body.classList.contains('mira-admin');
 let host=nav||brandedFooter;
 if(!host){
  host=document.createElement('footer');
  host.className='mira-language-site-footer'+(isPortal?' mira-language-portal':'');
  if(isPortal||document.querySelector('.auth-stage'))document.body.appendChild(host);
  else (document.querySelector('main.app')||document.querySelector('main.wrap')||document.querySelector('main')||document.querySelector('.wrap')||document.body).appendChild(host);
 }
 if(nav)nav.classList.add('mira-bottom-with-language');
 const control=document.createElement('div');
 control.id='miraFooterLanguage';
 control.className='mira-footer-language'+(nav?' mira-footer-nav-slot':'');
 control.dir='ltr';
 const button=document.createElement('button');
 button.type='button';button.className='mira-footer-language-button';
 button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');
 button.setAttribute('aria-label','Language / اللغة');
 const label=document.createElement('span');label.className='mira-footer-language-label';
 button.innerHTML=globe;
 button.appendChild(label);
 const menu=document.createElement('div');
 menu.id='miraFooterLanguageMenu';menu.className='mira-footer-language-menu';menu.setAttribute('role','menu');menu.hidden=true;
 for(const code of codes){
  const option=document.createElement('button');option.type='button';option.dataset.miraFooterLocale=code;option.setAttribute('role','menuitemradio');
  option.innerHTML='<span class="mira-locale-dot" aria-hidden="true"></span><span dir="auto">'+languages[code]+'</span>';
  option.addEventListener('click',()=>{
   if(code===language){close();return}
   try{localStorage.setItem('mira_lang',code)}catch(_){}
   // Reload to refresh all platform-specific translated strings and dynamically generated labels.
   // Keep welcome/onboarding pages with ?lang=... synchronized with the selected footer language.
   const dest=new URL(location.href);
   if(dest.searchParams.has('lang')){
    dest.searchParams.set('lang',code);
    location.replace(dest.pathname+dest.search+dest.hash);
   }else location.reload();
  });
  menu.appendChild(option);
 }
 function close(){menu.hidden=true;button.setAttribute('aria-expanded','false')}
 function open(){menu.hidden=false;button.setAttribute('aria-expanded','true');menu.querySelector('[aria-checked="true"]')?.focus()}
 function sync(){
  label.textContent=languages[language];
  for(const item of menu.querySelectorAll('[data-mira-footer-locale]'))item.setAttribute('aria-checked',String(item.dataset.miraFooterLocale===language));
 }
 button.addEventListener('click',()=>menu.hidden?open():close());
 control.addEventListener('keydown',event=>{
  if(event.key==='Escape'){close();button.focus();return}
  if(!menu.hidden&&(event.key==='ArrowDown'||event.key==='ArrowUp')){
   event.preventDefault();const opts=Array.from(menu.querySelectorAll('button'));const i=opts.indexOf(document.activeElement);
   opts[(i+(event.key==='ArrowDown'?1:-1)+opts.length)%opts.length].focus();
  }
 });
 document.addEventListener('pointerdown',event=>{if(!control.contains(event.target))close()});
 window.addEventListener('storage',event=>{
  if(event.key==='mira_lang'&&codes.includes(event.newValue)){language=event.newValue;sync();close()}
 });
 control.append(button,menu);host.appendChild(control);
 // Retire redundant language controls without altering their app-level logic.
 for(const el of document.querySelectorAll('.lang-mini,.languages,#langs,select#language'))el.classList.add('mira-language-retired');
 const profileLanguages=document.getElementById('langs');
 if(profileLanguages)profileLanguages.closest('.section')?.classList.add('mira-language-retired');
 document.body.classList.add('mira-footer-language-enabled');
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
