import React, { useState } from 'react'
import {
  Row,
  Col,
  Typography,
  Card,
  Avatar,
  Button,
  Modal,
  Alert,
  Tag,
  Spin,
  Space,
} from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

const { Title, Text } = Typography

export const UserManagement: React.FC = () => {
  const { user, signOut, resetPassword } = useAuth()
  const { t } = useTranslation()
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sign out' })
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return

    setLoading(true)
    try {
      const { error } = await resetPassword(user.email)
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: t('password_reset_email_sent') })
        setPasswordResetDialogOpen(false)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send password reset email' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <Title level={2}>{t('user_management')}</Title>
        <Alert
          message={t('no_user_data')}
          type="error"
        />
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        {t('user_management')}
      </Title>

      {message && (
        <Alert
          message={message.text}
          type={message.type}
          closable
          onClose={() => setMessage(null)}
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <Avatar size={40} style={{ backgroundColor: '#1890ff', marginRight: 16 }}>
                <UserOutlined />
              </Avatar>
              <Title level={4} style={{ margin: 0 }}>
                {t('profile_information')}
              </Title>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                {t('email')}
              </Text>
              <Text>{user.email}</Text>
            </div>

            {user.user_metadata?.first_name && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t('first_name')}
                </Text>
                <Text>{user.user_metadata.first_name}</Text>
              </div>
            )}

            {user.user_metadata?.last_name && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {t('last_name')}
                </Text>
                <Text>{user.user_metadata.last_name}</Text>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                {t('account_created')}
              </Text>
              <Text>{formatDate(user.created_at)}</Text>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                {t('last_sign_in')}
              </Text>
              <Text>{user.last_sign_in_at ? formatDate(user.last_sign_in_at) : t('never')}</Text>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                {t('email_verified')}
              </Text>
              <Tag color={user.email_confirmed_at ? 'success' : 'warning'}>
                {user.email_confirmed_at ? t('verified') : t('not_verified')}
              </Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card>
            <Title level={4} style={{ marginBottom: 16 }}>
              {t('account_actions')}
            </Title>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                icon={<LockOutlined />}
                onClick={() => setPasswordResetDialogOpen(true)}
              >
                {t('reset_password')}
              </Button>

              <Button
                block
                danger
                onClick={handleSignOut}
              >
                {t('sign_out')}
              </Button>
            </Space>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              {t('user_id')}
            </Title>
            <Text code style={{ wordBreak: 'break-all' }}>
              {user.id}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Password Reset Dialog */}
      <Modal
        open={passwordResetDialogOpen}
        onCancel={() => setPasswordResetDialogOpen(false)}
        onOk={handlePasswordReset}
        title={t('reset_password')}
        confirmLoading={loading}
      >
        <Text>
          {t('password_reset_confirmation')}
        </Text>
      </Modal>
    </div>
  )
}
