import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Typography, Spin, Tag, Divider, Statistic, Space } from 'antd'
import {
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  StarFilled,
} from '@ant-design/icons'
import { inventoryService, suppliersService, ordersService, transactionsService, employeesService, shiftsService, menuItemsService, customersService, financialGoalsService } from '../services/supabaseService'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '../contexts/BusinessContext'
import { InventoryItem, Supplier, Order, Transaction, Employee, Shift, MenuItem, Customer, FinancialGoal } from '../types'
import { formatCurrency } from '../utils/currency'

const { Title, Text } = Typography

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  subtitle?: string
  prefix?: React.ReactNode
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, prefix }) => (
  <Card bordered={false} style={{ height: '100%' }}>
    <Statistic
      title={title}
      value={value}
      prefix={prefix || icon}
      valueStyle={{ color }}
      suffix={subtitle && <div style={{ fontSize: 14, fontWeight: 'normal', color: '#8c8c8c', marginTop: 8 }}>{subtitle}</div>}
    />
    {subtitle && (
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
        {subtitle}
      </Text>
    )}
  </Card>
)

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { currentBusiness } = useBusiness()
  const isRtl = i18n.dir() === 'rtl'
  const [loading, setLoading] = useState(true)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([])

  useEffect(() => {
    if (currentBusiness?.id) {
      loadData()
    }
  }, [currentBusiness?.id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [inventoryData, suppliersData, ordersData, transactionsData, employeesData, shiftsData, menuItemsData, customersData, financialGoalsData] = await Promise.all([inventoryService.getAll(), suppliersService.getAll(), ordersService.getAll(), transactionsService.getAll(), employeesService.getAll(), shiftsService.getAll(), menuItemsService.getAll(), customersService.getAll(), financialGoalsService.getAll()])
      setInventoryItems(inventoryData)
      setSuppliers(suppliersData)
      setOrders(ordersData)
      setTransactions(transactionsData)
      setEmployees(employeesData)
      setShifts(shiftsData)
      setMenuItems(menuItemsData)
      setCustomers(customersData)
      setFinancialGoals(financialGoalsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Date calculations
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const startOfWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  // Filter today's data
  const todaysOrders = orders.filter(order => {
    const orderDate = new Date(order.orderTime)
    return orderDate.toDateString() === today.toDateString()
  })

  const yesterdaysOrders = orders.filter(order => {
    const orderDate = new Date(order.orderTime)
    return orderDate.toDateString() === yesterday.toDateString()
  })

  const thisWeeksOrders = orders.filter(order => {
    const orderDate = new Date(order.orderTime)
    return orderDate >= startOfWeek
  })

  const thisMonthsOrders = orders.filter(order => {
    const orderDate = new Date(order.orderTime)
    return orderDate >= startOfMonth
  })

  // Revenue calculations
  const todaysRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0)
  const yesterdaysRevenue = yesterdaysOrders.reduce((sum, order) => sum + order.total, 0)
  const revenueChange = yesterdaysRevenue > 0 ? ((todaysRevenue - yesterdaysRevenue) / yesterdaysRevenue) * 100 : 0

  // Orders calculations
  const todaysOrderCount = todaysOrders.length
  const yesterdaysOrderCount = yesterdaysOrders.length
  const orderChange = yesterdaysOrderCount > 0 ? ((todaysOrderCount - yesterdaysOrderCount) / yesterdaysOrderCount) * 100 : 0

  // Staff calculations
  const todaysShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date)
    return shiftDate.toDateString() === today.toDateString()
  })
  const activeStaff = todaysShifts.length

  // Average order value
  const averageOrderValue = todaysOrderCount > 0 ? todaysRevenue / todaysOrderCount : 0

  // Calculate profit margin based on menu items
  const totalCosts = todaysOrders.reduce((sum, order) => {
    return (
      sum +
      order.items.reduce((itemSum, item) => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId)
        return itemSum + (menuItem?.totalIngredientCost || 0) * item.quantity
      }, 0)
    )
  }, 0)
  const profitMargin = todaysRevenue > 0 ? ((todaysRevenue - totalCosts) / todaysRevenue) * 100 : 0

  // Top selling items this week
  const itemSales = new Map<string, { count: number; revenue: number; name: string }>()
  thisWeeksOrders.forEach(order => {
    order.items.forEach(item => {
      const existing = itemSales.get(item.menuItemId) || { count: 0, revenue: 0, name: '' }
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId)
      itemSales.set(item.menuItemId, {
        count: existing.count + item.quantity,
        revenue: existing.revenue + item.totalPrice,
        name: menuItem?.name || 'Unknown Item'
      })
    })
  })
  const topSellingItems = Array.from(itemSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  // Customer metrics
  const totalCustomers = customers.length
  const newCustomersThisMonth = customers.filter(customer => {
    return customer.lastVisit && new Date(customer.lastVisit) >= startOfMonth
  }).length
  const averageLoyaltyPoints = totalCustomers > 0 ? customers.reduce((sum, customer) => sum + (customer.loyaltyPoints || 0), 0) / totalCustomers : 0

  // Financial goals progress
  const activeGoals = financialGoals.filter(goal => goal.isActive)
  const monthlyRevenueGoal = activeGoals.find(goal => goal.type === 'monthly_revenue')
  const thisMonthRevenue = thisMonthsOrders.reduce((sum, order) => sum + order.total, 0)
  const goalProgress = monthlyRevenueGoal ? (thisMonthRevenue / monthlyRevenueGoal.targetAmount) * 100 : 0

  // Peak hours analysis
  const hourlyOrders = new Array(24).fill(0)
  todaysOrders.forEach(order => {
    const hour = new Date(order.orderTime).getHours()
    hourlyOrders[hour]++
  })
  const peakHour = hourlyOrders.indexOf(Math.max(...hourlyOrders))
  const peakHourFormatted = peakHour === 0 ? '12:00 AM' : peakHour < 12 ? `${peakHour}:00 AM` : peakHour === 12 ? '12:00 PM' : `${peakHour - 12}:00 PM`

  // Inventory calculations
  const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minThreshold)
  const autoOrderSuggestions = lowStockItems
    .map(item => {
      const supplier = suppliers.find(sup => sup.name === item.supplier && sup.autoOrderEnabled && sup.isActive)
      if (!supplier) return null

      const suggestedQuantity = Math.max(item.minThreshold * 2 - item.currentStock, supplier.minimumOrderAmount / item.costPerUnit)

      return {
        item,
        supplier,
        suggestedQuantity: Math.ceil(suggestedQuantity),
        totalCost: suggestedQuantity * item.costPerUnit
      }
    })
    .filter(Boolean)

  const estimatedOrderValue = autoOrderSuggestions.reduce((sum, order) => sum + (order?.totalCost || 0), 0)
  const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + item.currentStock * item.costPerUnit, 0)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <Row gutter={[16, 16]}>
        {/* Top Stats */}
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title={t('todays_revenue')}
            value={formatCurrency(todaysRevenue)}
            icon={<DollarOutlined />}
            color={revenueChange >= 0 ? '#52c41a' : '#ff4d4f'}
            subtitle={revenueChange >= 0 ? t('plus_percent_from_yesterday', { percent: Math.abs(revenueChange).toFixed(1) }) : `${revenueChange.toFixed(1)}% ${t('from_yesterday')}`}
            prefix={revenueChange >= 0 ? <RiseOutlined /> : <FallOutlined />}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <StatCard
            title={t('orders_today')}
            value={todaysOrderCount}
            icon={<ShoppingOutlined />}
            color="#1890ff"
            subtitle={orderChange >= 0 ? t('plus_percent_from_yesterday', { percent: Math.abs(orderChange).toFixed(1) }) : `${orderChange.toFixed(1)}% ${t('from_yesterday')}`}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <StatCard
            title={t('active_staff')}
            value={activeStaff}
            icon={<TeamOutlined />}
            color="#1890ff"
            subtitle={t('on_duty_today')}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <StatCard
            title={t('profit_margin')}
            value={`${profitMargin.toFixed(1)}%`}
            icon={profitMargin >= 20 ? <RiseOutlined /> : <FallOutlined />}
            color={profitMargin >= 20 ? '#52c41a' : profitMargin >= 10 ? '#faad14' : '#ff4d4f'}
            subtitle={t('today')}
          />
        </Col>

        {/* Auto-Order Status Card */}
        <Col xs={24} md={8}>
          <Card
            title={
              <Space>
                <ShoppingCartOutlined style={{ color: '#faad14' }} />
                {t('auto_order_status')}
              </Space>
            }
            bordered={false}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Space>
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                  <Text type="danger">
                    {lowStockItems.length} {t('low_stock_items')}
                  </Text>
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {autoOrderSuggestions.length} {t('suppliers_ready_for_auto_order')}
                  </Text>
                </div>
              </div>

              <Card
                size="small"
                style={{
                  background: 'rgba(127, 211, 199, 0.08)',
                  border: '1px solid rgba(127, 211, 199, 0.25)',
                }}
              >
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  {t('estimated_order_value')}
                </Text>
                <Title level={4} style={{ margin: 0, color: '#7fd3c7' }}>
                  {formatCurrency(estimatedOrderValue)}
                </Title>
              </Card>

              <Text type="secondary" style={{ fontSize: 11 }}>
                {t('visit_inventory_auto_order_to_review')}
              </Text>
            </Space>
          </Card>
        </Col>

        {/* Business Insights */}
        <Col xs={24} md={8}>
          <Card title={t('business_insights')} bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* Top Selling Items */}
              <div>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                  {t('top_selling_items_this_week')}
                </Text>
                {topSellingItems.length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {topSellingItems.map((item, index) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <Space>
                          <Tag
                            color={index === 0 ? 'gold' : index === 1 ? 'silver' : 'default'}
                            icon={index === 0 ? <StarFilled /> : undefined}
                          >
                            {index + 1}
                          </Tag>
                          <Text>{item.name}</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.count} {t('sold')} • {formatCurrency(item.revenue)}
                        </Text>
                      </div>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">{t('no_sales_this_week')}</Text>
                )}
              </div>

              <Divider style={{ margin: '8px 0' }} />

              {/* Business Metrics */}
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">{t('average_order_value')}:</Text>
                  <Text strong>{formatCurrency(averageOrderValue)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">{t('peak_hour_today')}:</Text>
                  <Text strong>
                    {peakHourFormatted} ({Math.max(...hourlyOrders)} {t('orders_text')})
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">{t('total_customers')}:</Text>
                  <Text strong>{totalCustomers.toLocaleString()}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">{t('inventory_value')}:</Text>
                  <Text strong>{formatCurrency(totalInventoryValue)}</Text>
                </div>
              </Space>
            </Space>
          </Card>
        </Col>

        {/* Performance Summary Card */}
        <Col xs={24} md={8}>
          <Card title={t('performance_summary')} bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* Weekly Performance */}
              <div>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                  {t('this_week')}
                </Text>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{t('orders_text')}:</Text>
                    <Text strong>{thisWeeksOrders.length}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{t('revenue')}:</Text>
                    <Text strong>{formatCurrency(thisWeeksOrders.reduce((sum, order) => sum + order.total, 0))}</Text>
                  </div>
                </Space>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              {/* Customer Insights */}
              <div>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                  {t('customers')}
                </Text>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{t('new_this_month')}:</Text>
                    <Text strong>{newCustomersThisMonth}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{t('avg_loyalty_points')}:</Text>
                    <Text strong>{averageLoyaltyPoints.toFixed(0)}</Text>
                  </div>
                </Space>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              {/* Staff Performance */}
              <div>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                  {t('staff_efficiency')}
                </Text>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{t('orders_per_staff_today')}:</Text>
                    <Text strong>{activeStaff > 0 ? (todaysOrderCount / activeStaff).toFixed(1) : '0'}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{t('revenue_per_staff')}:</Text>
                    <Text strong>{activeStaff > 0 ? formatCurrency(todaysRevenue / activeStaff) : formatCurrency(0)}</Text>
                  </div>
                </Space>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
