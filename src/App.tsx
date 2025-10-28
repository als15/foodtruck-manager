import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/Layout/AntdAppLayout'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import FinancialManagement from './pages/FinancialManagement'
import MenuManagement from './pages/MenuManagement'
import Products from './pages/Products'
import Employees from './pages/Employees'
import Logistics from './pages/Logistics'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Suppliers from './pages/Suppliers'
import SupplierOrders from './pages/SupplierOrders'
import Analytics from './pages/Analytics'
import PrepPlanner from './pages/PrepPlanner'
import BreakEvenAnalysis from './pages/BreakEvenAnalysis'
import BusinessSettings from './pages/BusinessSettings'
import UserSettings from './pages/UserSettings'
import { Auth } from './pages/Auth'
import { UserManagement } from './pages/UserManagement'
import TeamManagement from './pages/TeamManagement'
import InviteAccept from './pages/InviteAccept'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { BusinessProvider } from './contexts/BusinessContext'
import { CustomThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/Auth/ProtectedRoute'
import { WelcomeAnimation } from './components/Welcome/WelcomeAnimation'

function AppContent() {
  const { user } = useAuth()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (user) {
      const hasSeenWelcome = localStorage.getItem(`welcome_shown_${user.id}`)
      if (!hasSeenWelcome) {
        setShowWelcome(true)
      }
    }
  }, [user])

  const handleCloseWelcome = () => {
    setShowWelcome(false)
    if (user) {
      localStorage.setItem(`welcome_shown_${user.id}`, 'true')
    }
  }

  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0]

  return (
    <>
      <WelcomeAnimation visible={showWelcome} onClose={handleCloseWelcome} userName={userName} />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/invite/:token" element={<InviteAccept />} />
            <Route
              path="/user-management"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <UserManagement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/finances" element={<FinancialManagement />} />
                      <Route path="/menu" element={<MenuManagement />} />
                      <Route path="/products" element={<Products />} />
                      {/* Legacy route redirect for backwards compatibility */}
                      <Route path="/ingredients" element={<Products />} />
                      <Route path="/employees" element={<Employees />} />
                      <Route path="/logistics" element={<Logistics />} />
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/suppliers" element={<Suppliers />} />
                      <Route path="/supplier-orders" element={<SupplierOrders />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/prep-planner" element={<PrepPlanner />} />
                      <Route path="/break-even-analysis" element={<BreakEvenAnalysis />} />
                      <Route path="/settings/business" element={<BusinessSettings />} />
                      <Route path="/settings" element={<UserSettings />} />
                      <Route path="/team" element={<TeamManagement />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
      </>
    )
}

function App() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <BusinessProvider>
          <AppContent />
        </BusinessProvider>
      </AuthProvider>
    </CustomThemeProvider>
  )
}

export default App
