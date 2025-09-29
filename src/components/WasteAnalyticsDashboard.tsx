import React, { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, LinearProgress, Alert, Select, MenuItem as MuiMenuItem, FormControl, InputLabel, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { TrendingDown as WasteIcon, Warning as WarningIcon, Nature as EfficiencyIcon, AttachMoney as MoneyIcon, Lightbulb as RecommendationIcon, ArrowUpward as IncreaseIcon, ArrowDownward as DecreaseIcon } from '@mui/icons-material'
import { wasteAnalyticsService, WasteAnalytics, WasteRateItem } from '../services/wasteAnalyticsService'
import { InventoryItem, Order, MenuItem, Ingredient } from '../types'
import { formatCurrency } from '../utils/currency'
import { useTranslation } from 'react-i18next'

interface WasteAnalyticsDashboardProps {
  inventoryItems: InventoryItem[]
  orders: Order[]
  menuItems: MenuItem[]
  ingredients: Ingredient[]
  onWasteExpenseCalculated?: (expense: { amount: number; category: string; description: string; breakdown: { [category: string]: number } }) => void
}

export default function WasteAnalyticsDashboard({ inventoryItems, orders, menuItems, ingredients, onWasteExpenseCalculated }: WasteAnalyticsDashboardProps) {
  const { t } = useTranslation()
  const [timeframe, setTimeframe] = useState<'month' | 'quarter'>('month')
  const [analytics, setAnalytics] = useState<WasteAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calculateAnalytics()
  }, [inventoryItems, orders, menuItems, ingredients, timeframe])

  const calculateAnalytics = async () => {
    setLoading(true)
    try {
      console.log('Calculating waste analytics with:', {
        inventoryCount: inventoryItems.length,
        itemsWithWaste: inventoryItems.filter(item => (item.disposedQuantity || 0) > 0).length,
        ordersCount: orders.length,
        menuItemsCount: menuItems.length,
        ingredientsCount: ingredients.length
      })

      const wasteAnalytics = wasteAnalyticsService.calculateWasteAnalytics(inventoryItems, orders, menuItems, ingredients, timeframe)

      console.log('Calculated waste analytics:', wasteAnalytics)

      setAnalytics(wasteAnalytics)

      // Notify parent about monthly waste expense for financial integration
      if (onWasteExpenseCalculated && wasteAnalytics.totalWasteValue > 0) {
        const wasteExpense = wasteAnalyticsService.calculateMonthlyWasteExpense(wasteAnalytics)
        console.log('Notifying parent of waste expense:', wasteExpense)
        onWasteExpenseCalculated(wasteExpense)
      }
    } catch (error) {
      console.error('Error calculating waste analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWasteColor = (wasteRate: number) => {
    if (wasteRate > 20) return 'error'
    if (wasteRate > 10) return 'warning'
    if (wasteRate > 5) return 'info'
    return 'success'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'info'
      default:
        return 'default'
    }
  }

  if (loading || !analytics) {
    return (
      <Card>
        <CardContent>
          <Typography>{t('loading_waste_analytics')}</Typography>
        </CardContent>
      </Card>
    )
  }

  // Check if there's any waste data to show
  const hasWasteData = analytics.totalWasteValue > 0 || analytics.wasteRateByItem.some(item => item.disposedQuantity > 0)

  // Calculate simple waste totals directly from inventory for fallback display
  const simpleWasteValue = inventoryItems.reduce((total, item) => total + (item.disposedQuantity || 0) * item.costPerUnit, 0)
  const itemsWithDirectWaste = inventoryItems.filter(item => (item.disposedQuantity || 0) > 0)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <WasteIcon sx={{ mr: 1, color: 'warning.main' }} />
          {t('waste_analytics_dashboard')}
        </Typography>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('timeframe')}</InputLabel>
          <Select value={timeframe} label={t('timeframe')} onChange={e => setTimeframe(e.target.value as 'month' | 'quarter')}>
            <MuiMenuItem value="month">{t('last_month')}</MuiMenuItem>
            <MuiMenuItem value="quarter">{t('last_quarter')}</MuiMenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Debug Info - Remove after testing */}
      {simpleWasteValue > 0 && analytics.totalWasteValue === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">{t('debug_direct_calculation')}</Typography>
          {t('simple_waste_value')}: {formatCurrency(simpleWasteValue)} |{t('items_with_waste')}: {itemsWithDirectWaste.length} |{t('analytics_total')}: {formatCurrency(analytics.totalWasteValue)}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error">
                {t('total_waste_value')}
              </Typography>
              <Typography variant="h4">{formatCurrency(analytics.totalWasteValue > 0 ? analytics.totalWasteValue : simpleWasteValue)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {timeframe === 'month' ? t('this_month_wa') : t('this_quarter')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {t('monthly_expense_label')}
              </Typography>
              <Typography variant="h4">{formatCurrency(analytics.monthlyWasteExpense > 0 ? analytics.monthlyWasteExpense : simpleWasteValue)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('projected_monthly_cost')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {t('efficiency_rate')}
              </Typography>
              <Typography variant="h4">{analytics.wasteEfficiencyRate.toFixed(1)}%</Typography>
              <LinearProgress variant="determinate" value={analytics.wasteEfficiencyRate} color="success" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {t('annual_projection')}
              </Typography>
              <Typography variant="h4">{formatCurrency(analytics.projectedAnnualWaste)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('estimated_yearly_waste')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Waste by Category */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('waste_by_category')}
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(analytics.wasteByCategory).map(([category, value]) => (
              <Grid item xs={12} sm={6} md={4} key={category}>
                <Box sx={{ p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                  <Typography variant="subtitle1">{category}</Typography>
                  <Typography variant="h6" color="warning.main">
                    {formatCurrency(value)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {((value / analytics.totalWasteValue) * 100).toFixed(1)}
                    {t('of_total')}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* High-Impact Waste Items */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('highest_waste_items')}
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('item_name')}</TableCell>
                  <TableCell>{t('category')}</TableCell>
                  <TableCell align="right">{t('disposed_qty')}</TableCell>
                  <TableCell align="right">{t('waste_rate')}</TableCell>
                  <TableCell align="right">{t('waste_value')}</TableCell>
                  <TableCell>{t('status_label')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics.wasteRateByItem
                  .filter(item => item.wasteValue > 0)
                  .sort((a, b) => b.wasteValue - a.wasteValue)
                  .slice(0, 10)
                  .map(item => (
                    <TableRow key={item.inventoryItemId}>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell align="right">
                        {item.disposedQuantity.toFixed(2)} {item.unit}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {item.wasteRate.toFixed(1)}%
                          </Typography>
                          <LinearProgress variant="determinate" value={Math.min(item.wasteRate, 100)} color={getWasteColor(item.wasteRate) as any} sx={{ width: 60 }} />
                        </Box>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(item.wasteValue)}</TableCell>
                      <TableCell>
                        <Chip label={item.wasteRate > 15 ? t('high') : item.wasteRate > 8 ? t('medium') : t('low')} color={getWasteColor(item.wasteRate) as any} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {analytics.recommendations.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <RecommendationIcon sx={{ mr: 1, color: 'info.main' }} />
              {t('waste_reduction_recommendations')}
            </Typography>
            <List>
              {analytics.recommendations.map((rec, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <Chip label={rec.priority.toUpperCase()} color={getPriorityColor(rec.priority) as any} size="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">{rec.itemName}</Typography>
                        <Typography variant="h6" color="success.main">
                          {t('save_amount', { amount: formatCurrency(rec.potentialSavings) })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {rec.description}
                        </Typography>
                        {rec.currentWasteRate > 0 && (
                          <Typography variant="caption" color="warning.main">
                            {t('current_waste_rate')}: {rec.currentWasteRate.toFixed(1)}%
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Show simple waste breakdown when complex analytics don't work but we have direct waste data */}
      {itemsWithDirectWaste.length > 0 && analytics.totalWasteValue === 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('items_with_waste_direct')}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('item_name')}</TableCell>
                    <TableCell>{t('category')}</TableCell>
                    <TableCell align="right">{t('disposed_qty')}</TableCell>
                    <TableCell align="right">{t('cost_per_unit')}</TableCell>
                    <TableCell align="right">{t('waste_value')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itemsWithDirectWaste.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell align="right">
                        {item.disposedQuantity?.toFixed(2)} {item.unit}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(item.costPerUnit)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'error.main' }}>
                          {formatCurrency((item.disposedQuantity || 0) * item.costPerUnit)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Show message when no waste data is available */}
      {!hasWasteData && itemsWithDirectWaste.length === 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <WasteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('no_waste_data')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('start_tracking_waste_help')}
            </Typography>
            <Typography variant="body2" color="info.main">
              💡 {t('tip_track_disposed')}
            </Typography>
          </CardContent>
        </Card>
      )}

      {analytics.averageWastePercentage > 15 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="subtitle2">{t('high_waste_alert')}</Typography>
          {t('high_waste_alert_message', { percent: analytics.averageWastePercentage.toFixed(1) })}
        </Alert>
      )}
    </Box>
  )
}
