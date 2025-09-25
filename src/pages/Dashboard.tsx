import React, { useState, useEffect } from 'react'
import { Grid, Paper, Typography, Box, Card, CardContent, LinearProgress, CircularProgress, Chip, Divider } from '@mui/material'
import { TrendingUp, AttachMoney, People, Restaurant, ShoppingCart, Warning, Schedule, TrendingDown, Star, Assignment } from '@mui/icons-material'
import { inventoryService, suppliersService, ordersService, transactionsService, employeesService, shiftsService, menuItemsService, customersService, financialGoalsService } from '../services/supabaseService'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { InventoryItem, Supplier, Order, Transaction, Employee, Shift, MenuItem, Customer, FinancialGoal } from '../types'
import { formatCurrency } from '../utils/currency'

const StatCard = ({ title, value, icon, color, subtitle, isRtl }: any) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <Box sx={{ color, mr: isRtl ? 0 : 1, ml: isRtl ? 1 : 0 }}>{icon}</Box>
        <Typography variant="h6" component="div" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ mb: 1, textAlign: isRtl ? 'right' : 'left', width: '100%' }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
)

export default function Dashboard() {
  const theme = useTheme()
  const { t } = useTranslation()
  const docDir = typeof document !== 'undefined' ? document.documentElement.dir : 'ltr'
  const isRtl = docDir === 'rtl' || theme.direction === 'rtl'
  const [loading, setLoading] = useState(true)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [inventoryData, suppliersData, ordersData, transactionsData, employeesData, shiftsData, menuItemsData, customersData, financialGoalsData] = await Promise.all([inventoryService.getAll(), suppliersService.getAll(), ordersService.getAll(), transactionsService.getAll(), employeesService.getAll(), shiftsService.getAll(), menuItemsService.getAll(), customersService.getAll(), financialGoalsService.getAll()])
      setInventoryItems(inventoryData)
      setSuppliers(suppliersData)
      setOrders(ordersData)
      setTransactions(transactionsData)
      setEmployees(employeesData)
      setShifts(shiftsData)
      setMenuItems(menuItemsData)
      setCustomers(customersData)
      setFinancialGoals(financialGoalsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Date calculations
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const startOfWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  // Filter today's data
  const todaysOrders = orders.filter(order => {
    const orderDate = new Date(order.orderTime)
    return orderDate.toDateString() === today.toDateString()
  })

  const yesterdaysOrders = orders.filter(order => {
    const orderDate = new Date(order.orderTime)
    return orderDate.toDateString() === yesterday.toDateString()
  })

  const thisWeeksOrders = orders.filter(order => {
    const orderDate = new Date(order.orderTime)
    return orderDate >= startOfWeek
  })

  const thisMonthsOrders = orders.filter(order => {
    const orderDate = new Date(order.orderTime)
    return orderDate >= startOfMonth
  })

  // Revenue calculations
  const todaysRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0)
  const yesterdaysRevenue = yesterdaysOrders.reduce((sum, order) => sum + order.total, 0)
  const revenueChange = yesterdaysRevenue > 0 ? ((todaysRevenue - yesterdaysRevenue) / yesterdaysRevenue) * 100 : 0

  // Orders calculations
  const todaysOrderCount = todaysOrders.length
  const yesterdaysOrderCount = yesterdaysOrders.length
  const orderChange = yesterdaysOrderCount > 0 ? ((todaysOrderCount - yesterdaysOrderCount) / yesterdaysOrderCount) * 100 : 0

  // Staff calculations
  const todaysShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date)
    return shiftDate.toDateString() === today.toDateString()
  })
  const activeStaff = todaysShifts.length

  // Average order value
  const averageOrderValue = todaysOrderCount > 0 ? todaysRevenue / todaysOrderCount : 0

  // Calculate profit margin based on menu items
  const totalCosts = todaysOrders.reduce((sum, order) => {
    return (
      sum +
      order.items.reduce((itemSum, item) => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId)
        return itemSum + (menuItem?.totalIngredientCost || 0) * item.quantity
      }, 0)
    )
  }, 0)
  const profitMargin = todaysRevenue > 0 ? ((todaysRevenue - totalCosts) / todaysRevenue) * 100 : 0

  // Top selling items this week
  const itemSales = new Map<string, { count: number; revenue: number; name: string }>()
  thisWeeksOrders.forEach(order => {
    order.items.forEach(item => {
      const existing = itemSales.get(item.menuItemId) || { count: 0, revenue: 0, name: '' }
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId)
      itemSales.set(item.menuItemId, {
        count: existing.count + item.quantity,
        revenue: existing.revenue + item.totalPrice,
        name: menuItem?.name || 'Unknown Item'
      })
    })
  })
  const topSellingItems = Array.from(itemSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  // Customer metrics
  const totalCustomers = customers.length
  const newCustomersThisMonth = customers.filter(customer => {
    return customer.lastVisit && new Date(customer.lastVisit) >= startOfMonth
  }).length
  const averageLoyaltyPoints = totalCustomers > 0 ? customers.reduce((sum, customer) => sum + (customer.loyaltyPoints || 0), 0) / totalCustomers : 0

  // Financial goals progress
  const activeGoals = financialGoals.filter(goal => goal.isActive)
  const monthlyRevenueGoal = activeGoals.find(goal => goal.type === 'monthly_revenue')
  const thisMonthRevenue = thisMonthsOrders.reduce((sum, order) => sum + order.total, 0)
  const goalProgress = monthlyRevenueGoal ? (thisMonthRevenue / monthlyRevenueGoal.targetAmount) * 100 : 0

  // Peak hours analysis
  const hourlyOrders = new Array(24).fill(0)
  todaysOrders.forEach(order => {
    const hour = new Date(order.orderTime).getHours()
    hourlyOrders[hour]++
  })
  const peakHour = hourlyOrders.indexOf(Math.max(...hourlyOrders))
  const peakHourFormatted = peakHour === 0 ? '12:00 AM' : peakHour < 12 ? `${peakHour}:00 AM` : peakHour === 12 ? '12:00 PM' : `${peakHour - 12}:00 PM`

  // Inventory calculations
  const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minThreshold)
  const autoOrderSuggestions = lowStockItems
    .map(item => {
      const supplier = suppliers.find(sup => sup.name === item.supplier && sup.autoOrderEnabled && sup.isActive)
      if (!supplier) return null

      const suggestedQuantity = Math.max(item.minThreshold * 2 - item.currentStock, supplier.minimumOrderAmount / item.costPerUnit)

      return {
        item,
        supplier,
        suggestedQuantity: Math.ceil(suggestedQuantity),
        totalCost: suggestedQuantity * item.costPerUnit
      }
    })
    .filter(Boolean)

  const estimatedOrderValue = autoOrderSuggestions.reduce((sum, order) => sum + (order?.totalCost || 0), 0)
  const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + item.currentStock * item.costPerUnit, 0)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, textAlign: isRtl ? 'right' : 'left' }}>
        {t('dashboard')}
      </Typography>

      <Grid container spacing={3} direction={isRtl ? 'row-reverse' : 'row'} justifyContent={isRtl ? 'flex-end' : 'flex-start'}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('todays_revenue')} value={formatCurrency(todaysRevenue)} icon={<AttachMoney />} color={revenueChange >= 0 ? 'success.main' : 'error.main'} subtitle={revenueChange >= 0 ? t('plus_percent_from_yesterday', { percent: Math.abs(revenueChange).toFixed(1) }) : `${revenueChange.toFixed(1)}% ${t('from_yesterday')}`} isRtl={isRtl} />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('orders_today')} value={todaysOrderCount.toString()} icon={<Restaurant />} color="primary.main" subtitle={orderChange >= 0 ? t('plus_percent_from_yesterday', { percent: Math.abs(orderChange).toFixed(1) }) : `${orderChange.toFixed(1)}% ${t('from_yesterday')}`} isRtl={isRtl} />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('active_staff')} value={activeStaff.toString()} icon={<People />} color="info.main" subtitle={t('on_duty_today')} isRtl={isRtl} />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('profit_margin')} value={`${profitMargin.toFixed(1)}%`} icon={profitMargin >= 20 ? <TrendingUp /> : <TrendingDown />} color={profitMargin >= 20 ? 'success.main' : profitMargin >= 10 ? 'warning.main' : 'error.main'} subtitle={t('today')} isRtl={isRtl} />
        </Grid>

        {/* Auto-Order Status Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <ShoppingCart sx={{ color: 'warning.main', mr: isRtl ? 0 : 1, ml: isRtl ? 1 : 0 }} />
                <Typography variant="h6" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                  {t('auto_order_status')}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <Warning sx={{ color: 'error.main', fontSize: 16, mr: isRtl ? 0 : 0.5, ml: isRtl ? 0.5 : 0 }} />
                  <Typography variant="body2" color="error" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                    {lowStockItems.length} {t('low_stock_items')}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                  {autoOrderSuggestions.length} {t('suppliers_ready_for_auto_order')}
                </Typography>
              </Box>

              <Box
                sx={theme => ({
                  p: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.08)' : 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(127,255,212,0.25)' : 'divider'
                })}
              >
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                  {t('estimated_order_value')}
                </Typography>
                <Typography
                  variant="h5"
                  sx={theme => ({
                    textAlign: isRtl ? 'right' : 'left',
                    width: '100%',
                    color: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.text.primary,
                    fontWeight: 700
                  })}
                >
                  {formatCurrency(estimatedOrderValue)}
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: isRtl ? 'right' : 'left' }}>
                {t('visit_inventory_auto_order_to_review')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: isRtl ? 'right' : 'left' }}>
              {t('business_insights')}
            </Typography>

            {/* Revenue Goal Progress */}
            {monthlyRevenueGoal && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, textAlign: isRtl ? 'right' : 'left' }}>
                  {t('monthly_revenue_goal')}
                </Typography>
                <LinearProgress variant="determinate" value={Math.min(goalProgress, 100)} sx={{ mb: 1, height: 8, borderRadius: 4 }} color={goalProgress >= 100 ? 'success' : goalProgress >= 75 ? 'primary' : 'warning'} />
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                  {formatCurrency(thisMonthRevenue)} {t('of_goal', { value: formatCurrency(monthlyRevenueGoal.targetAmount) })} ({goalProgress.toFixed(1)}%)
                </Typography>
              </Box>
            )}

            {/* Top Selling Items */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 2, textAlign: isRtl ? 'right' : 'left', fontWeight: 'bold' }}>
                {t('top_selling_items_this_week')}
              </Typography>
              {topSellingItems.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {topSellingItems.map((item, index) => (
                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                      <Chip label={index + 1} size="small" color={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'default'} icon={index === 0 ? <Star /> : undefined} />
                      <Typography variant="body2" sx={{ flex: 1, textAlign: isRtl ? 'right' : 'left' }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.count} {t('sold')} • {formatCurrency(item.revenue)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                  {t('no_sales_this_week')}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Business Metrics */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('average_order_value')}:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(averageOrderValue)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('peak_hour_today')}:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {peakHourFormatted} ({Math.max(...hourlyOrders)} {t('orders_text')})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('total_customers')}:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {totalCustomers.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('inventory_value')}:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(totalInventoryValue)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Performance Summary Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: isRtl ? 'right' : 'left' }}>
              {t('performance_summary')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Weekly Performance */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, textAlign: isRtl ? 'right' : 'left' }}>
                  {t('this_week')}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('orders_text')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {thisWeeksOrders.length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('revenue')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(thisWeeksOrders.reduce((sum, order) => sum + order.total, 0))}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Customer Insights */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, textAlign: isRtl ? 'right' : 'left' }}>
                  {t('customers')}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('new_this_month')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {newCustomersThisMonth}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('avg_loyalty_points')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {averageLoyaltyPoints.toFixed(0)}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Staff Performance */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, textAlign: isRtl ? 'right' : 'left' }}>
                  {t('staff_efficiency')}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('orders_per_staff_today')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {activeStaff > 0 ? (todaysOrderCount / activeStaff).toFixed(1) : '0'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('revenue_per_staff')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {activeStaff > 0 ? formatCurrency(todaysRevenue / activeStaff) : formatCurrency(0)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
