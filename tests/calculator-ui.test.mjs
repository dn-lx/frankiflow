import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const read=p=>readFileSync(p,'utf8');

test('About Us is a homepage accordion only',()=>{assert.equal(existsSync('public/about/index.html'),false);const home=read('public/index.html');const js=read('public/assets/homepage-about-nav.js');assert.match(home,/id="about"/);assert.match(home,/id="aboutAccordion"/);assert.match(home,/href="#about"/);assert.doesNotMatch(home,/href="\/about\/"/);assert.match(js,/slice\(0,3\)/);assert.match(js,/<details class=/);assert.doesNotMatch(js,/padStart|about-page-story-head/)});
test('Homepage and Calculator mount one shared public navigation',()=>{
  const shared=read('public/assets/shared-site-header.js');
  const css=read('public/assets/shared-site-header.css');
  for(const p of ['public/index.html','public/en/index.html','public/calculator/index.html']){
    const html=read(p);
    assert.match(html,/data-shared-header/);
    assert.match(html,/shared-site-header\.js\?v=/);
    assert.match(html,/shared-site-header\.css\?v=/);
    assert.doesNotMatch(html,/calculator-site-header|header-nav\.js/);
  }
  assert.match(shared,/navOrder=\['home','calculator','services','about','contact','faq','calcpura','stay'\]/);
  assert.match(shared,/calculator:\['Calculator','\/calculator\/'/);
  assert.match(shared,/calcpura\.frankiflow\.de/);
  assert.match(shared,/stay\.frankiflow\.de/);
  assert.match(css,/grid-template-columns:minmax\(170px,1fr\) auto minmax\(170px,1fr\)/);
});

test('calculator page loads exactly one primary controller',()=>{const html=read('public/calculator/index.html');assert.match(html,/calculator-app-v3\.js\?v=/);assert.doesNotMatch(html,/calculator\.js\?v=/);assert.doesNotMatch(html,/calculator-runtime-fix\.js\?v=/);assert.equal((html.match(/createClient/g)||[]).length,0)});
test('calculator controller wires print, contact and checklist buttons',()=>{const js=read('public/assets/calculator-app-v3.js'),html=read('public/calculator/index.html');for(const id of ['printQuote','requestService','viewChecklist','quoteRequestModal','checklistPreview'])assert.match(html,new RegExp(`id="${id}"`));assert.match(js,/addEventListener\('click',\(\)=>printDoc\('quote'\)\)/);assert.match(js,/addEventListener\('click',openServiceRequest\)/);assert.match(js,/addEventListener\('click',toggleChecklist\)/)});
test('contact with quotation sends admin and customer email events',()=>{const js=read('public/assets/calculator-app-v3.js');assert.match(js,/event_type:'admin_enquiry'/);assert.match(js,/attach_quote:true/);assert.match(js,/event_type:'enquiry_received'/);assert.match(js,/frankiflow_quote_requests/)});
test('print includes logo, organisation and founder',()=>{const js=read('public/assets/calculator-app-v3.js');assert.match(js,/frankiflow-full-transparent-1024\.png/);assert.match(js,/FrankiFlow Gebäudereinigung &amp; Objektbetreuung/);assert.match(js,/Inura Devasurendra/);assert.doesNotMatch(js,/FrankiFlow Unternehmensdaten/);assert.match(js,/await waitForImages\(sheet\)/)});
test('admin exposes editable window contract reductions',()=>{assert.match(read('public/admin/index.html'),/id="windowContractGrid"/);const js=read('public/assets/admin-base.js');assert.match(js,/data-window-contract/);assert.match(js,/contract_reduction_pct:windowReductions/)});
test('language switch is handled by the single controller and persists selection',()=>{const js=read('public/assets/calculator-app-v3.js');assert.match(js,/localStorage\.setItem\('frankiflow-lang',lang\)/);assert.match(js,/\.language-switch \[data-lang\]/);assert.match(js,/const prev=n\.value\|\|'yes'/)});
test('calculator has immediate static defaults before remote pricing loads',()=>{const html=read('public/calculator/index.html');assert.match(html,/id="frequency"><option value="weekly1">1× pro Woche<\/option>/);assert.match(html,/id="contractMonths"><option value="1">1 Monat<\/option>/)});
test('single controller renders styled summary rows and total per visit',()=>{const js=read('public/assets/calculator-app-v3.js');assert.match(js,/class="breakdown-row"/);assert.match(js,/Gesamt \/ Termin/);assert.match(js,/Total \/ visit/);assert.match(js,/result\.visitTotal/)});
test('window cleaning is a per-visit add-on in engine and UI',()=>{const app=read('public/assets/calculator-app-v3.js'),engine=read('public/assets/calculator-engine.js');assert.match(app,/t\('windowCleaning'\).*visitWord/);assert.match(app,/result\.windowCharge/);assert.match(engine,/floorVisit\+equipmentVisit\+\(s\.windows\?windowCharge:0\)/);assert.match(engine,/monthly=round2\(visitTotal\*visits\)/)});
test('checklist uses database data with built-in fallback and responsive CSS',()=>{const app=read('public/assets/calculator-app-v3.js'),checklists=read('public/assets/checklists.js'),css=read('public/assets/calculator.css');assert.match(app,/frankiflow_checklists/);assert.match(app,/applyChecklistRows/);assert.match(app,/localizeChecklistSections/);assert.match(app,/renderChecklistPreview/);for(const key of ['buero','wohnung','airbnb','treppenhaus','deep','windows'])assert.match(checklists,new RegExp(`\\b${key}:`));assert.match(css,/\.checklist-screen-items/);assert.match(css,/grid-template-columns:repeat\(2/);assert.match(css,/@media\(max-width:700px\)/)});
test('calculator page retains mobile live-price island',()=>{const html=read('public/calculator/index.html'),island=read('public/assets/calculator-mobile-island.js');assert.match(html,/calculator-mobile-island\.js\?v=/);assert.match(island,/mobile-price-island/);assert.match(island,/MutationObserver/)});
test('calculator controller syncs the V2 mobile live-price rail',()=>{const app=read('public/assets/calculator-app-v3.js'),html=read('public/calculator/index.html');assert.match(html,/id="mobileVisitPrice"/);assert.match(html,/id="mobileMonthPrice"/);assert.match(app,/mobileVisitPrice/);assert.match(app,/mobileMonthPrice/);assert.match(app,/money\(result\.visitTotal\)/);assert.match(app,/money\(result\.monthly\)/)});
test('config does not auto-start stale calculator side-effect modules',()=>{const cfg=read('public/assets/config.js');assert.doesNotMatch(cfg,/calculator-overrides|calculator-mobile-island|calculator-header-revert/)});

test('shared header has route navigation while CalcPura sales CTA stays below the calculator',()=>{
  const calc=read('public/calculator/index.html');
  const shared=read('public/assets/shared-site-header.js');
  assert.doesNotMatch(shared,/calc-nav-price|Buy calculator for your business|Preisrechner für Ihr Unternehmen kaufen/);
  assert.match(shared,/home:\[en\?'Home':'Startseite'/);
  assert.match(shared,/calculator:\['Calculator','\/calculator\/'/);
  assert.match(calc,/class="calc-business-cta"/);
  assert.match(calc,/CalcPura für Ihr Unternehmen entdecken/);
  assert.match(calc,/https:\/\/calcpura\.frankiflow\.de\//);
});

test('quotation includes property area and supports direct PDF download',()=>{
  const js=read('public/assets/calculator-app-v3.js'),html=read('public/calculator/index.html');
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

test('print pagination is iOS-safe and only breaks when a following print page exists',()=>{const css=read('public/assets/calculator.css'),js=read('public/assets/calculator-app-v3.js');assert.match(css,/\.print-sheet\{[^}]*min-height:0!important[^}]*height:auto!important/s);assert.match(css,/\.print-document\{[^}]*height:auto;min-height:296mm[^}]*break-inside:avoid-page[^}]*overflow:visible[^}]*display:flex[^}]*flex-direction:column/s);assert.match(css,/\.print-checklist-document\{[^}]*height:auto;min-height:296mm[^}]*break-before:auto;page-break-before:auto[^}]*overflow:visible[^}]*display:flex[^}]*flex-direction:column/s);assert.match(css,/\.has-following-print-page\{break-after:page!important;page-break-after:always!important\}/);assert.match(js,/print-document\$\{includeChecklist\?' has-following-print-page':''\}/);assert.match(js,/print-checklist-document\$\{i<groups\.length-1\?' has-following-print-page':''\}/);});


test('every browser-print page anchors the company footer to the bottom without fixed page height',()=>{const css=read('public/assets/calculator.css'),js=read('public/assets/calculator-app-v3.js');assert.match(css,/\.print-document\{[^}]*height:auto;min-height:296mm[^}]*display:flex[^}]*flex-direction:column/s);assert.match(css,/\.print-checklist-document\{[^}]*height:auto;min-height:296mm[^}]*display:flex[^}]*flex-direction:column/s);assert.match(css,/\.print-company-footer\{[^}]*position:static[^}]*margin-top:auto[^}]*border-top:/s);assert.doesNotMatch(css,/\.print-document\{[^}]*;height:29[67]mm(?:;|})/s);assert.doesNotMatch(css,/\.print-checklist-document\{[^}]*;height:29[67]mm(?:;|})/s);assert.match(js,/print-checklist-note[\s\S]*\$\{companyFooter\(''\)\}/);assert.match(js,/pdfFooter\(doc\);doc\.addPage/);assert.match(js,/pdfFooter\(doc\);\n\}/);});


test('shared public header supplies balanced product navigation everywhere',()=>{
  const shared=read('public/assets/shared-site-header.js');
  const css=read('public/assets/shared-site-header.css');
  const de=read('public/index.html'),en=read('public/en/index.html'),calc=read('public/calculator/index.html');
  for(const html of [de,en,calc]){
    assert.match(html,/data-shared-header/);
    assert.match(html,/shared-site-header\.js\?v=/);
  }
  assert.match(shared,/data-shared-nav/);
  assert.match(shared,/nav-calcpura/);
  assert.match(shared,/nav-frankiholz/);
  assert.match(css,/content:attr\(data-nav-tooltip\)/);
  assert.match(css,/@media\(max-width:1120px\)/);
  assert.match(calc,/class="calc-business-cta"/);
});

test('Homepage and Calculator use the same V2 content rail',()=>{
  const v2=read('public/assets/v2-redesign.css');
  const shared=read('public/assets/shared-site-header.css');
  assert.match(v2,/\.container\{width:min\(1240px,calc\(100% - 48px\)\)\}/);
  assert.match(v2,/\.calc-container\{width:min\(1240px,calc\(100% - 48px\)\)\}/);
  assert.match(shared,/\.site-header \.nav\{/);
});


test('shared header exposes localized product tooltips and accessible names',()=>{
  const shared=read('public/assets/shared-site-header.js');
  assert.match(shared,/Pricing software for service businesses/);
  assert.match(shared,/Preissoftware für Dienstleistungsunternehmen/);
  assert.match(shared,/FrankiFlow accommodation & room booking/);
  assert.match(shared,/FrankiFlow Unterkunft & Zimmerbuchung/);
  assert.match(shared,/setAttribute\('aria-label',label\+' — '\+tooltip\)/);
});

test('homepage binds navigation before awaiting remote content',()=>{const js=read('public/assets/app-base.js');const bind=js.lastIndexOf('initI18n();bindUI();');const wait=js.lastIndexOf('await Promise.allSettled([loadSite(),loadGallery(),loadAboutMain(),loadHeaderLogoWidth()])');assert.ok(bind>=0);assert.ok(wait>=0);assert.ok(bind<wait);});


test('shared mobile navigation is local and loaded before page controllers',()=>{
  const nav=read('public/assets/shared-site-header.js');
  const de=read('public/index.html'),en=read('public/en/index.html'),calc=read('public/calculator/index.html');
  assert.doesNotMatch(nav,/\bimport\b/);
  assert.match(nav,/classList\.toggle\('open'\)/);
  assert.match(nav,/\/calculator\//);
  for(const html of [de,en]){
    const navIndex=html.indexOf('/assets/shared-site-header.js');
    const appIndex=html.indexOf('/assets/app.js');
    assert.ok(navIndex>=0);assert.ok(appIndex>=0);assert.ok(navIndex<appIndex);
  }
  const sharedIndex=calc.indexOf('/assets/shared-site-header.js');
  const calcIndex=calc.indexOf('/assets/calculator-app-v3.js');
  assert.ok(sharedIndex>=0);assert.ok(calcIndex>=0);assert.ok(sharedIndex<calcIndex);
});