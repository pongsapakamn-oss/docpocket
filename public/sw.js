// DocPocket service worker: caches ONLY the app shell (same-origin HTML/JS/CSS/fonts/icons).
// It never touches cross-origin requests (Supabase), requests carrying Authorization, signed URLs,
// blob: URLs or document images, so no identity document is ever written to Cache Storage.
const V='docpocket-v1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(['/','/manifest.webmanifest','/icons/icon-192.png'])));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||r.headers.has('authorization'))return;
  if(r.mode==='navigate'){e.respondWith(fetch(r).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(h=>h.put('/',c))}return x}).catch(()=>caches.match('/')));return}
  if(u.pathname.startsWith('/assets/')||u.pathname.startsWith('/icons/')){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(h=>h.put(r,c))}return x})))}});
