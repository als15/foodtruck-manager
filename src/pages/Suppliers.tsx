import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Typography, Button, Modal, Input, Table, Tag, Switch, Space, Spin, Alert, message, AutoComplete, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, ShopOutlined, PhoneOutlined, MailOutlined, CarOutlined, ThunderboltOutlined, BankOutlined } from '@ant-design/icons'
import { Supplier } from '../types'
import { suppliersService, subscriptions } from '../services/supabaseService'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '../contexts/BusinessContext'
import { formatCurrency } from '../utils/currency'
import { WEEKDAYS_ORDERED, sortDaysChronologically } from '../utils/weekdayUtils'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

const PAYMENT_TERMS = ['Net 30', 'Net 15', 'COD', 'Prepaid', 'Net 60', 'Due on Receipt']
const DELIVERY_METHODS = ['pickup', 'delivery'] as const

export default function Suppliers() {
  const { t, i18n } = useTranslation()
  const { currentBusiness } = useBusiness()
  const isRtl = i18n.dir() === 'rtl'
  const [openDialog, setOpenDialog] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Persist modal state and form data across tab switches
  const [isModalPersisted, setIsModalPersisted] = useState(false)
  const [lastSaved, setLastSaved] = useState<number | null>(null)

  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    deliveryDays: [],
    orderSubmissionDays: [],
    minimumOrderAmount: 0,
    leadTime: 1,
    autoOrderEnabled: false,
    paymentTerms: 'Net 30',
    deliveryMethods: [],
    notes: '',
    isActive: true,
    accountName: '',
    bankName: '',
    bankCode: '',
    branchNumber: '',
    accountNumber: ''
  })

  // Load suppliers on component mount and when business changes
  useEffect(() => {
    if (currentBusiness?.id) {
      loadSuppliers()
    }
  }, [currentBusiness?.id])

  // Set up real-time subscription
  useEffect(() => {
    if (!currentBusiness?.id) return

    const subscription = subscriptions.suppliers(payload => {
      console.log('Suppliers changed:', payload)
      // Only reload if modal is not open to prevent disruption
      if (!openDialog) {
        loadSuppliers()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [currentBusiness?.id, openDialog])

  // Persist form data to prevent loss when switching tabs
  useEffect(() => {
    if (openDialog) {
      // Save form data to sessionStorage whenever form changes
      const timestamp = Date.now()
      const formData = {
        newSupplier,
        editingSupplier,
        timestamp
      }
      sessionStorage.setItem('supplierFormData', JSON.stringify(formData))
      setLastSaved(timestamp)
      if (!isModalPersisted) {
        setIsModalPersisted(true)
      }
    }
  }, [openDialog, newSupplier, editingSupplier, isModalPersisted])

  // Restore form data when component mounts
  useEffect(() => {
    const savedFormData = sessionStorage.getItem('supplierFormData')
    if (savedFormData) {
      try {
        const { newSupplier: savedSupplier, editingSupplier: savedEditing, timestamp } = JSON.parse(savedFormData)
        // Only restore if less than 1 hour old
        if (Date.now() - timestamp < 3600000) {
          setNewSupplier(savedSupplier)
          setEditingSupplier(savedEditing)
          setOpenDialog(true)
          setIsModalPersisted(true)
        } else {
          sessionStorage.removeItem('supplierFormData')
        }
      } catch (error) {
        console.error('Error restoring form data:', error)
        sessionStorage.removeItem('supplierFormData')
      }
    }
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await suppliersService.getAll()
      setSuppliers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed_to_load_suppliers'))
      message.error(t('failed_to_load_suppliers'))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSupplier = async () => {
    try {
      if (editingSupplier) {
        await suppliersService.update(editingSupplier.id, newSupplier)
        message.success(t('supplier_updated_successfully'))
      } else {
        await suppliersService.create(newSupplier as Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>)
        message.success(t('supplier_created_successfully'))
      }

      await loadSuppliers()
      closeModalAndClearData()
    } catch (err) {
      message.error(t('failed_to_save_supplier'))
    }
  }

  const closeModalAndClearData = () => {
    // Clear persisted form data
    sessionStorage.removeItem('supplierFormData')

    // Reset form state
    setNewSupplier({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      deliveryDays: [],
      orderSubmissionDays: [],
      minimumOrderAmount: 0,
      leadTime: 1,
      autoOrderEnabled: false,
      paymentTerms: 'Net 30',
      deliveryMethods: [],
      notes: '',
      isActive: true,
      accountName: '',
      bankName: '',
      bankCode: '',
      branchNumber: '',
      accountNumber: ''
    })
    setEditingSupplier(null)
    setOpenDialog(false)
    setIsModalPersisted(false)
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setNewSupplier(supplier)
    setEditingSupplier(supplier)
    setOpenDialog(true)
  }

  const handleDeleteSupplier = async (id: string) => {
    try {
      await suppliersService.delete(id)
      message.success(t('supplier_deleted_successfully'))
      await loadSuppliers()
    } catch (err) {
      message.error(t('failed_to_delete_supplier'))
    }
  }

  const toggleActiveStatus = async (id: string, checked: boolean) => {
    try {
      await suppliersService.update(id, { isActive: checked })
      message.success(t('supplier_status_updated_successfully'))
      await loadSuppliers()
    } catch (err) {
      message.error(t('failed_to_update_supplier_status'))
    }
  }

  const activeSuppliers = suppliers.filter(sup => sup.isActive)
  const autoOrderSuppliers = suppliers.filter(sup => sup.autoOrderEnabled && sup.isActive)

  const columns: ColumnsType<Supplier> = [
    {
      title: t('supplier'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.contactPerson}</Text>
        </div>
      ),
    },
    {
      title: t('contact'),
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Space size={4}>
            <PhoneOutlined style={{ fontSize: 12 }} />
            <Text style={{ fontSize: 12 }}>{record.phone}</Text>
          </Space>
          <Space size={4}>
            <MailOutlined style={{ fontSize: 12 }} />
            <Text style={{ fontSize: 12 }}>{record.email}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: t('delivery_days'),
      dataIndex: 'deliveryDays',
      key: 'deliveryDays',
      render: (days: string[]) => (
        <Space wrap size={4}>
          {sortDaysChronologically(days).map(day => (
            <Tag key={day}>{day.slice(0, 3)}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('order_days'),
      dataIndex: 'orderSubmissionDays',
      key: 'orderSubmissionDays',
      render: (days: string[]) => (
        <Space wrap size={4}>
          {sortDaysChronologically(days || []).map(day => (
            <Tag key={day} color="blue">{day.slice(0, 3)}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('delivery_methods'),
      dataIndex: 'deliveryMethods',
      key: 'deliveryMethods',
      render: (methods: ('pickup' | 'delivery')[]) => (
        <Space wrap size={4}>
          {methods?.map(method => (
            <Tag
              key={method}
              icon={method === 'pickup' ? <CarOutlined /> : <CarOutlined />}
              color={method === 'pickup' ? 'orange' : 'blue'}
            >
              {t(method === 'delivery' ? 'delivery_method' : method)}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('lead_time'),
      dataIndex: 'leadTime',
      key: 'leadTime',
      render: (leadTime) => (
        <Space size={4}>
          <CarOutlined style={{ fontSize: 12 }} />
          <Text>{leadTime} {t('days_word')}</Text>
        </Space>
      ),
    },
    {
      title: t('min_order'),
      dataIndex: 'minimumOrderAmount',
      key: 'minimumOrderAmount',
      align: isRtl ? 'left' : 'right',
      render: (amount) => <Text>{formatCurrency(amount)}</Text>,
    },
    {
      title: t('auto_order'),
      dataIndex: 'autoOrderEnabled',
      key: 'autoOrderEnabled',
      render: (enabled) => enabled ? (
        <Tag icon={<ThunderboltOutlined />} color="success">
          {t('enabled')}
        </Tag>
      ) : null,
    },
    {
      title: t('status_text'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive, record) => (
        <Space>
          <Switch
            checked={isActive}
            onChange={(checked) => toggleActiveStatus(record.id, checked)}
            size="small"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isActive ? t('active') : t('inactive')}
          </Text>
        </Space>
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      align: isRtl ? 'left' : 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditSupplier(record)}
            size="small"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteSupplier(record.id)}
            size="small"
          />
        </Space>
      ),
    },
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
        <Button type="primary" onClick={loadSuppliers}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          {t('supplier_management')}
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            // Clear any existing form data when starting fresh
            sessionStorage.removeItem('supplierFormData')
            setIsModalPersisted(false)
            setOpenDialog(true)
          }}
        >
          {t('add_supplier')}
        </Button>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Text type="secondary">{t('total_suppliers')}</Text>
            <div>
              <Title level={3} style={{ margin: '8px 0 0 0', color: '#1890ff' }}>
                {suppliers.length}
              </Title>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Text type="secondary">{t('active_suppliers')}</Text>
            <div>
              <Title level={3} style={{ margin: '8px 0 0 0', color: '#52c41a' }}>
                {activeSuppliers.length}
              </Title>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Text type="secondary">{t('auto_order_enabled')}</Text>
            <div>
              <Title level={3} style={{ margin: '8px 0 0 0', color: '#1890ff' }}>
                {autoOrderSuppliers.length}
              </Title>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Text type="secondary">{t('avg_lead_time')}</Text>
            <div>
              <Title level={3} style={{ margin: '8px 0 0 0', color: '#faad14' }}>
                {suppliers.length > 0 ? Math.round(suppliers.reduce((sum, sup) => sum + sup.leadTime, 0) / suppliers.length) : 0} {t('days_word')}
              </Title>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Suppliers Table */}
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} align="center">
          <ShopOutlined />
          <Text strong style={{ fontSize: 16 }}>{t('suppliers_directory')}</Text>
        </Space>

        <Table
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          rowClassName={(record) => !record.isActive ? 'opacity-60' : ''}
          expandable={{
            expandedRowRender: (record) => {
              const hasPaymentDetails = record.accountName || record.bankName || record.bankCode || record.branchNumber || record.accountNumber

              if (!hasPaymentDetails) {
                return (
                  <div style={{ padding: '16px 24px', background: '#fafafa' }}>
                    <Space>
                      <BankOutlined style={{ color: '#999' }} />
                      <Text type="secondary">{t('no_payment_details')}</Text>
                    </Space>
                  </div>
                )
              }

              const paymentDetailsColumns = [
                {
                  title: t('account_name'),
                  dataIndex: 'accountName',
                  key: 'accountName',
                  render: (text: string) => text || '-'
                },
                {
                  title: t('bank_name'),
                  dataIndex: 'bankName',
                  key: 'bankName',
                  render: (text: string) => text || '-'
                },
                {
                  title: t('bank_code'),
                  dataIndex: 'bankCode',
                  key: 'bankCode',
                  render: (text: string) => text || '-'
                },
                {
                  title: t('branch_number'),
                  dataIndex: 'branchNumber',
                  key: 'branchNumber',
                  render: (text: string) => text || '-'
                },
                {
                  title: t('account_number'),
                  dataIndex: 'accountNumber',
                  key: 'accountNumber',
                  render: (text: string) => text || '-'
                },
                {
                  title: t('payment_terms'),
                  dataIndex: 'paymentTerms',
                  key: 'paymentTerms',
                  render: (text: string) => text || '-'
                }
              ]

              return (
                <div style={{ padding: '16px 24px', background: '#fafafa' }}>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Space>
                      <BankOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                      <Text strong>{t('payment_details')}</Text>
                    </Space>
                    <Table
                      columns={paymentDetailsColumns}
                      dataSource={[record]}
                      pagination={false}
                      size="small"
                      bordered
                      rowKey="id"
                    />
                  </Space>
                </div>
              )
            },
            rowExpandable: () => true
          }}
        />
      </Card>

      {/* Add/Edit Supplier Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>{editingSupplier ? t('edit_supplier') : t('add_new_supplier')}</Text>
            {lastSaved && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                ✓ {t('auto_saved')}
              </Text>
            )}
          </div>
        }
        open={openDialog}
        onOk={handleSaveSupplier}
        onCancel={closeModalAndClearData}
        okText={editingSupplier ? t('update_supplier_button') : t('add_supplier_button')}
        cancelText={t('cancel')}
        width={800}
        maskClosable={false}
      >
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12}>
            <Text>{t('supplier_name')} *</Text>
            <Input
              value={newSupplier.name}
              onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
              placeholder={t('supplier_name')}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('contact_person')} *</Text>
            <Input
              value={newSupplier.contactPerson}
              onChange={e => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
              placeholder={t('contact_person')}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('email')} *</Text>
            <Input
              type="email"
              value={newSupplier.email}
              onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })}
              placeholder={t('email')}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('phone')} *</Text>
            <Input
              value={newSupplier.phone}
              onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
              placeholder={t('phone')}
            />
          </Col>
          <Col xs={24}>
            <Text>{t('address')} *</Text>
            <TextArea
              rows={2}
              value={newSupplier.address}
              onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })}
              placeholder={t('address')}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('delivery_days_label')}</Text>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              value={newSupplier.deliveryDays || []}
              onChange={value => setNewSupplier({ ...newSupplier, deliveryDays: value })}
              placeholder={t('delivery_days_label')}
            >
              {WEEKDAYS_ORDERED.map(day => (
                <Option key={day} value={day}>
                  {t(day.toLowerCase() as any)}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('order_submission_days')}</Text>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              value={newSupplier.orderSubmissionDays || []}
              onChange={value => setNewSupplier({ ...newSupplier, orderSubmissionDays: value })}
              placeholder={t('order_submission_days')}
            >
              {WEEKDAYS_ORDERED.map(day => (
                <Option key={day} value={day}>
                  {t(day.toLowerCase() as any)}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('lead_time_days')}</Text>
            <Input
              type="number"
              min={1}
              value={newSupplier.leadTime}
              onChange={e => setNewSupplier({ ...newSupplier, leadTime: parseInt(e.target.value) || 1 })}
              placeholder={t('lead_time_days')}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('minimum_order_amount')}</Text>
            <Input
              type="number"
              step={0.01}
              value={newSupplier.minimumOrderAmount}
              onChange={e => setNewSupplier({ ...newSupplier, minimumOrderAmount: parseFloat(e.target.value) || 0 })}
              placeholder={t('minimum_order_amount')}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('delivery_methods')}</Text>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              value={newSupplier.deliveryMethods || []}
              onChange={value => setNewSupplier({ ...newSupplier, deliveryMethods: value as ('pickup' | 'delivery')[] })}
              placeholder={t('delivery_methods')}
            >
              {DELIVERY_METHODS.map(method => (
                <Option key={method} value={method}>
                  <Space>
                    <CarOutlined />
                    {t(method === 'delivery' ? 'delivery_method' : method)}
                  </Space>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('payment_terms')}</Text>
            <AutoComplete
              options={PAYMENT_TERMS.map(term => ({ value: term }))}
              value={newSupplier.paymentTerms}
              onChange={value => setNewSupplier({ ...newSupplier, paymentTerms: value || 'Net 30' })}
              placeholder={t('payment_terms')}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24}>
            <Text>{t('notes')}</Text>
            <TextArea
              rows={3}
              value={newSupplier.notes}
              onChange={e => setNewSupplier({ ...newSupplier, notes: e.target.value })}
              placeholder={t('notes_placeholder')}
            />
          </Col>

          {/* Payment Details Section */}
          <Col xs={24}>
            <Space style={{ marginTop: 16, marginBottom: 8 }}>
              <BankOutlined style={{ fontSize: 16, color: '#1890ff' }} />
              <Text strong style={{ fontSize: 14 }}>{t('payment_details')}</Text>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('account_name')}</Text>
            <Input
              value={newSupplier.accountName}
              onChange={e => setNewSupplier({ ...newSupplier, accountName: e.target.value })}
              placeholder={t('account_name')}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text>{t('bank_name')}</Text>
            <Input
              value={newSupplier.bankName}
              onChange={e => setNewSupplier({ ...newSupplier, bankName: e.target.value })}
              placeholder={t('bank_name')}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Text>{t('bank_code')}</Text>
            <Input
              value={newSupplier.bankCode}
              onChange={e => setNewSupplier({ ...newSupplier, bankCode: e.target.value })}
              placeholder={t('bank_code')}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Text>{t('branch_number')}</Text>
            <Input
              value={newSupplier.branchNumber}
              onChange={e => setNewSupplier({ ...newSupplier, branchNumber: e.target.value })}
              placeholder={t('branch_number')}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Text>{t('account_number')}</Text>
            <Input
              value={newSupplier.accountNumber}
              onChange={e => setNewSupplier({ ...newSupplier, accountNumber: e.target.value })}
              placeholder={t('account_number')}
            />
          </Col>

          <Col xs={24} sm={12}>
            <Space>
              <Switch
                checked={newSupplier.autoOrderEnabled}
                onChange={checked => setNewSupplier({ ...newSupplier, autoOrderEnabled: checked })}
              />
              <Text>{t('enable_auto_order_for_low_stock')}</Text>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space>
              <Switch
                checked={newSupplier.isActive}
                onChange={checked => setNewSupplier({ ...newSupplier, isActive: checked })}
              />
              <Text>{t('active_supplier')}</Text>
            </Space>
          </Col>
        </Row>
      </Modal>
    </div>
  )
}
