import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../utils/currency';

const salesData = [
  { month: 'Jan', revenue: 12000, expenses: 8000, profit: 4000 },
  { month: 'Feb', revenue: 15000, expenses: 9000, profit: 6000 },
  { month: 'Mar', revenue: 18000, expenses: 11000, profit: 7000 },
  { month: 'Apr', revenue: 22000, expenses: 13000, profit: 9000 },
  { month: 'May', revenue: 25000, expenses: 15000, profit: 10000 },
  { month: 'Jun', revenue: 28000, expenses: 16000, profit: 12000 },
];

const dailySalesData = [
  { day: 'Mon', orders: 45, revenue: 890 },
  { day: 'Tue', orders: 52, revenue: 1050 },
  { day: 'Wed', orders: 38, revenue: 760 },
  { day: 'Thu', orders: 61, revenue: 1220 },
  { day: 'Fri', orders: 89, revenue: 1780 },
  { day: 'Sat', orders: 125, revenue: 2500 },
  { day: 'Sun', orders: 98, revenue: 1960 },
];

const popularItemsData = [
  { name: 'Classic Burger', value: 35, color: '#0088FE' },
  { name: 'Fish Tacos', value: 25, color: '#00C49F' },
  { name: 'Veggie Wrap', value: 20, color: '#FFBB28' },
  { name: 'BBQ Sandwich', value: 12, color: '#FF8042' },
  { name: 'Other', value: 8, color: '#8884d8' },
];

const locationPerformanceData = [
  { location: 'Downtown Park', revenue: 8500, orders: 245 },
  { location: 'Business District', revenue: 6200, orders: 189 },
  { location: 'Food Festival', revenue: 4800, orders: 156 },
  { location: 'University Campus', revenue: 3900, orders: 132 },
];

export default function Analytics() {
  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = dailySalesData.reduce((sum, item) => sum + item.orders, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Analytics Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Revenue (6M)
              </Typography>
              <Typography variant="h4">
                {formatCurrency(totalRevenue)}
              </Typography>
              <Typography variant="body2" color="success.main">
                +15% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                Total Orders (7D)
              </Typography>
              <Typography variant="h4">
                {totalOrders}
              </Typography>
              <Typography variant="body2" color="success.main">
                +8% from last week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                Avg Order Value
              </Typography>
              <Typography variant="h4">
                ${avgOrderValue.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="success.main">
                +5% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Profit Margin
              </Typography>
              <Typography variant="h4">
                42%
              </Typography>
              <Typography variant="body2" color="success.main">
                +2% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Revenue vs Expenses (6 Months)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#2196f3" name="Revenue" />
                <Bar dataKey="expenses" fill="#ff9800" name="Expenses" />
                <Bar dataKey="profit" fill="#4caf50" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Popular Menu Items
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={popularItemsData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {popularItemsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Daily Sales Trends (This Week)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="orders" fill="#ff9800" name="Orders" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2196f3"
                  strokeWidth={3}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Location Performance
            </Typography>
            <Box>
              {locationPerformanceData.map((location, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {location.location}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Revenue: {formatCurrency(location.revenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Orders: {location.orders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Order: ${(location.revenue / location.orders).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Key Performance Indicators
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body1">Customer Retention Rate</Typography>
                <Typography variant="h6" color="success.main">85%</Typography>
              </Box>
              <Box>
                <Typography variant="body1">Average Prep Time</Typography>
                <Typography variant="h6" color="info.main">7.2 min</Typography>
              </Box>
              <Box>
                <Typography variant="body1">Inventory Turnover</Typography>
                <Typography variant="h6" color="warning.main">12.4x</Typography>
              </Box>
              <Box>
                <Typography variant="body1">Employee Productivity</Typography>
                <Typography variant="h6" color="primary.main">94%</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Business Insights
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                • Peak hours: 12:00 PM - 2:00 PM and 6:00 PM - 8:00 PM
              </Typography>
              <Typography variant="body2">
                • Best performing day: Saturday (avg $2,500 revenue)
              </Typography>
              <Typography variant="body2">
                • Most profitable location: Downtown Park
              </Typography>
              <Typography variant="body2">
                • Top menu item: Classic Burger (35% of orders)
              </Typography>
              <Typography variant="body2">
                • Customer loyalty program participation: 68%
              </Typography>
              <Typography variant="body2">
                • Average customer lifetime value: $156
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}