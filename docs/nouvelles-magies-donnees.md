# Vélorne — Fiches de données des 12 nouvelles magies (132 compétences)

**Source des fiches :** extraites du jeu le 25/11 (mises à jour après la refonte « attaques à distance » du soir) (`NM.DATA`, fichier `docs/nouvelles-magies-donnees.json`), donc identiques au code.

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
| NM-orochi-02 | Crachat des huit gueules | offensive | Éventail de huit jets à longue portée | 18 | 6 | +5 | 1 | dégâts normaux, aucun contrôle garanti | — | Les huit têtes crachent ensemble un éventail de jets corrosifs qui portent loin ; chaque jet empoisonne. |
| NM-orochi-03 | Têtes lancées | offensive | Trois têtes à tête chercheuse | 18 | 5 | +5 | 1 | dégâts normaux, aucun contrôle garanti | — | Trois têtes s'allongent à toute vitesse vers les ennemis, traversent la première cible et la marquent pour la Morsure. |
| NM-orochi-04 | Garde des cous entrelacés | défensive | Garde frontale à charges | 22 | 9 | −18 | 2 | dégâts normaux, aucun contrôle garanti | — | Les cous tressés forment une garde mobile qui absorbe 4 impacts frontaux, puis se défait en contre-coup. |
| NM-orochi-05 | Morsure en relais | offensive | Trois morsures à distance | 26 | 11 | −14 | 3 | dégâts normaux, aucun contrôle garanti | — | Trois cous se tendent jusqu'à une cible éloignée (jusqu'à 300) et mordent tour à tour depuis des angles alternés ; si la cible sort de portée, le relais s'interrompt. |
| NM-orochi-06 | Souffle des chefs | offensive | Quatre souffles en faisceaux | 22 | 9 | −22 | 5 | dégâts normaux, aucun contrôle garanti | — | Quatre têtes soufflent tour à tour un long faisceau : pression (recul), chaleur (brûlure), venin (poison), onde (affaiblissement). |
| NM-orochi-07 | Déluge de crocs | offensive | Pluie de crocs sur une zone lointaine | 26 | 12 | −16 | 6 | dégâts normaux, aucun contrôle garanti | — | Les têtes s'élèvent et abattent une pluie de crocs sur la zone visée, loin devant. |
| NM-orochi-08 | Frappe convergente | offensive | Convergence sur un point | 26 | 13 | −16 | 8 | dégâts normaux, aucun contrôle garanti | — | Les têtes frappent ensemble un point au sol : zone élargie par les angles, dégâts concentrés au centre. |
| NM-orochi-09 | Rugissement-canon | offensive | Onde destructrice vers l'avant | 30 | 16 | −24 | 9 | dégâts normaux, aucun contrôle garanti | — | Les huit gueules rugissent dans la même direction : une onde dévastatrice parcourt le sol, désoriente les ennemis ordinaires et frappe fort les boss. |
| NM-orochi-U | Huit Couronnes, une seule gueule | ultime | Huit frappes puis morsure colossale | — | — | — | 10 | phases annoncées esquivables ; coup final majeur si préparé | huit cous géants surgissant du sol | Les huit têtes encerclent une vaste zone et frappent en séquence (annoncées), puis convergent en une morsure colossale. |
| NM-orochi-10 | Corps du serpent-roi | transformation | Transformation : huit cous | 34 | 20 | −40 | 9 | dégâts normaux, aucun contrôle garanti | huit cous et têtes articulés (nm3d.js) | Écailles sur le torse, huit cous ancestraux derrière le joueur ; les coups d'arme déclenchent des morsures de cou. La mobilité reste celle du personnage. |

## Phénix

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-phenix-01 | Plumes de braise | offensive | Éventail de plumes plantées | 14 | 3 | +6 | 1 | dégâts normaux, aucun contrôle garanti | — | Éventail de plumes qui se plantent dans le sol ou la cible et restent quelques secondes ; elles peuvent être rappelées. |
| NM-phenix-02 | Javelot solaire | offensive | Lance de feu perforante | 18 | 6 | +6 | 1 | dégâts normaux, aucun contrôle garanti | — | Une lance de flammes traverse tout sur sa trajectoire et explose en bout de course en laissant des plumes de braise. |
| NM-phenix-03 | Tempête de plumes | offensive | Barrage de plumes chercheuses | 18 | 5 | +6 | 1 | dégâts normaux, aucun contrôle garanti | — | Douze plumes incandescentes jaillissent l'une après l'autre et filent vers les ennemis ; chacune marque sa cible pour la combustion. |
| NM-phenix-04 | Oiseau de feu | offensive | Grand oiseau de flammes | 22 | 9 | −12 | 2 | dégâts normaux, aucun contrôle garanti | — | Un grand oiseau de flammes s'envole droit devant, traverse les ennemis en les brûlant et explose au bout de sa course. |
| NM-phenix-05 | Plongée du plumage | offensive | Plongée sur une cible marquée | 26 | 11 | −14 | 3 | dégâts normaux, aucun contrôle garanti | — | Saut bref puis plongée sur une cible marquée ; l'impact disperse les marques en éclats brûlants. |
| NM-phenix-06 | Pluie de braises | offensive | Pluie de feu sur la zone | 22 | 9 | −14 | 5 | dégâts normaux, aucun contrôle garanti | — | Une pluie de braises s'abat sur la zone visée ; les cibles marquées s'embrasent. |
| NM-phenix-07 | Rappel des cendres | utilitaire | Rappel des plumes plantées | 26 | 12 | — | 6 | dégâts normaux, aucun contrôle garanti | — | Les plumes déposées reviennent vers le joueur en frappant sur leur trajet ; chaque plume récupérée restaure du Cycle de Cendres. |
| NM-phenix-08 | Aube incandescente | offensive | Zone à pulsations | 26 | 13 | −18 | 8 | dégâts normaux, aucun contrôle garanti | — | Les cendres d'une zone s'embrasent en vagues successives, avec des intervalles pour esquiver ; les plumes présentes renforcent la zone. |
| NM-phenix-09 | Mue du grand Phénix | transformation | Transformation : ailes et queue | 30 | 16 | −35 | 9 | dégâts normaux, aucun contrôle garanti | ailes articulées, plumage, queue de plumes | Ailes, plumage d'épaule et queue de feu ; les esquives deviennent des bonds aériens et les coups d'arme laissent des plumes marquantes. |
| NM-phenix-U | Seconde Aube | ultime | Dispersion puis explosion en anneaux | — | — | — | 10 | dégâts en vagues, aucun contrôle | — | Le joueur se consume, se disperse en une nuée de cendres sur une grande zone puis se reconstitue au centre d'une explosion en anneaux ; jauge partiellement restaurée. |
| NM-phenix-10 | Renaissance conditionnelle | défensive | Reconstruction après un coup fatal | 20 | 30 | — | 9 | aucune différence ; jamais en arène de duel | — | Prépare la reconstruction pendant 60 s : si un coup fatal arrive avec la jauge pleine, le joueur revient à 30 % de vie. Longue recharge interne (180 s), pas dans les zones interdites, ne s'empile pas. |

## Titan

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-titan-01 | Poing d'inertie | offensive | Coup direct selon l'élan | 14 | 3 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Coup de poing direct dont la puissance croît avec l'inertie accumulée en se déplaçant juste avant. Sans élan : frappe fiable mais modérée. |
| NM-titan-02 | Onde de choc frontale | offensive | Onde au sol vers l'avant | 18 | 6 | +6 | 1 | dégâts normaux, aucun contrôle garanti | — | Le Titan frappe le sol : une onde de pression file droit devant sur une longue distance et renverse les ennemis légers. |
| NM-titan-03 | Poing projeté | offensive | Poing de pression à distance | 18 | 5 | +5 | 1 | dégâts normaux, aucun contrôle garanti | — | Un coup de poing si violent que l'air comprimé part en un poing de pression qui frappe loin et repousse fort. |
| NM-titan-04 | Charge inexorable | mobilité | Charge qui s'alourdit | 22 | 9 | — | 2 | dégâts normaux, aucun contrôle garanti | — | Charge en ligne droite qui gagne en puissance avec l'élan ; un obstacle arrête la charge et fait perdre l'élan. |
| NM-titan-05 | Saisie du géant | offensive | Saisir et projeter | 26 | 11 | — | 3 | dégâts normaux, aucun contrôle garanti | — | Saisit un ennemi de taille compatible, le soulève et le projette ; les ennemis lourds et boss encaissent un coup de paume à la place. |
| NM-titan-06 | Salve de pression | offensive | Trois poings de pression | 22 | 9 | −12 | 5 | dégâts normaux, aucun contrôle garanti | — | Trois coups de poing successifs projettent trois poings de pression vers les ennemis. |
| NM-titan-07 | Frappe sonique | offensive | Rayon de choc instantané | 26 | 12 | −16 | 6 | dégâts normaux, aucun contrôle garanti | — | Un coup porté à vitesse colossale crée une ligne de choc instantanée qui traverse tout sur une grande distance. |
| NM-titan-08 | Bond des hauteurs | mobilité | Saut et atterrissage télégraphié | 26 | 13 | — | 8 | dégâts normaux, aucun contrôle garanti | — | Saut puissant vers un point choisi avant le décollage ; l'atterrissage, annoncé, frappe selon l'inertie portée et la convertit en élan (+20). |
| NM-titan-09 | Forme du Titan | transformation | Transformation : colosse | 30 | 40 | — | 9 | dégâts normaux, aucun contrôle garanti | colosse humanoïde complet (remplace le corps) | Croissance contrôlée : membres massifs, démarche lourde, portée de mêlée accrue. Impossible dans les intérieurs étroits. |
| NM-titan-U | Le Poids du Premier Géant | ultime | Trois frappes annoncées | — | — | — | 10 | dégâts complets, jamais projeté | — | Le Titan s'ancre puis porte trois frappes annoncées — poing, coude, impact total ; la dernière libère une onde massive. |
| NM-titan-10 | Rupture d'inertie | offensive | Libère toute l'inertie | 34 | 20 | — | 9 | dégâts normaux, aucun contrôle garanti | — | Libère d'un coup l'inertie accumulée en une onde au sol : plus elle est haute, plus l'onde est large ; la jauge retombe à zéro. |

## Kitsune

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-kitsune-01 | Feux follets | offensive | Cinq feux-renards chercheurs | 14 | 3 | +1 | 1 | dégâts normaux, aucun contrôle garanti | — | Cinq feux follets jaillissent des queues et poursuivent les ennemis à distance. |
| NM-kitsune-02 | Griffe du renard | offensive | Pointe de queue à moyenne portée | 18 | 6 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Une queue raidie frappe à moyenne portée ; si un sceau est disponible, elle revient par un angle secondaire. |
| NM-kitsune-03 | Sceau explosif | offensive | Sceau lancé qui explose | 18 | 5 | +1 | 1 | dégâts normaux, aucun contrôle garanti | — | Lance un sceau sur la cible lointaine : il explose après un instant puis reste au sol, utilisable pour la permutation. |
| NM-kitsune-04 | Neuf flammes-renards | offensive | Éventail de neuf flammes | 22 | 9 | −2 | 2 | dégâts normaux, aucun contrôle garanti | — | Neuf flammes en forme de renard partent en éventail et portent loin. |
| NM-kitsune-05 | Queue entravante | utilitaire | Entrave courte (pas les boss) | 26 | 11 | −1 | 3 | dégâts normaux, aucun contrôle garanti | — | Deux queues croisent leur trajectoire autour d'une cible et limitent ses déplacements un court instant ; les boss sont seulement ralentis. |
| NM-kitsune-06 | Rayon du renard céleste | offensive | Long faisceau doré | 22 | 9 | −2 | 5 | dégâts normaux, aucun contrôle garanti | — | Les queues se rejoignent et projettent un long rayon doré qui traverse tout. |
| NM-kitsune-07 | Sceau de permutation | mobilité | Échange explosif avec un sceau | 26 | 12 | −1 | 6 | dégâts normaux, aucun contrôle garanti | — | Échange la position du joueur avec un sceau actif ; les deux points explosent. |
| NM-kitsune-08 | Éventail des queues | offensive | Balayage / piqué / garde (cycle) | 26 | 13 | — | 8 | dégâts normaux, aucun contrôle garanti | — | Les queues frappent selon une séquence : balayage, piqué ou garde, chacune avec son profil. Ordre actuel : cycle à chaque lancement (choix libre à prototyper). |
| NM-kitsune-09 | Masque du renard ancien | transformation | Transformation : oreilles et queues | 30 | 36 | — | 9 | dégâts normaux, aucun contrôle garanti | queues selon la maîtrise, oreilles, marques | Oreilles, marques faciales, queues et posture du Kitsune ; les sceaux durent plus longtemps et la Griffe gagne toujours son suivi. |
| NM-kitsune-U | Les Neuf Portes du Renard | ultime | Neuf sceaux puis convergence | — | — | — | 10 | frappes et convergence, aucun contrôle | — | Neuf queues tracent neuf sceaux autour de l'arène ; chaque porte déclenche une frappe ou une garde, la neuvième ferme le réseau par une attaque convergente. Ordre actuel : automatique (choix à prototyper). |
| NM-kitsune-10 | Palais des sceaux | mobilité | Réseau de trois sceaux | 12 | 2.5 | — | 9 | dégâts normaux, aucun contrôle garanti | — | Crée trois sceaux reliés ; chaque relance s'élance vers le sceau suivant en frappant sur le trajet ; le réseau s'effondre après trois utilisations. |

## Dix Ombres

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-dixombres-01 | Meute lancée | offensive | Quatre loups d'ombre chercheurs | 14 | 3 | +5 | 1 | dégâts normaux, aucun contrôle garanti | — | Quatre loups d'ombre bondissent vers les ennemis, chacun sur une cible différente si possible, et les marquent. |
| NM-dixombres-02 | Traque du second familier | offensive | Chasseur : frappe une cible marquée | 18 | 6 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Le Chasseur poursuit une cible marquée, frappe une fois puis revient ; il ne traverse pas les murs. |
| NM-dixombres-03 | Rapace d'ombre | offensive | Plongée perforante | 18 | 5 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Le Rapace plonge en ligne droite sur une longue distance et transperce tout sur son passage. |
| NM-dixombres-04 | Bond du quatrième familier | offensive | Sauteur : bond annoncé | 22 | 9 | — | 2 | dégâts normaux, aucun contrôle garanti | — | Le Sauteur attaque une zone au sol après un bond annoncé ; il respecte la géométrie. |
| NM-dixombres-05 | Lien des deux ombres | utilitaire | Deux familiers liés | 26 | 11 | −14 | 3 | dégâts normaux, aucun contrôle garanti | — | Deux familiers liés : quand l'un frappe, l'autre se repositionne de l'autre côté de la cible. Le lien ne double pas les dégâts. |
| NM-dixombres-06 | Formation de chasse | offensive | Trois angles, attaque sur ordre | 22 | 9 | −16 | 5 | dégâts normaux, aucun contrôle garanti | — | Trois familiers prennent des angles distincts autour d'une cible ; ils attaquent au prochain coup d'arme du joueur (l'ordre de déclenchement). |
| NM-dixombres-07 | Serpent d'ombre | offensive | Serpent qui file au sol | 26 | 12 | +6 | 6 | dégâts normaux, aucun contrôle garanti | — | Le Serpent glisse au ras du sol sur une longue distance, mord et ralentit tout ce qu'il traverse. |
| NM-dixombres-08 | Fusion des silhouettes | offensive | Créature composite | 26 | 13 | −22 | 8 | dégâts normaux, aucun contrôle garanti | — | Deux familiers compatibles (Colosse et Serpent) fusionnent brièvement en une créature composite à l'attaque combinée ; ils sont indisponibles séparément pendant ce temps. |
| NM-dixombres-09 | Essaim des ombres | offensive | Nuée qui s'abat sur une zone | 30 | 16 | −18 | 9 | dégâts normaux, aucun contrôle garanti | dix présences d'ombre | L'Essaim s'abat en nuée sur la zone visée, loin devant, et frappe tout ce qui s'y trouve. |
| NM-dixombres-U | Le Dixième Serment | ultime | Chorégraphie des dix puis convergence | — | — | — | 10 | dégâts successifs puis convergence ; aucun contrôle | — | Les dix créatures apparaissent tour à tour et exécutent leur rôle, puis convergent en une manifestation colossale sur la cible principale. Elles sont ensuite toutes en récupération (60 s). |
| NM-dixombres-10 | Maître des ombres incarnées | transformation | Transformation : manteau d'ombre | 34 | 20 | −40 | 9 | dégâts normaux, aucun contrôle garanti | manteau et bras d'ombre | Apparence partiellement ombragée, membres et manteau d'ombre ; les familiers gagnent des ordres de suivi : chaque coup d'arme appelle une frappe d'ombre. |

## Arsenal du Roi déchu

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-arsenal-01 | Lame jurée projetée | offensive | Grande lame lancée en tournoyant | 14 | 3 | +8 | 1 | dégâts normaux, aucun contrôle garanti | — | Une grande lame-relique est lancée en tournoyant : elle traverse les ennemis puis revient vers le joueur. |
| NM-arsenal-02 | Pluie d'épées royales | offensive | Épées qui tombent du ciel | 18 | 6 | +6 | 1 | dégâts normaux, aucun contrôle garanti | — | Des dizaines d'épées-reliques tombent du ciel sur la zone visée. |
| NM-arsenal-03 | Égide du trône brisé | défensive | Panneau bloquant | 18 | 5 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Un panneau-relique bloque une attaque frontale importante et arrête les projectiles, puis se fissure et doit récupérer (décret Garde : deux blocages). |
| NM-arsenal-04 | Chaînes du régent | utilitaire | Tire une cible légère | 22 | 9 | +5 | 2 | dégâts normaux, aucun contrôle garanti | — | Une chaîne-relique accroche une cible légère et la tire vers le joueur ; les ennemis lourds sont seulement déséquilibrés. |
| NM-arsenal-05 | Salve de lances | offensive | Cinq lances perforantes | 26 | 11 | −10 | 3 | dégâts normaux, aucun contrôle garanti | — | Cinq lances royales partent en salve et traversent les rangs ennemis. |
| NM-arsenal-06 | Clé des salles scellées | utilitaire | Expose une défense | 22 | 9 | +4 | 5 | dégâts normaux, aucun contrôle garanti | — | Une clé-relique projetée expose brièvement une défense mécanique en combat (vulnérabilité). Ouverture de verrous : aucun verrou magique dans le monde actuel, à relier. |
| NM-arsenal-07 | Couronne d'autorité | offensive | Couronne de lames + décret | 26 | 12 | +6 | 6 | dégâts normaux, aucun contrôle garanti | — | Huit lames forment une couronne puis partent une à une vers les ennemis ; le décret change (assaut → garde → poursuite) et modifie les reliques suivantes. |
| NM-arsenal-08 | Marteau du jugement royal | offensive | Coup lent, brise-garde | 26 | 13 | −15 | 8 | dégâts normaux, aucun contrôle garanti | — | Un marteau-relique massif frappe un point : lent, annoncé, très puissant contre les gardes et les ennemis lourds. |
| NM-arsenal-09 | Ordre de succession | offensive | Chaîne puis marteau | 30 | 16 | −30 | 9 | dégâts normaux, aucun contrôle garanti | — | Enchaîne deux reliques dans l'ordre : la chaîne attire, puis le marteau frappe le point où la cible a été tirée. |
| NM-arsenal-U | Testament du Roi déchu | ultime | Ouverture, condamnation, jugement | — | — | — | 10 | chaîne : déséquilibre seulement ; jugement : dégâts complets | — | Trois reliques exécutent une séquence : ouverture (chaînes), condamnation (lames), jugement (marteau). Le décret actif modifie réellement l'ultime : Assaut = dégâts, Garde = égide pour le joueur, Poursuite = zone élargie et marques. |
| NM-arsenal-10 | Exécution royale | offensive | Épée colossale tombée du ciel | 34 | 20 | −30 | 9 | dégâts normaux, aucun contrôle garanti | — | Une épée colossale tombe du ciel sur la cible lointaine : impact annoncé, onde de choc tout autour. |

## Architecte des structures

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-architecte-01 | Planche de franchissement | mobilité | Passerelle courte (franchit l'eau étroite) | 14 | 3 | −10 | 1 | dégâts normaux, aucun contrôle garanti | — | Déploie une courte passerelle devant le joueur ; elle permet de franchir un vide ou une eau étroite. Collision : praticable pour tous, ennemis compris. |
| NM-architecte-02 | Pieu projeté | offensive | Poutre lancée perforante | 18 | 6 | +5 | 1 | dégâts normaux, aucun contrôle garanti | — | Assemble une poutre de charpente et la projette comme un pieu : elle traverse les ennemis sur une longue distance. |
| NM-architecte-03 | Piège à ressort | utilitaire | Mécanisme projetant | 18 | 5 | −10 | 1 | dégâts normaux, aucun contrôle garanti | — | Mécanisme qui se déclenche au passage d'un ennemi et le projette légèrement en l'air ; les boss subissent une frappe et un léger déséquilibre. |
| NM-architecte-04 | Rempart modulaire | défensive | Couvert bas orientable | 22 | 9 | −18 | 2 | dégâts normaux, aucun contrôle garanti | — | Couvert bas orienté face à la visée : arrête les projectiles et les ennemis ; les attaques lourdes l'usent. |
| NM-architecte-05 | Baliste instantanée | offensive | Trois carreaux lourds | 26 | 11 | −12 | 3 | dégâts normaux, aucun contrôle garanti | — | Une baliste s'assemble en un instant et tire trois carreaux lourds vers la cible. |
| NM-architecte-06 | Catapulte | offensive | Bloc lancé en cloche | 22 | 9 | −14 | 5 | dégâts normaux, aucun contrôle garanti | — | Une catapulte expédie un bloc massif en cloche sur la cible lointaine : impact annoncé, gros dégâts de zone. |
| NM-architecte-07 | Tourelle à impulsion | offensive | Tirs cinétiques non létaux | 26 | 12 | −20 | 6 | dégâts normaux, aucun contrôle garanti | — | Tourelle qui tire des impulsions cinétiques sur la cible marquée (ou la plus proche) : tir lent, ligne de vue requise, 6 tirs. Elle repousse sans achever. |
| NM-architecte-08 | Rail de poutres | offensive | Poutres qui surgissent en ligne | 26 | 13 | −16 | 8 | dégâts normaux, aucun contrôle garanti | — | Une ligne de poutres jaillit du sol, l'une après l'autre, vers l'avant et projette les ennemis. |
| NM-architecte-09 | Effondrement de charpente | offensive | Poutres qui s'abattent | 30 | 16 | −20 | 9 | dégâts normaux, aucun contrôle garanti | — | Une charpente entière s'assemble au-dessus de la zone visée puis s'effondre poutre par poutre. |
| NM-architecte-U | Citadelle en un souffle | ultime | Deux remparts, passerelle, lanceur | — | — | — | 10 | destructible, ne piège pas les boss | — | Construit en séquence une petite citadelle temporaire : deux remparts, une passerelle et un dispositif de lancement ; avantage de positionnement, destructible. |
| NM-architecte-10 | Batterie de tourelles | offensive | Trois tourelles | 34 | 20 | −30 | 9 | dégâts normaux, aucun contrôle garanti | — | Construit trois tourelles autour du joueur ; elles tirent sur les ennemis visibles jusqu'à épuisement. |

## Manipulation de l'Énergie

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-energie-01 | Trait d'énergie | offensive | Trois traits rapides | 14 | 3 | +4 | 1 | dégâts normaux, aucun contrôle garanti | — | Trois traits d'énergie pure partent coup sur coup, très vite et très loin. |
| NM-energie-02 | Sphère de condensation | offensive | Sphère lente et dense | 18 | 6 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Compresse la réserve dans une sphère lente et dense ; plus la réserve dépensée est grande (jusqu'à 30), plus elle frappe fort. Elle n'aspire pas les ennemis. (Maintien de la touche : à prototyper.) |
| NM-energie-03 | Rayon concentré | offensive | Faisceau : précis à l'arrêt | 18 | 5 | −12 | 1 | dégâts normaux, aucun contrôle garanti | — | Faisceau continu de courte durée : plus précis et puissant si le joueur reste immobile ; bouger le disperse et réduit les dégâts. |
| NM-energie-04 | Onde de libération | offensive | Onde circulaire de toute la réserve | 22 | 9 | — | 2 | dégâts normaux, aucun contrôle garanti | — | Déploie toute l'énergie accumulée en une onde circulaire : plus la réserve est élevée, plus l'onde est large. Ne vole aucune ressource. |
| NM-energie-05 | Lance d'énergie | offensive | Lance perforante géante | 26 | 11 | — | 3 | dégâts normaux, aucun contrôle garanti | — | Condense la réserve en une lance géante qui traverse tout ; plus la réserve dépensée est haute (jusqu'à 30), plus elle frappe fort. |
| NM-energie-06 | Pluie d'énergie | offensive | Barrage tombant du ciel | 22 | 9 | −16 | 5 | dégâts normaux, aucun contrôle garanti | — | Des dizaines de projectiles d'énergie tombent sur la zone visée. |
| NM-energie-07 | Orbes orbitaux | offensive | Jusqu'à trois noyaux tirés sur commande | 8 | 1.2 | −8 | 6 | dégâts normaux, aucun contrôle garanti | — | Crée un noyau en formation fixe autour du joueur (jusqu'à 3). Avec trois noyaux, chaque lancement en tire un sur la cible. Ils ne frappent jamais seuls. |
| NM-energie-08 | Compression absolue | offensive | Impact ponctuel très dense | 26 | 13 | −25 | 8 | dégâts normaux, aucun contrôle garanti | — | Compresse un petit volume d'énergie jusqu'à un état très dense puis le relâche : très fort sur une cible unique, zone minime. |
| NM-energie-09 | Faisceau prismatique | offensive | Trois faisceaux en éventail | 30 | 16 | −24 | 9 | dégâts normaux, aucun contrôle garanti | — | Un faisceau d'énergie se divise en trois longs rayons en éventail. |
| NM-energie-U | Cataclysme originel | ultime | Noyau suspendu : ligne ou zone | — | — | — | 10 | charge annoncée, interrompue si le joueur est mis à terre | — | Le joueur rassemble sa réserve en un noyau suspendu puis le libère : focalisée sur une ligne si une cible est verrouillée, radiale sinon (choix explicite : à prototyper). La charge peut être interrompue. |
| NM-energie-10 | Déferlement énergétique | offensive | Vagues sur axes alternés | 34 | 20 | — | 9 | dégâts normaux, aucun contrôle garanti | — | Plusieurs vagues directionnelles sur des axes alternés (avant, gauche, avant, droite) ; chaque vague consomme de la réserve et la série s'arrête quand la réserve est vide. |

## Art de la Découpe

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-decoupe-01 | Trait de rupture | offensive | Ligne courte différée | 14 | 3 | — | 1 | dégâts normaux, aucun contrôle garanti | — | Trace une ligne courte sur une cible ou une surface ; après un bref délai, la ligne se déclenche en coupure localisée. |
| NM-decoupe-02 | Coupe adaptative | offensive | Ligne adaptée à l'armure | 18 | 6 | −10 | 1 | dégâts normaux, aucun contrôle garanti | — | Analyse une cible marquée et choisit une ligne de rupture adaptée à son angle d'armure : plus efficace contre les ennemis lourds et marqués, sans traverser les invulnérabilités. |
| NM-decoupe-03 | Double incision | offensive | Deux lignes croisées | 18 | 5 | −8 | 1 | dégâts normaux, aucun contrôle garanti | — | Deux lignes croisées sur une cible ; la seconde est plus efficace si la première a touché. (Ordre de déclenchement : fixe pour l'instant.) |
| NM-decoupe-04 | Croissants de rupture | offensive | Trois lames-croissants | 22 | 9 | +5 | 2 | dégâts normaux, aucun contrôle garanti | — | Trois croissants de rupture partent en éventail et tranchent tout sur leur passage. |
| NM-decoupe-05 | Quadrillage de rupture | offensive | Sections simultanées sur une zone | 26 | 11 | −16 | 3 | dégâts normaux, aucun contrôle garanti | — | Quatre lignes quadrillent une petite zone ; le déclenchement sectionne simultanément les cases touchées. Les ennemis peuvent sortir avant l'activation. |
| NM-decoupe-06 | Lame volante | offensive | Croissant géant perforant | 10 | 3 | +4 | 5 | dégâts normaux, aucun contrôle garanti | — | Un grand croissant de coupe file très loin et traverse les ennemis. |
| NM-decoupe-07 | Pluie de sections | offensive | Trois coupes successives | 26 | 12 | −14 | 6 | dégâts normaux, aucun contrôle garanti | — | Marque jusqu'à trois cibles ; les lignes se déclenchent successivement, de la plus proche à la plus lointaine. |
| NM-decoupe-08 | Tranchant à distance | offensive | Ligne de coupe instantanée | 26 | 13 | −14 | 8 | dégâts normaux, aucun contrôle garanti | — | Une ligne de rupture instantanée se trace sur une grande longueur et sectionne tout ce qu'elle traverse. |
| NM-decoupe-09 | Coupe différée | offensive | Marque à déclenchement | 12 | 1 | — | 9 | dégâts normaux, aucun contrôle garanti | — | Pose une marque de rupture sur une cible ; elle se déclenche au signal du joueur (relancer la compétence) ou au bout de 6 s. |
| NM-decoupe-U | Verdict des mille sections | ultime | Ruptures en cascade | — | — | — | 10 | zones annoncées esquivables, aucun découpage automatique | — | Le joueur trace de nombreuses lignes sur une grande zone puis déclenche une cascade de ruptures ; chaque ligne est annoncée et peut être évitée. |
| NM-decoupe-10 | Sentence de section | offensive | Toute la précision sur une ligne | 34 | 20 | — | 9 | dégâts normaux, aucun contrôle garanti | — | Concentre toute la précision accumulée sur une seule ligne visée ; très puissante sur une cible déjà marquée. La jauge retombe à zéro. |

## Sceau de Possession

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-possession-01 | Poing spectral projeté | offensive | Poing ancestral à distance | 14 | 3 | +8 | 1 | dégâts normaux, aucun contrôle garanti | — | La conscience ancestrale projette un poing spectral blanc et rouge qui frappe loin et marque la cible. |
| NM-possession-02 | Regard foudroyant | offensive | Éclair du regard sur la cible | 18 | 6 | +6 | 1 | dégâts normaux, aucun contrôle garanti | — | Les yeux rouges s'allument : un éclair blanc et rouge frappe instantanément la cible lointaine et l'expose. |
| NM-possession-03 | Main du Possesseur | offensive | Frappe ancestrale à courte portée | 18 | 5 | +6 | 1 | dégâts normaux, aucun contrôle garanti | — | La conscience renforce un coup de paume ou de poing : puissance élevée à courte portée, récupération marquée. |
| NM-possession-04 | Décharge du Sceau | offensive | Long faisceau du sceau | 22 | 9 | — | 2 | dégâts normaux, aucun contrôle garanti | — | Décharge en un long faisceau ; la puissance dépend de la synchronisation consommée (jusqu'à 30). |
| NM-possession-05 | Salve ancestrale | offensive | Six lames spectrales | 26 | 11 | +6 | 3 | dégâts normaux, aucun contrôle garanti | — | Six lames spectrales apparaissent autour du joueur et filent vers les ennemis. |
| NM-possession-06 | Piliers ancestraux | offensive | Piliers de lumière en ligne | 22 | 9 | −15 | 5 | dégâts normaux, aucun contrôle garanti | — | Des piliers de lumière rouge et blanche jaillissent du sol l'un après l'autre, droit vers la cible. |
| NM-possession-07 | Griffes spectrales | offensive | Trois griffes projetées | 26 | 12 | −10 | 6 | dégâts normaux, aucun contrôle garanti | — | Trois griffes spectrales en croissant sont projetées en éventail et lacèrent à distance. |
| NM-possession-08 | Déchaînement | offensive | Dix frappes spectrales sur la zone | 26 | 13 | −18 | 8 | dégâts normaux, aucun contrôle garanti | — | La conscience se déchaîne : dix frappes spectrales s'abattent sur la zone visée. |
| NM-possession-09 | Manifestation partielle | transformation | Cornes, marques, yeux rouges | 30 | 16 | −30 | 9 | dégâts normaux, aucun contrôle garanti | cornes, yeux rouges, marques | Cornes, marques et yeux rouges apparaissent : les attaques passent au premier palier ancestral. |
| NM-possession-U | Éveil du Premier Possesseur | ultime | Fusion totale puis frappe finale | — | — | — | 10 | dégâts majeurs, aucune neutralisation | forme ancestrale complète | Fusion totale : séquence d'éveil, forme ancestrale complète, toutes les attaques renforcées, puis frappe finale massive. |
| NM-possession-10 | Coexistence absolue | transformation | Possession complète | 34 | 45 | −60 | 9 | dégâts normaux, aucun contrôle garanti | peau et cheveux blancs, yeux rouges, cornes, marques, aura | Possession complète : peau et cheveux entièrement blancs, yeux rouges lumineux, cornes ancestrales, marques ; toutes les attaques deviennent nettement plus puissantes. Forme temporaire contrôlée. |

## Dragon divin

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-dragon-01 | Écailles-lames | offensive | Six écailles chercheuses | 14 | 3 | +8 | 1 | dégâts normaux, aucun contrôle garanti | — | Six écailles dorées se détachent et filent comme des lames vers les ennemis. |
| NM-dragon-02 | Griffes du Dragon céleste | offensive | Combo de trois griffes | 18 | 6 | +8 | 1 | dégâts normaux, aucun contrôle garanti | — | Deux entailles croisées puis une frappe descendante ; la troisième gagne en puissance si les deux premières ont touché. |
| NM-dragon-03 | Souffle du jugement céleste | offensive | Souffle canalisé très long | 18 | 5 | −20 | 1 | dégâts normaux, aucun contrôle garanti | — | Souffle concentré sur une très grande distance, balayable lentement ; pendant la canalisation, le joueur est exposé sur les côtés. |
| NM-dragon-04 | Comète draconique | offensive | Comète de souveraineté | 22 | 9 | +6 | 2 | dégâts normaux, aucun contrôle garanti | — | Un projectile de souveraineté en forme de comète traverse les ennemis et explose en bout de course. |
| NM-dragon-05 | Descente impériale | mobilité | Bond et plongée | 26 | 11 | −15 | 3 | dégâts normaux, aucun contrôle garanti | — | Bond aérien court puis plongée sur la zone ciblée : onde de pression à l'impact, sans contrôle garanti sur les boss. |
| NM-dragon-06 | Orbe de l'origine | offensive | Noyau de souveraineté | 22 | 9 | — | 5 | dégâts normaux, aucun contrôle garanti | — | Condense de la souveraineté en un noyau lancé qui traverse les ennemis et éclate en bout de course ; plus la part condensée est grande (jusqu'à 25), plus il est dense. (Maintien de la touche : à prototyper.) |
| NM-dragon-07 | Trois têtes ancestrales | offensive | Trois souffles simultanés | 26 | 12 | −25 | 6 | dégâts normaux, aucun contrôle garanti | — | Trois têtes de dragons ancestraux apparaissent derrière le joueur et soufflent ensemble trois longs faisceaux. |
| NM-dragon-08 | Ascension du Dragon divin | transformation | Ailes, griffes et queue : vol plané | 26 | 13 | −35 | 8 | dégâts normaux, aucun contrôle garanti | ailes, griffes, queue | Transformation avancée : ailes, griffes et queue. Permet de planer au-dessus de l'eau (zones prévues), sans vol libre illimité. |
| NM-dragon-09 | Rugissement de l'Empereur | offensive | Onde de rugissement à longue portée | 30 | 16 | −15 | 9 | dégâts normaux, aucun contrôle garanti | — | Le rugissement part en une onde destructrice sur une longue distance ; les ennemis touchés voient leur précision réduite. Aucun étourdissement des boss. |
| NM-dragon-U | Apocalypse draconique : Le Dieu parmi les mortels | ultime | Forme hybride, souffle sur une ligne annoncée | — | — | — | 10 | ligne annoncée esquivable, aucune neutralisation | hybride humanoïde-dragon (remplace le corps) | Forme hybride humanoïde-dragon (distincte de l'incarnation) pendant 12 s ; une séquence de domination culmine en un souffle du jugement sur une ligne annoncée. Jauge entièrement consommée. |
| NM-dragon-10 | Incarnation du Dragon divin | transformation | Forme draconique complète | 34 | 50 | −60 | 9 | dégâts normaux, aucun contrôle garanti | dragon complet (remplace le corps) | Forme draconique complète et temporaire, dans les espaces autorisés : déplacement plané, morsure aux coups d'arme, souffle et atterrissage dédiés. |

## Léviathan

| ID | Compétence | Type | Rôle | Mana | Recharge (s) | Ressource | Niveau | Boss | Modèle 3D | Fonctionnement |
|---|---|---|---|---:|---:|---|---:|---|---|---|
| NM-leviathan-01 | Lance des abysses | offensive | Lance perforante qui marque | 14 | 3 | +8 | 1 | dégâts normaux, aucun contrôle garanti | — | Une lance d'os et d'eau noire traverse les ennemis sur une longue distance et marque chacun d'eux. |
| NM-leviathan-02 | Fouet des abysses | offensive | Appendice aller-retour | 18 | 6 | +5 | 1 | dégâts normaux, aucun contrôle garanti | — | Un appendice frappe en ligne puis revient ; toucher une cible marquée renforce le retour. (Orientation pendant la course : à prototyper.) |
| NM-leviathan-03 | Pression des grands fonds | offensive | Compression ciblée | 18 | 5 | −12 | 1 | dégâts normaux, aucun contrôle garanti | — | Compression ciblée dans une petite zone : les ennemis légers sont tassés au sol, les lourds subissent des dégâts sans immobilisation garantie. |
| NM-leviathan-04 | Torrent abyssal | offensive | Jet d'eau sous pression | 22 | 9 | −12 | 2 | dégâts normaux, aucun contrôle garanti | — | Un jet d'eau abyssale sous une pression écrasante part en long faisceau et repousse les ennemis légers. |
| NM-leviathan-05 | Gueule du Léviathan | offensive | Morsure surgissante | 26 | 11 | −14 | 3 | dégâts normaux, aucun contrôle garanti | — | Une tête abyssale émerge sous la cible et mord la zone ; si la cible est marquée, une seconde morsure suit (dégâts réduits). |
| NM-leviathan-06 | Geysers des profondeurs | offensive | Geysers en ligne | 22 | 9 | −14 | 5 | dégâts normaux, aucun contrôle garanti | — | Cinq geysers abyssaux jaillissent l'un après l'autre en ligne vers la cible. |
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
