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

// Create RTL cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin]
})

// Create LTR cache
const cacheLtr = createCache({
  key: 'muiltr'
})

// Function to create theme with direction
const createDirectionalTheme = (direction: 'ltr' | 'rtl') =>
  createTheme({
    direction,
    palette: {
      primary: {
        main: '#2196f3'
      },
      secondary: {
        main: '#ff9800'
      }
    },
    typography: {
      fontFamily: direction === 'rtl' ? '"Heebo", "Roboto", "Arial", sans-serif' : '"Roboto", "Helvetica", "Arial", sans-serif'
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            direction: direction
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputLabel-root': {
              transformOrigin: direction === 'rtl' ? 'top right' : 'top left'
            }
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper:
            direction === 'rtl'
              ? {
                  right: 0,
                  left: 'auto !important'
                }
              : {}
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
