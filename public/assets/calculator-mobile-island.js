const mq=window.matchMedia('(max-width:700px)');

function initMobilePriceIsland(){
  if(document.getElementById('mobilePriceIsland'))return;
  const form=document.getElementById('calculatorForm');
  const resultCard=document.getElementById('resultCard');
  const visitPrice=document.getElementById('visitPrice');
  const monthlyPrice=document.getElementById('monthlyPrice');
  const firstMonthPrice=document.getElementById('firstMonthPrice');
  if(!form||!resultCard||!visitPrice||!monthlyPrice)return;

  const style=document.createElement('style');
  style.id='mobile-price-island-styles';
  style.textContent=`
    .mobile-price-island{display:none}
    @media(max-width:700px){
      .mobile-price-island{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));z-index:95;width:min(calc(100% - 24px),430px);min-height:74px;border:1px solid rgba(255,255,255,.13);border-radius:23px;padding:10px 11px 10px 14px;background:linear-gradient(135deg,rgba(7,31,56,.98),rgba(8,79,91,.98));box-shadow:0 18px 50px rgba(3,22,38,.34);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);color:#fff;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;text-align:left;appearance:none;cursor:pointer;opacity:0;pointer-events:none;transform:translate(-50%,calc(100% + 30px));transition:transform .25s ease,opacity .25s ease,box-shadow .2s ease}
      .mobile-price-island.is-visible{opacity:1;pointer-events:auto;transform:translate(-50%,0)}
      .mobile-price-island:active{transform:translate(-50%,2px);box-shadow:0 12px 34px rgba(3,22,38,.30)}
      .mobile-price-island-dot{width:34px;height:34px;border-radius:50%;background:rgba(34,185,178,.15);display:grid;place-items:center}
      .mobile-price-island-dot:before{content:'';width:8px;height:8px;border-radius:50%;background:#2ad5c7;box-shadow:0 0 0 5px rgba(42,213,199,.11)}
      .mobile-price-island-copy{min-width:0;display:grid;gap:1px}
      .mobile-price-island-label{font-size:9px;letter-spacing:.12em;font-weight:900;color:#9dc4cf;text-transform:uppercase}
      .mobile-price-island-price{font-size:24px;line-height:1.05;font-weight:900;letter-spacing:-.035em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mobile-price-island-meta{font-size:10px;color:#c4d8df;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mobile-price-island-action{height:40px;min-width:78px;border-radius:14px;background:#20b8b1;color:#05263a;display:flex;align-items:center;justify-content:center;gap:5px;padding:0 11px;font-size:11px;font-weight:900;white-space:nowrap}
      .mobile-price-island.is-updating .mobile-price-island-price{animation:mobilePricePulse .28s ease}
      body.has-mobile-price-island{padding-bottom:96px}
      @keyframes mobilePricePulse{0%{transform:scale(1)}45%{transform:scale(1.055);color:#6fe7df}100%{transform:scale(1)}}
    }
    @media(prefers-reduced-motion:reduce){.mobile-price-island{transition:none!important}.mobile-price-island.is-updating .mobile-price-island-price{animation:none!important}}
    @media print{.mobile-price-island{display:none!important}}
  `;
  document.head.append(style);

  const island=document.createElement('button');
  island.type='button'; island.id='mobilePriceIsland'; island.className='mobile-price-island';
  island.innerHTML=`<span class="mobile-price-island-dot" aria-hidden="true"></span><span class="mobile-price-island-copy"><span class="mobile-price-island-label"></span><strong class="mobile-price-island-price">—</strong><span class="mobile-price-island-meta"></span></span><span class="mobile-price-island-action"><span></span><span aria-hidden="true">↑</span></span>`;
  document.body.append(island);
  const label=island.querySelector('.mobile-price-island-label');
  const price=island.querySelector('.mobile-price-island-price');
  const meta=island.querySelector('.mobile-price-island-meta');
  const action=island.querySelector('.mobile-price-island-action span');
  let formVisible=false,resultVisible=false,pulseTimer=0;
  const isEnglish=()=>document.querySelector('.language-switch [data-lang="en"]')?.classList.contains('active');
  const sync=()=>{
    const en=isEnglish(),next=visitPrice.textContent?.trim()||'—',month=monthlyPrice.textContent?.trim()||'—',first=firstMonthPrice?.textContent?.trim()||'—';
    label.textContent=en?'LIVE ESTIMATE':'LIVE RICHTPREIS';
    action.textContent=en?'Details':'Details';
    island.setAttribute('aria-label',en?'Show full price details':'Vollständige Preisdetails anzeigen');
    if(price.textContent!==next){price.textContent=next;island.classList.remove('is-updating');void island.offsetWidth;island.classList.add('is-updating');clearTimeout(pulseTimer);pulseTimer=setTimeout(()=>island.classList.remove('is-updating'),320)}
    const parts=[];
    if(month&&month!=='—')parts.push(`${month}/${en?'month':'Monat'}`);
    if(first&&first!=='—'&&first!==month)parts.push(`${en?'1st month':'1. Monat'} ${first}`);
    meta.textContent=parts.length?parts.join(' · '):(en?'Price per visit':'Preis pro Termin');
  };
  const syncVisibility=()=>{const show=mq.matches&&formVisible&&!resultVisible;island.classList.toggle('is-visible',show);document.body.classList.toggle('has-mobile-price-island',show)};
  const values=[visitPrice,monthlyPrice,firstMonthPrice].filter(Boolean);
  values.forEach(el=>new MutationObserver(sync).observe(el,{childList:true,characterData:true,subtree:true}));
  const langSwitch=document.querySelector('.language-switch');if(langSwitch)new MutationObserver(sync).observe(langSwitch,{attributes:true,subtree:true,attributeFilter:['class']});
  new IntersectionObserver(entries=>{formVisible=entries[0]?.isIntersecting||false;syncVisibility()},{threshold:0,rootMargin:'-70px 0px -12% 0px'}).observe(form);
  new IntersectionObserver(entries=>{resultVisible=(entries[0]?.intersectionRatio||0)>.12;syncVisibility()},{threshold:[0,.12,.35]}).observe(resultCard);
  island.addEventListener('click',()=>resultCard.scrollIntoView({behavior:'smooth',block:'start'}));
  mq.addEventListener?.('change',syncVisibility); sync(); syncVisibility();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMobilePriceIsland,{once:true});else initMobilePriceIsland();
