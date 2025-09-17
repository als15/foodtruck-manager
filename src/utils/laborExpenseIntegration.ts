import { Expense, Employee, Shift } from '../types';
import { LaborCalculator } from './laborCalculations';

/**
 * Utility to automatically create labor expense entries from employee data
 */
export class LaborExpenseIntegration {
  
  /**
   * Create a labor expense entry based on employee and shift data
   */
  static createLaborExpense(
    employees: Employee[],
    shifts: Shift[],
    periodStart: Date,
    periodEnd: Date
  ): Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'businessId'> {
    const laborCosts = LaborCalculator.calculateLaborCosts(
      employees, 
      shifts, 
      periodStart, 
      periodEnd
    );

    return {
      categoryId: null,
      name: 'Labor Costs (Auto-calculated)',
      amount: laborCosts.totalMonthlyCost,
      type: 'variable', // Labor is typically variable based on hours worked
      frequency: 'monthly',
      startDate: new Date(),
      description: `Automatically calculated labor costs including wages, taxes, and benefits. Employees: ${employees.length}, Total Hours: ${laborCosts.totalWeeklyHours.toFixed(1)}/week`,
      isActive: true
    };
  }

  /**
   * Create individual expense entries for each employee
   */
  static createEmployeeExpenses(
    employees: Employee[],
    shifts: Shift[],
    periodStart: Date,
    periodEnd: Date
  ): Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'businessId'>[] {
    const laborCosts = LaborCalculator.calculateLaborCosts(
      employees, 
      shifts, 
      periodStart, 
      periodEnd
    );

    return employees.map(employee => {
      const employeeCost = laborCosts.costByEmployee[employee.id] || 0;
      const monthlyCost = employeeCost * 4.33; // Convert weekly to monthly

      return {
        categoryId: null,
        name: `${employee.firstName} ${employee.lastName} - Labor`,
        amount: monthlyCost,
        type: 'variable',
        frequency: 'monthly',
        startDate: new Date(),
        description: `Labor costs for ${employee.position} at $${employee.hourlyRate}/hour`,
        isActive: employee.isActive
      };
    });
  }

  /**
   * Calculate the total labor cost percentage of revenue
   */
  static calculateLaborPercentage(
    laborCost: number,
    revenue: number
  ): number {
    if (revenue <= 0) return 0;
    return (laborCost / revenue) * 100;
  }

  /**
   * Suggest optimal labor allocation based on revenue targets
   */
  static suggestLaborOptimization(
    targetRevenue: number,
    currentLaborCost: number,
    targetLaborPercentage: number = 28 // Industry standard
  ) {
    const targetLaborCost = targetRevenue * (targetLaborPercentage / 100);
    const difference = currentLaborCost - targetLaborCost;
    const currentPercentage = this.calculateLaborPercentage(currentLaborCost, targetRevenue);

    const suggestions = [];

    if (difference > 0) {
      // Labor cost is too high
      suggestions.push({
        type: 'reduce',
        message: `Labor cost is ${Math.abs(difference).toFixed(2)} over target`,
        recommendation: 'Consider reducing hours or optimizing schedules'
      });
    } else if (difference < -500) {
      // Labor cost might be too low (understaffed)
      suggestions.push({
        type: 'increase',
        message: `Labor cost is ${Math.abs(difference).toFixed(2)} under target`,
        recommendation: 'Consider hiring additional staff or increasing hours'
      });
    } else {
      suggestions.push({
        type: 'optimal',
        message: 'Labor costs are within optimal range',
        recommendation: 'Current staffing levels appear appropriate'
      });
    }

    return {
      currentPercentage,
      targetPercentage: targetLaborPercentage,
      difference,
      suggestions
    };
  }

  /**
   * Generate weekly labor schedule recommendations
   */
  static generateScheduleRecommendations(
    targetWeeklyRevenue: number,
    averageOrderValue: number,
    peakHours: { start: string; end: string; multiplier: number }[] = [
      { start: '11:00', end: '14:00', multiplier: 2.0 }, // Lunch rush
      { start: '17:00', end: '20:00', multiplier: 1.8 }  // Dinner rush
    ]
  ) {
    const targetOrders = targetWeeklyRevenue / averageOrderValue;
    const ordersPerDay = targetOrders / 7;

    const recommendations = {
      minimumStaff: Math.ceil(ordersPerDay / 50), // Assuming 50 orders per employee per day
      peakStaff: Math.ceil(ordersPerDay / 30),     // More staff during peak hours
      totalWeeklyHours: 0,
      schedule: [] as any[]
    };

    // Calculate hours for each day
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    daysOfWeek.forEach(day => {
      const isWeekend = day === 'Saturday' || day === 'Sunday';
      const expectedOrders = isWeekend ? ordersPerDay * 1.3 : ordersPerDay * 0.9;
      
      recommendations.schedule.push({
        day,
        expectedOrders: Math.round(expectedOrders),
        recommendedStaff: Math.max(1, Math.ceil(expectedOrders / 40)),
        estimatedHours: isWeekend ? 10 : 8
      });
    });

    recommendations.totalWeeklyHours = recommendations.schedule.reduce(
      (total, day) => total + (day.estimatedHours * day.recommendedStaff), 
      0
    );

    return recommendations;
  }
}