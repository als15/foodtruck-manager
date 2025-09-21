import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Autocomplete,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { SupplierOrderItem, Supplier, Ingredient } from '../types';
import { formatCurrency } from '../utils/currency';

// Simple test component to validate the add item functionality
export default function SupplierOrdersSimple() {
  const [open, setOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [orderItems, setOrderItems] = useState<(SupplierOrderItem & { tempId: string })[]>([]);

  // Mock data
  const suppliers: Supplier[] = [
    {
      id: 'supplier-1',
      businessId: 'test-business-id',
      name: 'Pizza Supplier Co',
      contactPerson: 'John Doe',
      email: 'john@pizza.com',
      phone: '123-456-7890',
      address: '123 Pizza St',
      deliveryDays: ['Monday'],
      orderSubmissionDays: ['Friday'],
      minimumOrderAmount: 100,
      leadTime: 2,
      autoOrderEnabled: true,
      paymentTerms: 'Net 30',
      deliveryMethods: ['delivery', 'pickup'],
      notes: '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const ingredients: Ingredient[] = [
    {
      id: 'ingredient-1',
      businessId: 'test-business-id',
      name: 'Pizza Dough',
      costPerUnit: 2.50,
      unit: 'lbs',
      supplier: 'Pizza Supplier Co',
      category: 'Base',
      isAvailable: true,
      lastUpdated: new Date(),
    },
    {
      id: 'ingredient-2',
      businessId: 'test-business-id',
      name: 'Mozzarella Cheese',
      costPerUnit: 4.00,
      unit: 'lbs',
      supplier: 'Pizza Supplier Co',
      category: 'Cheese',
      isAvailable: true,
      lastUpdated: new Date(),
    },
  ];

  // Memoized filtered ingredients
  const filteredIngredients = useMemo(() => {
    if (!selectedSupplierId) return [];
    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!selectedSupplier) return [];
    
    return ingredients.filter(ingredient => 
      ingredient.supplier === selectedSupplier.name
    );
  }, [selectedSupplierId]);

  const handleAddOrderItem = useCallback(() => {
    const newItem = {
      tempId: `temp-${Date.now()}-${Math.random()}`,
      ingredientId: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      notes: ''
    };
    setOrderItems(prev => [...prev, newItem]);
  }, []);

  const handleUpdateOrderItem = useCallback((tempId: string, field: keyof SupplierOrderItem, value: any) => {
    setOrderItems(prev => prev.map(item => {
      if (item.tempId !== tempId) return item;
      
      const updatedItem = { ...item, [field]: value };
      
      // Recalculate total price
      if (field === 'quantity' || field === 'unitPrice') {
        updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
      }
      
      return updatedItem;
    }));
  }, []);

  const handleRemoveOrderItem = useCallback((tempId: string) => {
    setOrderItems(prev => prev.filter(item => item.tempId !== tempId));
  }, []);

  const handleSupplierChange = useCallback((supplier: Supplier | null) => {
    setSelectedSupplierId(supplier?.id || '');
    setOrderItems([]); // Clear items when supplier changes
  }, []);

  return (
    <Box>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Test Order Dialog
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Test Supplier Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={suppliers}
                getOptionLabel={(option) => option.name}
                value={suppliers.find(s => s.id === selectedSupplierId) || null}
                onChange={(_, supplier) => handleSupplierChange(supplier)}
                renderInput={(params) => (
                  <TextField {...params} label="Supplier" fullWidth required />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Order Items</Typography>
            <Button 
              startIcon={<AddIcon />} 
              onClick={handleAddOrderItem}
              disabled={!selectedSupplierId}
            >
              Add Item
            </Button>
          </Box>

          {!selectedSupplierId && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Please select a supplier first to add ingredients to your order.
            </Alert>
          )}

          {selectedSupplierId && filteredIngredients.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No ingredients are available for the selected supplier.
            </Alert>
          )}

          {orderItems.map((item) => (
            <Grid container spacing={2} key={item.tempId} sx={{ mb: 2, alignItems: 'center' }}>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={filteredIngredients}
                  getOptionLabel={(option) => option.name}
                  value={filteredIngredients.find(i => i.id === item.ingredientId) || null}
                  onChange={(_, ingredient) => {
                    handleUpdateOrderItem(item.tempId, 'ingredientId', ingredient?.id || '');
                    if (ingredient) {
                      handleUpdateOrderItem(item.tempId, 'unitPrice', ingredient.costPerUnit);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Ingredient" size="small" />
                  )}
                  disabled={!selectedSupplierId}
                  noOptionsText={
                    !selectedSupplierId 
                      ? "Please select a supplier first" 
                      : "No ingredients available for this supplier"
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  label="Quantity"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleUpdateOrderItem(item.tempId, 'quantity', Number(e.target.value))}
                  size="small"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  label="Unit Price"
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => handleUpdateOrderItem(item.tempId, 'unitPrice', Number(e.target.value))}
                  size="small"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  label="Total"
                  value={formatCurrency(item.totalPrice)}
                  size="small"
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <Button onClick={() => handleRemoveOrderItem(item.tempId)} color="error">
                  <DeleteIcon />
                </Button>
              </Grid>
            </Grid>
          ))}

          <Typography variant="body2" sx={{ mt: 2 }}>
            Items: {orderItems.length} | 
            Selected ingredients: {orderItems.filter(item => item.ingredientId).map(item => 
              filteredIngredients.find(ing => ing.id === item.ingredientId)?.name || 'Unknown'
            ).join(', ') || 'None'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}