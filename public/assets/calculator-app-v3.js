import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { applyChecklistRows, localizeChecklistSections } from './checklists.js';
import { calculatePricing } from './calculator-engine.js';

const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const clone=v=>JSON.parse(JSON.stringify(v));
const round2=v=>Math.round((Number(v||0)+Number.EPSILON)*100)/100;

const FALLBACK={
  contract_settings:{months:[1,3,6,9,12,24],base_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}},
  deep_cleaning_settings:{label:'Grundreinigung',enabled:true,surcharge_pct:30},
  equipment_settings:{base:5,enabled:true,gradient_per_sqm:.01},
  frequency_settings:{options:[
    {key:'once',label:'Einmalig',visits_per_month:1},{key:'monthly',label:'1× pro Monat',visits_per_month:1},
    {key:'biweekly',label:'Alle 2 Wochen',visits_per_month:2},{key:'weekly1',label:'1× pro Woche',visits_per_month:4},
    {key:'weekly2',label:'2× pro Woche',visits_per_month:8},{key:'weekly3',label:'3× pro Woche',visits_per_month:12},
    {key:'weekly4',label:'4× pro Woche',visits_per_month:16},{key:'weekly5',label:'5× pro Woche',visits_per_month:20}
  ]},
  promotion_settings:{label:'25% Neukundenrabatt im ersten Monat',enabled:true,first_month_discount_pct:25},
  service_settings:{services:{
    buero:{label:'Büroreinigung',base_1m:24,enabled:true},
    airbnb:{label:'Ferienwohnung / Airbnb',base_1m:26,enabled:true},
    wohnung:{label:'Wohnungsreinigung',base_1m:30,enabled:true},
    treppenhaus:{label:'Treppenhausreinigung',base_1m:24,enabled:true}
  },gradient_per_sqm:.2304,minimum_cleaning_charge:30},
  vat_settings:{label:'MwSt. zum Rechnungsbetrag hinzufügen',enabled:true,rate_pct:19,customer_pays_default:false},
  window_settings:{base:5,enabled:true,minimum:35,gradient_per_sqm:3,contract_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}}
};

const TEXT={
  de:{website:'Zur Website',eyebrow:'FRANKIFLOW PREISRECHNER',title:'Ihr Reinigungspreis. <em>Transparent berechnet.</em>',intro:'Wählen Sie Leistung, Fläche und Häufigkeit. Sie erhalten sofort einen unverbindlichen Richtpreis – ohne Registrierung.',instant:'Sofortiger Richtpreis',noReg:'Keine Registrierung',frankfurt:'Frankfurt & Umgebung',serviceTitle:'Welche Reinigung benötigen Sie?',serviceHint:'Wählen Sie die Leistung, die am besten passt.',scopeTitle:'Objekt & Umfang',scopeHint:'Fläche und Reinigungsrhythmus bestimmen den Richtpreis.',area:'Reinigungsfläche',areaHelp:'Bei reiner Fensterreinigung kann die Fläche 0 sein.',frequency:'Häufigkeit',contract:'Vertragslaufzeit',newCustomer:'Neukunde?',extrasTitle:'Optionale Leistungen',extrasHint:'Nur auswählen, wenn Sie diese Leistungen benötigen.',equipment:'Reinigungsmittel & Equipment',equipmentHint:'FrankiFlow stellt benötigte Materialien.',vat:'MwSt. hinzufügen',windows:'Fensterreinigung',windowsHint:'Optional nach Glasfläche.',glassArea:'Glasfläche',quoteTitle:'Angebot vorbereiten',quoteHint:'Optional: Tragen Sie Ihre Daten ein, wenn Sie das Ergebnis als Angebot drucken möchten.',name:'Name',company:'Firma / Objekt',phone:'Telefon',address:'Adresse / Leistungsort',serviceDate:'Leistungsdatum / Zeitraum',yourPrice:'IHR RICHTPREIS',perVisit:'Preis pro Termin',perMonth:'Preis pro Monat',firstMonth:'1. Monat als Neukunde',overview:'Übersicht',printQuote:'Angebot drucken / PDF',printInvoice:'Rechnung erstellen',request:'Mit Angebot kontaktieren',disclaimer:'Unverbindlicher Richtpreis. Der endgültige Preis kann nach Besichtigung bzw. genauer Leistungsabstimmung abweichen.',vatIncluded:'MwSt. enthalten',vatNotIncluded:'MwSt. nicht enthalten',discount:'Rabatt berücksichtigt',month:'Monat',months:'Monate',visitsMonth:'Termine/Monat',floorCleaning:'Allgemeine Reinigung',windowCleaning:'Fensterreinigung',deep:'Grundreinigung',materials:'Equipment & Reinigungsmittel',quote:'ANGEBOT',invoice:'RECHNUNG'},
  en:{website:'Back to website',eyebrow:'FRANKIFLOW PRICE CALCULATOR',title:'Your cleaning price. <em>Calculated transparently.</em>',intro:'Choose the service, area and frequency. You receive an instant non-binding estimate – no registration required.',instant:'Instant estimate',noReg:'No registration',frankfurt:'Frankfurt & surroundings',serviceTitle:'Which cleaning service do you need?',serviceHint:'Choose the service that best matches your property.',scopeTitle:'Property & scope',scopeHint:'Area and cleaning frequency determine the estimate.',area:'Floor area',areaHelp:'For window-only cleaning, floor area may be 0.',frequency:'Frequency',contract:'Contract duration',newCustomer:'New customer?',extrasTitle:'Optional services',extrasHint:'Select only the extras you need.',equipment:'Cleaning supplies & equipment',equipmentHint:'FrankiFlow provides the required materials.',vat:'Add VAT',windows:'Window cleaning',windowsHint:'Optional, calculated by glass area.',glassArea:'Glass area',quoteTitle:'Prepare a quotation',quoteHint:'Optional: enter your details to print the result as a quotation.',name:'Name',company:'Company / property',phone:'Phone',address:'Address / service location',serviceDate:'Service date / period',yourPrice:'YOUR ESTIMATE',perVisit:'Price per visit',perMonth:'Price per month',firstMonth:'1st month as new customer',overview:'Overview',printQuote:'Print quotation / PDF',printInvoice:'Create invoice',request:'Contact with the Quotation',disclaimer:'Non-binding estimate. The final price may vary after inspection or detailed agreement of the service scope.',vatIncluded:'VAT included',vatNotIncluded:'VAT not included',discount:'discount applied',month:'month',months:'months',visitsMonth:'visits/month',floorCleaning:'General cleaning',windowCleaning:'Window cleaning',deep:'Deep cleaning',materials:'Equipment & cleaning supplies',quote:'QUOTATION',invoice:'INVOICE'}
};
const SERVICE_EN={buero:'Office cleaning',wohnung:'Home cleaning',airbnb:'Holiday rental / Airbnb',treppenhaus:'Stairwell cleaning',fenster:'Window cleaning'};
const SERVICE_HINTS={de:{buero:'Büro, Praxis & Gewerbe',wohnung:'Wohnung & Privathaushalt',airbnb:'Turnover & Ferienunterkunft',treppenhaus:'Mehrfamilienhaus & Gemeinschaftsfläche',fenster:'Nur Fenster & Glasflächen'},en:{buero:'Office, practice & commercial',wohnung:'Apartment & private home',airbnb:'Turnover & holiday rental',treppenhaus:'Apartment building & common areas',fenster:'Windows & glass only'}};
const FREQ_EN={once:'One-time',monthly:'1× per month',biweekly:'Every 2 weeks',weekly1:'1× per week',weekly2:'2× per week',weekly3:'3× per week',weekly4:'4× per week',weekly5:'5× per week'};

let cfg=clone(FALLBACK);
let lang=['de','en'].includes(localStorage.getItem('frankiflow-lang'))?localStorage.getItem('frankiflow-lang'):(localStorage.getItem('ff-price-lang')==='en'?'en':'de');
let calc=null;
let isAdmin=false;

const t=k=>TEXT[lang]?.[k]||k;
const money=v=>new Intl.NumberFormat(lang==='de'?'de-DE':'en-IE',{style:'currency',currency:'EUR'}).format(Number(v)||0);
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));

function checklistText(){return lang==='de'
  ?{title:'Leistungscheckliste',hint:'Sehen Sie, welche Standardleistungen für die gewählte Reinigung enthalten sind.',view:'Checkliste ansehen',hide:'Checkliste schließen',include:'Checkliste dem Angebot beifügen',includeHint:'Die Leistungscheckliste wird als zusätzliche PDF-Seite(n) gedruckt.',deep:'Erweiterte Grundreinigung',windows:'Fensterreinigung',selected:'Ausgewählte Reinigung',optional:'Nur nach ausdrücklicher Vereinbarung',scope:'Leistungsumfang',page:'LEISTUNGSCHECKLISTE',note:'Die Checkliste beschreibt den Standard-Leistungsumfang. Maßgeblich sind die konkret vereinbarten Leistungen und die Gegebenheiten vor Ort.'}
  :{title:'Service checklist',hint:'Review the standard tasks included for the selected cleaning service.',view:'View checklist',hide:'Close checklist',include:'Attach checklist to quotation',includeHint:'The service checklist will be printed as additional PDF page(s).',deep:'Extended deep cleaning',windows:'Window cleaning',selected:'Selected cleaning',optional:'Only when specifically agreed',scope:'Service scope',page:'SERVICE CHECKLIST',note:'The checklist describes the standard service scope. The specifically agreed services and on-site conditions remain decisive.'};}

function currentServiceKey(){return $('input[name="serviceKey"]:checked')?.value||'buero'}
function frequencies(){const opts=cfg.frequency_settings?.options;return Array.isArray(opts)&&opts.length?opts:FALLBACK.frequency_settings.options}
function contractMonths(){const m=cfg.contract_settings?.months;return Array.isArray(m)&&m.length?m:FALLBACK.contract_settings.months}

function renderServices(){
  const host=$('#serviceOptions');if(!host)return;
  const previous=currentServiceKey();
  const entries=Object.entries(cfg.service_settings?.services||{}).filter(([,v])=>v?.enabled!==false);
  if(cfg.window_settings?.enabled!==false)entries.push(['fenster',{label:'Fensterreinigung',enabled:true}]);
  const selected=entries.some(([k])=>k===previous)?previous:(entries[0]?.[0]||'buero');
  host.innerHTML=entries.map(([key,v],i)=>`<label class="service-choice ${key==='fenster'?'service-window-choice ':''}${key===selected?'active':''}"><input type="radio" name="serviceKey" value="${key}" ${key===selected?'checked':''}><span class="choice-icon">${String(i+1).padStart(2,'0')}</span><span><strong>${escapeHtml(lang==='en'?(SERVICE_EN[key]||v.label):v.label)}</strong><small>${escapeHtml(SERVICE_HINTS[lang][key]||'')}</small></span></label>`).join('');
}

function renderSelects(){
  const f=$('#frequency'),c=$('#contractMonths'),n=$('#newCustomer');
  if(f){const prev=f.value||'weekly1';const opts=frequencies();f.innerHTML=opts.map(o=>`<option value="${escapeHtml(o.key)}">${escapeHtml(lang==='en'?(FREQ_EN[o.key]||o.label):o.label)}</option>`).join('');f.value=opts.some(o=>o.key===prev)?prev:(opts.find(o=>o.key==='weekly1')?.key||opts[0]?.key||'');}
  if(c){const prev=c.value||'1';const ms=contractMonths();c.innerHTML=ms.map(m=>`<option value="${m}">${m} ${Number(m)===1?t('month'):t('months')}</option>`).join('');c.value=ms.map(String).includes(String(prev))?String(prev):String(ms[0]||1);}
  if(n){const prev=n.value||'yes';n.innerHTML=lang==='de'?'<option value="yes">Ja</option><option value="no">Nein</option>':'<option value="yes">Yes</option><option value="no">No</option>';n.value=prev==='no'?'no':'yes';}
}

function applyLanguage(){
  document.documentElement.lang=lang;localStorage.setItem('frankiflow-lang',lang);localStorage.setItem('ff-price-lang',lang);
  $$('.language-switch [data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
  $$('[data-i18n]').forEach(el=>{const value=t(el.dataset.i18n);if(String(value).includes('<em>'))el.innerHTML=value;else el.textContent=value});
  document.title=lang==='de'?'FrankiFlow Preisrechner | Reinigung in Frankfurt':'FrankiFlow Price Calculator | Cleaning in Frankfurt';
  const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=lang==='de'?'Berechnen Sie Ihren unverbindlichen Richtpreis für Büro-, Wohnungs-, Airbnb-, Treppenhaus- oder Fensterreinigung bei FrankiFlow.':'Calculate a non-binding estimate for office, home, Airbnb, stairwell or window cleaning with FrankiFlow.';
  const placeholders=lang==='de'?{customerName:'Max Mustermann',customerCompany:'optional',customerEmail:'name@beispiel.de',customerPhone:'+49 …',customerAddress:'Straße, PLZ, Ort'}:{customerName:'John Smith',customerCompany:'optional',customerEmail:'name@example.com',customerPhone:'+49 …',customerAddress:'Street, postcode, city'};
  Object.entries(placeholders).forEach(([id,v])=>{const el=$('#'+id);if(el)el.placeholder=v});
  renderServices();renderSelects();updateDynamicLabels();syncRequestDialogLanguage();recalculate();updateChecklistUi();
}

function updateDynamicLabels(){
  if($('#deepLabel'))$('#deepLabel').textContent=lang==='en'?t('deep'):(cfg.deep_cleaning_settings?.label||'Grundreinigung');
  if($('#deepHint'))$('#deepHint').textContent=lang==='de'?'Intensivere Reinigung des gesamten Bereichs.':'Intensive cleaning of the full area.';
  if($('#vatHint'))$('#vatHint').textContent=`${Number(cfg.vat_settings?.rate_pct||19)}% ${lang==='de'?'MwSt.':'VAT'}`;
  $('#vatWrap')?.classList.toggle('hidden',cfg.vat_settings?.enabled===false);
  $('#windowWrap')?.classList.toggle('hidden',cfg.window_settings?.enabled===false||currentServiceKey()==='fenster');
  const promo=cfg.promotion_settings||{};if($('#promoHint'))$('#promoHint').textContent=promo.enabled?`${Number(promo.first_month_discount_pct||0)}% ${lang==='de'?'Rabatt im ersten Monat':'discount in first month'}`:(lang==='de'?'Kein Neukundenrabatt aktiv':'No new-customer discount active');
}

function updateServiceMode(){
  const windowOnly=currentServiceKey()==='fenster';
  $('#areaFieldWrap')?.classList.toggle('hidden',windowOnly);
  $('#deepWrap')?.classList.toggle('hidden',windowOnly||cfg.deep_cleaning_settings?.enabled===false);
  $('#equipmentWrap')?.classList.toggle('hidden',windowOnly||cfg.equipment_settings?.enabled===false);
  $('#windowWrap')?.classList.toggle('hidden',windowOnly||cfg.window_settings?.enabled===false);
  if(windowOnly){if($('#deepCleaning'))$('#deepCleaning').checked=false;if($('#equipment'))$('#equipment').checked=false;}
  const selected=windowOnly||!!$('#windowCleaning')?.checked;
  const area=$('#windowAreaWrap'),primary=$('#windowPrimarySlot'),extra=$('#windowExtraSlot');
  if(area&&primary&&extra){const target=windowOnly?primary:extra;if(area.parentElement!==target)target.append(area);primary.classList.toggle('hidden',!windowOnly);area.classList.toggle('hidden',!selected);}
  $$('.service-choice').forEach(label=>label.classList.toggle('active',!!label.querySelector('input')?.checked));
}

function formState(){
  const opts=frequencies();const freq=opts.find(o=>o.key===$('#frequency')?.value)||opts[0];
  const serviceKey=currentServiceKey(),windowOnly=serviceKey==='fenster';
  return {serviceKey,windowOnly,area:windowOnly?0:Math.max(0,Number($('#areaSqm')?.value)||0),freq,months:Math.max(1,Number($('#contractMonths')?.value)||1),newCustomer:($('#newCustomer')?.value||'yes')==='yes',deep:!windowOnly&&!!$('#deepCleaning')?.checked,equipment:!windowOnly&&!!$('#equipment')?.checked,vat:!!$('#includeVat')?.checked,windows:windowOnly||!!$('#windowCleaning')?.checked,windowArea:Math.max(0,Number($('#windowSqm')?.value)||0)};
}

function localizedServiceLabel(result){return lang==='en'?(SERVICE_EN[result.serviceKey]||result.service?.label||result.serviceKey):(result.service?.label||result.serviceKey)}

function summaryRows(result){
  const visitWord=lang==='de'?'Termin':'visit';
  const rows=[];
  rows.push([lang==='de'?'Leistung':'Service',localizedServiceLabel(result)]);
  rows.push([lang==='de'?'Häufigkeit':'Frequency',`${result.visits} ${t('visitsMonth')}`]);
  if(!result.windowOnly&&result.floorVisit>0)rows.push([lang==='de'?'Reinigung / Termin':'Cleaning / visit',money(result.floorVisit)]);
  if(result.equipmentVisit>0)rows.push([lang==='de'?'Equipment / Termin':'Equipment / visit',money(result.equipmentVisit)]);
  if(result.windowCharge>0)rows.push([`${t('windowCleaning')} / ${visitWord}`,`${money(result.windowCharge)} · ${result.windowArea} m²`]);
  if(result.windowReductionPct>0&&result.windowCharge>0)rows.push([lang==='de'?'Fenster-Laufzeitvorteil':'Window contract saving',`−${result.windowReductionPct}%`]);
  if(result.reductionPct>0&&!result.windowOnly)rows.push([lang==='de'?'Laufzeitvorteil Reinigung':'Cleaning contract saving',`−${result.reductionPct}%`]);
  rows.push([lang==='de'?'Gesamt / Termin':'Total / visit',money(result.visitTotal)]);
  rows.push([lang==='de'?'Vertragslaufzeit':'Contract duration',`${result.months} ${result.months===1?t('month'):t('months')}`]);
  return rows;
}

function renderSummary(result){
  calc={...result,serviceLabel:localizedServiceLabel(result)};
  $('#visitPrice').textContent=money(result.visitTotal);$('#monthlyPrice').textContent=money(result.monthly);$('#firstMonthPrice').textContent=money(result.firstMonth);
  $('#vatStatus').textContent=result.vatRate?t('vatIncluded'):t('vatNotIncluded');$('#promotionBox')?.classList.toggle('hidden',!result.promoPct);$('#discountLabel').textContent=`${result.promoPct}% ${t('discount')}`;
  if($('#contractSaving'))$('#contractSaving').textContent=result.reductionPct?`${result.reductionPct}% ${lang==='de'?'Vorteil auf den Basisanteil':'saving on the base component'}`:'';
  $('#breakdownRows').innerHTML=summaryRows(result).map(([a,b])=>`<div class="breakdown-row"><span>${escapeHtml(a)}</span><b>${escapeHtml(b)}</b></div>`).join('');
  renderChecklistPreview();
  document.dispatchEvent(new CustomEvent('frankiflow:calculator-updated',{detail:calc}));
}

function recalculate(){
  try{updateServiceMode();renderSummary(calculatePricing(cfg,formState()));}
  catch(error){console.error('FrankiFlow calculator error',error);$('#breakdownRows').innerHTML=`<div class="breakdown-row"><span>${lang==='de'?'Berechnung konnte nicht aktualisiert werden.':'Calculation could not be updated.'}</span></div>`;}
}

function checklistGroups(){
  if(!calc)return[];const groups=[];const u=checklistText();
  if(calc.windowOnly){const sections=localizeChecklistSections('windows',lang);if(sections.length)groups.push({key:'windows',label:u.windows,sections});return groups;}
  const base=localizeChecklistSections(calc.serviceKey,lang);if(base.length)groups.push({key:calc.serviceKey,label:calc.serviceLabel,sections:base});
  if(calc.deep){const deep=localizeChecklistSections('deep',lang);if(deep.length)groups.push({key:'deep',label:u.deep,sections:deep});}
  if(calc.windows){const windows=localizeChecklistSections('windows',lang);if(windows.length)groups.push({key:'windows',label:u.windows,sections:windows});}
  return groups;
}

function checklistSectionHtml(section,screen=true){
  const u=checklistText();return `<section class="${screen?'checklist-screen-section':'print-checklist-section'} ${section.optional?'optional-section':''}"><h4>${escapeHtml(section.title)}</h4>${section.optional?`<div class="${screen?'checklist-optional-label':'checklist-print-optional'}">${escapeHtml(u.optional)}</div>`:''}<div class="${screen?'checklist-screen-items':'print-checklist-items'}">${section.items.map(item=>`<div class="${screen?'checklist-screen-item':'print-checklist-item'}"><span class="check-symbol ${section.optional?'optional':'included'}" aria-hidden="true"></span><em>${escapeHtml(item)}</em></div>`).join('')}</div></section>`;
}

function renderChecklistPreview(){
  const preview=$('#checklistPreview');if(!preview||!calc)return;const u=checklistText(),groups=checklistGroups();
  const selected=[calc.serviceLabel,calc.deep?u.deep:'',calc.windows&&!calc.windowOnly?u.windows:''].filter(Boolean).join(' · ');
  preview.innerHTML=groups.length?`<div class="checklist-preview-head"><div><span>${escapeHtml(u.selected)}</span><strong>${escapeHtml(selected)}</strong></div></div>${groups.map(g=>`<div class="checklist-screen-group"><h3>${escapeHtml(g.label)}</h3>${g.sections.map(s=>checklistSectionHtml(s,true)).join('')}</div>`).join('')}<p class="checklist-scope-note">${escapeHtml(u.note)}</p>`:`<p class="checklist-scope-note">${lang==='de'?'Für diese Auswahl ist derzeit keine Checkliste verfügbar.':'No checklist is currently available for this selection.'}</p>`;
}

function updateChecklistUi(){
  const u=checklistText();if($('#checklistTitle'))$('#checklistTitle').textContent=u.title;if($('#checklistHint'))$('#checklistHint').textContent=u.hint;if($('#includeChecklistLabel'))$('#includeChecklistLabel').textContent=u.include;if($('#includeChecklistHint'))$('#includeChecklistHint').textContent=u.includeHint;
  const preview=$('#checklistPreview'),button=$('#viewChecklist');if(button)button.textContent=preview&&!preview.classList.contains('hidden')?u.hide:u.view;renderChecklistPreview();
}

function toggleChecklist(){const preview=$('#checklistPreview');if(!preview)return;preview.classList.toggle('hidden');updateChecklistUi();if(!preview.classList.contains('hidden'))preview.scrollIntoView({behavior:'smooth',block:'nearest'});}

function companyFooter(tax=''){return `<footer class="print-company-footer"><div class="print-footer-title">${lang==='de'?'FrankiFlow Gebäudereinigung &amp; Objektbetreuung':'FrankiFlow Building Cleaning &amp; Property Services'}</div><div class="print-footer-founder">Inura Devasurendra · ${lang==='de'?'Gründer':'Founder'}</div><div class="print-company-grid"><div><span>${lang==='de'?'Telefon':'Phone'}</span><strong>+49 176 62493041</strong></div><div><span>E-Mail</span><strong>info@frankiflow.de</strong></div><div><span>Website</span><strong>www.frankiflow.de</strong></div><div><span>${lang==='de'?'Steuernummer':'Tax no.'}</span><strong>014/811/68462</strong></div><div><span>${lang==='de'?'Betriebsnummer':'Employer no.'}</span><strong>69471447</strong></div><div><span>W-IdNr.</span><strong>DE464605581</strong></div></div>${tax?`<div class="print-tax-note">${escapeHtml(tax)}</div>`:''}</footer>`;}

function checklistPrintPages(primary,secondary){const u=checklistText(),groups=checklistGroups();return groups.map((g,i)=>`<div class="print-checklist-document"><div class="print-topline"></div><header class="print-checklist-head"><div class="print-brand"><img src="/assets/frankiflow-logo.png" alt="FrankiFlow"><p>${lang==='de'?'Gebäudereinigung &amp; Objektbetreuung · Frankfurt am Main & Umgebung':'Building Cleaning &amp; Property Services · Frankfurt am Main & Surroundings'}</p></div><div class="print-checklist-titlebox"><span>${u.page}</span><strong>${escapeHtml(g.label)}</strong><small>${i+1} / ${groups.length}</small></div></header><div class="print-divider"></div><section class="print-checklist-client"><div><span>${lang==='de'?'Kunde / Objekt':'Client / property'}</span><strong>${escapeHtml(primary)}</strong>${secondary?`<small>${secondary}</small>`:''}</div><div><span>${u.scope}</span><strong>${escapeHtml(g.label)}</strong></div></section><div class="print-checklist-grid">${g.sections.map(s=>checklistSectionHtml(s,false)).join('')}</div><div class="print-checklist-note">${escapeHtml(u.note)}</div>${companyFooter('')}</div>`).join('');}

async function waitForImages(root){const images=[...root.querySelectorAll('img')];await Promise.all(images.map(img=>img.complete&&img.naturalWidth?img.decode?.().catch(()=>{})||Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});setTimeout(resolve,2500)})));}

async function printDoc(kind='quote',billing=null,invoiceNumber=''){
  if(!calc)return;const invoice=kind==='invoice';const locale=lang==='de'?'de-DE':'en-GB';const today=new Date().toLocaleDateString(locale);const name=$('#customerName')?.value.trim()||'—',company=$('#customerCompany')?.value.trim()||'',email=$('#customerEmail')?.value.trim()||'',phone=$('#customerPhone')?.value.trim()||'',address=$('#customerAddress')?.value.trim()||'';const primary=company||name;const secondary=[company?name:'',address,email,phone].filter(Boolean).map(escapeHtml).join('<br>');const includeChecklist=!invoice&&($('#includeChecklist')?.checked??true);const rows=summaryRows(calc);const featured=calc.promoPct?calc.firstMonth:calc.monthly;const featuredCaption=calc.promoPct?(lang==='de'?'1. Vertragsmonat':'1st contract month'):(lang==='de'?'Monatlicher Betrag':'Monthly amount');const vatNote=calc.vatRate?(lang==='de'?'MwSt. enthalten.':'VAT included.'):(lang==='de'?'MwSt. nicht enthalten.':'VAT not included.');
  const meta=invoice?`<div class="print-doc-meta"><span>${lang==='de'?'Rechnungsnummer':'Invoice no.'}</span><strong>${escapeHtml(invoiceNumber)}</strong><span>${lang==='de'?'Datum':'Date'}</span><strong>${today}</strong></div>`:`<div class="print-doc-meta"><span>${lang==='de'?'Datum':'Date'}</span><strong>${today}</strong><span>${lang==='de'?'Vertragslaufzeit':'Contract duration'}</span><strong>${calc.months} ${calc.months===1?t('month'):t('months')}</strong></div>`;
  const billingHtml=invoice&&billing?`<div class="print-bank"><div class="print-bank-title">${lang==='de'?'Zahlungsinformationen':'Payment details'}</div><div class="print-bank-grid"><span>${escapeHtml(billing.payment_terms||'')}</span><span>${escapeHtml(billing.account_holder||'')} · ${escapeHtml(billing.bank_name||'')}</span><span>IBAN: ${escapeHtml(billing.iban||'')}</span><span>BIC: ${escapeHtml(billing.bic||'')}</span></div></div>`:'';
  const sheet=$('#printSheet');sheet.innerHTML=`<div class="print-document"><div class="print-topline"></div><header class="print-head-legacy"><div class="print-brand"><img src="/assets/frankiflow-logo.png" alt="FrankiFlow"><p>${lang==='de'?'Gebäudereinigung & Objektbetreuung · Frankfurt am Main & Umgebung':'Building Cleaning & Property Services · Frankfurt am Main & Surroundings'}</p></div><div class="print-featured"><div class="print-kind">${invoice?t('invoice'):t('quote')}</div><div class="print-featured-amount">${money(featured)}</div><div class="print-featured-caption">${featuredCaption}</div></div></header><div class="print-divider"></div><section class="print-client-block"><div><div class="print-customer-name">${escapeHtml(primary)}</div>${secondary?`<div class="print-customer-details">${secondary}</div>`:''}</div>${meta}</section><section class="print-service-intro"><h2>${escapeHtml(calc.serviceLabel)}</h2><p>${money(calc.monthly)} / ${lang==='de'?'Monat':'month'} · ${vatNote}</p></section><section class="print-breakdown-legacy">${rows.map(([a,b],i)=>`<div class="print-line ${i===rows.length-1?'vat-line':''}"><span>${escapeHtml(a)}</span><strong>${escapeHtml(b)}</strong></div>`).join('')}</section><section class="print-month-totals"><div class="print-month-row"><span>${lang==='de'?'Regulärer Monat':'Regular month'}</span><strong>${money(calc.monthly)}</strong></div>${calc.promoPct?`<div class="print-month-row promo"><span>${lang==='de'?'1. Monat mit Neukundenrabatt':'1st month with new-customer discount'}</span><strong>${money(calc.firstMonth)}</strong></div>`:''}</section><div class="print-note">${lang==='de'?'Dieses Angebot ist unverbindlich. Der endgültige Preis richtet sich nach dem tatsächlich vereinbarten Leistungsumfang und dem Objektzustand.':'This quotation is non-binding. The final price depends on the agreed service scope and property condition.'}</div>${billingHtml}${companyFooter('')}</div>${includeChecklist?checklistPrintPages(primary,secondary):''}`;
  sheet.setAttribute('aria-hidden','false');void sheet.offsetHeight;await waitForImages(sheet);window.print();
}

function quoteSnapshot(){return{service_label:calc?.serviceLabel||'',frequency_label:$('#frequency option:checked')?.textContent||'',visit_price:calc?money(calc.visitTotal):'',monthly_price:calc?money(calc.monthly):'',first_month_price:calc?money(calc.firstMonth):'',breakdown:$('#breakdownRows')?.innerText||'',address:$('#customerAddress')?.value?.trim()||''};}

function syncRequestDialogLanguage(){const en=lang==='en';if($('#requestDialogTitle'))$('#requestDialogTitle').textContent=en?'Contact with the Quotation':'Mit Angebot kontaktieren';if($('#requestDialogIntro'))$('#requestDialogIntro').textContent=en?'Send your current calculated quotation and contact details directly to FrankiFlow.':'Senden Sie Ihr aktuell berechnetes Angebot zusammen mit Ihren Kontaktdaten direkt an FrankiFlow.';if($('#requestEmailLabel'))$('#requestEmailLabel').textContent=en?'Email':'E-Mail';if($('#requestPhoneLabel'))$('#requestPhoneLabel').textContent=en?'Phone':'Telefon';if($('#requestMessageLabel'))$('#requestMessageLabel').textContent=en?'Message / notes':'Nachricht / Hinweise';if($('#requestPrivacyText'))$('#requestPrivacyText').textContent=en?'I agree that my details may be processed to handle this quotation enquiry.':'Ich stimme der Verarbeitung meiner Angaben zur Bearbeitung dieser Angebotsanfrage zu.';if($('#submitServiceRequest'))$('#submitServiceRequest').textContent=en?'Send quotation request':'Angebotsanfrage senden';if($('#cancelRequestDialog'))$('#cancelRequestDialog').textContent=en?'Cancel':'Abbrechen';}

function openServiceRequest(){if(!calc)return;syncRequestDialogLanguage();$('#requestName').value=$('#customerName')?.value.trim()||'';$('#requestEmail').value=$('#customerEmail')?.value.trim()||'';$('#requestPhone').value=$('#customerPhone')?.value.trim()||'';$('#requestQuoteSummary').innerHTML=`<strong>${escapeHtml(calc.serviceLabel)}</strong><span>${money(calc.visitTotal)} / ${lang==='de'?'Termin':'visit'}</span><span>${money(calc.monthly)} / ${lang==='de'?'Monat':'month'}</span>${calc.promoPct?`<b>${lang==='de'?'1. Monat':'1st month'}: ${money(calc.firstMonth)}</b>`:''}`;$('#requestPrivacy').checked=false;$('#requestNotice').textContent='';$('#requestNotice').className='request-notice hidden';const modal=$('#quoteRequestModal');modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');$('#requestName').focus();}
function closeServiceRequest(){const modal=$('#quoteRequestModal');modal?.classList.add('hidden');modal?.setAttribute('aria-hidden','true');}

async function submitServiceRequest(){
  if(!calc)return;const name=$('#requestName').value.trim(),email=$('#requestEmail').value.trim().toLowerCase(),phone=$('#requestPhone').value.trim(),notice=$('#requestNotice');
  if(!name||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){notice.textContent=lang==='de'?'Bitte geben Sie Name und eine gültige E-Mail-Adresse ein.':'Please enter your name and a valid email address.';notice.className='request-notice error';return;}
  if(!$('#requestPrivacy').checked){notice.textContent=lang==='de'?'Bitte stimmen Sie der Datenverarbeitung zu.':'Please accept the data-processing consent.';notice.className='request-notice error';return;}
  const button=$('#submitServiceRequest'),old=button.textContent;button.disabled=true;button.textContent=lang==='de'?'Wird gesendet …':'Sending …';
  try{
    const payload={service_key:calc.serviceKey,frequency_key:calc.freq?.key||$('#frequency').value,area_sqm:calc.area||null,contract_months:calc.months||null,window_sqm:calc.windowArea||0,equipment_by_frankiflow:!!calc.equipment,deep_cleaning:!!calc.deep,estimated_monthly:round2(calc.monthly),customer_name:name,customer_email:email,customer_phone:phone,postcode:'',company_name:$('#customerCompany')?.value.trim()||'',message:$('#requestMessage')?.value.trim()||'',privacy_accepted:true,status:'new'};
    const {data,error}=await supabase.from('frankiflow_quote_requests').insert(payload).select('id').single();if(error)throw error;
    const common={quote_request_id:data.id,customer_email:email,language:lang};
    const [admin,customer]=await Promise.allSettled([supabase.functions.invoke('frankiflow-email',{body:{event_type:'admin_enquiry',...common,attach_quote:true,quote_snapshot:quoteSnapshot()}}),supabase.functions.invoke('frankiflow-email',{body:{event_type:'enquiry_received',...common}})]);
    const adminFailed=admin.status==='rejected'||admin.value?.error;if(adminFailed)throw new Error(lang==='de'?'Anfrage gespeichert, aber Admin-E-Mail fehlgeschlagen.':'Enquiry saved, but admin email failed.');
    notice.textContent=lang==='de'?'Gesendet. FrankiFlow hat Ihr Angebot und Ihre Kontaktdaten erhalten.':'Sent. FrankiFlow received your quotation and contact details.';notice.className='request-notice success';setTimeout(closeServiceRequest,1500);
    if(customer.status==='rejected'||customer.value?.error)console.warn('Customer confirmation email failed',customer.reason||customer.value?.error);
  }catch(error){console.error('Quotation request failed',error);notice.textContent=(lang==='de'?'Senden fehlgeschlagen: ':'Could not send: ')+(error?.message||'Unknown error');notice.className='request-notice error';}
  finally{button.disabled=false;button.textContent=old;}
}

async function callAdmin(action){const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error(lang==='de'?'Bitte im Admin anmelden.':'Please sign in as admin.');const r=await fetch(`${FRANKIFLOW_CONFIG.supabaseUrl}/functions/v1/pricing-admin`,{method:'POST',headers:{'Content-Type':'application/json','apikey':FRANKIFLOW_CONFIG.supabasePublishableKey,'Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({action})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Admin request failed');return j;}
async function detectAdmin(){if(!new URLSearchParams(location.search).has('admin'))return;const {data:{session}}=await supabase.auth.getSession();if(!session)return;const {data}=await supabase.from('pricing_admin_users').select('role,active').eq('user_id',session.user.id).eq('active',true).maybeSingle();if(data?.role==='admin'){isAdmin=true;$('#printInvoice')?.classList.remove('hidden');$('#serviceDateWrap')?.classList.remove('hidden');}}
async function createInvoice(){if(!isAdmin)return alert(lang==='de'?'Bitte im FrankiFlow Admin anmelden.':'Please sign in through FrankiFlow admin.');if(!$('#customerName').value.trim()||!$('#customerAddress').value.trim())return alert(lang==='de'?'Bitte Name und Adresse eintragen.':'Please enter customer name and address.');const button=$('#printInvoice'),old=button.textContent;button.disabled=true;try{const billing=await callAdmin('get_private_billing');const number=await callAdmin('reserve_invoice_number');await printDoc('invoice',billing.billing,number.invoice_number);}catch(error){alert(error.message)}finally{button.disabled=false;button.textContent=old;}}

async function loadRemote(){
  const pricingPromise=supabase.from('pricing_config').select('key,value').eq('is_public',true);
  const checklistPromise=supabase.from('frankiflow_checklists').select('service_key,label_de,label_en,sections');
  const [pricing,checklists]=await Promise.allSettled([pricingPromise,checklistPromise]);
  if(pricing.status==='fulfilled'&&!pricing.value.error&&pricing.value.data?.length){const next=clone(FALLBACK);for(const row of pricing.value.data){if(row?.key&&row.value&&typeof row.value==='object')next[row.key]=row.value;}if(!next.window_settings?.contract_reduction_pct)next.window_settings={...next.window_settings,contract_reduction_pct:{...(next.contract_settings?.base_reduction_pct||FALLBACK.window_settings.contract_reduction_pct)}};cfg=next;}
  if(checklists.status==='fulfilled'&&!checklists.value.error&&checklists.value.data?.length)applyChecklistRows(checklists.value.data);
  renderServices();renderSelects();updateDynamicLabels();recalculate();updateChecklistUi();
}

function bind(){
  if(window.__frankiflowCalculatorV3Bound)return;window.__frankiflowCalculatorV3Bound=true;
  $$('.language-switch [data-lang]').forEach(button=>button.addEventListener('click',()=>{lang=button.dataset.lang;applyLanguage();}));
  $('#calculatorForm')?.addEventListener('input',event=>{if(event.target.matches('input,select,textarea'))recalculate();});
  $('#calculatorForm')?.addEventListener('change',event=>{if(event.target.matches('input[name="serviceKey"]')){if(event.target.value==='fenster'&&frequencies().some(o=>o.key==='once'))$('#frequency').value='once';}recalculate();});
  $('#viewChecklist')?.addEventListener('click',toggleChecklist);$('#includeChecklist')?.addEventListener('change',renderChecklistPreview);
  $('#printQuote')?.addEventListener('click',()=>printDoc('quote'));$('#printInvoice')?.addEventListener('click',createInvoice);
  $('#requestService')?.addEventListener('click',openServiceRequest);$('#closeRequestDialog')?.addEventListener('click',closeServiceRequest);$('#cancelRequestDialog')?.addEventListener('click',closeServiceRequest);$('#submitServiceRequest')?.addEventListener('click',submitServiceRequest);$$('[data-close-request]').forEach(el=>el.addEventListener('click',closeServiceRequest));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#quoteRequestModal')?.classList.contains('hidden'))closeServiceRequest();});
}

cfg=clone(FALLBACK);renderServices();renderSelects();updateDynamicLabels();applyLanguage();bind();await detectAdmin();recalculate();updateChecklistUi();void loadRemote();
