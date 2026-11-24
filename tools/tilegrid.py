import sys
from PIL import Image, ImageDraw
f=sys.argv[1]; x0,y0,x1,y1=map(int,sys.argv[2:6]); out=sys.argv[6]; T=int(sys.argv[7]) if len(sys.argv)>7 else 32
im=Image.open(f).convert('RGBA').crop((x0,y0,x1,y1))
bg=Image.new('RGBA',im.size,(255,0,255,255)); bg.alpha_composite(im)
S=3; bg=bg.resize((im.width*S,im.height*S),Image.NEAREST); d=ImageDraw.Draw(bg)
for x in range(0,bg.width,T*S): d.line([(x,0),(x,bg.height)],fill=(0,0,0,255))
for y in range(0,bg.height,T*S): d.line([(0,y),(bg.width,y)],fill=(0,0,0,255))
for ty in range(im.height//T):
    for tx in range(im.width//T):
        d.text((tx*T*S+2,ty*T*S+2),'%d,%d'%(x0//T+tx,y0//T+ty),fill=(255,255,255,255))
bg.save(out)
