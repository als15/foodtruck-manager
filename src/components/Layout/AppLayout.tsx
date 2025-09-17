import React, { useState } from 'react'
import { AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useTheme, useMediaQuery, Menu, MenuItem, Avatar, Divider, Collapse } from '@mui/material'
import { Menu as MenuIcon, Dashboard as DashboardIcon, Receipt as OrdersIcon, AttachMoney as FinanceIcon, Restaurant as MenuManagementIcon, People as EmployeeIcon, Route as LogisticsIcon, Inventory as InventoryIcon, Person as CustomerIcon, Business as SupplierIcon, ShoppingCart as SupplierOrdersIcon, Analytics as AnalyticsIcon, AccountCircle, Settings, Logout, ExpandLess, ExpandMore, Store as StoreIcon, AccountBalanceWallet as WalletIcon, Category as ProductsIcon, LocalShipping as SuppliesIcon, TrendingUp as InsightsIcon, Group as TeamIcon, PointOfSale as SalesIcon } from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../LanguageSwitcher'
import { useAuth } from '../../contexts/AuthContext'
import NomNomLogo from '../NomNomLogo'
import { nomNomColors } from '../../theme/nomnom-theme'
import { BusinessSelector } from '../Business/BusinessSelector'

const drawerWidth = 240

interface AppLayoutProps {
  children: React.ReactNode
}

interface NavigationItem {
  textKey: string
  text: string
  icon: React.ReactNode
  path?: string
  children?: NavigationItem[]
}

const getNavigationItems = (t: any): NavigationItem[] => [
  {
    textKey: 'dashboard',
    text: t('dashboard'),
    icon: <DashboardIcon />,
    path: '/'
  },
  {
    textKey: 'products_inventory',
    text: t('products_inventory'),
    icon: <ProductsIcon />,
    children: [
      { textKey: 'ingredients', text: t('ingredients'), icon: <InventoryIcon />, path: '/ingredients' },
      { textKey: 'inventory', text: t('inventory'), icon: <InventoryIcon />, path: '/inventory' },
      { textKey: 'menu_management', text: t('menu_management'), icon: <MenuManagementIcon />, path: '/menu' }
    ]
  },
  {
    textKey: 'supplies',
    text: t('supplies'),
    icon: <SuppliesIcon />,
    children: [
      { textKey: 'suppliers', text: t('suppliers'), icon: <SupplierIcon />, path: '/suppliers' },
      { textKey: 'supplier_orders', text: t('supplier_orders'), icon: <SupplierOrdersIcon />, path: '/supplier-orders' }
    ]
  },
  {
    textKey: 'finance_insights',
    text: t('finance_insights'),
    icon: <InsightsIcon />,
    children: [
      { textKey: 'financial', text: t('financial'), icon: <FinanceIcon />, path: '/finances' },
      { textKey: 'analytics', text: t('analytics'), icon: <AnalyticsIcon />, path: '/analytics' }
    ]
  },
  {
    textKey: 'employees',
    text: t('employees'),
    icon: <EmployeeIcon />,
    path: '/employees'
  },
  {
    textKey: 'orders',
    text: t('orders'),
    icon: <OrdersIcon />,
    path: '/orders'
  }
]

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()

  const navigationItems = React.useMemo(() => getNavigationItems(t), [t])
  // Check both theme direction and current language for RTL
  const isRtl = theme.direction === 'rtl' || i18n.language === 'he'

  // Auto-expand section if current path matches a child
  React.useEffect(() => {
    const currentPath = location.pathname
    const newExpanded: Record<string, boolean> = {}

    navigationItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => child.path === currentPath)
        if (hasActiveChild) {
          newExpanded[item.textKey] = true
        }
      }
    })

    setExpandedSections(prev => ({ ...prev, ...newExpanded }))
  }, [location.pathname, navigationItems])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const handleSectionToggle = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  const handleSignOut = async () => {
    handleUserMenuClose()
    await signOut()
  }

  const handleUserManagement = () => {
    handleUserMenuClose()
    navigate('/user-management')
  }

  // Helper function to find the current page title
  const getCurrentPageTitle = () => {
    const currentPath = location.pathname

    // Check direct paths first
    for (const item of navigationItems) {
      if (item.path === currentPath) {
        return item.text
      }
      // Check children
      if (item.children) {
        for (const child of item.children) {
          if (child.path === currentPath) {
            return child.text
          }
        }
      }
    }
    return t('dashboard')
  }

  // Render navigation item (recursive for nested items)
  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const isSelected = item.path === location.pathname
    const isExpanded = expandedSections[item.textKey]
    const hasChildren = item.children && item.children.length > 0

    return (
      <React.Fragment key={item.textKey}>
        <ListItem disablePadding>
          <ListItemButton
            selected={isSelected}
            onClick={() => {
              if (item.path) {
                handleNavigation(item.path)
              } else if (hasChildren) {
                handleSectionToggle(item.textKey)
              }
            }}
            sx={{
              pl: level * 2 + 2,
              pr: 2,
              borderRadius: 1,
              mx: 1,
              my: 0.25,
              minHeight: 44,
              '&:hover': {
                backgroundColor: 'rgba(127, 255, 212, 0.1)',
                transform: isRtl ? 'translateX(-2px)' : 'translateX(2px)',
                transition: 'all 0.2s ease-out'
              },
              '&.Mui-selected': {
                backgroundColor: '#7fffd4',
                color: '#1a1a1a',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#6ee6bb'
                },
                '& .MuiListItemIcon-root': {
                  color: '#1a1a1a'
                }
              }
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isSelected ? 'inherit' : level > 0 ? 'text.secondary' : 'text.primary',
                fontSize: level > 0 ? '1.2rem' : '1.3rem'
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                variant: level > 0 ? 'body2' : 'body1',
                fontWeight: isSelected ? 600 : level > 0 ? 400 : 500,
                color: 'inherit'
              }}
            />
            {hasChildren && <Box sx={{ color: isSelected ? 'inherit' : 'text.secondary' }}>{isExpanded ? <ExpandLess /> : <ExpandMore />}</Box>}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout={300} unmountOnExit>
            <List
              component="div"
              disablePadding
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 1,
                mx: 1,
                my: 0.5
              }}
            >
              {item.children?.map(child => renderNavigationItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    )
  }

  const drawer = (
    <div>
      <Toolbar
        sx={{
          py: 2,
          px: 2,
          display: 'flex',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <NomNomLogo size="medium" showText={true} />
      </Toolbar>
      <Box 
        sx={{ 
          height: 3,
          background: 'linear-gradient(to right, #5a9fd4, #7fffd4)',
        }} 
      />
      <List sx={{ px: 1 }}>{navigationItems.map(item => renderNavigationItem(item))}</List>
    </div>
  )

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isRtl ? 'row-reverse' : 'row'
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ...(isRtl
            ? {
                left: { md: `${drawerWidth}px` },
                right: 0,
                ml: 0,
                mr: 0
              }
            : {
                ml: { md: `${drawerWidth}px` },
                mr: { md: 0 }
              })
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: isRtl ? 0 : 2,
              ml: isRtl ? 2 : 0,
              display: { md: 'none' },
              order: isRtl ? 2 : 0
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              order: isRtl ? 1 : 0,
              justifyContent: isRtl ? 'flex-end' : 'flex-start'
            }}
          >
            <Typography
              variant="h5"
              noWrap
              component="div"
              sx={{
                fontWeight: 600,
                color: '#1a1a1a'
              }}
            >
              {getCurrentPageTitle()}
            </Typography>
          </Box>
          <Box sx={{ mr: 2 }}>
            <BusinessSelector />
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              order: isRtl ? 0 : 1
            }}
          >
            <LanguageSwitcher />
            {user && (
              <>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="user-menu"
                  aria-haspopup="true"
                  onClick={handleUserMenuOpen}
                  color="inherit"
                  sx={{
                    marginInlineStart: 1,
                    transition: 'all 0.3s ease-out',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      '& .MuiAvatar-root': {
                        boxShadow: '0 4px 12px rgba(127, 255, 212, 0.4)'
                      }
                    }
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      backgroundColor: '#7fffd4',
                      color: '#1a1a1a',
                      fontWeight: 600,
                      border: `2px solid #7fffd4`,
                      transition: 'all 0.3s ease-out',
                      '&:hover': {
                        backgroundColor: '#6ee6bb',
                        borderColor: '#6ee6bb'
                      }
                    }}
                  >
                    {user.user_metadata?.first_name?.[0] || user.email?.[0] || <AccountCircle />}
                  </Avatar>
                </IconButton>
                <Menu
                  id="user-menu"
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  onClick={handleUserMenuClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                      mt: 1.5,
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: isRtl ? 1 : -0.5,
                        mr: isRtl ? -0.5 : 1
                      }
                    }
                  }}
                  transformOrigin={{
                    horizontal: isRtl ? 'left' : 'right',
                    vertical: 'top'
                  }}
                  anchorOrigin={{
                    horizontal: isRtl ? 'left' : 'right',
                    vertical: 'bottom'
                  }}
                >
                  <MenuItem onClick={handleUserManagement}>
                    <ListItemIcon>
                      <Settings fontSize="small" />
                    </ListItemIcon>
                    {t('user_management')}
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleSignOut}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    {t('sign_out')}
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(to right, #7fffd4, #5a9fd4)'
          }}
        />
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          key={`temp-drawer-${i18n.language}`}
          variant="temporary"
          anchor={isRtl ? 'right' : 'left'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          key={`perm-drawer-${i18n.language}`}
          variant="permanent"
          anchor={isRtl ? 'right' : 'left'}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        className="main-content"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          ...(isRtl
            ? {
                marginLeft: 0,
                marginRight: 0
              }
            : {
                ml: 0,
                mr: { md: 0 }
              })
        }}
      >
        <Toolbar />
        <Box sx={{ height: 3 }} /> {/* Spacer for accent line */}
        {children}
      </Box>
    </Box>
  )
}
