function applyFrankiFlowFavicon(){
  let icon=document.querySelector('link[rel~="icon"]');
  if(!icon){icon=document.createElement('link');icon.rel='icon';document.head.append(icon)}
  icon.href='/assets/frankiflow-favicon.svg?v=20260911b';
  icon.type='image/svg+xml';
}

if(typeof document!=='undefined'){
  applyFrankiFlowFavicon();
  setTimeout(applyFrankiFlowFavicon,0);
}

export const FRANKIFLOW_CONFIG = Object.freeze({
  supabaseUrl: 'https://bdeajozhylypiidrldka.supabase.co',
  supabasePublishableKey: 'sb_publishable_FX7QKUBZQmwykGcgv8SdfQ_lGRZF8n2',
  mediaBucket: 'frankiflow-media',
  defaultPhone: '+49 176 62493041',
  defaultEmail: 'info@frankiflow.de',
  defaultWhatsApp: 'https://wa.link/9knp7y',
  serviceArea: 'Frankfurt am Main & Umgebung'
});
