import PDFDocument from 'pdfkit';
import { getFrankiFlowLogoBuffer } from './frankiflow-logo.mts';

const NAVY='#071f38';
const TEAL='#0aa5a6';
const TEAL_LIGHT='#e9f8f5';
const ICE='#f4f8fa';
const INK='#152231';
const MUTED='#607583';
const LINE='#dce6eb';

const text=(v:any,max=220)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const list=(v:any,max=40)=>Array.isArray(v)?v.slice(0,max):[];
const isContractSavingRow=(label:string)=>/^(laufzeitvorteil|contract saving)/i.test(label);
const isVisitPriceRow=(label:string)=>/^(preis pro termin|price per visit)$/i.test(label);

function safePayload(raw:any){
  return {
    language: raw?.language==='en'?'en':'de',
    customer:{
      name:text(raw?.customer?.name,120), company:text(raw?.customer?.company,120), email:text(raw?.customer?.email,160),
      phone:text(raw?.customer?.phone,80), address:text(raw?.customer?.address,220)
    },
    service:{
      label:text(raw?.service?.label,140), area:text(raw?.service?.area,80), frequency:text(raw?.service?.frequency,120),
      contract:text(raw?.service?.contract,120), vatStatus:text(raw?.service?.vatStatus,120)
    },
    prices:{
      visit:text(raw?.prices?.visit,60), monthly:text(raw?.prices?.monthly,60), firstMonth:text(raw?.prices?.firstMonth,60),
      discountLabel:text(raw?.prices?.discountLabel,120), hasPromotion:Boolean(raw?.prices?.hasPromotion)
    },
    breakdown:list(raw?.breakdown,30)
      .map((r:any)=>({label:text(r?.label,180),value:text(r?.value,120)}))
      .filter((r:any)=>!isContractSavingRow(r.label)&&!isVisitPriceRow(r.label)),
    includeChecklist:Boolean(raw?.includeChecklist),
    checklist:list(raw?.checklist,10).map((g:any)=>({
      title:text(g?.title,160), sections:list(g?.sections,20).map((s:any)=>({
        title:text(s?.title,160), optional:Boolean(s?.optional), items:list(s?.items,60).map((i:any)=>text(i,220)).filter(Boolean)
      }))
    }))
  };
}

function collectPdf(doc:any):Promise<Buffer>{
  return new Promise((resolve,reject)=>{
    const chunks:Buffer[]=[];
    doc.on('data',(c:Buffer)=>chunks.push(c));
    doc.on('end',()=>resolve(Buffer.concat(chunks)));
    doc.on('error',reject);
  });
}

async function loadFrankiFlowLogo(req:Request):Promise<Buffer>{
  try{
    const logoUrl=new URL('/assets/frankiflow-logo.png',req.url);
    const response=await fetch(logoUrl,{headers:{Accept:'image/png'}});
    if(!response.ok)throw new Error(`Logo request failed: ${response.status}`);
    const bytes=await response.arrayBuffer();
    if(bytes.byteLength<10000)throw new Error('Logo response was unexpectedly small');
    return Buffer.from(bytes);
  }catch(error){
    console.warn('Falling back to embedded FrankiFlow logo',error);
    return getFrankiFlowLogoBuffer();
  }
}

function drawFooter(doc:any){
  const y=710;
  doc.moveTo(48,y).lineTo(547,y).strokeColor(LINE).lineWidth(1).stroke();
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10).text('FrankiFlow Gebäudereinigung & Objektbetreuung',48,y+12,{width:315});
  doc.fillColor(MUTED).font('Helvetica').fontSize(7.5).text('Inura Devasurendra · Gründer / Founder',48,y+28,{width:315});
  doc.text('+49 176 62493041 · info@frankiflow.de · www.frankiflow.de',48,y+42,{width:315});
  doc.text('Steuernummer 014/811/68462 · W-IdNr. DE464605581',360,y+12,{width:187,align:'right'});
  doc.text('Frankfurt am Main & Umgebung',360,y+28,{width:187,align:'right'});
}

function drawLogoPlaque(doc:any,logo:Buffer,x=42,y=10,w=96,h=96){
  doc.roundedRect(x,y,w,h,10).fillColor('#ffffff').fill();
  doc.image(logo,x+7,y+7,{fit:[w-14,h-14],align:'center',valign:'center'});
}

function beginChecklistPage(doc:any,logo:Buffer,lang:string,title:string,continuation=false){
  doc.fillColor(NAVY).rect(0,0,595,112).fill();
  drawLogoPlaque(doc,logo,42,9,94,94);
  doc.fillColor('#bfe9e5').font('Helvetica').fontSize(9).text(lang==='de'?'LEISTUNGSCHECKLISTE':'SERVICE CHECKLIST',352,27,{width:195,align:'right'});
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13).text(title||'-',352,46,{width:195,align:'right'});
  if(continuation)doc.fillColor('#bfe9e5').font('Helvetica').fontSize(8).text(lang==='de'?'Fortsetzung':'Continuation',352,67,{width:195,align:'right'});
  doc.y=136;
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(16).text(title||'-',48,doc.y,{width:499});
  doc.moveDown(.6);
}

function ensureChecklistSpace(doc:any,needed:number,logo:Buffer,lang:string,title:string){
  if(doc.y+needed<=685)return;
  drawFooter(doc);
  doc.addPage();
  beginChecklistPage(doc,logo,lang,title,true);
}

function renderChecklist(doc:any,p:any,logo:Buffer){
  const lang=p.language;
  for(const group of p.checklist){
    doc.addPage();
    beginChecklistPage(doc,logo,lang,group.title||'-');

    for(const section of group.sections){
      ensureChecklistSpace(doc,74,logo,lang,group.title||'-');
      doc.fillColor(section.optional?'#8a6220':TEAL).font('Helvetica-Bold').fontSize(10.5).text(section.title||'-',48,doc.y,{width:499});
      if(section.optional){
        doc.fillColor('#8a6220').font('Helvetica').fontSize(7.5).text(lang==='de'?'Nur nach ausdrücklicher Vereinbarung':'Only when specifically agreed',48,doc.y+2,{width:499});
        doc.moveDown(.25);
      }
      doc.moveDown(.35);
      for(const item of section.items){
        ensureChecklistSpace(doc,24,logo,lang,group.title||'-');
        const y=doc.y;
        doc.circle(55,y+4,2.1).fillColor(section.optional?'#b89446':TEAL).fill();
        doc.fillColor(INK).font('Helvetica').fontSize(9).text(item,66,y,{width:470,lineGap:2});
        doc.moveDown(.25);
      }
      doc.moveDown(.55);
    }
    drawFooter(doc);
  }
}

function renderQuote(doc:any,p:any,logo:Buffer){
  const lang=p.language;
  const de=lang==='de';
  const customerTitle=p.customer.company||p.customer.name||'—';
  const customerLines=[p.customer.company?p.customer.name:'',p.customer.address,p.customer.email,p.customer.phone].filter(Boolean);
  const customerDetails=customerLines.join('\n');
  const priceRows=[
    {label:de?'Preis pro Termin':'Price per visit',value:p.prices.visit||'—'},
    ...p.breakdown
  ];

  doc.addPage();
  doc.fillColor(NAVY).rect(0,0,595,118).fill();
  drawLogoPlaque(doc,logo,42,10,98,98);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16).text(de?'ANGEBOT':'QUOTATION',382,30,{width:165,align:'right'});
  doc.fillColor('#d6e3ea').font('Helvetica').fontSize(9).text(new Intl.DateTimeFormat(de?'de-DE':'en-GB').format(new Date()),382,57,{width:165,align:'right'});
  doc.fillColor('#bfe9e5').fontSize(8.5).text('FrankiFlow Gebäudereinigung & Objektbetreuung',270,82,{width:277,align:'right'});

  const customerBoxY=142;
  const customerTitleY=174;
  const customerTitleWidth=270;
  doc.font('Helvetica-Bold').fontSize(15);
  const customerTitleHeight=doc.heightOfString(customerTitle,{width:customerTitleWidth,lineGap:1});
  const customerDetailsY=customerTitleY+customerTitleHeight+5;
  doc.font('Helvetica').fontSize(8.2);
  const customerDetailsHeight=customerDetails
    ?doc.heightOfString(customerDetails,{width:customerTitleWidth,lineGap:2})
    :0;
  doc.font('Helvetica-Bold').fontSize(11);
  const contractHeight=doc.heightOfString(p.service.contract||'—',{width:165,align:'right'});
  const customerLeftBottom=customerDetails
    ?customerDetailsY+customerDetailsHeight
    :customerTitleY+customerTitleHeight;
  const customerRightBottom=175+contractHeight;
  const customerBoxHeight=Math.max(84,Math.ceil(Math.max(customerLeftBottom,customerRightBottom)-customerBoxY+18));

  doc.roundedRect(48,customerBoxY,499,customerBoxHeight,12).fillColor(ICE).fill();
  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(7.5).text(de?'ANGEBOT AN':'QUOTATION FOR',64,158);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(15).text(customerTitle,64,customerTitleY,{width:customerTitleWidth,lineGap:1});
  if(customerDetails)doc.fillColor(MUTED).font('Helvetica').fontSize(8.2).text(customerDetails,64,customerDetailsY,{width:customerTitleWidth,lineGap:2});
  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(7.5).text(de?'VERTRAGSLAUFZEIT':'CONTRACT DURATION',360,158,{width:165,align:'right'});
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text(p.service.contract||'—',360,175,{width:165,align:'right'});

  const serviceTitleY=customerBoxY+customerBoxHeight+28;
  const serviceMetaY=serviceTitleY+26;
  const priceCardY=serviceTitleY-10;
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(18).text(p.service.label||'-',48,serviceTitleY,{width:330});
  const serviceMeta=[p.service.area,p.service.frequency,p.service.vatStatus].filter(Boolean).join(' · ');
  if(serviceMeta)doc.fillColor(MUTED).font('Helvetica').fontSize(8.5).text(serviceMeta,48,serviceMetaY,{width:330});

  doc.roundedRect(390,priceCardY,157,74,12).fillColor(TEAL_LIGHT).fill();
  doc.fillColor(TEAL).font('Helvetica-Bold').fontSize(7.5).text(p.prices.hasPromotion?(de?'1. VERTRAGSMONAT':'1ST CONTRACT MONTH'):(de?'MONATLICH':'MONTHLY'),404,priceCardY+14,{width:129,align:'right'});
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(22).text(p.prices.hasPromotion?p.prices.firstMonth:p.prices.monthly,404,priceCardY+30,{width:129,align:'right'});

  doc.y=serviceTitleY+90;
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10).text(de?'PREISÜBERSICHT':'PRICE OVERVIEW',48,doc.y);
  doc.moveDown(.7);
  for(const row of priceRows.slice(0,8)){
    const y=doc.y;
    doc.moveTo(48,y+18).lineTo(547,y+18).strokeColor(LINE).lineWidth(.7).stroke();
    doc.fillColor(INK).font('Helvetica').fontSize(8.8).text(row.label,48,y,{width:340});
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8.8).text(row.value,400,y,{width:147,align:'right'});
    doc.y=y+25;
  }

  const boxY=Math.min(Math.max(doc.y+8,525),590);
  doc.roundedRect(48,boxY,499,74,10).fillColor('#fbfdfd').strokeColor(LINE).lineWidth(.8).fillAndStroke();
  const sy=boxY+15;
  doc.fillColor(MUTED).font('Helvetica').fontSize(8.5).text(de?'Preis pro Termin':'Price per visit',64,sy,{width:150});
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text(p.prices.visit||'—',64,sy+16,{width:150});
  doc.fillColor(MUTED).font('Helvetica').fontSize(8.5).text(de?'Regulärer Monat':'Regular month',225,sy,{width:150});
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text(p.prices.monthly||'—',225,sy+16,{width:150});
  if(p.prices.hasPromotion){
    doc.fillColor(MUTED).font('Helvetica').fontSize(8.5).text(de?'1. Monat nach Rabatt':'1st month after discount',386,sy,{width:145,align:'right'});
    doc.fillColor(TEAL).font('Helvetica-Bold').fontSize(12).text(p.prices.firstMonth||'—',386,sy+16,{width:145,align:'right'});
  }

  const noteY=boxY+90;
  const promoNote=p.prices.hasPromotion
    ?(de?`${p.prices.discountLabel||'Neukundenrabatt'} gilt ausschließlich im ersten Vertragsmonat. Mindestpreise bleiben bestehen.`:`${p.prices.discountLabel||'New-customer discount'} applies only to the first contract month. Minimum prices remain in force.`)
    :'';
  if(promoNote)doc.fillColor(MUTED).font('Helvetica').fontSize(7.8).text(promoNote,48,noteY,{width:499,lineGap:2});
  if(p.includeChecklist&&p.checklist.length){
    doc.fillColor(TEAL).font('Helvetica-Bold').fontSize(8).text(de?'Leistungscheckliste beigefügt':'Service checklist attached',48,noteY+(promoNote?24:0));
  }
  drawFooter(doc);
}

export default async(req:Request)=>{
  if(req.method!=='POST')return new Response('Method not allowed',{status:405,headers:{Allow:'POST'}});
  try{
    const p=safePayload(await req.json());
    const logo=await loadFrankiFlowLogo(req);
    const doc=new PDFDocument({
      size:'A4',
      autoFirstPage:false,
      margins:{top:42,bottom:36,left:48,right:48},
      info:{Title:p.language==='de'?'FrankiFlow Angebot':'FrankiFlow Quotation',Author:'FrankiFlow Gebäudereinigung & Objektbetreuung'}
    });
    const done=collectPdf(doc);
    renderQuote(doc,p,logo);
    if(p.includeChecklist&&p.checklist.length)renderChecklist(doc,p,logo);
    doc.end();
    const buffer=await done;
    const stamp=new Date().toISOString().slice(0,10);
    const filename=`FrankiFlow-${p.language==='de'?'Angebot':'Quotation'}-${stamp}.pdf`;
    return new Response(new Uint8Array(buffer),{status:200,headers:{
      'Content-Type':'application/pdf',
      'Content-Disposition':`attachment; filename=\"${filename}\"`,
      'Cache-Control':'no-store'
    }});
  }catch(err){
    console.error('quotation-pdf failed',err);
    return new Response(JSON.stringify({error:'PDF generation failed'}),{status:500,headers:{'Content-Type':'application/json'}});
  }
};

export const config={path:'/api/pdf/quotation'};
