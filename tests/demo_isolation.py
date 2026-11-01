# Proves DEMO mode never talks to the real backend. Runs against dist-spy/ (code-split like the real build, isMock=false) on :8767,
# where the "Supabase client" is a spy that records every call. See tools/build-spy.mjs.
import asyncio
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:8767/index.html'
res=[]
def ok(n,c,x=''):
    c=bool(c);res.append(c);print(('PASS ' if c else 'FAIL ')+n+('' if c else f' — {x}'))
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},locale='th-TH',has_touch=True,is_mobile=True); pg=await ctx.new_page(); errs=[]
        reqs=[]; pg.on('request',lambda r: reqs.append(r.url)); pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(BASE); await pg.wait_for_selector('#auth [data-act=demo-start]',timeout=30000)
        ok('real (non-mock) build shows sign-in with the DEMO button', await pg.locator('#auth [data-act=demo-start]').count()==1)
        ok('DEMO code is not loaded before it is needed (lazy chunk)', not any('mock-' in u for u in reqs), [u for u in reqs if 'mock' in u])
        calls0=await pg.evaluate("window.__REAL.length"); await pg.click('#auth [data-act=demo-start]')
        await pg.wait_for_selector('#v0.on .pimg.ok',timeout=60000); await pg.wait_for_timeout(500)
        ok('DEMO chunk loaded on demand', any('mock-' in u for u in reqs))
        ok('DEMO VERSION strip + sample data in the real build', await pg.is_visible('#v0 .dstrip') and await pg.locator('#v0 .face:not(.bk) .pimg.ok').count()==1)
        for i in (2,3,4,5): await pg.click(f'#nv > :nth-child({i})'); await pg.wait_for_timeout(300)
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=bn-edit][data-i=new]'); await pg.wait_for_selector('#bnf'); await pg.set_input_files('#bnfile','fixtures/front.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_selector('#bnpv .bn-pic'); await pg.click('#bnf button[type=submit]'); await pg.wait_for_timeout(800)
        await pg.click('#v4 [data-act=anpic-edit]'); await pg.wait_for_selector('#anpfile',state='attached'); await pg.set_input_files('#anpfile','fixtures/front.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_timeout(800)
        await pg.click('#v4 [data-act=an-edit][data-i=new]'); await pg.wait_for_selector('#anf'); await pg.fill('#a1','ประกาศทดลอง'); await pg.set_input_files('#anfile','fixtures/front.jpg'); await pg.wait_for_selector('#ed.on #edc'); await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_selector('#anup .nc-pic'); await pg.click('#anf button[type=submit]'); await pg.wait_for_timeout(800)
        await pg.click('#nv > :nth-child(3)'); await pg.fill('#st','เอกสารทดลอง'); await pg.set_input_files('#fg','fixtures/front.jpg'); await pg.wait_for_selector('.pv-img'); await pg.click('[data-act=scan-save]'); await pg.wait_for_selector('#v0.on .pimg.ok'); await pg.wait_for_timeout(400)
        await pg.click('#nv > :nth-child(2)'); await pg.wait_for_selector('#v1 .dl'); await pg.click('#v1 .dl >> nth=0'); await pg.wait_for_selector('#sh.on .slot')
        async with pg.expect_download() as dl: await pg.click('#sh [data-act=copy-wm][data-side=front]')
        await dl.value; await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.click('#nv > :nth-child(5)'); await pg.click('#v4 [data-act=demo-reset]'); await pg.wait_for_selector('#v0.on .pimg.ok',timeout=60000); await pg.wait_for_timeout(400)
        await pg.click('#nv > :nth-child(4)'); await pg.wait_for_selector('#v3 .hr'); await pg.wait_for_timeout(200)
        calls=await pg.evaluate("window.__REAL.slice()"); new=calls[calls0:]
        ok('during the whole DEMO session (browse, upload, watermark copy, reset) the real backend received 0 calls', not new, new)
        ok('no request left the origin', all(u.startswith('http://127.0.0.1:8767') or u.startswith('blob:') or u.startswith('data:') for u in reqs), [u for u in reqs if not u.startswith('http://127.0.0.1:8767')][:3])
        await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=demo-exit]'); await pg.wait_for_selector('#auth [data-act=demo-start]',timeout=30000)
        ok('Exit returns to the sign-in screen without the DEMO strip', 'demo' not in pg.url and await pg.locator('#v0 .dstrip').count()==0, pg.url)
        await pg.goto(BASE+'?demo'); await pg.wait_for_selector('#v0.on .pimg.ok',timeout=60000); ok('?demo link opens DEMO directly (no sign-in)', await pg.is_visible('#v0 .dstrip'))
        ok('?demo made no data calls to the real backend either', set(await pg.evaluate("window.__REAL.slice()"))<= {'sb.auth.onAuthStateChange'}, await pg.evaluate("window.__REAL.slice()"))
        await b.close()
    bad=[e for e in errs if 'fonts.googleapis' not in e and 'net::ERR' not in e]
    ok('no page errors', not bad, bad[:3]); print(f'{sum(res)}/{len(res)} isolation checks passed')
asyncio.run(main())
