import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useBusiness } from '../contexts/BusinessContext';

const InviteAccept: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetchBusinesses } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [businessName, setBusinessName] = useState<string>('');

  useEffect(() => {
    if (token) {
      checkInvitation();
    }
  }, [token, user]);

  const checkInvitation = async () => {
    try {
      // Get invitation details
      const { data: inviteData, error: inviteError } = await supabase
        .from('business_invitations')
        .select(`
          *,
          business:businesses(name)
        `)
        .eq('token', token)
        .single();

      if (inviteError || !inviteData) {
        setError('Invalid or expired invitation');
        setLoading(false);
        return;
      }

      // Check if invitation is expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setError('This invitation has expired');
        setLoading(false);
        return;
      }

      // Check if already accepted
      if (inviteData.accepted_at) {
        setError('This invitation has already been used');
        setLoading(false);
        return;
      }

      setInvitation(inviteData);
      setBusinessName(inviteData.business?.name || 'Unknown Business');

      // If user is logged in and email matches, auto-accept
      if (user && user.email === inviteData.email) {
        await acceptInvitation();
      } else if (user && user.email !== inviteData.email) {
        setError(`This invitation is for ${inviteData.email}. Please sign in with that email address.`);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error checking invitation:', err);
      setError('Failed to validate invitation');
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!user || !invitation) return;

    setLoading(true);
    try {
      // Call the accept invitation function
      const { data, error } = await supabase.rpc('accept_business_invitation', {
        invitation_token: token
      });

      if (error) throw error;

      // Refresh businesses
      await refetchBusinesses();

      // Navigate to dashboard
      navigate('/');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to accept invitation. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Paper sx={{ p: 4, maxWidth: 400 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => navigate('/auth')}
          >
            Go to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Business Invitation
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You've been invited to join <strong>{businessName}</strong> as a <strong>{invitation?.role}</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please sign in or create an account with email: <strong>{invitation?.email}</strong>
          </Typography>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => navigate('/auth', { state: { email: invitation?.email } })}
          >
            Sign In / Sign Up
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
        <Box sx={{ 
          width: 80, 
          height: 80, 
          borderRadius: '50%', 
          backgroundColor: 'success.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3
        }}>
          <CheckIcon sx={{ fontSize: 40, color: 'success.main' }} />
        </Box>
        <Typography variant="h5" gutterBottom>
          Invitation Accepted!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You've successfully joined <strong>{businessName}</strong> as a <strong>{invitation?.role}</strong>.
        </Typography>
        <Button 
          fullWidth 
          variant="contained" 
          onClick={() => navigate('/')}
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default InviteAccept;