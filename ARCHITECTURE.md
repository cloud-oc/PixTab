# PixTab Architecture

PixTab separates browser wiring from application behavior. The three files in
`src/entrypoints` only assemble dependencies and start their respective runtime.

## Dependency direction

`entrypoints -> application/ui -> domain + infrastructure`

- `domain` contains deterministic preference, query, filtering, Artwork DTO,
  and message rules. It does not access DOM or extension APIs.
- `infrastructure` implements browser storage/authentication, request scheduling,
  downloads, proxy policy, and independent Pixiv source adapters.
- `application` selects a source, assembles Artwork DTOs, maintains the prefetch
  pool, and routes extension messages.
- `ui` renders DTOs and owns new-tab, Ugoira, overlay, localization, and options
  interactions.

## Compatibility boundaries

- Storage keys and defaults are defined in `src/domain/preferences.js`.
- Legacy and current runtime actions converge in `src/domain/messages.js`.
- New-tab data crosses the background boundary only as the Artwork DTO defined
  in `src/domain/artwork.js`.
- Browser-specific manifest differences are generated in memory by
  `build/build.mjs`; the root manifest is never rewritten during packaging.

Use `npm run check` before submitting a change.
