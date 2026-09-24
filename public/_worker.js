export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "AD Maker AI", version: "2.5.0", openrouterConfigured: Boolean(env.OPENROUTER_API_KEY), elevenlabsConfigured: Boolean(env.ELEVENLABS_API_KEY), cloudflareAIConfigured: Boolean(env.AI) });
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
    const languageNames = { en:"English", ar:"Arabic", tr:"Turkish", ur:"Urdu", hi:"Hindi", fa:"Persian", ps:"Pashto", ru:"Russian", es:"Spanish", fr:"French", de:"German", id:"Indonesian", uz:"Uzbek" };
    const lang = languageNames[b.language] || "Persian";
    const style = b.style || "YouTube Shorts";
    const scriptMode = b.scriptMode || "ai";
    const customScript = String(b.customScript || "").trim();
    const modeInstruction = scriptMode === "hybrid" && customScript
      ? `\nThe user also supplied a draft script below. Preserve its meaning and factual claims, but professionally rewrite and expand it to fit the target duration. Improve the hook, flow, benefits, transitions and call to action without inventing unsupported facts.\n\nUser draft script:\n${customScript}`
      : "";

    const prompt = `You are an expert advertising copywriter creating a complete voice-over for an Afghanistan-focused product advertisement.

Brand/product: ${b.brand}
User-provided description: ${b.description}
Language: ${lang}
Target platform: ${style}
Target video duration: ${duration} seconds (${Math.floor(duration / 60)} minutes ${duration % 60} seconds)
Target spoken length: approximately ${targetWords} words.

Write a professional, natural voice-over that is long enough to fill the requested duration at a comfortable speaking pace. If the user's description is short, expand it intelligently using only information that is directly supported or safely implied by the description. Add useful context, problem/solution framing, benefits, realistic use cases, transitions, and a strong call to action, but NEVER invent prices, discounts, statistics, awards, guarantees, locations, customers, reviews, technical specifications, or features that the user did not provide.

Requirements:
- Return ONLY the spoken script; no title, notes, labels, bullet points, scene directions or quotation marks.
- Use natural, native-sounding ${lang}. For Persian, use standard Persian rather than labeling it as Afghan Dari. For Pashto, use natural Pashto.
- Keep sentences easy to narrate aloud and vary sentence length naturally.
- Do not cram too many words into a sentence.
- Build a clear opening hook, explanation, benefits, practical value, and ending call to action.
- The script should be coherent from beginning to end and should not repeat the same sentence just to increase length.
- Aim for approximately ${targetWords} words (within about 15% if possible).
- The selected duration is the priority: do not return a short 15–30 second script for a multi-minute request.${modeInstruction}`;

    if (env.OPENROUTER_API_KEY) {
      let script = await openRouterScript(env.OPENROUTER_API_KEY, prompt, request);
      if (script) {
        // Some free models occasionally echo the instruction instead of the requested
        // spoken script. Detect that before sending the text to ElevenLabs.
        if (looksLikeMetaScript(script)) {
          const repairPrompt = `Return ONLY the spoken advertising voice-over. Do not explain the task and do not mention prompts, word counts, target duration, instructions, or that you are an AI. Write approximately ${targetWords} words in ${lang}, using only facts supported by this user description:

Brand: ${b.brand}
User description: ${b.description}`;
          const repaired = await openRouterScript(env.OPENROUTER_API_KEY, repairPrompt, request, 2600);
          if (repaired && !looksLikeMetaScript(repaired)) script = repaired;
        }
        const count = wordCount(script);
        // If a free model under-delivers badly on a long ad, ask once for a focused expansion.
        if (count < Math.max(35, Math.floor(targetWords * 0.68)) && targetWords >= 90) {
          const expandPrompt = `Expand the following advertising voice-over to approximately ${targetWords} words so it can fill a ${duration}-second video. Preserve every factual claim already present. Add only natural, useful context, benefits, use cases, transitions and a call to action that are supported by the original user description. Do not invent prices, statistics, awards, guarantees, customers or unsupported features. Return ONLY the complete rewritten spoken script in ${lang}.\n\nOriginal user description:\n${b.description}\n\nCurrent script:\n${script}`;
          const expanded = await openRouterScript(env.OPENROUTER_API_KEY, expandPrompt, request, 2400);
          if (expanded && wordCount(expanded) > count) script = expanded;
        }
        script = normalizeScript(script, targetWords);
        return json({ script, fallback: false, provider: "openrouter", targetWords, duration, wordCount: wordCount(script) });
      }
    }

    if (env.AI) {
      const out = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt, max_tokens: Math.min(2400, Math.max(700, targetWords * 2)) });
      const s = (out?.response || "").trim();
      if (s) {
        const normalized = normalizeScript(s, targetWords);
        return json({ script: normalized, fallback: false, provider: "cloudflare-ai", targetWords, duration, wordCount: wordCount(normalized) });
      }
    }

    return json({
      script: fallback(b),
      fallback: true,
      provider: "local",
      error: "no_ai_provider_configured",
      detail: "OpenRouter پاسخ قابل استفاده نداد و Cloudflare AI هم فعال نیست. اگر خطا 429/limit بود، سقف درخواست رایگان OpenRouter را بررسی کن؛ اگر 401/403 بود، کلید یا دسترسی را بررسی کن.",
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
  // Keep the list to currently published OpenRouter IDs. The free router is
  // also retained as a fallback because OpenRouter updates its free pool.
  const models = [
    "google/gemma-4-31b-it:free",
    "openrouter/free"
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
          temperature: 0.7,
          max_tokens: Math.min(3000, Math.max(900, Number(maxTokens) || 1800))
        })
      });
      if (r.ok) {
        const j = await r.json();
        const content = j?.choices?.[0]?.message?.content;
        const script = typeof content === "string" ? content.trim() : "";
        if (script) return script;
        last = {
          status: 502,
          code: "openrouter_empty_response",
          message: `مدل ${model} پاسخ متنی قابل استفاده برنگرداند.`
        };
        continue;
      }
      let detail = null;
      try { detail = await r.json(); } catch (_) {}
      const err = detail?.error || {};
      last = {
        status: r.status,
        code: err?.code || err?.type || `http_${r.status}`,
        message: err?.message || `OpenRouter برای مدل ${model} خطای HTTP ${r.status} برگرداند.`,
        model
      };
      // Authentication, permission and account-limit errors cannot be fixed by switching models.
      if ([401, 403, 402].includes(r.status)) break;
    } catch (e) {
      last = { status: 503, code: "openrouter_network_error", message: String(e?.message || e) };
    }
  }
  throw Object.assign(new Error(last.message), {
    status: last.status,
    code: last.code,
    model: last.model || null
  });
}

async function tts(request, env) {
  try {
    const b = await request.json();
    const text = normalizeTtsText(b.text);
    if (!text) return json({ audio: null, fallback: true, error: 'text_required' }, 400);
    if (!env.ELEVENLABS_API_KEY) return json({ audio: null, fallback: true, error: 'elevenlabs_missing_api_key' }, 503);

    // ElevenLabs limits a single TTS request to 10,000 characters on this setup.
    // Long advertisements are therefore split into natural sentence/word chunks,
    // each rendered with the same voice/model. The browser joins the returned audio.
    // Eleven v3 currently has a 5,000-character per-request limit; keep a safe margin.
    // Multilingual v2 accepts longer text, so the same chunks work for both models.
    const chunks = splitTtsText(text, 4200);
    const configuredVoice = env.ELEVENLABS_VOICE_ID || '';
    const voices = [...new Set([configuredVoice, 'JBFqnCBsd6RMkjVDRZzb'].filter(Boolean))];
    const models = ['eleven_v3', 'eleven_multilingual_v2'];
    let lastError = null;

    for (const voice of voices) {
      for (const model of models) {
        const parts = [];
        let failed = false;
        for (let i = 0; i < chunks.length; i++) {
          const result = await elevenLabsTTS(env.ELEVENLABS_API_KEY, voice, model, chunks[i], b.language);
          if (!result.ok) {
            lastError = result;
            failed = true;
            break;
          }
          parts.push(result.audio);
        }
        if (!failed && parts.length) {
          if (parts.length === 1) {
            return json({ audio: parts[0], mime: 'audio/mpeg', fallback: false, provider: 'elevenlabs', model, voice, chunks: 1, characters: text.length });
          }
          return json({ audioParts: parts, mime: 'audio/mpeg', fallback: false, provider: 'elevenlabs', model, voice, chunks: parts.length, characters: text.length });
        }

        // Authentication, quota and rate-limit errors cannot be fixed by switching models.
        if ([401, 402, 403, 429].includes(lastError?.status)) {
          return json({
            audio: null,
            fallback: true,
            error: lastError.code || 'elevenlabs_request_failed',
            detail: lastError.message || 'ElevenLabs request failed.',
            status: lastError.status,
            requestId: lastError.requestId || null
          }, lastError.status === 429 ? 429 : 502);
        }
      }
    }

    return json({
      audio: null,
      fallback: true,
      error: lastError?.code || 'elevenlabs_request_failed',
      detail: lastError?.message || 'ElevenLabs could not generate the requested speech.',
      status: lastError?.status || 422,
      requestId: lastError?.requestId || null,
      characters: text.length,
      chunks: chunks.length
    }, 502);
  } catch (e) {
    return json({ audio: null, fallback: true, error: 'tts_server_error', detail: String(e?.message || e) }, 500);
  }
}

function normalizeTtsText(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitTtsText(text, maxChars = 8500) {
  const clean = normalizeTtsText(text);
  if (clean.length <= maxChars) return [clean];
  const sentences = clean.match(/[^.!?؟؛。！？]+[.!?؟؛。！？]+|[^.!?؟؛。！？]+$/gu) || [clean];
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    const part = sentence.trim();
    if (!part) continue;
    if ((current + ' ' + part).trim().length <= maxChars) {
      current = (current + ' ' + part).trim();
      continue;
    }
    if (current) chunks.push(current);
    if (part.length <= maxChars) {
      current = part;
    } else {
      const words = part.split(/\s+/);
      current = '';
      for (const word of words) {
        if ((current + ' ' + word).trim().length <= maxChars) current = (current + ' ' + word).trim();
        else { if (current) chunks.push(current); current = word; }
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

async function elevenLabsTTS(apiKey, voice, model, text, language) {
  try {
    const languageCode = { en:"en", ar:"ar", tr:"tr", ur:"ur", hi:"hi", fa:"fa", ps:"ps", ru:"ru", es:"es", fr:"fr", de:"de", id:"id", uz:"uz" }[language] || null;
    const body = {
      text,
      model_id: model,
      voice_settings: { stability: 0.42, similarity_boost: 0.78, style: 0.25, use_speaker_boost: true }
    };
    // language_code is supported by v3; multilingual_v2 ignores it.
    if (model === 'eleven_v3' && languageCode) body.language_code = languageCode;
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(body)
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

function looksLikeMetaScript(text) {
  const s = String(text || '').toLowerCase();
  const markers = [
    'we need to produce', 'must be about', 'target video duration', 'target spoken length',
    'only spoken script', 'return only', 'voice-over script in natural', 'word count',
    'do not include titles', 'as an ai', 'as an assistant'
  ];
  const hits = markers.filter(x => s.includes(x)).length;
  return hits >= 2 || /\b\d+\s*words?\b/i.test(s) && /must|target|script/i.test(s);
}

function normalizeScript(text, targetWords) {
  let clean = String(text || '')
    .replace(/^\s*(title|script|voice[- ]?over|سناریو|متن|گویندگی)\s*[:：-]\s*/i, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const maxWords = Math.min(900, Math.max(45, Math.ceil(Number(targetWords || 35) * 1.35)));
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return clean;
  const shortened = words.slice(0, maxWords).join(' ');
  const lastStop = Math.max(shortened.lastIndexOf('.'), shortened.lastIndexOf('؟'), shortened.lastIndexOf('!'), shortened.lastIndexOf('؛'), shortened.lastIndexOf('،'));
  if (lastStop > shortened.length * 0.72) return shortened.slice(0, lastStop + 1).trim();
  return shortened.trim() + '...';
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
  const custom = String(b.customScript || "").trim();
  if ((b.scriptMode === "manual" || b.scriptMode === "hybrid") && custom) return custom;
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
