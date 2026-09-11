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

if(location.pathname.includes('/preisrechner/')){
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
