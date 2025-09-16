import React from 'react';
import { Card, CardContent, Typography, Box, Button, keyframes } from '@mui/material';
import { Restaurant, TrendingUp, LocalShipping } from '@mui/icons-material';
import { nomNomColors } from '../../theme/nomnom-theme';
import NomNomLogo from '../NomNomLogo';

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(-5deg); }
  75% { transform: translateY(-5px) rotate(5deg); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.3; }
  100% { transform: scale(1); opacity: 0.5; }
`;

const slideIn = keyframes`
  0% { opacity: 0; transform: translateX(-30px); }
  100% { opacity: 1; transform: translateX(0); }
`;

const WelcomeCard: React.FC = () => {
  return (
    <Card
      sx={{
        background: nomNomColors.white,
        border: `2px solid ${nomNomColors.primary}`,
        borderRadius: 3,
        overflow: 'visible',
        position: 'relative',
        boxShadow: `0 8px 24px rgba(0, 0, 0, 0.08)`,
        animation: `${slideIn} 0.6s ease-out`,
        transition: 'all 0.3s ease-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 32px rgba(0, 0, 0, 0.12)`,
          borderColor: nomNomColors.primaryDark,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -20,
          right: -20,
          width: '250px',
          height: '250px',
          background: `radial-gradient(circle, ${nomNomColors.primary}20 0%, transparent 70%)`,
          borderRadius: '50%',
          animation: `${pulse} 3s ease-in-out infinite`,
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -15,
          left: -15,
          width: '150px',
          height: '150px',
          background: `radial-gradient(circle, ${nomNomColors.secondary}15 0%, transparent 70%)`,
          borderRadius: '50%',
          animation: `${pulse} 3s ease-in-out infinite 1.5s`,
          zIndex: 0,
        }
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3}>
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box sx={{ animation: `${float} 3s ease-in-out infinite` }}>
                <NomNomLogo size="large" showText={true} />
              </Box>
              <Typography 
                variant="h4" 
                fontWeight={700} 
                sx={{
                  color: '#1a1a1a',
                  animation: `${slideIn} 0.8s ease-out 0.2s both`,
                }}
              >
                Welcome Back!
              </Typography>
            </Box>
            <Typography 
              variant="h6" 
              mb={3}
              sx={{ 
                color: '#666666',
                animation: `${slideIn} 0.8s ease-out 0.3s both`,
                fontWeight: 500,
              }}
            >
              Manage your food truck business with ease
            </Typography>
            <Typography 
              variant="body1" 
              maxWidth={600}
              sx={{ 
                color: '#666666',
                animation: `${slideIn} 0.8s ease-out 0.4s both`,
                lineHeight: 1.8,
              }}
            >
              Track orders, manage inventory, handle supplier relationships, and grow your business 
              with our comprehensive management platform designed specifically for food truck operators.
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<Restaurant sx={{ animation: `${float} 2s ease-in-out infinite` }} />}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.75,
              background: nomNomColors.primary,
              color: '#1a1a1a',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: `0 4px 12px rgba(127, 255, 212, 0.3)`,
              animation: `${slideIn} 0.8s ease-out 0.5s both`,
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-50%) skewX(-30deg)',
                transition: 'left 0.5s ease-out',
              },
              '&:hover': {
                background: nomNomColors.primaryDark,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px rgba(127, 255, 212, 0.4)`,
                '&::before': {
                  left: '100%',
                },
              },
              '&:active': {
                transform: 'translateY(-1px) scale(1.02)',
              }
            }}
          >
            View Menu
          </Button>
          <Button
            variant="outlined"
            startIcon={<TrendingUp />}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.75,
              borderColor: nomNomColors.primaryDark,
              color: nomNomColors.primaryDark,
              fontWeight: 600,
              fontSize: '0.95rem',
              borderWidth: 2,
              animation: `${slideIn} 0.8s ease-out 0.6s both`,
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                background: `linear-gradient(135deg, ${nomNomColors.primary}20 0%, ${nomNomColors.primaryLight}20 100%)`,
                opacity: 0,
                transition: 'opacity 0.3s ease-out',
              },
              '&:hover': {
                backgroundColor: `${nomNomColors.primary}15`,
                borderColor: nomNomColors.primaryDark,
                transform: 'translateY(-2px)',
                color: nomNomColors.primaryDark,
              },
              '&:active': {
                transform: 'translateY(-1px) scale(1.02)',
              }
            }}
          >
            Analytics
          </Button>
          <Button
            variant="outlined"
            startIcon={<LocalShipping />}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.75,
              borderColor: nomNomColors.primaryDark,
              color: nomNomColors.primaryDark,
              fontWeight: 600,
              fontSize: '0.95rem',
              borderWidth: 2,
              animation: `${slideIn} 0.8s ease-out 0.7s both`,
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                background: `linear-gradient(135deg, ${nomNomColors.primary}20 0%, ${nomNomColors.primaryLight}20 100%)`,
                opacity: 0,
                transition: 'opacity 0.3s ease-out',
              },
              '&:hover': {
                backgroundColor: `${nomNomColors.primary}15`,
                borderColor: nomNomColors.primaryDark,
                transform: 'translateY(-2px)',
                color: nomNomColors.primaryDark,
              },
              '&:active': {
                transform: 'translateY(-1px) scale(1.02)',
              }
            }}
          >
            Supplier Orders
          </Button>
        </Box>

        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            right: 30,
            fontSize: '5rem',
            zIndex: 0,
            animation: `${float} 4s ease-in-out infinite`,
            filter: 'drop-shadow(0 8px 16px rgba(127, 255, 212, 0.4))',
          }}
        >
          🍔
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: 30,
            right: 100,
            fontSize: '3rem',
            zIndex: 0,
            animation: `${float} 4s ease-in-out infinite 0.5s`,
            filter: 'drop-shadow(0 8px 16px rgba(127, 255, 212, 0.3))',
          }}
        >
          🌮
        </Box>
        <Box
          sx={{
            position: 'absolute',
            bottom: 50,
            left: 50,
            fontSize: '2.5rem',
            zIndex: 0,
            animation: `${float} 4s ease-in-out infinite 1s`,
            filter: 'drop-shadow(0 8px 16px rgba(90, 159, 212, 0.3))',
          }}
        >
          🥤
        </Box>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;