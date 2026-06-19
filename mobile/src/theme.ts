// Central design tokens so the whole app stays visually consistent.
export const colors = {
  primary: '#0F766E', // teal-700 (matches the PRD accent)
  primaryDark: '#115E59',
  primaryLight: '#CCFBF1',
  accent: '#14B8A6',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  danger: '#DC2626',
  success: '#16A34A',
  white: '#FFFFFF',
  star: '#F59E0B',
};

export const spacing = (n: number) => n * 4;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const shadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
};
