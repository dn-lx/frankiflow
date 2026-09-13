const round2=v=>Math.round((Number(v||0)+Number.EPSILON)*100)/100;
const pct=v=>Math.max(0,Math.min(100,Number(v)||0));

export function calculatePricing(cfg,s){
  const service=s.windowOnly?{label:'Fensterreinigung',base_1m:0,enabled:true}:cfg.service_settings?.services?.[s.serviceKey];
  if(!service)throw new Error(`Unknown service: ${s.serviceKey}`);
  const months=String(Number(s.months)||1);
  const reductionPct=s.windowOnly?0:pct(cfg.contract_settings?.base_reduction_pct?.[months]);
  const reduction=reductionPct/100;
  const min=Number(cfg.service_settings?.minimum_cleaning_charge||0);
  const gradient=Number(cfg.service_settings?.gradient_per_sqm||0);
  const base=Number(service.base_1m||0);
  const adjustedBase=base*(1-reduction);

  let floorVisitNet=s.windowOnly?0:(s.area>0?Math.max(min,adjustedBase+s.area*gradient):0);
  if(!s.windowOnly&&s.area===0&&!s.windows)floorVisitNet=min;
  if(s.deep&&cfg.deep_cleaning_settings?.enabled)floorVisitNet*=1+pct(cfg.deep_cleaning_settings.surcharge_pct)/100;

  let equipmentVisitNet=0;
  if(!s.windowOnly&&s.equipment&&cfg.equipment_settings?.enabled){equipmentVisitNet=Number(cfg.equipment_settings.base||0)+s.area*Number(cfg.equipment_settings.gradient_per_sqm||0)}

  const windowMap=cfg.window_settings?.contract_reduction_pct||cfg.contract_settings?.base_reduction_pct||{};
  const windowReductionPct=(s.windows&&cfg.window_settings?.enabled)?pct(windowMap[months]):0;
  let windowChargeNet=0;
  if(s.windows&&cfg.window_settings?.enabled&&s.windowArea>0){
    const beforeDiscount=Math.max(Number(cfg.window_settings.minimum||0),Number(cfg.window_settings.base||0)+s.windowArea*Number(cfg.window_settings.gradient_per_sqm||0));
    windowChargeNet=beforeDiscount*(1-windowReductionPct/100);
  }

  const visits=Math.max(1,Number(s.freq?.visits_per_month||1));
  const vatRate=(s.vat&&cfg.vat_settings?.enabled)?pct(cfg.vat_settings.rate_pct)/100:0;
  const gross=v=>round2(Number(v||0)*(1+vatRate));

  // Round customer-visible line items first so displayed arithmetic reconciles to the cent.
  const floorVisit=gross(floorVisitNet);
  const equipmentVisit=gross(equipmentVisitNet);
  const windowCharge=gross(windowChargeNet);
  const visitTotal=s.windowOnly?windowCharge:round2(floorVisit+equipmentVisit);
  const monthly=s.windowOnly?round2(visitTotal*visits):round2(visitTotal*visits+(s.windows?windowCharge:0));

  const promoPct=(s.newCustomer&&cfg.promotion_settings?.enabled)?pct(cfg.promotion_settings.first_month_discount_pct):0;
  const promo=promoPct/100;
  let discountedFloorNet=floorVisitNet,discountedEquipmentNet=equipmentVisitNet,discountedWindowNet=windowChargeNet;
  if(promo>0){
    discountedFloorNet=floorVisitNet>0?Math.max(min,floorVisitNet*(1-promo)):0;
    discountedEquipmentNet=equipmentVisitNet*(1-promo);
    discountedWindowNet=windowChargeNet*(1-promo);
  }
  const firstVisit=s.windowOnly?gross(discountedWindowNet):round2(gross(discountedFloorNet)+gross(discountedEquipmentNet));
  const firstWindow=s.windowOnly?0:gross(discountedWindowNet);
  const firstMonth=s.windowOnly?round2(firstVisit*visits):round2(firstVisit*visits+(s.windows?firstWindow:0));

  return {...s,service,reductionPct,windowReductionPct,visits,vatRate,promoPct,
    floorVisitNet:round2(floorVisitNet),equipmentVisitNet:round2(equipmentVisitNet),windowChargeNet:round2(windowChargeNet),
    floorVisit,equipmentVisit,windowCharge,visitTotal,subtotal:monthly,monthly,firstMonth};
}
