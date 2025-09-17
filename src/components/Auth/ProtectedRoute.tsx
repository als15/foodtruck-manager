import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useBusiness } from '../../contexts/BusinessContext'
import { CircularProgress, Box } from '@mui/material'
import { BusinessSelector } from '../Business/BusinessSelector'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const { currentBusiness, loading: businessLoading, userBusinesses } = useBusiness()

  if (authLoading || businessLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // If user has no businesses, show the business selector
  if (!currentBusiness && userBusinesses.length === 0) {
    return <BusinessSelector />
  }

  return <>{children}</>
}