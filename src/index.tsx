import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import rtlPlugin from 'stylis-plugin-rtl'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import i18n from './i18n'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { nomNomTheme, nomNomColors } from './theme/nomnom-theme'

// Create RTL cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin]
})

// Create LTR cache
const cacheLtr = createCache({
  key: 'muiltr'
})

// Function to create theme with direction using NomNom theme
const createDirectionalTheme = (direction: 'ltr' | 'rtl') =>
  createTheme({
    ...nomNomTheme,
    direction,
    typography: {
      ...nomNomTheme.typography,
      fontFamily: direction === 'rtl' ? '"Heebo", "Quicksand", "Fredoka", "Inter", sans-serif' : '"Quicksand", "Fredoka", "Inter", "Roboto", sans-serif'
    },
    components: {
      ...nomNomTheme.components,
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            direction: direction,
            // Do not force background color here; let inner theme (with dark mode) control it
            backgroundColor: 'inherit'
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              backgroundColor: nomNomColors.white,
              '& fieldset': {
                borderColor: `${nomNomColors.primary}40`
              },
              '&:hover fieldset': {
                borderColor: nomNomColors.primaryDark
              },
              '&.Mui-focused fieldset': {
                borderColor: nomNomColors.primaryDark,
                borderWidth: 2
              }
            },
            '& .MuiInputLabel-root': {
              transformOrigin: direction === 'rtl' ? 'top right' : 'top left'
            }
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: nomNomColors.white,
            borderRight: `1px solid ${nomNomColors.primaryLight}60`,
            backgroundImage: `
              linear-gradient(180deg,
                ${nomNomColors.white} 0%,
                ${nomNomColors.background}30 100%
              )
            `,
            ...(direction === 'rtl'
              ? {
                  right: 0,
                  left: 'auto !important'
                }
              : {})
          }
        }
      }
    }
  })

const AppWithTheme = () => {
  const [direction, setDirection] = React.useState<'ltr' | 'rtl'>('ltr')

  React.useEffect(() => {
    // Set initial direction from i18n on mount
    const applyDirectionFromLang = (lang: string) => {
      const isRtl = lang === 'he'
      setDirection(isRtl ? 'rtl' : 'ltr')
      document.dir = isRtl ? 'rtl' : 'ltr'
      document.documentElement.lang = lang
    }

    applyDirectionFromLang(i18n.language || 'en')

    // React to i18n language changes without reloading the page
    const onLanguageChanged = (lang: string) => {
      applyDirectionFromLang(lang)
    }

    i18n.on('languageChanged', onLanguageChanged)

    return () => {
      i18n.off('languageChanged', onLanguageChanged)
    }
  }, [])

  const theme = React.useMemo(() => createDirectionalTheme(direction), [direction])
  const cache = direction === 'rtl' ? cacheRtl : cacheLtr

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </CacheProvider>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWithTheme />
    </BrowserRouter>
  </React.StrictMode>
)

reportWebVitals()
