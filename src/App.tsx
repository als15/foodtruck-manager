import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import FinancialManagement from './pages/FinancialManagement';
import MenuManagement from './pages/MenuManagement';
import Ingredients from './pages/Ingredients';
import Employees from './pages/Employees';
import Logistics from './pages/Logistics';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Analytics from './pages/Analytics';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/finances" element={<FinancialManagement />} />
        <Route path="/menu" element={<MenuManagement />} />
        <Route path="/ingredients" element={<Ingredients />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/logistics" element={<Logistics />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
