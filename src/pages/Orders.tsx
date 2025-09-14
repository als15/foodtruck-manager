import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
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
  IconButton,
  Select,
  MenuItem as MuiMenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tabs,
  Tab,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Upload as UploadIcon,
  Kitchen as KitchenIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  Schedule as TimeIcon,
  Person as CustomerIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  LocationOn as LocationIcon,
  AccessTime as PeakIcon,
} from '@mui/icons-material';
import { Order, OrderItem, MenuItem, Employee, Customer } from '../types';
import { 
  ordersService, 
  menuItemsService, 
  employeesService,
  customersService,
  subscriptions 
} from '../services/supabaseService';
import { useTranslation } from 'react-i18next';

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

export default function Orders() {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  // Dialog states
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Form states
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    items: [],
    total: 0,
    subtotal: 0,
    taxAmount: 0,
    tipAmount: 0,
    status: 'completed',
    orderTime: new Date(),
    location: 'Main Location',
    paymentMethod: 'card',
    paymentStatus: 'completed'
  });

  // Order form specific states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [taxRate, setTaxRate] = useState(0.08); // 8% tax rate

  const [importData, setImportData] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const ordersSubscription = subscriptions.orders ? subscriptions.orders(() => {
      loadOrders();
    }) : null;

    return () => {
      if (ordersSubscription) {
        ordersSubscription.unsubscribe();
      }
    };
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOrders(),
        loadMenuItems(),
        loadEmployees(),
        loadCustomers()
      ]);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await ordersService.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadMenuItems = async () => {
    try {
      const data = await menuItemsService.getAll();
      setMenuItems(data);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await employeesService.getAll();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await customersService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await ordersService.updateStatus(orderId, status);
      setSnackbar({ open: true, message: `Order ${status}`, severity: 'success' });
      await loadOrders();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update order status', severity: 'error' });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await ordersService.delete(orderId);
      setSnackbar({ open: true, message: 'Order deleted successfully', severity: 'success' });
      await loadOrders();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete order', severity: 'error' });
    }
  };

  // Order form helper functions
  const addMenuItem = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItemId === menuItem.id);
    
    if (existingItem) {
      setOrderItems(prev => prev.map(item => 
        item.menuItemId === menuItem.id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      const newItem: OrderItem = {
        menuItemId: menuItem.id,
        menuItem: {
          name: menuItem.name,
          description: menuItem.description,
          price: menuItem.price
        },
        quantity: 1,
        unitPrice: menuItem.price,
        totalPrice: menuItem.price
      };
      setOrderItems(prev => [...prev, newItem]);
    }
  };

  const updateItemQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.menuItemId !== menuItemId));
    } else {
      setOrderItems(prev => prev.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
          : item
      ));
    }
  };

  const removeMenuItem = (menuItemId: string) => {
    setOrderItems(prev => prev.filter(item => item.menuItemId !== menuItemId));
  };

  // Calculate order totals
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = subtotal * taxRate;
    const tipAmount = newOrder.tipAmount || 0;
    const total = subtotal + taxAmount + tipAmount;
    
    return { subtotal, taxAmount, tipAmount, total };
  };

  const resetOrderForm = () => {
    setOrderItems([]);
    setSelectedCustomerId('');
    setNewCustomer({ firstName: '', lastName: '', email: '', phone: '' });
    setShowNewCustomerForm(false);
    setNewOrder({
      items: [],
      total: 0,
      subtotal: 0,
      taxAmount: 0,
      tipAmount: 0,
      status: 'completed',
      orderTime: new Date(),
      location: 'Main Location',
      paymentMethod: 'card',
      paymentStatus: 'completed'
    });
  };

  const handleCreateOrder = async () => {
    try {
      let customerId = selectedCustomerId;
      
      // Create new customer if needed
      if (showNewCustomerForm && newCustomer.firstName) {
        const customer = await customersService.create(newCustomer);
        customerId = customer.id;
      }
      
      const totals = calculateTotals();
      
      const orderData: Omit<Order, 'id' | 'orderNumber'> = {
        customerId: customerId || undefined,
        items: orderItems,
        total: totals.total,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        tipAmount: totals.tipAmount,
        discountAmount: 0,
        status: 'completed',
        orderTime: newOrder.orderTime || new Date(),
        completedTime: newOrder.orderTime || new Date(),
        location: newOrder.location || 'Main Location',
        paymentMethod: newOrder.paymentMethod || 'card',
        paymentStatus: 'completed',
        specialInstructions: newOrder.specialInstructions
      };
      
      await ordersService.create(orderData);
      setSnackbar({ open: true, message: 'Order created successfully', severity: 'success' });
      setOpenOrderDialog(false);
      resetOrderForm();
      await loadOrders();
      if (showNewCustomerForm) {
        await loadCustomers();
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to create order', severity: 'error' });
    }
  };

  const handleImportOrders = async () => {
    try {
      // Parse the import data (expecting JSON format)
      const externalOrders = JSON.parse(importData);
      const importedOrders = await ordersService.importFromExternal(externalOrders);
      
      setSnackbar({ 
        open: true, 
        message: `Successfully imported ${importedOrders.length} orders`, 
        severity: 'success' 
      });
      
      setImportData('');
      setOpenImportDialog(false);
      await loadOrders();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to import orders. Check JSON format.', severity: 'error' });
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'preparing': return 'info';
      case 'ready': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      case 'refunded': return 'error';
      default: return 'default';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'mobile': return '📱';
      case 'online': return '🌐';
      default: return '💰';
    }
  };

  // Calculate comprehensive business analytics
  const getDateFilters = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    return { today, yesterday, thisWeekStart, lastWeekStart, lastWeekEnd, thisMonth, lastMonth, lastMonthEnd };
  };

  const analytics = () => {
    const { today, yesterday, thisWeekStart, lastWeekStart, lastWeekEnd, thisMonth, lastMonth, lastMonthEnd } = getDateFilters();
    
    // Filter orders by time periods
    const todayOrders = orders.filter(o => new Date(o.orderTime) >= today);
    const yesterdayOrders = orders.filter(o => {
      const orderDate = new Date(o.orderTime);
      return orderDate >= yesterday && orderDate < today;
    });
    const thisWeekOrders = orders.filter(o => new Date(o.orderTime) >= thisWeekStart);
    const lastWeekOrders = orders.filter(o => {
      const orderDate = new Date(o.orderTime);
      return orderDate >= lastWeekStart && orderDate <= lastWeekEnd;
    });
    const thisMonthOrders = orders.filter(o => new Date(o.orderTime) >= thisMonth);
    const lastMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.orderTime);
      return orderDate >= lastMonth && orderDate <= lastMonthEnd;
    });

    // Revenue calculations
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);
    const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + o.total, 0);
    const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + o.total, 0);
    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.total, 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + o.total, 0);

    // Growth calculations
    const dailyGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;
    const weeklyGrowth = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100) : 0;
    const monthlyGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;

    // Top-selling items analysis
    const itemSales = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        const itemName = item.menuItem?.name || 'Unknown Item';
        if (!acc[itemName]) {
          acc[itemName] = { quantity: 0, revenue: 0 };
        }
        acc[itemName].quantity += item.quantity;
        acc[itemName].revenue += item.totalPrice;
      });
      return acc;
    }, {} as Record<string, { quantity: number; revenue: number }>);

    const topItems = Object.entries(itemSales)
      .sort(([,a], [,b]) => b.quantity - a.quantity)
      .slice(0, 5);

    // Peak hours analysis
    const hourlyOrders = orders.reduce((acc, order) => {
      const hour = new Date(order.orderTime).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHour = Object.entries(hourlyOrders)
      .sort(([,a], [,b]) => b - a)[0];

    // Payment method breakdown
    const paymentMethods = orders.reduce((acc, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Location performance
    const locationStats = orders.reduce((acc, order) => {
      const location = order.location || 'Unknown';
      if (!acc[location]) {
        acc[location] = { orders: 0, revenue: 0 };
      }
      acc[location].orders += 1;
      acc[location].revenue += order.total;
      return acc;
    }, {} as Record<string, { orders: number; revenue: number }>);

    return {
      todayOrders: todayOrders.length,
      todayRevenue,
      dailyGrowth,
      thisWeekOrders: thisWeekOrders.length,
      thisWeekRevenue,
      weeklyGrowth,
      thisMonthOrders: thisMonthOrders.length,
      thisMonthRevenue,
      monthlyGrowth,
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
      topItems,
      peakHour: peakHour ? { hour: parseInt(peakHour[0]), count: peakHour[1] } : null,
      paymentMethods,
      locationStats,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.total, 0)
    };
  };

  const stats = analytics();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('order_management')}</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<UploadIcon />} 
            onClick={() => setOpenImportDialog(true)}
            sx={{ mr: 1 }}
          >
            {t('import_orders')}
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpenOrderDialog(true)}
          >
            {t('add_order_record')}
          </Button>
        </Box>
      </Box>

      {/* Enhanced Business Analytics Dashboard */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        
        {/* Today's Performance */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6" color="primary">{t('todays_performance')}</Typography>
                  <Typography variant="h4" className="number-ltr">${stats.todayRevenue.toFixed(2)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('orders_count', { count: stats.todayOrders })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {stats.dailyGrowth > 0 ? (
                    <TrendingUpIcon color="success" className="trend-icon" />
                  ) : stats.dailyGrowth < 0 ? (
                    <TrendingDownIcon color="error" className="trend-icon" />
                  ) : (
                    <TrendingFlatIcon color="disabled" className="trend-icon" />
                  )}
                  <Typography 
                    variant="body2" 
                    color={stats.dailyGrowth > 0 ? 'success.main' : stats.dailyGrowth < 0 ? 'error.main' : 'text.secondary'}
                  >
                    {stats.dailyGrowth > 0 ? '+' : ''}{stats.dailyGrowth.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* This Week */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6" color="info.main">{t('this_week')}</Typography>
                  <Typography variant="h4">${stats.thisWeekRevenue.toFixed(2)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.thisWeekOrders} orders
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {stats.weeklyGrowth > 0 ? (
                    <TrendingUpIcon color="success" className="trend-icon" />
                  ) : stats.weeklyGrowth < 0 ? (
                    <TrendingDownIcon color="error" className="trend-icon" />
                  ) : (
                    <TrendingFlatIcon color="disabled" className="trend-icon" />
                  )}
                  <Typography 
                    variant="body2" 
                    color={stats.weeklyGrowth > 0 ? 'success.main' : stats.weeklyGrowth < 0 ? 'error.main' : 'text.secondary'}
                  >
                    {stats.weeklyGrowth > 0 ? '+' : ''}{stats.weeklyGrowth.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* This Month */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6" color="secondary.main">{t('this_month')}</Typography>
                  <Typography variant="h4">${stats.thisMonthRevenue.toFixed(2)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.thisMonthOrders} orders
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {stats.monthlyGrowth > 0 ? (
                    <TrendingUpIcon color="success" className="trend-icon" />
                  ) : stats.monthlyGrowth < 0 ? (
                    <TrendingDownIcon color="error" className="trend-icon" />
                  ) : (
                    <TrendingFlatIcon color="disabled" className="trend-icon" />
                  )}
                  <Typography 
                    variant="body2" 
                    color={stats.monthlyGrowth > 0 ? 'success.main' : stats.monthlyGrowth < 0 ? 'error.main' : 'text.secondary'}
                  >
                    {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Selling Items */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>🏆 {t('top_selling_items')}</Typography>
              <List dense>
                {stats.topItems.slice(0, 5).map(([itemName, data], index) => (
                  <ListItem key={itemName} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">
                            #{index + 1} {itemName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {data.quantity} sold
                          </Typography>
                        </Box>
                      }
                      secondary={`$${data.revenue.toFixed(2)} revenue`}
                    />
                  </ListItem>
                ))}
                {stats.topItems.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No sales data available
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Key Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>📊 {t('key_metrics')}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <MoneyIcon color="success" />
                    <Typography variant="h6">${stats.averageOrderValue.toFixed(2)}</Typography>
                    <Typography variant="caption">{t('avg_order_value')}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <ReceiptIcon color="primary" />
                    <Typography variant="h6">{stats.totalOrders}</Typography>
                    <Typography variant="caption">{t('total_orders')}</Typography>
                  </Box>
                </Grid>
                {stats.peakHour && (
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <PeakIcon color="warning" />
                      <Typography variant="h6">
                        {stats.peakHour.hour}:00
                      </Typography>
                      <Typography variant="caption">{t('peak_hour')}</Typography>
                    </Box>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <MoneyIcon color="info" />
                    <Typography variant="h6">${stats.totalRevenue.toFixed(2)}</Typography>
                    <Typography variant="caption">{t('total_revenue')}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Methods Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>💳 {t('payment_methods')}</Typography>
              <List dense>
                {Object.entries(stats.paymentMethods).map(([method, count]) => (
                  <ListItem key={method} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">
                            {getPaymentMethodIcon(method)} {method.charAt(0).toUpperCase() + method.slice(1)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {count} orders ({((count / stats.totalOrders) * 100).toFixed(1)}%)
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {Object.keys(stats.paymentMethods).length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No payment data available
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Location Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>📍 {t('location_performance')}</Typography>
              <List dense>
                {Object.entries(stats.locationStats)
                  .sort(([,a], [,b]) => b.revenue - a.revenue)
                  .map(([location, data]) => (
                  <ListItem key={location} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">
                            <LocationIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {location}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ${data.revenue.toFixed(2)}
                          </Typography>
                        </Box>
                      }
                      secondary={`${data.orders} orders • $${(data.revenue / data.orders).toFixed(2)} avg`}
                    />
                  </ListItem>
                ))}
                {Object.keys(stats.locationStats).length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No location data available
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={t('all_orders')} />
          <Tab label={t('analytics')} />
        </Tabs>

        {/* All Orders Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('order_number')}</TableCell>
                  <TableCell>{t('time')}</TableCell>
                  <TableCell>{t('customer')}</TableCell>
                  <TableCell>{t('items')}</TableCell>
                  <TableCell>{t('total')}</TableCell>
                  <TableCell>{t('payment')}</TableCell>
                  <TableCell>{t('status')}</TableCell>
                  <TableCell>{t('source')}</TableCell>
                  <TableCell>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {order.orderNumber || order.id.slice(0, 8)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.orderTime.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {order.customer ? (
                        <Box>
                          <Typography variant="body2">
                            {order.customer.firstName} {order.customer.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.customer.phone}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Walk-in
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.items.length} item(s)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.items.map(item => 
                          `${item.quantity}x ${item.menuItem?.name || 'Unknown'}`
                        ).join(', ')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ${order.total.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Sub: ${order.subtotal.toFixed(2)}
                        {order.taxAmount && order.taxAmount > 0 && ` | Tax: $${order.taxAmount.toFixed(2)}`}
                        {order.tipAmount && order.tipAmount > 0 && ` | Tip: $${order.tipAmount.toFixed(2)}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span>{getPaymentMethodIcon(order.paymentMethod)}</span>
                        <Typography variant="body2">
                          {order.paymentMethod}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status} 
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.externalSource || 'manual'}
                      </Typography>
                      {order.externalOrderId && (
                        <Typography variant="caption" color="text.secondary">
                          ID: {order.externalOrderId}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteOrder(order.id)}
                          title="Delete Order"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={1}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Detailed analytics will be implemented here, including daily/weekly/monthly sales reports, 
            popular items, peak hours, customer analytics, and revenue trends.
          </Alert>
        </TabPanel>
      </Paper>

      {/* Import Dialog */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Orders from Clearing Device</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Paste the export data from your clearing device below (JSON or CSV format). The system will automatically 
            process and import the orders into your database.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={10}
            label="Clearing Device Export Data"
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder={`[
  {
    "externalId": "DEF001",
    "total": 15.50,
    "subtotal": 14.23,
    "taxAmount": 1.27,
    "orderTime": "2024-01-15T14:30:00Z",
    "paymentMethod": "card",
    "items": [
      {
        "menuItemId": "menu-item-uuid-here",
        "quantity": 1,
        "unitPrice": 14.23
      }
    ]
  }
]`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportDialog(false)}>Cancel</Button>
          <Button onClick={handleImportOrders} variant="contained">
            Import Orders
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Order Dialog */}
      <Dialog open={openOrderDialog} onClose={() => setOpenOrderDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Add Order Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            
            {/* Customer Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>Customer Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Customer</InputLabel>
                    <Select
                      value={selectedCustomerId}
                      onChange={(e) => {
                        setSelectedCustomerId(e.target.value);
                        setShowNewCustomerForm(false);
                      }}
                      disabled={showNewCustomerForm}
                    >
                      <MuiMenuItem value="">Walk-in Customer</MuiMenuItem>
                      {customers.map(customer => (
                        <MuiMenuItem key={customer.id} value={customer.id}>
                          {customer.firstName} {customer.lastName} 
                          {customer.phone && ` - ${customer.phone}`}
                        </MuiMenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    variant={showNewCustomerForm ? "contained" : "outlined"}
                    onClick={() => {
                      setShowNewCustomerForm(!showNewCustomerForm);
                      setSelectedCustomerId('');
                    }}
                    startIcon={<CustomerIcon />}
                  >
                    {showNewCustomerForm ? "Cancel New Customer" : "Add New Customer"}
                  </Button>
                </Grid>
              </Grid>

              {/* New Customer Form */}
              {showNewCustomerForm && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={newCustomer.firstName}
                      onChange={(e) => setNewCustomer({...newCustomer, firstName: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={newCustomer.lastName}
                      onChange={(e) => setNewCustomer({...newCustomer, lastName: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ width: '100%', my: 2 }} />

            {/* Menu Items Selection */}
            <Grid item xs={12} md={7}>
              <Typography variant="h6" sx={{ mb: 2 }}>Select Menu Items</Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {(() => {
                  // Group menu items by category
                  const availableItems = menuItems.filter(item => item.isAvailable);
                  const groupedItems = availableItems.reduce((groups, item) => {
                    const category = item.category || 'Other';
                    if (!groups[category]) {
                      groups[category] = [];
                    }
                    groups[category].push(item);
                    return groups;
                  }, {} as Record<string, MenuItem[]>);

                  const categories = Object.keys(groupedItems).sort();

                  return categories.map(category => (
                    <Box key={category} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                        {category}
                      </Typography>
                      <Grid container spacing={1}>
                        {groupedItems[category].map(item => (
                          <Grid item xs={12} sm={6} key={item.id}>
                            <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => addMenuItem(item)}>
                              <CardContent sx={{ p: 2 }}>
                                <Typography variant="subtitle2">{item.name}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                  {item.description}
                                </Typography>
                                <Typography variant="h6" color="primary">${item.price.toFixed(2)}</Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ));
                })()}
              </Box>
            </Grid>

            {/* Order Summary */}
            <Grid item xs={12} md={5}>
              <Typography variant="h6" sx={{ mb: 2 }}>Order Summary</Typography>
              
              {/* Selected Items */}
              <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                {orderItems.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No items selected" />
                  </ListItem>
                ) : (
                  orderItems.map((item) => (
                    <ListItem key={item.menuItemId} divider>
                      <ListItemText
                        primary={item.menuItem?.name}
                        secondary={`$${item.unitPrice.toFixed(2)} each`}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => updateItemQuantity(item.menuItemId, item.quantity - 1)}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <Typography>{item.quantity}</Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => updateItemQuantity(item.menuItemId, item.quantity + 1)}
                        >
                          <AddIcon />
                        </IconButton>
                        <Typography sx={{ ml: 1, minWidth: 60, textAlign: 'right' }}>
                          ${item.totalPrice.toFixed(2)}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))
                )}
              </List>

              {/* Order Totals */}
              {orderItems.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  {(() => {
                    const totals = calculateTotals();
                    return (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>Subtotal:</Typography>
                          <Typography>${totals.subtotal.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>Tax ({(taxRate * 100).toFixed(0)}%):</Typography>
                          <Typography>${totals.taxAmount.toFixed(2)}</Typography>
                        </Box>
                        <TextField
                          fullWidth
                          label="Tip Amount"
                          type="number"
                          size="small"
                          value={newOrder.tipAmount || 0}
                          onChange={(e) => setNewOrder({...newOrder, tipAmount: parseFloat(e.target.value) || 0})}
                          sx={{ mt: 1 }}
                        />
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                          <Typography variant="h6">Total:</Typography>
                          <Typography variant="h6">${totals.total.toFixed(2)}</Typography>
                        </Box>
                      </>
                    );
                  })()}
                </Box>
              )}

              {/* Order Details */}
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Order Date & Time"
                  type="datetime-local"
                  value={newOrder.orderTime ? newOrder.orderTime.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setNewOrder({...newOrder, orderTime: new Date(e.target.value)})}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  label="Location"
                  value={newOrder.location || 'Main Location'}
                  onChange={(e) => setNewOrder({...newOrder, location: e.target.value})}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={newOrder.paymentMethod || 'card'}
                    onChange={(e) => setNewOrder({...newOrder, paymentMethod: e.target.value as any})}
                  >
                    <MuiMenuItem value="cash">Cash 💵</MuiMenuItem>
                    <MuiMenuItem value="card">Card 💳</MuiMenuItem>
                    <MuiMenuItem value="mobile">Mobile 📱</MuiMenuItem>
                    <MuiMenuItem value="online">Online 🌐</MuiMenuItem>
                    <MuiMenuItem value="other">Other 💰</MuiMenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Special Instructions"
                  multiline
                  rows={2}
                  value={newOrder.specialInstructions || ''}
                  onChange={(e) => setNewOrder({...newOrder, specialInstructions: e.target.value})}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {setOpenOrderDialog(false); resetOrderForm();}}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateOrder}
            disabled={orderItems.length === 0}
          >
            Add Order Record (${calculateTotals().total.toFixed(2)})
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}