import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Finances from './pages/Finances';
import MenuManagement from './pages/MenuManagement';
import Employees from './pages/Employees';
import Logistics from './pages/Logistics';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/finances" element={<Finances />} />
        <Route path="/menu" element={<MenuManagement />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/logistics" element={<Logistics />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
