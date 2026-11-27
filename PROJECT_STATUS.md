# PROJECT_STATUS.md — État du projet (27/11/2026)

Légende : **Testé (simulation)** = vérifié par script dans un navigateur automatisé, sans appareil réel. **Non vérifié sur appareil réel** = jamais essayé sur l'iPhone ou la manette PS5 du créateur.

## Version de référence
Jeu web 3D `jeu3d.html` (Three.js + logique JS de `js/`). Dernier commit de code : voir `git log`. Branche : `main`.

## Terminé et testé (simulation uniquement)
- 12 nouvelles familles de magie (132 compétences) : 132/132 lancées sans erreur dans le test automatisé ; mécaniques de jauges et formes testées.
- Transformations 3D (13 formes, 2 ultimes) : rendu vérifié par captures dans le navigateur automatisé.
- Écran des sorts (équipés / disponibles) et mode essai `?essai-magies` : testés ; la sauvegarde reste intacte en mode essai.
- Caméra épaule, visée L2, verrouillage R3, course : testés avec une manette simulée.
- Diagnostic manette sur l'écran titre : testé avec une manette simulée.

## Fait mais non vérifié sur appareil réel
- Sensibilité de la caméra à la manette PS5 (à juger en main).
- Combinaisons L1 + ← / → sur une vraie manette.
- Détection de la manette sur iPhone depuis l'icône d'écran d'accueil (correctif D-006).
- Performances sur iPhone.

## En cours / en attente
- Équilibrage des sorts à distance (à régler en jouant).
- Grande refonte annoncée par le créateur (moteur Unreal Engine 5 en parallèle) : non spécifiée.
- Mission VEL-0001 (audit d'environnement) : faite côté environnement de Claude (`echanges/rapports/VEL-0001.md`) ; à refaire sur la machine du créateur.
- Liaison ChatGPT ↔ Claude : mise en place via `echanges/` (D-009).

## Bugs connus
- Test « R2 sort 1 : temps de recharge » faux dans le script de test ; défaut du test, ancien, non lié à une régression connue.

## Dépendances bloquantes
- Unreal Engine 5 absent de l'environnement de Claude ; une machine du créateur avec Unreal est nécessaire.

## Prochaine étape recommandée
1. Le créateur décide de la visibilité du dépôt (D-010).
2. ChatGPT émet la première fiche de mission dans `echanges/missions/`.
3. Mission VEL-0001 sur la machine du créateur.
