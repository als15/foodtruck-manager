import React, { useState, useEffect } from 'react'
import { Box, Typography, Card, CardContent, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert, Chip, IconButton, Divider, Switch, FormControlLabel, Autocomplete, LinearProgress, Stack, useTheme } from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, TrendingUp as ProfitIcon, TrendingDown as LossIcon, Analytics as AnalyticsIcon, Calculate as CalculateIcon, Refresh as ResetIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, Receipt as ExpenseIcon, Upload as ImportIcon } from '@mui/icons-material'
import { MenuItem, Expense, Ingredient } from '../types'
import { menuItemsService, expensesService, ingredientsService } from '../services/supabaseService'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../utils/currency'
import AISalesImporter from '../components/Common/AISalesImporter'

interface SalesScenarioItem {
  menuItemId: string
  menuItem: MenuItem
  dailyQuantity: number
}

interface BreakEvenSettings {
  dailyLaborCost: number
  monthlyLaborCost: number
  workingDaysPerWeek: number
  weeksPerMonth: number
  useMonthlyView: boolean
}

export default function BreakEvenAnalysis() {
  const { t } = useTranslation()
  const theme = useTheme()
  const docDir = typeof document !== 'undefined' ? document.documentElement.dir : 'ltr'
  const isRtl = docDir === 'rtl' || theme.direction === 'rtl'
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [salesScenario, setSalesScenario] = useState<SalesScenarioItem[]>([])
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false)
  const [showMonthlyExpenseBreakdown, setShowMonthlyExpenseBreakdown] = useState(false)
  const [showImporter, setShowImporter] = useState(false)
  const [importedSalesInfo, setImportedSalesInfo] = useState<{
    businessName: string
    dateRange: string
    totalRevenue: number
    totalQuantity: number
  } | null>(null)
  const [settings, setSettings] = useState<BreakEvenSettings>({
    dailyLaborCost: 200,
    monthlyLaborCost: 6000,
    workingDaysPerWeek: 3, // Thursday, Friday, Saturday (same as Financial Management)
    weeksPerMonth: 4.33, // Average weeks per month (same as Financial Management)
    useMonthlyView: false
  })

  // Calculate working days per month (same as Financial Management)
  const workingDaysPerMonth = settings.workingDaysPerWeek * settings.weeksPerMonth

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [menuData, expenseData, ingredientData] = await Promise.all([menuItemsService.getAll(), expensesService.getAll(), ingredientsService.getAll()])
      setMenuItems(menuData.filter(item => item.isAvailable))
      setExpenses(expenseData.filter(expense => expense.isActive))
      setIngredients(ingredientData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItemToScenario = () => {
    if (!selectedMenuItem) return

    const existingIndex = salesScenario.findIndex(item => item.menuItemId === selectedMenuItem.id)
    if (existingIndex >= 0) {
      // Update existing item
      const updated = [...salesScenario]
      updated[existingIndex].dailyQuantity += 1
      setSalesScenario(updated)
    } else {
      // Add new item
      setSalesScenario(prev => [
        ...prev,
        {
          menuItemId: selectedMenuItem.id,
          menuItem: selectedMenuItem,
          dailyQuantity: 1
        }
      ])
    }
    setSelectedMenuItem(null)
  }

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromScenario(index)
      return
    }
    const updated = [...salesScenario]
    updated[index].dailyQuantity = quantity
    setSalesScenario(updated)
  }

  const removeItemFromScenario = (index: number) => {
    setSalesScenario(prev => prev.filter((_, i) => i !== index))
  }

  const resetScenario = () => {
    setSalesScenario([])
    setImportedSalesInfo(null)
  }

  const handleSalesDataImported = (salesData: any[], summary: any) => {
    // Convert imported sales data to scenario items
    const newScenarioItems: SalesScenarioItem[] = []

    salesData.forEach(item => {
      if (item.menuItem) {
        // Check if this menu item already exists in scenario
        const existingIndex = newScenarioItems.findIndex(s => s.menuItemId === item.menuItem.id)

        if (existingIndex >= 0) {
          // Add to existing quantity
          newScenarioItems[existingIndex].dailyQuantity += item.quantity
        } else {
          // Add new item
          newScenarioItems.push({
            menuItemId: item.menuItem.id,
            menuItem: item.menuItem,
            dailyQuantity: item.quantity
          })
        }
      }
    })

    // Set the scenario and import info
    setSalesScenario(newScenarioItems)
    setImportedSalesInfo(summary)
    setShowImporter(false)
  }

  const calculateItemCost = (menuItem: MenuItem): number => {
    if (!menuItem.ingredients || menuItem.ingredients.length === 0) return 0
    return menuItem.ingredients.reduce((total, menuIngredient) => {
      const ingredient = ingredients.find(ing => ing.id === menuIngredient.ingredientId)
      if (ingredient) {
        return total + menuIngredient.quantity * ingredient.costPerUnit
      }
      return total
    }, 0)
  }

  const getExpenseBreakdown = () => {
    return expenses
      .map(expense => {
        let dailyAmount = 0
        switch (expense.frequency) {
          case 'daily':
            dailyAmount = expense.amount
            break
          case 'weekly':
            // Weekly expenses divided by 7, but only for working days
            dailyAmount = expense.amount / 7
            break
          case 'monthly':
            // Monthly expenses divided by actual working days per month
            dailyAmount = expense.amount / workingDaysPerMonth
            break
          case 'yearly':
            // Yearly expenses divided by total working days per year
            dailyAmount = expense.amount / (workingDaysPerMonth * 12)
            break
          case 'one_time':
            dailyAmount = 0 // Don't include one-time expenses in daily calculations
            break
          default:
            dailyAmount = 0
        }
        return {
          ...expense,
          dailyAmount
        }
      })
      .filter(expense => expense.dailyAmount > 0)
  }

  const calculateDailyFinancials = () => {
    // Calculate daily revenue and costs
    const dailyRevenue = salesScenario.reduce((total, item) => {
      return total + item.menuItem.price * item.dailyQuantity
    }, 0)

    const dailyFoodCost = salesScenario.reduce((total, item) => {
      const itemCost = calculateItemCost(item.menuItem)
      return total + itemCost * item.dailyQuantity
    }, 0)

    const dailyLaborCost = settings.useMonthlyView ? settings.monthlyLaborCost / workingDaysPerMonth : settings.dailyLaborCost

    // Calculate daily operating expenses based on working days
    const dailyOperatingExpenses = getExpenseBreakdown().reduce((sum, expense) => sum + expense.dailyAmount, 0)

    const dailyTotalCost = dailyFoodCost + dailyLaborCost + dailyOperatingExpenses
    const dailyProfit = dailyRevenue - dailyTotalCost

    return {
      revenue: dailyRevenue,
      foodCost: dailyFoodCost,
      laborCost: dailyLaborCost,
      operatingExpenses: dailyOperatingExpenses,
      totalCost: dailyTotalCost,
      profit: dailyProfit,
      profitMargin: dailyRevenue > 0 ? (dailyProfit / dailyRevenue) * 100 : 0
    }
  }

  const calculateMonthlyFinancials = () => {
    const daily = calculateDailyFinancials()

    return {
      revenue: daily.revenue * workingDaysPerMonth,
      foodCost: daily.foodCost * workingDaysPerMonth,
      laborCost: settings.useMonthlyView ? settings.monthlyLaborCost : daily.laborCost * workingDaysPerMonth,
      operatingExpenses: daily.operatingExpenses * workingDaysPerMonth,
      totalCost: daily.totalCost * workingDaysPerMonth,
      profit: daily.profit * workingDaysPerMonth,
      profitMargin: daily.profitMargin
    }
  }

  const calculateBreakEvenPoint = () => {
    const monthly = calculateMonthlyFinancials()

    if (monthly.revenue <= 0) return { daily: 0, monthly: 0, percentage: 0 }

    const revenueNeeded = monthly.totalCost
    const currentMultiplier = revenueNeeded / monthly.revenue

    return {
      daily: Math.ceil(currentMultiplier),
      monthly: Math.ceil(currentMultiplier),
      percentage: monthly.revenue > 0 ? (monthly.revenue / revenueNeeded) * 100 : 0
    }
  }

  const dailyFinancials = calculateDailyFinancials()
  const monthlyFinancials = calculateMonthlyFinancials()
  const breakEven = calculateBreakEvenPoint()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography>Loading...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <AnalyticsIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('break_even_analysis')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <Button variant="contained" startIcon={<ImportIcon />} onClick={() => setShowImporter(true)}>
            {t('import_sales_data')}
          </Button>
          <Button variant="outlined" startIcon={<ResetIcon />} onClick={resetScenario} disabled={salesScenario.length === 0}>
            {t('reset_scenario')}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Settings Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalculateIcon />
                {t('bea_settings')}
              </Typography>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.useMonthlyView}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          useMonthlyView: e.target.checked
                        }))
                      }
                    />
                  }
                  label={t('monthly_view')}
                />

                {settings.useMonthlyView ? (
                  <>
                    <TextField
                      fullWidth
                      label={t('monthly_labor_cost_label')}
                      type="number"
                      value={settings.monthlyLaborCost}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          monthlyLaborCost: parseFloat(e.target.value) || 0
                        }))
                      }
                      InputProps={isRtl ? { endAdornment: '$' } : { startAdornment: '$' }}
                    />
                    <TextField
                      fullWidth
                      label={t('working_days_per_week_label')}
                      type="number"
                      value={settings.workingDaysPerWeek}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          workingDaysPerWeek: parseInt(e.target.value) || 3
                        }))
                      }
                      inputProps={{ min: 1, max: 7 }}
                    />
                    <TextField
                      fullWidth
                      label={t('weeks_per_month_label')}
                      type="number"
                      value={settings.weeksPerMonth}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          weeksPerMonth: parseFloat(e.target.value) || 4.33
                        }))
                      }
                      inputProps={{ min: 4, max: 5, step: 0.1 }}
                    />
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="caption">{t('working_days_per_month_info', { days: Math.round(workingDaysPerMonth) })}</Typography>
                    </Alert>
                  </>
                ) : (
                  <TextField
                    fullWidth
                    label={t('daily_labor_cost_label')}
                    type="number"
                    value={settings.dailyLaborCost}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        dailyLaborCost: parseFloat(e.target.value) || 0
                      }))
                    }
                    InputProps={isRtl ? { endAdornment: '$' } : { startAdornment: '$' }}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Add Items to Scenario */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('add_items_to_scenario')}
              </Typography>

              <Stack spacing={2}>
                <Autocomplete
                  options={menuItems}
                  getOptionLabel={option => option.name}
                  value={selectedMenuItem}
                  onChange={(_, newValue) => setSelectedMenuItem(newValue)}
                  renderInput={params => <TextField {...params} label={t('select_menu_item_label')} inputProps={{ ...params.inputProps, dir: isRtl ? 'rtl' : 'ltr' }} />}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(option.price)} • {option.category}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />

                <Button variant="contained" startIcon={<AddIcon />} onClick={addItemToScenario} disabled={!selectedMenuItem} fullWidth>
                  {t('add_to_scenario')}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Sales Scenario */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('daily_sales_scenario')}
              </Typography>

              {/* Show imported sales info */}
              {importedSalesInfo && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    📊 Imported Sales Data: {importedSalesInfo.businessName}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Period: {importedSalesInfo.dateRange} | Total Revenue: ₪{importedSalesInfo.totalRevenue.toFixed(2)} | Total Items: {importedSalesInfo.totalQuantity}
                  </Typography>
                </Alert>
              )}

              {salesScenario.length === 0 ? (
                <Alert severity="info">{t('sales_scenario_hint')}</Alert>
              ) : (
                <TableContainer dir={isRtl ? 'rtl' : 'ltr'}>
                  <Table size="small" dir={isRtl ? 'rtl' : 'ltr'}>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('item_col')}</TableCell>
                        <TableCell align="center">{t('daily_qty_col')}</TableCell>
                        <TableCell align={isRtl ? 'left' : 'right'}>{t('unit_price_col')}</TableCell>
                        <TableCell align={isRtl ? 'left' : 'right'}>{t('unit_cost_col')}</TableCell>
                        <TableCell align={isRtl ? 'left' : 'right'}>{t('unit_profit_col')}</TableCell>
                        <TableCell align={isRtl ? 'left' : 'right'}>{t('daily_revenue_col')}</TableCell>
                        <TableCell align={isRtl ? 'left' : 'right'}>{t('daily_profit_col')}</TableCell>
                        <TableCell align="center">{t('actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesScenario.map((item, index) => {
                        const unitCost = calculateItemCost(item.menuItem)
                        const unitProfit = item.menuItem.price - unitCost
                        const dailyRevenue = item.menuItem.price * item.dailyQuantity
                        const dailyProfit = unitProfit * item.dailyQuantity

                        return (
                          <TableRow key={item.menuItemId}>
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
                              <TextField type="number" size="small" value={item.dailyQuantity} onChange={e => updateItemQuantity(index, parseInt(e.target.value) || 0)} inputProps={{ min: 0, style: { textAlign: 'center' } }} sx={{ width: 80 }} />
                            </TableCell>
                            <TableCell align={isRtl ? 'left' : 'right'}>
                              <Typography variant="body2">{formatCurrency(item.menuItem.price)}</Typography>
                            </TableCell>
                            <TableCell align={isRtl ? 'left' : 'right'}>
                              <Typography variant="body2" color="error.main">
                                {formatCurrency(unitCost)}
                              </Typography>
                            </TableCell>
                            <TableCell align={isRtl ? 'left' : 'right'}>
                              <Typography variant="body2" color={unitProfit >= 0 ? 'success.main' : 'error.main'} sx={{ fontWeight: 600 }}>
                                {formatCurrency(unitProfit)}
                              </Typography>
                            </TableCell>
                            <TableCell align={isRtl ? 'left' : 'right'}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {formatCurrency(dailyRevenue)}
                              </Typography>
                            </TableCell>
                            <TableCell align={isRtl ? 'left' : 'right'}>
                              <Typography variant="body2" color={dailyProfit >= 0 ? 'success.main' : 'error.main'} sx={{ fontWeight: 600 }}>
                                {formatCurrency(dailyProfit)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="error" onClick={() => removeItemFromScenario(index)}>
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      })}

                      {/* Totals Row */}
                      {salesScenario.length > 0 && (
                        <TableRow
                          sx={theme => ({
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.08)' : 'grey.50',
                            '& td': { fontWeight: 600 },
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.25)' : 'divider'
                          })}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {t('totals')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {salesScenario.reduce((sum, item) => sum + item.dailyQuantity, 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align={isRtl ? 'left' : 'right'}>
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          </TableCell>
                          <TableCell align={isRtl ? 'left' : 'right'}>
                            <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                              {formatCurrency(
                                salesScenario.reduce((sum, item) => {
                                  const unitCost = calculateItemCost(item.menuItem)
                                  return sum + unitCost * item.dailyQuantity
                                }, 0)
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell align={isRtl ? 'left' : 'right'}>
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          </TableCell>
                          <TableCell align={isRtl ? 'left' : 'right'}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {formatCurrency(
                                salesScenario.reduce((sum, item) => {
                                  return sum + item.menuItem.price * item.dailyQuantity
                                }, 0)
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell align={isRtl ? 'left' : 'right'}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                              color={
                                salesScenario.reduce((sum, item) => {
                                  const unitCost = calculateItemCost(item.menuItem)
                                  const unitProfit = item.menuItem.price - unitCost
                                  return sum + unitProfit * item.dailyQuantity
                                }, 0) >= 0
                                  ? 'success.main'
                                  : 'error.main'
                              }
                            >
                              {formatCurrency(
                                salesScenario.reduce((sum, item) => {
                                  const unitCost = calculateItemCost(item.menuItem)
                                  const unitProfit = item.menuItem.price - unitCost
                                  return sum + unitProfit * item.dailyQuantity
                                }, 0)
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Analysis */}
        {salesScenario.length > 0 && (
          <>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ProfitIcon />
                    {t('daily_analysis')}
                  </Typography>

                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">{t('revenue_label')}</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{formatCurrency(dailyFinancials.revenue)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">{t('food_cost_label')}</Typography>
                      <Typography color="error.main">{formatCurrency(dailyFinancials.foodCost)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">{t('labor_cost_label')}</Typography>
                      <Typography color="error.main">{formatCurrency(dailyFinancials.laborCost)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography color="text.secondary">{t('operating_expenses_label')}</Typography>
                        <IconButton size="small" onClick={() => setShowExpenseBreakdown(!showExpenseBreakdown)}>
                          {showExpenseBreakdown ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                      <Typography color="error.main">{formatCurrency(dailyFinancials.operatingExpenses)}</Typography>
                    </Box>

                    {/* Expense Breakdown */}
                    {showExpenseBreakdown && (
                      <Box
                        sx={theme => ({
                          ...(isRtl ? { mr: 2 } : { ml: 2 }),
                          mt: 1,
                          p: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.06)' : 'grey.25',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.2)' : 'grey.200'
                        })}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                          {t('daily_expense_breakdown_title', { days: Math.round(workingDaysPerMonth) })}
                        </Typography>
                        {getExpenseBreakdown().map((expense, index) => {
                          let calculationNote = ''
                          switch (expense.frequency) {
                            case 'daily':
                              calculationNote = `${formatCurrency(expense.amount)}/day`
                              break
                            case 'weekly':
                              calculationNote = `${formatCurrency(expense.amount)}/week ÷ 7`
                              break
                            case 'monthly':
                              calculationNote = `${formatCurrency(expense.amount)}/month ÷ ${Math.round(workingDaysPerMonth)}`
                              break
                            case 'yearly':
                              calculationNote = `${formatCurrency(expense.amount)}/year ÷ ${Math.round(workingDaysPerMonth * 12)}`
                              break
                          }

                          return (
                            <Box key={expense.id || index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ExpenseIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {expense.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                    {calculationNote}
                                  </Typography>
                                </Box>
                                <Chip label={t(expense.frequency)} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }} />
                              </Box>
                              <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                                {formatCurrency(expense.dailyAmount)}
                              </Typography>
                            </Box>
                          )
                        })}
                        {getExpenseBreakdown().length === 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No active operating expenses found
                          </Typography>
                        )}
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {t('total_daily_operating_expenses')}
                          </Typography>
                          <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
                            {formatCurrency(getExpenseBreakdown().reduce((sum, exp) => sum + exp.dailyAmount, 0))}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 600 }}>{t('total_cost_label')}</Typography>
                      <Typography sx={{ fontWeight: 600 }} color="error.main">
                        {formatCurrency(dailyFinancials.totalCost)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 600 }}>{t('daily_profit_label')}</Typography>
                      <Typography sx={{ fontWeight: 600 }} color={dailyFinancials.profit >= 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(dailyFinancials.profit)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 600 }}>{t('profit_margin_label')}</Typography>
                      <Chip label={`${dailyFinancials.profitMargin.toFixed(1)}%`} color={dailyFinancials.profitMargin >= 0 ? 'success' : 'error'} size="small" />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AnalyticsIcon />
                    {t('monthly_projection')}
                  </Typography>

                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">{t('monthly_revenue_label')}</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{formatCurrency(monthlyFinancials.revenue)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography color="text.secondary">{t('monthly_costs_label')}</Typography>
                        <IconButton size="small" onClick={() => setShowMonthlyExpenseBreakdown(!showMonthlyExpenseBreakdown)}>
                          {showMonthlyExpenseBreakdown ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                      <Typography color="error.main">{formatCurrency(monthlyFinancials.totalCost)}</Typography>
                    </Box>

                    {/* Monthly Expense Breakdown */}
                    {showMonthlyExpenseBreakdown && (
                      <Box
                        sx={theme => ({
                          ...(isRtl ? { mr: 2 } : { ml: 2 }),
                          mt: 1,
                          p: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.06)' : 'grey.25',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.2)' : 'grey.200'
                        })}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                          {t('monthly_cost_breakdown')}
                        </Typography>

                        {/* Food Costs */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ExpenseIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {t('food_costs_label')}
                            </Typography>
                            <Chip label={t('variable_label')} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }} />
                          </Box>
                          <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                            {formatCurrency(monthlyFinancials.foodCost)}
                          </Typography>
                        </Box>

                        {/* Labor Costs */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ExpenseIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {t('labor_costs_label')}
                            </Typography>
                            <Chip label={t('fixed_label')} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }} />
                          </Box>
                          <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                            {formatCurrency(monthlyFinancials.laborCost)}
                          </Typography>
                        </Box>

                        {/* Operating Expenses */}
                        {getExpenseBreakdown().map((expense, index) => (
                          <Box key={expense.id || index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ExpenseIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {expense.name}
                              </Typography>
                              <Chip label={expense.frequency} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }} />
                            </Box>
                            <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                              {formatCurrency(expense.dailyAmount * workingDaysPerMonth)}
                            </Typography>
                          </Box>
                        ))}

                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {t('total_monthly_costs_label')}
                          </Typography>
                          <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
                            {formatCurrency(monthlyFinancials.totalCost)}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 600 }}>{t('monthly_profit_label')}</Typography>
                      <Typography sx={{ fontWeight: 600 }} color={monthlyFinancials.profit >= 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(monthlyFinancials.profit)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Break-Even Analysis */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalculateIcon />
                    {t('break_even_analysis')}
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2">{t('progress_to_breakeven')}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {breakEven.percentage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={Math.min(breakEven.percentage, 100)} sx={{ height: 8, borderRadius: 4 }} color={breakEven.percentage >= 100 ? 'success' : 'primary'} />
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box
                        sx={theme => ({
                          textAlign: 'center',
                          p: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.08)' : 'grey.50',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.25)' : 'divider'
                        })}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {t('current_status')}
                        </Typography>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          {breakEven.percentage >= 100 ? (
                            <>
                              <ProfitIcon color="success" />
                              {t('profitable')}
                            </>
                          ) : (
                            <>
                              <LossIcon color="error" />
                              {t('below_breakeven')}
                            </>
                          )}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box
                        sx={theme => ({
                          textAlign: 'center',
                          p: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.08)' : 'grey.50',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.25)' : 'divider'
                        })}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {t('revenue_needed')}
                        </Typography>
                        <Typography variant="h6">{formatCurrency(monthlyFinancials.totalCost)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('per_month_short')}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box
                        sx={theme => ({
                          textAlign: 'center',
                          p: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.08)' : 'grey.50',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.25)' : 'divider'
                        })}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {t('daily_revenue_gap')}
                        </Typography>
                        <Typography variant="h6" color={dailyFinancials.profit >= 0 ? 'success.main' : 'error.main'}>
                          {formatCurrency(Math.abs((monthlyFinancials.totalCost - monthlyFinancials.revenue) / workingDaysPerMonth))}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dailyFinancials.profit >= 0 ? t('surplus') : t('shortage')}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box
                        sx={theme => ({
                          textAlign: 'center',
                          p: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.08)' : 'grey.50',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.25)' : 'divider'
                        })}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {t('scale_factor_needed')}
                        </Typography>
                        <Typography variant="h6">{breakEven.percentage < 100 ? `${(100 / breakEven.percentage).toFixed(1)}x` : '1.0x'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('current_volume')}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {breakEven.percentage < 100 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2">{t('to_reach_breakeven_msg', { scale: (100 / breakEven.percentage).toFixed(1), amount: formatCurrency(monthlyFinancials.totalCost - monthlyFinancials.revenue) })}</Typography>
                    </Alert>
                  )}

                  {breakEven.percentage >= 100 && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <Typography variant="body2">{t('congratulations_profitable_msg', { amount: formatCurrency(monthlyFinancials.profit) })}</Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* AI Sales Importer Dialog */}
      <AISalesImporter open={showImporter} onClose={() => setShowImporter(false)} onSalesDataImported={handleSalesDataImported} title={t('import_sales_data_title')} description={t('import_sales_data_description')} />
    </Box>
  )
}
