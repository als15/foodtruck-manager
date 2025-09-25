import React, { useState, useEffect, useRef } from 'react'
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
  CircularProgress,
  Snackbar,
  Select,
  MenuItem as MuiMenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Stack,
  useTheme,
  Menu,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Fab,
  Badge,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  RestaurantMenu,
  Calculate as CalculateIcon,
  TrendingUp as ProfitIcon,
  Remove as RemoveIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon
} from '@mui/icons-material'
import { MenuItem, Ingredient, MenuItemIngredient } from '../../types'
import { menuItemsService, ingredientsService, menuCategoriesService, subscriptions } from '../../services/supabaseService'
import Papa from 'papaparse'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/currency'

interface ImprovedMenuManagementProps {
  // Props if needed
}

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'available' | 'unavailable' | 'profitable' | 'low-margin'

export default function ImprovedMenuManagement() {
  const theme = useTheme()
  const isRtl = theme.direction === 'rtl'
  const { t } = useTranslation()

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  // Mock data - replace with real data loading
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>(['all', 'salads', 'sandwiches', 'beverages', 'desserts'])

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

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // Load your data here
      // const data = await menuItemsService.getAll()
      // setMenuItems(data)
    } catch (err) {
      setError('Failed to load menu items')
    } finally {
      setLoading(false)
    }
  }

  // Filter and search logic
  const filteredItems = menuItems.filter(item => {
    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Category filter
    if (activeCategory !== 'all' && item.category !== activeCategory) {
      return false
    }

    // Status filter
    switch (filterType) {
      case 'available':
        return item.isAvailable
      case 'unavailable':
        return !item.isAvailable
      case 'profitable':
        return (item.profitMargin || 0) > 30
      case 'low-margin':
        return (item.profitMargin || 0) < 20
      default:
        return true
    }
  })

  // Get category counts
  const getCategoryCount = (category: string) => {
    if (category === 'all') return menuItems.length
    return menuItems.filter(item => item.category === category).length
  }

  const handleQuickToggleAvailability = async (item: MenuItem) => {
    // Implement toggle logic
    console.log('Toggle availability for:', item.name)
    // You would call your actual toggle service here
    // await menuItemsService.update(item.id, { isAvailable: !item.isAvailable })
  }

  const handleQuickEdit = (item: MenuItem, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingItem(item)
    setNewItem(item)
    setOpenDialog(true)
  }

  const renderGridView = () => (
    <Grid container spacing={3}>
      {filteredItems.map(item => (
        <Grid item xs={12} sm={6} lg={4} key={item.id}>
          <Card 
            sx={{ 
              height: '100%',
              position: 'relative',
              opacity: item.isAvailable ? 1 : 0.7,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[8]
              }
            }}
          >
            {/* Availability Badge */}
            <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
              <Badge
                badgeContent={item.isAvailable ? '●' : '○'}
                color={item.isAvailable ? 'success' : 'error'}
                sx={{ '& .MuiBadge-badge': { fontSize: '16px', minWidth: '20px', height: '20px' } }}
              />
            </Box>

            <CardContent sx={{ pb: 1 }}>
              {/* Header */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 0.5, pr: 4 }}>
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {item.description}
                </Typography>
              </Box>

              {/* Price & Metrics Row */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
                p: 1,
                bgcolor: 'grey.50',
                borderRadius: 1
              }}>
                <Box>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(item.price)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cost: {formatCurrency(item.totalIngredientCost || 0)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" color={item.profitMargin && item.profitMargin > 30 ? 'success.main' : 'warning.main'}>
                    {(item.profitMargin || 0).toFixed(1)}% margin
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.prepTime}min prep
                  </Typography>
                </Box>
              </Box>

              {/* Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {item.allergens.slice(0, 3).map(allergen => (
                      <Chip key={allergen} label={allergen} size="small" color="warning" variant="outlined" />
                    ))}
                    {item.allergens.length > 3 && (
                      <Chip label={`+${item.allergens.length - 3}`} size="small" variant="outlined" />
                    )}
                  </Box>
                </Box>
              )}

              {/* Quick Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={item.isAvailable} 
                      onChange={() => handleQuickToggleAvailability(item)}
                      size="small"
                    />
                  }
                  label={<Typography variant="caption">{item.isAvailable ? 'Available' : 'Hidden'}</Typography>}
                />
                
                <Box>
                  <IconButton size="small" onClick={(e) => handleQuickEdit(item, e)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small">
                    <DuplicateIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )

  const renderListView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="center">Status</TableCell>
            <TableCell align="right">Margin</TableCell>
            <TableCell align="center">Prep Time</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredItems.map(item => (
            <TableRow key={item.id} sx={{ opacity: item.isAvailable ? 1 : 0.6 }}>
              <TableCell>
                <Box>
                  <Typography variant="subtitle2">{item.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.description}
                  </Typography>
                  {item.allergens && item.allergens.length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                      {item.allergens.slice(0, 2).map(allergen => (
                        <Chip key={allergen} label={allergen} size="small" sx={{ mr: 0.5, fontSize: '0.6rem' }} />
                      ))}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle1" fontWeight="bold">
                  {formatCurrency(item.price)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cost: {formatCurrency(item.totalIngredientCost || 0)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Switch 
                  checked={item.isAvailable} 
                  onChange={() => handleQuickToggleAvailability(item)}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="subtitle2" 
                  color={item.profitMargin && item.profitMargin > 30 ? 'success.main' : 'warning.main'}
                >
                  {(item.profitMargin || 0).toFixed(1)}%
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip label={`${item.prepTime}min`} size="small" variant="outlined" />
              </TableCell>
              <TableCell align="center">
                <IconButton size="small" onClick={(e) => handleQuickEdit(item, e)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <DuplicateIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Modern Header */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1 }}>
            Menu Management
          </Typography>
          
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />

          {/* View Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="grid">
              <GridViewIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="list">
              <ListViewIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          <Button variant="outlined" startIcon={<SettingsIcon />}>
            Categories
          </Button>
        </Toolbar>
      </AppBar>

      {/* Filter Bar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        p: 2, 
        bgcolor: 'grey.50',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        {/* Category Tabs */}
        <Tabs
          value={activeCategory}
          onChange={(_, newValue) => setActiveCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flexGrow: 1 }}
        >
          {categories.map(category => (
            <Tab
              key={category}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    {category === 'all' ? 'All Items' : category}
                  </Typography>
                  <Chip 
                    label={getCategoryCount(category)} 
                    size="small" 
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              }
              value={category}
            />
          ))}
        </Tabs>

        {/* Status Filter */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            label="Filter"
          >
            <MuiMenuItem value="all">All Items</MuiMenuItem>
            <MuiMenuItem value="available">Available</MuiMenuItem>
            <MuiMenuItem value="unavailable">Hidden</MuiMenuItem>
            <MuiMenuItem value="profitable">High Margin</MuiMenuItem>
            <MuiMenuItem value="low-margin">Low Margin</MuiMenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Content Area */}
      <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        {filteredItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <RestaurantMenu sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No menu items found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery ? `No items match "${searchQuery}"` : 'Start by adding your first menu item'}
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
              Add Menu Item
            </Button>
          </Box>
        ) : (
          <>
            {/* Results Summary */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredItems.length} of {menuItems.length} items
                {searchQuery && ` for "${searchQuery}"`}
              </Typography>
            </Box>

            {/* Content */}
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </>
        )}
      </Box>

      {/* Floating Add Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}