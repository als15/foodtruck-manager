import React, { useState } from 'react'
import { AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useTheme, useMediaQuery, Menu, MenuItem, Avatar, Divider } from '@mui/material'
import { Menu as MenuIcon, Dashboard as DashboardIcon, Receipt as OrdersIcon, AttachMoney as FinanceIcon, Restaurant as MenuManagementIcon, People as EmployeeIcon, Route as LogisticsIcon, Inventory as InventoryIcon, Person as CustomerIcon, Business as SupplierIcon, Analytics as AnalyticsIcon, AccountCircle, Settings, Logout } from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../LanguageSwitcher'
import { useAuth } from '../../contexts/AuthContext'

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
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()

  const navigationItems = getNavigationItems(t)
  // Check both theme direction and current language for RTL
  const isRtl = theme.direction === 'rtl' || i18n.language === 'he'

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
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
    <Box sx={{ 
      display: 'flex',
      flexDirection: isRtl ? 'row-reverse' : 'row'
    }}>
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
              display: { md: 'none' } 
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => item.path === location.pathname)?.text || t('dashboard')}
          </Typography>
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
                sx={{ ml: 1 }}
              >
                <Avatar sx={{ width: 32, height: 32 }}>
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
                      mr: isRtl ? -0.5 : 1,
                    },
                  },
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
        </Toolbar>
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
                marginLeft: { md: `${drawerWidth}px` },
                marginRight: 0
              }
            : {
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
