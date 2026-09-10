import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import {FRANKIFLOW_CONFIG} from './config.js';
import {getLanguage,initI18n,mountLanguageSwitch,translateDom,tr} from './site-i18n.js';
const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);const el=id=>document.getElementById(id);
mountLanguageSwitch(document.querySelector('.site-header .nav'),{prepend:false});initI18n();
const {data}=await supabase.from('frankiflow_site_settings').select('*').eq('id',1).maybeSingle();const d=data||{};
function render(){if(d.legal_owner)el('owner').textContent=d.legal_owner;if(d.legal_street)el('street').textContent=d.legal_street;else el('legalWarning').classList.remove('hidden');if(d.legal_postcode_city)el('city').textContent=d.legal_postcode_city;if(d.phone){el('phone').textContent=d.phone;el('phone').href='tel:'+d.phone.replace(/\s/g,'')}if(d.email){el('mail').textContent=d.email;el('mail').href='mailto:'+d.email}el('responsible').textContent=(d.legal_owner||'Inura Devasurendra')+', '+(d.legal_street?d.legal_street+', ':'')+(d.legal_postcode_city||'Frankfurt am Main')+tr(', Anschrift wie oben.',', address as above.');translateDom(document,getLanguage())}
render();window.addEventListener('frankiflow:language',render);
