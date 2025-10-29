import React, { useState, useEffect, useRef } from 'react'
import { Row, Col, Card, Typography, Button, Modal, Input, Table, Tag, Space, AutoComplete, Switch, Spin, message, Dropdown, Divider, Segmented, Statistic, Flex } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, AppstoreOutlined, MoreOutlined, UploadOutlined, DownloadOutlined, BulbOutlined, TableOutlined, SearchOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Product, Supplier } from '../types'
import { productsService, suppliersService, subscriptions } from '../services/supabaseService'
import Papa from 'papaparse'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '../contexts/BusinessContext'
import RecipeParser from '../components/RecipeParser'
import { formatCurrency } from '../utils/currency'

const { Title, Text } = Typography
const { Search } = Input

export default function Products() {
  const { t, i18n } = useTranslation()
  const { currentBusiness } = useBusiness()
  const isRtl = i18n.dir() === 'rtl'
  const [openDialog, setOpenDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [recipeParserOpen, setRecipeParserOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [selectedSupplierForImport, setSelectedSupplierForImport] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // View toggle: 'table' (default) or 'grouped'
  const [productsView, setProductsView] = useState<'table' | 'grouped'>('table')
  const [searchTerm, setSearchTerm] = useState('')

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    costPerUnit: 0,
    unit: '',
    supplier: '',
    category: '',
    isAvailable: true,
    unitsPerPackage: undefined,
    packageType: '',
    minimumOrderQuantity: undefined,
    orderByPackage: false,
    lastUpdated: new Date()
  })

  // Load products and suppliers on component mount and when business changes
  useEffect(() => {
    if (currentBusiness?.id) {
      loadProducts()
      loadSuppliers()
    }
  }, [currentBusiness?.id])

  // Set up real-time subscription
  useEffect(() => {
    if (!currentBusiness?.id) return

    const subscription = subscriptions.products(payload => {
      console.log('Products changed:', payload)
      // Reload products when changes occur
      loadProducts()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [currentBusiness?.id])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await productsService.getAll()
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed_to_load_data'))
      message.error(t('failed_to_load_data'))
    } finally {
      setLoading(false)
    }
  }

  const loadSuppliers = async () => {
    try {
      const data = await suppliersService.getAll()
      setSuppliers(data.filter(supplier => supplier.isActive))
    } catch (err) {
      console.error('Failed to load suppliers:', err)
    }
  }

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        await productsService.update(editingProduct.id, newProduct)
        message.success(t('product_updated_success'))
      } else {
        await productsService.create(newProduct as Omit<Product, 'id' | 'lastUpdated' | 'businessId'>)
        message.success(t('product_created_success'))
      }

      // Reload products to get updated data
      await loadProducts()

      setNewProduct({
        name: '',
        costPerUnit: 0,
        unit: '',
        supplier: '',
        category: '',
        isAvailable: true,
        unitsPerPackage: undefined,
        packageType: '',
        minimumOrderQuantity: undefined,
        orderByPackage: false,
        lastUpdated: new Date()
      })
      setEditingProduct(null)
      setOpenDialog(false)
    } catch (err) {
      message.error(t('failed_to_save_ingredient'))
    }
  }

  const handleEditProduct = (product: Product) => {
    setNewProduct(product)
    setEditingProduct(product)
    setOpenDialog(true)
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await productsService.delete(id)
      message.success(t('product_deleted_success'))
      await loadProducts()
    } catch (err) {
      message.error(t('failed_to_delete_product'))
    }
  }

  const handleDuplicateProduct = (product: Product) => {
    const duplicatedProduct = {
      ...product,
      name: `${product.name} (Copy)`,
      id: undefined,
      lastUpdated: undefined
    }
    setNewProduct(duplicatedProduct)
    setEditingProduct(null)
    setOpenDialog(true)
  }

  const toggleAvailability = async (id: string) => {
    try {
      const product = products.find(p => p.id === id)
      if (product) {
        await productsService.update(id, { isAvailable: !product.isAvailable })
        message.success(t('availability_updated_success'))
        await loadProducts()
      }
    } catch (err) {
      message.error(t('failed_to_update_availability'))
    }
  }

  const handleImportClick = () => {
    setImportDialogOpen(true)
  }

  const handleSupplierImportConfirm = () => {
    if (!selectedSupplierForImport) {
      message.warning('Please select a supplier first')
      return
    }
    setImportDialogOpen(false)
    fileInputRef.current?.click()
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        try {
          const validProducts: Omit<Product, 'id' | 'lastUpdated' | 'businessId'>[] = []
          const errors: string[] = []

          results.data.forEach((row: any, index: number) => {
            if (!row.name || !row.costPerUnit || !row.unit || !row.category) {
              errors.push(`Row ${index + 1}: Missing required fields (name, costPerUnit, unit, category)`)
              return
            }

            const costPerUnit = parseFloat(row.costPerUnit)
            if (isNaN(costPerUnit)) {
              errors.push(`Row ${index + 1}: Invalid cost per unit`)
              return
            }

            validProducts.push({
              name: row.name.trim(),
              costPerUnit: costPerUnit,
              unit: row.unit.trim(),
              supplier: selectedSupplierForImport, // Use the selected supplier
              category: row.category.trim(),
              isAvailable: row.isAvailable?.toLowerCase() !== 'false',
              unitsPerPackage: row.unitsPerPackage ? parseInt(row.unitsPerPackage) : undefined,
              packageType: row.packageType?.trim() || undefined,
              minimumOrderQuantity: row.minimumOrderQuantity ? parseInt(row.minimumOrderQuantity) : undefined,
              orderByPackage: row.orderByPackage?.toLowerCase() === 'true'
            })
          })

          if (errors.length > 0) {
            message.warning(t('import_completed_with_errors', { count: errors.length }))
            console.error('Import errors:', errors)
          }

          // Import valid ingredients
          for (const ingredient of validProducts) {
            await productsService.create(ingredient)
          }

          message.success(t('ingredients_imported_success', { count: validProducts.length }))
          await loadProducts()
        } catch (err) {
          message.error(t('failed_to_import_ingredients'))
        } finally {
          setImporting(false)
          event.target.value = '' // Reset file input
        }
      },
      error: () => {
        setImporting(false)
        message.error(t('failed_to_parse_csv'))
        event.target.value = ''
      }
    })
  }

  const handleExportCSV = () => {
    const csvData = products.map(product => ({
      name: product.name,
      costPerUnit: product.costPerUnit,
      unit: product.unit,
      supplier: product.supplier,
      category: product.category,
      isAvailable: product.isAvailable,
      unitsPerPackage: product.unitsPerPackage || '',
      packageType: product.packageType || '',
      minimumOrderQuantity: product.minimumOrderQuantity || '',
      orderByPackage: product.orderByPackage || false
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ingredients-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    message.success(t('ingredients_exported_success'))
  }

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Ground Beef',
        costPerUnit: 8.99,
        unit: 'lbs',
        category: 'Meat',
        isAvailable: true,
        unitsPerPackage: 5,
        packageType: 'box',
        minimumOrderQuantity: 5,
        orderByPackage: true
      },
      {
        name: 'Tomatoes',
        costPerUnit: 2.5,
        unit: 'lbs',
        category: 'Vegetables',
        isAvailable: true,
        unitsPerPackage: 10,
        packageType: 'crate',
        minimumOrderQuantity: 1,
        orderByPackage: false
      }
    ]

    const csv = Papa.unparse(template)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'ingredients-template.csv'
    link.click()
    message.success(t('template_downloaded_success'))
  }

  const handleRecipeParserImport = async (parsedIngredients: any[]) => {
    try {
      const validProducts: Omit<Product, 'id' | 'lastUpdated' | 'businessId'>[] = parsedIngredients.map(ing => ({
        name: ing.name,
        costPerUnit: ing.estimatedCost,
        unit: ing.unit,
        supplier: 'AI Parsed - Please Update',
        category: ing.category,
        isAvailable: true,
        unitsPerPackage: ing.quantity,
        packageType: '',
        minimumOrderQuantity: 1,
        orderByPackage: false
      }))

      for (const ingredient of validProducts) {
        await productsService.create(ingredient)
      }

      message.success(t('ingredients_imported_success', { count: validProducts.length }))
      await loadProducts()
      setRecipeParserOpen(false)
    } catch (err) {
      message.error(t('failed_to_import_ingredients'))
    }
  }

  // Only use existing categories from user's products
  const existingCategories = Array.from(new Set(products.map(p => p.category).filter(c => c)))
  const categoriesForAutocomplete = existingCategories.sort()
  const categories = existingCategories

  const supplierNames = suppliers.map(supplier => supplier.name).sort()

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower) ||
      product.supplier.toLowerCase().includes(searchLower) ||
      product.unit.toLowerCase().includes(searchLower)
    )
  })

  const totalProducts = filteredProducts.length
  const availableProducts = filteredProducts.filter(ing => ing.isAvailable).length
  const avgCostPerProduct = filteredProducts.length > 0 ? filteredProducts.reduce((sum, ing) => sum + ing.costPerUnit, 0) / filteredProducts.length : 0

  // Dropdown menu items
  const menuItems: MenuProps['items'] = [
    {
      key: 'ai-parse',
      icon: <BulbOutlined />,
      label: t('parse_recipe_with_ai'),
      onClick: () => setRecipeParserOpen(true)
    },
    {
      type: 'divider'
    },
    {
      key: 'template',
      icon: <DownloadOutlined />,
      label: t('download_template'),
      onClick: downloadTemplate
    },
    {
      key: 'import',
      icon: <UploadOutlined />,
      label: importing ? t('importing') : t('import_csv'),
      disabled: importing,
      onClick: handleImportClick
    },
    {
      type: 'divider'
    },
    {
      key: 'export',
      icon: <DownloadOutlined />,
      label: t('export_csv'),
      onClick: handleExportCSV
    }
  ]

  // Table columns
  const columns: ColumnsType<Product> = [
    {
      title: t('ingredient_name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Product, b: Product) => a.name.localeCompare(b.name),
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: t('category'),
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Text>{text}</Text>
    },
    {
      title: t('cost_per_unit'),
      dataIndex: 'costPerUnit',
      key: 'costPerUnit',
      align: isRtl ? 'left' : 'right',
      sorter: (a: Product, b: Product) => a.costPerUnit - b.costPerUnit,
      render: (value: number) => <Text strong style={{ color: '#52c41a' }}>{formatCurrency(value)}</Text>
    },
    {
      title: t('unit'),
      dataIndex: 'unit',
      key: 'unit',
      render: (text: string) => <Text>{text}</Text>
    },
    {
      title: t('supplier_label'),
      dataIndex: 'supplier',
      key: 'supplier',
      render: (text: string) => <Text>{text}</Text>
    },
    {
      title: t('status_text'),
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      render: (isAvailable: boolean, record: Product) => (
        <Space>
          <Switch
            size="small"
            checked={isAvailable}
            onChange={() => toggleAvailability(record.id)}
          />
          <Text type="secondary">{isAvailable ? t('available') : t('unavailable')}</Text>
        </Space>
      )
    },
    {
      title: t('last_updated'),
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (date: string) => <Text type="secondary">{new Date(date).toLocaleDateString()}</Text>
    },
    {
      title: t('actions'),
      key: 'actions',
      align: isRtl ? 'left' : 'right',
      render: (_: any, record: Product) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleDuplicateProduct(record)}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditProduct(record)}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProduct(record.id)}
          />
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
        <div style={{ marginBottom: 16, padding: 16, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 8 }}>
          <Text type="danger">{error}</Text>
        </div>
        <Button type="primary" onClick={loadProducts}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          {t('ingredient_management')}
        </Title>
        <Space>
          <Segmented
            value={productsView}
            onChange={(value) => setProductsView(value as 'table' | 'grouped')}
            options={[
              { label: t('table_view') || 'Table', value: 'table', icon: <TableOutlined /> },
              { label: t('grouped_view') || 'Grouped', value: 'grouped', icon: <AppstoreOutlined /> }
            ]}
          />
          <Dropdown menu={{ items: menuItems }} placement="bottomRight">
            <Button icon={<MoreOutlined />}>
              {t('import_export')}
            </Button>
          </Dropdown>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenDialog(true)}>
            {t('add_ingredient')}
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title={t('total_ingredients')}
              value={totalProducts}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title={t('available')}
              value={availableProducts}
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
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title={t('avg_cost')}
              value={formatCurrency(avgCostPerProduct)}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ marginBottom: 24 }}>
        <Search
          placeholder={t('search_products')}
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      {productsView === 'table' ? (
        <Card bordered={false}>
          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey="id"
            pagination={{ pageSize: 20, showSizeChanger: true }}
            rowClassName={(record) => !record.isAvailable ? 'opacity-60' : ''}
          />
        </Card>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {categories.map(category => {
            const categoryProducts = filteredProducts.filter(p => p.category === category)
            if (categoryProducts.length === 0) return null
            return (
              <div key={category}>
                <Title level={4} style={{ marginBottom: 16 }}>
                  <AppstoreOutlined style={{ marginRight: 8 }} />
                  {category}
                </Title>
                <Card bordered={false}>
                  <Table
                    columns={columns.filter((col: any) => col.key !== 'category')}
                    dataSource={categoryProducts}
                    rowKey="id"
                    pagination={false}
                    rowClassName={(record) => !record.isAvailable ? 'opacity-60' : ''}
                  />
                </Card>
              </div>
            )
          })}
        </Space>
      )}

      <Modal
        title={editingProduct ? t('edit_ingredient') : t('add_new_ingredient')}
        open={openDialog}
        onOk={handleSaveProduct}
        onCancel={() => {
          setOpenDialog(false)
          setEditingProduct(null)
          setNewProduct({
            name: '',
            costPerUnit: 0,
            unit: '',
            supplier: '',
            category: '',
            isAvailable: true,
            unitsPerPackage: undefined,
            packageType: '',
            minimumOrderQuantity: undefined,
            orderByPackage: false,
            lastUpdated: new Date()
          })
        }}
        okText={editingProduct ? t('update_ingredient') : t('add_ingredient')}
        cancelText={t('cancel')}
        width={600}
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        styles={{
          footer: { textAlign: isRtl ? 'left' : 'right', direction: isRtl ? 'rtl' : 'ltr' }
        }}
      >
        <div style={{ marginTop: 16, direction: isRtl ? 'rtl' : 'ltr' }}>
          <Row gutter={[16, 16]} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            <Col span={24}>
              <Text>{t('ingredient_name')}</Text>
              <Input
                style={{ marginTop: 8 }}
                value={newProduct.name}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </Col>
            <Col span={12}>
              <Text>{t('cost_per_unit')}</Text>
              <Input
                style={{ marginTop: 8 }}
                type="number"
                step="0.01"
                value={newProduct.costPerUnit}
                onChange={e => setNewProduct({ ...newProduct, costPerUnit: parseFloat(e.target.value) })}
              />
            </Col>
            <Col span={12}>
              <Text>{t('unit')}</Text>
              <Input
                style={{ marginTop: 8 }}
                value={newProduct.unit}
                onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}
                placeholder="e.g., lbs, oz, piece, cup"
              />
            </Col>
            <Col span={24}>
              <Text>{t('supplier_label')}</Text>
              <AutoComplete
                style={{ marginTop: 8, width: '100%' }}
                options={supplierNames.map(name => ({ value: name }))}
                value={newProduct.supplier}
                onChange={value => setNewProduct({ ...newProduct, supplier: value })}
                placeholder={t('select_supplier_placeholder')}
              />
            </Col>
            <Col span={24}>
              <Text>{t('category')}</Text>
              <AutoComplete
                style={{ marginTop: 8, width: '100%' }}
                options={categoriesForAutocomplete.map(cat => ({ value: cat }))}
                value={newProduct.category}
                onChange={value => setNewProduct({ ...newProduct, category: value })}
                placeholder="e.g., Meat, Vegetables, Dairy"
              />
            </Col>
            <Col span={24}>
              <Divider orientation={isRtl ? 'right' : 'left'}>{t('packaging_information')}</Divider>
            </Col>
            <Col span={12}>
              <Text>{t('units_per_package')}</Text>
              <Input
                style={{ marginTop: 8 }}
                type="number"
                value={newProduct.unitsPerPackage || ''}
                onChange={e => setNewProduct({ ...newProduct, unitsPerPackage: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="e.g., 12"
              />
            </Col>
            <Col span={12}>
              <Text>{t('package_type')}</Text>
              <Input
                style={{ marginTop: 8 }}
                value={newProduct.packageType || ''}
                onChange={e => setNewProduct({ ...newProduct, packageType: e.target.value })}
                placeholder="e.g., box, case, bag"
              />
            </Col>
            <Col span={12}>
              <Text>{t('minimum_order_quantity')}</Text>
              <Input
                style={{ marginTop: 8 }}
                type="number"
                value={newProduct.minimumOrderQuantity || ''}
                onChange={e => setNewProduct({ ...newProduct, minimumOrderQuantity: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="e.g., 5"
              />
            </Col>
            <Col span={12}>
              <div style={{ marginTop: 32 }}>
                <Space direction="horizontal" style={{ width: '100%', justifyContent: isRtl ? 'flex-end' : 'flex-start' }}>
                  <Switch
                    checked={newProduct.orderByPackage || false}
                    onChange={checked => setNewProduct({ ...newProduct, orderByPackage: checked })}
                  />
                  <Text>{t('order_by_package')}</Text>
                </Space>
              </div>
            </Col>
            <Col span={24}>
              <Space direction="horizontal" style={{ width: '100%', justifyContent: isRtl ? 'flex-end' : 'flex-start' }}>
                <Switch
                  checked={newProduct.isAvailable}
                  onChange={checked => setNewProduct({ ...newProduct, isAvailable: checked })}
                />
                <Text>{t('available')}</Text>
              </Space>
            </Col>
          </Row>
        </div>
      </Modal>

      <Modal
        title={t('select_supplier')}
        open={importDialogOpen}
        onOk={handleSupplierImportConfirm}
        onCancel={() => setImportDialogOpen(false)}
        okText={t('continue')}
        cancelText={t('cancel')}
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        styles={{
          footer: { textAlign: isRtl ? 'left' : 'right', direction: isRtl ? 'rtl' : 'ltr' }
        }}
      >
        <div style={{ marginTop: 16, direction: isRtl ? 'rtl' : 'ltr' }}>
          <Text>{t('supplier_label')}</Text>
          <AutoComplete
            style={{ marginTop: 8, width: '100%' }}
            options={supplierNames.map(name => ({ value: name }))}
            value={selectedSupplierForImport}
            onChange={setSelectedSupplierForImport}
            placeholder={t('select_supplier_placeholder')}
          />
        </div>
      </Modal>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />

      <RecipeParser
        open={recipeParserOpen}
        onClose={() => setRecipeParserOpen(false)}
        onImport={handleRecipeParserImport}
      />
    </div>
  )
}
