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
} from '@mui/icons-material';
import { Order, OrderItem, MenuItem, Employee, Customer } from '../types';
import { 
  ordersService, 
  menuItemsService, 
  employeesService,
  customersService,
  subscriptions 
} from '../services/supabaseService';

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
    status: 'pending',
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
      status: 'pending',
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
        status: 'pending',
        orderTime: new Date(),
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

  const handleImportFromDefrayal = async () => {
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

  // Calculate order statistics
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Order Management</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<UploadIcon />} 
            onClick={() => setOpenImportDialog(true)}
            sx={{ mr: 1 }}
          >
            Import from Defrayal
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpenOrderDialog(true)}
          >
            New Order
          </Button>
        </Box>
      </Box>

      {/* Order Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon color="primary" />
                <Typography variant="h6">Total Orders</Typography>
              </Box>
              <Typography variant="h4">{orderStats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimeIcon color="warning" />
                <Typography variant="h6">Pending</Typography>
              </Box>
              <Typography variant="h4">{orderStats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <KitchenIcon color="info" />
                <Typography variant="h6">Preparing</Typography>
              </Box>
              <Typography variant="h4">{orderStats.preparing}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CompleteIcon color="success" />
                <Typography variant="h6">Ready</Typography>
              </Box>
              <Typography variant="h4">{orderStats.ready}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon color="success" />
                <Typography variant="h6">Revenue</Typography>
              </Box>
              <Typography variant="h4">${orderStats.totalRevenue.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon color="info" />
                <Typography variant="h6">Avg Order</Typography>
              </Box>
              <Typography variant="h4">${orderStats.averageOrderValue.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Orders" />
          <Tab label="Kitchen View" />
          <Tab label="Analytics" />
        </Tabs>

        {/* All Orders Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Actions</TableCell>
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
                        {order.status === 'pending' && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                            title="Start Preparing"
                          >
                            <KitchenIcon />
                          </IconButton>
                        )}
                        {order.status === 'preparing' && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                            title="Mark Ready"
                          >
                            <CompleteIcon />
                          </IconButton>
                        )}
                        {order.status === 'ready' && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                            title="Complete Order"
                          >
                            <CompleteIcon />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteOrder(order.id)}
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

        {/* Kitchen View Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            {['pending', 'preparing', 'ready'].map(status => (
              <Grid item xs={12} md={4} key={status}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
                      {status} Orders ({orders.filter(o => o.status === status).length})
                    </Typography>
                    <List>
                      {orders.filter(o => o.status === status).map(order => (
                        <ListItem key={order.id} divider>
                          <ListItemText
                            primary={`Order ${order.orderNumber || order.id.slice(0, 8)}`}
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  {order.items.map(item => 
                                    `${item.quantity}x ${item.menuItem?.name || 'Unknown'}`
                                  ).join(', ')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {order.orderTime.toLocaleTimeString()} | ${order.total.toFixed(2)}
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            {status === 'pending' && (
                              <IconButton 
                                onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                              >
                                <KitchenIcon />
                              </IconButton>
                            )}
                            {status === 'preparing' && (
                              <IconButton 
                                onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                              >
                                <CompleteIcon />
                              </IconButton>
                            )}
                            {status === 'ready' && (
                              <IconButton 
                                onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                              >
                                <CompleteIcon />
                              </IconButton>
                            )}
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={2}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Detailed analytics will be implemented here, including daily/weekly/monthly sales reports, 
            popular items, peak hours, customer analytics, and revenue trends.
          </Alert>
        </TabPanel>
      </Paper>

      {/* Import Dialog */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Orders from Defrayal Machine</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Paste the JSON export from your Defrayal machine below. The system will automatically 
            process and import the orders into your database.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={10}
            label="Defrayal Export Data (JSON)"
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
          <Button onClick={handleImportFromDefrayal} variant="contained">
            Import Orders
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Order Dialog */}
      <Dialog open={openOrderDialog} onClose={() => setOpenOrderDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Create New Order</DialogTitle>
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

              {/* Payment & Order Details */}
              <Box sx={{ mt: 2 }}>
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
            Create Order (${calculateTotals().total.toFixed(2)})
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