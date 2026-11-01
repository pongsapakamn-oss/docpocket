# No startup display: no loading screen, no "preparing DEMO" toast, nothing but the app's own blue until the first real screen; and a stalled web font cannot hang DEMO start-up.
import asyncio,time
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:8765/index.html'
res=[]
def ok(n,c,x=''):
    c=bool(c);res.append(c);print(('PASS ' if c else 'FAIL ')+n+('' if c else f' — {x}'))
WATCH="""(()=>{window.__seen=[];const bad=['กำลังโหลด','กำลังเตรียมโหมด','เข้าสู่โหมด DEMO แล้ว','โหมดทดสอบ: ไม่มีเซิร์ฟเวอร์จริง'];
 const chk=()=>{const t=document.body?document.body.innerText:'';bad.forEach(b=>{if(t.includes(b)&&!window.__seen.includes(b))window.__seen.push(b)})};
 new MutationObserver(chk).observe(document,{subtree:true,childList:true,characterData:true,attributes:true});setInterval(chk,15);
 document.addEventListener('DOMContentLoaded',()=>{window.__bg=getComputedStyle(document.querySelector('#app')).backgroundColor});})()"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); errs=[]
        for name,url,sel in [('?demo link',BASE+'?demo','#v0.on .flipw'),('plain launch (test user)',BASE,'#v0.on .flipw'),('sign-in launch',BASE+'?login','#auth [data-m=up]')]:
            ctx=await b.new_context(viewport={'width':390,'height':844},locale='th-TH',has_touch=True,is_mobile=True); pg=await ctx.new_page()
            pg.on('pageerror',lambda e: errs.append(str(e))); await pg.add_init_script(WATCH)
            await pg.goto(url); await pg.wait_for_selector(sel,timeout=60000); await pg.wait_for_timeout(2500)
            seen=[x for x in await pg.evaluate("window.__seen") if not (name.startswith('sign-in') and x.startswith('โหมดทดสอบ'))]; ok(f'{name}: no loading text, no "preparing DEMO" toast, no test-mode banner flashes at startup', seen==[] , seen)
            ok(f'{name}: the app\'s own blue (not a white splash) is behind the first frame', await pg.evaluate("window.__bg")=='rgb(48, 56, 145)', await pg.evaluate("window.__bg"))
            await ctx.close()
        # a web font that never arrives (in-app browsers can stall on it) must not block DEMO
        ctx=await b.new_context(viewport={'width':390,'height':844},locale='th-TH'); pg=await ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.route('**/fonts.googleapis.com/**',lambda r: None); await pg.route('**/fonts.gstatic.com/**',lambda r: None)
        t0=time.time(); await pg.goto(BASE+'?demo',wait_until='commit'); await pg.wait_for_selector('#v0.on .pimg.ok',timeout=20000); dt=time.time()-t0
        ok('DEMO starts within 8 s even if the web font never loads', dt<8, round(dt,1)); await ctx.close()
        # if demo preparation fails the user lands on the sign-in screen instead of a blank page
        ctx=await b.new_context(viewport={'width':390,'height':844},locale='th-TH'); pg=await ctx.new_page()
        await pg.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const o=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(){throw new Error('boom')}})")
        await pg.goto(BASE+'?demo'); await pg.wait_for_selector('#auth [data-m=up]',timeout=20000); ok('a failed DEMO start falls back to the sign-in screen (never a blank page)', await pg.locator('#auth').count()==1); await ctx.close()
        await b.close()
    ok('no page errors',not errs,errs[:3]); print(f'{sum(res)}/{len(res)} startup checks passed')
asyncio.run(main())
