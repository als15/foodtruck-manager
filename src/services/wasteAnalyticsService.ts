import { InventoryItem, Order, MenuItem, Ingredient } from '../types'

export interface WasteAnalytics {
  totalWasteValue: number
  monthlyWasteExpense: number
  wasteByCategory: { [category: string]: number }
  wasteEfficiencyRate: number
  averageWastePercentage: number
  projectedAnnualWaste: number
  wasteRateByItem: WasteRateItem[]
  recommendations: WasteRecommendation[]
}

export interface WasteRateItem {
  inventoryItemId: string
  itemName: string
  category: string
  theoreticalUsage: number // calculated from sales
  actualUsage: number // from inventory transactions
  disposedQuantity: number
  wasteRate: number // percentage
  wasteValue: number // cost impact
  unit: string
  recommendation: string
}

export interface WasteRecommendation {
  type: 'reduce_order' | 'adjust_portions' | 'improve_storage' | 'menu_optimization'
  itemName: string
  currentWasteRate: number
  potentialSavings: number
  description: string
  priority: 'high' | 'medium' | 'low'
  descriptionKey?: string
  descriptionArgs?: { [key: string]: string | number }
}

export interface SalesUsageData {
  itemId: string
  itemName: string
  totalSold: number
  ingredientUsage: { [ingredientId: string]: number }
}

class WasteAnalyticsService {
  /**
   * Calculate theoretical ingredient usage based on sales data
   */
  calculateTheoreticalUsage(orders: Order[], menuItems: MenuItem[], ingredients: Ingredient[], timeframe: 'week' | 'month' | 'quarter' = 'month'): SalesUsageData[] {
    const cutoffDate = new Date()
    switch (timeframe) {
      case 'week':
        cutoffDate.setDate(cutoffDate.getDate() - 7)
        break
      case 'month':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1)
        break
      case 'quarter':
        cutoffDate.setMonth(cutoffDate.getMonth() - 3)
        break
    }

    // Filter orders within timeframe
    const recentOrders = orders.filter(order => order.orderTime >= cutoffDate && order.status === 'completed')

    const usageMap = new Map<string, SalesUsageData>()

    recentOrders.forEach(order => {
      order.items.forEach(orderItem => {
        const menuItem = menuItems.find(mi => mi.id === orderItem.menuItemId)
        if (!menuItem || !menuItem.ingredients) return

        menuItem.ingredients.forEach(menuItemIngredient => {
          const totalUsed = menuItemIngredient.quantity * orderItem.quantity
          const key = menuItemIngredient.ingredientId
          const ingredient = ingredients.find(ing => ing.id === menuItemIngredient.ingredientId)

          if (!usageMap.has(key)) {
            usageMap.set(key, {
              itemId: key,
              itemName: ingredient?.name || 'Unknown',
              totalSold: 0,
              ingredientUsage: {}
            })
          }

          const existing = usageMap.get(key)!
          existing.totalSold += orderItem.quantity
          existing.ingredientUsage[key] = (existing.ingredientUsage[key] || 0) + totalUsed
        })
      })
    })

    return Array.from(usageMap.values())
  }

  /**
   * Calculate waste rates for each inventory item
   */
  calculateWasteRates(inventoryItems: InventoryItem[], salesUsage: SalesUsageData[], timeframe: 'month' | 'quarter' = 'month'): WasteRateItem[] {
    return inventoryItems.map(item => {
      const usage = salesUsage.find(s => s.itemId === item.ingredientId || s.itemName.toLowerCase() === item.name.toLowerCase())
      const theoreticalUsage = usage ? Object.values(usage.ingredientUsage).reduce((sum, val) => sum + val, 0) : 0

      // Get disposed quantity - this is the key metric for waste tracking
      const disposedQuantity = item.disposedQuantity || 0

      // If we have disposal data but no sales data, we still want to track waste
      // Estimate actual usage: if we have sales data use it, otherwise assume disposal represents waste
      const actualUsage = theoreticalUsage > 0 ? theoreticalUsage + disposedQuantity : Math.max(disposedQuantity, item.currentStock + disposedQuantity)

      // Calculate waste rate - if no sales data, assume 100% waste rate for disposed items
      const wasteRate = actualUsage > 0 ? (disposedQuantity / actualUsage) * 100 : disposedQuantity > 0 ? 100 : 0

      // Calculate waste value - this is the direct cost impact
      const wasteValue = disposedQuantity * item.costPerUnit

      console.log(`Item: ${item.name}, Disposed: ${disposedQuantity}, Cost: ${item.costPerUnit}, Waste Value: ${wasteValue}`)

      // Generate recommendation
      let recommendation = ''
      if (wasteRate > 20) {
        recommendation = 'High waste rate - consider reducing order quantities or improving storage'
      } else if (wasteRate > 10) {
        recommendation = 'Moderate waste - monitor closely and optimize portion sizes'
      } else if (wasteRate > 5) {
        recommendation = 'Normal waste levels - maintain current practices'
      } else {
        recommendation = 'Excellent efficiency - use as benchmark for other items'
      }

      return {
        inventoryItemId: item.id,
        itemName: item.name,
        category: item.category,
        theoreticalUsage,
        actualUsage,
        disposedQuantity,
        wasteRate,
        wasteValue,
        unit: item.unit,
        recommendation
      }
    })
  }

  /**
   * Generate waste recommendations based on analysis
   */
  generateRecommendations(wasteRates: WasteRateItem[]): WasteRecommendation[] {
    const recommendations: WasteRecommendation[] = []

    // High waste items
    wasteRates
      .filter(item => item.wasteRate > 15)
      .sort((a, b) => b.wasteValue - a.wasteValue)
      .slice(0, 5)
      .forEach(item => {
        recommendations.push({
          type: 'reduce_order',
          itemName: item.itemName,
          currentWasteRate: item.wasteRate,
          potentialSavings: item.wasteValue * 0.7, // Assume 70% reduction possible
          description: `Reduce order quantities for ${item.itemName} by 20-30% to minimize waste`,
          descriptionKey: 'wa_reduce_order_desc',
          descriptionArgs: { item: item.itemName },
          priority: item.wasteRate > 25 ? 'high' : 'medium'
        })
      })

    // Items with high value waste
    wasteRates
      .filter(item => item.wasteValue > 50) // Items with >$50 waste
      .sort((a, b) => b.wasteValue - a.wasteValue)
      .slice(0, 3)
      .forEach(item => {
        recommendations.push({
          type: 'improve_storage',
          itemName: item.itemName,
          currentWasteRate: item.wasteRate,
          potentialSavings: item.wasteValue * 0.5,
          description: `Improve storage conditions for ${item.itemName} to extend shelf life`,
          descriptionKey: 'wa_improve_storage_desc',
          descriptionArgs: { item: item.itemName },
          priority: 'high'
        })
      })

    // Category analysis for menu optimization
    const categoryWaste = wasteRates.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.wasteValue
      return acc
    }, {} as { [key: string]: number })

    Object.entries(categoryWaste)
      .filter(([_, value]) => value > 100)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 2)
      .forEach(([category, wasteValue]) => {
        recommendations.push({
          type: 'menu_optimization',
          itemName: category,
          currentWasteRate: 0,
          potentialSavings: wasteValue * 0.3,
          description: `Consider menu optimization for ${category} items to reduce overall waste`,
          descriptionKey: 'wa_menu_optimization_desc',
          descriptionArgs: { category },
          priority: 'medium'
        })
      })

    return recommendations
  }

  /**
   * Calculate comprehensive waste analytics
   */
  calculateWasteAnalytics(inventoryItems: InventoryItem[], orders: Order[], menuItems: MenuItem[], ingredients: Ingredient[], timeframe: 'month' | 'quarter' = 'month'): WasteAnalytics {
    const salesUsage = this.calculateTheoreticalUsage(orders, menuItems, ingredients, timeframe)
    const wasteRates = this.calculateWasteRates(inventoryItems, salesUsage, timeframe)

    const totalWasteValue = wasteRates.reduce((sum, item) => sum + item.wasteValue, 0)
    const wasteByCategory = wasteRates.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.wasteValue
      return acc
    }, {} as { [category: string]: number })

    const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + item.currentStock * item.costPerUnit, 0)

    const averageWastePercentage = wasteRates.length > 0 ? wasteRates.reduce((sum, item) => sum + item.wasteRate, 0) / wasteRates.length : 0

    const wasteEfficiencyRate = 100 - averageWastePercentage

    // Monthly projection (multiply by period multiplier)
    const periodMultiplier = timeframe === 'month' ? 1 : timeframe === 'quarter' ? 0.33 : 4.33
    const monthlyWasteExpense = totalWasteValue * periodMultiplier
    const projectedAnnualWaste = monthlyWasteExpense * 12

    const recommendations = this.generateRecommendations(wasteRates)

    return {
      totalWasteValue,
      monthlyWasteExpense,
      wasteByCategory,
      wasteEfficiencyRate,
      averageWastePercentage,
      projectedAnnualWaste,
      wasteRateByItem: wasteRates,
      recommendations
    }
  }

  /**
   * Calculate waste expense for financial integration
   */
  calculateMonthlyWasteExpense(wasteAnalytics: WasteAnalytics): {
    amount: number
    category: string
    description: string
    breakdown: { [category: string]: number }
  } {
    return {
      amount: wasteAnalytics.monthlyWasteExpense,
      category: 'Food Waste',
      description: 'Calculated waste based on disposed inventory and usage patterns',
      breakdown: wasteAnalytics.wasteByCategory
    }
  }
}

export const wasteAnalyticsService = new WasteAnalyticsService()
