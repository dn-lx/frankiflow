import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const read=p=>readFileSync(p,'utf8');

test('About Us is a homepage accordion only',()=>{assert.equal(existsSync('public/about/index.html'),false);const home=read('public/index.html');const js=read('public/assets/homepage-about-nav.js');assert.match(home,/id="about"/);assert.match(home,/id="aboutAccordion"/);assert.match(home,/href="#about"/);assert.doesNotMatch(home,/href="\/about\/"/);assert.match(js,/slice\(0,3\)/);assert.match(js,/<details class=/);assert.doesNotMatch(js,/padStart|about-page-story-head/)});
test('Accommodation remains the final navigation link after FAQ',()=>{for(const [p,label] of [['public/index.html','Unterkunft'],['public/en/index.html','Accommodations']]){const s=read(p);const nav=s.match(/<nav[^>]*class="nav-links"[^>]*>([\s\S]*?)<\/nav>/)?.[1]||'';assert.ok(nav.lastIndexOf(label)>nav.lastIndexOf('FAQ'))}});

test('calculator page loads exactly one primary controller',()=>{const html=read('public/preisrechner/index.html');assert.match(html,/calculator-app-v3\.js\?v=/);assert.doesNotMatch(html,/calculator\.js\?v=/);assert.doesNotMatch(html,/calculator-runtime-fix\.js\?v=/);assert.equal((html.match(/createClient/g)||[]).length,0)});
test('calculator controller wires print, contact and checklist buttons',()=>{const js=read('public/assets/calculator-app-v3.js'),html=read('public/preisrechner/index.html');for(const id of ['printQuote','requestService','viewChecklist','quoteRequestModal','checklistPreview'])assert.match(html,new RegExp(`id="${id}"`));assert.match(js,/addEventListener\('click',\(\)=>printDoc\('quote'\)\)/);assert.match(js,/addEventListener\('click',openServiceRequest\)/);assert.match(js,/addEventListener\('click',toggleChecklist\)/)});
test('contact with quotation sends admin and customer email events',()=>{const js=read('public/assets/calculator-app-v3.js');assert.match(js,/event_type:'admin_enquiry'/);assert.match(js,/attach_quote:true/);assert.match(js,/event_type:'enquiry_received'/);assert.match(js,/frankiflow_quote_requests/)});
test('print includes logo, organisation and founder',()=>{const js=read('public/assets/calculator-app-v3.js');assert.match(js,/frankiflow-full-transparent-1024\.png/);assert.match(js,/FrankiFlow Gebäudereinigung &amp; Objektbetreuung/);assert.match(js,/Inura Devasurendra/);assert.doesNotMatch(js,/FrankiFlow Unternehmensdaten/);assert.match(js,/await waitForImages\(sheet\)/)});
test('admin exposes editable window contract reductions',()=>{assert.match(read('public/admin/index.html'),/id="windowContractGrid"/);const js=read('public/assets/admin-base.js');assert.match(js,/data-window-contract/);assert.match(js,/contract_reduction_pct:windowReductions/)});
test('language switch is handled by the single controller and persists selection',()=>{const js=read('public/assets/calculator-app-v3.js');assert.match(js,/localStorage\.setItem\('frankiflow-lang',lang\)/);assert.match(js,/\.language-switch \[data-lang\]/);assert.match(js,/const prev=n\.value\|\|'yes'/)});
test('calculator has immediate static defaults before remote pricing loads',()=>{const html=read('public/preisrechner/index.html');assert.match(html,/id="frequency"><option value="weekly1">1× pro Woche<\/option>/);assert.match(html,/id="contractMonths"><option value="1">1 Monat<\/option>/)});
test('single controller renders styled summary rows and total per visit',()=>{const js=read('public/assets/calculator-app-v3.js');assert.match(js,/class="breakdown-row"/);assert.match(js,/Gesamt \/ Termin/);assert.match(js,/Total \/ visit/);assert.match(js,/result\.visitTotal/)});
test('window cleaning is a per-visit add-on in engine and UI',()=>{const app=read('public/assets/calculator-app-v3.js'),engine=read('public/assets/calculator-engine.js');assert.match(app,/t\('windowCleaning'\).*visitWord/);assert.match(app,/result\.windowCharge/);assert.match(engine,/floorVisit\+equipmentVisit\+\(s\.windows\?windowCharge:0\)/);assert.match(engine,/monthly=round2\(visitTotal\*visits\)/)});
test('checklist uses database data with built-in fallback and responsive CSS',()=>{const app=read('public/assets/calculator-app-v3.js'),checklists=read('public/assets/checklists.js'),css=read('public/assets/calculator.css');assert.match(app,/frankiflow_checklists/);assert.match(app,/applyChecklistRows/);assert.match(app,/localizeChecklistSections/);assert.match(app,/renderChecklistPreview/);for(const key of ['buero','wohnung','airbnb','treppenhaus','deep','windows'])assert.match(checklists,new RegExp(`\\b${key}:`));assert.match(css,/\.checklist-screen-items/);assert.match(css,/grid-template-columns:repeat\(2/);assert.match(css,/@media\(max-width:700px\)/)});
test('calculator page retains mobile live-price island',()=>{const html=read('public/preisrechner/index.html'),island=read('public/assets/calculator-mobile-island.js');assert.match(html,/calculator-mobile-island\.js\?v=/);assert.match(island,/mobile-price-island/);assert.match(island,/MutationObserver/)});
test('config does not auto-start stale calculator side-effect modules',()=>{const cfg=read('public/assets/config.js');assert.doesNotMatch(cfg,/calculator-overrides|calculator-mobile-island|calculator-header-revert/)});

test('top navigation CTAs have no diagonal arrow and calculator sells the business product',()=>{
  const home=read('public/index.html'),homeEn=read('public/en/index.html'),calc=read('public/preisrechner/index.html'),header=read('public/assets/calculator-site-header.js');
  const deNav=home.match(/<div class="nav-actions">([\s\S]*?)<\/div>/)?.[1]||'';
  const enNav=homeEn.match(/<div class="nav-actions">([\s\S]*?)<\/div>/)?.[1]||'';
  assert.doesNotMatch(deNav,/↗/);assert.doesNotMatch(enNav,/↗/);
  assert.match(calc,/Preisrechner für Ihr Unternehmen kaufen/);
  assert.doesNotMatch(calc.match(/<a class="btn btn-primary calc-nav-price"[\s\S]*?<\/a>/)?.[0]||'',/↗/);
  assert.match(header,/Buy calculator for your business/);
  assert.match(header,/Preisrechner für Ihr Unternehmen kaufen/);
});

test('quotation includes property area and supports direct PDF download',()=>{
  const js=read('public/assets/calculator-app-v3.js'),html=read('public/preisrechner/index.html');
  assert.match(html,/id="downloadQuote"/);
  assert.match(js,/downloadQuote:'Angebot direkt herunterladen'/);
  assert.match(js,/downloadQuote:'Download quotation PDF'/);
  assert.match(js,/Reinigungsfläche':'Floor area'/);
  assert.match(js,/Glasfläche':'Glass area'/);
  assert.match(js,/jspdf@4\.2\.1/);
  assert.match(js,/doc\.save\(/);
  assert.match(js,/addEventListener\('click',downloadQuotePdf\)/);
});

test('print CSS avoids fixed A4-height boxes that create Safari blank pages',()=>{
  const css=read('public/assets/calculator.css');
  assert.doesNotMatch(css,/\.print-document\{[^}]*height:297mm/);
  assert.doesNotMatch(css,/\.print-checklist-document\{[^}]*height:297mm/);
  assert.match(css,/\.print-sheet>\*:last-child\{break-after:auto!important;page-break-after:auto!important\}/);
  assert.match(css,/\.print-company-footer\{position:static/);
});

test('both quotation paths show area prominently and use canonical FrankiFlow logo',()=>{
  const js=read('public/assets/calculator-app-v3.js');
  assert.match(js,/frankiflow-full-transparent-1024\.png/);
  assert.match(js,/Reinigungsfläche':'Floor area'/);
  assert.match(js,/Glasfläche':'Glass area'/);
  assert.match(js,/areaValue=Number\(calc\.windowOnly\?calc\.windowArea:calc\.area\)/);
  assert.match(js,/print-service-intro[\s\S]*m²/);
});

test('direct PDF checklist uses branded two-column card layout',()=>{
  const js=read('public/assets/calculator-app-v3.js');
  assert.match(js,/function pdfChecklistCardHeight/);
  assert.match(js,/function pdfDrawChecklistCard/);
  assert.match(js,/const cardW=86,gap=6/);
  assert.match(js,/pdfChecklistHeader/);
  assert.match(js,/pdfAddLogo\(doc,logo/);
  assert.match(js,/roundedRect\(x,y,width,height/);
});

test('direct quotation PDF has structured client and price cards',()=>{
  const js=read('public/assets/calculator-app-v3.js');
  assert.match(js,/roundedRect\(143,8,51,22/);
  assert.match(js,/roundedRect\(16,37,178,20/);
  assert.match(js,/frankiflow-full-transparent-1024\.png/);
});
