import test from 'node:test';
import assert from 'node:assert/strict';

// header-logo-settings.js applies CSS variables at import time, so the minimal
// DOM it touches must exist before the dynamic import below runs.
const cssVars=new Map();
globalThis.document={
  documentElement:{style:{setProperty:(name,value)=>cssVars.set(name,value)}},
  querySelector:()=>({}),
  createElement:()=>({}),
  head:{append(){}}
};

const {
  normalizeHeaderLogoWidth,
  normalizeHeaderHeight,
  headerHeightForLogoWidth,
  effectiveHeaderHeight,
  applyHeaderSettings
}=await import('../public/assets/header-logo-settings.js');

const importTimeVars=new Map(cssVars);

test('import applies the public default logo width (90 x 1.5) to the header',()=>{
  assert.equal(importTimeVars.get('--ff-header-logo-width'),'135px');
  assert.equal(importTimeVars.get('--ff-header-height'),'135px');
});

test('logo width is clamped to 90-250 and rounded',()=>{
  assert.equal(normalizeHeaderLogoWidth(undefined),90);
  assert.equal(normalizeHeaderLogoWidth('120'),120);
  assert.equal(normalizeHeaderLogoWidth(10),90);
  assert.equal(normalizeHeaderLogoWidth(999),250);
  assert.equal(normalizeHeaderLogoWidth(120.4),120);
  assert.equal(normalizeHeaderLogoWidth(120.5),121);
});

test('header height is clamped to 90-250 and rounded',()=>{
  assert.equal(normalizeHeaderHeight(undefined),100);
  assert.equal(normalizeHeaderHeight(50),90);
  assert.equal(normalizeHeaderHeight(400),250);
  assert.equal(normalizeHeaderHeight(150.6),151);
});

test('minimum header height follows the clamped logo width',()=>{
  assert.equal(headerHeightForLogoWidth(120),120);
  assert.equal(headerHeightForLogoWidth(300),250);
  assert.equal(headerHeightForLogoWidth(10),90);
});

test('effective header height is the larger of requested height and logo-driven minimum',()=>{
  assert.equal(effectiveHeaderHeight(200,100),200);
  assert.equal(effectiveHeaderHeight(100,220),220);
  assert.equal(effectiveHeaderHeight(undefined,undefined),100);
  assert.equal(effectiveHeaderHeight(250,90),250);
});

test('applyHeaderSettings writes clamped CSS variables and reports applied values',()=>{
  const result=applyHeaderSettings(200,100);
  assert.deepEqual(result,{width:200,requestedHeight:100,appliedHeight:200});
  assert.equal(cssVars.get('--ff-header-logo-width'),'200px');
  assert.equal(cssVars.get('--ff-header-height'),'200px');
});

test('applyHeaderSettings clamps oversized inputs before applying them',()=>{
  const result=applyHeaderSettings(300,120);
  assert.deepEqual(result,{width:250,requestedHeight:120,appliedHeight:250});
  assert.equal(cssVars.get('--ff-header-logo-width'),'250px');
  assert.equal(cssVars.get('--ff-header-height'),'250px');
});
