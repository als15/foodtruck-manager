import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Space, Button, Grid } from 'antd'
import type { MenuProps } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, DashboardOutlined, ShoppingCartOutlined, DollarOutlined, ShopOutlined, TeamOutlined, AppstoreOutlined, UserOutlined, TruckOutlined, BarChartOutlined, SettingOutlined, LogoutOutlined, UserOutlined as ProfileIcon, CoffeeOutlined, CalculatorOutlined, AccountBookOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../LanguageSwitcher'
import DarkModeToggle from '../DarkModeToggle'
import { useAuth } from '../../contexts/AuthContext'
import { BusinessSelector } from '../Business/BusinessSelector'

const { Header, Sider, Content } = Layout
const { useBreakpoint } = Grid

interface AntdAppLayoutProps {
  children: React.ReactNode
}

type MenuItem = Required<MenuProps>['items'][number]

const AntdAppLayout: React.FC<AntdAppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const isRtl = i18n.dir() === 'rtl'

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  // User dropdown menu
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <ProfileIcon />,
      label: t('profile'),
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('settings'),
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
  ]

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
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <h2 style={{ color: '#7fd3c7', margin: 0, fontSize: collapsed ? 18 : 20 }}>{collapsed ? 'FT' : 'NomNom'}</h2>
      </div>

      {/* Business Selector */}
      {!collapsed && (
        <div style={{ padding: '16px 12px' }}>
          <BusinessSelector />
        </div>
      )}

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
            ...(isRtl
              ? { right: mobileDrawerOpen ? 0 : -240, transition: 'right 0.3s ease' }
              : { left: mobileDrawerOpen ? 0 : -240, transition: 'left 0.3s ease' }
            ),
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

      <Layout style={{
        ...(isRtl
          ? { marginRight: isMobile ? 0 : collapsed ? 80 : 240, transition: 'margin-right 0.2s' }
          : { marginLeft: isMobile ? 0 : collapsed ? 80 : 240, transition: 'margin-left 0.2s' }
        )
      }}>
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
    </Layout>
  )
}

export default AntdAppLayout
