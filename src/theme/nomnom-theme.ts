import { createTheme, Theme } from '@mui/material/styles';

// NomNom Brand Color Palette
export const nomNomColors = {
  primary: '#7fffd4',      // Aquamarine - Primary brand color
  secondary: '#6dded0',    // Medium turquoise - Secondary actions
  background: '#fcf3ee',   // Warm cream - Background
  accent: '#ffd4d4',       // Light pink - Accents and highlights
  white: '#ffffff',        // Pure white - Cards and surfaces
  
  // Extended palette for UI elements
  primaryLight: '#b3ffe0',
  primaryDark: '#4dccaa',
  secondaryLight: '#9de6dc',
  secondaryDark: '#5bb5a8',
  
  // Semantic colors
  success: '#6dded0',
  warning: '#ffd4d4',
  error: '#ff9999',
  info: '#7fffd4',
  
  // Text colors
  textPrimary: '#2d3748',
  textSecondary: '#4a5568',
  textLight: '#718096',
  
  // Accessible versions for text
  primaryText: '#2d8a5a',     // Darker version of primary for text
  secondaryText: '#2d6e5e',   // Darker version of secondary for text
} as const;

// Custom NomNom Material-UI Theme
export const nomNomTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: nomNomColors.primaryDark,  // Use darker version as main
      light: nomNomColors.primary,     // Original color as light variant
      dark: '#3da58a',                 // Even darker for better contrast
      contrastText: '#ffffff',         // White text on primary backgrounds
    },
    secondary: {
      main: nomNomColors.secondaryDark, // Use darker version as main
      light: nomNomColors.secondary,    // Original color as light variant  
      dark: '#4a9b8e',                 // Even darker for better contrast
      contrastText: '#ffffff',         // White text on secondary backgrounds
    },
    background: {
      default: nomNomColors.background,
      paper: nomNomColors.white,
    },
    text: {
      primary: nomNomColors.textPrimary,
      secondary: nomNomColors.textSecondary,
    },
    success: {
      main: nomNomColors.success,
      light: '#a8e6de',
      dark: '#4db3a4',
    },
    warning: {
      main: nomNomColors.accent,
      light: '#ffe6e6',
      dark: '#ffb3b3',
    },
    error: {
      main: nomNomColors.error,
      light: '#ffcccc',
      dark: '#ff6666',
    },
    info: {
      main: nomNomColors.info,
      light: nomNomColors.primaryLight,
      dark: nomNomColors.primaryDark,
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: nomNomColors.textPrimary,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: nomNomColors.textPrimary,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: nomNomColors.textPrimary,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: nomNomColors.textPrimary,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: nomNomColors.textPrimary,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 500,
      color: nomNomColors.textPrimary,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: nomNomColors.textPrimary,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
      color: nomNomColors.textSecondary,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12, // Rounded corners matching the friendly logo style
  },
  spacing: 8,
  components: {
    // Custom component styling
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: nomNomColors.background,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, ${nomNomColors.primaryLight}15 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${nomNomColors.accent}15 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, ${nomNomColors.secondaryLight}15 0%, transparent 50%)
          `,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: nomNomColors.white,
          color: nomNomColors.textPrimary,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderBottom: `1px solid ${nomNomColors.primaryLight}40`,
        },
      },
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
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: nomNomColors.white,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: `1px solid ${nomNomColors.primaryLight}40`,
          borderRadius: 16,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${nomNomColors.primaryDark} 0%, ${nomNomColors.secondaryDark} 100%)`,
          color: '#ffffff',
          fontWeight: 600,
          '&:hover': {
            background: `linear-gradient(135deg, #3da58a 0%, #4a9b8e 100%)`,
          },
        },
        outlined: {
          borderColor: nomNomColors.primaryDark,
          color: nomNomColors.primaryText,
          '&:hover': {
            backgroundColor: `${nomNomColors.primary}20`,
            borderColor: '#3da58a',
            color: '#3da58a',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundColor: `${nomNomColors.primary}20`,
          color: nomNomColors.primaryDark,
        },
        colorSecondary: {
          backgroundColor: `${nomNomColors.secondary}20`,
          color: nomNomColors.secondaryDark,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: nomNomColors.white,
            '& fieldset': {
              borderColor: `${nomNomColors.primaryDark}60`,
            },
            '&:hover fieldset': {
              borderColor: nomNomColors.primaryDark,
            },
            '&.Mui-focused fieldset': {
              borderColor: nomNomColors.primaryDark,
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: 10,
          backgroundColor: nomNomColors.white,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: `1px solid ${nomNomColors.primaryLight}60`,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${nomNomColors.primaryLight}40`,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: `${nomNomColors.primary}10`,
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: nomNomColors.textPrimary,
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: `${nomNomColors.background}30`,
          },
          '&:hover': {
            backgroundColor: `${nomNomColors.primary}08`,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
          border: `1px solid ${nomNomColors.primaryLight}60`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        standardInfo: {
          backgroundColor: `${nomNomColors.primary}15`,
          color: nomNomColors.textPrimary,
          '& .MuiAlert-icon': {
            color: nomNomColors.primary,
          },
        },
        standardSuccess: {
          backgroundColor: `${nomNomColors.secondary}15`,
          color: nomNomColors.textPrimary,
          '& .MuiAlert-icon': {
            color: nomNomColors.secondary,
          },
        },
        standardWarning: {
          backgroundColor: `${nomNomColors.accent}40`,
          color: nomNomColors.textPrimary,
          '& .MuiAlert-icon': {
            color: '#ff9999',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: `${nomNomColors.primary}20`,
            color: nomNomColors.primaryDark,
            '& .MuiListItemIcon-root': {
              color: nomNomColors.primary,
            },
            '&:hover': {
              backgroundColor: `${nomNomColors.primary}30`,
            },
          },
          '&:hover': {
            backgroundColor: `${nomNomColors.primary}10`,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: `${nomNomColors.primary}15`,
            transform: 'scale(1.05)',
          },
        },
      },
    },
  },
});

export default nomNomTheme;