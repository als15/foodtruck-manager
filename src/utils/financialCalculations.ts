import { Expense, FinancialProjection } from '../types';

export interface FinancialInsights {
  monthlyBurnRate: number;
  dailyBurnRate: number;
  breakEvenRevenue: number;
  breakEvenOrders: number;
  runwayMonths: number;
  profitMargin: number;
  roi: number;
}

export interface ExpenseSummary {
  totalFixed: number;
  totalVariable: number;
  totalOneTime: number;
  monthlyTotal: number;
  largestExpense: Expense | null;
  expensesByCategory: { [key: string]: number };
}

export class FinancialCalculator {
  
  /**
   * Calculate monthly expenses from all expense records
   */
  static calculateMonthlyExpenses(expenses: Expense[]): number {
    return expenses.reduce((total, expense) => {
      if (!expense.isActive) return total;
      
      switch (expense.frequency) {
        case 'daily':
          return total + (expense.amount * 30.44); // Average days per month
        case 'weekly':
          return total + (expense.amount * 4.33); // Average weeks per month
        case 'monthly':
          return total + expense.amount;
        case 'yearly':
          return total + (expense.amount / 12);
        case 'one_time':
          return total; // Don't include one-time in monthly calculation
        default:
          return total;
      }
    }, 0);
  }

  /**
   * Calculate break-even point in orders
   */
  static calculateBreakEvenOrders(
    monthlyExpenses: number, 
    averageOrderValue: number, 
    profitMarginPercent: number = 65
  ): number {
    if (averageOrderValue <= 0) return 0;
    
    const profitPerOrder = averageOrderValue * (profitMarginPercent / 100);
    if (profitPerOrder <= 0) return 0;
    
    return Math.ceil(monthlyExpenses / profitPerOrder);
  }

  /**
   * Calculate comprehensive expense summary
   */
  static getExpenseSummary(expenses: Expense[]): ExpenseSummary {
    const activeExpenses = expenses.filter(e => e.isActive);
    
    const summary: ExpenseSummary = {
      totalFixed: 0,
      totalVariable: 0,
      totalOneTime: 0,
      monthlyTotal: 0,
      largestExpense: null,
      expensesByCategory: {}
    };

    let largestMonthlyAmount = 0;

    activeExpenses.forEach(expense => {
      // Calculate monthly equivalent
      let monthlyAmount = 0;
      switch (expense.frequency) {
        case 'daily':
          monthlyAmount = expense.amount * 30.44;
          break;
        case 'weekly':
          monthlyAmount = expense.amount * 4.33;
          break;
        case 'monthly':
          monthlyAmount = expense.amount;
          break;
        case 'yearly':
          monthlyAmount = expense.amount / 12;
          break;
        case 'one_time':
          monthlyAmount = 0; // One-time expenses don't contribute to monthly
          break;
      }

      // Track by type
      switch (expense.type) {
        case 'fixed':
          summary.totalFixed += monthlyAmount;
          break;
        case 'variable':
          summary.totalVariable += monthlyAmount;
          break;
        case 'one_time':
          summary.totalOneTime += expense.amount; // Keep actual amount for one-time
          break;
      }

      summary.monthlyTotal += monthlyAmount;

      // Track largest expense
      if (monthlyAmount > largestMonthlyAmount) {
        largestMonthlyAmount = monthlyAmount;
        summary.largestExpense = expense;
      }

      // Track by category (simplified - using expense name as category for now)
      const category = expense.name.split(' ')[0]; // Simple categorization
      summary.expensesByCategory[category] = (summary.expensesByCategory[category] || 0) + monthlyAmount;
    });

    return summary;
  }

  /**
   * Calculate financial insights
   */
  static calculateInsights(
    expenses: Expense[], 
    projectedMonthlyRevenue: number = 0,
    currentCash: number = 0,
    averageOrderValue: number = 15
  ): FinancialInsights {
    const monthlyExpenses = this.calculateMonthlyExpenses(expenses);
    const dailyBurnRate = monthlyExpenses / 30.44;
    const breakEvenOrders = this.calculateBreakEvenOrders(monthlyExpenses, averageOrderValue);
    const breakEvenRevenue = breakEvenOrders * averageOrderValue;
    
    // Calculate runway (how many months current cash will last)
    const runwayMonths = currentCash > 0 && monthlyExpenses > 0 
      ? currentCash / monthlyExpenses 
      : 0;

    // Calculate profit margin
    const profitMargin = projectedMonthlyRevenue > 0 
      ? ((projectedMonthlyRevenue - monthlyExpenses) / projectedMonthlyRevenue) * 100
      : 0;

    // Simple ROI calculation (monthly profit / monthly expenses * 100)
    const roi = monthlyExpenses > 0 && projectedMonthlyRevenue > monthlyExpenses
      ? ((projectedMonthlyRevenue - monthlyExpenses) / monthlyExpenses) * 100
      : 0;

    return {
      monthlyBurnRate: monthlyExpenses,
      dailyBurnRate,
      breakEvenRevenue,
      breakEvenOrders,
      runwayMonths,
      profitMargin,
      roi
    };
  }

  /**
   * Calculate projection scenarios (optimistic, realistic, pessimistic)
   */
  static calculateScenarios(baseProjection: FinancialProjection) {
    const scenarios = {
      pessimistic: {
        ...baseProjection,
        projectedRevenue: baseProjection.projectedRevenue * 0.7, // 30% less
        ordersPerDay: Math.floor(baseProjection.ordersPerDay * 0.7),
        profitMarginPercentage: baseProjection.profitMarginPercentage * 0.8 // 20% less margin
      },
      realistic: baseProjection,
      optimistic: {
        ...baseProjection,
        projectedRevenue: baseProjection.projectedRevenue * 1.3, // 30% more
        ordersPerDay: Math.floor(baseProjection.ordersPerDay * 1.3),
        profitMarginPercentage: Math.min(baseProjection.profitMarginPercentage * 1.2, 100) // 20% more margin, max 100%
      }
    };

    // Recalculate profit for each scenario
    Object.keys(scenarios).forEach(key => {
      const scenario = scenarios[key as keyof typeof scenarios];
      scenario.projectedProfit = scenario.projectedRevenue - scenario.projectedExpenses;
      scenario.profitMarginPercentage = scenario.projectedRevenue > 0 
        ? (scenario.projectedProfit / scenario.projectedRevenue) * 100 
        : 0;
    });

    return scenarios;
  }

  /**
   * Calculate food truck specific metrics
   */
  static calculateFoodTruckMetrics(
    expenses: Expense[],
    averageOrderValue: number,
    workingDaysPerMonth: number = 22,
    averageCustomersPerHour: number = 10,
    operatingHoursPerDay: number = 8
  ) {
    const monthlyExpenses = this.calculateMonthlyExpenses(expenses);
    
    // Food truck specific calculations
    const costPerDay = monthlyExpenses / workingDaysPerMonth;
    const costPerHour = costPerDay / operatingHoursPerDay;
    const costPerCustomer = costPerHour / averageCustomersPerHour;
    
    // Required metrics to break even
    const requiredRevenuePerDay = costPerDay;
    const requiredOrdersPerDay = Math.ceil(requiredRevenuePerDay / averageOrderValue);
    const requiredCustomersPerHour = Math.ceil(requiredOrdersPerDay / operatingHoursPerDay);
    
    // Profit margins at different order volumes
    const profitAt50Orders = (50 * averageOrderValue * 0.65) - costPerDay;
    const profitAt100Orders = (100 * averageOrderValue * 0.65) - costPerDay;
    const profitAt150Orders = (150 * averageOrderValue * 0.65) - costPerDay;

    return {
      costPerDay,
      costPerHour,
      costPerCustomer,
      requiredRevenuePerDay,
      requiredOrdersPerDay,
      requiredCustomersPerHour,
      profitScenarios: {
        at50Orders: profitAt50Orders,
        at100Orders: profitAt100Orders,
        at150Orders: profitAt150Orders
      }
    };
  }
}

/**
 * Utility functions for financial formatting
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`;
};

export const getFinancialHealth = (profitMargin: number): {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  color: string;
  message: string;
} => {
  if (profitMargin >= 30) {
    return {
      status: 'excellent',
      color: '#4caf50',
      message: 'Excellent profit margins! Your business is very healthy.'
    };
  } else if (profitMargin >= 20) {
    return {
      status: 'good',
      color: '#8bc34a',
      message: 'Good profit margins. Your business is performing well.'
    };
  } else if (profitMargin >= 10) {
    return {
      status: 'fair',
      color: '#ff9800',
      message: 'Fair profit margins. Consider optimizing costs or increasing prices.'
    };
  } else if (profitMargin >= 0) {
    return {
      status: 'poor',
      color: '#ff5722',
      message: 'Low profit margins. Focus on cost reduction and efficiency.'
    };
  } else {
    return {
      status: 'critical',
      color: '#f44336',
      message: 'Operating at a loss. Immediate action required!'
    };
  }
};