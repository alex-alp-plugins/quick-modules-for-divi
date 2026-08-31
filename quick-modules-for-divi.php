<?php
/**
 * Plugin Name: Quick Modules for Divi
 * Description: Shows your favorite and recently used Divi modules at the top of the module picker for quick access.
 * Version: 1.0.3
 * Author: ALP Plugins
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: quick-modules-for-divi
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class ALP_Divi_Quick_Modules {
    const VERSION      = '1.0.3';
    const META_KEY     = '_alp_divi_module_picker_prefs'; // Kept for seamless migration from earlier versions.
    const NONCE_ACTION = 'alp_divi_quick_modules';

    public static function init() {
        // Keep the proven direct enqueue path for the regular Visual Builder.
        add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_visual_builder_assets' ), 999 );

        // Theme Builder can render its builder app in a separate same-origin window.
        // Load a top-window fallback and also register the assets for Divi's app window.
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_theme_builder_top_assets' ), 999 );
        add_action( 'et_fb_framework_loaded', array( __CLASS__, 'register_theme_builder_app_assets' ), 20 );

        add_action( 'wp_ajax_alp_dqm_bootstrap', array( __CLASS__, 'bootstrap_preferences' ) );
        add_action( 'wp_ajax_alp_dqm_save_preferences', array( __CLASS__, 'save_preferences' ) );
    }

    private static function is_visual_builder() {
        if ( function_exists( 'et_core_is_fb_enabled' ) && et_core_is_fb_enabled() ) {
            return true;
        }

        // Read-only fallback for Divi's Visual Builder query flag.
        $visual_builder_flag = filter_input( INPUT_GET, 'et_fb', FILTER_SANITIZE_FULL_SPECIAL_CHARS );

        return '1' === $visual_builder_flag;
    }

    private static function is_theme_builder() {
        if ( class_exists( 'ET\\Builder\\Framework\\Utility\\Conditions' ) && method_exists( 'ET\\Builder\\Framework\\Utility\\Conditions', 'is_tb_admin_screen' ) ) {
            return \ET\Builder\Framework\Utility\Conditions::is_tb_admin_screen();
        }

        if ( ! is_admin() ) {
            return false;
        }

        $theme_builder_page = filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS );

        return 'et_theme_builder' === $theme_builder_page;
    }

    private static function get_preferences_data() {
        $prefs = get_user_meta( get_current_user_id(), self::META_KEY, true );
        if ( ! is_array( $prefs ) ) {
            $prefs = array();
        }

        $favorites      = isset( $prefs['favorites'] ) && is_array( $prefs['favorites'] ) ? array_values( $prefs['favorites'] ) : array();
        $recent         = isset( $prefs['recent'] ) && is_array( $prefs['recent'] ) ? array_values( $prefs['recent'] ) : array();
        $schema_version = isset( $prefs['schema_version'] ) ? absint( $prefs['schema_version'] ) : 0;

        return array(
            'ajaxUrl'            => admin_url( 'admin-ajax.php' ),
            'nonce'              => wp_create_nonce( self::NONCE_ACTION ),
            'favorites'          => $favorites,
            'recent'             => $recent,
            'maxRecent'          => 8,
            'schemaVersionSaved' => $schema_version,
            'locale'             => get_user_locale( get_current_user_id() ),
            'strings'            => self::get_translated_strings(),
            'moduleAliases'      => self::get_translated_module_aliases( array_merge( $favorites, $recent ) ),
        );
    }

    private static function get_translated_module_aliases( $module_names ) {
        $aliases = array();
        $names   = array_values( array_unique( array_filter( array_map( 'strval', is_array( $module_names ) ? $module_names : array() ) ) ) );

        if ( empty( $names ) ) {
            return $aliases;
        }

        $switched_locale = false;
        if ( is_user_logged_in() && function_exists( 'switch_to_user_locale' ) ) {
            $switched_locale = switch_to_user_locale( get_current_user_id() );
        }

        foreach ( $names as $name ) {
            $translated = array();

            // Divi's builder strings traditionally use the et_builder text domain.
            // The theme domain is also checked as a compatibility fallback.
            foreach ( array( 'et_builder', 'Divi' ) as $domain ) {
                $candidate = translate( $name, $domain );
                if ( is_string( $candidate ) && '' !== $candidate && $candidate !== $name && ! in_array( $candidate, $translated, true ) ) {
                    $translated[] = $candidate;
                }
            }

            if ( ! empty( $translated ) ) {
                $aliases[ $name ] = $translated;
            }
        }

        if ( $switched_locale && function_exists( 'restore_previous_locale' ) ) {
            restore_previous_locale();
        }

        return $aliases;
    }

    private static function get_translated_strings() {
        $switched_locale = false;

        if ( is_user_logged_in() && function_exists( 'switch_to_user_locale' ) ) {
            $switched_locale = switch_to_user_locale( get_current_user_id() );
        }

        $strings = array(
            'favorites'   => __( 'Favorites', 'quick-modules-for-divi' ),
            'recent'      => __( 'Recent', 'quick-modules-for-divi' ),
            'emptyFav'    => __( 'No favorites yet. Click a star to add one.', 'quick-modules-for-divi' ),
            'emptyRecent' => __( 'Recently used modules will appear here.', 'quick-modules-for-divi' ),
            'favorite'    => __( 'Add to favorites', 'quick-modules-for-divi' ),
            'unfavorite'  => __( 'Remove from favorites', 'quick-modules-for-divi' ),
            /* translators: %s: Divi module name. */
            'addedFavorite' => __( '%s added to Favorites.', 'quick-modules-for-divi' ),
            /* translators: %s: Divi module name. */
            'removedFavorite' => __( '%s removed from Favorites.', 'quick-modules-for-divi' ),
            /* translators: %s: Divi module name. */
            'removeFavoriteNamed' => __( 'Remove %s from favorites', 'quick-modules-for-divi' ),
            'dragFavorite' => __( 'Drag to reorder', 'quick-modules-for-divi' ),
            /* translators: %s: Divi module name. */
            'moduleNotFound' => __( 'Could not find %s in the current module list.', 'quick-modules-for-divi' ),
        );

        if ( $switched_locale && function_exists( 'restore_previous_locale' ) ) {
            restore_previous_locale();
        }

        return $strings;
    }

    private static function enqueue_direct_assets( $handle ) {
        $plugin_url = plugin_dir_url( __FILE__ );

        wp_enqueue_style(
            $handle,
            $plugin_url . 'assets/picker.css',
            array(),
            self::VERSION
        );

        wp_enqueue_script(
            $handle,
            $plugin_url . 'assets/picker.js',
            array(),
            self::VERSION,
            true
        );

        wp_localize_script(
            $handle,
            'ALPDiviQuickModules',
            self::get_preferences_data()
        );
    }

    public static function enqueue_visual_builder_assets() {
        if ( ! is_user_logged_in() || ! self::is_visual_builder() ) {
            return;
        }

        self::enqueue_direct_assets( 'quick-modules-for-divi' );
    }

    public static function enqueue_theme_builder_top_assets() {
        if ( ! is_user_logged_in() || ! self::is_theme_builder() ) {
            return;
        }

        self::enqueue_direct_assets( 'quick-modules-for-divi-theme-builder-top' );
    }

    public static function register_theme_builder_app_assets() {
        if ( ! is_user_logged_in() || ! self::is_theme_builder() ) {
            return;
        }

        if ( ! class_exists( 'ET\\Builder\\VisualBuilder\\Assets\\PackageBuildManager' ) ) {
            return;
        }

        $plugin_url = plugin_dir_url( __FILE__ );

        // Follow Divi 5's app-window package mechanism for the Theme Builder.
        // The script can obtain its per-user config from the same-origin top window
        // or through the authenticated bootstrap AJAX action below.
        \ET\Builder\VisualBuilder\Assets\PackageBuildManager::register_package_build(
            array(
                'name'    => 'quick-modules-for-divi-theme-builder-app',
                'version' => self::VERSION,
                'script'  => array(
                    'src'                => $plugin_url . 'assets/picker.js',
                    'deps'               => array(),
                    'args'               => true,
                    'defer'              => false,
                    'async'              => false,
                    'data_app_window'    => array(),
                    'data_top_window'    => array(),
                    'enqueue_top_window' => false,
                    'enqueue_app_window' => true,
                ),
                'style'   => array(
                    'src'                => $plugin_url . 'assets/picker.css',
                    'deps'               => array(),
                    'args'               => array(),
                    'enqueue_top_window' => false,
                    'enqueue_app_window' => true,
                    'media'              => 'all',
                ),
            )
        );
    }

    public static function bootstrap_preferences() {
        if ( ! is_user_logged_in() ) {
            wp_send_json_error( array( 'message' => 'Unauthorized' ), 401 );
        }

        wp_send_json_success( self::get_preferences_data() );
    }

    public static function save_preferences() {
        if ( ! is_user_logged_in() ) {
            wp_send_json_error( array( 'message' => 'Unauthorized' ), 401 );
        }

        check_ajax_referer( self::NONCE_ACTION, 'nonce' );

        $favorites_json = isset( $_POST['favorites'] ) ? sanitize_text_field( wp_unslash( $_POST['favorites'] ) ) : '';
        $recent_json    = isset( $_POST['recent'] ) ? sanitize_text_field( wp_unslash( $_POST['recent'] ) ) : '';

        $favorites = json_decode( $favorites_json, true );
        $recent    = json_decode( $recent_json, true );

        $favorites = self::sanitize_names( $favorites, 50 );
        $recent    = self::sanitize_names( $recent, 8 );

        update_user_meta(
            get_current_user_id(),
            self::META_KEY,
            array(
                'favorites'      => $favorites,
                'recent'         => $recent,
                'schema_version' => 3,
            )
        );

        wp_send_json_success();
    }

    private static function sanitize_names( $items, $limit ) {
        if ( ! is_array( $items ) ) {
            return array();
        }

        $clean = array();
        foreach ( $items as $item ) {
            if ( ! is_string( $item ) ) {
                continue;
            }

            $item = trim( sanitize_text_field( $item ) );
            if ( '' === $item || strlen( $item ) > 100 ) {
                continue;
            }

            if ( ! in_array( $item, $clean, true ) ) {
                $clean[] = $item;
            }

            if ( count( $clean ) >= $limit ) {
                break;
            }
        }

        return $clean;
    }
}

ALP_Divi_Quick_Modules::init();
