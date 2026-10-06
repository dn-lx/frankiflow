import { FRANKIFLOW_CONFIG } from './config.js';

const endpoint=`${FRANKIFLOW_CONFIG.supabaseUrl}/functions/v1/frankiflow-analytics`;
const distinctId=crypto.randomUUID();
const customEvents=new Map([
  ['enquiry_submitted',new Set(['source','service_key','language'])],
  ['estimate_pdf_downloaded',new Set(['service_key','language'])],
  ['estimate_print_started',new Set(['service_key','language'])],
  ['estimate_request_opened',new Set(['service_key','language'])],
]);

function clean(event,properties={}){
  const allowed=customEvents.get(event);
  if(!allowed)return {};
  const out={};
  for(const key of allowed){
    const value=properties[key];
    if(['string','number','boolean'].includes(typeof value))out[key]=value;
  }
  return out;
}

async function send(event,properties={}){
  if(event!=='$pageview'&&!customEvents.has(event))return;
  const payload={
    event,
    distinct_id:distinctId,
    pathname:location.pathname,
    properties:event==='$pageview'?{}:clean(event,properties)
  };
  try{
    await fetch(endpoint,{
      method:'POST',
      keepalive:true,
      headers:{
        'Content-Type':'application/json',
        'apikey':FRANKIFLOW_CONFIG.supabasePublishableKey
      },
      body:JSON.stringify(payload)
    });
  }catch{
    // Analytics must never block or alter the customer flow.
  }
}

function capture(event,properties={}){void send(event,properties)}
function pageview(){void send('$pageview')}

window.frankiflowAnalytics=Object.freeze({capture});
pageview();

const originalPush=history.pushState.bind(history);
history.pushState=(...args)=>{
  const value=originalPush(...args);
  queueMicrotask(pageview);
  return value;
};
const originalReplace=history.replaceState.bind(history);
history.replaceState=(...args)=>{
  const value=originalReplace(...args);
  queueMicrotask(pageview);
  return value;
};
window.addEventListener('popstate',()=>queueMicrotask(pageview));
