import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js?v=20260914-calcfix2';
import { calculatePricing } from './calculator-engine.js?v=20260914-calcfix2';

const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const clone=v=>JSON.parse(JSON.stringify(v));
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
  rows.push([lang==='en'?'Service':'Leistung',serviceLabel(result,lang)]);
  rows.push([lang==='en'?'Frequency':'Häufigkeit',`${result.visits} ${lang==='en'?'visits/month':'Termine/Monat'}`]);
  if(!result.windowOnly&&result.floorVisit>0)rows.push([lang==='en'?'Cleaning / visit':'Reinigung / Termin',money(result.floorVisit,lang)]);
  if(result.equipmentVisit>0)rows.push([lang==='en'?'Equipment / visit':'Equipment / Termin',money(result.equipmentVisit,lang)]);
  if(result.windowCharge>0)rows.push([lang==='en'?'Window cleaning / month':'Fensterreinigung / Monat',money(result.windowCharge,lang)]);
  if(result.windowReductionPct>0&&result.windowCharge>0)rows.push([lang==='en'?'Window contract saving':'Fenster-Laufzeitvorteil',`${result.windowReductionPct}%`]);
  const host=$('#breakdownRows');
  if(host)host.innerHTML=rows.map(([a,b])=>`<div><span>${a}</span><strong>${b}</strong></div>`).join('');
  document.dispatchEvent(new CustomEvent('frankiflow:calculator-updated',{detail:result}));
}

function showCalculationError(error){
  console.error('FrankiFlow resilient calculator error',error);
  const lang=language();
  const msg=lang==='en'?'Please change a field to recalculate.':'Bitte ändern Sie ein Feld, um neu zu berechnen.';
  if($('#breakdownRows'))$('#breakdownRows').innerHTML=`<div><span>${msg}</span></div>`;
}

function recalc(){
  try{ensureServices();ensureSelects();syncServiceMode();render(calculatePricing(cfg,state()));}
  catch(error){showCalculationError(error)}
}

async function refreshConfig(){
  try{
    const {data,error}=await supabase.from('pricing_config').select('key,value').eq('is_public',true);
    if(error||!data?.length)return;
    const next=clone(fallback);
    for(const row of data){if(row?.key&&row.value&&typeof row.value==='object')next[row.key]=row.value;}
    if(!next.window_settings?.contract_reduction_pct)next.window_settings={...next.window_settings,contract_reduction_pct:{...(next.contract_settings?.base_reduction_pct||fallback.window_settings.contract_reduction_pct)}};
    cfg=next; ensureServices(); ensureSelects(); recalc();
  }catch(error){console.warn('FrankiFlow pricing config fallback remains active',error)}
}

function bind(){
  if(!$('#calculatorForm')||window.__frankiflowRuntimeFixBound)return;
  window.__frankiflowRuntimeFixBound=true;
  ensureServices();ensureSelects();syncServiceMode();recalc();
  $('#calculatorForm').addEventListener('input',()=>queueMicrotask(recalc));
  $('#calculatorForm').addEventListener('change',()=>queueMicrotask(recalc));
  $$('.language-switch [data-lang]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>{ensureServices();ensureSelects();recalc()},0)));
  // Repair any slow/failed primary-module startup without waiting for Supabase.
  let checks=0;const watchdog=setInterval(()=>{
    checks+=1;
    const missing=!$('#frequency')?.options.length||!$('#contractMonths')?.options.length||['—',''].includes($('#visitPrice')?.textContent?.trim()||'');
    if(missing)recalc();
    if(checks>=20||(!missing&&lastResult))clearInterval(watchdog);
  },250);
  void refreshConfig();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
