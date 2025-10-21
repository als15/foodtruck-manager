import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Space, Button, Grid, Typography, Modal, Form, Input, Select, message } from 'antd'
import type { MenuProps } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, DashboardOutlined, ShoppingCartOutlined, DollarOutlined, ShopOutlined, TeamOutlined, AppstoreOutlined, UserOutlined, TruckOutlined, BarChartOutlined, SettingOutlined, LogoutOutlined, UserOutlined as ProfileIcon, CoffeeOutlined, CalculatorOutlined, AccountBookOutlined, CheckOutlined, PlusOutlined, BuildOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../LanguageSwitcher'
import DarkModeToggle from '../DarkModeToggle'
import { useAuth } from '../../contexts/AuthContext'
import { useBusiness } from '../../contexts/BusinessContext'

const { Text } = Typography
const { Option } = Select

const { Header, Sider, Content } = Layout
const { useBreakpoint } = Grid

interface AntdAppLayoutProps {
  children: React.ReactNode
}

type MenuItem = Required<MenuProps>['items'][number]

const AntdAppLayout: React.FC<AntdAppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [isCreateBusinessModalOpen, setIsCreateBusinessModalOpen] = useState(false)
  const [createBusinessLoading, setCreateBusinessLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()
  const { currentBusiness, userBusinesses, switchBusiness, userRole, createBusiness } = useBusiness()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const isRtl = i18n.dir() === 'rtl'

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleCreateBusiness = async (values: any) => {
    setCreateBusinessLoading(true)
    try {
      await createBusiness({
        name: values.name,
        email: values.email || '',
        phone: values.phone || '',
        address: values.address || '',
        taxId: values.taxId || '',
        currency: values.currency || 'USD',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
      message.success(t('business_created_successfully'))
      setIsCreateBusinessModalOpen(false)
      form.resetFields()
    } catch (error) {
      console.error('Error creating business:', error)
      message.error(t('failed_to_create_business'))
    } finally {
      setCreateBusinessLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: t('owner'),
      admin: t('admin'),
      member: t('member'),
      viewer: t('viewer')
    }
    return labels[role] || role
  }

  // User dropdown menu
  const userMenuItems: MenuProps['items'] = [
    // Current Business Section
    currentBusiness && {
      key: 'current-business',
      type: 'group',
      label: t('current_business'),
      children: [
        {
          key: 'business-info',
          icon: <BuildOutlined />,
          label: (
            <div>
              <div style={{ fontWeight: 500 }}>{currentBusiness.name}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {getRoleLabel(userRole || '')}
              </Text>
            </div>
          ),
          disabled: true
        }
      ]
    },
    // Business Switcher
    userBusinesses.length > 1 && {
      type: 'divider'
    },
    userBusinesses.length > 1 && {
      key: 'switch-business',
      type: 'group',
      label: t('switch_business'),
      children: userBusinesses
        .filter(ub => ub.businessId !== currentBusiness?.id)
        .map(ub => ({
          key: `business-${ub.businessId}`,
          icon: ub.businessId === currentBusiness?.id ? <CheckOutlined /> : <BuildOutlined />,
          label: (
            <div>
              <div>{(ub as any).business?.name || 'Unknown Business'}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {getRoleLabel(ub.role)}
              </Text>
            </div>
          ),
          onClick: () => switchBusiness(ub.businessId)
        }))
    },
    {
      type: 'divider'
    },
    {
      key: 'create-business',
      icon: <PlusOutlined />,
      label: t('create_new_business'),
      onClick: () => setIsCreateBusinessModalOpen(true)
    },
    userRole &&
      ['owner', 'admin'].includes(userRole) && {
        key: 'manage-team',
        icon: <TeamOutlined />,
        label: t('manage_team'),
        onClick: () => navigate('/team')
      },
    userRole &&
      ['owner', 'admin'].includes(userRole) && {
        key: 'business-settings',
        icon: <SettingOutlined />,
        label: t('business_settings'),
        onClick: () => navigate('/settings/business')
      },
    {
      type: 'divider'
    },
    {
      key: 'account-settings',
      icon: <UserOutlined />,
      label: t('account_settings'),
      onClick: () => navigate('/settings')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('logout'),
      onClick: handleSignOut,
      danger: true
    }
  ].filter(Boolean) as MenuProps['items']

  // Navigation menu items
  const navigationItems: MenuItem[] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: t('dashboard'),
      onClick: () => navigate('/')
    },
    {
      key: 'products-inventory',
      icon: <AppstoreOutlined />,
      label: t('products_inventory'),
      children: [
        {
          key: '/products',
          icon: <AppstoreOutlined />,
          label: t('products'),
          onClick: () => navigate('/products')
        },
        {
          key: '/inventory',
          icon: <ShopOutlined />,
          label: t('inventory'),
          onClick: () => navigate('/inventory')
        },
        {
          key: '/menu',
          icon: <CoffeeOutlined />,
          label: t('menu_management'),
          onClick: () => navigate('/menu')
        },
        {
          key: '/prep-planner',
          icon: <CoffeeOutlined />,
          label: t('prep_planner'),
          onClick: () => navigate('/prep-planner')
        }
      ]
    },
    {
      key: 'supplies',
      icon: <TruckOutlined />,
      label: t('supplies'),
      children: [
        {
          key: '/suppliers',
          icon: <ShopOutlined />,
          label: t('suppliers'),
          onClick: () => navigate('/suppliers')
        },
        {
          key: '/supplier-orders',
          icon: <ShoppingCartOutlined />,
          label: t('supplier_orders'),
          onClick: () => navigate('/supplier-orders')
        }
      ]
    },
    {
      key: 'finance-insights',
      icon: <BarChartOutlined />,
      label: t('finance_insights'),
      children: [
        {
          key: '/finances',
          icon: <DollarOutlined />,
          label: t('financial'),
          onClick: () => navigate('/finances')
        },
        {
          key: '/break-even-analysis',
          icon: <CalculatorOutlined />,
          label: t('break_even_analysis'),
          onClick: () => navigate('/break-even-analysis')
        },
        {
          key: '/analytics',
          icon: <BarChartOutlined />,
          label: t('analytics'),
          onClick: () => navigate('/analytics')
        }
      ]
    },
    {
      key: '/employees',
      icon: <TeamOutlined />,
      label: t('employees'),
      onClick: () => navigate('/employees')
    },
    {
      key: '/orders',
      icon: <AccountBookOutlined />,
      label: t('orders'),
      onClick: () => navigate('/orders')
    }
  ]

  // Get selected keys based on current path
  const getSelectedKeys = (): string[] => {
    const path = location.pathname
    // Check if current path matches any menu item or submenu item
    return [path]
  }

  // Get open keys for submenus
  const getDefaultOpenKeys = (): string[] => {
    const path = location.pathname
    const openKeys: string[] = []

    if (path.includes('/products') || path.includes('/inventory') || path.includes('/menu') || path.includes('/prep-planner')) {
      openKeys.push('products-inventory')
    }
    if (path.includes('/suppliers') || path.includes('/supplier-orders')) {
      openKeys.push('supplies')
    }
    if (path.includes('/finances') || path.includes('/break-even') || path.includes('/analytics')) {
      openKeys.push('finance-insights')
    }

    return openKeys
  }

  const siderContent = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }}
      >
        <img
          src="/logo_cropped.png"
          alt="NomNom"
          style={{
            height: collapsed ? 32 : 40,
            width: 'auto',
            transition: 'height 0.2s, filter 0.2s',
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)'
          }}
        />
      </div>

      {/* Navigation Menu */}
      <Menu mode="inline" selectedKeys={getSelectedKeys()} defaultOpenKeys={getDefaultOpenKeys()} items={navigationItems} style={{ flex: 1, borderRight: 0 }} theme="dark" />
    </div>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar for desktop */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={240}
          theme="dark"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            ...(isRtl ? { right: 0 } : { left: 0 }),
            top: 0,
            bottom: 0
          }}
        >
          {siderContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Sider
          trigger={null}
          width={240}
          theme="dark"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            ...(isRtl ? { right: mobileDrawerOpen ? 0 : -240, transition: 'right 0.3s ease' } : { left: mobileDrawerOpen ? 0 : -240, transition: 'left 0.3s ease' }),
            top: 0,
            bottom: 0,
            zIndex: 1000
          }}
        >
          {siderContent}
        </Sider>
      )}

      {/* Mobile overlay */}
      {isMobile && mobileDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 999
          }}
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      <Layout
        style={{
          ...(isRtl ? { marginRight: isMobile ? 0 : collapsed ? 80 : 240, transition: 'margin-right 0.2s' } : { marginLeft: isMobile ? 0 : collapsed ? 80 : 240, transition: 'margin-left 0.2s' })
        }}
      >
        {/* Header */}
        <Header
          style={{
            padding: '0 24px',
            background: 'var(--header-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <Button
            type="text"
            icon={collapsed || mobileDrawerOpen ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => {
              if (isMobile) {
                setMobileDrawerOpen(!mobileDrawerOpen)
              } else {
                setCollapsed(!collapsed)
              }
            }}
            style={{
              fontSize: '16px',
              width: 48,
              height: 48
            }}
          />

          <Space size="middle">
            <LanguageSwitcher />
            <DarkModeToggle />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Avatar style={{ backgroundColor: '#7fd3c7', cursor: 'pointer' }} icon={<UserOutlined />}>
                {user?.email?.[0]?.toUpperCase()}
              </Avatar>
            </Dropdown>
          </Space>
        </Header>

        {/* Main Content */}
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280
          }}
        >
          {children}
        </Content>
      </Layout>

      {/* Create Business Modal */}
      <Modal
        title={t('create_new_business')}
        open={isCreateBusinessModalOpen}
        onCancel={() => {
          setIsCreateBusinessModalOpen(false)
          form.resetFields()
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateBusiness} style={{ paddingTop: 16 }}>
          <Form.Item name="name" label={t('business_name')} rules={[{ required: true, message: t('please_enter_business_name') }]}>
            <Input placeholder={t('business_name')} />
          </Form.Item>

          <Form.Item name="email" label={t('email')}>
            <Input type="email" placeholder={t('email')} />
          </Form.Item>

          <Form.Item name="phone" label={t('phone')}>
            <Input placeholder={t('phone')} />
          </Form.Item>

          <Form.Item name="address" label={t('address')}>
            <Input.TextArea rows={2} placeholder={t('address')} />
          </Form.Item>

          <Space style={{ width: '100%' }}>
            <Form.Item name="currency" label={t('currency')} initialValue="USD" style={{ marginBottom: 0 }}>
              <Select style={{ width: 150 }}>
                <Option value="USD">USD ($)</Option>
                <Option value="EUR">EUR (€)</Option>
                <Option value="GBP">GBP (£)</Option>
                <Option value="CAD">CAD ($)</Option>
                <Option value="AUD">AUD ($)</Option>
                <Option value="ILS">ILS (₪)</Option>
              </Select>
            </Form.Item>

            <Form.Item name="taxId" label={t('tax_id')} style={{ flex: 1, marginBottom: 0 }}>
              <Input placeholder={t('tax_id')} />
            </Form.Item>
          </Space>

          <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setIsCreateBusinessModalOpen(false)
                  form.resetFields()
                }}
              >
                {t('cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={createBusinessLoading}>
                {t('create_business_button')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export default AntdAppLayout
