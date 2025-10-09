import React, { useState } from 'react'
import { Spin } from 'antd'
import { LoginForm } from '../components/Auth/LoginForm'
import { SignupForm } from '../components/Auth/SignupForm'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
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
    </div>
  )
}
