import sys, json
from PIL import Image, ImageDraw
import numpy as np
from collections import deque
def blobs(path, minarea=20, gap=1):
    im=Image.open(path).convert('RGBA'); a=np.array(im)[:,:,3]>8
    H,W=a.shape
    # dilate by gap to merge close parts
    if gap>0:
        b=a.copy()
        for dy in range(-gap,gap+1):
            for dx in range(-gap,gap+1):
                b|=np.roll(np.roll(a,dy,0),dx,1)
        a2=b
    else: a2=a
    lab=np.zeros((H,W),int); n=0; res=[]
    for y in range(H):
        for x in range(W):
            if a2[y,x] and not lab[y,x]:
                n+=1; q=deque([(y,x)]); lab[y,x]=n; x0=x1=x; y0=y1=y; cnt=0
                while q:
                    cy,cx=q.popleft(); cnt+=1
                    x0=min(x0,cx);x1=max(x1,cx);y0=min(y0,cy);y1=max(y1,cy)
                    for ny,nx in ((cy+1,cx),(cy-1,cx),(cy,cx+1),(cy,cx-1)):
                        if 0<=ny<H and 0<=nx<W and a2[ny,nx] and not lab[ny,nx]:
                            lab[ny,nx]=n; q.append((ny,nx))
                if cnt>=minarea:
                    # shrink by gap
                    sub=a[y0:y1+1,x0:x1+1]
                    ys,xs=np.nonzero(sub)
                    if len(xs)==0: continue
                    res.append([int(x0+xs.min()),int(y0+ys.min()),int(xs.max()-xs.min()+1),int(ys.max()-ys.min()+1)])
    res.sort(key=lambda r:(r[1]//16,r[0]))
    return im,res
if __name__=='__main__':
    path=sys.argv[1]; out=sys.argv[2]; gap=int(sys.argv[3]) if len(sys.argv)>3 else 1
    im,res=blobs(path,gap=gap)
    S=2
    bg=Image.new('RGBA',im.size,(70,80,90,255)); bg.alpha_composite(im); bg=bg.resize((im.width*S,im.height*S),Image.NEAREST)
    d=ImageDraw.Draw(bg)
    for i,(x,y,w,h) in enumerate(res):
        d.rectangle([x*S,y*S,(x+w)*S-1,(y+h)*S-1],outline=(255,255,0,255))
        d.text((x*S+2,y*S+1),str(i),fill=(255,60,60,255))
    bg.save(out); print(json.dumps(res))
