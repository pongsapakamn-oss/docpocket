import {DEMO_CARD} from './lib.js';
// In-memory fake of the parts of supabase-js that the app uses. TEST ONLY: no security, data lives in this tab.
export const configured=true, isMock=true, demoOnly=false;
const DB={profiles:[],documents:[],document_images:[],activity:[]},FILES=new Map(),USERS=[],LS=new Set();
let session=null,AID=1,MFA={};
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
const wait=()=>new Promise(r=>setTimeout(r,20)),emit=ev=>LS.forEach(f=>f(ev,session)),c=x=>({...x});
const bad=m=>({message:m});
/* ===== optional persistence (public DEMO build only): keeps the demo data on this device in IndexedDB so it survives closing the app ===== */
let PERSIST=false,saveT=0;
const IDB=()=>new Promise((res,rej)=>{const r=indexedDB.open('dp_demo',1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('meta');d.createObjectStore('files')};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const idb=async(store,mode,fn)=>{const d=await IDB();return new Promise((res,rej)=>{const t=d.transaction(store,mode),q=fn(t.objectStore(store));t.oncomplete=()=>{d.close();res(q&&q.result)};t.onerror=t.onabort=()=>{d.close();rej(t.error)}})};
const saveState=()=>{if(!PERSIST)return;clearTimeout(saveT);saveT=setTimeout(()=>{const u=session&&USERS.find(x=>x.id===session.user.id);idb('meta','readwrite',s=>s.put({v:1,DB,AID,MFA,user:u||null},'state')).catch(()=>{})},250)};
const putFile=(p,b)=>{if(PERSIST)idb('files','readwrite',s=>s.put(b,p)).catch(()=>{})};
const delFile=p=>{if(PERSIST)idb('files','readwrite',s=>s.delete(p)).catch(()=>{})};
const getFile=async p=>FILES.get(p)||(PERSIST?await idb('files','readonly',s=>s.get(p)).catch(()=>null):null)||null;
export async function wipeDemoStore(){try{await idb('meta','readwrite',s=>s.clear());await idb('files','readwrite',s=>s.clear())}catch(e){}}
function fill(t,x){const n={...x},now=new Date().toISOString();
  if(t==='activity'){n.id=AID++;n.user_id=n.user_id||session.user.id;n.created_at=n.created_at||now}
  else if(t==='document_images'){n.id=n.id||uuid();n.user_id=n.user_id||session.user.id;n.rotation=n.rotation??0;n.updated_at=n.updated_at||now}
  else if(t==='documents'){n.user_id=n.user_id||session.user.id;n.created_at=n.created_at||now;n.updated_at=n.updated_at||now}
  else if(t==='profiles'){n.created_at=now}
  return n}
function from(t){
  let op='select',F=[],pl=null,ord=null,lim=null,one=null,conf='id';
  const mine=r=>!session||!r.user_id&&!(t==='profiles')||r.user_id===session.user.id||(t==='profiles'&&r.id===session.user.id);
  const rows=()=>DB[t].filter(r=>mine(r)&&F.every(f=>f(r)));
  const b={select(){return b},eq(k,v){F.push(r=>r[k]===v);return b},in(k,a){F.push(r=>a.includes(r[k]));return b},
    order(k,o={}){ord=[k,o.ascending!==false];return b},limit(n){lim=n;return b},maybeSingle(){one='maybe';return b},single(){one='single';return b},
    insert(x){op='insert';pl=x;return b},update(x){op='update';pl=x;return b},upsert(x,o={}){op='upsert';pl=x;conf=o.onConflict||'id';return b},delete(){op='delete';return b},
    then(ok,no){return run().then(ok,no)}};
  async function run(){await wait();
    try{if(!session)return{data:null,error:bad('JWT required')};let out;
      if(op==='select'){out=rows().map(c)}
      else if(op==='insert'){const a=[].concat(pl).map(x=>fill(t,x));
        if(t==='documents'&&DB.documents.filter(r=>r.user_id===session.user.id).length+a.length>20)return{data:null,error:bad('new row violates row-level security policy')};
        a.forEach(x=>DB[t].push(x));out=a.map(c)}
      else if(op==='upsert'){const ks=conf.split(',');out=[];for(const x of [].concat(pl)){const ex=DB[t].find(r=>ks.every(k=>r[k]===x[k]));if(ex){Object.assign(ex,x);out.push(c(ex))}else{const n=fill(t,x);DB[t].push(n);out.push(c(n))}}}
      else if(op==='update'){const rs=rows();rs.forEach(r=>Object.assign(r,pl));out=rs.map(c)}
      else{const rs=rows();DB[t]=DB[t].filter(r=>!rs.includes(r));if(t==='documents')rs.forEach(d=>{DB.document_images=DB.document_images.filter(i=>i.document_id!==d.id)});out=rs.map(c)}
      if(op!=='select')saveState();
      if(ord)out.sort((a,b2)=>(a[ord[0]]>b2[ord[0]]?1:a[ord[0]]<b2[ord[0]]?-1:0)*(ord[1]?1:-1));
      if(lim)out=out.slice(0,lim);
      if(one){const r=out[0]||null;if(one==='single'&&!r)return{data:null,error:bad('No rows')};return{data:r,error:null}}
      return{data:out,error:null}}catch(e){return{data:null,error:bad(e.message)}}}
  return b}
const hasMfa=()=>!!MFA[session?.user.id]?.verified;
export const sb={
  from,
  auth:{
    getSession:async()=>({data:{session}}),
    onAuthStateChange(cb){LS.add(cb);return{data:{subscription:{unsubscribe(){LS.delete(cb)}}}}},
    signUp:async({email,password,options})=>{await wait();if(USERS.find(u=>u.email===email))return{data:null,error:bad('User already registered')};
      const u={id:uuid(),email,password};USERS.push(u);DB.profiles.push({id:u.id,consent_at:options?.data?.consent_at,consent_version:options?.data?.consent_version,created_at:new Date().toISOString()});return{data:{user:{id:u.id,email},session:null},error:null}},
    signInWithPassword:async({email,password})=>{await wait();const u=USERS.find(x=>x.email===email&&x.password===password);
      if(!u)return{data:null,error:bad('Invalid login credentials')};session={user:{id:u.id,email:u.email},aal:'aal1'};emit('SIGNED_IN');return{data:{session},error:null}},
    signOut:async()=>{session=null;emit('SIGNED_OUT');return{error:null}},
    getUser:async()=>session?{data:{user:session.user},error:null}:{data:{user:null},error:bad('Auth session missing')},
    resetPasswordForEmail:async()=>{await wait();return{data:{},error:null}},
    updateUser:async({password})=>{const u=USERS.find(x=>x.id===session?.user.id);if(u&&password)u.password=password;return{data:{user:session?.user},error:null}},
    mfa:{
      getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:session?.aal||'aal1',nextLevel:hasMfa()?'aal2':'aal1'},error:null}),
      listFactors:async()=>({data:{totp:hasMfa()?[{id:'f1',status:'verified'}]:[]},error:null}),
      enroll:async()=>{MFA[session.user.id]={verified:false};return{data:{id:'f1',totp:{qr_code:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#fff" stroke="#000"/><text x="80" y="84" text-anchor="middle" font-size="14">QR (ทดสอบ)</text></svg>'),secret:'MOCKSECRET123456'}},error:null}},
      challenge:async()=>({data:{id:'c1'},error:null}),
      verify:async({code})=>{if(code!=='123456')return{data:null,error:bad('Invalid TOTP code (ทดสอบ: ใช้ 123456)')};MFA[session.user.id]={verified:true};session.aal='aal2';return{data:{},error:null}},
      unenroll:async()=>{MFA[session.user.id]={verified:false};session.aal='aal1';return{data:{},error:null}}}},
  storage:{from:()=>({
    upload:async(path,blob,o={})=>{await wait();if(FILES.has(path)&&!o.upsert)return{data:null,error:bad('The resource already exists')};FILES.set(path,blob);putFile(path,blob);return{data:{path},error:null}},
    createSignedUrl:async path=>{await wait();const b=await getFile(path);return b?{data:{signedUrl:URL.createObjectURL(b)},error:null}:{data:null,error:bad('Object not found')}},
    download:async path=>{await wait();const b=await getFile(path);return b?{data:b,error:null}:{data:null,error:bad('Object not found')}},
    remove:async ps=>{ps.forEach(p=>{FILES.delete(p);delFile(p)});return{data:[],error:null}}})},
  rpc:async name=>{await wait();if(name!=='delete_my_account')return{error:bad('unknown rpc')};const id=session.user.id;
    for(const t of Object.keys(DB))DB[t]=DB[t].filter(r=>(r.user_id||r.id)!==id);const i=USERS.findIndex(u=>u.id===id);if(i>-1)USERS.splice(i,1);session=null;return{data:null,error:null}}
};

/* Test build only: sign in a fictional demo user and preload fictional sample documents so the app opens straight onto the home screen. */
const FONT='Prompt,"Noto Sans Thai",Loma,sans-serif';
function sampleCard(title,side,rows,hue){
  const c=document.createElement('canvas');c.width=1200;c.height=800;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,1200,800);g.addColorStop(0,hue[0]);g.addColorStop(1,hue[1]);x.fillStyle=g;x.fillRect(0,0,1200,800);
  x.strokeStyle='rgba(48,56,145,.35)';x.lineWidth=6;x.strokeRect(24,24,1152,752);
  x.fillStyle='#303891';x.font='700 54px '+FONT;x.fillText(title,70,190);
  x.font='500 30px '+FONT;x.fillStyle='#4a4f8a';x.fillText(side==='front'?'ด้านหน้า · เอกสารตัวอย่าง':'ด้านหลัง · เอกสารตัวอย่าง',70,240);
  x.fillStyle='#1b1d3a';x.font='500 40px '+FONT;rows.forEach((r,i)=>x.fillText(r,70,360+i*80));
  x.fillStyle='rgba(48,56,145,.12)';x.fillRect(860,300,250,300);x.font='500 26px sans-serif';x.fillStyle='#6a6e8e';x.fillText('รูปตัวอย่าง',920,455);
  x.save();x.translate(600,430);x.rotate(-.35);x.font='700 76px sans-serif';x.fillStyle='rgba(198,40,40,.22)';x.textAlign='center';x.fillText('SAMPLE ONLY',0,0);x.restore();
  x.fillStyle='#c62828';x.font='600 26px '+FONT;x.fillText('ข้อมูลสมมติ ไม่ใช่เอกสารจริง',70,740);
  return c}
const cb=(c,q=.9)=>new Promise(r=>c.toBlob(r,'image/jpeg',q));
async function thumbOf(c){const t=document.createElement('canvas');t.width=420;t.height=280;t.getContext('2d').drawImage(c,0,0,420,280);return cb(t,.8)}
export async function seed(){
  const email='demo@docpocket.test',password='demo-password-1';
  await sb.auth.signUp({email,password,options:{data:{}}});
  const r=await sb.auth.signInWithPassword({email,password});if(r.error)return false;const uid=r.data.session.user.id;
  await sb.from('profiles').upsert({id:uid,...DEMO_CARD},{onConflict:'id'});
  const docs=[
    ['ใบอนุญาตตัวอย่าง',{front:['ชื่อ: สมหญิง ตัวอย่างดี','เลขที่: SAMPLE-0001','ออกให้: 1 ม.ค. 2569','หมดอายุ: 1 ม.ค. 2574'],back:['หมายเหตุ: ใช้ทดสอบแอปเท่านั้น','ประเภท: ตัวอย่าง','เงื่อนไข: ไม่มี']},['#eef0ff','#d9dcf5']],
    ['สัญญาเช่าตัวอย่าง',{front:['ผู้เช่า: สมหญิง ตัวอย่างดี','เลขที่สัญญา: SAMPLE-0002','เริ่ม: 1 มี.ค. 2569','สิ้นสุด: 28 ก.พ. 2570']},['#f3efff','#e2d9f7']]];
  for(const [title,sides,hue] of docs.reverse()){ // newest first on Home: the sample with front + back
    const id=uuid(),now=new Date().toISOString();
    const meta=title.startsWith('ใบอนุญาต')?{category:'บัตร / ใบอนุญาต',holder_name:'สมหญิง ตัวอย่างดี',doc_number:'SAMPLE-0001',issued_on:'2026-01-01',expires_on:'2031-01-01',note:'ข้อมูลสมมติสำหรับทดสอบ'}:{category:'สัญญา',holder_name:'สมหญิง ตัวอย่างดี',doc_number:'SAMPLE-0002',issued_on:'2026-03-01',expires_on:'2027-02-28'};
    await sb.from('documents').insert({id,user_id:uid,title,...meta});
    for(const [side,rows] of Object.entries(sides)){
      const c=sampleCard(title,side,rows,hue),blob=await cb(c),path=`${uid}/${id}/${side}`;
      await sb.storage.from('documents').upload(path,blob,{contentType:'image/jpeg',upsert:true});
      await sb.storage.from('documents').upload(path+'.thumb',await thumbOf(c),{contentType:'image/jpeg',upsert:true});
      await sb.from('document_images').upsert({document_id:id,user_id:uid,side,path,mime:'image/jpeg',size:blob.size,rotation:0,crop:null,updated_at:now},{onConflict:'document_id,side'})}}
  return true}

/* ===== DEMO mode data (used by the in-app DEMO mode; lives only in this tab's memory, never reaches a real account) =====
   Everything is fictional. Dates are relative to today so "expiring soon" / "expired" always show up in a presentation. */
let DEMO_UID=null;
function dropUser(id){for(const t of Object.keys(DB))DB[t]=DB[t].filter(r=>(r.user_id||r.id)!==id);for(const k of [...FILES.keys()])if(k.startsWith(id+'/'))FILES.delete(k);
  const i=USERS.findIndex(u=>u.id===id);if(i>-1)USERS.splice(i,1);delete MFA[id]}
const dayStr=n=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const ago=h=>new Date(Date.now()-h*36e5).toISOString();
export const DEMO_EMAIL='presenter@docpocket.demo';
async function restoreDemo(){try{const st=await idb('meta','readonly',s=>s.get('state'));
  if(!st||st.v!==1||!st.user||!st.DB||!(st.DB.profiles||[]).length)return false;
  for(const t of Object.keys(DB))DB[t]=st.DB[t]||[];AID=st.AID||1;MFA=st.MFA||{};USERS.push(st.user);
  session={user:{id:st.user.id,email:st.user.email},aal:'aal1'};DEMO_UID=st.user.id;emit('SIGNED_IN');return true}catch(e){return false}}
// opts.persist: keep the data on this device and reload it next time; opts.reset: throw the saved copy away first
export async function seedDemo(opts={}){
  PERSIST=!!opts.persist&&typeof indexedDB!=='undefined';
  if(PERSIST){try{navigator.storage?.persist?.()}catch(e){}
    if(opts.reset)await wipeDemoStore();else if(await restoreDemo())return true}
  if(DEMO_UID)dropUser(DEMO_UID);
  // never wait long for the web font (in-app browsers can stall on it): draw with whatever is available after 1.2 s
  try{await Promise.race([Promise.all([document.fonts?.load?.('700 54px Prompt'),document.fonts?.load?.('500 30px Prompt')]),new Promise(r=>setTimeout(r,1200))])}catch(e){}
  const password=uuid();await sb.auth.signUp({email:DEMO_EMAIL,password,options:{data:{}}});
  const r=await sb.auth.signInWithPassword({email:DEMO_EMAIL,password});if(r.error)return false;const uid=r.data.session.user.id;DEMO_UID=uid;
  await sb.from('profiles').upsert({id:uid,...DEMO_CARD,phone:'02-000-0000',contact_email:'somying@example.com'},{onConflict:'id'});
  const H=['#eef0ff','#d9dcf5'],P=['#f3efff','#e2d9f7'],G=['#eaf6ff','#d4e8fb'];
  const docs=[
    {t:'ใบอนุญาตตัวอย่าง',c:'บัตร / ใบอนุญาต',n:'SAMPLE-0001',is:-700,ex:28,age:0.05,hue:H,note:'ข้อมูลสมมติสำหรับนำเสนอ',
      f:['ชื่อ: สมหญิง ตัวอย่างดี','เลขที่: SAMPLE-0001','ออกให้: (สมมติ)','หมดอายุ: (สมมติ)'],b:['หมายเหตุ: ใช้นำเสนอแอปเท่านั้น','ประเภท: ตัวอย่าง','เงื่อนไข: ไม่มี']},
    {t:'ทะเบียนรถตัวอย่าง',c:'ทรัพย์สิน / ยานพาหนะ',n:'SAMPLE-0005',is:-500,ex:420,age:4,hue:G,
      f:['ผู้ถือ: สมหญิง ตัวอย่างดี','เลขที่: SAMPLE-0005','รุ่น: รถตัวอย่าง'],b:['รายการภาษี: (สมมติ)','หมายเหตุ: ไม่ใช่เอกสารจริง']},
    {t:'ใบเสร็จค่าไฟตัวอย่าง',c:'การเงิน / ใบเสร็จ',n:'SAMPLE-0004',age:9,hue:P,
      f:['ผู้ชำระ: สมหญิง ตัวอย่างดี','เลขที่: SAMPLE-0004','ยอดชำระ: 0.00 บาท (สมมติ)']},
    {t:'ใบรับรองการศึกษาตัวอย่าง',c:'การศึกษา',n:'SAMPLE-0006',age:12,hue:H,
      f:['ผู้สำเร็จ: สมหญิง ตัวอย่างดี','เลขที่: SAMPLE-0006','หลักสูตร: ตัวอย่าง']},
    {t:'สัญญาเช่าตัวอย่าง',c:'สัญญา',n:'SAMPLE-0002',is:-240,ex:240,age:20,hue:P,
      f:['ผู้เช่า: สมหญิง ตัวอย่างดี','เลขที่สัญญา: SAMPLE-0002','ระยะเวลา: (สมมติ)']},
    {t:'ประกันสุขภาพตัวอย่าง',c:'สุขภาพ',n:'SAMPLE-0003',is:-380,ex:-12,age:30,hue:G,
      f:['ผู้เอาประกัน: สมหญิง ตัวอย่างดี','เลขที่: SAMPLE-0003','แผน: ตัวอย่าง'],b:['เงื่อนไข: (สมมติ)','หมายเหตุ: ไม่ใช่เอกสารจริง']}];
  for(const d of docs){
    const id=uuid(),created=ago(d.age*24);
    await sb.from('documents').insert({id,user_id:uid,title:d.t,category:d.c,holder_name:'สมหญิง ตัวอย่างดี',doc_number:d.n,issued_on:d.is!=null?dayStr(d.is):null,expires_on:d.ex!=null?dayStr(d.ex):null,note:d.note||null,created_at:created,updated_at:created});
    for(const [side,rows] of [['front',d.f],['back',d.b]]){if(!rows)continue;
      const c=sampleCard(d.t,side,rows,d.hue),blob=await cb(c),path=`${uid}/${id}/${side}`;
      await sb.storage.from('documents').upload(path,blob,{contentType:'image/jpeg',upsert:true});
      await sb.storage.from('documents').upload(path+'.thumb',await thumbOf(c),{contentType:'image/jpeg',upsert:true});
      await sb.from('document_images').upsert({document_id:id,user_id:uid,side,path,mime:'image/jpeg',size:blob.size,rotation:0,crop:null,updated_at:created},{onConflict:'document_id,side'})}}
  const F='ด้านหน้า',B='ด้านหลัง',A=[
    ['uploaded','ใบอนุญาตตัวอย่าง · '+F,1.3],['uploaded','ใบอนุญาตตัวอย่าง · '+B,1.2],['viewed','ใบอนุญาตตัวอย่าง · '+F,.7],['copy_saved','ใบอนุญาตตัวอย่าง · '+F,.5],['profile_updated','ข้อมูลเอกสาร · ใบอนุญาตตัวอย่าง',.4],
    ['viewed','ทะเบียนรถตัวอย่าง · '+F,27],['uploaded','ทะเบียนรถตัวอย่าง · '+B,28],['uploaded','ทะเบียนรถตัวอย่าง · '+F,28.5],['login','',30],
    ['replaced','สัญญาเช่าตัวอย่าง · '+F+' · ปรับภาพ',75],['profile_updated','เปลี่ยนรูปโปรไฟล์',80],['uploaded','ใบเสร็จค่าไฟตัวอย่าง · '+F,9*24],['uploaded','ใบรับรองการศึกษาตัวอย่าง · '+F,12*24],
    ['deleted','ใบสมัครตัวอย่าง (ลบแล้ว)',14*24],['copy_saved','ประกันสุขภาพตัวอย่าง · '+F,18*24],['login','',20*24]];
  for(let i=0;i<14;i++)A.push(['viewed',['สัญญาเช่าตัวอย่าง','ทะเบียนรถตัวอย่าง','ประกันสุขภาพตัวอย่าง'][i%3]+' · '+F,100+i*21]);
  for(const [kind,detail,h] of A)await sb.from('activity').insert({kind,detail,created_at:ago(h)});
  saveState();return true}
