=== ALP Quick Modules for Divi ===
Contributors: alex.alp
Tags: divi, divi 5, divi modules, divi components, favorite modules
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.6
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Favorite and recent Divi 5 modules and Components, right in the module picker. Lightweight, multilingual, privacy-friendly, and completely free.

== Description ==

ALP Quick Modules for Divi is a free Divi 5 productivity plugin that adds favorite and recently used modules and Components directly to the Divi module picker.

Save your most-used Divi modules and Components as favorites, access recent items instantly, reorder favorites with drag and drop, and insert them faster without searching through the full module list.

= 🆓 Completely Free =

ALP Quick Modules for Divi is completely free to use.

There is no premium tier, no license key, no feature paywall, no usage limit, and no external subscription required.

= ⭐ Features =

* Favorite your most-used Divi modules and Components.
* Access recently used modules and Components instantly.
* Add Divi Components to Favorites and Recent in Divi 5.15 and newer.
* Keep Components with identical names separate using their stable Divi Component ID.
* Renamed Components can still be resolved from Favorites and Recent.
* Reorder Favorites with drag and drop.
* Insert modules and Components directly from Favorites and Recent.
* Remove favorites from either the shortcut cards or the regular module list.
* Clear visual feedback when favorites are added or removed.
* Works with the Divi 5 Visual Builder and Theme Builder.
* Automatic Light Mode and Dark Mode styling.
* Responsive module picker behavior.
* Per-user preferences for Favorites and Recent.
* Multilingual interface support.
* Cross-language matching for native Divi modules.
* Designed to work with native modules, third-party Divi modules, and Divi Components shown in the module picker.
* No custom database tables.
* No tracking or telemetry.
* No external API requests or services.
* No plugin assets loaded on the public frontend.

= ⚡ Built for Divi 5 =

ALP Quick Modules for Divi integrates directly with the Divi 5 module picker while preserving the native builder workflow.

It supports both the Visual Builder and Theme Builder and keeps your favorite and recent Divi modules and Components close at hand while you build.

Divi Components are supported in Divi 5.15 and newer.

= 🔒 Privacy Friendly =

The plugin works locally inside your WordPress installation. Favorite and recent module names, along with stable identifiers for saved Divi Components, are stored as WordPress user metadata in your site's own database.

It does not track users, send analytics, require an external account, or communicate with third-party services.

Stored Favorites and Recent preferences can be erased through WordPress privacy tools. Deactivating the plugin keeps your preferences, while deleting the plugin removes them from the database.

= 🚀 Why Quick Modules? =

As a Divi site grows, the module picker can contain dozens of native modules, third-party modules, and reusable Components. ALP Quick Modules for Divi reduces that friction by keeping the items you actually use within easy reach.

Favorite them once, reorder them however you like, and access them directly whenever you open the Divi 5 module picker.

= 💙 Enjoying Quick Modules? =

If ALP Quick Modules for Divi saves you time or improves your workflow, it would mean a lot if you [left a rating or review on WordPress.org](https://wordpress.org/support/plugin/alp-quick-modules-for-divi/reviews/#new-post). Your feedback helps support the plugin and makes it easier for other Divi users to discover it.

ALP Quick Modules for Divi is independently developed by ALP Plugins and is not affiliated with, endorsed by, or sponsored by Elegant Themes. Divi is a trademark of Elegant Themes, Inc.

== Installation ==

1. Upload the plugin ZIP from Plugins > Add New > Upload Plugin, or install it from the WordPress Plugin Directory.
2. Activate ALP Quick Modules for Divi.
3. Open the Divi 5 Visual Builder or Theme Builder.
4. Open the module picker.
5. Use the star icons to add modules or Divi Components to Favorites. Recently inserted items appear automatically under Recent.

== Frequently Asked Questions ==

= Does it work with Divi 5? =

Yes. ALP Quick Modules for Divi is designed for the Divi 5 module picker in both the Visual Builder and Theme Builder.

= Does it support Divi Components? =

Yes. Starting with version 1.0.6, Divi Components shown in the module picker can be added to Favorites and Recent. Components are tracked by their stable Divi component ID rather than only by their visible name, so components with duplicate names remain distinct and renamed components can still be resolved.

= Does it support Divi 4? =

No. This plugin is specifically designed for Divi 5.

= Does it add anything to the public frontend? =

No. Its CSS and JavaScript are loaded only inside Divi builder interfaces, not on the visitor-facing frontend.

= Are favorites shared between users? =

No. Favorites and recent modules or Components are stored per WordPress user, so each user can keep a personal workflow.

= How many recent modules are stored? =

The plugin keeps up to eight recently used modules or Components.

= Can favorites be reordered? =

Yes. Drag favorite cards into the order you prefer. The order is saved automatically.

= Is ALP Quick Modules for Divi completely free? =

Yes. The plugin is completely free. There is no premium tier, license key, feature paywall, usage limit, or external subscription required.

= Does the plugin track users or connect to an external service? =

No. ALP Quick Modules for Divi includes no tracking, telemetry, remote API calls, or external service dependency.

= What happens to my Favorites and Recent preferences if I deactivate or delete the plugin? =

Deactivating the plugin keeps your preferences so they are available if you reactivate it. Deleting the plugin removes its stored Favorites and Recent user preferences from the database.

== Screenshots ==

1. Complete view of ALP Quick Modules for Divi inside the Divi 5 Visual Builder, showing Favorites, Recent, and the standard module picker together.
2. Closer look at Favorites and Recent in Divi 5 dark mode.
3. Closer look at Favorites and Recent in Divi 5 light mode.
4. Green confirmation feedback after adding a module to Favorites.
5. Red confirmation feedback after removing a module from Favorites.
6. Favorite removal hover state: the star turns red to clearly indicate that clicking it will remove the module from Favorites.

== Changelog ==

= 1.0.6 =
* Keeps Divi 5.15.1's native fluid Add From Library width untouched by using a removable New Module-only width class instead of overwriting Divi's inline width.
* Clips Favorite-star overlays to the active module-picker body and matches their z-index to the Divi modal, preventing stars from appearing over the builder toolbar, page canvas, or modal tabs while scrolling.
* Prevents Quick Modules sizing, overlays, and dragging from affecting Divi's Add From Library and New Row tabs; those tabs now retain Divi 5.15.1's native dimensions and layout.
* Adds Favorites and Recent support for Divi Components introduced in Divi 5.15.
* Stores Components with their stable Divi component ID, library type, module type, and display name instead of relying on the visible name alone.
* Keeps Components with identical names separate in Favorites and Recent and supports renamed Components by stable identity.
* Supports Divi's lazy-loaded Component list when launching a saved Component from Favorites or Recent.
* Fixes Favorite-star rendering for every visible Divi Component tile, including Components with duplicate or different display names.
* Collects every direct picker button in Divi 5.15.1 before class-based fallbacks, preventing Component tiles from being skipped during React renders.
* Uses Divi 5.15.1's native Component picker selector and data attributes directly, with a React-safe body-level Favorite overlay.
* Preserves existing module Favorites and Recent preferences without resetting user data.
* Verified compatibility with Divi 5.15.1 module-picker structure and Component data attributes.

= 1.0.5 =
* Keeps nested Add Element module pickers from opening far off-center.
* Adds drag-to-move support using the native Divi modal header.
* Preserves the stable 1.0.4 picker sizing, localization, search, scroll, third-party module behavior, and WordPress.org review fixes.
* Replaces the static clock icon innerHTML assignment with DOM-safe SVG node creation.
* Adds a WordPress personal-data eraser for stored Favorites and Recent preferences.
* Removes stored Quick Modules user preferences only when the plugin is deleted, not when it is deactivated.
* Updated bundled translations to better align with official WordPress locale glossaries, including Spanish terminology corrections for es_ES and regional wording adjustments for es_CR.

= 1.0.4 =
* Use WordPress-generated AJAX endpoint URLs instead of constructing admin endpoint paths in JavaScript.
* Use the plugin-specific ALPQMD/alpqmd prefix for global PHP, AJAX, JavaScript, nonce, and user-meta identifiers to prevent conflicts.
* Fix WordPress Plugin Check i18n errors caused by runtime module-name lookups.
* Resolve saved Divi module labels through Divi's loaded translation catalogs without using low-level translate() with dynamic strings.
* Restore the proven 1.0.3 picker detection, width, search, MutationObserver, and virtualized-scroll behavior to prevent the module picker from shrinking or losing favorite stars after scrolling/searching.
* Migrate previously saved French/Spanish core labels such as Bouton, Galerie, Botón and Galería to stable Divi source names.
* Display migrated Favorites and Recent items in the current Divi interface language while keeping third-party module names untouched.
* Store stable core-module identities when Divi exposes an et_pb_* slug, reducing future cross-language preference issues.
* Preserve the translated-interface and strict third-party collision protections introduced in 1.0.3.

= 1.0.3 =
* Fix fully translated Divi interfaces (including French) not loading Quick Modules.
* Prevent third-party modules with similar names (for example Advanced Blurb) from being inserted instead of the intended native Divi module.
* Fix Favorites/Recent insertion when a saved module name was created under a different Divi UI language (for example Text -> Texte).
* Resolve localized module labels using Divi translations and stable module identity hints before falling back to conservative label matching.
* Prefer localized module-picker title/search signals before structural fallback detection.
* Keep settings-panel false-positive protections introduced in 1.0.2.

= 1.0.2 =
* Critical fix: prevents Favorites and Recent from appearing inside Divi module settings panels.
* Restricts Quick Modules enhancements to the actual Insert Module picker.
* Adds cleanup for stale Quick Modules UI when the module picker closes or changes.
* Strengthens translated-picker detection without changing the approved responsive sizing.

= 1.0.1 =
* Added internationalization support for Quick Modules interface strings.
* Added bundled translations for Spanish (Costa Rica and Spain), Portuguese (Brazil and Portugal), French, German, Italian, Dutch, Polish, Russian, Turkish, Indonesian, Japanese, Korean, Simplified Chinese, Traditional Chinese, Arabic, and Hindi.
* Preserved the 1.0.0 picker layout and behavior while adding a safe translated-Divi fallback.

= 1.0.0 =
* Initial public release.
* Added favorite module shortcuts with per-user persistence.
* Added automatic recently used module shortcuts.
* Added drag-and-drop ordering for favorites.
* Added direct insertion from Favorites and Recent.
* Added support for the Divi 5 Theme Builder module picker.
* Added favorite removal from shortcut cards and the standard module list.
* Added clear green feedback when adding favorites and red feedback when removing them.
* Added automatic light and dark mode styling.
* Added a clock icon for Recent modules.
* Keeps plugin assets out of the public frontend and includes no tracking, telemetry, or external services.
