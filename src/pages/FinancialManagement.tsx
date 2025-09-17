import React, { useState, useEffect } from 'react'
import { Box, Typography, Grid, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, FormControl, InputLabel, Select, MenuItem as MuiMenuItem, Switch, FormControlLabel, Tabs, Tab, Alert, CircularProgress, Snackbar, Divider, LinearProgress } from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ContentCopy as DuplicateIcon, TrendingUp as ProfitIcon, TrendingDown as LossIcon, AttachMoney as RevenueIcon, Receipt as ExpenseIcon, Assessment as AnalyticsIcon, Flag as GoalIcon, PieChart as ChartIcon, AccountBalance as CashFlowIcon } from '@mui/icons-material'
import { Expense, ExpenseCategory, FinancialGoal, FinancialProjection, CashFlow, MenuItem } from '../types'
import { expensesService, expenseCategoriesService, financialGoalsService, financialProjectionsService, menuItemsService, employeesService, shiftsService, subscriptions } from '../services/supabaseService'
import LaborCostManager from '../components/LaborCostManager'
import { Employee, Shift } from '../types'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} id={`financial-tabpanel-${index}`} aria-labelledby={`financial-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function FinancialManagement() {
  const theme = useTheme()
  const { t } = useTranslation()
  const docDir = typeof document !== 'undefined' ? document.documentElement.dir : 'ltr'
  const isRtl = docDir === 'rtl' || theme.direction === 'rtl'
  const [currentTab, setCurrentTab] = useState(0)
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false)
  const [openGoalDialog, setOpenGoalDialog] = useState(false)
  const [openProjectionDialog, setOpenProjectionDialog] = useState(false)
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  // Data state
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [projections, setProjections] = useState<FinancialProjection[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [monthlyLaborCost, setMonthlyLaborCost] = useState(0)

  // Calculate real revenue and order data
  const calculateWeeklyMetrics = () => {
    // For now, we'll calculate based on break-even analysis and menu data
    // This can be replaced with actual sales data when available
    const avgOrderValue = calculateAverageOrderValue()
    const breakEvenOrders = calculateBreakEvenPoint()
    const dailyBreakdown = calculateDailyBreakEven()

    // Estimate weekly revenue based on operating days (Thu-Fri-Sat)
    const estimatedWeeklyOrders = dailyBreakdown.thursday + dailyBreakdown.friday + dailyBreakdown.saturday
    const estimatedWeeklyRevenue = estimatedWeeklyOrders * avgOrderValue

    return {
      weeklyRevenue: estimatedWeeklyRevenue,
      weeklyOrders: estimatedWeeklyOrders,
      avgOrderValue
    }
  }

  // Financial calculation settings
  const [financialSettings, setFinancialSettings] = useState({
    customAverageOrderValue: 0, // 0 means use calculated value
    customProfitMargin: 0, // 0 means use calculated value
    workingDaysPerWeek: 3, // Thursday, Friday, Saturday
    weeksPerMonth: 4.33, // Average weeks per month
    dayPerformanceMultipliers: {
      thursday: 0.7, // 30% slower than average
      friday: 1.2, // 20% better than average
      saturday: 1.3 // 30% better than average
    },
    seasonalMultipliers: {
      spring: 1.0,
      summer: 1.2,
      fall: 1.0,
      winter: 0.8
    }
  })

  // Load data on component mount
  useEffect(() => {
    loadAllData()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const expensesSubscription = subscriptions.expenses(() => {
      loadExpenses()
    })

    const goalsSubscription = subscriptions.financialGoals(() => {
      loadGoals()
    })

    const employeesSubscription = subscriptions.employees(() => {
      loadEmployees()
    })

    const shiftsSubscription = subscriptions.shifts(() => {
      loadShifts()
    })

    return () => {
      expensesSubscription.unsubscribe()
      goalsSubscription.unsubscribe()
      employeesSubscription.unsubscribe()
      shiftsSubscription.unsubscribe()
    }
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadExpenses(), loadExpenseCategories(), loadGoals(), loadProjections(), loadMenuItems(), loadEmployees(), loadShifts()])
    } catch (error) {
      setSnackbar({ open: true, message: t('failed_to_load_financial_data'), severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadExpenses = async () => {
    try {
      const data = await expensesService.getAll()
      setExpenses(data)
    } catch (error) {
      console.error('Failed to load expenses:', error)
    }
  }

  const loadExpenseCategories = async () => {
    try {
      const data = await expenseCategoriesService.getAll()
      setExpenseCategories(data)
    } catch (error) {
      console.error('Failed to load expense categories:', error)
    }
  }

  const loadGoals = async () => {
    try {
      const data = await financialGoalsService.getAll()
      setGoals(data)
    } catch (error) {
      console.error('Failed to load goals:', error)
    }
  }

  const loadProjections = async () => {
    try {
      const data = await financialProjectionsService.getAll()
      setProjections(data)
    } catch (error) {
      console.error('Failed to load projections:', error)
    }
  }

  const loadMenuItems = async () => {
    try {
      const data = await menuItemsService.getAll()
      setMenuItems(data)
    } catch (error) {
      console.error('Failed to load menu items:', error)
    }
  }

  const loadEmployees = async () => {
    try {
      const data = await employeesService.getAll()
      setEmployees(data)
    } catch (error) {
      console.error('Failed to load employees:', error)
    }
  }

  const loadShifts = async () => {
    try {
      const data = await shiftsService.getAll()
      setShifts(data)
    } catch (error) {
      console.error('Failed to load shifts:', error)
    }
  }

  // Form states
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    name: '',
    amount: 0,
    type: 'fixed',
    frequency: 'monthly',
    description: '',
    categoryId: '',
    isActive: true
  })

  const [newGoal, setNewGoal] = useState<Partial<FinancialGoal>>({
    name: '',
    type: 'monthly_revenue',
    targetAmount: 0,
    currentAmount: 0,
    isActive: true
  })

  const [newProjection, setNewProjection] = useState<Partial<FinancialProjection>>({
    name: '',
    projectionPeriod: 'monthly',
    projectedRevenue: 0,
    projectedExpenses: 0,
    averageOrderValue: 0,
    ordersPerDay: 0,
    workingDaysPerMonth: 22
  })

  // Enhanced financial calculation functions
  const calculateMonthlyExpenses = () => {
    const expenseTotal = expenses.reduce((total, expense) => {
      if (!expense.isActive) return total

      switch (expense.frequency) {
        case 'daily':
          return total + expense.amount * 30
        case 'weekly':
          return total + expense.amount * 4.33
        case 'monthly':
          return total + expense.amount
        case 'yearly':
          return total + expense.amount / 12
        case 'one_time':
          return total // Don't include one-time in monthly calculation
        default:
          return total
      }
    }, 0)

    // Add labor costs
    return expenseTotal + monthlyLaborCost
  }

  // Calculate actual average order value from menu items
  const calculateAverageOrderValue = () => {
    if (financialSettings.customAverageOrderValue > 0) {
      return financialSettings.customAverageOrderValue
    }

    if (menuItems.length === 0) return 15 // Fallback default

    // Calculate weighted average based on menu item prices
    // Assuming equal popularity for simplicity, but this could be enhanced with sales data
    const totalValue = menuItems.filter(item => item.isAvailable).reduce((sum, item) => sum + item.price, 0)

    const availableItems = menuItems.filter(item => item.isAvailable).length

    return availableItems > 0 ? totalValue / availableItems : 15
  }

  // Calculate actual profit margin from menu items
  const calculateAverageProfitMargin = () => {
    if (financialSettings.customProfitMargin > 0) {
      return financialSettings.customProfitMargin / 100
    }

    if (menuItems.length === 0) return 0.65 // Fallback default

    // Calculate weighted average profit margin from menu items
    const availableItems = menuItems.filter(item => item.isAvailable)

    if (availableItems.length === 0) return 0.65

    const totalMargin = availableItems.reduce((sum, item) => {
      const margin = item.profitMargin || 0
      return sum + margin / 100
    }, 0)

    return totalMargin / availableItems.length
  }

  // Get current season multiplier
  const getCurrentSeasonMultiplier = () => {
    const month = new Date().getMonth()
    if (month >= 2 && month <= 4) return financialSettings.seasonalMultipliers.spring
    if (month >= 5 && month <= 7) return financialSettings.seasonalMultipliers.summer
    if (month >= 8 && month <= 10) return financialSettings.seasonalMultipliers.fall
    return financialSettings.seasonalMultipliers.winter
  }

  // Enhanced break-even calculation
  const calculateBreakEvenPoint = () => {
    const monthlyExpenses = calculateMonthlyExpenses()
    const avgOrderValue = calculateAverageOrderValue()
    const avgProfitMargin = calculateAverageProfitMargin()
    const seasonalMultiplier = getCurrentSeasonMultiplier()

    const profitPerOrder = avgOrderValue * avgProfitMargin

    if (profitPerOrder <= 0) return 0

    // Apply seasonal adjustment
    const baseBreakEven = monthlyExpenses / profitPerOrder
    return Math.ceil(baseBreakEven / seasonalMultiplier)
  }

  // Calculate break-even per operating day (Thursday, Friday, Saturday)
  const calculateDailyBreakEven = () => {
    const monthlyBreakEven = calculateBreakEvenPoint()
    const workingDaysPerMonth = financialSettings.workingDaysPerWeek * financialSettings.weeksPerMonth

    // Calculate average orders per day
    const avgOrdersPerDay = monthlyBreakEven / workingDaysPerMonth

    // Adjust for each specific day based on performance multipliers
    const thursday = Math.ceil(avgOrdersPerDay * financialSettings.dayPerformanceMultipliers.thursday)
    const friday = Math.ceil(avgOrdersPerDay * financialSettings.dayPerformanceMultipliers.friday)
    const saturday = Math.ceil(avgOrdersPerDay * financialSettings.dayPerformanceMultipliers.saturday)

    return {
      total: Math.ceil(avgOrdersPerDay),
      thursday,
      friday,
      saturday,
      workingDaysPerMonth: Math.round(workingDaysPerMonth)
    }
  }

  // Get detailed break-even analysis
  const getBreakEvenAnalysis = () => {
    const monthlyExpenses = calculateMonthlyExpenses()
    const avgOrderValue = calculateAverageOrderValue()
    const avgProfitMargin = calculateAverageProfitMargin()
    const seasonalMultiplier = getCurrentSeasonMultiplier()
    const profitPerOrder = avgOrderValue * avgProfitMargin
    const dailyBreakdown = calculateDailyBreakEven()

    return {
      monthlyExpenses,
      avgOrderValue,
      avgProfitMargin: avgProfitMargin * 100, // Convert to percentage
      seasonalMultiplier,
      profitPerOrder,
      monthlyBreakEven: calculateBreakEvenPoint(),
      dailyBreakEven: dailyBreakdown,
      workingDaysPerMonth: dailyBreakdown.workingDaysPerMonth,
      operatingSchedule: {
        daysPerWeek: financialSettings.workingDaysPerWeek,
        weeksPerMonth: financialSettings.weeksPerMonth,
        dayMultipliers: financialSettings.dayPerformanceMultipliers
      },
      usingCalculatedValues: {
        orderValue: financialSettings.customAverageOrderValue === 0,
        profitMargin: financialSettings.customProfitMargin === 0
      }
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      await expensesService.delete(id)
      setSnackbar({ open: true, message: t('expense_deleted_success'), severity: 'success' })
      await loadExpenses()
    } catch (error) {
      setSnackbar({ open: true, message: t('failed_to_delete_expense'), severity: 'error' })
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setNewExpense({
      name: expense.name,
      amount: expense.amount,
      type: expense.type,
      frequency: expense.frequency,
      description: expense.description || '',
      categoryId: expense.categoryId || '',
      isActive: expense.isActive
    })
    setEditingExpense(expense)
    setOpenExpenseDialog(true)
  }

  const handleSaveExpense = async () => {
    try {
      const expense = {
        categoryId: newExpense.categoryId || null,
        name: newExpense.name || '',
        amount: newExpense.amount || 0,
        type: newExpense.type || 'fixed',
        frequency: newExpense.frequency || 'monthly',
        startDate: new Date(),
        description: newExpense.description || '',
        isActive: newExpense.isActive !== false
      }

      if (editingExpense) {
        await expensesService.update(editingExpense.id, expense)
        setSnackbar({ open: true, message: t('expense_updated_success'), severity: 'success' })
      } else {
        await expensesService.create(expense as Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>)
        setSnackbar({ open: true, message: t('expense_added_success'), severity: 'success' })
      }

      setNewExpense({
        name: '',
        amount: 0,
        type: 'fixed',
        frequency: 'monthly',
        description: '',
        categoryId: '',
        isActive: true
      })
      setEditingExpense(null)
      setOpenExpenseDialog(false)

      // Reload expenses to get the latest data
      await loadExpenses()
    } catch (error) {
      setSnackbar({ open: true, message: editingExpense ? t('failed_to_update_expense') : t('failed_to_add_expense'), severity: 'error' })
    }
  }

  const handleSaveGoal = async () => {
    try {
      const goal = {
        name: newGoal.name || '',
        type: newGoal.type || 'monthly_revenue',
        targetAmount: newGoal.targetAmount || 0,
        currentAmount: newGoal.currentAmount || 0,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: newGoal.isActive !== false
      }

      await financialGoalsService.create(goal as Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt'>)

      setNewGoal({
        name: '',
        type: 'monthly_revenue',
        targetAmount: 0,
        currentAmount: 0,
        isActive: true
      })
      setOpenGoalDialog(false)
      setSnackbar({ open: true, message: t('goal_created_success'), severity: 'success' })

      // Reload goals to get the latest data
      await loadGoals()
    } catch (error) {
      setSnackbar({ open: true, message: t('failed_to_create_goal'), severity: 'error' })
    }
  }

  const handleCalculateProjection = async () => {
    try {
      const monthlyExpenses = calculateMonthlyExpenses()
      const avgOrderValue = newProjection.averageOrderValue || 0
      const ordersPerDay = newProjection.ordersPerDay || 0
      const workingDays = newProjection.workingDaysPerMonth || 22

      const monthlyRevenue = avgOrderValue * ordersPerDay * workingDays
      const monthlyProfit = monthlyRevenue - monthlyExpenses
      const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0
      const breakEvenOrders = calculateBreakEvenPoint()

      const projection = {
        name: newProjection.name || `Projection ${new Date().toLocaleDateString()}`,
        projectionPeriod: newProjection.projectionPeriod || 'monthly',
        projectedRevenue: monthlyRevenue,
        projectedExpenses: monthlyExpenses,
        projectedProfit: monthlyProfit,
        averageOrderValue: avgOrderValue,
        ordersPerDay: ordersPerDay,
        workingDaysPerMonth: workingDays,
        profitMarginPercentage: profitMargin,
        breakEvenPoint: breakEvenOrders
      }

      await financialProjectionsService.create(projection as Omit<FinancialProjection, 'id' | 'createdAt' | 'updatedAt'>)

      setOpenProjectionDialog(false)
      setSnackbar({ open: true, message: t('projection_created_success'), severity: 'success' })

      // Reload projections to get the latest data
      await loadProjections()
    } catch (error) {
      setSnackbar({ open: true, message: t('failed_to_create_projection'), severity: 'error' })
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, textAlign: isRtl ? 'right' : 'left' }}>
        {t('financial_management')}
      </Typography>

      {/* Financial Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }} direction={isRtl ? 'row-reverse' : 'row'} justifyContent={isRtl ? 'flex-end' : 'flex-start'}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <ExpenseIcon color="error" sx={{ mr: isRtl ? 0 : 1, ml: isRtl ? 1 : 0 }} />
                <Typography variant="h6" color="error" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                  {t('monthly_expenses')}
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                ${calculateMonthlyExpenses().toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <GoalIcon color="primary" sx={{ mr: isRtl ? 0 : 1, ml: isRtl ? 1 : 0 }} />
                <Typography variant="h6" color="primary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                  {t('break_even_orders')}
                </Typography>
              </Box>
              <Typography variant="h4">{calculateBreakEvenPoint()}</Typography>
              <Typography variant="caption" color="text.secondary">
                {calculateDailyBreakEven().workingDaysPerMonth} {t('operating_days_per_month')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <AnalyticsIcon color="success" sx={{ mr: isRtl ? 0 : 1, ml: isRtl ? 1 : 0 }} />
                <Typography variant="h6" color="success" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                  {t('active_goals')}
                </Typography>
              </Box>
              <Typography variant="h4">{goals.filter(g => g.isActive).length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <ChartIcon color="info" sx={{ mr: isRtl ? 0 : 1, ml: isRtl ? 1 : 0 }} />
                <Typography variant="h6" color="info" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                  {t('projections')}
                </Typography>
              </Box>
              <Typography variant="h4">{projections.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label={t('expenses')} />
          <Tab label={t('labor_costs')} />
          <Tab label={t('projections')} />
          <Tab label={t('goals')} />
          <Tab label={t('reports')} />
        </Tabs>
      </Box>

      {/* Expenses Tab */}
      <TabPanel value={currentTab} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <Typography variant="h5" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
            {t('expense_management')}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenExpenseDialog(true)}>
            {t('add_expense')}
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, textAlign: isRtl ? 'right' : 'left' }}>
                  {t('current_expenses')}
                </Typography>
                <TableContainer dir={isRtl ? 'rtl' : 'ltr'}>
                  <Table dir={isRtl ? 'rtl' : 'ltr'}>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('name_and_category')}</TableCell>
                        <TableCell align={isRtl ? 'left' : 'right'}>{t('amount')}</TableCell>
                        <TableCell>{t('frequency')}</TableCell>
                        <TableCell>{t('category')}</TableCell>
                        <TableCell>{t('type_text')}</TableCell>
                        <TableCell align={isRtl ? 'left' : 'right'}>{t('monthly_impact')}</TableCell>
                        <TableCell>{t('actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenses.map(expense => {
                        let monthlyImpact = 0
                        switch (expense.frequency) {
                          case 'daily':
                            monthlyImpact = expense.amount * 30
                            break
                          case 'weekly':
                            monthlyImpact = expense.amount * 4.33
                            break
                          case 'monthly':
                            monthlyImpact = expense.amount
                            break
                          case 'yearly':
                            monthlyImpact = expense.amount / 12
                            break
                          default:
                            monthlyImpact = 0
                        }

                        const category = expenseCategories.find(cat => cat.id === expense.categoryId)

                        return (
                          <TableRow key={expense.id}>
                            <TableCell>
                              {expense.name}
                              {category && <Chip label={category.name} size="small" variant="outlined" sx={{ ml: isRtl ? 0 : 1, mr: isRtl ? 1 : 0, fontSize: '0.7rem' }} />}
                            </TableCell>
                            <TableCell align={isRtl ? 'left' : 'right'}>${expense.amount.toFixed(2)}</TableCell>
                            <TableCell>{t(expense.frequency)}</TableCell>
                            <TableCell>{category?.name}</TableCell>
                            <TableCell>
                              <Chip label={t(expense.type)} size="small" color={expense.type === 'fixed' ? 'primary' : expense.type === 'variable' ? 'warning' : 'default'} />
                            </TableCell>
                            <TableCell align={isRtl ? 'left' : 'right'}>${monthlyImpact.toFixed(2)}</TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => handleEditExpense(expense)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeleteExpense(expense.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Labor Costs Tab */}
      <TabPanel value={currentTab} index={1}>
        {(() => {
          const metrics = calculateWeeklyMetrics()
          return (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Revenue Analytics:</strong> Based on break-even analysis and menu data
                  <br />• Weekly Revenue: ${metrics.weeklyRevenue.toFixed(2)}• Weekly Orders: {metrics.weeklyOrders} orders • Avg Order Value: ${metrics.avgOrderValue.toFixed(2)}
                  <br />
                  <em>These values will be replaced with actual sales data when transaction tracking is implemented.</em>
                </Typography>
              </Alert>
              <LaborCostManager employees={employees} shifts={shifts} weeklyRevenue={metrics.weeklyRevenue} weeklyOrders={metrics.weeklyOrders} onLaborCostUpdate={setMonthlyLaborCost} />
            </Box>
          )
        })()}
      </TabPanel>

      {/* Projections Tab */}
      <TabPanel value={currentTab} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Financial Projections</Typography>
          <Button variant="contained" startIcon={<AnalyticsIcon />} onClick={() => setOpenProjectionDialog(true)}>
            Create Projection
          </Button>
        </Box>

        {/* Enhanced Break-even Analysis Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Break-Even Analysis</Typography>
              <Button variant="outlined" size="small" onClick={() => setOpenSettingsDialog(true)}>
                Settings
              </Button>
            </Box>

            {(() => {
              const analysis = getBreakEvenAnalysis()
              return (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Monthly Expenses: <strong>${analysis.monthlyExpenses.toFixed(2)}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Average Order Value: <strong>${analysis.avgOrderValue.toFixed(2)}</strong>
                      {analysis.usingCalculatedValues.orderValue && <Chip label="Calculated" size="small" sx={{ ml: 1 }} />}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Average Profit Margin: <strong>{analysis.avgProfitMargin.toFixed(1)}%</strong>
                      {analysis.usingCalculatedValues.profitMargin && <Chip label="Calculated" size="small" sx={{ ml: 1 }} />}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Profit Per Order: <strong>${analysis.profitPerOrder.toFixed(2)}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Seasonal Multiplier: <strong>{analysis.seasonalMultiplier}x</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 1, mb: 2 }}>
                      <Typography variant="h6" align="center">
                        Break-Even Point
                      </Typography>
                      <Typography variant="h4" align="center">
                        {analysis.monthlyBreakEven} orders/month
                      </Typography>
                      <Typography variant="body1" align="center">
                        ({analysis.workingDaysPerMonth} operating days)
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1, mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Daily Targets:
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              THU
                            </Typography>
                            <Typography variant="h6">{analysis.dailyBreakEven.thursday}</Typography>
                            <Typography variant="caption">orders</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              FRI
                            </Typography>
                            <Typography variant="h6">{analysis.dailyBreakEven.friday}</Typography>
                            <Typography variant="caption">orders</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              SAT
                            </Typography>
                            <Typography variant="h6">{analysis.dailyBreakEven.saturday}</Typography>
                            <Typography variant="caption">orders</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>

                    <Alert severity={menuItems.length > 0 ? 'success' : 'warning'}>{menuItems.length > 0 ? `Using data from ${menuItems.filter(i => i.isAvailable).length} menu items • 3-day schedule` : 'Add menu items for more accurate calculations'}</Alert>
                  </Grid>
                </Grid>
              )
            })()}
          </CardContent>
        </Card>

        {/* Projections List */}
        <Grid container spacing={3}>
          {projections.map(projection => (
            <Grid item xs={12} md={6} key={projection.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {projection.name}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Revenue
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        ${projection.projectedRevenue.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Expenses
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        ${projection.projectedExpenses.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Profit
                      </Typography>
                      <Typography variant="h6" color={projection.projectedProfit >= 0 ? 'success.main' : 'error.main'}>
                        ${projection.projectedProfit.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Margin
                      </Typography>
                      <Typography variant="h6">{projection.profitMarginPercentage.toFixed(1)}%</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Break-even: {projection.breakEvenPoint} orders/month
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Goals Tab */}
      <TabPanel value={currentTab} index={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Financial Goals</Typography>
          <Button variant="contained" startIcon={<GoalIcon />} onClick={() => setOpenGoalDialog(true)}>
            Set Goal
          </Button>
        </Box>

        <Grid container spacing={3}>
          {goals.map(goal => (
            <Grid item xs={12} md={6} key={goal.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {goal.name}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Progress</Typography>
                      <Typography variant="body2">
                        ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)} />
                  </Box>
                  <Chip label={goal.type.replace('_', ' ').toUpperCase()} size="small" color={goal.isActive ? 'primary' : 'default'} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Reports Tab */}
      <TabPanel value={currentTab} index={4}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Financial Reports
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Reports and visualizations will be implemented in the next phase. This will include charts, trends, and detailed financial analytics.
        </Alert>
      </TabPanel>

      {/* Add Expense Dialog */}
      <Dialog
        open={openExpenseDialog}
        onClose={() => {
          setOpenExpenseDialog(false)
          setEditingExpense(null)
          setNewExpense({
            name: '',
            amount: 0,
            type: 'fixed',
            frequency: 'monthly',
            description: '',
            categoryId: '',
            isActive: true
          })
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editingExpense ? t('edit_expense') : t('add_new_expense')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('expense_name')} value={newExpense.name} onChange={e => setNewExpense({ ...newExpense, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('category')}</InputLabel>
                <Select value={newExpense.categoryId || ''} onChange={e => setNewExpense({ ...newExpense, categoryId: e.target.value })}>
                  <MuiMenuItem value="">{t('no_category')}</MuiMenuItem>
                  {expenseCategories.map(category => (
                    <MuiMenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('amount')} type="number" inputProps={{ step: '0.01' }} value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('type_text')}</InputLabel>
                <Select value={newExpense.type} onChange={e => setNewExpense({ ...newExpense, type: e.target.value as any })}>
                  <MuiMenuItem value="fixed">{t('fixed')}</MuiMenuItem>
                  <MuiMenuItem value="variable">{t('variable')}</MuiMenuItem>
                  <MuiMenuItem value="one_time">{t('one_time')}</MuiMenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('frequency')}</InputLabel>
                <Select value={newExpense.frequency} onChange={e => setNewExpense({ ...newExpense, frequency: e.target.value as any })}>
                  <MuiMenuItem value="daily">{t('daily')}</MuiMenuItem>
                  <MuiMenuItem value="weekly">{t('weekly')}</MuiMenuItem>
                  <MuiMenuItem value="monthly">{t('monthly')}</MuiMenuItem>
                  <MuiMenuItem value="yearly">{t('yearly')}</MuiMenuItem>
                  <MuiMenuItem value="one_time">{t('one_time')}</MuiMenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={t('description')} multiline rows={3} value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExpenseDialog(false)}>{t('cancel')}</Button>
          <Button onClick={handleSaveExpense} variant="contained">
            {editingExpense ? t('update_expense') : t('add_expense')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Goal Dialog */}
      <Dialog open={openGoalDialog} onClose={() => setOpenGoalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Financial Goal</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Goal Name" value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Goal Type</InputLabel>
                <Select value={newGoal.type} onChange={e => setNewGoal({ ...newGoal, type: e.target.value as any })}>
                  <MuiMenuItem value="monthly_revenue">Monthly Revenue</MuiMenuItem>
                  <MuiMenuItem value="monthly_profit">Monthly Profit</MuiMenuItem>
                  <MuiMenuItem value="break_even">Break Even</MuiMenuItem>
                  <MuiMenuItem value="custom">Custom</MuiMenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Target Amount" type="number" inputProps={{ step: '0.01' }} value={newGoal.targetAmount} onChange={e => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) || 0 })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Current Amount" type="number" inputProps={{ step: '0.01' }} value={newGoal.currentAmount} onChange={e => setNewGoal({ ...newGoal, currentAmount: parseFloat(e.target.value) || 0 })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGoalDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveGoal} variant="contained">
            Create Goal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Projection Dialog */}
      <Dialog open={openProjectionDialog} onClose={() => setOpenProjectionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Financial Projection</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Projection Name" value={newProjection.name} onChange={e => setNewProjection({ ...newProjection, name: e.target.value })} placeholder="e.g., Q1 2024 Projection" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Average Order Value" type="number" inputProps={{ step: '0.01' }} value={newProjection.averageOrderValue} onChange={e => setNewProjection({ ...newProjection, averageOrderValue: parseFloat(e.target.value) || 0 })} helperText="Average amount per customer order" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Orders Per Day" type="number" value={newProjection.ordersPerDay} onChange={e => setNewProjection({ ...newProjection, ordersPerDay: parseInt(e.target.value) || 0 })} helperText="Expected number of orders per day" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Working Days Per Month" type="number" value={newProjection.workingDaysPerMonth} onChange={e => setNewProjection({ ...newProjection, workingDaysPerMonth: parseInt(e.target.value) || 22 })} helperText="Number of operating days per month" />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">Based on your current monthly expenses of ${calculateMonthlyExpenses().toFixed(2)}, this projection will calculate your expected profit and break-even point.</Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProjectionDialog(false)}>Cancel</Button>
          <Button onClick={handleCalculateProjection} variant="contained">
            Calculate Projection
          </Button>
        </DialogActions>
      </Dialog>

      {/* Financial Settings Dialog */}
      <Dialog open={openSettingsDialog} onClose={() => setOpenSettingsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Financial Calculation Settings</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Order Value & Profit Margin
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Custom Average Order Value"
                type="number"
                inputProps={{ step: '0.01' }}
                value={financialSettings.customAverageOrderValue || ''}
                onChange={e =>
                  setFinancialSettings({
                    ...financialSettings,
                    customAverageOrderValue: parseFloat(e.target.value) || 0
                  })
                }
                helperText={financialSettings.customAverageOrderValue === 0 ? `Using calculated: $${calculateAverageOrderValue().toFixed(2)}` : 'Leave 0 to use calculated value from menu items'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Custom Profit Margin (%)"
                type="number"
                inputProps={{ step: '0.1', min: '0', max: '100' }}
                value={financialSettings.customProfitMargin || ''}
                onChange={e =>
                  setFinancialSettings({
                    ...financialSettings,
                    customProfitMargin: parseFloat(e.target.value) || 0
                  })
                }
                helperText={financialSettings.customProfitMargin === 0 ? `Using calculated: ${(calculateAverageProfitMargin() * 100).toFixed(1)}%` : 'Leave 0 to use calculated value from menu items'}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                3-Day Operating Schedule
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Operating Thursday, Friday, and Saturday with different performance expectations
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Working Days Per Week"
                type="number"
                inputProps={{ min: '1', max: '7' }}
                value={financialSettings.workingDaysPerWeek}
                onChange={e =>
                  setFinancialSettings({
                    ...financialSettings,
                    workingDaysPerWeek: parseInt(e.target.value) || 3
                  })
                }
                helperText="Number of days you operate per week"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weeks Per Month"
                type="number"
                inputProps={{ step: '0.1', min: '4', max: '5' }}
                value={financialSettings.weeksPerMonth}
                onChange={e =>
                  setFinancialSettings({
                    ...financialSettings,
                    weeksPerMonth: parseFloat(e.target.value) || 4.33
                  })
                }
                helperText="Average weeks per month (4.33 is standard)"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                Daily Performance Multipliers
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Adjust expected performance for each operating day (1.0 = average, &lt;1.0 = slower, &gt;1.0 = busier)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Thursday Multiplier"
                type="number"
                inputProps={{ step: '0.1', min: '0.1' }}
                value={financialSettings.dayPerformanceMultipliers.thursday}
                onChange={e =>
                  setFinancialSettings({
                    ...financialSettings,
                    dayPerformanceMultipliers: {
                      ...financialSettings.dayPerformanceMultipliers,
                      thursday: parseFloat(e.target.value) || 0.7
                    }
                  })
                }
                helperText="Expected to be slower"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Friday Multiplier"
                type="number"
                inputProps={{ step: '0.1', min: '0.1' }}
                value={financialSettings.dayPerformanceMultipliers.friday}
                onChange={e =>
                  setFinancialSettings({
                    ...financialSettings,
                    dayPerformanceMultipliers: {
                      ...financialSettings.dayPerformanceMultipliers,
                      friday: parseFloat(e.target.value) || 1.2
                    }
                  })
                }
                helperText="Better than average"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Saturday Multiplier"
                type="number"
                inputProps={{ step: '0.1', min: '0.1' }}
                value={financialSettings.dayPerformanceMultipliers.saturday}
                onChange={e =>
                  setFinancialSettings({
                    ...financialSettings,
                    dayPerformanceMultipliers: {
                      ...financialSettings.dayPerformanceMultipliers,
                      saturday: parseFloat(e.target.value) || 1.3
                    }
                  })
                }
                helperText="Best performance day"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                Seasonal Adjustments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Adjust break-even calculations based on seasonal demand patterns
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Spring Multiplier"
                type="number"
                inputProps={{ step: '0.1', min: '0.1' }}
                value={financialSettings.seasonalMultipliers.spring}
                onChange={e =>
                  setFinancialSettings({
                    ...financialSettings,
                    seasonalMultipliers: {
                      ...financialSettings.seasonalMultipliers,
                      spring: parseFloat(e.target.value) || 1.0
                    }
                  })
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Summer Multiplier"
                type="number"
                inputProps={{ step: '0.1', min: '0.1' }}
                value={financialSettings.seasonalMultipliers.summer}
                onChange={e =>
                  setFinancialSettings({
                    ...financialSettings,
                    seasonalMultipliers: {
                      ...financialSettings.seasonalMultipliers,
                      summer: parseFloat(e.target.value) || 1.2
                    }
                  })
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Fall Multiplier"
                type="number"
                inputProps={{ step: '0.1', min: '0.1' }}
                value={financialSettings.seasonalMultipliers.fall}
                onChange={e =>
                  setFinancialSettings({
                    ...financialSettings,
                    seasonalMultipliers: {
                      ...financialSettings.seasonalMultipliers,
                      fall: parseFloat(e.target.value) || 1.0
                    }
                  })
                }
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Winter Multiplier"
                type="number"
                inputProps={{ step: '0.1', min: '0.1' }}
                value={financialSettings.seasonalMultipliers.winter}
                onChange={e =>
                  setFinancialSettings({
                    ...financialSettings,
                    seasonalMultipliers: {
                      ...financialSettings.seasonalMultipliers,
                      winter: parseFloat(e.target.value) || 0.8
                    }
                  })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Current Season:</strong> {getCurrentSeasonMultiplier()}x multiplier is being applied to break-even calculations. Values above 1.0 indicate higher demand (easier to reach break-even), below 1.0 indicate lower demand.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettingsDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setOpenSettingsDialog(false)
              setSnackbar({ open: true, message: 'Financial settings updated', severity: 'success' })
            }}
            variant="contained"
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
    </Box>
  )
}
