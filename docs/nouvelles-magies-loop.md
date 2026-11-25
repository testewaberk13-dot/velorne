# Vélorne — Rapport LOOP des 12 nouvelles magies (132 compétences)

**Date :** 25/11. **Méthode :** boucle itérative analyser → détecter les incohérences → corriger → vérifier à nouveau.

**Base de comparaison.** Le catalogue historique des 27 familles et 270 compétences n'est pas modifié. Les noms et descriptions ont été relus dans le code du jeu (`js/mf_*.js`, `GRIMOIRE.feu` dans `js/magic2.js`). Chaque nouvelle compétence est aussi comparée aux 131 autres nouvelles compétences (contrôle interne).

**Critères de comparaison** (§2 du dossier) : fonctionnement, boucle de jeu, condition d'activation, résultat tactique et interactions. Le nom ou l'apparence seuls ne suffisent pas.

**Verdicts possibles :**
- **distincte** : aucune compétence comparable.
- **proximité de thème** : même imagerie, mais une mécanique différente.
- **chevauchement partiel** : une partie du fonctionnement se recoupe ; la différence est préservée ou a été corrigée.
- **doublon** : aucun doublon retenu.

Seules les nouvelles compétences ont été modifiées.

**Bilan :** 132 verdicts sur 132.
- 53 distinctes ;
- 43 proximités de thème ;
- 36 chevauchements partiels, dont 8 ont entraîné une correction dans le code le 25/11 (chiffres après la refonte du soir) ;
- 0 doublon.

Le LOOP est documenté ligne par ligne. Sa validation finale revient à l'utilisateur.

Les identifiants sont stables : `NM-<famille>-01` à `-10` pour les compétences, `-U` pour l'ultime.

## Refonte du 25/11 (soir) — plus d'attaques à distance

**Demande de l'utilisateur :** moins de renforcements, de passifs, de pas et d'esquives ; davantage d'attaques destructrices à portée (épées lancées, faisceaux d'énergie).

**Ce qui a été fait :**
- **56 compétences** remplacées ou rallongées, dans le fichier `js3d/nm_ranged.js`.
- Les transformations, les ultimes et les mécaniques signatures (marques, sceaux, plumes, inertie, décrets, ouvrages, réserve, paliers) sont gardés.
- Les anciennes versions restent écrites dans `nm_fams1.js` et `nm_fams2.js`, comme historique.

**LOOP refait sur les compétences changées** (lignes marquées *refonte 25/11* dans les tableaux).
- Les attaques à distance recoupent davantage le catalogue historique (lances, pluies, faisceaux).
- Pour chacune, la différence tient à la mécanique propre de la famille : marque, ressource, palier, décret, retour, perforation ou effet secondaire.
- Aucun doublon.

**Nouveau comptage :** distincte : 53, chevauchement partiel : 36, proximité de thème : 43 (sur 132).

## Corrections effectuées pendant le LOOP

1. **Mue ardente** (`NM-phenix-04`) chevauchait **Illusion — Double illusoire**, un leurre qui explose à la fin.
   - Correction : l'enveloppe n'explose plus au bout d'un délai.
   - Elle éclate seulement si un ennemi la touche ; sinon elle s'effrite.
   - Elle n'attire ni ne contrôle personne.
2. **Gueule du Léviathan** (`NM-leviathan-05`) chevauchait **Eau — Colonne du Léviathan**, une colonne d'eau qui projette la cible.
   - Correction : la morsure ne projette plus (aucun recul).
   - Elle consomme la marque pour une seconde morsure.
3. **Queue gardienne** (`NM-kitsune-01`) et **Égide du trône brisé** (`NM-arsenal-03`) étaient presque identiques : un seul blocage frontal chacune.
   - Correction : la Queue protège un flanc, alternativement gauche puis droit.
   - L'Égide reste frontale et arrête aussi les projectiles.
4. **Bond des hauteurs** (`NM-titan-08`) et **Descente impériale** (`NM-dragon-05`) étaient deux sauts à atterrissage télégraphié.
   - Correction pour le Titan : les dégâts dépendent de l'inertie et l'atterrissage la recharge (+20).
   - Correction pour le Dragon : l'impact crée une onde de pression extérieure (anneau de 110 px qui repousse les ennemis légers).
5. **Orbe de l'origine** (`NM-dragon-06`) et **Sphère de condensation** (`NM-energie-02`) étaient deux orbes lents chargés par la jauge.
   - Correction : l'Orbe draconique traverse les ennemis et éclate en bout de course.
   - La Sphère s'arrête au premier contact.

Les autres chevauchements partiels étaient déjà distingués par le dossier lui-même ; la différence est appliquée dans le code et notée ci-dessous.

## 1. Yamata no Orochi — épique, transformation

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-orochi-01 | Morsure du premier chef | Lave — Gueule du volcan ; Poison — Hydre toxique | distincte | Morsure courte d'une tête du même corps, suivi si une autre tête a marqué. |
| NM-orochi-02 | Crachat des huit gueules *(refonte 25/11)* | Poison — Hydre toxique ; Feu — Pluie de flammes | chevauchement partiel | Huit jets simultanés en éventail venant des huit têtes, poison ; l'Hydre est une invocation qui crache. |
| NM-orochi-03 | Têtes lancées *(refonte 25/11)* | Ombre — Nuée d'ombres | distincte | Trois têtes chercheuses perforantes qui marquent pour la Morsure. |
| NM-orochi-04 | Garde des cous entrelacés | Terre — Carapace du titan ; gardes internes | proximité de thème | Garde mobile à 4 charges frontales, contre-coup à la rupture. |
| NM-orochi-05 | Morsure en relais *(refonte 25/11)* | Poison — Hydre toxique | distincte | Trois morsures ordonnées à distance (300) ; rompue si la cible sort de portée. |
| NM-orochi-06 | Souffle des chefs *(refonte 25/11)* | Feu — Lance ardente ; Dragon — Souffle du jugement céleste (interne) | proximité de thème | Quatre faisceaux courts successifs aux effets différents ; le souffle draconique est un seul faisceau canalisé et balayable. |
| NM-orochi-07 | Déluge de crocs *(refonte 25/11)* | Vent — Mille plumes ; Arsenal — Pluie d'épées royales (interne) | proximité de thème | Pluie de crocs (dégâts physiques) ; la pluie royale est plus large et dépend du décret. |
| NM-orochi-08 | Frappe convergente | Gravité — Écrasement | distincte | Convergence sur un point : zone large, dégâts concentrés au centre. |
| NM-orochi-09 | Rugissement-canon *(refonte 25/11)* | Son — Onde de choc ; Dragon — Rugissement de l'Empereur (interne) | chevauchement partiel | Désorientation des ennemis ordinaires et vulnérabilité des boss ; le rugissement draconique réduit la précision. |
| NM-orochi-10 | Corps du serpent-roi | Poison — Hydre toxique ; Ombre — Avatar de l'ombre | distincte | Transformation : huit cous sur le joueur ; les coups d'arme déclenchent des morsures. |
| NM-orochi-U | Huit Couronnes, une seule gueule | Poison — Apocalypse putride | distincte | Huit frappes annoncées en cercle, puis morsure colossale. |

## 2. Phénix — épique, transformation

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-phenix-01 | Plumes de braise | Vent — Mille plumes | proximité de thème | Plumes plantées qui restent au sol et se rappellent. Mille plumes est une rafale de lames d'air. |
| NM-phenix-02 | Javelot solaire *(refonte 25/11)* | Feu — Lance ardente | chevauchement partiel | Perfore tout, explose en bout de course et laisse trois plumes (rappel, renfort de l'Aube). |
| NM-phenix-03 | Tempête de plumes *(refonte 25/11)* | Vent — Mille plumes | chevauchement partiel | Douze plumes chercheuses successives qui marquent pour la combustion ; Mille plumes est une rafale droite. |
| NM-phenix-04 | Oiseau de feu *(refonte 25/11)* | Feu — Phénix incandescent | chevauchement partiel | Projectile d'oiseau perforant qui explose ; pas une invocation qui reste sur le terrain. |
| NM-phenix-05 | Plongée du plumage | Feu — Météore incandescent | distincte | Plongée sur une cible marquée ; les marques éclatent autour du point d'arrivée. |
| NM-phenix-06 | Pluie de braises *(refonte 25/11)* | Feu — Pluie de flammes | chevauchement partiel | Pluie qui embrase les cibles marquées par le Phénix (mécanique de marque). |
| NM-phenix-07 | Rappel des cendres | Âmes — Drain d'essence | distincte | Rappel des plumes posées : dégâts sur le trajet, puis recharge de jauge. |
| NM-phenix-08 | Aube incandescente | Feu — Fournaise terrestre ; Feu — Cœur du volcan | chevauchement partiel | Zone à pulsations espacées, renforcée par les plumes déjà posées. |
| NM-phenix-09 | Mue du grand Phénix | Feu — Phénix incandescent ; Dragon — Ascension (interne) | distincte | Transformation : ailes, queue ; les coups d'arme laissent des plumes marquantes. |
| NM-phenix-10 | Renaissance conditionnelle | Âmes — Marche des esprits | distincte | Reconstruction à 30 % : jauge pleine requise, recharge interne de 180 s, inactive en arène et en zones interdites. |
| NM-phenix-U | Seconde Aube | Feu — Soleil dévorant | distincte | Dispersion en cendres, puis trois anneaux. Les cibles marquées prennent plus de dégâts ; la jauge est rendue en partie. |

## 3. Titan — épique, transformation

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-titan-01 | Poing d'inertie | Terre — Poing de pierre | proximité de thème | La puissance vient de l'inertie accumulée en marchant ; aucune pierre. |
| NM-titan-02 | Onde de choc frontale *(refonte 25/11)* | Terre — Tremblement profond ; Son — Onde de choc | proximité de thème | Onde physique de masse (pas de terre), renforcée par l'inertie dépensée. |
| NM-titan-03 | Poing projeté *(refonte 25/11)* | Terre — Poing de pierre | proximité de thème | Poing d'air comprimé, puissance selon l'inertie ; aucune pierre. |
| NM-titan-04 | Charge inexorable | — | distincte | Charge plus forte selon l'élan ; un obstacle la brise et vide la jauge. |
| NM-titan-05 | Saisie du géant | Métal — Main magnétique | distincte | Saisie puis lancer d'un ennemi léger ; coup de paume sur les lourds et les boss. |
| NM-titan-06 | Salve de pression *(refonte 25/11)* | Terre — Poing de pierre | proximité de thème | Trois poings de pression successifs. |
| NM-titan-07 | Frappe sonique *(refonte 25/11)* | Son — Onde de choc | proximité de thème | Ligne de choc instantanée très longue (faisceau bref). |
| NM-titan-08 | Bond des hauteurs | Dragon — Descente impériale (interne) | chevauchement partiel — **corrigé** | Dégâts proportionnels à l'inertie ; l'atterrissage la recharge. |
| NM-titan-09 | Forme du Titan | Terre — Carapace du titan ; Lave — Titan magmatique ; Terre — Golem ancestral | chevauchement partiel | C'est le corps du joueur qui grandit : aucune armure minérale, aucun golem invoqué. Forme interdite en intérieur. |
| NM-titan-10 | Rupture d'inertie | Gravité — Onde de répulsion | proximité de thème | Libère toute l'inertie : la largeur de l'onde dépend de la jauge, qui retombe à zéro. |
| NM-titan-U | Le Poids du Premier Géant | Terre — Colère du monde | distincte | Trois frappes annoncées ; les boss ne sont pas projetés. |

## 4. Kitsune — épique, transformation

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-kitsune-01 | Feux follets *(refonte 25/11)* | Lumière — Orbes célestes | proximité de thème | Cinq feux chercheurs ; gagne un sceau-renard. |
| NM-kitsune-02 | Griffe du renard | Démoniaque — Griffe infernale | proximité de thème | Pointe de queue à moyenne portée ; un sceau dépensé ajoute un retour par un angle secondaire. |
| NM-kitsune-03 | Sceau explosif *(refonte 25/11)* | Runes — Rune explosive | chevauchement partiel | Le sceau reste au sol après l'explosion et sert à la permutation. |
| NM-kitsune-04 | Neuf flammes-renards *(refonte 25/11)* | Feu — Pluie de flammes | distincte | Éventail de neuf flammes. |
| NM-kitsune-05 | Queue entravante | Runes — Rune d'entrave ; Nature — Racines voraces | proximité de thème | Entrave brève par deux queues ; simple ralentissement sur les boss. |
| NM-kitsune-06 | Rayon du renard céleste *(refonte 25/11)* | Lumière — Rayon purificateur | proximité de thème | Rayon doré long, sans aveuglement. |
| NM-kitsune-07 | Sceau de permutation *(refonte 25/11)* | Espace — Pas dimensionnel ; Runes — Rune de téléportation | chevauchement partiel | Échange avec un sceau existant et explosion aux deux points. |
| NM-kitsune-08 | Éventail des queues | — | distincte | Trois profils : balayage, piqué ou garde. Cycle en attendant la sélection libre. |
| NM-kitsune-09 | Masque du renard ancien | Illusion — Mirage | distincte | Transformation : sceaux plus durables, suivi de Griffe garanti. Aucune illusion. |
| NM-kitsune-10 | Palais des sceaux | Runes — Champ runique | distincte | Réseau de trois sceaux, trois élans offensifs, puis effondrement. |
| NM-kitsune-U | Les Neuf Portes du Renard | Runes — Jugement runique | proximité de thème | Neuf portes (frappe ou garde), puis convergence. Ordre automatique en attendant le choix. |

## 5. Dix Ombres — épique, transformation

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-dixombres-01 | Meute lancée *(refonte 25/11)* | Nécromancie — Invocation de squelette | distincte | Quatre loups répartis sur des cibles différentes, qui marquent. |
| NM-dixombres-02 | Traque du second familier | Ombre — Nuée d'ombres | distincte | Une frappe unique sur la cible marquée, puis retour ; arrêté par les murs. |
| NM-dixombres-03 | Rapace d'ombre *(refonte 25/11)* | Ombre — Nuée d'ombres | distincte | Plongée perforante en ligne. |
| NM-dixombres-04 | Bond du quatrième familier | Titan / Dragon — sauts (interne) | proximité de thème | C'est le familier qui bondit, pas le joueur ; refusé si le point n'est pas atteignable. |
| NM-dixombres-05 | Lien des deux ombres | Sang — Liens du pacte | distincte | Quand un familier frappe, l'autre se replace ; aucun dégât dupliqué. |
| NM-dixombres-06 | Formation de chasse | — | distincte | Trois angles ; attaque déclenchée par le prochain coup d'arme du joueur. |
| NM-dixombres-07 | Serpent d'ombre *(refonte 25/11)* | Ombre — Lame d'ombre | proximité de thème | Serpent qui file au sol et ralentit. |
| NM-dixombres-08 | Fusion des silhouettes | Nécromancie — Invocation de squelette | distincte | Créature composite ; les deux familiers fusionnés sont indisponibles séparément. |
| NM-dixombres-09 | Essaim des ombres *(refonte 25/11)* | Ombre — Nuée d'ombres | chevauchement partiel | Nuée qui s'abat sur une zone lointaine (pluie), pas autour du joueur. |
| NM-dixombres-10 | Maître des ombres incarnées | Ombre — Avatar de l'ombre | proximité de thème | Transformation : manteau d'ombre ; les familiers suivent les coups d'arme. |
| NM-dixombres-U | Le Dixième Serment | Nécromancie — Légion des morts ; Âmes — Gardien spectral | chevauchement partiel | Dix rôles successifs puis convergence ; ce ne sont pas des morts-vivants. Tous les familiers passent 60 s en récupération. |

## 6. Arsenal du Roi déchu — épique

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-arsenal-01 | Lame jurée projetée *(refonte 25/11)* | Métal — Lame reconstituée ; Métal — Arsenal flottant | chevauchement partiel | Une seule grande lame lancée qui revient ; aucun arsenal en orbite. |
| NM-arsenal-02 | Pluie d'épées royales *(refonte 25/11)* | Métal — Pluie de lames | chevauchement partiel | Épées-reliques, puissance selon le décret actif. |
| NM-arsenal-03 | Égide du trône brisé | Kitsune — Queue gardienne (interne) | chevauchement partiel — **corrigé** | Bloc frontal et arrêt des projectiles. |
| NM-arsenal-04 | Chaînes du régent | Métal — Prison des chaînes ; Malédiction — Chaînes du destin | proximité de thème | La chaîne tire une cible légère vers le joueur ; aucun lien entre ennemis. |
| NM-arsenal-05 | Salve de lances *(refonte 25/11)* | Métal — Lances d'acier | chevauchement partiel | Lances perforantes en salve, liées au décret. |
| NM-arsenal-06 | Clé des salles scellées | — | distincte | Expose une défense (vulnérabilité). L'ouverture de verrous reste à relier, aucun verrou magique n'existant dans le monde actuel. |
| NM-arsenal-07 | Couronne d'autorité *(refonte 25/11)* | Métal — Arsenal flottant | chevauchement partiel | Barrage de huit lames qui change aussi le décret (assaut, garde, poursuite). |
| NM-arsenal-08 | Marteau du jugement royal | Métal — Jugement de l'arsenal | proximité de thème | Coup lent et annoncé, bonus contre les gardes et les ennemis lourds. |
| NM-arsenal-09 | Ordre de succession | — | distincte | La chaîne attire, puis le marteau frappe le point d'arrivée. |
| NM-arsenal-10 | Exécution royale *(refonte 25/11)* | Métal — Jugement de l'arsenal | chevauchement partiel | Une seule épée colossale annoncée sur la cible lointaine. |
| NM-arsenal-U | Testament du Roi déchu | Métal — Jugement de l'arsenal | chevauchement partiel | Séquence ouverture, condamnation, jugement, modulée par le décret actif. Il ne s'agit pas d'une pluie d'armes métalliques. |

## 7. Architecte des structures — épique

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-architecte-01 | Planche de franchissement | Nature — Liane funambule | proximité de thème | Passerelle réelle qui rend l'eau étroite praticable (collision réelle). |
| NM-architecte-02 | Pieu projeté *(refonte 25/11)* | Terre — Pilier ascendant | proximité de thème | Poutre de charpente lancée et perforante ; aucune terre. |
| NM-architecte-03 | Piège à ressort | Runes — Rune d'entrave | distincte | Mécanisme déclenché au passage ; léger déséquilibre seulement sur les boss. |
| NM-architecte-04 | Rempart modulaire | Terre — Rempart tellurique ; Cristal — Mur de cristal ; Runes — Mur runique | chevauchement partiel | Ouvrage orienté, à points de résistance et usé par les coups lourds. Six ouvrages au plus en même temps. |
| NM-architecte-05 | Baliste instantanée *(refonte 25/11)* | — | distincte | Ouvrage qui tire trois carreaux lourds. |
| NM-architecte-06 | Catapulte *(refonte 25/11)* | Terre — Météore de roche | proximité de thème | Bloc assemblé et lancé en cloche, impact annoncé. |
| NM-architecte-07 | Tourelle à impulsion | — | distincte | Six tirs cinétiques, ligne de vue requise ; ne peut pas achever un ennemi. |
| NM-architecte-08 | Rail de poutres *(refonte 25/11)* | Terre — Pics telluriques | proximité de thème | Poutres de construction en ligne. |
| NM-architecte-09 | Effondrement de charpente *(refonte 25/11)* | — | distincte | Charpente assemblée qui s'effondre sur la zone. |
| NM-architecte-10 | Batterie de tourelles *(refonte 25/11)* | — | distincte | Trois tourelles ; ligne de vue requise. |
| NM-architecte-U | Citadelle en un souffle | Terre — Colère du monde | distincte | Petite citadelle destructible (remparts, passerelle, lanceur). |

## 8. Manipulation de l'Énergie — épique

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-energie-01 | Trait d'énergie *(refonte 25/11)* | Foudre — Éclair | proximité de thème | Énergie neutre, trois traits rapides. |
| NM-energie-02 | Sphère de condensation | Néant — Orbe du néant ; Dragon — Orbe de l'origine (interne) | chevauchement partiel — **corrigé** | Sphère lente qui s'arrête au premier contact et n'aspire personne. |
| NM-energie-03 | Rayon concentré | Lumière — Rayon purificateur ; Néant — Rayon d'absence | chevauchement partiel | Énergie neutre : précise et forte à l'arrêt, dispersée en mouvement ; aucun aveuglement. |
| NM-energie-04 | Onde de libération | Son — Onde de choc | proximité de thème | Toute la réserve est libérée : la taille dépend de la jauge ; aucun vol de ressource. |
| NM-energie-05 | Lance d'énergie *(refonte 25/11)* | Lumière — Lance de lumière | proximité de thème | Puissance selon la réserve dépensée. |
| NM-energie-06 | Pluie d'énergie *(refonte 25/11)* | Astrale — Pluie d'étoiles | proximité de thème | Énergie neutre ; aucune étoile. |
| NM-energie-07 | Orbes orbitaux | Métal — Arsenal flottant | proximité de thème | Noyaux fixes tirés sur commande ; ils ne frappent jamais seuls. |
| NM-energie-08 | Compression absolue | — | distincte | Impact ponctuel très dense sur une seule cible. |
| NM-energie-09 | Faisceau prismatique *(refonte 25/11)* | Lumière — Rayon purificateur ; Cristal — Prisme | chevauchement partiel | Trois rayons en éventail d'énergie neutre. |
| NM-energie-10 | Déferlement énergétique | Eau — Marée déferlante | proximité de thème | Vagues sur des axes alternés, payées une par une et interrompues quand la réserve est vide. |
| NM-energie-U | Cataclysme originel | Astrale — Tempête d'étoiles | distincte | Noyau suspendu, libération focalisée ou radiale, charge interruptible. |

## 9. Art de la Découpe — épique

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-decoupe-01 | Trait de rupture | Vent — Lame aérienne ; Espace — Déchirure dimensionnelle | distincte | Ligne tracée puis déclenchée après un délai ; aucun projectile. |
| NM-decoupe-02 | Coupe adaptative | — | distincte | Ligne adaptée à l'armure : plus efficace sur les lourds et les cibles marquées. |
| NM-decoupe-03 | Double incision | — | distincte | Deux lignes croisées ; la seconde est renforcée si la première a touché. |
| NM-decoupe-04 | Croissants de rupture *(refonte 25/11)* | Vent — Lame aérienne | chevauchement partiel | Coupes de rupture qui saignent, perforantes. |
| NM-decoupe-05 | Quadrillage de rupture | — | distincte | Quatre lignes au sol ; il est possible d'en sortir avant le déclenchement. |
| NM-decoupe-06 | Lame volante *(refonte 25/11)* | Vent — Lame aérienne | chevauchement partiel | Un croissant géant perforant, faible coût. |
| NM-decoupe-07 | Pluie de sections | Vent — Mille plumes | proximité de thème | Trois coupes successives sur trois cibles, sans lames lancées. |
| NM-decoupe-08 | Tranchant à distance *(refonte 25/11)* | Espace — Déchirure dimensionnelle | proximité de thème | Ligne de coupe instantanée. |
| NM-decoupe-09 | Coupe différée | Temps — Marque temporelle | proximité de thème | Marque déclenchée par le joueur ou au bout de 6 s. |
| NM-decoupe-10 | Sentence de section | — | distincte | Toute la précision sur une ligne ; la jauge revient à zéro. |
| NM-decoupe-U | Verdict des mille sections | Espace — Fracture de l'espace | distincte | Seize lignes annoncées en cascade, toutes esquivables ; aucun découpage automatique. |

## 10. Sceau de Possession — épique (non transformationnelle)

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-possession-01 | Poing spectral projeté *(refonte 25/11)* | — | distincte | Poing ancestral qui marque ; plus fort selon le palier de possession. |
| NM-possession-02 | Regard foudroyant *(refonte 25/11)* | Foudre — Éclair | proximité de thème | Éclair du regard instantané qui expose (vulnérabilité). |
| NM-possession-03 | Main du Possesseur | Terre — Poing de pierre | proximité de thème | Frappe ancestrale à courte portée, récupération marquée. |
| NM-possession-04 | Décharge du Sceau *(refonte 25/11)* | — | distincte | Long faisceau selon la synchronisation. |
| NM-possession-05 | Salve ancestrale *(refonte 25/11)* | Métal — Arsenal flottant ; Arsenal — Couronne (interne) | proximité de thème | Lames spectrales, renforcées par la possession ; aucun décret. |
| NM-possession-06 | Piliers ancestraux *(refonte 25/11)* | Lumière — Colonnes de lumière | chevauchement partiel | Piliers successifs en ligne vers la cible, renforcés par la possession. |
| NM-possession-07 | Griffes spectrales *(refonte 25/11)* | Démoniaque — Griffe infernale | proximité de thème | Trois griffes projetées qui saignent. |
| NM-possession-08 | Déchaînement *(refonte 25/11)* | — | distincte | Dix frappes spectrales sur une zone lointaine. |
| NM-possession-09 | Manifestation partielle | Démoniaque — Pacte de puissance | distincte | Premier palier ancestral ; cornes, yeux rouges, marques en 3D. |
| NM-possession-10 | Coexistence absolue | Âmes — Possession partielle ; Illusion / Sang / Malédiction — Marionnettes | distincte | Le joueur coexiste avec une conscience ancestrale ; aucun ennemi n'est contrôlé. |
| NM-possession-U | Éveil du Premier Possesseur | — | distincte | Fusion totale puis frappe finale ; les styles d'arme restent distincts. |

## 11. Dragon divin — légendaire

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-dragon-01 | Écailles-lames *(refonte 25/11)* | Métal — Arsenal flottant | proximité de thème | Écailles dorées chercheuses, puissance par palier. |
| NM-dragon-02 | Griffes du Dragon céleste | Démoniaque — Griffe infernale | distincte | Combo en trois temps ; la troisième frappe est renforcée si les deux premières ont touché. |
| NM-dragon-03 | Souffle du jugement céleste *(refonte 25/11)* | Lumière — Jugement divin ; Orochi — Souffle des chefs (interne) | proximité de thème | Souffle canalisé très long et balayable ; le joueur est exposé. |
| NM-dragon-04 | Comète draconique *(refonte 25/11)* | Astrale — Comète | chevauchement partiel | Souveraineté draconique, perforante, explosion finale, puissance par palier. |
| NM-dragon-05 | Descente impériale | Titan — Bond des hauteurs (interne) | chevauchement partiel — **corrigé** | Onde de pression extérieure à l'impact. |
| NM-dragon-06 | Orbe de l'origine | Énergie — Sphère (interne) ; orbes historiques | chevauchement partiel — **corrigé** | Traverse les ennemis, éclate en bout de course. |
| NM-dragon-07 | Trois têtes ancestrales *(refonte 25/11)* | Orochi — Souffle des chefs (interne) | proximité de thème | Trois faisceaux simultanés en éventail ; le Souffle des chefs enchaîne quatre faisceaux aux effets différents. |
| NM-dragon-08 | Ascension du Dragon divin | Phénix — Mue du grand Phénix (interne) ; Lumière — Ailes | proximité de thème | Vol plané au-dessus de l'eau (franchissement réel), sans vol libre. |
| NM-dragon-09 | Rugissement de l'Empereur *(refonte 25/11)* | Son — Cri de puissance ; Orochi — Rugissement-canon (interne) | proximité de thème | Réduit la précision (aveuglement bref) ; Orochi désoriente. |
| NM-dragon-10 | Incarnation du Dragon divin | — | distincte | Forme draconique complète, interdite en intérieur. |
| NM-dragon-U | Apocalypse draconique : Le Dieu parmi les mortels | Lumière — Jugement final | distincte | Forme hybride distincte de l'incarnation ; souffle sur une ligne annoncée ; jauge vidée. |

## 12. Léviathan — légendaire

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-leviathan-01 | Lance des abysses *(refonte 25/11)* | Eau — Lance aquatique | chevauchement partiel | Lance perforante qui marque chaque cible pour les mâchoires. |
| NM-leviathan-02 | Fouet des abysses | Eau — Fouet des marées | proximité de thème | Appendice en aller-retour ; le retour est renforcé après une cible marquée. |
| NM-leviathan-03 | Pression des grands fonds | Eau — Aiguilles de pression ; Gravité — Écrasement | chevauchement partiel | Compression ponctuelle : les légers sont tassés, les lourds ne sont pas immobilisés ; aucune attraction. |
| NM-leviathan-04 | Torrent abyssal *(refonte 25/11)* | Eau — Jet d'eau | chevauchement partiel | Pression abyssale, puissance par palier. |
| NM-leviathan-05 | Gueule du Léviathan | Eau — Colonne du Léviathan ; Lave — Gueule du volcan | chevauchement partiel — **corrigé** | Morsure sans projection, deuxième morsure si la cible est marquée. |
| NM-leviathan-06 | Geysers des profondeurs *(refonte 25/11)* | Eau — Geyser | chevauchement partiel | Cinq geysers successifs en ligne vers la cible. |
| NM-leviathan-07 | Mâchoires des profondeurs | — | distincte | Trois mâchoires sur des cibles marquées puis proches, une frappe chacune. |
| NM-leviathan-08 | Éveil de l'hôte abyssal | — | distincte | Manifestation avancée (plaques, nageoires, appendices) en 3D. |
| NM-leviathan-09 | Effondrement abyssal | Gravité — Puits gravitationnel ; Eau — Vortex des profondeurs | chevauchement partiel | Attraction des légers seulement, puis effondrement. Les boss ne sont pas déplacés (dossier). |
| NM-leviathan-10 | Incarnation du Léviathan | — | distincte | Hôte complet ; appendices liés aux coups, chacun consomme la jauge. |
| NM-leviathan-U | Fin des profondeurs : L'Éveil du Dévoreur | Eau — Jugement de l'océan | distincte | Ombre colossale, cinq mâchoires annoncées, explosion finale ; personne n'est avalé. |

## Comptage de contrôle

- 132 lignes, 132 verdicts.
- Répartition :
  - distinctes : 53 ;
  - proximités de thème : 43 ;
  - chevauchements partiels : 36, dont 8 corrigés en code (Mue ardente, Gueule du Léviathan, Queue gardienne, Égide, Bond des hauteurs, Descente impériale, Orbe de l'origine, Sphère de condensation) ;
  - doublons : 0.
- Les 270 compétences historiques n'ont pas été modifiées.
