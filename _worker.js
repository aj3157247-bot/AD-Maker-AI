
/*
 AdForge AI Cloudflare Pages Advanced Worker
 Required secret (optional): OPENROUTER_API_KEY
 The frontend works without the key using a local fallback script.
*/
export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/api/generate" && request.method === "POST") {
   try {
    const body = await request.json();
    if (!env.OPENROUTER_API_KEY) return json({script: fallback(body)});
    const prompt = `You are a world-class short-form advertising copywriter.
Create a concise spoken ad script in ${body.language==="ps"?"Afghan Pashto":body.language==="en"?"English":"natural Afghan Dari"}.
Brand: ${body.brand}
Description: ${body.description}
Style: ${body.style}
Duration: ${body.duration} seconds.
Return ONLY the script, no markdown, no headings, no stage directions. Make it energetic, natural, memorable and suitable for voice-over.`;
    const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{
      method:"POST",headers:{"Authorization":`Bearer ${env.OPENROUTER_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({model:"openrouter/free",messages:[{role:"user",content:prompt}],temperature:.8,max_tokens:500})
    });
    if(!r.ok) return json({script:fallback(body)});
    const j=await r.json(), script=j?.choices?.[0]?.message?.content?.trim();
    return json({script:script||fallback(body)});
   } catch(e){ return json({script:fallback({brand:"AdForge",description:""}),error:"generation_fallback"}); }
  }
  return env.ASSETS?.fetch(request) || fetch(request);
 }
};
function json(o){return new Response(JSON.stringify(o),{headers:{"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*"}})}
function fallback(b){
 if(b.language==="en") return `${b.brand} — ${b.description}\nDiscover it. Try it. Share it.\n${b.brand}, made simple.`;
 if(b.language==="ps") return `${b.brand}\n${b.description}\nاسانه، چټک او باوري.\nهمدا اوس یې تجربه کړئ.`;
 return `${b.brand}\n${b.description}\nخرید و فروش را ساده‌تر کن.\nهمین حالا شروع کن و بیشتر دیده شو.\n${b.brand}؛ ساده، سریع و حرفه‌ای.`;
}
