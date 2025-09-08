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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Divider,
  Alert,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  RestaurantMenu,
  Calculate as CalculateIcon,
  TrendingUp as ProfitIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { MenuItem, Ingredient, MenuItemIngredient } from '../types';

export default function MenuManagement() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Sample ingredients data
  const [availableIngredients] = useState<Ingredient[]>([
    {
      id: '1',
      name: 'Ground Beef',
      costPerUnit: 8.50,
      unit: 'lbs',
      supplier: 'Local Butcher Co',
      category: 'Meat',
      isAvailable: true,
      lastUpdated: new Date('2024-01-01')
    },
    {
      id: '2',
      name: 'Burger Buns',
      costPerUnit: 0.75,
      unit: 'piece',
      supplier: 'Fresh Bakery',
      category: 'Bread',
      isAvailable: true,
      lastUpdated: new Date('2024-01-02')
    },
    {
      id: '3',
      name: 'Cheddar Cheese',
      costPerUnit: 12.00,
      unit: 'lbs',
      supplier: 'Dairy Farm Co',
      category: 'Dairy',
      isAvailable: true,
      lastUpdated: new Date('2024-01-01')
    },
    {
      id: '4',
      name: 'Lettuce',
      costPerUnit: 2.50,
      unit: 'head',
      supplier: 'Green Gardens',
      category: 'Vegetables',
      isAvailable: true,
      lastUpdated: new Date('2024-01-03')
    },
    {
      id: '5',
      name: 'Tomatoes',
      costPerUnit: 4.00,
      unit: 'lbs',
      supplier: 'Green Gardens',
      category: 'Vegetables',
      isAvailable: true,
      lastUpdated: new Date('2024-01-03')
    },
    {
      id: '6',
      name: 'Fish Fillets',
      costPerUnit: 15.00,
      unit: 'lbs',
      supplier: 'Ocean Fresh',
      category: 'Seafood',
      isAvailable: true,
      lastUpdated: new Date('2024-01-02')
    },
    {
      id: '7',
      name: 'Corn Tortillas',
      costPerUnit: 0.25,
      unit: 'piece',
      supplier: 'Tortilla Factory',
      category: 'Bread',
      isAvailable: true,
      lastUpdated: new Date('2024-01-01')
    }
  ]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: '1',
      name: 'Classic Burger',
      description: 'Beef patty with lettuce, tomato, and cheese',
      price: 12.99,
      category: 'Burgers',
      ingredients: [
        { ingredientId: '1', quantity: 0.25, unit: 'lbs' },
        { ingredientId: '2', quantity: 1, unit: 'piece' },
        { ingredientId: '3', quantity: 0.125, unit: 'lbs' },
        { ingredientId: '4', quantity: 0.1, unit: 'head' },
        { ingredientId: '5', quantity: 0.1, unit: 'lbs' }
      ],
      allergens: ['gluten', 'dairy'],
      isAvailable: true,
      prepTime: 8
    },
    {
      id: '2',
      name: 'Fish Tacos',
      description: 'Grilled fish with fresh vegetables',
      price: 10.99,
      category: 'Tacos',
      ingredients: [
        { ingredientId: '6', quantity: 0.2, unit: 'lbs' },
        { ingredientId: '7', quantity: 2, unit: 'piece' },
        { ingredientId: '4', quantity: 0.05, unit: 'head' },
        { ingredientId: '5', quantity: 0.05, unit: 'lbs' }
      ],
      allergens: ['fish'],
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

  const calculateIngredientCost = (ingredientId: string, quantity: number): number => {
    const ingredient = availableIngredients.find(ing => ing.id === ingredientId);
    return ingredient ? ingredient.costPerUnit * quantity : 0;
  };

  const calculateTotalIngredientCost = (ingredients: MenuItemIngredient[]): number => {
    return ingredients.reduce((total, ing) => {
      return total + calculateIngredientCost(ing.ingredientId, ing.quantity);
    }, 0);
  };

  const calculateProfitMargin = (price: number, totalCost: number): number => {
    return price > 0 ? ((price - totalCost) / price) * 100 : 0;
  };

  const getIngredientName = (ingredientId: string): string => {
    const ingredient = availableIngredients.find(ing => ing.id === ingredientId);
    return ingredient ? ingredient.name : 'Unknown Ingredient';
  };

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  const handleSaveItem = () => {
    const totalCost = calculateTotalIngredientCost(newItem.ingredients || []);
    const profitMargin = calculateProfitMargin(newItem.price || 0, totalCost);

    const itemToSave = {
      ...newItem as MenuItem,
      totalIngredientCost: totalCost,
      profitMargin: profitMargin
    };

    if (editingItem) {
      setMenuItems(menuItems.map(item => 
        item.id === editingItem.id ? { ...itemToSave, id: editingItem.id } : item
      ));
    } else {
      const item: MenuItem = {
        ...itemToSave,
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

  const addIngredientToItem = () => {
    const newIngredients = [...(newItem.ingredients || []), { ingredientId: '', quantity: 0, unit: '' }];
    setNewItem({ ...newItem, ingredients: newIngredients });
  };

  const updateIngredientInItem = (index: number, field: keyof MenuItemIngredient, value: any) => {
    const ingredients = [...(newItem.ingredients || [])];
    ingredients[index] = { ...ingredients[index], [field]: value };
    setNewItem({ ...newItem, ingredients });
  };

  const removeIngredientFromItem = (index: number) => {
    const ingredients = [...(newItem.ingredients || [])];
    ingredients.splice(index, 1);
    setNewItem({ ...newItem, ingredients });
  };

  const handleAllergenChange = (value: string) => {
    const allergens = value.split(',').map(a => a.trim()).filter(a => a);
    setNewItem({ ...newItem, allergens });
  };

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

      {categories.map(category => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <RestaurantMenu sx={{ mr: 1 }} />
            {category}
          </Typography>
          <Grid container spacing={2}>
            {menuItems
              .filter(item => item.category === category)
              .map((item) => {
                const totalCost = calculateTotalIngredientCost(item.ingredients);
                const profitMargin = calculateProfitMargin(item.price, totalCost);
                
                return (
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

                        <Box sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="caption" display="flex" alignItems="center" sx={{ mb: 0.5 }}>
                            <CalculateIcon sx={{ fontSize: 14, mr: 0.5 }} />
                            Ingredient Cost: ${totalCost.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" display="flex" alignItems="center" color={profitMargin > 0 ? 'success.main' : 'error.main'}>
                            <ProfitIcon sx={{ fontSize: 14, mr: 0.5 }} />
                            Profit Margin: {profitMargin.toFixed(1)}%
                          </Typography>
                        </Box>

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
                );
              })}
          </Grid>
        </Box>
      ))}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
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
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Ingredients</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addIngredientToItem}
                >
                  Add Ingredient
                </Button>
              </Box>

              {newItem.ingredients && newItem.ingredients.length > 0 && (
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ingredient</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit</TableCell>
                        <TableCell>Cost</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {newItem.ingredients.map((ingredient, index) => {
                        const cost = calculateIngredientCost(ingredient.ingredientId, ingredient.quantity);
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Autocomplete
                                size="small"
                                options={availableIngredients}
                                getOptionLabel={(option) => option.name}
                                value={availableIngredients.find(ing => ing.id === ingredient.ingredientId) || null}
                                onChange={(_, value) => updateIngredientInItem(index, 'ingredientId', value?.id || '')}
                                renderInput={(params) => <TextField {...params} placeholder="Select ingredient" />}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ step: "0.01" }}
                                value={ingredient.quantity}
                                onChange={(e) => updateIngredientInItem(index, 'quantity', parseFloat(e.target.value))}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={ingredient.unit}
                                onChange={(e) => updateIngredientInItem(index, 'unit', e.target.value)}
                                placeholder="unit"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="primary">
                                ${cost.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => removeIngredientFromItem(index)}>
                                <RemoveIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <Typography variant="subtitle2">Total Ingredient Cost:</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="primary">
                            ${calculateTotalIngredientCost(newItem.ingredients).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {newItem.price && newItem.ingredients && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Profit Margin: {calculateProfitMargin(newItem.price, calculateTotalIngredientCost(newItem.ingredients)).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    Profit per Item: ${(newItem.price - calculateTotalIngredientCost(newItem.ingredients)).toFixed(2)}
                  </Typography>
                </Alert>
              )}
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