import React from 'react'
import { 
  Box, Button, Card, CardContent, Grid, TextField, Typography, Alert, Chip, Divider, 
  List, ListItem, ListItemText, Stack, FormControl, InputLabel, Select, MenuItem as MuiMenuItem,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Tabs, Tab, Autocomplete
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Kitchen as KitchenIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { ingredientsService, menuItemsService } from '../services/supabaseService'
import type { Ingredient, MenuItem } from '../types'

type AggregatedIngredient = {
  ingredientId: string
  ingredientName: string
  unit: string
  totalQuantity: number
}

type ParsedEntry = { name: string; quantity: number }

type SelectedMenuItem = {
  menuItem: MenuItem
  quantity: number
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function parseFreeTextList(input: string): ParsedEntry[] {
  // Split by commas or newlines; allow entries like "2 bagels" or "bagel x 2"
  const parts = input
    .split(/\n|,/)
    .map(p => p.trim())
    .filter(Boolean)
  const entries: ParsedEntry[] = []
  for (const part of parts) {
    // Try patterns: "2 bagels" or "bagels x 2"
    const m1 = part.match(/^(\d+(?:\.\d+)?)\s+(.+)$/i)
    const m2 = part.match(/^(.+?)\s*[x\*]\s*(\d+(?:\.\d+)?)$/i)
    if (m1) {
      entries.push({ quantity: parseFloat(m1[1]), name: m1[2].toLowerCase().trim() })
      continue
    }
    if (m2) {
      entries.push({ quantity: parseFloat(m2[2]), name: m2[1].toLowerCase().trim() })
      continue
    }
    // Default quantity 1
    entries.push({ quantity: 1, name: part.toLowerCase() })
  }
  return entries
}

export default function PrepPlanner() {
  const { t } = useTranslation()
  const [tabValue, setTabValue] = React.useState(0)
  const [inputText, setInputText] = React.useState('')
  const [selectedMenuItems, setSelectedMenuItems] = React.useState<SelectedMenuItem[]>([])
  const [selectedMenuItem, setSelectedMenuItem] = React.useState<MenuItem | null>(null)
  const [quantity, setQuantity] = React.useState<number>(1)
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([])
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<AggregatedIngredient[]>([])

  React.useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const [mis, ings] = await Promise.all([menuItemsService.getAll(), ingredientsService.getAll()])
        if (!active) return
        setMenuItems(mis)
        setIngredients(ings)
      } catch (e: any) {
        if (!active) return
        setError(e?.message || 'Failed to load data')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const handleAddMenuItem = () => {
    if (!selectedMenuItem) return
    
    // Check if item already exists
    const existingIndex = selectedMenuItems.findIndex(item => item.menuItem.id === selectedMenuItem.id)
    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...selectedMenuItems]
      updated[existingIndex].quantity += quantity
      setSelectedMenuItems(updated)
    } else {
      // Add new item
      setSelectedMenuItems(prev => [...prev, { menuItem: selectedMenuItem, quantity }])
    }
    
    setSelectedMenuItem(null)
    setQuantity(1)
  }

  const handleRemoveMenuItem = (index: number) => {
    setSelectedMenuItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveMenuItem(index)
      return
    }
    const updated = [...selectedMenuItems]
    updated[index].quantity = newQuantity
    setSelectedMenuItems(updated)
  }

  const computeFromMenuItems = () => {
    setError(null)
    if (selectedMenuItems.length === 0) {
      setResults([])
      return
    }

    const ingredientTotals = new Map<string, { ingredientId: string; ingredientName: string; unit: string; totalQuantity: number }>()

    for (const item of selectedMenuItems) {
      const mi = item.menuItem
      for (const comp of mi.ingredients) {
        const ing = ingredients.find(i => i.id === comp.ingredientId)
        const ingredientName = ing?.name || comp.ingredientId
        const unit = comp.unit || ing?.unit || ''
        const key = `${comp.ingredientId}__${unit}`
        const additionalQty = (comp.quantity || 0) * item.quantity
        const existing = ingredientTotals.get(key)
        if (existing) {
          existing.totalQuantity += additionalQty
        } else {
          ingredientTotals.set(key, {
            ingredientId: comp.ingredientId,
            ingredientName,
            unit,
            totalQuantity: additionalQty
          })
        }
      }
    }

    const list = Array.from(ingredientTotals.values()).sort((a, b) => a.ingredientName.localeCompare(b.ingredientName))
    setResults(list)
  }

  const handleCompute = () => {
    setError(null)
    const entries = parseFreeTextList(inputText)
    if (entries.length === 0) {
      setResults([])
      return
    }

    // Build quick lookup from menu item name to item data (case-insensitive)
    const nameToMenuItem = new Map<string, MenuItem>()
    for (const mi of menuItems) {
      nameToMenuItem.set(mi.name.toLowerCase(), mi)
    }

    const ingredientTotals = new Map<string, { ingredientId: string; ingredientName: string; unit: string; totalQuantity: number }>()

    const missingItems: string[] = []
    for (const entry of entries) {
      const mi = nameToMenuItem.get(entry.name)
      if (!mi) {
        missingItems.push(entry.name)
        continue
      }
      for (const comp of mi.ingredients) {
        const ing = ingredients.find(i => i.id === comp.ingredientId)
        const ingredientName = ing?.name || comp.ingredientId
        const unit = comp.unit || ing?.unit || ''
        const key = `${comp.ingredientId}__${unit}`
        const additionalQty = (comp.quantity || 0) * entry.quantity
        const existing = ingredientTotals.get(key)
        if (existing) {
          existing.totalQuantity += additionalQty
        } else {
          ingredientTotals.set(key, {
            ingredientId: comp.ingredientId,
            ingredientName,
            unit,
            totalQuantity: additionalQty
          })
        }
      }
    }

    const list = Array.from(ingredientTotals.values()).sort((a, b) => a.ingredientName.localeCompare(b.ingredientName))
    setResults(list)
    if (missingItems.length > 0) {
      setError(t('some_items_not_found', { items: missingItems.join(', ') }))
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <KitchenIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('prep_planner')}
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={t('menu_item_selection')} />
          <Tab label={t('free_text_input')} />
        </Tabs>

        {/* Menu Item Selection Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Menu Item Selection */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {t('add_menu_items')}
                  </Typography>
                  <Stack spacing={2}>
                    <Autocomplete
                      options={menuItems}
                      getOptionLabel={(option) => option.name}
                      value={selectedMenuItem}
                      onChange={(event, newValue) => setSelectedMenuItem(newValue)}
                      renderInput={(params) => (
                        <TextField {...params} label={t('select_menu_item')} />
                      )}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Box>
                            <Typography variant="body1">{option.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.category} • {option.ingredients.length} ingredients
                            </Typography>
                          </Box>
                        </li>
                      )}
                    />
                    
                    <TextField
                      type="number"
                      label={t('quantity')}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      inputProps={{ min: 1 }}
                    />
                    
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddMenuItem}
                      disabled={!selectedMenuItem}
                    >
                      {t('add_to_prep_list')}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Selected Items */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {t('prep_list')} ({selectedMenuItems.length} items)
                  </Typography>
                  {selectedMenuItems.length === 0 ? (
                    <Alert severity="info">{t('no_items_selected')}</Alert>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('menu_item')}</TableCell>
                            <TableCell align="center">{t('quantity')}</TableCell>
                            <TableCell align="center">{t('actions')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedMenuItems.map((item, index) => (
                            <TableRow key={item.menuItem.id}>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.menuItem.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.menuItem.category}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 0)}
                                  inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                  sx={{ width: 80 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveMenuItem(index)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  
                  {selectedMenuItems.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={computeFromMenuItems}
                        disabled={loading}
                        fullWidth
                      >
                        {t('compute_ingredients')}
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Free Text Input Tab */}
        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="body1">{t('prep_planner_instructions')}</Typography>
                <TextField 
                  label={t('enter_items_for_tomorrow')} 
                  placeholder={t('prep_planner_placeholder')} 
                  multiline 
                  minRows={3} 
                  value={inputText} 
                  onChange={e => setInputText(e.target.value)} 
                  fullWidth 
                />
                <Box>
                  <Button variant="contained" onClick={handleCompute} disabled={loading || menuItems.length === 0}>
                    {t('compute_ingredients')}
                  </Button>
                </Box>
                {error && <Alert severity="warning">{error}</Alert>}
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
          {t('aggregated_ingredients')}
        </Typography>
        {results.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('no_ingredients_to_show')}
          </Typography>
        ) : (
          <Card>
            <CardContent>
              <List>
                {results.map(r => (
                  <ListItem key={`${r.ingredientId}-${r.unit}`} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {r.ingredientName}
                          </Typography>
                          <Chip label={r.unit || t('unit')} size="small" />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {t('total_quantity')}: {r.totalQuantity} {r.unit}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}
