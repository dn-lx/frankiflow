import { getLanguage } from './site-i18n.js';

const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];


function keepAccommodationsLast(){
  const nav=$('.nav-links');if(!nav)return;
  let link=nav.querySelector('.nav-accommodations,a[href^="https://accommodation.frankiflow.de"]');
  if(!link){link=document.createElement('a');link.href='https://accommodation.frankiflow.de/';link.className='nav-accommodations';}
  link.textContent='Accommodations';link.classList.add('nav-accommodations');nav.append(link);
}

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
keepAccommodationsLast();
window.addEventListener('frankiflow:language',()=>setTimeout(()=>{keepDedicatedAboutOnly();keepAccommodationsLast()},0));
