import { FRANKIFLOW_CONFIG } from './config.js';
import { normalizeEnglishUi, translateDom } from './site-i18n.js';

const CATEGORY_BY_PATH=[
  [/\/bueroreinigung-frankfurt\/?$|\/en\/office-cleaning-frankfurt\/?$/, 'office'],
  [/\/wohnungsreinigung-frankfurt\/?$|\/en\/home-cleaning-frankfurt\/?$/, 'home'],
  [/\/airbnb-reinigung-frankfurt\/?$|\/en\/airbnb-cleaning-frankfurt\/?$/, 'airbnb'],
  [/\/treppenhausreinigung-frankfurt\/?$|\/en\/stairwell-cleaning-frankfurt\/?$/, 'staircase'],
  [/\/grundreinigung-frankfurt\/?$|\/en\/deep-cleaning-frankfurt\/?$/, 'deep'],
  [/\/objektbetreuung-frankfurt\/?$|\/en\/property-care-frankfurt\/?$/, 'property']
];

function serviceCategory(pathname){
  return CATEGORY_BY_PATH.find(([pattern])=>pattern.test(pathname))?.[1]||null;
}

function publicStorageUrl(path){
  const encoded=String(path).split('/').map(encodeURIComponent).join('/');
  return `${FRANKIFLOW_CONFIG.supabaseUrl.replace(/\/$/,'')}/storage/v1/object/public/${encodeURIComponent(FRANKIFLOW_CONFIG.mediaBucket)}/${encoded}`;
}

function normalizePageLanguage(){
  const lang=document.documentElement.lang==='en'?'en':'de';
  if(lang==='en')translateDom(document,'en');
  normalizeEnglishUi(document,lang);
}

async function loadServiceHeroPhoto(){
  const hero=document.querySelector('.seo-page-hero');
  const category=serviceCategory(location.pathname);
  if(!hero||!category)return;

  const base=FRANKIFLOW_CONFIG.supabaseUrl.replace(/\/$/,'');
  const query=new URLSearchParams({
    category:`eq.${category}`,
    active:'eq.true',
    select:'storage_path',
    order:'sort_order.asc,created_at.desc',
    limit:'1'
  });

  try{
    const response=await fetch(`${base}/rest/v1/frankiflow_gallery?${query.toString()}`,{
      headers:{
        apikey:FRANKIFLOW_CONFIG.supabasePublishableKey,
        Authorization:`Bearer ${FRANKIFLOW_CONFIG.supabasePublishableKey}`
      }
    });
    if(!response.ok)return;
    const rows=await response.json();
    const path=rows?.[0]?.storage_path;
    if(!path)return;
    const url=publicStorageUrl(path).replace(/"/g,'%22');
    hero.style.backgroundImage=`linear-gradient(110deg,rgba(7,29,44,.88),rgba(10,73,78,.60)),url("${url}")`;
    hero.classList.add('has-service-photo');
  }catch(error){
    console.warn('FrankiFlow service photo could not be loaded',error);
  }
}

normalizePageLanguage();
loadServiceHeroPhoto();
