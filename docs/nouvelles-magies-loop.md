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
- 68 distinctes ;
- 39 proximités de thème ;
- 25 chevauchements partiels, dont 8 ont entraîné une correction dans le code le 25/11 ;
- 0 doublon.

Le LOOP est documenté ligne par ligne. Sa validation finale revient à l'utilisateur.

Les identifiants sont stables : `NM-<famille>-01` à `-10` pour les compétences, `-U` pour l'ultime.

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
| NM-orochi-02 | Balayage des cous sinueux | Vent — Mur des bourrasques ; Dragon — Queue du souverain (interne) | distincte | Deux arcs opposés : le premier déplace, le second punit les déséquilibrés. |
| NM-orochi-03 | Regard des huit | Malédiction — Regard de la condamnation ; Possession — Regard de l'Ancien (interne) | chevauchement partiel | Une cible, bonus sur la prochaine compétence Orochi. Le Regard de l'Ancien agit en zone (vulnérabilité et esquive). |
| NM-orochi-04 | Garde des cous entrelacés | Terre — Carapace du titan ; gardes internes | proximité de thème | Garde mobile à 4 charges frontales, contre-coup à la rupture. |
| NM-orochi-05 | Morsure en relais | Poison — Hydre toxique | distincte | Trois morsures ordonnées ; une frappe manquée rompt le relais. |
| NM-orochi-06 | Souffle des chefs | Poison — Hydre toxique (crachat) ; Dragon — Souffle du jugement céleste (interne) | chevauchement partiel | Quatre souffles physiques successifs (pression, chaleur, venin, onde), pas un poison élémentaire. Ordre fixe en attendant la sélection libre. |
| NM-orochi-07 | Anneau des huit cous | Métal — Arsenal flottant | chevauchement partiel | Ce sont des cous du même corps, pas des lames. La garde draine la Coordination à chaque seconde et s'arrête à zéro. |
| NM-orochi-08 | Frappe convergente | Gravité — Écrasement | distincte | Convergence sur un point : zone large, dégâts concentrés au centre. |
| NM-orochi-09 | Rugissement polyphonique | Son — Cri de puissance ; Dragon — Rugissement de l'Empereur (interne) | proximité de thème | Huit ondes autour du joueur, désorientation sauf boss. Le rugissement draconique est frontal et réduit la précision. |
| NM-orochi-10 | Corps du serpent-roi | Poison — Hydre toxique ; Ombre — Avatar de l'ombre | distincte | Transformation : huit cous sur le joueur ; les coups d'arme déclenchent des morsures. |
| NM-orochi-U | Huit Couronnes, une seule gueule | Poison — Apocalypse putride | distincte | Huit frappes annoncées en cercle, puis morsure colossale. |

## 2. Phénix — épique, transformation

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-phenix-01 | Plumes de braise | Vent — Mille plumes | proximité de thème | Plumes plantées qui restent au sol et se rappellent. Mille plumes est une rafale de lames d'air. |
| NM-phenix-02 | Ailes de remontée | Lumière — Ailes de lumière ; Vent — Courant ascendant | proximité de thème | Bond par-dessus un obstacle bas, pas de vol ni de bonus de vitesse. |
| NM-phenix-03 | Cercle de cendres | Feu — Danse des flammes | distincte | Anneau qui marque ; la combustion secondaire se déclenche sur la prochaine attaque Phénix. |
| NM-phenix-04 | Mue ardente | Illusion — Double illusoire ; Possession — Pas du Réceptacle (interne) | chevauchement partiel — **corrigé** | Enveloppe qui éclate seulement au contact ; aucune attraction. |
| NM-phenix-05 | Plongée du plumage | Feu — Météore incandescent | distincte | Plongée sur une cible marquée ; les marques éclatent autour du point d'arrivée. |
| NM-phenix-06 | Cocon de braises | Lumière — Bouclier de pureté | proximité de thème | Le joueur est immobilisé ; forte réduction frontale ; brisé par 3 impacts. |
| NM-phenix-07 | Rappel des cendres | Âmes — Drain d'essence | distincte | Rappel des plumes posées : dégâts sur le trajet, puis recharge de jauge. |
| NM-phenix-08 | Aube incandescente | Feu — Fournaise terrestre ; Feu — Cœur du volcan | chevauchement partiel | Zone à pulsations espacées, renforcée par les plumes déjà posées. |
| NM-phenix-09 | Mue du grand Phénix | Feu — Phénix incandescent ; Dragon — Ascension (interne) | distincte | Transformation : ailes, queue ; les coups d'arme laissent des plumes marquantes. |
| NM-phenix-10 | Renaissance conditionnelle | Âmes — Marche des esprits | distincte | Reconstruction à 30 % : jauge pleine requise, recharge interne de 180 s, inactive en arène et en zones interdites. |
| NM-phenix-U | Seconde Aube | Feu — Soleil dévorant | distincte | Dispersion en cendres, puis trois anneaux. Les cibles marquées prennent plus de dégâts ; la jauge est rendue en partie. |

## 3. Titan — épique, transformation

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-titan-01 | Poing d'inertie | Terre — Poing de pierre | proximité de thème | La puissance vient de l'inertie accumulée en marchant ; aucune pierre. |
| NM-titan-02 | Pas sismique | Gravité — Marche lourde ; Terre — Tremblement profond | proximité de thème | Un seul pas lourd, onde courte ; pas d'effet de marche continue ni de fissure persistante. |
| NM-titan-03 | Ancrage colossal | Gravité — Ancre gravitationnelle | proximité de thème | Le joueur est inébranlable ; les coups reçus alimentent l'inertie ; la mobilité baisse. |
| NM-titan-04 | Charge inexorable | — | distincte | Charge plus forte selon l'élan ; un obstacle la brise et vide la jauge. |
| NM-titan-05 | Saisie du géant | Métal — Main magnétique | distincte | Saisie puis lancer d'un ennemi léger ; coup de paume sur les lourds et les boss. |
| NM-titan-06 | Épaules indomptables | Vent — Mur des bourrasques | proximité de thème | Marche en garde : dévie les petits tirs et repousse les légers ; un coup lourd l'interrompt. |
| NM-titan-07 | Compression musculaire | Son — Mélodie de guerre | distincte | Le prochain coup d'arme gagne une onde d'impact, au prix d'une récupération plus longue. |
| NM-titan-08 | Bond des hauteurs | Dragon — Descente impériale (interne) | chevauchement partiel — **corrigé** | Dégâts proportionnels à l'inertie ; l'atterrissage la recharge. |
| NM-titan-09 | Forme du Titan | Terre — Carapace du titan ; Lave — Titan magmatique ; Terre — Golem ancestral | chevauchement partiel | C'est le corps du joueur qui grandit : aucune armure minérale, aucun golem invoqué. Forme interdite en intérieur. |
| NM-titan-10 | Rupture d'inertie | Gravité — Onde de répulsion | proximité de thème | Libère toute l'inertie : la largeur de l'onde dépend de la jauge, qui retombe à zéro. |
| NM-titan-U | Le Poids du Premier Géant | Terre — Colère du monde | distincte | Trois frappes annoncées ; les boss ne sont pas projetés. |

## 4. Kitsune — épique, transformation

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-kitsune-01 | Queue gardienne | Arsenal — Égide du trône brisé (interne) | chevauchement partiel — **corrigé** | Protège un flanc, alternativement gauche et droit, et pas l'avant. |
| NM-kitsune-02 | Griffe du renard | Démoniaque — Griffe infernale | proximité de thème | Pointe de queue à moyenne portée ; un sceau dépensé ajoute un retour par un angle secondaire. |
| NM-kitsune-03 | Sceau du seuil | Runes — Rune de téléportation ; Espace — Pas dimensionnel | chevauchement partiel | Le sceau est posé d'abord, puis le joueur s'y élance plus tard le long d'un trajet libre : ce n'est pas une téléportation. |
| NM-kitsune-04 | Pas des neuf chemins | Vent — Pas du zéphyr | distincte | Trois pas en zigzag, bloqués par les obstacles. |
| NM-kitsune-05 | Queue entravante | Runes — Rune d'entrave ; Nature — Racines voraces | proximité de thème | Entrave brève par deux queues ; simple ralentissement sur les boss. |
| NM-kitsune-06 | Feu follet-guide | — | distincte | Déporte le point d'émission de la prochaine compétence Kitsune. |
| NM-kitsune-07 | Sceau de permutation | Espace — Pas dimensionnel ; Runes — Rune de téléportation | chevauchement partiel | Échange de positions avec un sceau existant (le sceau prend l'ancienne place du joueur) ; échoue si le point est bloqué. |
| NM-kitsune-08 | Éventail des queues | — | distincte | Trois profils : balayage, piqué ou garde. Cycle en attendant la sélection libre. |
| NM-kitsune-09 | Masque du renard ancien | Illusion — Mirage | distincte | Transformation : sceaux plus durables, suivi de Griffe garanti. Aucune illusion. |
| NM-kitsune-10 | Palais des sceaux | Runes — Champ runique | distincte | Réseau de trois sceaux, trois élans offensifs, puis effondrement. |
| NM-kitsune-U | Les Neuf Portes du Renard | Runes — Jugement runique | proximité de thème | Neuf portes (frappe ou garde), puis convergence. Ordre automatique en attendant le choix. |

## 5. Dix Ombres — épique, transformation

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-dixombres-01 | Appel du premier familier | Lumière — Orbe de révélation | proximité de thème | L'Éclaireur révèle les ennemis et en marque quatre, sans gros dégâts. |
| NM-dixombres-02 | Traque du second familier | Ombre — Nuée d'ombres | distincte | Une frappe unique sur la cible marquée, puis retour ; arrêté par les murs. |
| NM-dixombres-03 | Garde du troisième familier | Âmes — Gardien spectral | chevauchement partiel | Intercepte 3 attaques venant de la direction visée, puis se dissipe. Ne frappe pas et ne suit pas le joueur. |
| NM-dixombres-04 | Bond du quatrième familier | Titan / Dragon — sauts (interne) | proximité de thème | C'est le familier qui bondit, pas le joueur ; refusé si le point n'est pas atteignable. |
| NM-dixombres-05 | Lien des deux ombres | Sang — Liens du pacte | distincte | Quand un familier frappe, l'autre se replace ; aucun dégât dupliqué. |
| NM-dixombres-06 | Formation de chasse | — | distincte | Trois angles ; attaque déclenchée par le prochain coup d'arme du joueur. |
| NM-dixombres-07 | Rappel au creux | — | distincte | Rappel général : interruption des actions, prochaine invocation à −50 % de mana. |
| NM-dixombres-08 | Fusion des silhouettes | Nécromancie — Invocation de squelette | distincte | Créature composite ; les deux familiers fusionnés sont indisponibles séparément. |
| NM-dixombres-09 | Manifestation des dix | Ombre — Avatar de l'ombre | distincte | Dix présences brèves et deux ordres rapides ; elles ne combattent pas toutes. |
| NM-dixombres-10 | Maître des ombres incarnées | Ombre — Avatar de l'ombre | proximité de thème | Transformation : manteau d'ombre ; les familiers suivent les coups d'arme. |
| NM-dixombres-U | Le Dixième Serment | Nécromancie — Légion des morts ; Âmes — Gardien spectral | chevauchement partiel | Dix rôles successifs puis convergence ; ce ne sont pas des morts-vivants. Tous les familiers passent 60 s en récupération. |

## 6. Arsenal du Roi déchu — épique

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-arsenal-01 | Décret de la Lame jurée | Métal — Lame reconstituée ; Métal — Arsenal flottant | proximité de thème | Une seule frappe en arc d'une relique, qui disparaît ; rien n'orbite. |
| NM-arsenal-02 | Sceptre de commandement | Runes — Cercle de protection | distincte | Zone de commandement : stabilité et force du joueur. |
| NM-arsenal-03 | Égide du trône brisé | Kitsune — Queue gardienne (interne) | chevauchement partiel — **corrigé** | Bloc frontal et arrêt des projectiles. |
| NM-arsenal-04 | Chaînes du régent | Métal — Prison des chaînes ; Malédiction — Chaînes du destin | proximité de thème | La chaîne tire une cible légère vers le joueur ; aucun lien entre ennemis. |
| NM-arsenal-05 | Bannière des légions perdues | Son — Mélodie de guerre | distincte | Renfort de zone qui peut être abattu ; aucun soldat. |
| NM-arsenal-06 | Clé des salles scellées | — | distincte | Expose une défense (vulnérabilité). L'ouverture de verrous reste à relier, aucun verrou magique n'existant dans le monde actuel. |
| NM-arsenal-07 | Couronne d'autorité | — | distincte | Décrets assaut, garde ou poursuite, qui modifient les reliques. |
| NM-arsenal-08 | Marteau du jugement royal | Métal — Jugement de l'arsenal | proximité de thème | Coup lent et annoncé, bonus contre les gardes et les ennemis lourds. |
| NM-arsenal-09 | Ordre de succession | — | distincte | La chaîne attire, puis le marteau frappe le point d'arrivée. |
| NM-arsenal-10 | Salle du trône éphémère | Runes — Champ runique | distincte | Dans l'arène, les reliques se rechargent deux fois plus vite ; aucun contrôle des ennemis. |
| NM-arsenal-U | Testament du Roi déchu | Métal — Jugement de l'arsenal | chevauchement partiel | Séquence ouverture, condamnation, jugement, modulée par le décret actif. Il ne s'agit pas d'une pluie d'armes métalliques. |

## 7. Architecte des structures — épique

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-architecte-01 | Planche de franchissement | Nature — Liane funambule | proximité de thème | Passerelle réelle qui rend l'eau étroite praticable (collision réelle). |
| NM-architecte-02 | Pilier d'appui | Terre — Pilier ascendant | chevauchement partiel | Couvert à résistance qui arrête les tirs, sans projeter personne ni toucher au terrain. |
| NM-architecte-03 | Piège à ressort | Runes — Rune d'entrave | distincte | Mécanisme déclenché au passage ; léger déséquilibre seulement sur les boss. |
| NM-architecte-04 | Rempart modulaire | Terre — Rempart tellurique ; Cristal — Mur de cristal ; Runes — Mur runique | chevauchement partiel | Ouvrage orienté, à points de résistance et usé par les coups lourds. Six ouvrages au plus en même temps. |
| NM-architecte-05 | Treuil de rappel | — | distincte | Se hisser vers un ancrage dégagé, ou tirer un ennemi léger. |
| NM-architecte-06 | Plateforme à bascule | — | distincte | Lanceur pivotant déclenché en marchant dessus. |
| NM-architecte-07 | Tourelle à impulsion | — | distincte | Six tirs cinétiques, ligne de vue requise ; ne peut pas achever un ennemi. |
| NM-architecte-08 | Pont de liaison | — | distincte | Pont long à charge limitée : les ennemis lourds le font céder. |
| NM-architecte-09 | Atelier instantané | — | distincte | Répare la durabilité hors combat ; ne soigne pas. |
| NM-architecte-10 | Maître bâtisseur | — | distincte | Plans avancés : piège en chaîne, double passerelle, rempart à angle. |
| NM-architecte-U | Citadelle en un souffle | Terre — Colère du monde | distincte | Petite citadelle destructible (remparts, passerelle, lanceur). |

## 8. Manipulation de l'Énergie — épique

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-energie-01 | Impulsion énergétique | Gravité — Onde de répulsion | proximité de thème | Énergie neutre ; la force dépend de la réserve dépensée. |
| NM-energie-02 | Sphère de condensation | Néant — Orbe du néant ; Dragon — Orbe de l'origine (interne) | chevauchement partiel — **corrigé** | Sphère lente qui s'arrête au premier contact et n'aspire personne. |
| NM-energie-03 | Rayon concentré | Lumière — Rayon purificateur ; Néant — Rayon d'absence | chevauchement partiel | Énergie neutre : précise et forte à l'arrêt, dispersée en mouvement ; aucun aveuglement. |
| NM-energie-04 | Onde de libération | Son — Onde de choc | proximité de thème | Toute la réserve est libérée : la taille dépend de la jauge ; aucun vol de ressource. |
| NM-energie-05 | Pas énergétique | Foudre — Pas de l'éclair | proximité de thème | Propulsion arrêtée par les obstacles, payée en réserve. |
| NM-energie-06 | Renforcement du noyau | Temps — Accélération personnelle | proximité de thème | Vitesse et stabilité, sans bonus aux dégâts des magies. |
| NM-energie-07 | Orbes orbitaux | Métal — Arsenal flottant | proximité de thème | Noyaux fixes tirés sur commande ; ils ne frappent jamais seuls. |
| NM-energie-08 | Compression absolue | — | distincte | Impact ponctuel très dense sur une seule cible. |
| NM-energie-09 | Champ de maîtrise | Temps — Bulle temporelle | distincte | Prolonge les compétences d'énergie par une forme modulée ; ni ralentissement ni blocage. |
| NM-energie-10 | Déferlement énergétique | Eau — Marée déferlante | proximité de thème | Vagues sur des axes alternés, payées une par une et interrompues quand la réserve est vide. |
| NM-energie-U | Cataclysme originel | Astrale — Tempête d'étoiles | distincte | Noyau suspendu, libération focalisée ou radiale, charge interruptible. |

## 9. Art de la Découpe — épique

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-decoupe-01 | Trait de rupture | Vent — Lame aérienne ; Espace — Déchirure dimensionnelle | distincte | Ligne tracée puis déclenchée après un délai ; aucun projectile. |
| NM-decoupe-02 | Coupe adaptative | — | distincte | Ligne adaptée à l'armure : plus efficace sur les lourds et les cibles marquées. |
| NM-decoupe-03 | Double incision | — | distincte | Deux lignes croisées ; la seconde est renforcée si la première a touché. |
| NM-decoupe-04 | Arc de section | Cristal — Lame de cristal | proximité de thème | Arc de rupture devant le joueur, non projeté. |
| NM-decoupe-05 | Quadrillage de rupture | — | distincte | Quatre lignes au sol ; il est possible d'en sortir avant le déclenchement. |
| NM-decoupe-06 | Incision rapprochée | — | distincte | Geste à bout portant peu coûteux qui interrompt une attaque ordinaire. |
| NM-decoupe-07 | Pluie de sections | Vent — Mille plumes | proximité de thème | Trois coupes successives sur trois cibles, sans lames lancées. |
| NM-decoupe-08 | Section circulaire | — | distincte | Cercle qui se ferme : fort en périphérie, faible au centre. |
| NM-decoupe-09 | Coupe différée | Temps — Marque temporelle | proximité de thème | Marque déclenchée par le joueur ou au bout de 6 s. |
| NM-decoupe-10 | Sentence de section | — | distincte | Toute la précision sur une ligne ; la jauge revient à zéro. |
| NM-decoupe-U | Verdict des mille sections | Espace — Fracture de l'espace | distincte | Seize lignes annoncées en cascade, toutes esquivables ; aucun découpage automatique. |

## 10. Sceau de Possession — épique (non transformationnelle)

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-possession-01 | Marque du réceptacle | Sang — Marque de sang | proximité de thème | Le sceau est sur le joueur ; la marque renforce les attaques du Sceau. |
| NM-possession-02 | Regard de l'Ancien | Orochi — Regard des huit (interne) | chevauchement partiel | Effet de zone : vulnérabilité et esquive accrue ; aucun bonus réservé à une compétence. |
| NM-possession-03 | Main du Possesseur | Terre — Poing de pierre | proximité de thème | Frappe ancestrale à courte portée, récupération marquée. |
| NM-possession-04 | Décharge du Sceau | — | distincte | Décharge frontale, puissance selon la synchronisation dépensée. |
| NM-possession-05 | Pas du Réceptacle | Ombre — Marche des ombres ; Phénix — Mue ardente (interne) | proximité de thème | L'empreinte éclate toute seule au bout de 0,7 s. La Mue n'éclate qu'au contact. |
| NM-possession-06 | Résistance du Réceptacle | — | distincte | Un coup frontal fortement réduit, plus une brève réduction des dégâts. |
| NM-possession-07 | Héritage de la Conscience | Feu — Fourreau solaire | proximité de thème | L'arme garde sa gestuelle et reçoit un impact ancestral de zone. |
| NM-possession-08 | Résonance des Deux Esprits | Illusion — Double illusoire | distincte | Une seule répétition retardée de la prochaine frappe ; aucun clone. |
| NM-possession-09 | Manifestation partielle | Démoniaque — Pacte de puissance | distincte | Premier palier ancestral ; cornes, yeux rouges, marques en 3D. |
| NM-possession-10 | Coexistence absolue | Âmes — Possession partielle ; Illusion / Sang / Malédiction — Marionnettes | distincte | Le joueur coexiste avec une conscience ancestrale ; aucun ennemi n'est contrôlé. |
| NM-possession-U | Éveil du Premier Possesseur | — | distincte | Fusion totale puis frappe finale ; les styles d'arme restent distincts. |

## 11. Dragon divin — légendaire

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-dragon-01 | Écailles de l'Empereur | Terre — Carapace du titan ; Lave — Croûte volcanique | proximité de thème | Écailles orientées vers un angle, qui se fissurent par charges. |
| NM-dragon-02 | Griffes du Dragon céleste | Démoniaque — Griffe infernale | distincte | Combo en trois temps ; la troisième frappe est renforcée si les deux premières ont touché. |
| NM-dragon-03 | Souffle du jugement céleste | Lumière — Jugement divin ; Orochi — Souffle des chefs (interne) | proximité de thème | Souffle canalisé et balayable ; le joueur est exposé sur les flancs. |
| NM-dragon-04 | Queue du souverain | Orochi — Balayage (interne) | distincte | Balayage arrière et latéral contre ceux qui contournent. |
| NM-dragon-05 | Descente impériale | Titan — Bond des hauteurs (interne) | chevauchement partiel — **corrigé** | Onde de pression extérieure à l'impact. |
| NM-dragon-06 | Orbe de l'origine | Énergie — Sphère (interne) ; orbes historiques | chevauchement partiel — **corrigé** | Traverse les ennemis, éclate en bout de course. |
| NM-dragon-07 | Couronne des dragons ancestraux | — | distincte | Trois têtes qui répondent seulement aux compétences draconiques. |
| NM-dragon-08 | Ascension du Dragon divin | Phénix — Mue du grand Phénix (interne) ; Lumière — Ailes | proximité de thème | Vol plané au-dessus de l'eau (franchissement réel), sans vol libre. |
| NM-dragon-09 | Rugissement de l'Empereur | Orochi — Rugissement polyphonique (interne) | proximité de thème | Frontal ; réduit la précision (aveuglement bref), pas d'étourdissement des boss. |
| NM-dragon-10 | Incarnation du Dragon divin | — | distincte | Forme draconique complète, interdite en intérieur. |
| NM-dragon-U | Apocalypse draconique : Le Dieu parmi les mortels | Lumière — Jugement final | distincte | Forme hybride distincte de l'incarnation ; souffle sur une ligne annoncée ; jauge vidée. |

## 12. Léviathan — légendaire

| ID | Compétence | Historique / interne contrôlé | Verdict | Différence préservée |
|---|---|---|---|---|
| NM-leviathan-01 | Marque des profondeurs | Poison — Marque de corruption | proximité de thème | Marque consommable par les techniques du Léviathan ; aucune paralysie. |
| NM-leviathan-02 | Fouet des abysses | Eau — Fouet des marées | proximité de thème | Appendice en aller-retour ; le retour est renforcé après une cible marquée. |
| NM-leviathan-03 | Pression des grands fonds | Eau — Aiguilles de pression ; Gravité — Écrasement | chevauchement partiel | Compression ponctuelle : les légers sont tassés, les lourds ne sont pas immobilisés ; aucune attraction. |
| NM-leviathan-04 | Courant de dérive | Eau — Manteau des courants | distincte | Courant latéral qui déplace les légers et dévie les tirs. |
| NM-leviathan-05 | Gueule du Léviathan | Eau — Colonne du Léviathan ; Lave — Gueule du volcan | chevauchement partiel — **corrigé** | Morsure sans projection, deuxième morsure si la cible est marquée. |
| NM-leviathan-06 | Noyade silencieuse | Temps — Ondes de ralentissement | chevauchement partiel | Le ralentissement grandit avec le temps passé dans le champ ; aucune suffocation. |
| NM-leviathan-07 | Mâchoires des profondeurs | — | distincte | Trois mâchoires sur des cibles marquées puis proches, une frappe chacune. |
| NM-leviathan-08 | Éveil de l'hôte abyssal | — | distincte | Manifestation avancée (plaques, nageoires, appendices) en 3D. |
| NM-leviathan-09 | Effondrement abyssal | Gravité — Puits gravitationnel ; Eau — Vortex des profondeurs | chevauchement partiel | Attraction des légers seulement, puis effondrement. Les boss ne sont pas déplacés (dossier). |
| NM-leviathan-10 | Incarnation du Léviathan | — | distincte | Hôte complet ; appendices liés aux coups, chacun consomme la jauge. |
| NM-leviathan-U | Fin des profondeurs : L'Éveil du Dévoreur | Eau — Jugement de l'océan | distincte | Ombre colossale, cinq mâchoires annoncées, explosion finale ; personne n'est avalé. |

## Comptage de contrôle

- 132 lignes, 132 verdicts.
- Répartition :
  - distinctes : 68 ;
  - proximités de thème : 39 ;
  - chevauchements partiels : 25, dont 8 corrigés en code (Mue ardente, Gueule du Léviathan, Queue gardienne, Égide, Bond des hauteurs, Descente impériale, Orbe de l'origine, Sphère de condensation) ;
  - doublons : 0.
- Les 270 compétences historiques n'ont pas été modifiées.
