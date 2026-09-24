export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "AD Maker AI", version: "4.4.0", openrouterConfigured: Boolean(env.OPENROUTER_API_KEY), elevenlabsConfigured: Boolean(env.ELEVENLABS_API_KEY), geminiConfigured: Boolean(env.GEMINI_API_KEY), cloudflareAIConfigured: Boolean(env.AI) });
    }
    if (url.pathname === "/api/generate-script" && request.method === "POST") return generateScript(request, env);
    if (url.pathname === "/api/analyze-video/upload" && request.method === "POST") return uploadAnalysisVideo(request, env);
    if (url.pathname === "/api/analyze-video/upload-start" && request.method === "POST") return uploadAnalysisVideoStart(request, env);
    if (url.pathname === "/api/analyze-video/upload-chunk" && request.method === "POST") return uploadAnalysisVideoChunk(request, env);
    if (url.pathname === "/api/analyze-video/file-status" && request.method === "GET") return analysisFileStatus(request, env);
    if (url.pathname === "/api/analyze-video/start" && request.method === "POST") return startVideoAnalysis(request, env);
    if (url.pathname === "/api/analyze-video/start-inline" && request.method === "POST") return startVideoAnalysisInline(request, env);
    if (url.pathname === "/api/analyze-video/interaction-status" && request.method === "GET") return analysisInteractionStatus(request, env);
    if (url.pathname === "/api/tts" && request.method === "POST") return tts(request, env);
    return env.ASSETS.fetch(request);
  }
};

async function requireGemini(env) {
  if (!env.GEMINI_API_KEY) return json({ error: "gemini_missing_api_key", detail: "برای تحلیل مستقیم ویدئو باید Secret با نام GEMINI_API_KEY را در Cloudflare اضافه کنی." }, 503);
  return null;
}

async function uploadAnalysisVideoStart(request, env) {
  try {
    const missing = await requireGemini(env);
    if (missing) return missing;
    const b = await request.json();
    const size = Number(b.size || 0);
    const mime = String(b.mimeType || "video/mp4");
    const name = String(b.fileName || `ad-maker-video-${Date.now()}`);
    if (!Number.isFinite(size) || size <= 0) return json({ error: "empty_video", detail: "حجم ویدئو معتبر نیست." }, 400);
    if (size > 2 * 1024 * 1024 * 1024) return json({ error: "video_too_large", detail: "حجم این ویدئو بیشتر از حد مجاز Gemini است." }, 413);
    const start = await fetch("https://generativelanguage.googleapis.com/upload/v1beta/files", {
      method: "POST",
      headers: {
        "x-goog-api-key": env.GEMINI_API_KEY,
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(size),
        "X-Goog-Upload-Header-Content-Type": mime,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ file: { display_name: name } })
    });
    if (!start.ok) return json({ error: "gemini_upload_start_failed", detail: await safeGoogleError(start) }, start.status || 502);
    const uploadUrl = start.headers.get("x-goog-upload-url");
    if (!uploadUrl) return json({ error: "gemini_upload_url_missing", detail: "Gemini آدرس نشست آپلود را برنگرداند." }, 502);
    return json({ ok: true, uploadUrl, size, mimeType: mime, fileName: name, chunkSize: 8 * 1024 * 1024 });
  } catch (e) {
    return json({ error: "video_upload_start_exception", detail: String(e?.message || e) }, 500);
  }
}

async function uploadAnalysisVideoChunk(request, env) {
  try {
    const missing = await requireGemini(env);
    if (missing) return missing;
    const uploadUrl = request.headers.get("X-Yar-Gemini-Upload-URL");
    const offset = Number(request.headers.get("X-Yar-Gemini-Offset") || 0);
    const finalize = request.headers.get("X-Yar-Gemini-Finalize") === "1";
    if (!uploadUrl || !/^https:\/\/generativelanguage\.googleapis\.com\//.test(uploadUrl)) return json({ error: "upload_session_required", detail: "نشست آپلود Gemini معتبر نیست." }, 400);
    if (!Number.isFinite(offset) || offset < 0) return json({ error: "upload_offset_invalid", detail: "موقعیت آپلود معتبر نیست." }, 400);
    const body = await request.arrayBuffer();
    if (!body.byteLength) return json({ error: "chunk_required", detail: "قطعه‌ای از ویدئو دریافت نشد." }, 400);
    const headers = {
      "Content-Length": String(body.byteLength),
      "X-Goog-Upload-Offset": String(offset),
      "X-Goog-Upload-Command": finalize ? "upload, finalize" : "upload"
    };
    const upstream = await fetch(uploadUrl, { method: "POST", headers, body });
    if (!upstream.ok) return json({ error: "gemini_upload_chunk_failed", detail: await safeGoogleError(upstream), upstreamStatus: upstream.status }, upstream.status || 502);
    if (finalize) {
      const data = await upstream.json();
      const info = data?.file;
      if (!info?.name || !info?.uri) return json({ error: "gemini_file_missing", detail: "Gemini پس از تکمیل آپلود فایل را ثبت نکرد." }, 502);
      return json({ ok: true, finalized: true, fileName: info.name, fileUri: info.uri, mimeType: info.mimeType || "video/mp4", state: info.state || "PROCESSING" });
    }
    const nextOffset = Number(upstream.headers.get("x-goog-upload-offset"));
    return json({ ok: true, finalized: false, nextOffset: Number.isFinite(nextOffset) ? nextOffset : offset + body.byteLength });
  } catch (e) {
    return json({ error: "video_upload_chunk_exception", detail: String(e?.message || e) }, 500);
  }
}

async function uploadAnalysisVideo(request, env) {
  try {
    const missing = await requireGemini(env);
    if (missing) return missing;
    const form = await request.formData();
    const file = form.get("video");
    if (!(file instanceof File)) return json({ error: "video_required", detail: "فایل ویدئو دریافت نشد." }, 400);
    const size = Number(file.size || 0);
    if (!size) return json({ error: "empty_video", detail: "فایل ویدئو خالی است." }, 400);
    if (size > 100 * 1024 * 1024) return json({ error: "video_too_large", detail: "برای این مسیر، حجم ویدئو را زیر 100MB نگه دار." }, 413);
    const mime = String(file.type || "video/mp4");

    const start = await fetch("https://generativelanguage.googleapis.com/upload/v1beta/files", {
      method: "POST",
      headers: {
        "x-goog-api-key": env.GEMINI_API_KEY,
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(size),
        "X-Goog-Upload-Header-Content-Type": mime,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ file: { display_name: file.name || `ad-maker-video-${Date.now()}` } })
    });
    if (!start.ok) return json({ error: "gemini_upload_start_failed", detail: await safeGoogleError(start) }, start.status || 502);
    const uploadUrl = start.headers.get("x-goog-upload-url");
    if (!uploadUrl) return json({ error: "gemini_upload_url_missing", detail: "Gemini آدرس آپلود ویدئو را برنگرداند." }, 502);

    // Buffer the small/medium upload so Gemini receives an exact Content-Length
    // and the request is not dependent on streaming behavior through Pages.
    const body = await file.arrayBuffer();
    const upload = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Length": String(body.byteLength),
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize",
        "Content-Type": mime
      },
      body
    });
    if (!upload.ok) return json({ error: "gemini_upload_failed", detail: await safeGoogleError(upload) }, upload.status || 502);
    const uploaded = await upload.json();
    const info = uploaded?.file;
    if (!info?.name || !info?.uri) return json({ error: "gemini_file_missing", detail: "Gemini فایل ویدئو را ثبت نکرد." }, 502);
    return json({ ok: true, fileName: info.name, fileUri: info.uri, mimeType: info.mimeType || mime, state: info.state || "PROCESSING", videoName: file.name || "video" });
  } catch (e) {
    return json({ error: "video_upload_exception", detail: String(e?.message || e) }, 500);
  }
}

async function analysisFileStatus(request, env) {
  try {
    const missing = await requireGemini(env);
    if (missing) return missing;
    const name = new URL(request.url).searchParams.get("name");
    if (!name || !/^files\/[A-Za-z0-9._-]+$/.test(name)) return json({ error: "file_name_required", detail: "شناسه فایل Gemini معتبر نیست." }, 400);
    const check = await fetch(`https://generativelanguage.googleapis.com/v1beta/${name}`, { headers: { "x-goog-api-key": env.GEMINI_API_KEY } });
    if (!check.ok) return json({ error: "gemini_file_status_failed", detail: await safeGoogleError(check) }, check.status || 502);
    const info = await check.json();
    const state = String(info?.state || "PROCESSING").toUpperCase();
    return json({ ok: state === "ACTIVE", state, fileName: info?.name || name, fileUri: info?.uri || "", mimeType: info?.mimeType || "", detail: state === "FAILED" ? "Gemini نتوانست ویدئو را پردازش کند." : "" });
  } catch (e) {
    return json({ error: "video_file_status_exception", detail: String(e?.message || e) }, 500);
  }
}

async function startVideoAnalysis(request, env) {
  try {
    const missing = await requireGemini(env);
    if (missing) return missing;
    const b = await request.json();
    const fileName = String(b.fileName || "");
    const rawFileUri = String(b.fileUri || "");
    if (!/^files\/[A-Za-z0-9._-]+$/.test(fileName) || !rawFileUri) {
      return json({ error: "gemini_file_required", detail: "فایل آماده Gemini برای شروع تحلیل مشخص نشده است." }, 400);
    }

    const brand = String(b.brand || "").trim();
    const description = String(b.description || "").trim();
    const language = String(b.language || "fa").toLowerCase();
    const duration = Math.max(15, Math.min(300, Number(b.duration) || 60));
    const platform = String(b.platform || "YouTube Shorts");
    const mime = String(b.mimeType || "video/mp4");
    const langName = {
      en:"English", ar:"Arabic", tr:"Turkish", ur:"Urdu", hi:"Hindi", fa:"Persian",
      ps:"Pashto", ru:"Russian", es:"Spanish", fr:"French", de:"German", id:"Indonesian", uz:"Uzbek"
    }[language] || "Persian";
    const targetWords = Math.max(35, Math.min(900, Math.round(duration * 2.2)));

    const prompt = `Analyze this product/site demonstration video for AD Maker AI. The video may show a website or app such as a marketplace. Carefully inspect the actual video frames and visible UI text, and describe what is visibly demonstrated in order with approximate timestamps. Do not invent features that are not shown or stated.

Brand: ${brand || "Unknown"}
User description: ${description || "None provided"}
Platform: ${platform}
Output language: ${langName}
Target advertisement duration: ${duration} seconds
Target voice-over length: about ${targetWords} words.

Return ONLY a JSON object with this exact shape:
{
  "summary": "short factual summary",
  "facts": ["only verified facts from the video or user description"],
  "scenes": [{"start":"00:00","end":"00:08","title":"short title","description":"what is visibly happening"}],
  "script": "complete professional voice-over in the requested language"
}

For the script: narrate the actual sequence of the video so the voice matches what viewers see. Use a strong opening, explain the demonstrated features in order, add transitions, and finish with a call to action. Never invent prices, discounts, statistics, ratings, guarantees, users, locations, or features. If a feature is uncertain, omit it. Return only the JSON object.`;

    // The previous implementation sent Agentic/Static video instructions to the
    // legacy generateContent endpoint. Current Gemini video docs require the
    // Interactions API for the processing field and recommend background
    // execution for long/complex video analysis. Use only current Gemini 3.x
    // models here; never use Gemini 2.5 fallbacks.
    // Prefer models that may still have daily quota available. Do not burn the
    // remaining quota by retrying a daily-quota 429 on the same model.
    const agenticModels = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.8-flash"];
    const staticModels = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.8-flash"];
    // Use the exact URI returned by Gemini Files API. Never manufacture or
    // rewrite a URI here: blob:// URIs are browser-internal and are rejected by
    // Interactions API. Small videos bypass this endpoint entirely via the inline
    // path below.
    if (/^blob:/i.test(rawFileUri)) {
      return json({ error: "gemini_blob_uri", detail: "Gemini یک URI داخلی blob:// برگرداند؛ برای ویدئوهای کوچک باید مسیر مستقیم فعال شود." }, 422);
    }
    const fileUri = rawFileUri;

    const createInteraction = async (model, processing) => {
      const body = {
        model,
        background: true,
        input: [
          { type: "video", uri: fileUri, mime_type: mime, processing },
          { type: "text", text: prompt }
        ],
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              facts: { type: "array", items: { type: "string" } },
              scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    start: { type: "string" },
                    end: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" }
                  },
                  required: ["start", "end", "title", "description"]
                }
              },
              script: { type: "string" }
            },
            required: ["summary", "facts", "scenes", "script"]
          }
        },
        generation_config: {
          max_output_tokens: 5000,
          thinking_level: "low"
        }
      };
      return fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: {
          "x-goog-api-key": env.GEMINI_API_KEY,
          "Content-Type": "application/json",
          "Api-Revision": "2026-05-20"
        },
        body: JSON.stringify(body)
      });
    };

    const retryable = new Set([408, 429, 500, 502, 503, 504]);
    const attemptedModels = [];
    let lastError = "";
    let lastStatus = 503;

    async function tryCreate(models, processing) {
      for (const model of models) {
        for (let attempt = 1; attempt <= 1; attempt += 1) {
          attemptedModels.push(`${model}/${processing}#${attempt}`);
          let response = null;
          try {
            response = await createInteraction(model, processing);
          } catch (e) {
            lastError = String(e?.message || e);
            lastStatus = 502;
          }
          if (response?.ok) {
            const interaction = await response.json();
            if (interaction?.id) {
              return { interaction, model, processing };
            }
            lastError = "Gemini عملیات را ایجاد کرد اما شناسه عملیات برنگشت.";
            lastStatus = 502;
          } else if (response) {
            lastStatus = response.status || 502;
            lastError = await safeGoogleError(response);
            // Daily quota is a project/model limit. Retrying the same request
            // only wastes time and can consume more quota, so immediately move
            // to another current Gemini model when Google reports quota exhaustion.
            const dailyQuota = lastStatus === 429 && /per day|daily|requests per day|GenerateRequestsPerDay|quota.*day|quotaValue/i.test(lastError);
            if (dailyQuota) break;
            // Capability/model errors should move immediately to the next model.
            if (/not found|not available|unsupported|does not support|not enabled/i.test(lastError)) break;
            if (!retryable.has(lastStatus)) break;
          }
          if (attempt < 1) await sleep(1800 * attempt);
        }
      }
      return null;
    }

    // Agentic first, then static if the account/model cannot start agentic.
    let created = await tryCreate(agenticModels, "agentic");
    if (!created) created = await tryCreate(staticModels, "static");

    if (!created) {
      const dailyQuota = lastStatus === 429 && /per day|daily|requests per day|GenerateRequestsPerDay|quota.*day|quotaValue/i.test(lastError);
      const busy = [429, 503].includes(lastStatus) || /high demand|rate limit|resource exhausted|unavailable/i.test(lastError);
      return json({
        error: dailyQuota ? "gemini_daily_quota_exhausted" : (busy ? "gemini_capacity_busy" : "gemini_analysis_failed"),
        detail: dailyQuota ? "سهمیه روزانه Gemini برای این پروژه تمام شده است. این محدودیت از طرف Google است و با کد سایت قابل حذف نیست. چند مدل فعلی امتحان شدند؛ بعد از reset سهمیه یا ارتقای پروژه دوباره می‌توانی تحلیل کنی." : (busy ? "سرویس Gemini در حال حاضر ظرفیت کافی ندارد. چند مدل جدید Gemini 3.x امتحان شد؛ لطفاً چند دقیقه بعد دوباره تلاش کن." : lastError),
        attemptedModels
      }, busy ? 503 : (lastStatus || 502));
    }

    const status = String(created.interaction.status || "in_progress").toLowerCase();
    // Background interactions normally return immediately in_progress. If a
    // very short video completes immediately, the existing status endpoint can
    // consume it on the next poll without another Gemini request.
    return json({
      ok: true,
      status,
      interactionId: created.interaction.id,
      id: created.interaction.id,
      model: created.model,
      processingMode: created.processing,
      fileName,
      fileUri
    });
  } catch (e) {
    return json({ error: "video_analysis_start_exception", detail: String(e?.message || e) }, 500);
  }
}


function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + step, bytes.length)));
  }
  return btoa(binary);
}

async function startVideoAnalysisInline(request, env) {
  try {
    const missing = await requireGemini(env);
    if (missing) return missing;
    const form = await request.formData();
    const file = form.get("video");
    if (!(file instanceof File)) return json({ error: "video_required", detail: "فایل ویدئو دریافت نشد." }, 400);
    const size = Number(file.size || 0);
    if (!size) return json({ error: "empty_video", detail: "فایل ویدئو خالی است." }, 400);
    // Inline video is deliberately limited so base64 expansion stays well below
    // Cloudflare/Gemini request limits. It is the fallback for the blob-URI issue.
    if (size > 20 * 1024 * 1024) return json({ error: "inline_video_too_large", detail: "برای مسیر مستقیم، ویدئو باید حداکثر 20MB باشد." }, 413);

    const mime = String(file.type || "video/mp4");
    const brand = String(form.get("brand") || "").trim();
    const description = String(form.get("description") || "").trim();
    const language = String(form.get("language") || "fa").toLowerCase();
    const duration = Math.max(15, Math.min(300, Number(form.get("duration")) || 60));
    const platform = String(form.get("platform") || "YouTube Shorts");
    const langName = { en:"English", ar:"Arabic", tr:"Turkish", ur:"Urdu", hi:"Hindi", fa:"Persian", ps:"Pashto", ru:"Russian", es:"Spanish", fr:"French", de:"German", id:"Indonesian", uz:"Uzbek" }[language] || "Persian";
    const targetWords = Math.max(35, Math.min(900, Math.round(duration * 2.2)));
    const prompt = `Analyze this product/site demonstration video for AD Maker AI. Inspect the actual frames and visible UI text. Do not invent anything not shown or stated. Brand: ${brand || "Unknown"}. User description: ${description || "None provided"}. Platform: ${platform}. Output language: ${langName}. Target advertisement duration: ${duration} seconds. Target voice-over length: about ${targetWords} words. Return ONLY JSON with summary, facts, scenes[{start,end,title,description}], and script. The script must narrate the actual sequence in order and end with a call to action. Never invent prices, discounts, statistics, ratings, guarantees, locations, users, or features.`;
    const data = bytesToBase64(await file.arrayBuffer());
    // Inline analysis also uses model failover. This matters on the Free tier:
    // one model can have exhausted its daily quota while another current model
    // still has capacity. Never retry a daily-quota 429 on the same model.
    const inlineModels = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.8-flash"];
    const attemptedModels = [];
    let lastStatus = 503;
    let lastError = "";
    for (const model of inlineModels) {
      attemptedModels.push(model);
      const body = {
        model,
        background: true,
        input: [
          { type: "video", data, mime_type: mime, processing: "static" },
          { type: "text", text: prompt }
        ],
        generation_config: { max_output_tokens: 5000, thinking_level: "low" }
      };
      let response;
      try {
        response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
          method: "POST",
          headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json", "Api-Revision": "2026-05-20" },
          body: JSON.stringify(body)
        });
      } catch (e) {
        lastStatus = 502;
        lastError = String(e?.message || e);
        continue;
      }
      if (response.ok) {
        const interaction = await response.json();
        if (!interaction?.id) return json({ error: "gemini_interaction_id_missing", detail: "Gemini عملیات مستقیم را ایجاد کرد اما شناسه برنگشت." }, 502);
        return json({ ok: true, status: String(interaction.status || "in_progress").toLowerCase(), interactionId: interaction.id, id: interaction.id, model: interaction.model || model, processingMode: "static-inline" });
      }
      lastStatus = response.status || 502;
      lastError = await safeGoogleError(response);
      const dailyQuota = lastStatus === 429 && /per day|daily|requests per day|GenerateRequestsPerDay|quota.*day|quotaValue/i.test(lastError);
      if (dailyQuota || /not found|not available|unsupported|does not support|not enabled/i.test(lastError)) continue;
      if (![408, 429, 500, 502, 503, 504].includes(lastStatus)) break;
      if (lastStatus === 429 || lastStatus === 503) await sleep(1200);
    }
    const quota = lastStatus === 429 && /per day|daily|requests per day|GenerateRequestsPerDay|quota.*day|quotaValue/i.test(lastError);
    return json({
      error: quota ? "gemini_daily_quota_exhausted" : "gemini_inline_analysis_failed",
      detail: quota ? "سهمیه روزانه Gemini برای مدل‌های در دسترس این پروژه تمام شده است. سهمیه در زمان تعیین‌شده توسط Google دوباره فعال می‌شود یا می‌توانی پروژه را به Billing متصل کنی." : lastError,
      attemptedModels
    }, lastStatus || 502);
  } catch (e) {
    return json({ error: "video_analysis_inline_exception", detail: String(e?.message || e) }, 500);
  }
}

function extractGenerateContentText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map(p => typeof p?.text === "string" ? p.text : "").filter(Boolean).join("\n").trim();
}

function parseJsonObject(text) {
  let cleaned = String(text || "").trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) return JSON.parse(cleaned.slice(first, last + 1));
  throw new Error("JSON object not found");
}

function normalizeVideoAnalysis(value) {
  const a = value && typeof value === "object" ? value : {};
  const scenes = Array.isArray(a.scenes) ? a.scenes.map(s => ({
    start: String(s?.start || ""),
    end: String(s?.end || ""),
    title: String(s?.title || ""),
    description: String(s?.description || "")
  })).filter(s => s.title || s.description || s.start || s.end) : [];
  return {
    summary: String(a.summary || ""),
    facts: Array.isArray(a.facts) ? a.facts.map(x => String(x || "")).filter(Boolean) : [],
    scenes,
    script: String(a.script || "").trim()
  };
}

function extractInteractionText(result) {
  if (String(result?.output_text || "").trim()) return String(result.output_text).trim();
  const parts = [];
  for (const step of Array.isArray(result?.steps) ? result.steps : []) {
    if (step?.type !== "model_output") continue;
    for (const c of Array.isArray(step?.content) ? step.content : []) if (c?.type === "text" && c.text) parts.push(c.text);
  }
  return parts.join("\n").trim();
}

async function analysisInteractionStatus(request, env) {
  try {
    const missing = await requireGemini(env);
    if (missing) return missing;
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !/^v1_[A-Za-z0-9_-]+$/.test(id)) return json({ error: "interaction_id_required", detail: "شناسه عملیات Gemini معتبر نیست." }, 400);
    const check = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions/${encodeURIComponent(id)}`, { headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Api-Revision": "2026-05-20" } });
    if (!check.ok) return json({ error: "gemini_interaction_status_failed", detail: await safeGoogleError(check) }, check.status || 502);
    const result = await check.json();
    const status = String(result?.status || "in_progress").toLowerCase();
    if (status === "completed") {
      const text = extractInteractionText(result);
      if (!text) return json({ error: "gemini_empty_analysis", detail: "Gemini عملیات را کامل کرد اما پاسخ متنی قابل استفاده نداشت." }, 502);
      let parsed;
      try { parsed = JSON.parse(text); } catch (_) {
        const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
        try { parsed = JSON.parse(cleaned); } catch (_) { return json({ error: "gemini_invalid_json", detail: "پاسخ تحلیل ویدئو JSON معتبر نداشت." }, 502); }
      }
      const scenes = Array.isArray(parsed.scenes) ? parsed.scenes.slice(0, 40) : [];
      const facts = Array.isArray(parsed.facts) ? parsed.facts.slice(0, 60) : [];
      const script = String(parsed.script || "").trim();
      if (!script) return json({ error: "gemini_no_script", detail: "Gemini تحلیل را انجام داد اما سناریوی صوتی برنگرداند." }, 502);
      return json({ ok: true, status: "completed", provider: "gemini-video", model: result.model || env.GEMINI_MODEL || "gemini-3.8-flash", summary: String(parsed.summary || ""), facts, scenes, script });
    }
    if (["failed", "cancelled"].includes(status)) return json({ error: "gemini_analysis_failed", detail: result?.error?.message || `Gemini عملیات با وضعیت ${status} پایان یافت.`, status }, 502);
    return json({ ok: true, status, progress: 60 });
  } catch (e) {
    return json({ error: "video_analysis_status_exception", detail: String(e?.message || e) }, 500);
  }
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function safeGoogleError(response) {
  try {
    const j = await response.clone().json();
    return j?.error?.message || j?.message || `Google API HTTP ${response.status}`;
  } catch (_) {
    try { return (await response.clone().text()).slice(0, 600) || `Google API HTTP ${response.status}`; } catch (_) { return `Google API HTTP ${response.status}`; }
  }
}

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
    const videoAnalysis = b.videoAnalysis || null;
    const videoInstruction = videoAnalysis
      ? `\nIMPORTANT: A demonstration video was analyzed. The voice-over MUST follow what is actually shown in the video. Use the scene order and verified facts below. Do not invent anything not supported by the video or user description.\n\nVideo summary:\n${String(videoAnalysis.summary || "")}\n\nVerified facts:\n${Array.isArray(videoAnalysis.facts) ? videoAnalysis.facts.join("\n- ") : ""}\n\nVideo scenes:\n${Array.isArray(videoAnalysis.scenes) ? videoAnalysis.scenes.map(s => `${s.start || ""}-${s.end || ""}: ${s.title || ""}. ${s.description || ""}`).join("\n") : ""}\n\nVideo analyzer draft:\n${String(videoAnalysis.recommendedScript || "")}`
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
- The selected duration is the priority: do not return a short 15–30 second script for a multi-minute request.${modeInstruction}${videoInstruction}`;

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

    const language = String(b.language || 'en').toLowerCase();
    // ElevenLabs currently supports Persian and Pashto in Eleven v3, while
    // Flash v2.5 / Multilingual v2 do not list those languages. For the other
    // supported languages, Flash v2.5 is the fast/low-latency path.
    const v3Only = language === 'fa' || language === 'ps';
    const models = v3Only
      ? [{ id: 'eleven_v3', maxChars: 4200 }]
      : [{ id: 'eleven_flash_v2_5', maxChars: 12000 }, { id: 'eleven_v3', maxChars: 4200 }];

    const configuredVoice = env.ELEVENLABS_VOICE_ID || '';
    const voices = [...new Set([configuredVoice, 'JBFqnCBsd6RMkjVDRZzb'].filter(Boolean))];
    let lastError = null;

    for (const voice of voices) {
      for (const model of models) {
        const chunks = splitTtsText(text, model.maxChars);
        const parts = [];
        let failed = false;

        // Do chunks sequentially. Parallel TTS calls can hit ElevenLabs
        // concurrency limits and can make a long request appear stuck.
        for (let i = 0; i < chunks.length; i++) {
          const result = await elevenLabsTTSWithRetry(
            env.ELEVENLABS_API_KEY,
            voice,
            model.id,
            chunks[i],
            language
          );
          if (!result.ok) {
            lastError = result;
            failed = true;
            break;
          }
          parts.push(result.audio);
        }

        if (!failed && parts.length) {
          return json({
            audio: parts.length === 1 ? parts[0] : null,
            audioParts: parts.length > 1 ? parts : undefined,
            mime: 'audio/mpeg',
            fallback: false,
            provider: 'elevenlabs',
            model: model.id,
            voice,
            chunks: parts.length,
            characters: text.length
          });
        }

        // Auth/quota/permission errors won't be fixed by changing models.
        if ([401, 402, 403].includes(lastError?.status)) break;
      }
      if ([401, 402, 403].includes(lastError?.status)) break;
    }

    return json({
      audio: null,
      fallback: true,
      error: lastError?.code || 'elevenlabs_request_failed',
      detail: lastError?.message || 'ElevenLabs could not generate the requested speech.',
      status: lastError?.status || 422,
      requestId: lastError?.requestId || null,
      characters: text.length
    }, lastError?.status === 429 ? 429 : 502);
  } catch (e) {
    return json({ audio: null, fallback: true, error: 'tts_server_error', detail: String(e?.message || e) }, 500);
  }
}

async function elevenLabsTTSWithRetry(apiKey, voice, model, text, language) {
  let last = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await elevenLabsTTS(apiKey, voice, model, text, language);
    if (result.ok) return result;
    last = result;
    if (![408, 429, 500, 502, 503, 504].includes(result.status) || attempt === 1) break;
    await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1)));
  }
  return last;
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
    if (languageCode && model !== 'eleven_multilingual_v2') body.language_code = languageCode;
    if (model === 'eleven_flash_v2_5') body.apply_text_normalization = 'auto';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 22000);
    let r;
    try {
      r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

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
    const timedOut = e?.name === 'AbortError';
    return {
      ok: false,
      status: 504,
      code: timedOut ? 'elevenlabs_timeout' : 'elevenlabs_network_error',
      message: timedOut ? 'ElevenLabs پاسخ را در زمان مجاز برنگرداند.' : String(e?.message || e)
    };
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
