import { FRANKIFLOW_CONFIG } from './config.js';
import { loadHeaderLogoWidth } from './header-logo-settings.js';

const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];

function currentLanguage(){
  return localStorage.getItem('frankiflow-lang')==='en'||localStorage.getItem('ff-price-lang')==='en'?'en':'de';
}

function applyFooterLanguage(lang=currentLanguage()){
  const en=lang==='en';
  const footer=$('.calc-footer');if(!footer)return;
  const description=footer.querySelector('.calc-footer-main p');
  if(description)description.textContent=en?'Building Cleaning & Property Services · Frankfurt am Main & Surroundings':'Gebäudereinigung & Objektbetreuung · Frankfurt am Main & Umgebung';
  const stay=footer.querySelector('a[href="https://stay.frankiflow.de/"]');
  if(stay)stay.textContent=en?'FrankiHolz Accommodation ↗':'FrankiHolz Unterkunft ↗';
  const legal=footer.querySelector('a[href="/impressum/"]');
  if(legal)legal.textContent=en?'Legal notice':'Impressum';
  const privacy=footer.querySelector('a[href="/datenschutz/"]');
  if(privacy)privacy.textContent=en?'Privacy':'Datenschutz';
  const copy=footer.querySelector('.calc-footer-copy');
  if(copy)copy.textContent=en?'© 2026 FrankiFlow. More than cleaning.':'© 2026 FrankiFlow. Mehr als Reinigung.';
}

function applyHeaderLanguage(lang=currentLanguage()){
  const en=lang==='en';
  const home=en?'/en/':'/';
  const items={
    services:[en?'Services':'Leistungen',`${home}#leistungen`,''],
    about:[en?'About Us':'Über uns',`${home}#about`,''],
    contact:[en?'Contact':'Kontakt',`${home}#kontakt`,''],
    faq:['FAQ',`${home}#faq`,''],
    calcpura:['CalcPura','https://calcpura.frankiflow.de/',en?'Pricing software for service businesses':'Preissoftware für Dienstleistungsunternehmen'],
    stay:['FrankiHolz','https://stay.frankiflow.de/',en?'FrankiFlow accommodation & room booking':'FrankiFlow Unterkunft & Zimmerbuchung']
  };
  Object.entries(items).forEach(([key,[label,href,tooltip]])=>{
    const link=$(`[data-calc-nav="${key}"]`);if(!link)return;
    link.textContent=label;link.href=href;
    if(tooltip){
      link.dataset.navTooltip=tooltip;
      link.setAttribute('aria-label',`${label} — ${tooltip}`);
    }else{
      delete link.dataset.navTooltip;
      link.removeAttribute('aria-label');
    }
  });
  const brand=$('.calc-site-header .brand');if(brand)brand.href=home;
  const menu=$('.calc-site-header .menu-btn');if(menu)menu.setAttribute('aria-label',en?'Open menu':'Menü öffnen');
  applyFooterLanguage(lang);
}

function bindHeader(){
  const nav=$('.calc-site-header .nav-links');
  const menu=$('.calc-site-header .menu-btn');
  menu?.addEventListener('click',()=>{
    const open=nav?.classList.toggle('open');
    menu.setAttribute('aria-expanded',String(Boolean(open)));
  });
  $$('.calc-site-header .nav-links a').forEach(link=>link.addEventListener('click',()=>{
    nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');
  }));
  $$('.calc-site-header .language-switch [data-lang]').forEach(button=>button.addEventListener('click',()=>{
    applyHeaderLanguage(button.dataset.lang==='en'?'en':'de');
  }));
  const whatsapp=$('.calc-site-header [data-whatsapp]');if(whatsapp)whatsapp.href=FRANKIFLOW_CONFIG.defaultWhatsApp;
}

applyHeaderLanguage();
bindHeader();
await loadHeaderLogoWidth();
