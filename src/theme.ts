import { createTheme, rem } from '@mantine/core';

/**
 * Legacy (pre-redesign) theme. Used when THEME_GLASSMORPHISM_ENABLE !== 'true'.
 * Kept byte-compatible with the prior inline theme in App.tsx.
 */
export const legacyTheme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  defaultRadius: 'md',
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
  components: {
    Modal: {
      defaultProps: {
        lockScroll: false,
      },
    },
  },
});

/**
 * Glassmorphism dark theme. Tokens mirror `:root[data-mantine-color-scheme="dark"]`
 * custom properties declared in index.css. Activated by THEME_GLASSMORPHISM_ENABLE === 'true'.
 */
export const glassTheme = createTheme({
  primaryColor: 'teal',
  primaryShade: { light: 6, dark: 5 },
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  defaultRadius: 'lg',
  radius: {
    xs: rem(8),
    sm: rem(12),
    md: rem(14),
    lg: rem(20),
    xl: rem(999),
  },
  colors: {
    teal: [
      '#ECFDF5',
      '#D1FAE5',
      '#A7F3D0',
      '#6EE7B7',
      '#34D399',
      '#10B981',
      '#059669',
      '#047857',
      '#065F46',
      '#064E3B',
    ],
    dark: [
      '#E5EAF2',
      '#C4CDDD',
      '#94A3B8',
      '#64748B',
      '#475569',
      '#334155',
      '#1E293B',
      '#172033',
      '#0A1628',
      '#05101F',
    ],
  },
  other: {
    glass: 'rgba(255,255,255,0.03)',
    glassBorder: 'rgba(255,255,255,0.06)',
    glassRaised: 'rgba(255,255,255,0.06)',
    blurBg: 'blur(20px) saturate(140%)',
    gradBalance: 'linear-gradient(135deg,#065F46 0%,#10B981 55%,#34D399 100%)',
    gradCTA: 'linear-gradient(90deg,#10B981 0%,#0891B2 100%)',
  },
  components: {
    Modal: {
      defaultProps: { lockScroll: false, radius: 'lg' },
      classNames: { content: 'shm-glass', overlay: 'shm-modal-overlay' },
    },
    Card: {
      defaultProps: { radius: 'lg' },
      classNames: { root: 'shm-glass' },
    },
    Paper: {
      defaultProps: { radius: 'lg' },
      classNames: { root: 'shm-glass' },
    },
    Button: { defaultProps: { radius: 'md' } },
  },
});
