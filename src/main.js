import '@fonts';
import {PH_PHOTO} from './placeholder.js';
import {sb as SB0,configured,isMock,seed,demoOnly} from '@backend';
// DEMO mode swaps this for an in-memory fake (see enterDemo): while it is on nothing is sent to the real backend
let demoSb=null;const sb=new Proxy({},{get:(_,k)=>(demoSb||SB0)[k]});
import {$,$$,esc,ls,sv,CARD,detectCard,cardCrop,smartCrop,digits,idNumberOk,fmtId,fmtMember,DEMO_CARD,fmtDate,fmtDT,TMF,yr,validDate,checkFile,prepImage,uid,ext,safeName,makeThumb,processed,previewCanvas,bitmap,squareAvatar,applyWM,WMPOS,watermarkedCopy,saveBlob,lru,lruClear,LIM,zipStore} from './lib.js';

/* ===================== constants ===================== */
const B='documents';
const ABOUT='DocPocket เป็นแอปจัดระเบียบเอกสารส่วนตัวที่เป็นอิสระ ไม่เกี่ยวข้องกับหน่วยงานรัฐ และไม่ตรวจสอบ ยืนยัน หรือรับรองเอกสารใดๆ';
const SIDE={front:'ด้านหน้า',back:'ด้านหลัง'};
const CATS=['บัตร / ใบอนุญาต','สัญญา','การเงิน / ใบเสร็จ','การศึกษา','สุขภาพ','ทรัพย์สิน / ยานพาหนะ','อื่น ๆ'];
const DEF_WM={on:true,op:.35,pos:'tile',text:'DocPocket · สำเนาส่วนตัว'};
const ANN_DEF=[
 {id:'a1',demo:true,ic:'logo',t:'ปรับปรุงระบบบัตรดิจิทัล',d:'2026-10-28',s:'ระบบจะปิดปรับปรุงชั่วคราวในวันอาทิตย์ เวลา 01:00 – 03:00 น. ขออภัยในความไม่สะดวก'},
 {id:'a2',demo:true,ic:'logo',t:'เพิ่มบริการใหม่ในเมนูบริการ',d:'2026-10-27',s:'ตรวจสอบสิทธิ์และเอกสารของคุณได้สะดวกขึ้น เพียงแตะที่เมนูบริการจากหน้าแรก'},
 {id:'a3',demo:true,ic:'logo',t:'อย่าแชร์รหัสยืนยันให้ผู้อื่น',d:'2026-10-26',s:'เจ้าหน้าที่จะไม่ขอรหัส OTP หรือข้อมูลบัตรของท่านทางโทรศัพท์หรือข้อความทุกกรณี'},
 {id:'a4',demo:true,ic:'logo',t:'ส่วนลดสำหรับสมาชิก',d:'2026-10-25',s:'รับส่วนลดและสิทธิพิเศษจากร้านค้าที่ร่วมรายการ (ข้อมูลตัวอย่าง)'},
 {id:'a5',demo:true,ic:'logo',t:'สะสมแต้มแลกของรางวัล',d:'2026-10-24',s:'ร่วมสะสมแต้มจากการใช้บริการ แลกรับของรางวัลพิเศษมากมาย (ข้อมูลตัวอย่าง)'},
 {id:'a6',demo:true,ic:'logo',t:'แอปเวอร์ชันใหม่พร้อมใช้งาน',d:'2026-10-23',s:'ปรับปรุงประสิทธิภาพและเพิ่มฟีเจอร์ใหม่ อัปเดตแอปได้แล้ววันนี้ (ข้อมูลตัวอย่าง)'}];
const ANNS=()=>Array.isArray(S.profile?.home?.anns)?S.profile.home.anns:ANN_DEF;
const annDate=a=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(a.d||'');return m?`${m[3]}/${m[2]}/${S.era==='BE'?+m[1]+543:m[1]}`:''};
const AIC=[['logo','โลโก้ DocPocket'],['bell','กระดิ่ง'],['doc','เอกสาร'],['shield','โล่'],['lock','กุญแจ'],['hist','นาฬิกา'],['set','ตั้งค่า'],['camera','กล้อง']];
const annDef=()=>S.profile?.home?.annPic||null;
const annIc=(a,cls='')=>a.pu?`<img class="nc-ic nc-pic ${cls}" src="${esc(a.pu)}" alt="">`:a.pic?`<img class="nc-ic nc-pic ${cls}" data-bnimg="${esc(a.pic)}" data-v="${+a.pv||0}" alt="">`:(!a.ic||a.ic==='logo')&&!a.img&&annDef()?`<img class="nc-ic nc-pic ${cls}" data-bnimg="${esc(annDef().path)}" data-v="${+annDef().v||0}" alt="">`:a.img?`<img class="nc-ic nc-im ${cls}" src="${esc(a.img)}" alt="">`:(!a.ic||a.ic==='logo')?`<span class="nc-ic ${cls}"></span>`:`<span class="nc-ic nc-g ${cls}">${ic(a.ic,12)}</span>`;
const annCard=(a,home)=>`<button class="nc" data-act="ann" data-id="${esc(a.id)}">${annIc(a)}<span class="nc-bd"><span class="nc-hd"><b>${esc(a.t)}</b><span class="nc-dt">${annDate(a)}</span></span><p>${a.demo&&!home?'<i class="demo">DEMO</i>':''}${esc(a.s)}</p></span></button>`;
const FOOT0='DocPocket · แอปจัดระเบียบเอกสารส่วนตัว · ไม่ใช่บริการของหน่วยงานรัฐ';
// public DEMO build: one short non-affiliation line only (this app looks like a government app, so that line stays); other builds keep the full footer
const foot=home=>demoOnly?'DocPocket · ไม่ใช่บริการของหน่วยงานรัฐ':FOOT0+((S.demo||isMock)&&!home?' · โหมด DEMO':'');
const ART1=`<svg class="art" viewBox="0 0 150 72" aria-hidden="true"><defs><linearGradient id="ga" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9e7f8"/></linearGradient><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3279"/><stop offset="1" stop-color="#1d2160"/></linearGradient></defs>
 <g transform="rotate(-9 82 20)"><rect x="40" y="2" width="84" height="52" rx="6" fill="#eef4fc" stroke="#c8d6ee"/><rect x="40" y="2" width="84" height="9" rx="4" fill="#5b66d6"/><rect x="48" y="18" width="40" height="3" rx="1.5" fill="#b9c6e4"/><rect x="48" y="25" width="30" height="3" rx="1.5" fill="#b9c6e4"/></g>
 <rect x="22" y="20" width="90" height="56" rx="6" fill="url(#ga)" stroke="#c4d3ec"/><rect x="22" y="20" width="90" height="10" rx="5" fill="#dfe8f7"/><rect x="28" y="23.5" width="34" height="3" rx="1.5" fill="#303891"/>
 <g fill="#303891">${[0,3,5,8,10,13,15,18,21,23].map(x=>`<rect x="${28+x}" y="35" width="${x%2?1.2:2}" height="22"/>`).join('')}</g>
 <rect x="54" y="35" width="30" height="3" rx="1.5" fill="#9fb0d6"/><rect x="54" y="42" width="24" height="3" rx="1.5" fill="#9fb0d6"/><rect x="54" y="49" width="28" height="3" rx="1.5" fill="#9fb0d6"/><rect x="54" y="56" width="18" height="3" rx="1.5" fill="#9fb0d6"/>
 <rect x="88" y="35" width="18" height="22" rx="3" fill="#f4dfcd"/><circle cx="97" cy="43" r="4.6" fill="#7a5235"/><path d="M89.5 57c1.5-5.5 4.5-7.5 7.5-7.5s6 2 7.5 7.5z" fill="#e8885a"/>
 <g transform="rotate(7 132 46)"><rect x="112" y="14" width="40" height="58" rx="5" fill="url(#gb)"/><rect x="115" y="17" width="34" height="52" rx="3" fill="none" stroke="#c9a85a" stroke-width=".8" opacity=".7"/>
 <path d="M124 33h7l2.5 3H141v13h-17z" fill="none" stroke="#e2c47a" stroke-width="1.8" stroke-linejoin="round"/><text x="132.5" y="60" text-anchor="middle" font-size="5.6" font-weight="700" fill="#e2c47a">DocPocket</text></g></svg>`;
const ART2=`<svg class="art" viewBox="0 0 110 72" aria-hidden="true"><defs><radialGradient id="gg" cx=".5" cy=".45" r=".5"><stop offset="0" stop-color="#ffffff" stop-opacity=".22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient><linearGradient id="gs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2f2f4"/><stop offset="1" stop-color="#9c9ca3"/></linearGradient></defs>
 <circle cx="58" cy="36" r="40" fill="url(#gg)"/><path d="M58 10l22 8v15c0 15-9.5 25-22 30-12.5-5-22-15-22-30V18z" fill="url(#gs)"/><path d="M58 15l17 6v12c0 12-7.5 20-17 24-9.5-4-17-12-17-24V21z" fill="#2b2b2f"/>
 <rect x="50" y="34" width="16" height="13" rx="2.5" fill="#e9e9ec"/><path d="M53 34v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#e9e9ec" stroke-width="2.4"/><circle cx="58" cy="40.5" r="1.8" fill="#2b2b2f"/></svg>`;
const ART3=`<svg class="art" viewBox="0 0 110 72" aria-hidden="true"><circle cx="70" cy="38" r="34" fill="#ffffff" opacity=".5"/><g transform="rotate(-8 70 40)"><rect x="40" y="18" width="62" height="46" rx="6" fill="#5b66d6"/><path d="M40 26h20l5 6h37v26a6 6 0 0 1-6 6H46a6 6 0 0 1-6-6z" fill="#303891"/><rect x="50" y="42" width="30" height="4" rx="2" fill="#c3c9f3"/><rect x="50" y="50" width="20" height="4" rx="2" fill="#c3c9f3"/></g></svg>`;
const BTPL={b1:'น้ำเงิน · ภาพการ์ดเอกสาร',b2:'ดำ · ข้อความกลาง',b3:'ม่วงอ่อน · ไอคอนแฟ้ม'};
const BGO=[[1,'แท็บเอกสาร'],[2,'สแกน'],[3,'ประวัติ'],[4,'ตั้งค่า'],[-1,'ไม่ทำอะไร']];
const DEF_BN=[{id:'d1',tpl:'b1',t1:'คลังเอกสารออนไลน์',t2:'เอกสารต่าง ๆ , ใบอนุญาต\nสัญญา ใบรับรอง ใบเสร็จ',t3:'',go:1},
 {id:'d2',tpl:'b2',t1:'เอกสารของคุณ อยู่กับคุณเสมอ',t2:'จัดเก็บอย่างเป็นส่วนตัว เปิดดูได้เฉพาะคุณ',t3:'DocPocket · กระเป๋าเอกสารส่วนตัว\nตั้งรหัสล็อกแอป 6 หลักได้ที่หน้าตั้งค่า',go:4}];
const BNS=()=>Array.isArray(S.profile?.home?.banners)&&S.profile.home.banners.length?S.profile.home.banners:DEF_BN;
const brk=t=>esc(t||'').replace(/\n/g,'<br>');
const bnCls=b=>(b.tpl in BTPL?b.tpl:'b1')+((b.pu||b.img)?' bimg':'');
/* an uploaded banner picture replaces the designed banner: full-bleed image, loaded privately from the user's own storage */
const bnInner=b=>(b.pu||b.img)?`<img class="bn-pic" alt="${esc(b.t1||'แบนเนอร์')}" ${b.pu?`src="${esc(b.pu)}"`:`data-bnimg="${esc(b.img)}" data-v="${+b.iv||0}"`}>`:b.tpl==='b2'?`<span class="tx c"><span class="t1">${esc(b.t1)}</span><span class="t2">${brk(b.t2)}</span>${b.t3?`<i class="orn"></i><span class="t3">${brk(b.t3)}</span>`:''}</span>${ART2}`
  :`<span class="tx"><span class="t1">${esc(b.t1)}</span><span class="t2">${brk(b.t2)}</span></span>${b.tpl==='b3'?ART3:ART1}`;
const TI=(b,st='#303891')=>`<svg viewBox="0 0 48 48" fill="none" stroke="${st}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b}</svg>`;
const TILE={
 view:TI('<rect x="6" y="9" width="36" height="26" rx="3"></rect><circle cx="22" cy="21" r="8.5"></circle><circle cx="22" cy="19" r="2.5"></circle><path d="M17.5 25c1.5-2 7.5-2 9 0"></path><path d="M28.5 27.5l7 7"></path>'),
 copy:TI('<path d="M14 6h14l8 8v26a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"></path><path d="M28 6v8h8"></path><path d="M18 28l5 5 8-9"></path>'),
 box:`<svg viewBox="0 0 48 48" fill="none" stroke="#303891" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path fill="#303891" d="M8 15 24 24 24 40 8 31Z"></path><path fill="#fff" d="M24 24 40 15 40 31 24 40Z"></path><path fill="#303891" d="M24 6 40 15 24 24 8 15Z"></path><path stroke="none" fill="#fff" d="M22.98 9.02 34.62 15.58 31.74 17.2 20.1 10.64Z"></path><path stroke="none" fill="#fff" d="M17.86 11.9 29.5 18.46 26.62 20.08 14.98 13.52Z"></path></svg>`,
 files:TI('<path d="M8 15l16-9 16 9v18l-16 9-16-9z"></path><path d="M8 15l16 9 16-9"></path><path d="M24 24v18"></path><path d="M16 10.5l16 9"></path>'),
 hist:TI('<circle cx="27" cy="23" r="14"></circle><path d="M27 15v9l5 4"></path><path d="M6 20h8M6 27h8M10 34h4"></path>'),
 soon:TI('<circle cx="27" cy="23" r="14"></circle><path d="M27 15v9l5 4"></path><path d="M6 20h8M6 27h8M10 34h4"></path>','#c4c4ca')};
const SC=[{k:'req',ti:'view',t:'ตรวจสอบ<br>คำขอ',i:'hist'},{k:'cert',ti:'copy',t:'การรับรอง<br>เอกสาร',i:'shield'},{k:'addr',ti:'box',t:'การแจ้ง<br>ย้ายที่อยู่',i:'user'},{k:'soon',ti:'soon',t:'เร็วๆ นี้',i:'hist',off:true}];
const KL={uploaded:['plus','อัปโหลดเอกสาร'],replaced:['refresh','เปลี่ยนภาพเอกสาร'],deleted:['trash','ลบเอกสาร'],viewed:['image','เปิดดูเอกสาร'],profile_updated:['user','อัปเดตโปรไฟล์'],login:['lock','เข้าสู่ระบบ'],copy_saved:['download','บันทึกสำเนาลายน้ำ']};
const P={bell:'M5.5 17h13l-1.8-2.6V10.5a4.7 4.7 0 0 0-9.4 0v3.9zM10 20a2 2 0 0 0 4 0',chat:'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 11h.01M12 11h.01M16 11h.01',home:'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',doc:'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4',
 scan:'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8',hist:'M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
 set:'M4 8h9M17 8h3M4 16h3M11 16h9M15 5.5v5M9 13.5v5',dperson:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c0-3.5 3.1-6 7-6s7 2.5 7 6',dhome:'M3 11l9-8 9 8M5.5 9.5V20a1 1 0 0 0 1 1H10v-5.5h4V21h3.5a1 1 0 0 0 1-1V9.5',dbaby:'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9 11h.01M15 11h.01M9.5 14.6c.7.7 1.5 1 2.5 1s1.8-.3 2.5-1M12 4c-.9-1.4 0-2.3 1.4-1.8',dheart:'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',dbroken:'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10zM12 7.4l-1.6 3.2 2.6 2-1.6 3.6',dwheel:'M12.5 4.5a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8zM12.5 6.5v6h4.2l1.8 4.5M9.2 10a5.2 5.2 0 1 0 6.3 7.8',dpermit:'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 14l2 2 4-4',nhome:'M2.8 11.4L12 3.2l9.2 8.2M5.4 9.4V19.6a1.4 1.4 0 0 0 1.4 1.4h10.4a1.4 1.4 0 0 0 1.4-1.4V9.4M15.6 5.2V3.4h2.6v4.2M10.3 13.6a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0M12 15.3v2.9',nscan:'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7.4 12h.01M10.5 12h.01M13.5 12h.01M16.6 12h.01',si_person:'M12 3.8a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2zM5.2 20.2c.5-3.7 3.2-5.6 6.8-5.6s6.3 1.9 6.8 5.6',si_house:'M3 11.3L12 3.5l9 7.8M5.6 9.6v10.7h12.8V9.6M10 20.3v-5.2h4v5.2M16 5.6V3.6h2.4v4',si_baby:'M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 0 0 0-17.2zM9.2 11h.01M14.8 11h.01M9.4 15c1.6 1.3 3.6 1.3 5.2 0M12 3.4c-.6-1.2-.2-2.2 1.2-2.4',si_heart:'M12 20.2s-7.6-4.5-7.6-10a4.3 4.3 0 0 1 7.6-2.7 4.3 4.3 0 0 1 7.6 2.7c0 5.5-7.6 10-7.6 10z',si_broken:'M12 20.2s-7.6-4.5-7.6-10a4.3 4.3 0 0 1 7.6-2.7 4.3 4.3 0 0 1 7.6 2.7c0 5.5-7.6 10-7.6 10zM12 7.5l-1.9 3.4 2.8 1.7-2.1 4.2',si_wheel:'M11 3.2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM11 8v6h5.2l2.3 5.2M11 11h4.6M8.4 12.8a5 5 0 1 0 6.3 6.5',si_gun:'M14 3H7a1.6 1.6 0 0 0-1.6 1.6v14.8A1.6 1.6 0 0 0 7 21h10a1.6 1.6 0 0 0 1.6-1.6V7.6zM14 3v4.6h4.6M8.6 12.2h5.4v1.8h-2.2v2.4h-1.4V14H8.6z',power:'M12 3v8M7 6.6a8 8 0 1 0 10 0',
 user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6',exp:'M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7',
 flip:'M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5',x:'M6 6l12 12M18 6L6 18',chev:'M9 6l6 6-6 6',edit:'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
 camera:'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
 image:'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4 17l5-5 4 4 3-3 4 4',
 trash:'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',rl:'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',rr:'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
 plus:'M12 5v14M5 12h14',minus:'M5 12h14',shield:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',download:'M12 4v11M7 11l5 5 5-5M5 20h14',
 crop:'M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14',lock:'M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V8a4 4 0 0 1 8 0v3',refresh:'M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5'};
const ic=(n,s=22)=>`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const LOGO=n=>`<svg viewBox="0 0 64 64" width="${n}" height="${n}" role="img" aria-label="DocPocket"><rect width="64" height="64" rx="16" fill="#303891"/><g transform="rotate(-8 32 28)"><rect x="19" y="9" width="26" height="31" rx="4" fill="#fff"/><path d="M24 17h14M24 23h10" stroke="#303891" stroke-width="2.6" stroke-linecap="round"/></g><path d="M11 31h42v17a6 6 0 0 1-6 6H17a6 6 0 0 1-6-6z" fill="#8da2ff"/><path d="M19 39h26" stroke="#303891" stroke-width="2.2" stroke-dasharray="3.5 3.5" stroke-linecap="round"/></svg>`;
const AVDEF='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#d9dcf5"/><circle cx="32" cy="25" r="11" fill="#8a90cf"/><path d="M10 64c0-14 10-22 22-22s22 8 22 22z" fill="#8a90cf"/></svg>');

/* ===================== state ===================== */
const newScan=()=>({full:false,doc:'new',title:'',side:'front',file:null,url:null,rot:0,crop:null,pu:null,cam:false,facing:'environment',stream:null,busy:false});
const S={user:null,profile:{},docs:[],hist:[],mfa:false,tab:0,selId:null,flip:false,era:ls('dp_era','BE'),auto:ls('dp_auto',true),badge:ls('dp_badge',true),expDays:ls('dp_expdays',60),expSeen:ls('dp_expseen',[]),theme:ls('dp_theme','light'),seen:ls('dp_seen',[]),
 wm:{...DEF_WM,...ls('dp_wm',{})},scan:newScan(),view:null,det:null,avatar:'',draft:null,annAll:false,rec:false,fresh:false,ci:0,pz:0,hidePv:ls('dp_hidepv',false),rv:false,lockAfter:ls('dp_lockafter',60),hideAt:0,demo:false,dsort:ls('dp_dsort','new'),dst:'all',hf:'all',hn:25};
const TH=new Map(),FU=new Map();
const curDoc=()=>S.docs.find(d=>d.id===S.selId)||null;
const docById=id=>S.docs.find(d=>d.id===id);
const dname=()=>S.profile.display_name||(S.user?.email||'').split('@')[0]||'ผู้ใช้';
const avSrc=()=>S.avatar||AVDEF;
const bar=t=>`<div class="hd2">${t}</div>`;
const thErr=m=>({'Invalid login credentials':'อีเมลหรือรหัสผ่านไม่ถูกต้อง','Email not confirmed':'ยังไม่ได้ยืนยันอีเมล โปรดตรวจสอบกล่องจดหมาย','User already registered':'อีเมลนี้ถูกใช้แล้ว'}[m]||m||'เกิดข้อผิดพลาด');

/* ===================== ui helpers ===================== */
let tt;function toast(m){const t=$('#ts');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),3200)}
function sheet(h){const s=$('#sh');s.innerHTML='<i class="gp"></i>'+h;$('#bd').classList.add('on');s.classList.add('on');$('#app').classList.add('sh-open');s.scrollTop=0;hydrate(s)}
// hidden screen-size diagnostic: tap the footer line at the bottom of Settings 5 times (used to find why an iPhone home-screen app can end above the screen edge)
function dbgSheet(){
  const r=e=>{const b=$(e).getBoundingClientRect();return `${Math.round(b.top)}→${Math.round(b.bottom)} (h ${Math.round(b.height)})`},cs=getComputedStyle($('#dbgp')),vv=window.visualViewport;
  const rows=[['innerWidth × innerHeight',innerWidth+' × '+innerHeight],['screen.width × height',screen.width+' × '+screen.height],['visualViewport',vv?Math.round(vv.width)+' × '+Math.round(vv.height)+' · top '+Math.round(vv.offsetTop):'-'],['clientHeight (html)',document.documentElement.clientHeight],['safe area top / bottom',cs.paddingTop+' / '+cs.paddingBottom],['standalone',String(navigator.standalone===true||matchMedia('(display-mode: standalone)').matches)],['#app',r('#app')],['#nv',r('#nv')],['menu bottom to screen bottom',Math.round(innerHeight-$('#nv').getBoundingClientRect().bottom)+' px'],['100vh (measured)',Math.round($('#dbgv').getBoundingClientRect().height)],['stretch (--vgap)',document.documentElement.classList.contains('vgap')?getComputedStyle(document.documentElement).getPropertyValue('--vgap'):'off'],['pixel ratio',devicePixelRatio]];
  sheet(`<h3>ข้อมูลหน้าจอ (สำหรับตรวจสอบ)</h3><div class="dbgt">${rows.map(x=>`<div><span>${x[0]}</span><b>${esc(String(x[1]))}</b></div>`).join('')}</div><p>ลองปรับความสูงของแอป แล้วดูว่าเมนูล่างลงมาชิดขอบหรือไม่</p><button class="bt3" data-act="dbg-h" data-v="screen">ใช้ความสูง screen.height</button><button class="bt3" data-act="dbg-h" data-v="lvh">ใช้ 100lvh</button><button class="bt2" data-act="dbg-h" data-v="auto">กลับเป็นค่าปกติ</button><button class="bt2" data-act="dbg-vg">เปิด/ปิดการชดเชยความสูงอัตโนมัติ</button>`)}
let dbgN=0,dbgT=0;
function closeSheet(){$('#bd').classList.remove('on');$('#sh').classList.remove('on');$('#app').classList.remove('sh-open')}
function mount(i,h){const v=$('#v'+i);v.innerHTML=h;hydrate(v)}
function hydrate(root=document){
  $$('[data-img]:not([data-hy])',root).forEach(el=>{el.dataset.hy='1';const [id,side,t]=el.dataset.img.split(':'),im=docById(id)?.images[side];if(!im)return;
    const fail=e=>{console.error('image',e);if(!el.isConnected||t==='t'||!el.classList.contains('pimg')||el.nextElementSibling?.classList.contains('imgbad'))return;
      el.insertAdjacentHTML('afterend','<div class="em imgbad"><b>โหลดภาพไม่สำเร็จ</b><button class="btn" data-act="retry-img">ลองใหม่</button></div>')};
    const set=u=>{if(!el.isConnected)return;el.onload=()=>{el.classList.add('ok');fillCls(el)};
      el.onerror=()=>{if(el.dataset.fb)return fail('decode');el.dataset.fb='1';imgData(im,t==='t').then(set).catch(fail)};el.src=u};
    imgUrl(im,t==='t').then(set).catch(e=>t==='t'?imgUrl(im,false).then(set).catch(fail):fail(e))});
  $$('[data-bnimg]:not([data-hy])',root).forEach(el=>{el.dataset.hy='1';bnUrl(el.dataset.bnimg,el.dataset.v).then(u=>{if(el.isConnected){el.onload=()=>el.classList.add('ok');el.src=u}}).catch(e=>console.error('banner image',e))});
  $$('[data-wm]',root).forEach(el=>applyWM(el,S.wm))}
const fillCls=el=>{if(el.classList.contains('pimg')||el.hasAttribute('data-vimg'))el.classList.toggle('fill',Math.abs(el.naturalWidth/el.naturalHeight/CARD-1)<=.12)}; // card-shaped pictures fill the frame edge to edge
const BNIMG=new Map();
async function bnUrl(path,v){const k=path+'|'+(v||0);if(!BNIMG.has(k)){const p=fetchBlob(path).then(b=>objURL(b));BNIMG.set(k,p);p.catch(()=>BNIMG.delete(k))}return BNIMG.get(k)}

/* ===================== data ===================== */
async function fetchBlob(path){
  if(isMock||S.demo){const {data,error}=await sb.storage.from(B).download(path);if(error)throw error;return data}
  const {data,error}=await sb.storage.from(B).createSignedUrl(path,60);if(error)throw error;
  const r=await fetch(data.signedUrl,{cache:'no-store',credentials:'omit'});if(!r.ok)throw new Error('โหลดภาพไม่สำเร็จ');return r.blob()}
const imgData=(im,thumb)=>fetchBlob(im.path+(thumb?'.thumb':'')).then(b=>processed(b,im.rotation,im.crop))
  .then(b=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(r.error);r.readAsDataURL(b)}));
const imgUrl=(im,thumb)=>{const p=im.path+(thumb?'.thumb':'');
  return lru(thumb?TH:FU,thumb?80:6,`${p}|${im.updated_at}|${im.rotation}|${JSON.stringify(im.crop||null)}`,async()=>URL.createObjectURL(await processed(await fetchBlob(p),im.rotation,im.crop)))};
const HK=()=>'dp_home_'+String(S.user?.email||S.user?.id||'').toLowerCase();
async function loadProfile(){const {data}=await sb.from('profiles').select('*').eq('id',S.user.id).maybeSingle();S.profile=data||{};
  if(S.profile.home==null){const h=ls(HK(),null);if(h&&typeof h==='object')S.profile.home=h}} // device copy of the Home banner/announcement edits
async function loadAvatar(){if(S.avatar){dropURL(S.avatar);S.avatar=''}if(!S.profile.avatar_path)return;try{S.avatar=objURL(await fetchBlob(S.profile.avatar_path))}catch(e){}}
/* blob: URLs for on-screen images; if a host page refuses blob: images, the same picture is shown as a data: URL instead */
const BLOBS=new Map(),objURL=b=>{const u=URL.createObjectURL(b);BLOBS.set(u,b);return u},dropURL=u=>{if(u){URL.revokeObjectURL(u);BLOBS.delete(u)}};
const toDataURL=b=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(r.error);r.readAsDataURL(b)});
document.addEventListener('error',e=>{const t=e.target;if(t?.tagName!=='IMG'||t.dataset.fb||!BLOBS.has(t.src))return;t.dataset.fb='1';toDataURL(BLOBS.get(t.src)).then(u=>{if(t.isConnected)t.src=u}).catch(()=>0)},true);
async function loadDocs(){
  const [d,i]=await Promise.all([sb.from('documents').select('*').order('created_at',{ascending:false}),sb.from('document_images').select('*')]);
  if(d.error)throw d.error;if(i.error)throw i.error;
  S.docs=(d.data||[]).map(x=>({...x,images:{}}));const m=new Map(S.docs.map(x=>[x.id,x]));
  (i.data||[]).forEach(r=>{const o=m.get(r.document_id);if(o)o.images[r.side]=r});
  if(!docById(S.selId))S.selId=S.docs[0]?.id||null}
async function loadHist(){const {data}=await sb.from('activity').select('*').order('created_at',{ascending:false}).limit(100);S.hist=data||[]}
async function log(kind,detail=''){const row={kind,detail:String(detail).slice(0,120)};const {error}=await sb.from('activity').insert(row);if(!error)S.hist.unshift({...row,id:'l'+Math.random(),created_at:new Date().toISOString()})}
async function loadMfa(){try{const {data}=await sb.auth.mfa.listFactors();S.mfa=!!data?.totp?.some(f=>f.status==='verified')}catch(e){S.mfa=false}}

/* ===================== shared header (same on every tab, like the reference) ===================== */
function expiring(){if(!S.expDays)return[];const t=new Date();t.setHours(0,0,0,0);
  return S.docs.filter(d=>d.expires_on).map(d=>({d,n:Math.round((new Date(d.expires_on+'T00:00:00')-t)/864e5)})).filter(x=>x.n<=S.expDays).sort((a,b)=>a.n-b.n)}
function renderHdr(){
  const unread=S.badge?ANNS().filter(a=>!S.seen.includes(a.id)).length+expiring().filter(x=>!S.expSeen.includes(x.d.id+x.d.expires_on)).length:0;
  $('#hdr').innerHTML=`<div class="hi"><button class="avb" data-act="goto" data-arg="4" aria-label="โปรไฟล์ของฉัน"><img src="${avSrc()}" alt=""></button>
   <div class="hmid"><div class="hrow"><span>สวัสดี</span><span class="badge">ONLINE</span></div><div class="hname">คุณ ${esc(dname())}</div></div>
   <div class="hbtns"><button class="hbtn" data-act="bell" aria-label="การแจ้งเตือน">${ic('bell',19)}${unread?'<i class="dot"></i>':''}</button><button class="hbtn" data-act="power" aria-label="ล็อกแอปหรือออกจากระบบ">${ic('power',19)}</button></div></div>`}

/* ===================== views ===================== */
const crX=(c,e)=>e.offsetLeft+e.offsetWidth/2-c.clientWidth/2;
const LOCK='<svg class="lk" viewBox="0 0 48 54" aria-hidden="true"><path d="M13 24v-8a11 11 0 0 1 22 0v8" fill="none" stroke="#4a4a4e" stroke-width="5.5"/><rect x="4" y="22" width="40" height="30" rx="7" fill="#4a4a4e"/><circle cx="24" cy="37" r="4.2" fill="#e8ecf6"/></svg>';
function R0(){
  const BL=BNS();if(S.ci>=BL.length)S.ci=0;
  {const d0=curDoc();if(d0&&S.lastSel!==d0.id){S.lastSel=d0.id;if(!d0.images.front&&d0.images.back)S.flip=true}}
  const d=curDoc(),n=S.docs.length,idx=S.docs.indexOf(d),hid=S.hidePv&&!S.rv&&d&&(d.images.front||d.images.back);
  const face=s=>{const im=d?.images[s];
    const inner=im?`<img class="pimg" alt="${SIDE[s]}ของ ${esc(d.title)}" data-img="${d.id}:${s}${hid?':t':''}"><div class="wmo" data-wm></div>`
      :!d?`<div class="em">${ic('doc',34)}<b>ยังไม่มีเอกสาร</b><span>ถ่ายหรือเลือกภาพเอกสารของคุณเพื่อเริ่มต้น</span><button class="btn" data-act="scan-to" data-doc="new" data-side="front">สแกนเอกสารแรก</button></div>`
      :`<div class="em">${ic('image',34)}<b>ยังไม่มีภาพ${SIDE[s]}</b><button class="btn" data-act="scan-to" data-doc="${d.id}" data-side="${s}">เพิ่มภาพ${SIDE[s]}</button></div>`;
    return `<div class="face${s==='back'?' bk':''}">${inner}</div>`};
  const card=`<div class="flipw${hid?' hid':''}"><div class="scene"><div class="card3d${S.flip?' f':''}" data-act="flip" role="button" aria-label="แตะเพื่อพลิกด้าน">${face('front')}${face('back')}</div></div>${hid?`<button class="rvl" data-act="reveal">${LOCK}<span>คลิกเพื่อแสดงบัตร</span></button>`:''}</div>`;
  mount(0,`${card}
   <div class="qa"><button class="rb" data-act="prof-open" aria-label="ข้อมูลบัตร">${ic('user',15)}</button><button class="pill" data-act="open-view">${ic('exp',15)}ขยายรูปบัตร</button><button class="rb" data-act="flip" aria-label="พลิกด้าน">${ic('flip',15)}</button></div>
   <div class="pn"><h3 class="mh"><span>เมนูบริการ</span><button data-act="sc-all">ทั้งหมด ›</button></h3>
    <div class="grid">${SC.map(s=>`<button class="tile${s.off?' off':''}" data-act="sc" data-k="${s.k}"><span class="ic">${TILE[s.ti]}</span>${s.t}</button>`).join('')}</div>
    <div class="cr" id="cr">${[BL[BL.length-1],...BL,BL[0]].map((b,i)=>`<button class="bn ${bnCls(b)}" data-act="${b.go>=0?'goto':'noop'}" data-arg="${+b.go}"${i===0||i===BL.length+1?' aria-hidden="true" tabindex="-1"':''}>${bnInner(b)}</button>`).join('')}</div>
    <div class="dots" id="dt">${BL.map((b,i)=>`<i class="${i===S.ci?'a':''}"></i>`).join('')}</div>
    <div class="nh"><span>ประกาศทั้งหมด</span><button data-act="ann-more">ทั้งหมด ›</button></div>
    <div class="nl">${ANNS().map(a=>annCard(a,true)).join('')}</div>${(S.demo||isMock)&&!demoOnly?'<div class="dstrip" role="note">DEMO VERSION</div>':''}</div>
   <div class="dfoot">${foot(true)}</div>`);
  const fw=$('#v0 .flipw');if(fw&&n>1){let sx=0,sy=0;fw.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY},{passive:true});
    fw.addEventListener('pointerup',e=>{const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.5){S.swiped=Date.now();A[dx<0?'doc-next':'doc-prev']()}},{passive:true})}
  // looping carousel: [last clone, ...banners, first clone], active banner centred with both neighbours peeking
  const c=$('#cr'),nb=BL.length,K=[...c.children],near=()=>{let j=0,dd=1e9;K.forEach((e,i)=>{const x=Math.abs(crX(c,e)-c.scrollLeft);if(x<dd){dd=x;j=i}});return j};
  const home=()=>{c.scrollLeft=crX(c,K[S.ci+1])};home();requestAnimationFrame(home);let st;
  c.addEventListener('scroll',()=>{const j=near(),r=(j-1+nb)%nb;if(r!==S.ci){S.ci=r;$$('#dt i').forEach((e,i)=>e.classList.toggle('a',i===r))}
    clearTimeout(st);st=setTimeout(()=>{const k=near();if(k===0)c.scrollLeft=crX(c,K[nb]);else if(k===nb+1)c.scrollLeft=crX(c,K[1])},160)},{passive:true});
  c.addEventListener('pointerdown',()=>S.pz=Date.now()+8000)}
const DD=iso=>Math.round((new Date(iso+'T00:00:00')-new Date(new Date().setHours(0,0,0,0)))/864e5);
const DSORT=[['new','ใหม่สุด'],['upd','อัปเดตล่าสุด'],['name','ชื่อ ก–ฮ'],['exp','หมดอายุเร็วสุด']];
const DST=[['all','ทั้งหมด'],['soon','ใกล้หมดอายุ'],['expired','หมดอายุแล้ว'],['incomplete','ภาพไม่ครบ']];
/* one document's status: expiring soon / expired (uses the alert window from Settings, 60 days when alerts are off) and missing sides */
function dinfo(d){const t=S.expDays||60,n=d.expires_on?DD(d.expires_on):null,k=[];
  if(n!==null&&n<0)k.push('expired');else if(n!==null&&n<=t)k.push('soon');
  if(!d.images.front||!d.images.back)k.push('incomplete');return{n,k}}
function dsorted(){const by={new:(x,y)=>(y.created_at||'').localeCompare(x.created_at||''),upd:(x,y)=>(y.updated_at||y.created_at||'').localeCompare(x.updated_at||x.created_at||''),
  name:(x,y)=>x.title.localeCompare(y.title,'th'),exp:(x,y)=>(x.expires_on?0:1)-(y.expires_on?0:1)||(x.expires_on||'').localeCompare(y.expires_on||'')};
  return [...S.docs].sort(by[S.dsort]||by.new)}
function dpills(d,i){const p=[['n',`หน้า ${d.images.front?'✓':'–'} · หลัง ${d.images.back?'✓':'–'}`]];
  if(i.n!==null){if(i.n<0)p.push(['x','หมดอายุแล้ว']);else if(i.n===0)p.push(['w','หมดอายุวันนี้']);else if(i.k.includes('soon'))p.push(['w',`หมดอายุในอีก ${i.n} วัน`]);else p.push(['n',`ใช้ได้ถึง ${fmtDate(d.expires_on,S.era)}`])}
  if(!d.images.front&&!d.images.back)p.push(['x','ไม่มีภาพ']);
  return p.map(([c,t])=>`<i class="pl ${c}">${t}</i>`).join('')}
function drow(d){const s=d.images.front?'front':d.images.back?'back':null,i=dinfo(d);
  return `<button class="dl" data-act="doc-open" data-id="${d.id}" data-c="${esc(d.category||'')}" data-st="${i.k.join(' ')}" data-s="${esc([d.title,d.holder_name,d.doc_number,d.note,d.category].filter(Boolean).join(' ').toLowerCase())}"><span class="th">${s?`<img alt="" data-img="${d.id}:${s}:t">`:ic('doc',22)}</span><span class="dm"><b>${esc(d.title)}</b><small>${d.category?esc(d.category)+' · ':''}เพิ่มเมื่อ ${fmtDate(d.created_at,S.era)}</small><span class="tg">${dpills(d,i)}</span></span>${ic('chev',18)}</button>`}
function dfilter(){const q=(S.q||'').trim().toLowerCase(),c=S.cat&&S.cat!=='ทั้งหมด'?S.cat:'',st=S.dst&&S.dst!=='all'?S.dst:'';let k=0;
  $$('#dlist .dl').forEach(e=>{const v=(!q||e.dataset.s.includes(q))&&(!c||e.dataset.c===c)&&(!st||e.dataset.st.split(' ').includes(st));e.hidden=!v;if(v)k++});
  const L=$('#dlist');if(L)L.hidden=!k;const cn=$('#dcount');if(cn)cn.textContent=k===S.docs.length?`${k} รายการ`:`แสดง ${k} จาก ${S.docs.length} รายการ`;
  let m=$('#dnone');if(!k&&L){if(!m)L.insertAdjacentHTML('afterend','<div class="dnone" id="dnone"><p>ไม่พบเอกสารที่ตรงกับการค้นหาหรือตัวกรอง</p><button class="btn g" data-act="doc-clear">ล้างการค้นหาและตัวกรอง</button></div>')}else m?.remove()}
const DREF=[[['dperson','บัตรประจำตัวประชาชน','บัตรประจำตัวประชาชน','b']],[['dhome','ทะเบียนบ้าน','ข้อมูลทะเบียนบ้าน','g'],['dbaby','สูติบัตร','ข้อมูลการเกิด สถานที่เกิด บิดา มารดา','g']],[['dheart','ทะเบียนสมรส','ทะเบียนการสมรส','r'],['dbroken','ทะเบียนหย่า','ทะเบียนการหย่า','r']],[['dwheel','บัตรประจำตัวคนพิการ','บัตรประจำตัวคนพิการ','g']],[['dpermit','ใบอนุญาตอาวุธปืน แบบ ป.4','รายการใบอนุญาตให้มีและใช้อาวุธปืน (แบบ ป.4)','b'],['dpermit','ใบอนุญาตอาวุธปืน แบบ ป.3','รายการใบอนุญาตให้ซื้ออาวุธปืน (แบบ ป.3)','b']]];
// plain, non-interactive list (labels only: no click, no link, no function)
const drefHtml=()=>`<div class="dref"><h4>รวมเอกสารที่เกี่ยวข้อง</h4><p>แสดงรายการเอกสารทั้งหมด</p>${DREF.map(g=>`<div class="dgc">${g.map(r=>`<div class="dgr"><span class="dgi ${r[3]}">${ic(r[0],24)}</span><span class="dgt"><b>${r[1]}</b><small>${r[2]}</small></span></div>`).join('')}</div>`).join('')}</div>`;
// public DEMO build (VITE_DEMO_ONLY=1): เอกสาร and ประวัติ are plain, non-clickable lists in the reference style. Real accounts keep the full library and history.
const SDOC=[[['si_person','c-nv','บัตรประจำตัวประชาชน','บัตรประจำตัวประชาชน']],[['si_house','c-gr','ทะเบียนบ้าน','ข้อมูลทะเบียนบ้าน'],['si_baby','c-gr','สูติบัตร','ข้อมูลการเกิด สถานที่เกิด บิดา มารดา']],[['si_heart','c-rd','ทะเบียนสมรส','ทะเบียนการสมรส'],['si_broken','c-rd','ทะเบียนหย่า','ทะเบียนการหย่า']],[['si_wheel','c-gr','บัตรประจำตัวคนพิการ','บัตรประจำตัวคนพิการ']],[['si_gun','c-nv','ใบอนุญาตอาวุธปืน แบบ ป.4','รายการใบอนุญาตให้มีและใช้อาวุธปืน (แบบ ป.4)'],['si_gun','c-nv','ใบอนุญาตอาวุธปืน แบบ ป.3','รายการใบอนุญาตให้ซื้ออาวุธปืน (แบบ ป.3)']]];
const SHIS=[['5 กรกฎาคม พ.ศ. 2569','ระบบตัวอย่างบริการบัญชี มีการร้องขอให้ท่านยืนยันตัวตน'],['13 มีนาคม พ.ศ. 2569','ระบบตัวอย่างสำหรับสมัครเข้าศึกษา มีการร้องขอให้ท่านยืนยันตัวตน'],['9 มีนาคม พ.ศ. 2569','ระบบตัวอย่างสำหรับสมัครเข้าศึกษา มีการร้องขอให้ท่านยืนยันตัวตน'],['7 มีนาคม พ.ศ. 2569','ระบบตัวอย่างสำหรับสมัครเข้าศึกษา มีการร้องขอให้ท่านยืนยันตัวตน']];
const staticDocs=()=>`<div class="pn sdoc"><h3 class="mh"><span>เอกสาร</span></h3><div class="sdh"><b>รวมเอกสารที่เกี่ยวข้อง</b><span>แสดงรายการเอกสารทั้งหมด</span></div>${SDOC.map(g=>`<div class="sgc">${g.map(r=>`<div class="sri"><span class="ssi ${r[1]}">${ic(r[0],24)}</span><div><b>${r[2]}</b><small>${r[3]}</small></div></div>`).join('')}</div>`).join('')}</div>`;
const staticHist=()=>`<div class="pn sdoc"><h3 class="mh"><span>ประวัติการทำรายการ</span></h3>${SHIS.map(h=>`<h4 class="shd2">${h[0]}</h4><div class="shc"><div class="shr"><span class="sho">${ic('image',22)}</span><b>ยืนยันตัวตน</b><em>ยินยอม</em></div><p>${h[1]}</p></div>`).join('')}</div>`;
function R1(){
  if(demoOnly)return mount(1,staticDocs());
  const n=S.docs.length,full=n>=LIM,inf=S.docs.map(d=>({d,i:dinfo(d)})),cnt=k=>inf.filter(x=>x.i.k.includes(k)).length;
  if(S.dst!=='all'&&!cnt(S.dst))S.dst='all';
  const sts=DST.filter(x=>x[0]==='all'||cnt(x[0]));
  mount(1,`<div class="pn"><h3 class="mh"><span>เอกสาร</span><small>${n}/${LIM}</small></h3>
   ${drefHtml()}<h4 class="dmine">เอกสารของฉัน</h4>
   <p class="nb">เปิดดูได้เฉพาะเจ้าของบัญชีที่เข้าสู่ระบบ ไฟล์ที่อัปโหลดจะถูกเก็บตามต้นฉบับ การหมุน ครอป ซูม และลายน้ำเป็นเพียงการแสดงผล และสำเนาลายน้ำสร้างเมื่อคุณสั่งเท่านั้น</p>
   ${full?`<p class="nb dwarn">เก็บเอกสารครบ ${LIM} รายการแล้ว ลบเอกสารที่ไม่ใช้ก่อนจึงจะเพิ่มใหม่ได้</p>`:''}
   <div class="ffbtns"><button class="btn p" data-act="scan-to" data-doc="new" data-side="front" ${full?'disabled':''}>${ic('plus',16)} เพิ่มเอกสารใหม่</button><button class="btn g" data-act="scan-pick" ${full?'disabled':''}>${ic('image',16)} เลือกรูปจากเครื่อง</button></div>
   ${n?`<input type="search" class="dq mt14" id="dq" placeholder="ค้นหาชื่อเอกสาร ผู้ถือ หรือหมายเลข" value="${esc(S.q||'')}" data-inp="doc-q" aria-label="ค้นหาเอกสาร" enterkeyhint="search">
   <div class="chips dc" id="dcat" role="group" aria-label="หมวดหมู่">${['ทั้งหมด',...CATS].map(c=>{const k=c==='ทั้งหมด'?n:S.docs.filter(d=>d.category===c).length;return `<button class="${(S.cat||'ทั้งหมด')===c?'on':''}${k?'':' z'}" data-act="doc-cat" data-c="${c}">${c} <em>${k}</em></button>`}).join('')}</div>
   ${sts.length>1?`<div class="chips dc dst" id="dst" role="group" aria-label="สถานะ">${sts.map(x=>`<button class="${S.dst===x[0]?'on':''}" data-act="doc-st" data-v="${x[0]}">${x[1]}${x[0]==='all'?'':` <em>${cnt(x[0])}</em>`}</button>`).join('')}</div>`:''}
   <div class="dbar"><span id="dcount" role="status" aria-live="polite"></span><label class="dsort">เรียงตาม<select id="dsort" data-chg="doc-sort" aria-label="เรียงตาม">${DSORT.map(o=>`<option value="${o[0]}" ${S.dsort===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></label></div>
   <div class="list" id="dlist">${dsorted().map(drow).join('')}</div>`:`<div class="dempty">${ic('doc',40)}<b>ยังไม่มีเอกสาร</b><p>กด “เพิ่มเอกสารใหม่” เพื่อถ่ายหรือเลือกภาพเอกสารชุดแรกของคุณ เก็บได้ทั้งด้านหน้าและด้านหลัง</p></div>`}</div><div class="dfoot">${foot()}</div>`);dfilter()}
function slot(d,s){const im=d.images[s];
  return `<div class="slot"><span class="th">${im?`<img alt="" data-img="${d.id}:${s}:t">`:ic('image',24)}</span><div class="sa"><b>${SIDE[s]}</b><small>${im?`${Math.round(im.size/1024)} KB · ${fmtDate(im.updated_at,S.era)}`:'ยังไม่มีภาพ'}</small>
   ${im?`<button class="mini" data-act="view" data-id="${d.id}" data-side="${s}">ดู</button><button class="mini" data-act="adjust-saved" data-id="${d.id}" data-side="${s}">ปรับภาพ</button><button class="mini" data-act="scan-to" data-doc="${d.id}" data-side="${s}">เปลี่ยน</button><button class="mini" data-act="copy-wm" data-id="${d.id}" data-side="${s}">สำเนาลายน้ำ</button><button class="mini" data-act="dl-orig" data-id="${d.id}" data-side="${s}">ต้นฉบับ</button><button class="mini dg" data-act="img-del-ask" data-id="${d.id}" data-side="${s}">ลบภาพ</button>`
   :`<button class="mini" data-act="scan-to" data-doc="${d.id}" data-side="${s}">เพิ่มภาพ</button>`}</div></div>`}
function docSheet(id){const d=docById(id);if(!d)return;
  sheet(`<h3>จัดการเอกสาร</h3><label for="rt">ชื่อเอกสาร</label><input type="text" id="rt" maxlength="60" value="${esc(d.title)}" data-chg="rename" data-id="${d.id}">${slot(d,'front')}${slot(d,'back')}<button class="bt2" data-act="doc-show" data-id="${d.id}">${ic('home',16)} แสดงบนหน้าหลัก</button><button class="bt2" data-act="det-open" data-id="${d.id}">ข้อมูลเอกสาร (ชื่อผู้ถือ เลขที่ วันหมดอายุ)</button><button class="bt3" data-act="doc-del-ask" data-id="${d.id}">ลบเอกสารทั้งชุด</button>`)}
function R2(){
  if(S.scan.doc!=='new'&&!docById(S.scan.doc))S.scan.doc='new';
  const sc=S.scan,ex=sc.doc==='new'?null:docById(sc.doc),has=ex?.images[sc.side];
  const vf=sc.file?`<img class="pv-img" src="${sc.pu||sc.url}" alt="ภาพตัวอย่างก่อนบันทึก">`:sc.cam?`<video id="cam" playsinline muted autoplay></video><div class="gd"></div>`
    :`<div class="em">${ic('camera',34)}<b>พร้อมสแกน${SIDE[sc.side]}</b>${demoOnly?'':'<span>วางบัตรให้เต็มกรอบ แสงสว่างสม่ำเสมอ ระบบจะครอปให้พอดีบัตรจริง (85.6×54 มม.) ให้อัตโนมัติ</span>'}</div>`;
  const ctl=sc.file?`<p class="nb fitnote">${has?`ภาพนี้จะ<b>แทนที่</b>ภาพ${SIDE[sc.side]}เดิม`:`ภาพนี้จะถูกบันทึกเป็น${SIDE[sc.side]}`} · ${sc.crop?'จัดให้พอดีกรอบบัตรจริง (85.6×54 มม.) แล้ว ตรวจดูให้อ่านชัด แล้วกด “ยืนยัน” หรือ “ปรับภาพ” เพื่อขยับ ซูม หมุน':'ใช้ภาพเต็ม ไม่ครอป · กด “ครอปให้พอดีบัตร” เพื่อจัดให้พอดีกรอบบัตรจริง'}</p>
     <button class="bt2" data-act="scan-adjust" ${sc.busy?'disabled':''}>${ic('crop',18)} ปรับภาพ (ครอป · ซูม · หมุน)${sc.rot||sc.crop?' ✓':''}</button>
     <div class="row2"><button class="bt2" data-act="scan-rot" ${sc.busy?'disabled':''}>${ic('rr',18)} หมุน 90°</button><button class="bt2" data-act="scan-fit" ${sc.busy?'disabled':''}>${sc.crop?'ใช้ภาพเต็ม':'ครอปให้พอดีบัตร'}</button></div>
     <div class="row2"><button class="bt2" data-act="scan-retake" ${sc.busy?'disabled':''}>ถ่ายใหม่</button><button class="bt2" data-act="scan-cancel" ${sc.busy?'disabled':''}>ยกเลิก</button></div>
     <button class="bt" data-act="scan-save" ${sc.busy?'disabled':''}>${sc.busy?'กำลังบันทึก…':`ยืนยันและบันทึก${SIDE[sc.side]}`}</button>`
   :sc.cam?`<div class="scr"><button class="rb" data-act="cam-flip" aria-label="สลับกล้องหน้า/หลัง">${ic('refresh',22)}</button><button class="shut" data-act="shoot" aria-label="ถ่ายภาพ">${ic('camera',28)}</button><button class="rb" data-act="pick-gallery" aria-label="เลือกจากคลังภาพ">${ic('image',22)}</button></div><button class="bt2" data-act="cam-off">ปิดกล้อง</button>`
   :`<button class="bt" data-act="cam-on">${ic('camera',18)} เปิดกล้อง</button><div class="row2"><button class="bt2" data-act="pick-gallery">เลือกจากคลังภาพ</button><button class="bt2" data-act="pick-native">ถ่ายด้วยกล้องเครื่อง</button></div>`;
  mount(2,`<div class="pn${sc.file?' hasfile':''}"><h3 class="mh"><span>สแกนเอกสาร</span></h3>
   <div class="scsel"><label for="sd">เอกสาร</label><select id="sd" data-chg="scan-doc" ${sc.file?'disabled':''}><option value="new" ${sc.doc==='new'?'selected':''}>+ เอกสารใหม่</option>${S.docs.map(d=>`<option value="${d.id}" ${sc.doc===d.id?'selected':''}>${esc(d.title)}</option>`).join('')}</select>
   ${sc.doc==='new'?`<label for="st">ชื่อเอกสาร</label><input type="text" id="st" maxlength="60" placeholder="เช่น ใบขับขี่ของฉัน" value="${esc(sc.title)}" data-inp="scan-title" ${sc.file?'disabled':''}>`:''}
   <div class="lb">เลือกด้านที่จะบันทึก</div><div class="seg">${['front','back'].map(s=>`<button data-act="scan-side" data-side="${s}" class="${sc.side===s?'on':''}" ${sc.file?'disabled':''}>${SIDE[s]}</button>`).join('')}</div></div>
   ${sc.file?`<p class="scsum">${ic('doc',16)}<span><b>${esc(sc.doc==='new'?(sc.title.trim()||'เอกสารใหม่'):(ex?.title||''))}</b> · ${SIDE[sc.side]}</span></p>`:''}
   <div class="vf mt14${sc.file&&sc.crop?' card':''}">${vf}</div>${ctl}${!sc.file&&!sc.cam&&has?`<div class="lb mt14">ภาพ${SIDE[sc.side]}ที่บันทึกไว้ในเอกสารนี้</div>${slot(ex,sc.side)}`:''}
   <input type="file" id="fg" hidden accept="image/*" data-chg="scan-file"><input type="file" id="fc" hidden accept="image/*" capture="environment" data-chg="scan-file">
   ${S.demo&&!demoOnly?'<p class="nb">โหมด DEMO: ภาพที่เพิ่มจะอยู่ในหน่วยความจำของแท็บนี้เท่านั้น ไม่ถูกอัปโหลดไปที่ใด และหายเมื่อออกจากโหมด DEMO ไม่ควรใช้เอกสารจริง</p>':''}${demoOnly?'':`<p class="nt mt14">รองรับรูปความละเอียดสูง JPG, PNG, WebP (และ HEIC บนอุปกรณ์ที่เปิดได้) ไม่เกิน 100 MB · เก็บไฟล์ต้นฉบับเต็มความละเอียด ไม่บีบอัดซ้ำ</p>`}</div><div class="dfoot">${foot()}</div>`);
  const v=$('#cam');if(v&&sc.stream){v.srcObject=sc.stream;v.play?.().catch(()=>{})}}
const HF=[['all','ทั้งหมด',null],['up','อัปโหลด / แก้ภาพ',['uploaded','replaced']],['view','เปิดดู',['viewed']],['copy','สำเนา / ดาวน์โหลด',['copy_saved']],['del','ลบ',['deleted']],['acct','บัญชี / โปรไฟล์',['login','profile_updated']]];
const HPAGE=25;
const dayKey=ts=>{const d=new Date(ts);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const dayLabel=k=>fmtDate(k,S.era,true);
const hm=ts=>{const d=new Date(ts);return `${pad(d.getHours())}:${pad(d.getMinutes())}`};
/* a history row can open its document only while that document still exists (the row stores the document's title) */
function histDoc(h){if(h.kind==='deleted'||!h.detail)return null;let b=null;S.docs.forEach(d=>{if(h.detail.includes(d.title)&&(!b||d.title.length>b.title.length))b=d});return b}
const HS=k=>k==='deleted'?['ลบแล้ว','bad']:k==='viewed'?['เปิดดู','info']:['สำเร็จ','ok'];
// a history row is a plain card now: icon, title, status, description (no click, no link)
function hrow(h){const k=KL[h.kind]||['hist',h.kind],st=HS(h.kind);
  return `<div class="hr"><span class="hi2 ${h.kind}">${ic(k[0],20)}</span><span class="hb"><b>${esc(k[1])}</b>${h.detail?`<small>${esc(h.detail)}</small>`:''}</span><span class="ht"><i class="hst ${st[1]}">${st[0]}</i><time datetime="${esc(h.created_at)}" title="${esc(fmtDT(h.created_at,S.era))}">${hm(h.created_at)}</time></span></div>`}
function R3(){
  if(demoOnly)return mount(3,staticHist());
  const f=HF.find(x=>x[0]===S.hf)||HF[0],of=x=>x[2]?S.hist.filter(h=>x[2].includes(h.kind)):S.hist,all=of(f),shown=all.slice(0,S.hn);
  let cur='',rows='';
  shown.forEach(h=>{const k=dayKey(h.created_at);if(k!==cur){if(cur)rows+='</div>';cur=k;rows+=`<h4 class="hd3">${dayLabel(k)}</h4><div class="list hl">`}rows+=hrow(h)});if(cur)rows+='</div>';
  mount(3,`<div class="pn"><h3 class="mh"><span>ประวัติการทำรายการ</span><small>${S.hist.length?`${S.hist.length} รายการ`:''}</small></h3>${S.hist.length?`
   <div class="chips dc" id="hf" role="group" aria-label="กรองประวัติ">${HF.map(x=>`<button class="${x[0]===f[0]?'on':''}" data-act="hist-f" data-v="${x[0]}">${x[1]} <em>${of(x).length}</em></button>`).join('')}</div>
   ${shown.length?rows+(all.length>shown.length?`<button class="bt2 hmore" data-act="hist-more">แสดงเพิ่มเติม (อีก ${all.length-shown.length} รายการ)</button>`:''):`<div class="dempty">${ic('hist',34)}<b>ไม่มีรายการในหมวดนี้</b></div>`}
   <p class="ffnote">แสดงกิจกรรมล่าสุดไม่เกิน 100 รายการ ประวัติเป็นบันทึกการใช้งานบัญชีของคุณ แก้ไขหรือลบเองไม่ได้ และจะถูกลบเมื่อลบบัญชี</p>`
   :`<div class="dempty">${ic('hist',40)}<b>ยังไม่มีกิจกรรม</b><p>เมื่อคุณอัปโหลด เปิดดู แก้ไข หรือบันทึกสำเนาเอกสาร รายการจะแสดงที่นี่</p></div>`}</div><div class="dfoot">${foot()}</div>`)}
const pad=n=>String(n).padStart(2,'0');
function pfDraft(){const p=S.profile;return S.draft||{display_name:p.display_name||'',display_name_en:p.display_name_en||'',id_number:fmtId(p.id_number),address:p.address||'',card_issued_on:p.card_issued_on||'',member_no:fmtMember(p.member_no),dob:p.dob||'',card_expires_on:p.card_expires_on||'',phone:p.phone||'',contact_email:p.contact_email||''}}
let spN=0,spT=0;
// public DEMO build: the Settings screen is a blank white page until the top-right power button is tapped 5 times in a row while on it (see power()); it hides again when you leave the tab.
function R4(){
  if(demoOnly&&!S.setOpen)return mount(4,'<div class="pn sblank" aria-hidden="true"></div>');
  const v=pfDraft(),dm=S.demo||isMock;
  const tg=(a,on,l)=>`<button class="sw${on?' on':''}" data-act="${a}" role="switch" aria-checked="${on}" aria-label="${l}"></button>`;
  mount(4,`<div class="pn"><h3 class="mh"><span>ตั้งค่า</span></h3>
   <h4 class="cardh">แก้ไขข้อมูลบัตร</h4>
   <form data-form="profile" id="pf" class="cform" novalidate>
    <label for="c1">ชื่อ-สกุล</label><input id="c1" name="display_name" type="text" maxlength="80" value="${esc(v.display_name)}" autocomplete="name">
    <label for="c2">ชื่อ-สกุล (อังกฤษ)</label><input id="c2" name="display_name_en" type="text" maxlength="80" value="${esc(v.display_name_en)}" autocomplete="off">
    <label for="c3">เลขประจำตัวประชาชน (13 หลัก)</label><input id="c3" name="id_number" type="text" inputmode="numeric" maxlength="17" value="${esc(v.id_number)}" autocomplete="off" data-inp="fmt-id" placeholder="0-0000-00000-00-0">
    <label for="c4">ที่อยู่</label><textarea id="c4" name="address" rows="3" maxlength="300" autocomplete="street-address" placeholder="บ้านเลขที่ หมู่ที่ ซอย ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์">${esc(v.address)}</textarea>
    <label for="c5">วันที่ออกบัตร</label><input id="c5" name="card_issued_on" type="date" value="${esc(v.card_issued_on)}">
    <label for="c6">เลขสมาชิก (12 หลัก)</label><input id="c6" name="member_no" type="text" inputmode="numeric" maxlength="14" value="${esc(v.member_no)}" autocomplete="off" data-inp="fmt-member" placeholder="0000 0000 0000">
    <div class="dd2"><div><label for="c7">วันเกิด</label><input id="c7" name="dob" type="date" value="${esc(v.dob)}"></div><div><label for="c8">วันหมดอายุ</label><input id="c8" name="card_expires_on" type="date" value="${esc(v.card_expires_on)}"></div></div>
    <div class="err" id="pe" role="alert"></div>
    <div class="ffbtns cbtn"><button class="btn p" type="submit">บันทึก</button><button type="button" class="btn g" data-act="card-reset-ask">รีเซ็ตเป็นค่าเริ่มต้น</button></div></form>
   ${dm?'<p class="cdemo">ข้อมูลทั้งหมดเป็นข้อมูลสมมติ (DEMO) เก็บไว้ในเบราว์เซอร์นี้เท่านั้น</p>':''}
   <div class="cd"><h4>รูปโปรไฟล์</h4><p class="hint">รูปนี้แสดงที่หน้าหลักและในหน้า “ข้อมูลบัตร”</p><div class="ed"><img class="av" src="${avSrc()}" alt="รูปโปรไฟล์"><div><label class="pk" for="avf">เปลี่ยนรูป</label><input id="avf" type="file" hidden accept="image/*" data-chg="avatar">${S.profile.avatar_path?`<button type="button" class="mini dg" data-act="avatar-del">ลบรูป</button>`:''}</div></div></div>
   <div class="cd"><h4>ข้อมูลติดต่อ (ไม่บังคับ)</h4><form data-form="contact" id="pc" novalidate>
    <label for="k1">เบอร์โทรศัพท์</label><input id="k1" name="phone" type="tel" inputmode="tel" maxlength="24" value="${esc(v.phone)}" autocomplete="tel">
    <label for="k2">อีเมลติดต่อ</label><input id="k2" name="contact_email" type="email" maxlength="120" value="${esc(v.contact_email)}" autocomplete="email">
    <div class="err" id="pce" role="alert"></div><button class="bt" type="submit">บันทึกข้อมูลติดต่อ</button></form></div>
   <div class="cd"><h4>การแสดงผล</h4>
    <div class="rw"><span>รูปแบบปี<small>ใช้กับวันที่ทั้งหมดในแอป</small></span><div class="seg"><button data-act="era" data-v="BE" class="${S.era==='BE'?'on':''}">พ.ศ.</button><button data-act="era" data-v="CE" class="${S.era==='CE'?'on':''}">ค.ศ.</button></div></div>
    <label for="th">ธีม</label><select id="th" data-chg="theme">${[['light','สว่าง'],['dark','มืด'],['system','ตามระบบของเครื่อง']].map(o=>`<option value="${o[0]}" ${S.theme===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>
    <div class="rw"><span>เลื่อนแบนเนอร์อัตโนมัติ</span>${tg('tg-auto',S.auto,'เลื่อนแบนเนอร์อัตโนมัติ')}</div></div>
   ${demoOnly?'':`<div class="cd"><h4>ลายน้ำ</h4><p class="hint">ใช้กับภาพตัวอย่างและสำเนาที่บันทึก ต้นฉบับไม่ถูกแก้ไข ลายน้ำเป็นเพียงเครื่องหมายเตือนทางสายตา ไม่ใช่มาตรการความปลอดภัย</p>
    <div class="rw"><span>แสดงลายน้ำ</span>${tg('tg-wm',S.wm.on,'แสดงลายน้ำ')}</div>
    <label for="wo">ความทึบ</label><input id="wo" type="range" min="0.1" max="0.8" step="0.05" value="${S.wm.op}" data-inp="wm-op">
    <label for="wp">ตำแหน่ง</label><select id="wp" data-chg="wm-pos">${WMPOS.map(o=>`<option value="${o[0]}" ${S.wm.pos===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>
    <label for="wt">ข้อความ</label><input id="wt" type="text" maxlength="60" value="${esc(S.wm.text)}" data-inp="wm-text">
    <div class="wmpv"><span>ตัวอย่างพื้นที่เอกสาร</span><div class="wmo" data-wm></div></div></div>`}
   ${demoOnly?'':`<div class="cd"><h4>ล็อกแอปด้วยรหัส</h4><p class="hint">รหัส 8 หลักนี้เป็นล็อกบนอุปกรณ์เครื่องนี้ เพื่อกันคนที่หยิบเครื่องของคุณไปเปิดแอป ไม่ได้เข้ารหัสไฟล์ และไม่ใช่รหัสผ่านบัญชี ระบบเก็บเฉพาะค่าแฮชไว้ในเครื่องนี้ ไม่มีรหัสกลางที่ใช้ร่วมกัน</p>
    <div class="rw"><span>เปิดใช้รหัสล็อกแอป</span>${tg('tg-lock',hasLock(),'เปิดใช้รหัสล็อกแอป')}</div>
    ${hasLock()?`<button class="rw" data-act="lock-change"><span>เปลี่ยนรหัส</span>${ic('chev',18)}</button><button class="rw" data-act="lock-now"><span>ล็อกตอนนี้</span>${ic('lock',18)}</button>
    <label for="la">ล็อกอัตโนมัติเมื่อออกจากแอป</label><select id="la" data-chg="lock-after">${[[0,'ทันที'],[60,'หลัง 1 นาที'],[300,'หลัง 5 นาที']].map(o=>`<option value="${o[0]}" ${S.lockAfter===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`:''}
    <div class="rw"><span>ซ่อนภาพบนหน้าหลักจนกว่าจะแตะ<small>แสดงภาพแบบเบลอพร้อมรูปกุญแจ จนกว่าจะแตะ</small></span>${tg('tg-hidepv',S.hidePv,'ซ่อนภาพบนหน้าหลัก')}</div></div>`}
   <div class="cd"><h4>หน้าหลัก: แบนเนอร์และประกาศ</h4><p class="hint">แก้ข้อความ แบบแบนเนอร์ และไอคอนประกาศได้เอง บันทึกไว้ในบัญชีของคุณ</p>
     <div class="lb">แบนเนอร์ที่เลื่อนได้ (${BNS().length}/6)</div>${BNS().map((b,i)=>`<button class="rw" data-act="bn-edit" data-i="${i}"><span class="bnsw ${b.tpl in BTPL?b.tpl:'b1'}">${b.img?`<img alt="" data-bnimg="${esc(b.img)}" data-v="${+b.iv||0}">`:''}</span><span>${esc(b.t1)||(b.img?'(แบนเนอร์รูปภาพ)':'(ไม่มีหัวข้อ)')}<small>${b.img?'รูปแบนเนอร์ของฉัน':(BTPL[b.tpl]||BTPL.b1)}</small></span>${ic('edit',18)}</button>`).join('')}
     ${BNS().length<6?`<button class="rw" data-act="bn-edit" data-i="new">${ic('plus',18)}<span>เพิ่มแบนเนอร์</span></button>`:''}
     <div class="lb">ประกาศ (${ANNS().length}/20)</div><button class="rw" data-act="anpic-edit">${annIc({ic:'logo'},'ai2')}<span>ไอคอนเริ่มต้นของประกาศทั้งหมด<small>${annDef()?'ใช้รูปของฉัน':'ใช้ไอคอน DocPocket'}</small></span>${ic('edit',18)}</button>${ANNS().map((a,i)=>`<button class="rw" data-act="an-edit" data-i="${i}">${annIc(a,'ai2')}<span>${esc(a.t)}<small>${annDate(a)}${a.demo?' · DEMO':''}</small></span>${ic('edit',18)}</button>`).join('')}
     ${ANNS().length<20?`<button class="rw" data-act="an-edit" data-i="new">${ic('plus',18)}<span>เพิ่มประกาศ</span></button>`:''}
     <button class="rw" data-act="home-reset-ask"><span>คืนค่าแบนเนอร์และประกาศเริ่มต้น</span>${ic('refresh',18)}</button></div>
   <div class="cd"><h4>การแจ้งเตือน</h4><div class="rw"><span>แสดงจุดแจ้งเตือนที่กระดิ่ง<small>เมื่อมีประกาศใหม่จาก DocPocket</small></span>${tg('tg-badge',S.badge,'แสดงจุดแจ้งเตือน')}</div>
    <label for="xd">เตือนเอกสารใกล้หมดอายุ<small class="sub">ใช้วันหมดอายุที่คุณบันทึกในข้อมูลเอกสาร · แสดงในกระดิ่ง</small></label><select id="xd" data-chg="exp-days">${[[0,'ปิด'],[30,'ล่วงหน้า 30 วัน'],[60,'ล่วงหน้า 60 วัน'],[90,'ล่วงหน้า 90 วัน']].map(o=>`<option value="${o[0]}" ${S.expDays===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
   ${demoOnly?'':`<div class="cd"><h4>ความเป็นส่วนตัวและบัญชี</h4><p class="hint">${esc(S.user?.email||'')}</p>
    <button class="rw" data-act="${S.mfa?'mfa-off':'mfa-on'}"><span>ยืนยันสองขั้นตอน (Authenticator)<small>${S.mfa?'เปิดอยู่ · แตะเพื่อปิด':'ปิดอยู่ · แตะเพื่อเปิด'}</small></span>${ic('chev',18)}</button>
    <a class="rw" href="/privacy.html" target="_blank" rel="noopener"><span>นโยบายความเป็นส่วนตัวและการเก็บรักษาข้อมูล</span>${ic('chev',18)}</a>
    <button class="rw" data-act="export"><span>ดาวน์โหลดข้อมูลของฉัน (JSON)<small>โปรไฟล์ รายการเอกสาร และประวัติ</small></span>${ic('download',18)}</button>
     <button class="rw" data-act="export-zip"><span>ดาวน์โหลดภาพต้นฉบับทั้งหมด (ZIP)<small>ไฟล์ต้นฉบับทุกด้าน เต็มความละเอียด พร้อมไฟล์ข้อมูล JSON</small></span>${ic('download',18)}</button>
    ${S.demo?'':`<button class="rw" data-act="logout-ask"><span>ออกจากระบบ</span>${ic('power',18)}</button>
    <button class="rw dg" data-act="acct-ask"><span>ลบบัญชีและข้อมูลทั้งหมด</span>${ic('trash',18)}</button>`}</div>
   <div class="cd"><h4>โหมด DEMO (สำหรับนำเสนอ)</h4><p class="hint">แสดงแอปด้วยเอกสารและประวัติสมมติ โดยไม่แตะเอกสารจริงของคุณ ข้อมูลอยู่ในหน่วยความจำของแท็บนี้และหายเมื่อออก</p>${S.demo?`<button class="rw" data-act="demo-menu"><span>เมนู DEMO และลำดับการนำเสนอ</span>${ic('chev',18)}</button><button class="rw" data-act="demo-reset"><span>รีเซ็ตข้อมูลตัวอย่าง</span>${ic('refresh',18)}</button><button class="rw" data-act="demo-exit"><span>ออกจากโหมด DEMO</span>${ic('power',18)}</button>`:`<button class="rw" data-act="demo-start"><span>เปิดโหมด DEMO<small>ใช้ข้อมูลสมมติ ไม่แก้ไขหรือส่งข้อมูลของบัญชีจริง</small></span>${ic('chev',18)}</button>`}</div>`}
   ${demoOnly?'':`<div class="cd"><h4>เกี่ยวกับ DocPocket</h4><div class="brand sm">${LOGO(44)}<div><b>DocPocket</b><p>กระเป๋าเอกสารส่วนตัว · เวอร์ชัน 1.0</p></div></div><p class="nt tl">${ABOUT}</p>${isMock?'<div class="mockb">โหมดทดสอบ (DEMO): ใช้บัญชีและเอกสารสมมติ ข้อมูลอยู่ในแท็บนี้และหายเมื่อรีเฟรช ไม่มีเซิร์ฟเวอร์จริง อย่าอัปโหลดเอกสารจริง</div>':''}</div>`}</div><div class="dfoot">${foot()}</div>`)}
const R=[R0,R1,R2,R3,R4];
function go(i){
  if(S.tab===4&&i!==4){keepDraft();S.setOpen=false}
  if(S.tab===2&&i!==2)stopCam();
  S.tab=i;closeSheet();closeViewNow();closeEd();closeDet();closeProf();closeAp();renderHdr();
  $$('.view').forEach((v,j)=>v.classList.toggle('on',j===i));$$('.ni').forEach((b,j)=>{b.classList.toggle('on',j===i);b.toggleAttribute('aria-current',j===i)});
  $('#fab').classList.toggle('on',i===0);R[i]();$('#v'+i).scrollTop=0}
function rerender(){R[S.tab]()}

/* ===================== viewer ===================== */
function openView(id,side){
  const d=docById(id);if(!d)return;if(!d.images.front&&!d.images.back){toast('เอกสารนี้ยังไม่มีภาพ');return}
  if(!side)side=S.flip?'back':'front';
  S.view={id,side,z:1,tx:0,ty:0,ptr:new Map(),d0:0,z0:1};closeSheet();$('#app').classList.add('v-open');drawView();$('#vwr').classList.add('on');fitV();vAnim(true);
  log('viewed',`${d.title} · ${SIDE[side]}`)}
/* Expanded preview: the card is shown large (rotated to landscape on a portrait phone, like the reference),
   with a back button, a flip button and a real 3D flip between the two independent images. */
function drawView(){
  const v=S.view,d=docById(v.id);
  const face=s=>{const im=d.images[s];return `<div class="vfc${s==='back'?' bk':''}">${im?`<img alt="${SIDE[s]}ของ ${esc(d.title)}" data-vimg="${s}">`:`<div class="em"><b>ยังไม่มีภาพ${SIDE[s]}</b><button class="btn" data-act="scan-to" data-doc="${d.id}" data-side="${s}">เพิ่มภาพ${SIDE[s]}</button></div>`}</div>`};
  $('#vwr').innerHTML=`<div class="vt"><button class="zc" data-act="view-close" aria-label="กลับหน้าหลัก">${ic('chev',26).replace('<svg','<svg class="rv"')}</button><button class="zc" data-act="view-flip" aria-label="พลิกเอกสาร">${ic('flip',26)}</button></div>
   <div class="vstage" id="vstage"><div class="vbox" id="vbox"><div class="vflip${v.side==='back'?' f':''}" id="vflip">${face('front')}${face('back')}</div><div class="wmo" data-wm></div></div></div>
`;
  $$('[data-wm]',$('#vwr')).forEach(el=>applyWM(el,S.wm));
  $$('[data-vimg]',$('#vwr')).forEach(el=>{const im=d.images[el.dataset.vimg];imgUrl(im,false).then(u=>{if(S.view===v){el.onload=()=>fillCls(el);el.src=u}}).catch(()=>toast('เปิดภาพไม่สำเร็จ'))});
  fitV()}
function fitV(){const v=S.view,b=$('#vbox'),st=$('#vstage');if(!v||!b||!st)return;
  const W=st.clientWidth-28,H=st.clientHeight-8,A=856/540,ang=(W<H?90:0)+(v.o||0),rot=ang%180!==0;let bw=rot?Math.min(H,W*A):Math.min(W,H*A);
  b.style.width=bw+'px';b.style.height=bw/A+'px';
  b.style.transform=`translate(${v.tx}px,${v.ty}px) translate(-50%,-50%)${ang?` rotate(${ang}deg)`:''} scale(${v.z})`;
  const l=$('#vzl');if(l)l.textContent=Math.round(v.z*100)+'%'}
function vZoom(z){const v=S.view;if(!v)return;v.z=clamp(z,1,4);if(v.z===1){v.tx=0;v.ty=0}fitV()}
function vPtr(e){const v=S.view;if(!v||!e.target.closest('#vbox'))return;const m=v.ptr;
  if(e.type==='pointerdown'){if(!m.size){v.sx=e.clientX;v.sy=e.clientY;v.moved=false}m.set(e.pointerId,{x:e.clientX,y:e.clientY});if(m.size>1)v.moved=true;if(m.size===2){const [a,b]=[...m.values()];v.d0=Math.hypot(a.x-b.x,a.y-b.y);v.z0=v.z}}
  else if(e.type==='pointermove'&&m.has(e.pointerId)){const p=m.get(e.pointerId);m.set(e.pointerId,{x:e.clientX,y:e.clientY});if(Math.hypot(e.clientX-v.sx,e.clientY-v.sy)>8)v.moved=true;
    if(m.size===1&&v.z>1){v.tx+=e.clientX-p.x;v.ty+=e.clientY-p.y;fitV()}else if(m.size===2&&v.d0){const [a,b]=[...m.values()];vZoom(v.z0*Math.hypot(a.x-b.x,a.y-b.y)/v.d0)}}
  else m.delete(e.pointerId)}
// card grows out of the home card (and shrinks back into it) — like the reference recording
function vFrom(){const e=S.tab===0&&$('#v0 .flipw .scene'),b=$('#vbox'),st=$('#vstage');if(!e||!b||!st)return null;const r=e.getBoundingClientRect(),q=st.getBoundingClientRect(),bw=parseFloat(b.style.width);
  if(!r.width||!bw)return null;return `translate(${r.left+r.width/2-(q.left+q.width/2)}px,${r.top+r.height/2-(q.top+q.height/2)}px) translate(-50%,-50%) scale(${r.width/bw})`}
function vAnim(open,done){const b=$('#vbox'),f=vFrom(),rm=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!b||!f||rm){done?.();return}
  const to=b.style.transform;b.style.transition='none';b.style.transform=open?f:to;void b.offsetWidth;
  b.style.transition='transform .45s cubic-bezier(.3,.9,.3,1)';b.style.transform=open?to:f;
  setTimeout(()=>{b.style.transition='';done?.()},460)}
function closeView(){if(!S.view||S.vclosing)return;S.vclosing=true;$('#vwr').classList.add('out');vAnim(false,()=>{S.vclosing=false;$('#vwr').classList.remove('out');closeViewNow()})}
function closeViewNow(){
  if(S.view&&S.tab===0&&S.view.id===S.selId){const c=$('.card3d');if(c){c.style.transition='none';c.classList.toggle('f',S.flip);void c.offsetWidth;c.style.transition=''}}
  S.view=null;$('#app').classList.remove('v-open');$('#vwr').classList.remove('on')}
async function copyWM(id,side){const v=id?{id,side}:S.view;if(!v)return;const d=docById(v.id),im=d?.images[v.side];if(!im)return toast(`ยังไม่มีภาพ${SIDE[v.side]}`);toast('กำลังสร้างสำเนา…');
  try{const c=await watermarkedCopy(await fetchBlob(im.path),im.rotation,im.crop,S.wm);saveBlob(c,`${safeName(d.title)}-${v.side}-${S.wm.on?'watermarked':'copy'}.jpg`);
    await log('copy_saved',`${d.title} · ${SIDE[v.side]}`);toast(S.wm.on?'บันทึกสำเนาลายน้ำแล้ว (ต้นฉบับไม่ถูกแก้ไข)':'บันทึกสำเนาแล้ว (ลายน้ำปิดอยู่)')}catch(e){toast(e.message)}}
async function dlOrig(id,side){const d=docById(id),im=d?.images[side];if(!im)return;try{saveBlob(await fetchBlob(im.path),`${safeName(d.title)}-${side}.${ext(im.mime)}`)}catch(e){toast(e.message)}}

/* ===================== scan / camera ===================== */
function stopCam(){S.scan.stream?.getTracks().forEach(t=>t.stop());S.scan.stream=null;S.scan.cam=false}
async function camOn(){
  stopCam();if(!navigator.mediaDevices?.getUserMedia){toast('เบราว์เซอร์นี้เปิดกล้องในหน้าเว็บไม่ได้ ใช้ “ถ่ายด้วยกล้องเครื่อง” หรือเลือกจากคลังภาพแทน');return}
  try{S.scan.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:S.scan.facing},width:{ideal:4096},height:{ideal:3072}},audio:false});S.scan.cam=true;R2()}
  catch(e){toast(e.name==='NotAllowedError'?'ยังไม่ได้อนุญาตให้ใช้กล้อง ใช้ “เลือกจากคลังภาพ” แทนได้':'ไม่พบกล้อง ใช้ “เลือกจากคลังภาพ” แทนได้')}}
/* frame the photo to the real card shape (85.6x54 mm) by itself: finds the card, rotates a card shot on its side, crops. Nothing is stored in the file: rotation + crop are metadata */
async function scanFit(sc,auto,force){
  if(sc.full)sc.crop=null;
  else try{const bmp=await bitmap(sc.file);let rot=sc.rot||0,pc=previewCanvas(bmp,rot,640),s=smartCrop(pc,force);
    if(auto&&!rot&&s.found&&s.portrait){rot=90;pc=previewCanvas(bmp,rot,640);s=smartCrop(pc)}
    sc.rot=rot;sc.crop=s.crop}catch(e){console.error('auto frame',e);sc.crop=null}
  if(sc.pu){dropURL(sc.pu);sc.pu=null}
  if(sc.rot||sc.crop){try{sc.pu=objURL(await processed(sc.file,sc.rot,sc.crop))}catch(e){toast(e.message)}}}
function clearFile(){const c=S.scan;dropURL(c.url);dropURL(c.pu);c.file=null;c.url=null;c.pu=null;c.rot=0;c.crop=null;c.full=false}
async function setFile(f){if(f&&f.size>8e6)toast('กำลังเปิดรูปความละเอียดสูง…');try{f=await prepImage(f);await checkFile(f)}catch(e){console.error('upload',e);return toast(e.message||'อัปโหลดรูปไม่สำเร็จ')}clearFile();S.scan.file=f;S.scan.url=objURL(f);await scanFit(S.scan,true);R2()}
async function shoot(){const v=$('#cam');if(!v||!v.videoWidth)return toast('กล้องยังไม่พร้อม ลองอีกครั้ง');
  let b=null;const tr=S.scan.stream?.getVideoTracks?.()[0];
  if(tr&&typeof ImageCapture==='function'){ // full-resolution still photo where the browser supports it (Android Chrome)
    try{const cap=new ImageCapture(tr);let o={};try{const pc=await cap.getPhotoCapabilities();if(pc.imageWidth?.max)o={imageWidth:pc.imageWidth.max,imageHeight:pc.imageHeight.max}}catch(e){}
      b=await Promise.race([cap.takePhoto(o),new Promise((_,no)=>setTimeout(()=>no(new Error('timeout')),5000))])}catch(e){b=null}}
  if(!b){const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);b=await new Promise(r=>c.toBlob(r,'image/jpeg',.95))}
  stopCam();setFile(b)}
async function saveScan(){
  const sc=S.scan;if(sc.busy||!sc.file)return;
  const isNew=sc.doc==='new',title=(sc.title||'').trim()||'เอกสารใหม่';
  sc.busy=true;R2();let created=null,stage='';
  try{const mime=await checkFile(sc.file);let d=isNew?null:docById(sc.doc);
    if(isNew){if(S.docs.length>=LIM)throw new Error(`เก็บเอกสารได้สูงสุด ${LIM} รายการ`);
      const id=uid(),{error}=await sb.from('documents').insert({id,user_id:S.user.id,title:title.slice(0,60)});if(error)throw error;created=id;d={id,title,images:{}}}
    const side=sc.side,path=`${S.user.id}/${d.id}/${side}`,had=!!d.images?.[side];
    stage='up';let r=await sb.storage.from(B).upload(path,sc.file,{contentType:mime,upsert:true,cacheControl:'0'});if(r.error)throw r.error;
    try{r=await sb.storage.from(B).upload(path+'.thumb',await makeThumb(sc.file),{contentType:'image/jpeg',upsert:true,cacheControl:'0'})}catch(e){}
    const row={document_id:d.id,user_id:S.user.id,side,path,mime,size:sc.file.size,rotation:sc.rot||0,crop:sc.crop||null,updated_at:new Date().toISOString()};
    const u=await sb.from('document_images').upsert(row,{onConflict:'document_id,side'});if(u.error)throw u.error;
    if(!isNew)await sb.from('documents').update({updated_at:row.updated_at}).eq('id',d.id);
    await log(had?'replaced':'uploaded',`${d.title} · ${SIDE[side]}`);
    clearFile();S.scan=newScan();S.selId=d.id;S.flip=side==='back';await loadDocs();const oth=side==='front'?'back':'front',nd=docById(d.id);if(nd&&!nd.images[oth]){S.scan.doc=d.id;S.scan.side=oth}go(0);toast(nd&&!nd.images[oth]?`บันทึก${SIDE[side]}แล้ว · กดสแกนเพื่อเพิ่ม${SIDE[oth]}ของเอกสารนี้`:`บันทึก${SIDE[side]}แล้ว`)}
  catch(e){if(created){await sb.from('documents').delete().eq('id',created)}sc.busy=false;R2();toast('บันทึกไม่สำเร็จ: '+thErr(e.message))}}

/* ===================== profile / avatar / account ===================== */
function readPF(){const f=$('#pf');if(!f)return null;const g=n=>f.elements[n]?.value??'',c=$('#pc');
  return{display_name:g('display_name').trim(),display_name_en:g('display_name_en').trim(),id_number:g('id_number'),address:g('address').trim(),card_issued_on:g('card_issued_on'),member_no:g('member_no'),dob:g('dob'),card_expires_on:g('card_expires_on'),phone:c?c.elements.phone.value:(S.draft?.phone||''),contact_email:c?c.elements.contact_email.value:(S.draft?.contact_email||'')}}
/* ===================== "ข้อมูลบัตร" (opened by the person button on Home): reads the same saved profile as Settings ===================== */
function closeProf(){S.pi=false;const e=$('#pi');if(e){e.classList.remove('on');e.innerHTML=''}}
function profOpen(){
  const open=()=>{closeSheet();S.pi=true;profDraw();$('#pi').classList.add('on');$('#pi').scrollTop=0};
  if(S.hidePv&&!S.rv){const ok=()=>{S.rv=true;if(S.tab===0)R0();open()};if(hasLock())lockShow('verify',{cancel:true,done:ok});else ok()}else open()}
function profDraw(){
  const p=S.profile,v=x=>x?esc(x):'-',dt=x=>x?fmtDate(x,S.era):'-';
  $('#pi').innerHTML=`<div class="pf-hd"><button class="pf-x" data-act="prof-close" aria-label="กลับ"><span class="flipx">${ic('chev',22)}</span></button><div class="pf-ttl">ข้อมูลบัตร</div></div>
   <div class="pf-body"><div class="pf-sec-t">รูปหน้าบัตร</div><div class="pf-sec-s">รูปหน้าบัตรประจำตัวประชาชน</div>
    <div class="pf-photo pfc"><img class="pf-phimg" src="${S.avatar||PH_PHOTO}" alt="รูปโปรไฟล์"></div>
    <div class="pf-idlbl">เลขประจำตัวประชาชน</div><div class="pf-idnum">${p.id_number?esc(fmtId(p.id_number)):'-'}</div><div class="pf-orn" aria-hidden="true"><i></i><b></b><i></i></div>
    <div class="pf-card"><div class="pf-name">${v(p.display_name)}</div><div class="pf-sub">${v(p.display_name_en)}</div>
     <div class="pf-f"><b>ที่อยู่</b><span>${v(p.address)}</span></div>
     <div class="pf-f"><b>เกิดวันที่</b><span>${dt(p.dob)}</span></div>
     <div class="pf-2"><div class="pf-f"><b>วันที่ออกบัตร</b><span>${dt(p.card_issued_on)}</span></div><div class="pf-f r"><b>วันที่หมดอายุ</b><span>${dt(p.card_expires_on)}</span></div></div></div></div>`}
/* digits-only inputs keep a readable format while typing (caret stays after the same digit) */
function fmtLive(el,fn){const pos=el.selectionStart??el.value.length,n0=digits(el.value.slice(0,pos)).length;el.value=fn(el.value);let n=0,i=0;for(;i<el.value.length&&n<n0;i++)if(/\d/.test(el.value[i]))n++;try{el.setSelectionRange(i,i)}catch(e){}}
const isoToday=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
async function saveProfile(){
  const v=readPF(),pe=$('#pe'),fail=m=>{pe.textContent=m;return false};pe.textContent='';
  if(!v.display_name)return fail('กรอกชื่อ-สกุล');
  if(/[^0-9\s-]/.test(v.id_number))return fail('เลขประจำตัวประชาชนใช้ได้เฉพาะตัวเลข');
  const idn=digits(v.id_number);if(idn&&idn.length!==13)return fail('เลขประจำตัวประชาชนต้องมี 13 หลัก (กรอกแล้ว '+idn.length+' หลัก)');if(idn&&!idNumberOk(idn))return fail('เลขประจำตัวประชาชนไม่ถูกต้อง (เลขหลักสุดท้ายไม่ตรงกับสูตรตรวจสอบ) ตรวจสอบตัวเลขอีกครั้ง');
  if(/[^0-9\s-]/.test(v.member_no))return fail('เลขสมาชิกใช้ได้เฉพาะตัวเลข');
  const mem=digits(v.member_no);if(mem&&mem.length!==12)return fail('เลขสมาชิกต้องมี 12 หลัก (กรอกแล้ว '+mem.length+' หลัก)');
  const isoOk=x=>!x||(/^\d{4}-\d{2}-\d{2}$/.test(x)&&+x.slice(0,4)>=1900);
  if(!isoOk(v.dob))return fail('วันเกิดไม่ถูกต้อง');if(!isoOk(v.card_issued_on))return fail('วันที่ออกบัตรไม่ถูกต้อง');if(!isoOk(v.card_expires_on))return fail('วันหมดอายุไม่ถูกต้อง');
  if(v.dob&&v.dob>isoToday())return fail('วันเกิดต้องไม่เป็นวันที่ในอนาคต');
  if(v.card_issued_on&&v.card_expires_on&&v.card_expires_on<v.card_issued_on)return fail('วันหมดอายุต้องไม่ก่อนวันที่ออกบัตร');
  const row={id:S.user.id,display_name:v.display_name,display_name_en:v.display_name_en||null,id_number:idn||null,address:v.address||null,card_issued_on:v.card_issued_on||null,member_no:mem||null,dob:v.dob||null,card_expires_on:v.card_expires_on||null};
  const {error}=await sb.from('profiles').upsert(row,{onConflict:'id'});
  if(error)return fail(/id_number|member_no|card_issued_on|card_expires_on|schema cache|column/i.test(error.message)?'บันทึกไม่ได้: ฐานข้อมูลยังไม่มีคอลัมน์ข้อมูลบัตร ให้รัน SQL อัปเกรดใน README ก่อน':'บันทึกไม่สำเร็จ: '+error.message);
  S.profile={...S.profile,...row};S.draft=null;renderHdr();await log('profile_updated','ข้อมูลบัตร');toast('บันทึกข้อมูลบัตรแล้ว');R4()}
async function saveContact(f){
  const e=$('#pce'),ph=f.elements.phone.value.trim(),em=f.elements.contact_email.value.trim(),fail=m=>{e.textContent=m};e.textContent='';
  if(!/^[0-9+\-\s()]{0,24}$/.test(ph))return fail('เบอร์โทรศัพท์ใช้ได้เฉพาะตัวเลข เว้นวรรค + - ( )');
  if(em&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))return fail('รูปแบบอีเมลไม่ถูกต้อง');
  const row={id:S.user.id,phone:ph||null,contact_email:em||null},{error}=await sb.from('profiles').upsert(row,{onConflict:'id'});if(error)return fail('บันทึกไม่สำเร็จ: '+error.message);
  S.profile={...S.profile,...row};if(S.draft){S.draft.phone=ph;S.draft.contact_email=em}await log('profile_updated','ข้อมูลติดต่อ');toast('บันทึกข้อมูลติดต่อแล้ว')}
async function cardReset(){
  const dm=S.demo||isMock,row=dm?{...DEMO_CARD}:{display_name:null,display_name_en:null,id_number:null,address:null,card_issued_on:null,member_no:null,dob:null,card_expires_on:null};
  const {error}=await sb.from('profiles').upsert({id:S.user.id,...row},{onConflict:'id'});if(error)return toast('รีเซ็ตไม่สำเร็จ: '+error.message);
  S.profile={...S.profile,...row};S.draft=null;closeSheet();renderHdr();await log('profile_updated','รีเซ็ตข้อมูลบัตร');toast(dm?'รีเซ็ตเป็นข้อมูลสมมติเริ่มต้นแล้ว':'ล้างข้อมูลบัตรแล้ว');R4()}
async function setAvatar(file){try{file=await prepImage(file);await checkFile(file);const b=await squareAvatar(file),path=`${S.user.id}/avatar`;
  const u=await sb.storage.from(B).upload(path,b,{contentType:'image/jpeg',upsert:true,cacheControl:'0'});if(u.error)throw u.error;
  const p=await sb.from('profiles').upsert({id:S.user.id,avatar_path:path},{onConflict:'id'});if(p.error)throw p.error;
  S.profile.avatar_path=path;await loadAvatar();renderHdr();await log('profile_updated','เปลี่ยนรูปโปรไฟล์');toast('เปลี่ยนรูปโปรไฟล์แล้ว');S.draft=readPF();R4()}catch(e){toast(e.message)}}
async function delAvatar(){const p=S.profile.avatar_path;if(!p)return;await sb.storage.from(B).remove([p]);await sb.from('profiles').upsert({id:S.user.id,avatar_path:null},{onConflict:'id'});S.profile.avatar_path=null;await loadAvatar();renderHdr();toast('ลบรูปโปรไฟล์แล้ว');S.draft=readPF();R4()}
async function exportZip(){if(S.zipBusy)return;const list=[];S.docs.forEach(d=>Object.entries(d.images).forEach(([side,im])=>list.push({d,side,im})));
  if(!list.length)return toast('ยังไม่มีภาพเอกสารให้ดาวน์โหลด');const tot=list.reduce((a,x)=>a+(x.im.size||0),0);if(tot>1.5e9)return toast('ไฟล์รวมใหญ่เกิน 1.5 GB ดาวน์โหลดทีละเอกสารจากแท็บเอกสารแทน');
  S.zipBusy=true;try{const files=[],used=new Set();let k=0;
    for(const x of list){toast(`กำลังเตรียมไฟล์ ${++k}/${list.length}…`);let n=`${safeName(x.d.title)}-${x.side}.${ext(x.im.mime)}`,i=2;while(used.has(n))n=`${safeName(x.d.title)}-${i++}-${x.side}.${ext(x.im.mime)}`;used.add(n);files.push({name:'documents/'+n,blob:await fetchBlob(x.im.path)})}
    files.push({name:'docpocket-my-data.json',blob:new Blob([JSON.stringify(myData(),null,2)],{type:'application/json'})});
    saveBlob(await zipStore(files),'docpocket-originals.zip');await log('copy_saved','ดาวน์โหลดภาพต้นฉบับทั้งหมด (ZIP)');toast('ดาวน์โหลดไฟล์ ZIP แล้ว')}catch(e){toast('สร้างไฟล์ ZIP ไม่สำเร็จ: '+e.message)}finally{S.zipBusy=false}}
const myData=()=>({exported_at:new Date().toISOString(),account:{email:S.user.email},profile:S.profile,
  documents:S.docs.map(d=>({id:d.id,title:d.title,category:d.category||null,holder_name:d.holder_name||null,reference_number:d.doc_number||null,issued_on:d.issued_on||null,expires_on:d.expires_on||null,note:d.note||null,created_at:d.created_at,images:Object.fromEntries(Object.entries(d.images).map(([k,v])=>[k,{size:v.size,mime:v.mime,updated_at:v.updated_at,rotation:v.rotation||0,crop:v.crop||null}]))})),activity:S.hist});
function exportData(){saveBlob(new Blob([JSON.stringify(myData(),null,2)],{type:'application/json'}),'docpocket-my-data.json')}
function wipe(){lruClear(TH);lruClear(FU);dropURL(S.avatar);location.reload()}
async function delAcct(){
  if($('#dc').value.trim()!=='ลบบัญชี')return toast('พิมพ์คำว่า “ลบบัญชี” ให้ถูกต้อง');
  try{const ps=[];S.docs.forEach(d=>Object.values(d.images).forEach(im=>ps.push(im.path,im.path+'.thumb')));if(S.profile.avatar_path)ps.push(S.profile.avatar_path);(S.profile.home?.banners||[]).forEach(b=>b?.img&&ps.push(b.img));(S.profile.home?.anns||[]).forEach(a=>a?.pic&&ps.push(a.pic));if(S.profile.home?.annPic?.path)ps.push(S.profile.home.annPic.path);
    for(let i=0;i<ps.length;i+=100){const {error}=await sb.storage.from(B).remove(ps.slice(i,i+100));if(error)throw error}
    const {error}=await sb.rpc('delete_my_account');if(error)throw error;try{localStorage.removeItem(HK())}catch(e){}localStorage.removeItem(LK());localStorage.removeItem(LF());await sb.auth.signOut({scope:'local'});wipe()}catch(e){toast('ลบบัญชีไม่สำเร็จ: '+e.message)}}
async function mfaOn(){const {data,error}=await sb.auth.mfa.enroll({factorType:'totp'});if(error)return toast(error.message);
  sheet(`<h3>เปิดการยืนยันสองขั้นตอน</h3><p>สแกน QR ด้วยแอป Authenticator แล้วกรอกรหัส 6 หลัก</p><img class="qr" src="${data.totp.qr_code}" alt="QR code"><p class="nt">หรือกรอกรหัสลับ: ${esc(data.totp.secret)}</p><label for="mc">รหัส 6 หลัก</label><input type="text" id="mc" inputmode="numeric" maxlength="6" autocomplete="one-time-code"><button class="bt" id="mv">ยืนยัน</button>`);
  $('#mv').onclick=async()=>{const c=await sb.auth.mfa.challenge({factorId:data.id});if(c.error)return toast(c.error.message);const v=await sb.auth.mfa.verify({factorId:data.id,challengeId:c.data.id,code:$('#mc').value.trim()});if(v.error)return toast(v.error.message);S.mfa=true;closeSheet();toast('เปิดการยืนยันสองขั้นตอนแล้ว');R4()}}
async function mfaOff(){const {data}=await sb.auth.mfa.listFactors(),t=data?.totp?.find(f=>f.status==='verified');if(!t)return;const {error}=await sb.auth.mfa.unenroll({factorId:t.id});if(error)return toast(error.message);S.mfa=false;toast('ปิดการยืนยันสองขั้นตอนแล้ว');R4()}

/* ===================== crop / zoom / rotate editor (non-destructive) ===================== */
const ASP=[['card','บัตร 85.6×54',CARD],['full','ภาพเต็ม',null],['3:2','3:2',3/2],['4:3','4:3',4/3],['1:1','1:1',1],['3:4','3:4',3/4],['2:3','2:3',2/3],['bn','แบนเนอร์ 4.3:1',1064/248]];
let ED=null;const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const edAsp=()=>ED.ak==='cur'?ED.cur:(ASP.find(a=>a[0]===ED.ak)[2]||ED.pc.width/ED.pc.height);
function edBase(){const A=edAsp(),W=ED.pc.width,H=ED.pc.height;return A>=W/H?{w:1,h:(W/A)/H}:{w:(H*A)/W,h:1}}
function edRect(){const b=edBase(),w=b.w/ED.z,h=b.h/ED.z;ED.cx=clamp(ED.cx,w/2,1-w/2);ED.cy=clamp(ED.cy,h/2,1-h/2);return{x:ED.cx-w/2,y:ED.cy-h/2,w,h}}
function edCrop(){const r=edRect();if(r.w>=.9995&&r.h>=.9995)return null;const f=n=>+n.toFixed(4);return{x:f(r.x),y:f(r.y),w:f(r.w),h:f(r.h)}}
async function openEd(o){
  let bmp;try{bmp=await bitmap(o.blob)}catch(e){return toast('เปิดภาพไม่สำเร็จ')}
  const rot=o.rot||0,pc=previewCanvas(bmp,rot,1600);
  ED={bmp,pc,rot,ak:o.frame||(!o.crop&&pc.width/pc.height>=1.2&&pc.width/pc.height<=2.1?'card':'full'),only:o.frame||null,z:1,cx:.5,cy:.5,cur:1,title:o.title,done:o.done,ptr:new Map(),d0:0,z0:1};
  if(o.crop){const A=(o.crop.w*pc.width)/(o.crop.h*pc.height),m=ASP.find(a=>a[2]&&Math.abs(a[2]/A-1)<.01);
    if(m)ED.ak=m[0];else{ED.ak='cur';ED.cur=A}
    ED.z=clamp(edBase().w/o.crop.w,1,8);ED.cx=o.crop.x+o.crop.w/2;ED.cy=o.crop.y+o.crop.h/2}
  else if(ED.ak==='card'&&!o.frame){const r=detectCard(pc);if(r)edFit(r)} // card photo: start with the card already framed
  edRender();$('#ed').classList.add('on')}
/* put the card-shaped frame around box r (normalised, in the editor's rotated picture) */
function edFit(r){const W=ED.pc.width,H=ED.pc.height,c=cardCrop(r,W,H,edAsp()),b=edBase();ED.z=clamp(b.w/c.w,1,8);ED.cx=c.x+c.w/2;ED.cy=c.y+c.h/2}
function edRender(){
  $('#ed').innerHTML=`<div class="crp-bar"><button data-act="ed-cancel">ยกเลิก</button><span>ปรับภาพ · ${esc(ED.title)}</span><button class="crp-done" data-act="ed-ok">เสร็จ</button></div>
   <div class="edst"><canvas id="edc" role="img" aria-label="กรอบครอป ลากเพื่อเลื่อน ใช้สองนิ้วหรือแถบเลื่อนเพื่อซูม"></canvas></div>
   <div class="crp-ctrl"><div class="chips" role="group" aria-label="สัดส่วนกรอบ">${[...(ED.only?ASP.filter(a=>a[0]===ED.only):ASP.filter(a=>a[0]!=='bn')),...(ED.ak==='cur'?[['cur','ปัจจุบัน']]:[])].map(a=>`<button data-act="ed-asp" data-k="${a[0]}" class="${ED.ak===a[0]?'on':''}">${a[1]}</button>`).join('')}</div>
    <div class="crp-row"><span class="crp-ic">${ic('minus',16)}</span><input type="range" id="edz" min="1" max="6" step="0.01" value="${ED.z}" data-inp="ed-zoom" aria-label="ซูม"><span class="crp-ic">${ic('plus',16)}</span><span class="crp-zp" id="edzl">${Math.round(ED.z*100)}%</span></div>
    <div class="crp-row crp-rot"><button data-act="ed-rot" data-v="-90" aria-label="หมุนซ้าย 90 องศา">${ic('rl',18)}</button><button data-act="ed-rot" data-v="90" aria-label="หมุนขวา 90 องศา">${ic('rr',18)}</button><button class="rst" data-act="ed-auto">ตรวจขอบบัตร</button><button class="rst" data-act="ed-reset">รีเซ็ต</button></div>
    <div class="crp-hint">ลากเพื่อเลื่อน · บีบนิ้วหรือเลื่อนแถบเพื่อซูม · ต้นฉบับไม่ถูกแก้ไข</div></div>`;
  paintEd()}
function paintEd(){const cv=$('#edc'),st=$('.edst');if(!ED||!cv||!st)return;
  const A=edAsp(),mw=Math.max(40,st.clientWidth-28),mh=Math.max(40,st.clientHeight-28),w=Math.min(mw,mh*A),h=w/A,dpr=Math.min(2,window.devicePixelRatio||1),pw=Math.round(w*dpr),ph=Math.round(h*dpr);
  if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph}cv.style.width=w+'px';cv.style.height=h+'px';ED.cw=w;ED.ch=h;
  const r=edRect(),W=ED.pc.width,H=ED.pc.height,x=cv.getContext('2d');x.drawImage(ED.pc,r.x*W,r.y*H,r.w*W,r.h*H,0,0,pw,ph);
  const z=$('#edz');if(z&&+z.value!==ED.z)z.value=ED.z;const l=$('#edzl');if(l)l.textContent=Math.round(ED.z*100)+'%'}
function edZoom(z){ED.z=clamp(z,1,6);paintEd()}
function closeEd(){ED=null;const e=$('#ed');if(e){e.classList.remove('on');e.innerHTML=''}}
function edPtr(e){
  if(!ED||e.target.id!=='edc')return;const m=ED.ptr;
  if(e.type==='pointerdown'){e.target.setPointerCapture?.(e.pointerId);m.set(e.pointerId,{x:e.clientX,y:e.clientY});if(m.size===2){const [a,b]=[...m.values()];ED.d0=Math.hypot(a.x-b.x,a.y-b.y);ED.z0=ED.z}}
  else if(e.type==='pointermove'&&m.has(e.pointerId)){const p=m.get(e.pointerId),dx=e.clientX-p.x,dy=e.clientY-p.y;m.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(m.size===1){const r=edRect();ED.cx-=dx/ED.cw*r.w;ED.cy-=dy/ED.ch*r.h;paintEd()}
    else if(m.size===2&&ED.d0){const [a,b]=[...m.values()];edZoom(ED.z0*Math.hypot(a.x-b.x,a.y-b.y)/ED.d0)}}
  else if(e.type==='pointerup'||e.type==='pointercancel')m.delete(e.pointerId)}
function adjustSaved(id,side){const d=docById(id),im=d?.images[side];if(!im)return;toast('กำลังเปิดตัวแก้ไขภาพ…');
  fetchBlob(im.path).then(blob=>openEd({blob,rot:im.rotation,crop:im.crop,title:`${d.title} (${SIDE[side]})`,done:async(rot,crop)=>{
    const now=new Date().toISOString(),{error}=await sb.from('document_images').update({rotation:rot,crop,updated_at:now}).eq('id',im.id);
    if(error)return toast('บันทึกการปรับภาพไม่สำเร็จ: '+error.message);Object.assign(im,{rotation:rot,crop,updated_at:now});
    await log('replaced',`${d.title} · ${SIDE[side]} · ปรับภาพ`);if(S.view)drawView();else if(S.tab===4||S.tab===1)rerender();toast('บันทึกการปรับภาพแล้ว (ต้นฉบับไม่ถูกแก้ไข)')}})).catch(e=>toast(e.message||'โหลดภาพไม่สำเร็จ'))}
function adjustScan(){const sc=S.scan;if(!sc.file)return;
  openEd({blob:sc.file,rot:sc.rot,crop:sc.crop,title:SIDE[sc.side],done:async(rot,crop)=>{
    sc.rot=rot;sc.crop=crop;if(sc.pu){dropURL(sc.pu);sc.pu=null}
    if(rot||crop){try{sc.pu=objURL(await processed(sc.file,rot,crop))}catch(e){toast(e.message)}}R2()}})}

/* ===================== passcode lock (local device lock only; not file encryption) ===================== */
const LK=()=>`dp_lock_${S.user?.id}`,LF=()=>`dp_lockf_${S.user?.id}`;
const hasLock=()=>!!(S.user&&ls(LK(),null));
const b64=u=>btoa(String.fromCharCode(...u)),unb64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
async function pbk(code,salt,it){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(code),'PBKDF2',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:it},k,256))}
async function setCode(code){const salt=crypto.getRandomValues(new Uint8Array(16)),it=150000;sv(LK(),{s:b64(salt),h:b64(await pbk(code,salt,it)),it,n:code.length});localStorage.removeItem(LF())}
async function chkCode(code){const d=ls(LK(),null);if(!d)return true;const h=await pbk(code,unb64(d.s),d.it),e=unb64(d.h);let x=h.length^e.length;for(let i=0;i<e.length;i++)x|=h[i]^e[i];return x===0}
const weak=c=>/^(\d)\1+$/.test(c)||'01234567890123456789'.includes(c)||'98765432109876543210'.includes(c);
const CODE_LEN=8,DEMO_CODE='00000000'; // new codes have 8 digits; a code saved before this update keeps its own length (6)
const waitLeft=()=>Math.max(0,Math.ceil(((ls(LF(),{}).until||0)-Date.now())/1000));
function failed(){const f=ls(LF(),{n:0,until:0});f.n=(f.n||0)+1;if(f.n%5===0)f.until=Date.now()+Math.min(900,30*2**(f.n/5-1))*1000;sv(LF(),f);return f}
let L=null,lt;
function lockShow(mode,o={}){L={mode,n:mode==='set'?CODE_LEN:((ls(LK(),null)||{}).n||6),buf:'',first:'',msg:'',cancel:!!o.cancel,done:o.done||(()=>{}),busy:false,forgot:false};$('#lock').classList.add('on');lockDraw()}
function lockHide(){clearInterval(lt);L=null;const e=$('#lock');e.classList.remove('on','dim','still');delete e.dataset.sig;e.innerHTML=''}
function lockDraw(){
  const T={unlock:'ระบุรหัสผ่าน',verify:'ระบุรหัสผ่าน',set:L.first?'ยืนยันรหัสอีกครั้ง':`ตั้งรหัสล็อก ${L.n} หลัก`}[L.mode];
  const w=waitLeft(),sub=L.msg||(L.mode==='set'&&!L.first?'หลีกเลี่ยงเลขซ้ำหรือเรียงกัน เช่น 00000000 หรือ 12345678':w?`ใส่รหัสผิดหลายครั้ง ลองใหม่ได้ในอีก ${w} วินาที`:''),bad=!!L.msg&&/ไม่ถูก|ไม่ตรง|เดาง่าย|ผิด/.test(L.msg);
  if(L.forgot){$('#lock').classList.add('still');delete $('#lock').dataset.sig;$('#lock').innerHTML=`<div class="lkt">${LOGO(64)}</div><div class="pwb"><h2>ลืมรหัสล็อก?</h2><p class="ps">การออกจากระบบจะล้างรหัสล็อกบนเครื่องนี้ เอกสารของคุณยังอยู่ในบัญชี และต้องเข้าสู่ระบบด้วยรหัสผ่านบัญชีอีกครั้ง</p><button class="pc" data-act="lk-forgot-yes">ออกจากระบบและล้างรหัสล็อก</button><button class="pc" data-act="lk-forgot-no">กลับ</button></div>`;return}
  const dim=L.mode!=='unlock',lk=$('#lock'),sig=[L.mode,L.n,L.cancel,T,sub,bad].join('|');
  // typing a digit only changes the dots: update them in place so the sheet never re-renders (re-rendering replayed the slide-up animation = the blinking)
  if(lk.dataset.sig===sig&&lk.querySelector('.pwb .pwd')){const d=lk.querySelectorAll('.pwd span');d.forEach((x,i)=>x.classList.toggle('f',i<L.buf.length));lk.querySelector('.pwd').setAttribute('aria-label',`กรอกแล้ว ${L.buf.length} จาก ${L.n} หลัก`);clearInterval(lt);if(w)lt=setInterval(()=>{if(L&&!waitLeft()){clearInterval(lt);lockDraw()}else if(L)lockDraw()},1000);return}
  lk.classList.toggle('still',!!lk.querySelector('.pwb'));lk.dataset.sig=sig;lk.classList.toggle('dim',dim);
  $('#lock').innerHTML=`${dim?'':`<div class="lkt">${LOGO(64)}</div>`}<div class="pwb"><h2>${T}</h2>${sub?`<p class="ps${bad?' bad':''}" role="status">${esc(sub)}</p>`:'<span class="sr" role="status"></span>'}<div class="pwd" aria-label="กรอกแล้ว ${L.buf.length} จาก ${L.n} หลัก">${Array.from({length:L.n},(_,i)=>i).map(i=>`<span class="${i<L.buf.length?'f':''}"></span>`).join('')}</div>
   <div class="pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-act="lk" data-k="${n}" aria-label="${n}">${n}</button>`).join('')}<button class="e" tabindex="-1" aria-hidden="true"></button><button data-act="lk" data-k="0" aria-label="0">0</button><button class="sm" data-act="lk" data-k="del" aria-label="ลบหนึ่งหลัก">⌫</button></div>
   ${L.cancel?'<button class="pc" data-act="lk-cancel">ยกเลิก</button>':''}${L.mode==='unlock'?'<button class="pc" data-act="lk-forgot">ลืมรหัสผ่าน</button>':''}</div>`;
  clearInterval(lt);if(w)lt=setInterval(()=>{if(L&&!waitLeft()){clearInterval(lt);lockDraw()}else if(L)lockDraw()},1000)}
async function lockKey(k){
  if(!L||L.busy||L.forgot)return;if(waitLeft())return lockDraw();
  if(k==='del')L.buf=L.buf.slice(0,-1);else if(L.buf.length<L.n)L.buf+=k;L.msg='';
  if(L.buf.length<L.n)return lockDraw();
  L.busy=true;lockDraw();const c=L.buf;L.buf='';
  try{
    if(L.mode==='set'){
      if(!L.first){if(!S.demo&&weak(c)){L.msg='รหัสนี้เดาง่ายเกินไป เลือกรหัสอื่น'}else L.first=c}
      else if(c!==L.first){L.first='';L.msg='รหัสสองครั้งไม่ตรงกัน เริ่มใหม่อีกครั้ง'}
      else{await setCode(c);const d=L.done;lockHide();toast('ตั้งรหัสล็อกแอปแล้ว');return d()}}
    else if(await chkCode(c)){localStorage.removeItem(LF());const d=L.done;lockHide();return d()}
    else{const f=failed();L.msg=waitLeft()?`รหัสไม่ถูกต้อง ลองใหม่ได้ในอีก ${waitLeft()} วินาที`:`รหัสไม่ถูกต้อง (ผิดแล้ว ${f.n%5||5} จาก 5 ครั้ง)`}
  }catch(e){L.msg='ใช้ฟังก์ชันรหัสล็อกไม่ได้ในเบราว์เซอร์นี้'}
  if(L){L.busy=false;lockDraw()}}
function lockNow(){if(!hasLock()||L)return;stopCam();closeViewNow();closeEd();closeSheet();S.rv=false;lockShow('unlock',{done:()=>{if(S.tab===0)R0()}});if(S.tab===0)R0()}
function keepDraft(){const v=readPF();if(v)S.draft=v}

/* ===================== document details (your own notes about a document; never shown on the image) ===================== */
const dsel=(n,val,y0,y1)=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(val||''),ys=[];for(let y=y1;y>=y0;y--)ys.push(y);
  return `<div class="d3"><select name="${n}d" aria-label="วัน"><option value="">วัน</option>${Array.from({length:31},(_,i)=>`<option value="${i+1}" ${m&&+m[3]===i+1?'selected':''}>${i+1}</option>`).join('')}</select>
   <select name="${n}m" aria-label="เดือน"><option value="">เดือน</option>${TMF.map((t,i)=>`<option value="${i+1}" ${m&&+m[2]===i+1?'selected':''}>${t}</option>`).join('')}</select>
   <select name="${n}y" aria-label="ปี"><option value="">${S.era==='BE'?'พ.ศ.':'ค.ศ.'}</option>${ys.map(y=>`<option value="${y}" ${m&&+m[1]===y?'selected':''}>${yr(y,S.era)}</option>`).join('')}</select></div>`};
/* announcements: full page (list + detail) */
function apShow(h){closeSheet();const e=$('#anp');e.innerHTML=h;hydrate(e);e.scrollTop=0;e.classList.add('on');S.ap=true}
function closeAp(){S.ap=false;const e=$('#anp');if(e){e.classList.remove('on');setTimeout(()=>{if(!S.ap)e.innerHTML=''},450)}}
const apHd=(t,back)=>`<div class="pf-hd"><button class="pf-x" data-act="${back}" aria-label="กลับ"><span class="flipx">${ic('chev',22)}</span></button><div class="pf-ttl">${t}</div></div>`;
function annList(){S.seen=ANNS().map(a=>a.id);sv('dp_seen',S.seen);renderHdr();apShow(`${apHd('ประกาศทั้งหมด','ap-close')}<div class="pf-body ap-body"><div class="nl">${ANNS().map(a=>annCard(a)).join('')}</div><p class="ffnote">ประกาศที่มีป้าย DEMO เป็นข้อมูลตัวอย่างของ DocPocket ไม่ได้มาจากหน่วยงานใด</p></div>`)}
function annOpen(id){const a=ANNS().find(x=>x.id===id);if(!a)return;if(!S.seen.includes(id)){S.seen=[...S.seen,id];sv('dp_seen',S.seen);renderHdr()}
  apShow(`${apHd('ประกาศ',S.ap&&$('#anp .nl')?'ap-list':'ap-close')}<div class="pf-body ap-body"><div class="ap-top">${annIc(a,'ap-ic')}<div><h2 class="ap-t">${esc(a.t)}</h2><div class="ap-m">${annDate(a)}${a.demo?' · <i class="demo">DEMO</i>':''}</div></div></div>
   <p class="ap-x">${esc(a.s)}</p><p class="ffnote">${a.demo?'ที่มา: DocPocket (ข้อมูลตัวอย่าง)':'ประกาศที่คุณเขียนเองในแอปนี้'}</p><button class="btn g pf-edit" data-act="ap-list">ดูประกาศทั้งหมด</button></div>`)}
function detOpen(id){const d=docById(id||S.selId);if(!d)return toast('ยังไม่มีเอกสาร ลองสแกนเอกสารแรกของคุณ');closeSheet();S.det=d.id;S.detEdit=false;detDraw();$('#dp').classList.add('on')}
function closeDet(){S.det=null;const e=$('#dp');if(e){e.classList.remove('on');e.innerHTML=''}}
function detDraw(){const d=docById(S.det);if(!d)return closeDet();const cy=new Date().getFullYear(),s=d.images.front?'front':d.images.back?'back':null;
  const ed=S.detEdit,fd=v=>v?fmtDate(v,S.era):'—';
  $('#dp').innerHTML=`<div class="pf-hd"><button class="pf-x" data-act="${ed?'det-view':'det-close'}" aria-label="กลับ"><span class="flipx">${ic('chev',22)}</span></button><div class="pf-ttl">${ed?'แก้ไขข้อมูลเอกสาร':'ข้อมูลเอกสาร'}</div></div>
   <div class="pf-body">${ed?'':`<div class="pf-sec-t">รูปเอกสาร</div><div class="pf-sec-s">ภาพ${s?SIDE[s]:''}ของเอกสาร</div>
    <div class="pf-photo">${s?`<img alt="" data-img="${d.id}:${s}:t">`:`<svg class="pf-ph" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="40" r="22" fill="#b0b8cc"/><path d="M18 120c3-30 20-44 42-44s39 14 42 44z" fill="#b0b8cc"/></svg>`}</div>
    <div class="pf-idlbl">เลขที่อ้างอิง</div><div class="pf-idnum">${esc(d.doc_number)||'—'}</div><div class="pf-orn" aria-hidden="true"><i></i><b></b><i></i></div>
    <div class="pf-card"><div class="pf-name">${esc(d.holder_name||d.title)}</div><div class="pf-sub">${d.holder_name?esc(d.title):'ยังไม่ได้ระบุชื่อผู้ถือเอกสาร'}</div><div class="pf-tag">ข้อมูลที่คุณบันทึกเอง</div>
     <div class="pf-f"><b>หมวดหมู่</b><span>${esc(d.category||'—')}</span></div>
     <div class="pf-f"><b>หมายเหตุ</b><span>${esc(d.note||'—')}</span></div>
     <div class="pf-2"><div class="pf-f"><b>วันที่ออกเอกสาร</b><span>${fd(d.issued_on)}</span></div><div class="pf-f r"><b>วันที่หมดอายุ</b><span>${fd(d.expires_on)}</span></div></div></div>
    <button class="btn p pf-edit" data-act="det-edit">${ic('edit',16)} แก้ไขข้อมูล</button>
    <p class="ffnote">บันทึกของคุณเองเพื่อจัดระเบียบ · DocPocket ไม่ตรวจสอบ ยืนยัน หรือรับรองข้อมูลเหล่านี้ และไม่พิมพ์ลงบนภาพเอกสาร</p></div>`}${ed?`
    <form class="pf-info" data-form="docmeta" id="dm" novalidate>
     <label for="m1">ชื่อเอกสาร</label><input id="m1" name="title" type="text" maxlength="60" value="${esc(d.title)}">
     <label for="m5">หมวดหมู่</label><select id="m5" name="category"><option value="">ไม่ระบุ</option>${CATS.map(c=>`<option ${d.category===c?'selected':''}>${c}</option>`).join('')}</select>
     <label for="m2">ชื่อผู้ถือเอกสาร</label><input id="m2" name="holder_name" type="text" maxlength="80" value="${esc(d.holder_name||'')}" autocomplete="off">
     <label for="m3">เลขที่อ้างอิง (ถ้ามี)</label><input id="m3" name="doc_number" type="text" maxlength="40" value="${esc(d.doc_number||'')}" autocomplete="off">
     <div class="lb">วันที่ออกเอกสาร (ไม่บังคับ)</div>${dsel('is',d.issued_on,cy-70,cy)}
     <div class="lb">วันหมดอายุ (ไม่บังคับ)</div>${dsel('ex',d.expires_on,cy-5,cy+40)}
     <label for="m4">หมายเหตุ</label><textarea id="m4" name="note" rows="2" maxlength="300">${esc(d.note||'')}</textarea>
     <div class="err" id="dme" role="alert"></div>
     <div class="ffbtns"><button class="btn p" type="submit">บันทึก</button><button class="btn g" type="button" data-act="det-view">ยกเลิก</button></div>
     <p class="ffnote">DocPocket ไม่ตรวจสอบ ยืนยัน หรือรับรองข้อมูลเหล่านี้ เป็นเพียงบันทึกเพื่อจัดระเบียบเอกสารของคุณ</p></form></div>`:''}`;
  hydrate($('#dp'))}
async function saveMeta(f){
  const d=docById(S.det),e=$('#dme'),g=n=>f.elements[n].value.trim(),fail=m=>{e.textContent=m};if(!d)return;
  const dt=p=>{const D=f.elements[p+'d'].value,M=f.elements[p+'m'].value,Y=f.elements[p+'y'].value;if(!D&&!M&&!Y)return null;if(!(D&&M&&Y))throw new Error('กรอกวันที่ให้ครบทั้งวัน เดือน ปี หรือเว้นว่างทั้งหมด');
    const t=new Date(+Y,+M-1,+D);if(t.getFullYear()!==+Y||t.getMonth()!==+M-1||t.getDate()!==+D)throw new Error('วันที่ไม่ถูกต้อง');return `${Y}-${pad(M)}-${pad(D)}`};
  let issued,exp;try{issued=dt('is');exp=dt('ex')}catch(x){return fail(x.message)}
  if(issued&&exp&&exp<issued)return fail('วันหมดอายุต้องไม่ก่อนวันที่ออกเอกสาร');
  const title=g('title');if(!title)return fail('ชื่อเอกสารต้องไม่ว่าง');
  const row={title:title.slice(0,60),category:CATS.includes(f.elements.category.value)?f.elements.category.value:null,holder_name:g('holder_name')||null,doc_number:g('doc_number')||null,issued_on:issued,expires_on:exp,note:g('note')||null,updated_at:new Date().toISOString()};
  const {error}=await sb.from('documents').update(row).eq('id',d.id);if(error)return fail('บันทึกไม่สำเร็จ: '+error.message);
  Object.assign(d,row);await log('profile_updated','ข้อมูลเอกสาร · '+d.title);S.detEdit=false;detDraw();toast('บันทึกข้อมูลเอกสารแล้ว');if(S.tab===0||S.tab===1)rerender()}

/* ===================== delete ===================== */
async function delImage(id,side){const d=docById(id),im=d?.images[side];if(!im)return;
  const a=await sb.storage.from(B).remove([im.path,im.path+'.thumb']);if(a.error)return toast(a.error.message);
  const r=await sb.from('document_images').delete().eq('id',im.id);if(r.error)return toast(r.error.message);
  await log('deleted',`${d.title} · ${SIDE[side]}`);await loadDocs();closeSheet();rerender();toast(`ลบภาพ${SIDE[side]}แล้ว`)}
async function delDoc(id){const d=docById(id);if(!d)return;const ps=[];Object.values(d.images).forEach(im=>ps.push(im.path,im.path+'.thumb'));
  if(ps.length){const a=await sb.storage.from(B).remove(ps);if(a.error)return toast(a.error.message)}
  const r=await sb.from('documents').delete().eq('id',id);if(r.error)return toast(r.error.message);
  await log('deleted',d.title);await loadDocs();closeSheet();rerender();toast('ลบเอกสารแล้ว')}

/* ===================== DEMO mode (for presenting the app; fictional data, held in memory only) =====================
   While DEMO is on, `sb` points at an in-memory fake (loaded on demand), so nothing is read from or written to a real account or storage. */
const DEMO_KEYS=()=>{const k=[];try{for(let i=0;i<localStorage.length;i++){const n=localStorage.key(i)||'';if(n==='dp_home_presenter@docpocket.demo'||(S.demoUid&&(n==='dp_lock_'+S.demoUid||n==='dp_lockf_'+S.demoUid)))k.push(n)}}catch(e){}return k};
const demoClean=()=>DEMO_KEYS().forEach(n=>{try{localStorage.removeItem(n)}catch(e){}});
async function enterDemo(o){ // o===true: started by the ?demo link at launch -> no loading screen and no toasts
  if(S.demoBusy)return;S.demoBusy=true;const again=S.demo,quiet=o===true;if(!quiet)toast('กำลังเตรียมโหมด DEMO…');
  try{const m=await import('./mock.js');
    stopCam();lockHide();closeSheet();closeViewNow();closeEd();closeDet();closeProf();closeAp();demoClean();
    demoSb=m.sb;if(!await m.seedDemo())throw new Error('เตรียมข้อมูลตัวอย่างไม่สำเร็จ');
    S.demoUid=(await demoSb.auth.getUser()).data?.user?.id;
    Object.assign(S,{demo:true,hidePv:true,user:null,profile:{},docs:[],hist:[],mfa:false,selId:null,flip:false,draft:null,q:'',cat:'',dst:'all',hf:'all',hn:HPAGE,tab:0,rv:false,lastSel:null,scan:newScan(),ci:0,view:null,det:null,detEdit:false});
    dropURL(S.avatar);S.avatar='';lruClear(TH);lruClear(FU);
    await afterAuth(true);await setCode(DEMO_CODE);S.rv=false;if(S.tab===0)R0();if(!quiet)toast(again?'รีเซ็ตข้อมูลตัวอย่างแล้ว':'เข้าสู่โหมด DEMO แล้ว · ข้อมูลทั้งหมดเป็นข้อมูลสมมติ')}
  catch(e){console.error('demo',e);if(!S.demo)demoSb=null;if(!S.user)authUI('in');toast('เปิดโหมด DEMO ไม่สำเร็จ: '+(e.message||e))}
  finally{S.demoBusy=false}}
function exitDemo(){demoClean();demoSb=null;S.demo=false;try{history.replaceState(null,'',location.pathname)}catch(e){}wipe()}
const DEMO_STEPS=[[0,'หน้าหลัก','แตะการ์ดเพื่อพลิก ปัดซ้าย–ขวาเพื่อเปลี่ยนเอกสาร แตะ “ขยายรูปบัตร”'],[1,'เอกสาร','ค้นหา กรองตามหมวดและสถานะ เรียงลำดับ ดูเอกสารใกล้หมดอายุ'],[2,'สแกน','เพิ่มภาพด้านหน้า/ด้านหลัง ครอป หมุน (ภาพอยู่ในหน่วยความจำเท่านั้น)'],[3,'ประวัติ','ดูกิจกรรมแยกตามวัน กรองประเภท แตะเพื่อเปิดเอกสาร'],[4,'ตั้งค่า','ลายน้ำ รหัสล็อกแอป ธีม และการแจ้งเตือน']];
function demoMenu(){sheet(`<h3>โหมด DEMO</h3><p>ใช้สำหรับนำเสนอแอป ข้อมูลทั้งหมดเป็นข้อมูลสมมติ อยู่ในหน่วยความจำของแท็บนี้เท่านั้น ไม่ถูกส่งไปยังบัญชีหรือที่จัดเก็บจริง และหายไปเมื่อออกหรือรีเฟรช</p>
  <div class="lb">ลำดับการนำเสนอที่แนะนำ</div>${DEMO_STEPS.map(s=>`<button class="rw" data-act="demo-step" data-i="${s[0]}"><span class="stn">${s[0]+1}</span><span>${s[1]}<small>${s[2]}</small></span>${ic('chev',18)}</button>`).join('')}
  <button class="bt2" data-act="demo-reset">${ic('refresh',16)} รีเซ็ตข้อมูลตัวอย่าง</button><button class="bt" data-act="demo-exit">ออกจากโหมด DEMO</button>`)}

/* ===================== actions (event delegation; no inline handlers) ===================== */
const A={
  goto:d=>go(+d.arg),flip(){if(Date.now()-(S.swiped||0)<400)return;S.flip=!S.flip;$('.card3d')?.classList.toggle('f',S.flip)},
  'doc-prev'(){const i=S.docs.findIndex(d=>d.id===S.selId);S.selId=S.docs[(i-1+S.docs.length)%S.docs.length].id;S.flip=false;R0()},
  'doc-next'(){const i=S.docs.findIndex(d=>d.id===S.selId);S.selId=S.docs[(i+1)%S.docs.length].id;S.flip=false;R0()},
  'open-view'(){S.rv=true;const d=curDoc();d?openView(d.id,S.flip?'back':'front'):toast('ยังไม่มีเอกสาร ลองสแกนเอกสารแรกของคุณ')},
  view:d=>openView(d.id,d.side),'view-close':closeView,
  'view-rot'(){const v=S.view;if(!v)return;v.o=((v.o||0)-90)%360;v.z=1;v.tx=0;v.ty=0;const b=$('#vbox');if(b){b.style.transition='transform .35s ease';fitV();setTimeout(()=>{b.style.transition=''},380)}},
  'view-flip'(){const v=S.view;if(!v)return;v.side=v.side==='front'?'back':'front';if(v.id===S.selId)S.flip=v.side==='back';$('#vflip').classList.toggle('f',v.side==='back')},
  zoom:d=>{const v=S.view;vZoom(+d.v===0?1:v.z+ +d.v/100)},
  'v-adjust'(){const v=S.view;if(!v)return;if(!docById(v.id).images[v.side])return toast(`ยังไม่มีภาพ${SIDE[v.side]}`);adjustSaved(v.id,v.side)},
  'v-orig'(){const v=S.view;if(v)dlOrig(v.id,v.side)},
  'copy-wm':d=>copyWM(d.id,d.side),'dl-orig':d=>dlOrig(d.id,d.side),
  sc(d){const k=d.k,c=curDoc();if(k==='scan')A['scan-to']({doc:'new',side:'front'});else if(k==='docs'||k==='mydocs')go(1);
    else if(k==='hist'||k==='req')go(3);
    else if(k==='soon')toast('ฟีเจอร์นี้จะเปิดให้ใช้งานเร็วๆ นี้');
    else if(k==='cert'){if(!c||!(c.images.front||c.images.back))return toast('ยังไม่มีเอกสาร สแกนเอกสารก่อนจึงทำสำเนาได้');
      sheet(`<h3>การรับรองเอกสาร</h3><p>บันทึกสำเนาของ “${esc(c.title)}” พร้อมลายน้ำ “${esc(S.wm.text)}” เพื่อส่งให้ผู้อื่น ไฟล์ต้นฉบับไม่ถูกแก้ไข</p>${['front','back'].map(sd=>c.images[sd]?`<button class="rw" data-act="copy-wm" data-id="${c.id}" data-side="${sd}">${ic('shield',20)}<span>สำเนา${SIDE[sd]}พร้อมลายน้ำ</span></button>`:'').join('')}<button class="rw" data-act="goto" data-arg="4">${ic('set',20)}<span>ตั้งค่าข้อความและตำแหน่งลายน้ำ</span></button><p class="ffnote">เป็นสำเนาที่คุณทำเอง ไม่ใช่การรับรองหรือยืนยันโดยหน่วยงานใด</p>`)}
    else if(k==='addr'){const a=(S.profile.address||'').trim();
      sheet(`<h3>การแจ้งย้ายที่อยู่</h3><p>อัปเดตที่อยู่ในโปรไฟล์ DocPocket ของคุณ</p><div class="cd2"><small>ที่อยู่ปัจจุบันในแอป</small><p>${a?esc(a):'ยังไม่ได้ระบุ'}</p></div><button class="bt" data-act="addr-edit">แก้ไขที่อยู่</button><p class="ffnote">DocPocket ไม่ได้ส่งเรื่องแจ้งย้ายที่อยู่ไปยังหน่วยงานราชการ การแจ้งย้ายที่อยู่ตามกฎหมายต้องทำที่สำนักทะเบียนหรือช่องทางทางการ</p>`)}
    else if(k==='detail'){closeSheet();c?detOpen(c.id):toast('ยังไม่มีเอกสาร ลองสแกนเอกสารแรกของคุณ')}
    else if(k==='files'){if(c)docSheet(c.id);else{go(1);toast('ยังไม่มีเอกสาร กด “เพิ่มเอกสารใหม่” เพื่อเริ่มต้น')}}
    else if(k==='view')A['open-view']();
    else if(k==='copy'){if(!c||!(c.images.front||c.images.back))return toast('ยังไม่มีเอกสาร สแกนเอกสารก่อนจึงสร้างสำเนาลายน้ำได้');const sd=c.images[S.flip?'back':'front']?(S.flip?'back':'front'):(c.images.front?'front':'back');copyWM(c.id,sd)}
    else sheet(`<h3>ความเป็นส่วนตัวของคุณ</h3><ul><li>ภาพเอกสารถูกเก็บในพื้นที่ส่วนตัว เปิดดูได้เฉพาะบัญชีของคุณ</li><li>ไฟล์ต้นฉบับไม่ถูกแก้ไข ลายน้ำและการหมุนเป็นการแสดงผล</li><li>ลบภาพ เอกสาร หรือบัญชีทั้งหมดได้เองในหน้าตั้งค่า</li></ul><p>${ABOUT}</p><a class="bt2" href="/privacy.html" target="_blank" rel="noopener">อ่านนโยบายความเป็นส่วนตัว</a>`)},
  'sc-all'(){sheet(`<h3>เมนูบริการทั้งหมด</h3><button class="rw" data-act="sc" data-k="scan">${ic('scan',22)}<span>สแกนเอกสาร</span></button>${SC.filter(s=>!s.off).map(s=>`<button class="rw" data-act="sc" data-k="${s.k}">${ic(s.i,22)}<span>${s.t.replace('<br>','')}</span></button>`).join('')}<button class="rw" data-act="sc" data-k="mydocs">${ic('doc',22)}<span>เอกสารของฉัน</span></button><button class="rw" data-act="sc" data-k="detail">${ic('user',22)}<span>รายละเอียดเอกสาร</span></button><button class="rw" data-act="sc" data-k="files">${ic('image',22)}<span>จัดการไฟล์</span></button><button class="rw" data-act="sc" data-k="copy">${ic('shield',22)}<span>สำเนาลายน้ำของเอกสารที่แสดงอยู่</span></button><button class="rw" data-act="sc" data-k="priv">${ic('lock',22)}<span>ความเป็นส่วนตัวของคุณ</span></button><button class="rw" data-act="bell">${ic('bell',22)}<span>การแจ้งเตือนและเอกสารใกล้หมดอายุ</span></button>`)},
  'ann-more'(){annList()},
  ann(d){annOpen(d.id)},'ap-close':closeAp,'ap-list':annList,
  bell(){const ex=expiring();S.seen=ANNS().map(a=>a.id);sv('dp_seen',S.seen);S.expSeen=ex.map(x=>x.d.id+x.d.expires_on);sv('dp_expseen',S.expSeen);renderHdr();
    sheet(`<h3>การแจ้งเตือน</h3>${S.expDays?`<div class="lb">เอกสารใกล้หมดอายุ (ภายใน ${S.expDays} วัน)</div>${ex.length?ex.map(x=>`<button class="rw" data-act="det-open" data-id="${x.d.id}"><span class="ai">${ic('doc',16)}</span><span>${esc(x.d.title)}<small>${x.n<0?`หมดอายุแล้ว ${-x.n} วัน`:x.n===0?'หมดอายุวันนี้':`หมดอายุในอีก ${x.n} วัน`} · ${fmtDate(x.d.expires_on,S.era)}</small></span></button>`).join(''):'<p class="nt tl">ไม่มีเอกสารที่ใกล้หมดอายุ</p>'}`:''}
     <div class="lb">ประกาศ</div>${ANNS().map(a=>`<button class="rw" data-act="ann" data-id="${esc(a.id)}">${annIc(a,'ai2')}<span>${esc(a.t)}<small>${annDate(a)}${a.demo?' · DEMO':''}</small></span></button>`).join('')}`)},
  power(){if(demoOnly&&S.tab===4&&!S.setOpen){const t=Date.now();spN=t-spT<2500?spN+1:1;spT=t;if(spN>=5){spN=0;S.setOpen=true;R4();$('#v4').scrollTop=0}return}
    sheet(`<h3>ล็อกหรือออกจากระบบ</h3>${hasLock()?`<button class="rw" data-act="lock-now"><span>ล็อกแอปตอนนี้<small>ต้องใส่รหัส 6 หลักเพื่อกลับเข้าใช้</small></span>${ic('lock',20)}</button>`:`<button class="rw" data-act="lock-setup"><span>ตั้งรหัสล็อกแอป<small>ยังไม่ได้ตั้ง · ไปที่ตั้งค่า</small></span>${ic('lock',20)}</button>`}<button class="rw" data-act="logout-ask"><span>ออกจากระบบ</span>${ic('power',20)}</button>`)},
  'addr-edit'(){closeSheet();go(4);setTimeout(()=>{const f=$('#f3');if(f){f.scrollIntoView({block:'center',behavior:'smooth'});f.focus({preventScroll:true})}},80)},
  noop(){},
  'bn-edit'(d){const L=BNS(),nw=d.i==='new',b=nw?{id:'b'+Date.now().toString(36),tpl:'b1',t1:'',t2:'',t3:'',go:-1}:{...L[+d.i]};dropURL(S.bnEd?.pu);S.bnEd={i:nw?-1:+d.i,b,blob:null,pu:null,rm:false};
    sheet(`<h3>${nw?'เพิ่มแบนเนอร์':'แก้ไขแบนเนอร์'}</h3><div class="bnpv"><div class="bn ${bnCls(b)}" id="bnpv">${bnInner(b)}</div></div><div id="bnup">${bnUpHtml()}</div>
     <form data-form="bn" id="bnf" novalidate><label for="bt">แบบแบนเนอร์</label><select id="bt" name="tpl" data-chg="bn-pv">${Object.entries(BTPL).map(([k,v])=>`<option value="${k}" ${b.tpl===k?'selected':''}>${v}</option>`).join('')}</select>
     <label for="b1">หัวข้อ</label><input id="b1" name="t1" type="text" maxlength="40" value="${esc(b.t1)}" data-inp="bn-pv" placeholder="เช่น โปรโมชันร้านของฉัน">
     <label for="b2">ข้อความรอง (ขึ้นบรรทัดใหม่ได้)</label><textarea id="b2" name="t2" rows="2" maxlength="90" data-inp="bn-pv">${esc(b.t2)}</textarea>
     <div id="b3w"${b.tpl==='b2'?'':' hidden'}><label for="b3">ข้อความเล็กด้านล่าง</label><textarea id="b3" name="t3" rows="2" maxlength="90" data-inp="bn-pv">${esc(b.t3)}</textarea></div>
     <label for="bg">เมื่อแตะแบนเนอร์</label><select id="bg" name="go">${BGO.map(([v,t])=>`<option value="${v}" ${+b.go===v?'selected':''}>${t}</option>`).join('')}</select>
     <div class="err" id="bne" role="alert"></div><div class="row2 mt14">${nw?'':'<button type="button" class="bt2 dgt" data-act="bn-del">ลบแบนเนอร์</button>'}<button class="bt" type="submit">บันทึก</button></div></form>`)},
  'bn-del'(){const L=[...BNS()],im=S.bnEd?.i>=0?L[S.bnEd.i]?.img:null;if(S.bnEd?.i>=0)L.splice(S.bnEd.i,1);saveHome({banners:L},'ลบแบนเนอร์แล้ว').then(()=>{if(im)Promise.resolve(sb.storage.from(B).remove([im])).catch(()=>0)})},
  'bn-img-del'(){const e=S.bnEd;if(!e)return;dropURL(e.pu);e.pu=null;e.blob=null;e.rm=true;bnUp();bnPv()},
  'an-edit'(d){const L=ANNS(),nw=d.i==='new',t=new Date(),z=n=>String(n).padStart(2,'0'),a=nw?{id:'u'+Date.now().toString(36),t:'',d:`${t.getFullYear()}-${z(t.getMonth()+1)}-${z(t.getDate())}`,s:'',ic:'logo',demo:false}:{...L[+d.i]};dropURL(S.anEd?.pu);S.anEd={i:nw?-1:+d.i,a,blob:null,pu:null,rm:false};
    sheet(`<h3>${nw?'เพิ่มประกาศ':'แก้ไขประกาศ'}</h3><form data-form="an" id="anf" novalidate>
     <div class="lb">รูปไอคอนของฉัน</div><div id="anup">${anUpHtml()}</div><div class="lb">หรือเลือกไอคอนสำเร็จรูป</div><div class="icp">${AIC.map(([k,t])=>`<label class="icb" title="${t}"><input type="radio" name="ic" value="${k}" ${(a.ic||'logo')===k?'checked':''}>${annIc({ic:k})}</label>`).join('')}</div>
     <label for="a1">หัวข้อ</label><input id="a1" name="t" type="text" maxlength="60" value="${esc(a.t)}">
     <label for="a2">วันที่</label><input id="a2" name="d" type="date" value="${esc(a.d||'')}">
     <label for="a3">รายละเอียด</label><textarea id="a3" name="s" rows="4" maxlength="300">${esc(a.s)}</textarea>
     <label class="ck"><input type="checkbox" name="demo" ${a.demo?'checked':''}> แสดงป้าย DEMO (ข้อมูลตัวอย่าง)</label>
     <div class="err" id="ane" role="alert"></div><div class="row2 mt14">${nw?'':'<button type="button" class="bt2 dgt" data-act="an-del">ลบประกาศ</button>'}<button class="bt" type="submit">บันทึก</button></div></form>`)},
  'an-del'(){const L=[...ANNS()],im=S.anEd?.i>=0?L[S.anEd.i]?.pic:null;if(S.anEd?.i>=0)L.splice(S.anEd.i,1);saveHome({anns:L},'ลบประกาศแล้ว').then(()=>{if(im)Promise.resolve(sb.storage.from(B).remove([im])).catch(()=>0)})},
  'anpic-edit'(){const has=!!annDef();
    sheet(`<h3>ไอคอนเริ่มต้นของประกาศทั้งหมด</h3><p>รูปที่คุณอัปโหลดจะใช้เป็นไอคอนของทุกประกาศที่ไม่ได้ใส่รูปของตัวเองหรือเลือกไอคอนอื่น ประกาศที่มีรูปหรือไอคอนของตัวเองยังคงใช้ของตัวเอง</p>
     <div class="anup">${annIc({ic:'logo'},'ap-ic')}<div><label class="pk" for="anpfile">${ic('image',16)} ${has?'เปลี่ยนรูป':'อัปโหลดรูปของฉัน'}</label>${has?' <button type="button" class="mini dg" data-act="anpic-del">กลับไปใช้ไอคอน DocPocket</button>':''}</div><input id="anpfile" type="file" hidden accept="image/*" data-chg="anp-file"></div>
     <p class="nt tl bnhint">รูปจะถูกครอปเป็นสี่เหลี่ยมจัตุรัสและแสดงเป็นวงกลม · เก็บเป็นส่วนตัวในบัญชีของคุณ · ใช้เฉพาะรูปที่คุณมีสิทธิ์ใช้</p><button class="bt2" data-act="sheet-close">ปิด</button>`)},
  'anpic-del'(){const old=annDef()?.path;saveHome({annPic:null},'กลับไปใช้ไอคอน DocPocket แล้ว').then(()=>{if(old)Promise.resolve(sb.storage.from(B).remove([old])).catch(()=>0)})},
  'an-img-del'(){const e=S.anEd;if(!e)return;dropURL(e.pu);e.pu=null;e.blob=null;e.rm=true;anUp()},
  'home-reset-ask'(){sheet(`<h3>คืนค่าเริ่มต้น?</h3><p>แบนเนอร์และประกาศที่คุณแก้ไขจะถูกแทนที่ด้วยค่าเริ่มต้นของ DocPocket</p><button class="bt" data-act="home-reset">คืนค่าเริ่มต้น</button><button class="bt2" data-act="sheet-close">ยกเลิก</button>`)},
  'home-reset'(){const im=[...(S.profile.home?.banners||[]).map(b=>b?.img),...(S.profile.home?.anns||[]).map(a=>a?.pic),S.profile.home?.annPic?.path].filter(Boolean);saveHome({banners:null,anns:null,annPic:null},'คืนค่าเริ่มต้นแล้ว').then(()=>{if(im.length)Promise.resolve(sb.storage.from(B).remove(im)).catch(()=>0)})},
  'lock-setup'(){closeSheet();go(4);setTimeout(()=>$('#v4 [data-act=tg-lock]')?.scrollIntoView({block:'center',behavior:'smooth'}),80)},
  'logout-ask'(){sheet(`<h3>ออกจากระบบ?</h3><p>ข้อมูลที่แคชในหน่วยความจำของแอปจะถูกล้างเมื่อออกจากระบบ เอกสารของคุณยังอยู่ในบัญชี</p><button class="bt" data-act="logout">ออกจากระบบ</button><button class="bt2" data-act="sheet-close">ยกเลิก</button>`)},
  'dbg-vg'(){const off=ls('dp_vgap','on')==='off';sv('dp_vgap',off?'on':'off');window.__vgap();dbgSheet()},
  'dbg-h'(d){const a=$('#app');if(d.v==='auto'){a.style.height='';a.style.bottom='';return dbgSheet()}a.style.bottom='auto';a.style.height=d.v==='screen'?screen.height+'px':'100lvh';dbgSheet()},
  async logout(){if(S.demo)return exitDemo();await sb.auth.signOut();wipe()},'sheet-close':closeSheet,
  'doc-open':d=>docSheet(d.id),
  'doc-cat'(d){S.cat=d.c;$$('#dcat button').forEach(b=>b.classList.toggle('on',b.dataset.c===d.c));dfilter()},
  'doc-st'(d){S.dst=d.v;$$('#dst button').forEach(b=>b.classList.toggle('on',b.dataset.v===d.v));dfilter()},
  'doc-clear'(){S.q='';S.cat='';S.dst='all';R1()},
  'doc-show'(d){if(!docById(d.id))return;S.selId=d.id;S.flip=false;S.rv=false;closeSheet();go(0)},
  'hist-f'(d){S.hf=d.v;S.hn=HPAGE;R3()},
  'hist-more'(){const v=$('#v3'),y=v.scrollTop;S.hn+=HPAGE;R3();v.scrollTop=y},
  'hist-open'(d){if(docById(d.id))docSheet(d.id)},
  'demo-start':enterDemo,'demo-reset':enterDemo,'demo-menu':demoMenu,'demo-exit':exitDemo,'demo-step'(d){closeSheet();go(+d.i)},
  'det-open':d=>detOpen(d.id),'det-close':closeDet,'det-edit'(){S.detEdit=true;detDraw();$('#dp').scrollTop=0},'det-view'(){S.detEdit=false;detDraw()},
  'adjust-saved':d=>{closeSheet();adjustSaved(d.id,d.side)},'scan-adjust':adjustScan,
  'retry-img'(){lruClear(FU);lruClear(TH);rerender()},
  'scan-pick'(){A['scan-to']({doc:'new',side:'front'});$('#fg')?.click()},
  'ed-cancel':closeEd,'ed-ok'(){const e=ED;if(!e)return;const rot=e.rot,crop=edCrop(),f=e.done;closeEd();f(rot,crop)},
  'ed-asp'(d){ED.ak=d.k;ED.z=1;ED.cx=ED.cy=.5;edRender()},
  'ed-rot'(d){ED.rot=(ED.rot+ +d.v+360)%360;ED.pc=previewCanvas(ED.bmp,ED.rot,1600);ED.z=1;ED.cx=ED.cy=.5;if(ED.ak==='cur')ED.ak=ED.only||'full';if(ED.ak==='card'&&ED.pc.width<ED.pc.height)ED.ak='full'; // a card turned upright is shown whole until it is turned back
    edRender()},
  'ed-auto'(){if(!ED)return;const r=detectCard(ED.pc);if(!r)return toast('หาขอบบัตรไม่เจอ ลองลากและซูมเอง');if(!ED.only&&ED.ak!=='card')ED.ak='card';edFit(r);edRender()},
  'ed-reset'(){ED.rot=0;ED.pc=previewCanvas(ED.bmp,0,1600);ED.ak=ED.only||'full';ED.z=1;ED.cx=ED.cy=.5;edRender()},
  reveal(){if(hasLock())lockShow('verify',{cancel:true,done:()=>{S.rv=true;R0()}});else{S.rv=true;R0()}},
  help(){sheet(`<h3>ช่วยเหลือ</h3><p>DocPocket ยังไม่มีแชตสดกับเจ้าหน้าที่ นี่คือคำตอบสำหรับคำถามที่พบบ่อย</p><ul><li><b>ถ่ายภาพอย่างไรให้คมชัด</b> วางบนพื้นเรียบ แสงสม่ำเสมอ เห็นขอบครบสี่ด้าน แล้วใช้ “ปรับภาพ” ครอปและหมุน</li><li><b>เปลี่ยนหรือลบภาพ</b> เปิดแท็บเอกสาร แตะเอกสาร แล้วเลือก เปลี่ยน/ปรับภาพ/ลบภาพ</li><li><b>ส่งสำเนาให้ผู้อื่น</b> เปิดดูเอกสาร กด “บันทึกสำเนาลายน้ำ” ระบุผู้รับและวัตถุประสงค์</li><li><b>ลืมรหัสล็อกแอป</b> ออกจากระบบแล้วเข้าสู่ระบบใหม่ด้วยรหัสผ่านบัญชี</li></ul><a class="bt2" href="/privacy.html" target="_blank" rel="noopener">นโยบายความเป็นส่วนตัว</a>`)},
  lk:d=>lockKey(d.k),'lk-cancel'(){lockHide()},'lk-forgot'(){L.forgot=true;lockDraw()},'lk-forgot-no'(){L.forgot=false;lockDraw()},
  async 'lk-forgot-yes'(){localStorage.removeItem(LK());localStorage.removeItem(LF());if(S.demo)return exitDemo();await sb.auth.signOut();wipe()},
  'tg-lock'(){keepDraft();if(hasLock())lockShow('verify',{cancel:true,done:()=>{localStorage.removeItem(LK());localStorage.removeItem(LF());toast('ปิดรหัสล็อกแอปแล้ว');R4()}});else lockShow('set',{cancel:true,done:()=>R4()})},
  'lock-change'(){keepDraft();lockShow('verify',{cancel:true,done:()=>lockShow('set',{cancel:true,done:()=>R4()})})},
  'lock-now':lockNow,
  'tg-hidepv'(){keepDraft();S.hidePv=!S.hidePv;S.rv=false;if(!S.demo)sv('dp_hidepv',S.hidePv);R4()},
  'img-del-ask':d=>sheet(`<h3>ลบภาพ${SIDE[d.side]}?</h3><p>ภาพนี้จะถูกลบถาวรจากที่จัดเก็บ ส่วนอีกด้านของเอกสารไม่ได้รับผลกระทบ</p><button class="bt3" data-act="img-del" data-id="${d.id}" data-side="${d.side}">ลบถาวร</button><button class="bt2" data-act="sheet-close">ยกเลิก</button>`),
  'img-del':d=>delImage(d.id,d.side),
  'doc-del-ask':d=>sheet(`<h3>ลบเอกสารทั้งชุด?</h3><p>ภาพด้านหน้า ด้านหลัง และชื่อเอกสารจะถูกลบถาวร กู้คืนไม่ได้</p><button class="bt3" data-act="doc-del" data-id="${d.id}">ลบถาวร</button><button class="bt2" data-act="sheet-close">ยกเลิก</button>`),
  'doc-del':d=>delDoc(d.id),
  'scan-to'(d){stopCam();clearFile();S.scan={...newScan(),doc:d.doc||'new',side:d.side||'front'};go(2)},
  'scan-side':d=>{S.scan.side=d.side;R2()},
  'cam-on':camOn,'cam-off'(){stopCam();R2()},'cam-flip'(){S.scan.facing=S.scan.facing==='environment'?'user':'environment';camOn()},shoot,
  'pick-gallery':()=>$('#fg').click(),'pick-native':()=>$('#fc').click(),
  async 'scan-rot'(){const sc=S.scan;if(!sc.file||sc.busy)return;sc.rot=((sc.rot||0)+90)%360;await scanFit(sc,false);R2()},
  async 'scan-fit'(){const sc=S.scan;if(!sc.file||sc.busy)return;sc.full=!!sc.crop;await scanFit(sc,false,true);R2()},
  'scan-retake'(){clearFile();R2()},'scan-cancel'(){stopCam();clearFile();S.scan=newScan();go(0)},'scan-save':saveScan,
  era(d){const v=readPF();if(v)S.draft=v;S.era=d.v;sv('dp_era',S.era);R4()},
  'tg-auto'(){S.auto=!S.auto;sv('dp_auto',S.auto);const v=readPF();if(v)S.draft=v;R4()},
  'tg-badge'(){S.badge=!S.badge;sv('dp_badge',S.badge);renderHdr();const v=readPF();if(v)S.draft=v;R4()},
  'tg-wm'(){S.wm.on=!S.wm.on;sv('dp_wm',S.wm);const v=readPF();if(v)S.draft=v;R4()},
  'profile-cancel'(){S.draft=null;R4();toast('ยกเลิกการแก้ไขแล้ว')},'avatar-del':delAvatar,
  'prof-open':profOpen,'prof-close':closeProf,
  'card-reset-ask'(){const dm=S.demo||isMock;keepDraft();sheet(`<h3>รีเซ็ตเป็นค่าเริ่มต้น?</h3><p>${dm?'ข้อมูลบัตรทั้งหมด (ชื่อ เลขประจำตัวประชาชน ที่อยู่ และวันที่ต่าง ๆ) จะถูกแทนที่ด้วยข้อมูลสมมติเริ่มต้นของ DEMO ข้อมูลที่คุณแก้ไขไว้จะหายไป':'ข้อมูลบัตรที่บันทึกไว้ทั้งหมด (ชื่อ เลขประจำตัวประชาชน ที่อยู่ และวันที่ต่าง ๆ) จะถูกล้างเป็นค่าว่าง เอกสารและรูปที่อัปโหลดไม่ถูกลบ'}</p><button class="bt3" data-act="card-reset">รีเซ็ต</button><button class="bt2" data-act="sheet-close">ยกเลิก</button>`)},
  'card-reset':cardReset,
  export:exportData,'export-zip':exportZip,'mfa-on':mfaOn,'mfa-off':mfaOff,
  'acct-ask'(){sheet(`<h3>ลบบัญชีและข้อมูลทั้งหมด?</h3><p>เอกสารที่อัปโหลด โปรไฟล์ ประวัติ และบัญชีจะถูกลบถาวรทันที กู้คืนไม่ได้ ควรดาวน์โหลดข้อมูลของคุณก่อน พิมพ์ “ลบบัญชี” เพื่อยืนยัน</p><label for="dc">พิมพ์คำยืนยัน</label><input type="text" id="dc" autocomplete="off"><button class="bt3" data-act="acct-del">ลบทุกอย่างถาวร</button><button class="bt2" data-act="sheet-close">ยกเลิก</button>`)},
  'acct-del':delAcct,'auth-mode':d=>authUI(d.m)};
const C={
  'bn-pv':()=>bnPv(),
  'bn-file':el=>{const f=el.files[0];el.value='';if(f)bnPick(f)},
  'an-file':el=>{const f=el.files[0];el.value='';if(f)anPick(f)},
  'anp-file':el=>{const f=el.files[0];el.value='';if(f)anpPick(f)},
  'doc-sort':el=>{S.dsort=el.value;sv('dp_dsort',S.dsort);const L=$('#dlist');if(L){L.innerHTML=dsorted().map(drow).join('');hydrate(L);dfilter()}},
  theme:t=>{S.theme=t.value;sv('dp_theme',S.theme);applyTheme()},
  'exp-days':t=>{S.expDays=+t.value;sv('dp_expdays',S.expDays);renderHdr()},
  rename:async el=>{const d=docById(el.dataset.id),t=el.value.trim();if(!d)return;if(!t){el.value=d.title;return toast('ชื่อเอกสารต้องไม่ว่าง')}
    const {error}=await sb.from('documents').update({title:t.slice(0,60),updated_at:new Date().toISOString()}).eq('id',d.id);if(error)return toast(error.message);d.title=t.slice(0,60);rerender();toast('เปลี่ยนชื่อแล้ว')},
  'scan-doc':el=>{S.scan.doc=el.value;const d=docById(el.value);S.scan.side=!d?'front':!d.images.front?'front':!d.images.back?'back':'front';R2()}, // new document starts on the front; an existing one on its missing side
  'scan-file':el=>{const f=el.files[0];el.value='';if(f){stopCam();setFile(f)}},
  avatar:el=>{const f=el.files[0];el.value='';if(f)setAvatar(f)},
  'lock-after':el=>{S.lockAfter=+el.value;sv('dp_lockafter',S.lockAfter)},
  'wm-pos':el=>{S.wm.pos=el.value;sv('dp_wm',S.wm);$$('[data-wm]').forEach(e=>applyWM(e,S.wm))}};
function applyTheme(){const t=S.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):S.theme;document.documentElement.dataset.theme=t;
  $('meta[name=theme-color]')?.setAttribute('content',t==='dark'?'#11132f':'#303891')}
function bnRead(){const f=$('#bnf');if(!f)return null;const g=n=>f.elements[n]?.value??'',ln=v=>v.replace(/\r/g,'').split('\n').slice(0,2).join('\n').trim().slice(0,90);
  return{...S.bnEd.b,img:S.bnEd.rm?null:(S.bnEd.b.img||null),pu:S.bnEd.pu||null,tpl:BTPL[g('tpl')]?g('tpl'):'b1',t1:g('t1').trim().slice(0,40),t2:ln(g('t2')),t3:ln(g('t3')),go:BGO.some(x=>x[0]===+g('go'))?+g('go'):-1}}
function bnPv(){const b=bnRead(),e=$('#bnpv');if(!b||!e)return;e.className='bn '+bnCls(b);e.innerHTML=bnInner(b);hydrate(e);const w=$('#b3w');if(w)w.hidden=b.tpl!=='b2'}
/* announcement icon picture: pick -> frame as a square -> stored as one 256x256 JPEG, shown as the round icon */
function anUpHtml(){const e=S.anEd,a=e.a,has=!!(e.pu||(a.pic&&!e.rm));
  return `<div class="anup">${has?annIc({...a,pic:e.rm?null:a.pic,pu:e.pu},'ap-ic'):`<span class="anph">${ic('image',20)}</span>`}<div><label class="pk" for="anfile">${ic('image',16)} ${has?'เปลี่ยนรูป':'อัปโหลดรูปของฉัน'}</label>${has?' <button type="button" class="mini dg" data-act="an-img-del">ลบรูป</button>':''}</div><input id="anfile" type="file" hidden accept="image/*" data-chg="an-file"></div>
   <p class="nt tl bnhint">${has?'รูปนี้ใช้แทนไอคอนสำเร็จรูปด้านล่าง · ':''}${e.pu?'กด “บันทึก” เพื่อใช้งาน · ':''}รูปจะถูกครอปเป็นสี่เหลี่ยมจัตุรัสและแสดงเป็นวงกลม · เก็บเป็นส่วนตัวในบัญชีของคุณ · ใช้เฉพาะรูปที่คุณมีสิทธิ์ใช้${annDef()?' · ถ้าไม่ใส่รูปและไม่เลือกไอคอนอื่น จะใช้ไอคอนเริ่มต้นที่คุณตั้งไว้':''}</p>`}
const anUp=()=>{const e=$('#anup');if(e&&S.anEd){e.innerHTML=anUpHtml();hydrate(e)}};
async function iconBlob(file,rot,crop){const b=await bitmap(await processed(file,rot,crop)),N=256,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d');
  x.imageSmoothingQuality='high';x.fillStyle='#fff';x.fillRect(0,0,N,N);const w=b.naturalWidth||b.width,h=b.naturalHeight||b.height,k=Math.max(N/w,N/h);x.drawImage(b,(N-w*k)/2,(N-h*k)/2,w*k,h*k);
  return new Promise((ok,no)=>c.toBlob(o=>o?ok(o):no(new Error('สร้างรูปไม่สำเร็จ')),'image/jpeg',.9))}
async function anPick(file){
  try{file=await prepImage(file);await checkFile(file)}catch(e){console.error('announcement picture',e);return toast(e.message||'เปิดรูปไม่สำเร็จ')}
  openEd({blob:file,rot:0,crop:null,frame:'1:1',title:'รูปไอคอนประกาศ',done:async(rot,crop)=>{
    try{const blob=await iconBlob(file,rot,crop),e=S.anEd;if(!e)return;dropURL(e.pu);e.blob=blob;e.pu=objURL(blob);e.rm=false;anUp()}catch(x){toast(x.message||'ใช้รูปนี้ไม่ได้')}}})}
async function anpPick(file){
  try{file=await prepImage(file);await checkFile(file)}catch(e){console.error('default announcement picture',e);return toast(e.message||'เปิดรูปไม่สำเร็จ')}
  openEd({blob:file,rot:0,crop:null,frame:'1:1',title:'ไอคอนเริ่มต้นของประกาศ',done:async(rot,crop)=>{
    try{const blob=await iconBlob(file,rot,crop),path=`${S.user.id}/ann-default`,u=await sb.storage.from(B).upload(path,blob,{contentType:'image/jpeg',upsert:true,cacheControl:'0'});if(u.error)throw u.error;
      await saveHome({annPic:{path,v:Date.now()}},'ตั้งเป็นไอคอนเริ่มต้นของประกาศทั้งหมดแล้ว')}catch(x){toast('ตั้งรูปเริ่มต้นไม่สำเร็จ: '+(x.message||x))}}})}
/* banner picture: pick -> frame it to the banner shape in the editor -> stored as one 2128x496 JPEG (2x of the 1064x248 slide) */
function bnUpHtml(){const e=S.bnEd,has=!!(e.pu||(e.b.img&&!e.rm));
  return `<div class="bnup"><label class="pk" for="bnfile">${ic('image',16)} ${has?'เปลี่ยนรูปแบนเนอร์':'อัปโหลดรูปแบนเนอร์ของฉัน'}</label><input id="bnfile" type="file" hidden accept="image/*" data-chg="bn-file">${has?'<button type="button" class="mini dg" data-act="bn-img-del">ลบรูป</button>':''}</div>
   <p class="nt tl bnhint">${e.pu?'เลือกรูปใหม่แล้ว กด “บันทึก” เพื่อใช้งาน · ':''}${has?'เมื่อมีรูป แบนเนอร์จะแสดงเป็นรูปเต็มพื้นที่ (ข้อความไม่แสดง) · ':''}ขนาดแนะนำ 1064×248 พิกเซล (อัตราส่วน 4.3:1) JPG, PNG หรือ WebP · รูปเก็บเป็นส่วนตัวในบัญชีของคุณ · ใช้เฉพาะรูปที่คุณมีสิทธิ์ใช้</p>`}
const bnUp=()=>{const e=$('#bnup');if(e&&S.bnEd)e.innerHTML=bnUpHtml()};
async function bannerBlob(file,rot,crop){const b=await bitmap(await processed(file,rot,crop)),W=2128,H=496,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.imageSmoothingQuality='high';x.fillStyle='#fff';x.fillRect(0,0,W,H);const w=b.naturalWidth||b.width,h=b.naturalHeight||b.height,k=Math.max(W/w,H/h);x.drawImage(b,(W-w*k)/2,(H-h*k)/2,w*k,h*k);
  return new Promise((ok,no)=>c.toBlob(o=>o?ok(o):no(new Error('สร้างภาพแบนเนอร์ไม่สำเร็จ')),'image/jpeg',.9))}
async function bnPick(file){
  try{file=await prepImage(file);await checkFile(file)}catch(e){console.error('banner upload',e);return toast(e.message||'เปิดรูปไม่สำเร็จ')}
  openEd({blob:file,rot:0,crop:null,frame:'bn',title:'แบนเนอร์',done:async(rot,crop)=>{
    try{const blob=await bannerBlob(file,rot,crop),e=S.bnEd;if(!e)return;dropURL(e.pu);e.blob=blob;e.pu=objURL(blob);e.rm=false;bnUp();bnPv()}catch(x){toast(x.message||'ใช้รูปนี้ไม่ได้')}}})}
// saved on this device first (so edits survive reloads, also in the test build), then to the account
async function saveHome(patch,msg){const cur=S.profile.home||{},home={banners:cur.banners||null,anns:cur.anns||null,annPic:cur.annPic||null,...patch};
  const empty=!home.banners&&!home.anns&&!home.annPic;if(empty){try{localStorage.removeItem(HK())}catch(e){}}else sv(HK(),home);
  let warn='';try{const {error}=await sb.from('profiles').upsert({id:S.user.id,home:empty?null:home},{onConflict:'id'});
    if(error)warn=/home|schema cache|column/i.test(error.message)?' (บันทึกในเครื่องนี้ · ฐานข้อมูลยังไม่มีคอลัมน์ home ดู README)':' (บันทึกในเครื่องนี้ · ซิงก์กับบัญชีไม่สำเร็จ: '+error.message+')'}
  catch(e){warn=' (บันทึกในเครื่องนี้ · ออฟไลน์)'}
  S.profile.home=empty?null:home;S.ci=0;closeSheet();renderHdr();if(S.tab===4){keepDraft();R4()}else if(S.tab===0)R0();toast((msg||'บันทึกแล้ว')+warn);return true}
const I={
  'bn-pv':()=>bnPv(),
  'fmt-id':el=>fmtLive(el,fmtId),'fmt-member':el=>fmtLive(el,fmtMember),
  'doc-q':t=>{S.q=t.value;dfilter()},
  'ed-zoom':el=>ED&&edZoom(+el.value),
  'scan-title':el=>{S.scan.title=el.value},
  'wm-op':el=>{S.wm.op=+el.value;sv('dp_wm',S.wm);$$('[data-wm]').forEach(e=>applyWM(e,S.wm))},
  'wm-text':el=>{S.wm.text=el.value.slice(0,60)||DEF_WM.text;sv('dp_wm',S.wm);$$('[data-wm]').forEach(e=>applyWM(e,S.wm))}};

/* ===================== auth ===================== */
function shell(h){let a=$('#auth');if(!a){a=document.createElement('div');a.id='auth';a.className='auth';$('#app').append(a)}a.innerHTML=h;return a}
const brand=sub=>`<div class="brand">${LOGO(58)}<div><h1>DocPocket</h1><p>${sub}</p></div></div>${isMock?'<div class="mockb">โหมดทดสอบ: ไม่มีเซิร์ฟเวอร์จริง ข้อมูลอยู่ในแท็บนี้และหายเมื่อรีเฟรช อย่าใช้เอกสารจริง</div>':''}`;
const msg=(t,ok)=>{const m=$('#am');m.className='err'+(ok?' ok2':'');m.textContent=t};
function authUI(mode){
  const T={in:'เข้าสู่ระบบ',up:'สมัครสมาชิก',rs:'ลืมรหัสผ่าน'}[mode];
  shell(`${brand('กระเป๋าเอกสารส่วนตัวของคุณ')}<h3>${T}</h3>
   <form data-form="${mode}" novalidate><label for="ae">อีเมล</label><input type="email" id="ae" name="email" autocomplete="email" required>
   ${mode!=='rs'?`<label for="ap">รหัสผ่าน${mode==='up'?' (อย่างน้อย 10 ตัวอักษร)':''}</label><input type="password" id="ap" name="password" autocomplete="${mode==='in'?'current-password':'new-password'}" required>`:''}
   ${mode==='up'?`<label class="chk"><input type="checkbox" name="consent"><span>ฉันยินยอมให้ DocPocket เก็บและประมวลผลเอกสารที่ฉันอัปโหลดเพื่อให้บริการนี้ ตาม<a href="/privacy.html" target="_blank" rel="noopener">นโยบายความเป็นส่วนตัว</a></span></label>`:''}
   <div class="err" id="am" role="alert"></div><button class="bt" type="submit">${T}</button></form>
   ${mode==='in'?`<button class="bt2" data-act="auth-mode" data-m="up">สมัครสมาชิก</button><button class="bt2" data-act="auth-mode" data-m="rs">ลืมรหัสผ่าน</button><button class="bt2 dmb" data-act="demo-start"><b>ดูตัวอย่างโหมด DEMO</b><small>ไม่ต้องสมัคร · ใช้เอกสารสมมติ · ไม่บันทึกข้อมูลจริง</small></button>`:`<button class="bt2" data-act="auth-mode" data-m="in">กลับไปเข้าสู่ระบบ</button>`}
   <p class="nt mt22">${ABOUT}</p>`)}
function newPw(){shell(`${brand('ตั้งรหัสผ่านใหม่')}<form data-form="newpw" novalidate><label for="np">รหัสผ่านใหม่ (อย่างน้อย 10 ตัวอักษร)</label><input type="password" id="np" name="password" autocomplete="new-password"><div class="err" id="am" role="alert"></div><button class="bt" type="submit">บันทึกรหัสผ่าน</button></form>`)}
async function mfaChallenge(){const {data}=await sb.auth.mfa.listFactors(),t=data.totp.find(x=>x.status==='verified');
  shell(`${brand('ยืนยันสองขั้นตอน')}<p>กรอกรหัส 6 หลักจากแอป Authenticator${isMock?' (ทดสอบ: 123456)':''}</p><form data-form="mfa" novalidate><label for="mc">รหัส</label><input type="text" id="mc" name="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code"><div class="err" id="am" role="alert"></div><button class="bt" type="submit">ยืนยัน</button></form><button class="bt2" data-act="logout">ออกจากระบบ</button>`);
  S.mfaFactor=t.id}
const H={
  async bn(f){const b=bnRead(),E=S.bnEd,err=$('#bne');delete b.pu;
    if(!b.t1&&!b.t2&&!b.img&&!E.blob)return err.textContent='ใส่หัวข้อ ข้อความ หรือรูปแบนเนอร์อย่างน้อยหนึ่งอย่าง';
    const old=E.b.img;
    if(E.blob){const path=`${S.user.id}/banner-${b.id}`,u=await sb.storage.from(B).upload(path,E.blob,{contentType:'image/jpeg',upsert:true,cacheControl:'0'});if(u.error)return err.textContent='อัปโหลดรูปแบนเนอร์ไม่สำเร็จ: '+u.error.message;b.img=path;b.iv=Date.now()}
    const L=[...BNS()];if(E.i>=0)L[E.i]=b;else L.push(b);
    await saveHome({banners:L.slice(0,6)},'บันทึกแบนเนอร์แล้ว');dropURL(E.pu);
    if(E.rm&&old&&!b.img)Promise.resolve(sb.storage.from(B).remove([old])).catch(()=>0)},
  async an(f){const g=n=>f.elements[n].value,t=g('t').trim().slice(0,60),sx=g('s').trim().slice(0,300),d=/^\d{4}-\d{2}-\d{2}$/.test(g('d'))?g('d'):'';
    if(!t)return $('#ane').textContent='ใส่หัวข้อประกาศ';if(!d)return $('#ane').textContent='เลือกวันที่';const icv=f.querySelector('input[name=ic]:checked')?.value;
    const E=S.anEd,a={...E.a,t,s:sx,d,ic:AIC.some(x=>x[0]===icv)?icv:'logo',demo:f.elements.demo.checked};delete a.img;const old=E.a.pic;
    if(E.blob){const path=`${S.user.id}/ann-${a.id}`,u=await sb.storage.from(B).upload(path,E.blob,{contentType:'image/jpeg',upsert:true,cacheControl:'0'});if(u.error)return $('#ane').textContent='อัปโหลดรูปไม่สำเร็จ: '+u.error.message;a.pic=path;a.pv=Date.now()}else if(E.rm)a.pic=null;
    const L=[...ANNS()];if(E.i>=0)L[E.i]=a;else L.push(a);L.sort((x,y)=>(y.d||'').localeCompare(x.d||''));await saveHome({anns:L.slice(0,20)},'บันทึกประกาศแล้ว');dropURL(E.pu);
    if(E.rm&&old&&!a.pic)Promise.resolve(sb.storage.from(B).remove([old])).catch(()=>0)},
  async in(f){const e=f.email.value.trim(),p=f.password.value;if(!e||!p)return msg('กรอกอีเมลและรหัสผ่าน');const {error}=await sb.auth.signInWithPassword({email:e,password:p});if(error)return msg(thErr(error.message));await afterAuth(true)},
  async up(f){const e=f.email.value.trim(),p=f.password.value;if(!f.consent.checked)return msg('กรุณายินยอมนโยบายความเป็นส่วนตัวก่อนสมัคร');if(p.length<10)return msg('รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร');
    const {error}=await sb.auth.signUp({email:e,password:p,options:{emailRedirectTo:location.origin,data:{consent_at:new Date().toISOString(),consent_version:'draft-2026-10'}}});if(error)return msg(thErr(error.message));msg(isMock?'สมัครสำเร็จ (โหมดทดสอบ) กลับไปเข้าสู่ระบบได้เลย':'ส่งอีเมลยืนยันแล้ว กดลิงก์ในอีเมลแล้วกลับมาเข้าสู่ระบบ',true)},
  async rs(f){const {error}=await sb.auth.resetPasswordForEmail(f.email.value.trim(),{redirectTo:location.origin});if(error)return msg(thErr(error.message));msg('หากมีบัญชีนี้ ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านทางอีเมลแล้ว',true)},
  async newpw(f){const p=f.password.value;if(p.length<10)return msg('รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร');const {error}=await sb.auth.updateUser({password:p});if(error)return msg(thErr(error.message));S.rec=false;history.replaceState(null,'',location.pathname);await afterAuth(false)},
  async mfa(f){const c=await sb.auth.mfa.challenge({factorId:S.mfaFactor});if(c.error)return msg(c.error.message);const v=await sb.auth.mfa.verify({factorId:S.mfaFactor,challengeId:c.data.id,code:f.code.value.trim()});if(v.error)return msg(v.error.message);await afterAuth(S.fresh)},
  async profile(){await saveProfile()},async contact(f){await saveContact(f)},async docmeta(f){await saveMeta(f)}};
async function afterAuth(fresh){
  if(S.rec)return;
  const {data:l}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if(l&&l.nextLevel==='aal2'&&l.currentLevel!=='aal2'){S.fresh=fresh;return mfaChallenge()}
  const {data}=await sb.auth.getUser();if(!data?.user)return authUI('in');S.user=data.user;
  try{await Promise.all([loadProfile(),loadDocs(),loadHist(),loadMfa()]);await loadAvatar()}catch(e){shell(`${brand('')}<p class="err">โหลดข้อมูลไม่สำเร็จ: ${esc(e.message)}</p><button class="bt" data-act="logout">ออกจากระบบ</button>`);return}
  if(fresh)await log('login');
  $('#auth')?.remove();$('#app').classList.add('rdy');S.rv=false;go(0);initBack();
  if(!fresh&&hasLock())lockShow('unlock')}

/* Back button / swipe-back (Android, browsers): close the top overlay or return to Home instead of leaving the app.
   One extra history entry is kept as a sentinel; at Home with nothing open, Back leaves the app as usual. */
function initBack(){if(S.hs)return;S.hs=1;try{history.replaceState({dp:0},'');history.pushState({dp:1},'')}catch(e){}}
function backNav(){
  if(L){if(L.forgot){L.forgot=false;lockDraw()}else if(L.cancel)lockHide();return true}
  if(ED){closeEd();return true}if(S.ap){closeAp();return true}if(S.pi){closeProf();return true}if(S.det){closeDet();return true}if(S.view){closeView();return true}
  if($('#sh.on')){closeSheet();return true}if(S.tab!==0){go(0);return true}return false}
/* ===================== boot ===================== */
function boot(){
  const NV=[['home','หน้าหลัก'],['doc','เอกสาร'],['scan','สแกน'],['hist','ประวัติ'],['set','ตั้งค่า']];
  $('#fab').innerHTML=ic('chat',26);
  $('#nv').innerHTML=NV.map((n,i)=>`<button class="ni${i===2?' sc':''}${i===0?' on':''}" data-act="goto" data-arg="${i}">${i===2?`<span class="sb">${ic('nscan',30)}</span>`:ic(i===0?'nhome':n[0],26)}<b>${n[1]}</b></button>`).join('');
  document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t)return;const f=A[t.dataset.act];if(f){if(t.tagName==='A')return;f(t.dataset,t,e)}});
  applyTheme();matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(S.theme==='system')applyTheme()});
  document.addEventListener('change',e=>{const t=e.target.closest('[data-chg]');if(t)C[t.dataset.chg]?.(t,e)});
  document.addEventListener('input',e=>{const t=e.target.closest('[data-inp]');if(t)I[t.dataset.inp]?.(t,e)});
  const runForm=f=>{const b=$('button[type=submit]',f);if(b?.disabled)return;b&&(b.disabled=true);Promise.resolve(H[f.dataset.form]?.(f)).catch(x=>msg?.(x.message)).finally(()=>{if(b&&b.isConnected)b.disabled=false})};
  document.addEventListener('submit',e=>{const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();runForm(f)});
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.type!=='submit'||b.dataset.act)return;const f=b.closest('[data-form]');if(!f)return;e.preventDefault();runForm(f)});
  document.addEventListener('keydown',e=>{
    if(L&&!L.forgot){if(/^\d$/.test(e.key))lockKey(e.key);else if(e.key==='Backspace')lockKey('del');else if(e.key==='Escape'&&L.cancel)lockHide();return}
    if(e.key==='Escape'){if(ED)closeEd();else if(S.ap)closeAp();else if(S.pi)closeProf();else if(S.det)closeDet();else if(S.view)closeView();else closeSheet()}});
  ['pointerdown','pointermove','pointerup','pointercancel'].forEach(t=>$('#ed').addEventListener(t,edPtr));
  $('#ed').addEventListener('wheel',e=>{if(ED&&e.target.id==='edc'){e.preventDefault();edZoom(ED.z*Math.exp(-e.deltaY*.002))}},{passive:false});
  // privacy blur comes back after the idle period chosen in Settings (same timer as the app lock)
  ['pointerdown','keydown'].forEach(t=>document.addEventListener(t,()=>{S.act=Date.now()},{passive:true,capture:true}));S.act=Date.now();
  setInterval(()=>{if(S.hidePv&&S.rv&&!S.view&&(Date.now()-S.act)/1000>=Math.max(30,S.lockAfter)){S.rv=false;closeProf();if(S.tab===0)R0()}},5000);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){S.hideAt=Date.now();if(S.hidePv&&S.rv){S.rv=false;closeProf();if(S.tab===0&&!S.view)R0()}if(hasLock())$('#app').classList.add('priv');if(S.tab===2&&S.scan.cam){stopCam();R2()}}
    else{$('#app').classList.remove('priv');if(hasLock()&&S.hideAt&&(Date.now()-S.hideAt)/1000>=S.lockAfter)lockNow()}});
  addEventListener('popstate',()=>{if(S.leaving||!S.hs)return;if(backNav()){try{history.pushState({dp:1},'')}catch(e){}}else{S.leaving=true;history.back()}});
  $('#lock').addEventListener('click',e=>{if(e.target.id==='lock'&&L&&L.cancel&&!L.forgot)lockHide()}); // tap the dimmed area to cancel
  $('#bd').addEventListener('click',closeSheet);
  $('#vwr').addEventListener('click',e=>{const v=S.view;if(v&&!v.moved&&e.target.closest('#vbox')&&!e.target.closest('button'))A['view-flip']()});
  ['pointerdown','pointermove','pointerup','pointercancel'].forEach(t=>$('#vwr').addEventListener(t,vPtr));
  $('#vwr').addEventListener('wheel',e=>{if(S.view&&e.target.closest('#vbox')){e.preventDefault();vZoom(S.view.z*Math.exp(-e.deltaY*.002))}},{passive:false});
  addEventListener('resize',fitV);
  setInterval(()=>{if(!S.auto||S.tab!==0||S.view||$('#sh.on')||Date.now()<S.pz)return;const c=$('#cr');if(!c)return;const e=c.children[S.ci+2];if(e)c.scrollTo({left:crX(c,e),behavior:'smooth'})},4500);
  document.addEventListener('click',e=>{if(!e.target.closest('.dfoot'))return;const t=Date.now();dbgN=t-dbgT<2500?dbgN+1:1;dbgT=t;if(dbgN>=5){dbgN=0;dbgSheet()}});
  // iPhone home-screen app with the translucent status bar: iOS draws the page from the top of the screen but reports a viewport shorter by the status-bar height (innerHeight 812 on a 874pt screen), leaving an empty strip under the menu. Measure the missing strip and stretch the app by it.
  const vgap=()=>{const h=document.documentElement,g=Math.round(Math.max(screen.height,screen.width)-innerHeight),on=navigator.standalone===true&&innerHeight>innerWidth&&ls('dp_vgap','on')!=='off'&&g>=20&&g<=90;if(on){h.style.setProperty('--vgap',g+'px');h.classList.add('vgap')}else{h.classList.remove('vgap');h.style.removeProperty('--vgap')}};
  window.__vgap=vgap;vgap();addEventListener('resize',vgap);addEventListener('orientationchange',()=>setTimeout(vgap,300));
  // no page zoom (pinch or double-tap): iOS Safari ignores user-scalable=no, so its gesture events are cancelled too. The document viewer has its own pinch/double-tap zoom and is not affected.
  ['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
  if(import.meta.env.PROD&&'serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));
  // no loading screen: the app's own blue shows until the first real screen is ready
  if(demoOnly||/[?&#]demo\b/.test(location.search+location.hash)){if(configured)sb.auth.onAuthStateChange(ev=>{if(ev==='PASSWORD_RECOVERY'){S.rec=true;newPw()}});enterDemo(true);return}
  if(!configured){shell(`${brand('ยังไม่ได้ตั้งค่า')}<h3>ยังไม่ได้เชื่อมต่อ Supabase</h3><p class="nb">ตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ตาม README แล้วสร้างแอปใหม่</p><button class="bt2 dmb" data-act="demo-start"><b>ดูตัวอย่างโหมด DEMO</b><small>ใช้เอกสารสมมติ ไม่ต้องเชื่อมต่อเซิร์ฟเวอร์</small></button>`);return}
  sb.auth.onAuthStateChange(ev=>{if(ev==='PASSWORD_RECOVERY'){S.rec=true;newPw()}else if(ev==='SIGNED_OUT'&&S.user)wipe()});
  if(isMock&&seed&&!/[?&#]login/.test(location.search+location.hash)){seed().then(ok=>ok?afterAuth(true):authUI('in')).catch(e=>{console.error('seed',e);authUI('in')});return}
  sb.auth.getSession().then(({data:{session}})=>session?afterAuth(false):authUI('in'))}
boot();
