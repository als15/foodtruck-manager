import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, Input, Select, Table, Modal, Alert, Spin, message, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SendOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { useBusiness } from '../contexts/BusinessContext';
import { supabase } from '../lib/supabase';
import { UserBusiness, BusinessInvitation } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface TeamMember extends UserBusiness {
  email?: string;
  name?: string;
}

const TeamManagement: React.FC = () => {
  const { currentBusiness, userRole } = useBusiness();
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
      message.error('Failed to load team data');
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

      const { error } = await supabase
        .from('business_invitations')
        .insert({
          business_id: currentBusiness.id,
          email: inviteForm.email,
          role: inviteForm.role,
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          token: token,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      const inviteLink = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(inviteLink);

      Modal.success({
        title: 'Invitation Created!',
        content: `The invitation link has been copied to your clipboard. Send this link to ${inviteForm.email}:\n\n${inviteLink}`
      });

      setInviteDialogOpen(false);
      setInviteForm({ email: '', role: 'member' });
      loadTeamData();
    } catch (error) {
      console.error('Error creating invitation:', error);
      message.error('Failed to create invitation');
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

      message.success('Role updated successfully');
      setEditDialogOpen(false);
      setSelectedMember(null);
      loadTeamData();
    } catch (error) {
      console.error('Error updating role:', error);
      message.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentBusiness) return;

    Modal.confirm({
      title: 'Remove Team Member',
      content: 'Are you sure you want to remove this team member?',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('user_businesses')
            .delete()
            .eq('id', memberId)
            .eq('business_id', currentBusiness.id);

          if (error) throw error;

          message.success('Team member removed successfully');
          loadTeamData();
        } catch (error) {
          console.error('Error removing member:', error);
          message.error('Failed to remove member');
        }
      }
    });
  };

  const handleCancelInvitation = async (invitationId: string) => {
    Modal.confirm({
      title: 'Cancel Invitation',
      content: 'Are you sure you want to cancel this invitation?',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('business_invitations')
            .delete()
            .eq('id', invitationId);

          if (error) throw error;

          message.success('Invitation cancelled successfully');
          loadTeamData();
        } catch (error) {
          console.error('Error canceling invitation:', error);
          message.error('Failed to cancel invitation');
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
      title: 'Name/Email',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => record.name || record.email
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <span style={{ color: getRoleColor(role), textTransform: 'capitalize' }}>{role}</span>
    },
    {
      title: 'Joined',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      render: (date) => date.toLocaleDateString()
    },
    {
      title: 'Actions',
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
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <span style={{ color: getRoleColor(role), textTransform: 'capitalize' }}>{role}</span>
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date) => date.toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={async () => {
              const link = `${window.location.origin}/invite/${record.token}`;
              await navigator.clipboard.writeText(link);
              message.success('Invitation link copied to clipboard!');
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
          message="Access Denied"
          description="You don't have permission to manage team members. Only owners and admins can access this page."
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
        <Title level={4}>Team Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setInviteDialogOpen(true)}
        >
          Invite Team Member
        </Button>
      </div>

      {/* Team Members */}
      <Card title="Team Members" style={{ marginBottom: 24 }}>
        <Table
          columns={memberColumns}
          dataSource={teamMembers}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card title="Pending Invitations">
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
        title="Invite Team Member"
        open={inviteDialogOpen}
        onOk={handleInvite}
        onCancel={() => setInviteDialogOpen(false)}
        okText="Send Invitation"
        okButtonProps={{ icon: <SendOutlined /> }}
      >
        <Space direction="vertical" style={{ width: '100%', paddingTop: 16 }} size="middle">
          <div>
            <Text>Email</Text>
            <Input
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              placeholder="Enter email address"
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <Text>Role</Text>
            <Select
              value={inviteForm.role}
              onChange={(value) => setInviteForm({ ...inviteForm, role: value })}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="member">Member</Option>
              <Option value="admin">Admin</Option>
              {userRole === 'owner' && <Option value="owner">Owner</Option>}
              <Option value="viewer">Viewer</Option>
            </Select>
          </div>
        </Space>
      </Modal>

      {/* Edit Role Dialog */}
      <Modal
        title="Update Role"
        open={editDialogOpen}
        onOk={handleUpdateRole}
        onCancel={() => setEditDialogOpen(false)}
        okText="Update Role"
      >
        <div style={{ paddingTop: 16 }}>
          <Text>Role</Text>
          <Select
            value={selectedMember?.role || 'member'}
            onChange={(value) => setSelectedMember({ ...selectedMember!, role: value })}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Option value="member">Member</Option>
            <Option value="admin">Admin</Option>
            {userRole === 'owner' && <Option value="owner">Owner</Option>}
            <Option value="viewer">Viewer</Option>
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default TeamManagement;
