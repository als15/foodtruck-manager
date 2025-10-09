import React, { useState, useEffect, useMemo } from 'react'
import { Row, Col, Card, Typography, Button, Modal, Input, Table, Tag, Space, Spin, Alert, message, Select, Switch, Tabs, Divider, Statistic, Progress } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  FileTextOutlined,
  BarChartOutlined,
  FlagOutlined,
  PieChartOutlined,
  BankOutlined,
  DeleteOutlined as WasteIcon,
  SearchOutlined
} from '@ant-design/icons'
import { Expense, ExpenseCategory, FinancialGoal, FinancialProjection, CashFlow, MenuItem, InventoryItem, Ingredient } from '../types'
import { expensesService, expenseCategoriesService, financialGoalsService, financialProjectionsService, menuItemsService, employeesService, shiftsService, ordersService, subscriptions, inventoryService, ingredientsService } from '../services/supabaseService'
import LaborCostManager from '../components/LaborCostManager'
import WasteAnalyticsDashboard from '../components/WasteAnalyticsDashboard'
import { Employee, Shift } from '../types'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../utils/currency'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

export default function FinancialManagement() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const [currentTab, setCurrentTab] = useState('expenses')
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false)
  const [openGoalDialog, setOpenGoalDialog] = useState(false)
  const [openProjectionDialog, setOpenProjectionDialog] = useState(false)
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false)
  const [openWasteBreakdownDialog, setOpenWasteBreakdownDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  // Data state
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [projections, setProjections] = useState<FinancialProjection[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [monthlyLaborCost, setMonthlyLaborCost] = useState(0)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])

  // Search and sort state for expenses
  type OrderBy = 'name' | 'amount' | 'frequency' | 'type' | 'category'
  const [searchQuery, setSearchQuery] = useState('')
  const [orderBy, setOrderBy] = useState<OrderBy>('name')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('asc')

  // Calculate real revenue and order data
  const calculateWeeklyMetrics = () => {
    // For now, we'll calculate based on break-even analysis and menu data
    // This can be replaced with actual sales data when available
    const avgOrderValue = calculateAverageOrderValue()
    const breakEvenOrders = calculateBreakEvenPoint()
    const dailyBreakdown = calculateDailyBreakEven()

    // Estimate weekly revenue based on operating days (Thu-Fri-Sat)
    const estimatedWeeklyOrders = dailyBreakdown.thursday + dailyBreakdown.friday + dailyBreakdown.saturday
    const estimatedWeeklyRevenue = estimatedWeeklyOrders * avgOrderValue

    return {
      weeklyRevenue: estimatedWeeklyRevenue,
      weeklyOrders: estimatedWeeklyOrders,
      avgOrderValue
    }
  }

  // Financial calculation settings
  const [financialSettings, setFinancialSettings] = useState({
    customAverageOrderValue: 0, // 0 means use calculated value
    customProfitMargin: 0, // 0 means use calculated value
    workingDaysPerWeek: 3, // Thursday, Friday, Saturday
    weeksPerMonth: 4.33, // Average weeks per month
    dayPerformanceMultipliers: {
      thursday: 0.7, // 30% slower than average
      friday: 1.2, // 20% better than average
      saturday: 1.3 // 30% better than average
    },
    seasonalMultipliers: {
      spring: 1.0,
      summer: 1.2,
      fall: 1.0,
      winter: 0.8
    }
  })

  // Load data on component mount
  useEffect(() => {
    loadAllData()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const expensesSubscription = subscriptions.expenses(() => {
      loadExpenses()
    })

    const goalsSubscription = subscriptions.financialGoals(() => {
      loadGoals()
    })

    const employeesSubscription = subscriptions.employees(() => {
      loadEmployees()
    })

    const shiftsSubscription = subscriptions.shifts(() => {
      loadShifts()
    })

    const ordersSubscription = subscriptions.orders
      ? subscriptions.orders(() => {
          loadOrders()
        })
      : null

    return () => {
      expensesSubscription.unsubscribe()
      goalsSubscription.unsubscribe()
      employeesSubscription.unsubscribe()
      shiftsSubscription.unsubscribe()
      if (ordersSubscription) {
        ordersSubscription.unsubscribe()
      }
    }
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadExpenses(), loadExpenseCategories(), loadGoals(), loadProjections(), loadMenuItems(), loadEmployees(), loadShifts(), loadOrders(), loadInventoryItems(), loadIngredients()])
    } catch (error) {
      message.error(t('failed_to_load_financial_data'))
    } finally {
      setLoading(false)
    }
  }

  const loadExpenses = async () => {
    try {
      const data = await expensesService.getAll()
      setExpenses(data)
    } catch (error) {
      console.error('Failed to load expenses:', error)
    }
  }

  const loadExpenseCategories = async () => {
    try {
      const data = await expenseCategoriesService.getAll()
      setExpenseCategories(data)
    } catch (error) {
      console.error('Failed to load expense categories:', error)
    }
  }

  const loadGoals = async () => {
    try {
      const data = await financialGoalsService.getAll()
      setGoals(data)
    } catch (error) {
      console.error('Failed to load goals:', error)
    }
  }

  const loadProjections = async () => {
    try {
      const data = await financialProjectionsService.getAll()
      setProjections(data)
    } catch (error) {
      console.error('Failed to load projections:', error)
    }
  }

  const loadMenuItems = async () => {
    try {
      const data = await menuItemsService.getAll()
      setMenuItems(data)
    } catch (error) {
      console.error('Failed to load menu items:', error)
    }
  }

  const loadEmployees = async () => {
    try {
      const data = await employeesService.getAll()
      setEmployees(data)
    } catch (error) {
      console.error('Failed to load employees:', error)
    }
  }

  const loadShifts = async () => {
    try {
      const data = await shiftsService.getAll()
      setShifts(data)
    } catch (error) {
      console.error('Failed to load shifts:', error)
    }
  }

  const loadOrders = async () => {
    try {
      const data = await ordersService.getAll()
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders:', error)
    }
  }

  const loadInventoryItems = async () => {
    try {
      const data = await inventoryService.getAll()
      setInventoryItems(data)
    } catch (error) {
      console.error('Failed to load inventory items:', error)
    }
  }

  const loadIngredients = async () => {
    try {
      const data = await ingredientsService.getAll()
      setIngredients(data)
    } catch (error) {
      console.error('Failed to load ingredients:', error)
    }
  }

  // Form states
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    name: '',
    amount: 0,
    type: 'fixed',
    frequency: 'monthly',
    description: '',
    categoryId: '',
    isActive: true
  })

  const [newGoal, setNewGoal] = useState<Partial<FinancialGoal>>({
    name: '',
    type: 'monthly_revenue',
    targetAmount: 0,
    currentAmount: 0,
    isActive: true
  })

  const [newProjection, setNewProjection] = useState<Partial<FinancialProjection>>({
    name: '',
    projectionPeriod: 'monthly',
    projectedRevenue: 0,
    projectedExpenses: 0,
    averageOrderValue: 0,
    ordersPerDay: 0,
    workingDaysPerMonth: 22
  })

  // Enhanced financial calculation functions
  const calculateMonthlyExpenses = () => {
    const expenseTotal = expenses.reduce((total, expense) => {
      if (!expense.isActive) return total

      switch (expense.frequency) {
        case 'daily':
          return total + expense.amount * 30
        case 'weekly':
          return total + expense.amount * 4.33
        case 'monthly':
          return total + expense.amount
        case 'yearly':
          return total + expense.amount / 12
        case 'one_time':
          return total // Don't include one-time in monthly calculation
        default:
          return total
      }
    }, 0)

    // Add labor costs
    return expenseTotal + monthlyLaborCost
  }

  // Calculate actual average order value from orders
  const calculateAverageOrderValue = () => {
    if (financialSettings.customAverageOrderValue > 0) {
      return financialSettings.customAverageOrderValue
    }

    if (orders.length === 0) return 15 // Fallback default

    // Calculate actual average order value from order data
    const totalValue = orders.reduce((sum, order) => sum + order.total, 0)
    return totalValue / orders.length
  }

  // Calculate actual profit margin from menu items
  const calculateAverageProfitMargin = () => {
    if (financialSettings.customProfitMargin > 0) {
      return financialSettings.customProfitMargin / 100
    }

    if (menuItems.length === 0) return 0.65 // Fallback default

    // Calculate weighted average profit margin from menu items
    const availableItems = menuItems.filter(item => item.isAvailable)

    if (availableItems.length === 0) return 0.65

    const totalMargin = availableItems.reduce((sum, item) => {
      const margin = item.profitMargin || 0
      return sum + margin / 100
    }, 0)

    return totalMargin / availableItems.length
  }

  // Get current season multiplier
  const getCurrentSeasonMultiplier = () => {
    const month = new Date().getMonth()
    if (month >= 2 && month <= 4) return financialSettings.seasonalMultipliers.spring
    if (month >= 5 && month <= 7) return financialSettings.seasonalMultipliers.summer
    if (month >= 8 && month <= 10) return financialSettings.seasonalMultipliers.fall
    return financialSettings.seasonalMultipliers.winter
  }

  // Enhanced break-even calculation
  const calculateBreakEvenPoint = () => {
    const monthlyExpenses = calculateMonthlyExpenses()
    const avgOrderValue = calculateAverageOrderValue()
    const avgProfitMargin = calculateAverageProfitMargin()
    const seasonalMultiplier = getCurrentSeasonMultiplier()

    const profitPerOrder = avgOrderValue * avgProfitMargin

    if (profitPerOrder <= 0) return 0

    // Apply seasonal adjustment
    const baseBreakEven = monthlyExpenses / profitPerOrder
    return Math.ceil(baseBreakEven / seasonalMultiplier)
  }

  // Calculate break-even per operating day (Thursday, Friday, Saturday)
  const calculateDailyBreakEven = () => {
    const monthlyBreakEven = calculateBreakEvenPoint()
    const workingDaysPerMonth = financialSettings.workingDaysPerWeek * financialSettings.weeksPerMonth

    // Calculate average orders per day
    const avgOrdersPerDay = monthlyBreakEven / workingDaysPerMonth

    // Adjust for each specific day based on performance multipliers
    const thursday = Math.ceil(avgOrdersPerDay * financialSettings.dayPerformanceMultipliers.thursday)
    const friday = Math.ceil(avgOrdersPerDay * financialSettings.dayPerformanceMultipliers.friday)
    const saturday = Math.ceil(avgOrdersPerDay * financialSettings.dayPerformanceMultipliers.saturday)

    return {
      total: Math.ceil(avgOrdersPerDay),
      thursday,
      friday,
      saturday,
      workingDaysPerMonth: Math.round(workingDaysPerMonth)
    }
  }

  // Get detailed break-even analysis
  const getBreakEvenAnalysis = () => {
    const monthlyExpenses = calculateMonthlyExpenses()
    const avgOrderValue = calculateAverageOrderValue()
    const avgProfitMargin = calculateAverageProfitMargin()
    const seasonalMultiplier = getCurrentSeasonMultiplier()
    const profitPerOrder = avgOrderValue * avgProfitMargin
    const dailyBreakdown = calculateDailyBreakEven()

    return {
      monthlyExpenses,
      avgOrderValue,
      avgProfitMargin: avgProfitMargin * 100, // Convert to percentage
      seasonalMultiplier,
      profitPerOrder,
      monthlyBreakEven: calculateBreakEvenPoint(),
      dailyBreakEven: dailyBreakdown,
      workingDaysPerMonth: dailyBreakdown.workingDaysPerMonth,
      operatingSchedule: {
        daysPerWeek: financialSettings.workingDaysPerWeek,
        weeksPerMonth: financialSettings.weeksPerMonth,
        dayMultipliers: financialSettings.dayPerformanceMultipliers
      },
      usingCalculatedValues: {
        orderValue: financialSettings.customAverageOrderValue === 0,
        profitMargin: financialSettings.customProfitMargin === 0
      }
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      await expensesService.delete(id)
      message.success(t('expense_deleted_success'))
      await loadExpenses()
    } catch (error) {
      message.error(t('failed_to_delete_expense'))
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setNewExpense({
      name: expense.name,
      amount: expense.amount,
      type: expense.type,
      frequency: expense.frequency,
      description: expense.description || '',
      categoryId: expense.categoryId || '',
      isActive: expense.isActive
    })
    setEditingExpense(expense)
    setOpenExpenseDialog(true)
  }

  const handleSaveExpense = async () => {
    try {
      const expense = {
        categoryId: newExpense.categoryId || null,
        name: newExpense.name || '',
        amount: newExpense.amount || 0,
        type: newExpense.type || 'fixed',
        frequency: newExpense.frequency || 'monthly',
        startDate: new Date(),
        description: newExpense.description || '',
        isActive: newExpense.isActive !== false
      }

      if (editingExpense) {
        await expensesService.update(editingExpense.id, expense)
        message.success(t('expense_updated_success'))
      } else {
        await expensesService.create(expense as Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>)
        message.success(t('expense_added_success'))
      }

      setNewExpense({
        name: '',
        amount: 0,
        type: 'fixed',
        frequency: 'monthly',
        description: '',
        categoryId: '',
        isActive: true
      })
      setEditingExpense(null)
      setOpenExpenseDialog(false)

      // Reload expenses to get the latest data
      await loadExpenses()
    } catch (error) {
      message.error(editingExpense ? t('failed_to_update_expense') : t('failed_to_add_expense'))
    }
  }

  const handleSaveGoal = async () => {
    try {
      const goal = {
        name: newGoal.name || '',
        type: newGoal.type || 'monthly_revenue',
        targetAmount: newGoal.targetAmount || 0,
        currentAmount: newGoal.currentAmount || 0,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: newGoal.isActive !== false
      }

      await financialGoalsService.create(goal as Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt'>)

      setNewGoal({
        name: '',
        type: 'monthly_revenue',
        targetAmount: 0,
        currentAmount: 0,
        isActive: true
      })
      setOpenGoalDialog(false)
      message.success(t('goal_created_success'))

      // Reload goals to get the latest data
      await loadGoals()
    } catch (error) {
      message.error(t('failed_to_create_goal'))
    }
  }

  const handleCalculateProjection = async () => {
    try {
      const monthlyExpenses = calculateMonthlyExpenses()
      const avgOrderValue = newProjection.averageOrderValue || 0
      const ordersPerDay = newProjection.ordersPerDay || 0
      const workingDays = newProjection.workingDaysPerMonth || 22

      const monthlyRevenue = avgOrderValue * ordersPerDay * workingDays
      const monthlyProfit = monthlyRevenue - monthlyExpenses
      const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0
      const breakEvenOrders = calculateBreakEvenPoint()

      const projection = {
        name: newProjection.name || `Projection ${new Date().toLocaleDateString()}`,
        projectionPeriod: newProjection.projectionPeriod || 'monthly',
        projectedRevenue: monthlyRevenue,
        projectedExpenses: monthlyExpenses,
        projectedProfit: monthlyProfit,
        averageOrderValue: avgOrderValue,
        ordersPerDay: ordersPerDay,
        workingDaysPerMonth: workingDays,
        profitMarginPercentage: profitMargin,
        breakEvenPoint: breakEvenOrders
      }

      await financialProjectionsService.create(projection as Omit<FinancialProjection, 'id' | 'createdAt' | 'updatedAt'>)

      setOpenProjectionDialog(false)
      message.success(t('projection_created_success'))

      // Reload projections to get the latest data
      await loadProjections()
    } catch (error) {
      message.error(t('failed_to_create_projection'))
    }
  }

  // Sorting logic for expenses
  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && orderDirection === 'asc'
    setOrderDirection(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const sortedExpenses = useMemo(() => {
    const comparator = (a: Expense, b: Expense) => {
      let aValue: any
      let bValue: any

      switch (orderBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'frequency':
          aValue = a.frequency
          bValue = b.frequency
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'category':
          const aCat = expenseCategories.find(cat => cat.id === a.categoryId)?.name || ''
          const bCat = expenseCategories.find(cat => cat.id === b.categoryId)?.name || ''
          aValue = aCat.toLowerCase()
          bValue = bCat.toLowerCase()
          break
        default:
          return 0
      }

      if (bValue < aValue) {
        return orderDirection === 'desc' ? -1 : 1
      }
      if (bValue > aValue) {
        return orderDirection === 'desc' ? 1 : -1
      }
      return 0
    }

    return [...expenses].sort(comparator)
  }, [expenses, orderBy, orderDirection, expenseCategories])

  // Filter expenses based on search query
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return sortedExpenses

    const query = searchQuery.toLowerCase()
    return sortedExpenses.filter(expense => {
      const category = expenseCategories.find(cat => cat.id === expense.categoryId)
      return (
        expense.name.toLowerCase().includes(query) ||
        expense.type.toLowerCase().includes(query) ||
        expense.frequency.toLowerCase().includes(query) ||
        (expense.description && expense.description.toLowerCase().includes(query)) ||
        (category && category.name.toLowerCase().includes(query))
      )
    })
  }, [sortedExpenses, searchQuery, expenseCategories])

  // Prepare expense table columns
  const expenseColumns: ColumnsType<Expense> = [
    {
      title: t('name_and_category'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (name: string, record: Expense) => {
        const category = expenseCategories.find(cat => cat.id === record.categoryId)
        return (
          <Space>
            {name}
            {category && <Tag style={{ fontSize: '0.7rem' }}>{category.name}</Tag>}
          </Space>
        )
      }
    },
    {
      title: t('amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: isRtl ? 'left' : 'right',
      sorter: true,
      render: (amount: number) => formatCurrency(amount)
    },
    {
      title: t('frequency'),
      dataIndex: 'frequency',
      key: 'frequency',
      sorter: true,
      render: (frequency: string) => t(frequency)
    },
    {
      title: t('category'),
      dataIndex: 'categoryId',
      key: 'category',
      sorter: true,
      render: (categoryId: string) => {
        const category = expenseCategories.find(cat => cat.id === categoryId)
        return category?.name || '-'
      }
    },
    {
      title: t('type_text'),
      dataIndex: 'type',
      key: 'type',
      sorter: true,
      render: (type: string) => {
        const colorMap: { [key: string]: string } = {
          fixed: 'blue',
          variable: 'orange',
          one_time: 'default'
        }
        return <Tag color={colorMap[type] || 'default'}>{t(type)}</Tag>
      }
    },
    {
      title: t('monthly_impact'),
      key: 'monthlyImpact',
      align: isRtl ? 'left' : 'right',
      render: (_: any, record: Expense) => {
        let monthlyImpact = 0
        switch (record.frequency) {
          case 'daily':
            monthlyImpact = record.amount * 30
            break
          case 'weekly':
            monthlyImpact = record.amount * 4.33
            break
          case 'monthly':
            monthlyImpact = record.amount
            break
          case 'yearly':
            monthlyImpact = record.amount / 12
            break
          default:
            monthlyImpact = 0
        }
        return formatCurrency(monthlyImpact)
      }
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_: any, record: Expense) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditExpense(record)} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteExpense(record.id)} />
        </Space>
      )
    }
  ]

  // Prepare expense table data with waste aggregation
  const prepareExpenseTableData = () => {
    const wasteExpenses = filteredExpenses.filter(expense => expense.name?.toLowerCase().includes('food waste'))
    const regularExpenses = filteredExpenses.filter(expense => !expense.name?.toLowerCase().includes('food waste'))

    const dataSource = [...regularExpenses]

    // Add aggregated Food Waste row if there are waste expenses
    if (wasteExpenses.length > 0) {
      const totalWasteAmount = wasteExpenses.reduce((sum, expense) => {
        let monthlyImpact = 0
        switch (expense.frequency) {
          case 'daily':
            monthlyImpact = expense.amount * 30
            break
          case 'weekly':
            monthlyImpact = expense.amount * 4.33
            break
          case 'monthly':
            monthlyImpact = expense.amount
            break
          case 'yearly':
            monthlyImpact = expense.amount / 12
            break
          default:
            monthlyImpact = 0
        }
        return sum + monthlyImpact
      }, 0)

      const avgAmount = wasteExpenses.reduce((sum, expense) => sum + expense.amount, 0) / wasteExpenses.length

      // Add a synthetic row for waste
      dataSource.push({
        id: 'food-waste-aggregate',
        name: 'Food Waste',
        amount: avgAmount,
        frequency: 'mixed' as any,
        type: 'variable' as any,
        categoryId: 'waste-management',
        isActive: true,
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as Expense)
    }

    return dataSource
  }

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <Title level={4} style={{ marginBottom: 24, textAlign: isRtl ? 'right' : 'left' }}>
        {t('financial_management')}
      </Title>

      {/* Financial Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <FileTextOutlined style={{ color: '#ff4d4f' }} />
                  <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>{t('monthly_expenses')}</Text>
                </Space>
              }
              value={calculateMonthlyExpenses()}
              precision={2}
              prefix="$"
              valueStyle={{ fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <FlagOutlined style={{ color: '#1890ff' }} />
                  <Text style={{ color: '#1890ff', fontWeight: 600 }}>{t('break_even_orders')}</Text>
                </Space>
              }
              value={calculateBreakEvenPoint()}
              valueStyle={{ fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <BarChartOutlined style={{ color: '#52c41a' }} />
                  <Text style={{ color: '#52c41a', fontWeight: 600 }}>{t('active_goals')}</Text>
                </Space>
              }
              value={goals.filter(g => g.isActive).length}
              valueStyle={{ fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <PieChartOutlined style={{ color: '#1890ff' }} />
                  <Text style={{ color: '#1890ff', fontWeight: 600 }}>{t('projections')}</Text>
                </Space>
              }
              value={projections.length}
              valueStyle={{ fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs for different sections */}
      <Tabs activeKey={currentTab} onChange={setCurrentTab}>
        <TabPane tab={t('expenses')} key="expenses">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5} style={{ margin: 0, textAlign: isRtl ? 'right' : 'left' }}>
                {t('expense_management')}
              </Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenExpenseDialog(true)}>
                {t('add_expense')}
              </Button>
            </div>

            <Card>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Title level={5} style={{ margin: 0, textAlign: isRtl ? 'right' : 'left' }}>
                  {t('current_expenses')}
                </Title>
                <Input
                  placeholder={t('search_expenses')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                  allowClear
                />
                <Table
                  columns={expenseColumns}
                  dataSource={prepareExpenseTableData()}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  onRow={(record) => {
                    if (record.id === 'food-waste-aggregate') {
                      return {
                        onClick: () => setOpenWasteBreakdownDialog(true),
                        style: { cursor: 'pointer' }
                      }
                    }
                    return {}
                  }}
                />
              </Space>
            </Card>
          </Space>
        </TabPane>

        <TabPane tab={t('labor_costs')} key="labor">
          {(() => {
            const metrics = calculateWeeklyMetrics()
            return (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Alert
                  type="info"
                  message="Revenue Analytics"
                  description={
                    <div>
                      <Text>Based on break-even analysis and menu data</Text>
                      <br />
                      <Text>Weekly Revenue: {formatCurrency(metrics.weeklyRevenue)} | Weekly Orders: {metrics.weeklyOrders} orders | Avg Order Value: {formatCurrency(metrics.avgOrderValue)}</Text>
                      <br />
                      <Text type="secondary" italic>These values will be replaced with actual sales data when transaction tracking is implemented.</Text>
                    </div>
                  }
                />
                <LaborCostManager employees={employees} shifts={shifts} weeklyRevenue={metrics.weeklyRevenue} weeklyOrders={metrics.weeklyOrders} onLaborCostUpdate={setMonthlyLaborCost} />
              </Space>
            )
          })()}
        </TabPane>

        <TabPane tab="Waste Analytics" key="waste">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={5} style={{ margin: 0, textAlign: isRtl ? 'right' : 'left' }}>
              Waste Analytics & Cost Management
            </Title>
            <WasteAnalyticsDashboard
              inventoryItems={inventoryItems}
              orders={orders}
              menuItems={menuItems}
              ingredients={ingredients}
              onWasteExpenseCalculated={async expense => {
                try {
                  message.success(`Waste expense of ${formatCurrency(expense.amount)} calculated for financial planning`)
                } catch (error) {
                  console.error('Failed to process waste expense:', error)
                }
              }}
            />
          </Space>
        </TabPane>

        <TabPane tab={t('projections')} key="projections">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5} style={{ margin: 0, textAlign: isRtl ? 'right' : 'left' }}>
                {t('projections')}
              </Title>
              <Button type="primary" icon={<BarChartOutlined />} onClick={() => setOpenProjectionDialog(true)}>
                {t('create_projection')}
              </Button>
            </div>

            {/* Enhanced Break-even Analysis Card */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0, textAlign: isRtl ? 'right' : 'left' }}>
                  {t('break_even_analysis')}
                </Title>
                <Button size="small" onClick={() => setOpenSettingsDialog(true)}>
                  {t('settings')}
                </Button>
              </div>

              {(() => {
                const analysis = getBreakEvenAnalysis()
                return (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text type="secondary">
                          Monthly Expenses: <Text strong>{formatCurrency(analysis.monthlyExpenses)}</Text>
                        </Text>
                        <Text type="secondary">
                          Average Order Value: <Text strong>{formatCurrency(analysis.avgOrderValue)}</Text>
                          {analysis.usingCalculatedValues.orderValue && <Tag style={{ marginLeft: 8 }}>Calculated</Tag>}
                        </Text>
                        <Text type="secondary">
                          Average Profit Margin: <Text strong>{analysis.avgProfitMargin.toFixed(1)}%</Text>
                          {analysis.usingCalculatedValues.profitMargin && <Tag style={{ marginLeft: 8 }}>Calculated</Tag>}
                        </Text>
                        <Text type="secondary">
                          Profit Per Order: <Text strong>{formatCurrency(analysis.profitPerOrder)}</Text>
                        </Text>
                        <Text type="secondary">
                          Seasonal Multiplier: <Text strong>{analysis.seasonalMultiplier}x</Text>
                        </Text>
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card style={{ background: '#1890ff', color: 'white', marginBottom: 16 }}>
                        <div style={{ textAlign: 'center' }}>
                          <Title level={5} style={{ color: 'white' }}>
                            Break-Even Point
                          </Title>
                          <Title level={4} style={{ color: 'white', margin: '8px 0' }}>
                            {analysis.monthlyBreakEven} orders/month
                          </Title>
                          <Text style={{ color: 'white' }}>({analysis.workingDaysPerMonth} operating days)</Text>
                        </div>
                      </Card>

                      <Card style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                          Daily Targets:
                        </Text>
                        <Row gutter={8}>
                          <Col span={8}>
                            <Card style={{ background: '#faad14', textAlign: 'center', padding: 8 }}>
                              <Text strong style={{ fontSize: '0.75rem' }}>
                                THU
                              </Text>
                              <Title level={5} style={{ margin: '4px 0' }}>
                                {analysis.dailyBreakEven.thursday}
                              </Title>
                              <Text style={{ fontSize: '0.75rem' }}>orders</Text>
                            </Card>
                          </Col>
                          <Col span={8}>
                            <Card style={{ background: '#52c41a', textAlign: 'center', padding: 8 }}>
                              <Text strong style={{ fontSize: '0.75rem' }}>
                                FRI
                              </Text>
                              <Title level={5} style={{ margin: '4px 0' }}>
                                {analysis.dailyBreakEven.friday}
                              </Title>
                              <Text style={{ fontSize: '0.75rem' }}>orders</Text>
                            </Card>
                          </Col>
                          <Col span={8}>
                            <Card style={{ background: '#1890ff', textAlign: 'center', padding: 8 }}>
                              <Text strong style={{ fontSize: '0.75rem' }}>
                                SAT
                              </Text>
                              <Title level={5} style={{ margin: '4px 0' }}>
                                {analysis.dailyBreakEven.saturday}
                              </Title>
                              <Text style={{ fontSize: '0.75rem' }}>orders</Text>
                            </Card>
                          </Col>
                        </Row>
                      </Card>

                      <Alert type={menuItems.length > 0 ? 'success' : 'warning'} message={menuItems.length > 0 ? `Using data from ${menuItems.filter(i => i.isAvailable).length} menu items • 3-day schedule` : 'Add menu items for more accurate calculations'} />
                    </Col>
                  </Row>
                )
              })()}
            </Card>

            {/* Projections List */}
            <Row gutter={[16, 16]}>
              {projections.map(projection => (
                <Col xs={24} md={12} key={projection.id}>
                  <Card>
                    <Title level={5} style={{ marginBottom: 16 }}>
                      {projection.name}
                    </Title>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Statistic title="Revenue" value={projection.projectedRevenue} precision={2} prefix="$" valueStyle={{ color: '#52c41a' }} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Expenses" value={projection.projectedExpenses} precision={2} prefix="$" valueStyle={{ color: '#ff4d4f' }} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Profit" value={projection.projectedProfit} precision={2} prefix="$" valueStyle={{ color: projection.projectedProfit >= 0 ? '#52c41a' : '#ff4d4f' }} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Margin" value={projection.profitMarginPercentage.toFixed(1)} suffix="%" />
                      </Col>
                      <Col span={24}>
                        <Text type="secondary">Break-even: {projection.breakEvenPoint} orders/month</Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>
          </Space>
        </TabPane>
      </Tabs>

      {/* Add Expense Dialog */}
      <Modal
        title={editingExpense ? t('edit_expense') : t('add_new_expense')}
        open={openExpenseDialog}
        onCancel={() => {
          setOpenExpenseDialog(false)
          setEditingExpense(null)
          setNewExpense({
            name: '',
            amount: 0,
            type: 'fixed',
            frequency: 'monthly',
            description: '',
            categoryId: '',
            isActive: true
          })
        }}
        onOk={handleSaveExpense}
        okText={editingExpense ? t('update_expense') : t('add_expense')}
        cancelText={t('cancel')}
        width={600}
      >
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12}>
            <Text>{t('expense_name')}</Text>
            <Input value={newExpense.name} onChange={e => setNewExpense({ ...newExpense, name: e.target.value })} required />
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('category')}</Text>
            <Select style={{ width: '100%' }} value={newExpense.categoryId || ''} onChange={value => setNewExpense({ ...newExpense, categoryId: value })}>
              <Option value="">{t('no_category')}</Option>
              {expenseCategories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('amount')}</Text>
            <Input type="number" step="0.01" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })} required />
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('type_text')}</Text>
            <Select style={{ width: '100%' }} value={newExpense.type} onChange={value => setNewExpense({ ...newExpense, type: value as any })}>
              <Option value="fixed">{t('fixed')}</Option>
              <Option value="variable">{t('variable')}</Option>
              <Option value="one_time">{t('one_time')}</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('frequency')}</Text>
            <Select style={{ width: '100%' }} value={newExpense.frequency} onChange={value => setNewExpense({ ...newExpense, frequency: value as any })}>
              <Option value="daily">{t('daily')}</Option>
              <Option value="weekly">{t('weekly')}</Option>
              <Option value="monthly">{t('monthly')}</Option>
              <Option value="yearly">{t('yearly')}</Option>
              <Option value="one_time">{t('one_time')}</Option>
            </Select>
          </Col>
          <Col xs={24}>
            <Text>{t('description')}</Text>
            <TextArea rows={3} value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
          </Col>
        </Row>
      </Modal>

      {/* Create Projection Dialog */}
      <Modal
        title={t('create_projection')}
        open={openProjectionDialog}
        onCancel={() => setOpenProjectionDialog(false)}
        onOk={handleCalculateProjection}
        okText={t('calculate_projection')}
        cancelText={t('cancel')}
        width={600}
      >
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Text>{t('projection_name')}</Text>
            <Input value={newProjection.name} onChange={e => setNewProjection({ ...newProjection, name: e.target.value })} placeholder={t('projection_name_placeholder')} />
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('average_order_value')}</Text>
            <Input type="number" step="0.01" value={newProjection.averageOrderValue} onChange={e => setNewProjection({ ...newProjection, averageOrderValue: parseFloat(e.target.value) || 0 })} />
            <Text type="secondary" style={{ fontSize: '0.75rem' }}>
              {t('average_order_value_help')}
            </Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('orders_per_day')}</Text>
            <Input type="number" value={newProjection.ordersPerDay} onChange={e => setNewProjection({ ...newProjection, ordersPerDay: parseInt(e.target.value) || 0 })} />
            <Text type="secondary" style={{ fontSize: '0.75rem' }}>
              {t('orders_per_day_help')}
            </Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('working_days_per_month')}</Text>
            <Input type="number" value={newProjection.workingDaysPerMonth} onChange={e => setNewProjection({ ...newProjection, workingDaysPerMonth: parseInt(e.target.value) || 22 })} />
            <Text type="secondary" style={{ fontSize: '0.75rem' }}>
              {t('working_days_per_month_help')}
            </Text>
          </Col>
          <Col xs={24}>
            <Alert type="info" message={t('projection_calculation_info', { amount: formatCurrency(calculateMonthlyExpenses()) })} />
          </Col>
        </Row>
      </Modal>

      {/* Financial Settings Dialog */}
      <Modal
        title={t('financial_calculation_settings')}
        open={openSettingsDialog}
        onCancel={() => setOpenSettingsDialog(false)}
        onOk={() => {
          setOpenSettingsDialog(false)
          message.success(t('financial_settings_updated'))
        }}
        okText={t('save_settings')}
        cancelText={t('cancel')}
        width={800}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 16 }}>
          <div>
            <Title level={5}>Order Value & Profit Margin</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Text>Custom Average Order Value</Text>
                <Input
                  type="number"
                  step="0.01"
                  value={financialSettings.customAverageOrderValue || ''}
                  onChange={e =>
                    setFinancialSettings({
                      ...financialSettings,
                      customAverageOrderValue: parseFloat(e.target.value) || 0
                    })
                  }
                />
                <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                  {financialSettings.customAverageOrderValue === 0 ? `Using calculated: ${formatCurrency(calculateAverageOrderValue())}` : 'Leave 0 to use calculated value from menu items'}
                </Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text>Custom Profit Margin (%)</Text>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={financialSettings.customProfitMargin || ''}
                  onChange={e =>
                    setFinancialSettings({
                      ...financialSettings,
                      customProfitMargin: parseFloat(e.target.value) || 0
                    })
                  }
                />
                <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                  {financialSettings.customProfitMargin === 0 ? `Using calculated: ${(calculateAverageProfitMargin() * 100).toFixed(1)}%` : 'Leave 0 to use calculated value from menu items'}
                </Text>
              </Col>
            </Row>
          </div>

          <div>
            <Title level={5}>3-Day Operating Schedule</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Operating Thursday, Friday, and Saturday with different performance expectations
            </Text>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Text>Working Days Per Week</Text>
                <Input
                  type="number"
                  min="1"
                  max="7"
                  value={financialSettings.workingDaysPerWeek}
                  onChange={e =>
                    setFinancialSettings({
                      ...financialSettings,
                      workingDaysPerWeek: parseInt(e.target.value) || 3
                    })
                  }
                />
                <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                  Number of days you operate per week
                </Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text>Weeks Per Month</Text>
                <Input
                  type="number"
                  step="0.1"
                  min="4"
                  max="5"
                  value={financialSettings.weeksPerMonth}
                  onChange={e =>
                    setFinancialSettings({
                      ...financialSettings,
                      weeksPerMonth: parseFloat(e.target.value) || 4.33
                    })
                  }
                />
                <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                  Average weeks per month (4.33 is standard)
                </Text>
              </Col>
            </Row>
          </div>

          <div>
            <Title level={5}>Daily Performance Multipliers</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Adjust expected performance for each operating day (1.0 = average, &lt;1.0 = slower, &gt;1.0 = busier)
            </Text>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Text>Thursday Multiplier</Text>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={financialSettings.dayPerformanceMultipliers.thursday}
                  onChange={e =>
                    setFinancialSettings({
                      ...financialSettings,
                      dayPerformanceMultipliers: {
                        ...financialSettings.dayPerformanceMultipliers,
                        thursday: parseFloat(e.target.value) || 0.7
                      }
                    })
                  }
                />
                <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                  Expected to be slower
                </Text>
              </Col>
              <Col xs={24} sm={8}>
                <Text>Friday Multiplier</Text>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={financialSettings.dayPerformanceMultipliers.friday}
                  onChange={e =>
                    setFinancialSettings({
                      ...financialSettings,
                      dayPerformanceMultipliers: {
                        ...financialSettings.dayPerformanceMultipliers,
                        friday: parseFloat(e.target.value) || 1.2
                      }
                    })
                  }
                />
                <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                  Better than average
                </Text>
              </Col>
              <Col xs={24} sm={8}>
                <Text>Saturday Multiplier</Text>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={financialSettings.dayPerformanceMultipliers.saturday}
                  onChange={e =>
                    setFinancialSettings({
                      ...financialSettings,
                      dayPerformanceMultipliers: {
                        ...financialSettings.dayPerformanceMultipliers,
                        saturday: parseFloat(e.target.value) || 1.3
                      }
                    })
                  }
                />
                <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                  Best performance day
                </Text>
              </Col>
            </Row>
          </div>

          <div>
            <Title level={5}>Seasonal Adjustments</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Adjust break-even calculations based on seasonal demand patterns
            </Text>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Text>Spring Multiplier</Text>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={financialSettings.seasonalMultipliers.spring}
                  onChange={e =>
                    setFinancialSettings({
                      ...financialSettings,
                      seasonalMultipliers: {
                        ...financialSettings.seasonalMultipliers,
                        spring: parseFloat(e.target.value) || 1.0
                      }
                    })
                  }
                />
              </Col>
              <Col xs={12} sm={6}>
                <Text>Summer Multiplier</Text>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={financialSettings.seasonalMultipliers.summer}
                  onChange={e =>
                    setFinancialSettings({
                      ...financialSettings,
                      seasonalMultipliers: {
                        ...financialSettings.seasonalMultipliers,
                        summer: parseFloat(e.target.value) || 1.2
                      }
                    })
                  }
                />
              </Col>
              <Col xs={12} sm={6}>
                <Text>Fall Multiplier</Text>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={financialSettings.seasonalMultipliers.fall}
                  onChange={e =>
                    setFinancialSettings({
                      ...financialSettings,
                      seasonalMultipliers: {
                        ...financialSettings.seasonalMultipliers,
                        fall: parseFloat(e.target.value) || 1.0
                      }
                    })
                  }
                />
              </Col>
              <Col xs={12} sm={6}>
                <Text>Winter Multiplier</Text>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={financialSettings.seasonalMultipliers.winter}
                  onChange={e =>
                    setFinancialSettings({
                      ...financialSettings,
                      seasonalMultipliers: {
                        ...financialSettings.seasonalMultipliers,
                        winter: parseFloat(e.target.value) || 0.8
                      }
                    })
                  }
                />
              </Col>
            </Row>
          </div>

          <Alert
            type="info"
            message={
              <Text>
                <Text strong>Current Season:</Text> {getCurrentSeasonMultiplier()}x multiplier is being applied to break-even calculations. Values above 1.0 indicate higher demand (easier to reach break-even), below 1.0 indicate lower demand.
              </Text>
            }
          />
        </Space>
      </Modal>

      {/* Food Waste Breakdown Dialog */}
      <Modal
        title={
          <Space>
            <WasteIcon style={{ color: '#faad14' }} />
            Food Waste Expense Breakdown
          </Space>
        }
        open={openWasteBreakdownDialog}
        onCancel={() => setOpenWasteBreakdownDialog(false)}
        footer={[
          <Button key="close" onClick={() => setOpenWasteBreakdownDialog(false)}>
            Close
          </Button>,
          <Button
            key="analytics"
            type="primary"
            danger
            icon={<BarChartOutlined />}
            onClick={() => {
              setOpenWasteBreakdownDialog(false)
              setCurrentTab('waste')
            }}
          >
            View Waste Analytics
          </Button>
        ]}
        width={800}
      >
        {(() => {
          const wasteExpenses = expenses.filter(expense => expense.name?.toLowerCase().includes('food waste'))

          if (wasteExpenses.length === 0) {
            return <Alert type="info" message="No food waste expenses found." style={{ marginTop: 16 }} />
          }

          const totalMonthlyImpact = wasteExpenses.reduce((sum, expense) => {
            let monthlyImpact = 0
            switch (expense.frequency) {
              case 'daily':
                monthlyImpact = expense.amount * 30
                break
              case 'weekly':
                monthlyImpact = expense.amount * 4.33
                break
              case 'monthly':
                monthlyImpact = expense.amount
                break
              case 'yearly':
                monthlyImpact = expense.amount / 12
                break
              default:
                monthlyImpact = 0
            }
            return sum + monthlyImpact
          }, 0)

          const wasteColumns: ColumnsType<Expense> = [
            {
              title: 'Product/Item',
              dataIndex: 'name',
              key: 'name',
              render: (name: string, record: Expense) => {
                const category = expenseCategories.find(cat => cat.id === record.categoryId)
                return (
                  <Space direction="vertical" size="small">
                    <Text strong>{name.replace(/food waste/i, '').trim() || 'General Food Waste'}</Text>
                    {record.description && <Text type="secondary" style={{ fontSize: '0.75rem' }}>{record.description}</Text>}
                    {category && <Tag style={{ fontSize: '0.7rem' }}>{category.name}</Tag>}
                  </Space>
                )
              }
            },
            {
              title: 'Amount',
              dataIndex: 'amount',
              key: 'amount',
              align: isRtl ? 'left' : 'right',
              render: (amount: number) => <Text type="danger">{formatCurrency(amount)}</Text>
            },
            {
              title: 'Frequency',
              dataIndex: 'frequency',
              key: 'frequency',
              render: (frequency: string) => <Tag color={frequency === 'one_time' ? 'default' : 'orange'}>{t(frequency)}</Tag>
            },
            {
              title: 'Monthly Impact',
              key: 'monthlyImpact',
              align: isRtl ? 'left' : 'right',
              render: (_: any, record: Expense) => {
                let monthlyImpact = 0
                switch (record.frequency) {
                  case 'daily':
                    monthlyImpact = record.amount * 30
                    break
                  case 'weekly':
                    monthlyImpact = record.amount * 4.33
                    break
                  case 'monthly':
                    monthlyImpact = record.amount
                    break
                  case 'yearly':
                    monthlyImpact = record.amount / 12
                    break
                  default:
                    monthlyImpact = 0
                }
                return <Text strong style={{ color: '#faad14' }}>{formatCurrency(monthlyImpact)}</Text>
              }
            },
            {
              title: 'Date Added',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (createdAt: Date) => <Text type="secondary">{createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</Text>
            },
            {
              title: 'Actions',
              key: 'actions',
              align: isRtl ? 'left' : 'right',
              render: (_: any, record: Expense) => (
                <Space>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      handleEditExpense(record)
                      setOpenWasteBreakdownDialog(false)
                    }}
                    title="Edit waste expense"
                  />
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteExpense(record.id)} title="Delete waste expense" />
                </Space>
              )
            }
          ]

          return (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                type="warning"
                message={
                  <div>
                    <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
                      Total Monthly Food Waste Impact: {formatCurrency(totalMonthlyImpact)}
                    </Title>
                    <Text>This breakdown shows all individual food waste expenses that contribute to your monthly costs.</Text>
                  </div>
                }
              />
              <Table columns={wasteColumns} dataSource={wasteExpenses} rowKey="id" pagination={false} />
              <Alert type="info" message={<Text>💡 <Text strong>Tip:</Text> Use the Waste Analytics tab to track and analyze waste patterns to help reduce these costs over time.</Text>} />
            </Space>
          )
        })()}
      </Modal>
    </div>
  )
}
