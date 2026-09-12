import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { getLanguage, normalizeEnglishUi, translations, tr } from './site-i18n.js';

const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dbCopy=[];
let managedContent=null;

const visibilityDefaults={hero:true,advantages:true,services:true,about:true,why:true,process:true,gallery:true,faq:true,contact:true};
const sectionLabels={
  hero:{de:'Hero',en:'Hero'},advantages:{de:'Vorteile',en:'Benefits'},services:{de:'Leistungen',en:'Services'},about:{de:'Über uns',en:'About Us'},why:{de:'Warum FrankiFlow',en:'Why FrankiFlow'},process:{de:'Ablauf',en:'Process'},gallery:{de:'Galerie',en:'Gallery'},faq:{de:'FAQ',en:'FAQ'},contact:{de:'Kontakt',en:'Contact'}
};

function ensureHeroSizeControl(){
  const form=$('#siteForm');if(!form||$('#heroTitleSize'))return;
  const submit=form.querySelector('button[type="submit"]');const box=document.createElement('div');box.className='ff-inline-setting';box.innerHTML=`<div class="ff-inline-setting-head"><strong>${tr('Hero-Titelgröße','Hero Title Size')}</strong><span><b id="heroTitleSizeValue">64</b> px</span></div><div class="ff-range-row"><input id="heroTitleSize" type="range" min="34" max="88" step="1" value="64"><input id="heroTitleSizeNumber" type="number" min="34" max="88" step="1" value="64"></div><div class="muted">${tr('Standard ist 64 px. Die Website begrenzt die Größe auf kleinen Bildschirmen automatisch.','Default is 64 px. The Website automatically limits the Size on small Screens.')}</div>`;submit?.before(box);
  const range=$('#heroTitleSize'),num=$('#heroTitleSizeNumber'),val=$('#heroTitleSizeValue');const sync=v=>{v=Math.min(88,Math.max(34,Number(v)||64));range.value=String(v);num.value=String(v);val.textContent=String(v)};range.oninput=()=>sync(range.value);num.oninput=()=>sync(num.value);
  supabase.from('frankiflow_site_settings').select('hero_title_size_px').eq('id',1).maybeSingle().then(({data})=>sync(data?.hero_title_size_px||64));
  form.addEventListener('submit',async()=>{const {data:{session}}=await supabase.auth.getSession();if(!session)return;await supabase.from('frankiflow_site_settings').update({hero_title_size_px:Number(range.value),updated_at:new Date().toISOString(),updated_by:session.user.id}).eq('id',1)});
}

function copyDefaults(){return Object.entries(translations).map(([de,en],i)=>({copy_key:de,label:de,text_de:de,text_en:String(en),sort_order:i}))}
async function loadCopy(){const {data}=await supabase.from('frankiflow_copy').select('*').order('sort_order');dbCopy=data||[];renderCopy()}
function mergedCopy(){const map=new Map(dbCopy.map(x=>[x.copy_key,x]));return copyDefaults().map(d=>({...d,...(map.get(d.copy_key)||{})}))}
function ensureCopyEditor(){
  const panel=$('[data-panel-view="site"]');if(!panel||$('#copyEditors'))return;
  const card=document.createElement('div');card.className='admin-card ff-copy-card';card.innerHTML=`<div class="ff-copy-toolbar"><div><h2 style="margin:0">${tr('Website-Texte & Übersetzungen','Website Copy & Translations')}</h2><p class="muted" style="margin:5px 0 0">${tr('Alle öffentlichen Standardtexte können hier als deutsches und englisches Paar gepflegt werden. Hero/Angebot bleiben zusätzlich oben separat editierbar.','All standard public Copy can be maintained here as German/English Pairs. Hero and Offer Copy also remain separately editable above.')}</p></div><input id="copySearch" placeholder="${tr('Text suchen','Search Copy')}"></div><div id="copyEditors" class="ff-copy-list"></div><div class="ff-copy-actions"><button id="saveAllCopy" class="btn btn-primary" type="button">${tr('Alle Übersetzungen speichern','Save All Translations')}</button><span id="copySaveState" class="muted"></span></div>`;panel.append(card);$('#copySearch').addEventListener('input',renderCopy);$('#saveAllCopy').addEventListener('click',saveCopy);
}
function renderCopy(){const host=$('#copyEditors');if(!host)return;const q=($('#copySearch')?.value||'').trim().toLowerCase();const rows=mergedCopy().filter(r=>!q||r.copy_key.toLowerCase().includes(q)||r.text_en.toLowerCase().includes(q)||r.text_de.toLowerCase().includes(q));host.innerHTML=rows.length?rows.map(r=>`<div class="ff-copy-row" data-copy-key="${esc(r.copy_key)}"><div class="ff-copy-key"><strong>${esc(r.label||r.copy_key)}</strong><code>${esc(r.copy_key)}</code></div><div class="ff-copy-grid"><div><label>Deutsch</label><textarea data-copy-de>${esc(r.text_de||r.copy_key)}</textarea></div><div><label>English</label><textarea data-copy-en>${esc(r.text_en||translations[r.copy_key]||'')}</textarea></div></div></div>`).join(''):`<div class="ff-copy-empty">${tr('Keine passenden Texte gefunden.','No Matching Copy Found.')}</div>`;normalizeEnglishUi(host,getLanguage())}
async function saveCopy(){const state=$('#copySaveState');state.textContent=tr('Wird gespeichert …','Saving …');const {data:{session}}=await supabase.auth.getSession();if(!session){state.textContent=tr('Bitte erneut anmelden.','Please Sign In Again.');return}const rows=$$('.ff-copy-row').map((el,i)=>({copy_key:el.dataset.copyKey,label:el.dataset.copyKey,text_de:$('[data-copy-de]',el).value.trim()||el.dataset.copyKey,text_en:$('[data-copy-en]',el).value.trim()||translations[el.dataset.copyKey]||'',sort_order:i,updated_at:new Date().toISOString(),updated_by:session.user.id}));const {error}=await supabase.from('frankiflow_copy').upsert(rows,{onConflict:'copy_key'});state.textContent=error?`${tr('Fehler','Error')}: ${error.message}`:tr('Gespeichert ✓','Saved ✓');if(!error)await loadCopy()}

function faqItemTemplate(item={}){
  return `<div class="ff-faq-admin-item"><div class="ff-faq-item-head"><strong>${tr('FAQ-Eintrag','FAQ Item')}</strong><button class="btn btn-secondary btn-small danger" type="button" data-remove-faq>${tr('Entfernen','Remove')}</button></div><div class="ff-copy-grid"><div><label>Deutsch · ${tr('Frage','Question')}</label><input data-faq-question-de value="${esc(item.question_de||'')}"><label>${tr('Antwort','Answer')}</label><textarea data-faq-answer-de rows="4">${esc(item.answer_de||'')}</textarea></div><div><label>English · Question</label><input data-faq-question-en value="${esc(item.question_en||'')}"><label>Answer</label><textarea data-faq-answer-en rows="4">${esc(item.answer_en||'')}</textarea></div></div></div>`;
}
function bindFaqRemoveButtons(){$$('[data-remove-faq]').forEach(btn=>btn.onclick=()=>btn.closest('.ff-faq-admin-item')?.remove())}
function addFaqItem(item={}){const host=$('#faqAdminItems');if(!host)return;host.insertAdjacentHTML('beforeend',faqItemTemplate(item));bindFaqRemoveButtons();normalizeEnglishUi(host,getLanguage())}

function ensureManagedContentEditor(){
  const panel=$('[data-panel-view="site"]');if(!panel||$('#managedContentCard'))return;
  const card=document.createElement('div');card.id='managedContentCard';card.className='admin-card ff-managed-content-card';card.innerHTML=`
    <div class="ff-copy-toolbar"><div><span class="admin-kicker">HOMEPAGE CMS</span><h2 style="margin:4px 0 0">${tr('Bereiche, Über uns & FAQ','Sections, About Us & FAQ')}</h2><p class="muted" style="margin:5px 0 0">${tr('Steuern Sie sichtbare Startseitenbereiche und bearbeiten Sie Über-uns- sowie FAQ-Inhalte auf Deutsch und Englisch.','Control visible Homepage Sections and edit About Us and FAQ Content in German and English.')}</p></div></div>
    <section class="ff-content-block"><h3>${tr('Bereiche sichtbar / ausblenden','Show / Hide Sections')}</h3><div id="sectionVisibilityGrid" class="ff-section-toggle-grid"></div></section>
    <section class="ff-content-block"><h3>${tr('Über uns','About Us')}</h3><div class="ff-copy-grid"><div><label>Deutsch · Eyebrow</label><input data-managed="about_eyebrow"><label>Titel</label><input data-managed="about_title"><label>Text 1</label><textarea data-managed="about_body_1" rows="6"></textarea><label>Text 2</label><textarea data-managed="about_body_2" rows="6"></textarea></div><div><label>English · Eyebrow</label><input data-managed="about_eyebrow_en"><label>Title</label><input data-managed="about_title_en"><label>Text 1</label><textarea data-managed="about_body_1_en" rows="6"></textarea><label>Text 2</label><textarea data-managed="about_body_2_en" rows="6"></textarea></div></div></section>
    <section class="ff-content-block"><div class="ff-faq-toolbar"><div><h3>${tr('FAQ verwalten','Manage FAQ')}</h3><p class="muted">${tr('FAQ-Einträge hinzufügen oder entfernen. Mit dem FAQ-Sichtbarkeitsschalter oben kann der gesamte Bereich ausgeblendet werden.','Add or remove FAQ Items. Use the FAQ Visibility Switch above to hide the entire Section.')}</p></div><button id="addFaqItem" class="btn btn-secondary" type="button">+ ${tr('FAQ hinzufügen','Add FAQ')}</button></div><div class="ff-copy-grid ff-faq-headings"><div><label>Deutsch · Eyebrow</label><input data-managed="faq_eyebrow"><label>Titel</label><input data-managed="faq_title"><label>Einleitung</label><textarea data-managed="faq_intro" rows="3"></textarea></div><div><label>English · Eyebrow</label><input data-managed="faq_eyebrow_en"><label>Title</label><input data-managed="faq_title_en"><label>Introduction</label><textarea data-managed="faq_intro_en" rows="3"></textarea></div></div><div id="faqAdminItems" class="ff-faq-admin-list"></div></section>
    <div class="ff-copy-actions"><button id="saveManagedContent" class="btn btn-primary" type="button">${tr('Startseiten-Inhalte speichern','Save Homepage Content')}</button><span id="managedContentState" class="muted"></span></div>`;
  const siteForm=$('#siteForm');siteForm?.insertAdjacentElement('afterend',card);
  $('#addFaqItem')?.addEventListener('click',()=>addFaqItem());
  $('#saveManagedContent')?.addEventListener('click',saveManagedContent);
  normalizeEnglishUi(card,getLanguage());
}

async function loadManagedContent(){
  const fields='section_visibility,about_eyebrow,about_title,about_body_1,about_body_2,about_eyebrow_en,about_title_en,about_body_1_en,about_body_2_en,faq_eyebrow,faq_title,faq_intro,faq_eyebrow_en,faq_title_en,faq_intro_en,faq_items';
  const {data,error}=await supabase.from('frankiflow_site_settings').select(fields).eq('id',1).maybeSingle();
  if(error){const state=$('#managedContentState');if(state)state.textContent=`${tr('Fehler','Error')}: ${error.message}`;return}
  managedContent=data||{};renderManagedContent();
}
function renderManagedContent(){
  if(!managedContent)return;const v={...visibilityDefaults,...(managedContent.section_visibility||{})},lang=getLanguage();
  const grid=$('#sectionVisibilityGrid');if(grid){grid.innerHTML=Object.keys(visibilityDefaults).map(key=>`<label class="pricing-toggle ff-section-toggle"><input type="checkbox" data-section-visible="${key}" ${v[key]!==false?'checked':''}><span class="pricing-switch"></span><strong>${esc(sectionLabels[key]?.[lang]||key)}</strong></label>`).join('')}
  $$('[data-managed]').forEach(el=>{el.value=managedContent[el.dataset.managed]??''});
  const host=$('#faqAdminItems');if(host){host.innerHTML='';const items=Array.isArray(managedContent.faq_items)?managedContent.faq_items:[];items.forEach(addFaqItem);if(!items.length)host.innerHTML=`<div class="ff-copy-empty">${tr('Noch keine FAQ-Einträge.','No FAQ Items Yet.')}</div>`}
  bindFaqRemoveButtons();normalizeEnglishUi($('#managedContentCard'),lang);
}
async function saveManagedContent(){
  const state=$('#managedContentState');if(state)state.textContent=tr('Wird gespeichert …','Saving …');
  const {data:{session}}=await supabase.auth.getSession();if(!session){if(state)state.textContent=tr('Bitte erneut anmelden.','Please Sign In Again.');return}
  const payload={};$$('[data-managed]').forEach(el=>payload[el.dataset.managed]=el.value.trim());
  payload.section_visibility={};$$('[data-section-visible]').forEach(el=>payload.section_visibility[el.dataset.sectionVisible]=el.checked);
  payload.faq_items=$$('.ff-faq-admin-item').map(el=>({question_de:$('[data-faq-question-de]',el)?.value.trim()||'',answer_de:$('[data-faq-answer-de]',el)?.value.trim()||'',question_en:$('[data-faq-question-en]',el)?.value.trim()||'',answer_en:$('[data-faq-answer-en]',el)?.value.trim()||''})).filter(x=>x.question_de||x.question_en||x.answer_de||x.answer_en);
  payload.updated_at=new Date().toISOString();payload.updated_by=session.user.id;
  const {error}=await supabase.from('frankiflow_site_settings').update(payload).eq('id',1);
  if(state)state.textContent=error?`${tr('Fehler','Error')}: ${error.message}`:tr('Gespeichert ✓','Saved ✓');
  if(!error){managedContent={...managedContent,...payload};setTimeout(()=>{if(state)state.textContent=tr('Bereit','Ready')},2500)}
}

function enhancePhotoControls(){
  const form=$('#photoForm'),select=$('#photoCategory');if(!form||!select)return;
  if(!form.querySelector('.ff-photo-help')){const p=document.createElement('p');p.className='ff-photo-help';p.textContent=tr('Wählen Sie, wo das Foto verwendet werden soll. Fotos können unten jederzeit wieder gelöscht werden. Für Service-Seiten wird das erste aktive Foto der jeweiligen Kategorie als Seitenbild verwendet.','Choose where the Photo should be used. Photos can be deleted at any time below. Service Pages use the first active Photo in the selected Category as the Page Image.');form.prepend(p)}
  const selected=select.value||'general';select.innerHTML=`<option value="general">${tr('Startseite – Galerie','Homepage – Gallery')}</option><option value="hero">${tr('Startseite – Hero','Homepage – Hero')}</option><option value="office">${tr('Büroreinigungsseite','Office-Cleaning Page')}</option><option value="home">${tr('Wohnungsreinigungsseite','Home-Cleaning Page')}</option><option value="airbnb">${tr('Airbnb-/Ferienwohnungsseite','Airbnb / Holiday-Rental Page')}</option><option value="staircase">${tr('Treppenhausseite','Stairwell-Cleaning Page')}</option><option value="deep">${tr('Grundreinigungsseite','Deep-Cleaning Page')}</option><option value="property">${tr('Objektbetreuungsseite','Property-Care Page')}</option>`;if([...select.options].some(o=>o.value===selected))select.value=selected;
  select.onchange=()=>{if($('#useAsHero'))$('#useAsHero').checked=select.value==='hero'};
  const names={general:tr('Startseite – Galerie','Homepage – Gallery'),hero:tr('Startseite – Hero','Homepage – Hero'),office:tr('Büroreinigungsseite','Office-Cleaning Page'),home:tr('Wohnungsreinigungsseite','Home-Cleaning Page'),airbnb:tr('Airbnb-/Ferienwohnungsseite','Airbnb / Holiday-Rental Page'),staircase:tr('Treppenhausseite','Stairwell-Cleaning Page'),deep:tr('Grundreinigungsseite','Deep-Cleaning Page'),property:tr('Objektbetreuungsseite','Property-Care Page'),commercial:tr('Gewerbe','Commercial')};
  const rows=$('#photoRows');if(rows&&!rows.dataset.ffObserved){rows.dataset.ffObserved='1';const relabel=()=>{for(const trEl of rows.querySelectorAll('tr')){const td=trEl.children[2];if(td&&names[td.textContent.trim()])td.textContent=names[td.textContent.trim()]}};new MutationObserver(relabel).observe(rows,{childList:true,subtree:true});relabel()}
}

ensureHeroSizeControl();ensureManagedContentEditor();ensureCopyEditor();enhancePhotoControls();await Promise.allSettled([loadCopy(),loadManagedContent()]);
window.addEventListener('frankiflow:language',()=>{renderCopy();enhancePhotoControls();if(managedContent)renderManagedContent()});
