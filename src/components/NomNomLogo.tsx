import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { nomNomColors } from '../theme/nomnom-theme';

interface NomNomLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

const bounce = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.1); }
`;

const wiggle = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
`;

const NomNomLogo: React.FC<NomNomLogoProps> = ({ 
  size = 'medium', 
  showText = true, 
  variant = 'light' 
}) => {
  const logoSizes = {
    small: { icon: 28, text: '1.1rem' },
    medium: { icon: 36, text: '1.4rem' },
    large: { icon: 56, text: '2rem' }
  };

  const currentSize = logoSizes[size];

  return (
    <Box display="flex" alignItems="center" justifyContent="center" sx={{ width: '100%' }}>
      {/* Logo Image */}
      <Box
        component="img"
        src="/logo_cropped.png"
        alt="NomNom"
        sx={{
          height: size === 'small' ? 40 : size === 'medium' ? 50 : 70,
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
          transition: 'all 0.3s ease-out',
          cursor: 'pointer',
          filter: 'brightness(0) invert(1) drop-shadow(0 2px 4px rgba(255, 255, 255, 0.2))',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      />
    </Box>
  );
};

export default NomNomLogo;