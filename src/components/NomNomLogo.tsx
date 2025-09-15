import React from 'react';
import { Box, Typography } from '@mui/material';
import { nomNomColors } from '../theme/nomnom-theme';

interface NomNomLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

const NomNomLogo: React.FC<NomNomLogoProps> = ({ 
  size = 'medium', 
  showText = true, 
  variant = 'light' 
}) => {
  const logoSizes = {
    small: { icon: 24, text: '1rem' },
    medium: { icon: 32, text: '1.25rem' },
    large: { icon: 48, text: '1.75rem' }
  };

  const currentSize = logoSizes[size];

  return (
    <Box display="flex" alignItems="center" gap={showText ? 1 : 0}>
      {/* Chef Character Icon - Inspired by the logo */}
      <Box
        sx={{
          width: currentSize.icon,
          height: currentSize.icon,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${nomNomColors.primaryDark} 0%, ${nomNomColors.secondaryDark} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 2px 8px rgba(127, 255, 212, 0.3)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 2,
            left: 2,
            right: 2,
            bottom: 2,
            borderRadius: '50%',
            background: variant === 'light' ? nomNomColors.white : nomNomColors.textPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }
        }}
      >
        <Box
          sx={{
            fontSize: currentSize.icon * 0.5,
            fontWeight: 'bold',
            color: variant === 'light' ? nomNomColors.primaryDark : nomNomColors.white,
            zIndex: 1,
            position: 'relative',
          }}
        >
          👨‍🍳
        </Box>
      </Box>
      
      {showText && (
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontSize: currentSize.text,
            fontWeight: 700,
            background: `linear-gradient(135deg, ${nomNomColors.primaryDark} 0%, ${nomNomColors.secondaryDark} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            fontFamily: '"Inter", "Roboto", sans-serif',
          }}
        >
          NomNom
        </Typography>
      )}
    </Box>
  );
};

export default NomNomLogo;