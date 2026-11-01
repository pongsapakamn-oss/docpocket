export const MAX=100*1024*1024, LIM=20;
export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const ls=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
export const uid=()=>crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
export const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};

/* ---- Thai dates (Buddhist Era or Gregorian) ---- */
export const TM=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
export const TMF=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
export const yr=(y,era)=>era==='BE'?y+543:y;
export function fmtDate(iso,era,full){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso||'');if(!m)return'-';
  const y=+m[1],mo=+m[2]-1,d=+m[3];return `${d} ${(full?TMF:TM)[mo]} ${full?(era==='BE'?'พ.ศ. ':'ค.ศ. '):''}${yr(y,era)}`}
export function fmtDT(ts,era){const d=new Date(ts),z=n=>String(n).padStart(2,'0');
  return `${d.getDate()} ${TM[d.getMonth()]} ${yr(d.getFullYear(),era)} · ${z(d.getHours())}:${z(d.getMinutes())}`}
export const validDate=(y,m,d)=>{const t=new Date(y,m-1,d);return t.getFullYear()===y&&t.getMonth()===m-1&&t.getDate()===d&&t<=new Date()};

/* ---- upload validation: size + magic bytes (never trust the file extension) ---- */
export async function sniff(f){
  const h=[...new Uint8Array(await f.slice(0,12).arrayBuffer())].map(x=>x.toString(16).padStart(2,'0')).join('');
  if(h.startsWith('ffd8ff'))return'image/jpeg';
  if(h.startsWith('89504e47'))return'image/png';
  if(h.startsWith('52494646')&&h.slice(16,24)==='57454250')return'image/webp';
  return null}
/* High-quality uploads: a JPG/PNG/WebP up to MAX is stored byte-for-byte (full resolution, no re-compression).
   Only formats a browser cannot store (HEIC from a computer, AVIF, GIF, BMP, TIFF) or files over MAX are converted,
   at the largest size the device's canvas can hold and JPEG quality 0.95. */
const IOS=typeof navigator!=='undefined'&&(/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
export const CMAX=IOS?16777216:40000000; // max canvas pixels (iOS Safari refuses canvases above ~16.7 MP)
export const fitK=(w,h)=>Math.min(1,Math.sqrt(CMAX/Math.max(1,w*h))*.998);
const fmtName=f=>((f.type||'').replace('image/','')||(f.name||'').split('.').pop()||'ไม่ทราบ').toUpperCase();
export async function prepImage(f){
  if(!f||!f.size)throw new Error('ไฟล์ว่างเปล่า');
  const m=await sniff(f);
  if(m&&f.size<=MAX){try{await loadImg(f)}catch(e){try{(await createImageBitmap(f)).close?.()}catch(e2){throw new Error('ไฟล์ภาพนี้เสียหรือเปิดไม่ได้ ลองเลือกรูปอื่น')}}return f}
  let b;try{b=await bitmap(f)}catch(e){throw new Error(/^(image\/(jpe?g|png|webp)|text\/.*|application\/.*|)$/.test(f.type||'')?'ไฟล์นี้ไม่ใช่รูปภาพ หรือไฟล์เสีย ลองเลือกรูป JPG, PNG หรือ HEIC':`เบราว์เซอร์นี้เปิดรูปแบบ ${fmtName(f)} ไม่ได้ ลองเลือกเป็น JPG หรือ PNG (บน iPhone เลือกจากคลังรูปภาพได้เลย)`)}
  const [w,h]=dim(b);
  for(const [sc,q] of [[1,.95],[1,.9],[.75,.9],[.5,.9]]){
    const k=fitK(w,h)*sc,c=cnv(Math.max(1,Math.round(w*k)),Math.max(1,Math.round(h*k))),x=c.getContext('2d');
    x.imageSmoothingQuality='high';x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(b,0,0,c.width,c.height);
    const o=await new Promise(r=>c.toBlob(r,'image/jpeg',q));if(o&&o.size<=MAX)return o}
  throw new Error('รูปใหญ่เกิน 100 MB และย่อไม่ได้ ลองเลือกรูปอื่น')}
export async function checkFile(f){
  if(!f||!f.size)throw new Error('ไฟล์ว่างเปล่า');
  if(f.size>MAX)throw new Error('ไฟล์ใหญ่เกิน 100 MB');
  const m=await sniff(f);if(!m)throw new Error('รองรับเฉพาะภาพ JPG, PNG และ WebP');return m}
export const ext=m=>({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[m]||'bin');
export const safeName=s=>String(s).replace(/[^\p{L}\p{N}_-]+/gu,'_').slice(0,40)||'document';

/* ---- image processing: every effect produces a NEW blob; originals are never touched ---- */
export function loadImg(blob){return new Promise((ok,no)=>{const u=URL.createObjectURL(blob),i=new Image();
  i.onload=()=>{URL.revokeObjectURL(u);ok(i)};i.onerror=()=>{URL.revokeObjectURL(u);no(new Error('เปิดภาพไม่ได้'))};i.src=u})}
// <img> decoding first: lets the browser handle very large photos (and EXIF rotation); ImageBitmap as fallback
export async function bitmap(blob){
  try{return await loadImg(blob)}
  catch(e){return await createImageBitmap(blob,{imageOrientation:'from-image'})}}
const dim=b=>[b.naturalWidth||b.width,b.naturalHeight||b.height];
const cnv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const toBlob=(c,t='image/jpeg',q=.95)=>new Promise((ok,no)=>c.toBlob(b=>b?ok(b):no(new Error('สร้างภาพไม่สำเร็จ')),t,q));
export async function makeThumb(blob,max=480){
  const b=await bitmap(blob),[w,h]=dim(b),s=Math.min(1,max/Math.max(w,h)),c=cnv(Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s))),x=c.getContext('2d');
  x.imageSmoothingQuality='high';x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(b,0,0,c.width,c.height);return toBlob(c,'image/jpeg',.85)}
// display copy with rotation/crop applied; the stored original is never changed. Drawn in one pass, only the needed region.
export async function processed(blob,deg=0,crop=null){
  if(!deg&&!crop)return blob;
  const b=await bitmap(blob),[w,h]=dim(b),sw=deg%180!==0,W=sw?h:w,H=sw?w:h,r=crop||{x:0,y:0,w:1,h:1};
  const ow=Math.max(1,r.w*W),oh=Math.max(1,r.h*H),k=fitK(ow,oh),c=cnv(Math.max(1,Math.round(ow*k)),Math.max(1,Math.round(oh*k))),x=c.getContext('2d');
  x.imageSmoothingQuality='high';x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
  x.scale(k,k);x.translate(-r.x*W,-r.y*H);x.translate(W/2,H/2);x.rotate(deg*Math.PI/180);x.drawImage(b,-w/2,-h/2);
  return toBlob(c,'image/jpeg',.95)}
export function previewCanvas(b,deg,max=1400){
  const [w,h]=dim(b),sw=deg%180!==0,W=sw?h:w,H=sw?w:h,s=Math.min(1,max/Math.max(W,H)),c=cnv(Math.round(W*s),Math.round(H*s)),x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.translate(c.width/2,c.height/2);x.rotate(deg*Math.PI/180);x.scale(s,s);x.drawImage(b,-w/2,-h/2);return c}
export async function squareAvatar(blob,n=256){
  const b=await bitmap(blob),[w,h]=dim(b),s=Math.min(w,h),c=cnv(n,n);
  c.getContext('2d').drawImage(b,(w-s)/2,(h-s)/2,s,s,0,0,n,n);return toBlob(c,'image/jpeg',.85)}

/* ---- watermark: overlay for previews (CSSOM only, no inline style attributes) + baked copy on request ---- */
export const WMPOS=[['tile','ซ้ำทั้งภาพ'],['center','กลางภาพ'],['corner','มุมขวาล่าง']];
function tileSvg(t){const s=`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="170"><text x="150" y="85" text-anchor="middle" transform="rotate(-24 150 85)" font-family="sans-serif" font-size="15" font-weight="700" fill="#fff" stroke="#000" stroke-width=".7" paint-order="stroke">${esc(t)}</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(s).replace(/'/g,'%27').replace(/\(/g,'%28').replace(/\)/g,'%29')}")`}
export function applyWM(el,wm){
  el.textContent='';el.className='wmo';el.style.backgroundImage='';el.style.opacity='';
  if(!wm.on){el.hidden=true;return}el.hidden=false;el.style.opacity=String(wm.op);
  if(wm.pos==='tile'){el.style.backgroundImage=tileSvg(wm.text)}
  else{el.classList.add(wm.pos==='center'?'wm-c':'wm-r');const b=document.createElement('b');b.textContent=wm.text;el.append(b)}}
function drawWM(x,w,h,wm){
  if(!wm.on)return;const fs=Math.max(16,Math.min(w,h)/26);x.save();x.globalAlpha=wm.op;
  x.font=`700 ${fs}px "Noto Sans Thai",Loma,system-ui,sans-serif`;x.fillStyle='#fff';x.strokeStyle='#000';x.lineWidth=fs/12;x.lineJoin='round';x.textBaseline='middle';
  const put=(t,px,py)=>{x.strokeText(t,px,py);x.fillText(t,px,py)};
  if(wm.pos==='tile'){x.translate(w/2,h/2);x.rotate(-Math.PI/7.5);x.textAlign='center';const sx=x.measureText(wm.text).width+fs*3,sy=fs*4.2,d=Math.hypot(w,h);let r=0;
    for(let py=-d;py<d;py+=sy,r++)for(let px=-d+(r%2?sx/2:0);px<d;px+=sx)put(wm.text,px,py)}
  else if(wm.pos==='center'){x.translate(w/2,h/2);x.rotate(-Math.PI/7.5);x.textAlign='center';x.font=x.font.replace(/[\d.]+px/,`${fs*1.7}px`);put(wm.text,0,0)}
  else{x.textAlign='right';put(wm.text,w-fs*.7,h-fs)}
  x.restore()}
export async function watermarkedCopy(blob,deg,crop,wm){
  const src=await processed(blob,deg,crop),b=await bitmap(src),[w0,h0]=dim(b),k=fitK(w0,h0),w=Math.round(w0*k),h=Math.round(h0*k),c=cnv(w,h),x=c.getContext('2d');
  x.imageSmoothingQuality='high';x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(b,0,0,w,h);drawWM(x,w,h,wm);return toBlob(c,'image/jpeg',.93)}
export function saveBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}

/* ---- small LRU for object URLs (keeps memory bounded; nothing is written to Cache Storage) ---- */
export function lru(m,cap,k,make){
  if(m.has(k)){const v=m.get(k);m.delete(k);m.set(k,v);return v.p}
  const v={u:null};v.p=make().then(u=>{v.u=u;return u},e=>{m.delete(k);throw e});m.set(k,v);
  while(m.size>cap){const [ok,ov]=m.entries().next().value;m.delete(ok);if(ov.u)URL.revokeObjectURL(ov.u)}return v.p}
export function lruClear(m){m.forEach(v=>v.u&&URL.revokeObjectURL(v.u));m.clear()}

/* ---- tiny ZIP writer (stored, no compression — photos are already compressed); UTF-8 file names ---- */
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRCT[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
export async function zipStore(files){
  const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  for(const f of files){const data=new Uint8Array(await f.blob.arrayBuffer()),nm=enc.encode(f.name),crc=crc32(data);
    const h=new DataView(new ArrayBuffer(30));[[0,0x04034b50,4],[4,20,2],[6,0x0800,2],[8,0,2],[10,0,2],[12,0x21,2],[14,crc,4],[18,data.length,4],[22,data.length,4],[26,nm.length,2],[28,0,2]].forEach(([o,v,n])=>n===4?h.setUint32(o,v,true):h.setUint16(o,v,true));
    parts.push(h,nm,data);
    const c=new DataView(new ArrayBuffer(46));[[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x0800,2],[10,0,2],[12,0,2],[14,0x21,2],[16,crc,4],[20,data.length,4],[24,data.length,4],[28,nm.length,2],[30,0,2],[32,0,2],[34,0,2],[36,0,2],[38,0,4],[42,off,4]].forEach(([o,v,n])=>n===4?c.setUint32(o,v,true):c.setUint16(o,v,true));
    cen.push(c,nm);off+=30+nm.length+data.length}
  const cs=cen.reduce((a,x)=>a+x.byteLength,0),e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cen,e],{type:'application/zip'})}

/* ---- card information kept in the profile: Thai 13-digit ID number (with its check digit) and 12-digit member number ---- */
export const digits=s=>String(s??'').replace(/\D/g,'');
export const idNumberOk=s=>{const d=digits(s);if(d.length!==13)return false;let t=0;for(let i=0;i<12;i++)t+=+d[i]*(13-i);return (11-t%11)%10===+d[12]};
export const fmtId=s=>{const d=digits(s).slice(0,13),o=[];let i=0;for(const n of [1,4,5,2,1]){if(i>=d.length)break;o.push(d.slice(i,i+n));i+=n}return o.join('-')};
export const fmtMember=s=>digits(s).slice(0,12).replace(/(\d{4})(?=\d)/g,'$1 ');
/* the fictional values used by DEMO mode and by "รีเซ็ตเป็นค่าเริ่มต้น" (the ID number starts with 0, which no real Thai ID number does) */
export const DEMO_CARD={display_name:'สมหญิง ตัวอย่างดี',display_name_en:'Somying Sample',id_number:'0000000000001',address:'99 หมู่ที่ 9 ซอยตัวอย่าง 1 ถนนตัวอย่าง ตำบลตัวอย่าง อำเภอตัวอย่าง จังหวัดตัวอย่าง 10000 (ที่อยู่สมมติ)',dob:'1990-05-15',card_issued_on:'2024-01-15',card_expires_on:'2032-01-14',member_no:'000000000000'};

/* ---- the real shape of an identity card and automatic framing ----
   CARD = ISO/IEC 7810 ID-1 (85.60 x 53.98 mm), the size of Thai ID cards, driving licences and bank cards. */
export const CARD=856/540;
/* finds the card in a photo of a card lying on a plain background (border colour = background); returns a normalised box or null */
export function detectCard(b,loose){
  const w0=b.naturalWidth||b.width,h0=b.naturalHeight||b.height,k=Math.min(1,260/Math.max(w0,h0)),w=Math.max(16,Math.round(w0*k)),h=Math.max(16,Math.round(h0*k)),c=cnv(w,h),x=c.getContext('2d',{willReadFrequently:true});
  x.drawImage(b,0,0,w,h);let d;try{d=x.getImageData(0,0,w,h).data}catch(e){return null}
  const m=Math.max(2,Math.round(Math.min(w,h)*.04)),px=[];
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(i<m||j<m||i>=w-m||j>=h-m){const o=(j*w+i)*4;px.push([d[o],d[o+1],d[o+2]])}
  const med=a=>{const s=a.slice().sort((p,q)=>p-q);return s[s.length>>1]},bg=[0,1,2].map(ch=>med(px.map(p=>p[ch])));
  if(px.reduce((a,p)=>a+Math.hypot(p[0]-bg[0],p[1]-bg[1],p[2]-bg[2]),0)/px.length>40)return null; // border is not one even background: nothing reliable to separate the card from
  const rows=new Array(h).fill(0),cols=new Array(w).fill(0),mk=new Uint8Array(w*h);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const o=(j*w+i)*4;if(Math.hypot(d[o]-bg[0],d[o+1]-bg[1],d[o+2]-bg[2])>46){rows[j]++;cols[i]++;mk[j*w+i]=1}}
  const ys=[],xs=[];rows.forEach((n,j)=>n>w*.3&&ys.push(j));cols.forEach((n,i)=>n>h*.3&&xs.push(i));
  if(ys.length<h*.3||xs.length<w*.3)return null;
  const r={x:xs[0]/w,y:ys[0]/h,w:(xs[xs.length-1]-xs[0]+1)/w,h:(ys[ys.length-1]-ys[0]+1)/h},a=r.w*r.h;
  if(!(a>=.25&&a<=.97&&r.w>=.4&&r.h>=.4))return null;
  // a card is a solid shape (a text page is not) and has the card's proportions, lying down or standing on its side
  const x0=Math.round(r.x*w),y0=Math.round(r.y*h),x1=Math.min(w,Math.round((r.x+r.w)*w)),y1=Math.min(h,Math.round((r.y+r.h)*h));let on=0;for(let j=y0;j<y1;j++)for(let i=x0;i<x1;i++)on+=mk[j*w+i];
  if(on/Math.max(1,(x1-x0)*(y1-y0))<.6)return null;
  const ar=(r.w*w)/(r.h*h);return loose||Math.abs(ar/CARD-1)<=.15||Math.abs(ar*CARD-1)<=.1?r:null}
/* the card-shaped crop (normalised) that contains box r with a little margin, as large as the picture allows */
export function cardCrop(r,W,H,A=CARD,pad=-.004){ // pad<0: a hair inside the detected edge so no table shows at the card's edge
  const bw=Math.min(1,r.w+pad*2)*W,bh=Math.min(1,r.h+pad*2)*H;let pw=Math.max(bw,bh*A),ph=pw/A;if(ph>H){ph=H;pw=ph*A}if(pw>W){pw=W;ph=pw/A}
  const cl=(v,a,b)=>Math.min(b,Math.max(a,v)),cx=cl(r.x+r.w/2,pw/2/W,1-pw/2/W),cy=cl(r.y+r.h/2,ph/2/H,1-ph/2/H);
  return{x:cx-pw/2/W,y:cy-ph/2/H,w:pw/W,h:ph/H}}
/* automatic framing for an upload: detected card -> card-shaped crop around it; a photo that is already almost card-shaped -> trimmed to the exact ratio; otherwise no crop.
   portrait:true means a card standing on its side was found (the caller can rotate the picture first). */
export function smartCrop(src,force){
  const W=src.naturalWidth||src.width,H=src.naturalHeight||src.height,r=detectCard(src,force);let cr=null,portrait=false;
  if(r){portrait=(r.w*W)/(r.h*H)<.85;cr=cardCrop(r,W,H)}else if(force||Math.abs(W/H/CARD-1)<=.12)cr=cardCrop({x:0,y:0,w:1,h:1},W,H);
  if(cr&&cr.w>=.9995&&cr.h>=.9995)cr=null;const f=n=>+n.toFixed(4);
  return{crop:cr?{x:f(cr.x),y:f(cr.y),w:f(cr.w),h:f(cr.h)}:null,portrait,found:!!r}}
