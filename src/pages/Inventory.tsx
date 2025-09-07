import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { InventoryItem } from '../types';

export default function Inventory() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Ground Beef',
      category: 'Meat',
      currentStock: 25,
      unit: 'lbs',
      minThreshold: 10,
      costPerUnit: 8.50,
      supplier: 'Local Butcher',
      lastRestocked: new Date('2024-01-01')
    },
    {
      id: '2',
      name: 'Burger Buns',
      category: 'Bread',
      currentStock: 5,
      unit: 'dozen',
      minThreshold: 12,
      costPerUnit: 3.25,
      supplier: 'Fresh Bakery',
      lastRestocked: new Date('2024-01-02')
    },
    {
      id: '3',
      name: 'Cheese Slices',
      category: 'Dairy',
      currentStock: 8,
      unit: 'lbs',
      minThreshold: 5,
      costPerUnit: 6.75,
      supplier: 'Dairy Farm Co',
      lastRestocked: new Date('2024-01-01')
    },
    {
      id: '4',
      name: 'Lettuce',
      category: 'Vegetables',
      currentStock: 3,
      unit: 'heads',
      minThreshold: 6,
      costPerUnit: 2.50,
      supplier: 'Green Gardens',
      lastRestocked: new Date('2024-01-03')
    }
  ]);

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    category: '',
    currentStock: 0,
    unit: '',
    minThreshold: 0,
    costPerUnit: 0,
    supplier: '',
    lastRestocked: new Date()
  });

  const handleSaveItem = () => {
    if (editingItem) {
      setInventoryItems(inventoryItems.map(item => 
        item.id === editingItem.id ? { ...newItem as InventoryItem, id: editingItem.id } : item
      ));
    } else {
      const item: InventoryItem = {
        ...newItem as InventoryItem,
        id: Date.now().toString()
      };
      setInventoryItems([...inventoryItems, item]);
    }
    
    setNewItem({
      name: '',
      category: '',
      currentStock: 0,
      unit: '',
      minThreshold: 0,
      costPerUnit: 0,
      supplier: '',
      lastRestocked: new Date()
    });
    setEditingItem(null);
    setOpenDialog(false);
  };

  const handleEditItem = (item: InventoryItem) => {
    setNewItem(item);
    setEditingItem(item);
    setOpenDialog(true);
  };

  const handleDeleteItem = (id: string) => {
    setInventoryItems(inventoryItems.filter(item => item.id !== id));
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

  const categories = Array.from(new Set(inventoryItems.map(item => item.category)));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Inventory Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Item
        </Button>
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
              <TextField
                fullWidth
                label="Item Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier"
                value={newItem.supplier}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
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
    </Box>
  );
}