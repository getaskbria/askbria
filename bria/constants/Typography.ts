/**
 * Bria Design System — Typography
 */

export const FontFamily = {
  display: 'Georgia',           // headlines, eyebrow titles (DM Serif Display in production)
  sans: undefined,              // system default (-apple-system, Roboto, etc.)
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  '2xl': 28,
  '3xl': 34,
} as const;

export const LineHeight = {
  tight:  1.2,
  normal: 1.5,
  loose:  1.75,
} as const;
