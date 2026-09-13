import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { applyChecklistRows, localizeChecklistSections } from './checklists.js';

const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const money=(v,lang=currentLang)=>new Intl.NumberFormat(lang==='de'?'de-DE':'en-IE',{style:'currency',currency:'EUR'}).format(Number(v)||0);
let currentLang=localStorage.getItem('frankiflow-lang')||localStorage.getItem('ff-price-lang')||'de';
if(!['de','en'].includes(currentLang))currentLang='de';
let cfg=null,calc=null,isAdmin=false;

const fallback={
  contract_settings:{months:[1,3,6,9,12,24],base_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}},
  deep_cleaning_settings:{label:'Grundreinigung',enabled:true,surcharge_pct:30},
  equipment_settings:{base:5,enabled:true,gradient_per_sqm:.01},
  frequency_settings:{options:[{key:'once',label:'Einmalig',visits_per_month:1},{key:'monthly',label:'1× pro Monat',visits_per_month:1},{key:'biweekly',label:'Alle 2 Wochen',visits_per_month:2},{key:'weekly1',label:'1× pro Woche',visits_per_month:4},{key:'weekly2',label:'2× pro Woche',visits_per_month:8},{key:'weekly3',label:'3× pro Woche',visits_per_month:12},{key:'weekly4',label:'4× pro Woche',visits_per_month:16},{key:'weekly5',label:'5× pro Woche',visits_per_month:20}]},
  promotion_settings:{label:'25% Neukundenrabatt im ersten Monat',enabled:true,first_month_discount_pct:25},
  service_settings:{services:{buero:{label:'Büroreinigung',base_1m:24,enabled:true},airbnb:{label:'Ferienwohnung / Airbnb',base_1m:26,enabled:true},wohnung:{label:'Wohnungsreinigung',base_1m:30,enabled:true},treppenhaus:{label:'Treppenhausreinigung',base_1m:24,enabled:true}},gradient_per_sqm:.2304,minimum_cleaning_charge:30},
  vat_settings:{label:'MwSt. zum Rechnungsbetrag hinzufügen',enabled:true,rate_pct:19,customer_pays_default:false},
  window_settings:{base:5,enabled:true,minimum:35,gradient_per_sqm:3}
};
const i18n={
 de:{website:'Zur Website',eyebrow:'FRANKIFLOW PREISRECHNER',title:'Ihr Reinigungspreis. <em>Transparent berechnet.</em>',intro:'Wählen Sie Leistung, Fläche und Häufigkeit. Sie erhalten sofort einen unverbindlichen Richtpreis – ohne Registrierung.',instant:'Sofortiger Richtpreis',noReg:'Keine Registrierung',frankfurt:'Frankfurt & Umgebung',serviceTitle:'Welche Reinigung benötigen Sie?',serviceHint:'Wählen Sie die Leistung, die am besten passt.',scopeTitle:'Objekt & Umfang',scopeHint:'Fläche und Reinigungsrhythmus bestimmen den Richtpreis.',area:'Reinigungsfläche',areaHelp:'Bei reiner Fensterreinigung kann die Fläche 0 sein.',frequency:'Häufigkeit',contract:'Vertragslaufzeit',newCustomer:'Neukunde?',extrasTitle:'Optionale Leistungen',extrasHint:'Nur auswählen, wenn Sie diese Leistungen benötigen.',equipment:'Reinigungsmittel & Equipment',equipmentHint:'FrankiFlow stellt benötigte Materialien.',vat:'MwSt. hinzufügen',windows:'Fensterreinigung',windowsHint:'Optional nach Glasfläche.',glassArea:'Glasfläche',quoteTitle:'Angebot vorbereiten',quoteHint:'Optional: Tragen Sie Ihre Daten ein, wenn Sie das Ergebnis als Angebot drucken möchten.',name:'Name',company:'Firma / Objekt',phone:'Telefon',address:'Adresse / Leistungsort',serviceDate:'Leistungsdatum / Zeitraum',yourPrice:'IHR RICHTPREIS',perVisit:'Preis pro Termin',perMonth:'Preis pro Monat',firstMonth:'1. Monat als Neukunde',overview:'Übersicht',printQuote:'Angebot drucken / PDF',printInvoice:'Rechnung erstellen',request:'Persönliches Angebot anfragen',disclaimer:'Unverbindlicher Richtpreis. Der endgültige Preis kann nach Besichtigung bzw. genauer Leistungsabstimmung abweichen.',vatIncluded:'MwSt. enthalten',vatNotIncluded:'MwSt. nicht enthalten',discount:'Rabatt berücksichtigt',months:'Monate',month:'Monat',visitsMonth:'Termine/Monat',floorCleaning:'Allgemeine Reinigung',windowCleaning:'Fensterreinigung',deep:'Grundreinigung',materials:'Equipment & Reinigungsmittel',contractDiscount:'Laufzeitvorteil auf Basisanteil',quote:'ANGEBOT',invoice:'RECHNUNG',nonBinding:'Unverbindlicher Richtpreis / Preisvorschlag',customer:'Angebot an',invoiceTo:'Rechnung an',date:'Datum',service:'Leistung',totalMonth:'Monatlicher Richtpreis',firstMonthTotal:'1. Monat mit Neukundenrabatt',termsQuote:'Dieses Angebot ist unverbindlich. Der endgültige Preis richtet sich nach dem tatsächlich vereinbarten Leistungsumfang, Objektzustand und ggf. einer Besichtigung.',termsInvoice:'Bitte begleichen Sie den Rechnungsbetrag innerhalb des angegebenen Zahlungsziels.',adminNeeded:'Für Rechnungen bitte im FrankiFlow Website-Admin anmelden und den Rechner dort öffnen.'},
 en:{website:'Back to website',eyebrow:'FRANKIFLOW PRICE CALCULATOR',title:'Your cleaning price. <em>Calculated transparently.</em>',intro:'Choose the service, area and frequency. You receive an instant non-binding estimate – no registration required.',instant:'Instant estimate',noReg:'No registration',frankfurt:'Frankfurt & surroundings',serviceTitle:'Which cleaning service do you need?',serviceHint:'Choose the service that best matches your property.',scopeTitle:'Property & scope',scopeHint:'Area and cleaning frequency determine the estimate.',area:'Floor area',areaHelp:'For window-only cleaning, floor area may be 0.',frequency:'Frequency',contract:'Contract duration',newCustomer:'New customer?',extrasTitle:'Optional services',extrasHint:'Select only the extras you need.',equipment:'Cleaning supplies & equipment',equipmentHint:'FrankiFlow provides the required materials.',vat:'Add VAT',windows:'Window cleaning',windowsHint:'Optional, calculated by glass area.',glassArea:'Glass area',quoteTitle:'Prepare a quotation',quoteHint:'Optional: enter your details to print the result as a quotation.',name:'Name',company:'Company / property',phone:'Phone',address:'Address / service location',serviceDate:'Service date / period',yourPrice:'YOUR ESTIMATE',perVisit:'Price per visit',perMonth:'Price per month',firstMonth:'1st month as new customer',overview:'Overview',printQuote:'Print quotation / PDF',printInvoice:'Create invoice',request:'Request a personal quote',disclaimer:'Non-binding estimate. The final price may vary after inspection or detailed agreement of the service scope.',vatIncluded:'VAT included',vatNotIncluded:'VAT not included',discount:'discount applied',months:'months',month:'month',visitsMonth:'visits/month',floorCleaning:'General cleaning',windowCleaning:'Window cleaning',deep:'Deep cleaning',materials:'Equipment & cleaning supplies',contractDiscount:'Contract saving on base component',quote:'QUOTATION',invoice:'INVOICE',nonBinding:'Non-binding price estimate',customer:'Quotation for',invoiceTo:'Bill to',date:'Date',service:'Service',totalMonth:'Estimated monthly total',firstMonthTotal:'1st month incl. new-customer discount',termsQuote:'This quotation is non-binding. The final price depends on the agreed service scope, property condition and any required inspection.',termsInvoice:'Please pay the invoice within the stated payment terms.',adminNeeded:'Please sign in through the FrankiFlow website admin and open the calculator from there before creating invoices.'}
};
const serviceEnglish={buero:'Office cleaning',wohnung:'Home cleaning',airbnb:'Holiday rental / Airbnb',treppenhaus:'Stairwell cleaning',fenster:'Window cleaning'};
const serviceHints={de:{buero:'Büro, Praxis & Gewerbe',wohnung:'Wohnung & Privathaushalt',airbnb:'Turnover & Ferienunterkunft',treppenhaus:'Mehrfamilienhaus & Gemeinschaftsfläche',fenster:'Nur Fenster & Glasflächen'},en:{buero:'Office, practice & commercial',wohnung:'Apartment & private home',airbnb:'Turnover & holiday rental',treppenhaus:'Apartment building & common areas',fenster:'Windows & glass only'}};
const freqEnglish={once:'One-time',monthly:'1× per month',biweekly:'Every 2 weeks',weekly1:'1× per week',weekly2:'2× per week',weekly3:'3× per week',weekly4:'4× per week',weekly5:'5× per week'};
function checklistUiText(){
  return currentLang==='de'
    ?{title:'Leistungscheckliste',hint:'Sehen Sie vor dem Drucken, welche Standardleistungen für die gewählte Reinigung enthalten sind.',view:'Checkliste ansehen',hide:'Checkliste schließen',include:'Checkliste dem Angebot beifügen',includeHint:'Die Leistungscheckliste wird als zusätzliche PDF-Seite(n) gedruckt.',deep:'Erweiterte Grundreinigung',windows:'Fensterreinigung',note:'Die Checkliste beschreibt den Standard-Leistungsumfang für die gewählte Reinigung. Maßgeblich sind die konkret vereinbarten Leistungen und die Gegebenheiten vor Ort.',optional:'Nur nach ausdrücklicher Vereinbarung',attachment:'Leistungscheckliste beigefügt',pageKind:'LEISTUNGSCHECKLISTE',scope:'Leistungsumfang',selected:'Ausgewählte Reinigung'}
    :{title:'Service checklist',hint:'Review the standard tasks included for the selected cleaning service before printing.',view:'View checklist',hide:'Close checklist',include:'Attach checklist to quotation',includeHint:'The service checklist will be printed as additional PDF page(s).',deep:'Extended deep cleaning',windows:'Window cleaning',note:'This checklist describes the standard service scope for the selected cleaning. The specifically agreed services and on-site conditions remain decisive.',optional:'Only when specifically agreed',attachment:'Service checklist attached',pageKind:'SERVICE CHECKLIST',scope:'Service scope',selected:'Selected cleaning'};
}
function getChecklistGroups(){
  if(!calc)return [];
  const groups=[];
  if(calc.windowOnly){
    const windows=localizeChecklistSections('windows',currentLang);
    if(windows.length)groups.push({key:'windows',label:checklistUiText().windows,sections:windows});
    return groups;
  }
  const includeBase=calc.area>0 || !calc.windows;
  if(includeBase){
    const base=localizeChecklistSections(calc.serviceKey,currentLang);
    if(base.length)groups.push({key:calc.serviceKey,label:calc.serviceLabel,sections:base});
  }
  if(calc.deep&&includeBase){
    const deep=localizeChecklistSections('deep',currentLang);
    if(deep.length)groups.push({key:'deep',label:checklistUiText().deep,sections:deep});
  }
  if(calc.windows){
    const windows=localizeChecklistSections('windows',currentLang);
    if(windows.length)groups.push({key:'windows',label:checklistUiText().windows,sections:windows});
  }
  return groups;
}
function checklistSectionsHtml(sections,screen=false){
  return sections.map(section=>`<section class="${screen?'checklist-screen-section':'print-checklist-section'} ${section.optional?'optional-section':''}"><h4>${escapeHtml(section.title)}</h4>${section.optional?`<div class="${screen?'checklist-optional-label':'checklist-print-optional'}">${escapeHtml(checklistUiText().optional)}</div>`:''}<div class="${screen?'checklist-screen-items':'print-checklist-items'}">${section.items.map(item=>`<div class="${screen?'checklist-screen-item':'print-checklist-item'}"><span class="check-symbol ${section.optional?'optional':'included'}" aria-hidden="true"></span><em>${escapeHtml(item)}</em></div>`).join('')}</div></section>`).join('');
}
function renderChecklistPreview(){
  const preview=$('#checklistPreview');
  if(!preview||!calc)return;
  const groups=getChecklistGroups();
  const summary=calc.windowOnly?checklistUiText().windows:[calc.deep?`${calc.serviceLabel} + ${checklistUiText().deep}`:calc.serviceLabel,calc.windows?checklistUiText().windows:''].filter(Boolean).join(' · ');
  preview.innerHTML=`<div class="checklist-preview-head"><div><span>${escapeHtml(checklistUiText().selected)}</span><strong>${escapeHtml(summary)}</strong></div></div>${groups.map(group=>`<div class="checklist-screen-group"><h3>${escapeHtml(group.label)}</h3>${checklistSectionsHtml(group.sections,true)}</div>`).join('')}<p class="checklist-scope-note">${escapeHtml(checklistUiText().note)}</p>`;
}
function updateChecklistUi(){
  const u=checklistUiText();
  if($('#checklistTitle'))$('#checklistTitle').textContent=u.title;
  if($('#checklistHint'))$('#checklistHint').textContent=u.hint;
  if($('#includeChecklistLabel'))$('#includeChecklistLabel').textContent=u.include;
  if($('#includeChecklistHint'))$('#includeChecklistHint').textContent=u.includeHint;
  const preview=$('#checklistPreview'),btn=$('#viewChecklist');
  if(btn)btn.textContent=preview&&!preview.classList.contains('hidden')?u.hide:u.view;
  renderChecklistPreview();
}
function printCompanyFooterHtml(taxNote=''){
  return `<footer class="print-company-footer"><div class="print-footer-title">FrankiFlow Unternehmensdaten</div><div class="print-company-grid"><div><span>${currentLang==='de'?'Telefon':'Phone'}</span><strong>+49 176 62493041</strong></div><div><span>${currentLang==='de'?'E-Mail':'Email'}</span><strong>info@frankiflow.de</strong></div><div><span>Website</span><strong>www.frankiflow.de</strong></div><div><span>${currentLang==='de'?'Steuernummer':'Tax no.'}</span><strong>014/811/68462</strong></div><div><span>W-IdNr.</span><strong>DE464605581</strong></div></div>${taxNote?`<div class="print-tax-note">${taxNote}</div>`:''}</footer>`;
}
function buildChecklistPrintPages(customerPrimary,customerSecondary){
  const groups=getChecklistGroups();
  if(!groups.length)return '';
  const u=checklistUiText();
  return groups.map((group,index)=>`<div class="print-checklist-document"><div class="print-topline"></div><header class="print-checklist-head"><div class="print-brand"><img src="/assets/frankiflow-logo.png" alt="FrankiFlow"><p>Gebäudereinigung & Objektbetreuung · Frankfurt am Main & Umgebung</p></div><div class="print-checklist-titlebox"><span>${u.pageKind}</span><strong>${escapeHtml(group.label)}</strong><small>${index+1} / ${groups.length}</small></div></header><div class="print-divider"></div><section class="print-checklist-client"><div><span>${currentLang==='de'?'Kunde / Objekt':'Client / property'}</span><strong>${escapeHtml(customerPrimary)}</strong>${customerSecondary?`<small>${customerSecondary}</small>`:''}</div><div><span>${u.scope}</span><strong>${escapeHtml(group.label)}</strong></div></section><div class="print-checklist-grid">${checklistSectionsHtml(group.sections,false)}</div><div class="print-checklist-note">${escapeHtml(u.note)}</div>${printCompanyFooterHtml('')}</div>`).join('');
}

async function loadConfig(){
  const copy=structuredClone(fallback);
  const [pricingResult, checklistResult]=await Promise.all([
    supabase.from('pricing_config').select('key,value').eq('is_public',true),
    supabase.from('frankiflow_checklists').select('service_key,label_de,label_en,sections')
  ]);
  if(!pricingResult.error&&pricingResult.data?.length) for(const row of pricingResult.data) copy[row.key]=row.value;
  if(!checklistResult.error&&checklistResult.data?.length) applyChecklistRows(checklistResult.data);
  cfg=copy;
}
function t(k){return i18n[currentLang][k]||k}
function applyLanguage(){
  document.documentElement.lang=currentLang; localStorage.setItem('frankiflow-lang',currentLang); localStorage.setItem('ff-price-lang',currentLang);
  document.title=currentLang==='de'?'FrankiFlow Preisrechner | Reinigung in Frankfurt':'FrankiFlow Price Calculator | Cleaning in Frankfurt';
  const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=currentLang==='de'?'Berechnen Sie Ihren unverbindlichen Richtpreis für Büro-, Wohnungs-, Airbnb-, Treppenhaus- oder Fensterreinigung bei FrankiFlow.':'Calculate a non-binding estimate for office, home, Airbnb, stairwell or window cleaning with FrankiFlow.';
  const ph=currentLang==='de'?{customerName:'Max Mustermann',customerCompany:'optional',customerEmail:'name@beispiel.de',customerPhone:'+49 …',customerAddress:'Straße, PLZ, Ort',serviceDate:'z. B. September 2026'}:{customerName:'John Smith',customerCompany:'optional',customerEmail:'name@example.com',customerPhone:'+49 …',customerAddress:'Street, postcode, city',serviceDate:'e.g. September 2026'};for(const [id,v] of Object.entries(ph)){const el=$('#'+id);if(el)el.placeholder=v}
  $$('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===currentLang));
  $$('[data-i18n]').forEach(el=>{const v=t(el.dataset.i18n); if(v.includes('<em>'))el.innerHTML=v;else el.textContent=v});
  const newCustomerValue=$('#newCustomer').value||'yes';
  $('#newCustomer').innerHTML=currentLang==='de'?'<option value="yes">Ja</option><option value="no">Nein</option>':'<option value="yes">Yes</option><option value="no">No</option>';
  if([...$('#newCustomer').options].some(o=>o.value===newCustomerValue))$('#newCustomer').value=newCustomerValue;
  renderServices(); renderFrequency(); renderContracts(); updateDynamicLabels(); calculate(); updateChecklistUi();
}
function renderServices(){
  const current=$('input[name="serviceKey"]:checked')?.value;
  const entries=Object.entries(cfg.service_settings?.services||{}).filter(([,v])=>v.enabled!==false);
  if(cfg.window_settings?.enabled!==false)entries.push(['fenster',{label:'Fensterreinigung',enabled:true,synthetic:true}]);
  const selectedKey=entries.some(([key])=>key===current)?current:entries[0]?.[0];
  $('#serviceOptions').innerHTML=entries.map(([key,v],i)=>`<label class="service-choice ${key==='fenster'?'service-window-choice ':''}${selectedKey===key?'active':''}"><input type="radio" name="serviceKey" value="${key}" ${selectedKey===key?'checked':''}><span class="choice-icon">${String(i+1).padStart(2,'0')}</span><span><strong>${currentLang==='en'?(serviceEnglish[key]||v.label):v.label}</strong><small>${serviceHints[currentLang][key]||''}</small></span></label>`).join('');
  $$('.service-choice').forEach(x=>x.addEventListener('click',()=>{setTimeout(()=>{
    $$('.service-choice').forEach(y=>y.classList.toggle('active',y.querySelector('input').checked));
    if($('input[name="serviceKey"]:checked')?.value==='fenster'){
      $('#deepCleaning').checked=false;$('#equipment').checked=false;$('#windowCleaning').checked=false;
      if(current!=='fenster' && [...$('#frequency').options].some(o=>o.value==='once')) $('#frequency').value='once';
    }
    updateServiceMode();calculate();
  },0)}));
}
function renderFrequency(){
  const prev=$('#frequency').value; const opts=cfg.frequency_settings?.options||[];
  $('#frequency').innerHTML=opts.map(o=>`<option value="${o.key}" data-visits="${o.visits_per_month}">${currentLang==='en'?(freqEnglish[o.key]||o.label):o.label}</option>`).join('');
  if(opts.some(o=>o.key===prev)) $('#frequency').value=prev; else $('#frequency').value=opts.find(o=>o.key==='weekly1')?.key||opts[0]?.key||'';
}
function renderContracts(){
  const prev=$('#contractMonths').value; const months=cfg.contract_settings?.months||[1,3,6,9,12,24];
  $('#contractMonths').innerHTML=months.map(m=>`<option value="${m}">${m} ${m===1?t('month'):t('months')}</option>`).join(''); if(months.map(String).includes(prev))$('#contractMonths').value=prev; else $('#contractMonths').value='1';
}
function updateDynamicLabels(){
  const deep=cfg.deep_cleaning_settings||{}; $('#deepLabel').textContent=currentLang==='en'?t('deep'):(deep.label||'Grundreinigung'); $('#deepHint').textContent=currentLang==='de'?'Intensivere Reinigung des gesamten Bereichs.':'Intensive cleaning of the full area.';
  $('#vatWrap').classList.toggle('hidden',cfg.vat_settings?.enabled===false); $('#vatHint').textContent=`${Number(cfg.vat_settings?.rate_pct||0)}% ${currentLang==='de'?'MwSt.':'VAT'}`;
  if(!$('#includeVat').dataset.initialized){$('#includeVat').checked=!!cfg.vat_settings?.customer_pays_default;$('#includeVat').dataset.initialized='1'}
  const promo=cfg.promotion_settings||{}; $('#promoHint').textContent=promo.enabled?`${Number(promo.first_month_discount_pct||0)}% ${currentLang==='de'?'Rabatt im ersten Monat':'discount in first month'}`:(currentLang==='de'?'Kein Neukundenrabatt aktiv':'No new-customer discount active');
  updateServiceMode();
}
function updateServiceMode(){
  if(!cfg)return;
  const windowOnly=$('input[name="serviceKey"]:checked')?.value==='fenster';
  $('#areaFieldWrap')?.classList.toggle('hidden',windowOnly);
  $('#deepWrap').classList.toggle('hidden',windowOnly||cfg.deep_cleaning_settings?.enabled===false);
  $('#equipmentWrap').classList.toggle('hidden',windowOnly||cfg.equipment_settings?.enabled===false);
  $('#windowWrap').classList.toggle('hidden',windowOnly||cfg.window_settings?.enabled===false);
  const windowsSelected=windowOnly||$('#windowCleaning').checked;
  const areaWrap=$('#windowAreaWrap'),primarySlot=$('#windowPrimarySlot'),extraSlot=$('#windowExtraSlot');
  if(areaWrap&&primarySlot&&extraSlot){
    primarySlot.classList.toggle('hidden',!windowOnly);
    const target=windowOnly?primarySlot:extraSlot;
    if(areaWrap.parentElement!==target) target.appendChild(areaWrap);
  }
  areaWrap?.classList.toggle('hidden',!windowsSelected);
}
function inputState(){
  const freq=cfg.frequency_settings.options.find(o=>o.key===$('#frequency').value)||cfg.frequency_settings.options[0];
  const serviceKey=$('input[name="serviceKey"]:checked')?.value;
  const windowOnly=serviceKey==='fenster';
  return {serviceKey,windowOnly,area:windowOnly?0:Math.max(0,Number($('#areaSqm').value)||0),freq,months:Number($('#contractMonths').value)||1,newCustomer:$('#newCustomer').value==='yes',deep:windowOnly?false:$('#deepCleaning').checked,equipment:windowOnly?false:$('#equipment').checked,vat:$('#includeVat').checked,windows:windowOnly||$('#windowCleaning').checked,windowArea:Math.max(0,Number($('#windowSqm').value)||0)};
}
function calculate(){
  if(!cfg)return;
  const s=inputState();
  const service=s.windowOnly?{label:'Fensterreinigung',base_1m:0,enabled:true}:cfg.service_settings.services[s.serviceKey];
  if(!service)return;

  const reductionPct=s.windowOnly?0:Number(cfg.contract_settings.base_reduction_pct?.[String(s.months)]||0);
  const reduction=reductionPct/100;
  const min=Number(cfg.service_settings.minimum_cleaning_charge||0);
  const gradient=Number(cfg.service_settings.gradient_per_sqm||0);
  const base=Number(service.base_1m||0);
  const adjustedBase=base*(1-reduction);

  let floorVisitNet=s.windowOnly?0:(s.area>0?Math.max(min,adjustedBase+s.area*gradient):0);
  if(!s.windowOnly&&s.area===0&&!s.windows)floorVisitNet=min;
  if(s.deep&&cfg.deep_cleaning_settings?.enabled)floorVisitNet*=1+Number(cfg.deep_cleaning_settings.surcharge_pct||0)/100;

  let equipmentVisitNet=0;
  if(!s.windowOnly&&s.equipment&&cfg.equipment_settings?.enabled){
    equipmentVisitNet=Number(cfg.equipment_settings.base||0)+s.area*Number(cfg.equipment_settings.gradient_per_sqm||0);
  }

  let windowChargeNet=0;
  if(s.windows&&cfg.window_settings?.enabled&&s.windowArea>0){
    windowChargeNet=Math.max(Number(cfg.window_settings.minimum||0),Number(cfg.window_settings.base||0)+s.windowArea*Number(cfg.window_settings.gradient_per_sqm||0));
  }

  const visits=Number(s.freq.visits_per_month||1);
  const regularVisitNet=s.windowOnly?windowChargeNet:(floorVisitNet+equipmentVisitNet);
  // For a mixed cleaning service, window cleaning is a once-per-month add-on. Window-only service follows the selected frequency.
  const monthlyWindowNet=!s.windowOnly&&s.windows?windowChargeNet:0;
  const subtotalNet=s.windowOnly?(regularVisitNet*visits):(regularVisitNet*visits+monthlyWindowNet);
  const vatRate=(s.vat&&cfg.vat_settings?.enabled)?Number(cfg.vat_settings.rate_pct||0)/100:0;
  const roundMoney=v=>Math.round((Number(v||0)+Number.EPSILON)*100)/100;
  const gross=v=>roundMoney(Number(v||0)*(1+vatRate));

  const promoPct=(s.newCustomer&&cfg.promotion_settings?.enabled)?Number(cfg.promotion_settings.first_month_discount_pct||0):0;
  const promo=promoPct/100;
  let firstFloorNet=floorVisitNet,firstEquipmentNet=equipmentVisitNet,firstWindowNet=windowChargeNet;
  if(promo>0){
    firstFloorNet=floorVisitNet>0?Math.max(min,floorVisitNet*(1-promo)):0;
    firstEquipmentNet=equipmentVisitNet*(1-promo);
    firstWindowNet=windowChargeNet>0?Math.max(Number(cfg.window_settings?.minimum||0),windowChargeNet*(1-promo)):0;
  }

  // Round customer-visible line items first so every displayed total adds up exactly to the cent.
  const floorVisitGross=gross(floorVisitNet);
  const equipmentVisitGross=gross(equipmentVisitNet);
  const windowChargeGross=gross(windowChargeNet);
  const visitTotal=s.windowOnly?windowChargeGross:roundMoney(floorVisitGross+equipmentVisitGross);
  const monthly=s.windowOnly?roundMoney(windowChargeGross*visits):roundMoney(visitTotal*visits+(s.windows?windowChargeGross:0));
  const firstFloorGross=gross(firstFloorNet);
  const firstEquipmentGross=gross(firstEquipmentNet);
  const firstWindowGross=gross(firstWindowNet);
  const firstVisitGross=s.windowOnly?firstWindowGross:roundMoney(firstFloorGross+firstEquipmentGross);
  const firstMonth=s.windowOnly?roundMoney(firstVisitGross*visits):roundMoney(firstVisitGross*visits+(s.windows?firstWindowGross:0));
  calc={...s,service,serviceLabel:currentLang==='en'?(serviceEnglish[s.serviceKey]||service.label):service.label,reductionPct,
    floorVisit:floorVisitGross,equipmentVisit:equipmentVisitGross,windowCharge:windowChargeGross,
    floorVisitNet:roundMoney(floorVisitNet),equipmentVisitNet:roundMoney(equipmentVisitNet),windowChargeNet:roundMoney(windowChargeNet),
    visitTotal,subtotal:monthly,subtotalNet:roundMoney(subtotalNet),vatRate,monthly,promoPct,firstMonth};
  renderResult();
}
function renderResult(){
  if(!calc)return; $('#visitPrice').textContent=money(calc.visitTotal); $('#monthlyPrice').textContent=money(calc.monthly); $('#firstMonthPrice').textContent=money(calc.firstMonth);
  $('#vatStatus').textContent=calc.vatRate?t('vatIncluded'):t('vatNotIncluded'); $('#discountLabel').textContent=`${calc.promoPct}% ${t('discount')}`; $('#promotionBox').classList.toggle('hidden',!calc.promoPct);
  $('#contractSaving').textContent=calc.reductionPct?`${calc.reductionPct}% ${currentLang==='de'?'Vorteil auf den Basisanteil':'saving on the base component'}`:'';
  const rows=[];
  if(calc.windowOnly){
    rows.push([t('windowCleaning'),`${calc.windowArea} m² ${currentLang==='de'?'Glas':'glass'} · ${money(calc.windowCharge)} / ${currentLang==='de'?'Termin':'visit'}`]);
    rows.push([currentLang==='de'?'Häufigkeit':'Frequency',`${calc.freq.visits_per_month} ${t('visitsMonth')}`]);
  }else{
    rows.push([calc.serviceLabel,`${calc.area} m²`]);
    rows.push([calc.deep?t('deep'):t('floorCleaning'),`${calc.freq.visits_per_month} ${t('visitsMonth')}`]);
    if(calc.reductionPct)rows.push([t('contractDiscount'),`−${calc.reductionPct}%`]);
    if(calc.equipment)rows.push([t('materials'),money(calc.equipmentVisit)+` / ${currentLang==='de'?'Termin':'visit'}`]);
    if(calc.windows)rows.push([`${t('windowCleaning')} (${currentLang==='de'?'1×/Monat':'1×/month'})`,`${calc.windowArea} m² · ${money(calc.windowCharge)}`]);
  }
  rows.push([currentLang==='de'?'Vertragslaufzeit':'Contract duration',`${calc.months} ${calc.months===1?t('month'):t('months')}`]);
  $('#breakdownRows').innerHTML=rows.map(([a,b])=>`<div class="breakdown-row"><span>${a}</span><b>${b}</b></div>`).join('');
  updateServiceMode();
  renderChecklistPreview();
}
function printDoc(type,billing=null,invoiceNumber=null){
  if(!calc)return;
  const isInvoice=type==='invoice';
  const includeChecklist=!isInvoice && ($('#includeChecklist')?.checked ?? true);
  const locale=currentLang==='de'?'de-DE':'en-GB';
  const now=new Date().toLocaleDateString(locale);
  const name=$('#customerName').value.trim()||'—';
  const company=$('#customerCompany').value.trim();
  const email=$('#customerEmail').value.trim();
  const phone=$('#customerPhone').value.trim();
  const address=$('#customerAddress').value.trim();
  const serviceDate=$('#serviceDate')?.value?.trim()||now;
  const customerPrimary=company||name;
  const customerSecondary=[company?name:'',address,email,phone].filter(Boolean).map(x=>escapeHtml(x)).join('<br>');
  const cleaningLabel=calc.windowOnly?t('windowCleaning'):(calc.deep?t('deep'):t('floorCleaning'));
  const visitWord=currentLang==='de'?'Termin':'visit';
  const regularMonthLabel=currentLang==='de'?'Regulärer Monat':'Regular month';
  const promoMonthLabel=currentLang==='de'?`1. Monat nach ${calc.promoPct}% Rabatt`:`1st month after ${calc.promoPct}% discount`;
  const featuredAmount=calc.promoPct?calc.firstMonth:calc.monthly;
  const featuredCaption=calc.promoPct
    ?(currentLang==='de'?'1. Vertragsmonat':'1st contract month')
    :(currentLang==='de'?'Monatlicher Betrag':'Monthly amount');
  const vatStatus=calc.vatRate
    ?`${Number(cfg.vat_settings?.rate_pct||19)}% ${currentLang==='de'?'MwSt. enthalten':'VAT included'}`
    :t('vatNotIncluded');
  const visits=Number(calc.freq.visits_per_month||1);
  const floorMonthly=calc.floorVisit*visits;
  const equipmentMonthly=calc.equipmentVisit*visits;
  const cleaningMonthly=floorMonthly+equipmentMonthly;
  const rows=[];
  if(calc.windowOnly){
    rows.push([`${t('windowCleaning')} · ${calc.windowArea} m² ${currentLang==='de'?'Glas':'glass'}`,`${money(calc.windowCharge)} / ${visitWord}`]);
    rows.push([`${currentLang==='de'?'Häufigkeit':'Frequency'} · ${visits} ${t('visitsMonth')}`,money(calc.windowCharge*visits)]);
  }else{
    if(calc.area>0){
      rows.push([`${escapeHtml(calc.serviceLabel)} · ${calc.area} m²`,`${money(calc.floorVisit)} / ${visitWord}`]);
    }
    if(calc.equipment){
      rows.push([t('materials'),`${money(calc.equipmentVisit)} / ${visitWord}`]);
    }
    if(calc.area>0 || calc.equipment){
      rows.push([`${cleaningLabel} · ${visits} ${t('visitsMonth')}`,money(cleaningMonthly)]);
    }
    if(calc.windows){
      rows.push([`${t('windowCleaning')} · ${calc.windowArea} m² ${currentLang==='de'?'Glas':'glass'}`,money(calc.windowCharge)]);
    }
  }
  rows.push([currentLang==='de'?'MwSt.':'VAT',vatStatus]);

  const docMeta=isInvoice
    ?`<div class="print-doc-meta"><span>${currentLang==='de'?'Rechnungsnummer':'Invoice no.'}</span><strong>${escapeHtml(invoiceNumber||'')}</strong><span>${t('date')}</span><strong>${now}</strong><span>${t('serviceDate')}</span><strong>${escapeHtml(serviceDate)}</strong></div>`
    :`<div class="print-doc-meta"><span>${t('date')}</span><strong>${now}</strong><span>${currentLang==='de'?'Vertragslaufzeit':'Contract duration'}</span><strong>${calc.months} ${calc.months===1?t('month'):t('months')}</strong></div>`;

  const billingHtml=isInvoice&&billing?`<div class="print-bank"><div class="print-bank-title">${currentLang==='de'?'Zahlungsinformationen':'Payment details'}</div><div class="print-bank-grid"><span>${escapeHtml(billing.payment_terms||'')}</span><span>${escapeHtml(billing.account_holder||'')} · ${escapeHtml(billing.bank_name||'')}</span><span>IBAN: ${escapeHtml(billing.iban||'')}</span><span>BIC: ${escapeHtml(billing.bic||'')}</span></div></div>`:'';
  const terms=isInvoice
    ?t('termsInvoice')
    :(currentLang==='de'
      ?`${calc.promoPct}% Neukundenrabatt gilt ausschließlich im ersten Vertragsmonat. Mindestpreise bleiben bestehen. Diese Berechnung ist unverbindlich.`
      :`${calc.promoPct}% new-customer discount applies only to the first contract month. Minimum prices remain in force. This calculation is non-binding.`);
  const legalTaxNote=calc.vatRate
    ?(currentLang==='de'?'MwSt. enthalten. Die steuerliche Behandlung richtet sich nach der tatsächlich ausgestellten Rechnung.':'VAT included. Tax treatment is determined by the invoice actually issued.')
    :(currentLang==='de'?'MwSt. nicht enthalten. Die steuerliche Behandlung richtet sich nach der tatsächlich ausgestellten Rechnung.':'VAT not included. Tax treatment is determined by the invoice actually issued.');

  $('#printSheet').innerHTML=`
  <div class="print-document">
    <div class="print-topline"></div>
    <header class="print-head-legacy">
      <div class="print-brand">
        <img src="/assets/frankiflow-logo.png" alt="FrankiFlow">
        <p>Gebäudereinigung & Objektbetreuung · Frankfurt am Main & Umgebung</p>
      </div>
      <div class="print-featured">
        <div class="print-kind">${isInvoice?t('invoice'):t('quote')}</div>
        <div class="print-featured-amount">${money(featuredAmount)}</div>
        <div class="print-featured-caption">${featuredCaption}</div>
      </div>
    </header>

    <div class="print-divider"></div>

    <section class="print-client-block">
      <div>
        <div class="print-customer-name">${escapeHtml(customerPrimary)}</div>
        ${customerSecondary?`<div class="print-customer-details">${customerSecondary}</div>`:''}
      </div>
      ${docMeta}
    </section>

    <section class="print-service-intro">
      <h2>${escapeHtml(calc.serviceLabel)}</h2>
      <p>${currentLang==='de'?'regulär':'regular'} ${money(calc.monthly)} / ${currentLang==='de'?'Monat':'month'} · ${vatStatus}</p>
    </section>

    <section class="print-breakdown-legacy">
      ${rows.map(([a,b],i)=>`<div class="print-line ${i===rows.length-1?'vat-line':''}"><span>${a}</span><strong>${b}</strong></div>`).join('')}
    </section>

    <section class="print-month-totals">
      <div class="print-month-row"><span>${regularMonthLabel}</span><strong>${money(calc.monthly)}</strong></div>
      ${calc.promoPct?`<div class="print-month-row promo"><span>${promoMonthLabel}</span><strong>${money(calc.firstMonth)}</strong></div>`:''}
    </section>

    <div class="print-note">${terms}${includeChecklist?`<div class="print-checklist-attached"><span class="attached-check" aria-hidden="true"></span>${escapeHtml(checklistUiText().attachment)}</div>`:''}</div>
    ${billingHtml}
    ${printCompanyFooterHtml(legalTaxNote)}
  </div>
  ${includeChecklist?buildChecklistPrintPages(customerPrimary,customerSecondary):''}`;
  $('#printSheet').setAttribute('aria-hidden','false');
  void $('#printSheet').offsetHeight;
  window.print();
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function callAdmin(action){
  const {data:{session}}=await supabase.auth.getSession(); if(!session)throw new Error(t('adminNeeded'));
  const r=await fetch(`${FRANKIFLOW_CONFIG.supabaseUrl}/functions/v1/pricing-admin`,{method:'POST',headers:{'Content-Type':'application/json','apikey':FRANKIFLOW_CONFIG.supabasePublishableKey,'Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({action})}); const j=await r.json().catch(()=>({})); if(!r.ok)throw new Error(j.error||'Admin request failed'); return j;
}
async function detectAdmin(){
  if(!new URLSearchParams(location.search).has('admin'))return; const {data:{session}}=await supabase.auth.getSession(); if(!session)return;
  const {data}=await supabase.from('pricing_admin_users').select('user_id,role,active').eq('user_id',session.user.id).eq('active',true).maybeSingle(); if(data?.role==='admin'){isAdmin=true;$('#printInvoice').classList.remove('hidden');$('#serviceDateWrap').classList.remove('hidden')}
}
async function createInvoice(){
  if(!isAdmin)return alert(t('adminNeeded')); if(!$('#customerName').value.trim()||!$('#customerAddress').value.trim())return alert(currentLang==='de'?'Für eine Rechnung bitte Name und Rechnungs-/Leistungsadresse eintragen.':'Please enter customer name and billing/service address for an invoice.');
  const btn=$('#printInvoice'),old=btn.textContent;btn.disabled=true;btn.textContent=currentLang==='de'?'Rechnung wird vorbereitet …':'Preparing invoice …';
  try{const b=await callAdmin('get_private_billing');const n=await callAdmin('reserve_invoice_number');printDoc('invoice',b.billing,n.invoice_number)}catch(e){alert(e.message)}finally{btn.disabled=false;btn.textContent=old}
}

$$('[data-lang]').forEach(b=>b.addEventListener('click',()=>{currentLang=b.dataset.lang;applyLanguage()}));
$('#calculatorForm').addEventListener('input',calculate);$('#calculatorForm').addEventListener('change',calculate);$('#windowCleaning').addEventListener('change',()=>{updateServiceMode();calculate()});$('#printQuote').addEventListener('click',()=>printDoc('quote'));$('#printInvoice').addEventListener('click',createInvoice);
$('#viewChecklist')?.addEventListener('click',()=>{const preview=$('#checklistPreview');preview?.classList.toggle('hidden');updateChecklistUi();});
$('#includeChecklist')?.addEventListener('change',()=>renderChecklistPreview());
await loadConfig(); renderServices(); renderFrequency(); renderContracts(); updateDynamicLabels(); applyLanguage(); await detectAdmin(); calculate(); updateChecklistUi();
