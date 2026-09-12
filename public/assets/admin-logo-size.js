import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { tr } from './site-i18n.js';
import { normalizeHeaderLogoWidth } from './header-logo-settings.js';

const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s);

function syncLogoControl(value){
  const width=normalizeHeaderLogoWidth(value);
  const range=$('#headerLogoSize');
  const number=$('#headerLogoSizeNumber');
  const label=$('#headerLogoSizeValue');
  const preview=$('#headerLogoPreview img');
  if(range)range.value=String(width);
  if(number)number.value=String(width);
  if(label)label.textContent=String(width);
  if(preview)preview.style.width=`${width}px`;
  return width;
}

function setState(message,isError=false){
  const state=$('#headerLogoSizeState');
  if(!state)return;
  state.textContent=message;
  state.classList.toggle('error',isError);
}

async function loadLogoSize(){
  const {data,error}=await supabase.from('frankiflow_site_settings').select('header_logo_width_px').eq('id',1).maybeSingle();
  if(error){setState(tr('Größe konnte nicht geladen werden.','Could Not Load Size.'),true);return}
  syncLogoControl(data?.header_logo_width_px??260);
}

async function saveLogoSize(){
  const range=$('#headerLogoSize');
  const width=syncLogoControl(range?.value??260);
  setState(tr('Wird gespeichert …','Saving …'));
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){setState(tr('Bitte erneut anmelden.','Please Sign In Again.'),true);return false}
  const {error}=await supabase.from('frankiflow_site_settings').update({header_logo_width_px:width,updated_at:new Date().toISOString(),updated_by:session.user.id}).eq('id',1);
  if(error){setState(`${tr('Fehler','Error')}: ${error.message}`,true);return false}
  setState(`${tr('Gespeichert','Saved')} ✓ · ${width}px`);
  return true;
}

function mountLogoSizeControl(){
  const form=$('#siteForm');
  if(!form||$('#headerLogoSize'))return;
  const submit=form.querySelector('button[type="submit"]');
  const box=document.createElement('section');
  box.className='ff-inline-setting ff-logo-size-setting';
  box.innerHTML=`
    <div class="ff-logo-setting-grid">
      <div>
        <div class="ff-inline-setting-head"><strong>${tr('Header-Logo-Größe','Header Logo Size')}</strong><span><b id="headerLogoSizeValue">260</b> px</span></div>
        <div class="ff-range-row"><input id="headerLogoSize" type="range" min="180" max="340" step="5" value="260"><input id="headerLogoSizeNumber" type="number" min="180" max="340" step="5" value="260"></div>
        <div class="muted">${tr('Empfohlen: 240–280 px. Die Vorschau zeigt jetzt die echte Desktop-Breite. Tablet und Mobil werden weiterhin automatisch begrenzt.','Recommended: 240–280 px. The Preview now shows the actual Desktop Width. Tablet and Mobile are still capped automatically.')}</div>
        <div class="ff-logo-size-actions"><button type="button" id="saveHeaderLogoSize" class="btn btn-secondary btn-small">${tr('Logo-Größe speichern','Save Logo Size')}</button><span id="headerLogoSizeState" class="ff-logo-size-state">${tr('Bereit','Ready')}</span></div>
      </div>
      <div class="ff-logo-preview" id="headerLogoPreview"><span>${tr('Vorschau','Preview')}</span><img src="/assets/frankiflow-logo.png" alt="FrankiFlow"></div>
    </div>`;
  submit?.before(box);

  const range=$('#headerLogoSize');
  const number=$('#headerLogoSizeNumber');
  range?.addEventListener('input',()=>{syncLogoControl(range.value);setState(tr('Nicht gespeichert','Not Saved'))});
  number?.addEventListener('input',()=>{syncLogoControl(number.value);setState(tr('Nicht gespeichert','Not Saved'))});
  $('#saveHeaderLogoSize')?.addEventListener('click',saveLogoSize);

  form.addEventListener('submit',async()=>{await saveLogoSize()});
  loadLogoSize();
}

mountLogoSizeControl();
