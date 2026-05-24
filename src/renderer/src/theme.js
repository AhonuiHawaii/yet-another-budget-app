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

// ─── Pastel Blue Dark ──────────────────────────────────────────────────────────
export const pastelBlueDark = {
  dark: true,
  colors: {
    // Surface system
    background: '#101418',
    surface: '#101418',
    'surface-dim': '#101418',
    'surface-bright': '#363A44',
    'surface-light': '#1A1E28',
    'surface-variant': '#42485B',
    'surface-container-lowest': '#0B0E14',
    'surface-container-low': '#181C22',
    'surface-container': '#1D2029',
    'surface-container-high': '#272B34',
    'surface-container-highest': '#32363F',

    // Primary — airy pastel blue
    // Normal: #ADC6FF | Hover: #ADC6FF + on-primary@8% | Active: #ADC6FF + on-primary@12%
    primary: '#ADC6FF',
    'on-primary': '#1A3461',
    'primary-container': '#35507F',
    'on-primary-container': '#D6E4FF',
    'primary-darken-1': '#8AABF0',

    // Secondary — soft steel blue-grey
    // Normal: #BEC6DC | Hover: #BEC6DC + on-secondary@8% | Active: #BEC6DC + on-secondary@12%
    secondary: '#BEC6DC',
    'on-secondary': '#283141',
    'secondary-container': '#3E4759',
    'on-secondary-container': '#DAE2FA',
    'secondary-darken-1': '#A5AEBF',

    // Tertiary — pale lavender complement
    // Normal: #D6BAFF | Hover: #D6BAFF + on-tertiary@8% | Active: #D6BAFF + on-tertiary@12%
    tertiary: '#D6BAFF',
    'on-tertiary': '#3D2563',
    'tertiary-container': '#553E7A',
    'on-tertiary-container': '#EBDEFF',

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
    'on-background': '#E1E3F0',
    'on-surface': '#E1E3F0',
    'on-surface-variant': '#C3C7D9',

    // Outline
    outline: '#8D91A4',
    'outline-variant': '#42485B',

    // Special
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#E1E3F0',
    'inverse-on-surface': '#2D3040',
    'inverse-primary': '#4A6FA5'
  },
  variables: { ...stateVars, ...shape }
}

// ─── Pastel Blue Light ─────────────────────────────────────────────────────────
export const pastelBlueLight = {
  dark: false,
  colors: {
    // Surface system
    background: '#F5F8FF',
    surface: '#FAFCFF',
    'surface-dim': '#D8DBE9',
    'surface-bright': '#FAFCFF',
    'surface-light': '#EEF1FF',
    'surface-variant': '#DDE3F0',
    'surface-container-lowest': '#FFFFFF',
    'surface-container-low': '#F2F4FF',
    'surface-container': '#ECEEFF',
    'surface-container-high': '#E6E9F8',
    'surface-container-highest': '#E0E3F1',

    // Primary — medium blue
    // Normal: #4A6FA5 | Hover: #4A6FA5 + on-primary@8% | Active: #4A6FA5 + on-primary@12%
    primary: '#4A6FA5',
    'on-primary': '#FFFFFF',
    'primary-container': '#D6E4FF',
    'on-primary-container': '#001C47',
    'primary-darken-1': '#3A5C90',

    // Secondary — blue-grey
    // Normal: #565E74 | Hover: #565E74 + on-secondary@8% | Active: #565E74 + on-secondary@12%
    secondary: '#565E74',
    'on-secondary': '#FFFFFF',
    'secondary-container': '#DAE2FA',
    'on-secondary-container': '#131B2D',
    'secondary-darken-1': '#444C60',

    // Tertiary — soft lavender complement
    // Normal: #6E5A8A | Hover: #6E5A8A + on-tertiary@8% | Active: #6E5A8A + on-tertiary@12%
    tertiary: '#6E5A8A',
    'on-tertiary': '#FFFFFF',
    'tertiary-container': '#EBDEFF',
    'on-tertiary-container': '#261444',

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
    'on-background': '#191C22',
    'on-surface': '#191C22',
    'on-surface-variant': '#42485B',

    // Outline
    outline: '#73798B',
    'outline-variant': '#C3C7D9',

    // Special
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#2D3040',
    'inverse-on-surface': '#E9EAFF',
    'inverse-primary': '#ADC6FF'
  },
  variables: { ...stateVars, ...shape }
}

// ─── Pastel Green Dark ─────────────────────────────────────────────────────────
export const pastelGreenDark = {
  dark: true,
  colors: {
    // Surface system
    background: '#0F1510',
    surface: '#0F1510',
    'surface-dim': '#0F1510',
    'surface-bright': '#343A34',
    'surface-light': '#181F18',
    'surface-variant': '#3D4F3D',
    'surface-container-lowest': '#0A100B',
    'surface-container-low': '#171D17',
    'surface-container': '#1B221C',
    'surface-container-high': '#252C25',
    'surface-container-highest': '#303730',

    // Primary — airy pastel green
    // Normal: #A0D4B4 | Hover: #A0D4B4 + on-primary@8% | Active: #A0D4B4 + on-primary@12%
    primary: '#A0D4B4',
    'on-primary': '#003824',
    'primary-container': '#1F5438',
    'on-primary-container': '#C0EDD1',
    'primary-darken-1': '#7DBFA0',

    // Secondary — soft sage
    // Normal: #B8CCBA | Hover: #B8CCBA + on-secondary@8% | Active: #B8CCBA + on-secondary@12%
    secondary: '#B8CCBA',
    'on-secondary': '#243524',
    'secondary-container': '#3A4D3A',
    'on-secondary-container': '#D4EBD0',
    'secondary-darken-1': '#9EB5A0',

    // Tertiary — muted aqua complement
    // Normal: #A4CDD4 | Hover: #A4CDD4 + on-tertiary@8% | Active: #A4CDD4 + on-tertiary@12%
    tertiary: '#A4CDD4',
    'on-tertiary': '#0A3740',
    'tertiary-container': '#234E56',
    'on-tertiary-container': '#C0EAF0',

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
    'on-background': '#DDE5DD',
    'on-surface': '#DDE5DD',
    'on-surface-variant': '#BDC9BC',

    // Outline
    outline: '#879487',
    'outline-variant': '#3D4F3D',

    // Special
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#DDE5DD',
    'inverse-on-surface': '#2C322C',
    'inverse-primary': '#3A7A50'
  },
  variables: { ...stateVars, ...shape }
}

// ─── Pastel Green Light ────────────────────────────────────────────────────────
export const pastelGreenLight = {
  dark: false,
  colors: {
    // Surface system
    background: '#F4FAF4',
    surface: '#F9FCF9',
    'surface-dim': '#D4DAD4',
    'surface-bright': '#F9FCF9',
    'surface-light': '#EBF3EB',
    'surface-variant': '#D8E8D8',
    'surface-container-lowest': '#FFFFFF',
    'surface-container-low': '#EFF6EF',
    'surface-container': '#E9F2E9',
    'surface-container-high': '#E3ECE3',
    'surface-container-highest': '#DCE6DC',

    // Primary — medium green
    // Normal: #3A7A50 | Hover: #3A7A50 + on-primary@8% | Active: #3A7A50 + on-primary@12%
    primary: '#3A7A50',
    'on-primary': '#FFFFFF',
    'primary-container': '#C0EDD1',
    'on-primary-container': '#002112',
    'primary-darken-1': '#2A6840',

    // Secondary — sage green-grey
    // Normal: #526350 | Hover: #526350 + on-secondary@8% | Active: #526350 + on-secondary@12%
    secondary: '#526350',
    'on-secondary': '#FFFFFF',
    'secondary-container': '#D4EBD0',
    'on-secondary-container': '#101F10',
    'secondary-darken-1': '#3F5040',

    // Tertiary — muted teal complement
    // Normal: #3C6B72 | Hover: #3C6B72 + on-tertiary@8% | Active: #3C6B72 + on-tertiary@12%
    tertiary: '#3C6B72',
    'on-tertiary': '#FFFFFF',
    'tertiary-container': '#C0EAF0',
    'on-tertiary-container': '#00232A',

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
    'on-background': '#181D18',
    'on-surface': '#181D18',
    'on-surface-variant': '#3D4F3D',

    // Outline
    outline: '#6E7F6E',
    'outline-variant': '#BDC9BC',

    // Special
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#2C322C',
    'inverse-on-surface': '#EDF3ED',
    'inverse-primary': '#A0D4B4'
  },
  variables: { ...stateVars, ...shape }
}

// ─── Pastel Yellow Dark ────────────────────────────────────────────────────────
export const pastelYellowDark = {
  dark: true,
  colors: {
    // Surface system
    background: '#161410',
    surface: '#161410',
    'surface-dim': '#161410',
    'surface-bright': '#3D3929',
    'surface-light': '#211E14',
    'surface-variant': '#4C4733',
    'surface-container-lowest': '#110F0B',
    'surface-container-low': '#1E1B12',
    'surface-container': '#232016',
    'surface-container-high': '#2E2A1F',
    'surface-container-highest': '#393529',

    // Primary — warm amber-yellow
    // Normal: #EDD77A | Hover: #EDD77A + on-primary@8% | Active: #EDD77A + on-primary@12%
    primary: '#EDD77A',
    'on-primary': '#3A2E00',
    'primary-container': '#564500',
    'on-primary-container': '#FDEEA5',
    'primary-darken-1': '#D4BF5A',

    // Secondary — warm olive-gold
    // Normal: #CECA9A | Hover: #CECA9A + on-secondary@8% | Active: #CECA9A + on-secondary@12%
    secondary: '#CECA9A',
    'on-secondary': '#333111',
    'secondary-container': '#4B4825',
    'on-secondary-container': '#EBE6B5',
    'secondary-darken-1': '#B5B280',

    // Tertiary — warm amber-orange complement
    // Normal: #F0BC82 | Hover: #F0BC82 + on-tertiary@8% | Active: #F0BC82 + on-tertiary@12%
    tertiary: '#F0BC82',
    'on-tertiary': '#422C00',
    'tertiary-container': '#5E4000',
    'on-tertiary-container': '#FFDEAf',

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
    'on-background': '#EBE3CF',
    'on-surface': '#EBE3CF',
    'on-surface-variant': '#CFC9B0',

    // Outline
    outline: '#989370',
    'outline-variant': '#4C4733',

    // Special
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#EBE3CF',
    'inverse-on-surface': '#332F1F',
    'inverse-primary': '#6B5C00'
  },
  variables: { ...stateVars, ...shape }
}

// ─── Pastel Yellow Light ───────────────────────────────────────────────────────
export const pastelYellowLight = {
  dark: false,
  colors: {
    // Surface system
    background: '#FDFBF0',
    surface: '#FDFBF0',
    'surface-dim': '#E0D9C4',
    'surface-bright': '#FDFBF0',
    'surface-light': '#F8F4E4',
    'surface-variant': '#EDE8D2',
    'surface-container-lowest': '#FFFFFF',
    'surface-container-low': '#F8F5E2',
    'surface-container': '#F3EFDA',
    'surface-container-high': '#EDE9D3',
    'surface-container-highest': '#E7E3CD',

    // Primary — golden amber
    // Normal: #6B5C00 | Hover: #6B5C00 + on-primary@8% | Active: #6B5C00 + on-primary@12%
    primary: '#6B5C00',
    'on-primary': '#FFFFFF',
    'primary-container': '#FDEEA5',
    'on-primary-container': '#211B00',
    'primary-darken-1': '#564800',

    // Secondary — warm olive
    // Normal: #635D3E | Hover: #635D3E + on-secondary@8% | Active: #635D3E + on-secondary@12%
    secondary: '#635D3E',
    'on-secondary': '#FFFFFF',
    'secondary-container': '#EBE6B5',
    'on-secondary-container': '#1E1B03',
    'secondary-darken-1': '#4F4A2C',

    // Tertiary — warm amber-orange complement
    // Normal: #7A5500 | Hover: #7A5500 + on-tertiary@8% | Active: #7A5500 + on-tertiary@12%
    tertiary: '#7A5500',
    'on-tertiary': '#FFFFFF',
    'tertiary-container': '#FFDEAF',
    'on-tertiary-container': '#271900',

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
    'on-background': '#1E1C13',
    'on-surface': '#1E1C13',
    'on-surface-variant': '#4C4733',

    // Outline
    outline: '#7B7660',
    'outline-variant': '#CFC9B0',

    // Special
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#332F1F',
    'inverse-on-surface': '#F7F3E0',
    'inverse-primary': '#EDD77A'
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
  pastelBlueDark,
  pastelBlueLight,
  pastelGreenDark,
  pastelGreenLight,
  pastelYellowDark,
  pastelYellowLight,
  blackWhiteDark,
  blackWhiteLight
}

export default themes
