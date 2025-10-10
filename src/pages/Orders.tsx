import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Typography, Button, Modal, Input, Table, Tag, Space, message, Select, Tabs, Divider, Statistic, Collapse, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, UploadOutlined, ShoppingCartOutlined, CheckCircleOutlined, CloseCircleOutlined, DollarOutlined, ClockCircleOutlined, UserOutlined, RiseOutlined, FallOutlined, LineOutlined, EnvironmentOutlined, BulbOutlined, ExpandAltOutlined } from '@ant-design/icons'
import { Order, OrderItem, MenuItem, Employee, Customer } from '../types'
import { ordersService, menuItemsService, employeesService, customersService, subscriptions } from '../services/supabaseService'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../utils/currency'
import AIOrderImporter from '../components/Orders/AIOrderImporter'
import { ingredientsService } from '../services/supabaseService'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs
const { Panel } = Collapse

export default function Orders() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const [tabValue, setTabValue] = useState('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Dialog states
  const [openOrderDialog, setOpenOrderDialog] = useState(false)
  const [openImportDialog, setOpenImportDialog] = useState(false)
  const [openAIImportDialog, setOpenAIImportDialog] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'status' | 'location' | 'none'>('none')
  const [sortBy, setSortBy] = useState<'time' | 'total' | 'status'>('time')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Form states
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    items: [],
    total: 0,
    subtotal: 0,
    taxAmount: 0,
    tipAmount: 0,
    status: 'completed',
    orderTime: new Date(),
    location: 'Main Location',
    paymentMethod: 'card',
    paymentStatus: 'completed'
  })

  // Order form specific states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [taxRate, setTaxRate] = useState(0.08) // 8% tax rate

  const [importData, setImportData] = useState('')

  // Load data on component mount
  useEffect(() => {
    loadAllData()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const ordersSubscription = subscriptions.orders
      ? subscriptions.orders(() => {
          loadOrders()
        })
      : null

    return () => {
      if (ordersSubscription) {
        ordersSubscription.unsubscribe()
      }
    }
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadOrders(), loadMenuItems(), loadEmployees(), loadCustomers(), loadIngredients()])
    } catch (error) {
      message.error(t('failed_to_load_data'))
    } finally {
      setLoading(false)
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

  const loadCustomers = async () => {
    try {
      const data = await customersService.getAll()
      setCustomers(data)
    } catch (error) {
      console.error('Failed to load customers:', error)
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

  // Calculate food cost for an order
  const calculateOrderFoodCost = (order: Order): number => {
    let totalFoodCost = 0

    order.items.forEach(orderItem => {
      const menuItem = menuItems.find(mi => mi.id === orderItem.menuItemId)
      if (menuItem && menuItem.ingredients) {
        const itemFoodCost = menuItem.ingredients.reduce((cost, ingredient) => {
          const ing = ingredients.find(i => i.id === ingredient.ingredientId)
          if (ing) {
            return cost + ing.costPerUnit * ingredient.quantity
          }
          return cost
        }, 0)
        totalFoodCost += itemFoodCost * orderItem.quantity
      }
    })

    return totalFoodCost
  }

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await ordersService.updateStatus(orderId, status)
      message.success(t('order_status_updated', { status }))
      await loadOrders()
    } catch (error) {
      message.error(t('failed_to_update_order_status'))
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await ordersService.delete(orderId)
      message.success(t('order_deleted_successfully'))
      await loadOrders()
    } catch (error) {
      message.error(t('failed_to_delete_order'))
    }
  }

  // Order form helper functions
  const addMenuItem = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItemId === menuItem.id)

    if (existingItem) {
      setOrderItems(prev => prev.map(item => (item.menuItemId === menuItem.id ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice } : item)))
    } else {
      const newItem: OrderItem = {
        menuItemId: menuItem.id,
        menuItem: {
          name: menuItem.name,
          description: menuItem.description,
          price: menuItem.price
        },
        quantity: 1,
        unitPrice: menuItem.price,
        totalPrice: menuItem.price
      }
      setOrderItems(prev => [...prev, newItem])
    }
  }

  const updateItemQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.menuItemId !== menuItemId))
    } else {
      setOrderItems(prev => prev.map(item => (item.menuItemId === menuItemId ? { ...item, quantity, totalPrice: quantity * item.unitPrice } : item)))
    }
  }

  const removeMenuItem = (menuItemId: string) => {
    setOrderItems(prev => prev.filter(item => item.menuItemId !== menuItemId))
  }

  // Calculate order totals
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const taxAmount = subtotal * taxRate
    const tipAmount = newOrder.tipAmount || 0
    const total = subtotal + taxAmount + tipAmount

    return { subtotal, taxAmount, tipAmount, total }
  }

  const resetOrderForm = () => {
    setOrderItems([])
    setSelectedCustomerId('')
    setNewCustomer({ firstName: '', lastName: '', email: '', phone: '' })
    setShowNewCustomerForm(false)
    setNewOrder({
      items: [],
      total: 0,
      subtotal: 0,
      taxAmount: 0,
      tipAmount: 0,
      status: 'completed',
      orderTime: new Date(),
      location: 'Main Location',
      paymentMethod: 'card',
      paymentStatus: 'completed'
    })
  }

  const handleCreateOrder = async () => {
    try {
      let customerId = selectedCustomerId

      // Create new customer if needed
      if (showNewCustomerForm && newCustomer.firstName) {
        const customer = await customersService.create(newCustomer as Omit<Customer, 'id' | 'businessId'>)
        customerId = customer.id
      }

      const totals = calculateTotals()

      const orderData: Omit<Order, 'id' | 'orderNumber' | 'businessId'> = {
        customerId: customerId || undefined,
        items: orderItems,
        total: totals.total,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        tipAmount: totals.tipAmount,
        discountAmount: 0,
        status: 'completed',
        orderTime: newOrder.orderTime || new Date(),
        completedTime: newOrder.orderTime || new Date(),
        location: newOrder.location || 'Main Location',
        paymentMethod: newOrder.paymentMethod || 'card',
        paymentStatus: 'completed',
        specialInstructions: newOrder.specialInstructions
      }

      await ordersService.create(orderData)
      message.success(t('order_created_successfully'))
      setOpenOrderDialog(false)
      resetOrderForm()
      await loadOrders()
      if (showNewCustomerForm) {
        await loadCustomers()
      }
    } catch (error) {
      message.error(t('failed_to_create_order'))
    }
  }

  const handleImportOrders = async () => {
    try {
      // Parse the import data (expecting JSON format)
      const externalOrders = JSON.parse(importData)
      const importedOrders = await ordersService.importFromExternal(externalOrders)

      message.success(t('successfully_imported_orders', { count: importedOrders.length }))

      setImportData('')
      setOpenImportDialog(false)
      await loadOrders()
    } catch (error) {
      message.error(t('failed_to_import_orders'))
    }
  }

  const handleAIOrdersImported = async (orders: Order[]) => {
    message.success(t('successfully_imported_orders_ai', { count: orders.length }))
    await loadOrders()
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'preparing':
        return 'processing'
      case 'ready':
        return 'success'
      case 'completed':
        return 'default'
      case 'cancelled':
        return 'error'
      case 'refunded':
        return 'error'
      default:
        return 'default'
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵'
      case 'card':
        return '💳'
      case 'mobile':
        return '📱'
      case 'online':
        return '🌐'
      default:
        return '💰'
    }
  }

  // Calculate comprehensive business analytics
  const getDateFilters = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay())
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(thisWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(thisWeekStart)
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    return { today, yesterday, thisWeekStart, lastWeekStart, lastWeekEnd, thisMonth, lastMonth, lastMonthEnd }
  }

  const analytics = () => {
    const { today, yesterday, thisWeekStart, lastWeekStart, lastWeekEnd, thisMonth, lastMonth, lastMonthEnd } = getDateFilters()

    // Filter orders by time periods
    const todayOrders = orders.filter(o => new Date(o.orderTime) >= today)
    const yesterdayOrders = orders.filter(o => {
      const orderDate = new Date(o.orderTime)
      return orderDate >= yesterday && orderDate < today
    })
    const thisWeekOrders = orders.filter(o => new Date(o.orderTime) >= thisWeekStart)
    const lastWeekOrders = orders.filter(o => {
      const orderDate = new Date(o.orderTime)
      return orderDate >= lastWeekStart && orderDate <= lastWeekEnd
    })
    const thisMonthOrders = orders.filter(o => new Date(o.orderTime) >= thisMonth)
    const lastMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.orderTime)
      return orderDate >= lastMonth && orderDate <= lastMonthEnd
    })

    // Revenue calculations
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0)
    const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + o.total, 0)
    const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + o.total, 0)
    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.total, 0)
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + o.total, 0)

    // Growth calculations
    const dailyGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0
    const weeklyGrowth = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0
    const monthlyGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

    // Top-selling items analysis
    const itemSales = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        const itemName = item.menuItem?.name || 'Unknown Item'
        if (!acc[itemName]) {
          acc[itemName] = { quantity: 0, revenue: 0 }
        }
        acc[itemName].quantity += item.quantity
        acc[itemName].revenue += item.totalPrice
      })
      return acc
    }, {} as Record<string, { quantity: number; revenue: number }>)

    const topItems = Object.entries(itemSales)
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, 5)

    // Peak hours analysis
    const hourlyOrders = orders.reduce((acc, order) => {
      const hour = new Date(order.orderTime).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const peakHour = Object.entries(hourlyOrders).sort(([, a], [, b]) => b - a)[0]

    // Payment method breakdown
    const paymentMethods = orders.reduce((acc, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate average profit margin
    const ordersWithCost = orders.filter(order => {
      const foodCost = calculateOrderFoodCost(order)
      return foodCost > 0 && order.subtotal > 0
    })

    const averageProfitMargin =
      ordersWithCost.length > 0
        ? ordersWithCost.reduce((sum, order) => {
            const foodCost = calculateOrderFoodCost(order)
            const profit = order.subtotal - foodCost
            const margin = (profit / order.subtotal) * 100
            return sum + margin
          }, 0) / ordersWithCost.length
        : 0

    // Calculate total food costs and profits
    const totalFoodCost = orders.reduce((sum, order) => sum + calculateOrderFoodCost(order), 0)
    const totalProfit = orders.reduce((sum, order) => {
      const foodCost = calculateOrderFoodCost(order)
      return sum + (order.subtotal - foodCost)
    }, 0)

    return {
      todayOrders: todayOrders.length,
      todayRevenue,
      dailyGrowth,
      thisWeekOrders: thisWeekOrders.length,
      thisWeekRevenue,
      weeklyGrowth,
      thisMonthOrders: thisMonthOrders.length,
      thisMonthRevenue,
      monthlyGrowth,
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
      averageProfitMargin,
      totalFoodCost,
      totalProfit,
      ordersWithCostData: ordersWithCost.length,
      topItems,
      peakHour: peakHour ? { hour: parseInt(peakHour[0]), count: peakHour[1] } : null,
      paymentMethods,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.total, 0)
    }
  }

  const stats = analytics()

  // Group and sort orders
  const getGroupedOrders = () => {
    // First sort orders
    let sortedOrders = [...orders]

    switch (sortBy) {
      case 'time':
        sortedOrders.sort((a, b) => {
          const timeA = new Date(a.orderTime).getTime()
          const timeB = new Date(b.orderTime).getTime()
          return sortOrder === 'desc' ? timeB - timeA : timeA - timeB
        })
        break
      case 'total':
        sortedOrders.sort((a, b) => {
          return sortOrder === 'desc' ? b.total - a.total : a.total - b.total
        })
        break
      case 'status':
        const statusOrder = ['pending', 'preparing', 'ready', 'completed', 'cancelled', 'refunded']
        sortedOrders.sort((a, b) => {
          const indexA = statusOrder.indexOf(a.status)
          const indexB = statusOrder.indexOf(b.status)
          return sortOrder === 'desc' ? indexB - indexA : indexA - indexB
        })
        break
    }

    if (groupBy === 'none') {
      return [{ group: t('all_orders_text'), orders: sortedOrders, key: 'all' }]
    }

    // Group orders
    const grouped = sortedOrders.reduce((groups, order) => {
      let groupKey: string

      switch (groupBy) {
        case 'day':
          groupKey = new Date(order.orderTime).toLocaleDateString()
          break
        case 'week':
          const weekStart = new Date(order.orderTime)
          weekStart.setDate(weekStart.getDate() - weekStart.getDay())
          groupKey = t('week_of_date', { date: weekStart.toLocaleDateString() })
          break
        case 'month':
          groupKey = new Date(order.orderTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
          break
        case 'status':
          groupKey = order.status.charAt(0).toUpperCase() + order.status.slice(1)
          break
        case 'location':
          groupKey = order.location || t('unknown_location')
          break
        default:
          groupKey = t('all_orders_text')
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(order)
      return groups
    }, {} as Record<string, Order[]>)

    return Object.entries(grouped)
      .map(([group, orders]) => ({ group, orders, key: group }))
      .sort((a, b) => {
        if (groupBy === 'day' || groupBy === 'week' || groupBy === 'month') {
          // Sort by newest date first for time-based grouping
          return new Date(b.orders[0]?.orderTime).getTime() - new Date(a.orders[0]?.orderTime).getTime()
        }
        return a.group.localeCompare(b.group)
      })
  }

  const toggleGroupExpansion = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey)
    } else {
      newExpanded.add(groupKey)
    }
    setExpandedGroups(newExpanded)
  }

  // Auto-expand groups when grouping changes
  useEffect(() => {
    if (groupBy === 'day') {
      // Auto-expand today's orders
      const today = new Date().toLocaleDateString()
      setExpandedGroups(new Set([today]))
    } else if (groupBy !== 'none') {
      // For other groupings, expand the first group by default
      setExpandedGroups(new Set())
    }
  }, [groupBy])

  const groupedOrders = getGroupedOrders()

  const getTrendIcon = (value: number) => {
    if (value > 0) return <RiseOutlined style={{ color: '#52c41a' }} />
    if (value < 0) return <FallOutlined style={{ color: '#ff4d4f' }} />
    return <LineOutlined style={{ color: '#d9d9d9' }} />
  }

  const columns: ColumnsType<Order> = [
    {
      title: t('order_number'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (_, record) => <Text strong>{record.orderNumber || record.id.slice(0, 8)}</Text>
    },
    {
      title: t('time'),
      dataIndex: 'orderTime',
      key: 'orderTime',
      sorter: true,
      render: (time: Date) => time.toLocaleString()
    },
    {
      title: t('customer'),
      key: 'customer',
      render: (_, record) =>
        record.customer ? (
          <div>
            <Text>
              {record.customer.firstName} {record.customer.lastName}
            </Text>
            <br />
            <Text type="secondary">{record.customer.phone}</Text>
          </div>
        ) : (
          <Text type="secondary">{t('walk_in')}</Text>
        )
    },
    {
      title: t('items'),
      key: 'items',
      render: (_, record) => (
        <div>
          <Text>{t('items_count', { count: record.items.length })}</Text>
          <br />
          <Text type="secondary">{record.items.map(item => `${item.quantity}x ${item.menuItem?.name || 'Unknown'}`).join(', ')}</Text>
        </div>
      )
    },
    {
      title: t('total'),
      dataIndex: 'total',
      key: 'total',
      sorter: true,
      align: isRtl ? 'left' : 'right',
      render: (_, record) => (
        <div>
          <Text strong>{formatCurrency(record.total)}</Text>
          <br />
          <Text type="secondary">
            {t('sub_label')}: {formatCurrency(record.subtotal)}
            {record.taxAmount && record.taxAmount > 0 && ` | ${t('tax_label')}: ${formatCurrency(record.taxAmount)}`}
            {record.tipAmount && record.tipAmount > 0 && ` | ${t('tip_label')}: ${formatCurrency(record.tipAmount)}`}
          </Text>
        </div>
      )
    },
    {
      title: t('food_cost'),
      key: 'foodCost',
      align: isRtl ? 'left' : 'right',
      render: (_, record) => {
        const foodCost = calculateOrderFoodCost(record)
        return <Text type={foodCost > 0 ? undefined : 'secondary'}>{foodCost > 0 ? formatCurrency(foodCost) : t('no_data')}</Text>
      }
    },
    {
      title: t('profit'),
      key: 'profit',
      align: isRtl ? 'left' : 'right',
      render: (_, record) => {
        const foodCost = calculateOrderFoodCost(record)
        const profit = record.subtotal - foodCost
        const profitMargin = record.subtotal > 0 ? (profit / record.subtotal) * 100 : 0
        return (
          <div>
            <Text strong style={{ color: profit > 0 ? '#52c41a' : profit < 0 ? '#ff4d4f' : undefined }}>
              {foodCost > 0 ? formatCurrency(profit) : t('no_data')}
            </Text>
            {foodCost > 0 && (
              <>
                <br />
                <Text type="secondary">{t('margin_percent', { margin: profitMargin.toFixed(1) })}</Text>
              </>
            )}
          </div>
        )
      }
    },
    {
      title: t('payment'),
      key: 'payment',
      render: (_, record) => (
        <Space>
          <span>{getPaymentMethodIcon(record.paymentMethod)}</span>
          <Text>{record.paymentMethod}</Text>
        </Space>
      )
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: Order['status']) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: t('source'),
      key: 'source',
      render: (_, record) => (
        <div>
          <Text>{record.externalSource || t('manual')}</Text>
          {record.externalOrderId && (
            <>
              <br />
              <Text type="secondary">ID: {record.externalOrderId}</Text>
            </>
          )}
        </div>
      )
    },
    {
      title: t('actions'),
      key: 'actions',
      align: isRtl ? 'left' : 'right',
      render: (_, record) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteOrder(record.id)} title={t('delete_order')} />
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4}>{t('order_management')}</Title>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setOpenImportDialog(true)}>
            {t('import_orders')}
          </Button>
          <Button icon={<BulbOutlined />} onClick={() => setOpenAIImportDialog(true)}>
            {t('ai_import')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenOrderDialog(true)}>
            {t('add_order_record')}
          </Button>
        </Space>
      </div>

      {/* Enhanced Business Analytics Dashboard */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Today's Performance */}
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t('todays_performance')} value={formatCurrency(stats.todayRevenue)} suffix={getTrendIcon(stats.dailyGrowth)} />
            <Text type="secondary">{t('orders_count', { count: stats.todayOrders })}</Text>
            <div style={{ marginTop: 8 }}>
              <Text type={stats.dailyGrowth > 0 ? 'success' : stats.dailyGrowth < 0 ? 'danger' : 'secondary'}>
                {stats.dailyGrowth > 0 ? '+' : ''}
                {stats.dailyGrowth.toFixed(1)}%
              </Text>
            </div>
          </Card>
        </Col>

        {/* This Week */}
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t('this_week')} value={formatCurrency(stats.thisWeekRevenue)} suffix={getTrendIcon(stats.weeklyGrowth)} />
            <Text type="secondary">{t('orders_group_count', { count: stats.thisWeekOrders })}</Text>
            <div style={{ marginTop: 8 }}>
              <Text type={stats.weeklyGrowth > 0 ? 'success' : stats.weeklyGrowth < 0 ? 'danger' : 'secondary'}>
                {stats.weeklyGrowth > 0 ? '+' : ''}
                {stats.weeklyGrowth.toFixed(1)}%
              </Text>
            </div>
          </Card>
        </Col>

        {/* This Month */}
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t('this_month')} value={formatCurrency(stats.thisMonthRevenue)} suffix={getTrendIcon(stats.monthlyGrowth)} />
            <Text type="secondary">{t('orders_group_count', { count: stats.thisMonthOrders })}</Text>
            <div style={{ marginTop: 8 }}>
              <Text type={stats.monthlyGrowth > 0 ? 'success' : stats.monthlyGrowth < 0 ? 'danger' : 'secondary'}>
                {stats.monthlyGrowth > 0 ? '+' : ''}
                {stats.monthlyGrowth.toFixed(1)}%
              </Text>
            </div>
          </Card>
        </Col>

        {/* Average Order Value */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title={t('avg_order_value_short')} value={formatCurrency(stats.averageOrderValue)} prefix={<DollarOutlined />} valueStyle={{ color: '#3f8600' }} />
            <Text type="secondary">{t('total_orders_text', { count: stats.totalOrders })}</Text>
          </Card>
        </Col>

        {/* Average Profit Margin */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('avg_profit_margin')}
              value={stats.ordersWithCostData > 0 ? `${stats.averageProfitMargin.toFixed(1)}%` : t('no_data')}
              prefix={<RiseOutlined />}
              valueStyle={{ color: stats.averageProfitMargin > 30 ? '#3f8600' : stats.averageProfitMargin > 0 ? '#faad14' : '#cf1322' }}
            />
            <Text type="secondary">{t('with_cost_data', { ordersWithCostData: stats.ordersWithCostData, totalOrders: stats.totalOrders })}</Text>
          </Card>
        </Col>

        {/* Top Selling Items */}
        <Col xs={24} md={6}>
          <Card title={<span>🏆 {t('top_selling_items')}</span>} bordered={false}>
            {stats.topItems.slice(0, 5).map(([itemName, data], index) => (
              <div key={itemName} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>
                    #{index + 1} {itemName}
                  </Text>
                  <Text type="secondary">
                    {data.quantity} {t('sold')}
                  </Text>
                </div>
                <Text type="secondary">
                  {formatCurrency(data.revenue)} {t('revenue')}
                </Text>
              </div>
            ))}
            {stats.topItems.length === 0 && <Text type="secondary">{t('no_sales_data')}</Text>}
          </Card>
        </Col>

        {/* Key Metrics */}
        <Col xs={24} md={6}>
          <Card title={<span>📊 {t('key_metrics')}</span>} bordered={false}>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Card bordered style={{ textAlign: 'center' }}>
                  <DollarOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <Title level={5} style={{ margin: '8px 0' }}>
                    {formatCurrency(stats.averageOrderValue)}
                  </Title>
                  <Text type="secondary">{t('avg_order_value')}</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered style={{ textAlign: 'center' }}>
                  <RiseOutlined style={{ fontSize: 24, color: stats.averageProfitMargin > 30 ? '#52c41a' : stats.averageProfitMargin > 0 ? '#faad14' : '#cf1322' }} />
                  <Title level={5} style={{ margin: '8px 0', color: stats.averageProfitMargin > 30 ? '#52c41a' : stats.averageProfitMargin > 0 ? '#faad14' : '#cf1322' }}>
                    {stats.ordersWithCostData > 0 ? `${stats.averageProfitMargin.toFixed(1)}%` : t('no_data')}
                  </Title>
                  <Text type="secondary">{t('avg_profit_margin')}</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered style={{ textAlign: 'center' }}>
                  <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <Title level={5} style={{ margin: '8px 0' }}>
                    {stats.totalOrders}
                  </Title>
                  <Text type="secondary">{t('total_orders')}</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered style={{ textAlign: 'center' }}>
                  <DollarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <Title level={5} style={{ margin: '8px 0' }}>
                    {formatCurrency(stats.totalProfit)}
                  </Title>
                  <Text type="secondary">{t('total_profit')}</Text>
                </Card>
              </Col>
              {stats.peakHour && (
                <Col span={12}>
                  <Card bordered style={{ textAlign: 'center' }}>
                    <ClockCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />
                    <Title level={5} style={{ margin: '8px 0' }}>
                      {stats.peakHour.hour}:00
                    </Title>
                    <Text type="secondary">{t('peak_hour')}</Text>
                  </Card>
                </Col>
              )}
              <Col span={12}>
                <Card bordered style={{ textAlign: 'center' }}>
                  <DollarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <Title level={5} style={{ margin: '8px 0' }}>
                    {formatCurrency(stats.totalRevenue)}
                  </Title>
                  <Text type="secondary">{t('total_revenue')}</Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Payment Methods Breakdown */}
        <Col xs={24} md={6}>
          <Card title={<span>💳 {t('payment_methods')}</span>} bordered={false}>
            {Object.entries(stats.paymentMethods).map(([method, count]) => (
              <div key={method} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>
                    {getPaymentMethodIcon(method)} {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Text>
                  <Text type="secondary">
                    {t('orders_group_count', { count })} ({((count / stats.totalOrders) * 100).toFixed(1)}%)
                  </Text>
                </div>
              </div>
            ))}
            {Object.keys(stats.paymentMethods).length === 0 && <Text type="secondary">{t('no_payment_data')}</Text>}
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={tabValue} onChange={setTabValue}>
          <TabPane tab={t('all_orders')} key="all">
            {/* Table Toolbar with Grouping Control */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5}>{t('orders_count_label', { count: orders.length })}</Title>
              <Space>
                <Select value={groupBy} onChange={setGroupBy} style={{ width: 150 }}>
                  <Option value="none">{t('no_grouping')}</Option>
                  <Option value="day">{t('day_label')}</Option>
                  <Option value="week">{t('week_label')}</Option>
                  <Option value="month">{t('month_label')}</Option>
                  <Option value="status">{t('status_label')}</Option>
                  <Option value="location">{t('location_label')}</Option>
                </Select>
              </Space>
            </div>

            {groupBy === 'none' ? (
              <Table columns={columns} dataSource={groupedOrders[0]?.orders || []} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
            ) : (
              <Collapse>
                {groupedOrders.map(group => (
                  <Panel
                    header={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={5} style={{ margin: 0 }}>
                          {group.group}
                        </Title>
                        <Space>
                          <Text type="secondary">{t('orders_group_count', { count: group.orders.length })}</Text>
                          <Text type="secondary">{formatCurrency(group.orders.reduce((sum, order) => sum + order.total, 0))}</Text>
                        </Space>
                      </div>
                    }
                    key={group.key}
                  >
                    <Table columns={columns} dataSource={group.orders} rowKey="id" pagination={false} />
                  </Panel>
                ))}
              </Collapse>
            )}

            {groupedOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <Title level={5} type="secondary">
                  {t('no_orders_found')}
                </Title>
              </div>
            )}
          </TabPane>
          <TabPane tab={t('analytics')} key="analytics">
            <div style={{ marginBottom: 24 }}>
              <Text>{t('detailed_analytics_message')}</Text>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Import Dialog */}
      <Modal
        title={t('import_orders_clearing_device')}
        open={openImportDialog}
        onCancel={() => setOpenImportDialog(false)}
        onOk={handleImportOrders}
        cancelText={t('cancel')}
        width={800}
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        styles={{
          footer: { textAlign: isRtl ? 'left' : 'right', direction: isRtl ? 'rtl' : 'ltr' }
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>{t('clearing_device_import_instructions')}</Text>
        </div>
        <TextArea
          rows={10}
          placeholder={`[
  {
    "externalId": "DEF001",
    "total": 15.50,
    "subtotal": 14.23,
    "taxAmount": 1.27,
    "orderTime": "2024-01-15T14:30:00Z",
    "paymentMethod": "card",
    "items": [
      {
        "menuItemId": "menu-item-uuid-here",
        "quantity": 1,
        "unitPrice": 14.23
      }
    ]
  }
]`}
          value={importData}
          onChange={e => setImportData(e.target.value)}
        />
      </Modal>

      {/* AI Order Importer Dialog */}
      <AIOrderImporter open={openAIImportDialog} onClose={() => setOpenAIImportDialog(false)} onOrdersImported={handleAIOrdersImported} />
    </div>
  )
}
