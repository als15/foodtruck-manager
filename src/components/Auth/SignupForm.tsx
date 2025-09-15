import React, { useState } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
  IconButton,
  InputAdornment
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

interface SignupFormProps {
  onSwitchToLogin: () => void
  onSuccess?: () => void
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const { t } = useTranslation()

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwords_dont_match'))
      return false
    }
    if (formData.password.length < 6) {
      setError(t('password_too_short'))
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      const { error } = await signUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName
      })
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Paper sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
        <Alert severity="success">
          {t('signup_success_message')}
        </Alert>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        {t('signup')}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            label={t('first_name')}
            value={formData.firstName}
            onChange={handleChange('firstName')}
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            label={t('last_name')}
            value={formData.lastName}
            onChange={handleChange('lastName')}
            required
            disabled={loading}
          />
        </Box>

        <TextField
          fullWidth
          label={t('email')}
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          required
          sx={{ mb: 2 }}
          disabled={loading}
        />
        
        <TextField
          fullWidth
          label={t('password')}
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange('password')}
          required
          sx={{ mb: 2 }}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  disabled={loading}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <TextField
          fullWidth
          label={t('confirm_password')}
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={handleChange('confirmPassword')}
          required
          sx={{ mb: 3 }}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                  disabled={loading}
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : t('signup')}
        </Button>

        <Box textAlign="center">
          <Link
            component="button"
            type="button"
            onClick={onSwitchToLogin}
            disabled={loading}
          >
            {t('already_have_account')}
          </Link>
        </Box>
      </Box>
    </Paper>
  )
}