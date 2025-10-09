import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Modal,
  Input,
  Table,
  Tag,
  Space,
  Spin,
  Alert,
  message,
  Tabs,
  Avatar,
  Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Customer } from '../types';
import { customersService } from '../services/supabaseService';
import { formatCurrency } from '../utils/currency';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function Customers() {
  const [tabValue, setTabValue] = useState('1');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customersService.getAll();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    loyaltyPoints: 0,
    totalOrders: 0,
    totalSpent: 0,
    favoriteItems: [],
    lastVisit: new Date()
  });

  const handleSaveCustomer = async () => {
    try {
      if (editingCustomer) {
        const updated = await customersService.update(editingCustomer.id, newCustomer);
        setCustomers(customers.map(customer =>
          customer.id === editingCustomer.id ? updated : customer
        ));
        message.success('Customer updated successfully');
      } else {
        const created = await customersService.create({
          ...newCustomer,
          loyaltyPoints: newCustomer.loyaltyPoints || 0,
          totalOrders: newCustomer.totalOrders || 0,
          totalSpent: newCustomer.totalSpent || 0,
          favoriteItems: newCustomer.favoriteItems || [],
          lastVisit: newCustomer.lastVisit || new Date()
        } as Omit<Customer, 'id' | 'businessId'>);
        setCustomers([...customers, created]);
        message.success('Customer added successfully');
      }

      setNewCustomer({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: 0,
        favoriteItems: [],
        lastVisit: new Date()
      });
      setEditingCustomer(null);
      setOpenDialog(false);
    } catch (err) {
      console.error('Error saving customer:', err);
      message.error('Failed to save customer');
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setNewCustomer(customer);
    setEditingCustomer(customer);
    setOpenDialog(true);
  };

  const handleDeleteCustomer = async (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this customer?',
      onOk: async () => {
        try {
          await customersService.delete(id);
          setCustomers(customers.filter(customer => customer.id !== id));
          message.success('Customer deleted successfully');
        } catch (err) {
          console.error('Error deleting customer:', err);
          message.error('Failed to delete customer');
        }
      }
    });
  };

  const getLoyaltyTier = (points: number) => {
    if (points >= 200) return { tier: 'Gold', color: 'gold' };
    if (points >= 100) return { tier: 'Silver', color: 'blue' };
    return { tier: 'Bronze', color: 'default' };
  };

  const totalCustomers = customers.length;
  const totalLoyaltyPoints = customers.reduce((sum, customer) => sum + (customer.loyaltyPoints || 0), 0);
  const avgOrderValue = customers.length > 0
    ? customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0) /
      customers.reduce((sum, customer) => sum + (customer.totalOrders || 0), 0)
    : 0;

  const handleFavoriteItemsChange = (value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setNewCustomer({ ...newCustomer, favoriteItems: items });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message={error}
          type="error"
          style={{ marginBottom: 16 }}
        />
        <Button onClick={loadCustomers}>Retry</Button>
      </div>
    );
  }

  const loyaltyColumns: ColumnsType<Customer> = [
    {
      title: 'Customer',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      sorter: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
    },
    {
      title: 'Tier',
      key: 'tier',
      render: (_, record) => {
        const loyaltyTier = getLoyaltyTier(record.loyaltyPoints || 0);
        return (
          <Tag color={loyaltyTier.color} icon={<StarOutlined />}>
            {loyaltyTier.tier}
          </Tag>
        );
      },
      sorter: (a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0),
    },
    {
      title: 'Points',
      dataIndex: 'loyaltyPoints',
      key: 'loyaltyPoints',
      render: (points) => points || 0,
      sorter: (a, b) => (a.loyaltyPoints || 0) - (b.loyaltyPoints || 0),
    },
    {
      title: 'Total Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      render: (orders) => orders || 0,
      sorter: (a, b) => (a.totalOrders || 0) - (b.totalOrders || 0),
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (spent) => formatCurrency(spent || 0),
      sorter: (a, b) => (a.totalSpent || 0) - (b.totalSpent || 0),
    },
    {
      title: 'Points per $',
      key: 'pointsPerDollar',
      render: (_, record) => {
        const pointsPerDollar = (record.totalSpent || 0) > 0
          ? (record.loyaltyPoints || 0) / (record.totalSpent || 0)
          : 0;
        return formatCurrency(pointsPerDollar);
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Customer Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpenDialog(true)}
        >
          Add Customer
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Customers"
              value={totalCustomers}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Loyalty Points Issued"
              value={totalLoyaltyPoints}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Avg Order Value"
              value={avgOrderValue}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Repeat Customers"
              value={customers.filter(c => (c.totalOrders || 0) > 1).length}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false}>
        <Tabs activeKey={tabValue} onChange={setTabValue}>
          <TabPane tab="Customer List" key="1">
            <Row gutter={[16, 16]}>
              {customers.map((customer) => {
                const loyaltyTier = getLoyaltyTier(customer.loyaltyPoints || 0);
                return (
                  <Col xs={24} sm={12} md={8} key={customer.id}>
                    <Card bordered>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                        <Avatar icon={<UserOutlined />} style={{ marginRight: 16 }} />
                        <div style={{ flexGrow: 1 }}>
                          <Title level={5} style={{ margin: 0 }}>
                            {customer.firstName} {customer.lastName}
                          </Title>
                          <Tag color={loyaltyTier.color} icon={<StarOutlined />} style={{ marginTop: 4 }}>
                            {loyaltyTier.tier}
                          </Tag>
                        </div>
                        <Space>
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditCustomer(customer)}
                          />
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteCustomer(customer.id)}
                          />
                        </Space>
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">Email: </Text>
                        <Text>{customer.email}</Text>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">Phone: </Text>
                        <Text>{customer.phone}</Text>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">Loyalty Points: </Text>
                        <Text>{customer.loyaltyPoints || 0}</Text>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">Total Orders: </Text>
                        <Text>{customer.totalOrders || 0}</Text>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">Total Spent: </Text>
                        <Text>{formatCurrency(customer.totalSpent || 0)}</Text>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">Last Visit: </Text>
                        <Text>{customer.lastVisit?.toLocaleDateString() || 'Never'}</Text>
                      </div>

                      {(customer.favoriteItems?.length || 0) > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                            Favorite Items:
                          </Text>
                          <Space wrap>
                            {(customer.favoriteItems || []).map((item, index) => (
                              <Tag key={index}>{item}</Tag>
                            ))}
                          </Space>
                        </div>
                      )}
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </TabPane>

          <TabPane tab="Loyalty Program" key="2">
            <Title level={4} style={{ marginBottom: 16 }}>
              Loyalty Program Overview
            </Title>
            <Table
              columns={loyaltyColumns}
              dataSource={[...customers].sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab="Analytics" key="3">
            <Title level={4} style={{ marginBottom: 16 }}>
              Customer Analytics
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card bordered>
                  <Title level={5} style={{ marginBottom: 16 }}>
                    Loyalty Tier Distribution
                  </Title>
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Text>Gold Members: {customers.filter(c => (c.loyaltyPoints || 0) >= 200).length}</Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text>Silver Members: {customers.filter(c => (c.loyaltyPoints || 0) >= 100 && (c.loyaltyPoints || 0) < 200).length}</Text>
                    </div>
                    <div>
                      <Text>Bronze Members: {customers.filter(c => (c.loyaltyPoints || 0) < 100).length}</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card bordered>
                  <Title level={5} style={{ marginBottom: 16 }}>
                    Customer Insights
                  </Title>
                  <div style={{ marginBottom: 8 }}>
                    <Text>Most Loyal Customer: {customers.sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))[0]?.firstName} {customers.sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))[0]?.lastName}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>Highest Spender: {customers.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))[0]?.firstName} {customers.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))[0]?.lastName}</Text>
                  </div>
                  <div>
                    <Text>Most Frequent Visitor: {customers.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))[0]?.firstName} {customers.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))[0]?.lastName}</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        open={openDialog}
        onCancel={() => setOpenDialog(false)}
        onOk={handleSaveCustomer}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        width={600}
      >
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12}>
            <div>
              <Text>First Name</Text>
              <Input
                value={newCustomer.firstName || ''}
                onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text>Last Name</Text>
              <Input
                value={newCustomer.lastName || ''}
                onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24}>
            <div>
              <Text>Email</Text>
              <Input
                type="email"
                value={newCustomer.email || ''}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24}>
            <div>
              <Text>Phone</Text>
              <Input
                value={newCustomer.phone || ''}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div>
              <Text>Loyalty Points</Text>
              <Input
                type="number"
                value={newCustomer.loyaltyPoints || 0}
                onChange={(e) => setNewCustomer({ ...newCustomer, loyaltyPoints: parseInt(e.target.value) })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div>
              <Text>Total Orders</Text>
              <Input
                type="number"
                value={newCustomer.totalOrders || 0}
                onChange={(e) => setNewCustomer({ ...newCustomer, totalOrders: parseInt(e.target.value) })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div>
              <Text>Total Spent</Text>
              <Input
                type="number"
                step="0.01"
                value={newCustomer.totalSpent || 0}
                onChange={(e) => setNewCustomer({ ...newCustomer, totalSpent: parseFloat(e.target.value) })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24}>
            <div>
              <Text>Favorite Items (comma separated)</Text>
              <Input
                value={newCustomer.favoriteItems?.join(', ') || ''}
                onChange={(e) => handleFavoriteItemsChange(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
        </Row>
      </Modal>
    </div>
  );
}
