import { fromJS } from 'immutable'
import { handleActions } from 'redux-actions'
import { FETCH_THEME } from 'actions/types'

const initialState = {
  loading: false,

  siteTitle: '',
  customLogo: false,
  customLogoUrl: '',
  customFavicon: false,
  customFaviconUrl: '',

  autoDark: false,
  themeLight: 'light',
  themeDark: 'noctis',

  headerBG: '#42464d',
  headerPrimary: '#f6f7f8',
  primary: '#606771',
  secondary: '#f7f8fa',
  tertiary: '#e74c3c',
  quaternary: '#e6e7e8'
}

const reducer = handleActions(
  {
    [FETCH_THEME.PENDING]: state => ({
      ...state,
      loading: true
    }),

    [FETCH_THEME.SUCCESS]: (state, action) => {
      const theme = action.response.theme
      if (!theme) return { ...state, loading: false }
      return {
        ...state,
        loading: false,

        siteTitle: fromJS(theme.siteTitle),
        customLogo: fromJS(theme.customLogo),
        customLogoUrl: fromJS(theme.customLogoUrl),
        customFavicon: fromJS(theme.customFavicon),
        customFaviconUrl: fromJS(theme.customFaviconUrl),

        autoDark: fromJS(theme.autoDark),
        themeLight: fromJS(theme.themeLight),
        themeDark: fromJS(theme.themeDark),

        headerBG: fromJS(theme.headerBG),
        headerPrimary: fromJS(theme.headerPrimary),
        primary: fromJS(theme.primary),
        secondary: fromJS(theme.secondary),
        tertiary: fromJS(theme.tertiary),
        quaternary: fromJS(theme.quaternary)
      }
    },

    [FETCH_THEME.ERROR]: state => ({
      ...state,
      loading: false
    })
  },
  initialState
)

export default reducer
