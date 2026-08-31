=== Quick Modules for Divi ===
Contributors: alex.alp
Tags: divi, divi 5, favorite modules, recent modules, page builder
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.3
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Keep favorite and recently used Divi modules at the top of the module picker for faster access.

== Description ==

Quick Modules for Divi adds lightweight productivity shortcuts to the Divi 5 module picker, keeping the modules you use most within easy reach.

Features:

* Mark frequently used modules as favorites.
* See recently used modules automatically.
* Reorder favorite modules with drag and drop.
* Insert favorite and recent modules directly from the shortcut cards.
* Remove favorites from either the shortcut cards or the regular module list.
* Clear visual feedback when favorites are added or removed.
* Automatic styling for Divi light mode and dark mode.
* Works in both the Divi 5 Visual Builder and Theme Builder.
* Preferences stored separately for each WordPress user.
* No custom database tables, tracking, telemetry, or external services.
* No plugin assets loaded on the public frontend.

The plugin is intentionally small and focused. There is no settings screen to configure: activate it, open the Divi 5 Visual Builder or Theme Builder, and use the module picker normally.

Quick Modules for Divi is independently developed by ALP Plugins and is not affiliated with, endorsed by, or sponsored by Elegant Themes. Divi is a trademark of Elegant Themes, Inc.

== Installation ==

1. Upload the plugin ZIP from Plugins > Add New > Upload Plugin, or install it from the WordPress Plugin Directory.
2. Activate Quick Modules for Divi.
3. Open the Divi 5 Visual Builder or Theme Builder.
4. Open the module picker.
5. Use the star icons to add modules to Favorites. Recently inserted modules appear automatically under Recent.

== Frequently Asked Questions ==

= Does it work with Divi 5? =

Yes. Quick Modules for Divi is designed for the Divi 5 module picker in both the Visual Builder and Theme Builder.

= Does it support Divi 4? =

No. This plugin is specifically designed for Divi 5.

= Does it add anything to the public frontend? =

No. Its CSS and JavaScript are loaded only inside Divi builder interfaces, not on the visitor-facing frontend.

= Are favorites shared between users? =

No. Favorites and recent modules are stored per WordPress user, so each user can keep a personal workflow.

= How many recent modules are stored? =

The plugin keeps up to eight recently used modules.

= Can favorites be reordered? =

Yes. Drag favorite cards into the order you prefer. The order is saved automatically.

= Does the plugin track users or connect to an external service? =

No. Quick Modules for Divi includes no tracking, telemetry, remote API calls, or external service dependency.

== Screenshots ==

1. Complete view of Quick Modules for Divi inside the Divi 5 Visual Builder, showing Favorites, Recent, and the standard module picker together.
2. Closer look at Favorites and Recent in Divi 5 dark mode.
3. Closer look at Favorites and Recent in Divi 5 light mode.
4. Green confirmation feedback after adding a module to Favorites.
5. Red confirmation feedback after removing a module from Favorites.
6. Favorite removal hover state: the star turns red to clearly indicate that clicking it will remove the module from Favorites.

== Privacy ==

Quick Modules for Divi does not collect or transmit personal data. Favorite and recent module names are stored as WordPress user metadata in the site's own database. The plugin makes no remote requests and includes no analytics or telemetry.

== Changelog ==

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
