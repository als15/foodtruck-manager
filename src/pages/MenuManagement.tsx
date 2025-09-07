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
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Fab,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  RestaurantMenu,
} from '@mui/icons-material';
import { MenuItem, MenuCategory } from '../types';

export default function MenuManagement() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: '1',
      name: 'Classic Burger',
      description: 'Beef patty with lettuce, tomato, and special sauce',
      price: 12.99,
      category: 'Burgers',
      ingredients: ['beef patty', 'lettuce', 'tomato', 'special sauce', 'bun'],
      allergens: ['gluten', 'dairy'],
      isAvailable: true,
      prepTime: 8
    },
    {
      id: '2',
      name: 'Fish Tacos',
      description: 'Grilled fish with cabbage slaw and chipotle mayo',
      price: 10.99,
      category: 'Tacos',
      ingredients: ['fish', 'cabbage', 'chipotle mayo', 'tortilla'],
      allergens: ['fish', 'dairy'],
      isAvailable: true,
      prepTime: 6
    }
  ]);

  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    ingredients: [],
    allergens: [],
    isAvailable: true,
    prepTime: 5
  });

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  const handleSaveItem = () => {
    if (editingItem) {
      setMenuItems(menuItems.map(item => 
        item.id === editingItem.id ? { ...newItem as MenuItem, id: editingItem.id } : item
      ));
    } else {
      const item: MenuItem = {
        ...newItem as MenuItem,
        id: Date.now().toString(),
        ingredients: newItem.ingredients || [],
        allergens: newItem.allergens || []
      };
      setMenuItems([...menuItems, item]);
    }
    
    setNewItem({
      name: '',
      description: '',
      price: 0,
      category: '',
      ingredients: [],
      allergens: [],
      isAvailable: true,
      prepTime: 5
    });
    setEditingItem(null);
    setOpenDialog(false);
  };

  const handleEditItem = (item: MenuItem) => {
    setNewItem(item);
    setEditingItem(item);
    setOpenDialog(true);
  };

  const handleDeleteItem = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  const toggleAvailability = (id: string) => {
    setMenuItems(menuItems.map(item => 
      item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
    ));
  };

  const handleIngredientChange = (value: string) => {
    const ingredients = value.split(',').map(i => i.trim()).filter(i => i);
    setNewItem({ ...newItem, ingredients });
  };

  const handleAllergenChange = (value: string) => {
    const allergens = value.split(',').map(a => a.trim()).filter(a => a);
    setNewItem({ ...newItem, allergens });
  };

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = menuItems.filter(item => item.category === category);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Menu Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Menu Item
        </Button>
      </Box>

      {Object.entries(groupedItems).map(([category, items]) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <RestaurantMenu sx={{ mr: 1 }} />
            {category}
          </Typography>
          <Grid container spacing={2}>
            {items.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card sx={{ height: '100%', opacity: item.isAvailable ? 1 : 0.6 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {item.name}
                      </Typography>
                      <Box>
                        <IconButton size="small" onClick={() => handleEditItem(item)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteItem(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.description}
                    </Typography>
                    
                    <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                      ${item.price.toFixed(2)}
                    </Typography>
                    
                    <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                      Prep time: {item.prepTime} min
                    </Typography>
                    
                    {item.allergens.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        {item.allergens.map((allergen) => (
                          <Chip
                            key={allergen}
                            label={allergen}
                            size="small"
                            color="warning"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={item.isAvailable}
                          onChange={() => toggleAvailability(item.id)}
                        />
                      }
                      label="Available"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                inputProps={{ step: "0.01" }}
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prep Time (minutes)"
                type="number"
                value={newItem.prepTime}
                onChange={(e) => setNewItem({ ...newItem, prepTime: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ingredients (comma separated)"
                value={newItem.ingredients?.join(', ') || ''}
                onChange={(e) => handleIngredientChange(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Allergens (comma separated)"
                value={newItem.allergens?.join(', ') || ''}
                onChange={(e) => handleAllergenChange(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newItem.isAvailable}
                    onChange={(e) => setNewItem({ ...newItem, isAvailable: e.target.checked })}
                  />
                }
                label="Available"
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