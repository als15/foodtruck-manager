import React, { useState, useEffect, useRef } from 'react'
import { Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel, Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Autocomplete, Divider, Alert, Grid, CircularProgress, Snackbar, Select, MenuItem as MuiMenuItem, FormControl, InputLabel, Tooltip, Stack, useTheme, Menu, ListItemIcon, ListItemText } from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ContentCopy as DuplicateIcon, RestaurantMenu, Calculate as CalculateIcon, TrendingUp as ProfitIcon, Remove as RemoveIcon, Upload as UploadIcon, Download as DownloadIcon, Settings as SettingsIcon, Category as CategoryIcon } from '@mui/icons-material'
import { MenuItem, Ingredient, MenuItemIngredient } from '../types'
import { menuItemsService, ingredientsService, menuCategoriesService, subscriptions } from '../services/supabaseService'
import Papa from 'papaparse'
import { useTranslation } from 'react-i18next'

export default function MenuManagement() {
  const theme = useTheme()
  const isRtl = theme.direction === 'rtl'
  const { t } = useTranslation()

  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [importingIngredients, setImportingIngredients] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState<null | HTMLElement>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    ingredients: [],
    allergens: [],
    isAvailable: true,
    prepTime: 5
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const menuSubscription = subscriptions.menuItems(payload => {
      console.log('Menu items changed:', payload)
      loadMenuItems()
    })

    const ingredientSubscription = subscriptions.ingredients(payload => {
      console.log('Ingredients changed:', payload)
      loadIngredients()
    })

    return () => {
      menuSubscription.unsubscribe()
      ingredientSubscription.unsubscribe()
    }
  }, [])

  const loadData = async () => {
    await Promise.all([loadMenuItems(), loadIngredients()])
  }

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await menuItemsService.getAll()
      setMenuItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu items')
      setSnackbar({ open: true, message: 'Failed to load menu items', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadIngredients = async () => {
    try {
      const data = await ingredientsService.getAll()
      setAvailableIngredients(data)
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load ingredients', severity: 'error' })
    }
  }

  const loadCategories = async () => {
    try {
      const data = await menuCategoriesService.getAll()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
      setSnackbar({ open: true, message: 'Failed to load categories', severity: 'error' })
      // Fallback to default categories
      setCategories(['salads', 'sandwiches', 'desserts', 'sweet pastries', 'savory pastries', 'fruit shakes', 'hot drinks', 'cold drinks'])
    }
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    setNewCategoryName('')
    setCategoryDialogOpen(true)
  }

  const handleEditCategory = (category: string) => {
    setEditingCategory(category)
    setNewCategoryName(category)
    setCategoryDialogOpen(true)
    setCategoryMenuAnchor(null)
  }

  const handleDeleteCategory = async (category: string) => {
    // Check if any menu items use this category
    const itemsWithCategory = menuItems.filter(item => item.category === category)
    if (itemsWithCategory.length > 0) {
      setSnackbar({ 
        open: true, 
        message: t('cannot_delete_category_in_use', { category, count: itemsWithCategory.length }), 
        severity: 'error' 
      })
      return
    }

    try {
      await menuCategoriesService.delete(category)
      await loadCategories() // Reload categories from database
      setSnackbar({ open: true, message: t('category_deleted_successfully'), severity: 'success' })
    } catch (err) {
      setSnackbar({ open: true, message: t('failed_to_delete_category'), severity: 'error' })
    }
    setCategoryMenuAnchor(null)
  }

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      setSnackbar({ open: true, message: t('category_name_empty'), severity: 'error' })
      return
    }

    const trimmedName = newCategoryName.trim().toLowerCase()
    
    try {
      if (editingCategory) {
        // Editing existing category
        if (trimmedName === editingCategory) {
          setCategoryDialogOpen(false)
          return // No change
        }
        
        if (categories.includes(trimmedName)) {
          setSnackbar({ open: true, message: t('category_already_exists'), severity: 'error' })
          return
        }

        // Update category in database
        await menuCategoriesService.update(editingCategory, trimmedName)
        
        // Update all menu items that use the old category name
        const itemsToUpdate = menuItems.filter(item => item.category === editingCategory)
        await Promise.all(
          itemsToUpdate.map(item => menuItemsService.update(item.id, { category: trimmedName }))
        )
        
        await Promise.all([loadCategories(), loadMenuItems()])
        setSnackbar({ open: true, message: t('category_updated_successfully'), severity: 'success' })
        
      } else {
        // Adding new category
        if (categories.includes(trimmedName)) {
          setSnackbar({ open: true, message: t('category_already_exists'), severity: 'error' })
          return
        }
        
        await menuCategoriesService.create(trimmedName)
        await loadCategories()
        setSnackbar({ open: true, message: t('category_added_successfully'), severity: 'success' })
      }
      
      setCategoryDialogOpen(false)
    } catch (err) {
      setSnackbar({ open: true, message: t('failed_to_save_category'), severity: 'error' })
    }
  }

  const calculateIngredientCost = (ingredientId: string, quantity: number): number => {
    const ingredient = availableIngredients.find(ing => ing.id === ingredientId)
    return ingredient ? ingredient.costPerUnit * quantity : 0
  }

  const calculateTotalIngredientCost = (ingredients: MenuItemIngredient[]): number => {
    return ingredients.reduce((total, ing) => {
      return total + calculateIngredientCost(ing.ingredientId, ing.quantity)
    }, 0)
  }

  const calculateProfitMargin = (price: number, totalCost: number): number => {
    return price > 0 ? ((price - totalCost) / price) * 100 : 0
  }

  const getIngredientName = (ingredientId: string): string => {
    const ingredient = availableIngredients.find(ing => ing.id === ingredientId)
    return ingredient ? ingredient.name : 'Unknown Ingredient'
  }

  // Only show categories that have menu items
  const visibleCategories = categories.filter(category => 
    menuItems.some(item => item.category === category)
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadData}>
          {t('retry')}
        </Button>
      </Box>
    )
  }

  const handleSaveItem = async () => {
    try {
      if (editingItem) {
        await menuItemsService.update(editingItem.id, newItem)
        setSnackbar({ open: true, message: t('menu_item_updated_success'), severity: 'success' })
      } else {
        await menuItemsService.create(newItem as Omit<MenuItem, 'id' | 'totalIngredientCost' | 'profitMargin'>)
        setSnackbar({ open: true, message: t('menu_item_created_success'), severity: 'success' })
      }

      await loadMenuItems()

      setNewItem({
        name: '',
        description: '',
        price: 0,
        category: '',
        ingredients: [],
        allergens: [],
        isAvailable: true,
        prepTime: 5
      })
      setEditingItem(null)
      setOpenDialog(false)
    } catch (err) {
      setSnackbar({ open: true, message: t('failed_to_save_menu_item'), severity: 'error' })
    }
  }

  const handleEditItem = (item: MenuItem) => {
    setNewItem(item)
    setEditingItem(item)
    setOpenDialog(true)
  }

  const handleDeleteItem = async (id: string) => {
    try {
      await menuItemsService.delete(id)
      setSnackbar({ open: true, message: t('menu_item_deleted_success'), severity: 'success' })
      await loadMenuItems()
    } catch (err) {
      setSnackbar({ open: true, message: t('failed_to_delete_menu_item'), severity: 'error' })
    }
  }

  const handleDuplicateItem = (item: MenuItem) => {
    const duplicatedItem = {
      ...item,
      name: `${item.name} (Copy)`,
      id: undefined,
      totalIngredientCost: undefined,
      profitMargin: undefined
    }
    setNewItem(duplicatedItem)
    setEditingItem(null)
    setOpenDialog(true)
  }

  const toggleAvailability = async (id: string) => {
    try {
      const item = menuItems.find(item => item.id === id)
      if (item) {
        await menuItemsService.update(id, { isAvailable: !item.isAvailable })
        setSnackbar({ open: true, message: t('availability_updated_success'), severity: 'success' })
        await loadMenuItems()
      }
    } catch (err) {
      setSnackbar({ open: true, message: t('failed_to_update_availability'), severity: 'error' })
    }
  }

  const addIngredientToItem = () => {
    const newIngredients = [...(newItem.ingredients || []), { ingredientId: '', quantity: 1, unit: '' }]
    setNewItem({ ...newItem, ingredients: newIngredients })
  }

  const updateIngredientInItem = (index: number, field: keyof MenuItemIngredient, value: any) => {
    const ingredients = [...(newItem.ingredients || [])]

    // If changing ingredient, auto-fill the unit from the ingredient's default unit
    if (field === 'ingredientId' && value) {
      const selectedIngredient = availableIngredients.find(ing => ing.id === value)
      if (selectedIngredient) {
        ingredients[index] = {
          ...ingredients[index],
          [field]: value,
          unit: selectedIngredient.unit // Auto-fill unit from ingredient
        }
      } else {
        ingredients[index] = { ...ingredients[index], [field]: value }
      }
    } else {
      ingredients[index] = { ...ingredients[index], [field]: value }
    }

    setNewItem({ ...newItem, ingredients })
  }

  const removeIngredientFromItem = (index: number) => {
    const ingredients = [...(newItem.ingredients || [])]
    ingredients.splice(index, 1)
    setNewItem({ ...newItem, ingredients })
  }

  const handleImportIngredientsClick = () => {
    fileInputRef.current?.click()
  }

  const handleIngredientsFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportingIngredients(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        try {
          const importedIngredients: MenuItemIngredient[] = []
          const errors: string[] = []

          results.data.forEach((row: any, index: number) => {
            // Check if ingredient exists
            const ingredient = availableIngredients.find(ing => ing.id === row.ingredientId || ing.name.toLowerCase() === row.name?.toLowerCase())

            if (!ingredient) {
              errors.push(`Row ${index + 1}: Ingredient '${row.name || row.ingredientId}' not found`)
              return
            }

            const quantity = parseFloat(row.quantity)
            if (isNaN(quantity) || quantity <= 0) {
              errors.push(`Row ${index + 1}: Invalid quantity`)
              return
            }

            // Use provided unit or default to ingredient's unit
            const unit = row.unit?.trim() || ingredient.unit

            importedIngredients.push({
              ingredientId: ingredient.id,
              quantity: quantity,
              unit: unit
            })
          })

          if (errors.length > 0) {
            setSnackbar({
              open: true,
              message: `Import completed with ${errors.length} errors. Check console for details.`,
              severity: 'error'
            })
            console.error('Import errors:', errors)
          }

          // Add imported ingredients to current menu item
          const currentIngredients = newItem.ingredients || []
          const allIngredients = [...currentIngredients, ...importedIngredients]
          setNewItem({ ...newItem, ingredients: allIngredients })

          setSnackbar({
            open: true,
            message: `Successfully imported ${importedIngredients.length} ingredients`,
            severity: 'success'
          })
        } catch (err) {
          setSnackbar({ open: true, message: 'Failed to import ingredients', severity: 'error' })
        } finally {
          setImportingIngredients(false)
          event.target.value = '' // Reset file input
        }
      },
      error: () => {
        setImportingIngredients(false)
        setSnackbar({ open: true, message: 'Failed to parse CSV file', severity: 'error' })
        event.target.value = ''
      }
    })
  }

  const downloadIngredientsTemplate = () => {
    const template = [
      {
        name: 'Ground Beef',
        ingredientId: '',
        quantity: 0.25,
        unit: '' // Leave empty to auto-fill from ingredient's default unit
      },
      {
        name: 'Cheddar Cheese',
        ingredientId: '',
        quantity: 0.125,
        unit: '' // Leave empty to auto-fill from ingredient's default unit
      }
    ]

    const csv = Papa.unparse(template)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'menu-item-ingredients-template.csv'
    link.click()
    setSnackbar({ open: true, message: 'Template downloaded successfully', severity: 'success' })
  }

  const handleAllergenChange = (value: string) => {
    const allergens = value
      .split(',')
      .map(a => a.trim())
      .filter(a => a)
    setNewItem({ ...newItem, allergens })
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexDirection: isRtl ? 'row-reverse' : 'row'
        }}
      >
        <Typography variant="h4" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
          {t('menu_management')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <Button variant="outlined" startIcon={<SettingsIcon />} onClick={e => setCategoryMenuAnchor(e.currentTarget)}>
            {t('manage_categories')}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
            {t('add_menu_item')}
          </Button>
        </Box>
      </Box>

      {visibleCategories.map(category => {
        const categoryItems = menuItems.filter(item => item.category === category)

        return (
          <Box key={category} sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                textAlign: isRtl ? 'right' : 'left',
                flexDirection: isRtl ? 'row-reverse' : 'row'
              }}
            >
              <RestaurantMenu sx={{ marginInlineEnd: 1 }} />
              {t(category)}
            </Typography>
            <Grid container spacing={2} justifyContent={isRtl ? 'flex-end' : 'flex-start'}>
              {categoryItems.map(item => {
                const totalCost = item.totalIngredientCost || calculateTotalIngredientCost(item.ingredients)
                const profitMargin = item.profitMargin || calculateProfitMargin(item.price, totalCost)

                return (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card sx={{ height: '100%', opacity: item.isAvailable ? 1 : 0.6 }}>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1,
                            flexDirection: isRtl ? 'row-reverse' : 'row'
                          }}
                        >
                          <Typography variant="h6" component="div" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                            {item.name}
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                            <IconButton size="small" onClick={() => handleDuplicateItem(item)} sx={{ marginInlineEnd: 0.5 }}>
                              <DuplicateIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleEditItem(item)} sx={{ marginInlineEnd: 0.5 }}>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteItem(item.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: isRtl ? 'right' : 'left' }}>
                          {item.description}
                        </Typography>

                        <Typography variant="h6" color="primary" sx={{ mb: 1, textAlign: isRtl ? 'right' : 'left' }}>
                          ${item.price.toFixed(2)}
                        </Typography>

                        <Box sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="caption" display="flex" alignItems="center" sx={{ mb: 0.5, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                            <CalculateIcon sx={{ fontSize: 14, marginInlineEnd: 0.5 }} />
                            {t('ingredient_cost')}: ${totalCost.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" display="flex" alignItems="center" color={profitMargin > 0 ? 'success.main' : 'error.main'} sx={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                            <ProfitIcon sx={{ fontSize: 14, marginInlineEnd: 0.5 }} />
                            {t('profit_margin')}: {profitMargin.toFixed(1)}%
                          </Typography>
                        </Box>

                        <Typography variant="caption" display="block" sx={{ mb: 1, textAlign: isRtl ? 'right' : 'left' }}>
                          {t('prep_time')}: {item.prepTime} {t('minutes_short')}
                        </Typography>

                        {item.allergens.length > 0 && (
                          <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                            {item.allergens.map(allergen => (
                              <Chip key={allergen} label={allergen} size="small" color="warning" sx={{ marginInlineEnd: 0.5, mb: 0.5 }} />
                            ))}
                          </Box>
                        )}

                        <FormControlLabel
                          control={<Switch checked={item.isAvailable} onChange={() => toggleAvailability(item.id)} />}
                          label={t('available')}
                          sx={{
                            display: 'flex',
                            justifyContent: isRtl ? 'flex-end' : 'flex-start',
                            marginLeft: 0,
                            marginRight: 0
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          </Box>
        )
      })}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{editingItem ? t('edit_menu_item') : t('add_new_menu_item')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('item_name')} value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={categories}
                value={newItem.category}
                onChange={(_, value) => setNewItem({ ...newItem, category: value || '' })}
                onInputChange={(_, value) => setNewItem({ ...newItem, category: value || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={t('category')}
                    placeholder={t('select_or_type_new_category')}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={t('description')} multiline rows={2} value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('price')} type="number" inputProps={{ step: '0.01' }} value={newItem.price} onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('prep_time_minutes')} type="number" value={newItem.prepTime} onChange={e => setNewItem({ ...newItem, prepTime: parseInt(e.target.value) })} />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{t('ingredients')}</Typography>
                <Stack direction="row" spacing={1}>
                  <Tooltip title={t('download_template_tooltip')}>
                    <Button variant="text" size="small" startIcon={<DownloadIcon />} onClick={downloadIngredientsTemplate}>
                      {t('download_template')}
                    </Button>
                  </Tooltip>
                  <Button variant="text" size="small" startIcon={<UploadIcon />} onClick={handleImportIngredientsClick} disabled={importingIngredients}>
                    {importingIngredients ? t('importing') : t('import_csv')}
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addIngredientToItem}>
                    {t('add_ingredient')}
                  </Button>
                </Stack>
              </Box>

              {newItem.ingredients && newItem.ingredients.length > 0 && (
                <TableContainer component={Paper} sx={{ mb: 2 }} dir={isRtl ? 'rtl' : 'ltr'}>
                  <Table size="small" dir={isRtl ? 'rtl' : 'ltr'}>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('ingredient')}</TableCell>
                        <TableCell>{t('quantity')}</TableCell>
                        <TableCell>{t('unit')}</TableCell>
                        <TableCell>{t('cost')}</TableCell>
                        <TableCell>{t('actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {newItem.ingredients.map((ingredient, index) => {
                        const cost = calculateIngredientCost(ingredient.ingredientId, ingredient.quantity)
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Autocomplete size="small" options={availableIngredients} getOptionLabel={option => option.name} value={availableIngredients.find(ing => ing.id === ingredient.ingredientId) || null} onChange={(_, value) => updateIngredientInItem(index, 'ingredientId', value?.id || '')} renderInput={params => <TextField {...params} placeholder={t('select_ingredient')} />} />
                            </TableCell>
                            <TableCell>
                              <TextField size="small" type="number" inputProps={{ step: '0.01' }} value={ingredient.quantity} onChange={e => updateIngredientInItem(index, 'quantity', parseFloat(e.target.value))} />
                            </TableCell>
                            <TableCell>
                              <TextField size="small" value={ingredient.unit} onChange={e => updateIngredientInItem(index, 'unit', e.target.value)} placeholder="unit" />
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
                        )
                      })}
                      <TableRow>
                        <TableCell colSpan={3} sx={{ textAlign: isRtl ? 'start' : 'end' }}>
                          <Typography variant="subtitle2">{t('total_ingredient_cost')}:</Typography>
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
                  <Typography variant="body2">Profit Margin: {calculateProfitMargin(newItem.price, calculateTotalIngredientCost(newItem.ingredients)).toFixed(1)}%</Typography>
                  <Typography variant="body2">Profit per Item: ${(newItem.price - calculateTotalIngredientCost(newItem.ingredients)).toFixed(2)}</Typography>
                </Alert>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth label={t('allergens_comma_separated')} value={newItem.allergens?.join(', ') || ''} onChange={e => handleAllergenChange(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={newItem.isAvailable} onChange={e => setNewItem({ ...newItem, isAvailable: e.target.checked })} />} label={t('available')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('cancel')}</Button>
          <Button onClick={handleSaveItem} variant="contained">
            {editingItem ? t('update_item') : t('add_item')}
          </Button>
        </DialogActions>
      </Dialog>

      <input type="file" ref={fileInputRef} accept=".csv" style={{ display: 'none' }} onChange={handleIngredientsFileImport} />

      {/* Category Management Menu */}
      <Menu 
        anchorEl={categoryMenuAnchor} 
        open={Boolean(categoryMenuAnchor)} 
        onClose={() => setCategoryMenuAnchor(null)}
        sx={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        <MuiMenuItem onClick={handleAddCategory}>
          <ListItemIcon sx={{ minWidth: isRtl ? 'auto' : '56px', marginInlineEnd: isRtl ? 0 : 2, marginInlineStart: isRtl ? 2 : 0 }}>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ textAlign: isRtl ? 'right' : 'left' }}>
            {t('add_category')}
          </ListItemText>
        </MuiMenuItem>
        <Divider />
        {categories.map(category => (
          <MuiMenuItem 
            key={category} 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexDirection: isRtl ? 'row-reverse' : 'row',
              textAlign: isRtl ? 'right' : 'left'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flex: 1,
              flexDirection: isRtl ? 'row-reverse' : 'row'
            }}>
              <CategoryIcon 
                fontSize="small" 
                sx={{ 
                  marginInlineEnd: isRtl ? 0 : 2, 
                  marginInlineStart: isRtl ? 2 : 0 
                }} 
              />
              <Typography sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                {category}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <IconButton size="small" onClick={() => handleEditCategory(category)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleDeleteCategory(category)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </MuiMenuItem>
        ))}
      </Menu>

      {/* Category Add/Edit Dialog */}
      <Dialog 
        open={categoryDialogOpen} 
        onClose={() => setCategoryDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        <DialogTitle sx={{ textAlign: isRtl ? 'right' : 'left' }}>
          {editingCategory ? t('edit_category') : t('add_category')}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('category_name')}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            sx={{ 
              mt: 2,
              '& .MuiInputBase-input': {
                textAlign: isRtl ? 'right' : 'left'
              }
            }}
            placeholder={t('enter_category_name')}
            inputProps={{
              dir: isRtl ? 'rtl' : 'ltr'
            }}
          />
          {editingCategory && (
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 2, 
                color: 'text.secondary',
                textAlign: isRtl ? 'right' : 'left'
              }}
            >
              {t('note_editing_category_will_update_items')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          flexDirection: isRtl ? 'row-reverse' : 'row',
          justifyContent: isRtl ? 'flex-end' : 'flex-start'
        }}>
          <Button onClick={() => setCategoryDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSaveCategory} variant="contained" disabled={!newCategoryName.trim()}>
            {editingCategory ? t('update') : t('add')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
