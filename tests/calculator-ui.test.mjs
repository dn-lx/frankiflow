import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const read=p=>readFileSync(p,'utf8');

test('About Us is a homepage accordion only',()=>{assert.equal(existsSync('public/about/index.html'),false);const home=read('public/index.html');const js=read('public/assets/homepage-about-nav.js');assert.match(home,/id="about"/);assert.match(home,/id="aboutAccordion"/);assert.match(home,/href="#about"/);assert.doesNotMatch(home,/href="\/about\/"/);assert.match(js,/slice\(0,3\)/);assert.match(js,/<details class=/);assert.doesNotMatch(js,/padStart|about-page-story-head/)});
test('Accommodations remains the final navigation link after FAQ',()=>{for(const p of ['public/index.html','public/en/index.html']){const s=read(p);const nav=s.match(/<nav[^>]*class="nav-links"[^>]*>([\s\S]*?)<\/nav>/)?.[1]||'';assert.ok(nav.lastIndexOf('Accommodations')>nav.lastIndexOf('FAQ'))}});
test('calculator contact-with-quotation dialog is wired',()=>{const html=read('public/preisrechner/index.html'),js=read('public/assets/calculator.js');assert.match(html,/id="requestService"/);assert.match(html,/id="quoteRequestModal"/);assert.match(js,/event_type:'admin_enquiry'/);assert.match(js,/attach_quote:true/);assert.match(js,/event_type:'enquiry_received'/)});
test('print waits for logo and contains organisation plus founder',()=>{const js=read('public/assets/calculator.js');assert.match(js,/waitForPrintAssets/);assert.match(js,/await waitForPrintAssets\(\)/);assert.match(js,/FrankiFlow Gebäudereinigung &amp; Objektbetreuung/);assert.match(js,/Inura Devasurendra/);assert.doesNotMatch(js,/FrankiFlow Unternehmensdaten/)});
test('admin exposes editable window contract reductions',()=>{assert.match(read('public/admin/index.html'),/id="windowContractGrid"/);const js=read('public/assets/admin-base.js');assert.match(js,/data-window-contract/);assert.match(js,/contract_reduction_pct:windowReductions/)});
test('language switching preserves the new-customer selection',()=>{assert.match(read('public/assets/calculator.js'),/newCustomerValue/)});
