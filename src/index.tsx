import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import rtlPlugin from 'stylis-plugin-rtl'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import './i18n'
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
            backgroundColor: nomNomColors.white,
            // Clean white background
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
                borderColor: `${nomNomColors.primary}40`,
              },
              '&:hover fieldset': {
                borderColor: nomNomColors.primaryDark,
              },
              '&.Mui-focused fieldset': {
                borderColor: nomNomColors.primaryDark,
                borderWidth: 2,
              },
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
    // Listen for language changes and update direction
    const handleLanguageChange = () => {
      const currentLang = localStorage.getItem('i18nextLng') || 'en'
      setDirection(currentLang === 'he' ? 'rtl' : 'ltr')
      document.dir = currentLang === 'he' ? 'rtl' : 'ltr'
    }

    // Set initial direction
    handleLanguageChange()

    // Listen for storage changes (language switches)
    window.addEventListener('storage', handleLanguageChange)

    return () => {
      window.removeEventListener('storage', handleLanguageChange)
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
