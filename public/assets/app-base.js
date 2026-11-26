import { FRANKIFLOW_CONFIG } from './config.js';
import { supabase } from './pricing.js';
import { getLanguage, initI18n, mountLanguageSwitch, translateDom } from './site-i18n.js';
import { loadHeaderLogoWidth } from './header-logo-settings.js?v=20261006-logo-checkbox-v2';

const $=(s,p=document)=>p.querySelector(s); const $$=(s,p=document)=>[...p.querySelectorAll(s)];
let siteSettings=null;
let promotionSettings={label:'20% Neukundenrabatt im ersten Monat',enabled:true,first_month_discount_pct:20};

const fallbackSettings={
  hero_eyebrow:'Mehr als Reinigung.',hero_eyebrow_en:'More than cleaning.',
  hero_title:'Gebäudereinigung, die einfach funktioniert.',hero_title_en:'Cleaning services that simply work.',
  hero_subtitle:'Professionelle Reinigung und Objektbetreuung für Büros, Wohnungen, Treppenhäuser und Ferienunterkünfte in Frankfurt am Main, Nürnberg & Umgebung.',hero_subtitle_en:'Professional cleaning and property care for offices, homes, stairwells and holiday rentals in Frankfurt, Nuremberg and surrounding areas.',
  offer_title:'20% Neukundenrabatt im ersten Monat',offer_title_en:'20% new-customer discount in the first month',
  offer_text:'Zusätzlich ist eine kostenlose Probereinigung nach Absprache möglich.',offer_text_en:'A free trial cleaning can also be arranged.',
  email:FRANKIFLOW_CONFIG.defaultEmail,phone:FRANKIFLOW_CONFIG.defaultPhone,whatsapp_url:FRANKIFLOW_CONFIG.defaultWhatsApp,
  service_area:FRANKIFLOW_CONFIG.serviceArea,service_area_en:'Frankfurt, Nuremberg & surrounding areas',
  primary_cta_label:'Preis sofort berechnen',primary_cta_label_en:'Calculate price now',
  secondary_cta_label:'Angebot anfragen',secondary_cta_label_en:'Request a quote',hero_image_path:null,
  legal_owner:'Inura Devasurendra',legal_street:'',legal_postcode_city:'Frankfurt am Main'
};

function applySiteLanguage(){
  if(!siteSettings)return;const lang=getLanguage();
  $$('[data-setting]').forEach(el=>{const key=el.dataset.setting;const langKey=lang==='en'?`${key}_en`:key;const value=siteSettings[langKey]||siteSettings[key]||fallbackSettings[langKey]||fallbackSettings[key];if(value!=null)el.textContent=value});
  translateDom(document,lang);
}


function normalizePromotion(value){
  const raw=value&&typeof value==='object'?value:{};
  const pct=Math.max(0,Math.min(100,Number(raw.first_month_discount_pct??20)||0));
  return {
    ...raw,
    enabled:raw.enabled!==false,
    first_month_discount_pct:pct,
    label:String(raw.label||`${pct}% Neukundenrabatt im ersten Monat`)
  };
}

function applyPromotionBindings(root=document){
  promotionSettings=normalizePromotion(promotionSettings);
  const pct=promotionSettings.first_month_discount_pct;
  const enabled=promotionSettings.enabled!==false&&pct>0;
  root.querySelectorAll?.('[data-promo-percent]').forEach(el=>{el.textContent=`${pct}%`;});
  root.querySelectorAll?.('[data-promo-card],[data-promo-signal],[data-promo-benefit]').forEach(el=>el.classList.toggle('hidden',!enabled));
  if(siteSettings){
    siteSettings.offer_title=`${pct}% Neukundenrabatt im ersten Monat`;
    siteSettings.offer_title_en=`${pct}% new-customer discount in the first month`;
  }
}

async function loadSite(){
  const [siteResult,promoResult]=await Promise.all([
    supabase.from('frankiflow_site_settings').select('*').eq('id',1).maybeSingle(),
    supabase.from('pricing_config').select('value').eq('key','promotion_settings').eq('is_public',true).maybeSingle()
  ]);
  const data=siteResult?.data;
  if(!promoResult?.error&&promoResult?.data?.value)promotionSettings=normalizePromotion(promoResult.data.value);
  siteSettings={...fallbackSettings,...(data||{})};
  siteSettings.hero_subtitle=String(siteSettings.hero_subtitle||fallbackSettings.hero_subtitle).replace(/Frankfurt am Main\s*&\s*Umgebung/g,'Frankfurt am Main, Nürnberg & Umgebung');
  siteSettings.hero_subtitle_en=String(siteSettings.hero_subtitle_en||fallbackSettings.hero_subtitle_en).replace(/Frankfurt am Main(?:\s*&| and)\s*surrounding areas/gi,'Frankfurt, Nuremberg & surrounding areas');
  siteSettings.service_area='Frankfurt am Main, Nürnberg & Umgebung';
  siteSettings.service_area_en='Frankfurt, Nuremberg & surrounding areas';
  applyPromotionBindings(document);
  applySiteLanguage();
  $$('[data-mail]').forEach(el=>{el.href=`mailto:${siteSettings.email}`;const strong=el.querySelector('strong');if(strong)strong.textContent=siteSettings.email;else el.textContent=siteSettings.email});
  $$('[data-phone]').forEach(el=>{el.href=`tel:${siteSettings.phone.replace(/\s/g,'')}`;const strong=el.querySelector('strong');if(strong)strong.textContent=siteSettings.phone;else el.textContent=siteSettings.phone});
  $$('[data-whatsapp]').forEach(el=>{el.href=siteSettings.whatsapp_url||FRANKIFLOW_CONFIG.defaultWhatsApp});
  if(siteSettings.hero_image_path){const {data:urlData}=supabase.storage.from(FRANKIFLOW_CONFIG.mediaBucket).getPublicUrl(siteSettings.hero_image_path);const hero=$('.hero-photo');if(hero){hero.style.backgroundImage=`linear-gradient(135deg,rgba(8,29,45,.12),rgba(8,29,45,.02)),url("${urlData.publicUrl}")`;hero.classList.add('has-image')}}
}


mountLanguageSwitch($('.nav-actions'),{prepend:true});initI18n();
window.addEventListener('frankiflow:language',()=>{applySiteLanguage();applyPromotionBindings(document)});
window.addEventListener('frankiflow:shell-content-mounted',()=>{applySiteLanguage();applyPromotionBindings(document)});
window.addEventListener('focus',()=>{void loadSite()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void loadSite()});
try {
  supabase.channel('frankiflow-public-pricing')
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'pricing_config',filter:'key=eq.promotion_settings'},payload=>{
      if(payload?.new?.value){
        promotionSettings=normalizePromotion(payload.new.value);
        applyPromotionBindings(document);
        applySiteLanguage();
      }
    })
    .on('postgres_changes',{event:'*',schema:'public',table:'frankiflow_site_settings'},()=>{
      void loadSite();
      window.dispatchEvent(new CustomEvent('frankiflow:site-settings-changed'));
    })
    .subscribe();
} catch (error) { console.warn('FrankiFlow realtime unavailable', error); }
await Promise.allSettled([loadSite(),loadHeaderLogoWidth()]);applyPromotionBindings(document);applySiteLanguage();
