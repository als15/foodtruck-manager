import React, { useState } from 'react'
import { Container } from '@mui/material'
import { LoginForm } from '../components/Auth/LoginForm'
import { SignupForm } from '../components/Auth/SignupForm'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <Container>
      {isLogin ? (
        <LoginForm
          onSwitchToSignup={() => setIsLogin(false)}
          onSuccess={() => window.location.href = '/'}
        />
      ) : (
        <SignupForm
          onSwitchToLogin={() => setIsLogin(true)}
          onSuccess={() => setIsLogin(true)}
        />
      )}
    </Container>
  )
}