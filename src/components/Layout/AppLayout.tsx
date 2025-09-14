import React, { useState } from 'react'
import { AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useTheme, useMediaQuery } from '@mui/material'
import { Menu as MenuIcon, Dashboard as DashboardIcon, Receipt as OrdersIcon, AttachMoney as FinanceIcon, Restaurant as MenuManagementIcon, People as EmployeeIcon, Route as LogisticsIcon, Inventory as InventoryIcon, Person as CustomerIcon, Business as SupplierIcon, Analytics as AnalyticsIcon } from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../LanguageSwitcher'

const drawerWidth = 240

interface AppLayoutProps {
  children: React.ReactNode
}

const getNavigationItems = (t: any) => [
  { textKey: 'dashboard', text: t('dashboard'), icon: <DashboardIcon />, path: '/' },
  { textKey: 'orders', text: t('orders'), icon: <OrdersIcon />, path: '/orders' },
  { textKey: 'financial', text: t('financial'), icon: <FinanceIcon />, path: '/finances' },
  { textKey: 'menu_management', text: t('menu_management'), icon: <MenuManagementIcon />, path: '/menu' },
  { textKey: 'ingredients', text: t('ingredients'), icon: <InventoryIcon />, path: '/ingredients' },
  { textKey: 'employees', text: t('employees'), icon: <EmployeeIcon />, path: '/employees' },
  { textKey: 'inventory', text: t('inventory'), icon: <InventoryIcon />, path: '/inventory' },
  { textKey: 'suppliers', text: t('suppliers'), icon: <SupplierIcon />, path: '/suppliers' },
  { textKey: 'analytics', text: t('analytics'), icon: <AnalyticsIcon />, path: '/analytics' }
]

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  
  const navigationItems = getNavigationItems(t)
  const isRtl = theme.direction === 'rtl'

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          FoodTruck Manager
        </Typography>
      </Toolbar>
      <List>
        {navigationItems.map(item => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton selected={location.pathname === item.path} onClick={() => handleNavigation(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ...(isRtl ? {
            left: 0,
            right: { md: `${drawerWidth}px` },
            ml: 0,
            mr: 0
          } : {
            ml: { md: `${drawerWidth}px` },
            mr: { md: 0 }
          })
        }}
      >
        <Toolbar>
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => item.path === location.pathname)?.text || t('dashboard')}
          </Typography>
          <LanguageSwitcher />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
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
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ...(isRtl ? {
            marginLeft: 0,
            marginRight: { md: `${drawerWidth}px` }
          } : {
            ml: { md: `${drawerWidth}px` },
            mr: { md: 0 }
          })
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
