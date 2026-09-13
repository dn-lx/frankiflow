import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { getLanguage } from './site-i18n.js';

const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let aboutSections=[];

function splitParagraphs(text=''){return String(text).split(/\n\s*\n/g).map(x=>x.trim()).filter(Boolean)}

function keepAccommodationsLast(){
  const nav=$('.nav-links');if(!nav)return;
  let link=nav.querySelector('.nav-accommodations,a[href^="https://accommodation.frankiflow.de"]');
  if(!link){link=document.createElement('a');link.href='https://accommodation.frankiflow.de/';link.className='nav-accommodations';}
  link.textContent='Accommodations';link.classList.add('nav-accommodations');nav.append(link);
}

function keepAboutSectionLink(){
  const lang=getLanguage()==='en'?'en':'de';
  const nav=$('.nav-links');
  let navLink=nav?.querySelector('a[href="#about"],a[href="/about/"],[data-section-link="about"]');
  if(nav&&!navLink){navLink=document.createElement('a');const why=nav.querySelector('a[href="#warum"]');why?nav.insertBefore(navLink,why):nav.append(navLink)}
  if(navLink){navLink.href='#about';navLink.textContent=lang==='en'?'About Us':'Über uns';navLink.dataset.sectionLink='about';navLink.classList.remove('hidden')}
  $$('.footer-links a[href="/about/"],.footer-links a[href="#about"],[data-section-link="about"]').forEach(link=>{link.href='#about';link.textContent=lang==='en'?'About Us':'Über uns';link.dataset.sectionLink='about'});
}

function renderAboutAccordion(){
  const host=$('#aboutAccordion');if(!host)return;
  const lang=getLanguage()==='en'?'en':'de';
  const items=aboutSections.slice(0,3);
  if(!items.length){host.innerHTML=`<div class="about-accordion-loading">${lang==='en'?'Our story is temporarily unavailable.':'Unsere Geschichte ist vorübergehend nicht verfügbar.'}</div>`;return}
  host.innerHTML=items.map(item=>{
    const heading=lang==='en'?(item.heading_en||item.heading_de):(item.heading_de||item.heading_en);
    const body=lang==='en'?(item.body_en||item.body_de):(item.body_de||item.body_en);
    return `<details class="about-accordion-item"><summary><span>${esc(heading||'')}</span><span class="about-accordion-toggle" aria-hidden="true"></span></summary><div class="about-accordion-copy">${splitParagraphs(body).map(p=>`<p>${esc(p)}</p>`).join('')}</div></details>`;
  }).join('');
  $$('.about-accordion-item',host).forEach(item=>item.addEventListener('toggle',()=>{if(!item.open)return;$$('.about-accordion-item',host).forEach(other=>{if(other!==item)other.open=false})}));
}

async function loadAboutAccordion(){
  const {data,error}=await supabase.from('frankiflow_site_settings').select('about_sections').eq('id',1).maybeSingle();
  if(!error&&Array.isArray(data?.about_sections))aboutSections=data.about_sections;
  renderAboutAccordion();
}

keepAboutSectionLink();
keepAccommodationsLast();
loadAboutAccordion();
window.addEventListener('frankiflow:language',()=>setTimeout(()=>{keepAboutSectionLink();keepAccommodationsLast();renderAboutAccordion()},0));
