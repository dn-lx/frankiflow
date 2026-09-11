declare const Netlify: { env: { get(key: string): string | undefined } };
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8"}});
const env=(k:string)=>Netlify.env.get(k)||"";

async function supabaseRequest(path:string,options:RequestInit={}){
  const base=env("SUPABASE_URL").replace(/\/$/,"");
  const secret=env("SUPABASE_SECRET_KEY");
  if(!base||!secret) throw new Error("Supabase server environment variables are missing");
  return fetch(`${base}${path}`,{...options,headers:{apikey:secret,"content-type":"application/json",Prefer:"return=representation",...(options.headers||{})}});
}
async function getAdminFromToken(token:string){
  const base=env("SUPABASE_URL").replace(/\/$/,""); const pub=env("SUPABASE_PUBLISHABLE_KEY");
  if(!base||!pub) throw new Error("Supabase auth environment variables are missing");
  const u=await fetch(`${base}/auth/v1/user`,{headers:{apikey:pub,Authorization:`Bearer ${token}`}}); if(!u.ok)return null; const user=await u.json();
  const a=await supabaseRequest(`/rest/v1/pricing_admin_users?user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&role=eq.admin&select=user_id,email,role`); if(!a.ok)return null; const rows=await a.json(); return rows[0]?{...rows[0],id:user.id}:null;
}
function stripeBody(params:Record<string,unknown>){const body=new URLSearchParams();for(const [k,v] of Object.entries(params)){if(v!==undefined&&v!==null&&v!=="")body.append(k,String(v))}return body}
export default async (req:Request)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,""); if(!token)return json({error:"Unauthorized"},401);
  let admin; try{admin=await getAdminFromToken(token)}catch(e){return json({error:e instanceof Error?e.message:"Admin verification failed"},500)} if(!admin)return json({error:"Admin access required"},403);
  let input:any;try{input=await req.json()}catch{return json({error:"Invalid JSON"},400)}
  const amount=Math.round(Number(input.amount_cents)); const email=String(input.customer_email||"").trim(); const name=String(input.customer_name||"").trim(); const description=String(input.description||"").trim();const invoice=String(input.invoice_number||"").trim();const billingMonth=input.billing_month?String(input.billing_month):null;
  if(!Number.isInteger(amount)||amount<100||amount>5000000)return json({error:"Amount must be between €1 and €50,000"},400);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:"Valid customer email required"},400); if(description.length<3||description.length>240)return json({error:"Description must be 3–240 characters"},400);
  if(invoice.length>80)return json({error:"Invoice number is too long"},400);if(billingMonth&&!/^\d{4}-\d{2}-01$/.test(billingMonth))return json({error:"Billing month must use YYYY-MM-01"},400);
  const stripeSecret=env('STRIPE_SECRET_KEY'); if(!stripeSecret)return json({error:'STRIPE_SECRET_KEY is not configured'},503);
  const record={quote_request_id:input.quote_request_id||null,description,amount_cents:amount,currency:'eur',customer_email:email,customer_name:name,status:'created',created_by:admin.id,invoice_number:invoice||null,billing_month:billingMonth,metadata:{source:'frankiflow-admin',invoice_number:invoice||null,billing_month:billingMonth}};
  const insert=await supabaseRequest('/rest/v1/frankiflow_payments',{method:'POST',body:JSON.stringify(record)}); if(!insert.ok)return json({error:'Could not create payment record',detail:await insert.text()},500); const [payment]=await insert.json();
  const siteUrl=(env('SITE_URL')||new URL(req.url).origin).replace(/\/$/,'');
  const params={mode:'payment',success_url:`${siteUrl}/?payment=success`,cancel_url:`${siteUrl}/?payment=cancelled`,customer_email:email,client_reference_id:payment.id,'line_items[0][price_data][currency]':'eur','line_items[0][price_data][unit_amount]':amount,'line_items[0][price_data][product_data][name]':description,'line_items[0][quantity]':1,'metadata[frankiflow_payment_id]':payment.id,'metadata[created_by]':admin.id,'metadata[invoice_number]':invoice,'metadata[billing_month]':billingMonth||''};
  const sr=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${stripeSecret}`,'content-type':'application/x-www-form-urlencoded'},body:stripeBody(params)}); const stripe=await sr.json();
  if(!sr.ok){await supabaseRequest(`/rest/v1/frankiflow_payments?id=eq.${payment.id}`,{method:'PATCH',body:JSON.stringify({status:'failed',updated_at:new Date().toISOString()})});return json({error:stripe?.error?.message||'Stripe Checkout creation failed'},502)}
  await supabaseRequest(`/rest/v1/frankiflow_payments?id=eq.${payment.id}`,{method:'PATCH',body:JSON.stringify({status:'checkout_open',stripe_checkout_session_id:stripe.id,checkout_url:stripe.url,updated_at:new Date().toISOString()})});
  return json({payment_id:payment.id,session_id:stripe.id,url:stripe.url,livemode:!!stripe.livemode});
};
export const config={path:"/api/stripe/create-checkout"};
