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
    <Box display="flex" alignItems="center" gap={showText ? 1.5 : 0}>
      {/* Food Truck Icon with Playful Animation */}
      <Box
        sx={{
          width: currentSize.icon,
          height: currentSize.icon,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.3s ease-out',
          cursor: 'pointer',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
      >
        <Box
          sx={{
            fontSize: currentSize.icon,
            color: nomNomColors.primary,
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
          }}
        >
          🚚
        </Box>
      </Box>
      
      {showText && (
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontSize: currentSize.text,
            fontWeight: 700,
            color: '#1a1a1a',
            letterSpacing: '-0.02em',
            fontFamily: '"Fredoka", "Quicksand", "Inter", sans-serif',
            transition: 'all 0.3s ease-out',
            cursor: 'pointer',
            '&:hover': {
              color: nomNomColors.primaryDark,
            },
          }}
        >
          NomNom
        </Typography>
      )}
    </Box>
  );
};

export default NomNomLogo;