import React, { useState } from 'react'
import { Card, Typography, Button, Input, Space, Modal, Alert, message, Divider, Form } from 'antd'
import { DeleteOutlined, ExclamationCircleOutlined, UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const { Title, Text, Paragraph } = Typography

const UserSettings: React.FC = () => {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      message.error(t('please_type_delete_to_confirm'))
      return
    }

    setDeleteLoading(true)
    try {
      if (!user?.id) {
        throw new Error('User not found')
      }

      // Delete all user data from related tables
      // This should be done in order to respect foreign key constraints

      // 1. Delete user businesses (will cascade to invitations, etc.)
      const { error: businessError } = await supabase
        .from('user_businesses')
        .delete()
        .eq('user_id', user.id)

      if (businessError) throw businessError

      // 2. Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) throw profileError

      message.success(t('account_data_deleted_successfully'))

      // Sign out and redirect to auth page
      // Note: The actual auth user account remains in Supabase Auth
      // For complete deletion, the user should contact support or
      // a backend admin function should be implemented
      setTimeout(async () => {
        await signOut()
        navigate('/auth')
      }, 1500)
    } catch (error) {
      console.error('Error deleting account:', error)
      message.error(t('failed_to_delete_account'))
      setDeleteLoading(false)
      setIsDeleteModalOpen(false)
      setConfirmText('')
    }
  }

  return (
    <div>
      <Title level={2}>{t('user_settings')}</Title>

      {/* User Information */}
      <Card title={t('account_information')} style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>{t('email')}</Text>
            <div style={{ marginTop: 8 }}>
              <Input
                prefix={<MailOutlined />}
                value={user?.email}
                disabled
                style={{ maxWidth: 400 }}
              />
            </div>
          </div>

          <div>
            <Text strong>{t('user_id')}</Text>
            <div style={{ marginTop: 8 }}>
              <Input
                prefix={<UserOutlined />}
                value={user?.id}
                disabled
                style={{ maxWidth: 400 }}
              />
            </div>
          </div>
        </Space>
      </Card>

      {/* Change Password */}
      <Card title={t('change_password')} style={{ marginBottom: 24 }}>
        <Paragraph type="secondary">
          {t('change_password_description')}
        </Paragraph>
        <Button
          icon={<LockOutlined />}
          onClick={() => {
            message.info(t('password_reset_email_sent'))
            supabase.auth.resetPasswordForEmail(user?.email || '')
          }}
        >
          {t('send_password_reset_email')}
        </Button>
      </Card>

      {/* Danger Zone */}
      <Card
        title={
          <span style={{ color: '#ff4d4f' }}>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            {t('danger_zone')}
          </span>
        }
        style={{ borderColor: '#ff4d4f' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message={t('delete_account_warning_title')}
            description={t('delete_account_warning_description')}
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
          />

          <div>
            <Title level={5} style={{ color: '#ff4d4f' }}>
              {t('delete_account')}
            </Title>
            <Paragraph type="secondary">
              {t('delete_account_description')}
            </Paragraph>
            <ul style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              <li>{t('delete_account_item_1')}</li>
              <li>{t('delete_account_item_2')}</li>
              <li>{t('delete_account_item_3')}</li>
              <li>{t('delete_account_item_4')}</li>
            </ul>
            <Button
              danger
              type="primary"
              icon={<DeleteOutlined />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              {t('delete_my_account')}
            </Button>
          </div>
        </Space>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <span style={{ color: '#ff4d4f' }}>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            {t('confirm_account_deletion')}
          </span>
        }
        open={isDeleteModalOpen}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setConfirmText('')
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsDeleteModalOpen(false)
              setConfirmText('')
            }}
          >
            {t('cancel')}
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={deleteLoading}
            disabled={confirmText !== 'DELETE'}
            onClick={handleDeleteAccount}
          >
            {t('delete_permanently')}
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message={t('this_action_cannot_be_undone')}
            description={t('delete_account_final_warning')}
            type="error"
            showIcon
          />

          <div>
            <Paragraph strong>{t('delete_account_confirmation_instruction')}</Paragraph>
            <Input
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onPressEnter={() => {
                if (confirmText === 'DELETE') {
                  handleDeleteAccount()
                }
              }}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}

export default UserSettings
