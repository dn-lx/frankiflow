from pathlib import Path
p=Path('public/assets/calculator.js')
s=p.read_text()
old="""  let firstSubtotalNet=subtotalNet;
  if(promo>0){
    const discountedFloorNet=floorVisitNet>0?Math.max(min,floorVisitNet*(1-promo)):0;
    const discountedEquipNet=equipmentVisitNet*(1-promo);
    const discountedWindowNet=windowChargeNet>0?Math.max(Number(cfg.window_settings?.minimum||0),windowChargeNet*(1-promo)):0;
    firstSubtotalNet=s.windowOnly?(discountedWindowNet*visits):((discountedFloorNet+discountedEquipNet)*visits+discountedWindowNet);
  }

  const visitTotal=gross(regularVisitNet);
  const monthly=gross(subtotalNet);
  const firstMonth=gross(firstSubtotalNet);
  calc={...s,service,serviceLabel:currentLang==='en'?(serviceEnglish[s.serviceKey]||service.label):service.label,reductionPct,
    floorVisit:gross(floorVisitNet),equipmentVisit:gross(equipmentVisitNet),windowCharge:gross(windowChargeNet),
    floorVisitNet:roundMoney(floorVisitNet),equipmentVisitNet:roundMoney(equipmentVisitNet),windowChargeNet:roundMoney(windowChargeNet),
    visitTotal,subtotal:gross(subtotalNet),subtotalNet:roundMoney(subtotalNet),vatRate,monthly,promoPct,firstMonth};
"""
new="""  let firstFloorNet=floorVisitNet,firstEquipmentNet=equipmentVisitNet,firstWindowNet=windowChargeNet;
  if(promo>0){
    firstFloorNet=floorVisitNet>0?Math.max(min,floorVisitNet*(1-promo)):0;
    firstEquipmentNet=equipmentVisitNet*(1-promo);
    firstWindowNet=windowChargeNet>0?Math.max(Number(cfg.window_settings?.minimum||0),windowChargeNet*(1-promo)):0;
  }

  // Round customer-visible line items first so every displayed total adds up exactly to the cent.
  const floorVisitGross=gross(floorVisitNet);
  const equipmentVisitGross=gross(equipmentVisitNet);
  const windowChargeGross=gross(windowChargeNet);
  const visitTotal=s.windowOnly?windowChargeGross:roundMoney(floorVisitGross+equipmentVisitGross);
  const monthly=s.windowOnly?roundMoney(windowChargeGross*visits):roundMoney(visitTotal*visits+(s.windows?windowChargeGross:0));
  const firstFloorGross=gross(firstFloorNet);
  const firstEquipmentGross=gross(firstEquipmentNet);
  const firstWindowGross=gross(firstWindowNet);
  const firstVisitGross=s.windowOnly?firstWindowGross:roundMoney(firstFloorGross+firstEquipmentGross);
  const firstMonth=s.windowOnly?roundMoney(firstVisitGross*visits):roundMoney(firstVisitGross*visits+(s.windows?firstWindowGross:0));
  calc={...s,service,serviceLabel:currentLang==='en'?(serviceEnglish[s.serviceKey]||service.label):service.label,reductionPct,
    floorVisit:floorVisitGross,equipmentVisit:equipmentVisitGross,windowCharge:windowChargeGross,
    floorVisitNet:roundMoney(floorVisitNet),equipmentVisitNet:roundMoney(equipmentVisitNet),windowChargeNet:roundMoney(windowChargeNet),
    visitTotal,subtotal:monthly,subtotalNet:roundMoney(subtotalNet),vatRate,monthly,promoPct,firstMonth};
"""
if old not in s: raise SystemExit('pricing block marker not found')
s=s.replace(old,new,1)
p.write_text(s)
print('calculator visible totals now reconcile to the cent')
