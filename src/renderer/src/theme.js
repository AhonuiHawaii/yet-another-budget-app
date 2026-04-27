const base = {
  dark: true,
  colors: {
    background: '#0a0a0f',
    surface: '#14141c',
    'surface-variant': '#1e1e28',
    secondary: '#10b981',
    'secondary-darken-1': '#059669',
    accent: '#f43f5e',
    error: '#ef4444',
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b'
  }
}

const makeTheme = (primary, primaryDarken1) => ({
  ...base,
  colors: {
    ...base.colors,
    primary,
    'primary-darken-1': primaryDarken1
  }
})

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
export const darkLightGreen = makeTheme('#8BC34A', '#7CB342')
export const darkLime = makeTheme('#CDDC39', '#C0CA33')
export const darkYellow = makeTheme('#FFEB3B', '#FDD835')
export const darkAmber = makeTheme('#FFC107', '#FFB300')
export const darkOrange = makeTheme('#FF9800', '#FB8C00')
export const darkDeepOrange = makeTheme('#FF5722', '#F4511E')
export const darkBrown = makeTheme('#795548', '#6D4C41')
export const darkGrey = makeTheme('#9E9E9E', '#757575')
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
