# Generates the large/odd upload fixtures used by upq.py (48 MP JPEG, EXIF-rotated JPEG, BMP, normal photo) into tests/_gen/.
import os, random
from PIL import Image, ImageDraw
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'_gen'); os.makedirs(D,exist_ok=True)
def scene(w,h):
    im=Image.new('RGB',(w,h)); d=ImageDraw.Draw(im); r=random.Random(7)
    for y in range(0,h,max(1,h//120)): d.rectangle([0,y,w,y+h//120+1],fill=(40+y*160//h,70+y*100//h,150))
    for _ in range(60): x,y=r.randrange(w),r.randrange(h); s=r.randrange(w//40,w//10); d.ellipse([x,y,x+s,y+s],fill=tuple(r.randrange(256) for _ in range(3)))
    return im
if not os.path.exists(D+'/p48.jpg'):
    small=scene(2016,1512); small.resize((8064,6048),Image.BICUBIC).save(D+'/p48.jpg',quality=88)
if not os.path.exists(D+'/exif.jpg'):
    im=scene(1200,800); ex=Image.Exif(); ex[0x0112]=6; im.save(D+'/exif.jpg',quality=90,exif=ex)   # stored landscape, EXIF says rotate -> shows portrait
scene(900,600).save(D+'/t.bmp'); scene(1600,1100).save(D+'/photo.jpg',quality=90)
print('fixtures ready in',D)
# --- card-framing fixtures: synthetic photos of a card on a plain dark table (never real documents)
import random
from PIL import ImageFilter
def table(w,h): 
    im=Image.new('RGB',(w,h),(34,36,52)); r=random.Random(3); px=im.load()
    for _ in range(4000): px[r.randrange(w),r.randrange(h)]=(40+r.randrange(8),42+r.randrange(8),58+r.randrange(8))
    return im
def card(im,x,y,cw,ch,light=(222,232,246)):
    d=ImageDraw.Draw(im); d.rounded_rectangle([x,y,x+cw,y+ch],radius=int(ch*.06),fill=light,outline=(150,160,185),width=3)
    for i in range(6): d.rectangle([x+cw*.08,y+ch*(.2+.11*i),x+cw*(.45+.06*(i%3)),y+ch*(.2+.11*i)+ch*.035],fill=(110,120,150))
    d.rectangle([x+cw*.68,y+ch*.25,x+cw*.9,y+ch*.7],fill=(180,190,215))
if not os.path.exists(D+'/cardphoto.jpg'):
    a=table(1600,1200); card(a,300,260,1000,630); a.save(D+'/cardphoto.jpg',quality=90)            # exact ID-1 ratio card, centred-ish
    b=table(1600,1200); card(b,360,280,880,640); b.save(D+'/cardphoto_off.jpg',quality=90)            # card photographed 1.375 : 1 (not the real ratio)
    c=table(1200,1600); card(c,285,300,630,1000); c.save(D+'/cardphoto_side.jpg',quality=90)          # card standing on its side
    p=table(1600,1200); d=ImageDraw.Draw(p); d.rectangle([520,60,1080,1140],fill=(235,235,235))       # A4-like page on the table (0.52:1... made 0.707 below)
    p=table(1600,1400); d=ImageDraw.Draw(p); d.rectangle([450,100,1150,1090],fill=(238,238,238)); p.save(D+'/page.jpg',quality=90)  # portrait page 0.707 : 1
print('card fixtures ready')
