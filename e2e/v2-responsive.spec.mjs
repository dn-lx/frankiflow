import { test, expect } from '@playwright/test';
import { blockExternalNetwork } from './helpers.mjs';

const widths=[375,390,430,768,1024,1440];

async function pageGeometry(page){
  return page.evaluate(()=>{
    const root=document.documentElement;
    const viewportWidth=root.clientWidth;
    const visible=[...document.querySelectorAll('body *')].filter(el=>{
      const s=getComputedStyle(el);
      const r=el.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
    });
    const offenders=visible.map(el=>{
      const r=el.getBoundingClientRect();
      return {tag:el.tagName,id:el.id,cls:typeof el.className==='string'?el.className:'',left:r.left,right:r.right,width:r.width};
    }).filter(x=>x.left < -2 || x.right > viewportWidth + 2);
    return {clientWidth:viewportWidth,scrollWidth:root.scrollWidth,offenders:offenders.slice(0,25)};
  });
}

for(const width of widths){
  test(`homepage V2 has no responsive overflow/collision at ${width}px`,async({page})=>{
    await blockExternalNetwork(page);
    await page.setViewportSize({width,height:width<=430?844:900});
    await page.goto('/',{waitUntil:'domcontentloaded'});

    const geometry=await pageGeometry(page);
    expect(geometry.scrollWidth,JSON.stringify(geometry.offenders,null,2)).toBeLessThanOrEqual(geometry.clientWidth+1);

    const signalBox=await page.locator('.signal-grid').boundingBox();
    const signalCells=await page.locator('.signal-grid > div').evaluateAll(nodes=>nodes.map(el=>{
      const r=el.getBoundingClientRect();return {left:r.left,right:r.right};
    }));
    for(const cell of signalCells){
      expect(cell.left).toBeGreaterThanOrEqual(signalBox.x-1);
      expect(cell.right).toBeLessThanOrEqual(signalBox.x+signalBox.width+1);
    }

    if(width<=900){
      const menu=page.locator('.menu-btn');
      const menuBox=await menu.boundingBox();
      expect(menuBox.width).toBeGreaterThanOrEqual(44);
      expect(menuBox.height).toBeGreaterThanOrEqual(44);
    }

    if(width<=680){
      const heroVisual=await page.locator('.hero-visual').boundingBox();
      const dashboard=await page.locator('.hero-dashboard').boundingBox();
      const signal=await page.locator('.signal-strip').boundingBox();
      expect(heroVisual).not.toBeNull();
      expect(dashboard).not.toBeNull();
      expect(signal).not.toBeNull();
      expect(dashboard.y+dashboard.height).toBeLessThanOrEqual(signal.y+1);

      await expect(page.locator('.ff-language-switch')).toBeVisible();
    }
  });

  test(`calculator V2 has no responsive overflow at ${width}px`,async({page})=>{
    await blockExternalNetwork(page);
    await page.setViewportSize({width,height:width<=430?844:900});
    await page.goto('/calculator/',{waitUntil:'domcontentloaded'});

    const geometry=await pageGeometry(page);
    expect(geometry.scrollWidth,JSON.stringify(geometry.offenders,null,2)).toBeLessThanOrEqual(geometry.clientWidth+1);

    const bar=page.locator('#mobilePriceBar');
    if(width<=900){
      await expect(bar).toBeVisible();
      const barBox=await bar.boundingBox();
      expect(barBox.x).toBeGreaterThanOrEqual(0);
      expect(barBox.x+barBox.width).toBeLessThanOrEqual(width+1);
    }else{
      await expect(bar).toBeHidden();
    }
  });
}
