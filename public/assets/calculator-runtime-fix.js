import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js?v=20260914-calcfix3';
import { calculatePricing } from './calculator-engine.js?v=20260914-calcfix3';
import { applyChecklistRows, localizeChecklistSections } from './checklists.js';

const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const clone=v=>JSON.parse(JSON.stringify(v));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(v,lang)=>new Intl.NumberFormat(lang==='de'?'de-DE':'en-IE',{style:'currency',currency:'EUR'}).format(Number(v)||0);

const fallback={
  contract_settings:{months:[1,3,6,9,12,24],base_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}},
  deep_cleaning_settings:{label:'Grundreinigung',enabled:true,surcharge_pct:34},
  equipment_settings:{base:5,enabled:true,gradient_per_sqm:.01},
  frequency_settings:{options:[
    {key:'once',label:'Einmalig',visits_per_month:1},{key:'monthly',label:'1× pro Monat',visits_per_month:1},
    {key:'biweekly',label:'Alle 2 Wochen',visits_per_month:2},{key:'weekly1',label:'1× pro Woche',visits_per_month:4},
    {key:'weekly2',label:'2× pro Woche',visits_per_month:8},{key:'weekly3',label:'3× pro Woche',visits_per_month:12},
    {key:'weekly4',label:'4× pro Woche',visits_per_month:16},{key:'weekly5',label:'5× pro Woche',visits_per_month:20}
  ]},
  promotion_settings:{label:'25% Neukundenrabatt im ersten Monat',enabled:true,first_month_discount_pct:25},
  service_settings:{services:{
    buero:{label:'Büroreinigung',base_1m:24,enabled:true},airbnb:{label:'Ferienwohnung / Airbnb',base_1m:26,enabled:true},
    wohnung:{label:'Wohnungsreinigung',base_1m:30,enabled:true},treppenhaus:{label:'Treppenhausreinigung',base_1m:24,enabled:true}
  },gradient_per_sqm:.2304,minimum_cleaning_charge:30},
  vat_settings:{label:'MwSt. zum Rechnungsbetrag hinzufügen',enabled:true,rate_pct:19,customer_pays_default:false},
  window_settings:{base:5,enabled:true,minimum:35,gradient_per_sqm:3,contract_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}}
};

const serviceEnglish={buero:'Office cleaning',wohnung:'Home cleaning',airbnb:'Holiday rental / Airbnb',treppenhaus:'Stairwell cleaning',fenster:'Window cleaning'};
const serviceHints={
  de:{buero:'Büro, Praxis & Gewerbe',wohnung:'Wohnung & Privathaushalt',airbnb:'Turnover & Ferienunterkunft',treppenhaus:'Mehrfamilienhaus & Gemeinschaftsfläche',fenster:'Nur Fenster & Glasflächen'},
  en:{buero:'Office, practice & commercial',wohnung:'Apartment & private home',airbnb:'Turnover & holiday rental',treppenhaus:'Apartment building & common areas',fenster:'Windows & glass only'}
};
const freqEnglish={once:'One-time',monthly:'1× per month',biweekly:'Every 2 weeks',weekly1:'1× per week',weekly2:'2× per week',weekly3:'3× per week',weekly4:'4× per week',weekly5:'5× per week'};

let cfg=clone(fallback);
let lastResult=null;
const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);

function language(){
  if($('.language-switch [data-lang="en"]')?.classList.contains('active'))return 'en';
  const saved=localStorage.getItem('frankiflow-lang')||localStorage.getItem('ff-price-lang');
  return saved==='en'?'en':'de';
}

function installUiStyles(){
  if($('#ff-calculator-runtime-styles'))return;
  const style=document.createElement('style');
  style.id='ff-calculator-runtime-styles';
  style.textContent=`
    #breakdownRows{display:grid;gap:0}
    #breakdownRows .breakdown-row{display:grid!important;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:14px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.09);font-size:12px;line-height:1.38;color:#d5e4ea}
    #breakdownRows .breakdown-row:last-child{border-bottom:0}
    #breakdownRows .breakdown-row span{min-width:0;color:#bad0db;font-weight:600;overflow-wrap:anywhere}
    #breakdownRows .breakdown-row b{max-width:150px;color:#fff;text-align:right;font-weight:800;overflow-wrap:anywhere}
    .checklist-toolbar{display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:center}
    .checklist-include{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border:1px solid #dce6eb;border-radius:14px;background:#f9fcfc;cursor:pointer}
    .checklist-include>input{position:absolute;opacity:0;pointer-events:none}
    .checkmark-box{width:22px;height:22px;border-radius:7px;background:#e5eeee;color:transparent;display:grid;place-items:center;flex:0 0 auto;font-size:12px;font-weight:900}
    .checklist-include input:checked+.checkmark-box{background:#0aa5a6;color:#fff}
    .checklist-include strong{display:block;font-size:12px;color:#183649}
    .checklist-include small{display:block;margin-top:3px;color:#718591;font-size:10px;line-height:1.4}
    .checklist-preview{margin-top:18px;border:1px solid #dce8e8;border-radius:18px;background:#f8fcfb;padding:18px;box-shadow:inset 0 1px rgba(255,255,255,.8)}
    .checklist-preview-head{display:flex;justify-content:space-between;gap:15px;padding-bottom:13px;margin-bottom:13px;border-bottom:1px solid #dce8e8}
    .checklist-preview-head span{display:block;font-size:10px;font-weight:900;letter-spacing:.1em;color:#0a9192;text-transform:uppercase}
    .checklist-preview-head strong{display:block;margin-top:4px;font-size:15px;color:#0b2d42}
    .checklist-screen-group+ .checklist-screen-group{margin-top:18px;padding-top:16px;border-top:1px solid #dce8e8}
    .checklist-screen-group>h3{margin:0 0 12px;font-size:15px;color:#0b2d42}
    .checklist-screen-section{margin-top:12px}
    .checklist-screen-section h4{margin:0 0 7px;font-size:12px;color:#315064}
    .checklist-screen-items{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 12px}
    .checklist-screen-item{display:grid;grid-template-columns:18px minmax(0,1fr);gap:7px;align-items:start;color:#4b6473;font-size:11px;line-height:1.45}
    .checklist-screen-item em{font-style:normal}
    .check-symbol{width:16px;height:16px;border-radius:50%;margin-top:1px;background:#dff5f1;position:relative}
    .check-symbol:after{content:'✓';position:absolute;inset:0;display:grid;place-items:center;color:#078b8b;font-size:10px;font-weight:900}
    .check-symbol.optional{background:#f1f3f4}
    .check-symbol.optional:after{content:'+';color:#71828c}
    .checklist-optional-label{display:inline-flex;margin:0 0 7px;padding:3px 7px;border-radius:999px;background:#eef3f4;color:#697c86;font-size:9px;font-weight:800}
    .checklist-scope-note{margin:16px 0 0;padding-top:12px;border-top:1px solid #dce8e8;color:#7c8f98;font-size:10px;line-height:1.5}
    .checklist-empty{padding:18px;border-radius:12px;background:#fff;color:#6f838d;font-size:12px;text-align:center}
    @media(max-width:720px){
      #breakdownRows .breakdown-row{grid-template-columns:minmax(0,1fr) minmax(90px,42%);gap:10px}
      #breakdownRows .breakdown-row b{max-width:none}
      .checklist-toolbar{grid-template-columns:1fr}
      .checklist-screen-items{grid-template-columns:1fr}
    }
  `;
  document.head.append(style);
}

function ensureServices(){
  const host=$('#serviceOptions'); if(!host)return;
  const current=$('input[name="serviceKey"]:checked')?.value||host.dataset.lastService||'buero';
  const entries=Object.entries(cfg.service_settings?.services||{}).filter(([,v])=>v?.enabled!==false);
  if(cfg.window_settings?.enabled!==false)entries.push(['fenster',{label:'Fensterreinigung',enabled:true}]);
  if(!entries.length)return;
  const selected=entries.some(([k])=>k===current)?current:entries[0][0];
  const needsBuild=!host.querySelector('input[name="serviceKey"]')||host.querySelectorAll('input[name="serviceKey"]').length!==entries.length;
  if(needsBuild){
    const lang=language();
    host.innerHTML=entries.map(([key,v],i)=>`<label class="service-choice ${key==='fenster'?'service-window-choice ':''}${selected===key?'active':''}"><input type="radio" name="serviceKey" value="${key}" ${selected===key?'checked':''}><span class="choice-icon">${String(i+1).padStart(2,'0')}</span><span><strong>${lang==='en'?(serviceEnglish[key]||v.label):v.label}</strong><small>${serviceHints[lang][key]||''}</small></span></label>`).join('');
  }else{
    const lang=language();
    $$('.service-choice',host).forEach(label=>{
      const input=label.querySelector('input[name="serviceKey"]'); const key=input?.value;
      label.classList.toggle('active',!!input?.checked);
      const strong=label.querySelector('strong'),small=label.querySelector('small'),v=entries.find(([k])=>k===key)?.[1];
      if(strong&&v)strong.textContent=lang==='en'?(serviceEnglish[key]||v.label):v.label;
      if(small&&key)small.textContent=serviceHints[lang][key]||'';
    });
  }
  host.dataset.lastService=selected;
}

function ensureSelects(){
  const lang=language();
  const frequency=$('#frequency'),contract=$('#contractMonths'),newCustomer=$('#newCustomer');
  if(frequency){
    const previous=frequency.value||'weekly1'; const options=Array.isArray(cfg.frequency_settings?.options)?cfg.frequency_settings.options:fallback.frequency_settings.options;
    frequency.innerHTML=options.map(o=>`<option value="${o.key}">${lang==='en'?(freqEnglish[o.key]||o.label):o.label}</option>`).join('');
    frequency.value=options.some(o=>o.key===previous)?previous:(options.find(o=>o.key==='weekly1')?.key||options[0]?.key||'');
  }
  if(contract){
    const previous=contract.value||'1'; const months=Array.isArray(cfg.contract_settings?.months)&&cfg.contract_settings.months.length?cfg.contract_settings.months:fallback.contract_settings.months;
    contract.innerHTML=months.map(m=>`<option value="${m}">${m} ${lang==='de'?(Number(m)===1?'Monat':'Monate'):(Number(m)===1?'month':'months')}</option>`).join('');
    contract.value=months.map(String).includes(String(previous))?String(previous):String(months[0]||1);
  }
  if(newCustomer){
    const previous=newCustomer.value||'yes';
    newCustomer.innerHTML=lang==='en'?'<option value="yes">Yes</option><option value="no">No</option>':'<option value="yes">Ja</option><option value="no">Nein</option>';
    newCustomer.value=previous==='no'?'no':'yes';
  }
}

function syncServiceMode(){
  const serviceKey=$('input[name="serviceKey"]:checked')?.value||'buero';
  const windowOnly=serviceKey==='fenster';
  const windows=windowOnly||!!$('#windowCleaning')?.checked;
  $('#deepWrap')?.classList.toggle('hidden',windowOnly);
  $('#equipmentWrap')?.classList.toggle('hidden',windowOnly);
  $('#windowWrap')?.classList.toggle('hidden',windowOnly);
  $('#areaFieldWrap')?.classList.toggle('hidden',windowOnly);
  const areaWrap=$('#windowAreaWrap'),primary=$('#windowPrimarySlot'),extra=$('#windowExtraSlot');
  if(areaWrap&&primary&&extra){
    const target=windowOnly?primary:extra;
    if(areaWrap.parentElement!==target)target.append(areaWrap);
    areaWrap.classList.toggle('hidden',!windows);
    primary.classList.toggle('hidden',!windowOnly);
  }
}

function state(){
  const options=Array.isArray(cfg.frequency_settings?.options)&&cfg.frequency_settings.options.length?cfg.frequency_settings.options:fallback.frequency_settings.options;
  const freq=options.find(o=>o.key===$('#frequency')?.value)||options.find(o=>o.key==='weekly1')||options[0];
  const serviceKey=$('input[name="serviceKey"]:checked')?.value||'buero';
  const windowOnly=serviceKey==='fenster';
  return {
    serviceKey,windowOnly,
    area:windowOnly?0:Math.max(0,Number($('#areaSqm')?.value)||0),
    freq,
    months:Math.max(1,Number($('#contractMonths')?.value)||1),
    newCustomer:($('#newCustomer')?.value||'yes')==='yes',
    deep:windowOnly?false:!!$('#deepCleaning')?.checked,
    equipment:windowOnly?false:!!$('#equipment')?.checked,
    vat:!!$('#includeVat')?.checked,
    windows:windowOnly||!!$('#windowCleaning')?.checked,
    windowArea:Math.max(0,Number($('#windowSqm')?.value)||0)
  };
}

function serviceLabel(result,lang){
  if(lang==='en')return serviceEnglish[result.serviceKey]||result.service?.label||result.serviceKey;
  return result.service?.label||result.serviceKey;
}

function checklistText(){
  return language()==='en'
    ?{title:'Service checklist',hint:'Review the standard tasks included for the selected cleaning service.',view:'View checklist',hide:'Close checklist',attach:'Attach checklist to quotation',attachHint:'The service checklist will be included when the quotation is printed.',selected:'Selected cleaning',deep:'Extended deep cleaning',windows:'Window cleaning',empty:'No checklist is available for this selection.',note:'The checklist describes the standard service scope. The specifically agreed services and on-site conditions remain decisive.',optional:'Only when specifically agreed'}
    :{title:'Leistungscheckliste',hint:'Prüfen Sie die Standardleistungen der ausgewählten Reinigung.',view:'Checkliste ansehen',hide:'Checkliste schließen',attach:'Checkliste dem Angebot beifügen',attachHint:'Die Leistungscheckliste wird beim Drucken des Angebots beigefügt.',selected:'Ausgewählte Reinigung',deep:'Erweiterte Grundreinigung',windows:'Fensterreinigung',empty:'Für diese Auswahl ist keine Checkliste verfügbar.',note:'Die Checkliste beschreibt den Standard-Leistungsumfang. Maßgeblich bleiben die konkret vereinbarten Leistungen und die Gegebenheiten vor Ort.',optional:'Nur nach ausdrücklicher Vereinbarung'};
}

function checklistGroups(result){
  if(!result)return [];
  const lang=language(); const text=checklistText(); const groups=[];
  if(result.windowOnly){
    const sections=localizeChecklistSections('windows',lang);
    if(sections.length)groups.push({label:text.windows,sections});
    return groups;
  }
  const base=localizeChecklistSections(result.serviceKey,lang);
  if(base.length)groups.push({label:serviceLabel(result,lang),sections:base});
  if(result.deep){
    const sections=localizeChecklistSections('deep',lang);
    if(sections.length)groups.push({label:text.deep,sections});
  }
  if(result.windows){
    const sections=localizeChecklistSections('windows',lang);
    if(sections.length)groups.push({label:text.windows,sections});
  }
  return groups;
}

function checklistSectionHtml(section){
  const text=checklistText();
  return `<section class="checklist-screen-section ${section.optional?'optional-section':''}"><h4>${esc(section.title)}</h4>${section.optional?`<div class="checklist-optional-label">${esc(text.optional)}</div>`:''}<div class="checklist-screen-items">${section.items.map(item=>`<div class="checklist-screen-item"><span class="check-symbol ${section.optional?'optional':'included'}" aria-hidden="true"></span><em>${esc(item)}</em></div>`).join('')}</div></section>`;
}

function renderChecklist(result=lastResult){
  const preview=$('#checklistPreview'); if(!preview)return;
  const text=checklistText(); const groups=checklistGroups(result);
  const summary=result?[serviceLabel(result,language()),result.deep?text.deep:'',result.windows&&!result.windowOnly?text.windows:''].filter(Boolean).join(' · '):'';
  preview.innerHTML=groups.length
    ?`<div class="checklist-preview-head"><div><span>${esc(text.selected)}</span><strong>${esc(summary)}</strong></div></div>${groups.map(group=>`<div class="checklist-screen-group"><h3>${esc(group.label)}</h3>${group.sections.map(checklistSectionHtml).join('')}</div>`).join('')}<p class="checklist-scope-note">${esc(text.note)}</p>`
    :`<div class="checklist-empty">${esc(text.empty)}</div>`;
  if($('#checklistTitle'))$('#checklistTitle').textContent=text.title;
  if($('#checklistHint'))$('#checklistHint').textContent=text.hint;
  if($('#includeChecklistLabel'))$('#includeChecklistLabel').textContent=text.attach;
  if($('#includeChecklistHint'))$('#includeChecklistHint').textContent=text.attachHint;
  const btn=$('#viewChecklist'); if(btn)btn.textContent=preview.classList.contains('hidden')?text.view:text.hide;
}

function render(result){
  lastResult=result; const lang=language();
  if($('#visitPrice'))$('#visitPrice').textContent=money(result.visitTotal,lang);
  if($('#monthlyPrice'))$('#monthlyPrice').textContent=money(result.monthly,lang);
  if($('#firstMonthPrice'))$('#firstMonthPrice').textContent=money(result.firstMonth,lang);
  if($('#vatStatus'))$('#vatStatus').textContent=result.vatRate?(lang==='en'?'VAT included':'MwSt. enthalten'):(lang==='en'?'VAT not included':'MwSt. nicht enthalten');
  if($('#discountLabel'))$('#discountLabel').textContent=`${result.promoPct}% ${lang==='en'?'discount applied':'Rabatt berücksichtigt'}`;
  $('#promotionBox')?.classList.toggle('hidden',!result.promoPct);
  if($('#contractSaving'))$('#contractSaving').textContent=result.reductionPct?`${result.reductionPct}% ${lang==='en'?'saving on the base component':'Vorteil auf den Basisanteil'}`:'';

  const rows=[];
  rows.push([lang==='en'?'Service':'Leistung',`${serviceLabel(result,lang)}${!result.windowOnly&&result.area?` · ${result.area} m²`:''}`]);
  rows.push([lang==='en'?'Frequency':'Häufigkeit',`${result.visits} ${lang==='en'?'visits/month':'Termine/Monat'}`]);
  if(!result.windowOnly&&result.floorVisit>0)rows.push([lang==='en'?'Cleaning / visit':'Reinigung / Termin',money(result.floorVisit,lang)]);
  if(result.equipmentVisit>0)rows.push([lang==='en'?'Equipment / visit':'Equipment / Termin',money(result.equipmentVisit,lang)]);
  if(result.windowCharge>0)rows.push([lang==='en'?'Window cleaning / visit':'Fensterreinigung / Termin',`${money(result.windowCharge,lang)}${result.windowArea?` · ${result.windowArea} m²`:''}`]);
  if(result.windowReductionPct>0&&result.windowCharge>0)rows.push([lang==='en'?'Window contract saving':'Fenster-Laufzeitvorteil',`−${result.windowReductionPct}%`]);
  rows.push([lang==='en'?'Total / visit':'Gesamt / Termin',money(result.visitTotal,lang)]);
  rows.push([lang==='en'?'Contract duration':'Vertragslaufzeit',`${result.months} ${lang==='en'?(result.months===1?'month':'months'):(result.months===1?'Monat':'Monate')}`]);
  const host=$('#breakdownRows');
  if(host)host.innerHTML=rows.map(([a,b])=>`<div class="breakdown-row"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('');

  renderChecklist(result);
  document.dispatchEvent(new CustomEvent('frankiflow:calculator-updated',{detail:result}));
}

function showCalculationError(error){
  console.error('FrankiFlow calculator runtime error',error);
  const lang=language();
  const msg=lang==='en'?'The estimate could not be recalculated. Please change a field or reload the page.':'Der Richtpreis konnte nicht neu berechnet werden. Bitte ändern Sie ein Feld oder laden Sie die Seite neu.';
  if($('#breakdownRows'))$('#breakdownRows').innerHTML=`<div class="breakdown-row"><span>${esc(msg)}</span><b>!</b></div>`;
}

function recalc(){
  try{ensureServices();ensureSelects();syncServiceMode();render(calculatePricing(cfg,state()));}
  catch(error){showCalculationError(error)}
}

async function refreshConfig(){
  try{
    const [pricingResult,checklistResult]=await Promise.all([
      supabase.from('pricing_config').select('key,value').eq('is_public',true),
      supabase.from('frankiflow_checklists').select('service_key,label_de,label_en,sections')
    ]);
    if(!checklistResult.error&&checklistResult.data?.length)applyChecklistRows(checklistResult.data);
    if(!pricingResult.error&&pricingResult.data?.length){
      const next=clone(fallback);
      for(const row of pricingResult.data){if(row?.key&&row.value&&typeof row.value==='object')next[row.key]=row.value;}
      if(!next.window_settings?.contract_reduction_pct)next.window_settings={...next.window_settings,contract_reduction_pct:{...(next.contract_settings?.base_reduction_pct||fallback.window_settings.contract_reduction_pct)}};
      cfg=next;
    }
    ensureServices();ensureSelects();recalc();
  }catch(error){console.warn('FrankiFlow live configuration unavailable; verified fallback remains active',error);recalc();}
}

function bindChecklist(){
  const btn=$('#viewChecklist'),preview=$('#checklistPreview');
  if(!btn||!preview||btn.dataset.runtimeBound==='1')return;
  btn.dataset.runtimeBound='1';
  // Capture-phase ownership prevents the older handler from double-toggling the panel.
  btn.addEventListener('click',event=>{
    event.preventDefault();event.stopImmediatePropagation();
    preview.classList.toggle('hidden');
    renderChecklist(lastResult);
  },true);
}

function bind(){
  if(!$('#calculatorForm')||window.__frankiflowRuntimeFixBound)return;
  window.__frankiflowRuntimeFixBound=true;
  installUiStyles();bindChecklist();ensureServices();ensureSelects();syncServiceMode();recalc();
  $('#calculatorForm').addEventListener('input',()=>queueMicrotask(recalc));
  $('#calculatorForm').addEventListener('change',()=>queueMicrotask(recalc));
  $$('.language-switch [data-lang]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>{ensureServices();ensureSelects();recalc();renderChecklist(lastResult)},0)));
  let checks=0;const watchdog=setInterval(()=>{
    checks+=1;
    const missing=!$('#frequency')?.options.length||!$('#contractMonths')?.options.length||['—',''].includes($('#visitPrice')?.textContent?.trim()||'');
    if(missing)recalc();
    if(checks>=20||(!missing&&lastResult))clearInterval(watchdog);
  },250);
  void refreshConfig();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
