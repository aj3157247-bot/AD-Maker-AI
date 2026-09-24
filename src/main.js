import "./style.css";

const state = {
  assets: [],
  style: "cinematic",
  language: "fa",
  duration: 15,
  script: "",
  busy: false,
  voiceBlob: null,
  lastVideo: null,
  brandColor: "#7c5cff",
  currentStage: 0,
  generated: false,
  voiceMode: "none"
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
    ["01", "تحلیل", "اطلاعات و رسانه‌ها"],
    ["02", "سناریو", "متن تبلیغاتی"],
    ["03", "گویندگی", "صدای حرفه‌ای"],
    ["04", "صحنه‌ها", "چیدمان رسانه‌ها"],
    ["05", "رندر", "ساخت ویدئو"],
    ["06", "آماده", "خروجی نهایی"]
  ];
  $("#app").innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand"><div class="brandmark">✦</div><div><strong>AD Maker AI</strong><span>استودیوی ساخت تبلیغ</span></div></div>
      <div class="top-actions"><span class="secure-pill">🔒 APIها امن در Cloudflare</span><button id="helpBtn" class="icon-btn" aria-label="راهنما">?</button></div>
    </header>

    <main>
      <section class="hero">
        <div class="eyebrow">AI ADVERTISING STUDIO · PROFESSIONAL WORKFLOW</div>
        <h1>ایده‌ات را به یک <span>تبلیغ حرفه‌ای</span> تبدیل کن.</h1>
        <p>اطلاعات محصول و رسانه‌ها را بده؛ سناریو، گویندگی، صحنه‌بندی و ویدئوی عمودی آماده شبکه‌های اجتماعی را در یک جریان ساده بساز.</p>
        <div class="hero-badges"><span>🎙️ گویندگی AI</span><span>🎬 رندر عمودی</span><span>📝 زیرنویس</span><span>📱 مناسب Reels / Shorts</span></div>
      </section>

      <section class="workspace">
        <aside class="setup card">
          <div class="section-head"><div><small>مرحله ۱</small><h2>اطلاعات تبلیغ</h2></div><span class="step-state">شروع</span></div>

          <div class="field"><label>نام برند / محصول <b>*</b></label><input id="brand" class="input" placeholder="${t("brandPlaceholder")}"></div>
          <div class="field"><label>توضیح محصول یا خدمات <b>*</b></label><textarea id="desc" placeholder="${t("descPlaceholder")}"></textarea><div class="hint">هرچه اطلاعات واقعی‌تر بدهی، سناریوی AI دقیق‌تر می‌شود.</div></div>

          <div class="grid-2">
            <div class="field"><label>زبان</label><select id="lang"><option value="fa">دری افغانستان</option><option value="ps">پښتو</option><option value="en">English</option></select></div>
            <div class="field"><label>مدت</label><select id="duration"><option value="15">15 ثانیه</option><option value="30">30 ثانیه</option><option value="45">45 ثانیه</option><option value="60">60 ثانیه</option><option value="90">90 ثانیه</option><option value="120">2 دقیقه</option><option value="180">3 دقیقه</option><option value="240">4 دقیقه</option><option value="300">5 دقیقه</option></select></div>
          </div>

          <div class="field"><label>سبک تبلیغ</label><div class="style-grid">
            <button class="style-chip active" data-style="cinematic"><i>🎬</i><span>سینمایی</span><small>دراماتیک</small></button>
            <button class="style-chip" data-style="modern"><i>⚡</i><span>مدرن</span><small>تمیز و سریع</small></button>
            <button class="style-chip" data-style="luxury"><i>💎</i><span>لوکس</span><small>پریمیوم</small></button>
            <button class="style-chip" data-style="sales"><i>🛍️</i><span>فروش</span><small>CTA قوی</small></button>
            <button class="style-chip" data-style="social"><i>📱</i><span>ریلز</span><small>شبکه اجتماعی</small></button>
          </div></div>

          <div class="field"><label>رنگ برند</label><div class="color-row"><input id="brandColor" type="color" value="#7c5cff"><span id="colorHex">#7C5CFF</span><span class="color-note">در عنوان‌ها و نورپردازی استفاده می‌شود.</span></div></div>

          <div class="field"><label>عکس و ویدئو</label><label class="drop"><input id="files" type="file" accept="*/*" multiple><div class="upload-icon">↑</div><strong>رسانه‌ها را انتخاب کن</strong><span>چند عکس یا ویدئو همزمان مجاز است</span><small>JPG · PNG · WEBP · HEIC/HEIF · MP4 · MOV · AVI · MKV · WebM و بیشتر</small></label><div id="assets" class="asset-list"></div></div>

          <div class="field"><label>موسیقی پس‌زمینه <em>اختیاری</em></label><label class="music-drop"><input id="music" type="file" accept="audio/*"><span>🎵</span><div><strong>افزودن موسیقی</strong><small id="musicName">هنوز موسیقی انتخاب نشده</small></div></label></div>

          <div class="button-row"><button id="scriptBtn" class="primary big">✦ ساخت تبلیغ با AI</button><button id="demoBtn" class="secondary">نمونه بازارک</button></div>
          <div id="notice" class="notice"><b>نکته:</b> کلیدهای API در مرورگر نمایش داده نمی‌شوند و Worker روی Cloudflare آن‌ها را مصرف می‌کند.</div>
        </aside>

        <section class="production card">
          <div class="section-head"><div><small>مرحله ۲</small><h2>مرکز تولید</h2></div><span id="overallState" class="state-dot">● آماده</span></div>
          <div class="progress-card">
            <div class="progress-top"><div><strong id="progressTitle">آماده شروع</strong><small id="progressText">اطلاعاتت را وارد کن و ساخت تبلیغ را شروع کن.</small></div><b id="progressPercent">0%</b></div>
            <div class="progress-track"><i id="bar"></i></div>
            <div id="stageGrid" class="stage-grid">${stages.map((s,i)=>`<div class="pipeline-stage ${i===0?"active":""}" data-stage="${i}"><div class="stage-number">${s[0]}</div><div><b>${s[1]}</b><small>${s[2]}</small></div><span class="stage-check">○</span></div>`).join("")}</div>
          </div>

          <div class="live-log"><div class="log-head"><span>جزئیات عملیات</span><button id="clearLog" class="tiny-btn">پاک کردن</button></div><div id="log" class="log"><div class="log-line muted"><span>●</span> منتظر شروع پروژه...</div></div></div>

          <div class="script-panel"><div class="panel-title"><span>📝 سناریوی تولیدشده</span><button id="editScript" class="tiny-btn" disabled>ویرایش</button></div><textarea id="scriptEditor" disabled placeholder="سناریوی تبلیغاتی بعد از تحلیل اینجا قرار می‌گیرد..."></textarea><div class="script-meta"><span id="scriptCount">0 کلمه</span><span id="scriptSource">منبع: —</span></div></div>
        </section>

        <section class="result card">
          <div class="section-head"><div><small>مرحله ۳</small><h2>پیش‌نمایش و خروجی</h2></div><span id="outputState">هنوز ساخته نشده</span></div>
          <div id="stage" class="video-stage"><div class="empty"><div>🎞️</div><strong>پیش‌نمایش اینجا نمایش داده می‌شود</strong><small>پس از ساخت، ویدئوی عمودی 9:16 را می‌بینی.</small></div></div>
          <div class="output-actions"><button id="renderBtn" class="primary" disabled>▶ ساخت ویدئو</button><button id="downloadBtn" class="secondary" disabled>⬇ دانلود</button></div>
          <div class="result-metrics"><div><span>🎙️</span><b id="voiceState">گویندگی</b><small id="voiceDetail">آماده</small></div><div><span>🎵</span><b>موسیقی</b><small id="musicState">اختیاری</small></div><div><span>📐</span><b>خروجی</b><small>720 × 1280</small></div></div>
          <div id="resultActions" class="result-extra" hidden><button id="rerenderBtn" class="secondary">↻ ساخت دوباره</button><button id="newBtn" class="ghost">＋ پروژه جدید</button></div>
        </section>
      </section>

      <section class="how card"><div><span class="how-icon">💡</span><div><h3>چطور بهترین نتیجه را بگیری؟</h3><p>نام محصول، مخاطب، مزیت اصلی، شهر/بازار هدف و دعوت به اقدام را در توضیحات بنویس. تصاویر واقعی محصول را هم به ترتیب اهمیت اضافه کن.</p></div></div><div class="how-list"><span>۱. اطلاعات دقیق</span><span>۲. رسانه‌های خوب</span><span>۳. سناریوی AI</span><span>۴. گویندگی و رندر</span></div></section>
    </main>
    <footer>AD Maker AI · ساخت تبلیغات کوتاه برای وب و شبکه‌های اجتماعی</footer>
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
    el.classList.toggle("active", i === index && status !== "done");
    el.classList.toggle("done", i < index || (i === index && status === "done"));
    el.classList.toggle("waiting", i > index);
    el.querySelector(".stage-check").textContent = i < index || (i === index && status === "done") ? "✓" : i === index ? "●" : "○";
  });
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
  $("#scriptCount").textContent = `${words} کلمه`;
  $("#scriptSource").textContent = `منبع: ${source}`;
}

function base64ToBlob(b64, mime) {
  const bin = atob(b64); const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return new Blob([a], { type: mime });
}

async function api(path, payload) {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!r.ok) throw new Error(await r.text() || `API ${r.status}`);
  return r.json();
}

function fallbackScript(brand, desc) {
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
  assetPreview();
  log(`${state.assets.length} فایل انتخاب شد؛ فرمت هر فایل هنگام ساخت به‌صورت خودکار بررسی و در صورت نیاز تبدیل می‌شود.`, "success");
};
$("#music").onchange = e => { const f = e.target.files[0]; $("#musicName").textContent = f ? f.name : "هنوز موسیقی انتخاب نشده"; $("#musicState").textContent = f ? "افزوده شد" : "اختیاری"; };
$("#lang").onchange = e => { state.language = e.target.value; setDir(); $("#brand").placeholder = t("brandPlaceholder"); $("#desc").placeholder = t("descPlaceholder"); };
$("#duration").onchange = e => state.duration = +e.target.value;
$("#brandColor").oninput = e => { state.brandColor = e.target.value; $("#colorHex").textContent = e.target.value.toUpperCase(); document.documentElement.style.setProperty("--brand", e.target.value); };

$$(".style-chip").forEach(btn => btn.onclick = () => { $$(".style-chip").forEach(x => x.classList.remove("active")); btn.classList.add("active"); state.style = btn.dataset.style; });

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
  if (!brand || !desc) { setProgress(0, "اطلاعات ناقص", t("missing")); log(t("missing"), "error"); return; }
  state.busy = true; state.generated = false; $("#scriptBtn").disabled = true; $("#renderBtn").disabled = true; $("#downloadBtn").disabled = true;
  $("#resultActions").hidden = true; $("#scriptEditor").disabled = true; $("#editScript").disabled = true;
  $("#log").innerHTML = ""; $("#stage").innerHTML = `<div class="processing"><div class="spinner"></div><strong>در حال آماده‌سازی پروژه...</strong><small>این صفحه در طول کار وضعیت واقعی هر مرحله را نشان می‌دهد.</small></div>`;
  $("#overallState").textContent = "● در حال تولید";

  try {
    setStage(0); setProgress(10, "تحلیل پروژه", t("analyze")); log(`شروع پروژه «${brand}» با ${state.assets.length} رسانه.`); await wait(250);
    if (state.assets.length) log(t("mediaReady"), "success"); else log(t("noMedia"));

    setStage(1); setProgress(25, "نوشتن سناریو", t("script")); log("درخواست سناریو به API ارسال شد.");
    let j;
    try {
      j = await api("/api/generate-script", { brand, description: desc, language: state.language, duration: state.duration, style: state.style, targetWords: targetWordsForDuration(state.duration) });
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
    log(j.fallback ? t("fallback") : "سناریوی AI با موفقیت دریافت شد.", j.fallback ? "info" : "success");
    setStage(1, "done");

    setStage(2); setProgress(42, "گویندگی", t("voice")); log("درخواست ساخت گویندگی ارسال شد.");
    const voice = await getVoice();
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

    setStage(3); setProgress(58, "آماده‌سازی صحنه‌ها", "رسانه‌ها، متن و رنگ برند برای ویدئو چیده می‌شوند..."); log("صحنه‌بندی تبلیغ آماده می‌شود."); await wait(350); setStage(3, "done");
    $("#renderBtn").disabled = false; state.generated = true; $("#overallState").textContent = "● آماده رندر با صدا"; setProgress(62, "آماده رندر", "سناریو و گویندگی آماده‌اند. خروجی نهایی با صدا ساخته می‌شود."); log("پروژه برای رندر نهایی آماده است.", "success");
  } finally { state.busy = false; $("#scriptBtn").disabled = false; }
};

async function getVoice() {
  $("#voiceState").textContent = "در حال ساخت";
  $("#voiceDetail").textContent = "ElevenLabs v3";
  state.voiceBlob = null;
  state.voiceMode = "none";
  try {
    const text = String(state.script || '').trim();
    const charCount = text.length;
    if (!text) throw new Error("متن سناریو خالی است.");
    log(`متن گویندگی ${charCount.toLocaleString("en-US")} کاراکتر است؛ در صورت طولانی بودن خودکار به چند بخش تقسیم می‌شود.`, "info");
    const j = await api("/api/tts", { text, language: state.language });
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
      $("#voiceState").textContent = "گویندگی AI";
      $("#voiceDetail").textContent = `${j.model === "eleven_v3" ? "Eleven v3" : "Eleven Multilingual v2"} · ${state.language === "ps" ? "پښتو" : state.language === "en" ? "English" : "دری"} ✓`;
      log(`گویندگی با موفقیت آماده شد${j.chunks > 1 ? ` (${j.chunks} بخش)` : ""}.`, "success");
      return blob;
    }
    log(`ElevenLabs گویندگی تولید نکرد: ${j.error || "خطای نامشخص"}${j.detail ? ` — ${j.detail}` : ""}.`, "error");
  } catch (e) {
    let detail = String(e?.message || e || "خطای نامشخص");
    try {
      const parsed = JSON.parse(detail);
      const code = parsed?.error || parsed?.code || "";
      const map = {
        elevenlabs_invalid_api_key: "کلید ElevenLabs معتبر نیست.",
        elevenlabs_quota_exceeded: "اعتبار/سهمیه ElevenLabs کافی نیست.",
        elevenlabs_permission_denied: "کلید ElevenLabs اجازه Text to Speech ندارد.",
        elevenlabs_voice_not_found: "صدای انتخاب‌شده در ElevenLabs پیدا نشد.",
        elevenlabs_rate_limited: "درخواست‌های ElevenLabs بیش از حد شده؛ کمی بعد دوباره امتحان کن."
      };
      detail = map[code] || parsed?.detail || detail;
    } catch (_) {}
    log(`گویندگی ساخته نشد: ${detail}`, "error");
  }
  $("#voiceState").textContent = "گویندگی آماده نیست";
  $("#voiceDetail").textContent = "خروجی بی‌صدا مجاز نیست";
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
$("#newBtn").onclick = () => { ["#brand", "#desc"].forEach(s => $(s).value = ""); state.assets = []; state.script = ""; state.voiceBlob = null; $("#assets").innerHTML = `<span class="asset-empty">هنوز فایلی اضافه نشده</span>`; $("#scriptEditor").value = ""; $("#scriptEditor").disabled = true; $("#stage").innerHTML = `<div class="empty"><div>🎞️</div><strong>پیش‌نمایش اینجا نمایش داده می‌شود</strong><small>پس از ساخت، ویدئوی عمودی 9:16 را می‌بینی.</small></div>`; resetPipeline(); };
$("#clearLog").onclick = () => { $("#log").innerHTML = `<div class="log-line muted"><span>●</span> منتظر عملیات بعدی...</div>`; };
$("#editScript").onclick = () => { $("#scriptEditor").disabled = false; $("#scriptEditor").focus(); $("#scriptEditor").classList.add("editing"); log("سناریو قابل ویرایش است؛ بعد از ویرایش می‌توانی دوباره رندر کنی."); };
$("#scriptEditor").oninput = e => { state.script = e.target.value; state.voiceBlob = null; state.generated = false; $("#renderBtn").disabled = true; updateScriptMeta(state.script, "ویرایش کاربر"); log("متن سناریو تغییر کرد؛ برای جلوگیری از صدای قدیمی، گویندگی باید دوباره ساخته شود.", "info"); };
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
  const W = 720, H = 1280;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("مرورگر نتوانست Canvas را آماده کند.");
  if (!window.MediaRecorder) throw new Error("مرورگر فعلی ساخت ویدئو را پشتیبانی نمی‌کند. Chrome را به‌روز کن.");
  if (!canvas.captureStream) throw new Error("مرورگر فعلی ضبط Canvas را پشتیبانی نمی‌کند. Chrome را به‌روز کن.");

  // Normalize every selected asset to something the browser renderer can decode.
  // Native browser decoding is used first; HEIC/HEIF images and unsupported videos
  // are converted locally in the browser only when needed.
  const media = [];
  const urls = [];
  for (const f of state.assets) {
    const objectUrl = URL.createObjectURL(f);
    urls.push(objectUrl);
    const prepared = await prepareMediaFile(f, objectUrl);
    if (prepared.kind === "image") {
      media.push({ type: "image", el: prepared.element, name: f.name, duration: 1 });
      log(`تصویر «${f.name}» آماده شد.`, "success");
      continue;
    }
    if (prepared.kind === "video") {
      const v = prepared.element;
      media.push({ type: "video", el: v, name: f.name, duration: Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 1 });
      log(`ویدئوی «${f.name}» آماده شد${prepared.converted ? " (تبدیل خودکار)" : ""}.`, "success");
      continue;
    }
    throw new Error(`فرمت «${f.name}» در این مرورگر قابل پردازش نیست. فایل را به JPG/PNG یا MP4 تبدیل کن.`);
  }

  let audioCtx = null, dest = null, voiceSource = null, musicSource = null;
  try {
    const music = $("#music").files[0];
    if (voiceBlob || music) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error("مرورگر صوت را پشتیبانی نمی‌کند. Chrome را به‌روز کن.");
      audioCtx = new AC();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      dest = audioCtx.createMediaStreamDestination();

      if (voiceBlob) {
        let buf;
        try {
          buf = await audioCtx.decodeAudioData(await voiceBlob.arrayBuffer());
        } catch (_) {
          throw new Error("صدای گویندگی قابل خواندن نیست. دوباره گویندگی را بساز.");
        }
        voiceSource = audioCtx.createBufferSource();
        voiceSource.buffer = buf;
        voiceSource.connect(dest);
        // Local monitor is intentionally disabled: it can cause echo while recording.
      }

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
        gain.gain.value = 0.12;
        musicSource.connect(gain).connect(dest);
      }
    }

    const videoStream = canvas.captureStream(30);
    const tracks = [...videoStream.getVideoTracks()];
    if (dest) tracks.push(...dest.stream.getAudioTracks());
    const stream = new MediaStream(tracks);

    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];
    const mime = candidates.find(x => MediaRecorder.isTypeSupported(x));
    if (!mime) throw new Error("این مرورگر قالب خروجی WebM را پشتیبانی نمی‌کند. آخرین Chrome را امتحان کن.");

    const rec = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 5000000,
      audioBitsPerSecond: 128000
    });
    const chunks = [];
    const done = new Promise((resolve, reject) => {
      rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onerror = e => reject(e.error || new Error("MediaRecorder error"));
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: mime });
        if (!blob.size) reject(new Error("فایل ویدئو خالی ساخته شد."));
        else resolve(blob);
      };
    });

    const lines = state.script.split(/\n+/).map(x => x.trim()).filter(Boolean);
    const total = Math.max(3, Number(state.duration) || 15) * 1000;
    const brand = $("#brand").value.trim();

    // Every selected media item gets its own scene. The old renderer selected the
    // scene from the number of script lines, so a short two-line script could make
    // eight uploaded photos collapse into only two visible photos. We now divide
    // the full duration evenly across all prepared assets, independently of script length.
    const sceneCount = media.length || 1;
    const sceneDuration = total / sceneCount;
    log(`${sceneCount} صحنه برای ${Math.round(total / 1000)} ثانیه تنظیم شد؛ هر رسانه حدود ${Math.max(1, Math.round(sceneDuration / 1000))} ثانیه نمایش داده می‌شود.`, "success");
    const start = performance.now();
    let started = false;

    const sceneAt = elapsed => {
      if (!media.length) return { item: null, index: 0, progress: 0 };
      const safeElapsed = Math.min(Math.max(0, elapsed), Math.max(0, total - 1));
      const raw = safeElapsed / sceneDuration;
      const index = Math.min(sceneCount - 1, Math.floor(raw));
      return { item: media[index], index, progress: Math.min(1, Math.max(0, raw - index)) };
    };

    // Draw one complete frame immediately so the recording never starts with a blank canvas.
    const drawFrame = (elapsed) => {
      const p = Math.min(1, elapsed / total);
      const scene = sceneAt(elapsed);
      const item = scene.item;
      const sceneP = scene.progress;
      const lineIndex = lines.length ? Math.min(lines.length - 1, Math.floor(p * lines.length)) : 0;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#050507";
      ctx.fillRect(0, 0, W, H);

      if (item && item.el) {
        const el = item.el;
        if (item.type === "video") {
          const duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : item.duration;
          const target = Math.min(Math.max(0, sceneP * duration), Math.max(0, duration - 0.05));
          if (Math.abs((el.currentTime || 0) - target) > 0.20) {
            try { el.currentTime = target; } catch (_) {}
          }
          if (el.paused) el.play().catch(() => {});
        }
        const ew = el.videoWidth || el.naturalWidth || W;
        const eh = el.videoHeight || el.naturalHeight || H;
        const cover = Math.max(W / ew, H / eh);
        const zoom = 1 + 0.08 * sceneP;
        const iw = ew * cover * zoom;
        const ih = eh * cover * zoom;
        const drift = Math.sin(sceneP * Math.PI * 2) * 14;
        ctx.globalAlpha = 0.96;
        ctx.drawImage(el, (W - iw) / 2 + drift, (H - ih) / 2, iw, ih);
        ctx.globalAlpha = 1;
      } else {
        // Fallback scene keeps the project renderable when Android exposes a
        // virtual/unsupported gallery image. Audio and the rest of the ad are
        // still rendered normally.
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, state.brandColor);
        g.addColorStop(1, "#07070b");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(255,255,255,.10)";
        ctx.fillRect(55, 340, W - 110, 470);
        ctx.fillStyle = "#fff";
        ctx.font = "900 58px Vazirmatn,Arial";
        ctx.textAlign = "center";
        ctx.fillText(brand, W / 2, 525);
        ctx.font = "600 27px Vazirmatn,Arial";
        ctx.fillStyle = "rgba(255,255,255,.78)";
        ctx.fillText("تبلیغ حرفه‌ای با AD Maker AI", W / 2, 590);
      }

      // Cinematic overlays and a visible progress animation make a single image behave like a real video scene.
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, hexAlpha(state.brandColor, .72));
      grad.addColorStop(.34, "rgba(0,0,0,.08)");
      grad.addColorStop(.68, "rgba(0,0,0,.24)");
      grad.addColorStop(1, "rgba(0,0,0,.94)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.direction = state.language === "en" ? "ltr" : "rtl";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "900 44px Vazirmatn,Arial";
      ctx.fillText(brand, W / 2, 150);

      ctx.fillStyle = "#fff";
      ctx.font = "800 31px Vazirmatn,Arial";
      wrap(ctx, lines[lineIndex] || brand, W / 2, 560, 600, 52, 5);

      ctx.fillStyle = "rgba(255,255,255,.86)";
      ctx.font = "600 18px Vazirmatn,Arial";
      ctx.fillText(`${Math.round(p * 100)}%`, W / 2, 1160);
      ctx.fillStyle = "#fff";
      ctx.fillRect(70, 1205, (W - 140) * p, 5);
      ctx.fillStyle = "#ddd4ff";
      ctx.font = "600 19px Vazirmatn,Arial";
      ctx.fillText("AD Maker AI", W / 2, 1240);

      setProgress(66 + p * 32, "رندر ویدئو", `${Math.round(p * 100)}٪ از ویدئو ساخته شد`);
    };

    drawFrame(0);
    // Start audio and recording only after the first valid frame exists.
    if (voiceSource) voiceSource.start(0);
    if (musicSource) musicSource.start(0);
    rec.start(250);
    started = true;

    await new Promise((resolve, reject) => {
      let raf = 0;
      const tick = now => {
        try {
          const elapsed = now - start;
          drawFrame(elapsed);
          if (elapsed < total) raf = requestAnimationFrame(tick);
          else {
            cancelAnimationFrame(raf);
            // Keep the final frame in the recording for a short moment.
            setTimeout(() => { if (rec.state !== "inactive") rec.stop(); resolve(); }, 120);
          }
        } catch (e) {
          cancelAnimationFrame(raf);
          if (rec.state !== "inactive") rec.stop();
          reject(e);
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


let ffmpegPromise = null;

async function loadHeicDecoder() {
  if (window.HeicTo) return window.HeicTo;
  if (window.__adMakerHeicPromise) return window.__adMakerHeicPromise;
  window.__adMakerHeicPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/heic-to@1.5.2/dist/iife/heic-to.js";
    script.async = true;
    script.onload = () => window.HeicTo ? resolve(window.HeicTo) : reject(new Error("HEIC decoder loaded but is unavailable."));
    script.onerror = () => reject(new Error("دانلود مبدل HEIC ناموفق بود."));
    document.head.appendChild(script);
  });
  return window.__adMakerHeicPromise;
}

async function convertHeic(file) {
  const HeicTo = await loadHeicDecoder();
  if (!await HeicTo.isHeic(file)) throw new Error("این فایل HEIC/HEIF نیست.");
  const blob = await HeicTo({ blob: file, type: "image/jpeg", quality: 0.92 });
  const img = new Image();
  img.decoding = "async";
  img.src = URL.createObjectURL(blob);
  await waitForImage(img, file.name || "HEIC");
  return { element: img, blob };
}

async function loadFfmpeg() {
  if (ffmpegPromise) return ffmpegPromise;
  ffmpegPromise = (async () => {
    log("فرمت این ویدئو برای Chrome مستقیم قابل پخش نبود؛ مبدل ویدئو در حال آماده‌سازی است...", "info");
    const ffmpegModule = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js");
    const utilModule = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/dist/esm/index.js");
    const { FFmpeg } = ffmpegModule;
    const { toBlobURL } = utilModule;
    const ffmpeg = new FFmpeg();
    const base = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
      workerURL: await toBlobURL(`${base}/ffmpeg-core.worker.js`, "text/javascript")
    });
    return ffmpeg;
  })().catch(e => {
    ffmpegPromise = null;
    throw e;
  });
  return ffmpegPromise;
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
