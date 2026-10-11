# ALP Quick Modules for Divi

**Favorites, Recent, and Divi Components right where you build.**

ALP Quick Modules for Divi is a lightweight, completely free productivity plugin for **Divi 5**. It adds your favorite and recently used modules and Components directly to the Divi module picker for faster access.

[![Latest Version](https://img.shields.io/github/v/tag/alex-alp-plugins/quick-modules-for-divi?sort=semver&label=Version)](https://github.com/alex-alp-plugins/quick-modules-for-divi/releases/latest)

## What's new in 1.0.6

- Adds Favorites and Recent support for **Divi Components** introduced in Divi 5.15.
- Tracks Components by stable Divi component ID so duplicate names remain distinct and renamed Components can still be resolved.
- Supports Divi's lazy-loaded Component list when opening a saved Component from Favorites or Recent.
- Fixes Favorite-star rendering for visible Component tiles.
- Preserves Divi 5.15.1's native **Add From Library** width instead of forcing Quick Modules sizing onto that tab.
- Prevents Favorite-star overlays from escaping over the builder toolbar, page canvas, or modal tabs while scrolling.
- Keeps Quick Modules sizing, overlays, and dragging isolated from **Add From Library** and **New Row**.
- Preserves existing Favorites and Recent preferences without resetting user data.
- Includes the privacy, internationalization, accessibility, and WordPress.org review fixes from earlier releases.

The public plugin version is **1.0.6**. The tested release build uses asset revision **1.0.6.9** for cache invalidation.

## Features

- Favorite your most-used Divi modules and Components.
- Access recently used modules and Components instantly.
- Reorder Favorites with drag and drop.
- Insert modules and Components directly from Favorites and Recent.
- Per-user preferences.
- Visual Builder and Theme Builder support.
- Automatic Light Mode and Dark Mode styling.
- Responsive module-picker behavior.
- Cross-language matching for native Divi modules.
- Support for third-party Divi modules shown in the picker.
- No custom database tables.
- No tracking, telemetry, or external API dependency.
- No plugin assets loaded on the public frontend.

## Requirements

- WordPress 6.5 or newer
- PHP 7.4 or newer
- Divi 5
- Divi 5.15+ for Divi Components support

## Installation

1. Install **ALP Quick Modules for Divi** from the WordPress Plugin Directory, or upload the release ZIP.
2. Activate the plugin.
3. Open the Divi 5 Visual Builder or Theme Builder.
4. Open the module picker.
5. Use the star icons to add modules or Components to Favorites. Recently inserted items appear automatically under Recent.

No configuration page is required.

## Privacy

The plugin works locally inside WordPress. Favorite and recent item data is stored as WordPress user metadata in the site's own database. It does not send analytics or telemetry and does not communicate with third-party services.

Stored preferences can be erased through WordPress privacy tools and are removed when the plugin is deleted. Deactivation preserves preferences.

## Version history

### 1.0.6

Divi 5.15 Components support plus compatibility fixes for Add From Library sizing and Favorite-star overlay containment.

### 1.0.5

Improved nested picker positioning, draggable modal support, privacy eraser support, DOM-safe icon rendering, and translation refinements.

### 1.0.4

Stability, localization, translated-interface support, and Divi 5.11 compatibility improvements.

### 1.0.3

Improved translated Divi interfaces and cross-language module matching.

### 1.0.2

Fixed Quick Modules controls appearing inside normal Divi settings panels.

### 1.0.1

Added internationalization and responsive improvements.

### 1.0.0

Initial public release.

## License

GNU General Public License v2.0 or later. See `LICENSE.txt`.

## Trademark notice

ALP Quick Modules for Divi is an independent third-party plugin created by **ALP Plugins**. It is not affiliated with, endorsed by, or sponsored by Elegant Themes. Divi is a trademark of Elegant Themes, Inc.
