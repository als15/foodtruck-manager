import React, { useState } from 'react'
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Select, FormControl, InputLabel, CircularProgress } from '@mui/material'
import { Store, Add as Plus, Business as Building2, Check, ExpandMore as ChevronDown, Settings, Logout as LogOut, People as Users } from '@mui/icons-material'
import { useBusiness } from '../../contexts/BusinessContext'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

interface CreateBusinessModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { createBusiness } = useBusiness()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxId: '',
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    try {
      await createBusiness(formData)
      onCreated()
      onClose()
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        taxId: '',
        currency: 'USD',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    } catch (error) {
      console.error('Error creating business:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('create_new_business')}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label={t('business_name_required')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} fullWidth required autoFocus />

            <TextField label={t('email')} type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} fullWidth />

            <TextField label={t('phone')} type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} fullWidth />

            <TextField label={t('address')} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} fullWidth multiline rows={2} />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>{t('currency')}</InputLabel>
                <Select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} label={t('currency')}>
                  <MenuItem value="USD">USD ($)</MenuItem>
                  <MenuItem value="EUR">EUR (€)</MenuItem>
                  <MenuItem value="GBP">GBP (£)</MenuItem>
                  <MenuItem value="CAD">CAD ($)</MenuItem>
                  <MenuItem value="AUD">AUD ($)</MenuItem>
                  <MenuItem value="ILS">ILS (₪)</MenuItem>
                </Select>
              </FormControl>

              <TextField label={t('tax_id')} value={formData.taxId} onChange={e => setFormData({ ...formData, taxId: e.target.value })} fullWidth />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={loading || !formData.name.trim()}>
            {loading ? <CircularProgress size={24} /> : t('create_business_button')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export const BusinessSelector: React.FC = () => {
  const { currentBusiness, userBusinesses, switchBusiness, userRole } = useBusiness()
  const { signOut } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState<null | HTMLElement>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { t } = useTranslation()

  const handleBusinessSwitch = async (businessId: string) => {
    await switchBusiness(businessId)
    setIsDropdownOpen(null)
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: t('owner'),
      admin: t('admin'),
      member: t('member'),
      viewer: t('viewer')
    }
    return labels[role] || role
  }

  if (!currentBusiness) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Store sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
            {t('no_business_selected')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('no_business_selected_subtitle')}
          </Typography>
          <Button variant="contained" onClick={() => setIsCreateModalOpen(true)} startIcon={<Plus />}>
            {t('create_business')}
          </Button>
        </Box>
        <CreateBusinessModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreated={() => setIsCreateModalOpen(false)} />
      </Box>
    )
  }

  return (
    <>
      <Box>
        <Button
          onClick={e => setIsDropdownOpen(e.currentTarget)}
          sx={{
            textTransform: 'none',
            color: 'text.primary',
            '&:hover': { bgcolor: 'action.hover' }
          }}
          endIcon={<ChevronDown />}
        >
          <Building2 sx={{ mr: 1 }} />
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {currentBusiness.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getRoleLabel(userRole || '')}
            </Typography>
          </Box>
        </Button>

        <Menu anchorEl={isDropdownOpen} open={Boolean(isDropdownOpen)} onClose={() => setIsDropdownOpen(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
          {userBusinesses.map(ub => (
            <MenuItem key={ub.id} onClick={() => handleBusinessSwitch(ub.businessId)} selected={ub.businessId === currentBusiness.id}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2">{(ub as any).business?.name || 'Unknown Business'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {getRoleLabel(ub.role)}
                </Typography>
              </Box>
              {ub.businessId === currentBusiness.id && (
                <ListItemIcon sx={{ minWidth: 'auto', ml: 2 }}>
                  <Check fontSize="small" />
                </ListItemIcon>
              )}
            </MenuItem>
          ))}

          <Divider sx={{ my: 1 }} />

          <MenuItem
            onClick={() => {
              setIsCreateModalOpen(true)
              setIsDropdownOpen(null)
            }}
          >
            <ListItemIcon>
              <Plus fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('create_new_business')}</ListItemText>
          </MenuItem>

          {userRole && ['owner', 'admin'].includes(userRole) && [
            <MenuItem
              key="team"
              onClick={() => {
                window.location.href = '/team'
                setIsDropdownOpen(null)
              }}
            >
              <ListItemIcon>
                <Users fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('manage_team')}</ListItemText>
            </MenuItem>,

            <MenuItem
              key="settings"
              onClick={() => {
                window.location.href = '/settings/business'
                setIsDropdownOpen(null)
              }}
            >
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('business_settings')}</ListItemText>
            </MenuItem>
          ]}

          <Divider sx={{ my: 1 }} />

          <MenuItem
            onClick={() => {
              signOut()
              setIsDropdownOpen(null)
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon sx={{ color: 'error.main' }}>
              <LogOut fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('sign_out')}</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      <CreateBusinessModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreated={() => setIsCreateModalOpen(false)} />
    </>
  )
}
