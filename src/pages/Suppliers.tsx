import React, { useState, useEffect } from 'react'
import { Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Switch, FormControlLabel, Grid, CircularProgress, Alert, Snackbar, Autocomplete, FormControl, InputLabel, Select, MenuItem as MuiMenuItem, OutlinedInput, SelectChangeEvent, useTheme } from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Business as BusinessIcon, Phone as PhoneIcon, Email as EmailIcon, LocalShipping as DeliveryIcon, AutoMode as AutoOrderIcon } from '@mui/icons-material'
import { Supplier } from '../types'
import { suppliersService, subscriptions } from '../services/supabaseService'
import { useTranslation } from 'react-i18next'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const PAYMENT_TERMS = ['Net 30', 'Net 15', 'COD', 'Prepaid', 'Net 60', 'Due on Receipt']

export default function Suppliers() {
  const theme = useTheme()
  const docDir = typeof document !== 'undefined' ? document.documentElement.dir : undefined
  const isRtl = docDir === 'rtl' || theme.direction === 'rtl'
  const { t } = useTranslation()
  const [openDialog, setOpenDialog] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

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
      loadSuppliers()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await suppliersService.getAll()
      setSuppliers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suppliers')
      setSnackbar({ open: true, message: 'Failed to load suppliers', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSupplier = async () => {
    try {
      if (editingSupplier) {
        await suppliersService.update(editingSupplier.id, newSupplier)
        setSnackbar({ open: true, message: 'Supplier updated successfully', severity: 'success' })
      } else {
        await suppliersService.create(newSupplier as Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>)
        setSnackbar({ open: true, message: 'Supplier created successfully', severity: 'success' })
      }

      await loadSuppliers()

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
        notes: '',
        isActive: true
      })
      setEditingSupplier(null)
      setOpenDialog(false)
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save supplier', severity: 'error' })
    }
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setNewSupplier(supplier)
    setEditingSupplier(supplier)
    setOpenDialog(true)
  }

  const handleDeleteSupplier = async (id: string) => {
    try {
      await suppliersService.delete(id)
      setSnackbar({ open: true, message: 'Supplier deleted successfully', severity: 'success' })
      await loadSuppliers()
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete supplier', severity: 'error' })
    }
  }

  const toggleActiveStatus = async (id: string) => {
    try {
      const supplier = suppliers.find(sup => sup.id === id)
      if (supplier) {
        await suppliersService.update(id, { isActive: !supplier.isActive })
        setSnackbar({ open: true, message: 'Supplier status updated successfully', severity: 'success' })
        await loadSuppliers()
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update supplier status', severity: 'error' })
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
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
                        {supplier.deliveryDays.map(day => (
                          <Chip key={day} label={day.slice(0, 3)} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {supplier.orderSubmissionDays?.map(day => (
                          <Chip key={day} label={day.slice(0, 3)} size="small" variant="filled" color="primary" />
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Supplier Name" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Contact Person" value={newSupplier.contactPerson} onChange={e => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" multiline rows={2} value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Delivery Days</InputLabel>
                <Select
                  multiple
                  value={newSupplier.deliveryDays || []}
                  onChange={handleDeliveryDaysChange}
                  input={<OutlinedInput label="Delivery Days" />}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {WEEKDAYS.map(day => (
                    <MuiMenuItem key={day} value={day}>
                      {day}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Order Submission Days</InputLabel>
                <Select
                  multiple
                  value={newSupplier.orderSubmissionDays || []}
                  onChange={handleOrderSubmissionDaysChange}
                  input={<OutlinedInput label="Order Submission Days" />}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {WEEKDAYS.map(day => (
                    <MuiMenuItem key={day} value={day}>
                      {day}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Lead Time (days)" type="number" value={newSupplier.leadTime} onChange={e => setNewSupplier({ ...newSupplier, leadTime: parseInt(e.target.value) || 1 })} inputProps={{ min: 1 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Minimum Order Amount" type="number" inputProps={{ step: '0.01' }} value={newSupplier.minimumOrderAmount} onChange={e => setNewSupplier({ ...newSupplier, minimumOrderAmount: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete freeSolo options={PAYMENT_TERMS} value={newSupplier.paymentTerms} onChange={(_, value) => setNewSupplier({ ...newSupplier, paymentTerms: value || 'Net 30' })} onInputChange={(_, value) => setNewSupplier({ ...newSupplier, paymentTerms: value || 'Net 30' })} renderInput={params => <TextField {...params} fullWidth label="Payment Terms" />} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={3} value={newSupplier.notes} onChange={e => setNewSupplier({ ...newSupplier, notes: e.target.value })} placeholder="Additional notes about this supplier..." />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel control={<Switch checked={newSupplier.autoOrderEnabled} onChange={e => setNewSupplier({ ...newSupplier, autoOrderEnabled: e.target.checked })} />} label="Enable Auto-Order for Low Stock" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel control={<Switch checked={newSupplier.isActive} onChange={e => setNewSupplier({ ...newSupplier, isActive: e.target.checked })} />} label="Active Supplier" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveSupplier} variant="contained">
            {editingSupplier ? 'Update' : 'Add'} Supplier
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
