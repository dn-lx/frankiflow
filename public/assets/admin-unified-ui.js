import { getLanguage, tr } from './site-i18n.js';

const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];

const meta={
  dashboard:{kicker:'DASHBOARD',de:'Übersicht',en:'Overview',deDesc:'Wichtige Kennzahlen und der aktuelle Status Ihrer FrankiFlow-Verwaltung.',enDesc:'Key figures and the current status of your FrankiFlow administration.',deNote:'Alles auf einen Blick',enNote:'Everything at a glance'},
  site:{kicker:'WEBSITE',de:'Website & Inhalte',en:'Website & Content',deDesc:'Öffentliche Texte, Kontaktangaben sowie Homepage-Inhalte zentral verwalten.',enDesc:'Manage public copy, contact details and homepage content centrally.',deNote:'DE + EN gemeinsam',enNote:'DE + EN together'},
  photos:{kicker:'MEDIEN',de:'Fotos & Bilder',en:'Photos & Media',deDesc:'Website-Bilder hochladen, zuordnen, als Hero verwenden oder entfernen.',enDesc:'Upload, assign, use as hero or remove website images.',deNote:'Supabase Storage',enNote:'Supabase Storage'},
  leads:{kicker:'ANFRAGEN',de:'Kundenanfragen',en:'Customer Enquiries',deDesc:'Neue Anfragen prüfen, Status verfolgen und Kontaktdaten schnell erfassen.',enDesc:'Review new enquiries, track status and access contact details quickly.',deNote:'Operative Übersicht',enNote:'Operational overview'},
  config:{kicker:'SYSTEM',de:'Import & Export',en:'Import & Export',deDesc:'Website- und Preis-Konfiguration sichern oder kontrolliert wieder einspielen.',enDesc:'Back up or restore website and pricing configuration in a controlled way.',deNote:'Keine Geheimschlüssel',enNote:'No secret keys'}
};

function heroHtml(m){const en=getLanguage()==='en';return `<header class="ff-panel-hero"><div><span class="admin-kicker">${m.kicker}</span><h2>${en?m.en:m.de}</h2><p>${en?m.enDesc:m.deDesc}</p></div><div class="ff-panel-hero-note"><strong>${en?m.enNote:m.deNote}</strong><small>${tr('FrankiFlow Admin','FrankiFlow Admin')}</small></div></header>`}

function injectPanelHeroes(){
  for(const [key,m] of Object.entries(meta)){
    const panel=$(`[data-panel-view="${key}"]`);if(!panel||$('.ff-panel-hero',panel))continue;
    panel.insertAdjacentHTML('afterbegin',heroHtml(m));
  }
  $$('[data-panel-view="pricing"] .pricing-settings-head,[data-panel-view="checklists"] .pricing-settings-head').forEach(el=>el.classList.add('ff-unified-head'));
}

function upgradeSiteForm(){
  const form=$('#siteForm');if(!form||form.classList.contains('ff-admin-surface'))return;
  form.classList.add('ff-admin-surface');
  const firstH2=$('h2',form),firstP=$('p.muted',form);
  if(firstH2){
    const head=document.createElement('div');head.className='ff-site-form-head';
    const text=document.createElement('div');text.append(firstH2);if(firstP)text.append(firstP);head.append(text);form.prepend(head);
  }
  const nodes=[...form.children].filter(x=>x.classList?.contains('admin-subhead'));
  if(!nodes.length)return;
  const body=document.createElement('div');body.className='ff-site-form-body';
  let current=null;
  for(const child of [...form.children]){
    if(child.classList?.contains('ff-site-form-head'))continue;
    if(child.classList?.contains('admin-subhead')){
      current=document.createElement('section');current.className='ff-site-group';body.append(current);current.append(child);continue;
    }
    (current||body).append(child);
  }
  form.append(body);
}

function upgradePhotos(){
  const panel=$('[data-panel-view="photos"]');if(!panel||$('.ff-photo-layout',panel))return;
  const cards=$$('.admin-card',panel);if(cards.length<2)return;
  const layout=document.createElement('div');layout.className='ff-photo-layout';
  cards[0].classList.add('ff-photo-upload-card');cards[1].classList.add('ff-photo-library-card');
  cards[0].before(layout);cards.forEach(c=>layout.append(c));
}

function upgradeConfig(){
  const panel=$('[data-panel-view="config"]');if(!panel||$('.ff-config-grid',panel))return;
  const cards=$$('.admin-card',panel);if(!cards.length)return;
  const grid=document.createElement('div');grid.className='ff-config-grid';cards[0].before(grid);cards.forEach(c=>grid.append(c));
}

function decorateCards(){
  $$('[data-panel-view="dashboard"] .admin-card,[data-panel-view="photos"] .admin-card,[data-panel-view="leads"] .admin-card,[data-panel-view="config"] .admin-card').forEach(c=>c.classList.add('ff-admin-surface'));
}

function refreshLanguage(){
  $$('.ff-panel-hero').forEach(x=>x.remove());
  injectPanelHeroes();
}

function init(){
  injectPanelHeroes();upgradeSiteForm();upgradePhotos();upgradeConfig();decorateCards();
  window.addEventListener('frankiflow:language',()=>setTimeout(refreshLanguage,0));
}

init();
