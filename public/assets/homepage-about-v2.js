import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { getLanguage } from './site-i18n.js';

const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
let aboutData=null;

function splitParagraphs(text=''){return String(text).split(/\n\s*\n/g).map(x=>x.trim()).filter(Boolean)}
function ensureAboutSection(){let section=$('#about');if(section)return section;const services=$('.services-section');if(!services)return null;section=document.createElement('section');section.id='about';section.className='section about-section';services.insertAdjacentElement('afterend',section);return section}

function updateAboutLinks(){
  const lang=getLanguage()==='en'?'en':'de';
  $$('.nav-links a[href="#about"],.footer-links a[href="#about"]').forEach(link=>{link.href='/about/';link.textContent=lang==='en'?'About Us':'Über uns';link.classList.remove('hidden')});
  const nav=$('.nav-links');if(nav&&!nav.querySelector('a[href="/about/"]')){const link=document.createElement('a');link.href='/about/';link.textContent=lang==='en'?'About Us':'Über uns';const why=nav.querySelector('a[href="#warum"]');why?nav.insertBefore(link,why):nav.append(link)}
}

function renderAbout(){
  const section=ensureAboutSection();if(!section||!aboutData)return;
  const lang=getLanguage()==='en'?'en':'de';
  const eyebrow=lang==='en'?(aboutData.about_eyebrow_en||aboutData.about_eyebrow):(aboutData.about_eyebrow||aboutData.about_eyebrow_en);
  const title=lang==='en'?(aboutData.about_title_en||aboutData.about_title):(aboutData.about_title||aboutData.about_title_en);
  const sections=Array.isArray(aboutData.about_sections)?aboutData.about_sections:[];
  const first=sections[0]||{};
  const firstBody=lang==='en'?(first.body_en||first.body_de):(first.body_de||first.body_en);
  const intro=splitParagraphs(firstBody)[0]||'';
  const highlightSections=sections.slice(0,3);
  section.innerHTML=`<div class="container about-teaser-grid">
    <div class="about-teaser-copy"><span class="eyebrow">${esc(eyebrow||'')}</span><h2>${esc(title||'')}</h2><p>${esc(intro)}</p><a class="btn btn-primary" href="/about/">${lang==='en'?'Read Our Story':'Unsere Geschichte'} <span aria-hidden="true">→</span></a></div>
    <div class="about-teaser-points">${highlightSections.map((item,index)=>{const heading=lang==='en'?(item.heading_en||item.heading_de):(item.heading_de||item.heading_en);return `<a href="/about/" class="about-teaser-point"><span>${String(index+1).padStart(2,'0')}</span><strong>${esc(heading||'')}</strong><em>→</em></a>`}).join('')}</div>
  </div>`;
  updateAboutLinks();
}

async function loadAbout(){const {data,error}=await supabase.from('frankiflow_site_settings').select('about_eyebrow,about_title,about_eyebrow_en,about_title_en,about_sections').eq('id',1).maybeSingle();if(error||!data)return;aboutData=data;renderAbout()}

await loadAbout();
window.addEventListener('frankiflow:language',()=>{renderAbout();updateAboutLinks()});
