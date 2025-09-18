import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useThemeMode } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const DarkModeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { t } = useTranslation();

  return (
    <Tooltip title={isDarkMode ? t('switch_to_light_mode') : t('switch_to_dark_mode')}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        sx={{
          transition: 'all 0.3s ease-out',
          '&:hover': {
            transform: 'scale(1.1) rotate(15deg)',
            '& .MuiSvgIcon-root': {
              filter: 'drop-shadow(0 0 8px rgba(127, 255, 212, 0.6))',
            },
          },
          '& .MuiSvgIcon-root': {
            transition: 'all 0.3s ease-out',
            fontSize: '1.5rem',
          },
        }}
      >
        {isDarkMode ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
};

export default DarkModeToggle;