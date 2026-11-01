# Phone layout sweep (Chromium with phone viewport, touch, mobile UA). Not real Safari/Chrome-on-Android: see README "Not verified".
# For every viewport and screen: no horizontal overflow, inputs >=16px (no iOS focus-zoom), tap targets, text not clipped by the nav, DEMO badge placement.
import asyncio,sys
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:8765/index.html?demo'
VP=[('iPhone SE 1st gen (320x568)',320,568,2,'iphone'),('iPhone SE / 8 (375x667)',375,667,2,'iphone'),('iPhone 13/14/15 (390x844)',390,844,3,'iphone'),('iPhone Pro Max (430x932)',430,932,3,'iphone'),
    ('Android small (360x640)',360,640,3,'android'),('Pixel 7 (412x915)',412,915,2.6,'android'),('Galaxy S (360x800)',360,800,3,'android'),('iPhone landscape (844x390)',844,390,3,'iphone'),('Android landscape (915x412)',915,412,2.6,'android')]
UA={'iphone':'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1','android':'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'}
res=[];notes=[]
def ok(n,c,x=''):
    c=bool(c);res.append(c);print(('PASS ' if c else 'FAIL ')+n+('' if c else f' — {x}'))
OVER="""()=>{const W=innerWidth,out=[];document.querySelectorAll('body *').forEach(e=>{if(e.closest('.chips,.cr,#vwr,#ed,.pwb'))return;const r=e.getBoundingClientRect();if(!r.width||!r.height)return;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none')return;
  if(e.closest('.view:not(.on)'))return;if(r.right>W+1||r.left<-1)out.push((e.className&&e.className.baseVal===undefined?e.className:e.tagName)+':'+Math.round(r.left)+'..'+Math.round(r.right))});return out.slice(0,6)}"""
FONTS="""()=>[...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]),select,textarea')].filter(e=>e.getBoundingClientRect().width>0&&getComputedStyle(e).fontSize!=='16px').map(e=>(e.id||e.name||e.tagName)+':'+getComputedStyle(e).fontSize)"""
SMALL="""(sel)=>[...document.querySelectorAll(sel)].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<36||r.width<36)&&!e.closest('[hidden]')&&getComputedStyle(e).visibility!=='hidden'}).map(e=>(e.dataset.act||e.className||e.tagName)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)).slice(0,8)"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for name,w,h,dsf,os_ in VP:
            ctx=await b.new_context(viewport={'width':w,'height':h},device_scale_factor=dsf,locale='th-TH',has_touch=True,is_mobile=True,user_agent=UA[os_]); pg=await ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'fonts.googleapis' not in m.text and 'ERR_' not in m.text else None)
            await pg.goto(BASE); await pg.wait_for_selector('#v0.on .pimg.ok',timeout=60000); await pg.wait_for_timeout(500)
            tag=name.split(' (')[0]+' '+f'{w}x{h}'
            ok(f'[{tag}] page itself does not scroll sideways', await pg.evaluate("document.documentElement.scrollWidth<=innerWidth && document.body.scrollWidth<=innerWidth"))
            ok(f'[{tag}] DEMO VERSION strip fits the width and sits below the announcements', await pg.evaluate("(()=>{const s=document.querySelector('#v0 .dstrip'),l=document.querySelector('#v0 .nl');if(!s)return false;const r=s.getBoundingClientRect();const w=document.querySelector('#app').clientWidth;return Math.abs(r.width-w)<=1&&r.left>=-1&&r.right<=innerWidth+1&&s.getBoundingClientRect().top>=l.getBoundingClientRect().bottom-1})()"))
            fb=await pg.evaluate("(()=>{const v=document.querySelector('#v0');v.scrollTo(0,99999);const s=document.querySelector('#v0 .dstrip').getBoundingClientRect(),f=document.querySelector('#fab').getBoundingClientRect(),n=document.querySelector('#nv').getBoundingClientRect(),inter=(a,b)=>!(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom);return {fab:inter(s,f),nav:inter(s,n),vis:getComputedStyle(document.querySelector('#fab')).display!=='none'}})()"); await pg.wait_for_timeout(200)
            ok(f'[{tag}] scrolled to the end: the strip is not covered by the chat button or the bottom navigation', not fb['fab'] and not fb['nav'], fb)
            ok(f'[{tag}] bottom nav fully visible, 5 items', await pg.evaluate("(()=>{const r=document.querySelector('#nv').getBoundingClientRect();return r.bottom<=innerHeight+1&&document.querySelectorAll('#nv .ni').length===5})()"))
            for i,sc in [(1,'Home'),(2,'Documents'),(3,'Scan'),(4,'History'),(5,'Settings')]:
                await pg.click(f'#nv > :nth-child({i})'); await pg.wait_for_timeout(350)
                if i==2: await pg.wait_for_selector('#v1 .dl'); await pg.wait_for_timeout(300)
                ov=await pg.evaluate(OVER); ok(f'[{tag}] {sc}: nothing pokes outside the screen width',not ov,ov)
                fs=await pg.evaluate(FONTS); ok(f'[{tag}] {sc}: inputs are 16px (no iOS zoom on focus)',not fs,fs)
                vw=await pg.evaluate(f"(()=>{{const v=document.querySelector('#v{i-1}');return v.scrollWidth<=v.clientWidth+1}})()"); ok(f'[{tag}] {sc}: view has no horizontal scroll',vw)
                if i in (2,4,5) and w<500:
                    sm=await pg.evaluate(SMALL,'#v'+str(i-1)+' button:not(.sw), #v'+str(i-1)+' select, #v'+str(i-1)+' input[type=search]'); ok(f'[{tag}] {sc}: tap targets >=36px',not sm,sm)
            if w<500:
                # sheets and overlays
                await pg.click('#nv > :nth-child(2)'); await pg.wait_for_selector('#v1 .dl'); await pg.click('#v1 .dl >> nth=0'); await pg.wait_for_selector('#sh.on .slot'); await pg.wait_for_timeout(400)
                ov=await pg.evaluate(OVER); fs=await pg.evaluate(FONTS); sm=await pg.evaluate(SMALL,'#sh button'); ok(f'[{tag}] document sheet: fits width, 16px inputs, tap targets',not ov and not fs and not sm,(ov,fs,sm))
                inside=await pg.evaluate("(()=>{const s=document.querySelector('#sh').getBoundingClientRect(),a=document.querySelector('#app').getBoundingClientRect();return s.top>=a.top-1&&s.bottom<=a.bottom+1})()"); ok(f'[{tag}] document sheet stays inside the screen',inside)
                await pg.click('#sh [data-act=det-open]'); await pg.wait_for_selector('#dp.on .pf-body'); await pg.wait_for_timeout(500); await pg.click('#dp [data-act=det-edit]'); await pg.wait_for_timeout(300)
                fs=await pg.evaluate(FONTS); ov=await pg.evaluate(OVER.replace("body *","#dp *")); ok(f'[{tag}] details edit form: 16px inputs, fits width',not fs and not ov,(fs,ov)); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
                await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.click('#v4 [data-act=demo-menu]'); await pg.wait_for_selector('#sh.on'); await pg.wait_for_timeout(300)
                ov=await pg.evaluate(OVER); ok(f'[{tag}] DEMO menu fits',not ov,ov); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
                await pg.click('#nv > :nth-child(1)'); await pg.wait_for_timeout(300); await pg.click('#v0 [data-act=prof-open]'); await pg.wait_for_selector('#lock.on .pad')
                for ch in '00000000': await pg.click(f'#lock [data-k="{ch}"]')
                await pg.wait_for_selector('#pi.on .pf-body'); await pg.wait_for_timeout(700)
                ov=await pg.evaluate(OVER.replace("body *","#pi *")); ok(f'[{tag}] ข้อมูลบัตร screen: nothing outside the screen width',not ov,ov)
                ok(f'[{tag}] ข้อมูลบัตร: card photo not stretched, dates not overlapping', await pg.evaluate("(()=>{const i=document.querySelector('#pi .pf-photo img'),a=document.querySelectorAll('#pi .pf-2 .pf-f');const r=i.getBoundingClientRect();const x=a[0].getBoundingClientRect(),y=a[1].getBoundingClientRect();const stacked=y.top>=x.bottom-1;return Math.abs(r.width/r.height-i.naturalWidth/i.naturalHeight)<0.02&&(stacked||x.right<=y.left)})()"))
                await pg.click('#pi [data-act=prof-close]'); await pg.wait_for_timeout(500)
                await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(300); await pg.evaluate("document.querySelector('[data-act=tg-lock]').scrollIntoView()"); await pg.click('[data-act=tg-lock]'); await pg.wait_for_selector('#lock.on .pad'); await pg.wait_for_timeout(300)
                pad=await pg.evaluate("(()=>{const r=document.querySelector('#lock .pad').getBoundingClientRect(),b=document.querySelector('#lock .pwb').getBoundingClientRect();return r.left>=b.left&&r.right<=b.right&&r.bottom<=innerHeight&&r.right<=innerWidth})()"); ok(f'[{tag}] passcode keypad fits',pad)
                await pg.click('#lock [data-act=lk-cancel]'); await pg.wait_for_timeout(200)
            else:
                # landscape: everything must still be reachable by scrolling
                await pg.click('#nv > :nth-child(2)'); await pg.wait_for_selector('#v1 .dl'); r=await pg.evaluate("(()=>{const v=document.querySelector('#v1');v.scrollTo(0,99999);return [v.scrollHeight>v.clientHeight, v.clientHeight]})()"); ok(f'[{tag}] Documents scrolls in landscape (content area {r[1]}px)',r[0]); 
                await pg.click('#nv > :nth-child(5)'); await pg.wait_for_timeout(200); ok(f'[{tag}] Settings reachable and last row visible after scrolling', await pg.evaluate("(()=>{const v=document.querySelector('#v4');v.scrollTo(0,99999);const l=[...v.querySelectorAll('.cd')].pop().getBoundingClientRect(),n=document.querySelector('#nv').getBoundingClientRect();return l.bottom<=n.top+2||l.bottom<=innerHeight})()"))
            ok(f'[{tag}] no page errors',not errs,errs[:2])
            await pg.screenshot(path=f"shots/m-{w}x{h}.png"); await ctx.close()
        await b.close()
    print(f'{sum(res)}/{len(res)} mobile checks passed')
asyncio.run(main())
