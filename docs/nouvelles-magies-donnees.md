# Vélorne — Fiches de données des 12 nouvelles magies (132 compétences)

**Source des fiches :** extraites du jeu le 25/11 (`NM.DATA`, fichier `docs/nouvelles-magies-donnees.json`), donc identiques au code.

**Statut des valeurs :** toutes les valeurs chiffrées sont des valeurs de prototypage, marquées « à prototyper », jamais du canon. Elles sont modifiables à un seul endroit :
- coûts en mana et recharges : tableaux `NM_MP` / `NM_CD`, ou valeur propre à la compétence (`js3d/nm_core.js`) ;
- puissances, rayons et durées : dans chaque compétence (`js3d/nm_fams1.js`, `js3d/nm_fams2.js`).

## Champs communs à toutes les compétences

- **Identifiant stable :** `NM-<famille>-01` à `-10` pour les compétences, `-U` pour l'ultime.
- **Rangement dans le grimoire :**
  - C1 à C9 = compétences 1 à 9 ;
  - C10 = ultime (même convention que les 27 familles historiques) ;
  - C11 = compétence 10.
- **Niveau de maîtrise requis :**
  - compétences 1 à 3 : niveau 1 ;
  - compétence 4 : niveau 2 ; compétence 5 : niveau 3 ; compétence 6 : niveau 5 ; compétence 7 : niveau 6 ;
  - compétence 8 : niveau 8 ; compétences 9 et 10 : niveau 9 ;
  - ultime : niveau 10.
- **Emplacements :** les 4 emplacements de compétence (1, 2, 3, 5) et l'ultime. Commandes du jeu existant, clavier, tactile et manette.
- **Sons :** `<famille>_c` à l'incantation, `<famille>_i` à l'impact, `<famille>_u` pour les grands effets. Générateur des 27 familles, profil propre à chaque famille.
- **Effets visuels :** couche d'effets du jeu (2D projetée en 3D), particules 3D de la famille, formes 3D ponctuelles pour une partie des compétences, et modèles 3D pour les transformations (`js3d/nm3d.js`).
- **Zones de touche :** celles des archétypes du jeu (projectile, cône, zone, rayon, vague, élan, invocation), ou une zone propre décrite dans la fiche (ligne de rupture, sceau, ouvrage…).
- **Boss :** aucune immobilisation garantie (`nmCtl`). Sur un boss ou un ennemi lourd :
  - entrave, sommeil, peur, étourdissement, gel et confusion deviennent un bref ralentissement ;
  - les projections deviennent un déséquilibre ou des dégâts seuls.
- **Ressource :** jauge propre à la famille, enregistrée dans la sauvegarde.
  - Une compétence qui coûte plus que la jauge disponible part quand même, mais affaiblie (×0,55) ; rien n'est perdu.
  - Les coups d'arme et les impacts remplissent la jauge.
  - Inertie du Titan : elle vient du déplacement.
  - Synchronisation, Commandement, Profondeur et Réserve : régénération lente.

## Les 12 familles

| Clé | Famille | Rareté | Catégorie | Ressource | Élément des dégâts |
|---|---|---|---|---|---|
| `orochi` | Yamata no Orochi | Épique | Épique — transformation | Coordination (0–100) | physique |
| `phenix` | Phénix | Épique | Épique — transformation | Cycle de Cendres (0–100) | feu |
| `titan` | Titan | Épique | Épique — transformation | Inertie (0–100) | physique |
| `kitsune` | Kitsune | Épique | Épique — transformation | Sceaux-renards (0–9) | arcane |
| `dixombres` | Dix Ombres | Épique | Épique — transformation | Commandement (0–100) | ombre |
| `arsenal` | Arsenal du Roi déchu | Épique | Épique — non transformationnelle | Autorité royale (0–100) | physique |
| `architecte` | Architecte des structures | Épique | Épique — non transformationnelle | Plans et matériaux (0–100) | physique |
| `energie` | Manipulation de l'Énergie | Épique | Épique — non transformationnelle | Réserve énergétique (0–100) | arcane |
| `decoupe` | Art de la Découpe | Épique | Épique — non transformationnelle | Précision de coupe (0–100) | physique |
| `possession` | Sceau de Possession | Épique | Épique — non transformationnelle | Synchronisation (0–100) | arcane |
| `dragon` | Dragon divin | Légendaire | Légendaire | Souveraineté draconique (0–100) | arcane |
| `leviathan` | Léviathan | Légendaire | Légendaire | Profondeur abyssale (0–100) | eau |


## Yamata no Orochi

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-orochi-01 | Morsure du premier chef | offensive | Morsure en ligne courte | 14 | 3 | +6 | 1 | dégâts normaux, aucun contrôle garanti | — | Une tête jaillit et mord en ligne courte. Sur une cible marquée par une autre tête : impact de suivi. |
| NM-orochi-02 | Balayage des cous sinueux | offensive | Double arc opposé | 18 | 6 | +5 | 1 | dégâts normaux, aucun contrôle garanti | — | Deux cous balaient des arcs opposés : le premier déplace les ennemis légers, le second frappe ceux qui ont perdu l'équilibre. |
| NM-orochi-03 | Regard des huit | utilitaire | Révèle les ouvertures | 18 | 5 | +4 | 1 | dégâts normaux, aucun contrôle garanti | — | Les huit têtes fixent une cible : ses ouvertures sont visibles, la prochaine compétence Orochi gagne un bonus. Aucune paralysie. |
| NM-orochi-04 | Garde des cous entrelacés | défensive | Garde frontale à charges | 22 | 9 | −18 | 2 | dégâts normaux, aucun contrôle garanti | — | Les cous tressés forment une garde mobile qui absorbe 4 impacts frontaux, puis se défait en contre-coup. |
| NM-orochi-05 | Morsure en relais | offensive | Trois morsures enchaînées | 26 | 11 | −14 | 3 | dégâts normaux, aucun contrôle garanti | — | Trois têtes mordent successivement la même cible depuis des angles alternés ; si une morsure manque, le relais s'interrompt. |
| NM-orochi-06 | Souffle des chefs | offensive | Quatre souffles physiques | 22 | 9 | −24 | 5 | dégâts normaux, aucun contrôle garanti | — | Quatre têtes soufflent tour à tour : pression, chaleur, venin corrosif, onde de choc (ordre fixe pour l'instant — sélection libre à prototyper). |
| NM-orochi-07 | Anneau des huit cous | défensive | Cercle tournant | 26 | 12 | −10 | 6 | dégâts normaux, aucun contrôle garanti | — | Les cous forment un cercle tournant qui frappe ceux qui le traversent ; chaque seconde consomme de la coordination. |
| NM-orochi-08 | Frappe convergente | offensive | Convergence sur un point | 26 | 13 | −16 | 8 | dégâts normaux, aucun contrôle garanti | — | Les têtes frappent ensemble un point au sol : zone élargie par les angles, dégâts concentrés au centre. |
| NM-orochi-09 | Rugissement polyphonique | utilitaire | Désorientation (sauf boss) | 30 | 16 | −28 | 9 | dégâts normaux, aucun contrôle garanti | — | Huit rugissements décalés : les ennemis ordinaires sont désorientés, les boss subissent seulement une pression offensive. |
| NM-orochi-U | Huit Couronnes, une seule gueule | ultime | Huit frappes puis morsure colossale | — | — | — | 10 | phases annoncées esquivables ; coup final majeur si préparé | huit cous géants surgissant du sol | Les huit têtes encerclent une vaste zone et frappent en séquence (annoncées), puis convergent en une morsure colossale. |
| NM-orochi-10 | Corps du serpent-roi | transformation | Transformation : huit cous | 34 | 20 | −40 | 9 | dégâts normaux, aucun contrôle garanti | huit cous et têtes articulés (nm3d.js) | Écailles sur le torse, huit cous ancestraux derrière le joueur ; les coups d'arme déclenchent des morsures de cou. La mobilité reste celle du personnage. |

## Phénix

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-phenix-01 | Plumes de braise | offensive | Éventail de plumes plantées | 14 | 3 | +6 | 1 | dégâts normaux, aucun contrôle garanti | — | Éventail de plumes qui se plantent dans le sol ou la cible et restent quelques secondes ; elles peuvent être rappelées. |
| NM-phenix-02 | Ailes de remontée | mobilité | Bond par-dessus un obstacle bas | 18 | 6 | +3 | 1 | dégâts normaux, aucun contrôle garanti | — | Un battement d'ailes soulève le joueur au-dessus d'un obstacle bas ou d'une attaque au sol. Pas de vol libre. |
| NM-phenix-03 | Cercle de cendres | utilitaire | Anneau qui marque | 18 | 5 | +5 | 1 | dégâts normaux, aucun contrôle garanti | — | Un anneau de cendres autour du joueur marque ceux qui le traversent ; la prochaine attaque Phénix sur eux déclenche une combustion secondaire. |
| NM-phenix-04 | Mue ardente | mobilité | Esquive en laissant une enveloppe | 22 | 9 | −10 | 2 | dégâts normaux, aucun contrôle garanti | — | Une enveloppe de cendres reste en place et le joueur esquive ; l'enveloppe éclate seulement si un ennemi la touche (sinon elle s'effrite), sans attirer ni contrôler les ennemis. |
| NM-phenix-05 | Plongée du plumage | offensive | Plongée sur une cible marquée | 26 | 11 | −14 | 3 | dégâts normaux, aucun contrôle garanti | — | Saut bref puis plongée sur une cible marquée ; l'impact disperse les marques en éclats brûlants. |
| NM-phenix-06 | Cocon de braises | défensive | Cocon immobile | 22 | 9 | −12 | 5 | dégâts normaux, aucun contrôle garanti | — | Cocon défensif immobile très court : réduit fortement les dégâts frontaux, mais plusieurs impacts le brisent. |
| NM-phenix-07 | Rappel des cendres | utilitaire | Rappel des plumes plantées | 26 | 12 | — | 6 | dégâts normaux, aucun contrôle garanti | — | Les plumes déposées reviennent vers le joueur en frappant sur leur trajet ; chaque plume récupérée restaure du Cycle de Cendres. |
| NM-phenix-08 | Aube incandescente | offensive | Zone à pulsations | 26 | 13 | −18 | 8 | dégâts normaux, aucun contrôle garanti | — | Les cendres d'une zone s'embrasent en vagues successives, avec des intervalles pour esquiver ; les plumes présentes renforcent la zone. |
| NM-phenix-09 | Mue du grand Phénix | transformation | Transformation : ailes et queue | 30 | 16 | −35 | 9 | dégâts normaux, aucun contrôle garanti | ailes articulées, plumage, queue de plumes | Ailes, plumage d'épaule et queue de feu ; les esquives deviennent des bonds aériens et les coups d'arme laissent des plumes marquantes. |
| NM-phenix-U | Seconde Aube | ultime | Dispersion puis explosion en anneaux | — | — | — | 10 | dégâts en vagues, aucun contrôle | — | Le joueur se consume, se disperse en une nuée de cendres sur une grande zone puis se reconstitue au centre d'une explosion en anneaux ; jauge partiellement restaurée. |
| NM-phenix-10 | Renaissance conditionnelle | défensive | Reconstruction après un coup fatal | 20 | 30 | — | 9 | aucune différence ; jamais en arène de duel | — | Prépare la reconstruction pendant 60 s : si un coup fatal arrive avec la jauge pleine, le joueur revient à 30 % de vie. Longue recharge interne (180 s), pas dans les zones interdites, ne s'empile pas. |

## Titan

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-titan-01 | Poing d'inertie | offensive | Coup direct selon l'élan | 14 | 3 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Coup de poing direct dont la puissance croît avec l'inertie accumulée en se déplaçant juste avant. Sans élan : frappe fiable mais modérée. |
| NM-titan-02 | Pas sismique | offensive | Onde courte autour du pied | 18 | 6 | +6 | 1 | dégâts normaux, aucun contrôle garanti | — | Un pas lourd crée une onde courte autour du pied ; l'effet vient du poids du corps, aucune fissure persistante. |
| NM-titan-03 | Ancrage colossal | défensive | Inébranlable, nourrit l'inertie | 18 | 5 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Pieds plantés : très difficile à déplacer, dégâts réduits ; les coups reçus alimentent l'inertie, la mobilité baisse. |
| NM-titan-04 | Charge inexorable | mobilité | Charge qui s'alourdit | 22 | 9 | — | 2 | dégâts normaux, aucun contrôle garanti | — | Charge en ligne droite qui gagne en puissance avec l'élan ; un obstacle arrête la charge et fait perdre l'élan. |
| NM-titan-05 | Saisie du géant | offensive | Saisir et projeter | 26 | 11 | — | 3 | dégâts normaux, aucun contrôle garanti | — | Saisit un ennemi de taille compatible, le soulève et le projette ; les ennemis lourds et boss encaissent un coup de paume à la place. |
| NM-titan-06 | Épaules indomptables | défensive | Marche de garde | 22 | 9 | — | 5 | dégâts normaux, aucun contrôle garanti | — | Avance en garde corporelle : petits projectiles frontaux déviés, ennemis légers repoussés ; une attaque lourde interrompt la marche. |
| NM-titan-07 | Compression musculaire | utilitaire | Prochain coup d'arme renforcé | 26 | 12 | +4 | 6 | dégâts normaux, aucun contrôle garanti | — | Concentre la masse dans un membre : le prochain coup d'arme gagne une onde d'impact et de la puissance, avec une récupération plus longue. |
| NM-titan-08 | Bond des hauteurs | mobilité | Saut et atterrissage télégraphié | 26 | 13 | — | 8 | dégâts normaux, aucun contrôle garanti | — | Saut puissant vers un point choisi avant le décollage ; l'atterrissage, annoncé, frappe selon l'inertie portée et la convertit en élan (+20). |
| NM-titan-09 | Forme du Titan | transformation | Transformation : colosse | 30 | 40 | — | 9 | dégâts normaux, aucun contrôle garanti | colosse humanoïde complet (remplace le corps) | Croissance contrôlée : membres massifs, démarche lourde, portée de mêlée accrue. Impossible dans les intérieurs étroits. |
| NM-titan-U | Le Poids du Premier Géant | ultime | Trois frappes annoncées | — | — | — | 10 | dégâts complets, jamais projeté | — | Le Titan s'ancre puis porte trois frappes annoncées — poing, coude, impact total ; la dernière libère une onde massive. |
| NM-titan-10 | Rupture d'inertie | offensive | Libère toute l'inertie | 34 | 20 | — | 9 | dégâts normaux, aucun contrôle garanti | — | Libère d'un coup l'inertie accumulée en une onde au sol : plus elle est haute, plus l'onde est large ; la jauge retombe à zéro. |

## Kitsune

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-kitsune-01 | Queue gardienne | défensive | Une queue absorbe un impact | 14 | 3 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Une queue s'interpose sur un flanc (alternativement gauche puis droit) et absorbe un impact venant de ce côté, puis se rétracte (recharge). |
| NM-kitsune-02 | Griffe du renard | offensive | Pointe de queue à moyenne portée | 18 | 6 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Une queue raidie frappe à moyenne portée ; si un sceau est disponible, elle revient par un angle secondaire. |
| NM-kitsune-03 | Sceau du seuil | mobilité | Sceau d'élan à usage unique | 18 | 5 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Pose un sceau discret ; relancer la compétence élance le joueur vers lui une fois (le sceau disparaît). |
| NM-kitsune-04 | Pas des neuf chemins | mobilité | Pas courts en zigzag | 22 | 9 | — | 2 | dégâts normaux, aucun contrôle garanti | — | La queue désigne une direction ; succession de pas courts en zigzag. Pas une téléportation : les obstacles bloquent. |
| NM-kitsune-05 | Queue entravante | utilitaire | Entrave courte (pas les boss) | 26 | 11 | −1 | 3 | dégâts normaux, aucun contrôle garanti | — | Deux queues croisent leur trajectoire autour d'une cible et limitent ses déplacements un court instant ; les boss sont seulement ralentis. |
| NM-kitsune-06 | Feu follet-guide | utilitaire | Point d'émission déporté | 22 | 9 | — | 5 | dégâts normaux, aucun contrôle garanti | — | Un feu follet se pose au point visé ; la prochaine compétence Kitsune (hors déplacements) part de ce point, une seule fois. |
| NM-kitsune-07 | Sceau de permutation | mobilité | Échange avec un sceau | 26 | 12 | −1 | 6 | dégâts normaux, aucun contrôle garanti | — | Échange la position du joueur avec un sceau actif ; échoue si le point est bloqué ou hors portée. |
| NM-kitsune-08 | Éventail des queues | offensive | Balayage / piqué / garde (cycle) | 26 | 13 | — | 8 | dégâts normaux, aucun contrôle garanti | — | Les queues frappent selon une séquence : balayage, piqué ou garde, chacune avec son profil. Ordre actuel : cycle à chaque lancement (choix libre à prototyper). |
| NM-kitsune-09 | Masque du renard ancien | transformation | Transformation : oreilles et queues | 30 | 36 | — | 9 | dégâts normaux, aucun contrôle garanti | queues selon la maîtrise, oreilles, marques | Oreilles, marques faciales, queues et posture du Kitsune ; les sceaux durent plus longtemps et la Griffe gagne toujours son suivi. |
| NM-kitsune-U | Les Neuf Portes du Renard | ultime | Neuf sceaux puis convergence | — | — | — | 10 | frappes et convergence, aucun contrôle | — | Neuf queues tracent neuf sceaux autour de l'arène ; chaque porte déclenche une frappe ou une garde, la neuvième ferme le réseau par une attaque convergente. Ordre actuel : automatique (choix à prototyper). |
| NM-kitsune-10 | Palais des sceaux | mobilité | Réseau de trois sceaux | 12 | 2.5 | — | 9 | dégâts normaux, aucun contrôle garanti | — | Crée trois sceaux reliés ; chaque relance s'élance vers le sceau suivant en frappant sur le trajet ; le réseau s'effondre après trois utilisations. |

## Dix Ombres

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-dixombres-01 | Appel du premier familier | utilitaire | Éclaireur : révèle et marque | 14 | 3 | +5 | 1 | dégâts normaux, aucun contrôle garanti | — | Invoque l'Éclaireur, qui révèle les ennemis proches et marque une cible sans dégâts importants. |
| NM-dixombres-02 | Traque du second familier | offensive | Chasseur : frappe une cible marquée | 18 | 6 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Le Chasseur poursuit une cible marquée, frappe une fois puis revient ; il ne traverse pas les murs. |
| NM-dixombres-03 | Garde du troisième familier | défensive | Protecteur : intercepte | 18 | 5 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Le Protecteur se place entre le joueur et la direction visée ; il intercepte 3 attaques puis se dissipe. |
| NM-dixombres-04 | Bond du quatrième familier | offensive | Sauteur : bond annoncé | 22 | 9 | — | 2 | dégâts normaux, aucun contrôle garanti | — | Le Sauteur attaque une zone au sol après un bond annoncé ; il respecte la géométrie. |
| NM-dixombres-05 | Lien des deux ombres | utilitaire | Deux familiers liés | 26 | 11 | −14 | 3 | dégâts normaux, aucun contrôle garanti | — | Deux familiers liés : quand l'un frappe, l'autre se repositionne de l'autre côté de la cible. Le lien ne double pas les dégâts. |
| NM-dixombres-06 | Formation de chasse | offensive | Trois angles, attaque sur ordre | 22 | 9 | −16 | 5 | dégâts normaux, aucun contrôle garanti | — | Trois familiers prennent des angles distincts autour d'une cible ; ils attaquent au prochain coup d'arme du joueur (l'ordre de déclenchement). |
| NM-dixombres-07 | Rappel au creux | utilitaire | Rappel général | 26 | 12 | +6 | 6 | dégâts normaux, aucun contrôle garanti | — | Rappelle tous les familiers actifs : leurs actions s'interrompent et la prochaine invocation coûte moitié moins de mana. |
| NM-dixombres-08 | Fusion des silhouettes | offensive | Créature composite | 26 | 13 | −22 | 8 | dégâts normaux, aucun contrôle garanti | — | Deux familiers compatibles (Colosse et Serpent) fusionnent brièvement en une créature composite à l'attaque combinée ; ils sont indisponibles séparément pendant ce temps. |
| NM-dixombres-09 | Manifestation des dix | utilitaire | Dix présences, deux ordres rapides | 30 | 16 | −20 | 9 | dégâts normaux, aucun contrôle garanti | dix présences d'ombre | Les dix présences apparaissent brièvement autour du joueur ; deux commandes rapides : marquage de l'Éclaireur puis frappe du Chasseur. Les dix ne combattent pas ensemble. |
| NM-dixombres-U | Le Dixième Serment | ultime | Chorégraphie des dix puis convergence | — | — | — | 10 | dégâts successifs puis convergence ; aucun contrôle | — | Les dix créatures apparaissent tour à tour et exécutent leur rôle, puis convergent en une manifestation colossale sur la cible principale. Elles sont ensuite toutes en récupération (60 s). |
| NM-dixombres-10 | Maître des ombres incarnées | transformation | Transformation : manteau d'ombre | 34 | 20 | −40 | 9 | dégâts normaux, aucun contrôle garanti | manteau et bras d'ombre | Apparence partiellement ombragée, membres et manteau d'ombre ; les familiers gagnent des ordres de suivi : chaque coup d'arme appelle une frappe d'ombre. |

## Arsenal du Roi déchu

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-arsenal-01 | Décret de la Lame jurée | offensive | Grande lame-relique, arc unique | 14 | 3 | +8 | 1 | dégâts normaux, aucun contrôle garanti | — | Une grande lame-relique apparaît pour une frappe unique en arc frontal, puis disparaît (elle n'orbite pas). |
| NM-arsenal-02 | Sceptre de commandement | utilitaire | Zone de commandement | 18 | 6 | +6 | 1 | dégâts normaux, aucun contrôle garanti | — | Un sceptre planté crée une zone : les attaques du joueur y gagnent en stabilité et en force. |
| NM-arsenal-03 | Égide du trône brisé | défensive | Panneau bloquant | 18 | 5 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Un panneau-relique bloque une attaque frontale importante et arrête les projectiles, puis se fissure et doit récupérer (décret Garde : deux blocages). |
| NM-arsenal-04 | Chaînes du régent | utilitaire | Tire une cible légère | 22 | 9 | +5 | 2 | dégâts normaux, aucun contrôle garanti | — | Une chaîne-relique accroche une cible légère et la tire vers le joueur ; les ennemis lourds sont seulement déséquilibrés. |
| NM-arsenal-05 | Bannière des légions perdues | utilitaire | Renfort de zone, destructible | 26 | 11 | — | 3 | dégâts normaux, aucun contrôle garanti | — | Une bannière renforce les attaques du joueur dans son rayon ; elle peut être abattue par les ennemis et ne crée aucun soldat. |
| NM-arsenal-06 | Clé des salles scellées | utilitaire | Expose une défense | 22 | 9 | +4 | 5 | dégâts normaux, aucun contrôle garanti | — | Une clé-relique projetée expose brièvement une défense mécanique en combat (vulnérabilité). Ouverture de verrous : aucun verrou magique dans le monde actuel, à relier. |
| NM-arsenal-07 | Couronne d'autorité | utilitaire | Décret : assaut / garde / poursuite | 26 | 12 | — | 6 | dégâts normaux, aucun contrôle garanti | — | Active un décret (cycle : assaut → garde → poursuite) ; les outils royaux suivants reçoivent la variante correspondante. |
| NM-arsenal-08 | Marteau du jugement royal | offensive | Coup lent, brise-garde | 26 | 13 | −15 | 8 | dégâts normaux, aucun contrôle garanti | — | Un marteau-relique massif frappe un point : lent, annoncé, très puissant contre les gardes et les ennemis lourds. |
| NM-arsenal-09 | Ordre de succession | offensive | Chaîne puis marteau | 30 | 16 | −30 | 9 | dégâts normaux, aucun contrôle garanti | — | Enchaîne deux reliques dans l'ordre : la chaîne attire, puis le marteau frappe le point où la cible a été tirée. |
| NM-arsenal-U | Testament du Roi déchu | ultime | Ouverture, condamnation, jugement | — | — | — | 10 | chaîne : déséquilibre seulement ; jugement : dégâts complets | — | Trois reliques exécutent une séquence : ouverture (chaînes), condamnation (lames), jugement (marteau). Le décret actif modifie réellement l'ultime : Assaut = dégâts, Garde = égide pour le joueur, Poursuite = zone élargie et marques. |
| NM-arsenal-10 | Salle du trône éphémère | utilitaire | Arène : rappel accéléré | 34 | 20 | −35 | 9 | dégâts normaux, aucun contrôle garanti | — | Une architecture royale spectrale délimite une arène : à l'intérieur, les reliques se rechargent deux fois plus vite. Aucun contrôle sur les ennemis. |

## Architecte des structures

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-architecte-01 | Planche de franchissement | mobilité | Passerelle courte (franchit l'eau étroite) | 14 | 3 | −10 | 1 | dégâts normaux, aucun contrôle garanti | — | Déploie une courte passerelle devant le joueur ; elle permet de franchir un vide ou une eau étroite. Collision : praticable pour tous, ennemis compris. |
| NM-architecte-02 | Pilier d'appui | défensive | Couvert étroit | 18 | 6 | −12 | 1 | dégâts normaux, aucun contrôle garanti | — | Construit un support vertical : couvert étroit qui arrête les ennemis et les tirs ; il ne soulève pas le terrain. |
| NM-architecte-03 | Piège à ressort | utilitaire | Mécanisme projetant | 18 | 5 | −10 | 1 | dégâts normaux, aucun contrôle garanti | — | Mécanisme qui se déclenche au passage d'un ennemi et le projette légèrement en l'air ; les boss subissent une frappe et un léger déséquilibre. |
| NM-architecte-04 | Rempart modulaire | défensive | Couvert bas orientable | 22 | 9 | −18 | 2 | dégâts normaux, aucun contrôle garanti | — | Couvert bas orienté face à la visée : arrête les projectiles et les ennemis ; les attaques lourdes l'usent. |
| NM-architecte-05 | Treuil de rappel | mobilité | Se hisser ou tirer un objet léger | 26 | 11 | −8 | 3 | dégâts normaux, aucun contrôle garanti | — | Installe un treuil vers un point d'ancrage dégagé : le joueur s'y hisse, ou tire un ennemi léger visé. Ne traverse ni mur ni zone interdite. |
| NM-architecte-06 | Plateforme à bascule | mobilité | Lanceur pivotant | 22 | 9 | −12 | 5 | dégâts normaux, aucun contrôle garanti | — | Plateforme pivotante orientée vers la visée : marcher dessus lance le joueur vers un point proche dégagé. |
| NM-architecte-07 | Tourelle à impulsion | offensive | Tirs cinétiques non létaux | 26 | 12 | −20 | 6 | dégâts normaux, aucun contrôle garanti | — | Tourelle qui tire des impulsions cinétiques sur la cible marquée (ou la plus proche) : tir lent, ligne de vue requise, 6 tirs. Elle repousse sans achever. |
| NM-architecte-08 | Pont de liaison | mobilité | Pont long à charge limitée | 26 | 13 | −22 | 8 | dégâts normaux, aucun contrôle garanti | — | Relie deux points plus éloignés que la passerelle ; durée et charge limitées : les ennemis lourds le font céder. |
| NM-architecte-09 | Atelier instantané | utilitaire | Réparation hors combat | 30 | 16 | −25 | 9 | dégâts normaux, aucun contrôle garanti | — | Station temporaire qui restaure une part de la durabilité de l'équipement porté, seulement hors d'un échange intense. Ne soigne pas. |
| NM-architecte-U | Citadelle en un souffle | ultime | Deux remparts, passerelle, lanceur | — | — | — | 10 | destructible, ne piège pas les boss | — | Construit en séquence une petite citadelle temporaire : deux remparts, une passerelle et un dispositif de lancement ; avantage de positionnement, destructible. |
| NM-architecte-10 | Maître bâtisseur | utilitaire | Plan avancé (cycle) | 34 | 20 | −30 | 9 | dégâts normaux, aucun contrôle garanti | — | Construit le plan avancé sélectionné : piège en chaîne, double passerelle ou rempart à angle. Le plan suivant est annoncé après chaque construction (sélection par cycle). |

## Manipulation de l'Énergie

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-energie-01 | Impulsion énergétique | utilitaire | Impulsion neutre qui repousse | 14 | 3 | +4 | 1 | dégâts normaux, aucun contrôle garanti | — | Impulsion neutre courte qui repousse légèrement et ouvre un espace ; sa force dépend de la réserve dépensée (jusqu'à 15). |
| NM-energie-02 | Sphère de condensation | offensive | Sphère lente et dense | 18 | 6 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Compresse la réserve dans une sphère lente et dense ; plus la réserve dépensée est grande (jusqu'à 30), plus elle frappe fort. Elle n'aspire pas les ennemis. (Maintien de la touche : à prototyper.) |
| NM-energie-03 | Rayon concentré | offensive | Faisceau : précis à l'arrêt | 18 | 5 | −12 | 1 | dégâts normaux, aucun contrôle garanti | — | Faisceau continu de courte durée : plus précis et puissant si le joueur reste immobile ; bouger le disperse et réduit les dégâts. |
| NM-energie-04 | Onde de libération | offensive | Onde circulaire de toute la réserve | 22 | 9 | — | 2 | dégâts normaux, aucun contrôle garanti | — | Déploie toute l'énergie accumulée en une onde circulaire : plus la réserve est élevée, plus l'onde est large. Ne vole aucune ressource. |
| NM-energie-05 | Pas énergétique | mobilité | Propulsion instantanée | 26 | 11 | −10 | 3 | dégâts normaux, aucun contrôle garanti | — | Convertit de la réserve en propulsion dans une direction ; pas une téléportation, les obstacles arrêtent le mouvement. |
| NM-energie-06 | Renforcement du noyau | défensive | Vitesse d'action et stabilité | 22 | 9 | −18 | 5 | dégâts normaux, aucun contrôle garanti | — | Distribue l'énergie dans les muscles et les nerfs : vitesse et stabilité accrues pendant 8 s, sans augmenter les dégâts des magies. |
| NM-energie-07 | Orbes orbitaux | offensive | Jusqu'à trois noyaux tirés sur commande | 8 | 1.2 | −8 | 6 | dégâts normaux, aucun contrôle garanti | — | Crée un noyau en formation fixe autour du joueur (jusqu'à 3). Avec trois noyaux, chaque lancement en tire un sur la cible. Ils ne frappent jamais seuls. |
| NM-energie-08 | Compression absolue | offensive | Impact ponctuel très dense | 26 | 13 | −25 | 8 | dégâts normaux, aucun contrôle garanti | — | Compresse un petit volume d'énergie jusqu'à un état très dense puis le relâche : très fort sur une cible unique, zone minime. |
| NM-energie-09 | Champ de maîtrise | utilitaire | Modulation des attaques | 30 | 16 | −25 | 9 | dégâts normaux, aucun contrôle garanti | — | Champ stable : dans ce champ, chaque compétence d'énergie est prolongée par une forme modulée (impulsion, nappe ou faisceau, en cycle). Ne ralentit pas le temps, ne bloque pas les tirs. |
| NM-energie-U | Cataclysme originel | ultime | Noyau suspendu : ligne ou zone | — | — | — | 10 | charge annoncée, interrompue si le joueur est mis à terre | — | Le joueur rassemble sa réserve en un noyau suspendu puis le libère : focalisée sur une ligne si une cible est verrouillée, radiale sinon (choix explicite : à prototyper). La charge peut être interrompue. |
| NM-energie-10 | Déferlement énergétique | offensive | Vagues sur axes alternés | 34 | 20 | — | 9 | dégâts normaux, aucun contrôle garanti | — | Plusieurs vagues directionnelles sur des axes alternés (avant, gauche, avant, droite) ; chaque vague consomme de la réserve et la série s'arrête quand la réserve est vide. |

## Art de la Découpe

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-decoupe-01 | Trait de rupture | offensive | Ligne courte différée | 14 | 3 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Trace une ligne courte sur une cible ou une surface ; après un bref délai, la ligne se déclenche en coupure localisée. |
| NM-decoupe-02 | Coupe adaptative | offensive | Ligne adaptée à l'armure | 18 | 6 | −10 | 1 | dégâts normaux, aucun contrôle garanti | — | Analyse une cible marquée et choisit une ligne de rupture adaptée à son angle d'armure : plus efficace contre les ennemis lourds et marqués, sans traverser les invulnérabilités. |
| NM-decoupe-03 | Double incision | offensive | Deux lignes croisées | 18 | 5 | −8 | 1 | dégâts normaux, aucun contrôle garanti | — | Deux lignes croisées sur une cible ; la seconde est plus efficace si la première a touché. (Ordre de déclenchement : fixe pour l'instant.) |
| NM-decoupe-04 | Arc de section | offensive | Arc de rupture frontal | 22 | 9 | +5 | 2 | dégâts normaux, aucun contrôle garanti | — | Arc de rupture sur une zone devant le joueur : coupure de surface sur les ennemis traversés. |
| NM-decoupe-05 | Quadrillage de rupture | offensive | Sections simultanées sur une zone | 26 | 11 | −16 | 3 | dégâts normaux, aucun contrôle garanti | — | Quatre lignes quadrillent une petite zone ; le déclenchement sectionne simultanément les cases touchées. Les ennemis peuvent sortir avant l'activation. |
| NM-decoupe-06 | Incision rapprochée | offensive | Geste rapide, interrompt | 6 | 2 | +4 | 5 | dégâts normaux, aucun contrôle garanti | — | Ligne à bout portant, très faible coût ; peut interrompre une attaque ordinaire (pas celle d'un boss). |
| NM-decoupe-07 | Pluie de sections | offensive | Trois coupes successives | 26 | 12 | −14 | 6 | dégâts normaux, aucun contrôle garanti | — | Marque jusqu'à trois cibles ; les lignes se déclenchent successivement, de la plus proche à la plus lointaine. |
| NM-decoupe-08 | Section circulaire | offensive | Cercle qui se ferme | 26 | 13 | −14 | 8 | dégâts normaux, aucun contrôle garanti | — | Cercle de rupture autour du joueur ; après un délai il se ferme : impact fort en périphérie, faible au centre. |
| NM-decoupe-09 | Coupe différée | offensive | Marque à déclenchement | 12 | 1 | — | 9 | dégâts normaux, aucun contrôle garanti | — | Pose une marque de rupture sur une cible ; elle se déclenche au signal du joueur (relancer la compétence) ou au bout de 6 s. |
| NM-decoupe-U | Verdict des mille sections | ultime | Ruptures en cascade | — | — | — | 10 | zones annoncées esquivables, aucun découpage automatique | — | Le joueur trace de nombreuses lignes sur une grande zone puis déclenche une cascade de ruptures ; chaque ligne est annoncée et peut être évitée. |
| NM-decoupe-10 | Sentence de section | offensive | Toute la précision sur une ligne | 34 | 20 | — | 9 | dégâts normaux, aucun contrôle garanti | — | Concentre toute la précision accumulée sur une seule ligne visée ; très puissante sur une cible déjà marquée. La jauge retombe à zéro. |

## Sceau de Possession

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-possession-01 | Marque du réceptacle | utilitaire | Sceau actif, cible marquée | 14 | 3 | +8 | 1 | dégâts normaux, aucun contrôle garanti | — | Active le sceau sur le corps du joueur et marque une cible : la conscience lit ses mouvements ; les attaques du Sceau la frappent plus fort. |
| NM-possession-02 | Regard de l'Ancien | utilitaire | Perception partagée | 18 | 6 | +6 | 1 | dégâts normaux, aucun contrôle garanti | — | La conscience partage sa perception : points vulnérables exposés (vulnérabilité) et trajectoires dangereuses lisibles (esquive accrue). Aucun secret narratif. |
| NM-possession-03 | Main du Possesseur | offensive | Frappe ancestrale à courte portée | 18 | 5 | +6 | 1 | dégâts normaux, aucun contrôle garanti | — | La conscience renforce un coup de paume ou de poing : puissance élevée à courte portée, récupération marquée. |
| NM-possession-04 | Décharge du Sceau | offensive | Décharge frontale | 22 | 9 | — | 2 | dégâts normaux, aucun contrôle garanti | — | Décharge frontale née de la coexistence des deux consciences ; la puissance dépend de la synchronisation consommée (jusqu'à 30). |
| NM-possession-05 | Pas du Réceptacle | mobilité | Esquive tirée, empreinte spectrale | 26 | 11 | — | 3 | dégâts normaux, aucun contrôle garanti | — | L'être ancestral tire le corps sur une courte trajectoire, laissant une empreinte spectrale qui éclate. Pas de passage à travers les murs. |
| NM-possession-06 | Résistance du Réceptacle | défensive | Réflexes partagés | 22 | 9 | — | 5 | dégâts normaux, aucun contrôle garanti | — | La conscience prend en charge réflexes et posture : un coup frontal ou annoncé est fortement réduit, et les dégâts baissent un court instant. |
| NM-possession-07 | Héritage de la Conscience | utilitaire | Arme imprégnée | 26 | 12 | −15 | 6 | dégâts normaux, aucun contrôle garanti | — | L'arme équipée porte la signature ancestrale pendant 10 s : chaque style garde sa gestuelle mais chaque coup reçoit un impact ancestral de zone. |
| NM-possession-08 | Résonance des Deux Esprits | utilitaire | Seconde frappe spectrale | 26 | 13 | — | 8 | dégâts normaux, aucun contrôle garanti | — | La prochaine compétence du Sceau ou le prochain coup d'arme déclenche une seconde frappe spectrale retardée (à 60 %). Une seule répétition. |
| NM-possession-09 | Manifestation partielle | transformation | Cornes, marques, yeux rouges | 30 | 16 | −30 | 9 | dégâts normaux, aucun contrôle garanti | cornes, yeux rouges, marques | Cornes, marques et yeux rouges apparaissent : les attaques passent au premier palier ancestral. |
| NM-possession-U | Éveil du Premier Possesseur | ultime | Fusion totale puis frappe finale | — | — | — | 10 | dégâts majeurs, aucune neutralisation | forme ancestrale complète | Fusion totale : séquence d'éveil, forme ancestrale complète, toutes les attaques renforcées, puis frappe finale massive. |
| NM-possession-10 | Coexistence absolue | transformation | Possession complète | 34 | 45 | −60 | 9 | dégâts normaux, aucun contrôle garanti | peau et cheveux blancs, yeux rouges, cornes, marques, aura | Possession complète : peau et cheveux entièrement blancs, yeux rouges lumineux, cornes ancestrales, marques ; toutes les attaques deviennent nettement plus puissantes. Forme temporaire contrôlée. |

## Dragon divin

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-dragon-01 | Écailles de l'Empereur | défensive | Écailles sur un angle | 14 | 3 | +8 | 1 | dégâts normaux, aucun contrôle garanti | — | Des écailles couvrent un côté du corps (vers la visée) et réduisent les dégâts de cet angle ; elles se fissurent au fil des impacts. |
| NM-dragon-02 | Griffes du Dragon céleste | offensive | Combo de trois griffes | 18 | 6 | +8 | 1 | dégâts normaux, aucun contrôle garanti | — | Deux entailles croisées puis une frappe descendante ; la troisième gagne en puissance si les deux premières ont touché. |
| NM-dragon-03 | Souffle du jugement céleste | offensive | Souffle canalisé en ligne | 18 | 5 | −20 | 1 | dégâts normaux, aucun contrôle garanti | — | Souffle concentré en ligne, balayable lentement sur un angle limité ; pendant la canalisation, le joueur est exposé sur les côtés. |
| NM-dragon-04 | Queue du souverain | offensive | Balayage arrière/latéral | 22 | 9 | +6 | 2 | dégâts normaux, aucun contrôle garanti | — | Une queue spectrale balaie l'arrière et les flancs pour punir ceux qui contournent le joueur. |
| NM-dragon-05 | Descente impériale | mobilité | Bond et plongée | 26 | 11 | −15 | 3 | dégâts normaux, aucun contrôle garanti | — | Bond aérien court puis plongée sur la zone ciblée : onde de pression à l'impact, sans contrôle garanti sur les boss. |
| NM-dragon-06 | Orbe de l'origine | offensive | Noyau de souveraineté | 22 | 9 | — | 5 | dégâts normaux, aucun contrôle garanti | — | Condense de la souveraineté en un noyau lancé qui traverse les ennemis et éclate en bout de course ; plus la part condensée est grande (jusqu'à 25), plus il est dense. (Maintien de la touche : à prototyper.) |
| NM-dragon-07 | Couronne des dragons ancestraux | utilitaire | Trois têtes réactives | 26 | 12 | −25 | 6 | dégâts normaux, aucun contrôle garanti | — | Trois têtes spectrales apparaissent derrière le joueur pendant 15 s et répondent uniquement à ses compétences draconiques (un trait chacune). Elles ne combattent pas seules. |
| NM-dragon-08 | Ascension du Dragon divin | transformation | Ailes, griffes et queue : vol plané | 26 | 13 | −35 | 8 | dégâts normaux, aucun contrôle garanti | ailes, griffes, queue | Transformation avancée : ailes, griffes et queue. Permet de planer au-dessus de l'eau (zones prévues), sans vol libre illimité. |
| NM-dragon-09 | Rugissement de l'Empereur | utilitaire | Onde frontale, précision réduite | 30 | 16 | −15 | 9 | dégâts normaux, aucun contrôle garanti | — | Onde frontale qui perturbe les ennemis ordinaires et réduit leur précision (aveuglement bref) ; les boss ne sont pas étourdis. |
| NM-dragon-U | Apocalypse draconique : Le Dieu parmi les mortels | ultime | Forme hybride, souffle sur une ligne annoncée | — | — | — | 10 | ligne annoncée esquivable, aucune neutralisation | hybride humanoïde-dragon (remplace le corps) | Forme hybride humanoïde-dragon (distincte de l'incarnation) pendant 12 s ; une séquence de domination culmine en un souffle du jugement sur une ligne annoncée. Jauge entièrement consommée. |
| NM-dragon-10 | Incarnation du Dragon divin | transformation | Forme draconique complète | 34 | 50 | −60 | 9 | dégâts normaux, aucun contrôle garanti | dragon complet (remplace le corps) | Forme draconique complète et temporaire, dans les espaces autorisés : déplacement plané, morsure aux coups d'arme, souffle et atterrissage dédiés. |

## Léviathan

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-leviathan-01 | Marque des profondeurs | utilitaire | Marque consommable | 14 | 3 | +8 | 1 | dégâts normaux, aucun contrôle garanti | — | Marque une cible ; les techniques du Léviathan consomment la marque pour gagner en précision ou déclencher un suivi. Aucune paralysie. |
| NM-leviathan-02 | Fouet des abysses | offensive | Appendice aller-retour | 18 | 6 | +5 | 1 | dégâts normaux, aucun contrôle garanti | — | Un appendice frappe en ligne puis revient ; toucher une cible marquée renforce le retour. (Orientation pendant la course : à prototyper.) |
| NM-leviathan-03 | Pression des grands fonds | offensive | Compression ciblée | 18 | 5 | −12 | 1 | dégâts normaux, aucun contrôle garanti | — | Compression ciblée dans une petite zone : les ennemis légers sont tassés au sol, les lourds subissent des dégâts sans immobilisation garantie. |
| NM-leviathan-04 | Courant de dérive | utilitaire | Courant latéral, dévie les tirs | 22 | 9 | −10 | 2 | dégâts normaux, aucun contrôle garanti | — | Courant latéral : déplace légèrement les ennemis légers et dévie les projectiles simples. Ne contrôle ni la masse ni la gravité. |
| NM-leviathan-05 | Gueule du Léviathan | offensive | Morsure surgissante | 26 | 11 | −14 | 3 | dégâts normaux, aucun contrôle garanti | — | Une tête abyssale émerge sous la cible et mord la zone ; si la cible est marquée, une seconde morsure suit (dégâts réduits). |
| NM-leviathan-06 | Noyade silencieuse | utilitaire | Champ de basse pression | 22 | 9 | −14 | 5 | dégâts normaux, aucun contrôle garanti | — | Champ de pression basse : les ennemis ordinaires qui restent dedans ralentissent progressivement. Aucune suffocation ni blocage complet. |
| NM-leviathan-07 | Mâchoires des profondeurs | offensive | Trois mâchoires successives | 26 | 12 | −20 | 6 | dégâts normaux, aucun contrôle garanti | — | Jusqu'à trois mâchoires apparaissent successivement sur des cibles marquées (sinon les plus proches) ; chacune frappe une fois. (Ordre : marquées d'abord, puis proximité.) |
| NM-leviathan-08 | Éveil de l'hôte abyssal | transformation | Plaques, nageoires, appendices | 26 | 13 | −35 | 8 | dégâts normaux, aucun contrôle garanti | plaques, nageoires, appendices | Manifestation avancée : plaques osseuses, nageoires, appendices et lueurs bioluminescentes ; les compétences gagnent en puissance pendant la forme. |
| NM-leviathan-09 | Effondrement abyssal | offensive | Zone qui attire puis s'effondre | 30 | 16 | −25 | 9 | dégâts normaux, aucun contrôle garanti | — | Zone annoncée où la pression s'accumule : les ennemis légers sont attirés au centre, puis tout s'effondre ; les boss subissent dégâts et pression sans être déplacés. |
| NM-leviathan-U | Fin des profondeurs : L'Éveil du Dévoreur | ultime | Ombre colossale, mâchoires, explosion | — | — | — | 10 | dégâts complets, jamais avalé ni neutralisé | dévoreur colossal et cinq mâchoires | Le champ s'assombrit, une ombre colossale apparaît, plusieurs mâchoires frappent des zones annoncées puis convergent en une explosion de pression finale. |
| NM-leviathan-10 | Incarnation du Léviathan | transformation | Hôte complet, appendices dédiés | 34 | 50 | −60 | 9 | dégâts normaux, aucun contrôle garanti | hôte complet, six appendices | Manifestation complète de l'hôte humanoïde pendant 22 s : plusieurs appendices fonctionnels ; chaque coup d'arme déclenche un coup d'appendice qui consomme la jauge. |

## Comptage de contrôle

- Familles : 12 / 12.
- Compétences : 120 / 120.
- Ultimes : 12 / 12.
- Total : 132 / 132.
