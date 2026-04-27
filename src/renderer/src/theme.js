const base = {
  dark: true,
  colors: {
    /* ── Surfaces ─────────────────────────────────────── */
    background: '#0a0a0f',
    surface: '#14141c',
    'surface-bright': '#2a2a38',
    'surface-light': '#1e1e28',
    'surface-variant': '#1e1e28',

    /* ── Semantic ─────────────────────────────────────── */
    secondary: '#10b981',
    'secondary-darken-1': '#059669',
    error: '#ef4444',
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',

    /* ── On-colors (contrast text) ────────────────────── */
    'on-background': '#dededf',
    'on-surface': '#dededf',
    'on-surface-variant': '#c5c5cc',
    'on-secondary': '#ffffff',
    'on-error': '#ffffff',
    'on-info': '#ffffff',
    'on-success': '#ffffff',
    'on-warning': '#1a1a1a'
  }
}

/**
 * Per-component border-radius shape scale.
 * Vuetify injects these as CSS variables: --v-radius-btn, --v-radius-card, etc.
 * Override per-theme by passing a custom shape object to makeTheme().
 */
const defaultShape = {
  'radius-btn': '0px',
  'radius-btn-icon': '0px',
  'radius-btn-fab': '0px',
  'radius-card': '12px',
  'radius-chip': '8px',
  'radius-dialog': '28px',
  'radius-input': '4px',
  'radius-menu': '4px',
  'radius-snackbar': '4px',
  'radius-tooltip': '4px'
}

/**
 * Factory that stamps out a complete dark theme variant.
 *
 * @param {string} primary        – hex for --v-theme-primary
 * @param {string} primaryDarken  – hex for --v-theme-primary-darken-1
 * @param {string} [onPrimary]    – hex for --v-theme-on-primary (default: '#ffffff')
 * @param {object} [shape]        – per-component radius overrides (default: defaultShape)
 */
const makeTheme = (primary, primaryDarken, onPrimary = '#ffffff', shape = defaultShape) => ({
  ...base,
  colors: {
    ...base.colors,
    primary,
    'primary-darken-1': primaryDarken,
    'on-primary': onPrimary
  },
  variables: shape
})

/*  Dark-on-light primaries need dark contrast text  */
const DARK_TEXT = '#1a1a1a'

export const darkRed = makeTheme('#F44336', '#E53935')
export const darkPink = makeTheme('#E91E63', '#D81B60')
export const darkPurple = makeTheme('#9C27B0', '#8E24AA')
export const darkDeepPurple = makeTheme('#673AB7', '#5E35B1')
export const darkIndigo = makeTheme('#3F51B5', '#3949AB')
export const darkBlue = makeTheme('#2196F3', '#1E88E5')
export const darkLightBlue = makeTheme('#03A9F4', '#039BE5')
export const darkCyan = makeTheme('#00BCD4', '#00ACC1')
export const darkTeal = makeTheme('#009688', '#00897B')
export const darkGreen = makeTheme('#4CAF50', '#43A047')
export const darkLightGreen = makeTheme('#8BC34A', '#7CB342', DARK_TEXT)
export const darkLime = makeTheme('#CDDC39', '#C0CA33', DARK_TEXT)
export const darkYellow = makeTheme('#FFEB3B', '#FDD835', DARK_TEXT)
export const darkAmber = makeTheme('#FFC107', '#FFB300', DARK_TEXT)
export const darkOrange = makeTheme('#FF9800', '#FB8C00', DARK_TEXT)
export const darkDeepOrange = makeTheme('#FF5722', '#F4511E')
export const darkBrown = makeTheme('#795548', '#6D4C41')
export const darkGrey = makeTheme('#9E9E9E', '#757575', DARK_TEXT)
export const darkBlueGrey = makeTheme('#607D8B', '#546E7A')

const themes = {
  darkRed,
  darkPink,
  darkPurple,
  darkDeepPurple,
  darkIndigo,
  darkBlue,
  darkLightBlue,
  darkCyan,
  darkTeal,
  darkGreen,
  darkLightGreen,
  darkLime,
  darkYellow,
  darkAmber,
  darkOrange,
  darkDeepOrange,
  darkBrown,
  darkGrey,
  darkBlueGrey
}

export default themes
