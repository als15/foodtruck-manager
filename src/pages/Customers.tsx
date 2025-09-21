import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tab,
  Tabs,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Star as StarIcon,
  ShoppingCart as OrderIcon,
} from '@mui/icons-material';
import { Customer } from '../types';
import { customersService } from '../services/supabaseService';
import { formatCurrency } from '../utils/currency';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Customers() {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customersService.getAll();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    loyaltyPoints: 0,
    totalOrders: 0,
    totalSpent: 0,
    favoriteItems: [],
    lastVisit: new Date()
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveCustomer = async () => {
    try {
      if (editingCustomer) {
        const updated = await customersService.update(editingCustomer.id, newCustomer);
        setCustomers(customers.map(customer => 
          customer.id === editingCustomer.id ? updated : customer
        ));
      } else {
        const created = await customersService.create({
          ...newCustomer,
          loyaltyPoints: newCustomer.loyaltyPoints || 0,
          totalOrders: newCustomer.totalOrders || 0,
          totalSpent: newCustomer.totalSpent || 0,
          favoriteItems: newCustomer.favoriteItems || [],
          lastVisit: newCustomer.lastVisit || new Date()
        } as Omit<Customer, 'id' | 'businessId'>);
        setCustomers([...customers, created]);
      }
      
      setNewCustomer({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: 0,
        favoriteItems: [],
        lastVisit: new Date()
      });
      setEditingCustomer(null);
      setOpenDialog(false);
    } catch (err) {
      console.error('Error saving customer:', err);
      alert('Failed to save customer');
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setNewCustomer(customer);
    setEditingCustomer(customer);
    setOpenDialog(true);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customersService.delete(id);
        setCustomers(customers.filter(customer => customer.id !== id));
      } catch (err) {
        console.error('Error deleting customer:', err);
        alert('Failed to delete customer');
      }
    }
  };

  const getLoyaltyTier = (points: number) => {
    if (points >= 200) return { tier: 'Gold', color: 'warning' };
    if (points >= 100) return { tier: 'Silver', color: 'info' };
    return { tier: 'Bronze', color: 'default' };
  };

  const totalCustomers = customers.length;
  const totalLoyaltyPoints = customers.reduce((sum, customer) => sum + (customer.loyaltyPoints || 0), 0);
  const avgOrderValue = customers.length > 0 
    ? customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0) / 
      customers.reduce((sum, customer) => sum + (customer.totalOrders || 0), 0)
    : 0;

  const handleFavoriteItemsChange = (value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setNewCustomer({ ...newCustomer, favoriteItems: items });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={loadCustomers}>Retry</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Customer Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Customer
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Customers
              </Typography>
              <Typography variant="h4">
                {totalCustomers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                Loyalty Points Issued
              </Typography>
              <Typography variant="h4">
                {totalLoyaltyPoints.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Avg Order Value
              </Typography>
              <Typography variant="h4">
                {formatCurrency(avgOrderValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                Repeat Customers
              </Typography>
              <Typography variant="h4">
                {customers.filter(c => (c.totalOrders || 0) > 1).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Customer List" />
          <Tab label="Loyalty Program" />
          <Tab label="Analytics" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            {customers.map((customer) => {
              const loyaltyTier = getLoyaltyTier(customer.loyaltyPoints || 0);
              return (
                <Grid item xs={12} sm={6} md={4} key={customer.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ mr: 2 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6">
                            {customer.firstName} {customer.lastName}
                          </Typography>
                          <Chip
                            label={loyaltyTier.tier}
                            color={loyaltyTier.color as any}
                            size="small"
                            icon={<StarIcon />}
                          />
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => handleEditCustomer(customer)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteCustomer(customer.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Email: {customer.email}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Phone: {customer.phone}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Loyalty Points: {customer.loyaltyPoints || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Total Orders: {customer.totalOrders || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Total Spent: {formatCurrency(customer.totalSpent || 0)}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Last Visit: {customer.lastVisit?.toLocaleDateString() || 'Never'}
                      </Typography>
                      
                      {(customer.favoriteItems?.length || 0) > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" display="block">
                            Favorite Items:
                          </Typography>
                          {(customer.favoriteItems || []).map((item, index) => (
                            <Chip
                              key={index}
                              label={item}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Loyalty Program Overview
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Tier</TableCell>
                  <TableCell>Points</TableCell>
                  <TableCell>Total Orders</TableCell>
                  <TableCell>Total Spent</TableCell>
                  <TableCell>Points per $</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers
                  .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
                  .map((customer) => {
                    const loyaltyTier = getLoyaltyTier(customer.loyaltyPoints || 0);
                    const pointsPerDollar = (customer.totalSpent || 0) > 0 
                      ? (customer.loyaltyPoints || 0) / (customer.totalSpent || 0)
                      : 0;
                    
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          {customer.firstName} {customer.lastName}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={loyaltyTier.tier}
                            color={loyaltyTier.color as any}
                            size="small"
                            icon={<StarIcon />}
                          />
                        </TableCell>
                        <TableCell>{customer.loyaltyPoints || 0}</TableCell>
                        <TableCell>{customer.totalOrders || 0}</TableCell>
                        <TableCell>{formatCurrency(customer.totalSpent || 0)}</TableCell>
                        <TableCell>{formatCurrency(pointsPerDollar)}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Customer Analytics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Loyalty Tier Distribution
                  </Typography>
                  <Box>
                    <Typography variant="body2">
                      Gold Members: {customers.filter(c => (c.loyaltyPoints || 0) >= 200).length}
                    </Typography>
                    <Typography variant="body2">
                      Silver Members: {customers.filter(c => (c.loyaltyPoints || 0) >= 100 && (c.loyaltyPoints || 0) < 200).length}
                    </Typography>
                    <Typography variant="body2">
                      Bronze Members: {customers.filter(c => (c.loyaltyPoints || 0) < 100).length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Customer Insights
                  </Typography>
                  <Typography variant="body2">
                    Most Loyal Customer: {customers.sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))[0]?.firstName} {customers.sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))[0]?.lastName}
                  </Typography>
                  <Typography variant="body2">
                    Highest Spender: {customers.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))[0]?.firstName} {customers.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))[0]?.lastName}
                  </Typography>
                  <Typography variant="body2">
                    Most Frequent Visitor: {customers.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))[0]?.firstName} {customers.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))[0]?.lastName}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newCustomer.firstName || ''}
                onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newCustomer.lastName || ''}
                onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newCustomer.email || ''}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={newCustomer.phone || ''}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Loyalty Points"
                type="number"
                value={newCustomer.loyaltyPoints || 0}
                onChange={(e) => setNewCustomer({ ...newCustomer, loyaltyPoints: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Total Orders"
                type="number"
                value={newCustomer.totalOrders || 0}
                onChange={(e) => setNewCustomer({ ...newCustomer, totalOrders: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Total Spent"
                type="number"
                inputProps={{ step: "0.01" }}
                value={newCustomer.totalSpent || 0}
                onChange={(e) => setNewCustomer({ ...newCustomer, totalSpent: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Favorite Items (comma separated)"
                value={newCustomer.favoriteItems?.join(', ') || ''}
                onChange={(e) => handleFavoriteItemsChange(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCustomer} variant="contained">
            {editingCustomer ? 'Update' : 'Add'} Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}