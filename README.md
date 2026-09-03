# up-gutenberg-bindings-interface

## [1.3.1.0] - 2026-09-01
- Les sources de bindings sont désormais déclarées côté PHP et exposées via une route REST `up-gutenberg-bindings-interface/v1/sources`.
- Nouveau filtre `up_gutenberg_bindings_interface_sources` permettant d'ajouter/modifier les sources (et leurs champs `args`) depuis le PHP.
- Le sélecteur de source et les champs de configuration sont chargés dynamiquement depuis l'API REST (reflète le PHP en temps réel).
- Généricisation des champs d'args : chaque source peut déclarer ses champs (`key`, `label`, `type`) côté PHP.

## [1.3.0] - 2026-09-01
- Ajout des sources de bindings `up-crean-cpt/archive-title` et `up-crean-cpt/archive-description` dans le sélecteur (titre et description d'archive du plugin up-crean-cpt, détection automatique du CPT courant).

## [1.2.0] - 2025-03-31
- Ajout de la fonctionnalité de verrouillage de contenu (contentLock: contentOnly) pour les blocs Cover, Group, Columns et Column.
- Nouveau panneau "Verrouillage" permettant d'empêcher la suppression ou le déplacement du bloc tout en autorisant la modification de son contenu.

## [1.1] - 2025-10-07
- Remplace le libellé du champ par « Nom du block ».
- Standardise les liaisons Post Meta sur `args.key` (au lieu d’utiliser `content/url/text/title`).
- Normalise automatiquement les bindings Post Meta existants lors du chargement (migration douce vers `args.key`).

## [1.0.0] - 2025-10-07
- Version initiale avec panneau de configuration pour bindings (Pattern Overrides, Post Meta, Lorem Ipsum, Lorem Picsum) et placeholder natif sur les blocs RichText.
