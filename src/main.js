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
            <div class="field"><label>مدت</label><select id="duration"><option value="15">15 ثانیه</option><option value="30">30 ثانیه</option><option value="45">45 ثانیه</option><option value="60">60 ثانیه</option></select></div>
          </div>

          <div class="field"><label>سبک تبلیغ</label><div class="style-grid">
            <button class="style-chip active" data-style="cinematic"><i>🎬</i><span>سینمایی</span><small>دراماتیک</small></button>
            <button class="style-chip" data-style="modern"><i>⚡</i><span>مدرن</span><small>تمیز و سریع</small></button>
            <button class="style-chip" data-style="luxury"><i>💎</i><span>لوکس</span><small>پریمیوم</small></button>
            <button class="style-chip" data-style="sales"><i>🛍️</i><span>فروش</span><small>CTA قوی</small></button>
            <button class="style-chip" data-style="social"><i>📱</i><span>ریلز</span><small>شبکه اجتماعی</small></button>
          </div></div>

          <div class="field"><label>رنگ برند</label><div class="color-row"><input id="brandColor" type="color" value="#7c5cff"><span id="colorHex">#7C5CFF</span><span class="color-note">در عنوان‌ها و نورپردازی استفاده می‌شود.</span></div></div>

          <div class="field"><label>عکس و ویدئو</label><label class="drop"><input id="files" type="file" accept="image/*,video/*" multiple><div class="upload-icon">↑</div><strong>رسانه‌ها را انتخاب کن</strong><span>چند عکس یا ویدئو همزمان مجاز است</span><small>JPG · PNG · WEBP · MP4 · WebM</small></label><div id="assets" class="asset-list"></div></div>

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

$("#files").onchange = e => { state.assets = [...e.target.files]; assetPreview(); log(`${state.assets.length} فایل برای پروژه انتخاب شد.`); };
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
    try { j = await api("/api/generate-script", { brand, description: desc, language: state.language, duration: state.duration, style: state.style }); }
    catch (e) { log("اتصال به API سناریو ناموفق بود؛ حالت داخلی فعال شد.", "error"); j = { script: fallbackScript(brand, desc), fallback: true, provider: "local" }; }
    state.script = j.script || fallbackScript(brand, desc);
    $("#scriptEditor").value = state.script; $("#scriptEditor").disabled = false; $("#editScript").disabled = false;
    updateScriptMeta(state.script, j.provider || (j.fallback ? "داخلی" : "AI"));
    log(j.fallback ? t("fallback") : "سناریوی AI با موفقیت دریافت شد.", j.fallback ? "info" : "success");
    setStage(1, "done");

    setStage(2); setProgress(42, "گویندگی", t("voice")); log("درخواست ساخت گویندگی ارسال شد.");
    const voice = await getVoice();
    if (voice) { setStage(2, "done"); setProgress(52, "گویندگی آماده", t("voiceReady")); log(t("voiceReady"), "success"); }
    else { setStage(2, "done"); setProgress(50, "گویندگی جایگزین", t("voiceFallback")); log(t("voiceFallback")); }

    setStage(3); setProgress(58, "آماده‌سازی صحنه‌ها", "رسانه‌ها، متن و رنگ برند برای ویدئو چیده می‌شوند..."); log("صحنه‌بندی تبلیغ آماده می‌شود."); await wait(350); setStage(3, "done");
    $("#renderBtn").disabled = false; state.generated = true; $("#overallState").textContent = "● آماده رندر"; setProgress(62, "آماده رندر", "سناریو و صدا آماده‌اند. برای ساخت ویدئو روی دکمه پایین بزن."); log("پروژه برای رندر نهایی آماده است.", "success");
  } finally { state.busy = false; $("#scriptBtn").disabled = false; }
};

async function getVoice() {
  $("#voiceState").textContent = "در حال ساخت"; $("#voiceDetail").textContent = "ElevenLabs / API";
  try {
    const j = await api("/api/tts", { text: state.script, language: state.language });
    if (j.audio) { state.voiceBlob = base64ToBlob(j.audio, j.mime || "audio/mpeg"); state.voiceMode = "elevenlabs"; $("#voiceState").textContent = "گویندگی AI"; $("#voiceDetail").textContent = "آماده ✓"; return state.voiceBlob; }
  } catch (e) { log("ElevenLabs پاسخ موفق نداد؛ خروجی با صدای مرورگر ادامه پیدا می‌کند.", "error"); }
  state.voiceBlob = null; state.voiceMode = "browser"; $("#voiceState").textContent = "صدای مرورگر"; $("#voiceDetail").textContent = "جایگزین"; return null;
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
$("#scriptEditor").oninput = e => { state.script = e.target.value; updateScriptMeta(state.script, "ویرایش کاربر"); };
$("#helpBtn").onclick = () => alert("۱) اطلاعات محصول را وارد کن\n۲) عکس/ویدئو اضافه کن\n۳) ساخت تبلیغ با AI را بزن\n۴) پس از آماده‌شدن سناریو و صدا، ساخت ویدئو را بزن\n۵) در پایان دانلود کن.");

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function renderVideo(voiceBlob) {
  const W = 720, H = 1280;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("مرورگر نتوانست Canvas را آماده کند.");
  if (!window.MediaRecorder) throw new Error("مرورگر فعلی ساخت ویدئو را پشتیبانی نمی‌کند. Chrome را به‌روز کن.");
  if (!canvas.captureStream) throw new Error("مرورگر فعلی ضبط Canvas را پشتیبانی نمی‌کند. Chrome را به‌روز کن.");

  // Load all media before recording. This prevents a partially-created/blank recording.
  const media = [];
  const urls = [];
  for (const f of state.assets) {
    const objectUrl = URL.createObjectURL(f);
    urls.push(objectUrl);
    if (f.type.startsWith("image/")) {
      const im = new Image();
      im.decoding = "async";
      await new Promise((resolve, reject) => {
        im.onload = resolve;
        im.onerror = () => reject(new Error(`خواندن تصویر «${f.name}» ناموفق بود. JPG یا PNG را امتحان کن.`));
        im.src = objectUrl;
      });
      media.push({ type: "image", el: im, name: f.name, duration: 1 });
    } else if (f.type.startsWith("video/")) {
      const v = document.createElement("video");
      v.src = objectUrl;
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      await new Promise((resolve, reject) => {
        v.onloadeddata = resolve;
        v.onerror = () => reject(new Error(`خواندن ویدئوی «${f.name}» ناموفق بود. MP4 با H.264 یا WebM را امتحان کن.`));
        v.load();
      });
      media.push({ type: "video", el: v, name: f.name, duration: Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 1 });
    }
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
          buf = await audioCtx.decodeAudioData(await music.arrayBuffer());
        } catch (_) {
          throw new Error("فایل موسیقی قابل خواندن نیست. MP3 یا WAV را امتحان کن.");
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
    const start = performance.now();
    let started = false;

    // Draw one complete frame immediately so the recording never starts with a blank canvas.
    const drawFrame = (elapsed) => {
      const p = Math.min(1, elapsed / total);
      const lineIndex = Math.min(Math.max(lines.length - 1, 0), Math.floor(p * Math.max(lines.length, 1)));
      const item = media.length ? media[lineIndex % media.length] : null;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#050507";
      ctx.fillRect(0, 0, W, H);

      if (item) {
        const el = item.el;
        if (item.type === "video") {
          const duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : item.duration;
          const sceneP = (p * media.length) % 1;
          const target = Math.min(Math.max(0, sceneP * duration), Math.max(0, duration - 0.05));
          // Keep the video moving while it is used as a scene.
          if (Math.abs((el.currentTime || 0) - target) > 0.20) {
            try { el.currentTime = target; } catch (_) {}
          }
          if (el.paused) el.play().catch(() => {});
        }

        const ew = el.videoWidth || el.naturalWidth || W;
        const eh = el.videoHeight || el.naturalHeight || H;
        const cover = Math.max(W / ew, H / eh);
        const sceneP = (p * media.length) % 1;
        const zoom = 1 + 0.08 * sceneP;
        const iw = ew * cover * zoom;
        const ih = eh * cover * zoom;
        const drift = Math.sin(sceneP * Math.PI * 2) * 14;
        ctx.globalAlpha = 0.96;
        ctx.drawImage(el, (W - iw) / 2 + drift, (H - ih) / 2, iw, ih);
        ctx.globalAlpha = 1;
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
  }
}

function friendlyRenderError(error) {
  const raw = error?.message ? String(error.message) : String(error || "");
  if (!raw || raw === "[object Event]") return "یکی از فایل‌های رسانه‌ای خوانده نشد. یک MP4 یا JPG/PNG دیگر امتحان کن.";
  if (/decodeAudioData|EncodingError|DataCloneError/i.test(raw)) return "فایل صوتی قابل خواندن نیست. موسیقی را به MP3 یا WAV تبدیل کن و دوباره امتحان کن.";
  if (/MediaRecorder|captureStream/i.test(raw)) return "مرورگر نتوانست ویدئو را ضبط کند. آخرین نسخه Chrome را امتحان کن.";
  return raw;
}

function hexAlpha(hex,a){const h=hex.replace("#",""); const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16); return `rgba(${r},${g},${b},${a})`;}
function wrap(ctx,text,x,y,maxWidth,lineH,maxLines){const words=text.split(/\s+/),lines=[];let line="";for(const w of words){const test=line?`${line} ${w}`:w;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=w}else line=test}if(line)lines.push(line);lines.slice(0,maxLines).forEach((l,i)=>ctx.fillText(l,x,y+i*lineH));}

assetPreview();
