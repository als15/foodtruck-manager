import { WasteAnalytics } from '../services/wasteAnalyticsService'
import { expensesService, expenseCategoriesService } from '../services/supabaseService'

export interface WasteExpenseData {
  amount: number
  category: string
  description: string
  breakdown: { [category: string]: number }
}

class WasteExpenseIntegrationService {
  private readonly WASTE_EXPENSE_NAME = 'Food Waste (Auto-calculated)'
  private readonly WASTE_CATEGORY_NAME = 'Food & Ingredients'

  /**
   * Create or update waste expense entry in the financial system
   */
  async createOrUpdateWasteExpense(wasteExpenseData: WasteExpenseData): Promise<void> {
    try {
      // Find existing waste expense entry
      const existingExpenses = await expensesService.getAll()
      const existingWasteExpense = existingExpenses.find(exp => 
        exp.name === this.WASTE_EXPENSE_NAME || 
        exp.description?.includes('Auto-calculated waste')
      )

      // Get or create the Food & Ingredients category
      let categoryId: string | null = null
      try {
        const categories = await expenseCategoriesService.getAll()
        const wasteCategory = categories.find(cat => 
          cat.name === this.WASTE_CATEGORY_NAME || 
          cat.name.toLowerCase().includes('food')
        )
        categoryId = wasteCategory?.id || null
      } catch (error) {
        console.warn('Could not fetch expense categories for waste integration')
      }

      const expenseData = {
        categoryId,
        name: this.WASTE_EXPENSE_NAME,
        amount: wasteExpenseData.amount,
        type: 'variable' as const,
        frequency: 'monthly' as const,
        startDate: new Date(),
        description: this.generateWasteExpenseDescription(wasteExpenseData),
        isActive: true,
        metadata: {
          autoCalculated: true,
          wasteBreakdown: wasteExpenseData.breakdown,
          lastUpdated: new Date().toISOString(),
          source: 'waste_analytics'
        }
      }

      if (existingWasteExpense) {
        // Update existing expense
        await expensesService.update(existingWasteExpense.id, expenseData)
        console.log('Updated existing waste expense:', expenseData.amount)
      } else {
        // Create new expense entry
        await expensesService.create(expenseData)
        console.log('Created new waste expense:', expenseData.amount)
      }
    } catch (error) {
      console.error('Failed to integrate waste expense:', error)
      throw new Error('Failed to update waste expense in financial system')
    }
  }

  /**
   * Generate detailed description for waste expense
   */
  private generateWasteExpenseDescription(wasteExpenseData: WasteExpenseData): string {
    const breakdownText = Object.entries(wasteExpenseData.breakdown)
      .filter(([_, value]) => value > 0)
      .map(([category, value]) => `${category}: $${value.toFixed(2)}`)
      .join(', ')

    return `${wasteExpenseData.description}. Breakdown: ${breakdownText}. Auto-calculated based on disposed inventory and usage patterns.`
  }

  /**
   * Calculate waste expense impact on profitability
   */
  calculateWasteImpact(wasteAnalytics: WasteAnalytics, monthlyRevenue: number): {
    wastePercentageOfRevenue: number
    annualWasteImpact: number
    recommendations: string[]
  } {
    const wastePercentageOfRevenue = monthlyRevenue > 0 
      ? (wasteAnalytics.monthlyWasteExpense / monthlyRevenue) * 100 
      : 0

    const recommendations: string[] = []

    if (wastePercentageOfRevenue > 10) {
      recommendations.push('Critical: Waste exceeds 10% of revenue - immediate action required')
    } else if (wastePercentageOfRevenue > 5) {
      recommendations.push('High waste impact - implement waste reduction strategies')
    } else if (wastePercentageOfRevenue > 2) {
      recommendations.push('Moderate waste levels - monitor and optimize')
    } else {
      recommendations.push('Excellent waste control - maintain current practices')
    }

    if (wasteAnalytics.projectedAnnualWaste > 5000) {
      recommendations.push('Consider investing in better storage or inventory management systems')
    }

    return {
      wastePercentageOfRevenue,
      annualWasteImpact: wasteAnalytics.projectedAnnualWaste,
      recommendations
    }
  }

  /**
   * Get waste expense trends for financial reporting
   */
  async getWasteExpenseTrends(): Promise<{
    current: number
    previous: number
    trend: 'increasing' | 'decreasing' | 'stable'
    changePercentage: number
  }> {
    try {
      const expenses = await expensesService.getAll()
      const wasteExpenses = expenses
        .filter(exp => exp.name === this.WASTE_EXPENSE_NAME)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

      if (wasteExpenses.length < 2) {
        return {
          current: wasteExpenses[0]?.amount || 0,
          previous: 0,
          trend: 'stable',
          changePercentage: 0
        }
      }

      const current = wasteExpenses[0].amount
      const previous = wasteExpenses[1].amount
      const changePercentage = previous > 0 ? ((current - previous) / previous) * 100 : 0

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
      if (Math.abs(changePercentage) > 5) {
        trend = changePercentage > 0 ? 'increasing' : 'decreasing'
      }

      return {
        current,
        previous,
        trend,
        changePercentage
      }
    } catch (error) {
      console.error('Failed to get waste expense trends:', error)
      return { current: 0, previous: 0, trend: 'stable', changePercentage: 0 }
    }
  }

  /**
   * Check if waste expense should trigger alerts
   */
  shouldTriggerAlert(wasteExpenseData: WasteExpenseData, monthlyRevenue: number): {
    shouldAlert: boolean
    alertType: 'critical' | 'warning' | 'info'
    message: string
  } {
    const wastePercentage = monthlyRevenue > 0 
      ? (wasteExpenseData.amount / monthlyRevenue) * 100 
      : 0

    if (wastePercentage > 8) {
      return {
        shouldAlert: true,
        alertType: 'critical',
        message: `Waste expense (${wastePercentage.toFixed(1)}% of revenue) is critically high and requires immediate attention`
      }
    } else if (wastePercentage > 4) {
      return {
        shouldAlert: true,
        alertType: 'warning',
        message: `Waste expense (${wastePercentage.toFixed(1)}% of revenue) is above recommended levels`
      }
    } else if (wasteExpenseData.amount > 500) {
      return {
        shouldAlert: true,
        alertType: 'info',
        message: `Monthly waste expense of $${wasteExpenseData.amount.toFixed(2)} detected`
      }
    }

    return {
      shouldAlert: false,
      alertType: 'info',
      message: ''
    }
  }
}

export const wasteExpenseIntegration = new WasteExpenseIntegrationService()