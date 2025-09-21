import React, { useState, useEffect } from 'react'
import { Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Switch, FormControlLabel, Grid, CircularProgress, Alert, Snackbar, Autocomplete, FormControl, InputLabel, Select, MenuItem as MuiMenuItem, OutlinedInput, SelectChangeEvent, useTheme } from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Business as BusinessIcon, Phone as PhoneIcon, Email as EmailIcon, LocalShipping as DeliveryIcon, AutoMode as AutoOrderIcon, DriveEta as PickupIcon } from '@mui/icons-material'
import { Supplier } from '../types'
import { suppliersService, subscriptions } from '../services/supabaseService'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../utils/currency'
import { WEEKDAYS_ORDERED, sortDaysChronologically } from '../utils/weekdayUtils'

const PAYMENT_TERMS = ['Net 30', 'Net 15', 'COD', 'Prepaid', 'Net 60', 'Due on Receipt']
const DELIVERY_METHODS = ['pickup', 'delivery'] as const

export default function Suppliers() {
  const theme = useTheme()
  const docDir = typeof document !== 'undefined' ? document.documentElement.dir : undefined
  const isRtl = docDir === 'rtl' || theme.direction === 'rtl'
  const { t, i18n } = useTranslation()
  const [openDialog, setOpenDialog] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  // Persist modal state and form data across tab switches
  const [isModalPersisted, setIsModalPersisted] = useState(false)
  const [lastSaved, setLastSaved] = useState<number | null>(null)

  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    deliveryDays: [],
    orderSubmissionDays: [],
    minimumOrderAmount: 0,
    leadTime: 1,
    autoOrderEnabled: false,
    paymentTerms: 'Net 30',
    deliveryMethods: [],
    notes: '',
    isActive: true
  })

  // Load suppliers on component mount
  useEffect(() => {
    loadSuppliers()
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    const subscription = subscriptions.suppliers(payload => {
      console.log('Suppliers changed:', payload)
      // Only reload if modal is not open to prevent disruption
      if (!openDialog) {
        loadSuppliers()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [openDialog])

  // Persist form data to prevent loss when switching tabs
  useEffect(() => {
    if (openDialog) {
      // Save form data to sessionStorage whenever form changes
      const timestamp = Date.now()
      const formData = {
        newSupplier,
        editingSupplier,
        timestamp
      }
      sessionStorage.setItem('supplierFormData', JSON.stringify(formData))
      setLastSaved(timestamp)
      if (!isModalPersisted) {
        setIsModalPersisted(true)
      }
    }
  }, [openDialog, newSupplier, editingSupplier, isModalPersisted])

  // Restore form data when component mounts
  useEffect(() => {
    const savedFormData = sessionStorage.getItem('supplierFormData')
    if (savedFormData) {
      try {
        const { newSupplier: savedSupplier, editingSupplier: savedEditing, timestamp } = JSON.parse(savedFormData)
        // Only restore if less than 1 hour old
        if (Date.now() - timestamp < 3600000) {
          setNewSupplier(savedSupplier)
          setEditingSupplier(savedEditing)
          setOpenDialog(true)
          setIsModalPersisted(true)
        } else {
          sessionStorage.removeItem('supplierFormData')
        }
      } catch (error) {
        console.error('Error restoring form data:', error)
        sessionStorage.removeItem('supplierFormData')
      }
    }
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await suppliersService.getAll()
      setSuppliers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed_to_load_suppliers'))
      setSnackbar({ open: true, message: t('failed_to_load_suppliers'), severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSupplier = async () => {
    try {
      if (editingSupplier) {
        await suppliersService.update(editingSupplier.id, newSupplier)
        setSnackbar({ open: true, message: t('supplier_updated_successfully'), severity: 'success' })
      } else {
        await suppliersService.create(newSupplier as Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>)
        setSnackbar({ open: true, message: t('supplier_created_successfully'), severity: 'success' })
      }

      await loadSuppliers()
      closeModalAndClearData()
    } catch (err) {
      setSnackbar({ open: true, message: t('failed_to_save_supplier'), severity: 'error' })
    }
  }

  const closeModalAndClearData = () => {
    // Clear persisted form data
    sessionStorage.removeItem('supplierFormData')

    // Reset form state
    setNewSupplier({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      deliveryDays: [],
      orderSubmissionDays: [],
      minimumOrderAmount: 0,
      leadTime: 1,
      autoOrderEnabled: false,
      paymentTerms: 'Net 30',
      deliveryMethods: [],
      notes: '',
      isActive: true
    })
    setEditingSupplier(null)
    setOpenDialog(false)
    setIsModalPersisted(false)
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setNewSupplier(supplier)
    setEditingSupplier(supplier)
    setOpenDialog(true)
  }

  const handleDeleteSupplier = async (id: string) => {
    try {
      await suppliersService.delete(id)
      setSnackbar({ open: true, message: t('supplier_deleted_successfully'), severity: 'success' })
      await loadSuppliers()
    } catch (err) {
      setSnackbar({ open: true, message: t('failed_to_delete_supplier'), severity: 'error' })
    }
  }

  const toggleActiveStatus = async (id: string) => {
    try {
      const supplier = suppliers.find(sup => sup.id === id)
      if (supplier) {
        await suppliersService.update(id, { isActive: !supplier.isActive })
        setSnackbar({ open: true, message: t('supplier_status_updated_successfully'), severity: 'success' })
        await loadSuppliers()
      }
    } catch (err) {
      setSnackbar({ open: true, message: t('failed_to_update_supplier_status'), severity: 'error' })
    }
  }

  const handleDeliveryDaysChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    setNewSupplier({
      ...newSupplier,
      deliveryDays: typeof value === 'string' ? value.split(',') : value
    })
  }

  const handleOrderSubmissionDaysChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    setNewSupplier({
      ...newSupplier,
      orderSubmissionDays: typeof value === 'string' ? value.split(',') : value
    })
  }

  const handleDeliveryMethodsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    setNewSupplier({
      ...newSupplier,
      deliveryMethods: (typeof value === 'string' ? value.split(',') : value) as ('pickup' | 'delivery')[]
    })
  }

  const activeSuppliers = suppliers.filter(sup => sup.isActive)
  const autoOrderSuppliers = suppliers.filter(sup => sup.autoOrderEnabled && sup.isActive)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadSuppliers}>
          Retry
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <Typography variant="h4" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
          {t('supplier_management')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            // Clear any existing form data when starting fresh
            sessionStorage.removeItem('supplierFormData')
            setIsModalPersisted(false)
            setOpenDialog(true)
          }}
        >
          {t('add_supplier')}
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }} direction={isRtl ? 'row-reverse' : 'row'} justifyContent={isRtl ? 'flex-end' : 'flex-start'} alignItems="stretch">
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: isRtl ? 'right' : 'left', display: 'flex', flexDirection: 'column', alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Typography variant="h6" color="primary">
                {t('total_suppliers')}
              </Typography>
              <Typography variant="h4">{suppliers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: isRtl ? 'right' : 'left', display: 'flex', flexDirection: 'column', alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Typography variant="h6" color="success.main">
                {t('active_suppliers')}
              </Typography>
              <Typography variant="h4">{activeSuppliers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: isRtl ? 'right' : 'left', display: 'flex', flexDirection: 'column', alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Typography variant="h6" color="info.main">
                {t('auto_order_enabled')}
              </Typography>
              <Typography variant="h4">{autoOrderSuppliers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: isRtl ? 'right' : 'left', display: 'flex', flexDirection: 'column', alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Typography variant="h6" color="warning.main">
                {t('avg_lead_time')}
              </Typography>
              <Typography variant="h4">
                {suppliers.length > 0 ? Math.round(suppliers.reduce((sum, sup) => sum + sup.leadTime, 0) / suppliers.length) : 0} {t('days_word')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Suppliers Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row', textAlign: isRtl ? 'right' : 'left' }}>
            <BusinessIcon sx={{ marginInlineEnd: 1 }} />
            {t('suppliers_directory')}
          </Typography>

          <TableContainer component={Paper} dir={isRtl ? 'rtl' : 'ltr'}>
            <Table dir={isRtl ? 'rtl' : 'ltr'}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('supplier')}</TableCell>
                  <TableCell>{t('contact')}</TableCell>
                  <TableCell>{t('delivery_days')}</TableCell>
                  <TableCell>{t('order_days')}</TableCell>
                  <TableCell>{t('delivery_methods')}</TableCell>
                  <TableCell>{t('lead_time')}</TableCell>
                  <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('min_order')}</TableCell>
                  <TableCell>{t('auto_order')}</TableCell>
                  <TableCell>{t('status_text')}</TableCell>
                  <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.map(supplier => (
                  <TableRow key={supplier.id} sx={{ opacity: supplier.isActive ? 1 : 0.6 }}>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {supplier.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {supplier.contactPerson}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                          <PhoneIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption">{supplier.phone}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                          <EmailIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption">{supplier.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {sortDaysChronologically(supplier.deliveryDays).map(day => (
                          <Chip key={day} label={day.slice(0, 3)} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {sortDaysChronologically(supplier.orderSubmissionDays || []).map(day => (
                          <Chip key={day} label={day.slice(0, 3)} size="small" variant="filled" color="primary" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {supplier.deliveryMethods?.map(method => (
                          <Chip key={method} icon={method === 'pickup' ? <PickupIcon /> : <DeliveryIcon />} label={t(method === 'delivery' ? 'delivery_method' : method)} size="small" variant="outlined" color={method === 'pickup' ? 'secondary' : 'primary'} />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <DeliveryIcon sx={{ fontSize: 14 }} />
                        <Typography variant="body2">
                          {supplier.leadTime} {t('days_word')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>
                      <Typography variant="body2">${supplier.minimumOrderAmount.toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell>{supplier.autoOrderEnabled && <Chip icon={<AutoOrderIcon />} label={t('enabled')} size="small" color="success" variant="outlined" />}</TableCell>
                    <TableCell>
                      <FormControlLabel control={<Switch checked={supplier.isActive} onChange={() => toggleActiveStatus(supplier.id)} size="small" />} label={supplier.isActive ? t('active') : t('inactive')} />
                    </TableCell>
                    <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>
                      <IconButton size="small" onClick={() => handleEditSupplier(supplier)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteSupplier(supplier.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Supplier Dialog */}
      <Dialog
        open={openDialog}
        onClose={(event, reason) => {
          // Prevent closing on backdrop click or escape key to avoid accidental closure
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            closeModalAndClearData()
          }
        }}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle sx={{ textAlign: isRtl ? 'right' : 'left' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <Typography variant="h6">{editingSupplier ? t('edit_supplier') : t('add_new_supplier')}</Typography>
            {lastSaved && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                ✓ {t('auto_saved')}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('supplier_name')} value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('contact_person')} value={newSupplier.contactPerson} onChange={e => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('email')} type="email" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('phone')} value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={t('address')} multiline rows={2} value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('delivery_days_label')}</InputLabel>
                <Select
                  multiple
                  value={newSupplier.deliveryDays || []}
                  onChange={handleDeliveryDaysChange}
                  input={<OutlinedInput label={t('delivery_days_label')} />}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {sortDaysChronologically(selected).map(value => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {WEEKDAYS_ORDERED.map(day => (
                    <MuiMenuItem key={day} value={day}>
                      {t(day.toLowerCase() as any)}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('order_submission_days')}</InputLabel>
                <Select
                  multiple
                  value={newSupplier.orderSubmissionDays || []}
                  onChange={handleOrderSubmissionDaysChange}
                  input={<OutlinedInput label={t('order_submission_days')} />}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {sortDaysChronologically(selected).map(value => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {WEEKDAYS_ORDERED.map(day => (
                    <MuiMenuItem key={day} value={day}>
                      {t(day.toLowerCase() as any)}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('lead_time_days')} type="number" value={newSupplier.leadTime} onChange={e => setNewSupplier({ ...newSupplier, leadTime: parseInt(e.target.value) || 1 })} inputProps={{ min: 1 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('minimum_order_amount')} type="number" inputProps={{ step: '0.01' }} value={newSupplier.minimumOrderAmount} onChange={e => setNewSupplier({ ...newSupplier, minimumOrderAmount: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('delivery_methods')}</InputLabel>
                <Select
                  multiple
                  value={newSupplier.deliveryMethods || []}
                  onChange={handleDeliveryMethodsChange}
                  input={<OutlinedInput label={t('delivery_methods')} />}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(method => (
                        <Chip key={method} icon={method === 'pickup' ? <PickupIcon /> : <DeliveryIcon />} label={t(method === 'delivery' ? 'delivery_method' : method)} size="small" color={method === 'pickup' ? 'secondary' : 'primary'} />
                      ))}
                    </Box>
                  )}
                >
                  {DELIVERY_METHODS.map(method => (
                    <MuiMenuItem key={method} value={method}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {method === 'pickup' ? <PickupIcon /> : <DeliveryIcon />}
                        {t(method === 'delivery' ? 'delivery_method' : method)}
                      </Box>
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete freeSolo options={PAYMENT_TERMS} value={newSupplier.paymentTerms} onChange={(_, value) => setNewSupplier({ ...newSupplier, paymentTerms: value || 'Net 30' })} onInputChange={(_, value) => setNewSupplier({ ...newSupplier, paymentTerms: value || 'Net 30' })} renderInput={params => <TextField {...params} fullWidth label={t('payment_terms')} />} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={t('notes')} multiline rows={3} value={newSupplier.notes} onChange={e => setNewSupplier({ ...newSupplier, notes: e.target.value })} placeholder={t('notes_placeholder')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel control={<Switch checked={newSupplier.autoOrderEnabled} onChange={e => setNewSupplier({ ...newSupplier, autoOrderEnabled: e.target.checked })} />} label={t('enable_auto_order_for_low_stock')} sx={{ ml: isRtl ? 0 : 1, mr: isRtl ? 1 : 0 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel control={<Switch checked={newSupplier.isActive} onChange={e => setNewSupplier({ ...newSupplier, isActive: e.target.checked })} />} label={t('active_supplier')} sx={{ ml: isRtl ? 0 : 1, mr: isRtl ? 1 : 0 }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModalAndClearData}>{t('cancel')}</Button>
          <Button onClick={handleSaveSupplier} variant="contained">
            {editingSupplier ? t('update_supplier_button') : t('add_supplier_button')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
