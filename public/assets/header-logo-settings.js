import { FRANKIFLOW_CONFIG } from './config.js';

const DEFAULT_WIDTH=260;
const MIN_WIDTH=120;
const MAX_WIDTH=340;
const MIN_HEADER_HEIGHT=108;
const MAX_HEADER_HEIGHT=176;

export function normalizeHeaderLogoWidth(value){
  const parsed=Number(value);
  if(!Number.isFinite(parsed))return DEFAULT_WIDTH;
  return Math.min(MAX_WIDTH,Math.max(MIN_WIDTH,Math.round(parsed)));
}

export function headerHeightForLogoWidth(value){
  const width=normalizeHeaderLogoWidth(value);
  return Math.min(MAX_HEADER_HEIGHT,Math.max(MIN_HEADER_HEIGHT,Math.round(width*.42+30)));
}

export function applyHeaderLogoWidth(value){
  const width=normalizeHeaderLogoWidth(value);
  const headerHeight=headerHeightForLogoWidth(width);
  document.documentElement.style.setProperty('--ff-header-logo-width',`${width}px`);
  document.documentElement.style.setProperty('--ff-header-height',`${headerHeight}px`);
  return width;
}

export async function loadHeaderLogoWidth(){
  const base=FRANKIFLOW_CONFIG.supabaseUrl.replace(/\/$/,'');
  const query=new URLSearchParams({id:'eq.1',select:'header_logo_width_px',limit:'1'});
  try{
    const response=await fetch(`${base}/rest/v1/frankiflow_site_settings?${query.toString()}`,{headers:{apikey:FRANKIFLOW_CONFIG.supabasePublishableKey,Authorization:`Bearer ${FRANKIFLOW_CONFIG.supabasePublishableKey}`}});
    if(!response.ok)return applyHeaderLogoWidth(DEFAULT_WIDTH);
    const rows=await response.json();
    return applyHeaderLogoWidth(rows?.[0]?.header_logo_width_px??DEFAULT_WIDTH);
  }catch(error){
    console.warn('FrankiFlow header logo size could not be loaded',error);
    return applyHeaderLogoWidth(DEFAULT_WIDTH);
  }
}

applyHeaderLogoWidth(DEFAULT_WIDTH);
