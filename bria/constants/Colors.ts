/**
 * Bria Design System — Color Tokens
 * Matches the CSS variables in brighthouse.html
 */

export const Colors = {
  charcoal:   '#2C2B27',  // primary text, dark CTAs, hero backgrounds
  gold:       '#C8994A',  // accent, premium markers, primary brand color
  goldDark:   '#8B6420',  // gold text on light backgrounds
  goldLight:  '#F5E9CC',  // premium tags, subtle accents
  cream:      '#FAF8F3',  // warm app background
  warmWhite:  '#FFFEF9',  // card surfaces
  sage:       '#6B8F71',  // success, "with cleaner" mode
  sageLight:  '#EAF0EB',
  blue:       '#3A6B8A',  // info, "DIY" mode
  blueSoft:   '#EAF0F5',
  red:        '#C0452A',  // urgent, low alerts
  redSoft:    '#F9EDEA',
  mid:        '#6B6860',  // secondary text
  soft:       '#B8B5AC',  // tertiary text
  border:     'rgba(44,43,39,0.10)',
} as const;

export type ColorKey = keyof typeof Colors;
