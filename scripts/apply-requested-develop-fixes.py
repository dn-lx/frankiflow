from pathlib import Path
import json, re

ROOT=Path('.')

def read(path): return (ROOT/path).read_text()
def write(path, content):
    p=ROOT/path; p.parent.mkdir(parents=True, exist_ok=True); p.write_text(content)
def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing pattern for {label}')
    return text.replace(old,new,1)

# 1) About Us is a homepage accordion section only — no dedicated page.
def patch_home(path, english=False):
    s=read(path)
    s=s.replace('href="/about/"','href="#about"')
    if 'id="about"' not in s:
        if english:
            section='''<section class="section about-home-section" id="about">\n<div class="container">\n<div class="section-head modern-head"><div><span class="eyebrow">About Us</span><h2>The story behind <span class="teal-text">FrankiFlow.</span></h2></div><p>Three parts of our story — simple to explore and easy to read.</p></div>\n<div class="about-accordion" id="aboutAccordion"><div class="about-accordion-loading">Loading our story …</div></div>\n</div>\n</section>\n'''
        else:
            section='''<section class="section about-home-section" id="about">\n<div class="container">\n<div class="section-head modern-head"><div><span class="eyebrow">Über uns</span><h2>Die Geschichte hinter <span class="teal-text">FrankiFlow.</span></h2></div><p>Drei Teile unserer Geschichte – übersichtlich als Akkordeon.</p></div>\n<div class="about-accordion" id="aboutAccordion"><div class="about-accordion-loading">Unsere Geschichte wird geladen …</div></div>\n</div>\n</section>\n'''
        marker='<section class="section why-section" id="warum">'
        s=replace_once(s,marker,section+marker,f'{path} about insertion')
    write(path,s)

patch_home('public/index.html',False)
patch_home('public/en/index.html',True)

# Remove dedicated About page/assets and sitemap entry.
for p in ['public/about/index.html','public/assets/about-page.js','public/assets/about-page.css']:
    (ROOT/p).unlink(missing_ok=True)
sitemap=read('public/sitemap.xml')
sitemap='\n'.join(line for line in sitemap.splitlines() if 'https://frankiflow.de/about/' not in line)+'\n'
write('public/sitemap.xml',sitemap)

homepage_about=r'''import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { getLanguage } from './site-i18n.js';

const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let aboutSections=[];

function splitParagraphs(text=''){return String(text).split(/\n\s*\n/g).map(x=>x.trim()).filter(Boolean)}

function keepAccommodationsLast(){
  const nav=$('.nav-links');if(!nav)return;
  let link=nav.querySelector('.nav-accommodations,a[href^="https://accommodation.frankiflow.de"]');
  if(!link){link=document.createElement('a');link.href='https://accommodation.frankiflow.de/';link.className='nav-accommodations';}
  link.textContent='Accommodations';link.classList.add('nav-accommodations');nav.append(link);
}

function keepAboutSectionLink(){
  const lang=getLanguage()==='en'?'en':'de';
  const nav=$('.nav-links');
  let navLink=nav?.querySelector('a[href="#about"],a[href="/about/"],[data-section-link="about"]');
  if(nav&&!navLink){navLink=document.createElement('a');const why=nav.querySelector('a[href="#warum"]');why?nav.insertBefore(navLink,why):nav.append(navLink)}
  if(navLink){navLink.href='#about';navLink.textContent=lang==='en'?'About Us':'Über uns';navLink.dataset.sectionLink='about';navLink.classList.remove('hidden')}
  $$('.footer-links a[href="/about/"],.footer-links a[href="#about"],[data-section-link="about"]').forEach(link=>{link.href='#about';link.textContent=lang==='en'?'About Us':'Über uns';link.dataset.sectionLink='about'});
}

function renderAboutAccordion(){
  const host=$('#aboutAccordion');if(!host)return;
  const lang=getLanguage()==='en'?'en':'de';
  const items=aboutSections.slice(0,3);
  if(!items.length){host.innerHTML=`<div class="about-accordion-loading">${lang==='en'?'Our story is temporarily unavailable.':'Unsere Geschichte ist vorübergehend nicht verfügbar.'}</div>`;return}
  host.innerHTML=items.map(item=>{
    const heading=lang==='en'?(item.heading_en||item.heading_de):(item.heading_de||item.heading_en);
    const body=lang==='en'?(item.body_en||item.body_de):(item.body_de||item.body_en);
    return `<details class="about-accordion-item"><summary><span>${esc(heading||'')}</span><span class="about-accordion-toggle" aria-hidden="true"></span></summary><div class="about-accordion-copy">${splitParagraphs(body).map(p=>`<p>${esc(p)}</p>`).join('')}</div></details>`;
  }).join('');
  $$('.about-accordion-item',host).forEach(item=>item.addEventListener('toggle',()=>{if(!item.open)return;$$('.about-accordion-item',host).forEach(other=>{if(other!==item)other.open=false})}));
}

async function loadAboutAccordion(){
  const {data,error}=await supabase.from('frankiflow_site_settings').select('about_sections').eq('id',1).maybeSingle();
  if(!error&&Array.isArray(data?.about_sections))aboutSections=data.about_sections;
  renderAboutAccordion();
}

keepAboutSectionLink();
keepAccommodationsLast();
loadAboutAccordion();
window.addEventListener('frankiflow:language',()=>setTimeout(()=>{keepAboutSectionLink();keepAccommodationsLast();renderAboutAccordion()},0));
'''
write('public/assets/homepage-about-nav.js',homepage_about)

styles=read('public/assets/styles.css')
marker='/* Homepage About accordion — section only */'
if marker not in styles:
    styles += r'''

/* Homepage About accordion — section only */
.about-home-section{background:linear-gradient(180deg,#f7fbfc 0%,#fff 100%)}
.about-home-section .section-head{margin-bottom:28px}
.about-accordion{display:grid;gap:12px;max-width:980px;margin:0 auto}
.about-accordion-item{border:1px solid var(--line,#dce8e5);border-radius:18px;background:#fff;overflow:hidden;box-shadow:0 10px 34px rgba(11,33,52,.045)}
.about-accordion-item summary{cursor:pointer;list-style:none;padding:20px 22px;font-weight:850;color:#0b3447;display:flex;justify-content:space-between;align-items:center;gap:18px;font-size:18px}
.about-accordion-item summary::-webkit-details-marker{display:none}.about-accordion-item summary::marker{display:none;content:''}
.about-accordion-toggle{width:30px;height:30px;border-radius:10px;background:#e8f7f5;position:relative;flex:none}
.about-accordion-toggle:before,.about-accordion-toggle:after{content:'';position:absolute;left:50%;top:50%;width:12px;height:2px;background:#147d7b;transform:translate(-50%,-50%);border-radius:2px}
.about-accordion-toggle:after{transform:translate(-50%,-50%) rotate(90deg);transition:.18s transform}
.about-accordion-item[open] .about-accordion-toggle:after{transform:translate(-50%,-50%) rotate(0deg)}
.about-accordion-copy{padding:0 22px 22px;border-top:1px solid #eef3f4}.about-accordion-copy p{margin:18px 0 0;color:#526a7b;line-height:1.75;text-align:left}
.about-accordion-loading{padding:24px;border:1px dashed #cbdadd;border-radius:16px;text-align:center;color:#607486;background:#fff}
@media(max-width:680px){.about-accordion-item summary{font-size:16px;padding:17px 18px}.about-accordion-copy{padding:0 18px 18px}.about-accordion-copy p{font-size:15px}}
'''
write('public/assets/styles.css',styles)

# 2) Pure calculator engine, including window-contract reductions.
engine=r'''const round2=v=>Math.round((Number(v||0)+Number.EPSILON)*100)/100;
const pct=v=>Math.max(0,Math.min(100,Number(v)||0));

export function calculatePricing(cfg,s){
  const service=s.windowOnly?{label:'Fensterreinigung',base_1m:0,enabled:true}:cfg.service_settings?.services?.[s.serviceKey];
  if(!service)throw new Error(`Unknown service: ${s.serviceKey}`);
  const months=String(Number(s.months)||1);
  const reductionPct=s.windowOnly?0:pct(cfg.contract_settings?.base_reduction_pct?.[months]);
  const reduction=reductionPct/100;
  const min=Number(cfg.service_settings?.minimum_cleaning_charge||0);
  const gradient=Number(cfg.service_settings?.gradient_per_sqm||0);
  const base=Number(service.base_1m||0);
  const adjustedBase=base*(1-reduction);

  let floorVisitNet=s.windowOnly?0:(s.area>0?Math.max(min,adjustedBase+s.area*gradient):0);
  if(!s.windowOnly&&s.area===0&&!s.windows)floorVisitNet=min;
  if(s.deep&&cfg.deep_cleaning_settings?.enabled)floorVisitNet*=1+pct(cfg.deep_cleaning_settings.surcharge_pct)/100;

  let equipmentVisitNet=0;
  if(!s.windowOnly&&s.equipment&&cfg.equipment_settings?.enabled){equipmentVisitNet=Number(cfg.equipment_settings.base||0)+s.area*Number(cfg.equipment_settings.gradient_per_sqm||0)}

  const windowMap=cfg.window_settings?.contract_reduction_pct||cfg.contract_settings?.base_reduction_pct||{};
  const windowReductionPct=(s.windows&&cfg.window_settings?.enabled)?pct(windowMap[months]):0;
  let windowChargeNet=0;
  if(s.windows&&cfg.window_settings?.enabled&&s.windowArea>0){
    const beforeDiscount=Math.max(Number(cfg.window_settings.minimum||0),Number(cfg.window_settings.base||0)+s.windowArea*Number(cfg.window_settings.gradient_per_sqm||0));
    windowChargeNet=beforeDiscount*(1-windowReductionPct/100);
  }

  const visits=Math.max(1,Number(s.freq?.visits_per_month||1));
  const vatRate=(s.vat&&cfg.vat_settings?.enabled)?pct(cfg.vat_settings.rate_pct)/100:0;
  const gross=v=>round2(Number(v||0)*(1+vatRate));

  // Round customer-visible line items first so displayed arithmetic reconciles to the cent.
  const floorVisit=gross(floorVisitNet);
  const equipmentVisit=gross(equipmentVisitNet);
  const windowCharge=gross(windowChargeNet);
  const visitTotal=s.windowOnly?windowCharge:round2(floorVisit+equipmentVisit);
  const monthly=s.windowOnly?round2(visitTotal*visits):round2(visitTotal*visits+(s.windows?windowCharge:0));

  const promoPct=(s.newCustomer&&cfg.promotion_settings?.enabled)?pct(cfg.promotion_settings.first_month_discount_pct):0;
  const promo=promoPct/100;
  let discountedFloorNet=floorVisitNet,discountedEquipmentNet=equipmentVisitNet,discountedWindowNet=windowChargeNet;
  if(promo>0){
    discountedFloorNet=floorVisitNet>0?Math.max(min,floorVisitNet*(1-promo)):0;
    discountedEquipmentNet=equipmentVisitNet*(1-promo);
    discountedWindowNet=windowChargeNet*(1-promo);
  }
  const firstVisit=s.windowOnly?gross(discountedWindowNet):round2(gross(discountedFloorNet)+gross(discountedEquipmentNet));
  const firstWindow=s.windowOnly?0:gross(discountedWindowNet);
  const firstMonth=s.windowOnly?round2(firstVisit*visits):round2(firstVisit*visits+(s.windows?firstWindow:0));

  return {...s,service,reductionPct,windowReductionPct,visits,vatRate,promoPct,
    floorVisitNet:round2(floorVisitNet),equipmentVisitNet:round2(equipmentVisitNet),windowChargeNet:round2(windowChargeNet),
    floorVisit,equipmentVisit,windowCharge,visitTotal,subtotal:monthly,monthly,firstMonth};
}
'''
write('public/assets/calculator-engine.js',engine)

calc=read('public/assets/calculator.js')
if "./calculator-engine.js" not in calc:
    calc=replace_once(calc,"import { applyChecklistRows, localizeChecklistSections } from './checklists.js';","import { applyChecklistRows, localizeChecklistSections } from './checklists.js';\nimport { calculatePricing } from './calculator-engine.js';",'calculator engine import')
calc=calc.replace("window_settings:{base:5,enabled:true,minimum:35,gradient_per_sqm:3}","window_settings:{base:5,enabled:true,minimum:35,gradient_per_sqm:3,contract_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}}")
calc=calc.replace("request:'Persönliches Angebot anfragen'","request:'Mit Angebot kontaktieren'")
calc=calc.replace("request:'Request a personal quote'","request:'Contact with the Quotation'")

calc=re.sub(r"function printCompanyFooterHtml\(taxNote=''\)\{.*?\n\}",'''function printCompanyFooterHtml(taxNote=''){
  return `<footer class="print-company-footer"><div class="print-footer-title">FrankiFlow Gebäudereinigung &amp; Objektbetreuung</div><div class="print-footer-founder">Inura Devasurendra · ${currentLang==='de'?'Gründer':'Founder'}</div><div class="print-company-grid"><div><span>${currentLang==='de'?'Telefon':'Phone'}</span><strong>+49 176 62493041</strong></div><div><span>${currentLang==='de'?'E-Mail':'Email'}</span><strong>info@frankiflow.de</strong></div><div><span>Website</span><strong>www.frankiflow.de</strong></div><div><span>${currentLang==='de'?'Steuernummer':'Tax no.'}</span><strong>014/811/68462</strong></div><div><span>W-IdNr.</span><strong>DE464605581</strong></div></div>${taxNote?`<div class="print-tax-note">${taxNote}</div>`:''}</footer>`;
}''',calc,count=1,flags=re.S)

start=calc.find('function calculate(){')
end=calc.find('\nfunction renderResult(){',start)
if start<0 or end<0: raise SystemExit('calculator calculate block not found')
new_calculate='''function calculate(){
  if(!cfg)return;
  const s=inputState();
  try{
    const result=calculatePricing(cfg,s);
    const service=result.service;
    calc={...result,serviceLabel:currentLang==='en'?(serviceEnglish[s.serviceKey]||service.label):service.label};
    renderResult();
  }catch(error){console.error('FrankiFlow calculator error',error)}
}'''
calc=calc[:start]+new_calculate+calc[end:]

calc=calc.replace("rows.push([currentLang==='de'?'Häufigkeit':'Frequency',`${calc.freq.visits_per_month} ${t('visitsMonth')}`]);","rows.push([currentLang==='de'?'Häufigkeit':'Frequency',`${calc.freq.visits_per_month} ${t('visitsMonth')}`]);\n    if(calc.windowReductionPct)rows.push([currentLang==='de'?'Fenster-Vertragsrabatt':'Window contract discount',`−${calc.windowReductionPct}%`]);")
calc=calc.replace("if(calc.windows)rows.push([`${t('windowCleaning')} (${currentLang==='de'?'1×/Monat':'1×/month'})`,`${calc.windowArea} m² · ${money(calc.windowCharge)}`]);","if(calc.windows)rows.push([`${t('windowCleaning')} (${currentLang==='de'?'1×/Monat':'1×/month'}${calc.windowReductionPct?` · −${calc.windowReductionPct}%`:''})`,`${calc.windowArea} m² · ${money(calc.windowCharge)}`]);")

if 'async function waitForPrintAssets()' not in calc:
    calc=replace_once(calc,'function printDoc(type,billing=null,invoiceNumber=null){','''async function waitForPrintAssets(){
  const images=[...$('#printSheet').querySelectorAll('img')];
  await Promise.all(images.map(img=>{
    if(img.complete&&img.naturalWidth>0)return img.decode?img.decode().catch(()=>{}):Promise.resolve();
    return new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true})});
  }));
}
async function printDoc(type,billing=null,invoiceNumber=null){''','print assets helper')
calc=calc.replace("?`${calc.promoPct}% Neukundenrabatt gilt ausschließlich im ersten Vertragsmonat. Mindestpreise bleiben bestehen. Diese Berechnung ist unverbindlich.`","?`${calc.promoPct}% Neukundenrabatt gilt ausschließlich im ersten Vertragsmonat. Vertragsvorteile sind in den ausgewiesenen Beträgen bereits berücksichtigt. Diese Berechnung ist unverbindlich.`")
calc=calc.replace(":`${calc.promoPct}% new-customer discount applies only to the first contract month. Minimum prices remain in force. This calculation is non-binding.`",":`${calc.promoPct}% new-customer discount applies only to the first contract month. Contract savings are already included in the displayed amounts. This calculation is non-binding.`")
calc=calc.replace("  void $('#printSheet').offsetHeight;\n  window.print();","  void $('#printSheet').offsetHeight;\n  await waitForPrintAssets();\n  window.print();")

request_helpers=r'''
function quoteSnapshot(){return{service_label:calc?.serviceLabel||'',frequency_label:calc?.freq?.label||$('#frequency option:checked')?.textContent||'',visit_price:calc?money(calc.visitTotal):'',monthly_price:calc?money(calc.monthly):'',first_month_price:calc?money(calc.firstMonth):'',breakdown:$('#breakdownRows')?.innerText||'',address:$('#customerAddress')?.value?.trim()||''};}
function syncRequestDialogLanguage(){
  const en=currentLang==='en';
  if($('#requestDialogTitle'))$('#requestDialogTitle').textContent=en?'Contact with the Quotation':'Mit Angebot kontaktieren';
  if($('#requestDialogIntro'))$('#requestDialogIntro').textContent=en?'Send your current calculated quotation and contact details directly to FrankiFlow.':'Senden Sie Ihr aktuell berechnetes Angebot zusammen mit Ihren Kontaktdaten direkt an FrankiFlow.';
  if($('#requestNameLabel'))$('#requestNameLabel').textContent=en?'Name':'Name';
  if($('#requestEmailLabel'))$('#requestEmailLabel').textContent=en?'Email':'E-Mail';
  if($('#requestPhoneLabel'))$('#requestPhoneLabel').textContent=en?'Phone':'Telefon';
  if($('#requestMessageLabel'))$('#requestMessageLabel').textContent=en?'Message / notes':'Nachricht / Hinweise';
  if($('#requestPrivacyText'))$('#requestPrivacyText').textContent=en?'I agree that my details may be processed to handle this quotation enquiry.':'Ich stimme der Verarbeitung meiner Angaben zur Bearbeitung dieser Angebotsanfrage zu.';
  if($('#submitServiceRequest'))$('#submitServiceRequest').textContent=en?'Send quotation request':'Angebotsanfrage senden';
  if($('#cancelRequestDialog'))$('#cancelRequestDialog').textContent=en?'Cancel':'Abbrechen';
}
function openServiceRequest(){
  if(!calc)return;
  syncRequestDialogLanguage();
  $('#requestName').value=$('#customerName').value.trim();$('#requestEmail').value=$('#customerEmail').value.trim();$('#requestPhone').value=$('#customerPhone').value.trim();
  $('#requestQuoteSummary').innerHTML=`<strong>${escapeHtml(calc.serviceLabel)}</strong><span>${money(calc.visitTotal)} / ${currentLang==='de'?'Termin':'visit'}</span><span>${money(calc.monthly)} / ${currentLang==='de'?'Monat':'month'}</span>${calc.promoPct?`<b>${currentLang==='de'?'1. Monat':'1st month'}: ${money(calc.firstMonth)}</b>`:''}`;
  $('#requestPrivacy').checked=false;$('#requestNotice').textContent='';$('#requestNotice').className='request-notice hidden';
  const modal=$('#quoteRequestModal');modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');$('#requestName').focus();
}
function closeServiceRequest(){const modal=$('#quoteRequestModal');modal?.classList.add('hidden');modal?.setAttribute('aria-hidden','true')}
async function submitServiceRequest(){
  if(!calc)return;
  const name=$('#requestName').value.trim(),email=$('#requestEmail').value.trim().toLowerCase(),phone=$('#requestPhone').value.trim(),notice=$('#requestNotice');
  if(!name||!email||!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){notice.textContent=currentLang==='de'?'Bitte geben Sie Name und eine gültige E-Mail-Adresse ein.':'Please enter your name and a valid email address.';notice.className='request-notice error';return}
  if(!$('#requestPrivacy').checked){notice.textContent=currentLang==='de'?'Bitte stimmen Sie der Datenverarbeitung zu.':'Please accept the data-processing consent.';notice.className='request-notice error';return}
  $('#customerName').value=name;$('#customerEmail').value=email;$('#customerPhone').value=phone;
  const btn=$('#submitServiceRequest'),old=btn.textContent;btn.disabled=true;btn.textContent=currentLang==='de'?'Wird gesendet …':'Sending …';
  const payload={service_key:calc.serviceKey,frequency_key:calc.freq?.key||$('#frequency').value,area_sqm:calc.area||null,contract_months:calc.months||null,window_sqm:calc.windowArea||0,equipment_by_frankiflow:!!calc.equipment,deep_cleaning:!!calc.deep,estimated_monthly:Number(calc.monthly.toFixed(2)),customer_name:name,customer_email:email,customer_phone:phone,postcode:'',company_name:$('#customerCompany').value.trim(),message:$('#requestMessage').value.trim(),privacy_accepted:true,status:'new'};
  const {data,error}=await supabase.from('frankiflow_quote_requests').insert(payload).select('id').single();
  if(error){notice.textContent=(currentLang==='de'?'Senden fehlgeschlagen: ':'Could not send: ')+error.message;notice.className='request-notice error';btn.disabled=false;btn.textContent=old;return}
  const common={quote_request_id:data.id,customer_email:email,language:currentLang};
  const results=await Promise.allSettled([supabase.functions.invoke('frankiflow-email',{body:{event_type:'admin_enquiry',...common,attach_quote:true,quote_snapshot:quoteSnapshot()}}),supabase.functions.invoke('frankiflow-email',{body:{event_type:'enquiry_received',...common}})]);
  const admin=results[0];const adminFailed=admin.status==='rejected'||admin.value?.error;
  if(adminFailed){notice.textContent=currentLang==='de'?'Die Anfrage wurde gespeichert, aber die Admin-E-Mail konnte nicht versendet werden.':'The enquiry was saved, but the admin email could not be sent.';notice.className='request-notice error'}else{notice.textContent=currentLang==='de'?'Gesendet. FrankiFlow hat Ihr Angebot und Ihre Kontaktdaten erhalten.':'Sent. FrankiFlow received your quotation and contact details.';notice.className='request-notice success';setTimeout(closeServiceRequest,1500)}
  btn.disabled=false;btn.textContent=old;
}
'''
if 'function quoteSnapshot()' not in calc:
    calc=replace_once(calc,"$$('[data-lang]').forEach",request_helpers+"\n$$('[data-lang]').forEach",'quotation request helpers')
calc=calc.replace("$$('[data-lang]').forEach(b=>b.addEventListener('click',()=>{currentLang=b.dataset.lang;applyLanguage()}));\n$('#calculatorForm').addEventListener", "$$('[data-lang]').forEach(b=>b.addEventListener('click',()=>{currentLang=b.dataset.lang;applyLanguage();syncRequestDialogLanguage()}));\n$('#requestService')?.addEventListener('click',openServiceRequest);$('#closeRequestDialog')?.addEventListener('click',closeServiceRequest);$('#cancelRequestDialog')?.addEventListener('click',closeServiceRequest);$('#submitServiceRequest')?.addEventListener('click',submitServiceRequest);$$('[data-close-request]').forEach(el=>el.addEventListener('click',closeServiceRequest));\n$('#calculatorForm').addEventListener")
write('public/assets/calculator.js',calc)

# Calculator contact dialog markup.
price=read('public/preisrechner/index.html')
price=price.replace('<a class="btn-calc ghost" data-i18n="request" href="/#kontakt">Persönliches Angebot anfragen</a>','<button class="btn-calc ghost" data-i18n="request" id="requestService" type="button">Mit Angebot kontaktieren</button>')
if 'id="quoteRequestModal"' not in price:
    modal='''<div aria-hidden="true" class="quote-request-modal hidden" id="quoteRequestModal">\n<div class="quote-request-backdrop" data-close-request></div>\n<section aria-labelledby="requestDialogTitle" aria-modal="true" class="quote-request-dialog" role="dialog">\n<button aria-label="Schließen" class="quote-request-close" id="closeRequestDialog" type="button">×</button>\n<div class="quote-request-heading"><span>FRANKIFLOW</span><h2 id="requestDialogTitle">Mit Angebot kontaktieren</h2><p id="requestDialogIntro">Senden Sie Ihr aktuell berechnetes Angebot zusammen mit Ihren Kontaktdaten direkt an FrankiFlow.</p></div>\n<div class="request-quote-summary" id="requestQuoteSummary"></div>\n<div class="request-form-grid"><label class="field"><span id="requestNameLabel">Name</span><input id="requestName" autocomplete="name"></label><label class="field"><span id="requestEmailLabel">E-Mail</span><input id="requestEmail" type="email" autocomplete="email"></label><label class="field full"><span id="requestPhoneLabel">Telefon</span><input id="requestPhone" type="tel" autocomplete="tel"></label><label class="field full"><span id="requestMessageLabel">Nachricht / Hinweise</span><textarea id="requestMessage" rows="4"></textarea></label></div>\n<label class="request-consent"><input id="requestPrivacy" type="checkbox"><span id="requestPrivacyText">Ich stimme der Verarbeitung meiner Angaben zur Bearbeitung dieser Angebotsanfrage zu.</span> <a href="/datenschutz/" target="_blank">Datenschutz</a></label>\n<div class="request-notice hidden" id="requestNotice"></div>\n<div class="quote-request-actions"><button class="btn-calc ghost" id="cancelRequestDialog" type="button">Abbrechen</button><button class="btn-calc primary" id="submitServiceRequest" type="button">Angebotsanfrage senden</button></div>\n</section>\n</div>\n'''
    price=replace_once(price,'<section aria-hidden="true" class="print-sheet" id="printSheet"></section>','<section aria-hidden="true" class="print-sheet" id="printSheet"></section>\n'+modal,'request modal insertion')
write('public/preisrechner/index.html',price)

css=read('public/assets/calculator.css')
if '/* Quotation contact dialog */' not in css:
    css += r'''

/* Quotation contact dialog */
.quote-request-modal{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:20px}.quote-request-backdrop{position:absolute;inset:0;background:rgba(5,24,39,.58);backdrop-filter:blur(5px)}
.quote-request-dialog{position:relative;z-index:1;width:min(620px,100%);max-height:min(90vh,760px);overflow:auto;background:#fff;border-radius:24px;padding:28px;box-shadow:0 30px 90px rgba(4,24,39,.3)}
.quote-request-close{position:absolute;right:18px;top:16px;width:36px;height:36px;border:1px solid #dce6eb;border-radius:12px;background:#fff;color:#284355;font-size:23px;cursor:pointer}
.quote-request-heading>span{font-size:10px;letter-spacing:.15em;font-weight:900;color:#0a8d8f}.quote-request-heading h2{margin:8px 44px 8px 0;font-size:28px;color:#071f38}.quote-request-heading p{margin:0 0 18px;color:#667786;line-height:1.55}
.request-quote-summary{display:grid;grid-template-columns:1fr auto;gap:6px 16px;padding:16px;border-radius:16px;background:#f1faf9;margin-bottom:18px}.request-quote-summary strong{grid-column:1/-1;color:#071f38}.request-quote-summary span,.request-quote-summary b{font-size:13px;color:#385565}.request-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.request-form-grid .full{grid-column:1/-1}.request-form-grid textarea{resize:vertical}
.request-consent{display:flex;align-items:flex-start;gap:8px;margin-top:16px;font-size:12px;color:#526a7b;line-height:1.45}.request-consent a{color:#087d7e;font-weight:800}.request-consent input{margin-top:3px}
.request-notice{padding:11px 13px;border-radius:12px;margin-top:14px;font-size:13px}.request-notice.error{background:#fff0f0;color:#a72d2d}.request-notice.success{background:#eef9f7;color:#087d7e}.quote-request-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.quote-request-dialog .btn-calc.ghost{color:#355064;border-color:#d7e2e7}.quote-request-dialog .btn-calc.primary{min-width:185px}
.print-footer-founder{font-size:7pt;font-weight:700;color:#536975;margin:1mm 0 2.4mm}
@media(max-width:620px){.quote-request-modal{padding:10px}.quote-request-dialog{padding:22px 18px;border-radius:20px}.request-form-grid{grid-template-columns:1fr}.request-form-grid .full{grid-column:auto}.quote-request-actions{display:grid;grid-template-columns:1fr}.quote-request-actions .btn-calc{width:100%}}
@media print{.quote-request-modal{display:none!important}.print-brand img{display:block!important;width:42mm!important;max-height:18mm!important;object-fit:contain!important;object-position:left center!important}}
'''
write('public/assets/calculator.css',css)

# Admin: editable window-cleaning contract reductions.
admin=read('public/admin/index.html')
old='<label class="pricing-field"><span>Mindestpreis</span><input id="windowMinimum" type="number" step="0.01"></label>'
new=old+'<div class="pricing-field window-contract-field"><span>Vertragsrabatt Fensterreinigung</span><small>Reduktion des Fensterpreises nach Vertragslaufzeit.</small><div id="windowContractGrid" class="pricing-grid two window-contract-grid"></div></div>'
if 'id="windowContractGrid"' not in admin: admin=replace_once(admin,old,new,'admin window contract grid')
write('public/admin/index.html',admin)

adminjs=read('public/assets/admin-base.js')
old_render="const w=pricingConfig.window_settings||{};$('#windowEnabled').checked=w.enabled!==false;$('#windowBase').value=w.base??0;$('#windowGradient').value=w.gradient_per_sqm??0;$('#windowMinimum').value=w.minimum??0;"
new_render="const w=pricingConfig.window_settings||{};$('#windowEnabled').checked=w.enabled!==false;$('#windowBase').value=w.base??0;$('#windowGradient').value=w.gradient_per_sqm??0;$('#windowMinimum').value=w.minimum??0;const wr=w.contract_reduction_pct||c.base_reduction_pct||{};$('#windowContractGrid').innerHTML=(c.months||[1,3,6,9,12,24]).map(m=>`<label class=\"pricing-field\"><span>${m} ${getLanguage()==='de'?(m==1?'Monat':'Monate'):(m==1?'month':'months')}</span><div class=\"pricing-input-suffix\"><input data-window-contract=\"${m}\" type=\"number\" min=\"0\" max=\"100\" step=\"0.1\" value=\"${Number(wr?.[String(m)]||0)}\"><em>%</em></div></label>`).join('');"
adminjs=replace_once(adminjs,old_render,new_render,'admin render window reductions')
old_collect="const reductions={};$$('[data-contract]').forEach(x=>reductions[x.dataset.contract]=Number(x.value)||0);return{service_settings:"
new_collect="const reductions={};$$('[data-contract]').forEach(x=>reductions[x.dataset.contract]=Number(x.value)||0);const windowReductions={};$$('[data-window-contract]').forEach(x=>windowReductions[x.dataset.windowContract]=Number(x.value)||0);return{service_settings:"
adminjs=replace_once(adminjs,old_collect,new_collect,'admin collect window reductions')
old_window="window_settings:{...(pricingConfig.window_settings||{}),enabled:$('#windowEnabled').checked,base:Number($('#windowBase').value)||0,gradient_per_sqm:Number($('#windowGradient').value)||0,minimum:Number($('#windowMinimum').value)||0}"
new_window="window_settings:{...(pricingConfig.window_settings||{}),enabled:$('#windowEnabled').checked,base:Number($('#windowBase').value)||0,gradient_per_sqm:Number($('#windowGradient').value)||0,minimum:Number($('#windowMinimum').value)||0,contract_reduction_pct:windowReductions}"
adminjs=replace_once(adminjs,old_window,new_window,'admin save window reductions')
write('public/assets/admin-base.js',adminjs)

pricing=read('public/assets/pricing.js')
pricing=pricing.replace("window_settings:{base:5,enabled:true,minimum:35,gradient_per_sqm:2.5}","window_settings:{base:5,enabled:true,minimum:35,gradient_per_sqm:2.5,contract_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}}")
write('public/assets/pricing.js',pricing)

# 3) Thorough automated calculator tests.
test_engine=r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePricing } from '../public/assets/calculator-engine.js';

const cfg={
  contract_settings:{months:[1,3,6,9,12,24],base_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}},
  deep_cleaning_settings:{enabled:true,surcharge_pct:34},equipment_settings:{enabled:true,base:5,gradient_per_sqm:.01},
  promotion_settings:{enabled:true,first_month_discount_pct:25},
  service_settings:{services:{buero:{label:'Büroreinigung',base_1m:24,enabled:true},airbnb:{label:'Airbnb',base_1m:26,enabled:true},wohnung:{label:'Wohnung',base_1m:30,enabled:true},treppenhaus:{label:'Treppenhaus',base_1m:24,enabled:true}},gradient_per_sqm:.2304,minimum_cleaning_charge:30},
  vat_settings:{enabled:true,rate_pct:19,customer_pays_default:false},
  window_settings:{base:5,enabled:true,minimum:35,gradient_per_sqm:3,contract_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}}
};
const freq=n=>({key:`x${n}`,label:`${n}`,visits_per_month:n});
const state=(o={})=>({serviceKey:'buero',windowOnly:false,area:80,freq:freq(4),months:1,newCustomer:false,deep:false,equipment:false,vat:false,windows:false,windowArea:0,...o});

test('base office price is stable and cent-reconciled',()=>{const r=calculatePricing(cfg,state());assert.equal(r.visitTotal,42.43);assert.equal(r.monthly,169.72);assert.equal(r.monthly,r.visitTotal*4)});
test('general contract reduction applies to the service base',()=>{const r=calculatePricing(cfg,state({months:12}));assert.equal(r.reductionPct,8);assert.equal(r.visitTotal,40.51);assert.equal(r.monthly,162.04)});
test('window-only cleaning receives contract-duration reduction',()=>{const r=calculatePricing(cfg,state({serviceKey:'fenster',windowOnly:true,area:0,freq:freq(1),months:12,windows:true,windowArea:20}));assert.equal(r.windowReductionPct,8);assert.equal(r.visitTotal,59.8);assert.equal(r.monthly,59.8)});
test('window contract reductions decrease monotonically by duration',()=>{const months=[1,3,6,9,12,24],expected=[65,63.7,62.4,61.1,59.8,58.5];const values=months.map(m=>calculatePricing(cfg,state({serviceKey:'fenster',windowOnly:true,area:0,freq:freq(1),months:m,windows:true,windowArea:20})).visitTotal);assert.deepEqual(values,expected);for(let i=1;i<values.length;i++)assert.ok(values[i]<=values[i-1])});
test('mixed cleaning uses one discounted window add-on per month',()=>{const r=calculatePricing(cfg,state({months:12,windows:true,windowArea:20}));assert.equal(r.visitTotal,40.51);assert.equal(r.windowCharge,59.8);assert.equal(r.monthly,221.84)});
test('VAT arithmetic reconciles exactly to visible line items',()=>{const r=calculatePricing(cfg,state({months:12,windows:true,windowArea:20,vat:true}));assert.equal(r.visitTotal,48.21);assert.equal(r.windowCharge,71.16);assert.equal(r.monthly,264);assert.equal(r.monthly,Number((r.visitTotal*4+r.windowCharge).toFixed(2)))});
test('new-customer month remains lower than regular month',()=>{const r=calculatePricing(cfg,state({months:12,windows:true,windowArea:20,vat:true,newCustomer:true}));assert.equal(r.promoPct,25);assert.ok(r.firstMonth<r.monthly);assert.equal(r.firstMonth,198.01)});
test('equipment and deep cleaning both affect the expected line items',()=>{const plain=calculatePricing(cfg,state());const equipment=calculatePricing(cfg,state({equipment:true}));const deep=calculatePricing(cfg,state({deep:true}));assert.ok(equipment.visitTotal>plain.visitTotal);assert.ok(deep.visitTotal>plain.visitTotal)});
test('window reductions fall back to contract reductions when legacy config lacks window map',()=>{const legacy=structuredClone(cfg);delete legacy.window_settings.contract_reduction_pct;const r=calculatePricing(legacy,state({serviceKey:'fenster',windowOnly:true,area:0,freq:freq(1),months:24,windows:true,windowArea:20}));assert.equal(r.windowReductionPct,10);assert.equal(r.visitTotal,58.5)});

test('broad pricing matrix is finite, non-negative and reconciles to visible totals',()=>{
  const services=['buero','wohnung','airbnb','treppenhaus'];const areas=[20,80,200];const visits=[1,2,4,8];const months=[1,3,6,9,12,24];let checked=0;
  for(const serviceKey of services)for(const area of areas)for(const n of visits)for(const m of months)for(const vat of [false,true])for(const equipment of [false,true]){
    const windows=(area+n+m)%2===0;const r=calculatePricing(cfg,state({serviceKey,area,freq:freq(n),months:m,vat,equipment,windows,windowArea:windows?20:0,newCustomer:true,deep:area===200}));
    for(const key of ['visitTotal','monthly','firstMonth','floorVisit','equipmentVisit','windowCharge']){assert.ok(Number.isFinite(r[key]),`${key} finite`);assert.ok(r[key]>=0,`${key} non-negative`)}
    const expected=Number((r.visitTotal*n+(windows?r.windowCharge:0)).toFixed(2));assert.equal(r.monthly,expected);assert.ok(r.firstMonth<=r.monthly+0.01);checked++;
  }
  assert.ok(checked>=1000);
});
'''
write('tests/calculator-engine.test.mjs',test_engine)

test_ui=r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const read=p=>readFileSync(p,'utf8');

test('About Us is a homepage accordion only',()=>{assert.equal(existsSync('public/about/index.html'),false);const home=read('public/index.html');const js=read('public/assets/homepage-about-nav.js');assert.match(home,/id="about"/);assert.match(home,/id="aboutAccordion"/);assert.match(home,/href="#about"/);assert.doesNotMatch(home,/href="\/about\/"/);assert.match(js,/slice\(0,3\)/);assert.match(js,/<details class=/);assert.doesNotMatch(js,/padStart|about-page-story-head/)});
test('Accommodations remains the final navigation link after FAQ',()=>{for(const p of ['public/index.html','public/en/index.html']){const s=read(p);const nav=s.match(/<nav[^>]*class="nav-links"[^>]*>([\s\S]*?)<\/nav>/)?.[1]||'';assert.ok(nav.lastIndexOf('Accommodations')>nav.lastIndexOf('FAQ'))}});
test('calculator contact-with-quotation dialog is wired',()=>{const html=read('public/preisrechner/index.html'),js=read('public/assets/calculator.js');assert.match(html,/id="requestService"/);assert.match(html,/id="quoteRequestModal"/);assert.match(js,/event_type:'admin_enquiry'/);assert.match(js,/attach_quote:true/);assert.match(js,/event_type:'enquiry_received'/)});
test('print waits for logo and contains organisation plus founder',()=>{const js=read('public/assets/calculator.js');assert.match(js,/waitForPrintAssets/);assert.match(js,/await waitForPrintAssets\(\)/);assert.match(js,/FrankiFlow Gebäudereinigung &amp; Objektbetreuung/);assert.match(js,/Inura Devasurendra/);assert.doesNotMatch(js,/FrankiFlow Unternehmensdaten/)});
test('admin exposes editable window contract reductions',()=>{assert.match(read('public/admin/index.html'),/id="windowContractGrid"/);const js=read('public/assets/admin-base.js');assert.match(js,/data-window-contract/);assert.match(js,/contract_reduction_pct:windowReductions/)});
test('language switching preserves the new-customer selection',()=>{assert.match(read('public/assets/calculator.js'),/newCustomerValue/)});
'''
write('tests/calculator-ui.test.mjs',test_ui)

pkg=json.loads(read('package.json'))
pkg['type']='module'
pkg['scripts']['check']='node --check public/assets/app.js && node --check public/assets/app-enhancements.js && node --check public/assets/homepage-refinements.js && node --check public/assets/homepage-about-nav.js && node --check public/assets/header-logo-settings.js && node --check public/assets/site-i18n.js && node --check public/assets/pricing.js && node --check public/assets/admin.js && node --check public/assets/admin-base.js && node --check public/assets/admin-enhancements.js && node --check public/assets/admin-logo-size.js && node --check public/assets/admin-cms-v2.js && node --check public/assets/admin-unified-ui.js && node --check public/assets/calculator-engine.js && node --check public/assets/calculator.js && node --check public/assets/calculator-mobile-island.js && node --check public/assets/calculator-overrides.js && node --check public/assets/service-page-photo.js'
pkg['scripts']['test']='node --test tests/*.test.mjs'
write('package.json',json.dumps(pkg,ensure_ascii=False,indent=2)+'\n')

deploy=read('.github/workflows/deploy-develop.yml')
deploy=deploy.replace('      - name: Validate JavaScript\n        run: npm run check','      - name: Validate JavaScript and calculator tests\n        run: |\n          npm run check\n          npm test')
write('.github/workflows/deploy-develop.yml',deploy)

print('Develop-only requested fixes applied.')
