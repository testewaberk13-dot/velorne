import json, os, glob
ROOT='/home/claude/liberatedpixelcup/universal-lpc-spritesheet-character-generator'
SS=ROOT+'/spritesheets/'
ANIM_FOLDER={'combat':'combat_idle','1h_slash':'halfslash','1h_backslash':'backslash','1h_halfslash':'halfslash'}
def load_defs():
    defs={}
    for f in glob.glob(ROOT+'/sheet_definitions/**/*.json',recursive=True):
        b=os.path.basename(f)
        if b.startswith('meta_'): continue
        try: d=json.load(open(f))
        except Exception: continue
        if 'layer_1' not in d: continue
        key=os.path.relpath(f,ROOT+'/sheet_definitions')[:-5]
        defs[key]=d
    return defs
def palettes():
    P={}
    for f in glob.glob(ROOT+'/palette_definitions/*/*.json'):
        b=os.path.basename(f)
        if b.startswith('meta_'):
            continue
        mat=os.path.basename(os.path.dirname(f))
        P[b[:-5]]=json.load(open(f))
    metas={}
    for f in glob.glob(ROOT+'/palette_definitions/*/meta_*.json'):
        d=json.load(open(f)); mat=os.path.basename(os.path.dirname(f))
        if d.get('type')=='material': metas[mat]=d
    return P,metas
def layer_file(base, anim, variant):
    """resolve png for normal anim"""
    folder=ANIM_FOLDER.get(anim,anim)
    c1=SS+base+folder+'.png'
    if os.path.exists(c1): return c1
    if variant:
        c2=SS+base+folder+'/'+variant+'.png'
        if os.path.exists(c2): return c2
    # directory with single png
    d=SS+base+folder
    if os.path.isdir(d):
        pngs=[p for p in os.listdir(d) if p.endswith('.png')]
        if len(pngs)==1: return d+'/'+pngs[0]
    return None
def custom_file(base, variant):
    if variant:
        c=SS+base+variant+'.png'
        if os.path.exists(c): return c
    if os.path.isdir(SS+base):
        pngs=[p for p in os.listdir(SS+base) if p.endswith('.png')]
        if len(pngs)==1: return SS+base+pngs[0]
    return None

from PIL import Image
_P,_M=None,None
def pal_tables():
    global _P,_M
    if _P is None: _P,_M=palettes()
    return _P,_M
def hex2rgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def channels(d):
    r=d.get('recolors')
    if not r: return {}
    if 'material' in r: return {'color_1':r}
    return {k:v for k,v in r.items() if isinstance(v,dict) and 'material' in v}
def source_palette(ch):
    P,M=pal_tables()
    mat=ch['material']; base=ch.get('base') or M[mat]['base']
    if '.' in base: base=base.split('.')[-1]
    tbl=P.get(mat+'_ulpc') or P.get(mat+'_lpcr')
    if base in tbl: return tbl[base]
    for k in P:
        if k.startswith(mat) and base in P[k]: return P[k][base]
    return None
def target_palette(ch, name):
    P,M=pal_tables()
    mat=ch['material']
    for pset in ch.get('palettes',['ulpc']):
        if '.' in pset: m2,ver=pset.split('.')
        else: m2,ver=mat,pset
        t=P.get(m2+'_'+ver)
        if t and name in t: return t[name]
    for k,t in P.items():
        if name in t: return t[name]
    return None
def recolor_map(d, choice):
    """choice: dict channel->palette name. returns list of (src,tgt) rgb"""
    pairs=[]
    for chn,ch in channels(d).items():
        nm=choice.get(chn)
        if not nm: continue
        s=source_palette(ch); t=target_palette(ch,nm)
        if s and t:
            for a,b in zip(s,t): pairs.append((hex2rgb(a),hex2rgb(b)))
    return pairs
def apply_recolor(im, pairs):
    if not pairs: return im
    im=im.convert('RGBA'); px=im.load(); W,H=im.size
    m={}
    for a,b in pairs: m[a]=b
    # tolerance match
    keys=list(m.keys())
    cache={}
    for y in range(H):
        for x in range(W):
            p=px[x,y]
            if p[3]==0: continue
            c=p[:3]
            if c in cache: r=cache[c]
            else:
                r=m.get(c)
                if r is None:
                    best=None;bd=40
                    for k in keys:
                        dd=abs(k[0]-c[0])+abs(k[1]-c[1])+abs(k[2]-c[2])
                        if dd<bd: bd=dd;best=k
                    r=m[best] if best else None
                cache[c]=r
            if r: px[x,y]=(r[0],r[1],r[2],p[3])
    return im
