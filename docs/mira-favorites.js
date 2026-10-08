(()=> {
  const KEY='mira_saved';
  const HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-4.7-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.3-8 11-8 11z"/></svg>';
  const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}};
  const write=x=>localStorage.setItem(KEY,JSON.stringify(x));
  const key=x=>String((x.type||'offer')+':'+(x.id||''));
  const isSaved=item=>read().some(x=>key(x)===key(item));
  function setButton(btn,on){
    if(!btn)return; btn.classList.toggle('is-saved',on);
    btn.setAttribute('aria-pressed',on?'true':'false');
    btn.setAttribute('aria-label',on?'Remove from favorites':'Add to favorites');
    if(!btn.innerHTML.trim())btn.innerHTML=HEART;
  }
  function toggle(item,btn){
    let list=read(),k=key(item),i=list.findIndex(x=>key(x)===k),on;
    if(i>=0){list.splice(i,1);on=false}else{list.unshift(item);on=true}
    write(list);setButton(btn,on);
    window.dispatchEvent(new CustomEvent('mira-favorites-changed',{detail:{item,saved:on,list}}));
    return on;
  }
  function slug(s){return String(s||'').trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g,'-').replace(/^-|-$/g,'')}
  function infer(card){
    const href=card.getAttribute('href')||card.dataset.href||'';
    const title=(card.dataset.title||card.querySelector('.offertitle,h4,h3,b')?.textContent||card.textContent||'MIRA item').trim().slice(0,120);
    const name=(card.dataset.name||card.querySelector('.merchant')?.textContent||title).trim().slice(0,80);
    let type=card.dataset.favType||card.dataset.type||'offer';
    if(/store/i.test(href)||card.classList.contains('store-card'))type='store';
    else if(card.classList.contains('service-card'))type='service';
    else if(card.classList.contains('product-card'))type='product';
    const id=card.dataset.favId||card.dataset.id||href||slug(type+'-'+name+'-'+title);
    return {id:String(id),type,storeId:card.dataset.storeId||'',name,title,discount:card.dataset.discount||'',letter:(name[0]||'M').toUpperCase(),href};
  }
  function enhance(root=document){
    const sel='.featured-card,.flash-card,.recent-card,.interest-card,.near-card,.offer,.offer-card,.results .item,.list .card,.grid .card,.store-card,.product-card,.service-card,[data-favorite-card]';
    root.querySelectorAll(sel).forEach(card=>{
      if(card.closest('.saved-grid')||card.querySelector(':scope > .mira-heart'))return;
      if(getComputedStyle(card).position==='static')card.style.position='relative';
      const item=infer(card);
      const btn=document.createElement('button');btn.type='button';btn.className='mira-heart';btn.innerHTML=HEART;
      btn.dataset.favoritePayload=encodeURIComponent(JSON.stringify(item));
      setButton(btn,isSaved(item));card.appendChild(btn);
    });
  }
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.mira-heart');if(!btn)return;
    e.preventDefault();e.stopPropagation();
    let item;try{item=JSON.parse(decodeURIComponent(btn.dataset.favoritePayload||''))}catch(_){item=infer(btn.parentElement)}
    toggle(item,btn);
  });
  const api={read,isSaved,toggle,enhance,infer,sync(){document.querySelectorAll('.mira-heart').forEach(btn=>{try{const x=JSON.parse(decodeURIComponent(btn.dataset.favoritePayload||''));setButton(btn,isSaved(x))}catch(e){}})}};
  window.MiraFavorites=api;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>enhance());
  else enhance();
  new MutationObserver(m=>{for(const x of m)for(const n of x.addedNodes)if(n.nodeType===1)enhance(n.matches?.('.featured-card,.flash-card,.recent-card,.interest-card,.near-card,.offer,.offer-card,.results .item,.list .card,.grid .card,.store-card,.product-card,.service-card,[data-favorite-card]')?n.parentElement:n)}).observe(document.documentElement,{childList:true,subtree:true});
})();