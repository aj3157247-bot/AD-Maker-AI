
# AD Maker AI — Final

نسخه کامل و آماده Deploy روی Cloudflare Pages.

## امکانات
- رابط حرفه‌ای و ریسپانسیو
- دری افغانستان، پشتو و انگلیسی
- تولید سناریو با OpenRouter
- fallback به Cloudflare Workers AI در صورت تنظیم binding
- fallback داخلی بدون API
- تولید صدای حرفه‌ای با ElevenLabs در صورت تنظیم Secret
- پشتیبانی از آپلود عکس، ویدئو و موسیقی
- رندر ویدئو در مرورگر با MediaRecorder
- ترکیب صدای گوینده و موسیقی
- خروجی عمودی 720×1280 مناسب Reels/Shorts/TikTok
- دانلود مستقیم WebM
- نمونه آماده بازارک
- API health

## Deploy با GitHub + Cloudflare Pages

Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git.

Build command:
`npm run build`

Build output:
`dist`

Production branch:
`main`

## مهم: Cloudflare Pages Advanced Mode

فایل Worker عمداً در مسیر `public/_worker.js` قرار داده شده است. Vite در زمان build آن را خودکار به:
`dist/_worker.js`
کپی می‌کند.

**این مورد مهم است:** فایل `_worker.js` را در ریشه پروژه قرار ندهید؛ برای این پروژه باید نسخه موجود در `public/_worker.js` وارد خروجی `dist` شود تا مسیرهای `/api/*` توسط Worker اجرا شوند.

## Secrets

در Cloudflare Pages → Settings → Variables and Secrets این Secrets را اضافه کنید:

`OPENROUTER_API_KEY`
برای تولید سناریوی هوشمند.

`ELEVENLABS_API_KEY`
برای صدای گوینده حرفه‌ای.

`ELEVENLABS_VOICE_ID`
اختیاری؛ اگر خالی باشد از Voice ID پیش‌فرض استفاده می‌شود.

هر Secret را برای Production تنظیم کنید و بعد Redeploy بزنید.

## Workers AI اختیاری

می‌توانید در:
Workers & Pages → پروژه → Settings → Bindings → Add → Workers AI

یک binding با نام:
`AI`

اضافه کنید و سپس Redeploy کنید. Cloudflare Pages Functions/Advanced Mode از bindingهای Workers AI پشتیبانی می‌کند.

## تست

بعد از Deploy، این آدرس را باز کنید:
`https://YOUR-PROJECT.pages.dev/api/health`

باید مستقیماً JSON زیر را بدهد (نه صفحه اصلی سایت):
`{"ok":true,"service":"AD Maker AI","version":"2.0.0"}`

## نکته

این نسخه یک استودیوی تبلیغاتی واقعیِ مرورگری است و تولید متن/گوینده را از APIهای اختیاری انجام می‌دهد. تولید ویدئوی مولد سینمایی از متن مثل مدل‌های text-to-video یک قابلیت جداگانه و وابسته به API سرویس و هزینه آن سرویس است؛ این نسخه بدون وابستگی اجباری به چنین سرویس‌هایی قابل استفاده است.
