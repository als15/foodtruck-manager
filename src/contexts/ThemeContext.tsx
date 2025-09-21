import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { nomNomColors } from '../theme/nomnom-theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

interface CustomThemeProviderProps {
  children: ReactNode;
}

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: nomNomColors.primary,
      light: nomNomColors.primaryLight,
      dark: nomNomColors.primaryDark,
    },
    secondary: {
      main: nomNomColors.secondary,
      light: nomNomColors.secondaryLight,
      dark: nomNomColors.secondaryDark,
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#4a4a4a',  // Darker for better contrast
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
          padding: '12px 16px',
          borderColor: 'rgba(0, 0, 0, 0.08)',
        },
        head: {
          fontSize: '0.9rem',
          fontWeight: 700,
          color: '#1a1a1a',
          backgroundColor: 'rgba(127, 255, 212, 0.1)',
        },
        body: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#1a1a1a',
          '& .MuiTypography-colorPrimary': {
            color: '#1f5c3d !important',  // Darker primary color for better contrast
            fontWeight: '600 !important',
          },
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: nomNomColors.primary,
      light: nomNomColors.primaryLight,
      dark: nomNomColors.primaryDark,
    },
    secondary: {
      main: nomNomColors.secondary,
      light: nomNomColors.secondaryLight,
      dark: nomNomColors.secondaryDark,
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#e0e0e0',  // Brighter for better contrast in dark mode
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1e1e1e',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(127, 255, 212, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: '#7fffd4',
            color: '#1a1a1a',
            '&:hover': {
              backgroundColor: '#6ee6bb',
            },
            '& .MuiListItemIcon-root': {
              color: '#1a1a1a',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
          padding: '12px 16px',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
        head: {
          fontSize: '0.9rem',
          fontWeight: 700,
          color: '#ffffff',
          backgroundColor: 'rgba(127, 255, 212, 0.15)',
        },
        body: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#ffffff',
          '& .MuiTypography-colorPrimary': {
            color: '#7fffd4 !important',  // Bright aquamarine for dark mode
            fontWeight: '600 !important',
          },
        },
      },
    },
  },
});

export const CustomThemeProvider: React.FC<CustomThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode;
    return savedMode || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    document.body.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const theme = mode === 'light' ? lightTheme : darkTheme;
  const isDarkMode = mode === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, isDarkMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};