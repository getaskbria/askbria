/**
 * Bria Design System — 8px grid spacing
 */

export const Spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  7:  28,
  8:  32,
  10: 40,
  12: 48,
} as const;

export const Radius = {
  sm:   8,
  md:   14,   // cards
  lg:   18,   // large cards
  pill: 999,  // buttons, chips
} as const;

export const Shadow = {
  card: {
    shadowColor: '#2C2B27',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
  subtle: {
    shadowColor: '#2C2B27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
} as const;
