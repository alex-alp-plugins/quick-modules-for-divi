<?php
/**
 * Plugin Name: ALP Quick Modules for Divi
 * Description: Shows your favorite and recently used Divi modules and Components at the top of the module picker for quick access.
 * Version: 1.0.6
 * Author: ALP Plugins
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: alp-quick-modules-for-divi
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class ALPQMD_Quick_Modules {
    const VERSION       = '1.0.6';
    const ASSET_VERSION = '1.0.6.9';
    const META_KEY     = 'alpqmd_module_picker_prefs';
    const NONCE_ACTION = 'alpqmd_preferences';

    public static function init() {
        // Keep the proven direct enqueue path for the regular Visual Builder.
        add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_visual_builder_assets' ), 999 );

        // Theme Builder can render its builder app in a separate same-origin window.
        // Load a top-window fallback and also register the assets for Divi's app window.
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_theme_builder_top_assets' ), 999 );
        add_action( 'et_fb_framework_loaded', array( __CLASS__, 'register_theme_builder_app_assets' ), 20 );

        add_action( 'wp_ajax_alpqmd_save_preferences', array( __CLASS__, 'save_preferences' ) );

        // Make stored per-user module preferences erasable through WordPress privacy tools.
        add_filter( 'wp_privacy_personal_data_erasers', array( __CLASS__, 'register_privacy_eraser' ) );
    }

    public static function register_privacy_eraser( $erasers ) {
        $erasers['alp-quick-modules-for-divi'] = array(
            'eraser_friendly_name' => 'ALP Quick Modules for Divi',
            'callback'             => array( __CLASS__, 'erase_personal_data' ),
        );

        return $erasers;
    }

    public static function erase_personal_data( $email_address, $page = 1 ) {
        $user = get_user_by( 'email', $email_address );

        if ( ! $user ) {
            return array(
                'items_removed'  => false,
                'items_retained' => false,
                'messages'       => array(),
                'done'           => true,
            );
        }

        $had_preferences = metadata_exists( 'user', $user->ID, self::META_KEY );

        if ( $had_preferences ) {
            delete_user_meta( $user->ID, self::META_KEY );
        }

        return array(
            'items_removed'  => $had_preferences,
            'items_retained' => false,
            'messages'       => array(),
            'done'           => true,
        );
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
        $user_id = get_current_user_id();
        $prefs   = get_user_meta( $user_id, self::META_KEY, true );

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

    private static function canonicalize_saved_module_name( $name ) {
        $name = trim( (string) $name );

        // Earlier releases stored the visible Divi module label. If a user later
        // changed the builder language, those labels could remain in Favorites or
        // Recent. Normalize only verified core labels back to Divi's English source
        // name; third-party module labels are intentionally left untouched.
        $known_localized_core_labels = array(
            // French.
            'Bouton'            => 'Button',
            'Résumé'            => 'Blurb',
            'Resume'            => 'Blurb',
            'Groupe'            => 'Group',
            'Texte'             => 'Text',
            'Accordéon'         => 'Accordion',
            'Accordeon'         => 'Accordion',
            'Carrousel Groupe'  => 'Group Carousel',
            'Galerie'           => 'Gallery',
            // Spanish.
            'Botón'             => 'Button',
            'Boton'             => 'Button',
            'Grupo'             => 'Group',
            'Texto'             => 'Text',
            'Imagen'            => 'Image',
            'Acordeón'          => 'Accordion',
            'Acordeon'          => 'Accordion',
            'Carrusel Agrupado' => 'Group Carousel',
            'Resumen'           => 'Blurb',
            'Galería'           => 'Gallery',
            'Galeria'           => 'Gallery',
        );

        return isset( $known_localized_core_labels[ $name ] ) ? $known_localized_core_labels[ $name ] : $name;
    }

    private static function get_translated_module_aliases( $module_names ) {
        $aliases = array();
        $names   = array_values( array_unique( array_filter( array_map( 'strval', is_array( $module_names ) ? $module_names : array() ) ) ) );
        $names   = array_values(
            array_filter(
                $names,
                static function ( $name ) {
                    return 0 !== strpos( $name, 'alpqmd-component|' );
                }
            )
        );

        if ( empty( $names ) ) {
            return $aliases;
        }

        $switched_locale = false;
        if ( is_user_logged_in() && function_exists( 'switch_to_user_locale' ) ) {
            $switched_locale = switch_to_user_locale( get_current_user_id() );
        }

        // These are Divi's own loaded translation catalogs. We intentionally
        // inspect them directly because $name is a previously saved module label,
        // not a translatable string owned by this plugin. Using __()/translate()
        // with a runtime string would violate WordPress i18n literal-string rules.
        $translation_sets = array(
            get_translations_for_domain( 'et_builder' ),
            get_translations_for_domain( 'Divi' ),
        );

        foreach ( $names as $name ) {
            $translated = array();
            $canonical  = self::canonicalize_saved_module_name( $name );

            if ( $canonical !== $name ) {
                $translated[] = $canonical;
            }

            foreach ( $translation_sets as $translations ) {
                if ( ! is_object( $translations ) || ! method_exists( $translations, 'translate' ) ) {
                    continue;
                }

                $candidate = $translations->translate( $canonical );
                if ( is_string( $candidate ) && '' !== $candidate && $candidate !== $canonical && ! in_array( $candidate, $translated, true ) ) {
                    $translated[] = $candidate;
                }
            }

            if ( ! empty( $translated ) ) {
                // Keep both keys during migration. JavaScript immediately
                // canonicalizes stored core labels, while this original-name key
                // keeps older preferences usable during the same request.
                $aliases[ $name ] = $translated;
                if ( $canonical !== $name ) {
                    $aliases[ $canonical ] = $translated;
                }
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
            'favorites'   => __( 'Favorites', 'alp-quick-modules-for-divi' ),
            'recent'      => __( 'Recent', 'alp-quick-modules-for-divi' ),
            'emptyFav'    => __( 'No favorites yet. Click a star to add one.', 'alp-quick-modules-for-divi' ),
            'emptyRecent' => __( 'Recently used modules will appear here.', 'alp-quick-modules-for-divi' ),
            'favorite'    => __( 'Add to favorites', 'alp-quick-modules-for-divi' ),
            'unfavorite'  => __( 'Remove from favorites', 'alp-quick-modules-for-divi' ),
            /* translators: %s: Divi module name. */
            'addedFavorite' => __( '%s added to Favorites.', 'alp-quick-modules-for-divi' ),
            /* translators: %s: Divi module name. */
            'removedFavorite' => __( '%s removed from Favorites.', 'alp-quick-modules-for-divi' ),
            /* translators: %s: Divi module name. */
            'removeFavoriteNamed' => __( 'Remove %s from favorites', 'alp-quick-modules-for-divi' ),
            'dragFavorite' => __( 'Drag to reorder', 'alp-quick-modules-for-divi' ),
            /* translators: %s: Divi module name. */
            'moduleNotFound' => __( 'Could not find %s in the current module list.', 'alp-quick-modules-for-divi' ),
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
            self::ASSET_VERSION
        );

        wp_enqueue_script(
            $handle,
            $plugin_url . 'assets/picker.js',
            array(),
            self::ASSET_VERSION,
            true
        );

        wp_localize_script(
            $handle,
            'ALPQMDQuickModules',
            self::get_preferences_data()
        );
    }

    public static function enqueue_visual_builder_assets() {
        if ( ! is_user_logged_in() || ! self::is_visual_builder() ) {
            return;
        }

        self::enqueue_direct_assets( 'alp-quick-modules-for-divi' );
    }

    public static function enqueue_theme_builder_top_assets() {
        if ( ! is_user_logged_in() || ! self::is_theme_builder() ) {
            return;
        }

        self::enqueue_direct_assets( 'alp-quick-modules-for-divi-theme-builder-top' );
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
        // The app-window script obtains its per-user configuration from the
        // same-origin top window, where WordPress localizes the AJAX URL and nonce.
        \ET\Builder\VisualBuilder\Assets\PackageBuildManager::register_package_build(
            array(
                'name'    => 'alp-quick-modules-for-divi-theme-builder-app',
                'version' => self::ASSET_VERSION,
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

    public static function save_preferences() {
        if ( ! is_user_logged_in() || ! current_user_can( 'read' ) ) {
            wp_send_json_error( array( 'message' => __( 'Unauthorized', 'alp-quick-modules-for-divi' ) ), 403 );
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
                'schema_version' => 4,
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
            if ( '' === $item || strlen( $item ) > 300 ) {
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

ALPQMD_Quick_Modules::init();
