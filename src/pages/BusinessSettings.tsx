import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Switch, 
  FormControlLabel, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Alert,
  Snackbar,
  Divider,
  Avatar,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Chip
} from '@mui/material'
import { 
  Business as BusinessIcon, 
  LocationOn as LocationIcon, 
  Phone as PhoneIcon, 
  Email as EmailIcon, 
  Language as LanguageIcon,
  Palette as ThemeIcon,
  AttachMoney as CurrencyIcon,
  Schedule as TimeIcon,
  PhotoCamera as CameraIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '../contexts/BusinessContext'
import { useThemeMode } from '../contexts/ThemeContext'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  )
}

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
  const [tabValue, setTabValue] = useState(0)
  const [settings, setSettings] = useState<BusinessSettingsData>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
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
      
      setSnackbar({
        open: true,
        message: t('settings_saved_successfully') || 'Settings saved successfully',
        severity: 'success'
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('failed_to_save_settings') || 'Failed to save settings',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetSettings = () => {
    setSettings(defaultSettings)
    setSnackbar({
      open: true,
      message: t('settings_reset') || 'Settings reset to defaults',
      severity: 'success'
    })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('business_settings') || 'Business Settings'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<RestoreIcon />}
            onClick={handleResetSettings}
          >
            {t('reset') || 'Reset'}
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={loading}
          >
            {t('save_settings') || 'Save Settings'}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t('general') || 'General'} icon={<BusinessIcon />} />
          <Tab label={t('preferences') || 'Preferences'} icon={<ThemeIcon />} />
          <Tab label={t('notifications') || 'Notifications'} icon={<NotificationsIcon />} />
          <Tab label={t('security') || 'Security'} icon={<SecurityIcon />} />
        </Tabs>

        {/* General Settings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Business Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  {t('business_information') || 'Business Information'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('business_name') || 'Business Name'}
                  value={settings.name}
                  onChange={(e) => handleSettingChange('name', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('tax_id') || 'Tax ID'}
                  value={settings.taxId}
                  onChange={(e) => handleSettingChange('taxId', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('business_description') || 'Business Description'}
                  value={settings.description}
                  onChange={(e) => handleSettingChange('description', e.target.value)}
                />
              </Grid>

              {/* Contact Information */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon />
                  {t('contact_information') || 'Contact Information'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label={t('address') || 'Address'}
                  value={settings.address}
                  onChange={(e) => handleSettingChange('address', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={t('city') || 'City'}
                  value={settings.city}
                  onChange={(e) => handleSettingChange('city', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={t('country') || 'Country'}
                  value={settings.country}
                  onChange={(e) => handleSettingChange('country', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={t('phone') || 'Phone'}
                  value={settings.phone}
                  onChange={(e) => handleSettingChange('phone', e.target.value)}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={t('email') || 'Email'}
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleSettingChange('email', e.target.value)}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('website') || 'Website'}
                  value={settings.website}
                  onChange={(e) => handleSettingChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </Grid>

              {/* Working Hours */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimeIcon />
                  {t('working_hours') || 'Working Hours'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="time"
                  label={t('start_time') || 'Start Time'}
                  value={settings.workingHours.start}
                  onChange={(e) => handleNestedSettingChange('workingHours', 'start', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="time"
                  label={t('end_time') || 'End Time'}
                  value={settings.workingHours.end}
                  onChange={(e) => handleNestedSettingChange('workingHours', 'end', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t('working_days') || 'Working Days'}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {weekDays.map(day => (
                    <Chip
                      key={day}
                      label={t(day) || day}
                      variant={settings.workingHours.days.includes(day) ? 'filled' : 'outlined'}
                      color={settings.workingHours.days.includes(day) ? 'primary' : 'default'}
                      onClick={() => handleWorkingDaysChange(day, !settings.workingHours.days.includes(day))}
                      clickable
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Preferences Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ThemeIcon />
                  {t('appearance_preferences') || 'Appearance & Preferences'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>{t('language') || 'Language'}</InputLabel>
                  <Select
                    value={settings.language}
                    label={t('language') || 'Language'}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    startAdornment={<LanguageIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    {languages.map(lang => (
                      <MenuItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>{t('currency') || 'Currency'}</InputLabel>
                  <Select
                    value={settings.currency}
                    label={t('currency') || 'Currency'}
                    onChange={(e) => handleSettingChange('currency', e.target.value)}
                    startAdornment={<CurrencyIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    {currencies.map(curr => (
                      <MenuItem key={curr.code} value={curr.code}>
                        {curr.symbol} {curr.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>{t('timezone') || 'Timezone'}</InputLabel>
                  <Select
                    value={settings.timezone}
                    label={t('timezone') || 'Timezone'}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  >
                    {timezones.map(tz => (
                      <MenuItem key={tz} value={tz}>
                        {tz}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isDarkMode}
                      onChange={toggleTheme}
                      color="primary"
                    />
                  }
                  label={t('dark_mode') || 'Dark Mode'}
                />
              </Grid>

              {/* Branding */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {t('branding') || 'Branding'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="color"
                  label={t('primary_color') || 'Primary Color'}
                  value={settings.branding.primaryColor}
                  onChange={(e) => handleNestedSettingChange('branding', 'primaryColor', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="color"
                  label={t('secondary_color') || 'Secondary Color'}
                  value={settings.branding.secondaryColor}
                  onChange={(e) => handleNestedSettingChange('branding', 'secondaryColor', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon />
              {t('notification_preferences') || 'Notification Preferences'}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.lowStock}
                      onChange={(e) => handleNestedSettingChange('notifications', 'lowStock', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={t('low_stock_alerts') || 'Low Stock Alerts'}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  {t('low_stock_alerts_desc') || 'Get notified when inventory items are running low'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.newOrders}
                      onChange={(e) => handleNestedSettingChange('notifications', 'newOrders', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={t('new_order_notifications') || 'New Order Notifications'}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  {t('new_order_notifications_desc') || 'Get notified when new orders are received'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.dailyReports}
                      onChange={(e) => handleNestedSettingChange('notifications', 'dailyReports', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={t('daily_reports') || 'Daily Reports'}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  {t('daily_reports_desc') || 'Receive daily sales and performance reports'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.financialAlerts}
                      onChange={(e) => handleNestedSettingChange('notifications', 'financialAlerts', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={t('financial_alerts') || 'Financial Alerts'}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  {t('financial_alerts_desc') || 'Get notified about important financial events and milestones'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon />
              {t('security_settings') || 'Security Settings'}
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              {t('security_settings_info') || 'Security settings help protect your business data and ensure compliance with data protection regulations.'}
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {t('data_backup') || 'Data Backup'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {t('data_backup_desc') || 'Automatically backup your business data to ensure it\'s never lost.'}
                    </Typography>
                    <Button variant="outlined">
                      {t('configure_backup') || 'Configure Backup'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {t('access_logs') || 'Access Logs'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {t('access_logs_desc') || 'Monitor who has accessed your business data and when.'}
                    </Typography>
                    <Button variant="outlined">
                      {t('view_logs') || 'View Logs'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {t('export_data') || 'Export Data'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {t('export_data_desc') || 'Export your business data for backup or migration purposes.'}
                    </Typography>
                    <Button variant="outlined">
                      {t('export_now') || 'Export Now'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  )
}