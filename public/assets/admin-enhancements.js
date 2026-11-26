import { supabase } from './pricing.js';
import { tr } from './site-i18n.js';

const $=(s,p=document)=>p.querySelector(s);

function ensureHeroSizeControl(){
  const form=$('#siteForm');if(!form||$('#heroTitleSize'))return;
  const submit=form.querySelector('button[type="submit"]');const box=document.createElement('div');box.className='ff-inline-setting';box.innerHTML=`<div class="ff-inline-setting-head"><strong>${tr('Hero-Titelgröße','Hero Title Size')}</strong><span><b id="heroTitleSizeValue">64</b> px</span></div><div class="ff-range-row"><input id="heroTitleSize" type="range" min="34" max="88" step="1" value="64"><input id="heroTitleSizeNumber" type="number" min="34" max="88" step="1" value="64"></div><div class="muted">${tr('Standard ist 64 px. Die Website begrenzt die Größe auf kleinen Bildschirmen automatisch.','Default is 64 px. The Website automatically limits the Size on small Screens.')}</div>`;submit?.before(box);
  const range=$('#heroTitleSize'),num=$('#heroTitleSizeNumber'),val=$('#heroTitleSizeValue');const sync=v=>{v=Math.min(88,Math.max(34,Number(v)||64));range.value=String(v);num.value=String(v);val.textContent=String(v)};range.oninput=()=>sync(range.value);num.oninput=()=>sync(num.value);
  supabase.from('frankiflow_site_settings').select('hero_title_size_px').eq('id',1).maybeSingle().then(({data})=>sync(data?.hero_title_size_px||64));
  form.addEventListener('submit',async()=>{const {data:{session}}=await supabase.auth.getSession();if(!session)return;await supabase.from('frankiflow_site_settings').update({hero_title_size_px:Number(range.value),updated_at:new Date().toISOString(),updated_by:session.user.id}).eq('id',1)});
}

function enhancePhotoControls(){
  const form=$('#photoForm'),select=$('#photoCategory');if(!form||!select)return;
  if(!form.querySelector('.ff-photo-help')){const p=document.createElement('p');p.className='ff-photo-help';p.textContent=tr('Wählen Sie, wo das Foto verwendet werden soll. Fotos können unten jederzeit wieder gelöscht werden. Für Service-Seiten wird das erste aktive Foto der jeweiligen Kategorie als Seitenbild verwendet.','Choose where the Photo should be used. Photos can be deleted at any time below. Service Pages use the first active Photo in the selected Category as the Page Image.');form.prepend(p)}
  const selected=select.value||'general';select.innerHTML=`<option value="general">${tr('Startseite – Galerie','Homepage – Gallery')}</option><option value="hero">${tr('Startseite – Hero','Homepage – Hero')}</option><option value="office">${tr('Büroreinigungsseite','Office-Cleaning Page')}</option><option value="home">${tr('Wohnungsreinigungsseite','Home-Cleaning Page')}</option><option value="airbnb">${tr('Airbnb-/Ferienwohnungsseite','Airbnb / Holiday-Rental Page')}</option><option value="staircase">${tr('Treppenhausseite','Stairwell-Cleaning Page')}</option><option value="deep">${tr('Grundreinigungsseite','Deep-Cleaning Page')}</option><option value="property">${tr('Objektbetreuungsseite','Property-Care Page')}</option>`;if([...select.options].some(o=>o.value===selected))select.value=selected;
  select.onchange=()=>{if($('#useAsHero'))$('#useAsHero').checked=select.value==='hero'};
  const names={general:tr('Startseite – Galerie','Homepage – Gallery'),hero:tr('Startseite – Hero','Homepage – Hero'),office:tr('Büroreinigungsseite','Office-Cleaning Page'),home:tr('Wohnungsreinigungsseite','Home-Cleaning Page'),airbnb:tr('Airbnb-/Ferienwohnungsseite','Airbnb / Holiday-Rental Page'),staircase:tr('Treppenhausseite','Stairwell-Cleaning Page'),deep:tr('Grundreinigungsseite','Deep-Cleaning Page'),property:tr('Objektbetreuungsseite','Property-Care Page'),commercial:tr('Gewerbe','Commercial')};
  const rows=$('#photoRows');if(rows&&!rows.dataset.ffObserved){rows.dataset.ffObserved='1';const relabel=()=>{for(const trEl of rows.querySelectorAll('tr')){const td=trEl.children[2];if(td&&names[td.textContent.trim()])td.textContent=names[td.textContent.trim()]}};new MutationObserver(relabel).observe(rows,{childList:true,subtree:true});relabel()}
}

ensureHeroSizeControl();enhancePhotoControls();
window.addEventListener('frankiflow:language',()=>{enhancePhotoControls()});
