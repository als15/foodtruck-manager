import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Typography, Button, Input, Table, Tag, Space, Spin, Alert, message, Select, Switch, Divider, Progress, AutoComplete } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, DeleteOutlined, RiseOutlined, FallOutlined, BarChartOutlined, CalculatorOutlined, ReloadOutlined, DownOutlined, UpOutlined, DollarOutlined, UploadOutlined } from '@ant-design/icons'
import { MenuItem, Expense, Ingredient } from '../types'
import { menuItemsService, expensesService, ingredientsService } from '../services/supabaseService'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../utils/currency'
import AISalesImporter from '../components/Common/AISalesImporter'

const { Title, Text } = Typography

interface SalesScenarioItem {
  menuItemId: string
  menuItem: MenuItem
  dailyQuantity: number
}

interface BreakEvenSettings {
  dailyLaborCost: number
  monthlyLaborCost: number
  workingDaysPerWeek: number
  weeksPerMonth: number
  useMonthlyView: boolean
}

export default function BreakEvenAnalysis() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [salesScenario, setSalesScenario] = useState<SalesScenarioItem[]>([])
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false)
  const [showMonthlyExpenseBreakdown, setShowMonthlyExpenseBreakdown] = useState(false)
  const [showImporter, setShowImporter] = useState(false)
  const [importedSalesInfo, setImportedSalesInfo] = useState<{
    businessName: string
    dateRange: string
    totalRevenue: number
    totalQuantity: number
  } | null>(null)
  const [settings, setSettings] = useState<BreakEvenSettings>({
    dailyLaborCost: 200,
    monthlyLaborCost: 6000,
    workingDaysPerWeek: 3, // Thursday, Friday, Saturday (same as Financial Management)
    weeksPerMonth: 4.33, // Average weeks per month (same as Financial Management)
    useMonthlyView: false
  })

  // Calculate working days per month (same as Financial Management)
  const workingDaysPerMonth = settings.workingDaysPerWeek * settings.weeksPerMonth

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [menuData, expenseData, ingredientData] = await Promise.all([menuItemsService.getAll(), expensesService.getAll(), ingredientsService.getAll()])
      setMenuItems(menuData.filter(item => item.isAvailable))
      setExpenses(expenseData.filter(expense => expense.isActive))
      setIngredients(ingredientData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItemToScenario = () => {
    if (!selectedMenuItem) return

    const existingIndex = salesScenario.findIndex(item => item.menuItemId === selectedMenuItem.id)
    if (existingIndex >= 0) {
      // Update existing item
      const updated = [...salesScenario]
      updated[existingIndex].dailyQuantity += 1
      setSalesScenario(updated)
    } else {
      // Add new item
      setSalesScenario(prev => [
        ...prev,
        {
          menuItemId: selectedMenuItem.id,
          menuItem: selectedMenuItem,
          dailyQuantity: 1
        }
      ])
    }
    setSelectedMenuItem(null)
  }

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromScenario(index)
      return
    }
    const updated = [...salesScenario]
    updated[index].dailyQuantity = quantity
    setSalesScenario(updated)
  }

  const removeItemFromScenario = (index: number) => {
    setSalesScenario(prev => prev.filter((_, i) => i !== index))
  }

  const resetScenario = () => {
    setSalesScenario([])
    setImportedSalesInfo(null)
  }

  const handleSalesDataImported = (salesData: any[], summary: any) => {
    // Convert imported sales data to scenario items
    const newScenarioItems: SalesScenarioItem[] = []

    salesData.forEach(item => {
      if (item.menuItem) {
        // Check if this menu item already exists in scenario
        const existingIndex = newScenarioItems.findIndex(s => s.menuItemId === item.menuItem.id)

        if (existingIndex >= 0) {
          // Add to existing quantity
          newScenarioItems[existingIndex].dailyQuantity += item.quantity
        } else {
          // Add new item
          newScenarioItems.push({
            menuItemId: item.menuItem.id,
            menuItem: item.menuItem,
            dailyQuantity: item.quantity
          })
        }
      }
    })

    // Set the scenario and import info
    setSalesScenario(newScenarioItems)
    setImportedSalesInfo(summary)
    setShowImporter(false)
  }

  const calculateItemCost = (menuItem: MenuItem): number => {
    if (!menuItem.ingredients || menuItem.ingredients.length === 0) return 0
    return menuItem.ingredients.reduce((total, menuIngredient) => {
      const ingredient = ingredients.find(ing => ing.id === menuIngredient.ingredientId)
      if (ingredient) {
        return total + menuIngredient.quantity * ingredient.costPerUnit
      }
      return total
    }, 0)
  }

  const getExpenseBreakdown = () => {
    return expenses
      .map(expense => {
        let dailyAmount = 0
        switch (expense.frequency) {
          case 'daily':
            dailyAmount = expense.amount
            break
          case 'weekly':
            // Weekly expenses divided by 7, but only for working days
            dailyAmount = expense.amount / 7
            break
          case 'monthly':
            // Monthly expenses divided by actual working days per month
            dailyAmount = expense.amount / workingDaysPerMonth
            break
          case 'yearly':
            // Yearly expenses divided by total working days per year
            dailyAmount = expense.amount / (workingDaysPerMonth * 12)
            break
          case 'one_time':
            dailyAmount = 0 // Don't include one-time expenses in daily calculations
            break
          default:
            dailyAmount = 0
        }
        return {
          ...expense,
          dailyAmount
        }
      })
      .filter(expense => expense.dailyAmount > 0)
  }

  const calculateDailyFinancials = () => {
    // Calculate daily revenue and costs
    const dailyRevenue = salesScenario.reduce((total, item) => {
      return total + item.menuItem.price * item.dailyQuantity
    }, 0)

    const dailyFoodCost = salesScenario.reduce((total, item) => {
      const itemCost = calculateItemCost(item.menuItem)
      return total + itemCost * item.dailyQuantity
    }, 0)

    const dailyLaborCost = settings.useMonthlyView ? settings.monthlyLaborCost / workingDaysPerMonth : settings.dailyLaborCost

    // Calculate daily operating expenses based on working days
    const dailyOperatingExpenses = getExpenseBreakdown().reduce((sum, expense) => sum + expense.dailyAmount, 0)

    const dailyTotalCost = dailyFoodCost + dailyLaborCost + dailyOperatingExpenses
    const dailyProfit = dailyRevenue - dailyTotalCost

    return {
      revenue: dailyRevenue,
      foodCost: dailyFoodCost,
      laborCost: dailyLaborCost,
      operatingExpenses: dailyOperatingExpenses,
      totalCost: dailyTotalCost,
      profit: dailyProfit,
      profitMargin: dailyRevenue > 0 ? (dailyProfit / dailyRevenue) * 100 : 0
    }
  }

  const calculateMonthlyFinancials = () => {
    const daily = calculateDailyFinancials()

    return {
      revenue: daily.revenue * workingDaysPerMonth,
      foodCost: daily.foodCost * workingDaysPerMonth,
      laborCost: settings.useMonthlyView ? settings.monthlyLaborCost : daily.laborCost * workingDaysPerMonth,
      operatingExpenses: daily.operatingExpenses * workingDaysPerMonth,
      totalCost: daily.totalCost * workingDaysPerMonth,
      profit: daily.profit * workingDaysPerMonth,
      profitMargin: daily.profitMargin
    }
  }

  const calculateBreakEvenPoint = () => {
    const monthly = calculateMonthlyFinancials()

    if (monthly.revenue <= 0) return { daily: 0, monthly: 0, percentage: 0 }

    const revenueNeeded = monthly.totalCost
    const currentMultiplier = revenueNeeded / monthly.revenue

    return {
      daily: Math.ceil(currentMultiplier),
      monthly: Math.ceil(currentMultiplier),
      percentage: monthly.revenue > 0 ? (monthly.revenue / revenueNeeded) * 100 : 0
    }
  }

  const dailyFinancials = calculateDailyFinancials()
  const monthlyFinancials = calculateMonthlyFinancials()
  const breakEven = calculateBreakEvenPoint()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  // Autocomplete options for menu items
  const menuItemOptions = menuItems.map(item => ({
    value: item.id,
    label: item.name,
    item: item
  }))

  // Scenario table columns
  const scenarioColumns: ColumnsType<SalesScenarioItem> = [
    {
      title: t('item_col'),
      dataIndex: 'menuItem',
      key: 'item',
      render: (menuItem: MenuItem) => (
        <div>
          <Text strong>{menuItem.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{menuItem.category}</Text>
        </div>
      )
    },
    {
      title: t('daily_qty_col'),
      key: 'quantity',
      align: 'center',
      width: 120,
      render: (_, record, index) => (
        <Input
          type="number"
          value={record.dailyQuantity}
          onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
          min={0}
          style={{ width: 80, textAlign: 'center' }}
        />
      )
    },
    {
      title: t('unit_price_col'),
      key: 'price',
      align: isRtl ? 'left' : 'right',
      render: (_, record) => <Text>{formatCurrency(record.menuItem.price)}</Text>
    },
    {
      title: t('unit_cost_col'),
      key: 'cost',
      align: isRtl ? 'left' : 'right',
      render: (_, record) => {
        const unitCost = calculateItemCost(record.menuItem)
        return <Text type="danger">{formatCurrency(unitCost)}</Text>
      }
    },
    {
      title: t('unit_profit_col'),
      key: 'unitProfit',
      align: isRtl ? 'left' : 'right',
      render: (_, record) => {
        const unitCost = calculateItemCost(record.menuItem)
        const unitProfit = record.menuItem.price - unitCost
        return (
          <Text strong style={{ color: unitProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {formatCurrency(unitProfit)}
          </Text>
        )
      }
    },
    {
      title: t('daily_revenue_col'),
      key: 'dailyRevenue',
      align: isRtl ? 'left' : 'right',
      render: (_, record) => {
        const dailyRevenue = record.menuItem.price * record.dailyQuantity
        return <Text strong>{formatCurrency(dailyRevenue)}</Text>
      }
    },
    {
      title: t('daily_profit_col'),
      key: 'dailyProfit',
      align: isRtl ? 'left' : 'right',
      render: (_, record) => {
        const unitCost = calculateItemCost(record.menuItem)
        const unitProfit = record.menuItem.price - unitCost
        const dailyProfit = unitProfit * record.dailyQuantity
        return (
          <Text strong style={{ color: dailyProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {formatCurrency(dailyProfit)}
          </Text>
        )
      }
    },
    {
      title: t('actions'),
      key: 'actions',
      align: 'center',
      width: 80,
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItemFromScenario(index)}
        />
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Space size="middle">
          <BarChartOutlined style={{ fontSize: 32, color: '#1890ff' }} />
          <Title level={2} style={{ margin: 0 }}>
            {t('break_even_analysis')}
          </Title>
        </Space>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setShowImporter(true)}>
            {t('import_sales_data')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={resetScenario} disabled={salesScenario.length === 0}>
            {t('reset_scenario')}
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* Settings Panel */}
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space>
                <CalculatorOutlined />
                <Title level={5} style={{ margin: 0 }}>{t('bea_settings')}</Title>
              </Space>

              <div>
                <Text>{t('monthly_view')}</Text>
                <Switch
                  checked={settings.useMonthlyView}
                  onChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      useMonthlyView: checked
                    }))
                  }
                  style={{ marginLeft: 8 }}
                />
              </div>

              {settings.useMonthlyView ? (
                <>
                  <div>
                    <Text>{t('monthly_labor_cost_label')}</Text>
                    <Input
                      type="number"
                      value={settings.monthlyLaborCost}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          monthlyLaborCost: parseFloat(e.target.value) || 0
                        }))
                      }
                      prefix={!isRtl && '$'}
                      suffix={isRtl && '$'}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                  <div>
                    <Text>{t('working_days_per_week_label')}</Text>
                    <Input
                      type="number"
                      value={settings.workingDaysPerWeek}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          workingDaysPerWeek: parseInt(e.target.value) || 3
                        }))
                      }
                      min={1}
                      max={7}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                  <div>
                    <Text>{t('weeks_per_month_label')}</Text>
                    <Input
                      type="number"
                      value={settings.weeksPerMonth}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          weeksPerMonth: parseFloat(e.target.value) || 4.33
                        }))
                      }
                      min={4}
                      max={5}
                      step={0.1}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                  <Alert
                    message={t('working_days_per_month_info', { days: Math.round(workingDaysPerMonth) })}
                    type="info"
                  />
                </>
              ) : (
                <div>
                  <Text>{t('daily_labor_cost_label')}</Text>
                  <Input
                    type="number"
                    value={settings.dailyLaborCost}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        dailyLaborCost: parseFloat(e.target.value) || 0
                      }))
                    }
                    prefix={!isRtl && '$'}
                    suffix={isRtl && '$'}
                    style={{ marginTop: 8 }}
                  />
                </div>
              )}
            </Space>
          </Card>

          {/* Add Items to Scenario */}
          <Card style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Title level={5} style={{ margin: 0 }}>
                {t('add_items_to_scenario')}
              </Title>

              <AutoComplete
                style={{ width: '100%' }}
                options={menuItemOptions}
                value={selectedMenuItem?.name || ''}
                onSelect={(value) => {
                  const item = menuItems.find(m => m.id === value)
                  setSelectedMenuItem(item || null)
                }}
                onChange={(value) => {
                  if (!value) setSelectedMenuItem(null)
                }}
                placeholder={t('select_menu_item_label')}
                filterOption={(inputValue, option) =>
                  option!.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                }
              >
                {menuItems.map(option => (
                  <Select.Option key={option.id} value={option.id}>
                    <div>
                      <div>{option.name}</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {formatCurrency(option.price)} • {option.category}
                      </Text>
                    </div>
                  </Select.Option>
                ))}
              </AutoComplete>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addItemToScenario}
                disabled={!selectedMenuItem}
                block
              >
                {t('add_to_scenario')}
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Sales Scenario */}
        <Col xs={24} md={16}>
          <Card>
            <Title level={5} style={{ marginBottom: 16 }}>
              {t('daily_sales_scenario')}
            </Title>

            {/* Show imported sales info */}
            {importedSalesInfo && (
              <Alert
                message={
                  <>
                    <Text strong>Imported Sales Data: {importedSalesInfo.businessName}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Period: {importedSalesInfo.dateRange} | Total Revenue: ₪{importedSalesInfo.totalRevenue.toFixed(2)} | Total Items: {importedSalesInfo.totalQuantity}
                    </Text>
                  </>
                }
                type="success"
                style={{ marginBottom: 16 }}
              />
            )}

            {salesScenario.length === 0 ? (
              <Alert message={t('sales_scenario_hint')} type="info" />
            ) : (
              <Table
                dataSource={salesScenario}
                columns={scenarioColumns}
                rowKey="menuItemId"
                pagination={false}
                size="small"
                summary={() => {
                  const totalQuantity = salesScenario.reduce((sum, item) => sum + item.dailyQuantity, 0)
                  const totalCost = salesScenario.reduce((sum, item) => {
                    const unitCost = calculateItemCost(item.menuItem)
                    return sum + unitCost * item.dailyQuantity
                  }, 0)
                  const totalRevenue = salesScenario.reduce((sum, item) => {
                    return sum + item.menuItem.price * item.dailyQuantity
                  }, 0)
                  const totalProfit = salesScenario.reduce((sum, item) => {
                    const unitCost = calculateItemCost(item.menuItem)
                    const unitProfit = item.menuItem.price - unitCost
                    return sum + unitProfit * item.dailyQuantity
                  }, 0)

                  return (
                    <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                      <Table.Summary.Cell index={0}>
                        <Text strong>{t('totals')}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="center">
                        <Text strong>{totalQuantity}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align={isRtl ? 'left' : 'right'}>
                        <Text type="secondary">-</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align={isRtl ? 'left' : 'right'}>
                        <Text strong style={{ color: '#ff4d4f' }}>{formatCurrency(totalCost)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align={isRtl ? 'left' : 'right'}>
                        <Text type="secondary">-</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} align={isRtl ? 'left' : 'right'}>
                        <Text strong>{formatCurrency(totalRevenue)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={6} align={isRtl ? 'left' : 'right'}>
                        <Text strong style={{ color: totalProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>
                          {formatCurrency(totalProfit)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={7} align="center">
                        <Text type="secondary">-</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )
                }}
              />
            )}
          </Card>
        </Col>

        {/* Financial Analysis */}
        {salesScenario.length > 0 && (
          <>
            <Col xs={24} md={12}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Space>
                    <RiseOutlined />
                    <Title level={5} style={{ margin: 0 }}>{t('daily_analysis')}</Title>
                  </Space>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{t('revenue_label')}</Text>
                    <Text strong>{formatCurrency(dailyFinancials.revenue)}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{t('food_cost_label')}</Text>
                    <Text style={{ color: '#ff4d4f' }}>{formatCurrency(dailyFinancials.foodCost)}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{t('labor_cost_label')}</Text>
                    <Text style={{ color: '#ff4d4f' }}>{formatCurrency(dailyFinancials.laborCost)}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Text type="secondary">{t('operating_expenses_label')}</Text>
                      <Button
                        type="text"
                        size="small"
                        icon={showExpenseBreakdown ? <UpOutlined /> : <DownOutlined />}
                        onClick={() => setShowExpenseBreakdown(!showExpenseBreakdown)}
                      />
                    </Space>
                    <Text style={{ color: '#ff4d4f' }}>{formatCurrency(dailyFinancials.operatingExpenses)}</Text>
                  </div>

                  {/* Expense Breakdown */}
                  {showExpenseBreakdown && (
                    <Card size="small" style={{ backgroundColor: '#fafafa', marginLeft: isRtl ? 0 : 16, marginRight: isRtl ? 16 : 0 }}>
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Text type="secondary" strong style={{ fontSize: '12px' }}>
                          {t('daily_expense_breakdown_title', { days: Math.round(workingDaysPerMonth) })}
                        </Text>
                        {getExpenseBreakdown().map((expense, index) => {
                          let calculationNote = ''
                          switch (expense.frequency) {
                            case 'daily':
                              calculationNote = `${formatCurrency(expense.amount)}/day`
                              break
                            case 'weekly':
                              calculationNote = `${formatCurrency(expense.amount)}/week ÷ 7`
                              break
                            case 'monthly':
                              calculationNote = `${formatCurrency(expense.amount)}/month ÷ ${Math.round(workingDaysPerMonth)}`
                              break
                            case 'yearly':
                              calculationNote = `${formatCurrency(expense.amount)}/year ÷ ${Math.round(workingDaysPerMonth * 12)}`
                              break
                          }

                          return (
                            <div key={expense.id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Space size="small">
                                <DollarOutlined style={{ fontSize: 14, color: '#8c8c8c' }} />
                                <div>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>{expense.name}</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: '10px' }}>{calculationNote}</Text>
                                </div>
                                <Tag style={{ fontSize: '10px' }}>{t(expense.frequency)}</Tag>
                              </Space>
                              <Text style={{ color: '#ff4d4f', fontSize: '12px' }} strong>
                                {formatCurrency(expense.dailyAmount)}
                              </Text>
                            </div>
                          )
                        })}
                        {getExpenseBreakdown().length === 0 && (
                          <Text type="secondary" italic style={{ fontSize: '12px' }}>
                            No active operating expenses found
                          </Text>
                        )}
                        <Divider style={{ margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: '12px' }}>
                            {t('total_daily_operating_expenses')}
                          </Text>
                          <Text strong style={{ color: '#ff4d4f', fontSize: '12px' }}>
                            {formatCurrency(getExpenseBreakdown().reduce((sum, exp) => sum + exp.dailyAmount, 0))}
                          </Text>
                        </div>
                      </Space>
                    </Card>
                  )}

                  <Divider />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>{t('total_cost_label')}</Text>
                    <Text strong style={{ color: '#ff4d4f' }}>
                      {formatCurrency(dailyFinancials.totalCost)}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>{t('daily_profit_label')}</Text>
                    <Text strong style={{ color: dailyFinancials.profit >= 0 ? '#52c41a' : '#ff4d4f' }}>
                      {formatCurrency(dailyFinancials.profit)}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>{t('profit_margin_label')}</Text>
                    <Tag color={dailyFinancials.profitMargin >= 0 ? 'success' : 'error'}>
                      {dailyFinancials.profitMargin.toFixed(1)}%
                    </Tag>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Space>
                    <BarChartOutlined />
                    <Title level={5} style={{ margin: 0 }}>{t('monthly_projection')}</Title>
                  </Space>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{t('monthly_revenue_label')}</Text>
                    <Text strong>{formatCurrency(monthlyFinancials.revenue)}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Text type="secondary">{t('monthly_costs_label')}</Text>
                      <Button
                        type="text"
                        size="small"
                        icon={showMonthlyExpenseBreakdown ? <UpOutlined /> : <DownOutlined />}
                        onClick={() => setShowMonthlyExpenseBreakdown(!showMonthlyExpenseBreakdown)}
                      />
                    </Space>
                    <Text style={{ color: '#ff4d4f' }}>{formatCurrency(monthlyFinancials.totalCost)}</Text>
                  </div>

                  {/* Monthly Expense Breakdown */}
                  {showMonthlyExpenseBreakdown && (
                    <Card size="small" style={{ backgroundColor: '#fafafa', marginLeft: isRtl ? 0 : 16, marginRight: isRtl ? 16 : 0 }}>
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Text type="secondary" strong style={{ fontSize: '12px' }}>
                          {t('monthly_cost_breakdown')}
                        </Text>

                        {/* Food Costs */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space size="small">
                            <DollarOutlined style={{ fontSize: 14, color: '#8c8c8c' }} />
                            <Text type="secondary" style={{ fontSize: '12px' }}>{t('food_costs_label')}</Text>
                            <Tag style={{ fontSize: '10px' }}>{t('variable_label')}</Tag>
                          </Space>
                          <Text style={{ color: '#ff4d4f', fontSize: '12px' }} strong>
                            {formatCurrency(monthlyFinancials.foodCost)}
                          </Text>
                        </div>

                        {/* Labor Costs */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space size="small">
                            <DollarOutlined style={{ fontSize: 14, color: '#8c8c8c' }} />
                            <Text type="secondary" style={{ fontSize: '12px' }}>{t('labor_costs_label')}</Text>
                            <Tag style={{ fontSize: '10px' }}>{t('fixed_label')}</Tag>
                          </Space>
                          <Text style={{ color: '#ff4d4f', fontSize: '12px' }} strong>
                            {formatCurrency(monthlyFinancials.laborCost)}
                          </Text>
                        </div>

                        {/* Operating Expenses */}
                        {getExpenseBreakdown().map((expense, index) => (
                          <div key={expense.id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space size="small">
                              <DollarOutlined style={{ fontSize: 14, color: '#8c8c8c' }} />
                              <Text type="secondary" style={{ fontSize: '12px' }}>{expense.name}</Text>
                              <Tag style={{ fontSize: '10px' }}>{expense.frequency}</Tag>
                            </Space>
                            <Text style={{ color: '#ff4d4f', fontSize: '12px' }} strong>
                              {formatCurrency(expense.dailyAmount * workingDaysPerMonth)}
                            </Text>
                          </div>
                        ))}

                        <Divider style={{ margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: '12px' }}>
                            {t('total_monthly_costs_label')}
                          </Text>
                          <Text strong style={{ color: '#ff4d4f', fontSize: '12px' }}>
                            {formatCurrency(monthlyFinancials.totalCost)}
                          </Text>
                        </div>
                      </Space>
                    </Card>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>{t('monthly_profit_label')}</Text>
                    <Text strong style={{ color: monthlyFinancials.profit >= 0 ? '#52c41a' : '#ff4d4f' }}>
                      {formatCurrency(monthlyFinancials.profit)}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>

            {/* Break-Even Analysis */}
            <Col xs={24}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Space>
                    <CalculatorOutlined />
                    <Title level={5} style={{ margin: 0 }}>{t('break_even_analysis')}</Title>
                  </Space>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text>{t('progress_to_breakeven')}</Text>
                      <Text strong>{breakEven.percentage.toFixed(1)}%</Text>
                    </div>
                    <Progress
                      percent={Math.min(breakEven.percentage, 100)}
                      strokeColor={breakEven.percentage >= 100 ? '#52c41a' : '#1890ff'}
                      showInfo={false}
                    />
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                      <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fafafa' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{t('current_status')}</Text>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                          {breakEven.percentage >= 100 ? (
                            <>
                              <RiseOutlined style={{ color: '#52c41a' }} />
                              <Title level={5} style={{ margin: 0, color: '#52c41a' }}>{t('profitable')}</Title>
                            </>
                          ) : (
                            <>
                              <FallOutlined style={{ color: '#ff4d4f' }} />
                              <Title level={5} style={{ margin: 0, color: '#ff4d4f' }}>{t('below_breakeven')}</Title>
                            </>
                          )}
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                      <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fafafa' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{t('revenue_needed')}</Text>
                        <Title level={5} style={{ margin: '8px 0 0 0' }}>{formatCurrency(monthlyFinancials.totalCost)}</Title>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{t('per_month_short')}</Text>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                      <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fafafa' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{t('daily_revenue_gap')}</Text>
                        <Title level={5} style={{ margin: '8px 0 0 0', color: dailyFinancials.profit >= 0 ? '#52c41a' : '#ff4d4f' }}>
                          {formatCurrency(Math.abs((monthlyFinancials.totalCost - monthlyFinancials.revenue) / workingDaysPerMonth))}
                        </Title>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {dailyFinancials.profit >= 0 ? t('surplus') : t('shortage')}
                        </Text>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                      <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fafafa' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{t('scale_factor_needed')}</Text>
                        <Title level={5} style={{ margin: '8px 0 0 0' }}>
                          {breakEven.percentage < 100 ? `${(100 / breakEven.percentage).toFixed(1)}x` : '1.0x'}
                        </Title>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{t('current_volume')}</Text>
                      </Card>
                    </Col>
                  </Row>

                  {breakEven.percentage < 100 && (
                    <Alert
                      message={t('to_reach_breakeven_msg', { scale: (100 / breakEven.percentage).toFixed(1), amount: formatCurrency(monthlyFinancials.totalCost - monthlyFinancials.revenue) })}
                      type="warning"
                    />
                  )}

                  {breakEven.percentage >= 100 && (
                    <Alert
                      message={t('congratulations_profitable_msg', { amount: formatCurrency(monthlyFinancials.profit) })}
                      type="success"
                    />
                  )}
                </Space>
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* AI Sales Importer Dialog */}
      <AISalesImporter open={showImporter} onClose={() => setShowImporter(false)} onSalesDataImported={handleSalesDataImported} title={t('import_sales_data_title')} description={t('import_sales_data_description')} />
    </div>
  )
}
