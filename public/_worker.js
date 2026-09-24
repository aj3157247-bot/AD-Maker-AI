export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "AD Maker AI", version: "2.1.0" });
    }
    if (url.pathname === "/api/generate-script" && request.method === "POST") return generateScript(request, env);
    if (url.pathname === "/api/tts" && request.method === "POST") return tts(request, env);
    return env.ASSETS.fetch(request);
  }
};

async function generateScript(request, env) {
  try {
    const b = await request.json();
    if (!b.brand || !b.description) return json({ error: "brand_and_description_required" }, 400);

    const duration = Math.max(15, Math.min(300, Number(b.duration) || 15));
    const targetWords = Math.max(35, Math.min(900, Number(b.targetWords) || Math.round(duration * 2.2)));
    const lang = b.language === "ps" ? "natural Afghan Pashto" : b.language === "en" ? "English" : "natural Afghan Dari";
    const style = b.style || "cinematic";

    const prompt = `You are an expert advertising copywriter creating a complete voice-over for an Afghanistan-focused product advertisement.

Brand/product: ${b.brand}
User-provided description: ${b.description}
Language: ${lang}
Style: ${style}
Target video duration: ${duration} seconds (${Math.floor(duration / 60)} minutes ${duration % 60} seconds)
Target spoken length: approximately ${targetWords} words.

Write a professional, natural voice-over that is long enough to fill the requested duration at a comfortable speaking pace. If the user's description is short, expand it intelligently using only information that is directly supported or safely implied by the description. Add useful context, problem/solution framing, benefits, realistic use cases, transitions, and a strong call to action, but NEVER invent prices, discounts, statistics, awards, guarantees, locations, customers, reviews, technical specifications, or features that the user did not provide.

Requirements:
- Return ONLY the spoken script; no title, notes, labels, bullet points, scene directions or quotation marks.
- Use natural Afghan Dari when requested, not Iranian-specific wording. Use natural Afghan Pashto when requested.
- Keep sentences easy to narrate aloud and vary sentence length naturally.
- Do not cram too many words into a sentence.
- Build a clear opening hook, explanation, benefits, practical value, and ending call to action.
- The script should be coherent from beginning to end and should not repeat the same sentence just to increase length.
- Aim for approximately ${targetWords} words (within about 15% if possible).
- The selected duration is the priority: do not return a short 15–30 second script for a multi-minute request.`;

    if (env.OPENROUTER_API_KEY) {
      let script = await openRouterScript(env.OPENROUTER_API_KEY, prompt, request);
      if (script) {
        const count = wordCount(script);
        // If a free model under-delivers badly on a long ad, ask once for a focused expansion.
        if (count < Math.max(35, Math.floor(targetWords * 0.68)) && targetWords >= 90) {
          const expandPrompt = `Expand the following advertising voice-over to approximately ${targetWords} words so it can fill a ${duration}-second video. Preserve every factual claim already present. Add only natural, useful context, benefits, use cases, transitions and a call to action that are supported by the original user description. Do not invent prices, statistics, awards, guarantees, customers or unsupported features. Return ONLY the complete rewritten spoken script in ${lang}.\n\nOriginal user description:\n${b.description}\n\nCurrent script:\n${script}`;
          const expanded = await openRouterScript(env.OPENROUTER_API_KEY, expandPrompt, request, 2400);
          if (expanded && wordCount(expanded) > count) script = expanded;
        }
        return json({ script, fallback: false, provider: "openrouter", targetWords, duration });
      }
    }

    if (env.AI) {
      const out = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt, max_tokens: Math.min(2400, Math.max(700, targetWords * 2)) });
      const s = (out?.response || "").trim();
      if (s) return json({ script: s, fallback: false, provider: "cloudflare-ai", targetWords, duration });
    }

    return json({ script: fallback(b), fallback: true, provider: "local", targetWords, duration });
  } catch (e) {
    return json({ script: fallback({ brand: "AD Maker AI", description: "", language: "fa", duration: 15 }), fallback: true, error: "generation_failed" });
  }
}

async function openRouterScript(apiKey, prompt, request, maxTokens = 2400) {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": new URL(request.url).origin,
        "X-Title": "AD Maker AI"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.75,
        max_tokens: maxTokens
      })
    });
    if (!r.ok) return "";
    const j = await r.json();
    return j?.choices?.[0]?.message?.content?.trim() || "";
  } catch (_) {
    return "";
  }
}

async function tts(request, env) {
  try {
    const b = await request.json();
    if (!b.text) return json({ error: "text_required" }, 400);
    if (!env.ELEVENLABS_API_KEY) return json({ audio: null, fallback: true });
    const voice = env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json", "Accept": "audio/mpeg" },
      body: JSON.stringify({
        text: b.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: .42, similarity_boost: .78, style: .25, use_speaker_boost: true }
      })
    });
    if (!r.ok) return json({ audio: null, fallback: true });
    const buf = await r.arrayBuffer();
    return json({ audio: arrayBufferToBase64(buf), mime: "audio/mpeg", fallback: false });
  } catch (e) {
    return json({ audio: null, fallback: true });
  }
}

function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function arrayBufferToBase64(buf) {
  let s = "", a = new Uint8Array(buf), chunk = 0x8000;
  for (let i = 0; i < a.length; i += chunk) s += String.fromCharCode(...a.subarray(i, i + chunk));
  return btoa(s);
}

function fallback(b) {
  const brand = b.brand || "AD Maker AI";
  const desc = b.description || "یک محصول یا خدمت کاربردی";
  const duration = Math.max(15, Math.min(300, Number(b.duration) || 15));
  const base = b.language === "en"
    ? `${brand}. ${desc}. Discover what it can do, understand its value, and see how it can make your experience simpler. ${brand} is designed around the needs described in this advertisement. Explore the details, choose what fits your needs, and take the next step today.`
    : b.language === "ps"
      ? `${brand}. ${desc}. دا اعلان تاسو سره مرسته کوي چې د محصول ارزښت او د کارولو اسانتیا ښه وپېژنئ. هغه ځانګړنې او ګټې وکاروئ چې ستاسو له اړتیا سره برابرې دي، جزئیات وګورئ او د خپلې اړتیا لپاره مناسب انتخاب وکړئ. له ${brand} سره بل ګام همدا اوس واخلئ.`
      : `${brand}. ${desc}. اینجا هدف این است که شما محصول یا خدمت را ساده و روشن بشناسید و ببینید چگونه می‌تواند بر اساس توضیحات ارائه‌شده برای نیاز شما مفید باشد. مزیت‌های اصلی را بررسی کن، جزئیات را ببین و گزینه مناسب خودت را انتخاب کن. اگر دنبال یک راه ساده و کاربردی هستی، ${brand} را بررسی کن و همین امروز قدم بعدی را بردار.`;
  if (duration <= 30) return base;
  const extra = b.language === "en"
    ? ` Take a closer look at the information provided, consider how it fits your situation, and use the available details before making your choice. ${brand} — clear, practical, and ready for your next step.`
    : b.language === "ps"
      ? ` د ورکړل شوو معلوماتو له مخې جزئیات په پام کې ونیسئ، د خپلې اړتیا سره یې پرتله کړئ او له موجودو معلوماتو څخه د سمې پرېکړې لپاره ګټه واخلئ. ${brand}؛ روښانه، عملي او ستاسو د راتلونکي ګام لپاره چمتو.`
      : ` توضیحات را با دقت ببین، مزیت‌های گفته‌شده را با نیاز خودت مقایسه کن و پیش از انتخاب از اطلاعات موجود استفاده کن. ${brand}؛ روشن، کاربردی و آماده برای قدم بعدی شما.`;
  const repeats = Math.min(6, Math.max(1, Math.ceil(duration / 60)));
  return [base, ...Array.from({ length: repeats }, () => extra)].join(" ");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    }
  });
}
