import React, { useState } from 'react'
import { AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useTheme, useMediaQuery } from '@mui/material'
import { Menu as MenuIcon, Dashboard as DashboardIcon, Receipt as OrdersIcon, AttachMoney as FinanceIcon, Restaurant as MenuManagementIcon, People as EmployeeIcon, Route as LogisticsIcon, Inventory as InventoryIcon, Person as CustomerIcon, Business as SupplierIcon, Analytics as AnalyticsIcon } from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

const drawerWidth = 240

interface AppLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Orders', icon: <OrdersIcon />, path: '/orders' },
  { text: 'Finances', icon: <FinanceIcon />, path: '/finances' },
  { text: 'Menu', icon: <MenuManagementIcon />, path: '/menu' },
  { text: 'Ingredients', icon: <InventoryIcon />, path: '/ingredients' },
  { text: 'Employees', icon: <EmployeeIcon />, path: '/employees' },
  // { text: 'Logistics', icon: <LogisticsIcon />, path: '/logistics' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
  // { text: 'Customers', icon: <CustomerIcon />, path: '/customers' },
  { text: 'Suppliers', icon: <SupplierIcon />, path: '/suppliers' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' }
]

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()

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
          ml: { md: `${drawerWidth}px` }
        }}
      >
        <Toolbar>
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {navigationItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
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
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` }
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
