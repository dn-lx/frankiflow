import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePricing } from '../public/assets/calculator-engine.js';

const cfg={
  contract_settings:{months:[1,3,6,9,12,24],base_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}},
  deep_cleaning_settings:{enabled:true,surcharge_pct:34},
  equipment_settings:{enabled:true,base:5,gradient_per_sqm:.01},
  promotion_settings:{enabled:true,first_month_discount_pct:25},
  service_settings:{services:{buero:{label:'Büroreinigung',base_1m:24,enabled:true},airbnb:{label:'Airbnb',base_1m:26,enabled:true},wohnung:{label:'Wohnung',base_1m:30,enabled:true},treppenhaus:{label:'Treppenhaus',base_1m:24,enabled:true}},gradient_per_sqm:.2304,minimum_cleaning_charge:30},
  vat_settings:{enabled:true,rate_pct:19,customer_pays_default:false},
  window_settings:{base:5,enabled:true,minimum:35,gradient_per_sqm:3,contract_reduction_pct:{1:0,3:2,6:4,9:6,12:8,24:10}}
};
const freq=n=>({key:`x${n}`,label:`${n}`,visits_per_month:n});
const state=(o={})=>({serviceKey:'buero',windowOnly:false,area:80,freq:freq(4),months:1,newCustomer:false,deep:false,equipment:false,vat:false,windows:false,windowArea:0,...o});
const cents=v=>Math.round(Number(v)*100);

test('base office price is stable and cent-reconciled',()=>{
  const r=calculatePricing(cfg,state());
  assert.equal(r.visitTotal,42.43);assert.equal(r.monthly,169.72);assert.equal(cents(r.monthly),cents(r.visitTotal*4));
});

test('general contract reduction applies to service base',()=>{
  const r=calculatePricing(cfg,state({months:12}));
  assert.equal(r.reductionPct,8);assert.equal(r.visitTotal,40.51);assert.equal(r.monthly,162.04);
});

test('window-only cleaning receives contract-duration reduction',()=>{
  const r=calculatePricing(cfg,state({serviceKey:'fenster',windowOnly:true,area:0,freq:freq(1),months:12,windows:true,windowArea:20}));
  assert.equal(r.windowReductionPct,8);assert.equal(r.visitTotal,59.8);assert.equal(r.monthly,59.8);
});

test('window contract reductions decrease monotonically by duration',()=>{
  const months=[1,3,6,9,12,24],expected=[65,63.7,62.4,61.1,59.8,58.5];
  const values=months.map(m=>calculatePricing(cfg,state({serviceKey:'fenster',windowOnly:true,area:0,freq:freq(1),months:m,windows:true,windowArea:20})).visitTotal);
  assert.deepEqual(values,expected);for(let i=1;i<values.length;i++)assert.ok(values[i]<=values[i-1]);
});

test('selecting window cleaning increases price per visit',()=>{
  const plain=calculatePricing(cfg,state({months:12}));
  const withWindows=calculatePricing(cfg,state({months:12,windows:true,windowArea:20}));
  assert.equal(withWindows.windowCharge,59.8);
  assert.equal(withWindows.visitTotal,100.31);
  assert.equal(cents(withWindows.visitTotal-plain.visitTotal),cents(withWindows.windowCharge));
});

test('window cleaning selected with recurring cleaning is charged on every visit',()=>{
  const r=calculatePricing(cfg,state({months:12,windows:true,windowArea:20,freq:freq(4)}));
  assert.equal(r.visitTotal,100.31);assert.equal(r.monthly,401.24);assert.equal(cents(r.monthly),cents(r.visitTotal*4));
});

test('changing frequency scales the whole selected per-visit service package',()=>{
  const one=calculatePricing(cfg,state({months:12,windows:true,windowArea:20,freq:freq(1)}));
  const eight=calculatePricing(cfg,state({months:12,windows:true,windowArea:20,freq:freq(8)}));
  assert.equal(one.visitTotal,eight.visitTotal);assert.equal(cents(eight.monthly),cents(one.visitTotal*8));
});

test('VAT arithmetic reconciles exactly to the displayed per-visit total',()=>{
  const r=calculatePricing(cfg,state({months:12,windows:true,windowArea:20,vat:true}));
  assert.equal(r.floorVisit,48.21);assert.equal(r.windowCharge,71.16);assert.equal(r.visitTotal,119.37);assert.equal(r.monthly,477.48);
  assert.equal(cents(r.visitTotal),cents(r.floorVisit+r.equipmentVisit+r.windowCharge));
  assert.equal(cents(r.monthly),cents(r.visitTotal*4));
});

test('new-customer discount lowers each selected first-month visit',()=>{
  const r=calculatePricing(cfg,state({months:12,windows:true,windowArea:20,vat:true,newCustomer:true}));
  assert.equal(r.promoPct,25);assert.equal(r.firstMonth,358.12);assert.ok(r.firstVisit<r.visitTotal);assert.ok(r.firstMonth<r.monthly);
  assert.equal(cents(r.firstMonth),cents(r.firstVisit*r.visits));
});

test('equipment increases visit and monthly totals',()=>{
  const plain=calculatePricing(cfg,state());const equipment=calculatePricing(cfg,state({equipment:true}));
  assert.ok(equipment.equipmentVisit>0);assert.ok(equipment.visitTotal>plain.visitTotal);assert.ok(equipment.monthly>plain.monthly);
});

test('deep cleaning increases visit and monthly totals',()=>{
  const plain=calculatePricing(cfg,state());const deep=calculatePricing(cfg,state({deep:true}));
  assert.ok(deep.floorVisit>plain.floorVisit);assert.ok(deep.visitTotal>plain.visitTotal);assert.ok(deep.monthly>plain.monthly);
});

test('zero glass area does not add a phantom window charge',()=>{
  const plain=calculatePricing(cfg,state({months:6}));const windows=calculatePricing(cfg,state({months:6,windows:true,windowArea:0}));
  assert.equal(windows.windowCharge,0);assert.equal(windows.visitTotal,plain.visitTotal);assert.equal(windows.monthly,plain.monthly);
});

test('window minimum is respected before contract reduction',()=>{
  const r=calculatePricing(cfg,state({months:12,windows:true,windowArea:1,freq:freq(1)}));
  assert.equal(r.windowCharge,32.2); // €35 minimum less 8% contract reduction
});

test('window reductions fall back to general contract reductions for legacy config',()=>{
  const legacy=structuredClone(cfg);delete legacy.window_settings.contract_reduction_pct;
  const r=calculatePricing(legacy,state({serviceKey:'fenster',windowOnly:true,area:0,freq:freq(1),months:24,windows:true,windowArea:20}));
  assert.equal(r.windowReductionPct,10);assert.equal(r.visitTotal,58.5);
});

test('disabled VAT or window settings are respected',()=>{
  const noVat=structuredClone(cfg);noVat.vat_settings.enabled=false;
  const r1=calculatePricing(noVat,state({vat:true}));assert.equal(r1.vatRate,0);
  const noWindows=structuredClone(cfg);noWindows.window_settings.enabled=false;
  const r2=calculatePricing(noWindows,state({windows:true,windowArea:20}));assert.equal(r2.windowCharge,0);assert.equal(r2.visitTotal,42.43);
});

test('all supported contract durations preserve non-negative finite prices',()=>{
  for(const months of cfg.contract_settings.months){
    const r=calculatePricing(cfg,state({months,windows:true,windowArea:35,newCustomer:true,vat:true,equipment:true,deep:true}));
    for(const key of ['visitTotal','monthly','firstVisit','firstMonth','floorVisit','equipmentVisit','windowCharge']){
      assert.ok(Number.isFinite(r[key]),`${key} finite for ${months} months`);assert.ok(r[key]>=0,`${key} non-negative for ${months} months`);
    }
  }
});

test('broad pricing matrix reconciles all visible totals to the cent',()=>{
  const services=['buero','wohnung','airbnb','treppenhaus'];
  const areas=[0,20,40,80,120,200,500];const visits=[1,2,4,8,12,20];const months=[1,3,6,9,12,24];const windowAreas=[0,5,10,20,50];
  let checked=0;
  for(const serviceKey of services)for(const area of areas)for(const n of visits)for(const m of months)for(const vat of [false,true])for(const equipment of [false,true])for(const windows of [false,true]){
    const windowArea=windows?windowAreas[(area+n+m)%windowAreas.length]:0;
    for(const newCustomer of [false,true]){
      const r=calculatePricing(cfg,state({serviceKey,area,freq:freq(n),months:m,vat,equipment,windows,windowArea,newCustomer,deep:area>=200}));
      for(const key of ['visitTotal','monthly','firstVisit','firstMonth','floorVisit','equipmentVisit','windowCharge']){
        assert.ok(Number.isFinite(r[key]),`${key} finite`);assert.ok(r[key]>=0,`${key} non-negative`);
      }
      const expectedVisit=Number((r.floorVisit+r.equipmentVisit+(windows?r.windowCharge:0)).toFixed(2));
      assert.equal(cents(r.visitTotal),cents(expectedVisit));
      assert.equal(cents(r.monthly),cents(r.visitTotal*n));
      assert.equal(cents(r.firstMonth),cents(r.firstVisit*n));
      assert.ok(r.firstMonth<=r.monthly+0.01);
      checked++;
    }
  }
  assert.ok(checked>=10000,`checked ${checked} combinations`);
});
