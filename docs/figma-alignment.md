# Alignement Figma — La solution

## Fichier de référence

- [La solution — fichier (racine)](https://www.figma.com/design/f3AywFRLntD4wbSUcnqX5x/La-solution?node-id=0-1&t=E4pMiIyGw3VYCBC5-1)
- [Frame « Coming Soon » (node `1026-17297`)](https://www.figma.com/design/f3AywFRLntD4wbSUcnqX5x/La-solution?node-id=1026-17297&t=inIe64i3834S8dsp-1) — **legacy** : `/coming-soon` redirige vers `/` (voir [`docs/landing-evolution.md`](./landing-evolution.md))

## Implémentation dans le repo

- **Landing canonique** : **`/`** — `app/(site)/page.tsx` + sections `app/site/components/landing/`
- **Coming Soon (legacy Figma)** : `app/coming-soon/` — redirect 302 → `/`
- **Hero typographie (Figma Frame 79)** : titres + CTA dans `ComingSoonContent.tsx` (gaps 12 / 22 / 24 px, largeurs max 1032 / 580 px, titre **#C32353** 52px/700, CTA **#333333** `rounded-[20px]` 38px). Variables **`--coming-soon-hero-magenta`**, **`--coming-soon-hero-cta-bg`**, **`--coming-soon-hero-kicker`** (#000), **`--coming-soon-hero-subtitle`** (#222). Hero en **fond blanc** (cohérent avec ces couleurs) ; filigranes Frame 84 sur les bords uniquement.
- **Tokens** : `tailwind.config.ts` — clés `figma.*` (page, sidebar, cartes, statuts, ombres).
- **Variables CSS** : `app/globals.css` — `--logo-red`, `--brand`, gradients ; à étendre pour parité stricte avec Figma Dev Mode.
- **Composants** : `app/components/` — réutiliser tokens `figma` / `brand` pour nouveaux écrans.

## Définition de done UI

Voir plan produit (couleurs, typo, espacements, états, responsive, accessibilité WCAG AA).
