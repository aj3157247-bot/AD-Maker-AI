import "./style.css";

const state = {
  assets: [],
  style: "youtube_short",
  platform: "youtube_short",
  language: "en",
  duration: 15,
  script: "",
  scriptMode: "ai",
  buildMode: "pro",
  customScript: "",
  activeView: "preview",
  busy: false,
  voiceBlob: null,
  lastVideo: null,
  brandColor: "#7c5cff",
  currentStage: 0,
  generated: false,
  voiceMode: "none",
  videoAnalysis: null,
  videoAnalysisBusy: false
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const copy = {
  fa: {
    dir: "rtl", langName: "دری افغانستان", brandPlaceholder: "مثلاً بازارک",
    descPlaceholder: "محصول، خدمات، سایت یا اپلیکیشن را توضیح بده. چه مشکلی را حل می‌کند و مهم‌ترین مزیت آن چیست؟",
    ready: "آماده برای ساخت", analyze: "در حال تحلیل اطلاعات و رسانه‌ها...", script: "در حال نوشتن سناریوی تبلیغاتی...",
    voice: "در حال ساخت گویندگی حرفه‌ای...", render: "در حال ساخت و رندر ویدئو...", done: "تبلیغ شما آماده است 🎉",
    missing: "نام برند و توضیح محصول را وارد کنید.", fallback: "سناریوی داخلی آماده شد؛ برای تولید AI، کلید OpenRouter را بررسی کنید.",
    voiceFallback: "گویندگی آنلاین در دسترس نبود؛ از صدای مرورگر استفاده می‌شود.", voiceReady: "گویندگی حرفه‌ای آماده شد ✓",
    mediaReady: "رسانه‌ها آماده شدند", noMedia: "بدون رسانه؛ ویدئو با کارت‌های متنی ساخته می‌شود.",
    retry: "تلاش دوباره", noVoice: "ادامه بدون گویندگی", saved: "فایل آماده دانلود است."
  },
  ps: {
    dir: "rtl", langName: "پښتو", brandPlaceholder: "لکه: بازارک",
    descPlaceholder: "محصول، خدمت، وېبپاڼه یا اپلېکېشن تشریح کړئ. کومه ستونزه حل کوي او مهمه ګټه یې څه ده؟",
    ready: "د جوړولو لپاره چمتو", analyze: "د معلوماتو او رسنیو تحلیل روان دی...", script: "اعلاني سناریو جوړېږي...",
    voice: "مسلکي غږ جوړېږي...", render: "ویډیو جوړېږي او رینډر کېږي...", done: "ستاسو اعلان چمتو شو 🎉",
    missing: "د برانډ نوم او د محصول تشریح ولیکئ.", fallback: "داخلي سناریو چمتو شوه؛ د AI لپاره OpenRouter کلیمه وګورئ.",
    voiceFallback: "آنلاین غږ موجود نه و؛ د براوزر غږ کارول کېږي.", voiceReady: "مسلکي غږ چمتو شو ✓",
    mediaReady: "رسنۍ چمتو شوې", noMedia: "رسنۍ نشته؛ ویډیو د متني کارتونو له لارې جوړېږي.",
    retry: "بیا هڅه", noVoice: "بې له غږه دوام", saved: "فایل د ډاونلوډ لپاره چمتو دی."
  },
  en: {
    dir: "ltr", langName: "English", brandPlaceholder: "e.g. Bazarek",
    descPlaceholder: "Describe the product, service, website or app. What problem does it solve and what is its main benefit?",
    ready: "Ready to create", analyze: "Analyzing your information and media...", script: "Writing your advertising script...",
    voice: "Generating professional voice-over...", render: "Building and rendering the video...", done: "Your advertisement is ready 🎉",
    missing: "Enter the brand name and product description.", fallback: "Local script is ready; check your OpenRouter key for AI generation.",
    voiceFallback: "Online voice generation was unavailable; browser voice will be used.", voiceReady: "Professional voice-over ready ✓",
    mediaReady: "Media prepared", noMedia: "No media added; the video will use text cards.",
    retry: "Retry", noVoice: "Continue without voice", saved: "Your file is ready to download."
  }
};

function t(key) { return copy[state.language]?.[key] || copy.fa[key]; }
function setDir() {
  document.documentElement.lang = state.language === "en" ? "en" : state.language;
  document.documentElement.dir = t("dir");
}

function renderShell() {
  const stages = [
    ["01", "اطلاعات", "شروع"],
    ["02", "سناریو", "AI"],
    ["03", "گویندگی", "صدا"],
    ["04", "صحنه‌ها", "رسانه"],
    ["05", "رندر", "ویدئو"],
    ["06", "آماده", "خروجی"]
  ];
  $("#app").innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <div class="brandmark">✦</div>
        <div><strong>AD Maker AI</strong><span>استودیوی ساخت تبلیغ</span></div>
      </div>
      <div class="top-actions">
        <div class="top-badge"><i></i><span>AI آماده است</span></div>
        <button id="helpBtn" class="icon-btn" aria-label="راهنما">?</button>
      </div>
    </header>

    <main>
      <section class="hero-card">
        <div class="hero-copy">
          <div class="eyebrow">AI AD STUDIO</div>
          <h1>تبلیغت را <span>حرفه‌ای بساز.</span></h1>
          <p>محصولت را معرفی کن، رسانه‌ها را اضافه کن و بقیه را به AI بسپار.</p>
          <div class="hero-pills"><span>🎙 گویندگی AI</span><span>✦ سناریوی هوشمند</span><span>▣ خروجی 9:16</span></div>
        </div>
        <div class="hero-art" aria-hidden="true"><div class="hero-phone"><div class="hero-phone-top"></div><div class="hero-play">▶</div><div class="hero-lines"><i></i><i></i><i></i></div></div><div class="glow g1"></div><div class="glow g2"></div></div>
      </section>

      <section class="mobile-workspace">
        <section class="setup card">
          <div class="section-head"><div><small>مرحله ۱</small><h2>اطلاعات تبلیغ</h2></div><span class="step-state">شروع سریع</span></div>

          <div class="field"><label>نام برند یا محصول <b>*</b></label><input id="brand" class="input" placeholder="مثلاً: بازارک"></div>
          <div class="field"><label>درباره محصول یا خدمات <b>*</b></label><textarea id="desc" placeholder="چه چیزی می‌فروشی یا چه خدمتی ارائه می‌کنی؟ مزیت اصلی، مخاطب و راه ارتباطی را بنویس..."></textarea><div class="hint">اگر توضیحات کوتاه باشد، AI آن را متناسب با زمان ویدئو حرفه‌ای‌تر می‌کند.</div></div>

          <div class="quick-grid">
            <div class="field"><label>زبان تبلیغ</label><select id="lang">
              <option value="en">English</option><option value="ar">العربية</option><option value="tr">Türkçe</option><option value="ur">اردو</option><option value="hi">हिन्दी</option><option value="fa">فارسی</option><option value="ps">پښتو</option><option value="ru">Русский</option><option value="es">Español</option><option value="fr">Français</option><option value="de">Deutsch</option><option value="id">Bahasa Indonesia</option><option value="uz">O‘zbekcha</option>
            </select></div>
            <div class="field"><label>مدت</label><select id="duration"><option value="15">15 ثانیه</option><option value="30">30 ثانیه</option><option value="45">45 ثانیه</option><option value="60">60 ثانیه</option><option value="90">90 ثانیه</option><option value="120">2 دقیقه</option><option value="180">3 دقیقه</option><option value="240">4 دقیقه</option><option value="300">5 دقیقه</option></select></div>
          </div>

          <div class="field creation-mode-field">
            <div class="creation-mode-head"><label>حالت ساخت تبلیغ</label><span id="selectedBuildMode">حرفه‌ای · تحلیل + AI</span></div>
            <div class="creation-mode-grid">
              <button type="button" class="creation-mode active" data-build-mode="pro">
                <i>🎬</i><span>ساخت حرفه‌ای</span><small>تحلیل رسانه، سناریوی AI، گویندگی و رندر</small><em>توصیه‌شده</em>
              </button>
              <button type="button" class="creation-mode" data-build-mode="fast">
                <i>⚡</i><span>ساخت سریع</span><small>بدون تحلیل عمیق ویدئو؛ سریع‌تر به سناریو و صدا می‌رسد</small><em>سریع</em>
              </button>
              <button type="button" class="creation-mode" data-build-mode="video">
                <i>🔍</i><span>تحلیل هوشمند ویدئو</span><small>صحنه‌ها، متن‌ها و کارهای دیده‌شده را بررسی می‌کند و سناریو می‌سازد</small><em>ویدئو</em>
              </button>
              <button type="button" class="creation-mode" data-build-mode="manual">
                <i>✎</i><span>سناریوی اختصاصی من</span><small>متن کامل سناریو را خودت تعیین می‌کنی؛ AI فقط اجرا و رندر می‌کند</small><em>کنترل کامل</em>
              </button>
              <button type="button" class="creation-mode" data-build-mode="hybrid">
                <i>✦+</i><span>همکاری من + AI</span><small>متن تو حفظ می‌شود و AI آن را حرفه‌ای و متناسب با زمان بازنویسی می‌کند</small><em>هوشمند</em>
              </button>
            </div>
            <div id="buildModeInfo" class="build-mode-info"><strong>🎬 ساخت حرفه‌ای</strong><span>برای تبلیغاتی که می‌خواهی رسانه‌ها و ویدئوی معرفی با دقت تحلیل شوند.</span></div>
            <div id="customScriptWrap" class="custom-script-wrap" hidden><textarea id="customScript" placeholder="سناریوی خودت را اینجا بنویس..."></textarea><small>متن تو حفظ می‌شود؛ در حالت همکاری، AI آن را منسجم‌تر و متناسب با زمان و پلتفرم می‌کند.</small></div>
          </div>

          <div class="field"><div class="platform-title"><label>پلتفرم تبلیغ</label><span id="selectedPlatform">YouTube Shorts · 9:16</span></div><div class="style-grid platform-grid">
            <button type="button" class="style-chip active" data-style="youtube_short"><i>▶</i><span>YouTube Shorts</span></button>
            <button type="button" class="style-chip" data-style="youtube"><i>▶</i><span>YouTube</span></button>
            <button type="button" class="style-chip" data-style="tiktok"><i>♪</i><span>TikTok</span></button>
            <button type="button" class="style-chip" data-style="instagram_reels"><i>◎</i><span>Instagram Reels</span></button>
            <button type="button" class="style-chip" data-style="facebook"><i>f</i><span>Facebook</span></button>
            <button type="button" class="style-chip" data-style="instagram"><i>◎</i><span>Instagram</span></button>
            <button type="button" class="style-chip" data-style="linkedin"><i>in</i><span>LinkedIn</span></button>
            <button type="button" class="style-chip" data-style="whatsapp"><i>◌</i><span>WhatsApp</span></button>
          </div></div>

          <div class="field media-field"><div class="field-title"><label>رسانه‌های تبلیغ</label><span>هر تعداد</span></div><label class="drop"><input id="files" type="file" accept="*/*" multiple><div class="upload-icon">＋</div><strong>عکس و ویدئو را اضافه کن</strong><span>برای بهترین نتیجه، همه تصاویر و کلیپ‌های محصولت را انتخاب کن.</span><small>JPG · PNG · WEBP · HEIC · MP4 · MOV · MKV · WebM و بیشتر</small></label><div id="assets" class="asset-list"></div><div id="videoAnalysisBox" class="video-analysis-box" hidden><div><strong>🎬 تحلیل هوشمند ویدئو</strong><small id="videoAnalysisStatus">ویدئوی معرفی سایت را تحلیل می‌کند و سناریو را دقیقاً بر اساس بخش‌های دیده‌شده می‌سازد.</small></div><button id="videoAnalysisBtn" class="secondary" type="button">تحلیل ویدئو</button></div></div>

          <div class="compact-options">
            <label class="music-drop"><input id="music" type="file" accept="audio/*"><span>♫</span><div><strong>موسیقی پس‌زمینه</strong><small id="musicName">اختیاری</small></div></label>
            <div class="color-row"><input id="brandColor" type="color" value="#7c5cff" aria-label="رنگ برند"><span id="colorHex">#7C5CFF</span></div>
          </div>

          <div class="button-row"><button id="scriptBtn" class="primary big">✦ ساخت سناریوی هوشمند</button><button id="demoBtn" class="secondary demo-btn">نمونه</button></div>
        </section>

        <section class="production card">
          <div class="section-head"><div><small>مرحله ۲</small><h2>ساخت خودکار</h2></div><span id="overallState" class="state-dot">● آماده</span></div>
          <div class="progress-card">
            <div class="progress-top"><div><strong id="progressTitle">آماده شروع</strong><small id="progressText">اطلاعات را وارد کن و ساخت را شروع کن.</small></div><b id="progressPercent">0%</b></div>
            <div class="progress-track"><i id="bar"></i></div>
            <div id="stageGrid" class="stage-grid">${stages.map((s,i)=>`<div class="pipeline-stage ${i===0?"active":""}" data-stage="${i}"><div class="stage-number">${s[0]}</div><div><b>${s[1]}</b><small>${s[2]}</small></div><span class="stage-check">○</span></div>`).join("")}</div>
          </div>

          <details class="script-details"><summary><span>📝 سناریوی تبلیغ</span><em>بیشتر</em></summary><div class="script-panel"><div class="panel-title"><span id="scriptSource">منبع: —</span><div><button id="scriptMore" class="tiny-btn" type="button">بیشتر</button><button id="editScript" class="tiny-btn" disabled>ویرایش</button></div></div><textarea id="scriptEditor" disabled placeholder="سناریوی تبلیغاتی اینجا قرار می‌گیرد..."></textarea><div class="script-meta"><span id="scriptCount">0 کلمه</span><span>برای دیدن کل متن «بیشتر» را بزن</span></div></div></details>

          <details class="ops-details"><summary><span>جزئیات عملیات</span><em>نمایش</em></summary><div class="live-log"><div class="log-head"><span>وضعیت ساخت</span><button id="clearLog" class="tiny-btn">پاک کردن</button></div><div id="log" class="log"><div class="log-line muted"><span>●</span> منتظر شروع پروژه...</div></div></div></details>
        </section>

        <section class="view-switch card">
          <div class="section-head"><div><small>دسته‌ها</small><h2>بخش کاری</h2></div><span id="viewState">استودیو</span></div>
          <div class="view-tabs">
            <button type="button" class="view-tab active" data-view="preview"><span>🎬</span><b>استودیو و پیش‌نمایش</b><small>ساخت، مشاهده و دانلود</small></button>
            <button type="button" class="view-tab" data-view="library"><span>▣</span><b>کتابخانه ویدئوها</b><small>ویدئوهای ساخته‌شده</small></button>
          </div>
          <div class="view-hint">از «دسته‌ها» بخش موردنظر را انتخاب کن؛ هر بار فقط همان بخش نمایش داده می‌شود.</div>
        </section>

        <section class="result card workspace-panel" data-workspace="preview">
          <div class="section-head"><div><small>مرحله ۳</small><h2>پیش‌نمایش و خروجی</h2></div><span id="outputState">آماده ساخت</span></div>
          <div id="stage" class="video-stage"><div class="empty"><div>✦</div><strong>ویدئوی نهایی اینجا نمایش داده می‌شود</strong><small id="stageFormat">خروجی 9:16 با صدا و زیرنویس</small></div></div>
          <div class="output-actions"><button id="renderBtn" class="primary" disabled>▶ ساخت ویدئو</button><button id="downloadBtn" class="secondary" disabled>↓ دانلود</button></div>
          <div id="resultActions" class="result-extra" hidden><button id="rerenderBtn" class="secondary">↻ ساخت دوباره</button><button id="newBtn" class="ghost">＋ پروژه جدید</button></div>
        </section>

        <section class="library card workspace-panel" data-workspace="library" hidden>
          <div class="section-head"><div><small>کتابخانه</small><h2>ویدئوهای ساخته‌شده</h2></div><span id="libraryCount">0 ویدئو</span></div>
          <div id="videoLibrary" class="video-library"><div class="library-empty"><div>▣</div><strong>هنوز ویدئویی ذخیره نشده</strong><small>ویدئوهای ساخته‌شده را اینجا نگه می‌داریم تا بعداً دوباره ببینی، دانلود کنی یا حذف کنی.</small></div></div>
        </section>
      </section>
    </main>
  </div>`;
  setDir();
}
renderShell();

function setProgress(percent, title, text) {
  $("#bar").style.width = `${Math.max(0, Math.min(100, percent))}%`;
  $("#progressPercent").textContent = `${Math.round(percent)}%`;
  $("#progressTitle").textContent = title;
  $("#progressText").textContent = text;
}

function log(message, type = "info") {
  const row = document.createElement("div");
  row.className = `log-line ${type}`;
  row.innerHTML = `<span>${type === "success" ? "✓" : type === "error" ? "!" : "●"}</span><span>${escapeHtml(message)}</span>`;
  $("#log").appendChild(row);
  $("#log").scrollTop = $("#log").scrollHeight;
}

function escapeHtml(v) { return String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }

function setStage(index, status = "active") {
  state.currentStage = index;
  $$(".pipeline-stage").forEach((el, i) => {
    const isCurrent = i === index;
    const isDone = i < index || (isCurrent && status === "done");
    const isError = isCurrent && status === "error";
    el.classList.toggle("active", isCurrent && status !== "done" && status !== "error");
    el.classList.toggle("done", isDone);
    el.classList.toggle("error", isError);
    el.classList.toggle("waiting", i > index);
    el.querySelector(".stage-check").textContent = isError ? "!" : isDone ? "✓" : isCurrent ? "●" : "○";
  });
}

function animateProgress(from, to, durationMs, title, text) {
  const start = performance.now();
  setProgress(from, title, text);
  const timer = setInterval(() => {
    const elapsed = performance.now() - start;
    const ratio = Math.min(1, elapsed / durationMs);
    setProgress(from + (to - from) * ratio, title, text);
    if (ratio >= 1) clearInterval(timer);
  }, 500);
  return () => clearInterval(timer);
}

function resetPipeline() {
  state.currentStage = 0;
  state.generated = false;
  setStage(0);
  setProgress(0, "آماده شروع", "اطلاعاتت را وارد کن و ساخت تبلیغ را شروع کن.");
  $("#overallState").textContent = "● آماده";
  $("#outputState").textContent = "هنوز ساخته نشده";
  $("#resultActions").hidden = true;
}

function updateScriptMeta(script, source) {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  const sourceLabel = ({ user: "سناریوی اختصاصی من", openrouter: "سناریوی هوشمند AI", "cloudflare-ai": "سناریوی هوشمند AI", داخلی: "حالت داخلی AI" })[source] || source || "—";
  $("#scriptCount").textContent = `${words} کلمه`;
  $("#scriptSource").textContent = `منبع: ${sourceLabel}`;
}

function base64ToBlob(b64, mime) {
  const bin = atob(b64); const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return new Blob([a], { type: mime });
}

async function api(path, payload, timeoutMs = 90000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const endpoint = new URL(path, window.location.href).href;
  const requestBody = JSON.stringify(payload ?? {});
  try {
    if (path === "/api/tts") {
      log("در حال ارسال درخواست گویندگی به سرور...", "info");
      if (typeof window.fetch !== "function") throw new Error("مرورگر امکان ارسال درخواست شبکه را در این صفحه فراهم نکرده است.");
    }
    const r = await window.fetch(endpoint, {
      method: "POST",
      mode: "same-origin",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: requestBody,
      signal: controller.signal
    });
    if (path === "/api/tts") log(`درخواست گویندگی ارسال شد؛ پاسخ سرور: HTTP ${r.status}.`, r.ok ? "success" : "error");
    const raw = await r.text();
    if (!r.ok) {
      let message = raw || `API ${r.status}`;
      try {
        const j = JSON.parse(raw);
        message = j?.detail || j?.message || j?.error || message;
      } catch (_) {
        // Cloudflare can return an HTML error page when an upstream request times out.
        if (/^\s*<!doctype html|^\s*<html/i.test(raw)) message = `سرور ساخت گویندگی پاسخ مناسبی نداد (HTTP ${r.status}).`;
      }
      throw new Error(message);
    }
    try { return JSON.parse(raw); }
    catch (_) { throw new Error("پاسخ سرور برای گویندگی قابل خواندن نبود."); }
  } catch (e) {
    if (e?.name === "AbortError") throw new Error("زمان ساخت گویندگی بیش از حد طول کشید؛ دوباره تلاش کن.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const LIB_DB = "ad-maker-ai-library";
const LIB_STORE = "videos";
const libraryObjectUrls = new Set();

function openLibraryDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error("IndexedDB در این مرورگر فعال نیست."));
    const req = indexedDB.open(LIB_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LIB_STORE)) {
        const store = db.createObjectStore(LIB_STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("باز کردن کتابخانه ناموفق بود."));
  });
}

async function saveVideoToLibrary(blob, meta = {}) {
  const db = await openLibraryDB();
  const record = { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, blob, createdAt: Date.now(), ...meta };
  await new Promise((resolve, reject) => {
    const tx = db.transaction(LIB_STORE, "readwrite");
    tx.objectStore(LIB_STORE).put(record);
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error("ذخیره ویدئو ناموفق بود."));
  });
  db.close();
  log("ویدئو در «ویدئوهای ساخته‌شده» ذخیره شد.", "success");
}

async function getLibraryVideos() {
  const db = await openLibraryDB();
  const rows = await new Promise((resolve, reject) => {
    const tx = db.transaction(LIB_STORE, "readonly");
    const req = tx.objectStore(LIB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error || new Error("خواندن کتابخانه ناموفق بود."));
  });
  db.close();
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

async function deleteLibraryVideo(id) {
  const db = await openLibraryDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(LIB_STORE, "readwrite");
    tx.objectStore(LIB_STORE).delete(id);
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error("حذف ویدئو ناموفق بود."));
  });
  db.close();
  await renderVideoLibrary();
}

async function renderVideoLibrary() {
  const wrap = $("#videoLibrary"); if (!wrap) return;
  libraryObjectUrls.forEach(u => URL.revokeObjectURL(u)); libraryObjectUrls.clear();
  try {
    const rows = await getLibraryVideos();
    $("#libraryCount").textContent = `${rows.length} ویدئو`;
    if (!rows.length) {
      wrap.innerHTML = `<div class="library-empty"><div>▣</div><strong>هنوز ویدئویی ذخیره نشده</strong><small>ویدئوهای ساخته‌شده را اینجا نگه می‌داریم تا بعداً دوباره ببینی، دانلود کنی یا حذف کنی.</small></div>`;
      return;
    }
    wrap.innerHTML = rows.map(v => `<article class="library-item" data-id="${escapeHtml(v.id)}"><video playsinline muted preload="metadata"></video><div class="library-info"><strong>${escapeHtml(v.brand || "تبلیغ جدید")}</strong><small>${escapeHtml(platformLabel(v.platform))} · ${escapeHtml(languageLabel(v.language))} · ${new Date(v.createdAt).toLocaleDateString()}</small></div><div class="library-actions"><button class="secondary library-download" type="button">دانلود</button><button class="ghost library-delete" type="button">حذف</button></div></article>`).join("");
    rows.forEach(v => {
      const item = [...wrap.querySelectorAll(".library-item")].find(x => x.dataset.id === v.id); if (!item) return;
      const url = URL.createObjectURL(v.blob); libraryObjectUrls.add(url); item.querySelector("video").src = url;
      item.querySelector(".library-download").onclick = () => downloadBlob(v.blob, `ad-maker-ai-${v.id}.webm`);
      item.querySelector(".library-delete").onclick = async () => { if (confirm("این ویدئو از کتابخانه حذف شود؟")) await deleteLibraryVideo(v.id); };
    });
  } catch (e) {
    $("#libraryCount").textContent = "در دسترس نیست";
    wrap.innerHTML = `<div class="library-empty"><strong>کتابخانه مرورگر در دسترس نیست</strong><small>${escapeHtml(e.message || String(e))}</small></div>`;
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function languageLabel(code) { return ({en:"English",ar:"العربية",tr:"Türkçe",ur:"اردو",hi:"हिन्दी",fa:"فارسی",ps:"پښتو",ru:"Русский",es:"Español",fr:"Français",de:"Deutsch",id:"Bahasa Indonesia",uz:"O‘zbekcha"})[code] || code || "—"; }
function platformLabel(code) { return ({youtube_short:"YouTube Shorts",youtube:"YouTube",tiktok:"TikTok",instagram_reels:"Instagram Reels",facebook:"Facebook",instagram:"Instagram",linkedin:"LinkedIn",whatsapp:"WhatsApp"})[code] || "تبلیغ"; }
function outputRatio(code) { return ({youtube:"16:9",instagram:"1:1",facebook:"4:5",linkedin:"1:1",youtube_short:"9:16",tiktok:"9:16",instagram_reels:"9:16",whatsapp:"9:16"})[code] || "9:16"; }

function formatVideoTime(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return h > 0 ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function isVideoFile(file) {
  const type = String(file?.type || "").toLowerCase();
  if (type.startsWith("video/")) return true;
  return /\.(mp4|mov|m4v|avi|mkv|webm|wmv|flv|mpg|mpeg|3gp)$/i.test(String(file?.name || ""));
}

function updateVideoAnalysisUI() {
  const box = $("#videoAnalysisBox");
  const btn = $("#videoAnalysisBtn");
  const status = $("#videoAnalysisStatus");
  if (!box || !btn || !status) return;
  const hasVideo = state.assets.some(isVideoFile);
  box.hidden = !hasVideo;
  btn.disabled = state.videoAnalysisBusy || !hasVideo;
  btn.textContent = state.videoAnalysisBusy ? "در حال تحلیل…" : state.videoAnalysis ? "تحلیل دوباره" : "تحلیل ویدئو";
  if (state.videoAnalysis) {
    const scenes = Array.isArray(state.videoAnalysis.scenes) ? state.videoAnalysis.scenes.length : 0;
    status.textContent = `تحلیل آماده است؛ ${scenes || "بخش‌های ویدئو"} ویدئو شناسایی شد و سناریو بر اساس محتوای واقعی ساخته می‌شود.`;
  } else {
    status.textContent = "ویدئوی معرفی سایت را تحلیل می‌کند و سناریو را دقیقاً بر اساس بخش‌های دیده‌شده می‌سازد.";
  }
}

async function analyzeUploadedVideo() {
  const video = state.assets.find(isVideoFile);
  if (!video || state.videoAnalysisBusy) return null;
  state.videoAnalysisBusy = true;
  updateVideoAnalysisUI();
  setStage(0);
  setProgress(8, "آماده‌سازی تحلیل", "ویدئوی معرفی برای Gemini آماده می‌شود؛ در صورت خطای سرویس، OpenRouter Free خودکار فعال می‌شود…");
  log("تحلیل هوشمند ویدئوی معرفی شروع شد.", "info");

  const requestJson = async (url, options = {}, timeoutMs = 45000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, cache: "no-store", signal: controller.signal });
      const raw = await response.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch (_) {}
      if (!response.ok) {
        const err = new Error(data.detail || data.message || data.error || `خطای سرور (HTTP ${response.status}).`);
        err.status = response.status;
        err.data = data;
        throw err;
      }
      return data;
    } catch (e) {
      if (e?.name === "AbortError") throw new Error("ارتباط با سرور بیش از حد طول کشید؛ این قطعه دوباره ارسال می‌شود.");
      throw e;
    } finally { clearTimeout(timer); }
  };

  const captureFallbackFrames = async (file, maxFrames = 18) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.muted = true;
    el.playsInline = true;
    el.src = url;
    const waitEvent = (name, timeout = 15000) => new Promise((resolve, reject) => {
      let timer = setTimeout(() => { cleanup(); reject(new Error("بارگذاری فریم ویدئو بیش از حد طول کشید.")); }, timeout);
      const done = () => { cleanup(); resolve(); };
      const fail = () => { cleanup(); reject(new Error("مرورگر نتوانست ویدئو را برای تحلیل فریم‌ها باز کند.")); };
      const cleanup = () => { clearTimeout(timer); el.removeEventListener(name, done); el.removeEventListener("error", fail); };
      el.addEventListener(name, done, { once: true });
      el.addEventListener("error", fail, { once: true });
    });
    const seek = (time) => new Promise((resolve, reject) => {
      let timer = setTimeout(() => { cleanup(); reject(new Error("جابجایی به فریم ویدئو بیش از حد طول کشید.")); }, 12000);
      const done = () => { cleanup(); resolve(); };
      const fail = () => { cleanup(); reject(new Error("خواندن فریم ویدئو ناموفق بود.")); };
      const cleanup = () => { clearTimeout(timer); el.removeEventListener("seeked", done); el.removeEventListener("error", fail); };
      el.addEventListener("seeked", done, { once: true });
      el.addEventListener("error", fail, { once: true });
      try { el.currentTime = Math.max(0, Math.min(time, Math.max(0, (el.duration || 1) - 0.05))); } catch (e) { cleanup(); reject(e); }
    });
    try {
      el.load();
      await waitEvent("loadedmetadata", 20000);
      const duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 60;
      const count = Math.max(8, Math.min(maxFrames, Math.ceil(duration / 20)));
      const canvas = document.createElement("canvas");
      const sourceW = el.videoWidth || 1280;
      const sourceH = el.videoHeight || 720;
      const width = Math.min(560, sourceW);
      const height = Math.max(240, Math.round(width * sourceH / sourceW));
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false });
      const frames = [];
      for (let i = 0; i < count; i += 1) {
        const time = count === 1 ? 0 : Math.min(Math.max(0, duration - 0.15), (duration * i) / (count - 1));
        await seek(time);
        ctx.drawImage(el, 0, 0, width, height);
        const data = canvas.toDataURL("image/jpeg", 0.48);
        frames.push({ time: formatVideoTime(time), data });
      }
      return { frames, duration };
    } finally {
      URL.revokeObjectURL(url);
      el.removeAttribute("src");
      el.load();
    }
  };

  try {
    const size = Number(video.size || 0);
    if (!size) throw new Error("حجم ویدئو معتبر نیست.");
    const mimeType = String(video.type || "video/mp4");
    // IMPORTANT: for small videos use Interactions inline data directly.
    // This completely bypasses the Files API URI and avoids the blob:// URI
    // failure that can occur on some Gemini accounts/regions. Google documents
    // inline video as the preferred path for small one-off clips.
    let fileInfo = null;
    let fileName = "";
    let geminiPreparationFailed = false;
    if (size <= 20 * 1024 * 1024) {
      setProgress(18, "آماده‌سازی ویدئو", "ویدئوی کوتاه برای Gemini آماده می‌شود…");
      log(`ویدئو ${(size / 1024 / 1024).toFixed(1)}MB است؛ مسیر مستقیم Interactions فعال شد تا خطای blob:// ایجاد نشود.`, "info");
    } else if (size <= 95 * 1024 * 1024) {
      setProgress(15, "ارسال ویدئو", "ویدئو به Files API Gemini ارسال می‌شود…");
      log(`ویدئو ${(size / 1024 / 1024).toFixed(1)}MB است؛ مسیر Files API فعال شد.`);
      const form = new FormData();
      form.append("video", video, video.name || "site-demo.mp4");
      setProgress(22, "ارسال ویدئو", "در حال ارسال فایل به Gemini…");
      try {
        fileInfo = await requestJson(`${window.location.origin}/api/analyze-video/upload`, {
          method: "POST",
          body: form
        }, 180000);
        setProgress(50, "ارسال ویدئو", "آپلود ویدئو به Gemini کامل شد.");
        log("مرحله ۱: ویدئو کامل به Gemini ارسال و ثبت شد.", "success");
        fileName = fileInfo?.fileName || "";
        if (!fileName) throw new Error("Gemini فایل نهایی را ثبت نکرد.");
      } catch (prepError) {
        geminiPreparationFailed = true;
        log(`Gemini نتوانست فایل بزرگ را آماده کند؛ مسیر OpenRouter Free فعال خواهد شد. ${String(prepError?.message || prepError)}`, "warning");
      }
    } else {
      throw new Error("این ویدئو بیشتر از 95MB است. برای تحلیل در این نسخه، لطفاً ویدئو را کمی فشرده‌تر کن و دوباره انتخاب کن.");
    }

    let formStart = null;
    if (size > 20 * 1024 * 1024) {
      let fileState = String(fileInfo?.state || "PROCESSING").toUpperCase();
      let fileInfoCurrent = fileInfo;
      let polls = 0;
      while (fileState !== "ACTIVE") {
        if (fileState === "FAILED") throw new Error(fileInfoCurrent?.detail || "Gemini نتوانست فایل ویدئو را پردازش کند.");
        polls += 1;
        const percent = Math.min(58, 50 + Math.min(8, polls));
        setProgress(percent, "پردازش ویدئو", `Gemini در حال آماده‌سازی ویدئو است… وضعیت: ${fileState}`);
        if (polls === 1) log("آپلود کامل شد؛ Gemini در حال پردازش ویدئو است.", "success");
        await wait(3500);
        fileInfoCurrent = await requestJson(`${window.location.origin}/api/analyze-video/file-status?name=${encodeURIComponent(fileName)}`, {}, 45000);
        fileState = String(fileInfoCurrent.state || "PROCESSING").toUpperCase();
        if (polls > 90) throw new Error("پردازش فایل در Gemini بیش از حد طول کشید. ویدئوی کوتاه‌تر یا کم‌حجم‌تر امتحان کن.");
      }

      setProgress(60, "شروع تحلیل هوشمند", "ویدئو آماده شد؛ تحلیل پس‌زمینه Gemini شروع می‌شود…");
      log("مرحله ۲: فایل آماده شد؛ تحلیل پس‌زمینه شروع می‌شود.", "success");
      formStart = {
        fileName: fileInfoCurrent.fileName || fileName,
        fileUri: fileInfoCurrent.fileUri || fileInfo.fileUri,
        mimeType: fileInfoCurrent.mimeType || fileInfo.mimeType || mimeType,
        brand: $("#brand")?.value.trim() || "",
        description: $("#desc")?.value.trim() || "",
        language: state.language,
        duration: String(state.duration),
        platform: platformLabel(state.platform)
      };
    } else {
      setProgress(60, "شروع تحلیل هوشمند", "ویدئو آماده است؛ تحلیل مستقیم Gemini شروع می‌شود…");
      log("مرحله ۲: مسیر مستقیم ویدئو آماده شد؛ بدون URI فایل Gemini تحلیل شروع می‌شود.", "success");
    }

    setProgress(68, "تحلیل محتوای ویدئو", "Gemini در حال بررسی واقعی صحنه‌ها، نوشته‌های صفحه و قابلیت‌های نمایش‌داده‌شده است…");
    log("مرحله ۳: تحلیل واقعی ویدئو با Gemini Interactions و اجرای پس‌زمینه شروع شد.");
    const failedModels = new Set();
    const maxFallbacks = geminiPreparationFailed ? 0 : 2;
    const startInteraction = async () => {
      if (size <= 20 * 1024 * 1024) {
        const inlineForm = new FormData();
        inlineForm.append("video", video, video.name || "site-demo.mp4");
        inlineForm.append("brand", $("#brand")?.value.trim() || "");
        inlineForm.append("description", $("#desc")?.value.trim() || "");
        inlineForm.append("language", state.language);
        inlineForm.append("duration", String(state.duration));
        inlineForm.append("platform", platformLabel(state.platform));
        inlineForm.append("excludeModels", JSON.stringify([...failedModels]));
        return requestJson(`${window.location.origin}/api/analyze-video/start-inline`, { method: "POST", body: inlineForm }, 120000);
      }
      return requestJson(`${window.location.origin}/api/analyze-video/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formStart, excludeModels: [...failedModels] })
      }, 60000);
    };

    let resultPayload = null;
    let completed = false;
    let lastFailure = null;
    for (let attempt = 1; attempt <= maxFallbacks && !completed; attempt += 1) {
      try {
        setProgress(68, "تحلیل محتوای ویدئو", attempt === 1
          ? "Gemini در حال بررسی واقعی ویدئو است…"
          : `مدل قبلی پاسخ نداد؛ مدل جایگزین ${attempt - 1} در حال شروع است…`);
        if (attempt > 1) log(`مدل قبلی Gemini با ظرفیت کافی پاسخ نداد؛ تلاش خودکار ${attempt - 1} از ${maxFallbacks - 1} با مدل بعدی شروع شد.`, "info");
        const started = await startInteraction();
        if (started?.status === "completed" && started?.analysis) {
          resultPayload = started;
          completed = true;
          break;
        }
        const interactionId = String(started?.interactionId || started?.id || "");
        if (!interactionId) throw new Error(started?.detail || "Gemini شناسه عملیات تحلیل را برنگرداند.");
        const activeModel = String(started?.model || "");
        log(`تحلیل پس‌زمینه Gemini شروع شد${activeModel ? ` با ${activeModel}` : ""}.`, "success");

        for (let poll = 1; poll <= 120; poll += 1) {
          await wait(poll === 1 ? 2500 : 3000);
          let status;
          try {
            status = await requestJson(`${window.location.origin}/api/analyze-video/interaction-status?id=${encodeURIComponent(interactionId)}`, {}, 45000);
          } catch (statusError) {
            const info = statusError?.data || {};
            const retryable = Boolean(info.retryable) || statusError?.status === 503 || /high demand|rate limit|resource exhausted|quota|capacity|unavailable|temporar/i.test(String(statusError?.message || ""));
            if (retryable && attempt < maxFallbacks) {
              const failedModel = String(info.failedModel || activeModel || "");
              if (failedModel) failedModels.add(failedModel);
              lastFailure = statusError;
              log(`Gemini این تلاش را به‌دلیل ظرفیت/High Demand متوقف کرد${failedModel ? ` (${failedModel})` : ""}. تلاش بعدی خودکار انجام می‌شود.`, "warning");
              break;
            }
            lastFailure = statusError;
            break;
          }
          const st = String(status?.status || "in_progress").toLowerCase();
          if (status?.status === "completed" && status?.analysis) {
            resultPayload = status;
            completed = true;
            break;
          }
          if (["failed", "cancelled", "incomplete", "budget_exceeded"].includes(st)) {
            const retryable = Boolean(status?.retryable);
            if (retryable && attempt < maxFallbacks) {
              const failedModel = String(status?.failedModel || activeModel || "");
              if (failedModel) failedModels.add(failedModel);
              lastFailure = new Error(status?.detail || `تحلیل Gemini با وضعیت ${st} پایان یافت.`);
              log(`Gemini این تلاش را به‌دلیل ظرفیت/High Demand متوقف کرد${failedModel ? ` (${failedModel})` : ""}. تلاش بعدی خودکار انجام می‌شود.`, "warning");
              break;
            }
            lastFailure = new Error(status?.detail || `تحلیل Gemini با وضعیت ${st} پایان یافت.`);
            break;
          }
          const percent = Math.min(88, 68 + Math.round((poll / 120) * 18));
          setProgress(percent, "تحلیل محتوای ویدئو", `Gemini در حال بررسی ویدئو است… وضعیت: ${st === "queued" ? "در صف" : "در حال پردازش"}`);
          if (poll === 1 || poll % 10 === 0) log(`تحلیل Gemini هنوز در حال انجام است… (${Math.round(poll * 3 / 60)} دقیقه)`, "info");
        }
      } catch (e) {
        const info = e?.data || {};
        const retryable = Boolean(info.retryable) || e?.status === 503 || /high demand|rate limit|resource exhausted|quota|capacity|unavailable|temporar/i.test(String(e?.message || ""));
        if (retryable && attempt < maxFallbacks) {
          const failedModel = String(info.failedModel || "");
          if (failedModel) failedModels.add(failedModel);
          lastFailure = e;
          log(`خطای موقت ظرفیت Gemini دریافت شد؛ تلاش بعدی خودکار انجام می‌شود${failedModel ? ` (${failedModel})` : ""}.`, "warning");
          await wait(1200);
          continue;
        }
        lastFailure = e;
        break;
      }
    }
    if (!completed || !resultPayload) {
      setProgress(72, "موتور جایگزین", "Gemini در دسترس نبود؛ موتور رایگان چندمدلی OpenRouter در حال آماده‌سازی است…");
      log("Gemini نتوانست تحلیل را کامل کند؛ OpenRouter Free با چند مدل چندرسانه‌ای و Failover خودکار فعال شد.", "warning");
      try {
        const captured = await captureFallbackFrames(video, 12);
        setProgress(76, "موتور جایگزین", `${captured.frames.length} فریم سبک‌شده آماده شد؛ OpenRouter در حال انتخاب خودکار مدل رایگان مناسب است…`);
        log(`برای OpenRouter ${captured.frames.length} فریم کلیدی سبک‌شده از ویدئو استخراج شد.`, "info");
        const fallbackPayload = await requestJson(`${window.location.origin}/api/analyze-video/openrouter-fallback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frames: captured.frames,
            brand: $("#brand")?.value.trim() || "",
            description: $("#desc")?.value.trim() || "",
            language: state.language,
            duration: String(state.duration),
            platform: platformLabel(state.platform)
          })
        }, 180000);
        if (fallbackPayload?.status === "completed" && fallbackPayload?.script) {
          resultPayload = { ...fallbackPayload, analysis: { summary: fallbackPayload.summary || "", facts: fallbackPayload.facts || [], scenes: fallbackPayload.scenes || [], script: fallbackPayload.script } };
          completed = true;
          log(`OpenRouter Free تحلیل را کامل کرد${fallbackPayload.model ? ` با ${fallbackPayload.model}` : ""}.`, "success");
        } else {
          throw new Error(fallbackPayload?.detail || "OpenRouter پاسخ قابل استفاده برنگرداند.");
        }
      } catch (fallbackError) {
        const base = lastFailure?.message ? `Gemini: ${lastFailure.message}` : "Gemini تحلیل را کامل نکرد.";
        const second = String(fallbackError?.message || fallbackError);
        throw new Error(`${base} | OpenRouter Free: ${second}`);
      }
    }
    setProgress(92, "تحلیل محتوای ویدئو", "تحلیل صحنه‌ها کامل شد؛ در حال آماده‌سازی سناریو…");
    const result = resultPayload.analysis;

    state.videoAnalysis = result;
    updateVideoAnalysisUI();
    if (result.script) {
      state.script = result.script.trim();
      $("#scriptEditor").value = state.script;
      $("#scriptEditor").disabled = false;
      $("#editScript").disabled = false;
      updateScriptMeta(state.script, "تحلیل ویدئو");
    }
    const scenes = Array.isArray(result.scenes) ? result.scenes : [];
    if (scenes.length) {
      log(`تحلیل ویدئو کامل شد: ${scenes.length} بخش مهم شناسایی شد.`, "success");
      scenes.slice(0, 8).forEach((scene, i) => log(`${String(i + 1).padStart(2, "0")} · ${scene.start || ""}${scene.end ? `–${scene.end}` : ""} · ${scene.title || scene.description || "بخش ویدئو"}`));
    } else log("تحلیل ویدئو کامل شد و سناریوی مبتنی بر محتوای واقعی آماده است.", "success");
    // Video analysis belongs to stage 1 (information/media preparation).
    // Mark it complete before the script stage starts so the UI never shows
    // a misleading 42% with stage 01 still active.
    setStage(0, "done");
    setStage(1, "active");
    setProgress(18, "سناریو", "تحلیل ویدئو کامل شد؛ حالا سناریو آماده است.");
    return result;
  } catch (e) {
    const detail = String(e?.message || e);
    state.videoAnalysis = null;
    updateVideoAnalysisUI();
    // Never leave the pipeline visually stuck on the active information stage.
    // A quota/provider failure is a terminal state for this attempt.
    setStage(0, "error");
    setProgress(68, "تحلیل متوقف شد", detail.includes("سهمیه روزانه") || detail.includes("daily quota")
      ? "سهمیه روزانه Gemini تمام شده است؛ بعد از بازنشانی سهمیه دوباره تلاش کن."
      : detail);
    log(`تحلیل ویدئو انجام نشد: ${detail}`, "error");
    throw new Error(detail);
  } finally {
    state.videoAnalysisBusy = false;
    updateVideoAnalysisUI();
  }
}

function fallbackScript(brand, desc) {
  if ((state.scriptMode === "manual" || state.scriptMode === "hybrid") && state.customScript) return state.customScript;
  if (state.language === "en") return `${brand}. ${desc}. Discover a simpler way to get what you need. Try ${brand} today and take the next step.`;
  if (state.language === "ps") return `${brand}. ${desc}. د خپلو اړتیاوو لپاره اسانه لاره پیدا کړئ. ${brand} همدا اوس تجربه کړئ او خپل بل ګام واخلئ.`;
  return `${brand}. ${desc}. راهی ساده برای رسیدن به نیازت پیدا کن. همین امروز ${brand} را تجربه کن و قدم بعدی را بردار.`;
}

function assetPreview() {
  const wrap = $("#assets"); wrap.innerHTML = "";
  if (!state.assets.length) { wrap.innerHTML = `<span class="asset-empty">هنوز فایلی اضافه نشده</span>`; return; }
  state.assets.forEach((f, i) => {
    const item = document.createElement("div"); item.className = "asset-item";
    if (f.type.startsWith("image/")) {
      const img = document.createElement("img"); img.src = URL.createObjectURL(f); item.appendChild(img);
    } else { item.innerHTML = `<div class="video-thumb">▶</div>`; }
    item.insertAdjacentHTML("beforeend", `<span>${i + 1}</span><button type="button" aria-label="حذف">×</button>`);
    item.querySelector("button").onclick = () => { state.assets.splice(i, 1); assetPreview(); };
    wrap.appendChild(item);
  });
}

$("#files").onchange = e => {
  state.assets = [...e.target.files];
  state.videoAnalysis = null;
  assetPreview();
  renderVideoLibrary();
  updateVideoAnalysisUI();
  log(`${state.assets.length} فایل انتخاب شد؛ فرمت هر فایل هنگام ساخت به‌صورت خودکار بررسی و در صورت نیاز تبدیل می‌شود.`, "success");
};

$("#videoAnalysisBtn").onclick = async () => {
  if (state.busy) return;
  try { await analyzeUploadedVideo(); } catch (_) {}
};
$("#music").onchange = e => { const f = e.target.files[0]; $("#musicName").textContent = f ? f.name : "اختیاری"; };
$("#lang").onchange = e => { state.language = e.target.value; setDir(); $("#brand").placeholder = t("brandPlaceholder"); $("#desc").placeholder = t("descPlaceholder"); };
$("#duration").onchange = e => state.duration = +e.target.value;
$("#brandColor").oninput = e => { state.brandColor = e.target.value; $("#colorHex").textContent = e.target.value.toUpperCase(); document.documentElement.style.setProperty("--brand", e.target.value); };

function updatePlatformUI() {
  const label = platformLabel(state.platform);
  const ratio = outputRatio(state.platform);
  $$(".style-chip[data-style]").forEach(x => x.classList.toggle("active", x.dataset.style === state.platform));
  $("#selectedPlatform").textContent = `${label} · ${ratio}`;
  $("#stageFormat").textContent = `خروجی ${ratio} با صدا و زیرنویس`;
}

function buildModeLabel(mode) {
  return ({ pro: "ساخت حرفه‌ای", fast: "ساخت سریع", video: "تحلیل هوشمند ویدئو", manual: "سناریوی اختصاصی من", hybrid: "همکاری من + AI" })[mode] || "ساخت حرفه‌ای";
}

function updateBuildModeUI() {
  const meta = {
    pro: { title: "🎬 ساخت حرفه‌ای", summary: "برای تبلیغاتی که می‌خواهی رسانه‌ها و ویدئوی معرفی با دقت تحلیل شوند.", selected: "حرفه‌ای · تحلیل + AI", button: "✦ ساخت تبلیغ حرفه‌ای" },
    fast: { title: "⚡ ساخت سریع", summary: "تحلیل عمیق ویدئو حذف می‌شود تا سریع‌تر به سناریو، گویندگی و خروجی برسی.", selected: "سریع · کمترین انتظار", button: "⚡ ساخت سریع تبلیغ" },
    video: { title: "🔍 تحلیل هوشمند ویدئو", summary: "ویدئوی معرفی با Gemini بررسی می‌شود و سناریو بر اساس صحنه‌ها و قابلیت‌های واقعی ساخته می‌شود.", selected: "ویدئو · تحلیل Gemini", button: "🔍 تحلیل و ساخت تبلیغ" },
    manual: { title: "✎ سناریوی اختصاصی من", summary: "سناریو کاملاً از متن تو می‌آید؛ هیچ بازنویسی AI روی متن اصلی انجام نمی‌شود.", selected: "اختصاصی · کنترل کامل", button: "✎ ساخت از سناریوی من" },
    hybrid: { title: "✦+ همکاری من + AI", summary: "پیش‌نویس تو حفظ می‌شود و AI آن را حرفه‌ای، منسجم و متناسب با زمان و پلتفرم می‌کند.", selected: "همکاری · تو + AI", button: "✦+ پرداخت سناریو با AI" }
  }[state.buildMode] || null;
  if (!meta) return;
  const selected = $("#selectedBuildMode");
  const info = $("#buildModeInfo");
  const btn = $("#scriptBtn");
  const custom = $("#customScriptWrap");
  if (selected) selected.textContent = meta.selected;
  if (info) info.innerHTML = `<strong>${escapeHtml(meta.title)}</strong><span>${escapeHtml(meta.summary)}</span>`;
  if (btn) btn.textContent = meta.button;
  if (custom) custom.hidden = !["manual", "hybrid"].includes(state.buildMode);
}

function bindChoiceControls() {
  // Bind directly to each button. This is intentionally not delegated from document:
  // on some Android WebViews/browsers a delegated click can be swallowed when cards
  // contain nested text/inline elements. Direct handlers make every choice reliable.
  $$(".style-chip[data-style]").forEach(button => {
    button.type = "button";
    button.setAttribute("aria-pressed", button.dataset.style === state.platform ? "true" : "false");
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.style = button.dataset.style;
      state.platform = button.dataset.style;
      updatePlatformUI();
      $$(".style-chip[data-style]").forEach(x => x.setAttribute("aria-pressed", x === button ? "true" : "false"));
      log(`پلتفرم خروجی روی «${platformLabel(state.platform)}» تنظیم شد.`, "success");
    };
  });

  $$(".creation-mode[data-build-mode]").forEach(button => {
    button.type = "button";
    const active = button.dataset.buildMode === state.buildMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.buildMode = button.dataset.buildMode;
      const mode = state.buildMode;
      state.scriptMode = mode === "manual" ? "manual" : mode === "hybrid" ? "hybrid" : "ai";
      $$(".creation-mode[data-build-mode]").forEach(x => {
        const isActive = x.dataset.buildMode === mode;
        x.classList.toggle("active", isActive);
        x.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      updateBuildModeUI();
      log(`حالت ساخت روی «${buildModeLabel(mode)}» تنظیم شد.`, "success");
    };
  });

  $$(".view-tab[data-view]").forEach(button => {
    button.type = "button";
    button.setAttribute("aria-pressed", button.dataset.view === state.activeView ? "true" : "false");
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.activeView = button.dataset.view;
      $$(".view-tab[data-view]").forEach(x => {
        const active = x === button;
        x.classList.toggle("active", active);
        x.setAttribute("aria-pressed", active ? "true" : "false");
      });
      $$(".workspace-panel[data-workspace]").forEach(x => {
        x.hidden = x.dataset.workspace !== state.activeView;
      });
      const stateLabel = $("#viewState");
      if (stateLabel) stateLabel.textContent = state.activeView === "library" ? "کتابخانه" : "استودیو";
      if (state.activeView === "library") renderVideoLibrary();
      const target = document.querySelector(`[data-workspace="${state.activeView}"]`);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    };
  });
}

bindChoiceControls();
updateBuildModeUI();
updatePlatformUI();
updateVideoAnalysisUI();

$("#demoBtn").onclick = () => {
  $("#brand").value = "بازارک";
  $("#desc").value = "بازارک یک بازار آنلاین برای خرید و فروش کالا، خدمات و آگهی‌ها در افغانستان است. کاربران می‌توانند آگهی ثبت کنند، محصولات مورد نیازشان را پیدا کنند و با فروشنده ارتباط بگیرند.";
  state.language = "fa"; $("#lang").value = "fa"; setDir();
  log("نمونه واقعی بازارک برای شروع سریع وارد شد.", "success");
  setProgress(5, "نمونه آماده است", "حالا روی «ساخت تبلیغ با AI» بزن.");
};

$("#scriptBtn").onclick = async () => {
  if (state.busy) return;
  const brand = $("#brand").value.trim(), desc = $("#desc").value.trim();
  const customScript = $("#customScript").value.trim();
  state.customScript = customScript;
  if (!brand || (state.scriptMode !== "manual" && !desc) || ((state.scriptMode === "manual" || state.scriptMode === "hybrid") && !customScript)) {
    const msg = state.scriptMode === "manual" ? "نام برند و متن سناریوی اختصاصی را وارد کن." : state.scriptMode === "hybrid" ? "نام برند، توضیح محصول و متن سناریوی خودت را وارد کن." : t("missing");
    setProgress(0, "اطلاعات ناقص", msg); log(msg, "error"); return;
  }
  state.busy = true; state.generated = false; $("#scriptBtn").disabled = true; $("#renderBtn").disabled = true; $("#downloadBtn").disabled = true;
  $("#resultActions").hidden = true; $("#scriptEditor").disabled = true; $("#editScript").disabled = true;
  $("#log").innerHTML = ""; $("#stage").innerHTML = `<div class="processing"><div class="spinner"></div><strong>در حال آماده‌سازی پروژه...</strong><small>این صفحه در طول کار وضعیت واقعی هر مرحله را نشان می‌دهد.</small></div>`;
  $("#overallState").textContent = "● در حال تولید";

  try {
    setStage(0); setProgress(8, "اطلاعات", t("analyze")); log(`شروع پروژه «${brand}» با ${state.assets.length} رسانه.`); await wait(250);
    if (state.assets.length) log(t("mediaReady"), "success"); else log(t("noMedia"));

    let videoAnalysis = state.videoAnalysis;
    const shouldAnalyzeVideo = state.buildMode === "pro" || state.buildMode === "video";
    if (shouldAnalyzeVideo && state.assets.some(isVideoFile) && state.scriptMode !== "manual" && !videoAnalysis) {
      try { videoAnalysis = await analyzeUploadedVideo(); }
      catch (_) { log("تحلیل ویدئو در دسترس نبود؛ سناریو با اطلاعات متنی ادامه پیدا می‌کند.", "info"); }
    }
    if (state.buildMode === "video" && !state.assets.some(isVideoFile)) {
      log("حالت تحلیل ویدئو انتخاب شده اما ویدئویی اضافه نشده است؛ سناریو با اطلاعات متنی ادامه پیدا می‌کند.", "info");
    }
    if (state.buildMode === "fast") {
      log("حالت ساخت سریع فعال است؛ تحلیل عمیق ویدئو برای کاهش زمان انتظار رد شد.", "info");
    }
    // Stage 01 is now genuinely complete before stage 02 becomes active.
    setStage(0, "done");
    setStage(1); setProgress(22, "سناریو", state.scriptMode === "manual" ? "سناریوی اختصاصی تو آماده می‌شود." : state.scriptMode === "hybrid" ? "AI سناریوی تو را حرفه‌ای‌تر و منسجم‌تر می‌کند." : t("script"));
    let j;
    if (state.scriptMode === "manual") {
      j = { script: customScript, fallback: false, provider: "user" };
      log("سناریوی اختصاصی کاربر انتخاب شد.", "success");
    } else try {
      j = await api("/api/generate-script", { brand, description: desc, customScript: state.scriptMode === "hybrid" ? customScript : "", scriptMode: state.scriptMode, language: state.language, duration: state.duration, style: state.style, targetWords: targetWordsForDuration(state.duration), videoAnalysis: videoAnalysis ? { summary: videoAnalysis.summary || "", scenes: videoAnalysis.scenes || [], facts: videoAnalysis.facts || [], recommendedScript: videoAnalysis.script || "" } : null });
      if (j.fallback) {
        const reason = j.detail || j.error || "خطای نامشخص";
        log(`API سناریو پاسخ کامل نداد؛ حالت داخلی فعال شد. علت: ${reason}`, "error");
        if (j.error === "no_ai_provider_configured" || j.error === "openrouter_missing_api_key") {
          log("کلید OPENROUTER_API_KEY در محیط Production این پروژه در دسترس Worker نیست. بعد از تنظیم Secret حتماً Deploy جدید انجام بده.", "error");
        }
      }
    } catch (e) {
      let reason = String(e?.message || e);
      try { const parsed = JSON.parse(reason); reason = parsed.detail || parsed.error || reason; } catch (_) {}
      log(`اتصال به API سناریو ناموفق بود؛ حالت داخلی فعال شد. علت: ${reason}`, "error");
      j = { script: fallbackScript(brand, desc), fallback: true, provider: "local", error: "frontend_api_error" };
    }
    state.script = j.script || fallbackScript(brand, desc);
    $("#scriptEditor").value = state.script; $("#scriptEditor").disabled = false; $("#editScript").disabled = false;
    updateScriptMeta(state.script, j.provider || (j.fallback ? "داخلی" : "AI"));
    const expectedWords = targetWordsForDuration(state.duration);
    const actualWords = state.script.trim().split(/\s+/).filter(Boolean).length;
    log(`${actualWords} کلمه برای ویدئوی ${Math.round(state.duration / 60) >= 1 ? `${Math.round(state.duration / 60)} دقیقه` : `${state.duration} ثانیه`} آماده شد؛ هدف تقریبی ${expectedWords} کلمه است.`, actualWords >= Math.round(expectedWords * 0.72) ? "success" : "info");
    log(state.scriptMode === "manual" ? "سناریوی اختصاصی آماده شد." : state.scriptMode === "hybrid" ? "سناریو با همکاری کاربر و AI آماده شد." : (j.fallback ? t("fallback") : "سناریوی هوشمند با موفقیت دریافت شد."), j.fallback ? "info" : "success");
    setStage(1, "done");
    setProgress(40, "سناریو آماده", "سناریو کامل شد؛ مرحله گویندگی شروع می‌شود.");
    log("مرحله سناریو با موفقیت کامل شد و تیک خورد.", "success");

    setStage(2);
    const stopVoiceProgress = animateProgress(42, 50, 120000, "گویندگی", t("voice"));
    log("مرحله گویندگی شروع شد؛ در حال دریافت صدای AI از ElevenLabs...");
    const voice = await getVoice();
    stopVoiceProgress();
    if (!voice) {
      setStage(2, "error");
      setProgress(50, "گویندگی ناموفق بود", "برای ساخت ویدئوی دارای صدا، اتصال ElevenLabs را بررسی کن و دوباره ساخت تبلیغ را بزن.");
      $("#renderBtn").disabled = true;
      state.generated = false;
      $("#overallState").textContent = "● نیاز به بازسازی گویندگی";
      log("ویدئو بدون گویندگی ساخته نمی‌شود تا خروجی بی‌صدا تحویل نشود.", "error");
      return;
    }
    setStage(2, "done"); setProgress(52, "گویندگی آماده", t("voiceReady")); log(t("voiceReady"), "success");

    setStage(3); setProgress(55, "صحنه‌ها", "رسانه‌ها، متن و رنگ برند برای ویدئو چیده می‌شوند..."); log("مرحله صحنه‌ها شروع شد."); await wait(350); setStage(3, "done");
    setProgress(62, "صحنه‌ها آماده", "سناریو، گویندگی و صحنه‌بندی کامل شد؛ آماده رندر نهایی.");
    $("#renderBtn").disabled = false; state.generated = true; $("#overallState").textContent = "● آماده رندر با صدا"; log("پروژه برای رندر نهایی آماده است.", "success");
  } finally { state.busy = false; $("#scriptBtn").disabled = false; }
};

async function getVoice() {
  if ($("#voiceState")) $("#voiceState").textContent = "در حال ساخت";
  if ($("#voiceDetail")) $("#voiceDetail").textContent = "در حال اتصال به ElevenLabs…";
  state.voiceBlob = null;
  state.voiceMode = "none";

  try {
    const text = String(state.script || "").trim();
    if (!text) throw new Error("متن سناریو خالی است.");

    // TTS gets its own request path. Do not pass it through the generic API helper:
    // this guarantees that the browser reaches /api/tts immediately after stage 2.
    await new Promise(resolve => setTimeout(resolve, 0));
    const endpoint = `${window.location.origin}/api/tts`;
    const payload = JSON.stringify({ text, language: state.language });
    log(`ارسال مستقیم درخواست گویندگی به ${endpoint}`, "info");

    if (typeof window.fetch !== "function") {
      throw new Error("fetch در مرورگر در دسترس نیست.");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    let response;
    try {
      response = await window.fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: payload,
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

    log(`درخواست /api/tts به سرور رسید؛ HTTP ${response.status}.`, response.ok ? "success" : "error");
    const raw = await response.text();
    let j = null;
    try { j = raw ? JSON.parse(raw) : {}; } catch (_) {
      throw new Error(`پاسخ /api/tts قابل خواندن نیست (HTTP ${response.status}).`);
    }
    if (!response.ok) {
      throw new Error(j?.detail || j?.message || j?.error || `خطای گویندگی: HTTP ${response.status}`);
    }

    let blob = null;
    if (j.audio) {
      blob = base64ToBlob(j.audio, j.mime || "audio/mpeg");
    } else if (Array.isArray(j.audioParts) && j.audioParts.length) {
      log(`گویندگی به ${j.audioParts.length} بخش ساخته شد؛ در حال اتصال بخش‌های صدا...`, "info");
      blob = await mergeAudioParts(j.audioParts, j.mime || "audio/mpeg");
    }

    if (blob?.size) {
      state.voiceBlob = blob;
      state.voiceMode = "elevenlabs";
      if ($("#voiceState")) $("#voiceState").textContent = "گویندگی AI";
      if ($("#voiceDetail")) $("#voiceDetail").textContent = `${j.model === "eleven_v3" ? "Eleven v3" : j.model === "eleven_flash_v2_5" ? "Eleven Flash v2.5" : "Eleven Multilingual v2"} · ${languageLabel(state.language)} ✓`;
      log(`گویندگی با موفقیت آماده شد${j.chunks > 1 ? ` (${j.chunks} بخش)` : ""}.`, "success");
      return blob;
    }
    throw new Error(j?.detail || j?.error || "سرور گویندگی فایل صوتی برنگرداند.");
  } catch (e) {
    const detail = e?.name === "AbortError"
      ? "درخواست گویندگی بعد از ۹۰ ثانیه پاسخ نداد."
      : String(e?.message || e || "خطای نامشخص");
    log(`گویندگی ساخته نشد: ${detail}`, "error");
  }

  if ($("#voiceState")) $("#voiceState").textContent = "گویندگی آماده نیست";
  if ($("#voiceDetail")) $("#voiceDetail").textContent = "خروجی بی‌صدا مجاز نیست";
  return null;
}
async function mergeAudioParts(parts, mime = "audio/mpeg") {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) throw new Error("مرورگر صوت را پشتیبانی نمی‌کند.");
  const ctx = new AC();
  try {
    const decoded = [];
    for (const part of parts) {
      const blob = base64ToBlob(part, mime);
      const buffer = await blob.arrayBuffer();
      decoded.push(await ctx.decodeAudioData(buffer.slice(0)));
    }
    const channels = Math.max(1, ...decoded.map(x => x.numberOfChannels));
    const sampleRate = decoded[0]?.sampleRate || 44100;
    const totalLength = decoded.reduce((sum, x) => sum + Math.ceil(x.length * sampleRate / x.sampleRate), 0);
    const merged = ctx.createBuffer(channels, totalLength, sampleRate);
    let offset = 0;
    for (const src of decoded) {
      const ratio = sampleRate / src.sampleRate;
      const len = Math.ceil(src.length * ratio);
      for (let ch = 0; ch < channels; ch++) {
        const out = merged.getChannelData(ch);
        if (src.numberOfChannels === 1) {
          const mono = src.getChannelData(0);
          for (let i = 0; i < len; i++) out[offset + i] = mono[Math.min(mono.length - 1, Math.floor(i / ratio))] || 0;
        } else {
          const input = src.getChannelData(Math.min(ch, src.numberOfChannels - 1));
          for (let i = 0; i < len; i++) out[offset + i] = input[Math.min(input.length - 1, Math.floor(i / ratio))] || 0;
        }
      }
      offset += len;
    }
    return audioBufferToWav(merged);
  } finally {
    try { await ctx.close(); } catch (_) {}
  }
}

function audioBufferToWav(buffer) {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const frames = buffer.length;
  const bytesPerSample = 2;
  const dataSize = frames * channels * bytesPerSample;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);
  const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  write(0, "RIFF"); view.setUint32(4, 36 + dataSize, true); write(8, "WAVE");
  write(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, channels, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true); view.setUint16(34, 16, true);
  write(36, "data"); view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let ch = 0; ch < channels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i] || 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([out], { type: "audio/wav" });
}

$("#renderBtn").onclick = async () => {
  if (!state.script || state.busy) return;
  state.busy = true; $("#renderBtn").disabled = true; $("#downloadBtn").disabled = true; $("#resultActions").hidden = true;
  try {
    setStage(4); setProgress(66, "رندر ویدئو", t("render")); log("رندر فریم‌ها شروع شد.");
    state.lastVideo = await renderVideo(state.voiceBlob);
    await saveVideoToLibrary(state.lastVideo, { brand: brandText(), platform: state.platform, language: state.language, duration: Math.round(state.duration) }).catch(e => log(`ذخیره در کتابخانه انجام نشد: ${e.message || e}`, "info"));
    await renderVideoLibrary();
    const previewUrl = URL.createObjectURL(state.lastVideo);
    $("#stage").innerHTML = `<video class="final-preview" controls playsinline preload="metadata"></video>`;
    const preview = $("#stage video");
    preview.src = previewUrl;
    preview.load();
    preview.addEventListener("error", () => log("مرورگر نتوانست فایل ویدئوی نهایی را پخش کند. فایل را دانلود و با VLC یا پخش‌کننده دیگری باز کن.", "error"), { once: true });
    // Do not force autoplay on mobile; the user can press play safely.
    setStage(4, "done"); setStage(5, "done"); setProgress(100, t("done"), "ویدئوی نهایی آماده است؛ می‌توانی همین‌جا ببینی یا دانلود کنی."); $("#outputState").textContent = "✓ آماده دانلود"; $("#downloadBtn").disabled = false; $("#resultActions").hidden = false; log("ویدئوی نهایی با موفقیت ساخته شد و پیش‌نمایش آماده است.", "success");
  } catch (e) {
    const message = friendlyRenderError(e);
    $("#overallState").textContent = "● خطا";
    setProgress(0, "ساخت ناموفق بود", message);
    log(`رندر ناموفق بود: ${message}`, "error");
  }
  finally { state.busy = false; $("#renderBtn").disabled = false; }
};

$("#downloadBtn").onclick = () => {
  if (!state.lastVideo || !state.lastVideo.size) {
    log("فایل خروجی هنوز آماده دانلود نیست.", "error");
    return;
  }
  const url = URL.createObjectURL(state.lastVideo);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ad-maker-ai-${Date.now()}.webm`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  log("دانلود ویدئوی نهایی شروع شد.", "success");
};

$("#rerenderBtn").onclick = () => $("#renderBtn").click();
$("#newBtn").onclick = () => { ["#brand", "#desc"].forEach(s => $(s).value = ""); state.assets = []; state.script = ""; state.customScript = ""; state.scriptMode = "ai"; state.buildMode = "pro"; state.activeView = "preview"; state.voiceBlob = null; state.videoAnalysis = null; state.videoAnalysisBusy = false; $("#assets").innerHTML = `<span class="asset-empty">هنوز فایلی اضافه نشده</span>`; $("#scriptEditor").value = ""; $("#customScript").value = ""; $("#customScriptWrap").hidden = true; $("#scriptEditor").disabled = true; $(".creation-mode").forEach(x => x.classList.toggle("active", x.dataset.buildMode === "pro")); updateBuildModeUI(); $(".view-tab").forEach(x => x.classList.toggle("active", x.dataset.view === "preview")); $(".workspace-panel").forEach(x => { x.hidden = x.dataset.workspace !== "preview"; }); $("#viewState").textContent = "استودیو"; $("#stage").innerHTML = `<div class="empty"><div>🎞️</div><strong>پیش‌نمایش اینجا نمایش داده می‌شود</strong><small>پس از ساخت، ویدئوی عمودی 9:16 را می‌بینی.</small></div>`; resetPipeline(); };
$("#clearLog").onclick = () => { $("#log").innerHTML = `<div class="log-line muted"><span>●</span> منتظر عملیات بعدی...</div>`; };
$("#editScript").onclick = () => { $("#scriptEditor").disabled = false; $("#scriptEditor").focus(); $("#scriptEditor").classList.add("editing"); log("سناریو قابل ویرایش است؛ بعد از ویرایش می‌توانی دوباره رندر کنی."); };
$("#scriptMore").onclick = () => { const box = $("#scriptEditor"); const details = $(".script-details"); details.open = true; box.classList.toggle("expanded"); $("#scriptMore").textContent = box.classList.contains("expanded") ? "کمتر" : "بیشتر"; if (box.classList.contains("expanded")) { box.style.height = "auto"; box.style.height = `${Math.max(180, box.scrollHeight)}px`; } else box.style.height = "82px"; };
$("#scriptEditor").oninput = e => { if (e.target.classList.contains("expanded")) { e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; } state.script = e.target.value; state.voiceBlob = null; state.generated = false; $("#renderBtn").disabled = true; updateScriptMeta(state.script, "ویرایش کاربر"); log("متن سناریو تغییر کرد؛ برای جلوگیری از صدای قدیمی، گویندگی باید دوباره ساخته شود.", "info"); };
$("#helpBtn").onclick = () => alert("۱) اطلاعات محصول را وارد کن\n۲) عکس/ویدئو اضافه کن\n۳) ساخت تبلیغ با AI را بزن\n۴) پس از آماده‌شدن سناریو و صدا، ساخت ویدئو را بزن\n۵) در پایان دانلود کن.");

function targetWordsForDuration(seconds) {
  const sec = Math.max(15, Number(seconds) || 15);
  // Natural ad narration averages roughly 2.1–2.4 words/second depending on language.
  // Use a moderate target so the generated script fills the selected duration without
  // becoming unnaturally dense.
  return Math.round(sec * 2.2);
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function renderVideo(voiceBlob) {
  if (!voiceBlob || !voiceBlob.size) throw new Error("گویندگی صوتی آماده نیست؛ ابتدا گویندگی AI را با موفقیت بساز.");
  const ratio = outputRatio(state.platform);
  const W = ratio === "16:9" ? 1280 : ratio === "1:1" ? 1080 : ratio === "4:5" ? 1080 : 720;
  const H = ratio === "16:9" ? 720 : ratio === "1:1" ? 1080 : ratio === "4:5" ? 1350 : 1280;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("مرورگر نتوانست Canvas را آماده کند.");
  if (!window.MediaRecorder) throw new Error("مرورگر فعلی ساخت ویدئو را پشتیبانی نمی‌کند. Chrome را به‌روز کن.");
  if (!canvas.captureStream) throw new Error("مرورگر فعلی ضبط Canvas را پشتیبانی نمی‌کند. Chrome را به‌روز کن.");

  const media = [];
  const urls = [];
  for (const f of state.assets) {
    const objectUrl = URL.createObjectURL(f);
    urls.push(objectUrl);
    const prepared = await prepareMediaFile(f, objectUrl);
    if (prepared.kind === "image") {
      media.push({ type: "image", el: prepared.element, name: f.name, duration: 1 });
      log(`تصویر «${f.name}» آماده شد.`, "success");
    } else if (prepared.kind === "video") {
      const v = prepared.element;
      media.push({ type: "video", el: v, name: f.name, duration: Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 1 });
      log(`ویدئوی «${f.name}» آماده شد${prepared.converted ? " (تبدیل خودکار)" : ""}.`, "success");
    } else {
      throw new Error(`فرمت «${f.name}» در این مرورگر قابل پردازش نیست.`);
    }
  }

  let audioCtx = null, dest = null, voiceSource = null, musicSource = null;
  try {
    const music = $("#music").files[0];
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error("مرورگر صوت را پشتیبانی نمی‌کند. Chrome را به‌روز کن.");
    audioCtx = new AC();
    if (audioCtx.state === "suspended") await audioCtx.resume();
    dest = audioCtx.createMediaStreamDestination();

    let voiceBuf;
    try { voiceBuf = await audioCtx.decodeAudioData(await voiceBlob.arrayBuffer()); }
    catch (_) { throw new Error("صدای گویندگی قابل خواندن نیست. دوباره گویندگی را بساز."); }
    if (!voiceBuf?.duration) throw new Error("مدت صدای گویندگی مشخص نشد.");

    voiceSource = audioCtx.createBufferSource();
    voiceSource.buffer = voiceBuf;
    voiceSource.connect(dest);

    if (music) {
      let buf;
      try {
        const normalizedMusic = await prepareAudioFile(music);
        buf = await audioCtx.decodeAudioData(await normalizedMusic.arrayBuffer());
      } catch (_) {
        throw new Error("فایل موسیقی قابل خواندن یا تبدیل نیست. MP3/WAV/M4A را امتحان کن.");
      }
      musicSource = audioCtx.createBufferSource();
      musicSource.buffer = buf;
      musicSource.loop = true;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.10;
      musicSource.connect(gain).connect(dest);
    }

    // Never cut narration. If ElevenLabs takes longer than the selected target,
    // the video follows the full narration instead of ending early.
    const requestedTotal = Math.max(15, Number(state.duration) || 15);
    const voiceDuration = voiceBuf.duration;
    const total = Math.max(requestedTotal, voiceDuration + 0.35) * 1000;
    if (voiceDuration > requestedTotal + 0.5) {
      log(`گویندگی ${Math.ceil(voiceDuration)} ثانیه است؛ ویدئو برای پخش کامل متن تا ${Math.ceil(total / 1000)} ثانیه ادامه پیدا می‌کند.`, "info");
    }

    const videoStream = canvas.captureStream(30);
    const tracks = [...videoStream.getVideoTracks(), ...dest.stream.getAudioTracks()];
    const stream = new MediaStream(tracks);
    const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    const mime = candidates.find(x => MediaRecorder.isTypeSupported(x));
    if (!mime) throw new Error("این مرورگر قالب خروجی WebM را پشتیبانی نمی‌کند. آخرین Chrome را امتحان کن.");

    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5000000, audioBitsPerSecond: 128000 });
    const chunks = [];
    const done = new Promise((resolve, reject) => {
      rec.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
      rec.onerror = e => reject(e.error || new Error("MediaRecorder error"));
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: mime });
        if (!blob.size) reject(new Error("فایل ویدئو خالی ساخته شد.")); else resolve(blob);
      };
    });

    const sceneCount = media.length || 1;
    const sceneDuration = total / sceneCount;
    log(`${sceneCount} صحنه برای ${Math.round(total / 1000)} ثانیه تنظیم شد.`, "success");
    const captions = buildCaptionTimeline(state.script, voiceDuration);
    const start = performance.now();

    const sceneAt = elapsed => {
      if (!media.length) return { item: null, index: 0, progress: 0 };
      const safe = Math.min(Math.max(0, elapsed), Math.max(0, total - 1));
      const raw = safe / sceneDuration;
      const index = Math.min(sceneCount - 1, Math.floor(raw));
      return { item: media[index], index, progress: Math.min(1, Math.max(0, raw - index)) };
    };

    const drawFrame = elapsed => {
      const p = Math.min(1, elapsed / total);
      const scene = sceneAt(elapsed);
      const item = scene.item;
      const sceneP = scene.progress;
      const caption = captionAt(captions, Math.min(elapsed, voiceDuration * 1000), voiceDuration * 1000);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#05050a"; ctx.fillRect(0, 0, W, H);

      if (item?.el) {
        const el = item.el;
        if (item.type === "video") {
          const duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : item.duration;
          const target = Math.min(Math.max(0, sceneP * duration), Math.max(0, duration - 0.05));
          if (Math.abs((el.currentTime || 0) - target) > 0.18) { try { el.currentTime = target; } catch (_) {} }
          if (el.paused) el.play().catch(() => {});
        }
        const ew = el.videoWidth || el.naturalWidth || W;
        const eh = el.videoHeight || el.naturalHeight || H;
        const cover = Math.max(W / ew, H / eh);
        const zoom = 1.04 + 0.055 * sceneP;
        const iw = ew * cover * zoom, ih = eh * cover * zoom;
        const drift = Math.sin(sceneP * Math.PI) * 12;
        ctx.globalAlpha = 1;
        ctx.drawImage(el, (W - iw) / 2 + drift, (H - ih) / 2, iw, ih);
      } else {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, state.brandColor); g.addColorStop(1, "#090912");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }

      // Premium cinematic grading: brand-tinted light, vignette and depth.
      const top = ctx.createLinearGradient(0, 0, 0, H);
      top.addColorStop(0, hexAlpha(state.brandColor, .52));
      top.addColorStop(.34, "rgba(4,4,9,.03)");
      top.addColorStop(.66, "rgba(3,3,8,.16)");
      top.addColorStop(1, "rgba(2,2,7,.88)");
      ctx.fillStyle = top; ctx.fillRect(0, 0, W, H);

      const vignette = ctx.createRadialGradient(W/2, H/2, 260, W/2, H/2, 760);
      vignette.addColorStop(0, "rgba(0,0,0,0)"); vignette.addColorStop(1, "rgba(0,0,0,.42)");
      ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);

      ctx.direction = state.language === "en" ? "ltr" : "rtl";
      ctx.textAlign = "center";

      // Small brand badge — avoids the huge repeated title seen in the previous output.
      roundRect(ctx, 38, 44, W - 76, 58, 20, "rgba(8,8,15,.52)", "rgba(255,255,255,.16)");
      ctx.fillStyle = "#fff"; ctx.font = "800 25px Vazirmatn,Arial";
      ctx.fillText(brandText(), W / 2, 81);

      // Scene counter.
      ctx.textAlign = state.language === "en" ? "right" : "left";
      ctx.fillStyle = "rgba(255,255,255,.76)"; ctx.font = "700 16px Vazirmatn,Arial";
      ctx.fillText(`${String(scene.index + 1).padStart(2,"0")} / ${String(sceneCount).padStart(2,"0")}`, state.language === "en" ? W - 42 : 42, 138);

      // Readable glass subtitle card with compact lines.
      const cardX = 42, cardW = W - 84, cardH = caption ? 238 : 150, cardY = H - 390;
      roundRect(ctx, cardX, cardY, cardW, cardH, 28, "rgba(8,8,14,.62)", "rgba(255,255,255,.14)");
      ctx.fillStyle = state.brandColor; roundRect(ctx, cardX + 24, cardY + 24, 8, cardH - 48, 4, state.brandColor, null);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,.64)"; ctx.font = "700 14px Vazirmatn,Arial";
      ctx.fillText(styleLabel(), W / 2, cardY + 52);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Vazirmatn,Arial";
      if (caption) wrap(ctx, caption.text, W / 2, cardY + 98, cardW - 78, 42, 4);

      // Fine progress rail.
      ctx.fillStyle = "rgba(255,255,255,.18)"; roundRect(ctx, 42, H - 88, W - 84, 6, 3, "rgba(255,255,255,.18)", null);
      ctx.fillStyle = state.brandColor; roundRect(ctx, 42, H - 88, (W - 84) * p, 6, 3, state.brandColor, null);
      ctx.fillStyle = "rgba(255,255,255,.72)"; ctx.font = "700 15px Vazirmatn,Arial";
      ctx.fillText(`${Math.round(p * 100)}%`, W / 2, H - 50);
      setProgress(66 + p * 32, "رندر ویدئو", `${Math.round(p * 100)}٪ از ویدئو ساخته شد`);
    };

    drawFrame(0);
    voiceSource.start(0); if (musicSource) musicSource.start(0);
    rec.start(250);

    await new Promise((resolve, reject) => {
      let raf = 0;
      const tick = now => {
        try {
          const elapsed = now - start;
          drawFrame(elapsed);
          if (elapsed < total) raf = requestAnimationFrame(tick);
          else {
            cancelAnimationFrame(raf);
            drawFrame(total - 1);
            setTimeout(() => { if (rec.state !== "inactive") rec.stop(); resolve(); }, 180);
          }
        } catch (e) {
          cancelAnimationFrame(raf); if (rec.state !== "inactive") rec.stop(); reject(e);
        }
      };
      raf = requestAnimationFrame(tick);
    });

    const blob = await done;
    if (blob.size < 10000) throw new Error("فایل ویدئو بسیار کوچک یا خالی ساخته شد. دوباره تلاش کن.");
    return blob;
  } finally {
    try { voiceSource?.stop(); } catch (_) {}
    try { musicSource?.stop(); } catch (_) {}
    try { await audioCtx?.close(); } catch (_) {}
    media.filter(x => x.type === "video").forEach(x => { try { x.el.pause(); } catch (_) {} });
    urls.forEach(u => URL.revokeObjectURL(u));
    for (const u of urlsForPreparedAssets) { try { URL.revokeObjectURL(u); } catch (_) {} }
    urlsForPreparedAssets.clear();
  }
}

function buildCaptionTimeline(text, durationSeconds) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.split(/(?<=[.!?؟،؛])\s+/).filter(Boolean);
  const chunks = [];
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/).filter(Boolean);
    for (let i = 0; i < words.length; i += 9) chunks.push(words.slice(i, i + 9).join(" "));
  }
  const list = chunks.length ? chunks : [clean];
  const totalWords = list.reduce((n, x) => n + x.split(/\s+/).length, 0);
  let cursor = 0;
  return list.map(text => {
    const words = text.split(/\s+/).length;
    const start = cursor / totalWords;
    cursor += words;
    return { text, start, end: cursor / totalWords };
  });
}

function captionAt(timeline, elapsedMs, durationMs) {
  if (!timeline.length) return null;
  const duration = Math.max(1, Number(durationMs) || 1);
  const p = Math.min(0.9999, Math.max(0, elapsedMs / duration));
  return timeline.find(x => p >= x.start && p < x.end) || timeline[timeline.length - 1];
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

function brandText() { return $("#brand")?.value?.trim() || "AD Maker AI"; }
function styleLabel() {
  return platformLabel(state.platform).toUpperCase();
}

function safeExt(name, fallback = "bin") {
  const m = String(name || "").toLowerCase().match(/\.([a-z0-9]{2,8})(?:$|\?)/);
  return m ? m[1] : fallback;
}

async function ffmpegConvert(file, outputExt, args) {
  const ffmpeg = await loadFfmpeg();
  const input = `input-${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt(file.name, "bin")}`;
  const output = `output-${Date.now()}-${Math.random().toString(16).slice(2)}.${outputExt}`;
  try {
    await ffmpeg.writeFile(input, new Uint8Array(await file.arrayBuffer()));
    await ffmpeg.exec(["-y", "-i", input, ...args, output]);
    const data = await ffmpeg.readFile(output);
    if (!data || !data.length) throw new Error("FFmpeg produced an empty file.");
    return new Blob([data], { type: outputExt === "mp4" ? "video/mp4" : "audio/wav" });
  } finally {
    try { await ffmpeg.deleteFile(input); } catch (_) {}
    try { await ffmpeg.deleteFile(output); } catch (_) {}
  }
}

async function prepareMediaFile(file, objectUrl) {
  const sniffed = await sniffMediaType(file);
  const declared = String(file?.type || "").toLowerCase();
  const ext = safeExt(file.name, "");

  if (sniffed === "image" || declared.startsWith("image/")) {
    const image = await loadImageFile(file, objectUrl);
    if (image) return { kind: "image", element: image, converted: false };
    if (/^(heic|heif|heics|heifs)$/i.test(ext) || await looksLikeHeic(file)) {
      const converted = await convertHeic(file);
      return { kind: "image", element: converted.element, converted: true };
    }
  }

  if (/^(heic|heif|heics|heifs)$/i.test(ext) || await looksLikeHeic(file)) {
    const converted = await convertHeic(file);
    return { kind: "image", element: converted.element, converted: true };
  }

  if (sniffed === "video" || declared.startsWith("video/")) {
    try {
      const v = document.createElement("video");
      v.src = objectUrl; v.muted = true; v.playsInline = true; v.preload = "auto";
      await waitForVideo(v, file.name);
      return { kind: "video", element: v, converted: false };
    } catch (_) {}
  }

  // Try native browser decoders before invoking the heavyweight WASM converter.
  try {
    const v = document.createElement("video");
    v.src = objectUrl; v.muted = true; v.playsInline = true; v.preload = "metadata";
    await waitForVideo(v, file.name, true);
    return { kind: "video", element: v, converted: false };
  } catch (_) {}

  // Unsupported video container/codec: normalize to H.264/AAC MP4 in-browser.
  const convertedBlob = await ffmpegConvert(file, "mp4", [
    "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart"
  ]);
  const url = URL.createObjectURL(convertedBlob);
  urlsForPreparedAssets.add(url);
  const v = document.createElement("video");
  v.src = url; v.muted = true; v.playsInline = true; v.preload = "auto";
  await waitForVideo(v, file.name);
  return { kind: "video", element: v, converted: true };
}

const urlsForPreparedAssets = new Set();

async function prepareAudioFile(file) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return file;
  const ctx = new AC();
  try {
    try {
      await ctx.decodeAudioData(await file.arrayBuffer());
      return file;
    } catch (_) {}
  } finally {
    try { await ctx.close(); } catch (_) {}
  }
  const wav = await ffmpegConvert(file, "wav", ["-vn", "-ac", "2", "-ar", "44100", "-c:a", "pcm_s16le"]);
  return wav;
}

async function looksLikeHeic(file) {
  try {
    const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    if (head.length < 12) return false;
    if (head[4] !== 0x66 || head[5] !== 0x74 || head[6] !== 0x79 || head[7] !== 0x70) return false;
    const brand = String.fromCharCode(...head.slice(8, 12)).toLowerCase();
    return /^(heic|heix|hevc|hevx|heif|mif1|msf1)$/.test(brand);
  } catch (_) { return false; }
}

async function detectMediaKind(file, objectUrl) {
  // Android gallery providers can give files names such as "jpg.1000052843"
  // and an empty/incorrect MIME. Inspect the actual bytes first.
  const sniffed = await sniffMediaType(file);
  if (sniffed === "image") return "image";
  if (sniffed === "video") return "video";

  const declared = String(file?.type || "").toLowerCase();
  if (declared.startsWith("image/")) return "image";
  if (declared.startsWith("video/")) return "video";

  // Last resort: ask the browser decoders directly.
  try {
    const image = new Image();
    image.src = objectUrl;
    await waitForImage(image, file?.name || "فایل");
    return "image";
  } catch (_) {}

  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = objectUrl;
    await waitForVideo(video, file?.name || "فایل", true);
    return "video";
  } catch (_) {}
  return "unknown";
}

async function sniffMediaType(file) {
  try {
    const head = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image"; // JPEG
    if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return "image"; // PNG
    if (head.length >= 6 && head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) return "image"; // GIF
    if (head.length >= 12 && head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) return "image"; // WEBP
    if (head.length >= 12 && head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70) {
      const brand = String.fromCharCode(...head.slice(8, 12));
      if (/^(avif|avis|heic|heif|heix|hevc|hevx|mif1|msf1)$/i.test(brand)) return "image";
      if (/^(isom|iso2|mp41|mp42|3gp|3g2|M4V)$/i.test(brand)) return "video";
    }
    if (head.length >= 12 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return "video"; // WebM/Matroska
  } catch (_) {}
  return null;
}

async function loadImageFile(file, objectUrl) {
  const name = file?.name || "فایل";
  let bytes = null;
  try { bytes = await file.arrayBuffer(); } catch (_) {}

  // Newer Android Chrome: decode from bytes with WebCodecs when available.
  try {
    if (bytes && "ImageDecoder" in window) {
      const mime = await sniffImageMime(file);
      if (mime) {
        const decoder = new ImageDecoder({ data: bytes, type: mime });
        const result = await decoder.decode({ frameIndex: 0 });
        const frame = result.image;
        const c = document.createElement("canvas");
        c.width = frame.displayWidth || frame.codedWidth;
        c.height = frame.displayHeight || frame.codedHeight;
        c.getContext("2d").drawImage(frame, 0, 0);
        frame.close?.(); decoder.close?.();
        const img = new Image(); img.src = c.toDataURL("image/png");
        await waitForImage(img, name); return img;
      }
    }
  } catch (_) {}

  try {
    if (window.createImageBitmap) {
      const bitmap = await createImageBitmap(file);
      const c = document.createElement("canvas"); c.width = bitmap.width; c.height = bitmap.height;
      c.getContext("2d").drawImage(bitmap, 0, 0); bitmap.close?.();
      const img = new Image(); img.src = c.toDataURL("image/png");
      await waitForImage(img, name); return img;
    }
  } catch (_) {}

  try {
    const mime = await sniffImageMime(file);
    if (mime && bytes) {
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob); const img = new Image();
      img.decoding = "async"; img.src = url; await waitForImage(img, name);
      URL.revokeObjectURL(url); return img;
    }
  } catch (_) {}

  try {
    const img = new Image(); img.decoding = "async"; img.src = objectUrl;
    await waitForImage(img, name); return img;
  } catch (_) {}

  try {
    const dataUrl = await fileToDataUrl(file); const img = new Image();
    img.decoding = "async"; img.src = dataUrl; await waitForImage(img, name); return img;
  } catch (_) {}

  return null;
}
async function sniffImageMime(file) {
  try {
    const head = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
    if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return "image/png";
    if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) return "image/gif";
    if (head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) return "image/webp";
  } catch (_) {}
  return null;
}

function waitForImage(img, name = "فایل") {
  return new Promise((resolve, reject) => {
    if (img.complete && img.naturalWidth > 0) return resolve(img);
    const onLoad = () => { cleanup(); resolve(img); };
    const onError = () => { cleanup(); reject(new Error(`خواندن تصویر «${name}» ناموفق بود.`)); };
    const timer = setTimeout(() => { cleanup(); reject(new Error(`زمان خواندن تصویر «${name}» تمام شد.`)); }, 12000);
    const cleanup = () => {
      clearTimeout(timer);
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", onError);
    };
    img.addEventListener("load", onLoad, { once: true });
    img.addEventListener("error", onError, { once: true });
  });
}

function waitForVideo(video, name = "فایل", metadataOnly = false) {
  return new Promise((resolve, reject) => {
    const event = metadataOnly ? "loadedmetadata" : "canplay";
    if ((metadataOnly && video.readyState >= 1) || (!metadataOnly && video.readyState >= 3)) return resolve(video);
    const onReady = () => { cleanup(); resolve(video); };
    const onError = () => { cleanup(); reject(new Error(`خواندن ویدئو «${name}» ناموفق بود.`)); };
    const timer = setTimeout(() => { cleanup(); reject(new Error(`زمان خواندن ویدئو «${name}» تمام شد.`)); }, 15000);
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener(event, onReady);
      video.removeEventListener("error", onError);
    };
    video.addEventListener(event, onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.load();
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error || new Error("FileReader failed"));
    r.readAsDataURL(file);
  });
}

function friendlyRenderError(error) {
  const raw = error?.message ? String(error.message) : String(error || "");
  if (!raw || raw === "[object Event]") return "یکی از فایل‌ها قابل رمزگشایی یا تبدیل نبود. برنامه JPG/PNG/WEBP/HEIC و ویدئوهای رایج را پشتیبانی می‌کند؛ برای فرمت ناشناخته دوباره تلاش کن.";
  if (/decodeAudioData|EncodingError|DataCloneError/i.test(raw)) return "فایل صوتی قابل خواندن نیست. موسیقی را به MP3 یا WAV تبدیل کن و دوباره امتحان کن.";
  if (/MediaRecorder|captureStream/i.test(raw)) return "مرورگر نتوانست ویدئو را ضبط کند. آخرین نسخه Chrome را امتحان کن.";
  return raw;
}

function hexAlpha(hex,a){const h=hex.replace("#",""); const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16); return `rgba(${r},${g},${b},${a})`;}
function wrap(ctx,text,x,y,maxWidth,lineH,maxLines){const words=text.split(/\s+/),lines=[];let line="";for(const w of words){const test=line?`${line} ${w}`:w;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=w}else line=test}if(line)lines.push(line);lines.slice(0,maxLines).forEach((l,i)=>ctx.fillText(l,x,y+i*lineH));}

assetPreview();
renderVideoLibrary();
