const mq=window.matchMedia('(max-width:700px)');

function initMobilePriceIsland(){
  if(document.getElementById('mobilePriceIsland'))return;
  const form=document.getElementById('calculatorForm');
  const resultCard=document.getElementById('resultCard');
  const visitPrice=document.getElementById('visitPrice');
  const monthlyPrice=document.getElementById('monthlyPrice');
  if(!form||!resultCard||!visitPrice||!monthlyPrice)return;

  const style=document.createElement('style');
  style.id='mobile-price-island-styles';
  style.textContent=`
    .mobile-price-island{display:none}
    @media(max-width:700px){
      .mobile-price-island{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));z-index:95;width:min(calc(100% - 24px),430px);min-height:72px;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:10px 12px 10px 14px;background:linear-gradient(135deg,rgba(7,31,56,.97),rgba(9,74,90,.97));box-shadow:0 18px 50px rgba(3,22,38,.34);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);color:#fff;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;text-align:left;appearance:none;cursor:pointer;opacity:0;pointer-events:none;transform:translate(-50%,calc(100% + 30px));transition:transform .25s ease,opacity .25s ease,box-shadow .2s ease}
      .mobile-price-island.is-visible{opacity:1;pointer-events:auto;transform:translate(-50%,0)}
      .mobile-price-island:active{transform:translate(-50%,2px);box-shadow:0 12px 34px rgba(3,22,38,.30)}
      .mobile-price-island-dot{width:34px;height:34px;border-radius:50%;background:rgba(34,185,178,.15);display:grid;place-items:center;position:relative;flex:none}
      .mobile-price-island-dot:before{content:'';width:8px;height:8px;border-radius:50%;background:#2ad5c7;box-shadow:0 0 0 5px rgba(42,213,199,.11)}
      .mobile-price-island-copy{min-width:0;display:grid;gap:1px}
      .mobile-price-island-label{font-size:9px;letter-spacing:.12em;font-weight:900;color:#9dc4cf;text-transform:uppercase}
      .mobile-price-island-price{font-size:24px;line-height:1.05;font-weight:900;letter-spacing:-.035em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mobile-price-island-meta{font-size:10px;color:#bcd0d8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mobile-price-island-action{height:40px;min-width:78px;border-radius:14px;background:#20b8b1;color:#05263a;display:flex;align-items:center;justify-content:center;gap:5px;padding:0 11px;font-size:11px;font-weight:900;white-space:nowrap}
      .mobile-price-island.is-updating .mobile-price-island-price{animation:mobilePricePulse .28s ease}
      body.has-mobile-price-island{padding-bottom:94px}
      @keyframes mobilePricePulse{0%{transform:scale(1)}45%{transform:scale(1.055);color:#6fe7df}100%{transform:scale(1)}}
    }
    @media(prefers-reduced-motion:reduce){.mobile-price-island{transition:none!important}.mobile-price-island.is-updating .mobile-price-island-price{animation:none!important}}
    @media print{.mobile-price-island{display:none!important}}
  `;
  document.head.append(style);

  const island=document.createElement('button');
  island.type='button';
  island.id='mobilePriceIsland';
  island.className='mobile-price-island';
  island.innerHTML=`<span class="mobile-price-island-dot" aria-hidden="true"></span><span class="mobile-price-island-copy"><span class="mobile-price-island-label">LIVE RICHTPREIS</span><strong class="mobile-price-island-price">—</strong><span class="mobile-price-island-meta">Preis pro Termin</span></span><span class="mobile-price-island-action">Details <span aria-hidden="true">↑</span></span>`;
  document.body.append(island);

  const label=island.querySelector('.mobile-price-island-label');
  const price=island.querySelector('.mobile-price-island-price');
  const meta=island.querySelector('.mobile-price-island-meta');
  const action=island.querySelector('.mobile-price-island-action');

  let formVisible=false;
  let resultVisible=false;
  let pulseTimer=0;

  const isEnglish=()=>document.querySelector('.language-switch [data-lang="en"]')?.classList.contains('active');
  const syncLanguage=()=>{
    const en=isEnglish();
    label.textContent=en?'LIVE ESTIMATE':'LIVE RICHTPREIS';
    meta.textContent=en?'Price per visit':'Preis pro Termin';
    action.firstChild.textContent=en?'Details ':'Details ';
    island.setAttribute('aria-label',en?'Show full price details':'Vollständige Preisdetails anzeigen');
  };
  const syncPrice=()=>{
    const next=visitPrice.textContent?.trim()||'—';
    if(price.textContent!==next){
      price.textContent=next;
      island.classList.remove('is-updating');
      void island.offsetWidth;
      island.classList.add('is-updating');
      clearTimeout(pulseTimer);
      pulseTimer=window.setTimeout(()=>island.classList.remove('is-updating'),320);
    }
    const month=monthlyPrice.textContent?.trim();
    if(month&&month!=='—') meta.textContent=isEnglish()?`Per visit · ${month}/month`:`Pro Termin · ${month}/Monat`;
  };
  const syncVisibility=()=>{
    const show=mq.matches&&formVisible&&!resultVisible;
    island.classList.toggle('is-visible',show);
    document.body.classList.toggle('has-mobile-price-island',show);
  };

  new MutationObserver(()=>{syncPrice();syncLanguage()}).observe(visitPrice,{childList:true,characterData:true,subtree:true});
  new MutationObserver(syncPrice).observe(monthlyPrice,{childList:true,characterData:true,subtree:true});
  const langSwitch=document.querySelector('.language-switch');
  if(langSwitch)new MutationObserver(()=>{syncLanguage();syncPrice()}).observe(langSwitch,{attributes:true,subtree:true,attributeFilter:['class']});

  const formObserver=new IntersectionObserver(entries=>{formVisible=entries[0]?.isIntersecting||false;syncVisibility()},{threshold:0,rootMargin:'-70px 0px -12% 0px'});
  const resultObserver=new IntersectionObserver(entries=>{resultVisible=(entries[0]?.intersectionRatio||0)>.12;syncVisibility()},{threshold:[0,.12,.35]});
  formObserver.observe(form);
  resultObserver.observe(resultCard);

  island.addEventListener('click',()=>resultCard.scrollIntoView({behavior:'smooth',block:'start'}));
  mq.addEventListener?.('change',syncVisibility);
  syncLanguage();
  syncPrice();
  syncVisibility();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMobilePriceIsland,{once:true});
else initMobilePriceIsland();
