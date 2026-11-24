"""Copy and index environment, monsters, effects and icons; collect credits."""
import json, os, shutil, csv, re, glob
from PIL import Image

OUT = '/home/claude/topdown/assets'
EL = '/home/claude/assets_src/ElizaWy-LPC/'
SOT = '/home/claude/assets_src/sourceoftales/'
LPC = '/home/claude/liberatedpixelcup/universal-lpc-spritesheet-character-generator/'
for d in ['env', 'mon', 'fx', 'ui']:
    os.makedirs(OUT + '/' + d, exist_ok=True)
USED = []  # (source path, dest)


def cp(src, dst):
    shutil.copy(src, OUT + '/' + dst)
    USED.append((src, dst))
    return dst


env = {}
# ---- terrain (corner-based autotile sheets) ----
env['terrain_summer'] = cp(EL + 'Terrain/terrain_summer.png', 'env/terrain_summer.png')
env['terrain_winter'] = cp(EL + 'Terrain/terrain_winter.png', 'env/terrain_winter.png')
env['trees'] = cp(EL + 'Terrain/trees_summer.png', 'env/trees_summer.png')
env['plants'] = cp(EL + 'Terrain/plants_summer.png', 'env/plants_summer.png')
env['flowers'] = cp(EL + 'Terrain/wildflowers_summer.png', 'env/wildflowers_summer.png')
env['rocks'] = cp(EL + 'Terrain/Rocks, Grasslands.png', 'env/rocks.png')
env['cliff'] = cp(EL + 'Terrain/cliff_summer.png', 'env/cliff_summer.png')
env['house_a'] = cp(EL + 'Structure/Structures/Brick House A.png', 'env/house_a.png')
env['house_b'] = cp(EL + 'Structure/Structures/Brick House B.png', 'env/house_b.png')
env['house_c'] = cp(EL + 'Structure/Structures/Paneled House A.png', 'env/house_c.png')
env['fountain'] = cp(EL + 'Structure/Misc/Fountain A.png', 'env/fountain.png')
env['barrel'] = cp(EL + 'Objects/Furniture/Barrel.png', 'env/barrel.png')
env['crate'] = cp(EL + 'Objects/Furniture/Crate.png', 'env/crate.png')
env['chest'] = cp(EL + 'Objects/Furniture/Chest.png', 'env/chest.png')
env['lamp'] = cp(EL + 'Objects/Furniture/Lighting, Outdoors.png', 'env/lamp.png')
env['campfire'] = cp(EL + 'Objects/Small Items/Fire, Camp.png', 'env/campfire.png')
env['anvil'] = cp(EL + 'Objects/Furniture/Smithing/Anvils.png', 'env/anvils.png')
env['forge'] = cp(EL + 'Objects/Furniture/Smithing/Forge A.png', 'env/forge.png')
env['splash'] = cp(EL + 'FX/Splash.png', 'env/splash.png')
env['fence'] = None
fences = glob.glob(EL + 'Structure/Fences/*.png')
if fences:
    env['fence'] = cp(sorted(fences)[0], 'env/fence.png')
# Source of Tales extra biomes
for n in ['lava', 'lavarock', 'sand', 'dungeon', 'castle_outside', 'gravestones', 'whitheredtree1',
          'evilchurch', 'shrine', 'mountains', 'grass_night', 'dirt_night', 'chests', 'signpost', 'bridges',
          'well', 'tent', 'mushrooms', 'treetop', 'trunk', 'water_anim', 'waterfall', 'town_buildings', 'cement']:
    fn = SOT + 'tiles/' + n + '.png'
    if n == 'well':
        fn = SOT + 'tiles/lpc-well.png'
    if os.path.exists(fn):
        env['sot_' + n] = cp(fn, 'env/sot_' + n + '.png')

# ---- monsters (Source of Tales, LPC base monsters) ----
mon = {}
for n in ['bat', 'bee', 'slime', 'snake', 'small_worm', 'eyeball']:
    mon[n] = {'img': cp(SOT + 'sprites/monsters/%s.png' % n, 'mon/%s.png' % n)}
    im = Image.open(SOT + 'sprites/monsters/%s.png' % n)
    mon[n]['fw'] = im.width // 3; mon[n]['fh'] = im.height // 4
    dp = SOT + 'sprites/monsters/%s_death.png' % n
    if os.path.exists(dp):
        mon[n]['death'] = cp(dp, 'mon/%s_death.png' % n)

# ---- effects (Extended LPC Magic Pack + others, via Source of Tales) ----
fx = {}
def addfx(name, fn, fw, fh, cols, rows):
    fx[name] = {'img': cp(SOT + 'particles/' + fn, 'fx/' + fn), 'fw': fw, 'fh': fh, 'cols': cols, 'rows': rows}
addfx('firelion_down', 'firelion_down.png', 128, 128, 4, 4)
addfx('firelion_up', 'firelion_up.png', 128, 128, 4, 4)
addfx('firelion_left', 'firelion_left.png', 128, 128, 4, 4)
addfx('firelion_right', 'firelion_right.png', 128, 128, 4, 4)
addfx('icetacle', 'icetacle.png', 128, 128, 4, 4)
addfx('torrentacle', 'torrentacle.png', 128, 128, 4, 4)
addfx('tornado', 'tornado.png', 128, 128, 4, 4)
addfx('lightningclaw', 'lightningclaw.png', 128, 128, 4, 4)
addfx('iceshield', 'iceshield.png', 128, 128, 4, 4)
addfx('turtleshell', 'turtleshell_front.png', 128, 128, 4, 4)
addfx('explosion', 'bomb_explosion.png', 64, 64, 8, 4)
addfx('rockspikes', 'rock_spikes.png', 64, 64, 10, 4)
addfx('quake', 'quake.png', 128, 128, 12, 1)
addfx('lightning', 'lightning1.png', 30, 198, 2, 1)
addfx('snakebite', 'snakebite_down.png', 128, 128, 4, 4)
addfx('flash', 'flash.png', 32, 32, 5, 5)
addfx('orbs', 'effects01.png', 32, 32, 10, 10)

# ---- icons: pack a curated atlas ----
ICONS = ['BrokenSword', 'Saber', 'SabreSteel', 'Dagger', 'Dagger03', 'AxeBattle', 'AxeGreat', 'Mace', 'MaceWar',
         'Pike', 'AxeHalberd', 'Bow', 'BowLong', 'Quarterstaff', 'Scepter03', 'RodTeal', 'ArmorLeatherSoft',
         'ArmorLeatherHard', 'ArmorPlatemailFull', 'ArmorChainMail', 'RobeBlue', 'RobePurple', 'CapLeather',
         'HelmHorned', 'CapSteel', 'BootsLeatherSoft', 'BootsMetal', 'GlovesLeatherSoft', 'GlovesSteel',
         'CloakRed', 'CloakBlue', 'RingGold', 'RingJewelBlue', 'RingSilverJeweledRedMagic', 'NecklaceGoldJewelBlue',
         'NecklaceJewelRed', 'PotionShortRed', 'PotionShortBlue', 'PotionTallGreen', 'PotionLargeYellow',
         'CoinsGold', 'CrystalsBlue', 'CrystalsPurple', 'JewelsRed', 'KeyBrass', 'Scroll0001', 'FoodBread',
         'FoodDrumstick', 'LightOrb', 'LightStar', 'GlyphRed', 'GlyphGreen', 'GlyphYellow', 'Lantern']
avail = {os.path.basename(f)[:-4]: f for f in glob.glob(SOT + 'items/*.png')}
for jsf in ['/home/claude/topdown/js/registry.js', '/home/claude/topdown/js/data.js']:
    for m in re.findall(r"icon: '([A-Za-z0-9]+)'", open(jsf).read()):
        if m not in ICONS: ICONS.append(m)
sw = [k for k in avail if k.lower().startswith('sword')]
ICONS = [i for i in ICONS if i in avail] + sorted(sw)[:6] + sorted(k for k in avail if k.startswith('Shield'))[:4]
cols = 16
rows = (len(ICONS) + cols - 1) // cols
atlas = Image.new('RGBA', (cols * 32, rows * 32))
icons = {}
for i, n in enumerate(ICONS):
    im = Image.open(avail[n]).convert('RGBA')
    if im.size != (32, 32):
        im = im.resize((32, 32), Image.NEAREST)
    atlas.paste(im, ((i % cols) * 32, (i // cols) * 32))
    icons[n] = [(i % cols) * 32, (i // cols) * 32]
    USED.append((avail[n], 'ui/icons.png'))
atlas.save(OUT + '/ui/icons.png')
for n in ['spell_firelion', 'spell_icetacle', 'spell_lightning', 'spell_shield', 'spell_snakebite', 'spell_watertacle']:
    cp(SOT + 'icons/%s.png' % n, 'ui/%s.png' % n)

# ---- credits ----
credits = []
# LPC characters: CREDITS.csv rows for used files
used_char = set(json.load(open(OUT + '/_char_credit_files.json')))
rel = set(os.path.relpath(f, LPC + 'spritesheets') for f in used_char)
seen = {}
with open(LPC + 'CREDITS.csv', newline='') as fh:
    for row in csv.DictReader(fh):
        fn = row['filename'].strip()
        if fn in rel:
            key = (row['authors'].strip(), row['licenses'].strip())
            seen.setdefault(key, set()).update(u for u in row['urls'].strip().split(',') if u)
for (authors, lic), urls in seen.items():
    credits.append({'what': 'Personnages LPC (générateur universel)', 'authors': authors, 'license': lic,
                    'urls': sorted(urls)[:6]})
# Eliza LPC Revised credits files for used folders
for src, dst in USED:
    if src.startswith(EL):
        cf = os.path.join(os.path.dirname(src), 'Credits.txt')
        if os.path.exists(cf):
            credits.append({'what': 'LPC Revised : ' + os.path.basename(src), 'text': open(cf, errors='ignore').read()[:1500],
                            'license': 'CC-BY 3.0 / OGA-BY 3.0', 'urls': ['https://github.com/ElizaWy/LPC']})
# Source of Tales AUTHORS
authors_lines = open(SOT + 'AUTHORS.txt', errors='ignore').read().splitlines()
for src, dst in USED:
    if src.startswith(SOT):
        r = os.path.relpath(src, SOT)
        for ln in authors_lines:
            if ln.strip().endswith(r):
                parts = re.split(r'\s{2,}', ln.strip())
                if len(parts) >= 3:
                    credits.append({'what': r, 'authors': parts[0], 'license': parts[1],
                                    'urls': ['https://github.com/tales/sourceoftales']})
# dedupe
out = []
ks = set()
for c in credits:
    k = json.dumps(c, sort_keys=True)
    if k not in ks:
        ks.add(k); out.append(c)
json.dump({'env': env, 'mon': mon, 'fx': fx, 'icons': icons}, open(OUT + '/env.json', 'w'), separators=(',', ':'))
json.dump(out, open(OUT + '/credits.json', 'w'), ensure_ascii=False, indent=0)
print('env', len(env), 'mon', len(mon), 'fx', len(fx), 'icons', len(icons), 'credits', len(out))
