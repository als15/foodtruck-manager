import React, { useState, useEffect } from 'react'
import { Grid, Paper, Typography, Box, Card, CardContent, LinearProgress, CircularProgress } from '@mui/material'
import { TrendingUp, AttachMoney, People, Restaurant, ShoppingCart, Warning } from '@mui/icons-material'
import { inventoryService, suppliersService } from '../services/supabaseService'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { InventoryItem, Supplier } from '../types'
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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [inventoryData, suppliersData] = await Promise.all([inventoryService.getAll(), suppliersService.getAll()])
      setInventoryItems(inventoryData)
      setSuppliers(suppliersData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate real data
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
          <StatCard title={t('todays_revenue')} value={formatCurrency(1247)} icon={<AttachMoney />} color="success.main" subtitle={t('plus_percent_from_yesterday', { percent: 12 })} isRtl={isRtl} />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('orders_today')} value="89" icon={<Restaurant />} color="primary.main" subtitle={t('plus_percent_from_yesterday', { percent: 5 })} isRtl={isRtl} />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('active_staff')} value="6" icon={<People />} color="info.main" subtitle={t('on_duty_today')} isRtl={isRtl} />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('profit_margin')} value="34%" icon={<TrendingUp />} color="warning.main" subtitle={t('this_month')} isRtl={isRtl} />
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

              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                  {t('estimated_order_value')}
                </Typography>
                <Typography variant="h5" color="primary" sx={{ textAlign: isRtl ? 'right' : 'left', width: '100%' }}>
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
              {t('recent_activity')}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, textAlign: isRtl ? 'right' : 'left' }}>
                {t('revenue_progress_today')}
              </Typography>
              <LinearProgress variant="determinate" value={75} sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                {formatCurrency(1247)} {t('of_goal', { value: formatCurrency(1660) })}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, textAlign: isRtl ? 'right' : 'left' }}>
                {t('orders_progress_today')}
              </Typography>
              <LinearProgress variant="determinate" value={60} sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                89 {t('of_goal', { value: '150' })}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: isRtl ? 'right' : 'left' }}>
              {t('quick_actions')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Typography variant="body2">• {t('quick_action_add_menu_item')}</Typography>
              <Typography variant="body2">• {t('quick_action_schedule_shift')}</Typography>
              <Typography variant="body2">• {t('quick_action_record_expense')}</Typography>
              <Typography variant="body2">• {t('quick_action_update_inventory')}</Typography>
              <Typography variant="body2">• {t('quick_action_plan_route')}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
