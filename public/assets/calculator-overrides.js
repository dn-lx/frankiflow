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

function quotationPayload(){
  const lang=document.querySelector('[data-lang].active')?.dataset.lang==='en'?'en':'de';
  const serviceLabel=document.querySelector('.service-choice.active strong')?.textContent?.trim()||
    document.querySelector('.service-choice input:checked')?.closest('.service-choice')?.querySelector('strong')?.textContent?.trim()||'';
  const area=fieldValue('#areaSqm');
  const windowArea=fieldValue('#windowSqm');
  const windowOnly=document.querySelector('.service-choice.active')?.classList.contains('service-window-choice')||false;
  const areaText=windowOnly
    ?(windowArea?`${windowArea} m² ${lang==='de'?'Glas':'glass'}`:'')
    :(area?`${area} m²`: '');
  const breakdown=[...document.querySelectorAll('#breakdownRows .breakdown-row')].map(row=>({
    label:row.querySelector('span')?.textContent?.trim()||'',
    value:row.querySelector('b')?.textContent?.trim()||''
  })).filter(row=>row.label||row.value);

  const checklist=[...document.querySelectorAll('#checklistPreview .checklist-screen-group')].map(group=>({
    title:group.querySelector(':scope > h3')?.textContent?.trim()||'',
    sections:[...group.querySelectorAll('.checklist-screen-section')].map(section=>({
      title:section.querySelector('h4')?.textContent?.trim()||'',
      optional:section.classList.contains('optional-section'),
      items:[...section.querySelectorAll('.checklist-screen-item em')].map(item=>item.textContent?.trim()||'').filter(Boolean)
    }))
  }));

  const promotionBox=document.querySelector('#promotionBox');
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
      contract:selectedText('#contractMonths'),
      vatStatus:selectedText('#vatStatus')
    },
    prices:{
      visit:selectedText('#visitPrice'),
      monthly:selectedText('#monthlyPrice'),
      firstMonth:selectedText('#firstMonthPrice'),
      discountLabel:selectedText('#discountLabel'),
      hasPromotion:promotionBox?!promotionBox.classList.contains('hidden'):false
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
