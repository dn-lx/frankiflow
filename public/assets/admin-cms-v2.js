import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { getLanguage, tr } from './site-i18n.js';

const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cmsData=null;

const visibilityDefaults={hero:true,advantages:true,services:true,about:true,why:true,process:true,gallery:true,faq:true,contact:true};
const sectionMeta={
  hero:{de:'Hero',en:'Hero',deHelp:'Erster sichtbarer Bereich mit Hauptbotschaft und Buttons.',enHelp:'Top section with the main message and calls to action.'},
  advantages:{de:'Vorteile',en:'Benefits',deHelp:'Kurze Vertrauens- und Angebotsvorteile unter dem Hero.',enHelp:'Quick trust and offer benefits below the hero.'},
  services:{de:'Leistungen',en:'Services',deHelp:'Übersicht der angebotenen Reinigungsleistungen.',enHelp:'Overview of the cleaning services offered.'},
  about:{de:'Über uns',en:'About Us',deHelp:'Geschichte, Team und Vision von FrankiFlow.',enHelp:'FrankiFlow story, team and vision.'},
  why:{de:'Warum FrankiFlow',en:'Why FrankiFlow',deHelp:'Argumente, die FrankiFlow vom Wettbewerb unterscheiden.',enHelp:'Reasons that differentiate FrankiFlow.'},
  process:{de:'Ablauf',en:'Process',deHelp:'Schritt-für-Schritt-Erklärung für Kunden.',enHelp:'Step-by-step explanation for customers.'},
  gallery:{de:'Galerie',en:'Gallery',deHelp:'Bilder aus Reinigungs- und Objektbetreuungsarbeiten.',enHelp:'Images from cleaning and property-care work.'},
  faq:{de:'FAQ',en:'FAQ',deHelp:'Häufige Fragen und Antworten.',enHelp:'Frequently asked questions and answers.'},
  contact:{de:'Kontakt',en:'Contact',deHelp:'Kontaktformular und direkte Kontaktmöglichkeiten.',enHelp:'Enquiry form and direct contact options.'}
};

function removeLegacyCmsEditors(){
  $('.ff-copy-card')?.remove();
  $('#managedContentCard')?.remove();
}

function languageCard(lang,title,inner){
  return `<div class="ff-cms-language-card" data-language-card="${lang}"><div class="ff-cms-language-head"><span class="ff-language-badge">${lang==='de'?'DE':'EN'}</span><strong>${esc(title)}</strong></div>${inner}</div>`;
}

function visibilityCard(key,enabled){
  const lang=getLanguage()==='en'?'en':'de',meta=sectionMeta[key];
  return `<label class="ff-visibility-card" data-visibility-card="${key}" data-enabled="${enabled?'true':'false'}">
    <div class="ff-visibility-copy"><div class="ff-visibility-title"><strong>${esc(meta[lang])}</strong><span class="ff-visibility-status">${enabled?tr('Sichtbar','Visible'):tr('Ausgeblendet','Hidden')}</span></div><small>${esc(meta[lang+'Help'])}</small></div>
    <span class="ff-visibility-control"><input type="checkbox" data-section-visible="${key}" ${enabled?'checked':''}><span class="ff-switch-track"><span></span></span></span>
  </label>`;
}

function aboutSectionTemplate(section={},index=0){
  const number=String(index+1).padStart(2,'0');
  return `<article class="ff-about-admin-section" data-about-section="${index}">
    <div class="ff-cms-item-head"><div><span class="ff-item-number">${number}</span><strong>${tr('Über-uns-Abschnitt','About Us Section')}</strong></div></div>
    <div class="ff-cms-language-grid">
      ${languageCard('de','Deutsch',`<label>Überschrift</label><input data-about-heading-de value="${esc(section.heading_de||'')}"><label>Text</label><textarea data-about-body-de rows="11" placeholder="Absätze mit einer Leerzeile trennen">${esc(section.body_de||'')}</textarea>`)}
      ${languageCard('en','English',`<label>Heading</label><input data-about-heading-en value="${esc(section.heading_en||'')}"><label>Text</label><textarea data-about-body-en rows="11" placeholder="Separate paragraphs with a blank line">${esc(section.body_en||'')}</textarea>`)}
    </div>
  </article>`;
}

function faqItemTemplate(item={},index=0){
  const number=String(index+1).padStart(2,'0');
  return `<details class="ff-faq-v2-item" data-faq-item open>
    <summary><span><span class="ff-item-number">${number}</span><strong>${tr('FAQ-Eintrag','FAQ Item')} ${number}</strong><small>DE + EN</small></span><span class="ff-faq-summary-actions"><span>${tr('Bearbeiten','Edit')}</span></span></summary>
    <div class="ff-faq-v2-body">
      <div class="ff-cms-language-grid">
        ${languageCard('de','Deutsch',`<label>Frage</label><input data-faq-question-de value="${esc(item.question_de||'')}"><label>Antwort</label><textarea data-faq-answer-de rows="5">${esc(item.answer_de||'')}</textarea>`)}
        ${languageCard('en','English',`<label>Question</label><input data-faq-question-en value="${esc(item.question_en||'')}"><label>Answer</label><textarea data-faq-answer-en rows="5">${esc(item.answer_en||'')}</textarea>`)}
      </div>
      <div class="ff-faq-v2-actions"><button type="button" class="btn btn-secondary btn-small danger" data-remove-faq-v2>${tr('FAQ-Eintrag entfernen','Remove FAQ Item')}</button></div>
    </div>
  </details>`;
}

function ensureCmsV2(){
  const panel=$('[data-panel-view="site"]');if(!panel||$('#homepageCmsV2'))return;
  removeLegacyCmsEditors();
  const card=document.createElement('section');card.id='homepageCmsV2';card.className='admin-card ff-cms-v2';
  card.innerHTML=`
    <header class="ff-cms-v2-hero">
      <div><span class="admin-kicker">HOMEPAGE CMS</span><h2>${tr('Startseite verwalten','Manage Homepage')}</h2><p>${tr('Sichtbarkeit, Über uns und FAQ zentral und zweisprachig verwalten.','Manage section visibility, About Us and FAQ centrally in both languages.')}</p></div>
      <div class="ff-cms-v2-note"><strong>${tr('Änderungen werden live gespeichert','Changes publish live')}</strong><small>${tr('Deutsch und Englisch werden gemeinsam gespeichert.','German and English are saved together.')}</small></div>
    </header>
    <nav class="ff-cms-tabs" aria-label="Homepage CMS"><button type="button" class="active" data-cms-tab="visibility">${tr('Sichtbarkeit','Visibility')}</button><button type="button" data-cms-tab="about">${tr('Über uns','About Us')}</button><button type="button" data-cms-tab="faq">FAQ</button></nav>
    <div class="ff-cms-panels">
      <section class="ff-cms-panel active" data-cms-panel="visibility"><div class="ff-cms-panel-head"><div><h3>${tr('Welche Bereiche sollen sichtbar sein?','Which Sections Should Be Visible?')}</h3><p>${tr('Jeder Schalter zeigt eindeutig, ob der Bereich auf der öffentlichen Startseite sichtbar oder ausgeblendet ist.','Each switch clearly shows whether the section is visible or hidden on the public homepage.')}</p></div></div><div id="sectionVisibilityGridV2" class="ff-visibility-grid"></div></section>
      <section class="ff-cms-panel" data-cms-panel="about"><div class="ff-cms-panel-head"><div><h3>${tr('Über uns – Inhalt','About Us Content')}</h3><p>${tr('Die Geschichte wird in drei klaren Abschnitten gepflegt. Deutsch und Englisch stehen direkt nebeneinander.','The story is managed in three clear sections, with German and English side by side.')}</p></div></div><div class="ff-cms-language-grid ff-about-top-fields"></div><div id="aboutSectionsV2" class="ff-about-admin-list"></div></section>
      <section class="ff-cms-panel" data-cms-panel="faq"><div class="ff-cms-panel-head"><div><h3>${tr('FAQ verwalten','Manage FAQ')}</h3><p>${tr('Jeder neue FAQ-Eintrag enthält immer Felder für Deutsch und Englisch.','Every new FAQ item always includes fields for both German and English.')}</p></div><button type="button" id="addFaqItemV2" class="btn btn-secondary">+ ${tr('FAQ hinzufügen','Add FAQ')}</button></div><div class="ff-cms-language-grid ff-faq-header-fields"></div><div id="faqAdminItemsV2" class="ff-faq-v2-list"></div></section>
    </div>
    <footer class="ff-cms-savebar"><div><strong id="cmsV2State">${tr('Bereit','Ready')}</strong><small>${tr('Speichert Sichtbarkeit, Über uns und FAQ gemeinsam.','Saves visibility, About Us and FAQ together.')}</small></div><button type="button" id="saveCmsV2" class="btn btn-primary">${tr('Änderungen speichern','Save Changes')}</button></footer>`;
  const form=$('#siteForm');form?.insertAdjacentElement('afterend',card);
  $$('.ff-cms-tabs button',card).forEach(btn=>btn.onclick=()=>activateTab(btn.dataset.cmsTab));
  $('#addFaqItemV2')?.addEventListener('click',()=>addFaqV2());
  $('#saveCmsV2')?.addEventListener('click',saveCmsV2);
}

function activateTab(name){
  $$('.ff-cms-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.cmsTab===name));
  $$('.ff-cms-panel').forEach(p=>p.classList.toggle('active',p.dataset.cmsPanel===name));
}

function renderVisibility(){
  const host=$('#sectionVisibilityGridV2');if(!host)return;
  const values={...visibilityDefaults,...(cmsData?.section_visibility||{})};
  host.innerHTML=Object.keys(visibilityDefaults).map(key=>visibilityCard(key,values[key]!==false)).join('');
  $$('[data-section-visible]',host).forEach(input=>input.addEventListener('change',()=>{
    const card=input.closest('.ff-visibility-card'),status=$('.ff-visibility-status',card);card.dataset.enabled=String(input.checked);status.textContent=input.checked?tr('Sichtbar','Visible'):tr('Ausgeblendet','Hidden');
  }));
}

function renderAbout(){
  const top=$('.ff-about-top-fields');if(!top)return;
  top.innerHTML=languageCard('de','Deutsch',`<label>Bereichslabel</label><input data-cms-field="about_eyebrow" value="${esc(cmsData?.about_eyebrow||'Über uns')}"><label>Hauptüberschrift</label><input data-cms-field="about_title" value="${esc(cmsData?.about_title||'Von einer Idee zu FrankiFlow')}">`)+languageCard('en','English',`<label>Section Label</label><input data-cms-field="about_eyebrow_en" value="${esc(cmsData?.about_eyebrow_en||'About Us')}"><label>Main Heading</label><input data-cms-field="about_title_en" value="${esc(cmsData?.about_title_en||'From an Idea to FrankiFlow')}">`);
  const sections=Array.isArray(cmsData?.about_sections)?cmsData.about_sections:[];
  $('#aboutSectionsV2').innerHTML=sections.map(aboutSectionTemplate).join('');
}

function renderFaq(){
  const headers=$('.ff-faq-header-fields');if(!headers)return;
  headers.innerHTML=languageCard('de','Deutsch',`<label>Bereichslabel</label><input data-cms-field="faq_eyebrow" value="${esc(cmsData?.faq_eyebrow||'Häufige Fragen')}"><label>Titel</label><input data-cms-field="faq_title" value="${esc(cmsData?.faq_title||'Gebäudereinigung in Frankfurt: kurz beantwortet.')}"><label>Einleitung</label><textarea data-cms-field="faq_intro" rows="3">${esc(cmsData?.faq_intro||'')}</textarea>`)+languageCard('en','English',`<label>Section Label</label><input data-cms-field="faq_eyebrow_en" value="${esc(cmsData?.faq_eyebrow_en||'Frequently Asked Questions')}"><label>Title</label><input data-cms-field="faq_title_en" value="${esc(cmsData?.faq_title_en||'Cleaning in Frankfurt: Quick Answers.')}"><label>Introduction</label><textarea data-cms-field="faq_intro_en" rows="3">${esc(cmsData?.faq_intro_en||'')}</textarea>`);
  const items=Array.isArray(cmsData?.faq_items)?cmsData.faq_items:[];
  $('#faqAdminItemsV2').innerHTML=items.length?items.map(faqItemTemplate).join(''):`<div class="ff-cms-empty">${tr('Noch keine FAQ-Einträge. Fügen Sie den ersten Eintrag hinzu.','No FAQ Items Yet. Add the First Item.')}</div>`;
  bindFaqV2();
}

function bindFaqV2(){$$('[data-remove-faq-v2]').forEach(btn=>btn.onclick=()=>{btn.closest('[data-faq-item]')?.remove();renumberFaqV2()})}
function renumberFaqV2(){$$('[data-faq-item]').forEach((item,index)=>{const num=String(index+1).padStart(2,'0');$('.ff-item-number',item).textContent=num;const strong=$('summary strong',item);if(strong)strong.textContent=`${tr('FAQ-Eintrag','FAQ Item')} ${num}`})}
function addFaqV2(){const host=$('#faqAdminItemsV2');if(!host)return;$('.ff-cms-empty',host)?.remove();const count=$$('[data-faq-item]',host).length;host.insertAdjacentHTML('beforeend',faqItemTemplate({},count));bindFaqV2();host.lastElementChild?.scrollIntoView({behavior:'smooth',block:'center'})}

async function loadCmsV2(){
  const fields='section_visibility,about_eyebrow,about_title,about_eyebrow_en,about_title_en,about_sections,faq_eyebrow,faq_title,faq_intro,faq_eyebrow_en,faq_title_en,faq_intro_en,faq_items';
  const {data,error}=await supabase.from('frankiflow_site_settings').select(fields).eq('id',1).maybeSingle();
  if(error){$('#cmsV2State').textContent=`${tr('Fehler','Error')}: ${error.message}`;return}
  cmsData=data||{};renderVisibility();renderAbout();renderFaq();
}

function collectAboutSections(){return $$('.ff-about-admin-section').map(el=>({heading_de:$('[data-about-heading-de]',el)?.value.trim()||'',heading_en:$('[data-about-heading-en]',el)?.value.trim()||'',body_de:$('[data-about-body-de]',el)?.value.trim()||'',body_en:$('[data-about-body-en]',el)?.value.trim()||''}))}
function collectFaqItems(){return $$('[data-faq-item]').map(el=>({question_de:$('[data-faq-question-de]',el)?.value.trim()||'',answer_de:$('[data-faq-answer-de]',el)?.value.trim()||'',question_en:$('[data-faq-question-en]',el)?.value.trim()||'',answer_en:$('[data-faq-answer-en]',el)?.value.trim()||''}))}
function setState(message,isError=false){const state=$('#cmsV2State');if(!state)return;state.textContent=message;state.classList.toggle('error-text',isError)}

async function saveCmsV2(){
  const {data:{session}}=await supabase.auth.getSession();if(!session){setState(tr('Bitte erneut anmelden.','Please Sign In Again.'),true);return}
  const aboutSections=collectAboutSections(),faqItems=collectFaqItems();
  if(aboutSections.some(s=>!s.heading_de||!s.heading_en||!s.body_de||!s.body_en)){setState(tr('Bitte füllen Sie jeden Über-uns-Abschnitt auf Deutsch und Englisch vollständig aus.','Please complete every About Us section in both German and English.'),true);activateTab('about');return}
  if(faqItems.some(x=>!x.question_de||!x.answer_de||!x.question_en||!x.answer_en)){setState(tr('Jeder FAQ-Eintrag benötigt Frage und Antwort auf Deutsch und Englisch.','Every FAQ item needs a question and answer in both German and English.'),true);activateTab('faq');return}
  setState(tr('Wird gespeichert …','Saving …'));
  const payload={section_visibility:{},about_sections:aboutSections,faq_items:faqItems,updated_at:new Date().toISOString(),updated_by:session.user.id};
  $$('[data-section-visible]').forEach(el=>payload.section_visibility[el.dataset.sectionVisible]=el.checked);
  $$('[data-cms-field]').forEach(el=>payload[el.dataset.cmsField]=el.value.trim());
  const {error}=await supabase.from('frankiflow_site_settings').update(payload).eq('id',1);
  if(error){setState(`${tr('Fehler','Error')}: ${error.message}`,true);return}
  cmsData={...cmsData,...payload};setState(tr('Gespeichert ✓','Saved ✓'));setTimeout(()=>setState(tr('Bereit','Ready')),2200);
}

removeLegacyCmsEditors();ensureCmsV2();await loadCmsV2();
window.addEventListener('frankiflow:language',()=>{if(!cmsData)return;renderVisibility();renderAbout();renderFaq()});
