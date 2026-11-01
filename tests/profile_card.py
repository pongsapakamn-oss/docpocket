# Nov 2026 spec: DocPocket branding, DEMO VERSION strip, person button -> ข้อมูลบัตร, Settings "แก้ไขข้อมูลบัตร" form, one source of truth.
import asyncio,os,re,json
from playwright.async_api import async_playwright
ROOT=os.path.abspath(os.path.dirname(__file__)+'/..')
BASE='http://127.0.0.1:8765/index.html'
res=[]
def ok(n,c,x=''):
    c=bool(c);res.append(c);print(('PASS ' if c else 'FAIL ')+n+('' if c else f' — {x}'))
async def keys(pg,c):
    for ch in c: await pg.click(f'#lock [data-k="{ch}"]')
    await pg.wait_for_timeout(450)
async def main():
    # ---------- 1. branding: the project never says ThaID / THAID / ไทยดี; DocPocket everywhere
    hits=[]
    for base in ('src','public','index.html','tools','supabase'):
        pth=os.path.join(ROOT,base)
        files=[pth] if os.path.isfile(pth) else [os.path.join(d,f) for d,_,fs in os.walk(pth) for f in fs if f.endswith(('.js','.css','.html','.json','.webmanifest','.sql','.mjs'))]
        for f in files:
            try: s=open(f,encoding='utf-8').read()
            except Exception: continue
            if re.search(r'\bthaid\b|ไทยดี|ทางรัฐ',s,re.I): hits.append(os.path.relpath(f,ROOT))
    ok('no source, page, manifest or script mentions ThaID / THAID / ไทยดี', not hits, hits)
    man=json.load(open(os.path.join(ROOT,'public/manifest.webmanifest')))
    ok('PWA manifest name and short_name are DocPocket', man['short_name']=='DocPocket' and man['name'].startswith('DocPocket'), man['name'])
    idx=open(os.path.join(ROOT,'index.html'),encoding='utf-8').read()
    ok('browser title, app title meta and description say DocPocket', '<title>DocPocket' in idx and 'apple-mobile-web-app-title" content="DocPocket"' in idx and 'name="description" content="DocPocket' in idx)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,locale='th-TH',has_touch=True,is_mobile=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append('pageerror '+str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'googleapis' not in m.text and 'ERR_' not in m.text and 'upload' not in m.text else None)
        # login screen + About + footer
        await pg.goto(BASE+'?login'); await pg.wait_for_selector('#auth'); await pg.wait_for_timeout(400)
        ok('sign-in screen: DocPocket title and brand, nothing else', 'DocPocket' in await pg.inner_text('#auth h1') and not re.search('thaid',await pg.inner_text('#auth'),re.I))
        # ---------- 2. DEMO VERSION strip (Home)
        await pg.goto(BASE+'?demo'); await pg.wait_for_selector('#v0.on .flipw',timeout=60000); await pg.wait_for_timeout(700)
        ok('title is DocPocket', 'DocPocket' in await pg.title())
        ok('Home: header name/ONLINE/bell/power all still there', await pg.locator('#hdr .badge').count()==1 and await pg.locator('#hdr [data-act=bell]').count()==1 and await pg.locator('#hdr [data-act=power]').count()==1 and await pg.locator('#hdr .avb img').count()==1)
        ok('Home order: announcements heading -> announcements -> DEMO VERSION strip', await pg.evaluate("(()=>{const h=document.querySelector('#v0 .nh'),l=document.querySelector('#v0 .nl'),s=document.querySelector('#v0 .dstrip');return h.nextElementSibling===l&&l.nextElementSibling===s&&h.getBoundingClientRect().top<l.getBoundingClientRect().top&&l.getBoundingClientRect().bottom<=s.getBoundingClientRect().top+1})()"))
        ok('Home still has: preview card, 3 round buttons, 4 shortcuts, banner carousel, 6 announcements, chat button, 5 nav items', await pg.locator('#v0 .card3d').count()==1 and await pg.locator('#v0 .qa button').count()==3 and await pg.locator('#v0 .tile').count()==4 and await pg.locator('#cr .bn').count()>=3 and await pg.locator('#v0 .nc').count()==6 and await pg.is_visible('#fab') and await pg.locator('#nv .ni').count()==5)
        await pg.click('#v0 .nc >> nth=0'); await pg.wait_for_selector('#anp.on .ap-t'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        await pg.evaluate("(()=>{const c=document.querySelector('#cr');c.scrollLeft=c.children[2].offsetLeft+c.children[2].offsetWidth/2-c.clientWidth/2})()"); await pg.wait_for_timeout(500)
        ok('announcements and banner carousel still interactive (open page / slide)', await pg.locator('#dt i.a').count()==1)
        await pg.evaluate("document.querySelector('#v0').scrollTo(0,99999)"); await pg.wait_for_timeout(300); await pg.screenshot(path='shots/spec-home-bottom.png')
        # ---------- 3. person icon -> ข้อมูลบัตร
        await pg.evaluate("document.querySelector('#v0').scrollTo(0,0)"); await pg.wait_for_timeout(200)
        await pg.click('#v0 [data-act=prof-open]'); await pg.wait_for_selector('#lock.on .pad',timeout=5000)
        ok('card is hidden (DEMO): the person button asks for the passcode first', await pg.locator('#pi.on').count()==0 and await pg.locator('#lock.on .pad').count()==1)
        await keys(pg,'00000000'); await pg.wait_for_selector('#pi.on .pf-body'); await pg.wait_for_timeout(700)
        await pg.screenshot(path='shots/spec-profile.png')
        txt=await pg.inner_text('#pi')
        ok('header: navy bar, round back button, centred title ข้อมูลบัตร', await pg.evaluate("(()=>{const h=document.querySelector('#pi .pf-hd'),x=document.querySelector('#pi .pf-x'),t=document.querySelector('#pi .pf-ttl'),c=getComputedStyle(h),xr=x.getBoundingClientRect();return c.backgroundColor==='rgb(48, 56, 145)'&&Math.abs(xr.width-xr.height)<1&&getComputedStyle(x).borderRadius==='50%'&&t.textContent==='ข้อมูลบัตร'&&getComputedStyle(t).textAlign==='center'})()"))
        for lab in ['รูปหน้าบัตร','รูปหน้าบัตรประจำตัวประชาชน','เลขประจำตัวประชาชน','ที่อยู่','เกิดวันที่','วันที่ออกบัตร','วันที่หมดอายุ']: ok('ข้อมูลบัตร shows label '+lab, lab in txt)
        ok('values come from the saved profile: names, formatted ID number, address, dates (BE)', all(v in txt for v in ['สมหญิง ตัวอย่างดี','Somying Sample','0-0000-00000-00-1','99 หมู่ที่ 9 ซอยตัวอย่าง 1 ถนนตัวอย่าง ตำบลตัวอย่าง อำเภอตัวอย่าง จังหวัดตัวอย่าง 10000','15 พ.ค. 2533','15 ม.ค. 2567','14 ม.ค. 2575']), txt[:400])
        ph=await pg.evaluate("(()=>{const i=document.querySelector('#pi .pf-photo img'),r=i.getBoundingClientRect();return {src:i.src.slice(0,14),nw:i.naturalWidth,nh:i.naturalHeight,w:Math.round(r.width),h:Math.round(r.height),op:getComputedStyle(i).opacity}})()")
        ok('photo area (as in the reference): large portrait picture, the supplied silhouette until a profile picture is saved, ~271px wide, not stretched', ph['src']=='data:image/png' and ph['nw']==340 and ph['nh']==447 and abs(ph['w']-271)<=2 and abs(ph['w']/ph['h']-340/447)<0.03 and ph['op']=='1', ph)
        ok('card has no small round avatar, no caption labels and no edit button (read-only like the reference)', await pg.locator('#pi .pf-av').count()==0 and await pg.locator('#pi .pf-cap').count()==0 and await pg.locator('#pi [data-act=prof-edit]').count()==0 and await pg.locator('#pi .pf-card > *').count()==5)
        ok('card order: Thai name, English name, ที่อยู่, เกิดวันที่, then issue | expiry side by side', await pg.evaluate("(()=>{const c=[...document.querySelector('#pi .pf-card').children].map(e=>e.className+':'+(e.querySelector('b')?.textContent||''));return c[0]==='pf-name:'&&c[1]==='pf-sub:'&&c[2]==='pf-f:ที่อยู่'&&c[3]==='pf-f:เกิดวันที่'&&c[4].startsWith('pf-2')})()"))
        ok('the line "ข้อมูลที่คุณบันทึกเองในหน้าตั้งค่า · DocPocket ไม่ตรวจสอบ …" is gone from ข้อมูลบัตร', 'ไม่ตรวจสอบ' not in await pg.inner_text('#pi') and await pg.locator('#pi .ffnote').count()==0)
        ok('one profile screen only (no second profile)', await pg.locator('[id=pi]').count()==1 and await pg.locator('#pi .pf-card').count()==1)
        await pg.click('#pi [data-act=prof-close]'); await pg.wait_for_timeout(600); ok('back arrow returns to Home', await pg.locator('#pi.on').count()==0 and await pg.locator('#v0.on').count()==1)
        # existing document interactions
        c0=await pg.eval_on_selector('.card3d','e=>e.classList.contains("f")'); await pg.click('#v0 .qa [data-act=flip]'); await pg.wait_for_timeout(300); ok('front/back flip still works', await pg.eval_on_selector('.card3d','e=>e.classList.contains("f")')!=c0)
        await pg.click('#v0 [data-act=open-view]'); await pg.wait_for_selector('#vwr.on'); await pg.wait_for_timeout(700); ok('ขยายรูปบัตร still opens the enlarged preview with 2 independent faces', await pg.locator('#vwr .vfc').count()==2 and await pg.locator('#vwr .vfc img').count()==2); await pg.click('#vwr [data-act=view-close]'); await pg.wait_for_timeout(700)
        # ---------- 4. Settings form
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_selector('#v4.on #pf'); await pg.wait_for_timeout(500); await pg.screenshot(path='shots/spec-settings.png')
        ok('Settings titles: ตั้งค่า then แก้ไขข้อมูลบัตร', await pg.evaluate("(()=>{const a=document.querySelector('#v4 .mh span').textContent,h=document.querySelector('#v4 .cardh');return a==='ตั้งค่า'&&h.textContent==='แก้ไขข้อมูลบัตร'&&h.getBoundingClientRect().top>document.querySelector('#v4 .mh').getBoundingClientRect().top})()"))
        labs=await pg.eval_on_selector_all('#pf label','e=>e.map(x=>x.textContent)'); ok('the 8 fields are in the required order', labs==['ชื่อ-สกุล','ชื่อ-สกุล (อังกฤษ)','เลขประจำตัวประชาชน (13 หลัก)','ที่อยู่','วันที่ออกบัตร','เลขสมาชิก (12 หลัก)','วันเกิด','วันหมดอายุ'], labs)
        ok('dates are date pickers; names/address text; วันเกิด on the left, วันหมดอายุ on the right', await pg.evaluate("(()=>{const q=s=>document.querySelector(s);return q('#c5').type==='date'&&q('#c7').type==='date'&&q('#c8').type==='date'&&q('#c1').type==='text'&&q('#c4').tagName==='TEXTAREA'&&q('#c7').getBoundingClientRect().left<q('#c8').getBoundingClientRect().left&&Math.abs(q('#c7').getBoundingClientRect().top-q('#c8').getBoundingClientRect().top)<2})()"))
        ok('saved values are shown when opening Settings (nothing erased)', await pg.input_value('#c1')=='สมหญิง ตัวอย่างดี' and await pg.input_value('#c3')=='0-0000-00000-00-1' and await pg.input_value('#c6')=='0000 0000 0000' and await pg.input_value('#c5')=='2024-01-15' and await pg.input_value('#c7')=='1990-05-15' and await pg.input_value('#c8')=='2032-01-14' and 'ตัวอย่าง 1' in await pg.input_value('#c4'))
        ok('buttons บันทึก + รีเซ็ตเป็นค่าเริ่มต้น, then the exact DEMO sentence directly under them (left aligned, muted)', await pg.evaluate("(()=>{const b=[...document.querySelectorAll('#pf .cbtn button')].map(x=>x.textContent.trim()),d=document.querySelector('#v4 .cdemo'),r=document.querySelector('#pf .cbtn').getBoundingClientRect(),dr=d.getBoundingClientRect(),c=getComputedStyle(d);return b[0]==='บันทึก'&&b[1]==='รีเซ็ตเป็นค่าเริ่มต้น'&&d.textContent==='ข้อมูลทั้งหมดเป็นข้อมูลสมมติ (DEMO) เก็บไว้ในเบราว์เซอร์นี้เท่านั้น'&&dr.top>=r.bottom&&dr.top-r.bottom<60&&c.textAlign==='left'&&c.fontSize==='12px'&&dr.right<=innerWidth})()"))
        # edit + validation message visible
        await pg.fill('#c3','1234567890123'); await pg.click('#pf button[type=submit]'); ok('invalid ID number shows a clear message (not silent)', 'ไม่ถูกต้อง' in await pg.inner_text('#pe') and await pg.is_visible('#pe'))
        await pg.fill('#c1',''); await pg.click('#pf button[type=submit]'); ok('empty name is refused with a message', 'ชื่อ-สกุล' in await pg.inner_text('#pe'))
        long='123/456 หมู่ที่ 12 ซอยสุขสบายใจมากมาย 99 ถนนตัวอย่างยาวมากเป็นพิเศษ ตำบลบางตัวอย่างใหญ่ อำเภอเมืองตัวอย่างเหนือ จังหวัดนครศรีตัวอย่างธานี 80000'
        await pg.fill('#c1','พิชญา ทดสอบระบบ'); await pg.fill('#c2','Pitchaya Tadsob'); await pg.fill('#c3','0000000000001'); await pg.fill('#c4',long); await pg.fill('#c5','2023-03-17'); await pg.fill('#c6','123456789012'); await pg.fill('#c7','2001-12-31'); await pg.fill('#c8','2031-03-16')
        # unsaved edits survive leaving Settings
        await pg.click('#nv > :nth-child(2)'); await pg.wait_for_timeout(300); await pg.click('#nv > :nth-child(5)'); await pg.wait_for_selector('#pf'); ok('unsaved edits are not lost by switching tabs', await pg.input_value('#c1')=='พิชญา ทดสอบระบบ' and await pg.input_value('#c4')==long)
        await pg.click('#pf button[type=submit]'); await pg.wait_for_function("document.querySelector('#ts').textContent.includes('บันทึกข้อมูลบัตรแล้ว')"); ok('save shows a clear success message', True)
        ok('after saving, the form shows the saved (formatted) values', await pg.input_value('#c6')=='1234 5678 9012' and await pg.input_value('#c4')==long)
        # ---------- 5. one source of truth
        ok('header name updated everywhere', 'พิชญา ทดสอบระบบ' in await pg.inner_text('#hdr .hname'))
        await pg.click('#nv > :nth-child(1)'); await pg.wait_for_selector('#v0.on'); await pg.click('#v0 [data-act=prof-open]'); await pg.wait_for_selector('#pi.on')
        if await pg.locator('#lock.on').count(): await keys(pg,'00000000'); await pg.wait_for_selector('#pi.on .pf-body'); await pg.wait_for_timeout(500)
        txt=await pg.inner_text('#pi'); ok('ข้อมูลบัตร shows the new Settings values (name, English, ID, address, dates)', all(v in txt for v in ['พิชญา ทดสอบระบบ','Pitchaya Tadsob','0-0000-00000-00-1',long,'17 มี.ค. 2566','31 ธ.ค. 2544','16 มี.ค. 2574']), txt[:300])
        ok('long address wraps over several lines and stays inside the card', await pg.evaluate("(()=>{const f=[...document.querySelectorAll('#pi .pf-f')].find(x=>x.textContent.startsWith('ที่อยู่')).querySelector('span'),c=document.querySelector('#pi .pf-card').getBoundingClientRect(),r=f.getBoundingClientRect();return r.height>40&&r.right<=c.right&&f.scrollWidth<=f.clientWidth+1})()"))
        await pg.screenshot(path='shots/spec-profile-edited.png')
        await pg.click('#pi [data-act=prof-close]'); await pg.wait_for_timeout(500); await pg.click('#nv > :nth-child(5)'); await pg.wait_for_selector('#v4.on #pf'); await pg.wait_for_timeout(500)
        # profile picture synchronisation
        await pg.set_input_files('#avf','fixtures/back.jpg'); await pg.wait_for_function("document.querySelector('#ts').textContent.includes('เปลี่ยนรูปโปรไฟล์')",timeout=15000); await pg.wait_for_timeout(500)
        hs=await pg.get_attribute('#hdr .avb img','src'); ok('profile picture changed in Settings shows in the header', hs.startswith('blob:') or hs.startswith('data:image/jpeg'), hs[:30])
        await pg.click('#nv > :nth-child(1)'); await pg.click('#v0 [data-act=prof-open]'); await pg.wait_for_selector('#pi.on')
        if await pg.locator('#lock.on').count(): await keys(pg,'00000000'); await pg.wait_for_selector('#pi.on .pf-body')
        ps=await pg.get_attribute('#pi .pf-phimg','src'); ok('the same uploaded profile picture fills the photo area on ข้อมูลบัตร (one image, no hard-coded copy)', ps==hs, (ps[:30],hs[:30])); await pg.click('#pi [data-act=prof-close]'); await pg.wait_for_timeout(500)
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_selector('#pf'); await pg.click('[data-act=avatar-del]'); await pg.wait_for_timeout(700)
        await pg.click('#nv > :nth-child(1)'); await pg.click('#v0 [data-act=prof-open]'); await pg.wait_for_selector('#pi.on')
        if await pg.locator('#lock.on').count(): await keys(pg,'00000000'); await pg.wait_for_selector('#pi.on .pf-body')
        ok('removing it brings the neutral silhouette back on ข้อมูลบัตร', (await pg.get_attribute('#pi .pf-phimg','src')).startswith('data:image/png')); await pg.click('#pi [data-act=prof-close]'); await pg.wait_for_timeout(500)
        # cleared fields show "-"
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_selector('#pf')
        for i in ('c2','c3','c4','c5','c6','c7','c8'): await pg.fill('#'+i,'')
        await pg.click('#pf button[type=submit]'); await pg.wait_for_function("document.querySelector('#ts').textContent.includes('บันทึกข้อมูลบัตรแล้ว')"); await pg.wait_for_timeout(400)
        await pg.click('#nv > :nth-child(1)'); await pg.click('#v0 [data-act=prof-open]'); await pg.wait_for_selector('#pi.on')
        if await pg.locator('#lock.on').count(): await keys(pg,'00000000'); await pg.wait_for_selector('#pi.on .pf-body')
        vals=await pg.eval_on_selector_all('#pi .pf-f span, #pi .pf-sub, #pi .pf-idnum','e=>e.map(x=>x.textContent.trim())'); ok('empty fields show "-" and no sample data', all(v=='-' for v in vals) and 'SAMPLE' not in await pg.inner_text('#pi'), vals); await pg.click('#pi [data-act=prof-close]'); await pg.wait_for_timeout(500)
        # reset with confirmation
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_selector('#pf'); await pg.fill('#c2','Edited Name'); await pg.click('#pf [data-act=card-reset-ask]'); await pg.wait_for_selector('#sh.on'); ok('reset asks for confirmation first', 'รีเซ็ตเป็นค่าเริ่มต้น?' in await pg.inner_text('#sh') and await pg.locator('#sh [data-act=card-reset]').count()==1)
        await pg.click('#sh [data-act=sheet-close]'); await pg.wait_for_timeout(400); ok('cancelling changes nothing (typed text kept, saved data untouched)', await pg.input_value('#c2')=='Edited Name')
        await pg.click('#pf [data-act=card-reset-ask]'); await pg.wait_for_selector('#sh.on'); await pg.click('#sh [data-act=card-reset]'); await pg.wait_for_timeout(700)
        ok('confirming restores the original fictional DEMO values everywhere', await pg.input_value('#c1')=='สมหญิง ตัวอย่างดี' and await pg.input_value('#c2')=='Somying Sample' and await pg.input_value('#c3')=='0-0000-00000-00-1' and await pg.input_value('#c7')=='1990-05-15' and 'สมหญิง ตัวอย่างดี' in await pg.inner_text('#hdr .hname'))
        await b.close()
        # ---------- brand-new user: no data -> "-" and the neutral placeholder photo
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},locale='th-TH',has_touch=True,is_mobile=True); pg=await ctx.new_page()
        pg.on('pageerror',lambda e: errs.append('pageerror '+str(e)))
        await pg.goto(BASE+'?login'); await pg.wait_for_selector('#auth'); await pg.click('[data-m=up]'); await pg.fill('#ae','new@example.com'); await pg.fill('#ap','correct-horse-9'); await pg.check('input[name=consent]'); await pg.click('button[type=submit]'); await pg.wait_for_function("document.querySelector('#am').textContent.includes('สมัครสำเร็จ')")
        await pg.click('[data-m=in]'); await pg.fill('#ae','new@example.com'); await pg.fill('#ap','correct-horse-9'); await pg.click('button[type=submit]'); await pg.wait_for_selector('#v0.on .qa'); await pg.wait_for_timeout(400)
        await pg.click('#v0 [data-act=prof-open]'); await pg.wait_for_selector('#pi.on .pf-body'); await pg.wait_for_timeout(400)
        ok('new user: no card photo -> the supplied neutral placeholder, actually visible (not a stock photo)', await pg.locator('#pi .pf-photo img.pf-phimg').count()==1 and (await pg.get_attribute('#pi .pf-photo img.pf-phimg','src')).startswith('data:image/png') and await pg.evaluate("(()=>{const i=document.querySelector('#pi .pf-photo img.pf-phimg'),r=i.getBoundingClientRect();return i.naturalWidth===340&&i.naturalHeight===447&&getComputedStyle(i).opacity==='1'&&Math.abs(r.width/r.height-340/447)<0.03&&r.width>150})()"))
        vals=await pg.eval_on_selector_all('#pi .pf-f span, #pi .pf-sub, #pi .pf-idnum, #pi .pf-name','e=>e.map(x=>x.textContent.trim())'); ok('new user: every field shows "-"', all(v=='-' for v in vals), vals)
        await pg.screenshot(path='shots/spec-profile-empty.png'); await b.close()
    ok('no console / page errors',not errs,errs[:3]); print(f'{sum(res)}/{len(res)} spec-update checks passed')
asyncio.run(main())
