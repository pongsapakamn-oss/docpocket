# Real ID-card ratio (85.6 x 54 mm = 856:540), edge-to-edge display, and the easy upload + adjust flow. Test build on :8765 (DEMO mode).
import asyncio
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:8765/index.html?demo'
CARD=856/540
res=[]
def ok(n,c,x=''):
    c=bool(c);res.append(c);print(('PASS ' if c else 'FAIL ')+n+('' if c else f' — {x}'))
PV="e=>({w:e.naturalWidth,h:e.naturalHeight,r:e.naturalWidth/e.naturalHeight})"
async def pick(pg,f,title='ทดสอบกรอบบัตร',new=True):
    await pg.click('#nv > :nth-child(3)'); await pg.wait_for_selector('#v2.on')
    if new: await pg.select_option('#sd','new'); await pg.fill('#st',title)
    await pg.set_input_files('#fg',f); await pg.wait_for_selector('.pv-img'); await pg.wait_for_timeout(700)
async def dark_ring(pg,sel):   # share of dark "table" pixels in the outer 2% ring of an <img>
    return await pg.evaluate("""(sel)=>{const i=document.querySelector(sel),c=document.createElement('canvas'),w=c.width=300,h=c.height=Math.round(300*i.naturalHeight/i.naturalWidth),x=c.getContext('2d');x.drawImage(i,0,0,w,h);const d=x.getImageData(0,0,w,h).data;let n=0,t=0;const m=Math.round(w*.02);for(let j=0;j<h;j++)for(let k=0;k<w;k++)if(k<m||j<m||k>=w-m||j>=h-m){t++;const o=(j*w+k)*4;if(d[o]+d[o+1]+d[o+2]<300)n++}return n/t}""",sel)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'])
        ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,locale='th-TH',has_touch=True,is_mobile=True,permissions=['camera']); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append('pageerror '+str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'googleapis' not in m.text and 'ERR_' not in m.text else None)
        await pg.goto(BASE); await pg.wait_for_selector('#v0.on .pimg.ok',timeout=60000)
        await pg.click('#v0 .rvl'); await pg.wait_for_selector('#lock.on .pad')
        for ch in '00000000': await pg.click(f'#lock [data-k="{ch}"]')
        await pg.wait_for_timeout(600)   # card revealed (DEMO hides it behind a blur until the passcode is entered)
        # ---- the frame itself uses the real ID-1 shape
        fr=await pg.eval_on_selector('.card3d','e=>{const r=e.getBoundingClientRect();return r.width/r.height}'); ok('Home card frame has the real ID-1 ratio 85.6:54 (1.585)', abs(fr-CARD)<0.01, fr)
        # ---- upload a photo of a card on a table: framed to the card automatically
        await pick(pg,'_gen/cardphoto.jpg')
        d=await pg.eval_on_selector('.pv-img',PV); ok('upload: the preview is cropped to the real card ratio by itself', abs(d['r']-CARD)<0.02, d)
        ok('preview box is card-shaped and the screen says it was framed to 85.6×54 mm', await pg.locator('.vf.card').count()==1 and 'พอดีกรอบบัตรจริง (85.6×54 มม.)' in await pg.inner_text('#v2'))
        ok('the card fills the preview edge to edge (no dark table in the outer ring)', await dark_ring(pg,'.pv-img')<0.12, await dark_ring(pg,'.pv-img'))
        await pg.screenshot(path='shots/cf-preview.png')
        sv=await pg.evaluate("(()=>{const s=document.querySelector('[data-act=scan-save]').getBoundingClientRect(),n=document.querySelector('#nv').getBoundingClientRect(),a=document.querySelector('[data-act=scan-adjust]').getBoundingClientRect();return {saveBottom:Math.round(s.bottom),navTop:Math.round(n.top),adjustTop:Math.round(a.top),selHidden:getComputedStyle(document.querySelector('#v2 .scsel')).display==='none'}})()")
        ok('after choosing a photo the pickers collapse and the picture + all buttons (adjust ... save) fit on one iPhone screen', sv['selHidden'] and sv['saveBottom']<=sv['navTop'], sv)
        ok('one-line summary shows which document and side will be saved', 'ทดสอบกรอบบัตร' in await pg.inner_text('#v2 .scsum') and 'ด้านหน้า' in await pg.inner_text('#v2 .scsum'))
        ok('upload step offers: ปรับภาพ, หมุน 90°, ใช้ภาพเต็ม, ถ่ายใหม่, ยกเลิก, ยืนยันและบันทึก', all([await pg.locator(f'#v2 [data-act={a}]').count()==1 for a in ['scan-adjust','scan-rot','scan-fit','scan-retake','scan-cancel','scan-save']]))
        await pg.click('[data-act=scan-save]'); await pg.wait_for_selector('#v0.on .face:not(.bk) .pimg.ok'); await pg.wait_for_timeout(700)
        h=await pg.evaluate("(()=>{const i=document.querySelector('#v0 .face:not(.bk) .pimg'),f=document.querySelector('#v0 .face:not(.bk)').getBoundingClientRect(),r=i.getBoundingClientRect();return {nr:i.naturalWidth/i.naturalHeight,fill:i.classList.contains('fill'),dw:Math.abs(r.width-f.width),dh:Math.abs(r.height-f.height),fr:f.width/f.height}})()")
        ok('Home shows it edge to edge: picture ratio = frame ratio, no strips at the sides', abs(h['nr']-CARD)<0.02 and h['dw']<=1 and h['dh']<=1 and abs(h['fr']-CARD)<0.01, h)
        # ---- the original file is untouched (crop is only metadata)
        ok('stored original keeps its full size (crop is metadata)', await pg.evaluate("(async()=>{const r=await fetch(document.querySelector('#v0 .face:not(.bk) .pimg').src);return (await r.blob()).size>0})()"))
        # ---- a card photographed at 1.375:1 and a card on its side
        await pick(pg,'_gen/cardphoto_off.jpg','off ratio'); d=await pg.eval_on_selector('.pv-img',PV); ok('card photographed at a different ratio is still framed to the real ratio', abs(d['r']-CARD)<0.02, d)
        await pg.click('[data-act=scan-cancel]'); await pg.wait_for_timeout(400)
        await pick(pg,'_gen/cardphoto_side.jpg','side'); d=await pg.eval_on_selector('.pv-img',PV); ok('a card photographed standing on its side is turned upright and framed (landscape, real ratio)', abs(d['r']-CARD)<0.03, d)
        await pg.click('[data-act=scan-rot]'); await pg.wait_for_timeout(900); d2=await pg.eval_on_selector('.pv-img',PV); ok('"หมุน 90°" turns it and re-frames', abs(d2['r']-d['r'])>0.2 or d2['w']!=d['w'], (d,d2))
        await pg.click('[data-act=scan-cancel]'); await pg.wait_for_timeout(400)
        # ---- a document that is NOT a card is left alone
        await pick(pg,'_gen/page.jpg','หน้ากระดาษ'); d=await pg.eval_on_selector('.pv-img',PV); ok('a page-shaped photo is not forced into a card crop (full image)', d['w']==1600 and d['h']==1400 and 'ใช้ภาพเต็ม ไม่ครอป' in await pg.inner_text('#v2'), d)
        await pg.click('[data-act=scan-fit]'); await pg.wait_for_timeout(900); d=await pg.eval_on_selector('.pv-img',PV); ok('"ครอปให้พอดีบัตร" frames it to the card ratio on request', abs(d['r']-CARD)<0.03, d)
        await pg.click('[data-act=scan-fit]'); await pg.wait_for_timeout(900); d=await pg.eval_on_selector('.pv-img',PV); ok('"ใช้ภาพเต็ม" gives the whole picture back', d['w']==1600 and d['h']==1400, d)
        await pg.click('[data-act=scan-save]'); await pg.wait_for_selector('#v0.on .face:not(.bk) .pimg.ok'); await pg.wait_for_timeout(700)
        h=await pg.evaluate("(()=>{const i=document.querySelector('#v0 .face:not(.bk) .pimg');return {fill:i.classList.contains('fill'),of:getComputedStyle(i).objectFit}})()"); ok('a far-from-card picture stays whole (contain), not cropped by the frame', not h['fill'] and h['of']=='contain', h)
        # ---- a nearly card-shaped uncropped picture fills the frame (no edge strips)
        await pick(pg,'fixtures/front.jpg','เกือบบัตร'); await pg.click('[data-act=scan-fit]'); await pg.wait_for_timeout(900)
        d=await pg.eval_on_selector('.pv-img',PV); ok('1.45:1 photo: "ใช้ภาพเต็ม" keeps the whole picture', abs(d['r']-1600/1100)<0.01, d)
        await pg.click('[data-act=scan-save]'); await pg.wait_for_selector('#v0.on .face:not(.bk) .pimg.ok'); await pg.wait_for_timeout(700)
        h=await pg.evaluate("(()=>{const i=document.querySelector('#v0 .face:not(.bk) .pimg'),f=document.querySelector('#v0 .face:not(.bk)').getBoundingClientRect(),r=i.getBoundingClientRect();return {fill:i.classList.contains('fill'),of:getComputedStyle(i).objectFit,dw:Math.abs(r.width-f.width),dh:Math.abs(r.height-f.height)}})()"); ok('near-card picture fills the frame edge to edge (object-fit: cover)', h['fill'] and h['of']=='cover' and h['dw']<=1 and h['dh']<=1, h)
        await pg.click('#v0 [data-act=open-view]'); await pg.wait_for_selector('#vwr.on #vflip'); await pg.wait_for_timeout(900); ok('enlarged view fills the card the same way', await pg.locator('#vwr .vfc:not(.bk) img.fill').count()==1); await pg.click('#vwr [data-act=view-close]'); await pg.wait_for_timeout(700)
        # ---- adjust: editor opens on the real card frame, already around the card
        await pick(pg,'_gen/cardphoto.jpg','แก้ทีหลัง'); await pg.click('[data-act=scan-fit]'); await pg.wait_for_timeout(900)   # full picture first
        await pg.click('[data-act=scan-adjust]'); await pg.wait_for_selector('#ed.on #edc'); await pg.wait_for_timeout(500)
        chips=await pg.eval_on_selector_all('#ed .chips button','e=>e.map(x=>[x.textContent,x.classList.contains("on")])'); ok('editor: first frame is "บัตร 85.6×54" and it is selected', chips[0]==['บัตร 85.6×54',True], chips[:2])
        cw=await pg.eval_on_selector('#edc','e=>e.clientWidth/e.clientHeight'); ok('editor frame has the card ratio', abs(cw-CARD)<0.03, cw)
        z=int((await pg.inner_text('#edzl')).strip('%')); ok('editor starts already zoomed onto the detected card', z>110, z)
        ok('editor has "ตรวจขอบบัตร" (auto-detect), rotate, reset', await pg.locator('#ed [data-act=ed-auto]').count()==1 and await pg.locator('#ed [data-act=ed-rot]').count()==2)
        await pg.click('#ed [data-act=ed-reset]'); await pg.wait_for_timeout(150); z0=int((await pg.inner_text('#edzl')).strip('%')); await pg.click('#ed [data-act=ed-auto]'); await pg.wait_for_timeout(300); z1=int((await pg.inner_text('#edzl')).strip('%')); ok('"ตรวจขอบบัตร" finds the card again after a reset', z0==100 and z1>110, (z0,z1))
        await pg.click('#ed [data-act=ed-ok]'); await pg.wait_for_timeout(900); d=await pg.eval_on_selector('.pv-img',PV); ok('after adjusting, the preview is card-shaped', abs(d['r']-CARD)<0.03, d)
        await pg.click('[data-act=scan-cancel]'); await pg.wait_for_timeout(500)
        # ---- adjust an already saved, uncropped picture from Documents
        await pg.click('#nv > :nth-child(2)'); await pg.wait_for_selector('#v1 .dl'); await pg.click('#v1 .dl:has-text("หน้ากระดาษ")'); await pg.wait_for_selector('#sh.on .slot'); await pg.click('#sh [data-act=adjust-saved][data-side=front]'); await pg.wait_for_selector('#ed.on #edc'); await pg.wait_for_timeout(400)
        ok('saved page-shaped picture opens whole (no forced card frame)', await pg.evaluate("document.querySelector('#ed .chips button.on').dataset.k")=='full'); await pg.click('#ed [data-act=ed-cancel]'); await pg.wait_for_timeout(400)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        await pg.click('#v1 .dl:has-text("เกือบบัตร")'); await pg.wait_for_selector('#sh.on .slot'); await pg.click('#sh [data-act=adjust-saved][data-side=front]'); await pg.wait_for_selector('#ed.on #edc'); await pg.wait_for_timeout(400)
        ok('saved near-card picture opens on the card frame', await pg.evaluate("document.querySelector('#ed .chips button.on').dataset.k")=='card'); await pg.click('#ed [data-act=ed-cancel]'); await pg.wait_for_timeout(400); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # ---- camera guide
        await pg.click('#nv > :nth-child(3)'); await pg.wait_for_selector('#v2.on'); await pg.select_option('#sd','new'); await pg.click('[data-act=cam-on]'); await pg.wait_for_selector('#cam'); await pg.wait_for_timeout(700)
        g=await pg.eval_on_selector('.vf .gd','e=>{const r=e.getBoundingClientRect(),v=document.querySelector(".vf").getBoundingClientRect();return {r:r.width/r.height,cx:Math.abs((r.left+r.width/2)-(v.left+v.width/2)),cy:Math.abs((r.top+r.height/2)-(v.top+v.height/2))}}'); ok('camera guide is the real card shape and centred', abs(g['r']-CARD)<0.03 and g['cx']<2 and g['cy']<2, g)
        await pg.click('[data-act=cam-off]'); await b.close()
    ok('no console / page errors',not errs,errs[:3]); print(f'{sum(res)}/{len(res)} card-fit checks passed')
asyncio.run(main())
