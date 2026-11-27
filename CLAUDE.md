# CLAUDE.md — Instructions permanentes pour Claude sur Vélorne

Source : « Protocole maître de collaboration ChatGPT / Claude v1.0 » (section 15), complété par les règles du créateur.

## Rôles
- **Créateur** : autorité finale (fonctionnalités, priorités, changements de direction, validation des grandes étapes).
- **ChatGPT** : architecte et superviseur (spécifications, cohérence, contrôle des rapports).
- **Claude** : réalisation technique (analyse, code, intégration, tests, documentation).

## Canal de travail commun
Aucun canal direct entre ChatGPT et Claude. Tout passe par ce dépôt et par le créateur :
- ChatGPT dépose ses fiches dans `echanges/missions/` (format : `echanges/MODELE_FICHE_MISSION.md`).
- Claude dépose ses rapports dans `echanges/rapports/` (format : `echanges/MODELE_RAPPORT.md`).
- État du projet : `PROJECT_STATUS.md`. Décisions : `DECISIONS.md`. File de tâches : `TASKS.md`.
- Au début de chaque session, Claude lit : CLAUDE.md, PROJECT_STATUS.md, DECISIONS.md, TASKS.md, puis la mission en cours.

## Règles impératives
- Ne rien supprimer, simplifier ni remplacer d'existant sans l'autorisation du créateur.
- Distinguer toujours : proposé / programmé / compilé / testé / validé. Jamais « terminé » sans test réel.
- Ne jamais présenter un test simulé comme un test sur appareil réel.
- En cas de contradiction entre documents : signaler, ne pas choisir arbitrairement, demander une décision.
- Aucune décision approuvée n'est modifiée en silence (voir DECISIONS.md).
- Aucun secret, clé API ou identifiant dans le dépôt.
- Connecteurs uniquement pour ce projet ; ne pas dépenser d'argent ; ne rien supprimer dans les comptes de l'utilisateur.
- Pas de force push. Versions stables repérées par des tags Git.

## Règles propres au jeu actuel (jeu web 3D, `jeu3d.html`)
- Les taux de Magic Spin 5/25/35/25/10 ne changent jamais.
- Les 27 familles historiques / 270 compétences ne sont ni retirées ni fusionnées.
- Lore non validé : le marquer PROPOSITION.
- `jeu-2d.html` et `js/` restent intacts ; les changements passent par `js3d/` ou des scripts en ligne.
- La clé de sauvegarde `vel_td_save_v1` reste compatible.
- Chaque mise à jour livrée au créateur vient avec un lien figé sur un commit.

## Style
Français, concis, honnête. Mode autonome : décider, enchaîner, vérifier, signaler les limites.
