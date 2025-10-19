import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, Input, Select, Table, Modal, Alert, Spin, message, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SendOutlined,
  CopyOutlined,
  MailOutlined
} from '@ant-design/icons';
import { useBusiness } from '../contexts/BusinessContext';
import { supabase } from '../lib/supabase';
import { UserBusiness, BusinessInvitation } from '../types';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
const { Option } = Select;

interface TeamMember extends UserBusiness {
  email?: string;
  name?: string;
}

const TeamManagement: React.FC = () => {
  const { currentBusiness, userRole } = useBusiness();
  const { t } = useTranslation();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<BusinessInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member' as 'owner' | 'admin' | 'member' | 'viewer'
  });

  // Check if user can manage team
  const canManageTeam = userRole && ['owner', 'admin'].includes(userRole);

  useEffect(() => {
    if (currentBusiness) {
      loadTeamData();
    }
  }, [currentBusiness]);

  const loadTeamData = async () => {
    if (!currentBusiness) return;

    setLoading(true);
    try {
      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from('user_businesses')
        .select('*')
        .eq('business_id', currentBusiness.id);

      if (membersError) throw membersError;

      setTeamMembers(membersData?.map(m => ({
        id: m.id,
        userId: m.user_id,
        businessId: m.business_id,
        role: m.role,
        joinedAt: new Date(m.joined_at),
        permissions: m.permissions,
        email: `User ${m.user_id.substring(0, 8)}...`,
        name: `User ${m.user_id.substring(0, 8)}...`
      })) || []);

      // Load pending invitations
      if (canManageTeam) {
        const { data: invitesData, error: invitesError } = await supabase
          .from('business_invitations')
          .select('*')
          .eq('business_id', currentBusiness.id)
          .gt('expires_at', new Date().toISOString())
          .is('accepted_at', null);

        if (invitesError) throw invitesError;

        setInvitations(invitesData?.map(i => ({
          id: i.id,
          businessId: i.business_id,
          email: i.email,
          role: i.role,
          invitedBy: i.invited_by,
          token: i.token,
          expiresAt: new Date(i.expires_at),
          createdAt: new Date(i.created_at)
        })) || []);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      message.error(t('failed_to_load_team_data'));
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!currentBusiness || !inviteForm.email) return;

    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: inviteData, error } = await supabase
        .from('business_invitations')
        .insert({
          business_id: currentBusiness.id,
          email: inviteForm.email,
          role: inviteForm.role,
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          token: token,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Invitation created:', inviteData);

      // Send invitation email via Edge Function
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: { invitationId: inviteData.id }
      });

      console.log('Edge Function response:', { data: emailData, error: emailError });

      if (emailError) {
        console.error('Failed to send email:', emailError);
        message.warning('Invitation created but email failed to send. Link copied to clipboard.');
      } else {
        message.success('Invitation email sent successfully!');
      }

      const inviteLink = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(inviteLink);

      Modal.success({
        title: t('invitation_created'),
        content: `Invitation email sent to ${inviteForm.email}. Link copied to clipboard as backup:\n\n${inviteLink}`
      });

      setInviteDialogOpen(false);
      setInviteForm({ email: '', role: 'member' });
      loadTeamData();
    } catch (error) {
      console.error('Error creating invitation:', error);
      message.error(t('failed_to_create_invitation'));
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedMember || !currentBusiness) return;

    try {
      const { error } = await supabase
        .from('user_businesses')
        .update({ role: selectedMember.role })
        .eq('id', selectedMember.id)
        .eq('business_id', currentBusiness.id);

      if (error) throw error;

      message.success(t('role_updated_successfully'));
      setEditDialogOpen(false);
      setSelectedMember(null);
      loadTeamData();
    } catch (error) {
      console.error('Error updating role:', error);
      message.error(t('failed_to_update_role'));
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentBusiness) return;

    Modal.confirm({
      title: t('remove_team_member'),
      content: 'Are you sure you want to remove this team member?',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('user_businesses')
            .delete()
            .eq('id', memberId)
            .eq('business_id', currentBusiness.id);

          if (error) throw error;

          message.success(t('team_member_removed_successfully'));
          loadTeamData();
        } catch (error) {
          console.error('Error removing member:', error);
          message.error(t('failed_to_remove_member'));
        }
      }
    });
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      // Send invitation email via Edge Function
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: { invitationId }
      });

      console.log('Resend Edge Function response:', { data: emailData, error: emailError });

      if (emailError) {
        console.error('Failed to resend email:', emailError);
        message.error('Failed to resend invitation email');
      } else {
        message.success('Invitation email resent successfully!');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      message.error('Failed to resend invitation email');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    Modal.confirm({
      title: t('cancel_invitation'),
      content: 'Are you sure you want to cancel this invitation?',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('business_invitations')
            .delete()
            .eq('id', invitationId);

          if (error) throw error;

          message.success(t('invitation_cancelled_successfully'));
          loadTeamData();
        } catch (error) {
          console.error('Error canceling invitation:', error);
          message.error(t('failed_to_cancel_invitation'));
        }
      }
    });
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'red',
      admin: 'orange',
      member: 'blue',
      viewer: 'default'
    };
    return colors[role] || 'default';
  };

  const memberColumns: ColumnsType<TeamMember> = [
    {
      title: t('name_email'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => record.name || record.email
    },
    {
      title: t('role'),
      dataIndex: 'role',
      key: 'role',
      render: (role) => <span style={{ color: getRoleColor(role), textTransform: 'capitalize' }}>{t(role)}</span>
    },
    {
      title: t('joined'),
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      render: (date) => date.toLocaleDateString()
    },
    {
      title: t('actions'),
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        record.role !== 'owner' && userRole === 'owner' ? (
          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedMember(record);
                setEditDialogOpen(true);
              }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveMember(record.id)}
            />
          </Space>
        ) : null
      )
    }
  ];

  const invitationColumns: ColumnsType<BusinessInvitation> = [
    {
      title: t('email'),
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: t('role'),
      dataIndex: 'role',
      key: 'role',
      render: (role) => <span style={{ color: getRoleColor(role), textTransform: 'capitalize' }}>{t(role)}</span>
    },
    {
      title: t('expires'),
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date) => date.toLocaleDateString()
    },
    {
      title: t('actions'),
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<MailOutlined />}
            onClick={() => handleResendInvitation(record.id)}
            title="Resend invitation email"
          />
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={async () => {
              const link = `${window.location.origin}/invite/${record.token}`;
              await navigator.clipboard.writeText(link);
              message.success(t('invitation_link_copied'));
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleCancelInvitation(record.id)}
          />
        </Space>
      )
    }
  ];

  if (!canManageTeam) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message={t('access_denied')}
          description={t('no_permission_manage_team')}
          type="warning"
          showIcon
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={4}>{t('team_management')}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setInviteDialogOpen(true)}
        >
          {t('invite_team_member')}
        </Button>
      </div>

      {/* Team Members */}
      <Card title={t('team_members')} style={{ marginBottom: 24 }}>
        <Table
          columns={memberColumns}
          dataSource={teamMembers}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card title={t('pending_invitations')}>
          <Table
            columns={invitationColumns}
            dataSource={invitations}
            rowKey="id"
            pagination={false}
          />
        </Card>
      )}

      {/* Invite Dialog */}
      <Modal
        title={t('invite_team_member')}
        open={inviteDialogOpen}
        onOk={handleInvite}
        onCancel={() => setInviteDialogOpen(false)}
        okText={t('send_invitation')}
        okButtonProps={{ icon: <SendOutlined /> }}
      >
        <Space direction="vertical" style={{ width: '100%', paddingTop: 16 }} size="middle">
          <div>
            <Text>{t('email')}</Text>
            <Input
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              placeholder={t('enter_email_address')}
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <Text>{t('role')}</Text>
            <Select
              value={inviteForm.role}
              onChange={(value) => setInviteForm({ ...inviteForm, role: value })}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="member">{t('member')}</Option>
              <Option value="admin">{t('admin')}</Option>
              {userRole === 'owner' && <Option value="owner">{t('owner')}</Option>}
              <Option value="viewer">{t('viewer')}</Option>
            </Select>
          </div>
        </Space>
      </Modal>

      {/* Edit Role Dialog */}
      <Modal
        title={t('update_role')}
        open={editDialogOpen}
        onOk={handleUpdateRole}
        onCancel={() => setEditDialogOpen(false)}
        okText={t('update_role')}
      >
        <div style={{ paddingTop: 16 }}>
          <Text>{t('role')}</Text>
          <Select
            value={selectedMember?.role || 'member'}
            onChange={(value) => setSelectedMember({ ...selectedMember!, role: value })}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Option value="member">{t('member')}</Option>
            <Option value="admin">{t('admin')}</Option>
            {userRole === 'owner' && <Option value="owner">{t('owner')}</Option>}
            <Option value="viewer">{t('viewer')}</Option>
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default TeamManagement;
