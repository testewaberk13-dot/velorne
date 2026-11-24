# Vélorne — liste de conformité permanente

Établie le 24/11/2026 (audit historique, directive 12 ; auto-diagnostic, directive 13). Elle est **à tenir à jour à chaque séance** : toute nouvelle demande y entre avec son origine, son état et ses tests.

**Version contrôlée :** `jeu3d.html`, la version 3D officielle. `index.html` l'ouvre directement depuis le 24/11 ; le village pilote v4 est conservé dans `demo3d-v4.html`. `jeu-2d.html` est la référence logique, laissée intacte.

**Méthode de vérification :** les tests sont automatiques, dans Chrome sans carte graphique (rendu logiciel), sur ordinateur et en émulation de téléphone tactile. **Aucun test n'a été fait sur un vrai téléphone ni avec une vraie manette** : la manette est simulée. Les images par seconde mesurées en rendu logiciel ne représentent pas un appareil réel.

## Légende des états

| Code | État |
|---|---|
| ✅ | Entièrement intégré et fonctionnel dans la 3D |
| 🟨 | Intégré, mais incomplet |
| 👁 | Présent visuellement, mais non fonctionnel |
| 🔷 | Partiellement adapté à la 3D |
| ❌ | Absent de la 3D |
| ⚠️ | Modifié involontairement ou incohérent |
| ❓ | Impossible à vérifier |

**Origines :** U = demande de l'utilisateur · C2 = cahier des charges V2 · P5 = Partie 5 (armes, équipements, Spins) · CG = cahier de conception général · 2D = système du jeu 2D · 3D = exigence de la transformation 3D · B = bibles V1.2.

---

## A. Règles permanentes

| N° | Intitulé | Origine | État | Vérification |
|---|---|---|---|---|
| A1 | Ne rien supprimer, simplifier ni remplacer sans autorisation | U | ✅ | Aucun contenu retiré. Les anciennes versions sont conservées : `jeu-2d.html`, `demo3d-v1` à `v3`, `demo3d.html`. Les fichiers du jeu 2D (`js/`) n'ont pas été modifiés par la 3D : tout passe par des enveloppes dans `js3d/bridge2d.js`. |
| A2 | Taux du Magic Spin 5/25/35/25/10, jamais modifiés | U | ✅ | Données lues dans la 3D : 5/25/35/25/10. Mesure sur 100 000 tirages : 5,00 / 25,13 / 34,75 / 25,01 / 10,10 %. Garantie au 5e tirage (palier 4) et double magie 0,5 % inchangées. |
| A3 | 27 familles et 270 compétences, jamais supprimées ni fusionnées | U | ✅ | 27 familles et 270 compétences comptées dans la 3D. Chaque compétence est lancée en 3D par le test `t3d_270.py` (résultat en section E). |
| A4 | Ne pas présenter comme canon un lore non validé | U | ✅ | Les ajouts restent marqués PROPOSITION : histoires des missions, habitants du village pilote, réglages de la météo. |
| A5 | Ne jamais prétendre avoir testé ce qui ne l'a pas été | U | ✅ | Les limites sont rappelées en tête de ce document. |
| A6 | Connecteurs réservés au projet, aucune dépense, rien supprimer dans les comptes | U | ✅ | Hébergement sur GitHub public, publication par commits sans push forcé. |
| A7 | Distinguer existant, décidé, proposé et à valider | U | ✅ | Statuts tenus dans les bibles et dans ce document. |
| A8 | Sauvegarde `vel_td_save_v1` compatible | U/2D | ✅ | La 3D lit et écrit la même sauvegarde. Elle n'y ajoute que l'heure du jour (`G.flags.h3d`). Ses réglages vont dans `vel_set.c3d`. Le test `gst` charge une ancienne sauvegarde de niveau 20 dans la 3D. |
| A9 | Jeu 2D intact et accessible | U | ✅ | `jeu-2d.html` est inchangé. Le test `gc` montre un monde d'origine identique entre la 2D et la 3D : même empreinte de carte. |

## B. Demandes et directives de l'utilisateur

| N° | Intitulé | Origine | État | Écarts constatés | Corrections du 24/11 | Test |
|---|---|---|---|---|---|---|
| B1 | Deux bibles (monde, conception), mises à jour en V1.2 | U | ✅ | — | — | Documents du projet |
| B2 | Pixel 3D, direction prioritaire | U 23/11 | ✅ | — | — | Rendu basse définition avec contours, dans `jeu3d` |
| B3 | Feuillages denses, peints à la main | U 23/11 | ✅ | — | — | Végétation du village pilote reprise par blocs sur toute la carte |
| B4 | Héros en 8 directions | U 23/11 | ✅ | Dans `jeu3d`, le héros, les PNJ et les ennemis n'avaient que 4 directions. | Diagonales composées comme dans le village pilote : jambes de profil, haut du corps de face ou de dos. Le sens est calculé par rapport à la caméra. | Déplacement en diagonale : secteur SE affiché (capture `c1_diag`). |
| B4b | 8 directions pour les petits monstres | U 23/11 | ✅ | Leurs planches ne contiennent que 4 directions. | Les 4 diagonales sont maintenant composées comme pour le héros : bas du corps tiré de la vue de profil, haut du corps tiré de la vue de face ou de dos, resserré et décalé vers le côté regardé. Le sens suit la caméra. Pas de nouveau dessin à la main : les diagonales sont fabriquées à partir des planches existantes. | Planche de contrôle des 6 monstres en 8 directions |
| B5 | Caméra : perspective oblique derrière le héros (directive du 24/11 soir, remplace la vue plongeante) | U 23/11 → 24/11 | ✅ | Vue trop éloignée et plongeante (49°, 15 m). | Caméra oblique par défaut : 34°, 10,5 m, regard porté devant le héros (chemin et horizon visibles), qui se replace doucement derrière lui quand il avance (désactivable), brume de profondeur et léger flou de l'arrière-plan, monde chargé devant la caméra. Les anciens réglages sont migrés une fois. Angle réglable de 18° à 69°, rotation et distance conservées. La caméra ne traverse plus les murs des maisons de Brumeval. | Captures `obl_*`, `trail_*` ; `narr2` 44/44, `gs5`, `t7_pad`, `camp`, `t3d_bru2` |
| B5b | La caméra ne passe pas derrière les bâtiments | 3D (auto-diagnostic) | ✅ | Toit en plein écran en vue rasante, écran noir caméra tournée. | La caméra se rapproche du héros devant un bâtiment. La découpe autour du héros est étendue à tous les décors du kit. | Capture `c3_low` : vue rasante correcte |
| B6 | Visée : zoom progressif, ralenti maîtrisé, cadrage naturel | U 23/11 | ✅ | Dans `jeu3d`, le réticule et la trajectoire n'étaient plus dessinés, et il n'y avait ni zoom ni ralenti. | Trajectoire posée dans le monde et réticule (mêmes règles que le jeu). Zoom progressif (−20 %), cadrage décalé vers la visée, ralenti à 55 % limité à 2,5 s par visée. Le ralenti est désactivable : c'était une PROPOSITION dans la bible. | F5 |
| B7 | Vérifier ombres, collisions, hauteurs, masquage | U 23/11 | ✅ | — | Masquage étendu aux maisons, rochers, cristaux et images de secours | Captures |
| B8 | Prototype séparé jusqu'à validation, puis version plus aboutie sans perte | U 23/11 | ✅ | — | — | v1 à v4 conservées |
| B9 | Qualité visuelle de jeu commercial | U 24/11 | 🟨 | `jeu3d` restait moins beau que le village pilote hors de Brumeval. | Maisons du village pilote, météo, effets en volume (avant). Le 24/11 au soir : roche qui affleure sur les pentes, rives mouillées, eau avec dégradé de profondeur, écume et reflets du ciel, relief par région (collines, dunes, monts), formes 3D des compétences. **Le jugement final est visuel : à confirmer par toi sur un vrai écran.** | Captures `w3d`, `f3d` |
| B10 | La 3D est la version officielle : tout doit y exister | U 24/11 | ✅ | Toute la logique y est, avec le village pilote complet (intérieurs, routines, animaux, secrets) et les effets 3D natifs des 27 familles. Reste le passage de l'accueil vers `jeu3d`. | `t3d_bru`, `t3d_mag`, `narr2` |
| B11 | Brumeval v4 comme fondation | U 24/11 | ✅ | Moteur v4 (rendu, végétation, eau, ciel, matériaux) et contenu du village pilote intégrés dans `jeu3d` (F12 à F14), zone agrandie. | `t3d_bru`, `t3d_bru2` |
| B12 | Hébergement sur GitHub (liens githack) | U 24/11 | ✅ | — | — | Liens en fin de document |
| B13 | Noms des habitants cohérents | U 24/11 | ✅ | Doublons Maëlle/Maëlys, Ysolde/Ysold, Maëlis/Maëlys | Maëlys, Gwenna, Torven (bûcheron), Héloïse Vey (décisions du registre) | Relecture |
| B14 | Un seul lien principal | U 24/11 | ✅ | — | L'accueil (`index.html`) ouvre maintenant `jeu3d.html`, Brumeval y étant intégré. Le village pilote v4 est conservé à l'identique dans `demo3d-v4.html`. | Ouverture de l'accueil |
| B15 | Ne rien oublier de tout le travail effectué | U 24/11 | 🟨 | Une perte involontaire est retrouvée : la **pluie** des prototypes v1 à v3 avait disparu de la v4. | Pluie rétablie dans `jeu3d`, et neige ajoutée dans les régions froides (PROPOSITION de réglage) | Section F |
| B16 | Magie innée jamais choisie : rituel du Maître Mage | U (plan du lundi, point 17) | ✅ | — | — | `gs5` : aucune magie ni style à la création. `t7_pad` : Théobald envoie vers Orvael. |
| B17 | Premier style appris auprès d'un maître de combat | U (point 17) | ✅ | — | — | `gs5`, `gq` |
| B18 | Création complète, 5 races réellement différentes | U (point 17) | ✅ | La création reste l'écran du jeu, par-dessus la 3D. | — | `gs5` : 5 races ; `t7_pad` : homme-lézard créé à la manette |
| B19 | Écran d'accueil : Nouvelle partie, Continuer, Paramètres, Commandes, Crédits | U (point 17) | ✅ | — | — | `gs5` |
| B20 | Trois Spins : Magic, Weapon, Exceptional (probabilités affichées, garanties séparées, doublons, historique, jamais obligatoires) | U (point 18), P5 | ✅ | — | — | Fonctions présentes dans la 3D : `rollWeaponSpin`, `rollExceptionalSpin`, `spinRates`, `spinState`. Interface identique. |
| B21 | Marché entre joueurs : dormant, sans faux marché hors ligne | U (point 19), P5 §22.1 | ✅ | — | — | Non créé, conformément à la règle |
| B22 | 7 styles officiels | U (point 20) | ✅ | — | — | `tcombo` : les 7 styles touchent en 3D, l'arc tire 3 projectiles |
| B23 | Visée libre mobile et PC, assistance réglable | U (point 15) | ✅ | La visée tactile et au stick suivait mal une caméra tournée. | La visée tactile et au stick tourne avec la caméra ; la souris vise un point du sol | `t7_pad` : visée au stick |
| B25 | Personnages 2D pixel art intégrés au monde 3D (directive du 24/11 soir) | U 24/11 | 🟨 | Effet « papier » : panneaux éclairés comme des feuilles plates, vus de très haut. | Les personnages restent en pixel art 2D, comme demandé. Vue oblique (ils sont vus de face, de dos ou de trois-quarts), volume par éclairage : normale arrondie sur chaque panneau, le soleil modèle le personnage de gauche à droite et de haut en bas ; lumière minimale pour ne jamais devenir une silhouette noire ; ombres portées ; masquage par le décor. **Limite :** les dessins eux-mêmes ne sont pas refaits ; un vrai gain de détail (visages, plis) demande de nouvelles planches dessinées. | Captures `obl_*` |
| B26 | Traînée de lumière vers l'objectif | U 24/11 | ✅ | — | Traînée lumineuse qui suit le terrain praticable jusqu'au but : trame principale (or), mission suivie du journal (violet), quête secondaire (turquoise) ; colonne de lumière sur la cible. Les étapes volontairement vagues ne mènent qu'à la région. Désactivable. | `t3d_trail` : traînée vers Grakhul (38 m, 22 points), mission « Le registre d'Édran » ciblée |
| B24 | Mode autonome : décider, enchaîner, vérifier | U | ✅ | — | — | — |

## C. Cahier des charges V2 (systèmes)

| N° | Système | Origine | État en 3D | Écarts / remarques | Test |
|---|---|---|---|---|---|
| C1 | Création et personnalisation | C2 | ✅ | L'aperçu animé reste en 2D, dans l'écran de création | `gs5`, `t7_pad` |
| C2 | Monde ouvert, régions | C2 | ✅ | 25 zones rendues en 3D, avec leur sol, leur eau et leurs décors. 90 types de décor sur 102 ont un modèle ; les autres gardent leur image du jeu. **Géographie organique (24/11) :** le sol 3D lit la grille du jeu à travers une distorsion douce (environ une case au plus), donc rives, lisières et chemins ondulent ; frontières de régions mêlées ; relief propre à chaque région, aplati sous terre et à l'approche de Brumeval. Collisions, quêtes et sauvegarde restent sur la grille d'origine : un personnage peut sembler marcher un peu dans l'eau au bord d'une rive. | `gs5`, `narr2` 44/44, captures `w3d` |
| C3 | Monde vivant : routines, voyageurs, événements | C2 | ✅ | Événements dynamiques du jeu, routines horaires des habitants de Brumeval, portes fermées la nuit, marchands itinérants qui changent de village chaque jour. | `narr`, `t3d_bru`, `t3d_npc` |
| C4 | Secrets, coffres, récompenses d'exploration | C2 | ✅ | Coffres, 13 lieux secrets du jeu et 7 secrets du village pilote. Eolan vend des rumeurs qui orientent vers les coffres non ouverts. | `narr2`, `t3d_bru2`, `t3d_npc` |
| C5 | Montures | C2 | ✅ | Cheval, Destrier des Plaines (3 000 or, niveau 10), Lynx des neiges (8 000 or après Kragh), Dragon par la quête « L'œuf de Cendrefeu » (survol de l'eau, de la lave et du vide). Caractéristiques finales : PROPOSITION. | `t3d_mount` |
| C6 | 27 familles, Magic Spin | C2 | ✅ | — | A2, A3 |
| C7 | 270 compétences et ultimes | C2 | ✅ | Effets du jeu en deux couches (au sol, en volume), plus effets 3D natifs propres à chaque famille. | `t3d_270.py` |
| C8 | Combat, combos, réactions élémentaires | C2 | ✅ | — | `tcombo` : brûlure, glace, poison, malédiction, entrave ; réaction ×1,6 |
| C9 | Bestiaire, boss (4 Gardiens, Malvorak, Grakhul, 21 régionaux) | C2 | ✅ | Logique reprise ; IA de boss qui ne répète pas la même attaque plus de 2 fois (déjà dans le jeu) | `gs5` : boss des mines, de la lave et du temple |
| C10 | Quêtes, arcs, histoire | C2 | ✅ | 44 missions sur 44, 8 arcs terminés | `narr`, `narr2` |
| C11 | 60 PNJ nommés | C2 | ✅ | Les 60 noms du cahier sont présents. 17 incarnés le 24/11 dans la région de leur groupe, chacun avec une activité (`js3d/complements.js`, bloc 7). Sylva reste absente : une mission la dit partie depuis des années. Zayra est Zaïra, déjà présente. Biographies et rôles des nouveaux : PROPOSITION. | `t3d_npc` |
| C12 | Inventaire, équipement, objets | C2/P5 | ✅ | — | `t7_pad` : onglets du menu |
| C13 | Statistiques, progression | C2 | ✅ | — | `gst` |
| C14 | Factions (9), réputation (7 rangs), relations (6 niveaux) | C2 | ✅ | Effets de la réputation : récompense à chaque rang, titre au rang Légendaire, bonus par faction, salutations par rang, 9 contrats de faction au panneau. Effets : PROPOSITION. | `t3d_rep` |
| C15 | Titres, codex | C2 | ✅ | — | Non retesté spécifiquement en 3D |
| C16 | Camp, cuisine, compagnons, habitation | C2 | ✅ | Aménagements du camp (tente, marmite, feu, coffre) et chambre à l'auberge (sommeil jusqu'à 7 h, réserve +20, établi, améliorations). | `camp`, `t3d_home` |
| C17 | Professions | C2 | ✅ | Récolteur, joaillier, enchanteur, pêcheur (8 poissons, grillade), cartographe ; bonus de forge et d'alchimie. Détails : PROPOSITION. | `t3d_prof` |
| C18 | Économie et marchands | C2 | ✅ | Multiplicateurs et spécialités par région, marchands itinérants, étal tournant de Rhovan, troc de Griv. | `gst`, `t3d_eco`, `t3d_npc` |
| C19 | Activités permanentes, post-game | C2 | ✅ | Permanentes : livraisons quotidiennes, chasses, troc, collections à paliers (régions, bestiaire, objets, maîtrises), 3 défis du jour, élites à la mesure du joueur, rumeurs. Après Malvorak : Arène des Échos et Échos du Sceau Noir (boss renforcés), Forge des légendes (+2 niveaux d'amélioration, une fois par arme). Toutes : PROPOSITION. | `t3d_npc` |
| C20 | Interface et menus | C2 | ✅ | HUD et menus du jeu par-dessus la 3D. La mini-carte reste orientée au nord ; un cône indique désormais la direction de la caméra. | Captures |
| C21 | Tactile, clavier et souris, manette PS5 | C2 | ✅ | Testés en émulation seulement | `t7_pad`, `tm3d` |
| C22 | Sauvegarde | C2 | ✅ | — | `camp`, `narr2` : rechargements |
| C23 | Effets visuels, météo, lumière | C2 | ✅ | Atmosphère de chacune des 25 régions (`js3d/regions3d.js`) : brouillard, ciel, lumière, exposition, particules d'ambiance. Le volcan et les cavernes de lave sont éclaircis, avec braises, cendres et lueur de lave. Pluie et neige rétablies ; cycle jour/nuit ; lumières des torches et des sorts ; lanterne du héros la nuit | Section F |
| C24 | Performances mobiles | C2 | 🟨 | Qualité automatique liée au réglage du jeu ; panneaux redessinés seulement si nécessaire ; couches d'effets vides ignorées ; nombre de lumières selon la qualité. **Pas de mesure sur un vrai téléphone.** | Mesures (section F) |

## D. Partie 5 — armes, équipements, Spins

| N° | Exigence | État | Remarques |
|---|---|---|---|
| D1 | 7 catégories d'armes compatibles avec les styles | ✅ | Logique du jeu |
| D2 | Raretés séparées du rang S | ✅ | Logique du jeu |
| D3 | Weapon Spin et Exceptional Spin distincts, probabilités affichées, garanties séparées et sauvegardées, doublons convertis, historique | ✅ | Fonctions présentes dans la 3D. Taux en PROPOSITION (non définis par le cahier). |
| D4 | Maîtrise d'arme distincte de la maîtrise de style | ✅ | Logique du jeu |
| D5 | Évolution, transformation et éveil des armes | ✅ | Logique du jeu |
| D6 | Armures, accessoires, reliques visibles sur le personnage | ✅ | Le héros 3D est dessiné par la fonction du jeu, avec son équipement réel |
| D7 | Comparaison, amélioration, fabrication, enchantements | ✅ | Menus du jeu |
| D8 | Durabilité optionnelle et désactivable | ✅ | Réglage du jeu |
| D9 | Synergies arme/magie, fusions | ✅ | 13 fusions (conditions en PROPOSITION) |
| D10 | Interfaces mobiles paysage (12 écrans) | ✅ | Menus du jeu, par-dessus la 3D |

## E. Systèmes du jeu 2D vérifiés dans la 3D (24/11)

| Système | Test | Résultat dans `jeu3d.html` |
|---|---|---|
| Écran titre, création, races | `gs5` | ✅ menu complet ; 5 races ; ni magie ni style à la création |
| Régions, passages, boss, zones sûres, voyage | `gs5` | ✅ 5 passages, 3 boss, 21 destinations |
| Statistiques, points, emplacement 5, prix, forgerons, boutons tactiles | `gst` | ✅ |
| Styles, attaque principale, R3 = sort 5 | `gq` | ✅ |
| Camp, cuisine, compagnon, repos, rechargement | `camp` | ✅ (ennemi 26 → 4 PV par le compagnon) |
| Manette : création, dialogue, menu, attaque, sort, esquive, potion, aptitude raciale, visée, vibrations, libellés PS5 | `t7_pad` | ✅ |
| Narration : missions, choix, énigmes, compagnons, rechargement | `narr`, `narr2` | ✅ 44 missions sur 44 ; 72 lieux sur 72 |
| Souvenirs des anciennes sauvegardes | `qa` | ✅ |
| Identité du monde | `gc` | ✅ identique à la 2D |
| 7 styles, réactions élémentaires | `tcombo` | ✅ |
| 270 compétences lancées une à une en 3D | `t3d_270`, `ult2` | ✅ 270 sur 270, sans erreur. Les 243 compétences 1 à 9 infligent des dégâts ou un effet. Les 27 ultimes, testés à part en refermant les fenêtres d'aide qui mettent le jeu en pause, fonctionnent tous. |
| Magic Spin | `t3d_270` | ✅ 5 / 25,13 / 34,75 / 25,01 / 10,10 % sur 100 000 tirages |

Remarque : deux tests (`t7_pad`, `camp`) ont échoué une fois lorsqu'ils tournaient en même temps qu'un test lourd. Relancés seuls, ils réussissent. La cause est le manque de puissance de la machine de test, pas le jeu.

## F. Transformation 3D : contrôles propres à la 3D

| N° | Point | État | Corrections du 24/11 | Test |
|---|---|---|---|---|
| F1 | Le monde 3D suit toute la carte (288 × 504) | ✅ | — | Captures multi-zones |
| F2 | Personnages posés sur le relief, ombres réelles | ✅ | — | Captures |
| F3 | 8 directions | ✅ | Voir B4 | `c1_diag` |
| F4 | Caméra réglable et rotation, commandes tournées | ✅ | Voir B5 | `g3d3`, `tm3d` |
| F5 | Visée 3D | ✅ | Voir B6 | Arc et visée tactile maintenue : zoom progressif de 0,3 à 0,97 en 4 s, ralenti à 55 %. La réserve de 2,5 s se vide, puis se recharge après la visée. Elle est désormais comptée en temps réel. |
| F6 | Effets des compétences | ✅ | Avant : tout était aplati au sol. Désormais : télégraphes, cercles et ondes au sol ; coups, impacts, particules, éclairs, tornades et piliers sur un plan face à la caméra, avec la même présence que les personnages. **Effets 3D natifs pour les 27 familles** (`js3d/magic3d.js`) : particules en volume avec un mouvement propre à chaque famille, cercles d'incantation, colonnes d'ultime, éclairs (foudre), traînées de projectiles, éclats d'impact, éclats de lumière. Les bords des couches 2D sont fondus. | `t3d_270` ; `t3d_mag` : 6 familles en captures, sorts et ultimes |
| F7 | Cycle jour/nuit continu | ✅ | Avant : l'heure était figée. Désormais, un jour dure 8 minutes, comme dans le village pilote. L'heure est sauvegardée avec la partie. Les zones sombres du jeu assombrissent la lumière. Fenêtres allumées et lanterne du héros la nuit. Désactivable. | Capture `c4_night` |
| F8 | Météo | ✅ | Pluie (perdue en v4) rétablie ; neige dans les régions froides ; aucune précipitation sous terre. Désactivable. | Pluie au village et neige aux Pics de Givrenuit, visibles (captures `w_rain`, `w_snow`) |
| F9 | Mini-carte et caméra tournée | ✅ | La mini-carte tourne avec la caméra : carte ronde locale, le haut correspond à la direction regardée, flèche du héros fixe, nord indiqué. Option « nord fixe » dans Paramètres > Caméra 3D. | Captures à 0°, 90° et 180° |
| F10 | Qualité graphique | ✅ | Le réglage « Qualité graphique » du jeu pilote maintenant la 3D (auto, haute, moyenne, basse) | — |
| F11 | Fluidité | 🟨 | Mesure par image (`V3D.PROF`). Panneaux des PNJ et du butin redessinés seulement quand l'image change ; ennemis éloignés à 15 images/s ; couches d'effets vides ignorées ; 2, 4 ou 6 lumières selon la qualité. | **Correction d'une erreur de mesure :** les « 20 images/s » annoncés le 24/11 au matin étaient faux, car la mesure plafonnait. En temps réel, sur la machine de test sans carte graphique : 3,7 images/s, puis 7 après optimisation (triangles par image : 1,13 M → 0,41 M). Optimisations : lumières partagées, tri hors champ par quart de bloc, feuillages et herbe allégés en qualité basse. Ce chiffre ne représente pas un téléphone, qui dispose d'un processeur graphique. |
| F12 | Brumeval v4 dans `jeu3d` | ✅ | Construit à l'emplacement du village, zone agrandie (21–72 × 31–72). Camp gobelin, cimetière et clairière du chef intacts. Terrain, rivière, pont, étang, cascade, grotte, 6 bâtiments, végétation, collisions, portes fermées la nuit (`js3d/brumeval3d.js`). | `t3d_bru` : place, auberge, étang, pont ; `narr2` 44/44, `gs5`, `t7_pad`, `camp` |
| F13 | Intérieurs en coupe | ✅ | Toit et étage masqués quand on entre ; caméra plus proche et plus plongeante en intérieur | `t3d_bru` : dans l'auberge |
| F14 | Habitants, routines, animaux, secrets du village pilote | ✅ | Code du village pilote repris (`js3d/brumevalLife.js`) : 8 habitants à routines horaires, 25 animaux, 7 secrets, maison des Vey, fête. Borin, Maëlle, Édran, Torven et Liora sont les mêmes personnes que dans le jeu, avec leurs missions ; Hugues, Gwenna et Anselme deviennent des PNJ du jeu. État sauvegardé dans la partie ; section Brumeval dans le journal. | `t3d_bru2` : 8 habitants, 25 animaux, dialogue de Gwenna, secret « initiales » découvert |
| F15 | Mobile : boutons, stick, rotation | ✅ | Boutons de caméra placés sans chevauchement | `tm3d` : aucun chevauchement en 844 × 390 |

## G. Restes à faire (par priorité)

1. **G1 — Brumeval v4 dans `jeu3d` : fait le 24/11** (F12 à F14). Décision de l'utilisateur appliquée : zone agrandie plutôt que contenu réduit. Correction de nommage : la marchande est Maëlle (nom du jeu), Maëlys reste l'artisane ; le père Vey devient Aldwin, car Aldric est le garde du jeu. Ancien texte : Le village du jeu (zone de 46 × 24 m) est plus petit que le village pilote (environ 60 × 60 m, avec rivière et pont). Les deux voies :
   - agrandir la zone du village dans la carte, ce qui modifie le monde d'origine et sa vérification ;
   - adapter le village pilote à l'emprise du jeu.

   Il faut aussi relier :
   - les habitants v4 aux PNJ du jeu ;
   - les secrets v4 aux drapeaux du jeu ;
   - les intérieurs au système de collision.

   Choix technique pris par défaut : adapter le village pilote à l'emprise du jeu, sans toucher au monde d'origine.
2. **G2 — Effets 3D natifs : faits le 24/11** pour les 27 familles, puis **formes 3D propres aux compétences** (`js3d/forms3d.js`) : lion de feu, phénix, piliers et stalagmites, colosses, météores, pluies de lames, tornades, singularités, chaînes, portails, horloge du temps, hydres et léviathans, ondes, miroirs, cercles runiques, dômes, cages, éruptions, orbes, nuages, rayons, fleurs, fissures, vagues, sceaux. Chaque ultime des 27 familles a une forme signature. Les 270 compétences ont une forme 3D (test `t3d_forms` : 270 sur 270, sans erreur). La mécanique des compétences n'est pas modifiée.
3. **G3 — Décors propres à chaque région : faits le 24/11** (`js3d/regionDecor3d.js`) pour 22 régions, en commençant par le volcan : coulées aux fissures rougeoyantes, cheminées fumantes, basalte, obsidienne, arbres calcinés, fumerolles ; puis dunes, pilotis, congères, fougères géantes, cristaux, épines, colonnes brisées, îlots flottants. Ancien texte : Les rochers pâles et la fontaine du village (un disque blanc) sont corrigés le 24/11 (commit 195e083). Atmosphère des 25 régions faite le 24/11, en commençant par le volcan. Restent, région par région, des décors 3D plus propres à chacune : coulées et cheminées volcaniques, pilotis du marais, dunes, etc.
4. **G4 — Vérification sur un vrai téléphone et une vraie manette (élevée, extérieure).** Impossible depuis l'environnement de test.
5. **G5 — Éléments « À COMPLÉTER » des bibles : faits le 24/11 dans `jeu3d`** (`js3d/complements.js`), tous marqués PROPOSITION. Géographie organique faite le 24/11 au soir, à ta demande (voir C2) : la grille du jeu reste la référence des collisions et de la sauvegarde, et seul le rendu 3D devient organique. Liste d'origine :
   - apprentissage des autres familles (grimoires, sanctuaires) ;
   - effets de la réputation ;
   - Destrier des Plaines, monture rare régionale, Dragon par quête ;
   - métiers ;
   - économie régionale ;
   - aménagements du camp et habitation ;
   - post-game ;
   - géographie organique ;
   - 60 PNJ ;
   - quêtes restantes.

   Ces points demandent des choix de conception : ils seront proposés marqués PROPOSITION, sans inventer de lore présenté comme canon.

## H. Sources introuvables ou non vérifiables

| Source | Situation |
|---|---|
| Parties 1 à 4 du cahier des charges maître | Jamais fournies au projet. Leur contenu n'est pas inventé. |
| Catalogue textuel des 270 compétences | Absent ; les compétences existent dans le code (`js/mf_*.js`). |
| Annexes de la Bible V0.1 | Absentes du projet. |
| Vidéos de référence | Non accessibles dans l'environnement. |
| Conversations antérieures hors documents du projet | Non consultables. L'audit s'appuie sur les documents du projet, le code et les commits. |

## Liens

- Jeu 3D (version officielle en construction) : https://raw.githack.com/testewaberk13-dot/velorne/main/jeu3d.html
- Accueil (ouvre le jeu 3D) : https://raw.githack.com/testewaberk13-dot/velorne/main/index.html
- Village pilote v4 (conservé) : https://raw.githack.com/testewaberk13-dot/velorne/main/demo3d-v4.html
- Ancien jeu 2D : https://raw.githack.com/testewaberk13-dot/velorne/main/jeu-2d.html

## I. Essais physiques à faire par toi (impossibles ici)

Ce qui est déjà testé ici, en simulation : tactile en 844 × 390 (stick, boutons, caméra, absence de chevauchement), manette simulée (création, menus, combat, visée, vibrations, libellés PS5).

**Sur téléphone (paysage), ouvrir `jeu3d.html` :**
1. **Fluidité.** Images par seconde en forêt, au village et pendant un ultime. Le menu Paramètres affiche « Qualité graphique : auto (…) » : note le niveau choisi.
2. **Lisibilité.** HUD, mini-carte, textes de dialogue, taille des boutons. Utilise au besoin « Boutons plus grands ».
3. **Stick et caméra.** Le stick va dans le bon sens après une rotation de caméra (⟲ ⟳). Les boutons ⤒ ⤓ changent l'angle.
4. **Visée tactile.** Glisser depuis un bouton de sort ou d'attaque, avec l'arc : trajectoire, zoom et ralenti.
5. **Chaleur et batterie** après 15 minutes.
6. **Sauvegarde.** Fermer l'onglet, rouvrir, « Continuer » : position, heure du jour et compagnon conservés.
7. **Encoches et coins arrondis.** Les boutons de caméra et du HUD ne sont pas masqués.

**Manette PS5 réelle (Bluetooth ou USB, sur PC ou téléphone) :**
1. Détection : Paramètres > Manette affiche son nom.
2. Toutes les touches : ✕ attaque/interagir, ○ esquive, □ technique, △ ultime, L1 parade, R1 sort 3, L2/R2 sorts 1 et 2, croix (sort 4, potion, aptitude raciale, relique), L3 éveil, R3 sort 5, stick droit visée, Options menu, Créer inventaire.
3. Vibrations à l'impact et réglage de la zone morte.
4. Navigation complète des menus et de la création à la manette.
5. Caméra : pas de touche libre sur la manette ; la rotation se fait par Paramètres > Caméra 3D.

## J. Suivi du développement continu (mis à jour à chaque reprise)

**Fait le 24/11 (après-midi) :** Brumeval complet (F12 à F14), décors des régions (G3), effets 3D des magies (G2), atmosphère des régions, mesure de fluidité corrigée et optimisations. Non-régression : `narr2` 44/44, `gs5`, `t7_pad`, `camp`, `t3d_270`.

**Fait le 24/11 (fin d'après-midi) :** montures (Destrier, Lynx, Dragon), effets de la réputation et contrats, métiers et pêche, économie régionale, grimoires et sanctuaire des 27 familles, camp et chambre, 17 PNJ manquants avec activités permanentes et post-game. Les 72 quêtes (q001 à q072) sont toutes présentes dans le code. Non-régression : `narr2` 44/44, `gs5`, `t7_pad`, `camp`.

**Fait le 24/11 (soir) :** mini-carte tournante, formes 3D des 270 compétences, petits monstres en 8 directions composées, relief et eau améliorés hors de Brumeval, géographie organique, garde-fou contre une erreur de dessin du halo lumineux (`glow`). Hauteurs du sol mises en cache par bloc (le relief organique coûtait du temps de calcul). Non-régression : `narr2` 44/44, `gs5`, `camp`, `t3d_bru2`, `t3d_mount`, `t3d_prof`. `t7_pad` : l'esquive fonctionne (vérifiée image par image) ; le test lit l’état une seule fois, juste après l’appui, et la machine de test, lente, le fait parfois échouer ; relevé image par image, l’esquive se déclenche.

**Fait le 24/11 (fin de soirée) :** caméra oblique (B5), herbe plus dense, profondeur (brume, flou de l'arrière-plan), personnages modelés par la lumière (B25), traînée de lumière vers les objectifs (B26).

**Prochaines tâches :**
1. Accueil du site passé sur `jeu3d` (fait le 24/11). Reste ta vérification sur téléphone et manette (section I).

**Ancienne liste (toute faite) :**
1. Montures restantes : Destrier des Plaines (3 000 or), monture rare régionale (8 000 or), Dragon (récompense de quête). Prix et principe déjà validés (décisions du 23/11).
2. Effets de la réputation : dialogues, quêtes réservées, récompenses de rang, pour les 7 rangs.
3. Métiers au-delà du récolteur.
4. Économie régionale : spécialités et prix par région.
5. Aménagements du camp et habitation.
6. Apprentissage des autres familles de magie : grimoires, sanctuaires.
7. PNJ manquants (60 nommés au cahier) et quêtes restantes.
8. Post-game et activités permanentes.

Le contenu narratif nouveau sera marqué PROPOSITION.
