import { FRANKIFLOW_CONFIG } from './config.js';
import { supabase } from './pricing.js';
import { getLanguage, translations, tr } from './site-i18n.js';

const $=(s,p=document)=>p.querySelector(s); const $$=(s,p=document)=>[...p.querySelectorAll(s)];
let copyRows=[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function installFavicon(){
  let link=$('link[rel~="icon"]');
  if(!link){link=document.createElement('link');link.rel='icon';document.head.append(link)}
  link.href='/assets/frankiflow-favicon.svg?v=20260911';
  link.type='image/svg+xml';
}

function setupServiceCards(){
  for(const card of $$('.service-card')){
    const cta=card.querySelector('.card-link');
    const serviceUrl=cta?.getAttribute('href');
    if(!serviceUrl||serviceUrl==='/preisrechner/'||serviceUrl.startsWith('#'))continue;
    card.dataset.serviceUrl=serviceUrl;
    card.tabIndex=0;
    card.setAttribute('role','link');
    const title=card.querySelector('h3')?.textContent?.trim();
    if(title)card.setAttribute('aria-label',`${title} – ${tr('Serviceseite öffnen','Open service page')}`);

    const ctaText=(cta?.textContent||'').toLowerCase();
    if(cta&&(ctaText.includes('preis berechnen')||ctaText.includes('calculate price'))){
      cta.href='/preisrechner/';
      cta.setAttribute('aria-label',tr('Preisrechner öffnen','Open price calculator'));
    }else if(cta&&(ctaText.includes('anfragen')||ctaText.includes('request'))){
      cta.href=getLanguage()==='en'?'/en/#kontakt':'/#kontakt';
    }

    const openService=()=>{window.location.href=serviceUrl};
    card.addEventListener('click',e=>{if(e.target.closest('a,button,input,select,textarea,label'))return;openService()});
    card.addEventListener('keydown',e=>{
      if(e.target!==card)return;
      if(e.key==='Enter'||e.key===' '){e.preventDefault();openService()}
    });
  }
}

function replaceExactCopy(root=document){
  const lang=getLanguage();
  const reverse=new Map(Object.entries(translations).map(([de,en])=>[String(en),de]));
  const rowsByDe=new Map(copyRows.map(r=>[r.copy_key,r]));
  const rowsByStaticEn=new Map(copyRows.map(r=>[String(translations[r.copy_key]||r.text_en||''),r]));
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{
    if(!n.parentElement||n.parentElement.closest('script,style,[data-setting],#galleryGrid'))return NodeFilter.FILTER_REJECT;
    return n.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
  }});
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const n of nodes){
    const raw=n.nodeValue,trim=raw.trim();let next=trim;
    const row=rowsByDe.get(trim)||rowsByStaticEn.get(trim);
    if(row) next=lang==='en'?(row.text_en||translations[row.copy_key]||trim):(row.text_de||row.copy_key||trim);
    else if(lang==='de'&&reverse.has(trim))next=reverse.get(trim);
    if(next!==trim)n.nodeValue=raw.slice(0,raw.indexOf(trim))+next+raw.slice(raw.indexOf(trim)+trim.length);
  }
  for(const el of $$('[placeholder],[aria-label],[title]',root)){
    for(const attr of ['placeholder','aria-label','title']){
      const raw=el.getAttribute(attr);if(!raw)continue;const row=rowsByDe.get(raw)||rowsByStaticEn.get(raw);
      let next=raw;if(row)next=lang==='en'?(row.text_en||translations[row.copy_key]||raw):(row.text_de||row.copy_key||raw);else if(lang==='de'&&reverse.has(raw))next=reverse.get(raw);if(next!==raw)el.setAttribute(attr,next);
    }
  }
}

async function loadEnhancementSettings(){
  const [{data:settings},{data:rows}]=await Promise.all([
    supabase.from('frankiflow_site_settings').select('hero_title_size_px').eq('id',1).maybeSingle(),
    supabase.from('frankiflow_copy').select('copy_key,text_de,text_en,sort_order').order('sort_order')
  ]);
  const size=Math.min(88,Math.max(34,Number(settings?.hero_title_size_px||64)));
  document.documentElement.style.setProperty('--ff-hero-title-size',`${size}px`);
  copyRows=rows||[];replaceExactCopy(document);
}

async function sendEnquiry(e){
  e.preventDefault();e.stopImmediatePropagation();
  const form=e.currentTarget,notice=$('#quoteNotice');if(!notice)return;
  notice.className='notice hidden';const fd=new FormData(form);const quoteId=crypto.randomUUID();
  const payload={id:quoteId,service_key:fd.get('service_key')||'general',frequency_key:null,area_sqm:null,contract_months:null,window_sqm:0,equipment_by_frankiflow:false,deep_cleaning:false,estimated_monthly:null,customer_name:fd.get('customer_name'),customer_email:fd.get('customer_email'),customer_phone:fd.get('customer_phone')||'',postcode:fd.get('postcode')||'',company_name:fd.get('company_name')||'',message:fd.get('message')||'',privacy_accepted:fd.get('privacy_accepted')==='on',status:'new'};
  if(!payload.privacy_accepted){notice.textContent=tr('Bitte stimmen Sie der Datenschutzerklärung zu.','Please accept the privacy policy.');notice.className='notice error';return}
  const btn=form.querySelector('button[type=submit]'),old=btn?.innerHTML;if(btn){btn.disabled=true;btn.textContent=tr('Wird gesendet …','Sending …')}
  const {error}=await supabase.from('frankiflow_quote_requests').insert(payload);
  if(btn){btn.disabled=false;btn.innerHTML=old||tr('Anfrage senden','Send enquiry')}
  if(error){notice.innerHTML=tr(`Die Online-Anfrage konnte nicht gesendet werden. Schreiben Sie uns bitte direkt an <a href="mailto:${FRANKIFLOW_CONFIG.defaultEmail}">${FRANKIFLOW_CONFIG.defaultEmail}</a>.`,`The online enquiry could not be sent. Please email us directly at <a href="mailto:${FRANKIFLOW_CONFIG.defaultEmail}">${FRANKIFLOW_CONFIG.defaultEmail}</a>.`);notice.className='notice error';return}
  form.reset();notice.textContent=tr('Vielen Dank! Ihre Anfrage ist eingegangen. Eine Bestätigung wurde per E-Mail gesendet. Wir melden uns so schnell wie möglich persönlich bei Ihnen.','Thank you! We received your enquiry. A confirmation was sent by email and we will contact you personally as soon as possible.');notice.className='notice';
  try{
    const r=await fetch(`${FRANKIFLOW_CONFIG.supabaseUrl}/functions/v1/frankiflow-email`,{method:'POST',headers:{'Content-Type':'application/json','apikey':FRANKIFLOW_CONFIG.supabasePublishableKey},body:JSON.stringify({event_type:'enquiry_received',quote_request_id:quoteId,customer_email:payload.customer_email,language:getLanguage()})});
    if(!r.ok)console.warn('FrankiFlow acknowledgement email failed',await r.text());
  }catch(err){console.warn('FrankiFlow acknowledgement email failed',err)}
}

async function renderHomepageGallery(){
  const wrap=$('#galleryGrid'),section=$('#gallerySection');if(!wrap||!section)return;
  const {data,error}=await supabase.from('frankiflow_gallery').select('*').eq('active',true).eq('category','general').order('sort_order').order('created_at',{ascending:false}).limit(8);
  if(error||!data?.length){section.classList.add('hidden');return}
  wrap.innerHTML='';for(const item of data){const {data:url}=supabase.storage.from(FRANKIFLOW_CONFIG.mediaBucket).getPublicUrl(item.storage_path);const fig=document.createElement('figure');fig.innerHTML=`<img loading="lazy" src="${url.publicUrl}" alt="${esc(item.alt_text||item.title||'FrankiFlow Reinigung')}">${item.title?`<figcaption>${esc(item.title)}</figcaption>`:''}`;wrap.append(fig)}section.classList.remove('hidden');
}

installFavicon();
setupServiceCards();
const quote=$('#quoteForm');if(quote)quote.addEventListener('submit',sendEnquiry,true);
window.addEventListener('frankiflow:language',()=>setTimeout(()=>replaceExactCopy(document),0));
await Promise.allSettled([loadEnhancementSettings(),renderHomepageGallery()]);
