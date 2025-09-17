import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Send as SendIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useBusiness } from '../contexts/BusinessContext';
import { supabase } from '../lib/supabase';
import { UserBusiness, BusinessInvitation } from '../types';

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

      // For now, we'll just use user IDs. In a production app, you might want to:
      // 1. Create a profiles table that stores user metadata
      // 2. Use a server-side function to fetch user emails
      // 3. Or show user IDs and let users set display names
      setTeamMembers(membersData?.map(m => ({
        id: m.id,
        userId: m.user_id,
        businessId: m.business_id,
        role: m.role,
        joinedAt: new Date(m.joined_at),
        permissions: m.permissions,
        email: `User ${m.user_id.substring(0, 8)}...`, // Show partial user ID
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
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!currentBusiness || !inviteForm.email) return;

    try {
      // Generate invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

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

      // Generate invitation link
      const inviteLink = `${window.location.origin}/invite/${token}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink);
      
      alert(`Invitation created! The link has been copied to your clipboard:\n\n${inviteLink}\n\nSend this link to ${inviteForm.email}`);
      
      setInviteDialogOpen(false);
      setInviteForm({ email: '', role: 'member' });
      loadTeamData();
    } catch (error) {
      console.error('Error creating invitation:', error);
      alert('Failed to create invitation');
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

      setEditDialogOpen(false);
      setSelectedMember(null);
      loadTeamData();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentBusiness || !window.confirm('Are you sure you want to remove this team member?')) return;

    try {
      const { error } = await supabase
        .from('user_businesses')
        .delete()
        .eq('id', memberId)
        .eq('business_id', currentBusiness.id);

      if (error) throw error;

      loadTeamData();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const { error } = await supabase
        .from('business_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      loadTeamData();
    } catch (error) {
      console.error('Error canceling invitation:', error);
      alert('Failed to cancel invitation');
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      owner: 'error',
      admin: 'warning',
      member: 'info',
      viewer: 'default'
    };
    return colors[role as keyof typeof colors] || 'default';
  };

  if (!canManageTeam) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          You don't have permission to manage team members. Only owners and admins can access this page.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Team Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setInviteDialogOpen(true)}
        >
          Invite Team Member
        </Button>
      </Box>

      {/* Team Members */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name/Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name || member.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={member.role} 
                      color={getRoleColor(member.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{member.joinedAt.toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    {member.role !== 'owner' && userRole === 'owner' && (
                      <>
                        <IconButton
                          onClick={() => {
                            setSelectedMember(member);
                            setEditDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleRemoveMember(member.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Paper>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Pending Invitations</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={invitation.role} 
                        color={getRoleColor(invitation.role) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{invitation.expiresAt.toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={async () => {
                          const link = `${window.location.origin}/invite/${invitation.token}`;
                          await navigator.clipboard.writeText(link);
                          alert('Invitation link copied to clipboard!');
                        }}
                      >
                        <CopyIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleCancelInvitation(invitation.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)}>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                label="Role"
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                {userRole === 'owner' && <MenuItem value="owner">Owner</MenuItem>}
                <MenuItem value="viewer">Viewer</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleInvite} variant="contained" startIcon={<SendIcon />}>
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Update Role</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={selectedMember?.role || 'member'}
                onChange={(e) => setSelectedMember({ ...selectedMember!, role: e.target.value as any })}
                label="Role"
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                {userRole === 'owner' && <MenuItem value="owner">Owner</MenuItem>}
                <MenuItem value="viewer">Viewer</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateRole} variant="contained">
            Update Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamManagement;