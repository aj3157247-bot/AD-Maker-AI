export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "AD Maker AI", version: "2.2.0", openrouterConfigured: Boolean(env.OPENROUTER_API_KEY), elevenlabsConfigured: Boolean(env.ELEVENLABS_API_KEY), cloudflareAIConfigured: Boolean(env.AI) });
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

    return json({
      script: fallback(b),
      fallback: true,
      provider: "local",
      error: "no_ai_provider_configured",
      detail: "هیچ سرویس AI در محیط Cloudflare در دسترس نیست. OPENROUTER_API_KEY یا binding مربوط به Cloudflare AI تنظیم نشده است.",
      openrouterConfigured: Boolean(env.OPENROUTER_API_KEY),
      cloudflareAIConfigured: Boolean(env.AI),
      targetWords,
      duration
    });
  } catch (e) {
    const code = e?.code || "generation_failed";
    const detail = e?.message || "اتصال به سرویس تولید سناریو ناموفق بود.";
    return json({
      script: fallback({ brand: b?.brand || "AD Maker AI", description: b?.description || "", language: b?.language || "fa", duration }),
      fallback: true,
      provider: "local",
      error: code,
      detail,
      status: e?.status || 500,
      openrouterConfigured: Boolean(env.OPENROUTER_API_KEY),
      cloudflareAIConfigured: Boolean(env.AI),
      targetWords,
      duration
    });
  }
}

async function openRouterScript(apiKey, prompt, request, maxTokens = 2400) {
  const models = [
    "openrouter/free",
    "nvidia/nemotron-3-ultra:free",
    "google/gemma-4-31b-it:free"
  ];
  let last = { status: 0, code: "openrouter_no_model_response", message: "OpenRouter returned no usable script." };
  for (const model of models) {
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
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.75,
          max_tokens: maxTokens
        })
      });
      if (r.ok) {
        const j = await r.json();
        const script = j?.choices?.[0]?.message?.content?.trim() || "";
        if (script) return script;
        last = { status: 502, code: "openrouter_empty_response", message: `مدل ${model} پاسخ متنی برنگرداند.` };
        continue;
      }
      let detail = null;
      try { detail = await r.json(); } catch (_) {}
      const err = detail?.error || {};
      last = {
        status: r.status,
        code: err?.code || err?.type || `http_${r.status}`,
        message: err?.message || `OpenRouter برای مدل ${model} خطای HTTP ${r.status} برگرداند.`
      };
      // Authentication, permission and account-limit errors cannot be fixed by switching models.
      if ([401, 403, 402].includes(r.status)) break;
    } catch (e) {
      last = { status: 503, code: "openrouter_network_error", message: String(e?.message || e) };
    }
  }
  throw Object.assign(new Error(last.message), { status: last.status, code: last.code });
}

async function tts(request, env) {
  try {
    const b = await request.json();
    const text = String(b.text || '').trim();
    if (!text) return json({ error: 'text_required' }, 400);
    if (!env.ELEVENLABS_API_KEY) return json({ audio: null, fallback: true, error: 'elevenlabs_missing_api_key' }, 503);

    // Eleven v3 is the current expressive multilingual model and is a better fit
    // for Afghan Dari/Pashto than the older Multilingual v2 model.
    const configuredVoice = env.ELEVENLABS_VOICE_ID || '';
    const voices = [...new Set([configuredVoice, 'JBFqnCBsd6RMkjVDRZzb'].filter(Boolean))];
    const models = ['eleven_v3', 'eleven_multilingual_v2'];
    let lastError = null;

    for (const voice of voices) {
      for (const model of models) {
        const result = await elevenLabsTTS(env.ELEVENLABS_API_KEY, voice, model, text);
        if (result.ok) return json({ audio: result.audio, mime: 'audio/mpeg', fallback: false, provider: 'elevenlabs', model, voice });
        lastError = result;

        // Do not retry a bad key/quota/rate-limit with another model; it cannot help.
        if ([401, 402, 403, 429].includes(result.status)) {
          return json({
            audio: null,
            fallback: true,
            error: result.code || 'elevenlabs_request_failed',
            detail: result.message || 'ElevenLabs request failed.',
            status: result.status,
            requestId: result.requestId || null
          }, result.status === 429 ? 429 : 502);
        }

        // A missing/inaccessible voice can be solved by trying the known public
        // fallback voice. Other validation errors are worth trying the next model.
      }
    }

    return json({
      audio: null,
      fallback: true,
      error: lastError?.code || 'elevenlabs_request_failed',
      detail: lastError?.message || 'ElevenLabs could not generate the requested speech.',
      status: lastError?.status || 422,
      requestId: lastError?.requestId || null
    }, 502);
  } catch (e) {
    return json({ audio: null, fallback: true, error: 'tts_server_error', detail: String(e?.message || e) }, 500);
  }
}

async function elevenLabsTTS(apiKey, voice, model, text) {
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: { stability: 0.42, similarity_boost: 0.78, style: 0.25, use_speaker_boost: true }
      })
    });

    if (r.ok) return { ok: true, audio: arrayBufferToBase64(await r.arrayBuffer()) };

    let detail = null;
    try { detail = await r.json(); } catch (_) {}
    const d = detail?.detail || {};
    return {
      ok: false,
      status: r.status,
      code: d?.code || d?.status || `http_${r.status}`,
      message: d?.message || (typeof d === 'string' ? d : `ElevenLabs returned HTTP ${r.status}.`),
      requestId: r.headers.get('request-id') || null
    };
  } catch (e) {
    return { ok: false, status: 503, code: 'elevenlabs_network_error', message: String(e?.message || e) };
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
