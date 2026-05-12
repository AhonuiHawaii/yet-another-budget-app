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

const themes = { blueGreyDark, blueGreyLight }

export default themes
