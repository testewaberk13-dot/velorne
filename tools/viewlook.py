import json,sys
from PIL import Image
man=json.load(open('/home/claude/topdown/assets/chars.json'))
names=sys.argv[1:]
rows=[]
for n in names:
    lk=man['looks'][n]; im=Image.open('/home/claude/topdown/assets/'+lk['file'])
    for an,a in lk['a'].items():
        fs=a['fs']; g=a['f']
        cols=len(g[0]); R=len(g)
        S=Image.new('RGBA',(cols*fs,R*fs),(60,70,60,255))
        for r in range(R):
            for c in range(cols):
                e=g[r][c]
                if e:
                    x,y,w,h,ox,oy=e
                    S.alpha_composite(im.crop((x,y,x+w,y+h)),(c*fs+ox,r*fs+oy))
        rows.append(S)
W=max(r.width for r in rows); H=sum(r.height for r in rows)
out=Image.new('RGBA',(W,H),(30,30,30,255)); y=0
for r in rows: out.paste(r,(0,y)); y+=r.height
out.save('/home/claude/assets_eval/looks.png'); print(out.size)
