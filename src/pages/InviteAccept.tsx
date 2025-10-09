import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Button,
  Spin,
  Alert,
} from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useBusiness } from '../contexts/BusinessContext';

const { Title, Text } = Typography;

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Card style={{ padding: 24, maxWidth: 400 }}>
          <Alert
            message={error}
            type="error"
            style={{ marginBottom: 16 }}
          />
          <Button
            block
            type="primary"
            onClick={() => navigate('/auth')}
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Card style={{ padding: 24, maxWidth: 400, textAlign: 'center' }}>
          <Title level={3}>Business Invitation</Title>
          <div style={{ marginBottom: 24 }}>
            <Text>
              You've been invited to join <Text strong>{businessName}</Text> as a <Text strong>{invitation?.role}</Text>.
            </Text>
          </div>
          <div style={{ marginBottom: 24 }}>
            <Text type="secondary">
              Please sign in or create an account with email: <Text strong>{invitation?.email}</Text>
            </Text>
          </div>
          <Button
            block
            type="primary"
            onClick={() => navigate('/auth', { state: { email: invitation?.email } })}
          >
            Sign In / Sign Up
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card style={{ padding: 24, maxWidth: 400, textAlign: 'center' }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: '#f6ffed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <CheckCircleOutlined style={{ fontSize: 40, color: '#52c41a' }} />
        </div>
        <Title level={3}>Invitation Accepted!</Title>
        <div style={{ marginBottom: 24 }}>
          <Text>
            You've successfully joined <Text strong>{businessName}</Text> as a <Text strong>{invitation?.role}</Text>.
          </Text>
        </div>
        <Button
          block
          type="primary"
          onClick={() => navigate('/')}
        >
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
};

export default InviteAccept;
