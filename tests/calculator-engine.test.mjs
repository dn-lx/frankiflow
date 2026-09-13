import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePricing } from '../public/assets/calculator-engine.js';

const cfg={
  contract_settings:{months:[1,3,6,9,12,24],base_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}},
  deep_cleaning_settings:{enabled:true,surcharge_pct:34},equipment_settings:{enabled:true,base:5,gradient_per_sqm:.01},
  promotion_settings:{enabled:true,first_month_discount_pct:25},
  service_settings:{services:{buero:{label:'Büroreinigung',base_1m:24,enabled:true},airbnb:{label:'Airbnb',base_1m:26,enabled:true},wohnung:{label:'Wohnung',base_1m:30,enabled:true},treppenhaus:{label:'Treppenhaus',base_1m:24,enabled:true}},gradient_per_sqm:.2304,minimum_cleaning_charge:30},
  vat_settings:{enabled:true,rate_pct:19,customer_pays_default:false},
  window_settings:{base:5,enabled:true,minimum:35,gradient_per_sqm:3,contract_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}}
};
const freq=n=>({key:`x${n}`,label:`${n}`,visits_per_month:n});
const state=(o={})=>({serviceKey:'buero',windowOnly:false,area:80,freq:freq(4),months:1,newCustomer:false,deep:false,equipment:false,vat:false,windows:false,windowArea:0,...o});

test('base office price is stable and cent-reconciled',()=>{const r=calculatePricing(cfg,state());assert.equal(r.visitTotal,42.43);assert.equal(r.monthly,169.72);assert.equal(r.monthly,r.visitTotal*4)});
test('general contract reduction applies to the service base',()=>{const r=calculatePricing(cfg,state({months:12}));assert.equal(r.reductionPct,8);assert.equal(r.visitTotal,40.51);assert.equal(r.monthly,162.04)});
test('window-only cleaning receives contract-duration reduction',()=>{const r=calculatePricing(cfg,state({serviceKey:'fenster',windowOnly:true,area:0,freq:freq(1),months:12,windows:true,windowArea:20}));assert.equal(r.windowReductionPct,8);assert.equal(r.visitTotal,59.8);assert.equal(r.monthly,59.8)});
test('window contract reductions decrease monotonically by duration',()=>{const months=[1,3,6,9,12,24],expected=[65,63.7,62.4,61.1,59.8,58.5];const values=months.map(m=>calculatePricing(cfg,state({serviceKey:'fenster',windowOnly:true,area:0,freq:freq(1),months:m,windows:true,windowArea:20})).visitTotal);assert.deepEqual(values,expected);for(let i=1;i<values.length;i++)assert.ok(values[i]<=values[i-1])});
test('mixed cleaning uses one discounted window add-on per month',()=>{const r=calculatePricing(cfg,state({months:12,windows:true,windowArea:20}));assert.equal(r.visitTotal,40.51);assert.equal(r.windowCharge,59.8);assert.equal(r.monthly,221.84)});
test('VAT arithmetic reconciles exactly to visible line items',()=>{const r=calculatePricing(cfg,state({months:12,windows:true,windowArea:20,vat:true}));assert.equal(r.visitTotal,48.21);assert.equal(r.windowCharge,71.16);assert.equal(r.monthly,264);assert.equal(r.monthly,Number((r.visitTotal*4+r.windowCharge).toFixed(2)))});
test('new-customer month remains lower than regular month',()=>{const r=calculatePricing(cfg,state({months:12,windows:true,windowArea:20,vat:true,newCustomer:true}));assert.equal(r.promoPct,25);assert.ok(r.firstMonth<r.monthly);assert.equal(r.firstMonth,198.01)});
test('equipment and deep cleaning both affect the expected line items',()=>{const plain=calculatePricing(cfg,state());const equipment=calculatePricing(cfg,state({equipment:true}));const deep=calculatePricing(cfg,state({deep:true}));assert.ok(equipment.visitTotal>plain.visitTotal);assert.ok(deep.visitTotal>plain.visitTotal)});
test('window reductions fall back to contract reductions when legacy config lacks window map',()=>{const legacy=structuredClone(cfg);delete legacy.window_settings.contract_reduction_pct;const r=calculatePricing(legacy,state({serviceKey:'fenster',windowOnly:true,area:0,freq:freq(1),months:24,windows:true,windowArea:20}));assert.equal(r.windowReductionPct,10);assert.equal(r.visitTotal,58.5)});

test('broad pricing matrix is finite, non-negative and reconciles to visible totals',()=>{
  const services=['buero','wohnung','airbnb','treppenhaus'];const areas=[20,80,200];const visits=[1,2,4,8];const months=[1,3,6,9,12,24];let checked=0;
  for(const serviceKey of services)for(const area of areas)for(const n of visits)for(const m of months)for(const vat of [false,true])for(const equipment of [false,true]){
    const windows=(area+n+m)%2===0;const r=calculatePricing(cfg,state({serviceKey,area,freq:freq(n),months:m,vat,equipment,windows,windowArea:windows?20:0,newCustomer:true,deep:area===200}));
    for(const key of ['visitTotal','monthly','firstMonth','floorVisit','equipmentVisit','windowCharge']){assert.ok(Number.isFinite(r[key]),`${key} finite`);assert.ok(r[key]>=0,`${key} non-negative`)}
    const expected=Number((r.visitTotal*n+(windows?r.windowCharge:0)).toFixed(2));assert.equal(r.monthly,expected);assert.ok(r.firstMonth<=r.monthly+0.01);checked++;
  }
  assert.ok(checked>=1000);
});
