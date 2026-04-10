# Alignement Figma — La solution

## Fichier de référence

[Maquette Figma — La solution](https://www.figma.com/design/f3AywFRLntD4wbSUcnqX5x/La-solution?node-id=0-1&t=E4pMiIyGw3VYCBC5-1)

## Implémentation dans le repo

- **Tokens** : `tailwind.config.ts` — clés `figma.*` (page, sidebar, cartes, statuts, ombres).
- **Variables CSS** : `app/globals.css` — `--logo-red`, `--brand`, gradients ; à étendre pour parité stricte avec Figma Dev Mode.
- **Composants** : `app/components/` — réutiliser tokens `figma` / `brand` pour nouveaux écrans.

## Définition de done UI

Voir plan produit (couleurs, typo, espacements, états, responsive, accessibilité WCAG AA).
