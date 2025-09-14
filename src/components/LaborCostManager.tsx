import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Group as TeamIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { Employee, Shift, LaborProjection } from '../types';
import { 
  LaborCalculator, 
  LaborCostSummary, 
  LaborEfficiencyMetrics,
  formatLaborCurrency,
  formatHours 
} from '../utils/laborCalculations';

interface LaborCostManagerProps {
  employees: Employee[];
  shifts: Shift[];
  weeklyRevenue?: number;
  weeklyOrders?: number;
  onLaborCostUpdate?: (monthlyCost: number) => void;
}

export default function LaborCostManager({ 
  employees, 
  shifts, 
  weeklyRevenue = 0, 
  weeklyOrders = 0,
  onLaborCostUpdate 
}: LaborCostManagerProps) {
  const [laborCosts, setLaborCosts] = useState<LaborCostSummary | null>(null);
  const [efficiency, setEfficiency] = useState<LaborEfficiencyMetrics | null>(null);
  const [openProjectionDialog, setOpenProjectionDialog] = useState(false);
  const [projectedHours, setProjectedHours] = useState(160); // Default 40 hours/week for 4 employees
  const [projectedRevenue, setProjectedRevenue] = useState(weeklyRevenue);

  useEffect(() => {
    calculateLaborMetrics();
  }, [employees, shifts, weeklyRevenue, weeklyOrders]);

  useEffect(() => {
    if (laborCosts && onLaborCostUpdate) {
      onLaborCostUpdate(laborCosts.totalMonthlyCost);
    }
  }, [laborCosts, onLaborCostUpdate]);

  const calculateLaborMetrics = () => {
    if (employees.length === 0) return;

    // Calculate for the last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    const costs = LaborCalculator.calculateLaborCosts(employees, shifts, startDate, endDate);
    const eff = LaborCalculator.calculateLaborEfficiency(costs, weeklyRevenue, weeklyOrders, weeklyRevenue);

    setLaborCosts(costs);
    setEfficiency(eff);
  };

  const createLaborProjection = () => {
    const projection = LaborCalculator.projectLaborCosts(
      employees,
      projectedHours,
      projectedRevenue
    );
    
    setOpenProjectionDialog(false);
    
    // Here you would typically save the projection to the database
    console.log('Labor Projection Created:', projection);
  };

  const getLaborHealthColor = (percentage: number) => {
    if (percentage <= 25) return 'success';
    if (percentage <= 30) return 'warning';
    return 'error';
  };

  const getEfficiencyStatus = (score: number) => {
    if (score >= 8) return { label: 'Excellent', color: 'success' };
    if (score >= 6) return { label: 'Good', color: 'info' };
    if (score >= 4) return { label: 'Fair', color: 'warning' };
    return { label: 'Poor', color: 'error' };
  };

  if (!laborCosts || !efficiency) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Labor Cost Analysis
          </Typography>
          <Alert severity="info">
            Add employees and shifts to see labor cost analysis
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const insights = LaborCalculator.generateLaborInsights(laborCosts, efficiency);
  const efficiencyStatus = getEfficiencyStatus(efficiency.productivityScore);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Labor Cost Management</Typography>
        <Button
          variant="outlined"
          onClick={() => setOpenProjectionDialog(true)}
          startIcon={<TrendingUpIcon />}
        >
          Create Projection
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
                  Monthly Labor Cost
                </Typography>
              </Box>
              <Typography variant="h4">
                {formatLaborCurrency(laborCosts.totalMonthlyCost)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Including taxes & benefits
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
                  Labor Percentage
                </Typography>
              </Box>
              <Typography variant="h4">
                {efficiency.laborCostPercentage.toFixed(1)}%
              </Typography>
              <Chip 
                label={efficiency.laborCostPercentage <= 30 ? 'Healthy' : 'High'} 
                color={getLaborHealthColor(efficiency.laborCostPercentage)}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TimerIcon color="success" />
                <Typography variant="h6" color="success">
                  Avg Hourly Rate
                </Typography>
              </Box>
              <Typography variant="h4">
                {formatLaborCurrency(laborCosts.averageHourlyRate)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatHours(laborCosts.totalWeeklyHours)} weekly hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon color="warning" />
                <Typography variant="h6" color="warning">
                  Efficiency Score
                </Typography>
              </Box>
              <Typography variant="h4">
                {efficiency.productivityScore.toFixed(1)}
              </Typography>
              <Chip 
                label={efficiencyStatus.label} 
                color={efficiencyStatus.color as any}
                size="small"
              />
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
                Labor Cost Breakdown
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Base Wages</Typography>
                  <Typography variant="body2">
                    {formatLaborCurrency(laborCosts.totalMonthlyCost - laborCosts.employerTaxes - laborCosts.benefits)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Employer Taxes</Typography>
                  <Typography variant="body2">
                    {formatLaborCurrency(laborCosts.employerTaxes)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Benefits</Typography>
                  <Typography variant="body2">
                    {formatLaborCurrency(laborCosts.benefits)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <Typography variant="body1">Total Monthly Cost</Typography>
                  <Typography variant="body1">
                    {formatLaborCurrency(laborCosts.totalMonthlyCost)}
                  </Typography>
                </Box>
              </Box>

              {laborCosts.overtimeHours > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {formatHours(laborCosts.overtimeHours)} of overtime detected. 
                  Consider hiring additional staff to reduce overtime costs.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Performance Metrics
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Sales per Labor Hour
                </Typography>
                <Typography variant="h6">
                  {formatLaborCurrency(efficiency.salesPerLaborHour)}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Orders per Employee
                </Typography>
                <Typography variant="h6">
                  {efficiency.averageOrdersPerEmployee.toFixed(1)}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Labor Cost per Hour
                </Typography>
                <Typography variant="h6">
                  {formatLaborCurrency(laborCosts.laborCostPerHour)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cost by Employee */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Labor Cost by Employee
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Hourly Rate</TableCell>
                  <TableCell>Weekly Cost</TableCell>
                  <TableCell>Monthly Cost</TableCell>
                  <TableCell>Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => {
                  const weeklyCost = laborCosts.costByEmployee[employee.id] || 0;
                  const monthlyCost = weeklyCost * 4.33;
                  const percentage = laborCosts.totalMonthlyCost > 0 
                    ? (monthlyCost / laborCosts.totalMonthlyCost) * 100 
                    : 0;
                  
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
                          <LinearProgress 
                            variant="determinate" 
                            value={percentage} 
                            sx={{ width: 60 }}
                          />
                          <Typography variant="body2">
                            {percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
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
              Insights & Recommendations
            </Typography>
            {insights.insights.map((insight, index) => (
              <Alert key={index} severity="info" sx={{ mb: 1 }}>
                {insight}
              </Alert>
            ))}
            {insights.recommendations.map((recommendation, index) => (
              <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                <strong>Recommendation:</strong> {recommendation}
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Labor Projection Dialog */}
      <Dialog open={openProjectionDialog} onClose={() => setOpenProjectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Labor Cost Projection</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Projected Weekly Hours"
                type="number"
                value={projectedHours}
                onChange={(e) => setProjectedHours(parseInt(e.target.value) || 0)}
                helperText="Total hours across all employees per week"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Projected Weekly Revenue"
                type="number"
                inputProps={{ step: "0.01" }}
                value={projectedRevenue}
                onChange={(e) => setProjectedRevenue(parseFloat(e.target.value) || 0)}
                helperText="Expected weekly revenue for labor percentage calculation"
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                Current team: {employees.length} employees<br/>
                Average wage: {formatLaborCurrency(laborCosts.averageHourlyRate)}<br/>
                Target labor percentage: 25-30% of revenue
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProjectionDialog(false)}>Cancel</Button>
          <Button onClick={createLaborProjection} variant="contained">
            Create Projection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}