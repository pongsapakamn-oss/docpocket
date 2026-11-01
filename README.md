# DocPocket — กระเป๋าเอกสารส่วนตัว

> **Status:** open-source starter. Everything on screen in DEMO mode is fictional sample data stored in your browser only.

## Try it in 1 minute (no Supabase needed)
```bash
npm install
npm run build:mock          # builds one self-contained file: dist-mock/index.html
npx http-server dist-mock   # or: python3 -m http.server -d dist-mock 8765
# open http://localhost:8765/?demo   (DEMO passcode: 00000000)
```
DEMO runs entirely in memory/browser; it never contacts any server.

## Put the demo on your phone's home screen (no Supabase needed)
1. Push this repo to GitHub, then on [vercel.com](https://vercel.com) choose **Add New → Project** and import it (framework Vite; the settings in `vercel.json` are used).
2. Before deploying, open **Environment Variables** and add `VITE_DEMO_ONLY` = `1`. Deploy.
3. Open the `https://your-project.vercel.app` address in **Safari (iPhone)** or **Chrome (Android)**:
   - iPhone: Share → **Add to Home Screen**
   - Android: ⋮ menu → **Install app** / **Add to Home screen**
The installed app opens straight into the DEMO (fictional data, passcode 00000000, everything stays on the device). For real accounts, leave `VITE_DEMO_ONLY` out and set the two Supabase variables instead (see above).

## License and disclaimer
MIT — see `LICENSE`. DocPocket is **not** a government app, uses no government logos or names, and does not verify, issue or certify any document. If you deploy it for real users you are responsible for your own Supabase/Vercel setup, privacy policy (`public/privacy.html`) and PDPA compliance.

## Contributing
Issues and pull requests are welcome. The automated checks are Python Playwright scripts in `tests/` (see "Test build" below). Please never commit real ID documents, photos of real people, keys or `.env` files.

An independent personal document organiser (installable PWA). Users sign up, upload photos of their own documents (front and back), view them privately, and save watermarked copies on request. **It is not affiliated with any government body and does not verify, certify or generate any document or credential.**

Stack: Vite (vanilla JS, no framework) · Supabase (Auth, Postgres + RLS, private Storage) · Vercel.

## What you must do (needs your accounts)
1. **Supabase project** — create one (pick a region close to your users). SQL Editor → run `supabase/schema.sql`.
2. **Auth settings** — Email provider on with *Confirm email*; minimum password length 10+; enable MFA → TOTP; *URL Configuration*: Site URL = your production URL, Redirect URLs = production URL and `http://localhost:5173`.
3. **Custom SMTP** — Supabase's built-in mailer is rate-limited and not meant for production.
4. **Keys** — Project Settings → API → copy *Project URL* and the **anon** key. Never use the `service_role` key anywhere in this project.
5. **Local run** — `cp .env.example .env`, fill both values, `npm install`, `npm run dev`. Camera needs HTTPS or `localhost`.
6. **Vercel** — import the repo (framework Vite, build `npm run build`, output `dist` are in `vercel.json`). Add env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, deploy.
7. **Domain + HTTPS** — Vercel → Settings → Domains → add your domain and create the DNS record Vercel shows. Certificates are automatic; HSTS and a strict CSP are set in `vercel.json`. Then update the Supabase Site URL.
8. **Fill the privacy policy** (`public/privacy.html`) and have Thai counsel review it (see below).

## Install on a phone
- iPhone: open the link in **Safari** → Share → **Add to Home Screen**.
- Android: Chrome menu → **Install app**.
- Desktop Chrome/Edge: install icon in the address bar.

## Features
Home (document preview with front/back flip, expand, pager, shortcuts, banners, announcements) · Documents (library, rename, replace, delete, download original) · Scan (live camera with front/back switch, gallery, native camera fallback, preview, **crop / zoom / rotate editor** with 3:2, 4:3, 1:1, 3:4, 2:3 frames, retake, confirm; front and back saved independently) · Viewer (zoom, **adjust: crop/zoom/rotate**, watermark overlay that stays visible while zooming, watermarked copy on request) · History (uploads, replacements, deletions, views, profile changes, logins, copies) · Settings (profile with Thai/English name, address, phone, email, photo, date of birth with Buddhist-Era or Gregorian display; watermark options; **8-digit app lock** and hide-preview-until-tapped; two-factor; data export; account deletion).

## Security design
- RLS on every table (`user_id = auth.uid()`); the `documents` bucket is **private** with per-user folder policies. Paths are `<user-id>/<doc-id>/<side>`.
- Images load via 60-second signed URLs fetched with `cache: 'no-store'` and held only as in-memory object URLs (small LRU). The service worker caches only the same-origin app shell and never Supabase traffic, signed URLs or document images.
- Uploads: JPG/PNG/WebP only, checked by file signature (not extension), ≤ 100 MB, ≤ 20 documents per user — enforced in the client **and** by the bucket and database.
- Originals are never modified. Rotation (a number) and crop (a normalised rectangle, `document_images.crop`) are stored as metadata and applied to a processed copy for display; the watermark is an overlay, and a baked copy is only created when requested.
- App lock: an 8-digit code (codes saved before this update keep their 6 digits) stored only as a salted PBKDF2 hash (plus its length) on this device, with lock-out after 5 wrong tries and auto-lock on leaving the app. It is a **local convenience lock** against someone picking up your phone — it does not encrypt files, and anyone who can clear the browser's storage can remove it (forgot code → sign out → sign in again). There is no shared default code.
- Strict CSP: no inline scripts or styles; fonts are self-hosted (no Google Fonts).
- Logout and account deletion clear caches; account deletion removes files, rows and the auth user.
- Encryption: TLS in transit; at rest by Supabase's infrastructure (not end-to-end). A watermark is a deterrent, not a security mechanism.

## What was and was not tested
Tested (headless Chromium, iPhone-size viewport, fake camera): `npm run build:mock` produces a single HTML file backed by an **in-memory fake of the Supabase API**; 63 automated checks pass (sign-up validation, upload validation incl. spoofed file types, front/back independence, camera capture, crop/zoom/rotate editor (frames, slider, wheel, rotate, reset, cancel, persisted crop), viewer zoom, app lock (weak codes refused, hash-only storage, lock-out, hide preview), watermark copy and original download, rename, history, profile validation, BE/CE dates, two-factor enrolment, image/document/account deletion) with no console errors.

**Not tested** — you must verify before launch:
- Anything against a real Supabase project (this environment could not reach npm or Supabase). `src/backend.js` is a 6-line client; RLS policies and storage policies in `schema.sql` have not been executed. **Test with two accounts** and confirm neither can read the other's rows or files, including via direct storage URLs.
- `npm run build` (Vite) was not run here. Run it, then Lighthouse's PWA audit.
- Real iPhone Safari and Android Chrome: camera permission prompts, installing, standalone mode, safe areas, splash screens (images are provided for common iPhone sizes only; iPad and other sizes show a plain background).
- Email confirmation and password-reset flows, and the real TOTP flow.

## Before public launch
- **PDPA**: have Thai counsel review `public/privacy.html`, the consent wording, retention periods, controller/DPO details, breach-notification process, cross-border transfer (server region) and processor agreements. Identity documents can reveal sensitive data (e.g. religion, blood group) and need explicit consent.
- Add: abuse/rate limiting, malware scanning for uploads, audit logging, backups policy, monitoring.
- Consider an auto-lock after inactivity and a stricter password policy.

## Test build
`npm run build:mock` → `dist-mock/index.html` (uses esbuild; no server needed). Do not use real documents in it: data lives in the tab and is lost on refresh.


## Upgrading an existing database
If you already ran an earlier `schema.sql`, add the crop column: `alter table document_images add column crop jsonb check (crop is null or (jsonb_typeof(crop)='object' and crop ?& array['x','y','w','h']));`

Document details (your own notes: holder name, document number, issue/expiry dates, note) need these columns too:
`alter table documents add column holder_name text, add column doc_number text, add column issued_on date, add column expires_on date, add column note text;`

## Not verified here
The real Supabase backend and the Vite production build could not be run in the build sandbox (no registry/Supabase access); camera, pinch-zoom and the app-lock timing on real iPhone Safari / Android Chrome also still need a hands-on check.

### Upgrade SQL: raise the upload limit from 10 MB to 100 MB (existing projects)
```sql
alter table public.document_images drop constraint if exists document_images_size_check;
alter table public.document_images add constraint document_images_size_check check(size between 1 and 104857600);
update storage.buckets set file_size_limit=104857600 where id='documents';
```
Note: Supabase also has a **project-wide** per-file limit (Dashboard → Storage → Settings). The Free plan caps it at 50 MB; raising it to 100 MB needs a paid plan. Until then, files between 50 and 100 MB are rejected by Supabase even though the app allows them.

### High-quality uploads (Nov 2026)
- JPG/PNG/WebP up to 100 MB are stored **byte-for-byte** — no resizing or re-compression, any resolution (tested with a 48 MP / 20 MB photo; "ต้นฉบับ" download is identical to the upload).
- Other formats the browser can open (HEIC on Safari, AVIF, GIF, BMP) are converted once to JPEG quality 0.95 at the largest size the device allows.
- Rotated/cropped *display* copies and watermarked copies are drawn in one pass and capped at 16.7 MP on iPhone/iPad (Safari's canvas limit) and 40 MP elsewhere; the stored original is never changed.
- In-app camera asks for up to 4096×3072 and uses full-resolution `ImageCapture.takePhoto()` where available (Android Chrome); on iPhone, "ถ่ายด้วยกล้องเครื่อง" opens the native camera at full resolution.
- Images that a host page refuses as `blob:` URLs fall back to `data:` URLs (works when the test file is opened from disk or inside a sandboxed preview).

### Upgrade SQL: document category (existing projects)
```sql
alter table public.documents add column if not exists category text check(category is null or char_length(category)<=40);
```

### Reference-match changes (Nov 2026)
- Home card: no arrow buttons; tap = flip, swipe left/right = next/previous document.
- "ขยายรูปบัตร": card grows and rotates out of the home card into a large landscape view, light dim behind, round back (top-left) and flip (top-right) buttons only; pinch / double-tap zoom. Adjust, watermarked copy and original download live in the document sheet (เอกสาร tab).
- Details page (person button): read-only layout — document image, number, divider, info card (holder, category, note, issue/expiry) — with "แก้ไขข้อมูล" to edit. All fields are labelled as user-entered.
- Privacy blur: blurred card + padlock; if a passcode is set, revealing asks for it; the card blurs again whenever the app is left.
- Documents tab: search box and category chips.

### "Upgrade DocPocket" brief (Nov 2026)
- Service shortcuts (labels as in the reference): ตรวจสอบคำขอ → History tab; การรับรองเอกสาร → watermarked copy of the card on Home (states it is not an official certification); การแจ้งย้ายที่อยู่ → edit the address in your DocPocket profile (states nothing is filed with any government office); เร็วๆ นี้ → disabled. เอกสารของฉัน / รายละเอียดเอกสาร / จัดการไฟล์ are under ทั้งหมด ›.
- Scan: after saving one side of a document, Scan stays on that document and pre-selects the other side, so front and back end up in the same document.
- Header power button: lock the app now (or set a passcode) / sign out.
- Privacy blur: "คลิกเพื่อแสดงบัตร"; passcode required when one is set; blurs again after the idle time chosen in Settings (min 30 s) and whenever the app is left.
- A document with only a back image opens on its back side.
- Large view (ขยายรูปบัตร): shows the uploaded front/back photos; back and flip buttons only; Escape closes.
- Announcements: DEMO label on sample items, optional `img` (icon/thumbnail) and `src` (source) fields per item in `ANN` (src/main.js), full announcement page and list page.
- Bell: announcements + documents near expiry (Settings → การแจ้งเตือน → 30/60/90 days or off).
- Settings: theme (light / dark / follow device), ZIP download of all originals (stored, full quality, with a JSON data file).
- Scan: shows the saved image of the chosen side with its actions (view, adjust, replace, copy, original, delete).
- Banner carousel uses DocPocket artwork only.

## Run and test locally
1. `npm install` then `npm run dev` (needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`, see top of this file). Production: `npm run build`, deploy `dist/` to Vercel.
2. Test build without a server or account: `node tools/build-mock.mjs` → open `dist-mock/index.html` (auto signs in with fictional sample data; add `?login` to see the sign-in screen).
3. Automated checks (Python Playwright, copies in `tests/`): `run.py` (65 end-to-end), `spec.py` (43 layout/interaction), `brief.py` (32 brief scenarios), `upq.py` (9 upload-quality; run `python3 tests/make_fixtures.py` once to create its large test images), `home_edit.py` (14 banner/announcement editing, incl. saving inside a sandboxed preview), `features.py` (67: Documents, History, DEMO, Back button), `banner.py` (23: banner picture upload), `announcement_pic.py` (19: announcement icon picture), `passcode.py` (21: 8-digit lock, DEMO preset code), `ann_default.py` (18: default announcement icon), `startup.py` (9: no startup display), `passcode_sheet.py` (25: password sheet size, no hint, no blinking while typing), `card_fit.py` (29: real card ratio, edge-to-edge, easy upload + adjust), `profile_card.py` (49: DocPocket branding, DEMO VERSION strip, ข้อมูลบัตร screen, Settings card form, sync, reset), `mobile.py` (231: phone-size sweep), `demo_isolation.py` (10: DEMO never reaches the backend). Serve `dist-mock/` on http://127.0.0.1:8765 first (`demo_isolation.py` needs `npm run build:spy` and `dist-spy/` served on :8767). Run each from inside `tests/`.

### Editable Home banners and announcements (Nov 2026)
Settings → "หน้าหลัก: แบนเนอร์และประกาศ": up to 6 banners (choose one of 3 DocPocket designs, edit the title, lines of text and what tapping does) and up to 20 announcements (title, date, text, built-in icon, optional DEMO label). Saved on the device first (localStorage, so edits survive reloads and work in the test build) and then in `profiles.home` (your account only, RLS); if that column is missing the app keeps the device copy and says so. Banners can also be **your own picture** (see below); announcements can use **your own icon picture** or a built-in icon (see below).
```sql
alter table public.profiles add column if not exists home jsonb check(home is null or pg_column_size(home) < 32768);
```


## Update Nov 2026 (v1.1): Documents, History, DEMO mode, phones
No database change is needed for this update.

### Documents (เอกสาร)
Search (title, holder, number, note, category), category chips **with counts**, status chips (ใกล้หมดอายุ / หมดอายุแล้ว / ภาพไม่ครบ, shown only when something matches), sort (ใหม่สุด · อัปเดตล่าสุด · ชื่อ ก–ฮ · หมดอายุเร็วสุด, remembered on the device), a result count line, pills on every row (front/back status and expiry state), "ล้างการค้นหาและตัวกรอง" when nothing matches, and a notice with the add buttons disabled at 20/20. The document sheet gained "แสดงบนหน้าหลัก". The list thumbnail was stretched by a flex rule and is now a fixed 72×54. "ใกล้หมดอายุ" uses the window chosen in Settings → การแจ้งเตือน (60 days when that is off).

### History (ประวัติ)
Grouped by day (วันนี้ / เมื่อวาน / dated headings), icon per event type, time on each row, filter chips with counts, 25 rows per page with "แสดงเพิ่มเติม", and tapping a row opens its document while that document still exists (rows are matched by the document title stored in the row; a deleted document's rows are not links). History stays append-only (RLS has no update/delete policy).

### DEMO mode (for presenting)
- Open it from the sign-in screen ("ดูตัวอย่างโหมด DEMO", no account needed), from Settings → "โหมด DEMO", or with `?demo` at the end of the URL (works even when Supabase is not configured).
- A small blue **DEMO** badge sits in the header next to ONLINE on every screen (tap it for the DEMO menu), in the app's own blue/white palette. The menu has a 5-step presentation order, "รีเซ็ตข้อมูลตัวอย่าง" and "ออกจากโหมด DEMO". The footer and the Scan screen also say DEMO.
- Data is fictional (6 documents with relative dates so one is expiring and one expired, 31 history rows) and lives only in the tab's memory. In the real build the fake backend is a separate lazily loaded chunk and `sb` is switched to it, so nothing is read from or written to the real account or storage; `demo_isolation.py` checks this against a spy client. Exit reloads the app and returns to the real session (or sign-in).
- Sign-out and delete-account rows are hidden while in DEMO.

### Phones
Inputs are 16px (iOS Safari zooms into smaller ones on focus; this makes form fields ~1px taller in Settings), 36–48px tap targets on touch screens, the safe area is respected on every screen, the passcode keypad fits 320×568 screens, landscape phones use the full height instead of a floating frame, and **Back** (Android button / browser back) closes the top overlay or returns to Home instead of leaving the app.

### Not verified (this update)
Only Chromium was available: phone sizes were emulated (viewport, touch, user agent); **real iPhone Safari / installed PWA and real Android Chrome were not run**, including safe-area insets, the on-screen keyboard, and swipe-back. `npm install` was blocked (no registry), so the Vite production build, and therefore the DEMO code-splitting in a real `vite build`, were checked with an esbuild equivalent (`npm run build:spy`), not with Vite itself. No real Supabase was used.

### Your own banner picture (Nov 2026)
Settings → "หน้าหลัก: แบนเนอร์และประกาศ" → edit or add a banner → **อัปโหลดรูปแบนเนอร์ของฉัน**. Pick JPG/PNG/WebP (checked by file signature, up to 100 MB; other formats the browser can open are converted), frame it in the editor (fixed 1064:248 banner frame with drag/zoom/rotate), and see the live preview before saving. The picture is stored as one 2128×496 JPEG (2× the slide) in the **private** `documents` bucket at `<user-id>/banner-<banner-id>` (covered by the existing per-user storage policies; no SQL change), and the banner record in `profiles.home` keeps only that path. A banner with a picture shows the picture full-bleed (its text is not shown); it can be picture-only. Replacing, removing the picture, deleting the banner, resetting the Home content and deleting the account all remove the stored file. Recommended size 1064×248 px (4.3:1). In DEMO mode pictures stay in memory.

### Your own announcement icon picture (Nov 2026)
Settings → "หน้าหลัก: แบนเนอร์และประกาศ" → edit or add an announcement → **อัปโหลดรูปของฉัน** (above the built-in icons). Same checks as banners (JPG/PNG/WebP by file signature, up to 100 MB; other browser-readable formats converted), framed in the editor with a fixed square frame, stored as one 256×256 JPEG at `<user-id>/ann-<announcement-id>` in the private `documents` bucket (existing storage policies, no SQL change; `profiles.home` keeps only the path). It is shown round in place of the built-in icon on the Home list, the announcement page and the notification list; removing it brings the chosen built-in icon back. Replacing, removing, deleting the announcement, resetting Home and deleting the account all remove the file. In DEMO mode it stays in memory.

### 8-digit passcode, and the DEMO passcode (Nov 2026)
- The app-lock code is now **8 digits** (8 dots on the keypad; new codes only. A code saved earlier keeps working with its 6 digits). Tapping the blurred card ("คลิกเพื่อแสดงบัตร") pops up the keypad whenever a code is set.
- **DEMO mode** starts with the card hidden and the lock preset to **00000000**; the keypad shows that code as a hint so a presenter never gets stuck. Simple codes can be set in DEMO. In DEMO the "hide preview" switch is not saved to the device.
- **Real accounts have no default code.** 00000000, repeated digits and sequences (12345678, 87654321…) are refused when setting a code; a fixed default would let anyone who knows it open the app. `passcode.py` (21 checks) covers all of this, including the 6-digit compatibility case.

## Update Nov 2026 (v1.2): ข้อมูลบัตร screen, Settings card form, DEMO VERSION strip
**Upgrade SQL (existing Supabase projects; new projects get it from `schema.sql`):**
```sql
alter table public.profiles
  add column if not exists id_number text check(id_number is null or id_number ~ '^[0-9]{13}$'),
  add column if not exists member_no text check(member_no is null or member_no ~ '^[0-9]{12}$'),
  add column if not exists card_issued_on date,
  add column if not exists card_expires_on date;
```
If the columns are missing, saving the card form shows "ฐานข้อมูลยังไม่มีคอลัมน์ข้อมูลบัตร" instead of failing silently.

- **Branding:** the app is DocPocket everywhere (title, header, sign-in, About, footer, manifest, install name, icons). No file mentions ThaID or similar names, and no government logo or wording is used; `profile_card.py` scans for this.
- **Home:** the old DEMO labels (header badge, the DEMO pills inside announcement cards, the footer suffix) are gone from Home. One navy **DEMO VERSION** strip sits right under the announcements, outside the cards. It is shown only in DEMO mode and in the test build, because the sentence it stands for is only true there.
- **Person button → ข้อมูลบัตร** (laid out like your latest screenshot): the left round button under the card opens a read-only screen: title ข้อมูลบัตร, the headings รูปหน้าบัตร / รูปหน้าบัตรประจำตัวประชาชน, a large portrait picture (your saved profile picture from Settings, or the neutral silhouette you supplied until one is saved), the formatted ID number, then one card with the Thai name, English name, ที่อยู่, เกิดวันที่, and วันที่ออกบัตร | วันที่หมดอายุ side by side ("-" for anything empty). It does not show the document's front image (that stays on Home and in Documents) and has no edit button; edit in Settings. If "hide preview until tapped" is on, it asks for the passcode first, so it cannot bypass the lock. The earlier per-document Details page (your own notes per document) is still available from Documents → tap a document → "ข้อมูลเอกสาร".
- **Settings:** now starts with ตั้งค่า / แก้ไขข้อมูลบัตร and the 8 fields in the requested order (date pickers; ID number checked for 13 digits and its check digit; member number 12 digits; expiry not before issue; birth date not in the future; Thai name required), บันทึก, รีเซ็ตเป็นค่าเริ่มต้น (asks first) and the DEMO sentence. All the other settings (profile picture, contact details, display, watermark, passcode, banners and announcements, notifications, privacy and account) are kept below it. Phone and e-mail moved to their own small "ข้อมูลติดต่อ" card with its own save button.
- **One source of truth:** Settings writes the single `profiles` row; Home, the header and ข้อมูลบัตร read it (and the one saved profile picture).
- **รีเซ็ตเป็นค่าเริ่มต้น:** in DEMO / test build it restores the fictional DEMO values; in a real account it clears the card fields instead (it must not write fictional values into someone's real profile). Both ask for confirmation first.
- **Sensitive data:** the ID number is personal data you typed yourself; the app does not verify it. Have the PDPA review (README → Before public launch) cover it; `privacy.html` now lists it.

### Default announcement icon (Nov 2026)
Settings → "หน้าหลัก: แบนเนอร์และประกาศ" → **ไอคอนเริ่มต้นของประกาศทั้งหมด**: upload one picture (JPG/PNG/WebP, framed as a square, stored as a 256×256 JPEG at `<user-id>/ann-default` in the private bucket; `profiles.home.annPic` keeps the path and a version). It becomes the round icon of every announcement that has no picture of its own and did not pick another built-in icon, on the Home list, the announcement page and the notification list. "กลับไปใช้ไอคอน DocPocket" (and "คืนค่าแบนเนอร์และประกาศเริ่มต้น") remove it and delete the file; deleting the account deletes it too. No emblem or logo is bundled: the shipped default stays the DocPocket icon, and only pictures you upload yourself are used. No SQL change.

## Update Nov 2026 (v1.3): real ID-card ratio, edge to edge, easier upload + adjust
- **Real ratio:** the Home card, the enlarged view and the new crop frame all use the ISO ID-1 shape 85.6 × 54 mm (856:540 = 1.585), the size of Thai ID cards, licences and bank cards (`CARD` in `src/lib.js`).
- **Edge to edge:** a picture whose shape is within 12% of the card (and everything cropped to the card frame) now fills the frame (`object-fit: cover`, the picture is positioned to the exact frame) with no strips at the sides. Pictures far from the card shape (a page, a portrait photo) stay whole (`contain`). The original file is never changed; rotation and crop are metadata as before.
- **Upload step (Scan):** after you pick or take a photo it is framed to the real card shape automatically: the card is found on a plain background (`detectCard`), a card standing on its side is turned upright, and the picture is cropped to 85.6:54. Solid-card shape and card proportions are required, so a page of text or a page-shaped photo is left whole. Buttons: **ปรับภาพ** (editor), **หมุน 90°**, **ใช้ภาพเต็ม / ครอปให้พอดีบัตร**, ถ่ายใหม่, ยกเลิก, ยืนยันและบันทึก. The document/side pickers collapse into a one-line summary so the picture and all buttons fit on one phone screen. The camera shows a card-shaped guide with the outside dimmed.
- **Editor:** the first frame is now "บัตร 85.6×54"; it opens already around the detected card for card-like pictures, "ตรวจขอบบัตร" re-detects, and a card turned upright is shown whole until turned back.
- Detection is a simple colour test, not machine vision: it works for a card on a plain table, not on a busy background. When it cannot find the card it falls back to a centred card-shaped crop for near-card photos, or no crop, and the editor is one tap away.

### No startup display (Nov 2026)
The "DocPocket · กำลังโหลด…" loading screen and the "กำลังเตรียมโหมด DEMO…" / "เข้าสู่โหมด DEMO แล้ว" toasts that showed at launch are gone: until the first real screen is ready you see only the app's own blue. (Starting DEMO from a button still shows its small toast, because the sign-in screen is on screen while it prepares.) A stalled web font can no longer hold up DEMO (it waits at most 1.2 s for the font), the test/preview build now adds its Google font without blocking the page, and if DEMO preparation ever fails the sign-in screen appears instead of a blank page. `startup.py` checks all of this.

### Password sheet (Nov 2026)
The passcode screen is now a large bottom sheet (74px keys, about three quarters of the screen height, sized to match the reference screenshot) titled **ระบุรหัสผ่าน** (8 dots, keypad, ยกเลิก / ลืมรหัสผ่าน). When it asks for the code to show the card (or to change/turn off the lock) the app stays visible, dimmed, above it and a tap on the dimmed area cancels; the "locked app" screen stays solid so nothing behind it is visible. **There is no hint line any more**: the DEMO code (00000000) is not shown anywhere in the app; it is only documented here. Wrong-code and lock-out messages still appear, because they are feedback, not clues. The blurred card says "คลิกเพื่อแสดงบัตร". Real accounts still have no default code (see the 8-digit passcode section): a fixed code known to everyone would let anyone open the app, and with no hint the owner would not know it either.

### Password sheet: no blinking (Nov 2026)
Typing a digit used to redraw the whole sheet, which replayed its slide-up animation, so it blinked on every key. Now only the dots change while you type; the sheet is only redrawn when its text changes (a wrong-code message, the wait timer), and then without the slide animation. `passcode_sheet.py` checks that the sheet element stays the same while digits are typed.

### Phone: app fills the whole screen (Nov 2026)
On phones the app is now pinned to the full screen (`position:fixed; top/bottom:0`), so the bottom menu sits on the screen edge. Before, it used `100dvh`, which in an iPhone home-screen app can be shorter than the screen and left an empty strip under the menu. Desktop keeps the floating phone frame. `edge.py` checks the menu bottom equals the screen bottom at six phone sizes (an emulator cannot reproduce the iOS quirk itself, so confirm on a real iPhone).

### No page zoom (Nov 2026)
Pinch-zoom and double-tap zoom of the page are switched off (`viewport` tag with `user-scalable=no`, `touch-action: pan-x pan-y`, and the iOS `gesture*` events cancelled in `src/main.js`, because iOS Safari ignores `user-scalable=no`). Scrolling and swiping still work, and the document viewer keeps its own pinch/double-tap zoom. Note this removes a low-vision accessibility option; the text sizes are already large and inputs are 16px. `nozoom.py` checks it.

### Bottom menu icons (Nov 2026)
Lighter outline icons (stroke 1.9, 31px) and 12px labels; the home icon is a house with a keyhole door and the scan button has four dots inside its corner brackets (own drawings in `src/main.js`: `nhome`, `nscan`). The earlier icons are still used elsewhere (service sheet, scan screen).
