# Uploading your own banner picture (Settings > Home: banners and announcements > banner editor). Test build on :8765, DEMO mode.
import asyncio
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:8765/index.html?demo'
res=[]
def ok(n,c,x=''):
    c=bool(c);res.append(c);print(('PASS ' if c else 'FAIL ')+n+('' if c else f' — {x}'))
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,locale='th-TH',has_touch=True,is_mobile=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append('pageerror '+str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'upload' not in m.text and 'googleapis' not in m.text and 'ERR_' not in m.text else None)
        await pg.goto(BASE); await pg.wait_for_selector('#v0.on .pimg.ok',timeout=60000)
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300)
        await pg.click('#v4 [data-act=bn-edit][data-i=new]'); await pg.wait_for_selector('#bnf')
        ok('banner editor offers "อัปโหลดรูปแบนเนอร์ของฉัน" and the size hint', 'อัปโหลดรูปแบนเนอร์ของฉัน' in await pg.inner_text('#bnup') and '1064×248' in await pg.inner_text('#bnup') and await pg.locator('#bnup [data-act=bn-img-del]').count()==0)
        await pg.set_input_files('#bnfile','fixtures/bad.txt'); await pg.wait_for_timeout(300); ok('a text file is refused and the editor does not open', await pg.locator('#ed.on').count()==0 and 'JPG' in await pg.inner_text('#ts'))
        await pg.set_input_files('#bnfile','fixtures/evil.jpg'); await pg.wait_for_timeout(300); ok('an .exe renamed .jpg is refused', await pg.locator('#ed.on').count()==0)
        await pg.set_input_files('#bnfile','fixtures/front.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.wait_for_timeout(300)
        chips=await pg.eval_on_selector_all('#ed .chips button','e=>e.map(x=>x.textContent)'); ok('framing editor offers only the banner frame (4.3:1)', chips==['แบนเนอร์ 4.3:1'], chips)
        cw=await pg.eval_on_selector('#edc','e=>[e.clientWidth,e.clientHeight]'); ok('crop frame has the banner ratio', abs(cw[0]/cw[1]-1064/248)<0.1, cw)
        await pg.eval_on_selector('#edz','e=>{e.value=1.6;e.dispatchEvent(new Event("input",{bubbles:true}))}'); await pg.click('#ed [data-act=ed-reset]'); await pg.wait_for_timeout(100); ok('reset keeps the banner frame', '100%' in await pg.inner_text('#edzl') and 'on' in (await pg.get_attribute('#ed .chips button','class') or ''))
        await pg.click('#ed [data-act=ed-cancel]'); await pg.wait_for_timeout(200); ok('cancel leaves the editor without a picture', await pg.locator('#bnpv .bn-pic').count()==0)
        await pg.set_input_files('#bnfile','fixtures/front.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.eval_on_selector('#edz','e=>{e.value=1.5;e.dispatchEvent(new Event("input",{bubbles:true}))}'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_selector('#bnpv .bn-pic'); await pg.wait_for_timeout(300)
        d=await pg.eval_on_selector('#bnpv .bn-pic','e=>[e.naturalWidth,e.naturalHeight]'); ok('live preview shows the picture, stored size 2128x496', d==[2128,496], d)
        ok('controls switch to "เปลี่ยนรูป" + "ลบรูป" and say it is unsaved', 'เปลี่ยนรูปแบนเนอร์' in await pg.inner_text('#bnup') and await pg.locator('#bnup [data-act=bn-img-del]').count()==1 and 'กด “บันทึก”' in await pg.inner_text('#bnup'))
        await pg.screenshot(path='shots/bn-editor.png')
        await pg.click('#bnf button[type=submit]'); await pg.wait_for_timeout(900)
        ok('picture-only banner can be saved (no text needed)', await pg.locator('#sh.on').count()==0 and await pg.locator('#v4 [data-act=bn-edit]:not([data-i=new])').count()==3)
        ok('Settings list shows a thumbnail for it', await pg.locator('#v4 .bnsw img.ok').count()==1 or await pg.locator('#v4 .bnsw img').count()==1)
        await pg.click('#nv > :nth-child(1)'); await pg.wait_for_selector('#v0.on #cr'); await pg.wait_for_timeout(900)
        ok('Home carousel now has 3 banners (dots) and one is the picture', await pg.locator('#dt i').count()==3 and await pg.locator('#cr .bn.bimg').count()>=1)
        await pg.wait_for_selector('#cr .bn-pic.ok',state='attached',timeout=10000)
        hd=await pg.eval_on_selector('#cr .bn-pic.ok','e=>[e.naturalWidth,e.naturalHeight]'); ok('Home loads the saved picture from storage (2128x496)', hd==[2128,496], hd)
        ok('picture fills the banner (same size as the text banners)', await pg.evaluate("(()=>{const a=document.querySelector('#cr .bn.bimg').getBoundingClientRect(),t=document.querySelector('#cr .bn:not(.bimg)').getBoundingClientRect();return Math.abs(a.width-t.width)<1&&Math.abs(a.height-t.height)<1})()"))
        await pg.evaluate("(()=>{const c=document.querySelector('#cr'),e=[...c.children].find(x=>x.classList.contains('bimg')&&x.getAttribute('aria-hidden')!=='true');c.scrollLeft=e.offsetLeft+e.offsetWidth/2-c.clientWidth/2})()"); await pg.wait_for_timeout(600); await pg.screenshot(path='shots/bn-home.png')
        # edit again: replace picture, then remove it and add text
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=bn-edit][data-i="2"]'); await pg.wait_for_selector('#bnf'); await pg.wait_for_timeout(500)
        ok('editing shows the saved picture in the preview with change/remove buttons', await pg.locator('#bnpv .bn-pic').count()==1 and await pg.locator('#bnup [data-act=bn-img-del]').count()==1 and 'เปลี่ยนรูปแบนเนอร์' in await pg.inner_text('#bnup'))
        await pg.set_input_files('#bnfile','fixtures/back.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_selector('#bnup .bnhint'); await pg.wait_for_timeout(300); await pg.click('#bnf button[type=submit]'); await pg.wait_for_timeout(900)
        await pg.click('#nv > :nth-child(1)'); await pg.wait_for_timeout(900); await pg.wait_for_selector('#cr .bn-pic.ok',state='attached',timeout=10000); ok('replacing the picture works (still 3 banners)', await pg.locator('#dt i').count()==3)
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=bn-edit][data-i="2"]'); await pg.wait_for_selector('#bnf'); await pg.click('#bnup [data-act=bn-img-del]'); await pg.wait_for_timeout(200)
        ok('remove picture: preview goes back to a designed banner, upload button returns', await pg.locator('#bnpv .bn-pic').count()==0 and 'อัปโหลดรูปแบนเนอร์ของฉัน' in await pg.inner_text('#bnup'))
        await pg.click('#bnf button[type=submit]'); await pg.wait_for_timeout(500); ok('a banner with no picture and no text is refused', 'อย่างน้อยหนึ่งอย่าง' in await pg.inner_text('#bne'))
        await pg.fill('#b1','ข้อความแทนรูป'); await pg.click('#bnf button[type=submit]'); await pg.wait_for_timeout(900)
        await pg.click('#nv > :nth-child(1)'); await pg.wait_for_timeout(900); ok('after removing the picture the banner is a text banner again', await pg.locator('#cr .bn.bimg').count()==0 and 'ข้อความแทนรูป' in await pg.inner_text('#cr'))
        # delete a banner that has a picture
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=bn-edit][data-i=new]'); await pg.wait_for_selector('#bnf'); await pg.set_input_files('#bnfile','fixtures/front.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_selector('#bnpv .bn-pic'); await pg.click('#bnf button[type=submit]'); await pg.wait_for_timeout(900)
        ok('4 banners now (2 default + text + picture)', await pg.locator('#v4 [data-act=bn-edit]:not([data-i=new])').count()==4); await pg.click('#v4 [data-act=bn-edit][data-i="3"]'); await pg.wait_for_selector('#bnf'); await pg.click('[data-act=bn-del]'); await pg.wait_for_timeout(700); ok('deleting the picture banner removes only that one', await pg.locator('#v4 [data-act=bn-edit]:not([data-i=new])').count()==3 and await pg.locator('#v4 .bnsw img').count()==0)
        await pg.click('#v4 [data-act=bn-edit][data-i=new]'); await pg.wait_for_selector('#bnf'); await pg.set_input_files('#bnfile','fixtures/front.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_selector('#bnpv .bn-pic'); await pg.click('#bnf button[type=submit]'); await pg.wait_for_timeout(900)
        await pg.click('#v4 [data-act=home-reset-ask]'); await pg.click('[data-act=home-reset]'); await pg.wait_for_timeout(600); ok('"คืนค่าเริ่มต้น" removes picture banners too', await pg.locator('#v4 [data-act=bn-edit]:not([data-i=new]) img').count()==0 and 'คลังเอกสารออนไลน์' in await pg.inner_text('#v4'))
        await b.close()
    ok('no console / page errors',not errs,errs[:3]); print(f'{sum(res)}/{len(res)} banner checks passed')
asyncio.run(main())
