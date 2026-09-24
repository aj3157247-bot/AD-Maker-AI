
import "./style.css";

const state={
  assets:[], style:"cinematic", language:"fa", duration:15,
  script:"", busy:false, voiceBlob:null, lastVideo:null,
  brandColor:"#7c5cff"
};
const $=s=>document.querySelector(s);

$("#app").innerHTML=`
<div class="wrap">
<header class="nav">
 <div class="brand"><div class="brandmark">✦</div>AD Maker AI</div>
 <div class="pill">AI ADVERTISING STUDIO · v2</div>
</header>

<section class="hero">
 <span class="eyebrow">تبدیل ایده به تبلیغ ویدیویی</span>
 <h1>تبلیغت را <span class="gradient">حرفه‌ای بساز.</span></h1>
 <p>نام و توضیح برندت را بده، چند عکس یا ویدئو آپلود کن و یک تبلیغ کوتاه با سناریوی هوشمند، گوینده، زیرنویس و خروجی ویدیویی بساز.</p>
</section>

<div class="layout">
<section class="card">
 <div class="step">مرحله ۱</div><h2>اطلاعات تبلیغ</h2>
 <div class="field"><label>نام برند / محصول</label><input class="input" id="brand" placeholder="مثلاً بازارک"></div>
 <div class="field"><label>توضیح محصول، سایت یا خدمات</label><textarea id="desc" placeholder="چه کاری انجام می‌دهد؟ چه مشکلی را حل می‌کند؟ چرا مردم باید از آن استفاده کنند؟"></textarea></div>
 <div class="two">
  <div class="field"><label>زبان گوینده</label><select id="lang"><option value="fa">دری افغانستان</option><option value="ps">پشتو</option><option value="en">English</option></select></div>
  <div class="field"><label>مدت تبلیغ</label><select id="duration"><option value="15">15 ثانیه</option><option value="30">30 ثانیه</option><option value="45">45 ثانیه</option><option value="60">60 ثانیه</option></select></div>
 </div>
 <div class="field"><label>استایل تبلیغ</label><div class="chips">
  <button class="chip active" data-style="cinematic">🎬 سینمایی</button>
  <button class="chip" data-style="modern">⚡ مدرن</button>
  <button class="chip" data-style="luxury">💎 لوکس</button>
  <button class="chip" data-style="sales">🛍️ فروش</button>
  <button class="chip" data-style="social">📱 ریلز</button>
 </div></div>
 <div class="field"><label>رنگ برند</label><input id="brandColor" type="color" value="#7c5cff" style="width:100%;height:43px;padding:4px;border-radius:12px;background:#09090e;border:1px solid #32323d"></div>
 <div class="field">
  <label>عکس و ویدئو</label>
  <label class="drop"><input id="files" type="file" accept="image/*,video/*" multiple><div class="icon">⬆</div><b>فایل‌ها را اینجا انتخاب کنید</b><small>PNG · JPG · WEBP · MP4 · WebM — چند فایل همزمان مجاز است</small></label>
  <div class="assets" id="assets"></div>
 </div>
 <div class="field"><label>موسیقی پس‌زمینه (اختیاری)</label><label class="drop" style="padding:12px"><input id="music" type="file" accept="audio/*"><b>🎵 انتخاب موسیقی</b><small id="musicName">موسیقی اضافه نشده</small></label></div>
 <div class="actions"><button class="primary" id="scriptBtn">✦ ساخت سناریو با AI</button><button class="secondary" id="demoBtn">نمونه بازارک</button></div>
 <div id="notice" class="notice">اگر APIهای Cloudflare تنظیم نشده باشند، برنامه با حالت داخلی هم کار می‌کند.</div>
 <div class="status" id="status">آماده.</div><div class="meter"><i id="bar"></i></div>
</section>

<section class="card preview">
 <div class="step">مرحله ۲</div><h2>پیش‌نمایش و خروجی</h2>
 <div class="stage" id="stage"><div class="empty"><div class="emoji">🎞️</div>پیش‌نمایش تبلیغ اینجا نمایش داده می‌شود</div></div>
 <div class="actions">
  <button class="primary" id="renderBtn" disabled>▶ ساخت ویدئو</button>
  <button class="secondary" id="downloadBtn" disabled>⬇ دانلود</button>
 </div>
 <div class="mini"><span id="voiceState">گوینده: آماده</span><span id="format">WEBM · 720×1280</span></div>
 <div class="script" id="script" style="display:none"></div>
</section>
</div>
<footer>AD Maker AI · ساخته‌شده برای تبلیغات کوتاه و شبکه‌های اجتماعی</footer>
</div>`;

const setStatus=(s,p)=>{ $("#status").textContent=s; if(p!=null)$("#bar").style.width=p+"%"; };
document.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.style=b.dataset.style});
$("#lang").onchange=e=>state.language=e.target.value;
$("#duration").onchange=e=>state.duration=+e.target.value;
$("#brandColor").onchange=e=>state.brandColor=e.target.value;

$("#files").onchange=()=>{
 state.assets=[...$("#files").files]; $("#assets").innerHTML="";
 for(const f of state.assets){
  if(f.type.startsWith("image/")){const im=document.createElement("img");im.className="asset";im.src=URL.createObjectURL(f);$("#assets").append(im)}
  else{const v=document.createElement("div");v.className="asset video";v.textContent="🎥";$("#assets").append(v)}
 }
};
$("#music").onchange=e=>$("#musicName").textContent=e.target.files[0]?.name||"موسیقی اضافه نشده";

$("#demoBtn").onclick=()=>{
 $("#brand").value="بازارک";
 $("#desc").value="بازارک یک بازار آنلاین برای خرید و فروش کالا، خدمات و آگهی‌ها در افغانستان است. کاربران می‌توانند آگهی ثبت کنند، محصولات مورد نیازشان را پیدا کنند و با فروشنده ارتباط بگیرند.";
 $("#lang").value="fa";state.language="fa";setStatus("نمونه بازارک آماده شد.",0);
};

async function api(path,payload){
 const r=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
 if(!r.ok) throw new Error(await r.text()||"API error");
 return r.json();
}
function fallbackScript(brand,desc){
 if(state.language==="en")return `${brand}\n${desc}\nDiscover it. Buy it. Sell it.\n${brand} — simple, fast and made for you.`;
 if(state.language==="ps")return `${brand}\n${desc}\nخپل اعلان خپور کړئ، پیرودونکي پیدا کړئ او اسانه پېر او پلور وکړئ.\nهمدا اوس یې تجربه کړئ.`;
 return `${brand}\n${desc}\nدر بازارک، آگهی‌ات را ثبت کن و بیشتر دیده شو.\nمحصول مورد نیازت را پیدا کن و با فروشنده ارتباط بگیر.\nبازارک؛ خرید و فروش، ساده و سریع.`;
}

$("#scriptBtn").onclick=async()=>{
 if(state.busy)return;
 const brand=$("#brand").value.trim(), desc=$("#desc").value.trim();
 if(!brand||!desc){setStatus("نام برند و توضیح محصول را وارد کنید.",0);return}
 state.busy=true;$("#scriptBtn").disabled=true;setStatus("در حال تحلیل و ساخت سناریو...",18);
 try{
  let j;
  try{j=await api("/api/generate-script",{brand,description:desc,language:state.language,duration:state.duration,style:state.style})}
  catch{j={script:fallbackScript(brand,desc),fallback:true}}
  state.script=j.script||fallbackScript(brand,desc);
  $("#script").style.display="block";$("#script").textContent=state.script;
  setStatus(j.fallback?"سناریوی داخلی آماده شد. برای AI واقعی Secret تنظیم کنید.":"سناریوی AI آماده شد.",55);
  $("#renderBtn").disabled=false;
 }finally{state.busy=false;$("#scriptBtn").disabled=false}
};

async function getVoice(){
 $("#voiceState").textContent="گوینده: در حال تولید...";
 try{
  const j=await api("/api/tts",{text:state.script,language:state.language});
  if(j.audio){state.voiceBlob=base64ToBlob(j.audio,j.mime||"audio/mpeg");$("#voiceState").textContent="گوینده: آماده ✓";return state.voiceBlob}
 }catch{}
 state.voiceBlob=null;$("#voiceState").textContent="گوینده: حالت مرورگر";return null;
}
function base64ToBlob(b64,mime){const bin=atob(b64),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime})}

$("#renderBtn").onclick=async()=>{
 if(!state.script)return;$("#renderBtn").disabled=true;$("#downloadBtn").disabled=true;setStatus("در حال آماده‌سازی صدا و صحنه‌ها...",60);
 try{const voice=await getVoice();state.lastVideo=await renderVideo(voice);$("#downloadBtn").disabled=false;setStatus("ویدئو آماده شد. روی دانلود بزنید.",100)}
 catch(e){setStatus("خطا در ساخت ویدئو: "+e.message,0)}
 finally{$("#renderBtn").disabled=false}
};

async function renderVideo(voiceBlob){
 const W=720,H=1280,canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext("2d");$("#stage").innerHTML="";$("#stage").append(canvas);
 const fps=30,videoStream=canvas.captureStream(fps);
 let audioCtx=null,dest=null,voiceSource=null,musicSource=null;
 if(voiceBlob||$("#music").files[0]){
  audioCtx=new AudioContext();dest=audioCtx.createMediaStreamDestination();
  if(voiceBlob){const buf=await audioCtx.decodeAudioData(await voiceBlob.arrayBuffer());voiceSource=audioCtx.createBufferSource();voiceSource.buffer=buf;voiceSource.connect(dest);voiceSource.connect(audioCtx.destination)}
  const music=$("#music").files[0];
  if(music){const buf=await audioCtx.decodeAudioData(await music.arrayBuffer());musicSource=audioCtx.createBufferSource();musicSource.buffer=buf;musicSource.loop=true;const gain=audioCtx.createGain();gain.gain.value=.16;musicSource.connect(gain).connect(dest);musicSource.connect(gain);musicSource.start()}
  if(voiceSource)voiceSource.start();
 }
 const tracks=[...videoStream.getVideoTracks(),...(dest?dest.stream.getAudioTracks():[])];
 const stream=new MediaStream(tracks);
 let mime="video/webm;codecs=vp9,opus";if(!MediaRecorder.isTypeSupported(mime))mime="video/webm;codecs=vp8,opus";if(!MediaRecorder.isTypeSupported(mime))mime="video/webm";
 const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000,audioBitsPerSecond:128000});
 const chunks=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
 const done=new Promise((resolve,reject)=>{rec.onstop=()=>resolve(new Blob(chunks,{type:mime}));rec.onerror=e=>reject(e.error||new Error("MediaRecorder error"))});
 rec.start(250);
 const imgs=[];const vids=[];
 for(const f of state.assets){
  if(f.type.startsWith("image/")){const im=new Image();im.src=URL.createObjectURL(f);await new Promise(r=>im.onload=r);imgs.push(im)}
  else if(f.type.startsWith("video/")){const v=document.createElement("video");v.src=URL.createObjectURL(f);v.muted=true;v.playsInline=true;await new Promise(r=>v.onloadedmetadata=r);vids.push(v)}
 }
 const lines=state.script.split(/\n+/).filter(x=>x.trim());
 const start=performance.now(),total=state.duration*1000;
 const brand=$("#brand").value.trim();
 function draw(now){
  const elapsed=now-start,p=Math.min(1,elapsed/total),index=Math.min(lines.length-1,Math.floor(p*lines.length));
  ctx.fillStyle="#050507";ctx.fillRect(0,0,W,H);
  let media=imgs.length?imgs[index%imgs.length]:null;
  if(media){const s=Math.max(W/media.width,H/media.height),iw=media.width*s,ih=media.height*s,zoom=1+.025*Math.sin(p*Math.PI*4);ctx.globalAlpha=.72;ctx.drawImage(media,(W-iw*zoom)/2,(H-ih*zoom)/2,iw*zoom,ih*zoom);ctx.globalAlpha=1;ctx.fillStyle="rgba(0,0,0,.48)";ctx.fillRect(0,0,W,H)}
  const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,hexAlpha(state.brandColor,.42));grad.addColorStop(.45,"rgba(0,0,0,.1)");grad.addColorStop(1,"rgba(0,0,0,.9)");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  ctx.direction="rtl";ctx.textAlign="center";
  ctx.fillStyle="#fff";ctx.font="900 44px Vazirmatn,Arial";ctx.fillText(brand,W/2,150);
  ctx.fillStyle="#fff";ctx.font="800 31px Vazirmatn,Arial";wrap(ctx,lines[index]||"",W/2,570,600,52,5);
  ctx.fillStyle="#d8d0ff";ctx.font="600 19px Vazirmatn,Arial";ctx.fillText("AD Maker AI",W/2,1195);
  ctx.fillStyle="#fff";ctx.fillRect(70,1220,(W-140)*p,4);
  setStatus("در حال رندر ویدئو...",60+Math.round(p*38));
  if(elapsed<total)requestAnimationFrame(draw);else{rec.stop();voiceSource?.stop();musicSource?.stop();audioCtx?.close()}
 }
 requestAnimationFrame(draw);return done;
}
function hexAlpha(hex,a){const h=hex.replace("#","");const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return`rgba(${r},${g},${b},${a})`}
function wrap(ctx,text,x,y,maxWidth,lineH,maxLines){const words=text.split(/\s+/),lines=[];let line="";for(const w of words){const test=line?line+" "+w:w;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=w}else line=test}if(line)lines.push(line);lines.slice(0,maxLines).forEach((l,i)=>ctx.fillText(l,x,y+i*lineH))}

$("#downloadBtn").onclick=()=>{if(!state.lastVideo)return;const a=document.createElement("a");a.href=URL.createObjectURL(state.lastVideo);a.download=`ad-maker-${Date.now()}.webm`;a.click()};
