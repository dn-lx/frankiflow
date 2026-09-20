import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { getLanguage } from './site-i18n.js';

const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let aboutSections=[];

function splitParagraphs(text=''){return String(text).split(/\n\s*\n/g).map(x=>x.trim()).filter(Boolean)}

function keepProductLinksLast(){
  const lang=getLanguage()==='en'?'en':'de';
  const nav=$('.nav-links');if(!nav)return;

  let calcPura=nav.querySelector('.nav-calcpura,a[href^="https://calcpura.frankiflow.de"]');
  if(!calcPura){calcPura=document.createElement('a');nav.append(calcPura);}
  calcPura.href='https://calcpura.frankiflow.de/';
  calcPura.textContent='CalcPura';
  calcPura.className='nav-product nav-calcpura';
  calcPura.dataset.navTooltip=lang==='en'?'Pricing software for service businesses':'Preissoftware für Dienstleistungsunternehmen';

  let frankiHolz=nav.querySelector('.nav-frankiholz,.nav-accommodations,a[href^="https://stay.frankiflow.de"]');
  if(!frankiHolz){frankiHolz=document.createElement('a');}
  frankiHolz.href='https://stay.frankiflow.de/';
  frankiHolz.textContent='FrankiHolz';
  frankiHolz.className='nav-product nav-frankiholz';
  frankiHolz.dataset.navTooltip=lang==='en'?'FrankiFlow accommodation & room booking':'FrankiFlow Unterkunft & Zimmerbuchung';

  nav.append(calcPura,frankiHolz);
}

function keepAboutSectionLink(){
  const lang=getLanguage()==='en'?'en':'de';
  const nav=$('.nav-links');
  let navLink=nav?.querySelector('a[href="#about"],a[href="/about/"],[data-section-link="about"]');
  if(nav&&!navLink){navLink=document.createElement('a');const why=nav.querySelector('a[href="#warum"]');why?nav.insertBefore(navLink,why):nav.append(navLink)}
  if(navLink){navLink.href='#about';navLink.textContent=lang==='en'?'About Us':'Über uns';navLink.dataset.sectionLink='about';navLink.classList.remove('hidden')}
  $$('.footer-links a[href="/about/"],.footer-links a[href="#about"],[data-section-link="about"]').forEach(link=>{link.href='#about';link.textContent=lang==='en'?'About Us':'Über uns';link.dataset.sectionLink='about'});
}

function cleanAboutSectionChrome(){
  $('#about .section-head > p')?.remove();
}

function syncAboutHeading(){
  const section=$('#about');if(!section)return;
  const lang=getLanguage()==='en'?'en':'de';
  const eyebrow=$('.eyebrow',section),title=$('h2',section);
  if(eyebrow)eyebrow.textContent=lang==='en'?'About Us':'Über uns';
  if(title)title.innerHTML=lang==='en'?'The story behind <span class="teal-text">FrankiFlow.</span>':'Die Geschichte hinter <span class="teal-text">FrankiFlow.</span>';
}

function renderAboutAccordion(){
  const host=$('#aboutAccordion');if(!host)return;
  const lang=getLanguage()==='en'?'en':'de';
  const items=aboutSections.slice(0,3);
  if(!items.length){host.innerHTML=`<div class="about-accordion-loading">${lang==='en'?'Our story is temporarily unavailable.':'Unsere Geschichte ist vorübergehend nicht verfügbar.'}</div>`;return}
  host.innerHTML=items.map(item=>{
    const heading=lang==='en'?(item.heading_en||item.heading_de):(item.heading_de||item.heading_en);
    const body=lang==='en'?(item.body_en||item.body_de):(item.body_de||item.body_en);
    return `<details class="about-accordion-item"><summary><span>${esc(heading||'')}</span></summary><div class="about-accordion-copy">${splitParagraphs(body).map(p=>`<p>${esc(p)}</p>`).join('')}</div></details>`;
  }).join('');
  $$('.about-accordion-item',host).forEach(item=>item.addEventListener('toggle',()=>{if(!item.open)return;$$('.about-accordion-item',host).forEach(other=>{if(other!==item)other.open=false})}));
}

async function loadAboutAccordion(){
  const {data,error}=await supabase.from('frankiflow_site_settings').select('about_sections').eq('id',1).maybeSingle();
  if(!error&&Array.isArray(data?.about_sections))aboutSections=data.about_sections;
  renderAboutAccordion();
}

function routeHomepageLanguageSwitch(){
  const homepagePaths=new Set(['/','/index.html','/en','/en/','/en/index.html']);
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.ff-language-switch button[data-lang]');
    if(!button||!homepagePaths.has(location.pathname))return;
    const lang=button.dataset.lang==='en'?'en':'de';
    const target=lang==='en'?'/en/':'/';
    event.preventDefault();event.stopImmediatePropagation();
    localStorage.setItem('frankiflow-lang',lang);
    localStorage.setItem('ff-price-lang',lang);
    location.assign(target+(location.hash||''));
  },true);
}

function forceCalculatorSameTab(){
  const normalize=()=>$$('a[href]').forEach(link=>{
    try{const url=new URL(link.href,location.href);if(url.origin===location.origin&&/^\/preisrechner\/?$/.test(url.pathname)){link.removeAttribute('target');link.removeAttribute('rel')}}catch{}
  });
  normalize();
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href]');if(!link)return;
    let url;try{url=new URL(link.href,location.href)}catch{return}
    if(url.origin!==location.origin||!/^\/preisrechner\/?$/.test(url.pathname))return;
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    location.assign(url.href);
  },true);
}

routeHomepageLanguageSwitch();
forceCalculatorSameTab();
cleanAboutSectionChrome();
syncAboutHeading();
keepAboutSectionLink();
keepProductLinksLast();
loadAboutAccordion();
window.addEventListener('frankiflow:language',()=>setTimeout(()=>{cleanAboutSectionChrome();syncAboutHeading();keepAboutSectionLink();keepProductLinksLast();renderAboutAccordion();forceCalculatorSameTab()},0));
