import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon, TrendingUp, TrendingDown } from '@mui/icons-material';
import { Transaction } from '../types';
import { transactionsService, subscriptions } from '../services/supabaseService';
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

export default function Finances() {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' 
  });

  const [newTransaction, setNewTransaction] = useState({
    type: 'revenue' as 'revenue' | 'expense',
    category: '',
    amount: '',
    description: '',
    location: '',
    paymentMethod: ''
  });

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = subscriptions.transactions(payload => {
      console.log('Transactions changed:', payload);
      // Reload transactions when changes occur
      loadTransactions();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transactionsService.getAll();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      setSnackbar({ open: true, message: 'Failed to load transactions', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddTransaction = async () => {
    try {
      const transactionData: Omit<Transaction, 'id' | 'businessId'> = {
        date: new Date(),
        type: newTransaction.type,
        category: newTransaction.category,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        location: newTransaction.location,
        paymentMethod: newTransaction.paymentMethod
      };
      
      await transactionsService.create(transactionData);
      setSnackbar({ open: true, message: 'Transaction added successfully', severity: 'success' });
      
      // Reload transactions to get updated data
      await loadTransactions();
      
      setNewTransaction({
        type: 'revenue',
        category: '',
        amount: '',
        description: '',
        location: '',
        paymentMethod: ''
      });
      setOpenDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to add transaction', severity: 'error' });
    }
  };

  const totalRevenue = transactions
    .filter(t => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const profit = totalRevenue - totalExpenses;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
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
        <Button variant="contained" onClick={loadTransactions}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Financial Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Transaction
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6">Total Revenue</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {formatCurrency(totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="h6">Total Expenses</Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                {formatCurrency(totalExpenses)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Net Profit</Typography>
              <Typography 
                variant="h4" 
                color={profit >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(profit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Transactions" />
          <Tab label="Revenue" />
          <Tab label="Expenses" />
          {/* TODO: Implement Reports functionality in future */}
          {/* <Tab label="Reports" /> */}
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.date.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.type}
                        color={transaction.type === 'revenue' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.location}</TableCell>
                    <TableCell align="right">
                      <Typography 
                        color={transaction.type === 'revenue' ? 'success.main' : 'error.main'}
                      >
                        {transaction.type === 'revenue' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6">Revenue Tracking</Typography>
          <Typography variant="body2">Revenue analysis and tracking coming soon...</Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6">Expense Management</Typography>
          <Typography variant="body2">Expense categorization and analysis coming soon...</Typography>
        </TabPanel>

        {/* TODO: Implement Reports TabPanel in future */}
        {/* <TabPanel value={tabValue} index={3}>
          <Typography variant="h6">Financial Reports</Typography>
          <Typography variant="body2">Detailed financial reports coming soon...</Typography>
        </TabPanel> */}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Transaction</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value as 'revenue' | 'expense'})}
                >
                  <MenuItem value="revenue">Revenue</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category"
                value={newTransaction.category}
                onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={newTransaction.location}
                onChange={(e) => setNewTransaction({...newTransaction, location: e.target.value})}
              />
            </Grid>
            {newTransaction.type === 'revenue' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Payment Method"
                  value={newTransaction.paymentMethod}
                  onChange={(e) => setNewTransaction({...newTransaction, paymentMethod: e.target.value})}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddTransaction} variant="contained">Add Transaction</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}