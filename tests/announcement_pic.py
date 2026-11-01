# Uploading your own picture as an announcement icon (Settings > Home: banners and announcements > announcement editor). Test build on :8765, DEMO mode.
import asyncio
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:8765/index.html?demo'
res=[]
def ok(n,c,x=''):
    c=bool(c);res.append(c);print(('PASS ' if c else 'FAIL ')+n+('' if c else f' — {x}'))
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,locale='th-TH',has_touch=True,is_mobile=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append('pageerror '+str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'announcement picture' not in m.text and 'googleapis' not in m.text and 'ERR_' not in m.text else None)
        await pg.goto(BASE); await pg.wait_for_selector('#v0.on .pimg.ok',timeout=60000)
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300)
        await pg.click('#v4 [data-act=an-edit][data-i=new]'); await pg.wait_for_selector('#anf')
        ok('announcement editor offers "อัปโหลดรูปของฉัน" above the built-in icons', 'อัปโหลดรูปของฉัน' in await pg.inner_text('#anup') and await pg.locator('#anup [data-act=an-img-del]').count()==0 and 'หรือเลือกไอคอนสำเร็จรูป' in await pg.inner_text('#anf'))
        await pg.fill('#a1','ประกาศที่มีรูปของฉัน'); await pg.fill('#a3','ทดสอบรูปไอคอน')
        await pg.set_input_files('#anfile','fixtures/bad.txt'); await pg.wait_for_timeout(300); ok('a text file is refused', await pg.locator('#ed.on').count()==0 and 'JPG' in await pg.inner_text('#ts'))
        await pg.set_input_files('#anfile','fixtures/evil.jpg'); await pg.wait_for_timeout(300); ok('an .exe renamed .jpg is refused', await pg.locator('#ed.on').count()==0)
        await pg.set_input_files('#anfile','fixtures/front.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.wait_for_timeout(300)
        chips=await pg.eval_on_selector_all('#ed .chips button','e=>e.map(x=>x.textContent)'); ok('framing editor offers only the square frame', chips==['1:1'], chips)
        cw=await pg.eval_on_selector('#edc','e=>[e.clientWidth,e.clientHeight]'); ok('crop frame is square', abs(cw[0]-cw[1])<=1, cw)
        await pg.click('#ed [data-act=ed-cancel]'); await pg.wait_for_timeout(200); ok('cancel changes nothing', await pg.locator('#anup .nc-pic').count()==0)
        await pg.set_input_files('#anfile','fixtures/front.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.eval_on_selector('#edz','e=>{e.value=2;e.dispatchEvent(new Event("input",{bubbles:true}))}'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_selector('#anup .nc-pic'); await pg.wait_for_timeout(300)
        d=await pg.eval_on_selector('#anup .nc-pic','e=>[e.naturalWidth,e.naturalHeight]'); ok('preview shows the picture, stored as 256x256', d==[256,256], d)
        ok('controls switch to change/remove and say it is unsaved', 'เปลี่ยนรูป' in await pg.inner_text('#anup') and await pg.locator('#anup [data-act=an-img-del]').count()==1 and 'กด “บันทึก”' in await pg.inner_text('#anup'))
        await pg.screenshot(path='shots/an-editor.png')
        await pg.click('#anf button[type=submit]'); await pg.wait_for_timeout(900)
        ok('saved: list shows a picture thumbnail in Settings', await pg.locator('#v4 .ai2.nc-pic').count()==1)
        await pg.click('#nv > :nth-child(1)'); await pg.wait_for_selector('#v0.on .nc'); await pg.wait_for_timeout(900)
        card=pg.locator('#v0 .nc:has-text("ประกาศที่มีรูปของฉัน")'); ok('Home announcement card shows the picture as its icon', await card.locator('img.nc-pic.ok').count()==1)
        dd=await card.locator('img.nc-pic.ok').evaluate('e=>[e.naturalWidth,e.naturalHeight,Math.round(e.getBoundingClientRect().width),getComputedStyle(e).borderRadius]'); ok('shown round at the normal icon size (19px)', dd[0]==256 and dd[2]==19 and dd[3]=='50%', dd)
        await card.click(); await pg.wait_for_selector('#anp.on .ap-ic'); await pg.wait_for_timeout(600); ok('announcement page shows the picture large (44px)', await pg.locator('#anp img.ap-ic.ok').count()==1 and await pg.eval_on_selector('#anp img.ap-ic','e=>Math.round(e.getBoundingClientRect().width)')==44)
        await pg.screenshot(path='shots/an-page.png'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        await pg.click('#hdr [data-act=bell]'); await pg.wait_for_selector('#sh.on'); await pg.wait_for_timeout(600); ok('notification list shows it too', await pg.locator('#sh img.ai2.nc-pic').count()>=1); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # replace, then remove -> built-in icon again
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=an-edit]:has-text("ประกาศที่มีรูปของฉัน")'); await pg.wait_for_selector('#anf'); await pg.wait_for_timeout(500)
        ok('editing shows the saved picture with change/remove', await pg.locator('#anup img.nc-pic').count()==1 and await pg.locator('#anup [data-act=an-img-del]').count()==1)
        await pg.click('#anup [data-act=an-img-del]'); await pg.wait_for_timeout(200); ok('remove: preview goes away, upload button returns', await pg.locator('#anup img').count()==0 and 'อัปโหลดรูปของฉัน' in await pg.inner_text('#anup'))
        await pg.click('.icb:has(input[value=shield])'); await pg.click('#anf button[type=submit]'); await pg.wait_for_timeout(900)
        ok('after removing the picture the chosen built-in icon is used', await pg.locator('#v4 .ai2.nc-pic').count()==0 and await pg.locator('#v4 [data-act=an-edit]:has-text("ประกาศที่มีรูปของฉัน") .nc-g svg').count()==1)
        # delete an announcement that has a picture; reset
        await pg.click('#v4 [data-act=an-edit][data-i=new]'); await pg.wait_for_selector('#anf'); await pg.fill('#a1','ลบทีหลัง'); await pg.set_input_files('#anfile','fixtures/back.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_selector('#anup .nc-pic'); await pg.click('#anf button[type=submit]'); await pg.wait_for_timeout(900)
        n=await pg.locator('#v4 [data-act=an-edit]:not([data-i=new])').count(); await pg.click('#v4 [data-act=an-edit]:has-text("ลบทีหลัง")'); await pg.wait_for_selector('#anf'); await pg.click('[data-act=an-del]'); await pg.wait_for_timeout(700)
        ok('deleting a picture announcement removes only that one', await pg.locator('#v4 [data-act=an-edit]:not([data-i=new])').count()==n-1)
        await pg.click('#v4 [data-act=an-edit][data-i=new]'); await pg.wait_for_selector('#anf'); await pg.fill('#a1','อีกอัน'); await pg.set_input_files('#anfile','fixtures/back.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_selector('#anup .nc-pic'); await pg.click('#anf button[type=submit]'); await pg.wait_for_timeout(900)
        await pg.click('#v4 [data-act=home-reset-ask]'); await pg.click('[data-act=home-reset]'); await pg.wait_for_timeout(600); ok('"คืนค่าเริ่มต้น" removes picture announcements too', await pg.locator('#v4 .ai2.nc-pic').count()==0 and await pg.locator('#v4 [data-act=an-edit]:not([data-i=new])').count()==6)
        await b.close()
    ok('no console / page errors',not errs,errs[:3]); print(f'{sum(res)}/{len(res)} announcement-picture checks passed')
asyncio.run(main())
