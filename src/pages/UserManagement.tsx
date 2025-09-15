import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Paper,
  Box,
  Avatar,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  CircularProgress
} from '@mui/material'
import { Person, Email, VpnKey, Edit } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

export const UserManagement: React.FC = () => {
  const { user, signOut, resetPassword } = useAuth()
  const { t } = useTranslation()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sign out' })
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    
    setLoading(true)
    try {
      const { error } = await resetPassword(user.email)
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: t('password_reset_email_sent') })
        setPasswordResetDialogOpen(false)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send password reset email' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (!user) {
    return (
      <Container>
        <Typography variant="h4">{t('user_management')}</Typography>
        <Alert severity="error">
          {t('no_user_data')}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('user_management')}
      </Typography>

      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  <Person />
                </Avatar>
                <Typography variant="h6">
                  {t('profile_information')}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  {t('email')}
                </Typography>
                <Typography variant="body1">
                  {user.email}
                </Typography>
              </Box>

              {user.user_metadata?.first_name && (
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    {t('first_name')}
                  </Typography>
                  <Typography variant="body1">
                    {user.user_metadata.first_name}
                  </Typography>
                </Box>
              )}

              {user.user_metadata?.last_name && (
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    {t('last_name')}
                  </Typography>
                  <Typography variant="body1">
                    {user.user_metadata.last_name}
                  </Typography>
                </Box>
              )}

              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  {t('account_created')}
                </Typography>
                <Typography variant="body1">
                  {formatDate(user.created_at)}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  {t('last_sign_in')}
                </Typography>
                <Typography variant="body1">
                  {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : t('never')}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  {t('email_verified')}
                </Typography>
                <Chip 
                  label={user.email_confirmed_at ? t('verified') : t('not_verified')}
                  color={user.email_confirmed_at ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('account_actions')}
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<VpnKey />}
                  onClick={() => setPasswordResetDialogOpen(true)}
                  fullWidth
                >
                  {t('reset_password')}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleSignOut}
                  fullWidth
                >
                  {t('sign_out')}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('user_id')}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {user.id}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Password Reset Dialog */}
      <Dialog open={passwordResetDialogOpen} onClose={() => setPasswordResetDialogOpen(false)}>
        <DialogTitle>{t('reset_password')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('password_reset_confirmation')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordResetDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handlePasswordReset} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : t('send_reset_email')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}