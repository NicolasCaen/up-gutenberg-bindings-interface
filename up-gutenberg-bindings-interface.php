<?php
/**
 * Plugin Name:       Up Gutenberg Binding interface
 * Description:       Ajoute un panneau de configuration pour les Block Bindings à certains blocs Gutenberg.
 * Version:           1.0.0
 * Author:            GEHIN Nicolas
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       up-gutenberg-bindings-interface
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Sécurité
}

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
}
add_action( 'enqueue_block_editor_assets', 'up_gutenberg_bindings__interface_enqueue_editor_assets' );