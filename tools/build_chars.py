"""Build LPC character assets: per-item packed layer atlases (player, runtime-composited)
and pre-composited looks (enemies / NPCs)."""
import json, os, sys
from PIL import Image
from lpcdefs import *

OUT = '/home/claude/topdown/assets'
os.makedirs(OUT + '/items', exist_ok=True)
os.makedirs(OUT + '/looks', exist_ok=True)
D = load_defs()

# logical animations: name -> (cols, rows)
ANIMS = {
    'idle': (2, 4), 'walk': (9, 4), 'run': (8, 4), 'slash': (6, 4), 'backslash': (13, 4),
    'halfslash': (6, 4), 'thrust': (8, 4), 'spellcast': (7, 4), 'shoot': (13, 4),
    'hurt': (6, 1), 'jump': (5, 4), 'combat_idle': (2, 4),
}
CUSTOM = {'walk_128': ('walk', 128), 'slash_128': ('slash', 128), 'backslash_128': ('backslash', 128),
          'halfslash_128': ('halfslash', 128), 'thrust_128': ('thrust', 128),
          'thrust_oversize': ('thrust', 192), 'slash_oversize': ('slash', 192),
          'slash_reverse_oversize': ('backslash', 192)}
CREDIT_FILES = set()


def item_layers(key, body, variant):
    """returns list of layers: {z, anims: {anim: (file, fs)}}"""
    d = D[key]
    layers = []
    for ln in range(1, 12):
        L = d.get('layer_%d' % ln)
        if not L:
            break
        base = L.get(body)
        if not base:
            continue
        ca = L.get('custom_animation')
        anims = {}
        if ca:
            if ca not in CUSTOM:
                continue
            an, fs = CUSTOM[ca]
            f = custom_file(base, variant)
            if f:
                anims[an] = (f, fs)
        else:
            for an in ANIMS:
                f = layer_file(base, an, variant)
                if f:
                    anims[an] = (f, 64)
        if anims:
            layers.append({'z': L['zPos'], 'anims': anims})
    return layers


class Packer:
    def __init__(self, width=1024):
        self.W = width; self.x = 0; self.y = 0; self.rowh = 0; self.items = []

    def add(self, im):
        w, h = im.size
        if self.x + w > self.W:
            self.x = 0; self.y += self.rowh + 1; self.rowh = 0
        pos = (self.x, self.y)
        self.items.append((pos, im))
        self.x += w + 1; self.rowh = max(self.rowh, h)
        return pos

    def image(self):
        H = self.y + self.rowh + 1
        out = Image.new('RGBA', (self.W, max(1, H)))
        for pos, im in self.items:
            out.paste(im, pos)
        return out


def frames_of(im, fs, cols, rows):
    """yield (dir, i, trimmedimage, ox, oy) ; dir index row"""
    for r in range(rows):
        for c in range(cols):
            if (c + 1) * fs > im.width or (r + 1) * fs > im.height:
                yield r, c, None, 0, 0
                continue
            fr = im.crop((c * fs, r * fs, c * fs + fs, r * fs + fs))
            bb = fr.getbbox()
            if not bb:
                yield r, c, None, 0, 0
                continue
            yield r, c, fr.crop(bb), bb[0], bb[1]


def pack_item(name, key, variant=None, body='male'):
    layers = item_layers(key, body, variant)
    P = Packer(1024)
    man_layers = []
    for L in layers:
        ml = {'z': L['z'], 'a': {}}
        for an, (f, fs) in L['anims'].items():
            CREDIT_FILES.add(f)
            im = Image.open(f).convert('RGBA')
            cols, rows = ANIMS[an]
            grid = [[None] * cols for _ in range(rows)]
            any_ = False
            for r, c, tr, ox, oy in frames_of(im, fs, cols, rows):
                if tr is None:
                    continue
                x, y = P.add(tr)
                grid[r][c] = [x, y, tr.width, tr.height, ox, oy]
                any_ = True
            if any_:
                ml['a'][an] = {'fs': fs, 'f': grid}
        if ml['a']:
            man_layers.append(ml)
    img = P.image()
    img.save(OUT + '/items/%s.png' % name, optimize=True)
    d = D[key]
    chans = []
    for chn, ch in channels(d).items():
        src = source_palette(ch)
        if src:
            chans.append({'id': chn, 'mat': ch['material'], 'src': src})
    return {'file': 'items/%s.png' % name, 'layers': man_layers, 'ch': chans,
            'body_match': bool(d.get('match_body_color'))}


def compose_look(name, items, anims, body='male'):
    """items: list of (key, variant, choice dict). pre-composite to packed atlas"""
    allL = []
    for key, variant, choice in items:
        pairs = recolor_map(D[key], choice or {})
        for L in item_layers(key, body, variant):
            allL.append((L['z'], L['anims'], pairs))
    allL.sort(key=lambda t: t[0])
    cache = {}
    P = Packer(1024)
    man = {}
    for an in anims:
        cols, rows = ANIMS[an]
        fsmax = max([lan[an][1] for z, lan, p in allL if an in lan] or [64])
        grid = [[None] * cols for _ in range(rows)]
        for r in range(rows):
            for c in range(cols):
                fr = Image.new('RGBA', (fsmax, fsmax))
                for z, lan, pairs in allL:
                    if an not in lan:
                        continue
                    f, fs = lan[an]
                    ck = (f, id(pairs))
                    if ck not in cache:
                        CREDIT_FILES.add(f)
                        cache[ck] = apply_recolor(Image.open(f).convert('RGBA'), pairs)
                    im = cache[ck]
                    if (c + 1) * fs > im.width or (r + 1) * fs > im.height:
                        continue
                    off = (fsmax - fs) // 2
                    fr.alpha_composite(im.crop((c * fs, r * fs, c * fs + fs, r * fs + fs)), (off, off))
                bb = fr.getbbox()
                if not bb:
                    continue
                tr = fr.crop(bb)
                x, y = P.add(tr)
                grid[r][c] = [x, y, tr.width, tr.height, bb[0], bb[1]]
        man[an] = {'fs': fsmax, 'f': grid}
    P.image().save(OUT + '/looks/%s.png' % name, optimize=True)
    return {'file': 'looks/%s.png' % name, 'a': man}


def tint_item(newid, srcman, col):
    im = Image.open(OUT + '/' + srcman['file']).convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0: continue
            mx, mn = max(r, g, b), min(r, g, b)
            if mx > 70 and mx - mn < 40:  # métal gris -> teinté
                k = mx / 255
                px[x, y] = (int(col[0] * k * 0.85 + r * 0.15), int(col[1] * k * 0.85 + g * 0.15), int(col[2] * k * 0.85 + b * 0.15), a)
    im.save(OUT + '/items/%s.png' % newid, optimize=True)
    m = dict(srcman); m['file'] = 'items/%s.png' % newid; m['ch'] = []
    return m


def find(suffix):
    ks = [k for k in D if k.endswith('/' + suffix) or k == suffix]
    if not ks:
        raise KeyError(suffix)
    return ks[0]


# ---------------- player item catalog (male body) ----------------
PLAYER = {
    # id: (def suffix, variant)
    'body': ('body/body', None),
    'head_human': ('heads_human_male', None),
    'hair_plain': ('hair_plain', None), 'hair_messy': ('hair_messy1', None),
    'hair_long': ('hair_long', None), 'hair_spiked': ('hair_spiked', None),
    'hair_ponytail': ('hair_ponytail', None), 'hair_bangs': ('hair_bangs', None),
    'beard': ('beards_medium', None),
    'shirt': ('torso_clothes_longsleeve', None),
    'leather': ('torso_armour_leather', None), 'plate': ('torso_armour_plate', None),
    'cape': ('cape_solid', None), 'belt': ('belt_leather', 'brown'),
    'pants': ('legs_pants', None), 'legs_plate': ('legs_armour', None),
    'boots': ('feet_boots_basic', None), 'feet_plate': ('feet_armour', None),
    'gloves': ('arms_gloves', None), 'arms_plate': ('arms_armour', None),
    'bracers': ('arms_bracers', None), 'pauldrons': ('shoulders_legion', None),
    'helm_barbuta': ('hat_helmet_barbuta', None), 'helm_horned': ('hat_helmet_horned', None),
    'helm_greathelm': ('hat_helmet_greathelm', None), 'hood': ('hat_hood_cloth', None),
    'wizard_hat': ('hat_magic_wizard', 'base_black'),
    'w_longsword': ('weapon_sword_longsword', 'longsword'), 'w_katana': ('weapon_sword_katana', 'katana'),
    'w_dagger': ('weapon_sword_dagger', 'dagger'), 'w_rapier': ('weapon_sword_rapier', 'rapier'),
    'w_waraxe': ('weapon_blunt_waraxe', 'waraxe'), 'w_mace': ('weapon_blunt_mace', 'mace'),
    'w_spear': ('weapon_polearm_spear', 'medium'), 'w_halberd': ('weapon_polearm_halberd', 'halberd'),
    'w_bow': ('weapon_ranged_bow_normal', 'medium'), 'w_arrow': ('weapon_ranged_bow_arrow', 'arrow'),
    'w_staff': ('weapon_magic_gnarled', 'medium'), 'w_crystal': ('weapon_magic_crystal', 'blue'),
    'w_wand': ('weapon_magic_wand', None),
    'shield_crusader': ('shield_crusader', 'crusader'), 'shield_round': ('shield_round', 'brown'),
    # Partie 5 : visuels supplémentaires
    'w_arming': ('weapon_sword_arming', 'iron'), 'w_arming_copper': ('weapon_sword_arming', 'copper'),
    'w_arming_gold': ('weapon_sword_arming', 'gold'), 'w_glow_blue': ('weapon_sword_glowsword', 'blue'),
    'w_glow_red': ('weapon_sword_glowsword', 'red'), 'w_saber': ('weapon_sword_saber', 'saber'),
    'w_scimitar': ('weapon_sword_scimitar', 'scimitar'), 'w_longsword_alt': ('weapon_sword_longsword_alt', None),
    'w_scythe': ('weapon_polearm_scythe', 'scythe'), 'w_longspear': ('weapon_polearm_longspear', 'light'),
    'w_longspear_brass': ('weapon_polearm_longspear', 'brass'), 'w_dragonspear': ('weapon_polearm_dragonspear', 'red'),
    'w_trident': ('weapon_polearm_trident', 'medium'), 'w_bow_great': ('weapon_ranged_bow_great', 'brass'),
    'w_bow_recurve': ('weapon_ranged_bow_recurve', 'light'), 'w_bow_recurve_bronze': ('weapon_ranged_bow_recurve', 'bronze'),
    'shield_spartan': ('shield_spartan', 'spartan'), 'shield_round_silver': ('shield_round', 'silver'),
    'shield_scutum': ('shield_scutum', None),
    'chainmail': ('torso_chainmail', None), 'legion': ('torso_armour_legion', None), 'robe': ('torso_jacket_frock', 'purple'),
    'helm_kettle': ('hat_helmet_kettle', None), 'helm_armet': ('hat_helmet_armet', None),
    'necklace': ('neck_amulet_star', 'gold_blue'), 'cape_tattered': ('cape_tattered', None),
}
# version corps féminin quand la couche masculine n'existe pas ou diffère trop
FEMALE_OVERRIDE = {'robe': ('torso_clothes_robe', 'purple')}
# ---------------- création du personnage : races, visages, coiffures, tenues ----------------
CREATOR = {
    # têtes (visage) : humaines (elfe et demi-démon utilisent aussi ces têtes), orc, lézard
    'hd_hm1': ('heads_human_male', None), 'hd_hm2': ('heads_human_male_gaunt', None), 'hd_hm3': ('heads_human_male_plump', None),
    'hd_hm4': ('heads_human_male_elderly', None), 'hd_hf1': ('heads_human_female', None), 'hd_hf2': ('heads_human_female_small', None),
    'hd_hf3': ('heads_human_female_elderly', None),
    'hd_orc_m': ('heads_orc_male', None), 'hd_orc_f': ('heads_orc_female', None),
    'hd_liz_m': ('heads_lizard_male', None), 'hd_liz_f': ('heads_lizard_female', None),
    # traits raciaux
    'ears_elven': ('head_ears_elven', None), 'ears_long': ('head_ears_long', None), 'ears_medium': ('head_ears_medium', None),
    'horns_curled': ('head_horns_curled', None), 'horns_back': ('head_horns_backwards', None),
    'tail_lizard': ('tail_lizard', None),
    'wings_bat': ('wings_bat', 'raven'),
    # visage
    'nose_button': ('head_nose_button', None), 'nose_straight': ('head_nose_straight', None), 'nose_big': ('head_nose_big', None),
    'brows_thin': ('eyebrows_thin', None), 'brows_thick': ('eyebrows_thick', None),
    # coiffures et pilosité supplémentaires
    'hair_bob': ('hair_bob', None), 'hair_pixie': ('hair_pixie', None), 'hair_braid': ('hair_braid', None),
    'hair_bangslong': ('hair_bangslong', None), 'hair_curly_long': ('hair_curly_long', None), 'hair_bunches': ('hair_bunches', None),
    'hair_loose': ('hair_loose', None), 'hair_wavy': ('hair_wavy', None), 'hair_buzzcut': ('hair_buzzcut', None),
    'hair_afro': ('hair_afro', None), 'hair_curtains': ('hair_curtains', None), 'hair_princess': ('hair_princess', None),
    'beard_trim': ('beards_trimmed', None), 'beard_winter': ('beards_winter', None), 'beard_stubble': ('beards_5oclock_shadow', None),
    'mustache': ('beards_mustache', None),
    # tenues de départ et accessoires
    'shortsleeve': ('torso_clothes_shortsleeve', None),
    'shorts': ('legs_shorts', None), 'skirt': ('legs_skirts_plain', None), 'shoes': ('feet_shoes_basic', None),
    'scarf': ('neck_scarf', None), 'bandana': ('hat_bandana', None),
}

# teintes (variantes de lame générées à partir d'une arme existante) : id -> (source, couleur RGB)
TINTS = {
    'w_scythe_mist': ('w_scythe', (150, 190, 230)), 'w_scythe_king': ('w_scythe', (170, 120, 230)),
    'w_katana_thunder': ('w_katana', (255, 225, 90)), 'w_katana_abyss': ('w_katana', (150, 60, 200)),
    'w_dagger_serpent': ('w_dagger', (110, 220, 110)), 'w_dagger_twilight': ('w_dagger', (240, 170, 255)),
    'w_spear_storm': ('w_spear', (110, 220, 255)),
}

# ---------------- enemy / npc looks ----------------
EN_ANIMS = ['walk', 'slash', 'thrust', 'spellcast', 'shoot', 'hurt']


def L(suffix, variant=None, **choice):
    return (find(suffix), variant, choice)


LOOKS = {
    'orc_warrior': ([L('body/body', color_1='green'), L('heads_orc_male', color_1='green'),
                     L('torso_armour_leather', color_1='brown', color_2='iron'),
                     L('legs_pants', color_1='brown'), L('feet_boots_basic', color_1='black'),
                     L('weapon_blunt_waraxe', 'waraxe')], ['walk', 'slash', 'hurt']),
    'goblin_rogue': ([L('body/body', color_1='green'), L('heads_goblin', color_1='green'),
                      L('torso_clothes_longsleeve', color_1='maroon'), L('legs_pants', color_1='walnut'),
                      L('feet_boots_basic', color_1='leather'), L('weapon_sword_dagger', 'dagger')],
                     ['walk', 'slash', 'thrust', 'hurt']),
    'skeleton_archer': ([L('body_skeleton'), L('heads_skeleton'),
                         L('weapon_ranged_bow_normal', 'dark'), L('weapon_ranged_bow_arrow', 'arrow')],
                        ['walk', 'shoot', 'hurt']),
    'lizard_spearman': ([L('body/body', color_1='olive'), L('heads_lizard_male', color_1='olive'),
                         L('torso_armour_legion', color_1='bronze'), L('legs_pants', color_1='forest'),
                         L('weapon_polearm_spear', 'dark')], ['walk', 'thrust', 'hurt']),
    'wolf_brute': ([L('body/body', color_1='fur_grey'), L('heads_wolf_male', color_1='fur_grey'),
                    L('legs_pants', color_1='charcoal'), L('arms_bracers', color_1='iron'),
                    L('weapon_blunt_mace', 'mace')], ['walk', 'slash', 'hurt']),
    'dark_mage': ([L('body/body', color_1='lavender'), L('heads_vampire', color_1='lavender'),
                   L('torso_clothes_longsleeve', color_1='black'), L('legs_pants', color_1='black'),
                   L('hat_hood_cloth', color_1='purple'), L('weapon_magic_crystal', 'purple')],
                  ['walk', 'spellcast', 'thrust', 'hurt']),
    'orc_chief': ([L('body/body', color_1='dark_green'), L('heads_orc_male', color_1='dark_green'),
                   L('torso_armour_plate', color_1='iron'), L('legs_armour', color_1='iron'),
                   L('feet_armour', color_1='iron'), L('arms_armour', color_1='iron'),
                   L('hat_helmet_horned', color_1='bronze'), L('cape_solid', color_1='red'),
                   L('weapon_polearm_halberd', 'halberd')], ['walk', 'slash', 'thrust', 'hurt']),
    'demon_brute': ([L('body/body', color_1='zombie'), L('heads_orc_male', color_1='zombie'),
                     L('head_horns_curled'), L('wings_bat'), L('tail_lizard_alt'),
                     L('legs_pants', color_1='black'), L('arms_bracers', color_1='gold'),
                     L('weapon_blunt_waraxe', 'waraxe')], ['walk', 'slash', 'hurt']),
    'king_specter': ([L('body_skeleton'), L('heads_skeleton'), L('hat_formal_crown', 'crown_gold'),
                      L('cape_tattered', color_1='purple'), L('torso_armour_legion', color_1='gold'),
                      L('weapon_polearm_scythe', 'scythe')], ['walk', 'slash', 'hurt']),
    'npc_artisan': ([L('body/body', color_1='taupe'), L('heads_human_female', color_1='taupe', color_2='brown'),
                     L('hair_ponytail', color_1='chestnut'), L('torso_clothes_longsleeve', color_1='tan'),
                     L('torso_aprons_apron', 'leather'), L('legs_pants', color_1='walnut'), L('feet_boots_basic', color_1='brown')], ['walk']),
    'npc_alchemist': ([L('body/body', color_1='light'), L('heads_human_male_gaunt', color_1='light', color_2='green'),
                       L('hair_long', color_1='gray'), L('torso_clothes_longsleeve', color_1='forest'), L('torso_jacket_frock', 'forest'), L('legs_pants', color_1='charcoal'), L('feet_shoes_basic', color_1='black')], ['walk']),
    'npc_runemaster': ([L('body/body', color_1='brown'), L('heads_human_male', color_1='brown', color_2='purple'),
                        L('hair_buzzcut', color_1='white'), L('beards_winter', color_1='white'), L('torso_clothes_longsleeve', color_1='navy'), L('torso_jacket_frock', 'navy'), L('legs_pants', color_1='black'), L('feet_boots_basic', color_1='black'),
                        L('hat_magic_wizard', 'base_black')], ['walk']),
    'npc_relic': ([L('body/body', color_1='amber'), L('heads_human_female', color_1='amber', color_2='blue'),
                   L('hair_bob', color_1='black'), L('torso_clothes_longsleeve', color_1='white'), L('torso_jacket_tabard', 'lavender'), L('legs_pants', color_1='charcoal'),
                   L('feet_boots_basic', color_1='black')], ['walk']),
    # Maître Mage et maîtres des styles de combat
    'npc_archmage': ([L('body/body', color_1='light'), L('heads_human_male_elderly', color_1='light', color_2='blue'),
                      L('hair_long', color_1='white'), L('beards_winter', color_1='white'), L('torso_clothes_longsleeve', color_1='navy'),
                      L('torso_jacket_frock', 'navy'), L('legs_pants', color_1='navy'), L('feet_shoes_basic', color_1='black'),
                      L('cape_solid', color_1='purple'), L('hat_magic_wizard', 'base_black'), L('weapon_magic_gnarled', 'medium')], ['walk', 'spellcast']),
    'npc_m_epee': ([L('body/body', color_1='light'), L('heads_human_female', color_1='light', color_2='green'),
                    L('hair_ponytail', color_1='red'), L('torso_armour_leather', color_1='brown', color_2='iron'), L('legs_pants', color_1='walnut'),
                    L('feet_boots_basic', color_1='brown'), L('arms_bracers', color_1='brown'), L('weapon_sword_arming', 'iron')], ['walk', 'slash'], 'female'),
    'npc_m_katana': ([L('body/body', color_1='olive'), L('heads_human_male_gaunt', color_1='olive', color_2='brown'),
                      L('hair_buzzcut', color_1='black'), L('beards_trimmed', color_1='gray'), L('torso_clothes_longsleeve', color_1='navy'),
                      L('legs_pants', color_1='black'), L('feet_shoes_basic', color_1='black'), L('weapon_sword_katana', 'katana')], ['walk', 'slash']),
    'npc_m_arc': ([L('body/body', color_1='light'), L('heads_human_female', color_1='light', color_2='green'), L('head_ears_elven', color_1='light'),
                   L('hair_long', color_1='platinum'), L('torso_clothes_longsleeve', color_1='forest'), L('legs_pants', color_1='walnut'),
                   L('feet_boots_basic', color_1='brown'), L('weapon_ranged_bow_recurve', 'light')], ['walk', 'shoot'], 'female'),
    'npc_m_faux': ([L('body/body', color_1='light'), L('heads_human_male_gaunt', color_1='light', color_2='gray'),
                    L('torso_clothes_longsleeve', color_1='black'), L('torso_jacket_frock', 'charcoal'), L('legs_pants', color_1='black'),
                    L('feet_boots_basic', color_1='black'), L('cape_tattered', color_1='black'), L('hat_hood_cloth', color_1='black'),
                    L('weapon_polearm_scythe', 'scythe')], ['walk', 'slash']),
    'npc_m_bouclier': ([L('body/body', color_1='bronze'), L('heads_human_male', color_1='bronze', color_2='brown'),
                        L('hair_plain', color_1='dark_brown'), L('beards_beard', color_1='dark_brown'), L('torso_armour_plate', color_1='steel'),
                        L('legs_armour', color_1='steel'), L('feet_armour', color_1='steel'), L('arms_armour', color_1='steel'),
                        L('shield_crusader', 'crusader')], ['walk', 'slash']),
    'npc_m_dagues': ([L('body/body', color_1='taupe'), L('heads_human_female', color_1='taupe', color_2='purple'),
                      L('hair_bob', color_1='black'), L('torso_armour_leather', color_1='black', color_2='iron'), L('legs_pants', color_1='charcoal'),
                      L('feet_boots_basic', color_1='black'), L('hat_hood_cloth', color_1='charcoal'), L('weapon_sword_dagger', 'dagger')], ['walk', 'slash'], 'female'),
    'npc_m_lance': ([L('body/body', color_1='green'), L('heads_lizard_male', color_1='green'), L('tail_lizard', color_1='green'),
                     L('torso_armour_legion', color_1='bronze'), L('legs_pants', color_1='brown'), L('feet_boots_basic', color_1='brown'),
                     L('weapon_polearm_longspear', 'light')], ['walk', 'thrust']),
    # villagers
    'npc_smith': ([L('body/body', color_1='bronze'), L('heads_human_male', color_1='bronze', color_2='brown'),
                   L('hair_buzzcut', color_1='black'), L('beards_medium', color_1='black'),
                   L('torso_aprons_apron', 'leather'), L('legs_pants', color_1='charcoal'),
                   L('feet_boots_basic', color_1='black')], ['walk']),
    'npc_elder': ([L('body/body', color_1='light'), L('heads_human_male_elderly', color_1='light', color_2='blue'),
                   L('hair_balding', color_1='white'), L('beards_winter', color_1='white'),
                   L('torso_clothes_longsleeve', color_1='forest'), L('legs_pants', color_1='brown'),
                   L('feet_shoes_basic', color_1='brown')], ['walk']),
    'npc_mage': ([L('body/body', color_1='taupe'), L('heads_human_female', color_1='taupe', color_2='green'),
                  L('hair_long', color_1='platinum'), L('torso_clothes_longsleeve', color_1='navy'),
                  L('legs_skirts_plain', color_1='blue'), L('hat_magic_wizard', 'base_black')], ['walk']),
    'npc_merchant': ([L('body/body', color_1='olive'), L('heads_human_male_plump', color_1='olive', color_2='brown'),
                      L('hair_parted', color_1='chestnut'), L('torso_jacket_tabard', 'blue'),
                      L('legs_pants', color_1='tan'), L('feet_boots_basic', color_1='brown')], ['walk']),
    'npc_guard': ([L('body/body', color_1='light'), L('heads_human_male', color_1='light', color_2='gray'),
                   L('torso_armour_plate', color_1='steel'), L('legs_armour', color_1='steel'),
                   L('feet_armour', color_1='steel'), L('hat_helmet_barbuta', color_1='steel'),
                   L('weapon_polearm_spear', 'medium')], ['walk', 'thrust']),
}

def same_paths(key):
    d = D[key]
    for ln in range(1, 12):
        L = d.get('layer_%d' % ln)
        if not L: break
        if L.get('male') != L.get('female'): return False
    return True


def demon_palettes(P):
    """palettes de peau démoniaques dérivées de la palette 'light' (rampe de luminance)"""
    import colorsys
    base = P['body_ulpc']['light']; out = {}
    for name, (h, s_, lmul) in {'demon_crimson': (0.99, 0.58, 0.68), 'demon_ember': (0.03, 0.62, 0.8), 'demon_violet': (0.76, 0.32, 0.78),
                                'demon_ash': (0.6, 0.08, 0.76), 'demon_obsidian': (0.72, 0.2, 0.45)}.items():
        pal = []
        for hx in base:
            r, g, b = hex2rgb(hx); _, l, _ = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            rr, gg, bb = colorsys.hls_to_rgb(h, min(0.95, l * lmul), s_)
            pal.append('#%02x%02x%02x' % (int(rr * 255), int(gg * 255), int(bb * 255)))
        out[name] = pal
    return out


if __name__ == '__main__':
    man = {'anims': {k: list(v) for k, v in ANIMS.items()}, 'items': {}, 'looks': {}}
    only = sys.argv[1:]
    for iid, (suf, var) in list(PLAYER.items()) + list(CREATOR.items()):
        if only and iid not in only and 'looks' not in only:
            continue
        try:
            key = find(suf)
            if iid not in FEMALE_OVERRIDE and 'male' not in D[key]['layer_1'] and 'female' in D[key]['layer_1']:
                man['items'][iid] = pack_item(iid, key, var, 'female')
            else:
                man['items'][iid] = pack_item(iid, key, var)
            if iid in FEMALE_OVERRIDE:
                fs, fv = FEMALE_OVERRIDE[iid]; man['items'][iid + '@f'] = pack_item(iid + '@f', find(fs), fv, 'female')
            elif 'female' in D[key]['layer_1'] and not same_paths(key):
                man['items'][iid + '@f'] = pack_item(iid + '@f', key, var, 'female')
            print('item', iid, len(man['items'][iid]['layers']), 'layers', '+f' if iid + '@f' in man['items'] else '')
        except Exception as e:
            print('FAIL item', iid, e)
    for tid, (src, col) in TINTS.items():
        if only and 'looks' not in only and tid not in only:
            continue
        man['items'][tid] = tint_item(tid, man['items'][src], col)
        if src + '@f' in man['items']: man['items'][tid + '@f'] = tint_item(tid + '@f', man['items'][src + '@f'], col)
        print('tint', tid)
    for lid, spec in LOOKS.items():
        items, anims = spec[0], spec[1]; body = spec[2] if len(spec) > 2 else 'male'
        if only and 'looks' not in only and lid not in only and not man['looks']:
            pass
        try:
            man['looks'][lid] = compose_look(lid, items, anims, body)
            print('look', lid)
        except Exception as e:
            print('FAIL look', lid, repr(e))
    P, M = pal_tables()
    man['palettes'] = {k: v for k, v in P.items() if k.endswith('_ulpc') or k in ('all_lpcr',)}
    man['palettes']['body_ulpc'] = dict(man['palettes']['body_ulpc'], **demon_palettes(P))
    json.dump(man, open(OUT + '/chars.json', 'w'), separators=(',', ':'))
    json.dump(sorted(CREDIT_FILES), open(OUT + '/_char_credit_files.json', 'w'))
    print('done')
