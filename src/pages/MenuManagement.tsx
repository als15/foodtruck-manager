import React, { useState, useEffect, useRef } from 'react'
import { Row, Col, Card, Typography, Button, Modal, Input, Table, Tag, Space, Spin, Alert, message, Select, Switch, Tabs, Divider, Statistic, Dropdown, Upload, Tooltip, FloatButton, Badge, Segmented } from 'antd'
import type { MenuProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, CalculatorOutlined, DeleteFilled, UploadOutlined, DownloadOutlined, SettingOutlined, AppstoreOutlined, UnorderedListOutlined, EyeInvisibleOutlined, EyeOutlined, DollarOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { MenuItem, Ingredient, MenuItemIngredient } from '../types'
import { menuItemsService, ingredientsService, menuCategoriesService, subscriptions } from '../services/supabaseService'
import Papa from 'papaparse'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '../contexts/BusinessContext'
import { formatCurrency } from '../utils/currency'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'available' | 'unavailable' | 'profitable' | 'low-margin'

export default function MenuManagement() {
  const { t, i18n } = useTranslation()
  const { currentBusiness } = useBusiness()
  const isRtl = i18n.dir() === 'rtl'

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importingIngredients, setImportingIngredients] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [editingQuantities, setEditingQuantities] = useState<{[key: number]: string}>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    ingredients: [],
    allergens: [],
    isAvailable: true,
    prepTime: 5
  })

  // Load data on component mount and when business changes
  useEffect(() => {
    if (currentBusiness?.id) {
      loadData()
      loadCategories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBusiness?.id])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentBusiness?.id) return

    const menuSubscription = subscriptions.menuItems(payload => {
      console.log('Menu items changed:', payload)
      loadMenuItems()
    })

    const ingredientSubscription = subscriptions.ingredients(payload => {
      console.log('Ingredients changed:', payload)
      loadIngredients()
    })

    return () => {
      menuSubscription.unsubscribe()
      ingredientSubscription.unsubscribe()
    }
  }, [currentBusiness?.id])

  const loadData = async () => {
    await Promise.all([loadMenuItems(), loadIngredients()])
  }

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await menuItemsService.getAll()
      setMenuItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu items')
      message.error(t('failed_to_load_menu_items'))
    } finally {
      setLoading(false)
    }
  }

  const loadIngredients = async () => {
    try {
      const data = await ingredientsService.getAll()
      setAvailableIngredients(data)
    } catch (err) {
      message.error(t('failed_to_load_ingredients'))
    }
  }

  const loadCategories = async () => {
    try {
      const data = await menuCategoriesService.getAll()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
      message.error(t('failed_to_load_categories'))
      setCategories(['salads', 'sandwiches', 'desserts', 'sweet pastries', 'savory pastries', 'fruit shakes', 'hot drinks', 'cold drinks'])
    }
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    setNewCategoryName('')
    setCategoryDialogOpen(true)
  }

  const handleEditCategory = (category: string) => {
    setEditingCategory(category)
    setNewCategoryName(category)
    setCategoryDialogOpen(true)
  }

  const handleDeleteCategory = async (category: string) => {
    const itemsWithCategory = menuItems.filter(item => item.category === category)
    if (itemsWithCategory.length > 0) {
      message.error(t('cannot_delete_category_in_use', { category, count: itemsWithCategory.length }))
      return
    }

    try {
      await menuCategoriesService.delete(category)
      await loadCategories()
      message.success(t('category_deleted_successfully'))
    } catch (err) {
      message.error(t('failed_to_delete_category'))
    }
  }

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      message.error(t('category_name_empty'))
      return
    }

    const trimmedName = newCategoryName.trim().toLowerCase()

    try {
      if (editingCategory) {
        if (trimmedName === editingCategory) {
          setCategoryDialogOpen(false)
          return
        }

        if (categories.includes(trimmedName)) {
          message.error(t('category_already_exists'))
          return
        }

        await menuCategoriesService.update(editingCategory, trimmedName)
        const itemsToUpdate = menuItems.filter(item => item.category === editingCategory)
        await Promise.all(itemsToUpdate.map(item => menuItemsService.update(item.id, { category: trimmedName })))
        await Promise.all([loadCategories(), loadMenuItems()])
        message.success(t('category_updated_successfully'))
      } else {
        if (categories.includes(trimmedName)) {
          message.error(t('category_already_exists'))
          return
        }

        await menuCategoriesService.create(trimmedName)
        await loadCategories()
        message.success(t('category_added_successfully'))
      }

      setCategoryDialogOpen(false)
    } catch (err) {
      message.error(t('failed_to_save_category'))
    }
  }

  const calculateIngredientCost = (ingredientId: string, quantity: number): number => {
    const ingredient = availableIngredients.find(ing => ing.id === ingredientId)
    return ingredient ? ingredient.costPerUnit * quantity : 0
  }

  const calculateTotalIngredientCost = (ingredients: MenuItemIngredient[]): number => {
    return ingredients.reduce((total, ing) => {
      return total + calculateIngredientCost(ing.ingredientId, ing.quantity)
    }, 0)
  }

  const calculateProfitMargin = (price: number, totalCost: number): number => {
    if (price <= 0) return 0
    if (totalCost === 0) return -1
    return ((price - totalCost) / price) * 100
  }

  const getIngredientName = (ingredientId: string): string => {
    const ingredient = availableIngredients.find(ing => ing.id === ingredientId)
    return ingredient ? ingredient.name : 'Unknown Ingredient'
  }

  const filteredItems = menuItems.filter(item => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    if (activeCategory !== 'all' && item.category !== activeCategory) {
      return false
    }

    switch (filterType) {
      case 'available':
        return item.isAvailable
      case 'unavailable':
        return !item.isAvailable
      case 'profitable':
        const totalCost = item.totalIngredientCost || calculateTotalIngredientCost(item.ingredients)
        const profitMargin = item.profitMargin || calculateProfitMargin(item.price, totalCost)
        return profitMargin > 30 && profitMargin !== -1
      case 'low-margin':
        const totalCostLow = item.totalIngredientCost || calculateTotalIngredientCost(item.ingredients)
        const profitMarginLow = item.profitMargin || calculateProfitMargin(item.price, totalCostLow)
        return (profitMarginLow < 20 && profitMarginLow !== -1) || profitMarginLow === -1
      default:
        return true
    }
  })

  const getCategoryCount = (category: string) => {
    if (category === 'all') return menuItems.length
    return menuItems.filter(item => item.category === category).length
  }

  const handleQuickEdit = (item: MenuItem, event: React.MouseEvent) => {
    event.stopPropagation()
    handleEditItem(item)
  }

  const visibleCategories = ['all', ...categories.filter(category => menuItems.some(item => item.category === category))]

  const renderGridView = () => (
    <Row gutter={[16, 16]}>
      {filteredItems.map(item => {
        const totalCost = item.totalIngredientCost || calculateTotalIngredientCost(item.ingredients)
        const profitMargin = item.profitMargin || calculateProfitMargin(item.price, totalCost)

        return (
          <Col xs={24} sm={12} lg={8} key={item.id}>
            <Card
              style={{ height: '100%', opacity: item.isAvailable ? 1 : 0.7 }}
              hoverable
              extra={
                <Badge status={item.isAvailable ? 'success' : 'error'} />
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div>
                  <Title level={5} style={{ marginBottom: 4, textAlign: isRtl ? 'right' : 'left' }}>
                    {item.name}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12, textAlign: isRtl ? 'right' : 'left', display: 'block' }}>
                    {item.description}
                  </Text>
                </div>

                <Card size="small" style={{ backgroundColor: 'var(--ant-color-bg-container-secondary)' }}>
                  <Space direction="horizontal" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <div>
                      <Title level={4} style={{ margin: 0, color: 'var(--ant-color-primary)' }}>
                        {formatCurrency(item.price)}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 11 }}>Cost: {formatCurrency(totalCost)}</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text type={profitMargin === -1 ? 'danger' : profitMargin > 30 ? 'success' : 'warning'} style={{ fontSize: 13, fontWeight: 600 }}>
                        {profitMargin === -1 ? t('no_cost_data') : `${profitMargin.toFixed(1)}% ${t('margin')}`}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {item.prepTime}
                        {t('minutes_short')} {t('prep')}
                      </Text>
                    </div>
                  </Space>
                </Card>

                {item.allergens && item.allergens.length > 0 && (
                  <Space wrap>
                    {item.allergens.slice(0, 3).map(allergen => (
                      <Tag key={allergen} color="warning" style={{ fontSize: 11 }}>
                        {allergen}
                      </Tag>
                    ))}
                    {item.allergens.length > 3 && <Tag style={{ fontSize: 11 }}>+{item.allergens.length - 3}</Tag>}
                  </Space>
                )}

                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <Switch checked={item.isAvailable} onChange={() => toggleAvailability(item.id)} size="small" />
                    <Text style={{ fontSize: 11 }}>{item.isAvailable ? 'Available' : 'Hidden'}</Text>
                  </Space>

                  <Space size="small">
                    <Button size="small" icon={<EditOutlined />} onClick={e => handleQuickEdit(item, e)} />
                    <Button size="small" icon={<CopyOutlined />} onClick={() => handleDuplicateItem(item)} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteItem(item.id)} />
                  </Space>
                </Space>
              </Space>
            </Card>
          </Col>
        )
      })}
    </Row>
  )

  const columns: ColumnsType<MenuItem> = [
    {
      title: 'Item',
      key: 'item',
      render: (_: any, item: MenuItem) => (
        <div>
          <Text strong>{item.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {item.description}
          </Text>
          {item.allergens && item.allergens.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {item.allergens.slice(0, 2).map((allergen: string) => (
                <Tag key={allergen} style={{ fontSize: 10, marginRight: 4 }}>
                  {allergen}
                </Tag>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Price',
      key: 'price',
      align: isRtl ? 'left' : 'right',
      render: (_: any, item: MenuItem) => {
        const totalCost = item.totalIngredientCost || calculateTotalIngredientCost(item.ingredients)
        return (
          <div>
            <Text strong style={{ fontSize: 15 }}>
              {formatCurrency(item.price)}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Cost: {formatCurrency(totalCost)}
            </Text>
          </div>
        )
      }
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center',
      render: (_: any, item: MenuItem) => <Switch checked={item.isAvailable} onChange={() => toggleAvailability(item.id)} size="small" />
    },
    {
      title: 'Margin',
      key: 'margin',
      align: isRtl ? 'left' : 'right',
      render: (_: any, item: MenuItem) => {
        const totalCost = item.totalIngredientCost || calculateTotalIngredientCost(item.ingredients)
        const profitMargin = item.profitMargin || calculateProfitMargin(item.price, totalCost)
        return (
          <Text type={profitMargin === -1 ? 'danger' : profitMargin > 30 ? 'success' : 'warning'} style={{ fontWeight: 600 }}>
            {profitMargin === -1 ? t('no_cost_data') : `${profitMargin.toFixed(1)}%`}
          </Text>
        )
      }
    },
    {
      title: 'Prep Time',
      key: 'prepTime',
      align: 'center',
      render: (_: any, item: MenuItem) => <Tag style={{ fontSize: 11 }}>{item.prepTime}min</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_: any, item: MenuItem) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={e => handleQuickEdit(item, e)} />
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleDuplicateItem(item)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteItem(item.id)} />
        </Space>
      )
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
        <Alert type="error" message={error} style={{ marginBottom: 16 }} />
        <Button type="primary" onClick={loadData}>
          {t('retry')}
        </Button>
      </div>
    )
  }

  const handleSaveItem = async () => {
    try {
      if (editingItem) {
        await menuItemsService.update(editingItem.id, newItem)
        message.success(t('menu_item_updated_success'))
      } else {
        await menuItemsService.create(newItem as Omit<MenuItem, 'id' | 'totalIngredientCost' | 'profitMargin'>)
        message.success(t('menu_item_created_success'))
      }

      await loadMenuItems()

      setNewItem({
        name: '',
        description: '',
        price: 0,
        category: '',
        ingredients: [],
        allergens: [],
        isAvailable: true,
        prepTime: 5
      })
      setEditingItem(null)
      setOpenDialog(false)
    } catch (err) {
      message.error(t('failed_to_save_menu_item'))
    }
  }

  const handleEditItem = (item: MenuItem) => {
    setNewItem(item)
    setEditingItem(item)
    setOpenDialog(true)
  }

  const handleDeleteItem = async (id: string) => {
    try {
      await menuItemsService.delete(id)
      message.success(t('menu_item_deleted_success'))
      await loadMenuItems()
    } catch (err) {
      message.error(t('failed_to_delete_menu_item'))
    }
  }

  const handleDuplicateItem = (item: MenuItem) => {
    const duplicatedItem = {
      ...item,
      name: `${item.name} (Copy)`,
      id: undefined,
      totalIngredientCost: undefined,
      profitMargin: undefined
    }
    setNewItem(duplicatedItem)
    setEditingItem(null)
    setOpenDialog(true)
  }

  const toggleAvailability = async (id: string) => {
    try {
      const item = menuItems.find(item => item.id === id)
      if (item) {
        await menuItemsService.update(id, { isAvailable: !item.isAvailable })
        message.success(t('availability_updated_success'))
        await loadMenuItems()
      }
    } catch (err) {
      message.error(t('failed_to_update_availability'))
    }
  }

  const addIngredientToItem = () => {
    const newIngredients = [...(newItem.ingredients || []), { ingredientId: '', quantity: 1, unit: '' }]
    setNewItem({ ...newItem, ingredients: newIngredients })
  }

  const updateIngredientInItem = (index: number, field: keyof MenuItemIngredient, value: any) => {
    const ingredients = [...(newItem.ingredients || [])]

    if (field === 'ingredientId' && value) {
      const selectedIngredient = availableIngredients.find(ing => ing.id === value)
      if (selectedIngredient) {
        ingredients[index] = {
          ...ingredients[index],
          [field]: value,
          unit: selectedIngredient.unit
        }
      } else {
        ingredients[index] = { ...ingredients[index], [field]: value }
      }
    } else {
      ingredients[index] = { ...ingredients[index], [field]: value }
    }

    setNewItem({ ...newItem, ingredients })
  }

  const removeIngredientFromItem = (index: number) => {
    const ingredients = [...(newItem.ingredients || [])]
    ingredients.splice(index, 1)
    setNewItem({ ...newItem, ingredients })
  }

  const handleImportIngredientsClick = () => {
    fileInputRef.current?.click()
  }

  const handleIngredientsFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportingIngredients(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        try {
          const importedIngredients: MenuItemIngredient[] = []
          const errors: string[] = []

          results.data.forEach((row: any, index: number) => {
            const ingredient = availableIngredients.find(ing => ing.id === row.ingredientId || ing.name.toLowerCase() === row.name?.toLowerCase())

            if (!ingredient) {
              errors.push(`Row ${index + 1}: Ingredient '${row.name || row.ingredientId}' not found`)
              return
            }

            const quantity = parseFloat(row.quantity)
            if (isNaN(quantity) || quantity <= 0) {
              errors.push(`Row ${index + 1}: Invalid quantity`)
              return
            }

            const unit = row.unit?.trim() || ingredient.unit

            importedIngredients.push({
              ingredientId: ingredient.id,
              quantity: quantity,
              unit: unit
            })
          })

          if (errors.length > 0) {
            message.error(`Import completed with ${errors.length} errors. Check console for details.`)
            console.error('Import errors:', errors)
          }

          const currentIngredients = newItem.ingredients || []
          const allIngredients = [...currentIngredients, ...importedIngredients]
          setNewItem({ ...newItem, ingredients: allIngredients })

          message.success(`Successfully imported ${importedIngredients.length} ingredients`)
        } catch (err) {
          message.error('Failed to import ingredients')
        } finally {
          setImportingIngredients(false)
          event.target.value = ''
        }
      },
      error: () => {
        setImportingIngredients(false)
        message.error('Failed to parse CSV file')
        event.target.value = ''
      }
    })
  }

  const downloadIngredientsTemplate = () => {
    const template = [
      {
        name: 'Ground Beef',
        ingredientId: '',
        quantity: 0.25,
        unit: ''
      },
      {
        name: 'Cheddar Cheese',
        ingredientId: '',
        quantity: 0.125,
        unit: ''
      }
    ]

    const csv = Papa.unparse(template)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'menu-item-ingredients-template.csv'
    link.click()
    message.success('Template downloaded successfully')
  }

  const handleAllergenChange = (value: string) => {
    const allergens = value
      .split(',')
      .map(a => a.trim())
      .filter(a => a)
    setNewItem({ ...newItem, allergens })
  }

  const categoryMenuItems: MenuProps['items'] = [
    {
      key: 'add',
      icon: <PlusOutlined />,
      label: t('add_category'),
      onClick: handleAddCategory
    },
    { type: 'divider' },
    ...categories.map(category => ({
      key: category,
      label: (
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>{category}</Text>
          <Space>
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditCategory(category)} />
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCategory(category)} />
          </Space>
        </Space>
      )
    }))
  ]

  const ingredientColumns: ColumnsType<any> = [
    {
      title: t('ingredient'),
      key: 'ingredient',
      align: isRtl ? 'right' : 'left',
      render: (_: any, record: any, index: number) => (
        <Select
          style={{ width: '100%' }}
          size="small"
          value={record.ingredientId}
          onChange={value => updateIngredientInItem(index, 'ingredientId', value)}
          placeholder={t('select_ingredient')}
          showSearch
          filterOption={(input, option) =>
            (String(option?.children) || '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {availableIngredients.map(ing => (
            <Option key={ing.id} value={ing.id}>
              {ing.name}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: t('quantity'),
      key: 'quantity',
      width: 120,
      align: isRtl ? 'right' : 'left',
      render: (_: any, record: any, index: number) => {
        const displayValue = editingQuantities[index] !== undefined
          ? editingQuantities[index]
          : String(record.quantity || '')

        return (
          <Input
            type="text"
            size="small"
            value={displayValue}
            onChange={e => {
              const value = e.target.value
              // Allow empty, numbers, and decimal points during typing
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                // Store the raw string value for display
                setEditingQuantities(prev => ({ ...prev, [index]: value }))
                // Parse and update the actual value
                const numValue = parseFloat(value)
                if (!isNaN(numValue)) {
                  updateIngredientInItem(index, 'quantity', numValue)
                } else if (value === '') {
                  updateIngredientInItem(index, 'quantity', 0)
                }
              }
            }}
            onBlur={() => {
              // Clear editing state on blur
              setEditingQuantities(prev => {
                const newState = { ...prev }
                delete newState[index]
                return newState
              })
              // Ensure we have a valid number
              if (!record.quantity || record.quantity === 0) {
                updateIngredientInItem(index, 'quantity', 0)
              }
            }}
            placeholder="0.000"
          />
        )
      }
    },
    {
      title: t('unit'),
      key: 'unit',
      width: 100,
      align: isRtl ? 'right' : 'left',
      render: (_: any, record: any, index: number) => (
        <Input size="small" value={record.unit} onChange={e => updateIngredientInItem(index, 'unit', e.target.value)} placeholder="unit" />
      )
    },
    {
      title: t('cost'),
      key: 'cost',
      width: 100,
      align: 'right',
      render: (_: any, record: any) => {
        const cost = calculateIngredientCost(record.ingredientId, record.quantity)
        return <Text type="secondary">{formatCurrency(cost)}</Text>
      }
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_: any, record: any, index: number) => <Button size="small" danger icon={<DeleteFilled />} onClick={() => removeIngredientFromItem(index)} />
    }
  ]

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--ant-color-border)', backgroundColor: 'var(--ant-color-bg-container)' }}>
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <Title level={3} style={{ margin: 0, textAlign: isRtl ? 'right' : 'left' }}>
              {t('menu_management')}
            </Title>
          </Col>

          <Col>
            <Input.Search placeholder={t('search_menu_items') || 'Search menu items...'} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: 250 }} allowClear />
          </Col>

          <Col>
            <Segmented
              value={viewMode}
              onChange={value => setViewMode(value as ViewMode)}
              options={[
                { value: 'grid', icon: <AppstoreOutlined /> },
                { value: 'list', icon: <UnorderedListOutlined /> }
              ]}
            />
          </Col>

          <Col>
            <Dropdown menu={{ items: categoryMenuItems }} trigger={['click']}>
              <Button icon={<SettingOutlined />}>{t('manage_categories')}</Button>
            </Dropdown>
          </Col>
        </Row>
      </div>

      {/* Filter Bar */}
      <div style={{ padding: '12px 24px', backgroundColor: 'var(--ant-color-bg-container-secondary)', borderBottom: '1px solid var(--ant-color-border)' }}>
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <Tabs activeKey={activeCategory} onChange={setActiveCategory} size="small">
              {visibleCategories.map(category => (
                <TabPane
                  tab={
                    <Space size={4}>
                      <Text style={{ fontSize: 13 }}>{category === 'all' ? t('all_items') : t(category)}</Text>
                      <Tag style={{ fontSize: 11, marginLeft: 4 }}>{getCategoryCount(category)}</Tag>
                    </Space>
                  }
                  key={category}
                />
              ))}
            </Tabs>
          </Col>

          <Col>
            <Select value={filterType} onChange={value => setFilterType(value)} style={{ width: 150 }} size="small">
              <Option value="all">{t('all_items')}</Option>
              <Option value="available">{t('available')}</Option>
              <Option value="unavailable">{t('unavailable')}</Option>
              <Option value="profitable">{t('high_margin')}</Option>
              <Option value="low-margin">{t('low_margin')}</Option>
            </Select>
          </Col>
        </Row>
      </div>

      {/* Content Area */}
      <div style={{ padding: 24, overflowY: 'auto' }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64 }}>
            <div style={{ fontSize: 48, color: 'var(--ant-color-text-tertiary)', marginBottom: 16 }}>🍽️</div>
            <Title level={4} type="secondary">
              {t('no_menu_items_found')}
            </Title>
            <Text type="secondary">{searchQuery ? `No items match "${searchQuery}"` : t('start_by_adding_first_menu_item')}</Text>
            <br />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenDialog(true)} style={{ marginTop: 16 }}>
              {t('add_menu_item')}
            </Button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">
                {t('showing')} {filteredItems.length} {t('of')} {menuItems.length} {t('items')}
                {searchQuery && ` for "${searchQuery}"`}
              </Text>
            </div>

            {viewMode === 'grid' ? renderGridView() : <Table columns={columns} dataSource={filteredItems} rowKey="id" pagination={{ pageSize: 20 }} />}
          </>
        )}
      </div>

      {/* Floating Add Button */}
      <FloatButton icon={<PlusOutlined />} type="primary" onClick={() => setOpenDialog(true)} />

      {/* Add/Edit Dialog */}
      <Modal
        title={editingItem ? t('edit_menu_item') : t('add_new_menu_item')}
        open={openDialog}
        onOk={handleSaveItem}
        onCancel={() => setOpenDialog(false)}
        width={1000}
        okText={editingItem ? t('update_item') : t('add_item')}
        cancelText={t('cancel')}
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        styles={{
          footer: { textAlign: isRtl ? 'left' : 'right', direction: isRtl ? 'rtl' : 'ltr' }
        }}
      >
        <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        <Row gutter={[16, 16]} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          <Col xs={24} sm={12}>
            <Input placeholder={t('item_name')} value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
          </Col>
          <Col xs={24} sm={12}>
            <Select
              style={{ width: '100%' }}
              placeholder={t('category')}
              value={newItem.category}
              onChange={value => setNewItem({ ...newItem, category: value })}
              showSearch
              allowClear
              options={categories.map(cat => ({ value: cat, label: t(cat) }))}
            />
          </Col>
          <Col xs={24}>
            <TextArea rows={2} placeholder={t('description')} value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
          </Col>
          <Col xs={24} sm={12}>
            <Input type="number" placeholder={t('price')} value={newItem.price} onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) })} step="0.01" prefix="$" />
          </Col>
          <Col xs={24} sm={12}>
            <Input type="number" placeholder={t('prep_time_minutes')} value={newItem.prepTime} onChange={e => setNewItem({ ...newItem, prepTime: parseInt(e.target.value) })} suffix="min" />
          </Col>

          <Col xs={24}>
            <Divider orientation={isRtl ? 'right' : 'left'}>{t('ingredients')}</Divider>
            <Space style={{ marginBottom: 12, width: '100%', justifyContent: isRtl ? 'flex-end' : 'flex-start' }} wrap direction={isRtl ? 'horizontal' : 'horizontal'}>
              <Tooltip title={t('download_template_tooltip')}>
                <Button size="small" icon={<DownloadOutlined />} onClick={downloadIngredientsTemplate}>
                  {t('download_template')}
                </Button>
              </Tooltip>
              <Button size="small" icon={<UploadOutlined />} onClick={handleImportIngredientsClick} loading={importingIngredients}>
                {importingIngredients ? t('importing') : t('import_csv')}
              </Button>
              <Button size="small" type="primary" icon={<PlusOutlined />} onClick={addIngredientToItem}>
                {t('add_ingredient')}
              </Button>
            </Space>

            {newItem.ingredients && newItem.ingredients.length > 0 && (
              <>
                <Table
                  columns={ingredientColumns}
                  dataSource={newItem.ingredients}
                  rowKey={(_, index) => index!}
                  pagination={false}
                  size="small"
                  style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                />
                <Card size="small" style={{ marginTop: 12, backgroundColor: 'var(--ant-color-bg-container-secondary)', direction: isRtl ? 'rtl' : 'ltr' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between', direction: isRtl ? 'rtl' : 'ltr' }}>
                    <Text strong>{t('total_ingredient_cost')}:</Text>
                    <Text strong type="warning">
                      {formatCurrency(calculateTotalIngredientCost(newItem.ingredients))}
                    </Text>
                  </Space>
                </Card>
              </>
            )}

            {newItem.price && newItem.ingredients && (
              <Alert
                type="info"
                message={
                  <Space direction="vertical" size={0} style={{ width: '100%', textAlign: isRtl ? 'right' : 'left' }}>
                    <Text>
                      {t('profit_margin')}: <Text strong>{calculateProfitMargin(newItem.price, calculateTotalIngredientCost(newItem.ingredients)).toFixed(1)}%</Text>
                    </Text>
                    <Text>
                      {t('profit_per_item')}: <Text strong>{formatCurrency(newItem.price - calculateTotalIngredientCost(newItem.ingredients))}</Text>
                    </Text>
                  </Space>
                }
                style={{ marginTop: 12, direction: isRtl ? 'rtl' : 'ltr' }}
              />
            )}
          </Col>

          <Col xs={24}>
            <Input placeholder={t('allergens_comma_separated')} value={newItem.allergens?.join(', ') || ''} onChange={e => handleAllergenChange(e.target.value)} />
          </Col>
          <Col xs={24}>
            <Space direction="horizontal" style={{ width: '100%', justifyContent: isRtl ? 'flex-end' : 'flex-start' }}>
              <Switch checked={newItem.isAvailable} onChange={checked => setNewItem({ ...newItem, isAvailable: checked })} />
              <Text>{t('available')}</Text>
            </Space>
          </Col>
        </Row>
        </div>
      </Modal>

      <input type="file" ref={fileInputRef} accept=".csv" style={{ display: 'none' }} onChange={handleIngredientsFileImport} />

      {/* Category Add/Edit Dialog */}
      <Modal
        title={editingCategory ? t('edit_category') : t('add_category')}
        open={categoryDialogOpen}
        onOk={handleSaveCategory}
        onCancel={() => setCategoryDialogOpen(false)}
        okText={editingCategory ? t('update') : t('add')}
        cancelText={t('cancel')}
        okButtonProps={{ disabled: !newCategoryName.trim() }}
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        styles={{
          footer: { textAlign: isRtl ? 'left' : 'right', direction: isRtl ? 'rtl' : 'ltr' }
        }}
      >
        <Input placeholder={t('category_name')} value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={{ marginTop: 16 }} />
        {editingCategory && (
          <Alert type="info" message={t('note_editing_category_will_update_items')} style={{ marginTop: 16 }} showIcon />
        )}
      </Modal>
    </div>
  )
}
