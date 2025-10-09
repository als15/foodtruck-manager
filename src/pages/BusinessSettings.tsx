import React, { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Input,
  Switch,
  Select,
  Alert,
  message,
  Divider,
  Tabs,
  Tag,
  Space
} from 'antd'
import {
  ShopOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  BgColorsOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  SaveOutlined,
  UndoOutlined,
  SafetyOutlined,
  BellOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '../contexts/BusinessContext'
import { useThemeMode } from '../contexts/ThemeContext'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

interface BusinessSettingsData {
  name: string
  description: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  website: string
  taxId: string
  currency: string
  timezone: string
  language: string
  workingHours: {
    start: string
    end: string
    days: string[]
  }
  notifications: {
    lowStock: boolean
    newOrders: boolean
    dailyReports: boolean
    financialAlerts: boolean
  }
  branding: {
    primaryColor: string
    secondaryColor: string
    logo?: string
  }
}

const defaultSettings: BusinessSettingsData = {
  name: '',
  description: '',
  address: '',
  city: '',
  country: '',
  phone: '',
  email: '',
  website: '',
  taxId: '',
  currency: 'USD',
  timezone: 'UTC',
  language: 'en',
  workingHours: {
    start: '09:00',
    end: '17:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  notifications: {
    lowStock: true,
    newOrders: true,
    dailyReports: false,
    financialAlerts: true
  },
  branding: {
    primaryColor: '#20E3B2',
    secondaryColor: '#3A86FF'
  }
}

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
]

const timezones = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Jerusalem',
  'Asia/Tokyo',
  'Australia/Sydney'
]

const languages = [
  { code: 'en', name: 'English' },
  { code: 'he', name: 'עברית' }
]

const weekDays = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]

export default function BusinessSettings() {
  const { t, i18n } = useTranslation()
  const { isDarkMode, toggleTheme } = useThemeMode()
  const { currentBusiness } = useBusiness()
  const [tabValue, setTabValue] = useState('1')
  const [settings, setSettings] = useState<BusinessSettingsData>(defaultSettings)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load business settings
    loadBusinessSettings()
  }, [])

  const loadBusinessSettings = async () => {
    try {
      // In a real app, this would load from the API
      // For now, we'll use default settings with some business data
      setSettings(prev => ({
        ...prev,
        name: currentBusiness?.name || 'My Food Truck',
        email: currentBusiness?.email || '',
        language: i18n.language
      }))
    } catch (error) {
      console.error('Error loading business settings:', error)
    }
  }

  const handleTabChange = (key: string) => {
    setTabValue(key)
  }

  const handleSettingChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedSettingChange = (parent: keyof BusinessSettingsData, field: string, value: any) => {
    setSettings(prev => {
      const parentObj = prev[parent] as any
      return {
        ...prev,
        [parent]: {
          ...parentObj,
          [field]: value
        }
      }
    })
  }

  const handleWorkingDaysChange = (day: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        days: checked
          ? [...prev.workingHours.days, day]
          : prev.workingHours.days.filter(d => d !== day)
      }
    }))
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      // In a real app, this would save to the API
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update language if changed
      if (settings.language !== i18n.language) {
        i18n.changeLanguage(settings.language)
      }

      message.success(t('settings_saved_successfully') || 'Settings saved successfully')
    } catch (error) {
      message.error(t('failed_to_save_settings') || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleResetSettings = () => {
    setSettings(defaultSettings)
    message.success(t('settings_reset') || 'Settings reset to defaults')
  }

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <ShopOutlined />
          {t('general') || 'General'}
        </span>
      ),
      children: (
        <div style={{ padding: 24 }}>
          <Row gutter={[16, 16]}>
            {/* Business Information */}
            <Col span={24}>
              <Space>
                <ShopOutlined />
                <Title level={5} style={{ margin: 0 }}>
                  {t('business_information') || 'Business Information'}
                </Title>
              </Space>
            </Col>

            <Col xs={24} md={12}>
              <div>
                <Text>{t('business_name') || 'Business Name'}</Text>
                <Input
                  value={settings.name}
                  onChange={(e) => handleSettingChange('name', e.target.value)}
                  required
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div>
                <Text>{t('tax_id') || 'Tax ID'}</Text>
                <Input
                  value={settings.taxId}
                  onChange={(e) => handleSettingChange('taxId', e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>

            <Col span={24}>
              <div>
                <Text>{t('business_description') || 'Business Description'}</Text>
                <TextArea
                  rows={3}
                  value={settings.description}
                  onChange={(e) => handleSettingChange('description', e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>

            {/* Contact Information */}
            <Col span={24}>
              <Divider />
              <Space>
                <EnvironmentOutlined />
                <Title level={5} style={{ margin: 0 }}>
                  {t('contact_information') || 'Contact Information'}
                </Title>
              </Space>
            </Col>

            <Col xs={24} md={16}>
              <div>
                <Text>{t('address') || 'Address'}</Text>
                <Input
                  value={settings.address}
                  onChange={(e) => handleSettingChange('address', e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div>
                <Text>{t('city') || 'City'}</Text>
                <Input
                  value={settings.city}
                  onChange={(e) => handleSettingChange('city', e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div>
                <Text>{t('country') || 'Country'}</Text>
                <Input
                  value={settings.country}
                  onChange={(e) => handleSettingChange('country', e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div>
                <Text>{t('phone') || 'Phone'}</Text>
                <Input
                  value={settings.phone}
                  onChange={(e) => handleSettingChange('phone', e.target.value)}
                  prefix={<PhoneOutlined />}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div>
                <Text>{t('email') || 'Email'}</Text>
                <Input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleSettingChange('email', e.target.value)}
                  prefix={<MailOutlined />}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div>
                <Text>{t('website') || 'Website'}</Text>
                <Input
                  value={settings.website}
                  onChange={(e) => handleSettingChange('website', e.target.value)}
                  placeholder="https://example.com"
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>

            {/* Working Hours */}
            <Col span={24}>
              <Divider />
              <Space>
                <ClockCircleOutlined />
                <Title level={5} style={{ margin: 0 }}>
                  {t('working_hours') || 'Working Hours'}
                </Title>
              </Space>
            </Col>

            <Col xs={24} md={6}>
              <div>
                <Text>{t('start_time') || 'Start Time'}</Text>
                <Input
                  type="time"
                  value={settings.workingHours.start}
                  onChange={(e) => handleNestedSettingChange('workingHours', 'start', e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>

            <Col xs={24} md={6}>
              <div>
                <Text>{t('end_time') || 'End Time'}</Text>
                <Input
                  type="time"
                  value={settings.workingHours.end}
                  onChange={(e) => handleNestedSettingChange('workingHours', 'end', e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div>
                <Text>{t('working_days') || 'Working Days'}</Text>
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {weekDays.map(day => (
                    <Tag
                      key={day}
                      color={settings.workingHours.days.includes(day) ? 'blue' : 'default'}
                      onClick={() => handleWorkingDaysChange(day, !settings.workingHours.days.includes(day))}
                      style={{ cursor: 'pointer' }}
                    >
                      {t(day) || day}
                    </Tag>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: '2',
      label: (
        <span>
          <BgColorsOutlined />
          {t('preferences') || 'Preferences'}
        </span>
      ),
      children: (
        <div style={{ padding: 24 }}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Space>
                <BgColorsOutlined />
                <Title level={5} style={{ margin: 0 }}>
                  {t('appearance_preferences') || 'Appearance & Preferences'}
                </Title>
              </Space>
            </Col>

            <Col xs={24} md={8}>
              <div>
                <Text>{t('language') || 'Language'}</Text>
                <Select
                  value={settings.language}
                  onChange={(value) => handleSettingChange('language', value)}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {languages.map(lang => (
                    <Option key={lang.code} value={lang.code}>
                      {lang.name}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div>
                <Text>{t('currency') || 'Currency'}</Text>
                <Select
                  value={settings.currency}
                  onChange={(value) => handleSettingChange('currency', value)}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {currencies.map(curr => (
                    <Option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.name}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div>
                <Text>{t('timezone') || 'Timezone'}</Text>
                <Select
                  value={settings.timezone}
                  onChange={(value) => handleSettingChange('timezone', value)}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {timezones.map(tz => (
                    <Option key={tz} value={tz}>
                      {tz}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>

            <Col span={24}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text>{t('dark_mode') || 'Dark Mode'}</Text>
                <Switch
                  checked={isDarkMode}
                  onChange={toggleTheme}
                />
              </div>
            </Col>

            {/* Branding */}
            <Col span={24}>
              <Divider />
              <Title level={5}>{t('branding') || 'Branding'}</Title>
            </Col>

            <Col xs={24} md={12}>
              <div>
                <Text>{t('primary_color') || 'Primary Color'}</Text>
                <Input
                  type="color"
                  value={settings.branding.primaryColor}
                  onChange={(e) => handleNestedSettingChange('branding', 'primaryColor', e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div>
                <Text>{t('secondary_color') || 'Secondary Color'}</Text>
                <Input
                  type="color"
                  value={settings.branding.secondaryColor}
                  onChange={(e) => handleNestedSettingChange('branding', 'secondaryColor', e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: '3',
      label: (
        <span>
          <BellOutlined />
          {t('notifications') || 'Notifications'}
        </span>
      ),
      children: (
        <div style={{ padding: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Space>
              <BellOutlined />
              <Title level={5} style={{ margin: 0 }}>
                {t('notification_preferences') || 'Notification Preferences'}
              </Title>
            </Space>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Switch
                  checked={settings.notifications.lowStock}
                  onChange={(checked) => handleNestedSettingChange('notifications', 'lowStock', checked)}
                />
                <Text>{t('low_stock_alerts') || 'Low Stock Alerts'}</Text>
              </div>
              <Text type="secondary" style={{ marginLeft: 32, fontSize: '12px' }}>
                {t('low_stock_alerts_desc') || 'Get notified when inventory items are running low'}
              </Text>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Switch
                  checked={settings.notifications.newOrders}
                  onChange={(checked) => handleNestedSettingChange('notifications', 'newOrders', checked)}
                />
                <Text>{t('new_order_notifications') || 'New Order Notifications'}</Text>
              </div>
              <Text type="secondary" style={{ marginLeft: 32, fontSize: '12px' }}>
                {t('new_order_notifications_desc') || 'Get notified when new orders are received'}
              </Text>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Switch
                  checked={settings.notifications.dailyReports}
                  onChange={(checked) => handleNestedSettingChange('notifications', 'dailyReports', checked)}
                />
                <Text>{t('daily_reports') || 'Daily Reports'}</Text>
              </div>
              <Text type="secondary" style={{ marginLeft: 32, fontSize: '12px' }}>
                {t('daily_reports_desc') || 'Receive daily sales and performance reports'}
              </Text>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Switch
                  checked={settings.notifications.financialAlerts}
                  onChange={(checked) => handleNestedSettingChange('notifications', 'financialAlerts', checked)}
                />
                <Text>{t('financial_alerts') || 'Financial Alerts'}</Text>
              </div>
              <Text type="secondary" style={{ marginLeft: 32, fontSize: '12px' }}>
                {t('financial_alerts_desc') || 'Get notified about important financial events and milestones'}
              </Text>
            </div>
          </Space>
        </div>
      )
    },
    {
      key: '4',
      label: (
        <span>
          <SafetyOutlined />
          {t('security') || 'Security'}
        </span>
      ),
      children: (
        <div style={{ padding: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Space>
              <SafetyOutlined />
              <Title level={5} style={{ margin: 0 }}>
                {t('security_settings') || 'Security Settings'}
              </Title>
            </Space>

            <Alert
              message={t('security_settings_info') || 'Security settings help protect your business data and ensure compliance with data protection regulations.'}
              type="info"
            />

            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card>
                  <Title level={5}>{t('data_backup') || 'Data Backup'}</Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    {t('data_backup_desc') || 'Automatically backup your business data to ensure it\'s never lost.'}
                  </Text>
                  <Button>{t('configure_backup') || 'Configure Backup'}</Button>
                </Card>
              </Col>

              <Col span={24}>
                <Card>
                  <Title level={5}>{t('access_logs') || 'Access Logs'}</Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    {t('access_logs_desc') || 'Monitor who has accessed your business data and when.'}
                  </Text>
                  <Button>{t('view_logs') || 'View Logs'}</Button>
                </Card>
              </Col>

              <Col span={24}>
                <Card>
                  <Title level={5}>{t('export_data') || 'Export Data'}</Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    {t('export_data_desc') || 'Export your business data for backup or migration purposes.'}
                  </Text>
                  <Button>{t('export_now') || 'Export Now'}</Button>
                </Card>
              </Col>
            </Row>
          </Space>
        </div>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          {t('business_settings') || 'Business Settings'}
        </Title>
        <Space>
          <Button
            icon={<UndoOutlined />}
            onClick={handleResetSettings}
          >
            {t('reset') || 'Reset'}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveSettings}
            loading={loading}
          >
            {t('save_settings') || 'Save Settings'}
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs
          activeKey={tabValue}
          onChange={handleTabChange}
          items={tabItems}
        />
      </Card>
    </div>
  )
}
