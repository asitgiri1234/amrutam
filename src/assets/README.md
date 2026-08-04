# `assets/` — static files bundled with the app

## Why a folder rather than scattering files next to components

1. **Metro resolves assets at build time.** Every `require('./x.png')` becomes a
   bundle entry. Keeping them in one tree makes it possible to audit bundle size
   and to spot the 2 MB hero image someone dropped in without compressing.
2. **Assets are shared across modules more often than components are.** A
   placeholder image or the brand mark belongs to the app, not to Shop.
3. **Density and platform variants have naming conventions**
   (`logo@2x.png`, `logo@3x.png`, `.ios.png` / `.android.png`) that only work
   when files sit together.

## Structure

```
assets/
  fonts/    # brand fonts, linked via react-native.config.js
  images/   # raster: photos, illustrations, placeholders (@2x / @3x)
  icons/    # source SVGs — see the note below
```

## Icons: source SVGs only

The app does **not** render SVG files directly and does **not** use an icon
font. `design-system/components/Icon.tsx` holds a typed registry of path data,
which means:

- `IconName` is a union, so a typo is a compile error rather than a blank square
- icons take their colour from the theme, so dark mode is automatic
- only referenced icons reach the bundle — an icon font ships every glyph to
  every user

SVGs live here as the _source of truth_ for designers. Adding an icon means
adding its path to the registry (or, later, running `svgr` into
[`generated/`](../generated/README.md)).

## Rules

- Compress raster images before committing. There is no build step that will do
  it for you.
- Anything over ~200 KB should be served from the CDN and cached, not bundled.
- No user-generated or PHI content ever lands here.
