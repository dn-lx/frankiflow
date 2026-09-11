const SCOPE_STORAGE_KEY='frankiflow-calculator-scope-v1';

function getScopeDefaults(){
  return {areaSqm:'80',frequency:'weekly1',contractMonths:'1',newCustomer:'yes'};
}

function loadSavedScope(){
  try{return {...getScopeDefaults(),...(JSON.parse(localStorage.getItem(SCOPE_STORAGE_KEY)||'{}')||{})}}
  catch{return getScopeDefaults()}
}

function saveScope(){
  const area=document.querySelector('#areaSqm');
  const frequency=document.querySelector('#frequency');
  const contract=document.querySelector('#contractMonths');
  const newCustomer=document.querySelector('#newCustomer');
  if(!area||!frequency||!contract||!newCustomer)return;
  localStorage.setItem(SCOPE_STORAGE_KEY,JSON.stringify({
    areaSqm:area.value,
    frequency:frequency.value,
    contractMonths:contract.value,
    newCustomer:newCustomer.value
  }));
}

function restoreScope(){
  const area=document.querySelector('#areaSqm');
  const frequency=document.querySelector('#frequency');
  const contract=document.querySelector('#contractMonths');
  const newCustomer=document.querySelector('#newCustomer');
  if(!area||!frequency||!contract||!newCustomer||!frequency.options.length||!contract.options.length)return false;

  const saved=loadSavedScope();
  area.value=saved.areaSqm||'80';
  if([...frequency.options].some(o=>o.value===saved.frequency))frequency.value=saved.frequency;
  if([...contract.options].some(o=>o.value===String(saved.contractMonths)))contract.value=String(saved.contractMonths);
  if([...newCustomer.options].some(o=>o.value===saved.newCustomer))newCustomer.value=saved.newCustomer;

  for(const el of [area,frequency,contract,newCustomer]){
    el.addEventListener('input',saveScope);
    el.addEventListener('change',saveScope);
  }
  document.querySelector('#calculatorForm')?.dispatchEvent(new Event('input',{bubbles:true}));
  return true;
}

function installScopePersistence(){
  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    if(restoreScope()||attempts>100)clearInterval(timer);
  },100);
}

function patchPrintSheet(){
  const sheet=document.querySelector('#printSheet');
  if(!sheet)return;

  sheet.querySelectorAll('.print-company-footer').forEach(footer=>{
    const title=footer.querySelector('.print-footer-title');
    if(title)title.textContent='FrankiFlow Gebäudereinigung & Objektbetreuung';
    if(!footer.querySelector('.print-footer-owner')){
      const owner=document.createElement('div');
      owner.className='print-footer-owner';
      owner.textContent='Inura Devasurendra · Gründer / Founder';
      title?.insertAdjacentElement('afterend',owner);
    }
  });

  sheet.querySelectorAll('.print-note').forEach(note=>{
    note.childNodes.forEach(node=>{
      if(node.nodeType!==Node.TEXT_NODE)return;
      node.nodeValue=node.nodeValue
        .replace(/\s*Diese Berechnung ist unverbindlich\.?/g,'')
        .replace(/\s*This calculation is non-binding\.?/gi,'');
    });
  });
}

function installPrintTweaks(){
  const style=document.createElement('style');
  style.textContent=`
    @media print{
      .print-footer-title{margin-bottom:.8mm!important}
      .print-footer-owner{font-size:6.4pt;font-weight:650;color:#526875;margin-bottom:2.2mm}
    }
  `;
  document.head.append(style);

  const sheet=document.querySelector('#printSheet');
  if(!sheet)return;
  const observer=new MutationObserver(()=>patchPrintSheet());
  observer.observe(sheet,{childList:true,subtree:true,characterData:true});
  patchPrintSheet();
}

function installCalculatorHeaderTheme(){
  if(document.querySelector('#ff-calculator-header-theme'))return;
  const style=document.createElement('style');
  style.id='ff-calculator-header-theme';
  style.textContent=`
    .calc-header{
      background:linear-gradient(135deg,rgba(8,73,88,.98),rgba(8,112,116,.98))!important;
      border-bottom-color:rgba(255,255,255,.14)!important;
      box-shadow:0 8px 26px rgba(5,42,53,.14);
    }
    .calc-header .calc-brand{
      background:rgba(255,255,255,.97);
      border-radius:13px;
      padding:3px 10px;
      height:58px;
      box-shadow:0 6px 18px rgba(0,0,0,.10);
    }
    .calc-header .calc-back{color:#ecfffd!important}
    .calc-header .calc-back:hover{color:#ffffff!important}
    .calc-header .language-switch{
      background:rgba(255,255,255,.14)!important;
      border:1px solid rgba(255,255,255,.18);
    }
    .calc-header .language-switch button{color:#d9f5f3!important}
    .calc-header .language-switch button.active{background:#ffffff!important;color:#074757!important}
  `;
  document.head.append(style);
}

function selectedText(selector){
  const el=document.querySelector(selector);
  if(!el)return '';
  if(el instanceof HTMLSelectElement)return el.selectedOptions[0]?.textContent?.trim()||'';
  return el.textContent?.trim()||'';
}

function fieldValue(selector){
  const el=document.querySelector(selector);
  return el&&'value' in el?String(el.value||'').trim():'';
}

function currentServiceKey(){
  return document.querySelector('.service-choice input:checked')?.value||'';
}

function appointmentsPerMonth(lang,rawRows){
  const row=rawRows.find(item=>/(termine\s*\/\s*monat|visits\s*\/\s*month)/i.test(item.value||''));
  if(row?.value)return row.value;
  const map={once:1,monthly:1,biweekly:2,weekly1:4,weekly2:8,weekly3:12,weekly4:16,weekly5:20};
  const count=map[fieldValue('#frequency')];
  if(!count)return selectedText('#frequency');
  return lang==='de'?`${count} Termine/Monat`:`${count} visits/month`;
}

function serviceAreaLabel(lang,serviceKey,deepSelected,serviceLabel){
  if(deepSelected)return lang==='de'?'Grundreinigungsfläche':'Deep cleaning area';
  const labels={
    de:{
      buero:'Büroreinigungsfläche',
      wohnung:'Wohnungsreinigungsfläche',
      airbnb:'Ferienwohnungs-/Airbnb-Reinigungsfläche',
      treppenhaus:'Treppenhaus-Reinigungsfläche',
      fenster:'Glasfläche'
    },
    en:{
      buero:'Office cleaning area',
      wohnung:'Home cleaning area',
      airbnb:'Holiday rental / Airbnb cleaning area',
      treppenhaus:'Stairwell cleaning area',
      fenster:'Glass area'
    }
  };
  return labels[lang]?.[serviceKey]||(lang==='de'?`${serviceLabel||'Reinigung'} – Fläche`:`${serviceLabel||'Cleaning'} area`);
}

function firstMonthPrintLabel(lang,hasPromotion,discountLabel){
  if(!hasPromotion)return lang==='de'?'1. Monat':'First month';
  const pct=(String(discountLabel||'').match(/\d+(?:[.,]\d+)?%/)||[])[0]||'';
  return lang==='de'
    ?`1. Monat als Neukunde${pct?` (${pct} Rabatt)`:''}`
    :`1st month as new customer${pct?` (${pct} discount)`:''}`;
}

function quotationPayload(){
  const lang=document.querySelector('[data-lang].active')?.dataset.lang==='en'?'en':'de';
  const serviceLabel=document.querySelector('.service-choice.active strong')?.textContent?.trim()||
    document.querySelector('.service-choice input:checked')?.closest('.service-choice')?.querySelector('strong')?.textContent?.trim()||'';
  const serviceKey=currentServiceKey();
  const area=fieldValue('#areaSqm');
  const windowArea=fieldValue('#windowSqm');
  const windowOnly=document.querySelector('.service-choice.active')?.classList.contains('service-window-choice')||serviceKey==='fenster';
  const deepSelected=!windowOnly&&Boolean(document.querySelector('#deepCleaning')?.checked);
  const areaText=windowOnly
    ?(windowArea?`${windowArea} m² ${lang==='de'?'Glas':'glass'}`:'')
    :(area?`${area} m²`: '');

  const rawRows=[...document.querySelectorAll('#breakdownRows .breakdown-row')].map(row=>({
    label:row.querySelector('span')?.textContent?.trim()||'',
    value:row.querySelector('b')?.textContent?.trim()||''
  })).filter(row=>row.label||row.value);

  const promotionBox=document.querySelector('#promotionBox');
  const hasPromotion=promotionBox?!promotionBox.classList.contains('hidden'):false;
  const visitPrice=selectedText('#visitPrice');
  const monthlyPrice=selectedText('#monthlyPrice');
  const firstMonthPrice=selectedText('#firstMonthPrice')||monthlyPrice;
  const discountLabel=selectedText('#discountLabel');
  const appointments=appointmentsPerMonth(lang,rawRows);
  const areaLabel=serviceAreaLabel(lang,serviceKey,deepSelected,serviceLabel);
  const frequencyLabel=lang==='de'?'Termine pro Monat':'Appointments per month';
  const monthlyLabel=lang==='de'?'Preis pro Monat':'Price per month';
  const firstMonthLabel=firstMonthPrintLabel(lang,hasPromotion,discountLabel);

  const extraRows=rawRows.filter(row=>{
    const label=(row.label||'').toLowerCase();
    const value=(row.value||'').toLowerCase();
    if(/vertragslaufzeit|contract duration|laufzeitvorteil|contract saving/.test(label))return false;
    if(/allgemeine reinigung|general cleaning|grundreinigung|deep cleaning/.test(label))return false;
    if(label===serviceLabel.toLowerCase())return false;
    if(/häufigkeit|frequency/.test(label))return false;
    if(/termine\s*\/\s*monat|visits\s*\/\s*month/.test(value))return false;
    if(/preis pro termin|price per visit|preis pro monat|price per month/.test(label))return false;
    return true;
  });

  const breakdown=[
    ...(deepSelected?[{label:lang==='de'?'Grundreinigung':'Deep cleaning',value:appointments}]:[]),
    {label:areaLabel,value:areaText||'—'},
    {label:frequencyLabel,value:appointments||'—'},
    {label:monthlyLabel,value:monthlyPrice||'—'},
    {label:firstMonthLabel,value:firstMonthPrice||monthlyPrice||'—'},
    ...extraRows
  ];

  const checklist=[...document.querySelectorAll('#checklistPreview .checklist-screen-group')].map(group=>({
    title:group.querySelector(':scope > h3')?.textContent?.trim()||'',
    sections:[...group.querySelectorAll('.checklist-screen-section')].map(section=>({
      title:section.querySelector('h4')?.textContent?.trim()||'',
      optional:section.classList.contains('optional-section'),
      items:[...section.querySelectorAll('.checklist-screen-item em')].map(item=>item.textContent?.trim()||'').filter(Boolean)
    }))
  }));

  return {
    language:lang,
    customer:{
      name:fieldValue('#customerName'),
      company:fieldValue('#customerCompany'),
      email:fieldValue('#customerEmail'),
      phone:fieldValue('#customerPhone'),
      address:fieldValue('#customerAddress')
    },
    service:{
      label:serviceLabel,
      area:areaText,
      frequency:selectedText('#frequency'),
      appointments,
      contract:selectedText('#contractMonths'),
      vatStatus:selectedText('#vatStatus')
    },
    prices:{
      visit:visitPrice,
      monthly:monthlyPrice,
      firstMonth:firstMonthPrice,
      discountLabel,
      hasPromotion
    },
    breakdown,
    includeChecklist:Boolean(document.querySelector('#includeChecklist')?.checked),
    checklist
  };
}

function filenameFromDisposition(value){
  const match=String(value||'').match(/filename="?([^";]+)"?/i);
  return match?.[1]||`FrankiFlow-Angebot-${new Date().toISOString().slice(0,10)}.pdf`;
}

async function downloadQuotationPdf(button){
  if(button.dataset.pdfBusy==='1')return;
  const original=button.textContent;
  const lang=document.querySelector('[data-lang].active')?.dataset.lang==='en'?'en':'de';
  button.dataset.pdfBusy='1';
  button.disabled=true;
  button.textContent=lang==='de'?'PDF wird erstellt …':'Creating PDF …';
  try{
    const response=await fetch('/api/pdf/quotation',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(quotationPayload())
    });
    if(!response.ok){
      const detail=await response.text().catch(()=>String(response.status));
      throw new Error(detail||`HTTP ${response.status}`);
    }
    const blob=await response.blob();
    if(blob.type!=='application/pdf'||blob.size<1000)throw new Error('Invalid PDF response');
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;
    link.download=filenameFromDisposition(response.headers.get('Content-Disposition'));
    link.style.display='none';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(error){
    console.error('FrankiFlow quotation PDF download failed',error);
    alert(lang==='de'?'Das PDF konnte nicht erstellt werden. Bitte versuchen Sie es erneut.':'The PDF could not be created. Please try again.');
  }finally{
    button.disabled=false;
    button.dataset.pdfBusy='0';
    button.textContent=original;
  }
}

function installDirectPdfDownload(){
  document.addEventListener('click',event=>{
    const button=event.target instanceof Element?event.target.closest('#printQuote'):null;
    if(!button)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    downloadQuotationPdf(button);
  },true);
}

if(location.pathname.includes('/preisrechner/')){
  installCalculatorHeaderTheme();
  installDirectPdfDownload();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      installScopePersistence();
      installPrintTweaks();
    },{once:true});
  }else{
    installScopePersistence();
    installPrintTweaks();
  }
}