import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ConfigProvider, theme as antdTheme, App } from 'antd'
import { lightTheme, darkTheme } from '../config/antdTheme'
import '../styles/global.css'

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

  const isDarkMode = mode === 'dark'
  const themeConfig = mode === 'light' ? lightTheme : darkTheme
  const direction = typeof document !== 'undefined' && document.dir === 'rtl' ? 'rtl' : 'ltr'

  // Apply dark algorithm if in dark mode
  const finalThemeConfig = {
    ...themeConfig,
    algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, isDarkMode }}>
      <ConfigProvider theme={finalThemeConfig} direction={direction}>
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}
