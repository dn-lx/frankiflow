import { getLanguage } from './site-i18n.js';

const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];

function keepDedicatedAboutOnly(){
  $('#about')?.remove();
  const lang=getLanguage()==='en'?'en':'de';

  const nav=$('.nav-links');
  let navLink=nav?.querySelector('a[href="/about/"],a[href="#about"],[data-section-link="about"]');
  if(nav&&!navLink){
    navLink=document.createElement('a');
    const why=nav.querySelector('a[href="#warum"]');
    why?nav.insertBefore(navLink,why):nav.append(navLink);
  }
  if(navLink){
    navLink.href='/about/';
    navLink.textContent=lang==='en'?'About Us':'Über uns';
    navLink.classList.remove('hidden');
    navLink.dataset.sectionLink='about';
  }

  const footer=$('.footer-grid .footer-links');
  let footerLink=footer?.querySelector('a[href="/about/"],a[href="#about"],[data-section-link="about"]');
  if(footer&&!footerLink){
    footerLink=document.createElement('a');
    footer.prepend(footerLink);
  }
  if(footerLink){
    footerLink.href='/about/';
    footerLink.textContent=lang==='en'?'About Us':'Über uns';
    footerLink.classList.remove('hidden');
    footerLink.dataset.sectionLink='about';
  }

  $$('.nav-links a[href="#about"],.footer-links a[href="#about"]').forEach(link=>{
    link.href='/about/';
    link.textContent=lang==='en'?'About Us':'Über uns';
  });
}

keepDedicatedAboutOnly();
window.addEventListener('frankiflow:language',()=>setTimeout(keepDedicatedAboutOnly,0));
