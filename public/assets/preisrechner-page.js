import {FRANKIFLOW_CONFIG} from './config.js';
import {loadPricing,calculateEstimate} from './pricing.js';
const money=new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'});
document.querySelector('[data-whatsapp]').href=FRANKIFLOW_CONFIG.defaultWhatsApp;
const cfg=await loadPricing();
const svc=document.querySelector('#serviceKey'),freq=document.querySelector('#frequencyKey'),months=document.querySelector('#contractMonths');
Object.entries(cfg.service_settings.services).filter(([,v])=>v.enabled!==false).forEach(([k,v])=>svc.add(new Option(v.label,k)));
cfg.frequency_settings.options.forEach(o=>{const op=new Option(o.label,o.key);op.dataset.visits=o.visits_per_month;freq.add(op)});
cfg.contract_settings.months.forEach(m=>months.add(new Option(m===1?'1 Monat / flexibel':m+' Monate',m)));
function recalc(){const r=calculateEstimate(cfg,{serviceKey:svc.value,areaSqm:document.querySelector('#areaSqm').value,visitsPerMonth:freq.selectedOptions[0]?.dataset.visits,contractMonths:months.value,windowSqm:document.querySelector('#windowSqm').value,equipment:document.querySelector('#equipment').checked,deepCleaning:document.querySelector('#deepCleaning').checked});document.querySelector('#estimateMonthly').textContent=money.format(r.monthly);document.querySelector('#estimateFirstMonth').textContent='1. Monat mit Neukundenrabatt: '+money.format(r.firstMonth)}
document.querySelector('#calculatorForm').addEventListener('input',recalc);document.querySelector('#calculatorForm').addEventListener('change',recalc);recalc();
