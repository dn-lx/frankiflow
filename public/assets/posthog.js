const TOKEN='phc_xuY964YyWsLwaeQYJGBXtRqYvtvkmDaMLUTqazhuHRU3';
const API_HOST='https://us.i.posthog.com';

const hostname=location.hostname.toLowerCase();
const environment=
  hostname==='frankiflow.de'||hostname==='www.frankiflow.de'?'production':
  hostname.startsWith('develop--')||hostname==='frankiflow.shipstatic.com'?'development':
  hostname.startsWith('v2--')?'v2-preview':
  hostname==='localhost'||hostname==='127.0.0.1'?'local':'preview';

const allowedEvents=new Map([
  ['enquiry_submitted',new Set(['source','service_key','language'])],
  ['estimate_pdf_downloaded',new Set(['service_key','language'])],
  ['estimate_print_started',new Set(['service_key','language'])],
  ['estimate_request_opened',new Set(['service_key','language'])],
]);

const queued=[];

function cleanProperties(event,properties={}){
  const allowed=allowedEvents.get(event);
  if(!allowed)return {};
  const out={environment,app:'frankiflow'};
  for(const key of allowed){
    const value=properties[key];
    if(['string','number','boolean'].includes(typeof value))out[key]=value;
  }
  return out;
}

function capture(event,properties={}){
  if(!allowedEvents.has(event))return;
  const payload=cleanProperties(event,properties);
  if(window.posthog?.capture){
    window.posthog.capture(event,payload);
    return;
  }
  queued.push([event,payload]);
}

window.frankiflowAnalytics=Object.freeze({capture,environment});

function loadPostHog(){
  if(window.__frankiflowPostHogLoading||window.posthog?.__loaded)return;
  window.__frankiflowPostHogLoading=true;
  const script=document.createElement('script');
  script.async=true;
  script.src=API_HOST+'/static/1/array.js';
  script.crossOrigin='anonymous';
  script.onload=()=>{
    if(!window.posthog?.init)return;
    window.posthog.init(TOKEN,{
      api_host:API_HOST,
      defaults:'2026-05-30',
      autocapture:false,
      capture_pageview:'history_change',
      capture_pageleave:false,
      disable_session_recording:true,
      persistence:'memory',
      person_profiles:'never',
      advanced_disable_flags:true,
      loaded:posthog=>{
        posthog.register({environment,app:'frankiflow'});
        for(const [event,payload] of queued.splice(0))posthog.capture(event,payload);
      },
    });
  };
  script.onerror=()=>{window.__frankiflowPostHogLoading=false;};
  document.head.append(script);
}

loadPostHog();
