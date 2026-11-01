# Checks for the 10 test scenarios in the "Upgrade DocPocket" brief (runs against the test build)
import asyncio,zipfile,io,json
from playwright.async_api import async_playwright
U='http://127.0.0.1:8765/index.html'
res=[]
def ok(n,c,x=''):c=bool(c);res.append(c);print(('PASS ' if c else 'FAIL ')+n,'' if c else x)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},accept_downloads=True,locale='th-TH')
        pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.clock.install()
        await pg.goto(U); await pg.wait_for_selector('#v0.on .pimg.ok',timeout=20000); await pg.wait_for_timeout(600)
        hasf=lambda: pg.locator('.card3d.f').count()
        # 1 tap card switches sides
        await pg.click('#v0 .card3d'); await pg.wait_for_timeout(300); a=await hasf(); await pg.click('#v0 .card3d'); await pg.wait_for_timeout(300)
        ok('1. tapping the card switches front/back', a==1 and await hasf()==0)
        # 2/3 expand, rotate, close, reopen
        await pg.click('.qa .pill'); await pg.wait_for_selector('#vwr.on [data-vimg][src]'); await pg.wait_for_timeout(600)
        t0=await pg.eval_on_selector('#vbox','e=>e.style.transform')
        ok('2. ขยายรูปบัตร opens the large view (back + flip buttons only, no rotate button)', 'rotate(90deg)' in t0 and await pg.locator('#vwr [data-act=view-rot]').count()==0 and await pg.locator('#vwr .vt button').count()==2, t0)
        await pg.click('[data-act=view-flip]'); await pg.wait_for_timeout(200); ok('2. switch side inside the large view', await pg.eval_on_selector('#vflip','e=>e.classList.contains("f")'))
        await pg.click('[data-act=view-close]'); await pg.wait_for_timeout(700); ok('3. back button closes; home keeps the side', await pg.locator('#vwr.on').count()==0 and await hasf()==1)
        await pg.click('.qa .pill'); await pg.wait_for_timeout(700); ok('3. reopens on the same side', await pg.eval_on_selector('#vflip','e=>e.classList.contains("f")'))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(700); ok('3. Escape closes the large view', await pg.locator('#vwr.on').count()==0)
        await pg.click('#v0 .card3d'); await pg.wait_for_timeout(200)
        # 4 front/back independent: new doc with BACK only
        await pg.click('#nv > :nth-child(3)'); await pg.wait_for_timeout(300); await pg.fill('#st','เฉพาะด้านหลัง'); await pg.click('[data-act=scan-side][data-side=back]')
        await pg.set_input_files('#fg','fixtures/back.png' if False else 'fixtures/front.jpg'); await pg.wait_for_selector('[data-act=scan-save]'); await pg.click('[data-act=scan-save]')
        await pg.wait_for_selector('#v0.on .face.bk .pimg.ok',timeout=20000); await pg.wait_for_timeout(300)
        ok('4. a back-only document opens on its back side', await hasf()==1 and await pg.locator('#v0 .face:not(.bk) .pimg').count()==0)
        # 5 privacy lock: blur, text, idle re-blur
        await pg.click('#nv > :nth-child(5)'); await pg.click('[data-act=tg-hidepv]'); await pg.click('#nv > :nth-child(1)'); await pg.wait_for_selector('#v0 .rvl')
        ok('5. blurred card shows padlock + คลิกเพื่อแสดงบัตร', 'คลิกเพื่อแสดงบัตร' in await pg.inner_text('#v0 .rvl'))
        await pg.click('#v0 .rvl'); await pg.wait_for_timeout(300); ok('5. tap reveals (no passcode set)', await pg.locator('#v0 .rvl').count()==0)
        await pg.clock.fast_forward('01:10'); await pg.wait_for_timeout(300)
        ok('5. card blurs again after the idle period', await pg.locator('#v0 .rvl').count()==1)
        await pg.click('#nv > :nth-child(5)'); await pg.click('[data-act=tg-hidepv]'); await pg.click('#nv > :nth-child(1)'); await pg.wait_for_timeout(400)
        # 6 every service shortcut
        tiles=[('req','#v3.on'),('cert','#sh.on [data-act=copy-wm]'),('addr','#sh.on [data-act=addr-edit]')]
        for k,sel in tiles:
            await pg.click('#nv > :nth-child(1)'); await pg.wait_for_timeout(300); await pg.keyboard.press('Escape')
            await pg.click(f'#v0 .tile[data-k={k}]'); await pg.wait_for_timeout(500)
            ok(f'6. shortcut {k} works', await pg.locator(sel).count()>0)
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(450)
        await pg.click('#nv > :nth-child(1)'); await pg.wait_for_timeout(400)
        await pg.click('#v0 .tile[data-k=soon]',force=True); await pg.wait_for_timeout(200); ok('6. เร็วๆ นี้ tile shows coming-soon message', 'เร็วๆ นี้' in await pg.inner_text('#ts'))
        labels=await pg.eval_on_selector_all('#v0 .tile','es=>es.map(e=>e.innerText.replace(/\s+/g,""))')
        ok('6. shortcut labels exactly as the reference', labels==['ตรวจสอบคำขอ','การรับรองเอกสาร','การแจ้งย้ายที่อยู่','เร็วๆนี้'], labels)
        # front then back of the SAME new document, then both appear in the large view
        await pg.click('#nv > :nth-child(3)'); await pg.wait_for_timeout(300); await pg.select_option('#sd','new'); await pg.fill('#st','สองด้าน')
        await pg.set_input_files('#fg','fixtures/front.jpg'); await pg.wait_for_selector('[data-act=scan-save]'); await pg.click('[data-act=scan-save]'); await pg.wait_for_selector('#v0.on .face:not(.bk) .pimg.ok',timeout=20000)
        await pg.click('#nv > :nth-child(3)'); await pg.wait_for_timeout(300)
        sel=await pg.eval_on_selector('#sd','e=>e.options[e.selectedIndex].text'); side=await pg.inner_text('#v2 .seg .on')
        ok('after saving the front, Scan stays on the same document and selects the back', sel=='สองด้าน' and side=='ด้านหลัง', (sel,side))
        await pg.set_input_files('#fg','fixtures/back.jpg'); await pg.wait_for_selector('[data-act=scan-save]'); await pg.click('[data-act=scan-save]'); await pg.wait_for_selector('#v0.on .face.bk .pimg.ok',timeout=20000)
        await pg.click('.qa .pill'); await pg.wait_for_selector('#vwr.on [data-vimg=front][src]'); await pg.wait_for_selector('#vwr.on [data-vimg=back][src]'); await pg.wait_for_timeout(400)
        px=lambda side: pg.eval_on_selector(f'[data-vimg={side}]','e=>{const c=document.createElement("canvas");c.width=40;c.height=28;const x=c.getContext("2d");x.drawImage(e,0,0,40,28);return e.naturalWidth?[...x.getImageData(0,0,40,28).data].join(","):""}')
        exp=lambda f: pg.evaluate('''async u=>{const b=await (await fetch(u)).blob();const i=await createImageBitmap(b);const c=document.createElement("canvas");c.width=40;c.height=28;const x=c.getContext("2d");x.drawImage(i,0,0,40,28);return [...x.getImageData(0,0,40,28).data].join(",")}''', f)
        import base64
        du=lambda f: 'data:image/jpeg;base64,'+base64.b64encode(open(f,'rb').read()).decode()
        pf,pb=await px('front'),await px('back'); ef,eb=await exp(du('fixtures/front.jpg')),await exp(du('fixtures/back.jpg'))
        md=lambda a,b: sum(abs(int(x)-int(y)) for x,y in zip(a.split(','),b.split(',')))/max(1,len(a.split(','))) if a and b else 999
        ok('large view shows the uploaded front AND back photos (pixel match)', md(pf,ef)<md(pf,eb) and md(pb,eb)<md(pb,ef), (round(md(pf,ef),2),round(md(pf,eb),2),round(md(pb,eb),2),round(md(pb,ef),2)))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(700)
        # 7 banners swipe + pagination
        await pg.click('#nv > :nth-child(1)'); await pg.wait_for_timeout(400)
        d0=await pg.eval_on_selector('#dt','e=>[...e.children].findIndex(i=>i.classList.contains("a"))')
        await pg.eval_on_selector('#cr','c=>c.scrollBy({left:c.children[1].offsetWidth+8})'); await pg.wait_for_timeout(600)
        d1=await pg.eval_on_selector('#dt','e=>[...e.children].findIndex(i=>i.classList.contains("a"))')
        await pg.eval_on_selector('#cr','c=>c.scrollBy({left:c.children[1].offsetWidth+8})'); await pg.wait_for_timeout(700)
        d2=await pg.eval_on_selector('#dt','e=>[...e.children].findIndex(i=>i.classList.contains("a"))')
        ok('7. swiping moves banners, dots follow, loops round', d1==(d0+1)%2 and d2==d0, (d0,d1,d2))
        # 8 announcements
        n=await pg.locator('#v0 .nc').count(); demo=await pg.locator('#v0 .nc .demo').count()
        await pg.click('#v0 .nc >> nth=0'); await pg.wait_for_selector('#anp.on .ap-t'); t=await pg.inner_text('#anp .ap-t')
        ok('8. announcement opens a full page (Home cards carry no DEMO pill any more: the DEMO VERSION strip replaces it)', t=='ปรับปรุงระบบบัตรดิจิทัล' and n==6 and demo==0 and 'DEMO' in await pg.inner_text('#anp'), (t,n,demo))
        await pg.click('#anp [data-act=ap-list]'); await pg.wait_for_timeout(300); ok('8. page links to the full list', await pg.locator('#anp .nl .nc').count()==6)
        await pg.click('#anp [data-act=ap-close]'); await pg.wait_for_timeout(500); ok('8. back returns home', await pg.locator('#anp.on').count()==0)
        await pg.click('[data-act=bell]'); await pg.wait_for_timeout(300); ok('8. bell lists announcements', await pg.locator('#sh.on [data-act=ann]').count()==6); await pg.keyboard.press('Escape')
        await pg.click('[data-act=power]'); await pg.wait_for_timeout(300); ok('header power button offers lock/logout', await pg.locator('#sh.on [data-act=logout-ask]').count()==1); await pg.keyboard.press('Escape')
        # 9 nav
        for i,v in [(1,0),(2,1),(3,2),(4,3),(5,4)]:
            await pg.click(f'#nv > :nth-child({i})'); await pg.wait_for_timeout(300); ok(f'9. nav item {i} opens its screen', await pg.locator(f'#v{v}.on').count()==1 and len((await pg.inner_text(f'#v{v}')).strip())>20)
        # settings extras: theme + zip export
        await pg.select_option('#th','dark'); ok('settings: dark theme applies', await pg.evaluate("document.documentElement.dataset.theme")=='dark')
        await pg.select_option('#th','light')
        async with pg.expect_download() as d: await pg.click('[data-act=export-zip]')
        dl=await d.value; z=zipfile.ZipFile(io.BytesIO(open(await dl.path(),'rb').read())); names=z.namelist()
        good=z.testzip() is None and any(n.startswith('documents/') for n in names) and 'docpocket-my-data.json' in names and json.loads(z.read('docpocket-my-data.json'))['documents']
        ok('settings: ZIP export of all originals is a valid archive', bool(good), names)
        # 10 small phone
        await pg.set_viewport_size({'width':320,'height':640}); await pg.click('#nv > :nth-child(1)'); await pg.wait_for_timeout(500)
        ow=await pg.evaluate("document.documentElement.scrollWidth<=320 && [...document.querySelectorAll('#v0 .tile')].every(t=>t.getBoundingClientRect().right<=320)")
        ok('10. 320px phone: no sideways overflow', ow)
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print(f'{sum(res)}/{len(res)} brief checks passed')
asyncio.run(main())
