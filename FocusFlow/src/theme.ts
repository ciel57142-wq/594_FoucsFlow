import { Platform, TextStyle } from 'react-native';

/**
 * FocusFlow visual language: "the day ledger".
 *
 * The app is a field notebook for a day of work, so the palette is pine-ink and
 * paper rather than the usual productivity-app blue, numbers are always set in a
 * tabular monospace face (they are ledger entries, not prose), and the one loud
 * element is the capacity meter on Today.
 */
export const colors = {
  ink: '#16211F',        // primary text, dark surfaces
  inkSoft: '#4A5A56',    // secondary text
  inkFaint: '#8A9793',   // tertiary text, hairlines
  paper: '#F2F4F2',      // app background
  card: '#FFFFFF',
  rule: '#DFE5E1',       // hairlines, ticks
  pine: '#0F6E63',       // primary action / done
  pineSoft: '#E2F0ED',   // primary tint
  clay: '#C2543D',       // overdue, over capacity
  claySoft: '#F7E6E1',
  mustard: '#C08A1E',    // at risk, tight
  mustardSoft: '#F8EEDA',
  slate: '#3C5A72',      // informational accents (likelihood, model)
  slateSoft: '#E5EDF3',
} as const;

export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' })!;

export const type = {
  screenTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.4, color: colors.ink } as TextStyle,
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  } as TextStyle,
  body: { fontSize: 16, color: colors.ink } as TextStyle,
  bodySoft: { fontSize: 14, color: colors.inkSoft } as TextStyle,
  caption: { fontSize: 12, color: colors.inkFaint } as TextStyle,
  /** Every number in the app is set in the utility face. */
  figure: { fontFamily: mono, fontSize: 14, color: colors.ink } as TextStyle,
  figureLarge: { fontFamily: mono, fontSize: 30, color: colors.ink, letterSpacing: -1 } as TextStyle,
  figureSmall: { fontFamily: mono, fontSize: 11, color: colors.inkSoft } as TextStyle,
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 6, md: 10, lg: 14, pill: 999 };

export const shadow = {
  card: Platform.select({
    ios: { shadowColor: '#16211F', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 2 },
    default: {},
  })!,
};
