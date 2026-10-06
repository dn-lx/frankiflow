import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePricing } from '../public/assets/calculator-engine.js';

const cfg={
  contract_settings:{months:[1],base_reduction_pct:{1:0}},
  deep_cleaning_settings:{enabled:true,surcharge_pct:34},
  equipment_settings:{enabled:true,base:5,gradient_per_sqm:.01},
  promotion_settings:{enabled:true,first_month_discount_pct:25},
  service_settings:{
    services:{
      buero:{label:'Büroreinigung',base_1m:24,gradient_per_sqm:.17,enabled:true},
      wohnung:{label:'Wohnungsreinigung',base_1m:30,gradient_per_sqm:.82,enabled:true},
      airbnb:{label:'Airbnb',base_1m:35,gradient_per_sqm:.88,enabled:true},
      treppenhaus:{label:'Treppenhaus',base_1m:24,gradient_per_sqm:.25,enabled:true}
    },
    gradient_per_sqm:.2304,
    minimum_cleaning_charge:30
  },
  vat_settings:{enabled:true,rate_pct:19,customer_pays_default:false},
  window_settings:{base:5,enabled:true,minimum:35,gradient_per_sqm:3}
};

const state=serviceKey=>({
  serviceKey,windowOnly:false,area:80,freq:{key:'once',label:'Einmalig',visits_per_month:1},months:1,
  newCustomer:false,deep:false,equipment:false,vat:false,windows:false,windowArea:0
});

test('live production pricing ignores service-specific gradients and uses the shared gradient',()=>{
  assert.equal(calculatePricing(cfg,state('buero')).visitTotal,42.43);
  assert.equal(calculatePricing(cfg,state('wohnung')).visitTotal,48.43);
  assert.equal(calculatePricing(cfg,state('airbnb')).visitTotal,53.43);
  assert.equal(calculatePricing(cfg,state('treppenhaus')).visitTotal,42.43);
});

test('live production pricing uses base_1m rather than calibrated service bases',()=>{
  const withCalibration=structuredClone(cfg);
  withCalibration.service_settings.services.buero.calibrated_base_1m=999;
  assert.equal(calculatePricing(withCalibration,state('buero')).visitTotal,42.43);
});
