declare const Netlify: { env: { get(key: string): string | undefined } };
const env=(k:string)=>Netlify.env.get(k)||"";
const FALLBACK_URL="https://bdeajozhylypiidrldka.supabase.co";
const FALLBACK_KEY="sb_publishable_FX7QKUBZQmwykGcgv8SdfQ_lGRZF8n2";
const ALLOWED=new Set(["office","home","airbnb","staircase","deep","property"]);
export default async(req:Request)=>{
  const u=new URL(req.url),category=u.searchParams.get("category")||"";if(!ALLOWED.has(category))return new Response("Invalid category",{status:400});
  const base=(env("SUPABASE_URL")||FALLBACK_URL).replace(/\/$/,"");const key=env("SUPABASE_PUBLISHABLE_KEY")||FALLBACK_KEY;const bucket=env("FRANKIFLOW_MEDIA_BUCKET")||"frankiflow-media";
  try{const r=await fetch(`${base}/rest/v1/frankiflow_gallery?category=eq.${encodeURIComponent(category)}&active=eq.true&select=storage_path&order=sort_order.asc,created_at.desc&limit=1`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});if(r.ok){const rows=await r.json();if(rows?.[0]?.storage_path){const path=String(rows[0].storage_path).split('/').map(encodeURIComponent).join('/');return Response.redirect(`${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path}`,302)}}}catch(e){console.warn("Page photo lookup failed",e)}
  const emptySvg='<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"></svg>';
  return new Response(emptySvg,{status:200,headers:{"Content-Type":"image/svg+xml; charset=utf-8","Cache-Control":"public, max-age=300"}});
};
export const config={path:"/api/media/page-photo"};
