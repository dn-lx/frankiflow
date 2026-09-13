from pathlib import Path
import json, re, subprocess

ROOT=Path('.')

# Use the production calculator as the clean baseline so broken experimental WIP on develop is not carried forward.
calc_path=ROOT/'public/assets/calculator.js'
calc=subprocess.check_output(['git','show','origin/main:public/assets/calculator.js'], text=True)

old="let currentLang=localStorage.getItem('frankiflow-lang')||localStorage.getItem('ff-price-lang')||'de';"
new="let currentLang=localStorage.getItem('frankiflow-lang')||localStorage.getItem('ff-price-lang')||'de';\nif(!['de','en'].includes(currentLang))currentLang='de';"
if old not in calc: raise SystemExit('language initialization marker not found')
calc=calc.replace(old,new,1)

old="  $('#newCustomer').innerHTML=currentLang==='de'?'<option value=\"yes\">Ja</option><option value=\"no\">Nein</option>':'<option value=\"yes\">Yes</option><option value=\"no\">No</option>';"
new="  const newCustomerValue=$('#newCustomer').value||'yes';\n  $('#newCustomer').innerHTML=currentLang==='de'?'<option value=\"yes\">Ja</option><option value=\"no\">Nein</option>':'<option value=\"yes\">Yes</option><option value=\"no\">No</option>';\n  if([...$('#newCustomer').options].some(o=>o.value===newCustomerValue))$('#newCustomer').value=newCustomerValue;"
if old not in calc: raise SystemExit('new customer language marker not found')
calc=calc.replace(old,new,1)

new_calculate=r'''function calculate(){
  if(!cfg)return;
  const s=inputState();
  const service=s.windowOnly?{label:'Fensterreinigung',base_1m:0,enabled:true}:cfg.service_settings.services[s.serviceKey];
  if(!service)return;

  const reductionPct=s.windowOnly?0:Number(cfg.contract_settings.base_reduction_pct?.[String(s.months)]||0);
  const reduction=reductionPct/100;
  const min=Number(cfg.service_settings.minimum_cleaning_charge||0);
  const gradient=Number(cfg.service_settings.gradient_per_sqm||0);
  const base=Number(service.base_1m||0);
  const adjustedBase=base*(1-reduction);

  let floorVisitNet=s.windowOnly?0:(s.area>0?Math.max(min,adjustedBase+s.area*gradient):0);
  if(!s.windowOnly&&s.area===0&&!s.windows)floorVisitNet=min;
  if(s.deep&&cfg.deep_cleaning_settings?.enabled)floorVisitNet*=1+Number(cfg.deep_cleaning_settings.surcharge_pct||0)/100;

  let equipmentVisitNet=0;
  if(!s.windowOnly&&s.equipment&&cfg.equipment_settings?.enabled){
    equipmentVisitNet=Number(cfg.equipment_settings.base||0)+s.area*Number(cfg.equipment_settings.gradient_per_sqm||0);
  }

  let windowChargeNet=0;
  if(s.windows&&cfg.window_settings?.enabled&&s.windowArea>0){
    windowChargeNet=Math.max(Number(cfg.window_settings.minimum||0),Number(cfg.window_settings.base||0)+s.windowArea*Number(cfg.window_settings.gradient_per_sqm||0));
  }

  const visits=Number(s.freq.visits_per_month||1);
  const regularVisitNet=s.windowOnly?windowChargeNet:(floorVisitNet+equipmentVisitNet);
  // For a mixed cleaning service, window cleaning is a once-per-month add-on. Window-only service follows the selected frequency.
  const monthlyWindowNet=!s.windowOnly&&s.windows?windowChargeNet:0;
  const subtotalNet=s.windowOnly?(regularVisitNet*visits):(regularVisitNet*visits+monthlyWindowNet);
  const vatRate=(s.vat&&cfg.vat_settings?.enabled)?Number(cfg.vat_settings.rate_pct||0)/100:0;
  const roundMoney=v=>Math.round((Number(v||0)+Number.EPSILON)*100)/100;
  const gross=v=>roundMoney(Number(v||0)*(1+vatRate));

  const promoPct=(s.newCustomer&&cfg.promotion_settings?.enabled)?Number(cfg.promotion_settings.first_month_discount_pct||0):0;
  const promo=promoPct/100;
  let firstSubtotalNet=subtotalNet;
  if(promo>0){
    const discountedFloorNet=floorVisitNet>0?Math.max(min,floorVisitNet*(1-promo)):0;
    const discountedEquipNet=equipmentVisitNet*(1-promo);
    const discountedWindowNet=windowChargeNet>0?Math.max(Number(cfg.window_settings?.minimum||0),windowChargeNet*(1-promo)):0;
    firstSubtotalNet=s.windowOnly?(discountedWindowNet*visits):((discountedFloorNet+discountedEquipNet)*visits+discountedWindowNet);
  }

  const visitTotal=gross(regularVisitNet);
  const monthly=gross(subtotalNet);
  const firstMonth=gross(firstSubtotalNet);
  calc={...s,service,serviceLabel:currentLang==='en'?(serviceEnglish[s.serviceKey]||service.label):service.label,reductionPct,
    floorVisit:gross(floorVisitNet),equipmentVisit:gross(equipmentVisitNet),windowCharge:gross(windowChargeNet),
    floorVisitNet:roundMoney(floorVisitNet),equipmentVisitNet:roundMoney(equipmentVisitNet),windowChargeNet:roundMoney(windowChargeNet),
    visitTotal,subtotal:gross(subtotalNet),subtotalNet:roundMoney(subtotalNet),vatRate,monthly,promoPct,firstMonth};
  renderResult();
}'''
calc,n=re.subn(r"function calculate\(\)\{.*?\n\}\nfunction renderResult\(\)\{",new_calculate+"\nfunction renderResult(){",calc,count=1,flags=re.S)
if n!=1: raise SystemExit(f'calculate replacement failed: {n}')

old="    if(calc.windows)rows.push([t('windowCleaning'),`${calc.windowArea} m² · ${money(calc.windowCharge)}`]);"
new="    if(calc.windows)rows.push([`${t('windowCleaning')} (${currentLang==='de'?'1×/Monat':'1×/month'})`,`${calc.windowArea} m² · ${money(calc.windowCharge)}`]);"
if old not in calc: raise SystemExit('window breakdown marker not found')
calc=calc.replace(old,new,1)
calc_path.write_text(calc)

# A reliable mobile live-price island. It is intentionally self-contained and observes the calculator result values.
island=r'''const mq=window.matchMedia('(max-width:700px)');

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
'''
(ROOT/'public/assets/calculator-mobile-island.js').write_text(island)

# Calculator page: remove broken experimental request modal trigger and actually load the mobile island.
price_path=ROOT/'public/preisrechner/index.html'
price=price_path.read_text()
price=re.sub(r'<button class="btn-calc ghost" id="requestService" type="button">.*?</button>', '<a class="btn-calc ghost" data-i18n="request" href="/#kontakt">Persönliches Angebot anfragen</a>', price, count=1)
price=re.sub(r'<script src="/assets/calculator\.js\?v=[^"]+" type="module"></script>', '<script src="/assets/calculator.js?v=20260914-fullfix1" type="module"></script>\n<script src="/assets/calculator-mobile-island.js?v=20260914-fullfix1" defer></script>', price, count=1)
if 'calculator-mobile-island.js' not in price: raise SystemExit('island script was not added')
price_path.write_text(price)

# Homepage navigation: dedicated About page and Accommodations as the final/right-most nav item after FAQ.
def replace_nav(path, english=False):
  p=ROOT/path; text=p.read_text()
  if english:
    links='''<nav aria-label="Main navigation" class="nav-links">\n<a href="#leistungen">Services</a>\n<a href="/about/">About Us</a>\n<a href="#warum">Why FrankiFlow</a>\n<a href="#ablauf">How it works</a>\n<a href="#kontakt">Contact</a>\n<a href="#faq">FAQ</a>\n<a class="nav-accommodations" href="https://accommodation.frankiflow.de/">Accommodations</a></nav>'''
  else:
    links='''<nav aria-label="Hauptnavigation" class="nav-links">\n<a href="#leistungen">Leistungen</a>\n<a href="/about/">Über uns</a>\n<a href="#warum">Warum FrankiFlow</a>\n<a href="#ablauf">Ablauf</a>\n<a href="#kontakt">Kontakt</a>\n<a href="#faq">FAQ</a>\n<a class="nav-accommodations" href="https://accommodation.frankiflow.de/">Accommodations</a></nav>'''
  text,n=re.subn(r'<nav aria-label="(?:Hauptnavigation|Main navigation)" class="nav-links">.*?</nav>',links,text,count=1,flags=re.S)
  if n!=1: raise SystemExit(f'nav replacement failed for {path}: {n}')
  p.write_text(text)
replace_nav('public/index.html',False)
replace_nav('public/en/index.html',True)

# Dedicated About page.
about_html='''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width,initial-scale=1" name="viewport"/>
<title>Unsere Geschichte | FrankiFlow Frankfurt</title>
<meta name="description" content="Die Geschichte hinter FrankiFlow: persönlicher Service, Qualitätsmanagement und Technologie aus Frankfurt am Main."/>
<meta name="theme-color" content="#0b2134"/>
<meta name="robots" content="index,follow,max-image-preview:large"/>
<link rel="canonical" href="https://frankiflow.de/about/"/>
<link rel="alternate" hreflang="de-DE" href="https://frankiflow.de/about/"/>
<link rel="alternate" hreflang="en" href="https://frankiflow.de/about/?lang=en"/>
<link rel="alternate" hreflang="x-default" href="https://frankiflow.de/about/"/>
<link href="/assets/frankiflow-logo.png" rel="icon" type="image/png"/>
<link href="/assets/styles.css" rel="stylesheet"/>
<link href="/assets/about-page.css" rel="stylesheet"/>
</head>
<body>
<a class="skip" href="#main">Zum Inhalt</a>
<header class="site-header"><div class="container nav">
<a aria-label="FrankiFlow Startseite" class="brand" href="/"><img alt="FrankiFlow" src="/assets/frankiflow-logo.png"/></a>
<nav aria-label="Hauptnavigation" class="nav-links">
<a data-about-nav="home" href="/">Startseite</a><a data-about-nav="services" href="/#leistungen">Leistungen</a><a class="active" data-about-nav="about" href="/about/">Über uns</a><a data-about-nav="contact" href="/#kontakt">Kontakt</a><a data-about-nav="faq" href="/#faq">FAQ</a><a class="nav-accommodations" data-about-nav="accommodations" href="https://accommodation.frankiflow.de/">Accommodations</a>
</nav>
<div class="nav-actions" id="aboutNavActions"><a class="btn btn-primary" data-about-nav="calculator" href="/preisrechner/">Preis berechnen <span aria-hidden="true">↗</span></a><button aria-expanded="false" aria-label="Menü öffnen" class="menu-btn">☰</button></div>
</div></header>
<main id="main">
<section class="about-page-hero"><div class="about-page-orb"></div><div class="container about-page-hero-grid">
<div><span class="eyebrow" data-about-ui="heroEyebrow">Über uns</span><h1 data-about-ui="heroTitle">Die Geschichte hinter <span class="teal-text">FrankiFlow.</span></h1><p class="about-page-lead" data-about-ui="heroLead">Persönlicher Service, Qualitätsmanagement und Technologie – aufgebaut in Frankfurt am Main.</p><div class="about-page-actions"><a class="btn btn-primary btn-lg" href="/#kontakt" data-about-ui="contactCta">Kontakt aufnehmen</a><a class="btn btn-ghost btn-lg" href="/preisrechner/" data-about-ui="calcCta">Preis berechnen</a></div></div>
<aside class="about-page-principles"><span class="mini-label" data-about-ui="principlesEyebrow">WOFÜR WIR STEHEN</span><h2 data-about-ui="principlesTitle">Einfacher Service. Klare Standards.</h2><div class="about-principle"><strong>01</strong><span data-about-ui="p1">Persönlicher Kontakt</span></div><div class="about-principle"><strong>02</strong><span data-about-ui="p2">Transparente Abläufe</span></div><div class="about-principle"><strong>03</strong><span data-about-ui="p3">Zuverlässige Qualität</span></div><div class="about-principle"><strong>04</strong><span data-about-ui="p4">Nachhaltiges Wachstum</span></div></aside>
</div></section>
<section class="section about-page-story-section"><div class="container"><div class="section-head modern-head"><div><span class="eyebrow" data-about-ui="storyEyebrow">Unsere Geschichte</span><h2 data-about-ui="storyTitle">Wie FrankiFlow <span class="teal-text">entstanden ist.</span></h2></div><p data-about-ui="storyLead">Von der Idee, Dienstleistungen einfacher zu machen, bis zur Verbindung von Service und eigener Technologie.</p></div><div class="about-page-sections" id="aboutPageSections"><div class="about-page-loading">Inhalt wird geladen …</div></div></div></section>
<section class="section about-page-cta-section"><div class="container"><div class="about-page-cta"><div><span class="eyebrow eyebrow-light" data-about-ui="ctaEyebrow">FrankiFlow</span><h2 data-about-ui="ctaTitle">Service, auf den Sie sich verlassen können.</h2><p data-about-ui="ctaLead">Lernen Sie unseren Ansatz kennen oder berechnen Sie direkt einen unverbindlichen Richtpreis.</p></div><div class="about-page-cta-actions"><a class="btn btn-teal" href="/preisrechner/" data-about-ui="calcCta2">Preis berechnen</a><a class="btn btn-ghost" href="/#kontakt" data-about-ui="contactCta2">Angebot anfragen</a></div></div></div></section>
</main>
<footer class="standard-footer"><div class="container"><div class="standard-footer-grid"><div class="standard-footer-brand"><a class="brand" href="/"><img alt="FrankiFlow" src="/assets/frankiflow-logo.png"/></a><p id="aboutFooterBrand">Gebäudereinigung &amp; Objektbetreuung<br/>Frankfurt am Main &amp; Umgebung</p></div><div><h4 id="aboutFooterCompany">FrankiFlow</h4><div class="standard-footer-links"><a id="aboutFooterHome" href="/">Startseite</a><a id="aboutFooterAbout" href="/about/">Über uns</a><a id="aboutFooterServices" href="/#leistungen">Leistungen</a><a id="aboutFooterContact" href="/#kontakt">Kontakt</a><a id="aboutFooterCalculator" href="/preisrechner/">Preisrechner</a></div></div><div><h4 id="aboutFooterLegal">Kontakt &amp; Rechtliches</h4><div class="standard-footer-links"><a href="tel:+4917662493041">+49 176 62493041</a><a href="mailto:info@frankiflow.de">info@frankiflow.de</a><a href="/impressum/">Impressum</a><a href="/datenschutz/">Datenschutz</a></div></div></div><div class="standard-footer-bottom"><span id="aboutCopyright">© 2026 FrankiFlow. Mehr als Reinigung.</span><span><a href="https://accommodation.frankiflow.de/">Accommodations ↗</a></span></div></div></footer>
<script type="module" src="/assets/about-page.js?v=20260914-fullfix1"></script>
</body></html>'''
about_dir=ROOT/'public/about';about_dir.mkdir(parents=True,exist_ok=True);(about_dir/'index.html').write_text(about_html)

about_js=r'''import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LANG_KEY='frankiflow-lang';
let currentLang=new URLSearchParams(location.search).get('lang')||localStorage.getItem(LANG_KEY)||'de';if(!['de','en'].includes(currentLang))currentLang='de';
let aboutData=null;
const ui={de:{home:'Startseite',services:'Leistungen',about:'Über uns',contact:'Kontakt',faq:'FAQ',accommodations:'Accommodations',calculator:'Preis berechnen',heroEyebrow:'Über uns',heroTitle:'Die Geschichte hinter <span class="teal-text">FrankiFlow.</span>',heroLead:'Persönlicher Service, Qualitätsmanagement und Technologie – aufgebaut in Frankfurt am Main.',contactCta:'Kontakt aufnehmen',calcCta:'Preis berechnen',principlesEyebrow:'WOFÜR WIR STEHEN',principlesTitle:'Einfacher Service. Klare Standards.',p1:'Persönlicher Kontakt',p2:'Transparente Abläufe',p3:'Zuverlässige Qualität',p4:'Nachhaltiges Wachstum',storyEyebrow:'Unsere Geschichte',storyTitle:'Wie FrankiFlow <span class="teal-text">entstanden ist.</span>',storyLead:'Von der Idee, Dienstleistungen einfacher zu machen, bis zur Verbindung von Service und eigener Technologie.',ctaEyebrow:'FrankiFlow',ctaTitle:'Service, auf den Sie sich verlassen können.',ctaLead:'Lernen Sie unseren Ansatz kennen oder berechnen Sie direkt einen unverbindlichen Richtpreis.',calcCta2:'Preis berechnen',contactCta2:'Angebot anfragen',company:'FrankiFlow',footerServices:'Leistungen',footerLegal:'Kontakt & Rechtliches',footerBrand:'Gebäudereinigung & Objektbetreuung<br/>Frankfurt am Main & Umgebung',copyright:'© 2026 FrankiFlow. Mehr als Reinigung.',loading:'Inhalt wird geladen …',legal:'Impressum',privacy:'Datenschutz',openCalc:'Preisrechner'},en:{home:'Home',services:'Services',about:'About Us',contact:'Contact',faq:'FAQ',accommodations:'Accommodations',calculator:'Calculate Price',heroEyebrow:'About Us',heroTitle:'The story behind <span class="teal-text">FrankiFlow.</span>',heroLead:'Personal service, quality management and technology – built in Frankfurt am Main.',contactCta:'Contact us',calcCta:'Calculate price',principlesEyebrow:'WHAT WE STAND FOR',principlesTitle:'Simple service. Clear standards.',p1:'Personal contact',p2:'Transparent processes',p3:'Reliable quality',p4:'Sustainable growth',storyEyebrow:'Our Story',storyTitle:'How FrankiFlow <span class="teal-text">began.</span>',storyLead:'From the idea of making everyday services easier to combining personal service with our own technology.',ctaEyebrow:'FrankiFlow',ctaTitle:'Service you can rely on.',ctaLead:'Discover our approach or calculate a non-binding price estimate directly.',calcCta2:'Calculate price',contactCta2:'Request a quote',company:'FrankiFlow',footerServices:'Services',footerLegal:'Contact & Legal',footerBrand:'Cleaning & Property Care<br/>Frankfurt am Main & Surrounding Areas',copyright:'© 2026 FrankiFlow. More Than Cleaning.',loading:'Loading content …',legal:'Legal Notice',privacy:'Privacy Policy',openCalc:'Price Calculator'}};
function splitParagraphs(text=''){return String(text).split(/\n\s*\n/g).map(x=>x.trim()).filter(Boolean)}
function mountLanguageSwitch(){const host=$('#aboutNavActions');if(!host||host.querySelector('.about-lang-switch'))return;const box=document.createElement('div');box.className='about-lang-switch';box.innerHTML='<button type="button" data-about-lang="de">DE</button><button type="button" data-about-lang="en">EN</button>';host.prepend(box);box.addEventListener('click',e=>{const b=e.target.closest('[data-about-lang]');if(!b)return;currentLang=b.dataset.aboutLang;localStorage.setItem(LANG_KEY,currentLang);localStorage.setItem('ff-price-lang',currentLang);const u=new URL(location.href);if(currentLang==='en')u.searchParams.set('lang','en');else u.searchParams.delete('lang');history.replaceState({},'',u);renderUi()})}
function renderUi(){const t=ui[currentLang];document.documentElement.lang=currentLang;localStorage.setItem(LANG_KEY,currentLang);$$('[data-about-lang]').forEach(b=>b.classList.toggle('active',b.dataset.aboutLang===currentLang));for(const key of ['home','services','about','contact','faq','accommodations']){const el=$(`[data-about-nav="${key}"]`);if(el)el.textContent=t[key]}const calc=$('[data-about-nav="calculator"]');if(calc)calc.innerHTML=`${t.calculator} <span aria-hidden="true">↗</span>`;$$('[data-about-ui]').forEach(el=>{const v=t[el.dataset.aboutUi];if(v!=null){if(v.includes('<span'))el.innerHTML=v;else el.textContent=v}});$('#aboutFooterCompany').textContent=t.company;$('#aboutFooterHome').textContent=t.home;$('#aboutFooterAbout').textContent=t.about;$('#aboutFooterServices').textContent=t.footerServices;$('#aboutFooterContact').textContent=t.contact;$('#aboutFooterLegal').textContent=t.footerLegal;$('#aboutFooterBrand').innerHTML=t.footerBrand;$('#aboutCopyright').textContent=t.copyright;$('#aboutFooterCalculator').textContent=t.openCalc;const legal=$('.standard-footer-links a[href="/impressum/"]'),privacy=$('.standard-footer-links a[href="/datenschutz/"]');if(legal)legal.textContent=t.legal;if(privacy)privacy.textContent=t.privacy;document.title=currentLang==='en'?'Our Story | FrankiFlow Frankfurt':'Unsere Geschichte | FrankiFlow Frankfurt';const desc=$('meta[name="description"]');if(desc)desc.content=currentLang==='en'?'The story behind FrankiFlow: personal service, quality management and technology from Frankfurt am Main.':'Die Geschichte hinter FrankiFlow: persönlicher Service, Qualitätsmanagement und Technologie aus Frankfurt am Main.';renderStory()}
function renderStory(){if(!aboutData)return;const sections=Array.isArray(aboutData.about_sections)?aboutData.about_sections:[],host=$('#aboutPageSections');host.innerHTML=sections.map((item,index)=>{const heading=currentLang==='en'?(item.heading_en||item.heading_de):(item.heading_de||item.heading_en),body=currentLang==='en'?(item.body_en||item.body_de):(item.body_de||item.body_en);return `<article class="about-page-story-card"><div class="about-page-story-head"><span>${String(index+1).padStart(2,'0')}</span><h2>${esc(heading||'')}</h2></div><div class="about-page-story-copy">${splitParagraphs(body).map(p=>`<p>${esc(p)}</p>`).join('')}</div></article>`}).join('')||`<div class="about-page-loading">${esc(ui[currentLang].loading)}</div>`}
function bindMenu(){const btn=$('.menu-btn'),nav=$('.nav-links');if(!btn||!nav)return;btn.addEventListener('click',()=>{const open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',String(open))})}
async function loadAbout(){const {data,error}=await supabase.from('frankiflow_site_settings').select('about_sections').eq('id',1).maybeSingle();if(!error&&data){aboutData=data;renderStory()}}
mountLanguageSwitch();bindMenu();renderUi();await loadAbout();
'''
(ROOT/'public/assets/about-page.js').write_text(about_js)

# About page styles plus compact language control and nav accommodation treatment.
about_css_path=ROOT/'public/assets/about-page.css'
about_css=about_css_path.read_text() if about_css_path.exists() else ''
extra='''\n.about-lang-switch{display:flex;background:#eef4f6;padding:3px;border-radius:11px;flex:none}.about-lang-switch button{border:0;background:transparent;padding:7px 9px;border-radius:8px;color:#617381;font-weight:850;font-size:11px;cursor:pointer}.about-lang-switch button.active{background:#fff;color:var(--navy);box-shadow:0 2px 8px rgba(5,32,55,.08)}.nav-accommodations{white-space:nowrap}.about-page-hero .teal-text,.about-page-story-section .teal-text{color:var(--teal-dark)}\n@media(max-width:1180px){.site-header .nav{gap:15px}.site-header .nav-links{gap:16px;font-size:13px}}\n'''
if '.about-lang-switch' not in about_css: about_css+=extra
about_css_path.write_text(about_css)

# Keep About dedicated; make nav helper also enforce Accommodations after FAQ if the dynamic i18n rerenders anything.
nav_js_path=ROOT/'public/assets/homepage-about-nav.js'
nav_js=nav_js_path.read_text()
insert="""\nfunction keepAccommodationsLast(){\n  const nav=$('.nav-links');if(!nav)return;\n  let link=nav.querySelector('.nav-accommodations,a[href^=\"https://accommodation.frankiflow.de\"]');\n  if(!link){link=document.createElement('a');link.href='https://accommodation.frankiflow.de/';link.className='nav-accommodations';}\n  link.textContent='Accommodations';link.classList.add('nav-accommodations');nav.append(link);\n}\n"""
if 'function keepAccommodationsLast' not in nav_js:
  nav_js=nav_js.replace('function keepDedicatedAboutOnly(){',insert+'\nfunction keepDedicatedAboutOnly(){',1)
  nav_js=nav_js.replace('keepDedicatedAboutOnly();','keepDedicatedAboutOnly();\nkeepAccommodationsLast();',1)
  nav_js=nav_js.replace("window.addEventListener('frankiflow:language',()=>setTimeout(keepDedicatedAboutOnly,0));","window.addEventListener('frankiflow:language',()=>setTimeout(()=>{keepDedicatedAboutOnly();keepAccommodationsLast()},0));",1)
nav_js_path.write_text(nav_js)

# Extend syntax validation so calculator regressions cannot silently deploy again.
pkg_path=ROOT/'package.json';pkg=json.loads(pkg_path.read_text());check=pkg['scripts']['check']
for f in ['public/assets/calculator.js','public/assets/calculator-mobile-island.js','public/assets/about-page.js']:
  cmd=f'node --check {f}'
  if cmd not in check: check+=' && '+cmd
pkg['scripts']['check']=check;pkg_path.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n')

# Sanity assertions.
assert 'meta http-equiv="refresh"' not in about_html
assert '>Accommodations</a></nav>' in (ROOT/'public/index.html').read_text()
assert 'FrankiFlow Accommodations' not in (ROOT/'public/index.html').read_text()
assert 'calculator-mobile-island.js' in price_path.read_text()
assert "newCustomerValue" in calc
assert "visitTotal=gross(regularVisitNet)" in calc
assert "1×/Monat" in calc
print('FrankiFlow site/calculator patch applied successfully')
