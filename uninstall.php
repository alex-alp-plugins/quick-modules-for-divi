<?php
/**
 * Uninstall cleanup for ALP Quick Modules for Divi.
 *
 * @package ALPQuickModulesForDivi
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

delete_metadata( 'user', 0, 'alpqmd_module_picker_prefs', '', true );
