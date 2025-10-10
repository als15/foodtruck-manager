import React from 'react'
import { Row, Col, Card, Typography, Button, Input, Table, Tag, Space, Alert, Tabs, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, DeleteOutlined, AppstoreOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { ingredientsService, menuItemsService } from '../services/supabaseService'
import type { Ingredient, MenuItem } from '../types'

const { Title, Text } = Typography
const { TextArea } = Input
const { TabPane } = Tabs

type AggregatedIngredient = {
  ingredientId: string
  ingredientName: string
  unit: string
  totalQuantity: number
}

type ParsedEntry = { name: string; quantity: number }

type SelectedMenuItem = {
  menuItem: MenuItem
  quantity: number
}

function parseFreeTextList(input: string): ParsedEntry[] {
  // Split by commas or newlines; allow entries like "2 bagels" or "bagel x 2"
  const parts = input
    .split(/\n|,/)
    .map(p => p.trim())
    .filter(Boolean)
  const entries: ParsedEntry[] = []
  for (const part of parts) {
    // Try patterns: "2 bagels" or "bagels x 2"
    const m1 = part.match(/^(\d+(?:\.\d+)?)\s+(.+)$/i)
    const m2 = part.match(/^(.+?)\s*[x\*]\s*(\d+(?:\.\d+)?)$/i)
    if (m1) {
      entries.push({ quantity: parseFloat(m1[1]), name: m1[2].toLowerCase().trim() })
      continue
    }
    if (m2) {
      entries.push({ quantity: parseFloat(m2[2]), name: m2[1].toLowerCase().trim() })
      continue
    }
    // Default quantity 1
    entries.push({ quantity: 1, name: part.toLowerCase() })
  }
  return entries
}

export default function PrepPlanner() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const [tabValue, setTabValue] = React.useState('1')
  const [inputText, setInputText] = React.useState('')
  const [selectedMenuItems, setSelectedMenuItems] = React.useState<SelectedMenuItem[]>([])
  const [selectedMenuItem, setSelectedMenuItem] = React.useState<MenuItem | null>(null)
  const [quantity, setQuantity] = React.useState<number>(1)
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([])
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<AggregatedIngredient[]>([])

  React.useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const [mis, ings] = await Promise.all([menuItemsService.getAll(), ingredientsService.getAll()])
        if (!active) return
        setMenuItems(mis)
        setIngredients(ings)
      } catch (e: any) {
        if (!active) return
        setError(e?.message || 'Failed to load data')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const handleAddMenuItem = () => {
    if (!selectedMenuItem) return

    // Check if item already exists
    const existingIndex = selectedMenuItems.findIndex(item => item.menuItem.id === selectedMenuItem.id)
    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...selectedMenuItems]
      updated[existingIndex].quantity += quantity
      setSelectedMenuItems(updated)
    } else {
      // Add new item
      setSelectedMenuItems(prev => [...prev, { menuItem: selectedMenuItem, quantity }])
    }

    setSelectedMenuItem(null)
    setQuantity(1)
  }

  const handleRemoveMenuItem = (index: number) => {
    setSelectedMenuItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveMenuItem(index)
      return
    }
    const updated = [...selectedMenuItems]
    updated[index].quantity = newQuantity
    setSelectedMenuItems(updated)
  }

  const computeFromMenuItems = () => {
    setError(null)
    if (selectedMenuItems.length === 0) {
      setResults([])
      return
    }

    const ingredientTotals = new Map<string, { ingredientId: string; ingredientName: string; unit: string; totalQuantity: number }>()

    for (const item of selectedMenuItems) {
      const mi = item.menuItem
      for (const comp of mi.ingredients) {
        const ing = ingredients.find(i => i.id === comp.ingredientId)
        const ingredientName = ing?.name || comp.ingredientId
        const unit = comp.unit || ing?.unit || ''
        const key = `${comp.ingredientId}__${unit}`
        const additionalQty = (comp.quantity || 0) * item.quantity
        const existing = ingredientTotals.get(key)
        if (existing) {
          existing.totalQuantity += additionalQty
        } else {
          ingredientTotals.set(key, {
            ingredientId: comp.ingredientId,
            ingredientName,
            unit,
            totalQuantity: additionalQty
          })
        }
      }
    }

    const list = Array.from(ingredientTotals.values()).sort((a, b) => a.ingredientName.localeCompare(b.ingredientName))
    setResults(list)
  }

  const handleCompute = () => {
    setError(null)
    const entries = parseFreeTextList(inputText)
    if (entries.length === 0) {
      setResults([])
      return
    }

    // Build quick lookup from menu item name to item data (case-insensitive)
    const nameToMenuItem = new Map<string, MenuItem>()
    for (const mi of menuItems) {
      nameToMenuItem.set(mi.name.toLowerCase(), mi)
    }

    const ingredientTotals = new Map<string, { ingredientId: string; ingredientName: string; unit: string; totalQuantity: number }>()

    const missingItems: string[] = []
    for (const entry of entries) {
      const mi = nameToMenuItem.get(entry.name)
      if (!mi) {
        missingItems.push(entry.name)
        continue
      }
      for (const comp of mi.ingredients) {
        const ing = ingredients.find(i => i.id === comp.ingredientId)
        const ingredientName = ing?.name || comp.ingredientId
        const unit = comp.unit || ing?.unit || ''
        const key = `${comp.ingredientId}__${unit}`
        const additionalQty = (comp.quantity || 0) * entry.quantity
        const existing = ingredientTotals.get(key)
        if (existing) {
          existing.totalQuantity += additionalQty
        } else {
          ingredientTotals.set(key, {
            ingredientId: comp.ingredientId,
            ingredientName,
            unit,
            totalQuantity: additionalQty
          })
        }
      }
    }

    const list = Array.from(ingredientTotals.values()).sort((a, b) => a.ingredientName.localeCompare(b.ingredientName))
    setResults(list)
    if (missingItems.length > 0) {
      setError(t('some_items_not_found', { items: missingItems.join(', ') }))
    }
  }

  const selectedItemColumns: ColumnsType<SelectedMenuItem> = [
    {
      title: t('menu_item'),
      key: 'menuItem',
      render: (_, record) => (
        <div>
          <Text strong>{record.menuItem.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.menuItem.category}</Text>
        </div>
      )
    },
    {
      title: t('quantity'),
      key: 'quantity',
      align: 'center',
      render: (_, record, index) => (
        <Input
          type="number"
          min={1}
          value={record.quantity}
          onChange={e => handleUpdateQuantity(index, parseInt(e.target.value) || 0)}
          style={{ width: 80, textAlign: 'center' }}
        />
      )
    },
    {
      title: t('actions'),
      key: 'actions',
      align: 'center',
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveMenuItem(index)}
        />
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <AppstoreOutlined style={{ fontSize: 32, color: '#1890ff' }} />
        <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
          {t('prep_planner')}
        </Title>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Tabs activeKey={tabValue} onChange={setTabValue}>
          <TabPane tab={t('menu_item_selection')} key="1">
            <Row gutter={[24, 24]}>
              {/* Menu Item Selection */}
              <Col xs={24} md={12}>
                <Card bordered={false} style={{ backgroundColor: '#fafafa' }}>
                  <Title level={5} style={{ marginBottom: 16, fontWeight: 600 }}>
                    {t('add_menu_items')}
                  </Title>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                      <Text>{t('select_menu_item')}</Text>
                      <Select
                        placeholder={t('select_menu_item')}
                        value={selectedMenuItem?.id}
                        onChange={(value) => {
                          const item = menuItems.find(mi => mi.id === value)
                          setSelectedMenuItem(item || null)
                        }}
                        style={{ marginTop: 8, width: '100%' }}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={menuItems.map(item => ({
                          value: item.id,
                          label: item.name
                        }))}
                        disabled={loading || menuItems.length === 0}
                      />
                    </div>

                    <div>
                      <Text>{t('quantity')}</Text>
                      <Input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ marginTop: 8 }}
                      />
                    </div>

                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddMenuItem}
                      disabled={!selectedMenuItem}
                      block
                    >
                      {t('add_to_prep_list')}
                    </Button>
                  </Space>
                </Card>
              </Col>

              {/* Selected Items */}
              <Col xs={24} md={12}>
                <Card bordered={false} style={{ backgroundColor: '#fafafa' }}>
                  <Title level={5} style={{ marginBottom: 16, fontWeight: 600 }}>
                    {t('prep_list')} ({selectedMenuItems.length} {t('items')})
                  </Title>
                  {selectedMenuItems.length === 0 ? (
                    <Alert message={t('no_items_selected')} type="info" />
                  ) : (
                    <>
                      <Table
                        columns={selectedItemColumns}
                        dataSource={selectedMenuItems}
                        rowKey={(record) => record.menuItem.id}
                        pagination={false}
                        size="small"
                      />
                      <Button
                        type="primary"
                        onClick={computeFromMenuItems}
                        disabled={loading}
                        block
                        style={{ marginTop: 16 }}
                      >
                        {t('compute_ingredients')}
                      </Button>
                    </>
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={t('free_text_input')} key="2">
            <Card bordered={false}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Text>{t('prep_planner_instructions')}</Text>
                <TextArea
                  placeholder={t('prep_planner_placeholder')}
                  rows={3}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
                <Button
                  type="primary"
                  onClick={handleCompute}
                  disabled={loading || menuItems.length === 0}
                >
                  {t('compute_ingredients')}
                </Button>
                {error && <Alert message={error} type="warning" />}
              </Space>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      <div style={{ marginTop: 24 }}>
        <Title level={5} style={{ marginBottom: 8, fontWeight: 700, textAlign: isRtl ? 'right' : 'left' }}>
          {t('aggregated_ingredients')}
        </Title>
        {results.length === 0 ? (
          <Text type="secondary" style={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>
            {t('no_ingredients_to_show')}
          </Text>
        ) : (
          <Card>
            <div dir={isRtl ? 'rtl' : 'ltr'}>
              {results.map(r => (
                <div
                  key={`${r.ingredientId}-${r.unit}`}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    justifyContent: isRtl ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    <Text strong style={{ textAlign: isRtl ? 'right' : 'left' }}>
                      {r.ingredientName}
                    </Text>
                    <Tag>{r.unit || t('unit')}</Tag>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ textAlign: isRtl ? 'right' : 'left', display: 'block' }}>
                      {t('total_quantity')}: {r.totalQuantity}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
