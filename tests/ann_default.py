# One uploaded picture as the default icon of all announcements (Settings > Home: banners and announcements > ไอคอนเริ่มต้นของประกาศทั้งหมด).
import asyncio
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:8765/index.html?demo'
res=[]
def ok(n,c,x=''):
    c=bool(c);res.append(c);print(('PASS ' if c else 'FAIL ')+n+('' if c else f' — {x}'))
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,locale='th-TH',has_touch=True,is_mobile=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append('pageerror '+str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'default announcement' not in m.text and 'googleapis' not in m.text and 'ERR_' not in m.text else None)
        await pg.goto(BASE); await pg.wait_for_selector('#v0.on .pimg.ok',timeout=60000)
        ok('before: announcements use the DocPocket icon (no picture)', await pg.locator('#v0 .nc img.nc-pic').count()==0 and await pg.locator('#v0 .nc span.nc-ic').count()==6)
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300)
        ok('Settings has "ไอคอนเริ่มต้นของประกาศทั้งหมด" (currently DocPocket icon)', 'ไอคอนเริ่มต้นของประกาศทั้งหมด' in await pg.inner_text('#v4') and 'ใช้ไอคอน DocPocket' in await pg.inner_text('#v4 [data-act=anpic-edit]'))
        # an announcement with its own picture and one with another built-in icon must keep theirs
        await pg.click('#v4 [data-act=an-edit][data-i=new]'); await pg.wait_for_selector('#anf'); await pg.fill('#a1','มีรูปของตัวเอง'); await pg.set_input_files('#anfile','fixtures/back.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_selector('#anup .nc-pic'); await pg.click('#anf button[type=submit]'); await pg.wait_for_timeout(900)
        await pg.click('#v4 [data-act=an-edit][data-i=new]'); await pg.wait_for_selector('#anf'); await pg.fill('#a1','ไอคอนโล่'); await pg.click('.icb:has(input[value=shield])'); await pg.click('#anf button[type=submit]'); await pg.wait_for_timeout(900)
        await pg.click('#v4 [data-act=anpic-edit]'); await pg.wait_for_selector('#sh.on #anpfile',state='attached'); await pg.wait_for_timeout(300)
        ok('sheet explains the rule and offers upload', 'ทุกประกาศที่ไม่ได้ใส่รูปของตัวเอง' in await pg.inner_text('#sh') and 'อัปโหลดรูปของฉัน' in await pg.inner_text('#sh') and await pg.locator('#sh [data-act=anpic-del]').count()==0)
        await pg.set_input_files('#anpfile','fixtures/bad.txt'); await pg.wait_for_timeout(300); ok('a text file is refused', await pg.locator('#ed.on').count()==0 and 'JPG' in await pg.inner_text('#ts'))
        await pg.set_input_files('#anpfile','fixtures/front.jpg'); await pg.wait_for_selector('#ed.on #edc'); chips=await pg.eval_on_selector_all('#ed .chips button','e=>e.map(x=>x.textContent)'); ok('framing editor: square frame only', chips==['1:1'], chips)
        await pg.eval_on_selector('#edz','e=>{e.value=2;e.dispatchEvent(new Event("input",{bubbles:true}))}'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_timeout(1000)
        ok('saved straight away: sheet closes and a confirmation is shown', await pg.locator('#sh.on').count()==0 and 'ไอคอนเริ่มต้นของประกาศทั้งหมดแล้ว' in await pg.inner_text('#ts'))
        ok('Settings row now says "ใช้รูปของฉัน" with the picture', 'ใช้รูปของฉัน' in await pg.inner_text('#v4 [data-act=anpic-edit]') and await pg.locator('#v4 [data-act=anpic-edit] img.nc-pic').count()==1)
        await pg.click('#nv > :nth-child(1)'); await pg.wait_for_selector('#v0.on .nc'); await pg.wait_for_timeout(1000)
        n=await pg.locator('#v0 .nc').count(); pics=await pg.eval_on_selector_all('#v0 .nc img.nc-pic.ok','e=>e.map(x=>[x.naturalWidth,x.src])'); sh=await pg.locator('#v0 .nc:has-text("ไอคอนโล่") .nc-g svg').count(); own=await pg.evaluate("(()=>{const e=[...document.querySelectorAll('#v0 .nc')].find(x=>x.textContent.includes('มีรูปของตัวเอง'));const i=e&&e.querySelector('img.nc-pic');return i?i.src:null})()")
        defaults=[x for x in pics if x[1]!=own]
        ok('all 6 standard announcements now use the uploaded picture (256x256)', len(defaults)==6 and all(w==256 for w,_ in defaults) and n==8, (n,len(pics),len(defaults)))
        ok('an announcement with its own picture keeps its own, one with the shield icon keeps the shield', own is not None and own not in [d[1] for d in defaults] and sh==1)
        dd=await pg.eval_on_selector('#v0 .nc img.nc-pic','e=>[Math.round(e.getBoundingClientRect().width),getComputedStyle(e).borderRadius]'); ok('shown as the normal round 19px icon', dd==[19,'50%'], dd)
        await pg.click('#v0 .nc >> nth=0'); await pg.wait_for_selector('#anp.on .ap-ic'); await pg.wait_for_timeout(700); ok('announcement page uses it too', await pg.locator('#anp img.ap-ic.ok').count()==1); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        await pg.click('#hdr [data-act=bell]'); await pg.wait_for_selector('#sh.on'); await pg.wait_for_timeout(700); ok('notification list uses it', await pg.locator('#sh img.ai2.nc-pic.ok').count()>=6); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=an-edit][data-i=new]'); await pg.wait_for_selector('#anf'); await pg.wait_for_timeout(400)
        ok('a NEW announcement without picture/icon choice uses the default; editor says so', 'ไอคอนเริ่มต้นที่คุณตั้งไว้' in await pg.inner_text('#anup') and await pg.locator('#anf .icb:first-child img.nc-pic').count()==1)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # replace, then remove
        await pg.click('#v4 [data-act=anpic-edit]'); await pg.wait_for_selector('#sh.on #anpfile',state='attached'); await pg.wait_for_timeout(300); ok('sheet offers change + "กลับไปใช้ไอคอน DocPocket"', 'เปลี่ยนรูป' in await pg.inner_text('#sh') and await pg.locator('#sh [data-act=anpic-del]').count()==1)
        await pg.set_input_files('#anpfile','fixtures/back.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_timeout(1000)
        await pg.click('#nv > :nth-child(1)'); await pg.wait_for_timeout(900); ok('replacing the default works', await pg.locator('#v0 .nc img.nc-pic.ok').count()>=7)
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=anpic-edit]'); await pg.wait_for_selector('#sh.on'); await pg.click('#sh [data-act=anpic-del]'); await pg.wait_for_timeout(900)
        await pg.click('#nv > :nth-child(1)'); await pg.wait_for_timeout(900); ok('removing it brings the DocPocket icon back (own picture and shield untouched)', await pg.locator('#v0 .nc img.nc-pic').count()==1 and await pg.locator('#v0 .nc:has-text("ไอคอนโล่") .nc-g svg').count()==1 and 'ใช้ไอคอน DocPocket' in await (await pg.evaluate_handle("document.querySelector('#v4').textContent")).json_value())
        # reset Home clears the default picture as well
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=anpic-edit]'); await pg.wait_for_selector('#sh.on #anpfile',state='attached'); await pg.set_input_files('#anpfile','fixtures/front.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_timeout(1000)
        await pg.click('#v4 [data-act=home-reset-ask]'); await pg.click('[data-act=home-reset]'); await pg.wait_for_timeout(700); ok('"คืนค่าแบนเนอร์และประกาศเริ่มต้น" also clears the default picture', 'ใช้ไอคอน DocPocket' in await pg.inner_text('#v4 [data-act=anpic-edit]'))
        await b.close()
    ok('no console / page errors',not errs,errs[:3]); print(f'{sum(res)}/{len(res)} default-announcement-icon checks passed')
asyncio.run(main())
