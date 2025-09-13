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
  IconButton,
  LinearProgress,
  Alert,
  Grid,
  CircularProgress,
  Snackbar,
  Menu,
  MenuItem as MuiMenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  MoreVert as MoreVertIcon,
  Input as ImportIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as DeliveryIcon,
  Schedule as LeadTimeIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
} from '@mui/icons-material';
import { InventoryItem, Ingredient, Supplier } from '../types';
import { inventoryService, ingredientsService, suppliersService, subscriptions } from '../services/supabaseService';

export default function Inventory() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAutoOrders, setShowAutoOrders] = useState(false);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const inventorySubscription = subscriptions.inventory((payload) => {
      console.log('Inventory changed:', payload);
      loadInventoryItems();
    });

    const ingredientSubscription = subscriptions.ingredients((payload) => {
      console.log('Ingredients changed:', payload);
      loadIngredients();
    });

    return () => {
      inventorySubscription.unsubscribe();
      ingredientSubscription.unsubscribe();
    };
  }, []);

  const loadData = async () => {
    await Promise.all([loadInventoryItems(), loadIngredients(), loadSuppliers()]);
  };

  const loadInventoryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getAll();
      setInventoryItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory items');
      setSnackbar({ open: true, message: 'Failed to load inventory items', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadIngredients = async () => {
    try {
      const data = await ingredientsService.getAll();
      setAvailableIngredients(data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load ingredients', severity: 'error' });
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await suppliersService.getAll();
      setSuppliers(data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load suppliers', severity: 'error' });
    }
  };

  const handleImportFromIngredients = async () => {
    try {
      // Get ingredients that are not already in inventory
      const existingNames = new Set(inventoryItems.map(item => item.name.toLowerCase()));
      const missingIngredients = availableIngredients.filter(ing => 
        !existingNames.has(ing.name.toLowerCase())
      );

      if (missingIngredients.length === 0) {
        setSnackbar({ open: true, message: 'All ingredients are already in inventory', severity: 'info' });
        setMenuAnchor(null);
        return;
      }

      await inventoryService.createFromIngredients(missingIngredients.map(ing => ing.id));
      setSnackbar({ 
        open: true, 
        message: `Imported ${missingIngredients.length} ingredients to inventory`, 
        severity: 'success' 
      });
      await loadInventoryItems();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to import ingredients', severity: 'error' });
    } finally {
      setMenuAnchor(null);
    }
  };

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    category: '',
    currentStock: 0,
    unit: '',
    minThreshold: 5,
    costPerUnit: 0,
    supplier: '',
    lastRestocked: new Date()
  });

  const handleIngredientSelect = (selectedIngredient: Ingredient | null) => {
    if (selectedIngredient) {
      setNewItem({
        ...newItem,
        name: selectedIngredient.name,
        category: selectedIngredient.category,
        unit: selectedIngredient.unit,
        costPerUnit: selectedIngredient.costPerUnit,
        supplier: selectedIngredient.supplier
      });
    } else {
      setNewItem({
        ...newItem,
        name: '',
        category: '',
        unit: '',
        costPerUnit: 0,
        supplier: ''
      });
    }
  };

  const handleSaveItem = async () => {
    try {
      if (editingItem) {
        await inventoryService.update(editingItem.id, newItem);
        setSnackbar({ open: true, message: 'Inventory item updated successfully', severity: 'success' });
      } else {
        await inventoryService.create(newItem as Omit<InventoryItem, 'id'>);
        setSnackbar({ open: true, message: 'Inventory item created successfully', severity: 'success' });
      }
      
      await loadInventoryItems();
      
      setNewItem({
        name: '',
        category: '',
        currentStock: 0,
        unit: '',
        minThreshold: 5,
        costPerUnit: 0,
        supplier: '',
        lastRestocked: new Date()
      });
      setEditingItem(null);
      setOpenDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save inventory item', severity: 'error' });
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setNewItem(item);
    setEditingItem(item);
    setOpenDialog(true);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await inventoryService.delete(id);
      setSnackbar({ open: true, message: 'Inventory item deleted successfully', severity: 'success' });
      await loadInventoryItems();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete inventory item', severity: 'error' });
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.minThreshold) * 100;
    if (percentage <= 50) return { status: 'critical', color: 'error' };
    if (percentage <= 100) return { status: 'low', color: 'warning' };
    return { status: 'good', color: 'success' };
  };

  const getStockPercentage = (item: InventoryItem) => {
    return Math.min((item.currentStock / (item.minThreshold * 2)) * 100, 100);
  };

  const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minThreshold);
  const totalInventoryValue = inventoryItems.reduce((total, item) => 
    total + (item.currentStock * item.costPerUnit), 0
  );

  // Generate auto-order suggestions
  const autoOrderSuggestions = lowStockItems
    .map(item => {
      const supplier = suppliers.find(sup => 
        sup.name === item.supplier && sup.autoOrderEnabled && sup.isActive
      );
      if (!supplier) return null;
      
      const suggestedQuantity = Math.max(
        item.minThreshold * 2 - item.currentStock, // Restock to double the threshold
        supplier.minimumOrderAmount / item.costPerUnit // Or meet minimum order amount
      );
      
      return {
        item,
        supplier,
        suggestedQuantity: Math.ceil(suggestedQuantity),
        totalCost: suggestedQuantity * item.costPerUnit,
        deliveryDays: supplier.deliveryDays,
        leadTime: supplier.leadTime
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.totalCost || 0) - (a?.totalCost || 0)); // Sort by cost descending

  // Get existing categories from inventory items (for display)
  const categories = Array.from(new Set(inventoryItems.map(item => item.category))).sort();
  
  // Get all ingredient categories for autocomplete
  const allCategories = Array.from(new Set([
    ...availableIngredients.map(ing => ing.category),
    ...inventoryItems.map(item => item.category)
  ])).sort();
  
  const totalAutoOrderValue = autoOrderSuggestions.reduce((sum, order) => sum + (order?.totalCost || 0), 0);

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
        <Button variant="contained" onClick={loadData}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Inventory Management</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<MoreVertIcon />}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            Import
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      {lowStockItems.length > 0 && (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="h6">Low Stock Alert</Typography>
          <Typography>
            {lowStockItems.length} item(s) are below minimum threshold: {' '}
            {lowStockItems.map(item => item.name).join(', ')}
          </Typography>
        </Alert>
      )}

      {/* Auto-Order Suggestions */}
      {autoOrderSuggestions.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <OrderIcon sx={{ mr: 1 }} />
                Auto-Order Suggestions ({autoOrderSuggestions.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={showAutoOrders ? <HideIcon /> : <ViewIcon />}
                onClick={() => setShowAutoOrders(!showAutoOrders)}
              >
                {showAutoOrders ? 'Hide' : 'View'} Suggestions
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Total estimated cost: <strong>${totalAutoOrderValue.toFixed(2)}</strong>
            </Typography>
            
            {showAutoOrders && (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell>Current Stock</TableCell>
                      <TableCell>Suggested Qty</TableCell>
                      <TableCell>Unit Cost</TableCell>
                      <TableCell>Total Cost</TableCell>
                      <TableCell>Delivery</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {autoOrderSuggestions.map((suggestion, index) => (
                      <TableRow key={`${suggestion?.item.id}-${index}`}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {suggestion?.item.name}
                          </Typography>
                          <Typography variant="caption" color="error">
                            {suggestion?.item.currentStock} / {suggestion?.item.minThreshold} {suggestion?.item.unit}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{suggestion?.supplier.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {suggestion?.supplier.contactPerson}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${suggestion?.item.currentStock} ${suggestion?.item.unit}`}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="primary">
                            {suggestion?.suggestedQuantity} {suggestion?.item.unit}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            ${suggestion?.item.costPerUnit.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            ${suggestion?.totalCost.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <DeliveryIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption">
                              {suggestion?.deliveryDays.join(', ')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LeadTimeIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption">
                              {suggestion?.leadTime} days lead time
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Items
              </Typography>
              <Typography variant="h4">
                {inventoryItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                Low Stock Items
              </Typography>
              <Typography variant="h4">
                {lowStockItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Total Value
              </Typography>
              <Typography variant="h4">
                ${totalInventoryValue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                Categories
              </Typography>
              <Typography variant="h4">
                {categories.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {categories.map(category => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <InventoryIcon sx={{ mr: 1 }} />
            {category}
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Min Threshold</TableCell>
                  <TableCell>Stock Level</TableCell>
                  <TableCell>Cost/Unit</TableCell>
                  <TableCell>Total Value</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Last Restocked</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryItems
                  .filter(item => item.category === category)
                  .map((item) => {
                    const stockStatus = getStockStatus(item);
                    const stockPercentage = getStockPercentage(item);
                    
                    return (
                      <TableRow 
                        key={item.id}
                        sx={{ 
                          backgroundColor: stockStatus.status === 'critical' ? 'error.light' : 
                                          stockStatus.status === 'low' ? 'warning.light' : 'inherit',
                          opacity: stockStatus.status === 'critical' ? 0.8 : 1
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {item.name}
                            {item.currentStock <= item.minThreshold && (
                              <WarningIcon 
                                sx={{ ml: 1, color: 'warning.main' }} 
                                fontSize="small"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{item.currentStock}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.minThreshold}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
                            <LinearProgress
                              variant="determinate"
                              value={stockPercentage}
                              color={stockStatus.color as any}
                              sx={{ flexGrow: 1, mr: 1 }}
                            />
                            <Chip
                              label={stockStatus.status}
                              color={stockStatus.color as any}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>${item.costPerUnit.toFixed(2)}</TableCell>
                        <TableCell>${(item.currentStock * item.costPerUnit).toFixed(2)}</TableCell>
                        <TableCell>{item.supplier}</TableCell>
                        <TableCell>{item.lastRestocked.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleEditItem(item)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteItem(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={availableIngredients.filter(ing => 
                  !inventoryItems.some(item => item.name.toLowerCase() === ing.name.toLowerCase())
                )}
                getOptionLabel={(option) => option.name}
                value={availableIngredients.find(ing => ing.name === newItem.name) || null}
                onChange={(_, value) => handleIngredientSelect(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Select Ingredient"
                    placeholder="Choose from existing ingredients"
                    disabled={editingItem !== null} // Disable when editing
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.category} • {option.supplier} • ${option.costPerUnit}/{option.unit}
                      </Typography>
                    </Box>
                  </li>
                )}
                disabled={editingItem !== null} // Disable when editing existing items
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={allCategories}
                value={newItem.category}
                onChange={(_, value) => setNewItem({ ...newItem, category: value || '' })}
                onInputChange={(_, value) => setNewItem({ ...newItem, category: value || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Category"
                    placeholder="e.g., Meat, Vegetables, Dairy"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Current Stock"
                type="number"
                value={newItem.currentStock}
                onChange={(e) => setNewItem({ ...newItem, currentStock: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Unit"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="e.g., lbs, dozen, pieces"
                InputProps={{ readOnly: !editingItem && !newItem.name }}
                helperText={!editingItem && !newItem.name ? "Auto-filled from ingredient" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Min Threshold"
                type="number"
                value={newItem.minThreshold}
                onChange={(e) => setNewItem({ ...newItem, minThreshold: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cost Per Unit"
                type="number"
                inputProps={{ step: "0.01" }}
                value={newItem.costPerUnit}
                onChange={(e) => setNewItem({ ...newItem, costPerUnit: parseFloat(e.target.value) })}
                InputProps={{ readOnly: !editingItem && !newItem.name }}
                helperText={!editingItem && !newItem.name ? "Auto-filled from ingredient" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier"
                value={newItem.supplier}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                InputProps={{ readOnly: !editingItem && !newItem.name }}
                helperText={!editingItem && !newItem.name ? "Auto-filled from ingredient" : ""}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Last Restocked"
                type="date"
                value={newItem.lastRestocked?.toISOString().split('T')[0]}
                onChange={(e) => setNewItem({ ...newItem, lastRestocked: new Date(e.target.value) })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained">
            {editingItem ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MuiMenuItem onClick={handleImportFromIngredients}>
          <ListItemIcon>
            <ImportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            Import from Ingredients
          </ListItemText>
        </MuiMenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}