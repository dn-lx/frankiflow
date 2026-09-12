import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { getLanguage } from './site-i18n.js';

const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let aboutData=null;

function splitParagraphs(text=''){return String(text).split(/\n\s*\n/g).map(x=>x.trim()).filter(Boolean)}

function ensureAboutSection(){
  let section=$('#about');
  if(section)return section;
  const services=$('.services-section');if(!services)return null;
  section=document.createElement('section');section.id='about';section.className='section about-section';services.insertAdjacentElement('afterend',section);return section;
}

function renderAbout(){
  const section=ensureAboutSection();if(!section||!aboutData)return;
  const lang=getLanguage()==='en'?'en':'de';
  const eyebrow=lang==='en'?(aboutData.about_eyebrow_en||aboutData.about_eyebrow):(aboutData.about_eyebrow||aboutData.about_eyebrow_en);
  const title=lang==='en'?(aboutData.about_title_en||aboutData.about_title):(aboutData.about_title||aboutData.about_title_en);
  const sections=Array.isArray(aboutData.about_sections)?aboutData.about_sections:[];
  section.innerHTML=`<div class="container about-v2-wrap">
    <header class="about-v2-header"><span class="eyebrow">${esc(eyebrow||'')}</span><h2>${esc(title||'')}</h2></header>
    <div class="about-v2-sections">${sections.map((item,index)=>{
      const heading=lang==='en'?(item.heading_en||item.heading_de):(item.heading_de||item.heading_en);
      const body=lang==='en'?(item.body_en||item.body_de):(item.body_de||item.body_en);
      const paragraphs=splitParagraphs(body);
      const hideDuplicate=index===0&&String(heading||'').trim().toLowerCase()===String(title||'').trim().toLowerCase();
      return `<article class="about-v2-card"><div class="about-v2-card-head"><span>${String(index+1).padStart(2,'0')}</span>${hideDuplicate?'':`<h3>${esc(heading||'')}</h3>`}</div><div class="about-v2-copy">${paragraphs.map((p,i)=>`<p class="${index===2&&i===paragraphs.length-1?'about-v2-signoff':''}">${esc(p)}</p>`).join('')}</div></article>`;
    }).join('')}</div>
  </div>`;
}

async function loadAbout(){
  const {data,error}=await supabase.from('frankiflow_site_settings').select('about_eyebrow,about_title,about_eyebrow_en,about_title_en,about_sections').eq('id',1).maybeSingle();
  if(error||!data)return;aboutData=data;renderAbout();
}

await loadAbout();
window.addEventListener('frankiflow:language',renderAbout);
