import React, { useState } from 'react';
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Kitchen as KitchenIcon,
} from '@mui/icons-material';
import { Ingredient } from '../types';

export default function Ingredients() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  const [ingredients, setIngredients] = useState<Ingredient[]>([
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

  const [newIngredient, setNewIngredient] = useState<Partial<Ingredient>>({
    name: '',
    costPerUnit: 0,
    unit: '',
    supplier: '',
    category: '',
    isAvailable: true,
    lastUpdated: new Date()
  });

  const handleSaveIngredient = () => {
    if (editingIngredient) {
      setIngredients(ingredients.map(ing => 
        ing.id === editingIngredient.id ? { ...newIngredient as Ingredient, id: editingIngredient.id } : ing
      ));
    } else {
      const ingredient: Ingredient = {
        ...newIngredient as Ingredient,
        id: Date.now().toString()
      };
      setIngredients([...ingredients, ingredient]);
    }
    
    setNewIngredient({
      name: '',
      costPerUnit: 0,
      unit: '',
      supplier: '',
      category: '',
      isAvailable: true,
      lastUpdated: new Date()
    });
    setEditingIngredient(null);
    setOpenDialog(false);
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setNewIngredient(ingredient);
    setEditingIngredient(ingredient);
    setOpenDialog(true);
  };

  const handleDeleteIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const toggleAvailability = (id: string) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, isAvailable: !ing.isAvailable } : ing
    ));
  };

  const categories = Array.from(new Set(ingredients.map(ing => ing.category)));
  const suppliers = Array.from(new Set(ingredients.map(ing => ing.supplier)));

  const totalIngredients = ingredients.length;
  const availableIngredients = ingredients.filter(ing => ing.isAvailable).length;
  const avgCostPerIngredient = ingredients.length > 0 
    ? ingredients.reduce((sum, ing) => sum + ing.costPerUnit, 0) / ingredients.length 
    : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Ingredient Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Ingredient
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Ingredients
              </Typography>
              <Typography variant="h4">
                {totalIngredients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Available
              </Typography>
              <Typography variant="h4">
                {availableIngredients}
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
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                Avg Cost
              </Typography>
              <Typography variant="h4">
                ${avgCostPerIngredient.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {categories.map(category => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <KitchenIcon sx={{ mr: 1 }} />
            {category}
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ingredient Name</TableCell>
                  <TableCell>Cost per Unit</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ingredients
                  .filter(ing => ing.category === category)
                  .map((ingredient) => (
                    <TableRow 
                      key={ingredient.id}
                      sx={{ opacity: ingredient.isAvailable ? 1 : 0.6 }}
                    >
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {ingredient.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" color="primary">
                          ${ingredient.costPerUnit.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>{ingredient.unit}</TableCell>
                      <TableCell>{ingredient.supplier}</TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={ingredient.isAvailable}
                              onChange={() => toggleAvailability(ingredient.id)}
                              size="small"
                            />
                          }
                          label={ingredient.isAvailable ? 'Available' : 'Unavailable'}
                        />
                      </TableCell>
                      <TableCell>{ingredient.lastUpdated.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditIngredient(ingredient)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteIngredient(ingredient.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ingredient Name"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cost Per Unit"
                type="number"
                inputProps={{ step: "0.01" }}
                value={newIngredient.costPerUnit}
                onChange={(e) => setNewIngredient({ ...newIngredient, costPerUnit: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit"
                value={newIngredient.unit}
                onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                placeholder="e.g., lbs, oz, piece, cup"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Supplier"
                value={newIngredient.supplier}
                onChange={(e) => setNewIngredient({ ...newIngredient, supplier: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category"
                value={newIngredient.category}
                onChange={(e) => setNewIngredient({ ...newIngredient, category: e.target.value })}
                placeholder="e.g., Meat, Vegetables, Dairy"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newIngredient.isAvailable}
                    onChange={(e) => setNewIngredient({ ...newIngredient, isAvailable: e.target.checked })}
                  />
                }
                label="Available"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveIngredient} variant="contained">
            {editingIngredient ? 'Update' : 'Add'} Ingredient
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}