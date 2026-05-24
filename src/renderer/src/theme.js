// MD3 state layer opacities — Vuetify overlays these on top of base colors per interaction state
// Normal = base color tokens below; Hover = base + 8% overlay; Active/Pressed = base + 12% overlay
const stateVars = {
  'hover-opacity': 0.08,
  'focus-opacity': 0.12,
  'selected-opacity': 0.08,
  'activated-opacity': 0.12,
  'pressed-opacity': 0.12,
  'dragged-opacity': 0.16,
  'disabled-opacity': 0.38,
  'idle-opacity': 0.04,
  'border-opacity': 0.12,
  'high-emphasis-opacity': 1,
  'medium-emphasis-opacity': 0.74
}

const shape = {
  'radius-btn': '4px',
  'radius-btn-icon': '4px',
  'radius-btn-fab': '50%',
  'radius-card': '8px',
  'radius-chip': '6px',
  'radius-dialog': '12px',
  'radius-input': '4px',
  'radius-menu': '4px',
  'radius-snackbar': '4px',
  'radius-tooltip': '4px'
}

// ─── Blue Grey Dark ────────────────────────────────────────────────────────────
export const blueGreyDark = {
  dark: true,
  colors: {
    // Surface system
    background: '#263238',
    surface: '#2E3C43',
    'surface-dim': '#1C2B30',
    'surface-bright': '#455A64',
    'surface-light': '#2E3C43',
    'surface-variant': '#37474F',
    'surface-container-lowest': '#1A282E',
    'surface-container-low': '#263238',
    'surface-container': '#2E3C43',
    'surface-container-high': '#37474F',
    'surface-container-highest': '#455A64',

    // Primary — Blue Grey 200
    // Normal: #B0BEC5 | Hover: #B0BEC5 + on-primary@8% | Active: #B0BEC5 + on-primary@12%
    primary: '#B0BEC5',
    'on-primary': '#1C3340',
    'primary-container': '#455A64',
    'on-primary-container': '#ECEFF1',
    'primary-darken-1': '#90A4AE',

    // Secondary — Blue Grey 400
    // Normal: #78909C | Hover: #78909C + on-secondary@8% | Active: #78909C + on-secondary@12%
    secondary: '#78909C',
    'on-secondary': '#1C2F38',
    'secondary-container': '#37474F',
    'on-secondary-container': '#CFD8DC',
    'secondary-darken-1': '#607D8B',

    // Tertiary — muted teal complement
    // Normal: #80CBC4 | Hover: #80CBC4 + on-tertiary@8% | Active: #80CBC4 + on-tertiary@12%
    tertiary: '#80CBC4',
    'on-tertiary': '#003733',
    'tertiary-container': '#1E4E4B',
    'on-tertiary-container': '#B2DFDB',

    // Error
    // Normal: #FFB4AB | Hover: #FFB4AB + on-error@8% | Active: #FFB4AB + on-error@12%
    error: '#FFB4AB',
    'on-error': '#690005',
    'error-container': '#93000A',
    'on-error-container': '#FFDAD6',

    // Semantic status
    // Normal: token below | Hover: token + on-token@8% | Active: token + on-token@12%
    info: '#A7C7F9',
    'on-info': '#173050',
    'info-container': '#1E4F86',
    'on-info-container': '#D6E3FF',
    success: '#A8DDB5',
    'on-success': '#183823',
    'success-container': '#1E5C2F',
    'on-success-container': '#C8EDD5',
    warning: '#F8D48B',
    'on-warning': '#3E2D00',
    'warning-container': '#5A4200',
    'on-warning-container': '#FDEECB',

    // On-colors
    'on-background': '#ECEFF1',
    'on-surface': '#ECEFF1',
    'on-surface-variant': '#B0BEC5',

    // Outline — used by v-divider, v-text-field border, v-chip border
    outline: '#607D8B',
    'outline-variant': '#37474F',

    // Special
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#ECEFF1',
    'inverse-on-surface': '#263238',
    'inverse-primary': '#546E7A'
  },
  variables: { ...stateVars, ...shape }
}

// ─── Blue Grey Light ───────────────────────────────────────────────────────────
export const blueGreyLight = {
  dark: false,
  colors: {
    // Surface system
    background: '#ECEFF1',
    surface: '#FFFFFF',
    'surface-dim': '#D6DDE1',
    'surface-bright': '#FFFFFF',
    'surface-light': '#ECEFF1',
    'surface-variant': '#CFD8DC',
    'surface-container-lowest': '#FFFFFF',
    'surface-container-low': '#F4F7F9',
    'surface-container': '#EBF0F3',
    'surface-container-high': '#E0E7EB',
    'surface-container-highest': '#D4DCE1',

    // Primary — Blue Grey 600
    // Normal: #546E7A | Hover: #546E7A + on-primary@8% | Active: #546E7A + on-primary@12%
    primary: '#546E7A',
    'on-primary': '#FFFFFF',
    'primary-container': '#CFD8DC',
    'on-primary-container': '#1A2C34',
    'primary-darken-1': '#455A64',

    // Secondary — Blue Grey 500
    // Normal: #607D8B | Hover: #607D8B + on-secondary@8% | Active: #607D8B + on-secondary@12%
    secondary: '#607D8B',
    'on-secondary': '#FFFFFF',
    'secondary-container': '#D5E3E9',
    'on-secondary-container': '#1F3039',
    'secondary-darken-1': '#546E7A',

    // Tertiary — muted teal complement
    // Normal: #00796B | Hover: #00796B + on-tertiary@8% | Active: #00796B + on-tertiary@12%
    tertiary: '#00796B',
    'on-tertiary': '#FFFFFF',
    'tertiary-container': '#B2DFDB',
    'on-tertiary-container': '#003733',

    // Error
    // Normal: #BA1A1A | Hover: #BA1A1A + on-error@8% | Active: #BA1A1A + on-error@12%
    error: '#BA1A1A',
    'on-error': '#FFFFFF',
    'error-container': '#FFDAD6',
    'on-error-container': '#410002',

    // Semantic status
    info: '#3865A8',
    'on-info': '#FFFFFF',
    'info-container': '#D6E3FF',
    'on-info-container': '#0D1E40',
    success: '#3D7A4E',
    'on-success': '#FFFFFF',
    'success-container': '#C8EDD5',
    'on-success-container': '#0A2116',
    warning: '#8A6500',
    'on-warning': '#FFFFFF',
    'warning-container': '#FDEECB',
    'on-warning-container': '#2A1D00',

    // On-colors
    'on-background': '#263238',
    'on-surface': '#263238',
    'on-surface-variant': '#455A64',

    // Outline
    outline: '#78909C',
    'outline-variant': '#B0BEC5',

    // Special
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#2E3C43',
    'inverse-on-surface': '#ECEFF1',
    'inverse-primary': '#B0BEC5'
  },
  variables: { ...stateVars, ...shape }
}

// ─── Pastel Dark ───────────────────────────────────────────────────────────────
export const pastelPinkDark = {
  dark: true,
  colors: {
    // Surface system
    background: '#181116',
    surface: '#181116',
    'surface-dim': '#181116',
    'surface-bright': '#40373E',
    'surface-light': '#24191F',
    'surface-variant': '#51434B',
    'surface-container-lowest': '#130C11',
    'surface-container-low': '#21191F',
    'surface-container': '#251D23',
    'surface-container-high': '#30272D',
    'surface-container-highest': '#3B3138',

    // Primary — pastel pink
    // Normal: #FFAFD0 | Hover: #FFAFD0 + on-primary@8% | Active: #FFAFD0 + on-primary@12%
    primary: '#FFAFD0',
    'on-primary': '#5E1139',
    'primary-container': '#7C2850',
    'on-primary-container': '#FFD8E8',
    'primary-darken-1': '#E694B9',

    // Secondary — dusty mauve
    // Normal: #E5BDD0 | Hover: #E5BDD0 + on-secondary@8% | Active: #E5BDD0 + on-secondary@12%
    secondary: '#E5BDD0',
    'on-secondary': '#432635',
    'secondary-container': '#5C3C4B',
    'on-secondary-container': '#FFD8E8',
    'secondary-darken-1': '#C9A2B5',

    // Tertiary — warm peach
    // Normal: #F1B8A6 | Hover: #F1B8A6 + on-tertiary@8% | Active: #F1B8A6 + on-tertiary@12%
    tertiary: '#F1B8A6',
    'on-tertiary': '#4B281C',
    'tertiary-container': '#663D30',
    'on-tertiary-container': '#FFDBD0',

    // Error
    error: '#FFB4AB',
    'on-error': '#690005',
    'error-container': '#93000A',
    'on-error-container': '#FFDAD6',

    // Semantic status
    info: '#A7C7F9',
    'on-info': '#173050',
    'info-container': '#1E4F86',
    'on-info-container': '#D6E3FF',
    success: '#A8DDB5',
    'on-success': '#183823',
    'success-container': '#1E5C2F',
    'on-success-container': '#C8EDD5',
    warning: '#F8D48B',
    'on-warning': '#3E2D00',
    'warning-container': '#5A4200',
    'on-warning-container': '#FDEECB',

    // On-colors
    'on-background': '#EFE0E7',
    'on-surface': '#EFE0E7',
    'on-surface-variant': '#D5C2CA',

    // Outline
    outline: '#9E8C94',
    'outline-variant': '#51434B',

    // Special
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#EFE0E7',
    'inverse-on-surface': '#362E34',
    'inverse-primary': '#9B4269'
  },
  variables: { ...stateVars, ...shape }
}

// ─── Pastel Light ──────────────────────────────────────────────────────────────
export const pastelPinkLight = {
  dark: false,
  colors: {
    // Surface system
    background: '#FFF8FA',
    surface: '#FFF8FA',
    'surface-dim': '#E5D6DD',
    'surface-bright': '#FFF8FA',
    'surface-light': '#FFF0F6',
    'surface-variant': '#F2DDE6',
    'surface-container-lowest': '#FFFFFF',
    'surface-container-low': '#FFF0F6',
    'surface-container': '#FCEAF2',
    'surface-container-high': '#F6E4EC',
    'surface-container-highest': '#F0DEE6',

    // Primary — rose pink
    // Normal: #9B4269 | Hover: #9B4269 + on-primary@8% | Active: #9B4269 + on-primary@12%
    primary: '#9B4269',
    'on-primary': '#FFFFFF',
    'primary-container': '#FFD8E8',
    'on-primary-container': '#3D0022',
    'primary-darken-1': '#7C2850',

    // Secondary — muted mauve
    // Normal: #765464 | Hover: #765464 + on-secondary@8% | Active: #765464 + on-secondary@12%
    secondary: '#765464',
    'on-secondary': '#FFFFFF',
    'secondary-container': '#FFD8E8',
    'on-secondary-container': '#2C1220',
    'secondary-darken-1': '#5C3C4B',

    // Tertiary — warm terra cotta
    // Normal: #805343 | Hover: #805343 + on-tertiary@8% | Active: #805343 + on-tertiary@12%
    tertiary: '#805343',
    'on-tertiary': '#FFFFFF',
    'tertiary-container': '#FFDBD0',
    'on-tertiary-container': '#321207',

    // Error
    error: '#BA1A1A',
    'on-error': '#FFFFFF',
    'error-container': '#FFDAD6',
    'on-error-container': '#410002',

    // Semantic status
    info: '#3865A8',
    'on-info': '#FFFFFF',
    'info-container': '#D6E3FF',
    'on-info-container': '#0D1E40',
    success: '#3D7A4E',
    'on-success': '#FFFFFF',
    'success-container': '#C8EDD5',
    'on-success-container': '#0A2116',
    warning: '#8A6500',
    'on-warning': '#FFFFFF',
    'warning-container': '#FDEECB',
    'on-warning-container': '#2A1D00',

    // On-colors
    'on-background': '#201A1E',
    'on-surface': '#201A1E',
    'on-surface-variant': '#51434B',

    // Outline
    outline: '#83737B',
    'outline-variant': '#D5C2CA',

    // Special
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#362E34',
    'inverse-on-surface': '#FAEEF4',
    'inverse-primary': '#FFAFD0'
  },
  variables: { ...stateVars, ...shape }
}

// ─── Black & White Dark ────────────────────────────────────────────────────────
export const blackWhiteDark = {
  dark: true,
  colors: {
    // Surface system
    background: '#000000',
    surface: '#1E1E1E',
    'surface-dim': '#000000',
    'surface-bright': '#424242',
    'surface-light': '#212121',
    'surface-variant': '#424242',
    'surface-container-lowest': '#000000',
    'surface-container-low': '#121212',
    'surface-container': '#212121',
    'surface-container-high': '#424242',
    'surface-container-highest': '#616161',

    // Primary — white on black
    // Normal: #FFFFFF | Hover: #FFFFFF + on-primary@8% | Active: #FFFFFF + on-primary@12%
    primary: '#FFFFFF',
    'on-primary': '#000000',
    'primary-container': '#424242',
    'on-primary-container': '#FFFFFF',
    'primary-darken-1': '#BDBDBD',

    // Secondary — light grey
    // Normal: #E0E0E0 | Hover: #E0E0E0 + on-secondary@8% | Active: #E0E0E0 + on-secondary@12%
    secondary: '#E0E0E0',
    'on-secondary': '#000000',
    'secondary-container': '#424242',
    'on-secondary-container': '#FFFFFF',
    'secondary-darken-1': '#BDBDBD',

    // Tertiary — mid grey
    // Normal: #BDBDBD | Hover: #BDBDBD + on-tertiary@8% | Active: #BDBDBD + on-tertiary@12%
    tertiary: '#BDBDBD',
    'on-tertiary': '#000000',
    'tertiary-container': '#616161',
    'on-tertiary-container': '#FFFFFF',

    // Error
    error: '#FFB4AB',
    'on-error': '#690005',
    'error-container': '#93000A',
    'on-error-container': '#FFDAD6',

    // Semantic status
    info: '#A7C7F9',
    'on-info': '#173050',
    'info-container': '#1E4F86',
    'on-info-container': '#D6E3FF',
    success: '#A8DDB5',
    'on-success': '#183823',
    'success-container': '#1E5C2F',
    'on-success-container': '#C8EDD5',
    warning: '#F8D48B',
    'on-warning': '#3E2D00',
    'warning-container': '#5A4200',
    'on-warning-container': '#FDEECB',

    // On-colors
    'on-background': '#FFFFFF',
    'on-surface': '#FFFFFF',
    'on-surface-variant': '#E0E0E0',

    // Outline
    outline: '#9E9E9E',
    'outline-variant': '#424242',

    // Special
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#FFFFFF',
    'inverse-on-surface': '#212121',
    'inverse-primary': '#616161'
  },
  variables: { ...stateVars, ...shape }
}

// ─── Black & White Light ───────────────────────────────────────────────────────
export const blackWhiteLight = {
  dark: false,
  colors: {
    // Surface system
    background: '#F5F5F5',
    surface: '#FFFFFF',
    'surface-dim': '#E0E0E0',
    'surface-bright': '#FFFFFF',
    'surface-light': '#FAFAFA',
    'surface-variant': '#E0E0E0',
    'surface-container-lowest': '#FFFFFF',
    'surface-container-low': '#FAFAFA',
    'surface-container': '#F5F5F5',
    'surface-container-high': '#EEEEEE',
    'surface-container-highest': '#E0E0E0',

    // Primary — black on white
    // Normal: #000000 | Hover: #000000 + on-primary@8% | Active: #000000 + on-primary@12%
    primary: '#000000',
    'on-primary': '#FFFFFF',
    'primary-container': '#212121',
    'on-primary-container': '#FFFFFF',
    'primary-darken-1': '#000000',

    // Secondary — dark grey
    // Normal: #424242 | Hover: #424242 + on-secondary@8% | Active: #424242 + on-secondary@12%
    secondary: '#424242',
    'on-secondary': '#FFFFFF',
    'secondary-container': '#E0E0E0',
    'on-secondary-container': '#000000',
    'secondary-darken-1': '#212121',

    // Tertiary — mid grey
    // Normal: #616161 | Hover: #616161 + on-tertiary@8% | Active: #616161 + on-tertiary@12%
    tertiary: '#616161',
    'on-tertiary': '#FFFFFF',
    'tertiary-container': '#EEEEEE',
    'on-tertiary-container': '#000000',

    // Error
    error: '#BA1A1A',
    'on-error': '#FFFFFF',
    'error-container': '#FFDAD6',
    'on-error-container': '#410002',

    // Semantic status
    info: '#3865A8',
    'on-info': '#FFFFFF',
    'info-container': '#D6E3FF',
    'on-info-container': '#0D1E40',
    success: '#3D7A4E',
    'on-success': '#FFFFFF',
    'success-container': '#C8EDD5',
    'on-success-container': '#0A2116',
    warning: '#8A6500',
    'on-warning': '#FFFFFF',
    'warning-container': '#FDEECB',
    'on-warning-container': '#2A1D00',

    // On-colors
    'on-background': '#000000',
    'on-surface': '#000000',
    'on-surface-variant': '#424242',

    // Outline
    outline: '#757575',
    'outline-variant': '#BDBDBD',

    // Special
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#212121',
    'inverse-on-surface': '#FFFFFF',
    'inverse-primary': '#E0E0E0'
  },
  variables: { ...stateVars, ...shape }
}

const themes = {
  blueGreyDark,
  blueGreyLight,
  pastelPinkDark,
  pastelPinkLight,
  blackWhiteDark,
  blackWhiteLight
}

export default themes
