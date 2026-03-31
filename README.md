# up-gutenberg-bindings-interface

## [1.2.0] - 2025-03-31
- Ajout de la fonctionnalité de verrouillage de contenu (contentLock: contentOnly) pour les blocs Cover, Group, Columns et Column.
- Nouveau panneau "Verrouillage" permettant d'empêcher la suppression ou le déplacement du bloc tout en autorisant la modification de son contenu.

## [1.1] - 2025-10-07
- Remplace le libellé du champ par « Nom du block ».
- Standardise les liaisons Post Meta sur `args.key` (au lieu d’utiliser `content/url/text/title`).
- Normalise automatiquement les bindings Post Meta existants lors du chargement (migration douce vers `args.key`).

## [1.0.0] - 2025-10-07
- Version initiale avec panneau de configuration pour bindings (Pattern Overrides, Post Meta, Lorem Ipsum, Lorem Picsum) et placeholder natif sur les blocs RichText.
