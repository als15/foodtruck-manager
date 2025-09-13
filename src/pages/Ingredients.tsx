import React, { useState, useEffect, useRef } from 'react';
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
  Autocomplete,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Menu,
  MenuItem as MuiMenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Kitchen as KitchenIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { Ingredient } from '../types';
import { ingredientsService, subscriptions } from '../services/supabaseService';
import Papa from 'papaparse';

export default function Ingredients() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  const [importing, setImporting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newIngredient, setNewIngredient] = useState<Partial<Ingredient>>({
    name: '',
    costPerUnit: 0,
    unit: '',
    supplier: '',
    category: '',
    isAvailable: true,
    lastUpdated: new Date()
  });

  // Load ingredients on component mount
  useEffect(() => {
    loadIngredients();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = subscriptions.ingredients((payload) => {
      console.log('Ingredients changed:', payload);
      // Reload ingredients when changes occur
      loadIngredients();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ingredientsService.getAll();
      setIngredients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ingredients');
      setSnackbar({ open: true, message: 'Failed to load ingredients', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIngredient = async () => {
    try {
      if (editingIngredient) {
        await ingredientsService.update(editingIngredient.id, newIngredient);
        setSnackbar({ open: true, message: 'Ingredient updated successfully', severity: 'success' });
      } else {
        await ingredientsService.create(newIngredient as Omit<Ingredient, 'id' | 'lastUpdated'>);
        setSnackbar({ open: true, message: 'Ingredient created successfully', severity: 'success' });
      }
      
      // Reload ingredients to get updated data
      await loadIngredients();
      
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
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save ingredient', severity: 'error' });
    }
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setNewIngredient(ingredient);
    setEditingIngredient(ingredient);
    setOpenDialog(true);
  };

  const handleDeleteIngredient = async (id: string) => {
    try {
      await ingredientsService.delete(id);
      setSnackbar({ open: true, message: 'Ingredient deleted successfully', severity: 'success' });
      await loadIngredients();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete ingredient', severity: 'error' });
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      const ingredient = ingredients.find(ing => ing.id === id);
      if (ingredient) {
        await ingredientsService.update(id, { isAvailable: !ingredient.isAvailable });
        setSnackbar({ open: true, message: 'Availability updated successfully', severity: 'success' });
        await loadIngredients();
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update availability', severity: 'error' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setMenuAnchor(null);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const validIngredients: Omit<Ingredient, 'id' | 'lastUpdated'>[] = [];
          const errors: string[] = [];

          results.data.forEach((row: any, index: number) => {
            if (!row.name || !row.costPerUnit || !row.unit || !row.supplier || !row.category) {
              errors.push(`Row ${index + 1}: Missing required fields`);
              return;
            }

            const costPerUnit = parseFloat(row.costPerUnit);
            if (isNaN(costPerUnit)) {
              errors.push(`Row ${index + 1}: Invalid cost per unit`);
              return;
            }

            validIngredients.push({
              name: row.name.trim(),
              costPerUnit: costPerUnit,
              unit: row.unit.trim(),
              supplier: row.supplier.trim(),
              category: row.category.trim(),
              isAvailable: row.isAvailable?.toLowerCase() !== 'false'
            });
          });

          if (errors.length > 0) {
            setSnackbar({ 
              open: true, 
              message: `Import completed with ${errors.length} errors. Check console for details.`, 
              severity: 'warning' as 'warning'
            });
            console.error('Import errors:', errors);
          }

          // Import valid ingredients
          for (const ingredient of validIngredients) {
            await ingredientsService.create(ingredient);
          }

          setSnackbar({ 
            open: true, 
            message: `Successfully imported ${validIngredients.length} ingredients`, 
            severity: 'success' 
          });
          await loadIngredients();
        } catch (err) {
          setSnackbar({ open: true, message: 'Failed to import ingredients', severity: 'error' });
        } finally {
          setImporting(false);
          event.target.value = ''; // Reset file input
        }
      },
      error: () => {
        setImporting(false);
        setSnackbar({ open: true, message: 'Failed to parse CSV file', severity: 'error' });
        event.target.value = '';
      }
    });
  };

  const handleExportCSV = () => {
    const csvData = ingredients.map(ingredient => ({
      name: ingredient.name,
      costPerUnit: ingredient.costPerUnit,
      unit: ingredient.unit,
      supplier: ingredient.supplier,
      category: ingredient.category,
      isAvailable: ingredient.isAvailable
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ingredients-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setMenuAnchor(null);
    setSnackbar({ open: true, message: 'Ingredients exported successfully', severity: 'success' });
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Ground Beef',
        costPerUnit: 8.99,
        unit: 'lbs',
        supplier: 'Local Butcher',
        category: 'Meat',
        isAvailable: true
      },
      {
        name: 'Tomatoes',
        costPerUnit: 2.50,
        unit: 'lbs',
        supplier: 'Fresh Farms',
        category: 'Vegetables',
        isAvailable: true
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ingredients-template.csv';
    link.click();
    setMenuAnchor(null);
    setSnackbar({ open: true, message: 'Template downloaded successfully', severity: 'success' });
  };

  // Common ingredient categories for autocomplete
  const commonCategories = [
    'Meat', 'Vegetables', 'Fruits', 'Dairy', 'Grains', 'Spices', 'Condiments', 
    'Seafood', 'Pantry', 'Beverages', 'Oils', 'Nuts', 'Herbs', 'Baking'
  ];
  
  const existingCategories = Array.from(new Set(ingredients.map(ing => ing.category)));
  // Keep allCategories for autocomplete (includes common + existing)
  const allCategories = commonCategories.concat(existingCategories);
  const categoriesForAutocomplete = Array.from(new Set(allCategories)).sort();
  // Only show categories that actually have ingredients
  const categories = existingCategories.sort();
  
  const suppliers = Array.from(new Set(ingredients.map(ing => ing.supplier))).sort();

  const totalIngredients = ingredients.length;
  const availableIngredients = ingredients.filter(ing => ing.isAvailable).length;
  const avgCostPerIngredient = ingredients.length > 0 
    ? ingredients.reduce((sum, ing) => sum + ing.costPerUnit, 0) / ingredients.length 
    : 0;

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
        <Button variant="contained" onClick={loadIngredients}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Ingredient Management</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<MoreVertIcon />}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            Import/Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add Ingredient
          </Button>
        </Box>
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
              <Autocomplete
                freeSolo
                options={suppliers}
                value={newIngredient.supplier}
                onChange={(_, value) => setNewIngredient({ ...newIngredient, supplier: value || '' })}
                onInputChange={(_, value) => setNewIngredient({ ...newIngredient, supplier: value || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Supplier"
                    placeholder="e.g., Local Farms, Fresh Market"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                freeSolo
                options={categoriesForAutocomplete}
                value={newIngredient.category}
                onChange={(_, value) => setNewIngredient({ ...newIngredient, category: value || '' })}
                onInputChange={(_, value) => setNewIngredient({ ...newIngredient, category: value || '' })}
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

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MuiMenuItem onClick={downloadTemplate}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download Template</ListItemText>
        </MuiMenuItem>
        <MuiMenuItem onClick={handleImportClick} disabled={importing}>
          <ListItemIcon>
            <UploadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {importing ? 'Importing...' : 'Import CSV'}
          </ListItemText>
        </MuiMenuItem>
        <Divider />
        <MuiMenuItem onClick={handleExportCSV}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export CSV</ListItemText>
        </MuiMenuItem>
      </Menu>

      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />
    </Box>
  );
}