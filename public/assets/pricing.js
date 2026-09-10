import { FRANKIFLOW_CONFIG } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const supabase = createClient(FRANKIFLOW_CONFIG.supabaseUrl, FRANKIFLOW_CONFIG.supabasePublishableKey);

export const FALLBACK_PRICING = {
  contract_settings:{months:[1,3,6,9,12,24],base_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}},
  deep_cleaning_settings:{label:'Grundreinigung',enabled:true,surcharge_pct:30},
  equipment_settings:{base:5,enabled:true,gradient_per_sqm:.01},
  frequency_settings:{options:[{key:'once',label:'Einmalig',visits_per_month:1},{key:'monthly',label:'1× pro Monat',visits_per_month:1},{key:'biweekly',label:'Alle 2 Wochen',visits_per_month:2},{key:'weekly1',label:'1× pro Woche',visits_per_month:4},{key:'weekly2',label:'2× pro Woche',visits_per_month:8},{key:'weekly3',label:'3× pro Woche',visits_per_month:12},{key:'weekly4',label:'4× pro Woche',visits_per_month:16},{key:'weekly5',label:'5× pro Woche',visits_per_month:20}]},
  promotion_settings:{label:'25% Neukundenrabatt im ersten Monat',enabled:true,first_month_discount_pct:25},
  service_settings:{services:{buero:{label:'Büroreinigung',base_1m:24,enabled:true},airbnb:{label:'Ferienwohnung / Airbnb',base_1m:26,enabled:true},wohnung:{label:'Wohnungsreinigung',base_1m:30,enabled:true},treppenhaus:{label:'Treppenhausreinigung',base_1m:24,enabled:true}},gradient_per_sqm:.2304,minimum_cleaning_charge:30},
  vat_settings:{label:'MwSt. zum Rechnungsbetrag hinzufügen',enabled:true,rate_pct:19,customer_pays_default:false},
  window_settings:{base:5,enabled:true,minimum:35,gradient_per_sqm:2.5}
};

export async function loadPricing(){
  const {data,error}=await supabase.from('pricing_config').select('key,value').eq('is_public',true);
  if(error||!data?.length) return structuredClone(FALLBACK_PRICING);
  const cfg=structuredClone(FALLBACK_PRICING);
  for(const row of data) cfg[row.key]=row.value;
  return cfg;
}

export function calculateEstimate(cfg,input){
  const service=cfg.service_settings?.services?.[input.serviceKey];
  const sqm=Math.max(Number(input.areaSqm)||0,1);
  const visits=Math.max(Number(input.visitsPerMonth)||1,1);
  const months=String(input.contractMonths||1);
  const reduction=Number(cfg.contract_settings?.base_reduction_pct?.[months]||0)/100;
  const minCharge=Number(cfg.service_settings?.minimum_cleaning_charge||0);
  let visitPrice=Math.max(minCharge,Number(service?.base_1m||0)+sqm*Number(cfg.service_settings?.gradient_per_sqm||0));
  visitPrice*=1-reduction;
  if(input.deepCleaning&&cfg.deep_cleaning_settings?.enabled) visitPrice*=1+Number(cfg.deep_cleaning_settings.surcharge_pct||0)/100;
  if(input.equipment&&cfg.equipment_settings?.enabled) visitPrice+=Number(cfg.equipment_settings.base||0)+sqm*Number(cfg.equipment_settings.gradient_per_sqm||0);
  let monthly=visitPrice*visits;
  if((Number(input.windowSqm)||0)>0&&cfg.window_settings?.enabled){
    const windowCharge=Math.max(Number(cfg.window_settings.minimum||0),Number(cfg.window_settings.base||0)+Number(input.windowSqm)*Number(cfg.window_settings.gradient_per_sqm||0));
    monthly+=windowCharge;
  }
  const vatRate=(cfg.vat_settings?.enabled&&cfg.vat_settings?.customer_pays_default)?Number(cfg.vat_settings.rate_pct||0)/100:0;
  if(vatRate>0) monthly*=1+vatRate;
  const firstMonthDiscount=cfg.promotion_settings?.enabled?Number(cfg.promotion_settings.first_month_discount_pct||0)/100:0;
  const firstMonth=monthly*(1-firstMonthDiscount);
  return {visitPrice,monthly,firstMonth,reductionPct:reduction*100,firstMonthDiscountPct:firstMonthDiscount*100,vatRatePct:vatRate*100};
}

export {supabase};
