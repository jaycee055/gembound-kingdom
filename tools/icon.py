from PIL import Image, ImageDraw, ImageFilter
import math, sys
def make(S, maskable=False):
    im=Image.new("RGBA",(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    # background radial purple
    bg=Image.new("RGBA",(S,S)); bd=ImageDraw.Draw(bg)
    for i in range(S//2,0,-1):
        t=i/(S/2); c=(int(42+80*(1-t)),int(26+50*(1-t)),int(90+110*(1-t)),255)
        bd.ellipse([S/2-i*1.45,S*0.42-i*1.45,S/2+i*1.45,S*0.42+i*1.45],fill=c)
    if maskable: im=bg
    else:
        m=Image.new("L",(S,S),0); ImageDraw.Draw(m).rounded_rectangle([0,0,S-1,S-1],radius=int(S*0.22),fill=255)
        im.paste(bg,(0,0),m)
    d=ImageDraw.Draw(im)
    k=0.78 if maskable else 1.0
    cx,cy=S/2,S*0.56; R=S*0.30*k
    # gem (hexagon-ish brilliant)
    pts=[(cx,cy-R),(cx+R*0.95,cy-R*0.35),(cx+R*0.6,cy+R*0.85),(cx-R*0.6,cy+R*0.85),(cx-R*0.95,cy-R*0.35)]
    sh=Image.new("RGBA",(S,S),(0,0,0,0)); ImageDraw.Draw(sh).polygon([(x,y+S*0.02) for x,y in pts],fill=(0,0,0,120)); sh=sh.filter(ImageFilter.GaussianBlur(S*0.015)); im.alpha_composite(sh)
    d.polygon(pts,fill=(154,79,224),outline=(60,20,110),width=max(2,S//80))
    d.polygon([(cx,cy-R),(cx+R*0.95,cy-R*0.35),(cx,cy-R*0.1)],fill=(214,170,255))
    d.polygon([(cx,cy-R),(cx-R*0.95,cy-R*0.35),(cx,cy-R*0.1)],fill=(190,130,250))
    d.polygon([(cx-R*0.95,cy-R*0.35),(cx,cy-R*0.1),(cx-R*0.6,cy+R*0.85)],fill=(120,50,200))
    d.polygon([(cx+R*0.95,cy-R*0.35),(cx,cy-R*0.1),(cx+R*0.6,cy+R*0.85)],fill=(100,40,180))
    d.polygon([(cx,cy-R*0.1),(cx-R*0.6,cy+R*0.85),(cx+R*0.6,cy+R*0.85)],fill=(140,70,220))
    d.ellipse([cx-R*0.55,cy-R*0.75,cx-R*0.2,cy-R*0.55],fill=(255,255,255,200))
    # crown
    cw=R*1.3; top=cy-R*1.55; base=cy-R*0.95
    cp=[(cx-cw/2,base),(cx-cw/2,top+R*0.15),(cx-cw/4,top+R*0.35),(cx,top-R*0.05),(cx+cw/4,top+R*0.35),(cx+cw/2,top+R*0.15),(cx+cw/2,base)]
    d.polygon(cp,fill=(244,199,94),outline=(138,90,16),width=max(2,S//90))
    d.rectangle([cx-cw/2,base-R*0.12,cx+cw/2,base],fill=(217,161,58))
    for x,col in [(cx-cw/4,(232,40,74)),(cx,(47,111,224)),(cx+cw/4,(37,180,110))]:
        r=R*0.07; d.ellipse([x-r,base-R*0.1-r,x+r,base-R*0.1+r],fill=col)
    return im
out=sys.argv[1]
for n in [180,192,512]: make(n).save(f"{out}/icon-{n}.png")
make(512,True).save(f"{out}/maskable-512.png")
make(1024).save(f"{out}/icon-1024.png")
