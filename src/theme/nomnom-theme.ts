import { createTheme, Theme } from '@mui/material/styles'

// NomNom Brand Color Palette - Clean White Design with Dominant Aquamarine
export const nomNomColors = {
  // Brand palette (user-provided)
  primary: '#7fffd4', // Aquamarine
  secondary: '#6dded0', // Mint/Teal
  accent: '#fcf3ee', // Soft peach background/accent
  highlight: '#ffd4d4', // Playful pink accents/warnings
  white: '#ffffff',
  background: '#ffffff',

  // Extended palette for UI elements
  primaryLight: '#b3ffe0',
  primaryDark: '#6dded0', // Use mint as hover/dark for primary
  primaryVibrant: '#7fffd4',
  secondaryLight: '#a8efe7',
  secondaryDark: '#6dded0',

  // Semantic colors mapped to palette
  success: '#7fffd4',
  warning: '#ffd4d4',
  error: '#ffd4d4',
  info: '#6dded0',

  // Text colors - Enhanced for better contrast
  textPrimary: '#1a1a1a',
  textSecondary: '#4a4a4a',
  textLight: '#757575',

  // Accessible versions for text
  primaryText: '#194d3a',
  secondaryText: '#1f4b46'
} as const

// Custom NomNom Material-UI Theme
export const nomNomTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: nomNomColors.primary,
      light: nomNomColors.primaryLight,
      dark: nomNomColors.primaryDark,
      contrastText: '#1a1a1a'
    },
    secondary: {
      main: nomNomColors.secondary,
      light: nomNomColors.secondaryLight,
      dark: nomNomColors.secondaryDark,
      contrastText: '#1a1a1a'
    },
    background: {
      default: nomNomColors.white,
      paper: nomNomColors.white
    },
    text: {
      primary: nomNomColors.textPrimary,
      secondary: nomNomColors.textSecondary
    },
    success: {
      main: nomNomColors.success,
      light: '#aef6e6',
      dark: nomNomColors.primaryDark
    },
    warning: {
      main: nomNomColors.warning,
      light: '#ffe6e6',
      dark: '#ffbaba'
    },
    error: {
      main: nomNomColors.error,
      light: '#ffe6e6',
      dark: '#ffbaba'
    },
    info: {
      main: nomNomColors.info,
      light: nomNomColors.secondaryLight,
      dark: nomNomColors.secondaryDark
    }
  },
  typography: {
    fontFamily: '"Quicksand", "Fredoka", "Inter", "Roboto", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 800,
      color: nomNomColors.textPrimary,
      letterSpacing: '-0.03em',
      fontFamily: '"Fredoka", "Quicksand", sans-serif'
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      color: nomNomColors.textPrimary,
      letterSpacing: '-0.02em',
      fontFamily: '"Fredoka", "Quicksand", sans-serif'
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      color: nomNomColors.textPrimary,
      letterSpacing: '-0.01em'
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: nomNomColors.textPrimary
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: nomNomColors.textPrimary
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: nomNomColors.textPrimary
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.7,
      color: nomNomColors.textPrimary
    },
    body2: {
      fontSize: '0.9rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: nomNomColors.textSecondary
    },
    button: {
      fontSize: '0.9rem',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em'
    }
  },
  shape: {
    borderRadius: 20 // Super rounded corners for playful feel
  },
  spacing: 8,
  components: {
    // Custom component styling
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: nomNomColors.accent
          // Soft playful background
        },
        '*': {
          // Ensure all text aligns properly in RTL
          textAlign: 'start'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: nomNomColors.white,
          color: nomNomColors.textPrimary,
          boxShadow: 'none',
          borderBottom: 'none'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: nomNomColors.white,
          borderRight: `1px solid rgba(0, 0, 0, 0.08)`,
          boxShadow: '2px 0 12px rgba(109, 222, 208, 0.08)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: nomNomColors.white,
          boxShadow: '0 8px 32px rgba(109, 222, 208, 0.25)',
          border: `3px solid ${nomNomColors.secondary}30`,
          borderRadius: 24,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          overflow: 'visible',
          '&:hover': {
            boxShadow: '0 12px 48px rgba(109, 222, 208, 0.35)',
            borderColor: nomNomColors.secondary
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          padding: '12px 28px',
          fontSize: '0.9rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          overflow: 'hidden',
          // RTL-aware icon spacing
          '& .MuiButton-startIcon': {
            marginInlineEnd: 8,
            marginLeft: 0,
            marginRight: 0
          },
          '& .MuiButton-endIcon': {
            marginInlineStart: 8,
            marginLeft: 0,
            marginRight: 0
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '0',
            height: '0',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.5)',
            transform: 'translate(-50%, -50%)',
            transition: 'width 0.4s, height 0.4s'
          },
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px) scale(1.05)'
          },
          '&:active': {
            transform: 'translateY(0) scale(1.02)',
            '&::before': {
              width: '300px',
              height: '300px'
            }
          }
        },
        contained: {
          background: nomNomColors.primary,
          color: '#1a1a1a',
          fontWeight: 600,
          boxShadow: `0 4px 16px rgba(109, 222, 208, 0.25)`,
          '&:hover': {
            background: nomNomColors.primaryDark,
            boxShadow: `0 6px 24px rgba(109, 222, 208, 0.35)`
          }
        },
        outlined: {
          borderColor: nomNomColors.primaryDark,
          borderWidth: '2px',
          color: nomNomColors.primaryDark,
          '&:hover': {
            backgroundColor: `${nomNomColors.primary}15`,
            borderColor: nomNomColors.primaryDark,
            borderWidth: '2px',
            color: nomNomColors.primaryDark
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
          fontSize: '0.85rem',
          padding: '6px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)'
          }
        },
        colorPrimary: {
          backgroundColor: `${nomNomColors.primary}20`,
          color: nomNomColors.primaryDark
        },
        colorSecondary: {
          backgroundColor: `${nomNomColors.secondary}20`,
          color: nomNomColors.secondaryDark
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: nomNomColors.white,
            transition: 'all 0.3s ease-in-out',
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.2)',
              borderWidth: '1px',
              transition: 'all 0.3s ease-in-out'
            },
            '&:hover fieldset': {
              borderColor: nomNomColors.primaryDark,
              boxShadow: '0 2px 8px rgba(109, 222, 208, 0.15)'
            },
            '&.Mui-focused': {
              '& fieldset': {
                borderColor: nomNomColors.primary,
                borderWidth: '1px',
                boxShadow: '0 2px 8px rgba(109, 222, 208, 0.15)'
              }
            },
            '&.Mui-error': {
              '& fieldset': {
                borderColor: nomNomColors.error,
                borderWidth: '1px'
              }
            }
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: 12,
          backgroundColor: nomNomColors.white,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.2)',
            borderWidth: '1px'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: nomNomColors.primaryDark
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: nomNomColors.primary,
            borderWidth: '1px'
          }
        }
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: nomNomColors.white,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.2)',
              borderWidth: '1px'
            },
            '&:hover fieldset': {
              borderColor: nomNomColors.primaryDark
            },
            '&.Mui-focused fieldset': {
              borderColor: nomNomColors.primary,
              borderWidth: '1px'
            }
          }
        },
        paper: {
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          border: `1px solid rgba(0, 0, 0, 0.1)`
        }
      }
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: nomNomColors.white,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.2)',
              borderWidth: '1px'
            },
            '&:hover fieldset': {
              borderColor: nomNomColors.primaryDark
            },
            '&.Mui-focused fieldset': {
              borderColor: nomNomColors.primary,
              borderWidth: '1px'
            }
          }
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          '&.MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: nomNomColors.white,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.2)',
              borderWidth: '1px'
            },
            '&:hover fieldset': {
              borderColor: nomNomColors.primaryDark
            },
            '&.Mui-focused fieldset': {
              borderColor: nomNomColors.primary,
              borderWidth: '1px'
            }
          }
        }
      }
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${nomNomColors.primaryLight}40`
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: `${nomNomColors.accent}`,
          '& .MuiTableCell-head': {
            fontWeight: 700, // Bolder font weight
            color: nomNomColors.textPrimary,
            fontSize: '0.9rem', // Slightly larger font
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '16px' // More padding for better spacing
          }
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: `${nomNomColors.background}30`
          },
          '&:hover': {
            backgroundColor: `${nomNomColors.primary}08`
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
          color: nomNomColors.textPrimary,
          borderColor: 'rgba(0, 0, 0, 0.08)',
          '&.MuiTableCell-head': {
            fontSize: '0.9rem',
            fontWeight: 700,
            color: nomNomColors.textPrimary
          }
        },
        body: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: nomNomColors.textPrimary,
          // Specific styling for better text contrast
          '& .MuiTypography-root': {
            color: 'inherit'
          },
          '& .MuiTypography-colorPrimary': {
            color: nomNomColors.primaryText, // Use the darker primary color for text
            fontWeight: 600
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          boxShadow: '0 32px 80px rgba(109, 222, 208, 0.3)',
          border: `3px solid ${nomNomColors.primary}40`,
          animation: 'dialogSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '@keyframes dialogSlideIn': {
            '0%': {
              opacity: 0,
              transform: 'translateY(-20px) scale(0.95)'
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0) scale(1)'
            }
          }
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          textAlign: 'start'
        }
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          textAlign: 'start'
        }
      }
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          '& > :not(:first-of-type)': {
            marginInlineStart: 8,
            marginLeft: 0
          }
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          padding: '16px',
          fontSize: '0.95rem',
          fontWeight: 500
        },
        standardInfo: {
          backgroundColor: `${nomNomColors.secondary}18`,
          color: nomNomColors.textPrimary,
          '& .MuiAlert-icon': { color: nomNomColors.secondary }
        },
        standardSuccess: {
          backgroundColor: `${nomNomColors.primary}18`,
          color: nomNomColors.textPrimary,
          '& .MuiAlert-icon': { color: nomNomColors.primary }
        },
        standardWarning: {
          backgroundColor: `${nomNomColors.highlight}40`,
          color: nomNomColors.textPrimary,
          '& .MuiAlert-icon': { color: nomNomColors.highlight }
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: `${nomNomColors.primary}26`,
            color: nomNomColors.primaryText,
            '& .MuiListItemIcon-root': { color: nomNomColors.primary },
            '&:hover': { backgroundColor: `${nomNomColors.primary}33` }
          },
          '&:hover': { backgroundColor: `${nomNomColors.secondary}15` }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:hover': { backgroundColor: `${nomNomColors.secondary}20`, transform: 'scale(1.07) rotate(3deg)' },
          '&:active': { transform: 'scale(1.03) rotate(2deg)' }
        }
      }
    },
    MuiStack: {
      defaultProps: {
        useFlexGap: true
      }
    },
    MuiButtonGroup: {
      styleOverrides: {
        root: {
          '& .MuiButton-root:not(:last-child)': {
            marginInlineEnd: -1,
            borderInlineEndWidth: 0
          }
        }
      }
    },
    MuiGrid: {
      styleOverrides: {
        root: {
          // Ensure Grid items align properly in RTL
          textAlign: 'start'
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          textAlign: 'inherit',
          // Ensure primary-colored text has sufficient contrast on light backgrounds
          '&.MuiTypography-colorPrimary': {
            color: nomNomColors.primaryText
          }
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: nomNomColors.primaryText,
          textDecorationColor: `${nomNomColors.primaryText}55`,
          '&:hover': {
            color: nomNomColors.primaryDark,
            textDecorationColor: `${nomNomColors.primaryDark}66`
          }
        }
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          textAlign: 'start',
          transformOrigin: 'top start'
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          textAlign: 'start',
          transformOrigin: 'top start',
          '&.MuiInputLabel-shrink': {
            transformOrigin: 'top start'
          }
        }
      }
    }
  }
})

export default nomNomTheme
