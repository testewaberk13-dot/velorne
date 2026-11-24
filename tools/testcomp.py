from lpcdefs import *
D=load_defs()
def layers_for(key, body, anim, variant=None):
    d=D[key]; out=[]
    for ln in range(1,10):
        L=d.get('layer_%d'%ln)
        if not L: break
        base=L.get(body)
        if not base: continue
        ca=L.get('custom_animation')
        if ca:
            want={'slash':'slash_oversize','backslash':'slash_reverse_oversize','thrust':'thrust_oversize','halfslash':None}.get(anim)
            if ca!=want: continue
            f=custom_file(base, variant); fs=192 if 'oversize' in ca else 128
        else:
            f=layer_file(base, anim, variant); fs=64
        if f: out.append((L['zPos'], f, fs, ca))
    return out
def compose(items, body, anim, cols, rows=4):
    big=any(True for it in items for (z,f,fs,ca) in layers_for(it[0],body,anim,it[1]) if fs>64)
    FS=192 if big else 64
    W=cols*FS; H=rows*FS
    out=Image.new('RGBA',(W,H))
    allL=[]
    for key,variant,choice in items:
        pairs=recolor_map(D[key],choice or {})
        for z,f,fs,ca in layers_for(key,body,anim,variant):
            allL.append((z,f,fs,pairs))
    allL.sort(key=lambda t:t[0])
    for z,f,fs,pairs in allL:
        im=apply_recolor(Image.open(f).convert('RGBA'),pairs)
        off=(FS-fs)//2
        for r in range(rows):
            for c in range(cols):
                fr=im.crop((c*fs,r*fs,c*fs+fs,r*fs+fs))
                out.alpha_composite(fr,(c*FS+off,r*FS+off))
    return out
if __name__=='__main__':
    hero=[('body/body','male',{'color_1':'light'}) if False else ('body/body',None,{'color_1':'amber'}),
          ('head/heads/human/heads_human_male',None,{'color_1':'amber','color_2':'brown'}),
          ('hair/bob/hair_bob',None,{'color_1':'raven'}),
          ('torso/armour/torso_armour_leather',None,{'color_1':'brown','color_2':'gold'}),
          ('legs/pants/legs_pants',None,{'color_1':'navy'}),
          ('feet/boots/feet_boots_basic',None,{'color_1':'leather'}),
          ('weapons/sword/weapon_sword_longsword','longsword',{})]
    for anim,cols in [('walk',9),('slash',6),('spellcast',7),('thrust',8)]:
        im=compose(hero,'male',anim,cols)
        im.resize((im.width*2,im.height*2),Image.NEAREST).save('/home/claude/assets_eval/hero_%s.png'%anim)
        print(anim, im.size)
