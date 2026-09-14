import { FRANKIFLOW_CONFIG } from './config.js';
import { supabase } from './pricing.js';
import { getLanguage, normalizeEnglishUi, translations, tr } from './site-i18n.js';

const $=(s,p=document)=>p.querySelector(s); const $$=(s,p=document)=>[...p.querySelectorAll(s)];
let copyRows=[];
let managedSettings={};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const fallbackManaged={
  about_eyebrow:'Über uns',
  about_title:'Persönlich aufgebaut. Digital gedacht. Mit Qualitätsanspruch.',
  about_body_1:'FrankiFlow ist aus dem Wunsch entstanden, Service in Frankfurt einfacher, transparenter und persönlicher zu machen. Ich kam 2019 nach Deutschland, habe Mobility & Logistics studiert und anschließend im Fleet Management eines Reise- und Transportunternehmens gearbeitet. Qualitätskontrollen und strukturierte Abläufe gehörten dort zu meinem Alltag – genau diesen Anspruch bringe ich heute in FrankiFlow ein.',
  about_body_2:'Der digitale Teil gehört von Anfang an dazu: Alex, Software Engineer und Masterstudent in Deutschland, hat unseren eigenen Preisrechner entwickelt und arbeitet heute mit mir am weiteren Aufbau. Unser Ziel ist kein schnelles Wachstum um jeden Preis, sondern ein verlässliches Team, klare Prozesse und eine Schritt-für-Schritt-Erweiterung von Frankfurt aus.',
  about_eyebrow_en:'About Us',
  about_title_en:'Built Personally. Designed Digitally. Focused on Quality.',
  about_body_1_en:'FrankiFlow grew from a simple idea: make Service in Frankfurt easier, more transparent and more personal. I came to Germany in 2019, studied Mobility & Logistics and later worked in Fleet Management for a Travel and Transportation Company. Quality Checks and structured Processes were part of my daily Work, and I bring that same Standard to FrankiFlow today.',
  about_body_2_en:'The digital Side has been part of FrankiFlow from the beginning. Alex, a Software Engineer and Master’s Student in Germany, developed our own Price Calculator and now works with me on building the Company further. Our Goal is not Growth at any cost, but a reliable Team, clear Processes and careful step-by-step Expansion from Frankfurt.',
  faq_eyebrow:'Häufige Fragen',faq_title:'Gebäudereinigung in Frankfurt: kurz beantwortet.',faq_intro:'Die wichtigsten Punkte vor Ihrer ersten Anfrage.',
  faq_eyebrow_en:'Frequently Asked Questions',faq_title_en:'Cleaning in Frankfurt: Quick Answers.',faq_intro_en:'The Key Points Before Your First Enquiry.',
  section_visibility:{hero:true,advantages:true,services:true,about:true,why:true,process:true,gallery:true,faq:true,contact:true},
  faq_items:[
    {question_de:'Was kostet eine Reinigung in Frankfurt?',answer_de:'Der Preis hängt von Leistung, Fläche, Häufigkeit, Laufzeit und Zusatzleistungen ab. Für eine schnelle Orientierung können Sie unseren Preisrechner nutzen; ein verbindliches Angebot folgt nach Abstimmung des Leistungsumfangs.',question_en:'How Much Does Cleaning Cost in Frankfurt?',answer_en:'The Price depends on the Service, Area, Frequency, Contract Term and any Extras. Use our Price Calculator for a quick Estimate; a binding Quote follows after the Scope has been agreed.'},
    {question_de:'Welche Reinigungsleistungen bietet FrankiFlow an?',answer_de:'Unter anderem Büroreinigung, Wohnungsreinigung, Airbnb- und Ferienwohnungsreinigung, Treppenhausreinigung, Grund- und Endreinigung sowie Objektbetreuung.',question_en:'Which Cleaning Services Does FrankiFlow Offer?',answer_en:'Services include Office Cleaning, Home Cleaning, Airbnb and Holiday-Rental Cleaning, Stairwell Cleaning, Deep/End-of-Tenancy Cleaning and Property Care.'},
    {question_de:'Kann die Büroreinigung außerhalb der Arbeitszeiten stattfinden?',answer_de:'Ja. Einsatzzeiten werden individuell abgestimmt, damit die Reinigung möglichst gut zu Ihrem Betriebsablauf passt.',question_en:'Can Office Cleaning Take Place Outside Working Hours?',answer_en:'Yes. Cleaning Times are agreed individually to fit your Business Operations as well as possible.'},
    {question_de:'Können Reinigungsmittel und Equipment gestellt werden?',answer_de:'Ja. Je nach Auftrag können Material und Equipment durch FrankiFlow gestellt oder vorhandene Mittel vor Ort genutzt werden. Die Vereinbarung wird vor Beginn klar festgehalten.',question_en:'Can Cleaning Supplies and Equipment Be Provided?',answer_en:'Yes. Depending on the Job, FrankiFlow can provide Supplies and Equipment or use suitable Materials already on site. This is agreed clearly before Work begins.'},
    {question_de:'Wie erhalte ich ein konkretes Angebot?',answer_de:'Nutzen Sie den Preisrechner oder senden Sie eine Anfrage mit Objektart, Fläche, gewünschter Häufigkeit und Besonderheiten. Wir melden uns persönlich zur Abstimmung.',question_en:'How Do I Get a Specific Quote?',answer_en:'Use the Price Calculator or send an Enquiry with the Property Type, Area, preferred Frequency and any special Requirements. We will contact you personally to agree the Details.'}
  ]
};

function installFavicon(){
  let link=$('link[rel~="icon"]');
  if(!link){link=document.createElement('link');link.rel='icon';document.head.append(link)}
  link.href='/assets/frankiflow-favicon-32.png?v=20260911d';
  link.type='image/png';
  link.sizes='32x32';
}

function removeLegacyHomepageSections(){
  $('.calculator-cta-section')?.remove();
  $('.local-seo-section')?.remove();
}

function ensureAboutSection(){
  if($('#about'))return;
  const services=$('.services-section');if(!services)return;
  const section=document.createElement('section');section.id='about';section.className='section about-section';
  section.innerHTML=`<div class="container about-grid"><div class="about-intro"><span class="eyebrow" data-home-setting="about_eyebrow">Über uns</span><h2 data-home-setting="about_title">Persönlich aufgebaut. Digital gedacht. Mit Qualitätsanspruch.</h2></div><div class="about-story"><p data-home-setting="about_body_1">${esc(fallbackManaged.about_body_1)}</p><p data-home-setting="about_body_2">${esc(fallbackManaged.about_body_2)}</p><div class="about-signature"><span>FrankiFlow</span><strong>${tr('Mehr als Reinigung.','More Than Cleaning.')}</strong></div></div></div>`;
  services.insertAdjacentElement('afterend',section);
  const nav=$('.nav-links');if(nav&&!nav.querySelector('a[href="#about"]')){
    const link=document.createElement('a');link.href='#about';link.dataset.sectionLink='about';link.textContent=tr('Über uns','About Us');
    const why=nav.querySelector('a[href="#warum"]');why?nav.insertBefore(link,why):nav.append(link);
  }
  const footer=$('.footer-grid .footer-links');if(footer&&!footer.querySelector('a[href="#about"]')){
    const link=document.createElement('a');link.href='#about';link.dataset.sectionLink='about';link.textContent=tr('Über uns','About Us');footer.prepend(link);
  }
}

function settingValue(key){const lang=getLanguage();const langKey=lang==='en'?`${key}_en`:key;return managedSettings[langKey]||managedSettings[key]||fallbackManaged[langKey]||fallbackManaged[key]||''}
function applyManagedCopy(){
  $$('[data-home-setting]').forEach(el=>{el.textContent=settingValue(el.dataset.homeSetting)});
  const faq=$('#faq');if(faq){
    const eyebrow=$('.eyebrow',faq),title=$('h2',faq),intro=$('.section-head>p',faq);
    if(eyebrow)eyebrow.textContent=settingValue('faq_eyebrow');
    if(title)title.textContent=settingValue('faq_title');
    if(intro)intro.textContent=settingValue('faq_intro');
  }
}

function renderFaq(){
  const section=$('#faq');if(!section)return;
  let grid=$('.faq-grid',section);if(!grid){grid=document.createElement('div');grid.className='faq-grid';$('.container',section)?.append(grid)}
  const items=Array.isArray(managedSettings.faq_items)?managedSettings.faq_items:fallbackManaged.faq_items;
  const lang=getLanguage();
  grid.innerHTML=items.map(item=>{
    const q=lang==='en'?(item.question_en||item.question_de):(item.question_de||item.question_en);
    const a=lang==='en'?(item.answer_en||item.answer_de):(item.answer_de||item.answer_en);
    return `<details><summary>${esc(q||'')}</summary><p>${esc(a||'')}</p></details>`;
  }).join('');
}

function applySectionVisibility(){
  const v={...fallbackManaged.section_visibility,...(managedSettings.section_visibility||{})};
  const selectors={hero:'.hero',advantages:'.signal-strip',services:'.services-section',about:'#about',why:'.why-section',process:'.process-section',gallery:'#gallerySection',faq:'#faq',contact:'.contact-section'};
  for(const [key,selector] of Object.entries(selectors)){
    const el=$(selector);if(!el)continue;
    el.classList.toggle('ff-admin-hidden-section',v[key]===false);
  }
  const linkMap={services:'#leistungen',about:'#about',why:'#warum',process:'#ablauf',faq:'#faq',contact:'#kontakt'};
  for(const [key,href] of Object.entries(linkMap))$$(`a[href="${href}"]`).forEach(a=>a.classList.toggle('hidden',v[key]===false));
}

function applyManagedHomepage(){
  ensureAboutSection();
  applyManagedCopy();
  renderFaq();
  applySectionVisibility();
  normalizeEnglishUi(document,getLanguage());
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
    if(title)card.setAttribute('aria-label',`${title} – ${tr('Serviceseite öffnen','Open Service Page')}`);

    const ctaText=(cta?.textContent||'').toLowerCase();
    if(cta&&(ctaText.includes('preis berechnen')||ctaText.includes('calculate price'))){
      cta.href='/preisrechner/';
      cta.setAttribute('aria-label',tr('Preisrechner öffnen','Open Price Calculator'));
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
    if(!n.parentElement||n.parentElement.closest('script,style,[data-setting],[data-home-setting],#galleryGrid'))return NodeFilter.FILTER_REJECT;
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
  normalizeEnglishUi(root,lang);
}

async function loadEnhancementSettings(){
  const [{data:settings},{data:rows}]=await Promise.all([
    supabase.from('frankiflow_site_settings').select('hero_title_size_px,section_visibility,faq_items,about_eyebrow,about_title,about_body_1,about_body_2,about_eyebrow_en,about_title_en,about_body_1_en,about_body_2_en,faq_eyebrow,faq_title,faq_intro,faq_eyebrow_en,faq_title_en,faq_intro_en').eq('id',1).maybeSingle(),
    supabase.from('frankiflow_copy').select('copy_key,text_de,text_en,sort_order').order('sort_order')
  ]);
  const size=Math.min(88,Math.max(34,Number(settings?.hero_title_size_px||64)));
  document.documentElement.style.setProperty('--ff-hero-title-size',`${size}px`);
  managedSettings={...fallbackManaged,...(settings||{}),section_visibility:{...fallbackManaged.section_visibility,...(settings?.section_visibility||{})}};
  copyRows=rows||[];
  applyManagedHomepage();
  replaceExactCopy(document);
}

async function sendEnquiry(e){
  e.preventDefault();e.stopImmediatePropagation();
  const form=e.currentTarget,notice=$('#quoteNotice');if(!notice)return;
  notice.className='notice hidden';const fd=new FormData(form);const quoteId=crypto.randomUUID();
  const payload={id:quoteId,service_key:fd.get('service_key')||'general',frequency_key:null,area_sqm:null,contract_months:null,window_sqm:0,equipment_by_frankiflow:false,deep_cleaning:false,estimated_monthly:null,customer_name:fd.get('customer_name'),customer_email:fd.get('customer_email'),customer_phone:fd.get('customer_phone')||'',postcode:fd.get('postcode')||'',company_name:fd.get('company_name')||'',message:fd.get('message')||'',privacy_accepted:fd.get('privacy_accepted')==='on',status:'new'};
  if(!payload.privacy_accepted){notice.textContent=tr('Bitte stimmen Sie der Datenschutzerklärung zu.','Please Accept the Privacy Policy.');notice.className='notice error';return}
  const btn=form.querySelector('button[type=submit]'),old=btn?.innerHTML;if(btn){btn.disabled=true;btn.textContent=tr('Wird gesendet …','Sending …')}
  const {error}=await supabase.from('frankiflow_quote_requests').insert(payload);
  if(btn){btn.disabled=false;btn.innerHTML=old||tr('Anfrage senden','Send Enquiry')}
  if(error){notice.innerHTML=tr(`Die Online-Anfrage konnte nicht gesendet werden. Schreiben Sie uns bitte direkt an <a href="mailto:${FRANKIFLOW_CONFIG.defaultEmail}">${FRANKIFLOW_CONFIG.defaultEmail}</a>.`,`The Online Enquiry could not be sent. Please email us directly at <a href="mailto:${FRANKIFLOW_CONFIG.defaultEmail}">${FRANKIFLOW_CONFIG.defaultEmail}</a>.`);notice.className='notice error';return}
  form.reset();notice.textContent=tr('Vielen Dank! Ihre Anfrage ist eingegangen. Eine Bestätigung wurde per E-Mail gesendet. Wir melden uns so schnell wie möglich persönlich bei Ihnen.','Thank You! We received your Enquiry. A Confirmation was sent by Email and we will contact you personally as soon as possible.');notice.className='notice';
  try{
    const endpoint=`${FRANKIFLOW_CONFIG.supabaseUrl}/functions/v1/frankiflow-email`;
    const headers={'Content-Type':'application/json','apikey':FRANKIFLOW_CONFIG.supabasePublishableKey};
    const common={quote_request_id:quoteId,customer_email:payload.customer_email,language:getLanguage()};
    const results=await Promise.allSettled([
      fetch(endpoint,{method:'POST',headers,body:JSON.stringify({event_type:'admin_enquiry',source:'website',...common})}),
      fetch(endpoint,{method:'POST',headers,body:JSON.stringify({event_type:'enquiry_received',source:'website',...common})})
    ]);
    for(const result of results){
      if(result.status==='rejected')console.warn('FrankiFlow enquiry email failed',result.reason);
      else if(!result.value.ok)console.warn('FrankiFlow enquiry email failed',await result.value.text());
    }
  }catch(err){console.warn('FrankiFlow enquiry email failed',err)}
}

async function renderHomepageGallery(){
  const wrap=$('#galleryGrid'),section=$('#gallerySection');if(!wrap||!section)return;
  const {data,error}=await supabase.from('frankiflow_gallery').select('*').eq('active',true).eq('category','general').order('sort_order').order('created_at',{ascending:false}).limit(8);
  if(error||!data?.length){section.classList.add('hidden');return}
  wrap.innerHTML='';for(const item of data){const {data:url}=supabase.storage.from(FRANKIFLOW_CONFIG.mediaBucket).getPublicUrl(item.storage_path);const fig=document.createElement('figure');fig.innerHTML=`<img loading="lazy" src="${url.publicUrl}" alt="${esc(item.alt_text||item.title||'FrankiFlow Reinigung')}">${item.title?`<figcaption>${esc(item.title)}</figcaption>`:''}`;wrap.append(fig)}section.classList.remove('hidden');
  applySectionVisibility();
}

installFavicon();
removeLegacyHomepageSections();
ensureAboutSection();
setupServiceCards();
const quote=$('#quoteForm');if(quote)quote.addEventListener('submit',sendEnquiry,true);
window.addEventListener('frankiflow:language',()=>setTimeout(()=>{applyManagedHomepage();replaceExactCopy(document)},0));
await Promise.allSettled([loadEnhancementSettings(),renderHomepageGallery()]);
applyManagedHomepage();
