# Vélorne — projet complet

## Contenu de l'archive
- `nouveau_jeu/` : le jeu actuel (RPG d'action en vue de dessus, en ligne : https://claude.ai/artifact/P9s7jZYHTJp48Ph3qRXZRW)
  - `index.html` : page, interface (styles CSS), menus
  - `js/core.js` : utilitaires, paramètres, touches reconfigurables, tactile, son et musique générés
  - `js/gfx.js` : chargement des images, recoloration des palettes LPC, composition des personnages par couches
  - `js/data.js` : objets et équipements, apparence, compétences, ennemis
  - `js/world.js` : décors, carte (terrain par sommets en coins), génération village et forêt, collisions
  - `js/fx.js` : particules, effets animés, lumières, ambiance
  - `js/entities.js` : joueur (combo, charge, esquive, parade, sorts, ultime), ennemis et IA, boss à 3 phases, projectiles, butin
  - `js/ui.js` : interface affichée en jeu (barres, minicarte, barre de compétences), commandes tactiles, menus, dialogues, boutique, forge, quêtes
  - `js/main.js` : état global, boucle à 60 Hz, rendu trié en profondeur, création du personnage, sauvegarde
  - `assets/` : images préparées (personnages LPC en couches, ennemis pré-composés, décors, monstres, effets, icônes) + `data.js` (manifestes) + `credits.json`
  - `tools/` : scripts Python qui génèrent `assets/` à partir des dépôts publics LPC (build_chars.py, build_env.py, build_data.py)
- `ancien_prototype_vue_cote/` : adaptation en vue de côté du cahier de conception (inachevée) ; contient les 7 styles de combat, les 27 magies, les raretés et le système de sorts (`js/data.js`, `js/magic.js`) à réutiliser
- `velorne_acte1_plateforme/` : premier jeu de plateforme, complet et testé (classes, butin, forge, quêtes, coffres, arène, boss)

## Sources graphiques (licences libres, à créditer)
- Personnages : github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator (CC-BY-SA 3.0 / GPL 3.0 / OGA-BY 3.0)
- Décors : github.com/ElizaWy/LPC (CC-BY 3.0 / OGA-BY 3.0)
- Monstres, effets magiques, icônes, biomes supplémentaires : github.com/tales/sourceoftales (CC-BY-SA 3.0 / GPL 3.0)

## Lancer
Servir le dossier `nouveau_jeu/` avec un serveur local (ex. `python3 -m http.server`) puis ouvrir index.html.
Pour régénérer les assets : cloner les 3 dépôts, ajuster les chemins en tête des scripts de `tools/`, puis lancer build_chars.py, build_env.py et build_data.py.
