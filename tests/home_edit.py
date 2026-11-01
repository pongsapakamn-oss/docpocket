# Editable Home banners + announcements (Settings) — runs against the test build
import asyncio,os
DIST=os.path.abspath(os.path.dirname(os.path.abspath(__file__))+'/../dist-mock')
from playwright.async_api import async_playwright
res=[]
def ok(n,c,x=''):c=bool(c);res.append(c);print(('PASS ' if c else 'FAIL ')+n,'' if c else x)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,locale='th-TH')
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8765/index.html'); await pg.wait_for_selector('#v0.on .pimg.ok'); await pg.wait_for_timeout(500)
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300)
        ok('settings lists 2 banners and 6 announcements', await pg.locator('#v4 [data-act=bn-edit]:not([data-i=new])').count()==2 and await pg.locator('#v4 [data-act=an-edit]:not([data-i=new])').count()==6)
        # edit banner 1: new text + purple design, live preview
        await pg.click('#v4 [data-act=bn-edit][data-i="0"]'); await pg.wait_for_selector('#bnf')
        await pg.fill('#b1','ร้านกาแฟของฉัน'); await pg.fill('#b2','ลด 10% ทุกวันจันทร์\nสมาชิกเท่านั้น'); await pg.select_option('#bt','b3'); await pg.wait_for_timeout(200)
        ok('banner editor shows a live preview', 'ร้านกาแฟของฉัน' in await pg.inner_text('#bnpv') and 'b3' in (await pg.get_attribute('#bnpv','class')))
        await pg.screenshot(path='shots/e1-bn-edit.png')
        await pg.select_option('#bg','2'); await pg.click('#bnf button[type=submit]'); await pg.wait_for_timeout(500)
        # add a 3rd banner (dark design with small text)
        await pg.click('#v4 [data-act=bn-edit][data-i=new]'); await pg.wait_for_selector('#bnf'); await pg.select_option('#bt','b2'); await pg.fill('#b1','ขอบคุณที่ใช้ DocPocket'); await pg.fill('#b3','ข้อความเล็ก'); await pg.click('#bnf button[type=submit]'); await pg.wait_for_timeout(500)
        # edit announcement 1: title, text, icon, DEMO off
        await pg.click('#v4 [data-act=an-edit][data-i="0"]'); await pg.wait_for_selector('#anf')
        await pg.fill('#a1','ประกาศของฉัน'); await pg.fill('#a3','ข้อความที่ฉันเขียนเอง'); await pg.fill('#a2','2026-11-01'); await pg.click('.icb:has(input[value=shield])'); await pg.uncheck('#anf input[name=demo]')
        await pg.screenshot(path='shots/e2-an-edit.png'); await pg.click('#anf button[type=submit]'); await pg.wait_for_timeout(500)
        # add announcement
        await pg.click('#v4 [data-act=an-edit][data-i=new]'); await pg.wait_for_selector('#anf'); await pg.fill('#a1','ประกาศใหม่'); await pg.fill('#a3','รายละเอียดใหม่'); await pg.click('#anf button[type=submit]'); await pg.wait_for_timeout(500)
        # empty title rejected
        await pg.click('#v4 [data-act=an-edit][data-i=new]'); await pg.wait_for_selector('#anf'); await pg.click('#anf button[type=submit]'); await pg.wait_for_timeout(200)
        ok('announcement without a title is refused', 'หัวข้อ' in await pg.inner_text('#ane')); await pg.keyboard.press('Escape')
        await pg.screenshot(path='shots/e3-settings.png')
        # home shows the edits
        await pg.click('#nv > :nth-child(1)'); await pg.wait_for_timeout(700)
        ok('home carousel has 3 banners with the new text', await pg.locator('#dt i').count()==3 and 'ร้านกาแฟของฉัน' in await pg.inner_text('#cr'))
        first=await pg.inner_text('#v0 .nc >> nth=0'); n=await pg.locator('#v0 .nc').count()
        ok('home announcements updated (newest first, 7 items, own item without DEMO)', 'ประกาศใหม่' in first or 'ประกาศของฉัน' in first and n==7, (first,n))
        ok('edited announcement uses the chosen icon', await pg.locator('#v0 .nc:has-text("ประกาศของฉัน") .nc-g svg').count()==1 and await pg.locator('#v0 .nc:has-text("ประกาศของฉัน") .demo').count()==0)
        await pg.evaluate("document.querySelector('#v0').scrollTo(0,380)"); await pg.wait_for_timeout(500); await pg.screenshot(path='shots/e4-home.png')
        await pg.click('#v0 .nc:has-text("ประกาศของฉัน")'); await pg.wait_for_selector('#anp.on'); ok('announcement page shows the edited text', 'ข้อความที่ฉันเขียนเอง' in await pg.inner_text('#anp')); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        # banner tap goes where chosen (Scan)
        await pg.evaluate("(()=>{const c=document.querySelector('#cr');c.scrollLeft=c.children[1].offsetLeft+c.children[1].offsetWidth/2-c.clientWidth/2})()"); await pg.wait_for_timeout(400)
        await pg.click('#cr .bn:nth-child(2)'); await pg.wait_for_timeout(400); ok('tapping the edited banner opens the chosen screen (Scan)', await pg.locator('#v2.on').count()==1)
        # edits survive closing and reopening the app (test build has no server, so this checks the device copy)
        await pg.reload(); await pg.wait_for_selector('#v0.on .pimg.ok'); await pg.wait_for_timeout(800)
        ok('banner and announcement edits are still there after reloading', 'ร้านกาแฟของฉัน' in await pg.inner_text('#cr') and await pg.locator('#v0 .nc:has-text("ประกาศของฉัน")').count()==1)
        # delete + reset
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=bn-edit][data-i="2"]'); await pg.click('[data-act=bn-del]'); await pg.wait_for_timeout(400)
        ok('banner can be deleted', await pg.locator('#v4 [data-act=bn-edit]:not([data-i=new])').count()==2)
        await pg.click('#v4 [data-act=home-reset-ask]'); await pg.click('[data-act=home-reset]'); await pg.wait_for_timeout(400)
        ok('reset restores the default banners and announcements', await pg.locator('#v4 [data-act=an-edit]:not([data-i=new])').count()==6 and 'คลังเอกสารออนไลน์' in await pg.inner_text('#v4'))
        # saving also works inside an embedded preview that blocks form submission (sandbox without allow-forms)
        open(DIST+'/sbx2.html','w').write('<!doctype html><body style="margin:0"><iframe sandbox="allow-scripts allow-downloads" src="index.html" style="width:390px;height:844px;border:0"></iframe>')
        sp=await b.new_page(viewport={'width':400,'height':860}); await sp.goto('http://127.0.0.1:8765/sbx2.html'); await sp.wait_for_timeout(500)
        fr=[f for f in sp.frames if f.url.endswith('index.html')][0]; await fr.wait_for_selector('#v0.on .pimg.ok',timeout=20000)
        await fr.click('#nv > :nth-child(5)'); await sp.wait_for_timeout(300); await fr.click('#v4 [data-act=an-edit][data-i="0"]'); await fr.wait_for_selector('#anf')
        await fr.fill('#a1','บันทึกในพรีวิว'); await fr.click('#anf button[type=submit]'); await sp.wait_for_timeout(600)
        ok('announcement saves inside a sandboxed preview', 'บันทึกในพรีวิว' in await fr.inner_text('#v4'))
        await fr.click('#v4 [data-act=bn-edit][data-i="0"]'); await fr.wait_for_selector('#bnf'); await fr.fill('#b1','แบนเนอร์ในพรีวิว'); await fr.click('#bnf button[type=submit]'); await sp.wait_for_timeout(600)
        ok('banner saves inside a sandboxed preview', 'แบนเนอร์ในพรีวิว' in await fr.inner_text('#v4'))
        import os; os.remove(DIST+'/sbx2.html')
        ok('no page errors', not errs, errs[:3])
        await b.close()
    print(f'{sum(res)}/{len(res)} home-edit checks passed')
asyncio.run(main())
