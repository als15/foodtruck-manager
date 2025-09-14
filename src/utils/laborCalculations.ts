import { Employee, Shift, LaborCost, LaborProjection } from '../types';

export interface LaborCostSummary {
  totalWeeklyCost: number;
  totalMonthlyCost: number;
  totalYearlyCost: number;
  averageHourlyRate: number;
  totalWeeklyHours: number;
  overtimeHours: number;
  regularHours: number;
  laborCostPerHour: number;
  employerTaxes: number;
  benefits: number;
  costByEmployee: { [employeeId: string]: number };
  costByPosition: { [position: string]: number };
}

export interface LaborEfficiencyMetrics {
  salesPerLaborHour: number;
  laborCostPercentage: number;
  averageOrdersPerEmployee: number;
  peakHourCoverage: number;
  productivityScore: number;
}

export class LaborCalculator {
  
  // Standard rates for calculations
  static readonly OVERTIME_MULTIPLIER = 1.5;
  static readonly EMPLOYER_TAX_RATE = 0.0765; // Social Security + Medicare (7.65%)
  static readonly UNEMPLOYMENT_TAX_RATE = 0.006; // FUTA (0.6%)
  static readonly WORKERS_COMP_RATE = 0.02; // Approximate 2% for restaurant industry
  static readonly BENEFITS_PERCENTAGE = 0.15; // Approximate 15% for basic benefits

  /**
   * Calculate labor costs from shifts for a given period
   */
  static calculateLaborCosts(
    employees: Employee[], 
    shifts: Shift[], 
    startDate: Date, 
    endDate: Date
  ): LaborCostSummary {
    const periodShifts = shifts.filter(shift => 
      shift.date >= startDate && shift.date <= endDate
    );

    const summary: LaborCostSummary = {
      totalWeeklyCost: 0,
      totalMonthlyCost: 0,
      totalYearlyCost: 0,
      averageHourlyRate: 0,
      totalWeeklyHours: 0,
      overtimeHours: 0,
      regularHours: 0,
      laborCostPerHour: 0,
      employerTaxes: 0,
      benefits: 0,
      costByEmployee: {},
      costByPosition: {}
    };

    const employeeMap = new Map(employees.map(emp => [emp.id, emp]));
    let totalWages = 0;
    let totalHours = 0;
    const employeeHours = new Map<string, number>();

    // Calculate hours and wages by employee
    periodShifts.forEach(shift => {
      const employee = employeeMap.get(shift.employeeId);
      if (!employee) return;

      const hours = shift.hoursWorked;
      const employeeWeeklyHours = employeeHours.get(shift.employeeId) || 0;
      employeeHours.set(shift.employeeId, employeeWeeklyHours + hours);

      totalHours += hours;
      
      // Calculate regular vs overtime hours
      const overtimeThreshold = 40; // Federal overtime threshold
      const currentWeeklyHours = employeeWeeklyHours + hours;
      
      let regularHours = hours;
      let overtimeHours = 0;
      
      if (currentWeeklyHours > overtimeThreshold) {
        const overtimeStart = Math.max(0, employeeWeeklyHours - overtimeThreshold);
        overtimeHours = Math.min(hours, currentWeeklyHours - overtimeThreshold + overtimeStart);
        regularHours = hours - overtimeHours;
      }

      const regularWage = regularHours * employee.hourlyRate;
      const overtimeWage = overtimeHours * employee.hourlyRate * this.OVERTIME_MULTIPLIER;
      const totalWage = regularWage + overtimeWage;

      totalWages += totalWage;
      summary.regularHours += regularHours;
      summary.overtimeHours += overtimeHours;

      // Track by employee
      summary.costByEmployee[shift.employeeId] = 
        (summary.costByEmployee[shift.employeeId] || 0) + totalWage;

      // Track by position
      summary.costByPosition[employee.position] = 
        (summary.costByPosition[employee.position] || 0) + totalWage;
    });

    // Calculate employer costs
    const employerTaxes = totalWages * (this.EMPLOYER_TAX_RATE + this.UNEMPLOYMENT_TAX_RATE + this.WORKERS_COMP_RATE);
    const benefits = totalWages * this.BENEFITS_PERCENTAGE;
    const totalLaborCost = totalWages + employerTaxes + benefits;

    // Calculate period-specific costs
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksInPeriod = daysInPeriod / 7;
    
    summary.totalWeeklyCost = totalLaborCost / weeksInPeriod;
    summary.totalMonthlyCost = summary.totalWeeklyCost * 4.33; // Average weeks per month
    summary.totalYearlyCost = summary.totalWeeklyCost * 52;
    summary.averageHourlyRate = totalHours > 0 ? totalWages / totalHours : 0;
    summary.totalWeeklyHours = totalHours / weeksInPeriod;
    summary.laborCostPerHour = totalHours > 0 ? totalLaborCost / totalHours : 0;
    summary.employerTaxes = employerTaxes;
    summary.benefits = benefits;

    return summary;
  }

  /**
   * Calculate labor efficiency metrics
   */
  static calculateLaborEfficiency(
    laborCosts: LaborCostSummary,
    totalRevenue: number,
    totalOrders: number,
    totalSales: number
  ): LaborEfficiencyMetrics {
    const salesPerLaborHour = laborCosts.totalWeeklyHours > 0 
      ? totalSales / laborCosts.totalWeeklyHours 
      : 0;

    const laborCostPercentage = totalRevenue > 0 
      ? (laborCosts.totalWeeklyCost / totalRevenue) * 100 
      : 0;

    const averageOrdersPerEmployee = Object.keys(laborCosts.costByEmployee).length > 0 
      ? totalOrders / Object.keys(laborCosts.costByEmployee).length 
      : 0;

    // Calculate productivity score (higher is better)
    const productivityScore = salesPerLaborHour > 0 && laborCostPercentage > 0 
      ? (salesPerLaborHour / laborCostPercentage) * 10 
      : 0;

    return {
      salesPerLaborHour,
      laborCostPercentage,
      averageOrdersPerEmployee,
      peakHourCoverage: 0, // Would need shift timing analysis
      productivityScore
    };
  }

  /**
   * Project future labor costs based on business projections
   */
  static projectLaborCosts(
    currentEmployees: Employee[],
    projectedWeeklyHours: number,
    projectedRevenue: number,
    targetLaborPercentage: number = 25 // Industry standard 25-30%
  ): LaborProjection {
    const averageWage = currentEmployees.length > 0 
      ? currentEmployees.reduce((sum, emp) => sum + emp.hourlyRate, 0) / currentEmployees.length 
      : 15; // Default minimum wage

    const targetLaborCost = projectedRevenue * (targetLaborPercentage / 100);
    const maxAffordableHours = targetLaborCost / (averageWage * 1.3); // Including employer costs

    const projectedLaborCost = projectedWeeklyHours * averageWage;
    const projectedOvertimeCost = Math.max(0, (projectedWeeklyHours - 40) * averageWage * 0.5);
    const projectedBenefitsCost = projectedLaborCost * this.BENEFITS_PERCENTAGE;
    const totalProjectedCost = projectedLaborCost + projectedOvertimeCost + projectedBenefitsCost;

    return {
      id: Date.now().toString(),
      name: `Labor Projection ${new Date().toISOString().split('T')[0]}`,
      projectionPeriod: 'weekly',
      averageHoursPerEmployee: projectedWeeklyHours / Math.max(currentEmployees.length, 1),
      averageWage,
      employeeCount: currentEmployees.length,
      projectedLaborCost,
      projectedOvertimeCost,
      projectedBenefitsCost,
      totalProjectedCost,
      laborCostPercentage: projectedRevenue > 0 ? (totalProjectedCost / projectedRevenue) * 100 : 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Calculate optimal staffing levels
   */
  static calculateOptimalStaffing(
    projectedOrdersPerHour: number,
    averageOrderTime: number = 3, // minutes per order
    shiftLength: number = 8, // hours
    efficiencyFactor: number = 0.8 // Account for breaks, setup, etc.
  ) {
    const ordersPerShift = projectedOrdersPerHour * shiftLength;
    const totalTimeNeeded = ordersPerShift * averageOrderTime; // in minutes
    const availableTimePerEmployee = shiftLength * 60 * efficiencyFactor; // in minutes

    const requiredEmployees = Math.ceil(totalTimeNeeded / availableTimePerEmployee);
    
    return {
      recommendedStaffing: requiredEmployees,
      ordersPerShift,
      utilizationRate: (totalTimeNeeded / (availableTimePerEmployee * requiredEmployees)) * 100,
      costPerOrder: 0 // Would be calculated with wage data
    };
  }

  /**
   * Generate labor cost insights and recommendations
   */
  static generateLaborInsights(
    laborCosts: LaborCostSummary,
    efficiency: LaborEfficiencyMetrics,
    industryBenchmarks = {
      laborPercentage: 28,
      salesPerLaborHour: 45,
      averageWage: 16
    }
  ) {
    const insights = [];
    const recommendations = [];

    // Labor percentage analysis
    if (efficiency.laborCostPercentage > industryBenchmarks.laborPercentage + 5) {
      insights.push('Labor costs are significantly above industry average');
      recommendations.push('Consider optimizing schedules or cross-training employees');
    } else if (efficiency.laborCostPercentage < industryBenchmarks.laborPercentage - 5) {
      insights.push('Labor costs are well below industry average - good efficiency!');
    }

    // Productivity analysis
    if (efficiency.salesPerLaborHour < industryBenchmarks.salesPerLaborHour) {
      insights.push('Employee productivity could be improved');
      recommendations.push('Consider implementing productivity incentives or better training');
    }

    // Overtime analysis
    if (laborCosts.overtimeHours > laborCosts.regularHours * 0.1) {
      insights.push('High overtime costs detected');
      recommendations.push('Consider hiring additional part-time staff to reduce overtime');
    }

    // Wage competitiveness
    if (laborCosts.averageHourlyRate < industryBenchmarks.averageWage) {
      insights.push('Wages are below market rate - may affect retention');
      recommendations.push('Consider wage increases to improve retention and attract better talent');
    }

    return {
      insights,
      recommendations,
      score: efficiency.productivityScore,
      status: efficiency.laborCostPercentage <= industryBenchmarks.laborPercentage ? 'good' : 'needs_attention'
    };
  }
}

/**
 * Utility functions for labor cost formatting
 */
export const formatLaborCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
};