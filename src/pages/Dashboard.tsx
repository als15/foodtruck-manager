import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  People,
  Restaurant,
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color, subtitle }: any) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ color, mr: 1 }}>{icon}</Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Revenue"
            value="$1,247"
            icon={<AttachMoney />}
            color="success.main"
            subtitle="+12% from yesterday"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Orders Today"
            value="89"
            icon={<Restaurant />}
            color="primary.main"
            subtitle="+5% from yesterday"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Staff"
            value="6"
            icon={<People />}
            color="info.main"
            subtitle="On duty today"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Profit Margin"
            value="34%"
            icon={<TrendingUp />}
            color="warning.main"
            subtitle="This month"
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Activity
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Revenue Progress (Today)
              </Typography>
              <LinearProgress variant="determinate" value={75} sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                $1,247 of $1,660 goal
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Orders Progress (Today)
              </Typography>
              <LinearProgress variant="determinate" value={60} sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                89 of 150 goal
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">• Add new menu item</Typography>
              <Typography variant="body2">• Schedule employee shift</Typography>
              <Typography variant="body2">• Record expense</Typography>
              <Typography variant="body2">• Update inventory</Typography>
              <Typography variant="body2">• Plan route</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}