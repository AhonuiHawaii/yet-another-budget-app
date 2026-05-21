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

const md3Shape = {
  'radius-btn': '20px',
  'radius-btn-icon': '20px',
  'radius-btn-fab': '16px',
  'radius-card': '12px',
  'radius-chip': '8px',
  'radius-dialog': '28px',
  'radius-input': '4px',
  'radius-menu': '4px',
  'radius-snackbar': '4px',
  'radius-tooltip': '4px'
}

export const blueGreyDark = {
  dark: true,
  colors: {
    background: '#263238',
    surface: '#2E3C43',
    'surface-bright': '#37474F',
    'surface-light': '#2E3C43',
    'surface-variant': '#37474F',

    primary: '#B0BEC5',
    'primary-darken-1': '#90A4AE',
    secondary: '#78909C',
    'secondary-darken-1': '#607D8B',

    error: '#ef4444',
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',

    'on-background': '#ECEFF1',
    'on-surface': '#ECEFF1',
    'on-surface-variant': '#B0BEC5',
    'on-primary': '#263238',
    'on-secondary': '#263238',
    'on-error': '#ffffff',
    'on-info': '#ffffff',
    'on-success': '#ffffff',
    'on-warning': '#1a1a1a'
  },
  variables: shape
}

export const blueGreyLight = {
  dark: false,
  colors: {
    background: '#ECEFF1',
    surface: '#ffffff',
    'surface-bright': '#ffffff',
    'surface-light': '#ECEFF1',
    'surface-variant': '#CFD8DC',

    primary: '#546E7A',
    'primary-darken-1': '#455A64',
    secondary: '#607D8B',
    'secondary-darken-1': '#546E7A',

    error: '#ef4444',
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',

    'on-background': '#263238',
    'on-surface': '#263238',
    'on-surface-variant': '#455A64',
    'on-primary': '#ffffff',
    'on-secondary': '#ffffff',
    'on-error': '#ffffff',
    'on-info': '#ffffff',
    'on-success': '#ffffff',
    'on-warning': '#1a1a1a'
  },
  variables: shape
}

export const pastelDark = {
  dark: true,
  colors: {
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

    primary: '#FFAFD0',
    'on-primary': '#5E1139',
    'primary-container': '#7C2850',
    'on-primary-container': '#FFD8E8',
    'primary-darken-1': '#E694B9',

    secondary: '#E5BDD0',
    'on-secondary': '#432635',
    'secondary-container': '#5C3C4B',
    'on-secondary-container': '#FFD8E8',
    'secondary-darken-1': '#C9A2B5',

    tertiary: '#F1B8A6',
    'on-tertiary': '#4B281C',
    'tertiary-container': '#663D30',
    'on-tertiary-container': '#FFDBD0',

    error: '#FFB4AB',
    'on-error': '#690005',
    'error-container': '#93000A',
    'on-error-container': '#FFDAD6',

    info: '#A7C7F9',
    success: '#A8DDB5',
    warning: '#F8D48B',

    'on-background': '#EFE0E7',
    'on-surface': '#EFE0E7',
    'on-surface-variant': '#D5C2CA',
    outline: '#9E8C94',
    'outline-variant': '#51434B',
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#EFE0E7',
    'inverse-on-surface': '#362E34',
    'inverse-primary': '#9B4269',
    'on-info': '#173050',
    'on-success': '#183823',
    'on-warning': '#3E2D00'
  },
  variables: md3Shape
}

export const pastelLight = {
  dark: false,
  colors: {
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

    primary: '#9B4269',
    'on-primary': '#FFFFFF',
    'primary-container': '#FFD8E8',
    'on-primary-container': '#3D0022',
    'primary-darken-1': '#7C2850',

    secondary: '#765464',
    'on-secondary': '#FFFFFF',
    'secondary-container': '#FFD8E8',
    'on-secondary-container': '#2C1220',
    'secondary-darken-1': '#5C3C4B',

    tertiary: '#805343',
    'on-tertiary': '#FFFFFF',
    'tertiary-container': '#FFDBD0',
    'on-tertiary-container': '#321207',

    error: '#BA1A1A',
    'on-error': '#FFFFFF',
    'error-container': '#FFDAD6',
    'on-error-container': '#410002',

    info: '#3865A8',
    success: '#3D7A4E',
    warning: '#8A6500',

    'on-background': '#201A1E',
    'on-surface': '#201A1E',
    'on-surface-variant': '#51434B',
    outline: '#83737B',
    'outline-variant': '#D5C2CA',
    shadow: '#000000',
    scrim: '#000000',
    'inverse-surface': '#362E34',
    'inverse-on-surface': '#FAEEF4',
    'inverse-primary': '#FFAFD0',
    'on-info': '#FFFFFF',
    'on-success': '#FFFFFF',
    'on-warning': '#FFFFFF'
  },
  variables: md3Shape
}

const themes = { blueGreyDark, blueGreyLight, pastelDark, pastelLight }

export default themes
