import test from 'node:test';
import assert from 'node:assert/strict';
import { CHECKLISTS, applyChecklistRows, localizeChecklistSections } from '../public/assets/checklists.js';

const reset=()=>applyChecklistRows([]);

test('fallback checklists load in German by default and in English on request',()=>{
  reset();
  const de=localizeChecklistSections('buero');
  assert.equal(de.length,CHECKLISTS.buero.length);
  assert.equal(de[0].title,'Büroräume');
  assert.equal(de[0].items[0],'Papierkörbe leeren');
  const en=localizeChecklistSections('buero','en');
  assert.equal(en[0].title,'Office areas');
  assert.equal(en[0].items[0],'Empty waste bins');
});

test('optional sections keep their flag after localisation',()=>{
  reset();
  const deep=localizeChecklistSections('deep','en');
  assert.equal(deep.at(-1).optional,true);
  assert.equal(deep[0].optional,false);
});

test('unknown service keys localise to an empty list',()=>{
  reset();
  assert.deepEqual(localizeChecklistSections('unknown'),[]);
});

test('empty, null or non-array rows restore the fallback checklists',()=>{
  applyChecklistRows([{service_key:'buero',sections:[]}]);
  applyChecklistRows(null);
  assert.equal(localizeChecklistSections('buero').length,CHECKLISTS.buero.length);
  applyChecklistRows([{service_key:'buero',sections:[{title_de:'X',items:[]}]}]);
  applyChecklistRows([]);
  assert.equal(localizeChecklistSections('buero')[0].title,'Büroräume');
});

test('Supabase rows override one service and fill missing English text from German',()=>{
  reset();
  applyChecklistRows([{service_key:'buero',sections:[
    {title_de:'Eigene Zone',title_en:'',items:[{de:'Staub wischen',en:''},{de:'Boden wischen'}]},
    {title_de:'Küche',title_en:'Kitchen',optional:1}
  ]}]);
  assert.deepEqual(localizeChecklistSections('buero'),[
    {title:'Eigene Zone',optional:false,items:['Staub wischen','Boden wischen']},
    {title:'Küche',optional:true,items:[]}
  ]);
  assert.deepEqual(localizeChecklistSections('buero','en').map(s=>s.title),['Eigene Zone','Kitchen']);
  assert.deepEqual(localizeChecklistSections('buero','en')[0].items,['Staub wischen','Boden wischen']);
  reset();
});

test('override rows leave other services on the fallback',()=>{
  reset();
  applyChecklistRows([{service_key:'buero',sections:[{title_de:'Nur Büro',items:[]}]}]);
  assert.equal(localizeChecklistSections('wohnung')[0].title,'Wohn- & Schlafbereiche');
  reset();
});

test('invalid rows are skipped without replacing existing checklists',()=>{
  reset();
  applyChecklistRows([
    null,
    {sections:[{title_de:'Ohne Schlüssel',items:[]}]},
    {service_key:'deep',sections:'nicht erlaubt'}
  ]);
  assert.equal(localizeChecklistSections('deep').length,CHECKLISTS.deep.length);
  assert.equal(localizeChecklistSections('deep')[0].title,'Zusätzliche Grundreinigung – Oberflächen & Details');
  reset();
});
