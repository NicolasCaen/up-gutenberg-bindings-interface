# Changelog

All notable changes to this project will be documented in this file.

## [1.3.2.0] - 2026-09-03
- Mise en cache au niveau module de la requête REST `/sources` : un seul fetch partagé entre toutes les instances de blocs, évitant la saturation de PHP-FPM par N requêtes concurrentes identiques dans le site editor.

## [1.3.1.0] - 2026-09-01
- Sources de bindings déclarées côté PHP et exposées via la route REST `up-gutenberg-bindings-interface/v1/sources`.
- Filtre `up_gutenberg_bindings_interface_sources` pour ajouter/modifier les sources et leurs champs `args` depuis le PHP.
- Le sélecteur et les champs de configuration sont chargés dynamiquement depuis l'API REST.
- Champs d'args génériques (`key`, `label`, `type`) déclarables par source.

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
