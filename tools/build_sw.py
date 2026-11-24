"""Génère sw.js : liste de tous les fichiers du jeu + version (empreinte) pour le hors ligne."""
import os, hashlib, json
ROOT = os.path.join(os.path.dirname(__file__), '..')
files = ['./', 'index.html', 'manifest.webmanifest']
for d in ['js', 'icons', 'assets/env', 'assets/fx', 'assets/items', 'assets/looks', 'assets/mon', 'assets/ui']:
    for f in sorted(os.listdir(os.path.join(ROOT, d))): files.append(d + '/' + f)
files.append('assets/data.js')
h = hashlib.sha1()
for f in files[1:]:
    h.update(open(os.path.join(ROOT, f), 'rb').read())
ver = h.hexdigest()[:10]
tpl = open(os.path.join(ROOT, 'tools/sw_template.js')).read()
open(os.path.join(ROOT, 'sw.js'), 'w').write(tpl.replace('__VERSION__', ver).replace('__FILES__', json.dumps(files)))
print('sw.js', ver, len(files), 'fichiers')
