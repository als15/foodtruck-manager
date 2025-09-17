import React, { useState, useEffect, useRef } from 'react'
import { Box, Typography, Grid, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Autocomplete, Switch, FormControlLabel, CircularProgress, Alert, Snackbar, Menu, MenuItem as MuiMenuItem, ListItemIcon, ListItemText, Divider, useTheme } from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ContentCopy as DuplicateIcon, Kitchen as KitchenIcon, Upload as UploadIcon, Download as DownloadIcon, MoreVert as MoreVertIcon } from '@mui/icons-material'
import { Ingredient, Supplier } from '../types'
import { ingredientsService, suppliersService, subscriptions } from '../services/supabaseService'
import Papa from 'papaparse'
import { useTranslation } from 'react-i18next'

export default function Ingredients() {
  const theme = useTheme()
  const docDir = typeof document !== 'undefined' ? document.documentElement.dir : undefined
  const isRtl = docDir === 'rtl' || theme.direction === 'rtl'
  const { t } = useTranslation()
  const [openDialog, setOpenDialog] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' })
  const [importing, setImporting] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newIngredient, setNewIngredient] = useState<Partial<Ingredient>>({
    name: '',
    costPerUnit: 0,
    unit: '',
    supplier: '',
    category: '',
    isAvailable: true,
    unitsPerPackage: undefined,
    packageType: '',
    minimumOrderQuantity: undefined,
    orderByPackage: false,
    lastUpdated: new Date()
  })

  // Load ingredients and suppliers on component mount
  useEffect(() => {
    loadIngredients()
    loadSuppliers()
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    const subscription = subscriptions.ingredients(payload => {
      console.log('Ingredients changed:', payload)
      // Reload ingredients when changes occur
      loadIngredients()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadIngredients = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ingredientsService.getAll()
      setIngredients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed_to_load_data'))
      setSnackbar({ open: true, message: t('failed_to_load_data'), severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadSuppliers = async () => {
    try {
      const data = await suppliersService.getAll()
      setSuppliers(data.filter(supplier => supplier.isActive))
    } catch (err) {
      console.error('Failed to load suppliers:', err)
    }
  }

  const handleSaveIngredient = async () => {
    try {
      if (editingIngredient) {
        await ingredientsService.update(editingIngredient.id, newIngredient)
        setSnackbar({ open: true, message: t('ingredient_updated_success'), severity: 'success' })
      } else {
        await ingredientsService.create(newIngredient as Omit<Ingredient, 'id' | 'lastUpdated' | 'businessId'>)
        setSnackbar({ open: true, message: t('ingredient_created_success'), severity: 'success' })
      }

      // Reload ingredients to get updated data
      await loadIngredients()

      setNewIngredient({
        name: '',
        costPerUnit: 0,
        unit: '',
        supplier: '',
        category: '',
        isAvailable: true,
        unitsPerPackage: undefined,
        packageType: '',
        minimumOrderQuantity: undefined,
        orderByPackage: false,
        lastUpdated: new Date()
      })
      setEditingIngredient(null)
      setOpenDialog(false)
    } catch (err) {
      setSnackbar({ open: true, message: t('failed_to_save_ingredient'), severity: 'error' })
    }
  }

  const handleEditIngredient = (ingredient: Ingredient) => {
    setNewIngredient(ingredient)
    setEditingIngredient(ingredient)
    setOpenDialog(true)
  }

  const handleDeleteIngredient = async (id: string) => {
    try {
      await ingredientsService.delete(id)
      setSnackbar({ open: true, message: t('ingredient_deleted_success'), severity: 'success' })
      await loadIngredients()
    } catch (err) {
      setSnackbar({ open: true, message: t('failed_to_delete_ingredient'), severity: 'error' })
    }
  }

  const handleDuplicateIngredient = (ingredient: Ingredient) => {
    const duplicatedIngredient = {
      ...ingredient,
      name: `${ingredient.name} (Copy)`,
      id: undefined,
      lastUpdated: undefined
    }
    setNewIngredient(duplicatedIngredient)
    setEditingIngredient(null)
    setOpenDialog(true)
  }

  const toggleAvailability = async (id: string) => {
    try {
      const ingredient = ingredients.find(ing => ing.id === id)
      if (ingredient) {
        await ingredientsService.update(id, { isAvailable: !ingredient.isAvailable })
        setSnackbar({ open: true, message: t('availability_updated_success'), severity: 'success' })
        await loadIngredients()
      }
    } catch (err) {
      setSnackbar({ open: true, message: t('failed_to_update_availability'), severity: 'error' })
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
    setMenuAnchor(null)
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        try {
          const validIngredients: Omit<Ingredient, 'id' | 'lastUpdated' | 'businessId'>[] = []
          const errors: string[] = []

          results.data.forEach((row: any, index: number) => {
            if (!row.name || !row.costPerUnit || !row.unit || !row.supplier || !row.category) {
              errors.push(`Row ${index + 1}: Missing required fields`)
              return
            }

            const costPerUnit = parseFloat(row.costPerUnit)
            if (isNaN(costPerUnit)) {
              errors.push(`Row ${index + 1}: Invalid cost per unit`)
              return
            }

            validIngredients.push({
              name: row.name.trim(),
              costPerUnit: costPerUnit,
              unit: row.unit.trim(),
              supplier: row.supplier.trim(),
              category: row.category.trim(),
              isAvailable: row.isAvailable?.toLowerCase() !== 'false',
              unitsPerPackage: row.unitsPerPackage ? parseInt(row.unitsPerPackage) : undefined,
              packageType: row.packageType?.trim() || undefined,
              minimumOrderQuantity: row.minimumOrderQuantity ? parseInt(row.minimumOrderQuantity) : undefined,
              orderByPackage: row.orderByPackage?.toLowerCase() === 'true'
            })
          })

          if (errors.length > 0) {
            setSnackbar({
              open: true,
              message: t('import_completed_with_errors', { count: errors.length }),
              severity: 'warning' as 'warning'
            })
            console.error('Import errors:', errors)
          }

          // Import valid ingredients
          for (const ingredient of validIngredients) {
            await ingredientsService.create(ingredient)
          }

          setSnackbar({
            open: true,
            message: t('ingredients_imported_success', { count: validIngredients.length }),
            severity: 'success'
          })
          await loadIngredients()
        } catch (err) {
          setSnackbar({ open: true, message: t('failed_to_import_ingredients'), severity: 'error' })
        } finally {
          setImporting(false)
          event.target.value = '' // Reset file input
        }
      },
      error: () => {
        setImporting(false)
        setSnackbar({ open: true, message: t('failed_to_parse_csv'), severity: 'error' })
        event.target.value = ''
      }
    })
  }

  const handleExportCSV = () => {
    const csvData = ingredients.map(ingredient => ({
      name: ingredient.name,
      costPerUnit: ingredient.costPerUnit,
      unit: ingredient.unit,
      supplier: ingredient.supplier,
      category: ingredient.category,
      isAvailable: ingredient.isAvailable,
      unitsPerPackage: ingredient.unitsPerPackage || '',
      packageType: ingredient.packageType || '',
      minimumOrderQuantity: ingredient.minimumOrderQuantity || '',
      orderByPackage: ingredient.orderByPackage || false
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ingredients-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    setMenuAnchor(null)
    setSnackbar({ open: true, message: t('ingredients_exported_success'), severity: 'success' })
  }

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Ground Beef',
        costPerUnit: 8.99,
        unit: 'lbs',
        supplier: 'Local Butcher',
        category: 'Meat',
        isAvailable: true,
        unitsPerPackage: 5,
        packageType: 'box',
        minimumOrderQuantity: 5,
        orderByPackage: true
      },
      {
        name: 'Tomatoes',
        costPerUnit: 2.5,
        unit: 'lbs',
        supplier: 'Fresh Farms',
        category: 'Vegetables',
        isAvailable: true,
        unitsPerPackage: 10,
        packageType: 'crate',
        minimumOrderQuantity: 1,
        orderByPackage: false
      }
    ]

    const csv = Papa.unparse(template)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'ingredients-template.csv'
    link.click()
    setMenuAnchor(null)
    setSnackbar({ open: true, message: t('template_downloaded_success'), severity: 'success' })
  }

  // Common ingredient categories for autocomplete
  const commonCategories = ['Meat', 'Vegetables', 'Fruits', 'Dairy', 'Grains', 'Spices', 'Condiments', 'Seafood', 'Pantry', 'Beverages', 'Oils', 'Nuts', 'Herbs', 'Baking']

  const existingCategories = Array.from(new Set(ingredients.map(ing => ing.category)))
  // Keep allCategories for autocomplete (includes common + existing)
  const allCategories = commonCategories.concat(existingCategories)
  const categoriesForAutocomplete = Array.from(new Set(allCategories)).sort()
  // Only show categories that actually have ingredients
  const categories = existingCategories.sort()

  const supplierNames = suppliers.map(supplier => supplier.name).sort()

  const totalIngredients = ingredients.length
  const availableIngredients = ingredients.filter(ing => ing.isAvailable).length
  const avgCostPerIngredient = ingredients.length > 0 ? ingredients.reduce((sum, ing) => sum + ing.costPerUnit, 0) / ingredients.length : 0

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
        <Button variant="contained" onClick={loadIngredients}>
          Retry
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <Typography variant="h4" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
          {t('ingredient_management')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<MoreVertIcon />} onClick={e => setMenuAnchor(e.currentTarget)}>
            {t('import_export')}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
            {t('add_ingredient')}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }} direction={isRtl ? 'row-reverse' : 'row'} justifyContent={isRtl ? 'flex-end' : 'flex-start'} alignItems="stretch">
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: isRtl ? 'right' : 'left', display: 'flex', flexDirection: 'column', alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Typography variant="h6" color="primary">
                {t('total_ingredients')}
              </Typography>
              <Typography variant="h4">{totalIngredients}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: isRtl ? 'right' : 'left', display: 'flex', flexDirection: 'column', alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Typography variant="h6" color="success.main">
                {t('available')}
              </Typography>
              <Typography variant="h4">{availableIngredients}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: isRtl ? 'right' : 'left', display: 'flex', flexDirection: 'column', alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Typography variant="h6" color="info.main">
                {t('categories_text')}
              </Typography>
              <Typography variant="h4">{categories.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: isRtl ? 'right' : 'left', display: 'flex', flexDirection: 'column', alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Typography variant="h6" color="warning.main">
                {t('avg_cost')}
              </Typography>
              <Typography variant="h4">${avgCostPerIngredient.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {categories.map(category => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', textAlign: isRtl ? 'right' : 'left', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <KitchenIcon sx={{ marginInlineEnd: 1 }} />
            {category}
          </Typography>

          <TableContainer component={Paper} dir={isRtl ? 'rtl' : 'ltr'}>
            <Table dir={isRtl ? 'rtl' : 'ltr'}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('ingredient_name')}</TableCell>
                  <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('cost_per_unit')}</TableCell>
                  <TableCell>{t('unit')}</TableCell>
                  <TableCell>{t('supplier_label')}</TableCell>
                  <TableCell>{t('status_text')}</TableCell>
                  <TableCell>{t('last_updated')}</TableCell>
                  <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ingredients
                  .filter(ing => ing.category === category)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(ingredient => (
                    <TableRow key={ingredient.id} sx={{ opacity: ingredient.isAvailable ? 1 : 0.6 }}>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {ingredient.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>
                        <Typography variant="body1" color="primary">
                          ${ingredient.costPerUnit.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>{ingredient.unit}</TableCell>
                      <TableCell>{ingredient.supplier}</TableCell>
                      <TableCell>
                        <FormControlLabel control={<Switch checked={ingredient.isAvailable} onChange={() => toggleAvailability(ingredient.id)} size="small" />} label={ingredient.isAvailable ? t('available') : t('unavailable')} />
                      </TableCell>
                      <TableCell>{ingredient.lastUpdated.toLocaleDateString()}</TableCell>
                      <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>
                        <IconButton size="small" onClick={() => handleDuplicateIngredient(ingredient)}>
                          <DuplicateIcon />
                        </IconButton>
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
        <DialogTitle>{editingIngredient ? t('edit_ingredient') : t('add_new_ingredient')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label={t('ingredient_name')} value={newIngredient.name} onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('cost_per_unit')} type="number" inputProps={{ step: '0.01' }} value={newIngredient.costPerUnit} onChange={e => setNewIngredient({ ...newIngredient, costPerUnit: parseFloat(e.target.value) })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('unit')} value={newIngredient.unit} onChange={e => setNewIngredient({ ...newIngredient, unit: e.target.value })} placeholder="e.g., lbs, oz, piece, cup" />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete freeSolo options={supplierNames} value={newIngredient.supplier} onChange={(_, value) => setNewIngredient({ ...newIngredient, supplier: value || '' })} onInputChange={(_, value) => setNewIngredient({ ...newIngredient, supplier: value || '' })} renderInput={params => <TextField {...params} fullWidth label={t('supplier_label')} placeholder={t('select_supplier_placeholder')} />} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete freeSolo options={categoriesForAutocomplete} value={newIngredient.category} onChange={(_, value) => setNewIngredient({ ...newIngredient, category: value || '' })} onInputChange={(_, value) => setNewIngredient({ ...newIngredient, category: value || '' })} renderInput={params => <TextField {...params} fullWidth label={t('category')} placeholder="e.g., Meat, Vegetables, Dairy" />} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>{t('packaging_information')}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('units_per_package')} type="number" inputProps={{ step: '1' }} value={newIngredient.unitsPerPackage || ''} onChange={e => setNewIngredient({ ...newIngredient, unitsPerPackage: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="e.g., 12" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('package_type')} value={newIngredient.packageType || ''} onChange={e => setNewIngredient({ ...newIngredient, packageType: e.target.value })} placeholder="e.g., box, case, bag" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('minimum_order_quantity')} type="number" inputProps={{ step: '1' }} value={newIngredient.minimumOrderQuantity || ''} onChange={e => setNewIngredient({ ...newIngredient, minimumOrderQuantity: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="e.g., 5" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel control={<Switch checked={newIngredient.orderByPackage || false} onChange={e => setNewIngredient({ ...newIngredient, orderByPackage: e.target.checked })} />} label={t('order_by_package')} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={newIngredient.isAvailable} onChange={e => setNewIngredient({ ...newIngredient, isAvailable: e.target.checked })} />} label={t('available')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('cancel')}</Button>
          <Button onClick={handleSaveIngredient} variant="contained">
            {editingIngredient ? t('update_ingredient') : t('add_ingredient')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MuiMenuItem onClick={downloadTemplate}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('download_template')}</ListItemText>
        </MuiMenuItem>
        <MuiMenuItem onClick={handleImportClick} disabled={importing}>
          <ListItemIcon>
            <UploadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{importing ? t('importing') : t('import_csv')}</ListItemText>
        </MuiMenuItem>
        <Divider />
        <MuiMenuItem onClick={handleExportCSV}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('export_csv')}</ListItemText>
        </MuiMenuItem>
      </Menu>

      <input type="file" ref={fileInputRef} accept=".csv" style={{ display: 'none' }} onChange={handleFileImport} />
    </Box>
  )
}
