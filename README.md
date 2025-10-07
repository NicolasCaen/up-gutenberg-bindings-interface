# up-gutenberg-bindings-interface

## [1.1] - 2025-10-07
- Remplace le libellé du champ par « Nom du block ».
- Standardise les liaisons Post Meta sur `args.key` (au lieu d’utiliser `content/url/text/title`).
- Normalise automatiquement les bindings Post Meta existants lors du chargement (migration douce vers `args.key`).

## [1.0.0] - 2025-10-07
- Version initiale avec panneau de configuration pour bindings (Pattern Overrides, Post Meta, Lorem Ipsum, Lorem Picsum) et placeholder natif sur les blocs RichText.
