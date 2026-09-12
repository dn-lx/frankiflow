import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { getLanguage, initI18n, mountLanguageSwitch } from './site-i18n.js';
import { loadHeaderLogoWidth } from './header-logo-settings.js';

const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let aboutData=null;

const ui={
  de:{home:'Startseite',services:'Leistungen',about:'Über uns',contact:'Kontakt',calculator:'Preis berechnen',company:'FrankiFlow',footerServices:'Leistungen',footerLegal:'Kontakt & Rechtliches',footerBrand:'Gebäudereinigung & Objektbetreuung<br/>Frankfurt am Main & Umgebung',copyright:'© 2026 FrankiFlow. Mehr als Reinigung.',loading:'Inhalt wird geladen …',legal:'Impressum',privacy:'Datenschutz',frankiholz:'FrankiHolz Unterkunft ↗',openCalc:'Preisrechner'},
  en:{home:'Home',services:'Services',about:'About Us',contact:'Contact',calculator:'Calculate Price',company:'FrankiFlow',footerServices:'Services',footerLegal:'Contact & Legal',footerBrand:'Cleaning & Property Care<br/>Frankfurt am Main & Surrounding Areas',copyright:'© 2026 FrankiFlow. More Than Cleaning.',loading:'Loading content …',legal:'Legal Notice',privacy:'Privacy Policy',frankiholz:'FrankiHolz Accommodation ↗',openCalc:'Price Calculator'}
};

function splitParagraphs(text=''){return String(text).split(/\n\s*\n/g).map(x=>x.trim()).filter(Boolean)}

function renderUi(){
  const lang=getLanguage()==='en'?'en':'de',t=ui[lang];
  document.documentElement.lang=lang;
  $('[data-about-nav="home"]').textContent=t.home;
  $('[data-about-nav="services"]').textContent=t.services;
  $('[data-about-nav="about"]').textContent=t.about;
  $('[data-about-nav="contact"]').textContent=t.contact;
  $('[data-about-nav="calculator"]').innerHTML=`${t.calculator} <span aria-hidden="true">↗</span>`;
  $('#aboutFooterCompany').textContent=t.company;
  $('#aboutFooterHome').textContent=t.home;
  $('#aboutFooterAbout').textContent=t.about;
  $('#aboutFooterServices').textContent=t.footerServices;
  $('#aboutFooterContact').textContent=t.contact;
  $('#aboutFooterLegal').textContent=t.footerLegal;
  $('#aboutFooterBrand').innerHTML=t.footerBrand;
  $('#aboutCopyright').textContent=t.copyright;
  $('#aboutFooterCalculator').textContent=t.openCalc;
  const legalLinks=$$('.standard-footer-links a[href="/impressum/"],.standard-footer-links a[href="/datenschutz/"]');
  legalLinks.forEach(a=>a.textContent=a.getAttribute('href').includes('impressum')?t.legal:t.privacy);
  const fh=$('.standard-footer-bottom a[href^="https://accommodation"]');if(fh)fh.textContent=t.frankiholz;
  if(aboutData)renderStory();
  document.title=lang==='en'?'Our Story | FrankiFlow Frankfurt':'Unsere Geschichte | FrankiFlow Frankfurt';
  const desc=$('meta[name="description"]');if(desc)desc.content=lang==='en'?'The story behind FrankiFlow: personal service, quality management and technology from Frankfurt am Main.':'Die Geschichte hinter FrankiFlow: persönlicher Service, Qualitätsmanagement und Technologie aus Frankfurt am Main.';
}

function renderStory(){
  const lang=getLanguage()==='en'?'en':'de';
  const sections=Array.isArray(aboutData.about_sections)?aboutData.about_sections:[];
  const host=$('#aboutPageSections');
  host.innerHTML=sections.map((item,index)=>{
    const heading=lang==='en'?(item.heading_en||item.heading_de):(item.heading_de||item.heading_en);
    const body=lang==='en'?(item.body_en||item.body_de):(item.body_de||item.body_en);
    return `<article class="about-page-story-card"><div class="about-page-story-head"><span>${String(index+1).padStart(2,'0')}</span><h2>${esc(heading||'')}</h2></div><div class="about-page-story-copy">${splitParagraphs(body).map(p=>`<p>${esc(p)}</p>`).join('')}</div></article>`;
  }).join('')||`<div class="about-page-loading">${esc(ui[lang].loading)}</div>`;
}

function bindMenu(){
  const btn=$('.menu-btn'),nav=$('.nav-links');if(!btn||!nav)return;
  btn.addEventListener('click',()=>{const open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',String(open))});
}

async function loadAbout(){
  const {data,error}=await supabase.from('frankiflow_site_settings').select('about_sections').eq('id',1).maybeSingle();
  if(!error&&data){aboutData=data;renderStory()}
}

initI18n();
mountLanguageSwitch($('#aboutNavActions'),{prepend:true});
bindMenu();
renderUi();
await Promise.allSettled([loadAbout(),loadHeaderLogoWidth()]);
window.addEventListener('frankiflow:language',()=>renderUi());
