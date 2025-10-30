import React, { useState, useEffect } from 'react'
import { Box, Typography, Grid, Card, CardContent, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, LinearProgress, Divider } from '@mui/material'
import { Group as TeamIcon, Schedule as ScheduleIcon, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, AttachMoney as MoneyIcon, Timer as TimerIcon } from '@mui/icons-material'
import { Employee, Shift, LaborProjection } from '../types'
import { LaborCalculator, LaborCostSummary, LaborEfficiencyMetrics, formatLaborCurrency, formatHours } from '../utils/laborCalculations'
import { useTranslation } from 'react-i18next'

interface LaborCostManagerProps {
  employees: Employee[]
  shifts: Shift[]
  weeklyRevenue?: number
  weeklyOrders?: number
  onLaborCostUpdate?: (monthlyCost: number) => void
}

export default function LaborCostManager({ employees, shifts, weeklyRevenue = 0, weeklyOrders = 0, onLaborCostUpdate }: LaborCostManagerProps) {
  const { t } = useTranslation()
  const [laborCosts, setLaborCosts] = useState<LaborCostSummary | null>(null)
  const [efficiency, setEfficiency] = useState<LaborEfficiencyMetrics | null>(null)
  const [openProjectionDialog, setOpenProjectionDialog] = useState(false)
  const [projectedHours, setProjectedHours] = useState(160) // Default 40 hours/week for 4 employees
  const [projectedRevenue, setProjectedRevenue] = useState(weeklyRevenue)

  useEffect(() => {
    calculateLaborMetrics()
  }, [employees, shifts, weeklyRevenue, weeklyOrders])

  useEffect(() => {
    if (laborCosts && onLaborCostUpdate) {
      onLaborCostUpdate(laborCosts.totalMonthlyCost)
    }
  }, [laborCosts, onLaborCostUpdate])

  const calculateLaborMetrics = () => {
    if (employees.length === 0) return

    // Calculate for the last 7 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 7)

    const costs = LaborCalculator.calculateLaborCosts(employees, shifts, startDate, endDate)
    const eff = LaborCalculator.calculateLaborEfficiency(costs, weeklyRevenue, weeklyOrders, weeklyRevenue)

    setLaborCosts(costs)
    setEfficiency(eff)
  }

  const createLaborProjection = () => {
    const projection = LaborCalculator.projectLaborCosts(employees, projectedHours, projectedRevenue)

    setOpenProjectionDialog(false)
  }

  const getLaborHealthColor = (percentage: number) => {
    if (percentage <= 25) return 'success'
    if (percentage <= 30) return 'warning'
    return 'error'
  }

  const getEfficiencyStatus = (score: number) => {
    if (score >= 8) return { label: 'Excellent', color: 'success' }
    if (score >= 6) return { label: 'Good', color: 'info' }
    if (score >= 4) return { label: 'Fair', color: 'warning' }
    return { label: 'Poor', color: 'error' }
  }

  if (!laborCosts || !efficiency) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('labor_cost_analysis')}
          </Typography>
          <Alert severity="info">{t('labor_cost_analysis_hint')}</Alert>
        </CardContent>
      </Card>
    )
  }

  const insights = LaborCalculator.generateLaborInsights(laborCosts, efficiency)
  const efficiencyStatus = getEfficiencyStatus(efficiency.productivityScore)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{t('labor_cost_management')}</Typography>
        <Button variant="outlined" onClick={() => setOpenProjectionDialog(true)} startIcon={<TrendingUpIcon />}>
          {t('create_labor_cost_projection')}
        </Button>
      </Box>

      {/* Labor Cost Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MoneyIcon color="primary" />
                <Typography variant="h6" color="primary">
                  {t('monthly_labor_cost')}
                </Typography>
              </Box>
              <Typography variant="h4">{formatLaborCurrency(laborCosts.totalMonthlyCost)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('including_taxes_benefits')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TeamIcon color="info" />
                <Typography variant="h6" color="info">
                  {t('labor_percentage')}
                </Typography>
              </Box>
              <Typography variant="h4">{efficiency.laborCostPercentage.toFixed(1)}%</Typography>
              <Chip label={efficiency.laborCostPercentage <= 30 ? t('healthy') : t('high')} color={getLaborHealthColor(efficiency.laborCostPercentage)} size="small" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TimerIcon color="success" />
                <Typography variant="h6" color="success">
                  {t('avg_hourly_rate')}
                </Typography>
              </Box>
              <Typography variant="h4">{formatLaborCurrency(laborCosts.averageHourlyRate)}</Typography>
              <Typography variant="caption" color="text.secondary">{`${formatHours(laborCosts.totalWeeklyHours)} ${t('weekly_hours')}`}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon color="warning" />
                <Typography variant="h6" color="warning">
                  {t('efficiency_score')}
                </Typography>
              </Box>
              <Typography variant="h4">{efficiency.productivityScore.toFixed(1)}</Typography>
              <Chip label={efficiencyStatus.label} color={efficiencyStatus.color as any} size="small" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Labor Insights */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('labor_cost_breakdown')}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{t('base_wages')}</Typography>
                  <Typography variant="body2">{formatLaborCurrency(laborCosts.totalMonthlyCost - laborCosts.employerTaxes - laborCosts.benefits)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{t('employer_taxes')}</Typography>
                  <Typography variant="body2">{formatLaborCurrency(laborCosts.employerTaxes)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{t('benefits')}</Typography>
                  <Typography variant="body2">{formatLaborCurrency(laborCosts.benefits)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <Typography variant="body1">{t('total_monthly_cost')}</Typography>
                  <Typography variant="body1">{formatLaborCurrency(laborCosts.totalMonthlyCost)}</Typography>
                </Box>
              </Box>

              {laborCosts.overtimeHours > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {t('overtime_detected_message', { hours: formatHours(laborCosts.overtimeHours) })}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('performance_metrics')}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('sales_per_labor_hour')}
                </Typography>
                <Typography variant="h6">{formatLaborCurrency(efficiency.salesPerLaborHour)}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('orders_per_employee')}
                </Typography>
                <Typography variant="h6">{efficiency.averageOrdersPerEmployee.toFixed(1)}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('labor_cost_per_hour')}
                </Typography>
                <Typography variant="h6">{formatLaborCurrency(laborCosts.laborCostPerHour)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cost by Employee */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('labor_cost_by_employee')}
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('employee')}</TableCell>
                  <TableCell>{t('position')}</TableCell>
                  <TableCell>{t('hourly_rate')}</TableCell>
                  <TableCell>{t('weekly_cost')}</TableCell>
                  <TableCell>{t('monthly_cost')}</TableCell>
                  <TableCell>{t('percentage_label')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map(employee => {
                  const weeklyCost = laborCosts.costByEmployee[employee.id] || 0
                  const monthlyCost = weeklyCost * 4.33
                  const percentage = laborCosts.totalMonthlyCost > 0 ? (monthlyCost / laborCosts.totalMonthlyCost) * 100 : 0

                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        {employee.firstName} {employee.lastName}
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{formatLaborCurrency(employee.hourlyRate)}</TableCell>
                      <TableCell>{formatLaborCurrency(weeklyCost)}</TableCell>
                      <TableCell>{formatLaborCurrency(monthlyCost)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={percentage} sx={{ width: 60 }} />
                          <Typography variant="body2">{percentage.toFixed(1)}%</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      {insights.insights.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('insights_recommendations')}
            </Typography>
            {insights.insights.map((insight, index) => (
              <Alert key={index} severity="info" sx={{ mb: 1 }}>
                {insight}
              </Alert>
            ))}
            {insights.recommendations.map((recommendation, index) => (
              <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                <strong>{t('recommendation_label')}</strong> {recommendation}
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Labor Projection Dialog */}
      <Dialog open={openProjectionDialog} onClose={() => setOpenProjectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('create_labor_cost_projection')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label={t('projected_weekly_hours')} type="number" value={projectedHours} onChange={e => setProjectedHours(parseInt(e.target.value) || 0)} helperText={t('projected_weekly_hours_help')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={t('projected_weekly_revenue')} type="number" inputProps={{ step: '0.01' }} value={projectedRevenue} onChange={e => setProjectedRevenue(parseFloat(e.target.value) || 0)} helperText={t('projected_weekly_revenue_help')} />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                {t('current_team_summary', { count: employees.length })}
                <br />
                {t('average_wage_label')}: {formatLaborCurrency(laborCosts.averageHourlyRate)}
                <br />
                {t('target_labor_percentage')}
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProjectionDialog(false)}>{t('cancel')}</Button>
          <Button onClick={createLaborProjection} variant="contained">
            {t('create_labor_cost_projection')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
