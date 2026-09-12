export * from './site-i18n-base.js';
import { getLanguage, initI18n as baseInitI18n, translateDom as baseTranslateDom, translations } from './site-i18n-base.js';

/* Remove legacy payment-provider copy from the active translation catalogue. */
for(const [key,value] of Object.entries(translations)){
  if(/stripe|zahlung|payment|checkout|paid links|bezahlte links/i.test(`${key} ${value}`)) delete translations[key];
}

/* Extra pairs cover dynamic/short labels that previously leaked untranslated keywords. */
Object.assign(translations,{
  'Neukunde':'New-Customer',
  'Neukunden':'New Customers',
  'Neukundenangebot':'New-Customer Offer',
  'Neukundenangebot aktiv':'New-Customer Offer Enabled',
  'Neukundenrabatt':'New-Customer Discount',
  'Foto-Zielseite':'Photo Target Page',
  'Startseite – Galerie':'Homepage – Gallery',
  'Startseite – Hero':'Homepage – Hero',
  'Grundreinigungsseite':'Deep-Cleaning Page',
  'Objektbetreuungsseite':'Property-Care Page',
  'Website-Texte & Übersetzungen':'Website Copy & Translations',
  'Deutsch':'German',
  'Englisch':'English',
  'Text suchen':'Search Copy',
  'Alle Übersetzungen speichern':'Save All Translations',
  'Hero-Titelgröße':'Hero Title Size',
  'Website, Fotos, Preise und Anfragen verwalten.':'Manage Website, Photos, Pricing and Enquiries.',
  'Diese Website verarbeitet personenbezogene Daten nur soweit dies für den Betrieb der Website und die Bearbeitung von Anfragen erforderlich ist.':'This Website processes personal Data only as far as necessary to operate the Website and handle Enquiries.',
  '5. Rechtsgrundlagen und Speicherdauer':'5. Legal Basis and Retention',
  '6. Ihre Rechte':'6. Your Rights',
  '7. Kontakt zum Datenschutz':'7. Privacy Contact',
  'Importiert nur bekannte Website-/Preisfelder. Vorhandene Fotos und Kundendaten werden nicht gelöscht.':'Imports only known Website/Pricing Fields. Existing Photos and Customer Data are not deleted.',
  'Diese Vorlage muss vor dem endgültigen Launch anhand der tatsächlich aktivierten Netlify-, Supabase-, Analyse-, Cookie- und sonstigen Drittanbieterfunktionen rechtlich geprüft und vervollständigt werden.':'Before final Launch, this Template must be legally reviewed and completed based on the Netlify, Supabase, Analytics, Cookie and other Third-Party Features actually enabled.',
  'Über uns':'About Us',
  'Bereiche, Über uns & FAQ':'Sections, About Us & FAQ',
  'Bereiche sichtbar / ausblenden':'Show / Hide Sections',
  'FAQ verwalten':'Manage FAQ',
  'FAQ hinzufügen':'Add FAQ',
  'FAQ-Eintrag':'FAQ Item',
  'Entfernen':'Remove',
  'Frage':'Question',
  'Antwort':'Answer',
  'Startseiten-Inhalte speichern':'Save Homepage Content'
});

const uiSelectors=[
  'h1','h2','h3','h4','.eyebrow','.hero-kicker','.nav-links a','.nav-actions a','.btn','.trust-row span','.status-badge',
  '.dashboard-price-card>span','.dashboard-price-card strong','.dashboard-price-card a','.dashboard-services b','.dashboard-services small',
  '.floating-card strong','.floating-card small','.signal-grid span','.service-tags span','.card-link','.text-arrow','summary','.footer-links a',
  '.footer-cta span','.footer-cta a','.whatsapp-pill','.form-title span','.form-title small','.field>label','.admin-nav button','.admin-top .btn',
  '.admin-card h2','.admin-card h3','.pricing-section-title','.admin-kicker','.ff-section-toggle strong','.ff-faq-item-head strong'
].join(',');

function titleCaseWords(text){
  return text.replace(/(^|[\s/–—·(])([a-zà-öø-ÿ])/giu,(m,prefix,letter)=>prefix+letter.toUpperCase());
}

export function normalizeEnglishUi(root=document,lang=getLanguage()){
  if(lang!=='en'||!root)return;
  const targets=[];
  if(root.nodeType===1&&root.matches?.(uiSelectors))targets.push(root);
  root.querySelectorAll?.(uiSelectors).forEach(el=>targets.push(el));
  for(const el of targets){
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>{
      if(!n.nodeValue.trim()||n.parentElement?.closest('script,style,input,textarea,select,option'))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{n.nodeValue=titleCaseWords(n.nodeValue)});
  }
}

export function translateDom(root=document,lang=getLanguage()){
  baseTranslateDom(root,lang);
  normalizeEnglishUi(root,lang);
}

export function initI18n(){
  baseInitI18n();
  normalizeEnglishUi(document,getLanguage());
  window.addEventListener('frankiflow:language',e=>setTimeout(()=>normalizeEnglishUi(document,e.detail.lang),0));
}
