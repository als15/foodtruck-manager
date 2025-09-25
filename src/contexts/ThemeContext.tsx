import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createTheme, ThemeProvider, Theme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { nomNomColors } from '../theme/nomnom-theme'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  mode: ThemeMode
  toggleTheme: () => void
  isDarkMode: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useThemeMode = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeProvider')
  }
  return context
}

interface CustomThemeProviderProps {
  children: ReactNode
}

// Bubbly brand palette
const brand = {
  primary: '#20E3B2',
  primaryLight: '#A7F7E3',
  primaryDark: '#12C39A',
  secondary: '#3A86FF',
  secondaryLight: '#9DCCFF',
  secondaryDark: '#2F6BDB',
  accentOrange: '#FF7D4D',
  accentBlue: '#2FB6FF',
  textPrimary: '#131720',
  textSecondary: '#4A5568',
  bgDefault: '#FFF9F4',
  bgPaper: '#FFFFFF',
  darkBg: '#0F1220',
  darkPaper: '#15192C',
  darkTextPrimary: '#F5F7FA',
  darkTextSecondary: '#B6C2CF',
  success: '#12C39A',
  warning: '#FFB020',
  error: '#FF5C7A',
  info: '#3ABEF9'
} as const

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand.primary,
      light: brand.primaryLight,
      dark: brand.primaryDark
    },
    secondary: {
      main: brand.secondary,
      light: brand.secondaryLight,
      dark: brand.secondaryDark
    },
    background: {
      default: brand.bgDefault,
      paper: brand.bgPaper
    },
    text: {
      primary: brand.textPrimary,
      secondary: brand.textSecondary // Darker for better contrast
    },
    info: { main: brand.accentBlue },
    warning: { main: brand.accentOrange }
  },
  shape: { borderRadius: 20 },
  typography: {
    fontFamily: 'Nunito, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    h1: { fontFamily: '"Baloo 2", Nunito, sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Baloo 2", Nunito, sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Baloo 2", Nunito, sans-serif', fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
    subtitle1: { fontWeight: 600 }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: brand.bgDefault
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '&.MuiTypography-colorPrimary': {
            color: brand.textPrimary + ' !important'
          }
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#1a1a1a',
          height: 3,
          borderRadius: 3
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: '#1a1a1a',
            fontWeight: 700
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          padding: '10px 18px',
          fontWeight: 700,
          boxShadow: '0 10px 24px rgba(32, 227, 178, 0.15)',
          transition: 'transform 120ms ease, box-shadow 200ms ease',
          '&:hover': {
            transform: 'translateY(-1px) scale(1.02)',
            boxShadow: '0 14px 30px rgba(32, 227, 178, 0.22)'
          }
        },
        containedPrimary: {
          backgroundColor: brand.primary,
          color: '#102A43',
          '&:hover': { backgroundColor: brand.primaryDark }
        },
        containedSecondary: {
          backgroundColor: brand.secondary,
          color: '#FFFFFF',
          '&:hover': { backgroundColor: brand.secondaryDark }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          transition: 'transform 120ms ease',
          '&:hover': { transform: 'scale(1.07)' }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid rgba(19,23,32,0.06)',
          boxShadow: '0 12px 28px rgba(32, 227, 178, 0.10)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, borderRadius: 14 },
        colorPrimary: { backgroundColor: brand.primary + '1A', color: brand.textPrimary },
        colorSecondary: { backgroundColor: brand.secondary + '1A', color: brand.textPrimary }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
          padding: '12px 16px',
          borderColor: 'rgba(0, 0, 0, 0.08)'
        },
        head: {
          fontSize: '0.9rem',
          fontWeight: 700,
          color: brand.textPrimary,
          backgroundColor: brand.secondary + '14'
        },
        body: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: brand.textPrimary,
          '& .MuiTypography-colorPrimary': {
            color: '#1f5c3d !important', // Darker primary color for better contrast
            fontWeight: '600 !important'
          }
        }
      }
    }
  }
})

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: brand.primary,
      light: brand.primaryLight,
      dark: brand.primaryDark
    },
    secondary: {
      main: brand.secondary,
      light: brand.secondaryLight,
      dark: brand.secondaryDark
    },
    background: {
      default: brand.darkBg,
      paper: brand.darkPaper
    },
    text: {
      primary: brand.darkTextPrimary,
      secondary: brand.darkTextSecondary // Brighter for better contrast in dark mode
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: brand.darkPaper
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: brand.darkPaper,
          color: brand.darkTextPrimary,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: brand.darkPaper,
          borderRight: '1px solid rgba(255, 255, 255, 0.12)'
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(127, 255, 212, 0.1)'
          },
          '&.Mui-selected': {
            backgroundColor: brand.primary,
            color: '#102A43',
            '&:hover': {
              backgroundColor: brand.primaryDark
            },
            '& .MuiListItemIcon-root': {
              color: '#102A43'
            }
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
          padding: '12px 16px',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        },
        head: {
          fontSize: '0.9rem',
          fontWeight: 700,
          color: brand.darkTextPrimary,
          backgroundColor: '#20E3B226'
        },
        body: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: brand.darkTextPrimary,
          '& .MuiTypography-colorPrimary': {
            color: brand.primary + ' !important', // Bright brand primary for dark mode
            fontWeight: '600 !important'
          }
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#20E3B226'
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(127, 255, 212, 0.08)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: brand.darkPaper,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(127, 255, 212, 0.15)',
          color: brand.darkTextPrimary,
          borderColor: 'rgba(127, 255, 212, 0.4)'
        },
        outlined: {
          borderColor: 'rgba(127, 255, 212, 0.4)',
          color: brand.darkTextPrimary
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: brand.darkPaper,
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)'
            },
            '&:hover fieldset': {
              borderColor: brand.primary
            },
            '&.Mui-focused fieldset': {
              borderColor: brand.primary
            }
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          backgroundColor: brand.darkPaper,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.2)'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: brand.primary
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: brand.primary
          }
        }
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: brand.darkPaper,
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: brand.darkPaper,
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }
      }
    }
  }
})

export const CustomThemeProvider: React.FC<CustomThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode
    return savedMode || 'light'
  })

  useEffect(() => {
    localStorage.setItem('themeMode', mode)
    document.body.setAttribute('data-theme', mode)
  }, [mode])

  const toggleTheme = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'))
  }

  const theme = mode === 'light' ? lightTheme : darkTheme
  const isDarkMode = mode === 'dark'

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, isDarkMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}
