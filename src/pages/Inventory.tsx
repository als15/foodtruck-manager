import React, { useState, useEffect, useMemo } from 'react'
import { Row, Col, Card, Typography, Button, Modal, Input, Table, Tag, Space, AutoComplete, Spin, message, Dropdown, Divider, Tabs, Progress, Statistic, Alert as AntAlert } from 'antd'
import type { MenuProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined, AppstoreOutlined, MoreOutlined, ImportOutlined, ShoppingCartOutlined, CarOutlined, ClockCircleOutlined, EyeOutlined, EyeInvisibleOutlined, DeleteOutlined as DisposeIcon, BarChartOutlined, SearchOutlined } from '@ant-design/icons'
import { InventoryItem, Product, Supplier, Order, MenuItem } from '../types'
import { inventoryService, productsService, suppliersService, subscriptions, ordersService, menuItemsService } from '../services/supabaseService'
import WasteAnalyticsDashboard from '../components/WasteAnalyticsDashboard'
import { wasteExpenseIntegration } from '../utils/wasteExpenseIntegration'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../utils/currency'

const { Title, Text } = Typography
const { TabPane } = Tabs

export default function Inventory() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showAutoOrders, setShowAutoOrders] = useState(false)
  const [disposeDialog, setDisposeDialog] = useState({ open: false, item: null as InventoryItem | null, quantity: 0 })

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [currentTab, setCurrentTab] = useState('1')

  // Search and sort state
  type OrderBy = 'name' | 'category' | 'currentStock' | 'minThreshold' | 'costPerUnit' | 'supplier' | 'lastRestocked'
  const [searchQuery, setSearchQuery] = useState('')
  const [orderBy, setOrderBy] = useState<OrderBy>('name')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('asc')

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const inventorySubscription = subscriptions.inventory(payload => {
      console.log('Inventory changed:', payload)
      loadInventoryItems()
    })

    const productSubscription = subscriptions.products(payload => {
      console.log('Products changed:', payload)
      loadProducts()
    })

    return () => {
      inventorySubscription.unsubscribe()
      productSubscription.unsubscribe()
    }
  }, [])

  const loadData = async () => {
    await Promise.all([loadInventoryItems(), loadProducts(), loadSuppliers(), loadOrders(), loadMenuItems()])
  }

  const loadInventoryItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await inventoryService.getAll()
      setInventoryItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed_to_load_data'))
      message.error(t('failed_to_load_data'))
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await productsService.getAll()
      setAvailableProducts(data)
    } catch (err) {
      message.error(t('failed_to_load_data'))
    }
  }

  const loadSuppliers = async () => {
    try {
      const data = await suppliersService.getAll()
      setSuppliers(data)
    } catch (err) {
      message.error(t('failed_to_load_data'))
    }
  }

  const loadOrders = async () => {
    try {
      const data = await ordersService.getAll()
      setOrders(data)
    } catch (err) {
      message.error('Failed to load orders')
    }
  }

  const loadMenuItems = async () => {
    try {
      const data = await menuItemsService.getAll()
      setMenuItems(data)
    } catch (err) {
      message.error('Failed to load menu items')
    }
  }

  const handleImportFromProducts = async () => {
    try {
      // Get products that are not already in inventory
      const existingNames = new Set(inventoryItems.map(item => item.name.toLowerCase()))
      const missingProducts = availableProducts.filter(p => !existingNames.has(p.name.toLowerCase()))

      if (missingProducts.length === 0) {
        message.info('All products are already in inventory')
        return
      }

      await inventoryService.createFromIngredients(missingProducts.map(p => p.id))
      message.success(`Imported ${missingProducts.length} products to inventory`)
      await loadInventoryItems()
    } catch (err) {
      message.error('Failed to import products')
    }
  }

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    category: '',
    currentStock: 0,
    unit: '',
    minThreshold: 5,
    costPerUnit: 0,
    supplier: '',
    lastRestocked: new Date()
  })

  const handleProductSelect = (selectedProductName: string) => {
    const selectedProduct = availableProducts.find(p => p.name === selectedProductName)
    if (selectedProduct) {
      setNewItem({
        ...newItem,
        name: selectedProduct.name,
        category: selectedProduct.category,
        unit: selectedProduct.unit,
        costPerUnit: selectedProduct.costPerUnit,
        supplier: selectedProduct.supplier
      })
    } else {
      setNewItem({
        ...newItem,
        name: selectedProductName || '',
        category: '',
        unit: '',
        costPerUnit: 0,
        supplier: ''
      })
    }
  }

  const handleSaveItem = async () => {
    try {
      if (editingItem) {
        await inventoryService.update(editingItem.id, newItem)
        message.success('Inventory item updated successfully')
      } else {
        await inventoryService.create(newItem as Omit<InventoryItem, 'id'>)
        message.success('Inventory item created successfully')
      }

      await loadInventoryItems()

      setNewItem({
        name: '',
        category: '',
        currentStock: 0,
        unit: '',
        minThreshold: 5,
        costPerUnit: 0,
        supplier: '',
        lastRestocked: new Date()
      })
      setEditingItem(null)
      setOpenDialog(false)
    } catch (err) {
      message.error('Failed to save inventory item')
    }
  }

  const handleEditItem = (item: InventoryItem) => {
    setNewItem(item)
    setEditingItem(item)
    setOpenDialog(true)
  }

  const handleDeleteItem = async (id: string) => {
    try {
      await inventoryService.delete(id)
      message.success('Inventory item deleted successfully')
      await loadInventoryItems()
    } catch (err) {
      message.error('Failed to delete inventory item')
    }
  }

  const handleMarkAsDisposed = (item: InventoryItem) => {
    setDisposeDialog({ open: true, item, quantity: 0 })
  }

  const handleConfirmDisposal = async () => {
    if (!disposeDialog.item || disposeDialog.quantity <= 0) return

    try {
      const updatedItem = {
        ...disposeDialog.item,
        currentStock: Math.max(0, disposeDialog.item.currentStock - disposeDialog.quantity),
        disposedQuantity: (disposeDialog.item.disposedQuantity || 0) + disposeDialog.quantity
      }

      await inventoryService.update(disposeDialog.item.id, updatedItem)
      message.success(`Marked ${disposeDialog.quantity} ${disposeDialog.item.unit} of ${disposeDialog.item.name} as disposed`)
      await loadInventoryItems()
      setDisposeDialog({ open: false, item: null, quantity: 0 })
    } catch (err) {
      message.error('Failed to mark item as disposed')
    }
  }

  const addSampleWasteData = async () => {
    try {
      // Add sample waste data to a few inventory items for demonstration
      const itemsToUpdate = inventoryItems.slice(0, Math.min(3, inventoryItems.length))

      const updatePromises = itemsToUpdate.map((item, index) => {
        const sampleWaste = [2, 1.5, 3][index] || 1 // Different waste amounts
        const updatedItem = {
          ...item,
          disposedQuantity: sampleWaste
        }
        return inventoryService.update(item.id, updatedItem)
      })

      await Promise.all(updatePromises)
      await loadInventoryItems()

      message.success('Sample waste data added to demonstrate analytics features')
    } catch (error) {
      message.error('Failed to add sample waste data')
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.minThreshold) * 100
    if (percentage <= 50) return { status: 'critical', color: 'error' }
    if (percentage <= 100) return { status: 'low', color: 'warning' }
    return { status: 'good', color: 'success' }
  }

  const getStockPercentage = (item: InventoryItem) => {
    return Math.min((item.currentStock / (item.minThreshold * 2)) * 100, 100)
  }

  const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minThreshold)
  const totalInventoryValue = inventoryItems.reduce((total, item) => total + item.currentStock * item.costPerUnit, 0)

  // Generate auto-order suggestions
  const autoOrderSuggestions = lowStockItems
    .map(item => {
      const supplier = suppliers.find(sup => sup.name === item.supplier && sup.autoOrderEnabled && sup.isActive)
      if (!supplier) return null

      const suggestedQuantity = Math.max(
        item.minThreshold * 2 - item.currentStock, // Restock to double the threshold
        supplier.minimumOrderAmount / item.costPerUnit // Or meet minimum order amount
      )

      return {
        item,
        supplier,
        suggestedQuantity: Math.ceil(suggestedQuantity),
        totalCost: suggestedQuantity * item.costPerUnit,
        deliveryDays: supplier.deliveryDays,
        leadTime: supplier.leadTime
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b?.totalCost || 0) - (a?.totalCost || 0)) // Sort by cost descending

  // Get existing categories from inventory items (for display)
  const categories = Array.from(new Set(inventoryItems.map(item => item.category))).sort()

  // Get all product categories for autocomplete
  const allCategories = Array.from(new Set([...availableProducts.map(p => p.category), ...inventoryItems.map(item => item.category)])).sort()

  const totalAutoOrderValue = autoOrderSuggestions.reduce((sum, order) => sum + (order?.totalCost || 0), 0)

  // Sorting logic
  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && orderDirection === 'asc'
    setOrderDirection(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const sortedInventoryItems = useMemo(() => {
    const comparator = (a: InventoryItem, b: InventoryItem) => {
      let aValue: any
      let bValue: any

      switch (orderBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'category':
          aValue = a.category.toLowerCase()
          bValue = b.category.toLowerCase()
          break
        case 'currentStock':
          aValue = a.currentStock
          bValue = b.currentStock
          break
        case 'minThreshold':
          aValue = a.minThreshold
          bValue = b.minThreshold
          break
        case 'costPerUnit':
          aValue = a.costPerUnit
          bValue = b.costPerUnit
          break
        case 'supplier':
          aValue = (a.supplier || '').toLowerCase()
          bValue = (b.supplier || '').toLowerCase()
          break
        case 'lastRestocked':
          aValue = a.lastRestocked.getTime()
          bValue = b.lastRestocked.getTime()
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

    return [...inventoryItems].sort(comparator)
  }, [inventoryItems, orderBy, orderDirection])

  // Filter inventory items based on search query
  const filteredInventoryItems = useMemo(() => {
    if (!searchQuery.trim()) return sortedInventoryItems

    const query = searchQuery.toLowerCase()
    return sortedInventoryItems.filter(item => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.supplier && item.supplier.toLowerCase().includes(query)) ||
        item.unit.toLowerCase().includes(query)
      )
    })
  }, [sortedInventoryItems, searchQuery])

  // Auto-order suggestions table columns
  const autoOrderColumns: ColumnsType<any> = [
    {
      title: 'Item',
      dataIndex: 'item',
      key: 'item',
      render: (item: InventoryItem) => (
        <div>
          <Text strong>{item.name}</Text>
          <br />
          <Text type="danger" style={{ fontSize: 12 }}>
            {item.currentStock} / {item.minThreshold} {item.unit}
          </Text>
        </div>
      )
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (supplier: Supplier) => (
        <div>
          <Text>{supplier.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{supplier.contactPerson}</Text>
        </div>
      )
    },
    {
      title: 'Current Stock',
      dataIndex: 'item',
      key: 'currentStock',
      render: (item: InventoryItem) => (
        <Tag color="red">{item.currentStock} {item.unit}</Tag>
      )
    },
    {
      title: 'Suggested Qty',
      dataIndex: 'suggestedQuantity',
      key: 'suggestedQuantity',
      render: (qty: number, record: any) => (
        <Text style={{ color: '#1890ff' }}>{qty} {record.item.unit}</Text>
      )
    },
    {
      title: 'Unit Cost',
      dataIndex: 'item',
      key: 'unitCost',
      align: isRtl ? 'left' : 'right',
      render: (item: InventoryItem) => formatCurrency(item.costPerUnit)
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      align: isRtl ? 'left' : 'right',
      render: (cost: number) => <Text strong>{formatCurrency(cost)}</Text>
    },
    {
      title: 'Delivery',
      dataIndex: 'deliveryDays',
      key: 'delivery',
      render: (deliveryDays: string[], record: any) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <CarOutlined style={{ fontSize: 12 }} />
            <Text style={{ fontSize: 12 }}>{deliveryDays.join(', ')}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ClockCircleOutlined style={{ fontSize: 12 }} />
            <Text style={{ fontSize: 12 }}>{record.leadTime} days lead time</Text>
          </div>
        </div>
      )
    }
  ]

  const menuDropdownItems: MenuProps['items'] = [
    {
      key: 'import',
      icon: <ImportOutlined />,
      label: 'Import from Products',
      onClick: handleImportFromProducts
    }
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 16, padding: 16, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 8 }}>
          <Text type="danger">{error}</Text>
        </div>
        <Button type="primary" onClick={loadData}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          {t('inventory_management')}
        </Title>
        <Space>
          <Dropdown menu={{ items: menuDropdownItems }} placement="bottomRight">
            <Button icon={<MoreOutlined />}>
              {t('import')}
            </Button>
          </Dropdown>
          {inventoryItems.length > 0 && !inventoryItems.some(item => (item.disposedQuantity || 0) > 0) && currentTab === '2' && (
            <Button onClick={addSampleWasteData} type="default">
              {t('add_sample_waste_data')}
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenDialog(true)}>
            {t('add_item')}
          </Button>
        </Space>
      </div>

      {/* Tabs */}
      <Tabs activeKey={currentTab} onChange={setCurrentTab} style={{ marginBottom: 24 }}>
        <TabPane
          tab={
            <span>
              <AppstoreOutlined />
              {t('inventory_items')}
            </span>
          }
          key="1"
        >
          {lowStockItems.length > 0 && (
            <AntAlert
              message={<Text strong>{t('low_stock_alert')}</Text>}
              description={
                <Text>
                  {t('items_below_min_threshold', { count: lowStockItems.length })}: {lowStockItems.map(item => item.name).join(', ')}
                </Text>
              }
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 24 }}
            />
          )}

          {/* Auto-Order Suggestions */}
          {autoOrderSuggestions.length > 0 && (
            <Card style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShoppingCartOutlined />
                  {t('auto_order_suggestions')} ({autoOrderSuggestions.length})
                </Title>
                <Button
                  size="small"
                  icon={showAutoOrders ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => setShowAutoOrders(!showAutoOrders)}
                >
                  {showAutoOrders ? t('hide') : t('view')} {t('suggestions')}
                </Button>
              </div>
              <Text type="secondary">
                {t('total_estimated_cost')}: <Text strong>{formatCurrency(totalAutoOrderValue)}</Text>
              </Text>

              {showAutoOrders && (
                <div style={{ marginTop: 16 }}>
                  <Table
                    columns={autoOrderColumns}
                    dataSource={autoOrderSuggestions}
                    rowKey={(record: any) => record?.item?.id || record.id}
                    pagination={false}
                    size="small"
                  />
                </div>
              )}
            </Card>
          )}

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false}>
                <Statistic
                  title={t('total_items')}
                  value={inventoryItems.length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false}>
                <Statistic
                  title={t('low_stock_items')}
                  value={lowStockItems.length}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false}>
                <Statistic
                  title={t('total_value')}
                  value={formatCurrency(totalInventoryValue)}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false}>
                <Statistic
                  title={t('categories_text')}
                  value={categories.length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Search Bar */}
          <div style={{ marginBottom: 16 }}>
            <Input
              size="large"
              placeholder={t('search_inventory')}
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {categories.map(category => {
            const categoryItems = filteredInventoryItems.filter(item => item.category === category)
            if (categoryItems.length === 0) return null

            const columns: ColumnsType<InventoryItem> = [
              {
                title: t('item_name'),
                dataIndex: 'name',
                key: 'name',
                sorter: (a: InventoryItem, b: InventoryItem) => a.name.localeCompare(b.name),
                render: (name: string, record: InventoryItem) => (
                  <Space>
                    <Text strong>{name}</Text>
                    {record.currentStock <= record.minThreshold && <WarningOutlined style={{ color: '#faad14' }} />}
                  </Space>
                )
              },
              {
                title: t('current_stock'),
                dataIndex: 'currentStock',
                key: 'currentStock',
                sorter: (a: InventoryItem, b: InventoryItem) => a.currentStock - b.currentStock
              },
              {
                title: t('unit'),
                dataIndex: 'unit',
                key: 'unit'
              },
              {
                title: t('min_threshold'),
                dataIndex: 'minThreshold',
                key: 'minThreshold',
                sorter: (a: InventoryItem, b: InventoryItem) => a.minThreshold - b.minThreshold
              },
              {
                title: t('stock_level'),
                key: 'stockLevel',
                render: (_, record: InventoryItem) => {
                  const stockStatus = getStockStatus(record)
                  const stockPercentage = getStockPercentage(record)
                  return (
                    <Space direction="vertical" style={{ width: 120 }}>
                      <Progress
                        percent={stockPercentage}
                        status={stockStatus.color === 'error' ? 'exception' : stockStatus.color === 'warning' ? 'normal' : 'success'}
                        size="small"
                      />
                      <Tag color={stockStatus.color === 'error' ? 'red' : stockStatus.color === 'warning' ? 'orange' : 'green'}>
                        {stockStatus.status}
                      </Tag>
                    </Space>
                  )
                }
              },
              {
                title: t('disposed'),
                dataIndex: 'disposedQuantity',
                key: 'disposedQuantity',
                render: (qty: number, record: InventoryItem) =>
                  qty ? <Tag color="orange">{qty} {record.unit}</Tag> : <Text type="secondary">-</Text>
              },
              {
                title: t('cost_per_unit'),
                dataIndex: 'costPerUnit',
                key: 'costPerUnit',
                align: isRtl ? 'left' : 'right',
                sorter: (a: InventoryItem, b: InventoryItem) => a.costPerUnit - b.costPerUnit,
                render: (cost: number) => formatCurrency(cost)
              },
              {
                title: t('total_value'),
                key: 'totalValue',
                align: isRtl ? 'left' : 'right',
                render: (_, record: InventoryItem) => formatCurrency(record.currentStock * record.costPerUnit)
              },
              {
                title: t('supplier_label'),
                dataIndex: 'supplier',
                key: 'supplier',
                sorter: (a: InventoryItem, b: InventoryItem) => (a.supplier || '').localeCompare(b.supplier || '')
              },
              {
                title: t('last_restocked'),
                dataIndex: 'lastRestocked',
                key: 'lastRestocked',
                render: (date: Date) => new Date(date).toLocaleDateString(),
                sorter: (a: InventoryItem, b: InventoryItem) => new Date(a.lastRestocked).getTime() - new Date(b.lastRestocked).getTime()
              },
              {
                title: t('actions'),
                key: 'actions',
                align: isRtl ? 'left' : 'right',
                render: (_, record: InventoryItem) => (
                  <Space size="small">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEditItem(record)}
                      title="Edit item"
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<DisposeIcon />}
                      onClick={() => handleMarkAsDisposed(record)}
                      title="Mark as disposed"
                      style={{ color: '#faad14' }}
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteItem(record.id)}
                      title="Delete item"
                    />
                  </Space>
                )
              }
            ]

            return (
              <div key={category} style={{ marginBottom: 32 }}>
                <Title level={4} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AppstoreOutlined />
                  {category} ({categoryItems.length})
                </Title>
                <Card bordered={false}>
                  <Table
                    columns={columns}
                    dataSource={categoryItems}
                    rowKey="id"
                    pagination={false}
                    rowClassName={(record) => {
                      const stockStatus = getStockStatus(record)
                      return stockStatus.status === 'critical' ? 'ant-table-row-critical' : stockStatus.status === 'low' ? 'ant-table-row-warning' : ''
                    }}
                  />
                </Card>
              </div>
            )
          })}

          {filteredInventoryItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Text type="secondary">
                {searchQuery ? t('no_items_match_search') : t('no_items_found')}
              </Text>
            </div>
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              {t('waste_analytics')}
            </span>
          }
          key="2"
        >
          {/* Quick guide */}
          {inventoryItems.length > 0 && !inventoryItems.some(item => (item.disposedQuantity || 0) > 0) && (
            <AntAlert
              message={t('waste_analytics_dashboard')}
              description={t('start_tracking_waste_help')}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <WasteAnalyticsDashboard
            inventoryItems={inventoryItems}
            orders={orders}
            menuItems={menuItems}
            ingredients={availableProducts}
            onWasteExpenseCalculated={async expense => {
              try {
                await wasteExpenseIntegration.createOrUpdateWasteExpense(expense)
                message.success(t('waste_expense_added', { amount: formatCurrency(expense.amount) }))
              } catch (error) {
                console.error('Failed to integrate waste expense:', error)
                message.error(t('failed_to_update_waste_expense'))
              }
            }}
          />
        </TabPane>
      </Tabs>

      <Modal
        title={editingItem ? t('edit_inventory_item') : t('add_new_inventory_item')}
        open={openDialog}
        onOk={handleSaveItem}
        onCancel={() => {
          setOpenDialog(false)
          setEditingItem(null)
          setNewItem({
            name: '',
            category: '',
            currentStock: 0,
            unit: '',
            minThreshold: 5,
            costPerUnit: 0,
            supplier: '',
            lastRestocked: new Date()
          })
        }}
        okText={editingItem ? t('update_item') : t('add_item')}
        cancelText={t('cancel')}
        width={800}
      >
        <div style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text>{t('select_product_label')}</Text>
              <AutoComplete
                style={{ marginTop: 8, width: '100%' }}
                options={availableProducts
                  .filter(p => !inventoryItems.some(item => item.name.toLowerCase() === p.name.toLowerCase()))
                  .map(p => ({
                    value: p.name,
                    label: (
                      <div>
                        <div>{p.name}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {p.category} • {p.supplier} • {formatCurrency(p.costPerUnit)}/{p.unit}
                        </Text>
                      </div>
                    )
                  }))}
                value={newItem.name}
                onChange={handleProductSelect}
                placeholder={t('select_product_placeholder')}
                disabled={editingItem !== null}
              />
            </Col>
            <Col span={12}>
              <Text>Category</Text>
              <AutoComplete
                style={{ marginTop: 8, width: '100%' }}
                options={allCategories.map(cat => ({ value: cat }))}
                value={newItem.category}
                onChange={value => setNewItem({ ...newItem, category: value })}
                placeholder="e.g., Meat, Vegetables, Dairy"
              />
            </Col>
            <Col span={8}>
              <Text>Current Stock</Text>
              <Input
                style={{ marginTop: 8 }}
                type="number"
                value={newItem.currentStock}
                onChange={e => setNewItem({ ...newItem, currentStock: parseFloat(e.target.value) })}
              />
            </Col>
            <Col span={8}>
              <Text>{t('unit')}</Text>
              <Input
                style={{ marginTop: 8 }}
                value={newItem.unit}
                onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="e.g., lbs, dozen, pieces"
                disabled={!editingItem && !newItem.name}
              />
              {!editingItem && !newItem.name && (
                <Text type="secondary" style={{ fontSize: 11 }}>{t('auto_filled_from_product')}</Text>
              )}
            </Col>
            <Col span={8}>
              <Text>{t('min_threshold')}</Text>
              <Input
                style={{ marginTop: 8 }}
                type="number"
                value={newItem.minThreshold}
                onChange={e => setNewItem({ ...newItem, minThreshold: parseFloat(e.target.value) })}
              />
            </Col>
            <Col span={12}>
              <Text>{t('cost_per_unit')}</Text>
              <Input
                style={{ marginTop: 8 }}
                type="number"
                step="0.01"
                value={newItem.costPerUnit}
                onChange={e => setNewItem({ ...newItem, costPerUnit: parseFloat(e.target.value) })}
                disabled={!editingItem && !newItem.name}
              />
              {!editingItem && !newItem.name && (
                <Text type="secondary" style={{ fontSize: 11 }}>{t('auto_filled_from_product')}</Text>
              )}
            </Col>
            <Col span={12}>
              <Text>{t('supplier_label')}</Text>
              <Input
                style={{ marginTop: 8 }}
                value={newItem.supplier}
                onChange={e => setNewItem({ ...newItem, supplier: e.target.value })}
                disabled={!editingItem && !newItem.name}
              />
              {!editingItem && !newItem.name && (
                <Text type="secondary" style={{ fontSize: 11 }}>{t('auto_filled_from_product')}</Text>
              )}
            </Col>
            <Col span={24}>
              <Text>{t('last_restocked')}</Text>
              <Input
                style={{ marginTop: 8 }}
                type="date"
                value={newItem.lastRestocked?.toISOString().split('T')[0]}
                onChange={e => setNewItem({ ...newItem, lastRestocked: new Date(e.target.value) })}
              />
            </Col>
          </Row>
        </div>
      </Modal>

      <Modal
        title={
          <Space>
            <DisposeIcon style={{ color: '#faad14' }} />
            {t('mark_as_disposed_title')}
          </Space>
        }
        open={disposeDialog.open}
        onOk={handleConfirmDisposal}
        onCancel={() => setDisposeDialog({ open: false, item: null, quantity: 0 })}
        okText={t('mark_as_disposed_title')}
        cancelText={t('cancel')}
        okButtonProps={{
          disabled: disposeDialog.quantity <= 0 || disposeDialog.quantity > (disposeDialog.item?.currentStock || 0),
          danger: true
        }}
      >
        <div style={{ marginTop: 16 }}>
          <Text>
            {t('mark_quantity_disposed_for')} <Text strong>{disposeDialog.item?.name}</Text>
          </Text>
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <Text type="secondary">
              {t('current_stock')}: {disposeDialog.item?.currentStock} {disposeDialog.item?.unit}
              {disposeDialog.item?.disposedQuantity && (
                <>
                  <br />
                  {t('previously_disposed')}: {disposeDialog.item.disposedQuantity} {disposeDialog.item.unit}
                </>
              )}
            </Text>
          </div>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              type="number"
              placeholder={t('quantity_to_dispose')}
              value={disposeDialog.quantity}
              onChange={e => setDisposeDialog({ ...disposeDialog, quantity: parseFloat(e.target.value) || 0 })}
              min={0}
              max={disposeDialog.item?.currentStock || 0}
              step={0.01}
            />
            <Button
              onClick={() => setDisposeDialog({ ...disposeDialog, quantity: disposeDialog.item?.currentStock || 0 })}
            >
              {t('all_button')}
            </Button>
          </Space.Compact>
          <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
            {t('quantity_enter_between', { max: disposeDialog.item?.currentStock || 0, unit: disposeDialog.item?.unit || '' })}
          </Text>
        </div>
      </Modal>
    </div>
  )
}
