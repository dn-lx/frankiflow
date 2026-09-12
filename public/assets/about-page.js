import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { getLanguage, initI18n, mountLanguageSwitch, setLanguage } from './site-i18n.js';
import { loadHeaderLogoWidth } from './header-logo-settings.js';

const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let aboutData=null;

const ui={
  de:{
    home:'Startseite',services:'Leistungen',about:'Über uns',contact:'Kontakt',calculator:'Preis berechnen',lead:'Persönlicher Service, Qualitätsmanagement und Technologie – Schritt für Schritt aufgebaut in Frankfurt.',principles:'Was uns wichtig ist',p1:'Persönlicher Kontakt',p2:'Transparente Prozesse',p3:'Qualität mit Verantwortung',p4:'Sinnvolle Technologie',contactCta:'Kontakt aufnehmen',priceCta:'Preis berechnen',next:'Nächster Schritt',ctaTitle:'Lernen Sie FrankiFlow persönlich kennen.',ctaText:'Erzählen Sie uns kurz, wobei wir Sie unterstützen können. Wir melden uns persönlich bei Ihnen.',send:'Anfrage senden',openCalc:'Preisrechner öffnen',company:'FrankiFlow',footerServices:'Leistungen',footerLegal:'Kontakt & Rechtliches',footerBrand:'Gebäudereinigung & Objektbetreuung<br/>Frankfurt am Main & Umgebung',copyright:'© 2026 FrankiFlow. Mehr als Reinigung.',loading:'Inhalt wird geladen …',legal:'Impressum',privacy:'Datenschutz',frankiholz:'FrankiHolz Unterkunft ↗'
  },
  en:{
    home:'Home',services:'Services',about:'About Us',contact:'Contact',calculator:'Calculate Price',lead:'Personal service, quality management and technology – built step by step in Frankfurt.',principles:'What Matters to Us',p1:'Personal Contact',p2:'Transparent Processes',p3:'Quality With Responsibility',p4:'Practical Technology',contactCta:'Contact Us',priceCta:'Calculate Price',next:'Next Step',ctaTitle:'Get to Know FrankiFlow Personally.',ctaText:'Tell us briefly how we can support you. We will get back to you personally.',send:'Send Enquiry',openCalc:'Open Calculator',company:'FrankiFlow',footerServices:'Services',footerLegal:'Contact & Legal',footerBrand:'Cleaning & Property Care<br/>Frankfurt am Main & Surrounding Areas',copyright:'© 2026 FrankiFlow. More Than Cleaning.',loading:'Loading content …',legal:'Legal Notice',privacy:'Privacy Policy',frankiholz:'FrankiHolz Accommodation ↗'
  }
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
  $('#aboutPageLead').textContent=t.lead;$('#aboutPrinciplesTitle').textContent=t.principles;$('#principleOne').textContent=t.p1;$('#principleTwo').textContent=t.p2;$('#principleThree').textContent=t.p3;$('#principleFour').textContent=t.p4;$('#aboutPageContact').textContent=t.contactCta;$('#aboutPageCalculator').textContent=t.priceCta;$('#aboutCtaEyebrow').textContent=t.next;$('#aboutCtaTitle').textContent=t.ctaTitle;$('#aboutCtaText').textContent=t.ctaText;$('#aboutCtaContact').textContent=t.send;$('#aboutCtaPrice').textContent=t.openCalc;$('#aboutFooterCompany').textContent=t.company;$('#aboutFooterHome').textContent=t.home;$('#aboutFooterAbout').textContent=t.about;$('#aboutFooterServices').textContent=t.footerServices;$('#aboutFooterContact').textContent=t.contact;$('#aboutFooterLegal').textContent=t.footerLegal;$('#aboutFooterBrand').innerHTML=t.footerBrand;$('#aboutCopyright').textContent=t.copyright;$('#aboutFooterCalculator').textContent=t.openCalc;
  const legalLinks=$$('.standard-footer-links a[href="/impressum/"],.standard-footer-links a[href="/datenschutz/"]');
  legalLinks.forEach(a=>a.textContent=a.getAttribute('href').includes('impressum')?t.legal:t.privacy);
  const fh=$('.standard-footer-bottom a[href^="https://accommodation"]');if(fh)fh.textContent=t.frankiholz;
  if(aboutData)renderStory();
  document.title=lang==='en'?'About Us | FrankiFlow Frankfurt':'Über uns | FrankiFlow Frankfurt';
  const desc=$('meta[name="description"]');if(desc)desc.content=lang==='en'?'The story behind FrankiFlow: personal service, quality management and technology from Frankfurt am Main.':'Die Geschichte hinter FrankiFlow: persönlicher Service, Qualitätsmanagement und Technologie aus Frankfurt am Main.';
}

function renderStory(){
  const lang=getLanguage()==='en'?'en':'de';
  const eyebrow=lang==='en'?(aboutData.about_eyebrow_en||aboutData.about_eyebrow):(aboutData.about_eyebrow||aboutData.about_eyebrow_en);
  const title=lang==='en'?(aboutData.about_title_en||aboutData.about_title):(aboutData.about_title||aboutData.about_title_en);
  $('#aboutPageEyebrow').textContent=eyebrow||ui[lang].about;
  $('#aboutPageTitle').textContent=title||ui[lang].about;
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
  const {data,error}=await supabase.from('frankiflow_site_settings').select('about_eyebrow,about_title,about_eyebrow_en,about_title_en,about_sections').eq('id',1).maybeSingle();
  if(!error&&data){aboutData=data;renderStory()}
}

initI18n();
mountLanguageSwitch($('#aboutNavActions'),{prepend:true});
bindMenu();
renderUi();
await Promise.allSettled([loadAbout(),loadHeaderLogoWidth()]);
window.addEventListener('frankiflow:language',()=>renderUi());
