import React, { useState, useEffect } from 'react'
import { Spin } from 'antd'
import { LoginForm } from '../components/Auth/LoginForm'
import { SignupForm } from '../components/Auth/SignupForm'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const invitationEmail = location.state?.invitationEmail

  useEffect(() => {
    // Check for pending invitation and auto-accept after login
    const checkPendingInvitation = async () => {
      if (user) {
        const pendingToken = localStorage.getItem('pendingInvitation')
        if (pendingToken) {
          try {
            // Accept the invitation
            const { error } = await supabase.rpc('accept_business_invitation', {
              invitation_token: pendingToken
            })

            if (!error) {
              // Clear the pending invitation
              localStorage.removeItem('pendingInvitation')
              // Redirect to dashboard
              navigate('/', { replace: true })
            } else {
              console.error('Failed to accept invitation:', error)
              localStorage.removeItem('pendingInvitation')
            }
          } catch (err) {
            console.error('Error accepting invitation:', err)
            localStorage.removeItem('pendingInvitation')
          }
        }
      }
    }

    checkPendingInvitation()
  }, [user, navigate])

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
    <>
      {isLogin ? (
        <LoginForm
          onSwitchToSignup={() => setIsLogin(false)}
          onSuccess={() => window.location.href = '/'}
          initialEmail={invitationEmail}
        />
      ) : (
        <SignupForm
          onSwitchToLogin={() => setIsLogin(true)}
          onSuccess={() => setIsLogin(true)}
          initialEmail={invitationEmail}
        />
      )}
    </>
  )
}
