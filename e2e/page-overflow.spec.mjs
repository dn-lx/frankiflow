import { test, expect } from '@playwright/test';
import { blockExternalNetwork } from './helpers.mjs';

const pages=[
  '/impressum/',
  '/datenschutz/',
  '/company-policy/',
  '/bueroreinigung-frankfurt/',
  '/wohnungsreinigung-frankfurt/',
  '/airbnb-reinigung-frankfurt/',
  '/treppenhausreinigung-frankfurt/',
  '/grundreinigung-frankfurt/',
  '/objektbetreuung-frankfurt/',
  '/en/office-cleaning-frankfurt/',
  '/en/home-cleaning-frankfurt/',
  '/en/airbnb-cleaning-frankfurt/',
  '/en/stairwell-cleaning-frankfurt/',
  '/en/deep-cleaning-frankfurt/',
  '/en/property-care-frankfurt/'
];
const widths=[375,390,430];

async function overflowReport(page){
  return page.evaluate(()=>{
    const root=document.documentElement;
    const clientWidth=root.clientWidth;
    const scrollWidth=root.scrollWidth;
    const offenders=[...document.querySelectorAll('body *')].filter(el=>{
      const r=el.getBoundingClientRect();
      return r.left+el.scrollWidth>clientWidth+1;
    }).map(el=>({
      tag:el.tagName.toLowerCase(),
      cls:typeof el.className==='string'?el.className:'',
      text:(el.textContent||'').trim().slice(0,40),
      left:Math.round(el.getBoundingClientRect().left),
      scrollWidth:el.scrollWidth
    }));
    return {clientWidth,scrollWidth,offenders:offenders.slice(0,50)};
  });
}

for(const path of pages){
  for(const width of widths){
    test(`${path} has no horizontal overflow at ${width}px`,async({page})=>{
      await blockExternalNetwork(page);
      await page.setViewportSize({width,height:844});
      await page.goto(path,{waitUntil:'load'});

      const report=await overflowReport(page);
      const lines=report.offenders.map(o=>`  <${o.tag} class="${o.cls}"> left=${o.left} scrollWidth=${o.scrollWidth} text="${o.text}"`);
      const message=`scrollWidth ${report.scrollWidth} > clientWidth ${report.clientWidth}+1 on ${path} at ${width}px. Elements extending past viewport:\n${lines.join('\n')}`;
      expect(report.scrollWidth,message).toBeLessThanOrEqual(report.clientWidth+1);
    });
  }
}
