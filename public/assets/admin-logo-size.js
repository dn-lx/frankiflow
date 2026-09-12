import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { tr } from './site-i18n.js';
import { effectiveHeaderHeight, normalizeHeaderHeight, normalizeHeaderLogoWidth } from './header-logo-settings.js';

const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s);

function currentValues(){
  return {
    width:normalizeHeaderLogoWidth($('#headerLogoSize')?.value??120),
    height:normalizeHeaderHeight($('#headerHeightSize')?.value??170)
  };
}

function syncHeaderControls(widthValue,heightValue){
  const width=normalizeHeaderLogoWidth(widthValue);
  const height=normalizeHeaderHeight(heightValue);
  const appliedHeight=effectiveHeaderHeight(width,height);
  const logoRange=$('#headerLogoSize');
  const logoNumber=$('#headerLogoSizeNumber');
  const logoLabel=$('#headerLogoSizeValue');
  const heightRange=$('#headerHeightSize');
  const heightNumber=$('#headerHeightSizeNumber');
  const heightLabel=$('#headerHeightSizeValue');
  const appliedLabel=$('#headerHeightAppliedValue');
  const preview=$('#headerLogoPreview img');
  const previewStage=$('#headerLogoPreviewStage');

  if(logoRange)logoRange.value=String(width);
  if(logoNumber)logoNumber.value=String(width);
  if(logoLabel)logoLabel.textContent=String(width);
  if(heightRange)heightRange.value=String(height);
  if(heightNumber)heightNumber.value=String(height);
  if(heightLabel)heightLabel.textContent=String(height);
  if(appliedLabel)appliedLabel.textContent=String(appliedHeight);
  if(preview)preview.style.width=`${width}px`;
  if(previewStage)previewStage.style.minHeight=`${appliedHeight}px`;
  return {width,height,appliedHeight};
}

function setState(message,isError=false){
  const state=$('#headerLogoSizeState');
  if(!state)return;
  state.textContent=message;
  state.classList.toggle('error',isError);
}

function previewChange(widthValue,heightValue){
  syncHeaderControls(widthValue,heightValue);
  setState(tr('Nicht gespeichert','Not Saved'));
}

async function loadHeaderSettings(){
  const {data,error}=await supabase.from('frankiflow_site_settings').select('header_logo_width_px,header_height_px').eq('id',1).maybeSingle();
  if(error){setState(tr('Header-Einstellungen konnten nicht geladen werden.','Could Not Load Header Settings.'),true);return}
  syncHeaderControls(data?.header_logo_width_px??120,data?.header_height_px??170);
}

async function saveHeaderSettings(){
  const values=currentValues();
  const synced=syncHeaderControls(values.width,values.height);
  setState(tr('Wird gespeichert …','Saving …'));
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){setState(tr('Bitte erneut anmelden.','Please Sign In Again.'),true);return false}
  const {error}=await supabase.from('frankiflow_site_settings').update({
    header_logo_width_px:synced.width,
    header_height_px:synced.height,
    updated_at:new Date().toISOString(),
    updated_by:session.user.id
  }).eq('id',1);
  if(error){setState(`${tr('Fehler','Error')}: ${error.message}`,true);return false}
  setState(`${tr('Gespeichert','Saved')} ✓ · ${synced.width}px / ${synced.height}px`);
  return true;
}

function mountHeaderControls(){
  const form=$('#siteForm');
  if(!form||$('#headerLogoSize'))return;
  const submit=form.querySelector('button[type="submit"]');
  const box=document.createElement('section');
  box.className='ff-inline-setting ff-logo-size-setting';
  box.innerHTML=`
    <div class="ff-logo-setting-grid">
      <div class="ff-header-controls">
        <div class="ff-header-control-block">
          <div class="ff-inline-setting-head"><strong>${tr('Header-Logo-Größe','Header Logo Size')}</strong><span><b id="headerLogoSizeValue">120</b> px</span></div>
          <div class="ff-range-row"><input id="headerLogoSize" type="range" min="90" max="250" step="5" value="120"><input id="headerLogoSizeNumber" type="number" min="90" max="250" step="5" value="120"></div>
          <div class="muted">${tr('Bereich: 90–250 px. Die Einstellung gilt auch für die mobile Ansicht.','Range: 90–250 px. This Setting also applies to the Mobile View.')}</div>
        </div>

        <div class="ff-header-control-block">
          <div class="ff-inline-setting-head"><strong>${tr('Header-Höhe','Header Height')}</strong><span><b id="headerHeightSizeValue">170</b> px</span></div>
          <div class="ff-range-row"><input id="headerHeightSize" type="range" min="90" max="250" step="5" value="170"><input id="headerHeightSizeNumber" type="number" min="90" max="250" step="5" value="170"></div>
          <div class="muted">${tr('Bereich: 90–250 px. Für ein großes Logo wird automatisch die nötige Mindesthöhe verwendet.','Range: 90–250 px. A large Logo automatically gets the minimum Height it needs.')}</div>
        </div>

        <div class="ff-logo-height-readout">${tr('Tatsächlich angewendete Header-Höhe','Applied Header Height')}: <strong><span id="headerHeightAppliedValue">170</span> px</strong></div>
        <div class="ff-logo-size-actions"><span class="muted">${tr('Diese Werte werden mit „Änderungen speichern“ gespeichert.','These Values are saved with “Save Changes”.')}</span><span id="headerLogoSizeState" class="ff-logo-size-state">${tr('Bereit','Ready')}</span></div>
      </div>
      <div class="ff-logo-preview" id="headerLogoPreview"><span>${tr('Vorschau','Preview')}</span><div class="ff-logo-preview-stage" id="headerLogoPreviewStage"><img src="/assets/frankiflow-logo.png" alt="FrankiFlow"></div></div>
    </div>`;
  submit?.before(box);

  const logoRange=$('#headerLogoSize');
  const logoNumber=$('#headerLogoSizeNumber');
  const heightRange=$('#headerHeightSize');
  const heightNumber=$('#headerHeightSizeNumber');

  logoRange?.addEventListener('input',()=>previewChange(logoRange.value,heightRange?.value??170));
  logoNumber?.addEventListener('input',()=>previewChange(logoNumber.value,heightRange?.value??170));
  heightRange?.addEventListener('input',()=>previewChange(logoRange?.value??120,heightRange.value));
  heightNumber?.addEventListener('input',()=>previewChange(logoRange?.value??120,heightNumber.value));

  form.addEventListener('submit',async()=>{await saveHeaderSettings()});
  loadHeaderSettings();
}

mountHeaderControls();
