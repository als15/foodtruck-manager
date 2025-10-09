import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Spin } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { formatCurrency } from '../utils/currency';
import { ordersService, transactionsService, menuItemsService, customersService, shiftsService } from '../services/supabaseService';
import { Order, Transaction, MenuItem, Customer, Shift } from '../types';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

export default function Analytics() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, transactionsData, menuItemsData, customersData, shiftsData] = await Promise.all([
        ordersService.getAll(),
        transactionsService.getAll(),
        menuItemsService.getAll(),
        customersService.getAll(),
        shiftsService.getAll()
      ]);
      setOrders(ordersData);
      setTransactions(transactionsData);
      setMenuItems(menuItemsData);
      setCustomers(customersData);
      setShifts(shiftsData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Date calculations
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Calculate monthly data for the last 6 months
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.orderTime);
      return orderDate >= monthDate && orderDate < nextMonth;
    });

    const revenue = monthOrders.reduce((sum, order) => sum + order.total, 0);

    // Calculate expenses from transactions for this month
    const monthTransactions = transactions.filter(txn => {
      const txnDate = new Date(txn.date);
      return txnDate >= monthDate && txnDate < nextMonth && txn.type === 'expense';
    });
    const expenses = monthTransactions.reduce((sum, txn) => sum + txn.amount, 0);

    monthlyData.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
      revenue,
      expenses,
      profit: revenue - expenses,
      orders: monthOrders.length
    });
  }

  // Calculate daily data for the last 7 days
  const dailyData = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.orderTime);
      return orderDate.toDateString() === date.toDateString();
    });

    dailyData.push({
      day: dayNames[date.getDay()],
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, order) => sum + order.total, 0)
    });
  }

  // Calculate popular menu items from last 30 days
  const recentOrders = orders.filter(order => new Date(order.orderTime) >= last30Days);
  const itemSales = new Map<string, { count: number; name: string }>();
  recentOrders.forEach(order => {
    order.items.forEach(item => {
      const existing = itemSales.get(item.menuItemId) || { count: 0, name: '' };
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      itemSales.set(item.menuItemId, {
        count: existing.count + item.quantity,
        name: menuItem?.name || 'Unknown Item'
      });
    });
  });

  const topItems = Array.from(itemSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalItemsSold = topItems.reduce((sum, item) => sum + item.count, 0);
  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const popularItemsData = topItems.map((item, index) => ({
    name: item.name,
    value: totalItemsSold > 0 ? Math.round((item.count / totalItemsSold) * 100) : 0,
    count: item.count,
    color: colors[index] || '#8884d8'
  }));

  // Calculate location performance
  const locationMap = new Map<string, { revenue: number; orders: number }>();
  recentOrders.forEach(order => {
    const location = order.location || 'Unknown Location';
    const existing = locationMap.get(location) || { revenue: 0, orders: 0 };
    locationMap.set(location, {
      revenue: existing.revenue + order.total,
      orders: existing.orders + 1
    });
  });

  const locationPerformanceData = Array.from(locationMap.entries())
    .map(([location, data]) => ({ location, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  // Calculate key metrics
  const totalRevenue = recentOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = recentOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate profit margin
  const totalCosts = recentOrders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      return itemSum + (menuItem?.totalIngredientCost || 0) * item.quantity;
    }, 0);
  }, 0);
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

  // Customer metrics
  const activeCustomers = customers.filter(customer =>
    customer.lastVisit && new Date(customer.lastVisit) >= last30Days
  ).length;

  // Staff productivity
  const recentShifts = shifts.filter(shift => new Date(shift.date) >= last7Days);
  const totalHours = recentShifts.reduce((sum, shift) => sum + shift.hoursWorked, 0);
  const ordersPerHour = totalHours > 0 ? dailyData.reduce((sum, day) => sum + day.orders, 0) / totalHours : 0;

  // Average prep time (calculated from menu items)
  const avgPrepTime = menuItems.length > 0 ?
    menuItems.reduce((sum, item) => sum + (item.prepTime || 0), 0) / menuItems.length : 0;

  // Dynamic business insights calculations
  const ordersByHour = new Map<number, number>();
  recentOrders.forEach(order => {
    const hour = new Date(order.orderTime).getHours();
    ordersByHour.set(hour, (ordersByHour.get(hour) || 0) + 1);
  });

  const peakHours = Array.from(ordersByHour.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([hour]) => `${hour}:00`);

  const bestDay = dailyData.reduce((best, day) =>
    day.revenue > best.revenue ? day : best, dailyData[0] || { day: 'N/A', revenue: 0 });

  const bestLocation = locationPerformanceData[0] || { location: 'N/A', revenue: 0 };

  const topMenuItem = topItems[0] || { name: 'N/A', count: 0 };
  const topItemPercentage = totalItemsSold > 0 ? Math.round((topMenuItem.count / totalItemsSold) * 100) : 0;

  const repeatCustomers = customers.filter(c => c.totalOrders && c.totalOrders > 1).length;
  const loyaltyRate = customers.length > 0 ? Math.round((repeatCustomers / customers.length) * 100) : 0;

  const avgCustomerValue = activeCustomers > 0 ? Math.round(totalRevenue / activeCustomers) : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, padding: 24 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={4} style={{ marginBottom: 24 }}>
        {t('analytics')} Dashboard
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={6}>
          <Card>
            <Title level={5} style={{ color: '#1890ff', marginBottom: 8 }}>
              {t('total_revenue')} (30D)
            </Title>
            <Title level={3} style={{ margin: 0 }}>
              {formatCurrency(totalRevenue)}
            </Title>
            <Text type="secondary">
              {totalOrders} {t('orders_text')} • {formatCurrency(avgOrderValue)} {t('avg_order_value')}
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Title level={5} style={{ color: '#52c41a', marginBottom: 8 }}>
              {t('total_orders')} (30D)
            </Title>
            <Title level={3} style={{ margin: 0 }}>
              {totalOrders}
            </Title>
            <Text type="secondary">
              {activeCustomers} {t('active_customers')}
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Title level={5} style={{ color: '#faad14', marginBottom: 8 }}>
              {t('average_order_value')}
            </Title>
            <Title level={3} style={{ margin: 0 }}>
              {formatCurrency(avgOrderValue)}
            </Title>
            <Text type="secondary">
              {ordersPerHour.toFixed(1)} {t('orders_per_hour')}
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Title level={5} style={{ color: '#52c41a', marginBottom: 8 }}>
              {t('profit_margin')}
            </Title>
            <Title level={3} style={{ margin: 0 }}>
              {profitMargin.toFixed(1)}%
            </Title>
            <Text type="secondary">
              {formatCurrency(totalRevenue - totalCosts)} {t('profit')}
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card>
            <Title level={5} style={{ marginBottom: 16 }}>
              Revenue vs Expenses (6 Months)
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#2196f3" name="Revenue" />
                <Bar dataKey="expenses" fill="#ff9800" name="Expenses" />
                <Bar dataKey="profit" fill="#4caf50" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card>
            <Title level={5} style={{ marginBottom: 16 }}>
              Popular Menu Items
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={popularItemsData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {popularItemsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card>
            <Title level={5} style={{ marginBottom: 16 }}>
              Daily Sales Trends (This Week)
            </Title>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="orders" fill="#ff9800" name="Orders" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2196f3"
                  strokeWidth={3}
                  name="Revenue ($)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card>
            <Title level={5} style={{ marginBottom: 16 }}>
              Location Performance
            </Title>
            <div>
              {locationPerformanceData.map((location, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block' }}>
                    {location.location}
                  </Text>
                  <Text type="secondary" style={{ display: 'block' }}>
                    Revenue: {formatCurrency(location.revenue)}
                  </Text>
                  <Text type="secondary" style={{ display: 'block' }}>
                    Orders: {location.orders}
                  </Text>
                  <Text type="secondary" style={{ display: 'block' }}>
                    Avg Order: ${(location.revenue / location.orders).toFixed(2)}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Title level={5} style={{ marginBottom: 16 }}>
              Key Performance Indicators
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Text>Customer Retention Rate</Text>
                <Title level={5} style={{ color: '#52c41a', margin: '4px 0 0 0' }}>
                  {totalOrders > 0 ? Math.round((customers.filter(c => c.totalOrders && c.totalOrders > 1).length / customers.length) * 100) : 0}%
                </Title>
              </div>
              <div>
                <Text>Average Prep Time</Text>
                <Title level={5} style={{ color: '#1890ff', margin: '4px 0 0 0' }}>{avgPrepTime.toFixed(1)} min</Title>
              </div>
              <div>
                <Text>Active Customers (30d)</Text>
                <Title level={5} style={{ color: '#faad14', margin: '4px 0 0 0' }}>{activeCustomers}</Title>
              </div>
              <div>
                <Text>Orders per Hour</Text>
                <Title level={5} style={{ color: '#1890ff', margin: '4px 0 0 0' }}>{ordersPerHour.toFixed(1)}</Title>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card>
            <Title level={5} style={{ marginBottom: 16 }}>
              Business Insights
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text>
                • Peak hours: {peakHours.length > 0 ? peakHours.join(' and ') : 'No data available'}
              </Text>
              <Text>
                • Best performing day: {bestDay.day} ({formatCurrency(bestDay.revenue)} revenue)
              </Text>
              <Text>
                • Most profitable location: {bestLocation.location}
              </Text>
              <Text>
                • Top menu item: {topMenuItem.name} ({topItemPercentage}% of orders)
              </Text>
              <Text>
                • Customer retention rate: {loyaltyRate}%
              </Text>
              <Text>
                • Average customer value (30d): {formatCurrency(avgCustomerValue)}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
