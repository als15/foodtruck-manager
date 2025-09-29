import React, { useState, useEffect } from 'react'
import { Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, LinearProgress, Alert, Grid, CircularProgress, Snackbar, Menu, MenuItem as MuiMenuItem, ListItemIcon, ListItemText, Autocomplete, useTheme, Tabs, Tab } from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Warning as WarningIcon, Inventory as InventoryIcon, MoreVert as MoreVertIcon, Input as ImportIcon, ShoppingCart as OrderIcon, LocalShipping as DeliveryIcon, Schedule as LeadTimeIcon, Visibility as ViewIcon, VisibilityOff as HideIcon, DeleteOutline as DisposeIcon, Analytics as AnalyticsIcon } from '@mui/icons-material'
import { InventoryItem, Ingredient, Supplier, Order, MenuItem } from '../types'
import { inventoryService, ingredientsService, suppliersService, subscriptions, ordersService, menuItemsService } from '../services/supabaseService'
import WasteAnalyticsDashboard from '../components/WasteAnalyticsDashboard'
import { wasteExpenseIntegration } from '../utils/wasteExpenseIntegration'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../utils/currency'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} id={`inventory-tabpanel-${index}`} aria-labelledby={`inventory-tab-${index}`} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function Inventory() {
  const theme = useTheme()
  const docDir = typeof document !== 'undefined' ? document.documentElement.dir : undefined
  const isRtl = docDir === 'rtl' || theme.direction === 'rtl'
  const { t } = useTranslation()
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' })
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showAutoOrders, setShowAutoOrders] = useState(false)
  const [disposeDialog, setDisposeDialog] = useState({ open: false, item: null as InventoryItem | null, quantity: 0 })

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [currentTab, setCurrentTab] = useState(0)

  // Load data on component mount
  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const inventorySubscription = subscriptions.inventory(payload => {
      console.log('Inventory changed:', payload)
      loadInventoryItems()
    })

    const ingredientSubscription = subscriptions.ingredients(payload => {
      console.log('Ingredients changed:', payload)
      loadIngredients()
    })

    return () => {
      inventorySubscription.unsubscribe()
      ingredientSubscription.unsubscribe()
    }
  }, [])

  const loadData = async () => {
    await Promise.all([loadInventoryItems(), loadIngredients(), loadSuppliers(), loadOrders(), loadMenuItems()])
  }

  const loadInventoryItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await inventoryService.getAll()
      setInventoryItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed_to_load_data'))
      setSnackbar({ open: true, message: t('failed_to_load_data'), severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadIngredients = async () => {
    try {
      const data = await ingredientsService.getAll()
      setAvailableIngredients(data)
    } catch (err) {
      setSnackbar({ open: true, message: t('failed_to_load_data'), severity: 'error' })
    }
  }

  const loadSuppliers = async () => {
    try {
      const data = await suppliersService.getAll()
      setSuppliers(data)
    } catch (err) {
      setSnackbar({ open: true, message: t('failed_to_load_data'), severity: 'error' })
    }
  }

  const loadOrders = async () => {
    try {
      const data = await ordersService.getAll()
      setOrders(data)
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load orders', severity: 'error' })
    }
  }

  const loadMenuItems = async () => {
    try {
      const data = await menuItemsService.getAll()
      setMenuItems(data)
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load menu items', severity: 'error' })
    }
  }

  const handleImportFromIngredients = async () => {
    try {
      // Get ingredients that are not already in inventory
      const existingNames = new Set(inventoryItems.map(item => item.name.toLowerCase()))
      const missingIngredients = availableIngredients.filter(ing => !existingNames.has(ing.name.toLowerCase()))

      if (missingIngredients.length === 0) {
        setSnackbar({ open: true, message: 'All ingredients are already in inventory', severity: 'info' })
        setMenuAnchor(null)
        return
      }

      await inventoryService.createFromIngredients(missingIngredients.map(ing => ing.id))
      setSnackbar({
        open: true,
        message: `Imported ${missingIngredients.length} ingredients to inventory`,
        severity: 'success'
      })
      await loadInventoryItems()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to import ingredients', severity: 'error' })
    } finally {
      setMenuAnchor(null)
    }
  }

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    category: '',
    currentStock: 0,
    unit: '',
    minThreshold: 5,
    costPerUnit: 0,
    supplier: '',
    lastRestocked: new Date()
  })

  const handleIngredientSelect = (selectedIngredient: Ingredient | null) => {
    if (selectedIngredient) {
      setNewItem({
        ...newItem,
        name: selectedIngredient.name,
        category: selectedIngredient.category,
        unit: selectedIngredient.unit,
        costPerUnit: selectedIngredient.costPerUnit,
        supplier: selectedIngredient.supplier
      })
    } else {
      setNewItem({
        ...newItem,
        name: '',
        category: '',
        unit: '',
        costPerUnit: 0,
        supplier: ''
      })
    }
  }

  const handleSaveItem = async () => {
    try {
      if (editingItem) {
        await inventoryService.update(editingItem.id, newItem)
        setSnackbar({ open: true, message: 'Inventory item updated successfully', severity: 'success' })
      } else {
        await inventoryService.create(newItem as Omit<InventoryItem, 'id'>)
        setSnackbar({ open: true, message: 'Inventory item created successfully', severity: 'success' })
      }

      await loadInventoryItems()

      setNewItem({
        name: '',
        category: '',
        currentStock: 0,
        unit: '',
        minThreshold: 5,
        costPerUnit: 0,
        supplier: '',
        lastRestocked: new Date()
      })
      setEditingItem(null)
      setOpenDialog(false)
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save inventory item', severity: 'error' })
    }
  }

  const handleEditItem = (item: InventoryItem) => {
    setNewItem(item)
    setEditingItem(item)
    setOpenDialog(true)
  }

  const handleDeleteItem = async (id: string) => {
    try {
      await inventoryService.delete(id)
      setSnackbar({ open: true, message: 'Inventory item deleted successfully', severity: 'success' })
      await loadInventoryItems()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete inventory item', severity: 'error' })
    }
  }

  const handleMarkAsDisposed = (item: InventoryItem) => {
    setDisposeDialog({ open: true, item, quantity: 0 })
  }

  const handleConfirmDisposal = async () => {
    if (!disposeDialog.item || disposeDialog.quantity <= 0) return

    try {
      const updatedItem = {
        ...disposeDialog.item,
        currentStock: Math.max(0, disposeDialog.item.currentStock - disposeDialog.quantity),
        disposedQuantity: (disposeDialog.item.disposedQuantity || 0) + disposeDialog.quantity
      }

      await inventoryService.update(disposeDialog.item.id, updatedItem)
      setSnackbar({
        open: true,
        message: `Marked ${disposeDialog.quantity} ${disposeDialog.item.unit} of ${disposeDialog.item.name} as disposed`,
        severity: 'success'
      })
      await loadInventoryItems()
      setDisposeDialog({ open: false, item: null, quantity: 0 })
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to mark item as disposed', severity: 'error' })
    }
  }

  const addSampleWasteData = async () => {
    try {
      // Add sample waste data to a few inventory items for demonstration
      const itemsToUpdate = inventoryItems.slice(0, Math.min(3, inventoryItems.length))

      const updatePromises = itemsToUpdate.map((item, index) => {
        const sampleWaste = [2, 1.5, 3][index] || 1 // Different waste amounts
        const updatedItem = {
          ...item,
          disposedQuantity: sampleWaste
        }
        return inventoryService.update(item.id, updatedItem)
      })

      await Promise.all(updatePromises)
      await loadInventoryItems()

      setSnackbar({
        open: true,
        message: 'Sample waste data added to demonstrate analytics features',
        severity: 'success'
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to add sample waste data',
        severity: 'error'
      })
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.minThreshold) * 100
    if (percentage <= 50) return { status: 'critical', color: 'error' }
    if (percentage <= 100) return { status: 'low', color: 'warning' }
    return { status: 'good', color: 'success' }
  }

  const getStockPercentage = (item: InventoryItem) => {
    return Math.min((item.currentStock / (item.minThreshold * 2)) * 100, 100)
  }

  const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minThreshold)
  const totalInventoryValue = inventoryItems.reduce((total, item) => total + item.currentStock * item.costPerUnit, 0)

  // Generate auto-order suggestions
  const autoOrderSuggestions = lowStockItems
    .map(item => {
      const supplier = suppliers.find(sup => sup.name === item.supplier && sup.autoOrderEnabled && sup.isActive)
      if (!supplier) return null

      const suggestedQuantity = Math.max(
        item.minThreshold * 2 - item.currentStock, // Restock to double the threshold
        supplier.minimumOrderAmount / item.costPerUnit // Or meet minimum order amount
      )

      return {
        item,
        supplier,
        suggestedQuantity: Math.ceil(suggestedQuantity),
        totalCost: suggestedQuantity * item.costPerUnit,
        deliveryDays: supplier.deliveryDays,
        leadTime: supplier.leadTime
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b?.totalCost || 0) - (a?.totalCost || 0)) // Sort by cost descending

  // Get existing categories from inventory items (for display)
  const categories = Array.from(new Set(inventoryItems.map(item => item.category))).sort()

  // Get all ingredient categories for autocomplete
  const allCategories = Array.from(new Set([...availableIngredients.map(ing => ing.category), ...inventoryItems.map(item => item.category)])).sort()

  const totalAutoOrderValue = autoOrderSuggestions.reduce((sum, order) => sum + (order?.totalCost || 0), 0)

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
          Retry
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <Typography variant="h4" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
          {t('inventory_management')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<MoreVertIcon />} onClick={e => setMenuAnchor(e.currentTarget)}>
            {t('import')}
          </Button>
          {inventoryItems.length > 0 && !inventoryItems.some(item => (item.disposedQuantity || 0) > 0) && currentTab === 1 && (
            <Button variant="outlined" color="warning" onClick={addSampleWasteData} size="small">
              Add Sample Waste Data
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
            {t('add_item')}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, direction: isRtl ? 'rtl' : 'ltr' }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-flexContainer': {
              flexDirection: isRtl ? 'row-reverse' : 'row'
            },
            '& .MuiTab-root': {
              textAlign: isRtl ? 'right' : 'left'
            }
          }}
        >
          <Tab label={t('inventory_items')} icon={<InventoryIcon />} iconPosition="start" />
          <Tab label={t('waste_analytics')} icon={<AnalyticsIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Inventory Items Tab */}
      <TabPanel value={currentTab} index={0}>
        {lowStockItems.length > 0 && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
            <Typography variant="h6">{t('low_stock_alert')}</Typography>
            <Typography>
              {t('items_below_min_threshold', { count: lowStockItems.length })}: {lowStockItems.map(item => item.name).join(', ')}
            </Typography>
          </Alert>
        )}

        {/* Auto-Order Suggestions */}
        {autoOrderSuggestions.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <OrderIcon sx={{ marginInlineEnd: 1 }} />
                  {t('auto_order_suggestions')} ({autoOrderSuggestions.length})
                </Typography>
                <Button variant="outlined" size="small" startIcon={showAutoOrders ? <HideIcon /> : <ViewIcon />} onClick={() => setShowAutoOrders(!showAutoOrders)}>
                  {showAutoOrders ? t('hide') : t('view')} {t('suggestions')}
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: isRtl ? 'right' : 'left' }}>
                {t('total_estimated_cost')}: <strong>{formatCurrency(totalAutoOrderValue)}</strong>
              </Typography>

              {showAutoOrders && (
                <TableContainer component={Paper} sx={{ mt: 2 }} dir={isRtl ? 'rtl' : 'ltr'}>
                  <Table size="small" dir={isRtl ? 'rtl' : 'ltr'}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Supplier</TableCell>
                        <TableCell>Current Stock</TableCell>
                        <TableCell>Suggested Qty</TableCell>
                        <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>Unit Cost</TableCell>
                        <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>Total Cost</TableCell>
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
                            <Chip label={`${suggestion?.item.currentStock} ${suggestion?.item.unit}`} size="small" color="error" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="primary">
                              {suggestion?.suggestedQuantity} {suggestion?.item.unit}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>
                            <Typography variant="body2">{formatCurrency(suggestion?.item.costPerUnit || 0)}</Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {formatCurrency(suggestion?.totalCost || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <DeliveryIcon sx={{ fontSize: 14 }} />
                              <Typography variant="caption">{suggestion?.deliveryDays.join(', ')}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LeadTimeIcon sx={{ fontSize: 14 }} />
                              <Typography variant="caption">{suggestion?.leadTime} days lead time</Typography>
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

        <Grid container spacing={3} sx={{ mb: 3 }} direction={isRtl ? 'row-reverse' : 'row'} justifyContent={isRtl ? 'flex-end' : 'flex-start'}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: isRtl ? 'right' : 'left', display: 'flex', flexDirection: 'column', alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                <Typography variant="h6" color="primary">
                  {t('total_items')}
                </Typography>
                <Typography variant="h4">{inventoryItems.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: isRtl ? 'right' : 'left', display: 'flex', flexDirection: 'column', alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                <Typography variant="h6" color="warning.main">
                  {t('low_stock_items')}
                </Typography>
                <Typography variant="h4">{lowStockItems.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: isRtl ? 'right' : 'left', display: 'flex', flexDirection: 'column', alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                <Typography variant="h6" color="success.main">
                  {t('total_value')}
                </Typography>
                <Typography variant="h4">{formatCurrency(totalInventoryValue)}</Typography>
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
        </Grid>

        {categories.map(category => (
          <Box key={category} sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', textAlign: isRtl ? 'right' : 'left', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <InventoryIcon sx={{ marginInlineEnd: 1 }} />
              {category}
            </Typography>

            <TableContainer component={Paper} dir={isRtl ? 'rtl' : 'ltr'}>
              <Table dir={isRtl ? 'rtl' : 'ltr'}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('item_name')}</TableCell>
                    <TableCell>{t('current_stock')}</TableCell>
                    <TableCell>{t('unit')}</TableCell>
                    <TableCell>{t('min_threshold')}</TableCell>
                    <TableCell>{t('stock_level')}</TableCell>
                    <TableCell>{t('disposed')}</TableCell>
                    <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('cost_per_unit')}</TableCell>
                    <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('total_value')}</TableCell>
                    <TableCell>{t('supplier_label')}</TableCell>
                    <TableCell>{t('last_restocked')}</TableCell>
                    <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryItems
                    .filter(item => item.category === category)
                    .map(item => {
                      const stockStatus = getStockStatus(item)
                      const stockPercentage = getStockPercentage(item)

                      return (
                        <TableRow
                          key={item.id}
                          sx={{
                            backgroundColor: stockStatus.status === 'critical' ? 'error.light' : stockStatus.status === 'low' ? 'warning.light' : 'inherit',
                            opacity: stockStatus.status === 'critical' ? 0.8 : 1
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                              {item.name}
                              {item.currentStock <= item.minThreshold && <WarningIcon sx={{ marginInlineStart: 1, color: 'warning.main' }} fontSize="small" />}
                            </Box>
                          </TableCell>
                          <TableCell>{item.currentStock}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.minThreshold}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
                              <LinearProgress variant="determinate" value={stockPercentage} color={stockStatus.color as any} sx={{ flexGrow: 1, mr: 1 }} />
                              <Chip label={stockStatus.status} color={stockStatus.color as any} size="small" />
                            </Box>
                          </TableCell>
                          <TableCell>
                            {item.disposedQuantity ? (
                              <Chip label={`${item.disposedQuantity} ${item.unit}`} size="small" color="warning" variant="outlined" />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{formatCurrency(item.costPerUnit)}</TableCell>
                          <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{formatCurrency(item.currentStock * item.costPerUnit)}</TableCell>
                          <TableCell>{item.supplier}</TableCell>
                          <TableCell>{item.lastRestocked.toLocaleDateString()}</TableCell>
                          <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>
                            <IconButton size="small" onClick={() => handleEditItem(item)} title="Edit item">
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleMarkAsDisposed(item)} title="Mark as disposed" color="warning">
                              <DisposeIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteItem(item.id)} title="Delete item">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}
      </TabPanel>

      {/* Waste Analytics Tab */}
      <TabPanel value={currentTab} index={1}>
        {/* Quick guide */}
        {inventoryItems.length > 0 && !inventoryItems.some(item => (item.disposedQuantity || 0) > 0) && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">{t('waste_analytics_dashboard')}</Typography>
            <Typography variant="body2">{t('start_tracking_waste_help')}</Typography>
          </Alert>
        )}

        <WasteAnalyticsDashboard
          inventoryItems={inventoryItems}
          orders={orders}
          menuItems={menuItems}
          ingredients={availableIngredients}
          onWasteExpenseCalculated={async expense => {
            try {
              await wasteExpenseIntegration.createOrUpdateWasteExpense(expense)
              setSnackbar({ open: true, message: t('waste_expense_added', { amount: formatCurrency(expense.amount) }), severity: 'success' })
            } catch (error) {
              console.error('Failed to integrate waste expense:', error)
              setSnackbar({ open: true, message: t('failed_to_update_waste_expense'), severity: 'error' })
            }
          }}
        />
      </TabPanel>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingItem ? t('edit_inventory_item') : t('add_new_inventory_item')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={availableIngredients.filter(ing => !inventoryItems.some(item => item.name.toLowerCase() === ing.name.toLowerCase()))}
                getOptionLabel={option => option.name}
                value={availableIngredients.find(ing => ing.name === newItem.name) || null}
                onChange={(_, value) => handleIngredientSelect(value)}
                renderInput={params => (
                  <TextField
                    {...params}
                    fullWidth
                    label={t('select_ingredient_label')}
                    placeholder={t('select_ingredient_placeholder')}
                    disabled={editingItem !== null} // Disable when editing
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.category} • {option.supplier} • {formatCurrency(option.costPerUnit)}/{option.unit}
                      </Typography>
                    </Box>
                  </li>
                )}
                disabled={editingItem !== null} // Disable when editing existing items
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete freeSolo options={allCategories} value={newItem.category} onChange={(_, value) => setNewItem({ ...newItem, category: value || '' })} onInputChange={(_, value) => setNewItem({ ...newItem, category: value || '' })} renderInput={params => <TextField {...params} fullWidth label="Category" placeholder="e.g., Meat, Vegetables, Dairy" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Current Stock" type="number" value={newItem.currentStock} onChange={e => setNewItem({ ...newItem, currentStock: parseFloat(e.target.value) })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label={t('unit')} value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} placeholder="e.g., lbs, dozen, pieces" InputProps={{ readOnly: !editingItem && !newItem.name }} helperText={!editingItem && !newItem.name ? t('auto_filled_from_ingredient') : ''} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label={t('min_threshold')} type="number" value={newItem.minThreshold} onChange={e => setNewItem({ ...newItem, minThreshold: parseFloat(e.target.value) })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('cost_per_unit')} type="number" inputProps={{ step: '0.01' }} value={newItem.costPerUnit} onChange={e => setNewItem({ ...newItem, costPerUnit: parseFloat(e.target.value) })} InputProps={{ readOnly: !editingItem && !newItem.name }} helperText={!editingItem && !newItem.name ? t('auto_filled_from_ingredient') : ''} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('supplier_label')} value={newItem.supplier} onChange={e => setNewItem({ ...newItem, supplier: e.target.value })} InputProps={{ readOnly: !editingItem && !newItem.name }} helperText={!editingItem && !newItem.name ? t('auto_filled_from_ingredient') : ''} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={t('last_restocked')} type="date" value={newItem.lastRestocked?.toISOString().split('T')[0]} onChange={e => setNewItem({ ...newItem, lastRestocked: new Date(e.target.value) })} InputLabelProps={{ shrink: true }} />
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

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MuiMenuItem onClick={handleImportFromIngredients}>
          <ListItemIcon>
            <ImportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Import from Ingredients</ListItemText>
        </MuiMenuItem>
      </Menu>

      <Dialog open={disposeDialog.open} onClose={() => setDisposeDialog({ open: false, item: null, quantity: 0 })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <DisposeIcon sx={{ mr: 1, color: 'warning.main' }} />
          {t('mark_as_disposed_title')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('mark_quantity_disposed_for')} <strong>{disposeDialog.item?.name}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('current_stock')}: {disposeDialog.item?.currentStock} {disposeDialog.item?.unit}
            {disposeDialog.item?.disposedQuantity && (
              <>
                <br />
                {t('previously_disposed')}: {disposeDialog.item.disposedQuantity} {disposeDialog.item.unit}
              </>
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField fullWidth label={t('quantity_to_dispose')} type="number" value={disposeDialog.quantity} onChange={e => setDisposeDialog({ ...disposeDialog, quantity: parseFloat(e.target.value) || 0 })} inputProps={{ min: 0, max: disposeDialog.item?.currentStock || 0, step: 0.01 }} helperText={t('quantity_enter_between', { max: disposeDialog.item?.currentStock || 0, unit: disposeDialog.item?.unit || '' })} />
            <Button variant="outlined" color="warning" onClick={() => setDisposeDialog({ ...disposeDialog, quantity: disposeDialog.item?.currentStock || 0 })} sx={{ mb: 2.5, minWidth: 'auto', px: 2 }}>
              {t('all_button')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisposeDialog({ open: false, item: null, quantity: 0 })}>{t('cancel')}</Button>
          <Button onClick={handleConfirmDisposal} variant="contained" color="warning" disabled={disposeDialog.quantity <= 0 || disposeDialog.quantity > (disposeDialog.item?.currentStock || 0)}>
            {t('mark_as_disposed_title')}
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
