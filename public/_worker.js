
/*
 AD Maker AI — Cloudflare Pages Advanced Mode
 Secrets:
   OPENROUTER_API_KEY  -> optional AI script generation
   ELEVENLABS_API_KEY  -> optional professional voice-over
   ELEVENLABS_VOICE_ID -> optional, defaults to Rachel
 Workers AI binding:
   AI -> optional Cloudflare fallback for script generation
*/
export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    if(url.pathname==="/api/health") return json({ok:true,service:"AD Maker AI",version:"2.0.0"});
    if(url.pathname==="/api/generate-script" && request.method==="POST") return generateScript(request,env);
    if(url.pathname==="/api/tts" && request.method==="POST") return tts(request,env);
    return env.ASSETS.fetch(request);
  }
};

async function generateScript(request,env){
 try{
  const b=await request.json();
  if(!b.brand||!b.description)return json({error:"brand_and_description_required"},400);
  const lang=b.language==="ps"?"natural Afghan Pashto":b.language==="en"?"English":"natural Afghan Dari";
  const prompt=`You are an expert short-form advertising copywriter for Afghanistan.
Write a persuasive but factual voice-over script for a ${b.duration}-second advertisement.
Brand: ${b.brand}
Product/service description: ${b.description}
Style: ${b.style||"cinematic"}
Language: ${lang}
Rules:
- Return ONLY the spoken script.
- Use natural Afghan Dari when requested, not Iranian Persian.
- Avoid invented prices, guarantees, awards, users, statistics or features not supplied.
- Strong hook in the first sentence.
- Short spoken sentences and a clear call to action.
- Fit the requested duration.`;
  if(env.OPENROUTER_API_KEY){
   const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{"Authorization":`Bearer ${env.OPENROUTER_API_KEY}`,"Content-Type":"application/json","HTTP-Referer":new URL(request.url).origin,"X-Title":"AD Maker AI"},body:JSON.stringify({model:"openrouter/free",messages:[{role:"user",content:prompt}],temperature:.8,max_tokens:700})});
   if(r.ok){const j=await r.json(),s=j?.choices?.[0]?.message?.content?.trim();if(s)return json({script:s,fallback:false,provider:"openrouter"})}
  }
  if(env.AI){
   const out=await env.AI.run("@cf/meta/llama-3.1-8b-instruct",{prompt,max_tokens:700});
   const s=(out?.response||"").trim();if(s)return json({script:s,fallback:false,provider:"cloudflare-ai"});
  }
  return json({script:fallback(b),fallback:true,provider:"local"});
 }catch(e){return json({script:fallback({brand:"AD Maker AI",description:"",language:"fa"}),fallback:true,error:"generation_failed"})}
}

async function tts(request,env){
 try{
  const b=await request.json();
  if(!b.text)return json({audio:null,error:"text_required"},400);
  if(!env.ELEVENLABS_API_KEY)return json({audio:null,error:"elevenlabs_key_missing"},503);

  const languageCode=b.language==="ps"?"ps":b.language==="en"?"en":"fa";
  const voice = await chooseVoice(env, languageCode);
  if(!voice) return json({audio:null,error:"elevenlabs_voice_not_found",language:languageCode},502);

  const payload={
    text:String(b.text).slice(0,3000),
    model_id:"eleven_v3",
    language_code:languageCode,
    output_format:"mp3_44100_128"
  };

  let r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}`,{
   method:"POST",
   headers:{"xi-api-key":env.ELEVENLABS_API_KEY,"Content-Type":"application/json","Accept":"audio/mpeg"},
   body:JSON.stringify(payload)
  });

  if(!r.ok){
   const info=await elevenError(r);
   return json({audio:null,error:mapElevenError(r.status,info.code),status:r.status,detail:info.message||info.code||"ElevenLabs request failed",voice,language:languageCode},502);
  }

  const buf=await r.arrayBuffer();
  if(!buf.byteLength)return json({audio:null,error:"empty_audio"},502);
  return json({audio:arrayBufferToBase64(buf),mime:"audio/mpeg",fallback:false,model:"eleven_v3",language:languageCode,voice});
 }catch(e){
  return json({audio:null,error:"tts_request_failed",detail:String(e?.message||e)},502);
 }
}

async function chooseVoice(env, languageCode){
  if(env.ELEVENLABS_VOICE_ID) return env.ELEVENLABS_VOICE_ID;
  try{
    const r=await fetch(`https://api.elevenlabs.io/v2/voices?language=${encodeURIComponent(languageCode)}&page_size=20`,{
      headers:{"xi-api-key":env.ELEVENLABS_API_KEY,"Accept":"application/json"}
    });
    if(r.ok){
      const j=await r.json();
      const voices=Array.isArray(j?.voices)?j.voices:[];
      const match=voices.find(v=>(v.verified_languages||[]).some(x=>x?.language===languageCode));
      if(match?.voice_id) return match.voice_id;
      if(voices[0]?.voice_id) return voices[0].voice_id;
    }
  }catch(_){ }
  // Documented ElevenLabs example voice; used only when no account-specific voice is available.
  return "JBFqnCBsd6RMkjVDRZzb";
}

async function elevenError(r){
 try{
  const j=await r.json();
  const d=j?.detail||{};
  return {code:d.code||d.status||d.type||"",message:d.message||j?.message||""};
 }catch(_){
  try{return {message:(await r.text()).slice(0,300)}}catch(__){return {}};
 }
}
function mapElevenError(status,code){
 if(status===401||code==="invalid_api_key"||code==="authentication_error") return "elevenlabs_invalid_api_key";
 if(status===402||code==="payment_required"||code==="quota_exceeded") return "elevenlabs_quota_exceeded";
 if(status===403||code==="authorization_error") return "elevenlabs_permission_denied";
 if(status===404||code==="voice_not_found") return "elevenlabs_voice_not_found";
 if(status===429||code==="rate_limit_error") return "elevenlabs_rate_limited";
 return "elevenlabs_tts_failed";
}

function arrayBufferToBase64(buf){let s="",a=new Uint8Array(buf);const chunk=0x8000;for(let i=0;i<a.length;i+=chunk)s+=String.fromCharCode(...a.subarray(i,i+chunk));return btoa(s)}
function fallback(b){
 if(b.language==="en")return `${b.brand}. ${b.description}. Discover it, try it and share it. ${b.brand} — simple, fast and made for you.`;
 if(b.language==="ps")return `${b.brand}. ${b.description}. خپل اعلان خپور کړئ، پیرودونکي پیدا کړئ او اسانه پېر او پلور وکړئ. همدا اوس یې تجربه کړئ.`;
 return `${b.brand}. ${b.description}. خپل آگهی ثبت کن، بیشتر دیده شو و مشتری پیدا کن. محصولات مورد نیازت را پیدا کن و با فروشنده ارتباط بگیر. ${b.brand}؛ ساده، سریع و حرفه‌ای.`;
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json;charset=UTF-8","cache-control":"no-store","access-control-allow-origin":"*"}})}
