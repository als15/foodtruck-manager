import React, { useState } from 'react';
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
  Tabs,
  List,
  DatePicker
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  CarOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Location, Route } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function Logistics() {
  const [tabValue, setTabValue] = useState('0');
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  const [openRouteDialog, setOpenRouteDialog] = useState(false);

  const [locations, setLocations] = useState<Location[]>([
    {
      id: '1',
      name: 'Downtown Park',
      address: '123 Main St, Downtown',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      type: 'regular',
      permitsRequired: ['Food Vendor', 'Park Permit']
    },
    {
      id: '2',
      name: 'Business District',
      address: '456 Corporate Ave',
      coordinates: { lat: 40.7580, lng: -73.9855 },
      type: 'regular',
      permitsRequired: ['Food Vendor']
    },
    {
      id: '3',
      name: 'Music Festival',
      address: 'Central Park, Event Area',
      coordinates: { lat: 40.7812, lng: -73.9665 },
      type: 'event',
      permitsRequired: ['Food Vendor', 'Event Permit', 'Special License']
    }
  ]);

  const [routes, setRoutes] = useState<Route[]>([
    {
      id: '1',
      name: 'Daily Downtown Route',
      date: new Date(),
      locations: [locations[0], locations[1]],
      estimatedRevenue: 1500,
      actualRevenue: 1247,
      expenses: 245,
      status: 'completed'
    },
    {
      id: '2',
      name: 'Weekend Festival',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      locations: [locations[2]],
      estimatedRevenue: 2500,
      expenses: 350,
      status: 'planned'
    }
  ]);

  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    name: '',
    address: '',
    coordinates: { lat: 0, lng: 0 },
    type: 'regular',
    permitsRequired: []
  });

  const [newRoute, setNewRoute] = useState<Partial<Route>>({
    name: '',
    date: new Date(),
    locations: [],
    estimatedRevenue: 0,
    expenses: 0,
    status: 'planned'
  });

  const handleSaveLocation = () => {
    const location: Location = {
      ...newLocation as Location,
      id: Date.now().toString()
    };
    setLocations([...locations, location]);

    setNewLocation({
      name: '',
      address: '',
      coordinates: { lat: 0, lng: 0 },
      type: 'regular',
      permitsRequired: []
    });
    setOpenLocationDialog(false);
  };

  const handleSaveRoute = () => {
    const route: Route = {
      ...newRoute as Route,
      id: Date.now().toString(),
      locations: locations.filter(loc =>
        newRoute.locations?.some(routeLoc => routeLoc.id === loc.id)
      )
    };
    setRoutes([...routes, route]);

    setNewRoute({
      name: '',
      date: new Date(),
      locations: [],
      estimatedRevenue: 0,
      expenses: 0,
      status: 'planned'
    });
    setOpenRouteDialog(false);
  };

  const handleDeleteLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };

  const handleDeleteRoute = (id: string) => {
    setRoutes(routes.filter(route => route.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'blue';
      case 'active': return 'orange';
      case 'completed': return 'green';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'regular': return 'blue';
      case 'event': return 'purple';
      case 'special': return 'orange';
      default: return 'default';
    }
  };

  const handlePermitsChange = (value: string) => {
    const permits = value.split(',').map(p => p.trim()).filter(p => p);
    setNewLocation({ ...newLocation, permitsRequired: permits });
  };

  const routeColumns: ColumnsType<Route> = [
    {
      title: 'Route Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: Date) => date.toLocaleDateString(),
    },
    {
      title: 'Locations',
      dataIndex: 'locations',
      key: 'locations',
      render: (locations: Location[]) => (
        <Space size={[0, 4]} wrap>
          {locations.map(loc => (
            <Tag key={loc.id}>{loc.name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Est. Revenue',
      dataIndex: 'estimatedRevenue',
      key: 'estimatedRevenue',
      render: (value: number) => `$${value}`,
    },
    {
      title: 'Actual Revenue',
      dataIndex: 'actualRevenue',
      key: 'actualRevenue',
      render: (value?: number) => value ? `$${value}` : '-',
    },
    {
      title: 'Expenses',
      dataIndex: 'expenses',
      key: 'expenses',
      render: (value: number) => `$${value}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Route) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteRoute(record.id)}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4}>Logistics Management</Title>
        <Space>
          <Button
            icon={<CarOutlined />}
            onClick={() => setOpenRouteDialog(true)}
          >
            Plan Route
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpenLocationDialog(true)}
          >
            Add Location
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs
          activeKey={tabValue}
          onChange={setTabValue}
          items={[
            {
              key: '0',
              label: 'Locations',
              children: (
                <Row gutter={[16, 16]}>
                  {locations.map((location) => (
                    <Col xs={24} sm={12} md={8} key={location.id}>
                      <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <Space>
                            <EnvironmentOutlined />
                            <Title level={5} style={{ margin: 0 }}>
                              {location.name}
                            </Title>
                          </Space>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteLocation(location.id)}
                          />
                        </div>

                        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                          {location.address}
                        </Text>

                        <Tag color={getTypeColor(location.type)} style={{ marginBottom: 8 }}>
                          {location.type}
                        </Tag>

                        <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                          Coordinates: {location.coordinates.lat}, {location.coordinates.lng}
                        </Text>

                        {location.permitsRequired.length > 0 && (
                          <div>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                              Required Permits:
                            </Text>
                            <Space size={[0, 4]} wrap>
                              {location.permitsRequired.map((permit, index) => (
                                <Tag key={index} style={{ fontSize: 11 }}>
                                  {permit}
                                </Tag>
                              ))}
                            </Space>
                          </div>
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>
              ),
            },
            {
              key: '1',
              label: 'Routes',
              children: (
                <Table
                  columns={routeColumns}
                  dataSource={routes}
                  rowKey="id"
                  pagination={false}
                />
              ),
            },
            {
              key: '2',
              label: 'Schedule',
              children: (
                <div>
                  <Title level={5} style={{ marginBottom: 16 }}>
                    Upcoming Schedule
                  </Title>
                  <List
                    itemLayout="horizontal"
                    dataSource={routes
                      .filter(route => route.date >= new Date())
                      .sort((a, b) => a.date.getTime() - b.date.getTime())}
                    renderItem={(route) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<CalendarOutlined style={{ fontSize: 20 }} />}
                          title={route.name}
                          description={`${route.date.toLocaleDateString()} - ${route.locations.map(l => l.name).join(', ')}`}
                        />
                        <Tag color={getStatusColor(route.status)}>{route.status}</Tag>
                      </List.Item>
                    )}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Location Dialog */}
      <Modal
        title="Add New Location"
        open={openLocationDialog}
        onCancel={() => setOpenLocationDialog(false)}
        onOk={handleSaveLocation}
        okText="Add Location"
        width={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <Input
            placeholder="Location Name"
            value={newLocation.name}
            onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
          />

          <Input
            placeholder="Address"
            value={newLocation.address}
            onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Input
                placeholder="Latitude"
                type="number"
                step="0.000001"
                value={newLocation.coordinates?.lat}
                onChange={(e) => setNewLocation({
                  ...newLocation,
                  coordinates: {
                    ...newLocation.coordinates!,
                    lat: parseFloat(e.target.value)
                  }
                })}
              />
            </Col>
            <Col span={12}>
              <Input
                placeholder="Longitude"
                type="number"
                step="0.000001"
                value={newLocation.coordinates?.lng}
                onChange={(e) => setNewLocation({
                  ...newLocation,
                  coordinates: {
                    ...newLocation.coordinates!,
                    lng: parseFloat(e.target.value)
                  }
                })}
              />
            </Col>
          </Row>

          <select
            style={{ padding: '4px 11px', borderRadius: 6, border: '1px solid #d9d9d9', height: 32 }}
            value={newLocation.type}
            onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value as any })}
          >
            <option value="regular">Regular</option>
            <option value="event">Event</option>
            <option value="special">Special</option>
          </select>

          <Input
            placeholder="Required Permits (comma separated)"
            value={newLocation.permitsRequired?.join(', ') || ''}
            onChange={(e) => handlePermitsChange(e.target.value)}
          />
        </div>
      </Modal>

      {/* Route Dialog */}
      <Modal
        title="Plan New Route"
        open={openRouteDialog}
        onCancel={() => setOpenRouteDialog(false)}
        onOk={handleSaveRoute}
        okText="Create Route"
        width={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <Input
            placeholder="Route Name"
            value={newRoute.name}
            onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
          />

          <Input
            type="date"
            value={newRoute.date?.toISOString().split('T')[0]}
            onChange={(e) => setNewRoute({ ...newRoute, date: new Date(e.target.value) })}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Input
                placeholder="Estimated Revenue"
                type="number"
                value={newRoute.estimatedRevenue}
                onChange={(e) => setNewRoute({ ...newRoute, estimatedRevenue: parseFloat(e.target.value) })}
              />
            </Col>
            <Col span={12}>
              <Input
                placeholder="Estimated Expenses"
                type="number"
                value={newRoute.expenses}
                onChange={(e) => setNewRoute({ ...newRoute, expenses: parseFloat(e.target.value) })}
              />
            </Col>
          </Row>
        </div>
      </Modal>
    </div>
  );
}
