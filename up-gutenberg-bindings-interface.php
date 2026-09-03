<?php
/**
 * Plugin Name:       Up Gutenberg Binding interface
 * Description:       Ajoute un panneau de configuration pour les Block Bindings à certains blocs Gutenberg.
 * Version:           1.3.2.0
 * Author:            GEHIN Nicolas
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       up-gutenberg-bindings-interface
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Sécurité
}

/**
 * Sources de bindings par défaut proposées dans le sélecteur.
 *
 * Chaque entrée est un tableau associatif :
 *  - label : libellé affiché dans le sélecteur.
 *  - value : identifiant de la source (ex: core/post-meta, up/lorem-ipsum).
 *  - args  : (optionnel) tableau décrivant les champs de configuration
 *            spécifiques à cette source. Chaque champ :
 *              - key   : nom de l'argument stocké dans args.
 *              - label : libellé du champ.
 *              - type  : 'text' (défaut) ou 'number'.
 *
 * La liste est filtrable via le hook
 * `up_gutenberg_bindings_interface_sources`.
 *
 * @return array
 */
function up_gutenberg_bindings_interface_get_sources() {
    $sources = array(
        array(
            'label' => __( 'Pattern Overrides', 'up-gutenberg-bindings-interface' ),
            'value' => 'core/pattern-overrides',
        ),
        array(
            'label' => __( 'Post Meta', 'up-gutenberg-bindings-interface' ),
            'value' => 'core/post-meta',
            'args'  => array(
                array( 'key' => 'key', 'label' => __( 'Clé meta (key)', 'up-gutenberg-bindings-interface' ) ),
            ),
        ),
        array(
            'label' => __( 'Lorem Ipsum', 'up-gutenberg-bindings-interface' ),
            'value' => 'up/lorem-ipsum',
            'args'  => array(
                array(
                    'key'   => 'count',
                    'label' => __( 'Nombre de mots', 'up-gutenberg-bindings-interface' ),
                    'type'  => 'number',
                ),
            ),
        ),
        array(
            'label' => __( 'Lorem Picsum', 'up-gutenberg-bindings-interface' ),
            'value' => 'up/lorem-picsum',
            'args'  => array(
                array( 'key' => 'width',  'label' => __( 'Largeur (px)', 'up-gutenberg-bindings-interface' ), 'type' => 'number' ),
                array( 'key' => 'height', 'label' => __( 'Hauteur (px)', 'up-gutenberg-bindings-interface' ), 'type' => 'number' ),
                array( 'key' => 'id',     'label' => __( 'ID (Picsum)', 'up-gutenberg-bindings-interface' ),  'type' => 'number' ),
            ),
        ),
        array(
            'label' => __( 'Crean – Titre d\'archive', 'up-gutenberg-bindings-interface' ),
            'value' => 'up-crean-cpt/archive-title',
        ),
        array(
            'label' => __( 'Crean – Description d\'archive', 'up-gutenberg-bindings-interface' ),
            'value' => 'up-crean-cpt/archive-description',
        ),
    );

    /**
     * Filtre la liste des sources de bindings disponibles dans le sélecteur.
     *
     * @param array $sources Tableau de sources (label/value/args?).
     */
    return apply_filters( 'up_gutenberg_bindings_interface_sources', $sources );
}

/**
 * Enregistre la route REST exposant la liste des sources de bindings.
 *
 * La route est lisible par tout utilisateur connecté ayant la capacité
 * `edit_posts` (accès éditeur), afin de refléter côté JS ce que le PHP
 * déclare via le filtre `up_gutenberg_bindings_interface_sources`.
 */
function up_gutenberg_bindings_interface_register_rest_routes() {
    register_rest_route(
        'up-gutenberg-bindings-interface/v1',
        '/sources',
        array(
            'methods'             => 'GET',
            'callback'            => function () {
                return rest_ensure_response( up_gutenberg_bindings_interface_get_sources() );
            },
            'permission_callback' => function () {
                return current_user_can( 'edit_posts' );
            },
            'schema'              => array(
                'type'  => 'array',
                'items' => array(
                    'type'       => 'object',
                    'properties' => array(
                        'label' => array( 'type' => 'string' ),
                        'value' => array( 'type' => 'string' ),
                        'args'  => array(
                            'type'  => 'array',
                            'items' => array(
                                'type'       => 'object',
                                'properties' => array(
                                    'key'   => array( 'type' => 'string' ),
                                    'label' => array( 'type' => 'string' ),
                                    'type'  => array( 'type' => 'string', 'enum' => array( 'text', 'number' ) ),
                                ),
                            ),
                        ),
                    ),
                ),
            ),
        )
    );
}
add_action( 'rest_api_init', 'up_gutenberg_bindings_interface_register_rest_routes' );

/**
 * Enregistre et charge les scripts pour l'éditeur de blocs.
 */
function up_gutenberg_bindings__interface_enqueue_editor_assets() {
    $asset_file = include( plugin_dir_path( __FILE__ ) . 'build/index.asset.php');

    wp_enqueue_script(
        'up-gutenberg-bindings-interface-script',
        plugins_url( 'build/index.js', __FILE__ ),
        $asset_file['dependencies'],
        $asset_file['version']
    );

    // Expose l'URL REST au JS (fallback/initialisation).
    wp_localize_script(
        'up-gutenberg-bindings-interface-script',
        'upGutenbergBindingsInterface',
        array(
            'restUrl'     => esc_url_raw( rest_url( 'up-gutenberg-bindings-interface/v1/sources' ) ),
            'restNonce'   => wp_create_nonce( 'wp_rest' ),
        )
    );
}
add_action( 'enqueue_block_editor_assets', 'up_gutenberg_bindings__interface_enqueue_editor_assets' );
