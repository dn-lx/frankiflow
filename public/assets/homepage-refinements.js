import { getLanguage, normalizeEnglishUi, tr } from './site-i18n.js';

const $=(s,p=document)=>p.querySelector(s);const $$=(s,p=document)=>[...p.querySelectorAll(s)];

function polishManagedHomepage(){
  const lang=getLanguage();
  $$('[data-section-link="about"]').forEach(link=>{link.textContent=tr('Über uns','About Us')});
  const aboutFooter=$('.footer-grid>div:nth-child(2) .footer-links');
  const footerAbout=$('.footer-grid [data-section-link="about"]');
  if(aboutFooter&&footerAbout&&footerAbout.parentElement!==aboutFooter)aboutFooter.prepend(footerAbout);
  const signature=$('.about-signature strong');if(signature)signature.textContent=tr('Mehr als Reinigung.','More Than Cleaning.');
  normalizeEnglishUi(document,lang);
}

polishManagedHomepage();
window.addEventListener('frankiflow:language',()=>setTimeout(polishManagedHomepage,0));
