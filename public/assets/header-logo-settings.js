import { FRANKIFLOW_CONFIG } from './config.js';

const DEFAULT_WIDTH=260;
const MIN_WIDTH=120;
const MAX_WIDTH=340;
const DEFAULT_HEADER_HEIGHT=170;
const MIN_HEADER_HEIGHT=120;
const MAX_HEADER_HEIGHT=240;

export function normalizeHeaderLogoWidth(value){
  const parsed=Number(value);
  if(!Number.isFinite(parsed))return DEFAULT_WIDTH;
  return Math.min(MAX_WIDTH,Math.max(MIN_WIDTH,Math.round(parsed)));
}

export function normalizeHeaderHeight(value){
  const parsed=Number(value);
  if(!Number.isFinite(parsed))return DEFAULT_HEADER_HEIGHT;
  return Math.min(MAX_HEADER_HEIGHT,Math.max(MIN_HEADER_HEIGHT,Math.round(parsed)));
}

export function headerHeightForLogoWidth(value){
  const width=normalizeHeaderLogoWidth(value);
  return Math.min(176,Math.max(108,Math.round(width*.42+30)));
}

export function effectiveHeaderHeight(widthValue,heightValue){
  return Math.max(normalizeHeaderHeight(heightValue),headerHeightForLogoWidth(widthValue));
}

export function applyHeaderSettings(widthValue,heightValue=DEFAULT_HEADER_HEIGHT){
  const width=normalizeHeaderLogoWidth(widthValue);
  const requestedHeight=normalizeHeaderHeight(heightValue);
  const appliedHeight=effectiveHeaderHeight(width,requestedHeight);
  document.documentElement.style.setProperty('--ff-header-logo-width',`${width}px`);
  document.documentElement.style.setProperty('--ff-header-height',`${appliedHeight}px`);
  return {width,requestedHeight,appliedHeight};
}

export function applyHeaderLogoWidth(value){
  return applyHeaderSettings(value,DEFAULT_HEADER_HEIGHT).width;
}

export async function loadHeaderLogoWidth(){
  const base=FRANKIFLOW_CONFIG.supabaseUrl.replace(/\/$/,'');
  const query=new URLSearchParams({id:'eq.1',select:'header_logo_width_px,header_height_px',limit:'1'});
  try{
    const response=await fetch(`${base}/rest/v1/frankiflow_site_settings?${query.toString()}`,{headers:{apikey:FRANKIFLOW_CONFIG.supabasePublishableKey,Authorization:`Bearer ${FRANKIFLOW_CONFIG.supabasePublishableKey}`}});
    if(!response.ok)return applyHeaderSettings(DEFAULT_WIDTH,DEFAULT_HEADER_HEIGHT).width;
    const rows=await response.json();
    const settings=applyHeaderSettings(rows?.[0]?.header_logo_width_px??DEFAULT_WIDTH,rows?.[0]?.header_height_px??DEFAULT_HEADER_HEIGHT);
    return settings.width;
  }catch(error){
    console.warn('FrankiFlow header settings could not be loaded',error);
    return applyHeaderSettings(DEFAULT_WIDTH,DEFAULT_HEADER_HEIGHT).width;
  }
}

applyHeaderSettings(DEFAULT_WIDTH,DEFAULT_HEADER_HEIGHT);
