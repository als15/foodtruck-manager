import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  People,
  Restaurant,
  ShoppingCart,
  Warning,
} from '@mui/icons-material';
import { inventoryService, suppliersService } from '../services/supabaseService';
import { InventoryItem, Supplier } from '../types';

const StatCard = ({ title, value, icon, color, subtitle }: any) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ color, marginInlineEnd: 1 }}>{icon}</Box>
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
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inventoryData, suppliersData] = await Promise.all([
        inventoryService.getAll(),
        suppliersService.getAll()
      ]);
      setInventoryItems(inventoryData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate real data
  const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minThreshold);
  const autoOrderSuggestions = lowStockItems
    .map(item => {
      const supplier = suppliers.find(sup => 
        sup.name === item.supplier && sup.autoOrderEnabled && sup.isActive
      );
      if (!supplier) return null;
      
      const suggestedQuantity = Math.max(
        item.minThreshold * 2 - item.currentStock,
        supplier.minimumOrderAmount / item.costPerUnit
      );
      
      return {
        item,
        supplier,
        suggestedQuantity: Math.ceil(suggestedQuantity),
        totalCost: suggestedQuantity * item.costPerUnit
      };
    })
    .filter(Boolean);

  const estimatedOrderValue = autoOrderSuggestions.reduce((sum, order) => sum + (order?.totalCost || 0), 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

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

        {/* Auto-Order Status Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCart sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">Auto-Order Status</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Warning sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2" color="error">
                    {lowStockItems.length} Low Stock Items
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {autoOrderSuggestions.length} suppliers ready for auto-order
                </Typography>
              </Box>
              
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Estimated Order Value
                </Typography>
                <Typography variant="h5" color="primary">
                  ${estimatedOrderValue.toFixed(2)}
                </Typography>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Visit Inventory → Auto-Order Suggestions to review
              </Typography>
            </CardContent>
          </Card>
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