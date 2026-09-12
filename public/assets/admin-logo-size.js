import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { FRANKIFLOW_CONFIG } from './config.js';
import { tr } from './site-i18n.js';
import { effectiveHeaderHeight, normalizeHeaderHeight, normalizeHeaderLogoWidth } from './header-logo-settings.js';

const supabase=createClient(FRANKIFLOW_CONFIG.supabaseUrl,FRANKIFLOW_CONFIG.supabasePublishableKey);
const $=(s,p=document)=>p.querySelector(s);

function currentValues(){
  return {
    width:normalizeHeaderLogoWidth($('#headerLogoSize')?.value??260),
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

async function loadHeaderSettings(){
  const {data,error}=await supabase.from('frankiflow_site_settings').select('header_logo_width_px,header_height_px').eq('id',1).maybeSingle();
  if(error){setState(tr('Header-Einstellungen konnten nicht geladen werden.','Could Not Load Header Settings.'),true);return}
  syncHeaderControls(data?.header_logo_width_px??260,data?.header_height_px??170);
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

function markChanged(){
  const values=currentValues();
  syncHeaderControls(values.width,values.height);
  setState(tr('Nicht gespeichert','Not Saved'));
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
          <div class="ff-inline-setting-head"><strong>${tr('Header-Logo-Größe','Header Logo Size')}</strong><span><b id="headerLogoSizeValue">260</b> px</span></div>
          <div class="ff-range-row"><input id="headerLogoSize" type="range" min="120" max="340" step="5" value="260"><input id="headerLogoSizeNumber" type="number" min="120" max="340" step="5" value="260"></div>
          <div class="muted">${tr('Bereich: 120–340 px.','Range: 120–340 px.')}</div>
        </div>

        <div class="ff-header-control-block">
          <div class="ff-inline-setting-head"><strong>${tr('Header-Höhe','Header Height')}</strong><span><b id="headerHeightSizeValue">170</b> px</span></div>
          <div class="ff-range-row"><input id="headerHeightSize" type="range" min="120" max="240" step="5" value="170"><input id="headerHeightSizeNumber" type="number" min="120" max="240" step="5" value="170"></div>
          <div class="muted">${tr('Bereich: 120–240 px. Für große Logos wird automatisch eine sichere Mindesthöhe verwendet.','Range: 120–240 px. A safe minimum is automatically used for very large Logos.')}</div>
        </div>

        <div class="ff-logo-height-readout">${tr('Tatsächlich angewendete Header-Höhe','Applied Header Height')}: <strong><span id="headerHeightAppliedValue">170</span> px</strong></div>
        <div class="ff-logo-size-actions"><button type="button" id="saveHeaderLogoSize" class="btn btn-secondary btn-small">${tr('Header-Einstellungen speichern','Save Header Settings')}</button><span id="headerLogoSizeState" class="ff-logo-size-state">${tr('Bereit','Ready')}</span></div>
      </div>
      <div class="ff-logo-preview" id="headerLogoPreview"><span>${tr('Vorschau','Preview')}</span><div class="ff-logo-preview-stage" id="headerLogoPreviewStage"><img src="/assets/frankiflow-logo.png" alt="FrankiFlow"></div></div>
    </div>`;
  submit?.before(box);

  ['#headerLogoSize','#headerLogoSizeNumber','#headerHeightSize','#headerHeightSizeNumber'].forEach(selector=>{
    $(selector)?.addEventListener('input',markChanged);
  });
  $('#saveHeaderLogoSize')?.addEventListener('click',saveHeaderSettings);
  form.addEventListener('submit',async()=>{await saveHeaderSettings()});
  loadHeaderSettings();
}

mountHeaderControls();
