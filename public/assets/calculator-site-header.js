import { FRANKIFLOW_CONFIG } from './config.js';
import { loadHeaderLogoWidth } from './header-logo-settings.js';

const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];

function currentLanguage(){
  return localStorage.getItem('frankiflow-lang')==='en'||localStorage.getItem('ff-price-lang')==='en'?'en':'de';
}

function applyHeaderLanguage(lang=currentLanguage()){
  const en=lang==='en';
  const home=en?'/en/':'/';
  const items={
    services:[en?'Services':'Leistungen',`${home}#leistungen`],
    about:[en?'About Us':'Über uns',`${home}#about`],
    contact:[en?'Contact':'Kontakt',`${home}#kontakt`],
    faq:['FAQ',`${home}#faq`],
    stay:[en?'Accommodations':'Unterkunft','https://stay.frankiflow.de/']
  };
  Object.entries(items).forEach(([key,[label,href]])=>{
    const link=$(`[data-calc-nav="${key}"]`);if(!link)return;
    link.textContent=label;link.href=href;
  });
  const brand=$('.calc-site-header .brand');if(brand)brand.href=home;
  const price=$('.calc-site-header .calc-nav-price');if(price){price.firstChild.textContent=en?'Calculate price ':'Preis berechnen ';price.href='/preisrechner/';}
  const menu=$('.calc-site-header .menu-btn');if(menu)menu.setAttribute('aria-label',en?'Open menu':'Menü öffnen');
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
