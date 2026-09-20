import { FRANKIFLOW_CONFIG } from './config.js';
import { supabase } from './pricing.js';
import { getLanguage, initI18n, mountLanguageSwitch, translateDom, tr } from './site-i18n.js';
import { loadHeaderLogoWidth } from './header-logo-settings.js';

const $=(s,p=document)=>p.querySelector(s); const $$=(s,p=document)=>[...p.querySelectorAll(s)];
let siteSettings=null;

const fallbackSettings={
  hero_eyebrow:'Mehr als Reinigung.',hero_eyebrow_en:'More than cleaning.',
  hero_title:'Gebäudereinigung, die einfach funktioniert.',hero_title_en:'Cleaning services that simply work.',
  hero_subtitle:'Professionelle Reinigung und Objektbetreuung für Büros, Wohnungen, Treppenhäuser und Ferienunterkünfte in Frankfurt am Main & Umgebung.',hero_subtitle_en:'Professional cleaning and property care for offices, homes, stairwells and holiday rentals in Frankfurt am Main and surrounding areas.',
  offer_title:'25% Neukundenrabatt im ersten Monat',offer_title_en:'25% new-customer discount in the first month',
  offer_text:'Zusätzlich ist eine kostenlose Probereinigung nach Absprache möglich.',offer_text_en:'A free trial cleaning can also be arranged.',
  email:FRANKIFLOW_CONFIG.defaultEmail,phone:FRANKIFLOW_CONFIG.defaultPhone,whatsapp_url:FRANKIFLOW_CONFIG.defaultWhatsApp,
  service_area:FRANKIFLOW_CONFIG.serviceArea,service_area_en:'Frankfurt am Main & surrounding areas',
  primary_cta_label:'Preis sofort berechnen',primary_cta_label_en:'Calculate price now',
  secondary_cta_label:'Angebot anfragen',secondary_cta_label_en:'Request a quote',hero_image_path:null,
  legal_owner:'Inura Devasurendra',legal_street:'',legal_postcode_city:'Frankfurt am Main'
};

function applySiteLanguage(){
  if(!siteSettings)return;const lang=getLanguage();
  $$('[data-setting]').forEach(el=>{const key=el.dataset.setting;const langKey=lang==='en'?`${key}_en`:key;const value=siteSettings[langKey]||siteSettings[key]||fallbackSettings[langKey]||fallbackSettings[key];if(value!=null)el.textContent=value});
  translateDom(document,lang);
}

async function loadSite(){
  const {data}=await supabase.from('frankiflow_site_settings').select('*').eq('id',1).maybeSingle();
  siteSettings={...fallbackSettings,...(data||{})};
  applySiteLanguage();
  $$('[data-mail]').forEach(el=>{el.href=`mailto:${siteSettings.email}`;const strong=el.querySelector('strong');if(strong)strong.textContent=siteSettings.email;else el.textContent=siteSettings.email});
  $$('[data-phone]').forEach(el=>{el.href=`tel:${siteSettings.phone.replace(/\s/g,'')}`;const strong=el.querySelector('strong');if(strong)strong.textContent=siteSettings.phone;else el.textContent=siteSettings.phone});
  $$('[data-whatsapp]').forEach(el=>{el.href=siteSettings.whatsapp_url||FRANKIFLOW_CONFIG.defaultWhatsApp});
  if(siteSettings.hero_image_path){const {data:urlData}=supabase.storage.from(FRANKIFLOW_CONFIG.mediaBucket).getPublicUrl(siteSettings.hero_image_path);const hero=$('.hero-photo');if(hero){hero.style.backgroundImage=`linear-gradient(135deg,rgba(8,29,45,.12),rgba(8,29,45,.02)),url("${urlData.publicUrl}")`;hero.classList.add('has-image')}}
}


async function loadAboutMain(){
  const host=$('#aboutAccordion');if(!host)return;
  const {data}=await supabase.from('frankiflow_site_settings').select('about_sections').eq('id',1).maybeSingle();
  const sections=Array.isArray(data?.about_sections)?data.about_sections:[];const lang=getLanguage();
  host.innerHTML=sections.slice(0,3).map(item=>{const heading=lang==='en'?(item.heading_en||item.heading_de):(item.heading_de||item.heading_en);const body=lang==='en'?(item.body_en||item.body_de):(item.body_de||item.body_en);const paragraphs=String(body||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);return `<details class="about-accordion-item"><summary>${escapeHtml(heading||'')}</summary><div class="about-accordion-copy">${paragraphs.map(p=>`<p>${escapeHtml(p)}</p>`).join('')}</div></details>`}).join('');
}

async function loadGallery(){
  const {data,error}=await supabase.from('frankiflow_gallery').select('*').eq('active',true).order('sort_order').limit(8);const wrap=$('#galleryGrid'),section=$('#gallerySection');if(!wrap||!section)return;
  if(error||!data?.length){section.classList.add('hidden');return}wrap.innerHTML='';
  for(const item of data){const {data:url}=supabase.storage.from(FRANKIFLOW_CONFIG.mediaBucket).getPublicUrl(item.storage_path);const fig=document.createElement('figure');fig.innerHTML=`<img loading="lazy" src="${url.publicUrl}" alt="${escapeHtml(item.alt_text||item.title||'FrankiFlow Reinigung')}">${item.title?`<figcaption>${escapeHtml(item.title)}</figcaption>`:''}`;wrap.append(fig)}section.classList.remove('hidden');
}
function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

async function submitQuote(e){
  e.preventDefault();const form=e.currentTarget,notice=$('#quoteNotice');notice.className='notice hidden';const fd=new FormData(form);const payload={service_key:fd.get('service_key')||'general',frequency_key:null,area_sqm:null,contract_months:null,window_sqm:0,equipment_by_frankiflow:false,deep_cleaning:false,estimated_monthly:null,customer_name:fd.get('customer_name'),customer_email:fd.get('customer_email'),customer_phone:fd.get('customer_phone')||'',postcode:fd.get('postcode')||'',company_name:fd.get('company_name')||'',message:fd.get('message')||'',privacy_accepted:fd.get('privacy_accepted')==='on',status:'new'};
  if(!payload.privacy_accepted){notice.textContent=tr('Bitte stimmen Sie der Datenschutzerklärung zu.','Please accept the privacy policy.');notice.className='notice error';return}
  const btn=form.querySelector('button[type=submit]');const old=btn.innerHTML;btn.disabled=true;btn.textContent=tr('Wird gesendet …','Sending …');
  const {data:created,error}=await supabase.from('frankiflow_quote_requests').insert(payload).select('id').single();btn.disabled=false;btn.innerHTML=old;translateDom(btn,getLanguage());
  if(error){notice.innerHTML=tr(`Die Online-Anfrage konnte nicht gesendet werden. Schreiben Sie uns bitte direkt an <a href="mailto:${siteSettings?.email||FRANKIFLOW_CONFIG.defaultEmail}">${siteSettings?.email||FRANKIFLOW_CONFIG.defaultEmail}</a>.`,`The online enquiry could not be sent. Please email us directly at <a href="mailto:${siteSettings?.email||FRANKIFLOW_CONFIG.defaultEmail}">${siteSettings?.email||FRANKIFLOW_CONFIG.defaultEmail}</a>.`);notice.className='notice error';return}
  const emailBody={quote_request_id:created.id,customer_email:String(payload.customer_email||'').trim().toLowerCase(),language:getLanguage()};
  await Promise.allSettled([
    supabase.functions.invoke('frankiflow-email',{body:{event_type:'admin_enquiry',...emailBody,attach_quote:false,quote_snapshot:{service_label:form.querySelector('[name=service_key] option:checked')?.textContent||payload.service_key}}}),
    supabase.functions.invoke('frankiflow-email',{body:{event_type:'enquiry_received',...emailBody}})
  ]);
  form.reset();notice.textContent=tr('Vielen Dank! Ihre Anfrage ist eingegangen. Wir melden uns persönlich bei Ihnen.','Thank you! We received your enquiry and will contact you personally.');notice.className='notice';
}
function bindUI(){const menu=$('.menu-btn'),nav=$('.nav-links');menu?.addEventListener('click',()=>{const open=nav?.classList.toggle('open');menu.setAttribute('aria-expanded',String(Boolean(open)))});$$('.nav-links a').forEach(a=>a.addEventListener('click',()=>{nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false')}));$('#quoteForm')?.addEventListener('submit',submitQuote)}

mountLanguageSwitch($('.nav-actions'),{prepend:true});initI18n();bindUI();
window.addEventListener('frankiflow:language',()=>{applySiteLanguage();loadAboutMain()});
await Promise.allSettled([loadSite(),loadGallery(),loadAboutMain(),loadHeaderLogoWidth()]);applySiteLanguage();
