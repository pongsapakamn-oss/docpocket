# 8-digit passcode: DEMO preset 00000000 + popup on "tap to show", real-account flow, and codes saved before this update (6 digits).
import asyncio
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:8765/index.html'
res=[]
def ok(n,c,x=''):
    c=bool(c);res.append(c);print(('PASS ' if c else 'FAIL ')+n+('' if c else f' — {x}'))
async def keys(pg,c):
    for ch in c: await pg.click(f'#lock [data-k="{ch}"]')
    await pg.wait_for_timeout(450)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,locale='th-TH',has_touch=True,is_mobile=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append('pageerror '+str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'googleapis' not in m.text and 'ERR_' not in m.text else None)
        # ---------- DEMO
        await pg.goto(BASE+'?demo'); await pg.wait_for_selector('#v0.on .flipw',timeout=60000); await pg.wait_for_timeout(600)
        ok('DEMO opens with the card blurred behind a padlock ("คลิกเพื่อแสดงบัตร")', await pg.locator('#v0 .flipw.hid').count()==1 and await pg.locator('#v0 .rvl').count()==1 and await pg.locator('#lock.on').count()==0)
        await pg.click('#v0 .rvl'); await pg.wait_for_selector('#lock.on .pad'); await pg.wait_for_timeout(400)
        ok('tapping it pops up the passcode screen with 8 dots', await pg.locator('#lock .pwd span').count()==8 and 'ระบุรหัสผ่าน' in await pg.inner_text('#lock'))
        full=await pg.evaluate("document.body.innerText"); ok('NO clue anywhere on the password page: no subtitle line, the preset code and the word DEMO do not appear on screen', await pg.locator('#lock .ps').count()==0 and '00000000' not in full and 'รหัสทดลอง' not in full and 'DEMO' not in await pg.inner_text('#lock'), await pg.inner_text('#lock'))
        sh=await pg.evaluate("(()=>{const a=document.querySelector('#app').getBoundingClientRect(),s=document.querySelector('#lock .pwb').getBoundingClientRect();return {ratio:s.height/a.height,bottom:Math.round(a.bottom-s.bottom),bg:getComputedStyle(document.querySelector('#lock')).backgroundColor}})()")
        ok('the password sheet is the large size from the reference (about 3/4 of the screen)', 0.66<=sh['ratio']<=0.80 and sh['bottom']<=1, sh)
        ok('the app stays visible, dimmed, above the sheet (not a solid screen)', sh['bg'].startswith('rgba(10, 12, 40, 0.5'), sh)
        await pg.screenshot(path='shots/pc-popup.png')
        await keys(pg,'0000000'); ok('7 digits do not submit', await pg.locator('#lock.on').count()==1 and await pg.locator('#lock .pwd span.f').count()==7)
        await pg.click('#lock [data-k=del]'); await pg.wait_for_timeout(100); ok('delete removes one digit', await pg.locator('#lock .pwd span.f').count()==6)
        await pg.click('#lock [data-k="0"]'); await pg.click('#lock [data-k="0"]'); await pg.wait_for_function("!document.querySelector('#lock').classList.contains('on')"); await pg.wait_for_timeout(500)
        ok('00000000 reveals the card', await pg.locator('#v0 .flipw.hid').count()==0 and await pg.locator('#v0 .rvl').count()==0 and await pg.locator('#v0 .face:not(.bk) .pimg.ok').count()==1)
        await pg.click('[data-act=lock-now]') if False else None
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=lock-now]'); await pg.wait_for_selector('#lock.on .pad')
        await keys(pg,'11111111'); ok('a wrong 8-digit code is refused', 'ไม่ถูกต้อง' in await pg.inner_text('#lock') and await pg.locator('#lock.on').count()==1)
        await keys(pg,'00000000'); await pg.wait_for_function("!document.querySelector('#lock').classList.contains('on')"); ok('"ล็อกตอนนี้" then 00000000 unlocks', True)
        # in DEMO the code can be changed, even to a simple one
        await pg.click('#v4 [data-act=lock-change]'); await pg.wait_for_selector('#lock.on .pad'); await keys(pg,'00000000'); await pg.wait_for_selector('#lock.on .pad'); await pg.wait_for_timeout(300)
        ok('change code: asks for the new 8-digit code', 'ตั้งรหัสล็อก 8 หลัก' in await pg.inner_text('#lock'))
        await keys(pg,'11111111'); await keys(pg,'11111111'); await pg.wait_for_function("!document.querySelector('#lock').classList.contains('on')"); ok('DEMO accepts a simple new code (presentation use)', True)
        ok('DEMO does not change the real device setting for "hide preview"', await pg.evaluate("localStorage.getItem('dp_hidepv')")!='true')
        # ---------- real (non-demo) account in the test build
        ctx2=await b.new_context(viewport={'width':390,'height':844},locale='th-TH',has_touch=True,is_mobile=True); pg=await ctx2.new_page()
        pg.on('pageerror',lambda e: errs.append('pageerror '+str(e)))
        await pg.goto(BASE); await pg.wait_for_selector('#v0.on .pimg.ok',timeout=60000)
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.evaluate("document.querySelector('[data-act=tg-lock]').scrollIntoView({block:'center'})"); await pg.click('[data-act=tg-lock]'); await pg.wait_for_selector('#lock.on .pad')
        ok('setting a code asks for 8 digits (8 dots, title says 8)', await pg.locator('#lock .pwd span').count()==8 and 'ตั้งรหัสล็อก 8 หลัก' in await pg.inner_text('#lock'))
        await keys(pg,'00000000'); ok('real accounts refuse 00000000 as too guessable (no default code)', 'เดาง่าย' in await pg.inner_text('#lock'))
        await keys(pg,'12345678'); ok('real accounts refuse 12345678', 'เดาง่าย' in await pg.inner_text('#lock'))
        await keys(pg,'48291375'); await keys(pg,'48291370'); ok('mismatched confirmation restarts', 'ไม่ตรงกัน' in await pg.inner_text('#lock'))
        await keys(pg,'48291375'); await keys(pg,'48291375'); await pg.wait_for_function("!document.querySelector('#lock').classList.contains('on')"); await pg.wait_for_timeout(300)
        st=await pg.evaluate("Object.entries(localStorage).filter(([k])=>k.startsWith('dp_lock_')).map(([k,v])=>v).join('|')"); ok('only a salted hash and the length are stored (no plain code)', '48291375' not in st and '"n":8' in st and 'PBKDF2' not in st, st[:120])
        await pg.click('[data-act=tg-hidepv]'); await pg.wait_for_timeout(300); await pg.click('#nv > :nth-child(1)'); await pg.wait_for_selector('#v0 .rvl'); await pg.click('#v0 .rvl'); await pg.wait_for_selector('#lock.on .pad')
        ok('real account: tapping the blurred card asks for the 8-digit code, no hint shown', await pg.locator('#lock .pwd span').count()==8 and '00000000' not in await pg.inner_text('#lock'))
        await keys(pg,'48291375'); await pg.wait_for_function("!document.querySelector('#lock').classList.contains('on')"); await pg.wait_for_timeout(400); ok('correct 8-digit code reveals the card', await pg.locator('#v0 .rvl').count()==0)
        # ---------- a 6-digit code saved before this update still works (stored without a length)
        await pg.evaluate("""async()=>{const k=Object.keys(localStorage).find(k=>k.startsWith('dp_lock_')),salt=crypto.getRandomValues(new Uint8Array(16)),key=await crypto.subtle.importKey('raw',new TextEncoder().encode('482913'),'PBKDF2',false,['deriveBits']),h=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:150000},key,256)),b=u=>btoa(String.fromCharCode(...u));localStorage.setItem(k,JSON.stringify({s:b(salt),h:b(h),it:150000}))}""")
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=lock-now]'); await pg.wait_for_selector('#lock.on .pad')
        ok('old-style code: popup shows 6 dots', await pg.locator('#lock .pwd span').count()==6)
        await keys(pg,'482913'); await pg.wait_for_function("!document.querySelector('#lock').classList.contains('on')"); ok('old 6-digit code still unlocks', True)
        await b.close()
    ok('no console / page errors',not errs,errs[:3]); print(f'{sum(res)}/{len(res)} passcode checks passed')
asyncio.run(main())
