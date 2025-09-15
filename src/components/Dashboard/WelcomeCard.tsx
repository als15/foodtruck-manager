import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { Restaurant, TrendingUp, LocalShipping } from '@mui/icons-material';
import { nomNomColors } from '../../theme/nomnom-theme';
import NomNomLogo from '../NomNomLogo';

const WelcomeCard: React.FC = () => {
  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${nomNomColors.primary}20 0%, ${nomNomColors.secondary}20 100%)`,
        border: `2px solid ${nomNomColors.primary}40`,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${nomNomColors.accent}30 0%, transparent 70%)`,
          borderRadius: '50%',
          transform: 'translate(50px, -50px)',
          zIndex: 0,
        }
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3}>
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <NomNomLogo size="large" showText={true} />
              <Typography variant="h4" fontWeight={700} color="text.primary">
                Welcome Back!
              </Typography>
            </Box>
            <Typography variant="h6" color="text.secondary" mb={3}>
              Manage your food truck business with ease
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={600}>
              Track orders, manage inventory, handle supplier relationships, and grow your business 
              with our comprehensive management platform designed specifically for food truck operators.
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<Restaurant />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              background: `linear-gradient(135deg, ${nomNomColors.primaryDark} 0%, ${nomNomColors.secondaryDark} 100%)`,
              color: '#ffffff',
              fontWeight: 600,
              '&:hover': {
                background: `linear-gradient(135deg, ${nomNomColors.primaryDark} 0%, ${nomNomColors.secondaryDark} 100%)`,
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }
            }}
          >
            View Menu
          </Button>
          <Button
            variant="outlined"
            startIcon={<TrendingUp />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              borderColor: nomNomColors.primaryDark,
              color: nomNomColors.primaryText,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: `${nomNomColors.primary}15`,
                borderColor: nomNomColors.primaryDark,
                transform: 'translateY(-2px)',
              }
            }}
          >
            Analytics
          </Button>
          <Button
            variant="outlined"
            startIcon={<LocalShipping />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              borderColor: nomNomColors.secondaryDark,
              color: nomNomColors.secondaryText,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: `${nomNomColors.secondary}15`,
                borderColor: nomNomColors.secondaryDark,
                transform: 'translateY(-2px)',
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
            opacity: 0.1,
            fontSize: '4rem',
            color: nomNomColors.primary,
            zIndex: 0,
          }}
        >
          👨‍🍳
        </Box>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;