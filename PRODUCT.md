# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

PixTab serves desktop Chrome, Edge, and Firefox users who want Pixiv artwork to become the visual background of every new tab while retaining precise control over sources, filtering, display, and connectivity.

## Product Purpose

PixTab turns the browser's new-tab surface into a rotating Pixiv artwork experience. Success means artwork loads reliably, remains the visual focus, and every preference continues to work without making users understand Pixiv APIs or extension internals.

## Positioning

The product combines multiple Pixiv discovery sources, artwork-aware filtering, Ugoira playback, prefetching, login-aware fallbacks, and optional image proxying in one locally configured new-tab extension.

## Operating Context

Users encounter the product repeatedly in short desktop sessions: opening a new tab, refreshing the artwork, inspecting attribution, or opening the settings overlay. Deeper configuration is available in the dedicated options page. The extension also runs as a restartable background service worker.

## Capabilities and Constraints

- Preserve current storage keys, defaults, message actions, Artwork DTO fields, permissions, locale resources, and Chrome/Edge/Firefox manifests.
- Preserve keyword, ranking, artist, following, bookmarks, recommendations, content/AIGC/R18 filters, proxy fallback, retry, prefetch, attribution, theme, i18n, and Ugoira behavior.
- Continue using native JavaScript ESM and the current esbuild packaging pipeline.
- Artwork and controls must remain usable over unpredictable bright, dark, and highly detailed images.
- Visual work must not introduce remote UI dependencies or weaken extension CSP compatibility.

## Brand Commitments

- Keep the PixTab name and let the selected Pixiv artwork remain the primary visual subject.
- The user has explicitly chosen SwiftUI's Liquid Glass design language as the binding direction for the complete interface.
- Liquid Glass is translated to the web rather than presented as a claim that the extension is a native Apple application.

## Evidence on Hand

- Existing extension UI and behavior under `src/newtab` and `src/options`.
- Six complete locale catalogs under `_locales`.
- Existing icons, current visual regression screenshots, automated extension tests, and live Pixiv availability probe.
- No independent marketing claims, customer testimonials, or external brand assets should be invented.

## Product Principles

- Artwork leads; interface chrome supports it and recedes.
- Repeated interactions respond immediately and never trap users in loading states.
- Dense settings remain familiar, legible, and predictable.
- Materials adapt to light, dark, motion, transparency, and contrast preferences.
- Visual ambition must not compromise performance or cross-browser stability.

## Accessibility & Inclusion

Maintain keyboard operation, visible focus, readable contrast over dynamic imagery, responsive layouts, localized text, reduced-motion behavior, reduced-transparency fallbacks, and high-contrast material fallbacks.
