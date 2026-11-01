# The password sheet: half-screen, dimmed app behind it, title ระบุรหัสผ่าน, no hint line, tap outside to cancel, errors still shown. Test build on :8765.
import asyncio
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:8765/index.html?demo'
res=[]
def ok(n,c,x=''):
    c=bool(c);res.append(c);print(('PASS ' if c else 'FAIL ')+n+('' if c else f' — {x}'))
SH="(()=>{const a=document.querySelector('#app').getBoundingClientRect(),s=document.querySelector('#lock .pwb').getBoundingClientRect(),p=document.querySelector('#lock .pad').getBoundingClientRect();return {ratio:+(s.height/a.height).toFixed(2),bottom:Math.round(a.bottom-s.bottom),padIn:p.top>=s.top&&p.bottom<=s.bottom+1&&p.right<=a.right}})()"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); errs=[]
        for w,h,lo,hi in [(390,844,.68,.80),(430,932,.62,.80),(375,667,.68,.92),(412,915,.62,.80)]:
            ctx=await b.new_context(viewport={'width':w,'height':h},locale='th-TH',has_touch=True,is_mobile=True); pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto(BASE); await pg.wait_for_selector('#v0.on .rvl',timeout=60000); await pg.wait_for_timeout(500)
            ok(f'[{w}x{h}] blurred card says "คลิกเพื่อแสดงบัตร" (nothing else)', (await pg.inner_text('#v0 .rvl')).strip()=='คลิกเพื่อแสดงบัตร')
            await pg.click('#v0 .rvl'); await pg.wait_for_selector('#lock.on .pad'); await pg.wait_for_timeout(450)
            s=await pg.evaluate(SH); ok(f'[{w}x{h}] sheet is the large size (about 3/4 of the screen, like the reference) and the keypad fits inside it', lo<=s['ratio']<=hi and s['bottom']<=1 and s['padIn'], s)
            ok(f'[{w}x{h}] title ระบุรหัสผ่าน, 8 dots, no line under the title', (await pg.inner_text('#lock h2'))=='ระบุรหัสผ่าน' and await pg.locator('#lock .pwd span').count()==8 and await pg.locator('#lock .ps').count()==0)
            ok(f'[{w}x{h}] the Home screen is still visible above the sheet (dimmed)', await pg.evaluate("(()=>{const e=document.elementFromPoint(innerWidth/2,60);return !!e&&!e.closest('#lock')||getComputedStyle(document.querySelector('#lock')).backgroundColor.startsWith('rgba')})()"))
            if h==844:
                kk=await pg.evaluate("(()=>{const b=document.querySelector('#lock .pad button').getBoundingClientRect(),d=document.querySelector('#lock .pwd span').getBoundingClientRect(),s=document.querySelector('#lock .pwb').getBoundingClientRect();return {key:Math.round(b.width),dot:Math.round(d.width),top:Math.round(s.top)}})()")
                ok('keys are 74px, dots about 20px, sheet top about 203-250px (iPhone adds its home-bar inset) (matches the reference screenshot at 390x844)', 72<=kk['key']<=76 and 18<=kk['dot']<=22 and 200<=kk['top']<=260, kk)
                await pg.screenshot(path='shots/pcs-half.png')
                for ch in '11111111': await pg.click(f'#lock [data-k="{ch}"]')
                await pg.wait_for_timeout(500); ok('a wrong code still gets a clear message (feedback is not a clue)', 'ไม่ถูกต้อง' in await pg.inner_text('#lock') and '00000000' not in await pg.inner_text('#lock'))
                await pg.screenshot(path='shots/pcs-wrong.png')
                await pg.click('#lock',position={'x':w/2,'y':40}); await pg.wait_for_timeout(400); ok('tapping the dimmed area closes the sheet (cancel)', await pg.locator('#lock.on').count()==0)
                await pg.click('#v0 .rvl'); await pg.wait_for_selector('#lock.on .pad')
                for ch in '00000000': await pg.click(f'#lock [data-k="{ch}"]')
                await pg.wait_for_function("!document.querySelector('#lock').classList.contains('on')"); await pg.wait_for_timeout(400); ok('00000000 (never shown anywhere) opens the card', await pg.locator('#v0 .rvl').count()==0)
                # the app lock ("ล็อกตอนนี้") keeps the app hidden behind a solid screen, sheet still half height
                await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=lock-now]'); await pg.wait_for_selector('#lock.on .pad'); await pg.wait_for_timeout(400)
                s2=await pg.evaluate(SH); bg=await pg.evaluate("getComputedStyle(document.querySelector('#lock')).backgroundColor")
                ok('app lock: solid screen (app hidden), same large sheet, same title, no line', bg=='rgb(48, 56, 145)' and 0.68<=s2['ratio']<=0.80 and (await pg.inner_text('#lock h2'))=='ระบุรหัสผ่าน' and await pg.locator('#lock .ps').count()==0, (bg,s2))
                await pg.screenshot(path='shots/pcs-lock.png')
            await ctx.close()
        await b.close()
    ok('no page errors',not errs,errs[:3]); print(f'{sum(res)}/{len(res)} password-sheet checks passed')
asyncio.run(main())
