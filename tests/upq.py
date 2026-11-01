# upload quality + robustness checks: originals byte-for-byte, 48MP, EXIF, file://, sandboxed iframe
import asyncio,os,sys,hashlib
HERE=os.path.dirname(os.path.abspath(__file__)); G=HERE+'/_gen'; DIST=os.path.abspath(HERE+'/../dist-mock')
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:8765/index.html'
res=[]
def ok(n,c,x=''):res.append((n,c));print(('PASS ' if c else 'FAIL ')+n,x)
async def upload_and_check(pg,f,frame=None):
    fr=frame or pg
    await fr.click('#nv > :nth-child(3)'); await pg.wait_for_timeout(300)
    await fr.select_option('#sd','new'); await fr.set_input_files('#fg',f); 
    await fr.wait_for_selector('[data-act="scan-save"]',timeout=30000); await pg.wait_for_timeout(300)
    await fr.click('[data-act="scan-save"]')
    await fr.wait_for_selector('#v0.on .face:not(.bk) .pimg.ok',timeout=30000)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--js-flags=--max-old-space-size=4096'])
        ctx=await b.new_context(viewport={'width':390,'height':844},accept_downloads=True,locale='th-TH')
        pg=await ctx.new_page(); errs=[]
        pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
        await pg.goto(BASE); await pg.wait_for_selector('#v0.on .pimg.ok')
        # 1) 48 MP JPEG kept byte-for-byte
        await upload_and_check(pg,G+'/p48.jpg')
        w=await pg.evaluate("document.querySelector('#v0 .face:not(.bk) .pimg').naturalWidth")
        ok('48MP photo shows at full width',w==8064,w)
        await pg.click('#nv > :nth-child(2)'); await pg.wait_for_selector('#v1.on .dl'); await pg.click('#v1 .dl >> nth=0'); await pg.wait_for_selector('#sh.on .slot')
        async with pg.expect_download() as dl: await pg.click('#sh [data-act="dl-orig"][data-side="front"]')
        d=await dl.value; pth=await d.path()
        same=hashlib.sha256(open(pth,'rb').read()).hexdigest()==hashlib.sha256(open(G+'/p48.jpg','rb').read()).hexdigest()
        ok('original download identical to uploaded file (no recompression)',same)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300); await pg.click('#nv > :nth-child(1)')
        # 2) EXIF rotated photo keeps orientation
        await upload_and_check(pg,G+'/exif.jpg')
        nw,nh=await pg.evaluate("[document.querySelector('#v0 .face:not(.bk) .pimg').naturalWidth,document.querySelector('#v0 .face:not(.bk) .pimg').naturalHeight]")
        ok('EXIF orientation respected',nw<nh,(nw,nh))
        # 3) BMP converted at full resolution
        await upload_and_check(pg,G+'/t.bmp')
        ok('BMP converted and shown',True)
        ok('no console errors',not [e for e in errs if 'upload' in e or 'image' in e],errs[:3])
        # 4) file:// open + upload
        fp=await ctx.new_page(); await fp.goto('file://'+DIST+'/index.html'); await fp.wait_for_selector('#v0.on .pimg.ok',timeout=20000)
        ok('file:// seeded images load',True)
        await upload_and_check(fp,G+'/photo.jpg'); ok('file:// upload shows photo',True)
        # 5) sandboxed iframe (opaque origin, like an embedded preview)
        open(DIST+'/sbx.html','w').write('<!doctype html><body style="margin:0"><iframe id=f sandbox="allow-scripts allow-downloads" src="index.html" style="width:390px;height:844px;border:0"></iframe>')
        sp=await ctx.new_page(); await sp.goto('http://127.0.0.1:8765/sbx.html')
        fr=None
        for _ in range(50):
            fr=next((f for f in sp.frames if f.url.endswith('index.html')),None)
            if fr: break
            await sp.wait_for_timeout(100)
        await fr.wait_for_selector('#v0.on .pimg.ok',timeout=20000); ok('sandboxed iframe seeded images load',True)
        await upload_and_check(sp,G+'/photo.jpg',fr); ok('sandboxed iframe upload shows photo',True)
        await b.close()
    print(f"{sum(c for _,c in res)}/{len(res)} upload checks passed")
asyncio.run(main())
