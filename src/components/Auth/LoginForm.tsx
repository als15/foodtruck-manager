import React, { useState } from 'react'
import { Card, Form, Input, Button, Typography, Alert, Space, Divider } from 'antd'
import { MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

const { Title, Text, Link } = Typography

interface LoginFormProps {
  onSwitchToSignup: () => void
  onSuccess?: () => void
  initialEmail?: string
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, onSuccess, initialEmail }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const { t } = useTranslation()

  // Set initial email if provided
  React.useEffect(() => {
    if (initialEmail) {
      form.setFieldsValue({ email: initialEmail })
    }
  }, [initialEmail, form])

  const handleSubmit = async (values: any) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await signIn(values.email, values.password)
      if (error) {
        setError(error.message)
      } else {
        onSuccess?.()
      }
    } catch (err) {
      setError(t('unexpected_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px'
      }}
    >
      <Card
        style={{
          maxWidth: 450,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          direction: 'rtl'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <img
              src="/nomnom_logo.png"
              alt="NomNom"
              style={{
                height: 140,
                width: 'auto',
                marginBottom: 24
              }}
            />

            {/* <Text type="secondary">
              {t('login_to_your_account')}
            </Text> */}
          </div>

          {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />}

          <Form form={form} layout="vertical" onFinish={handleSubmit} size="large" requiredMark={false}>
            <Form.Item
              name="email"
              label={t('email')}
              rules={[
                { required: true, message: t('please_enter_email') },
                { type: 'email', message: t('please_enter_valid_email') }
              ]}
            >
              <Input prefix={<MailOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder={t('email')} disabled={loading} />
            </Form.Item>

            <Form.Item name="password" label={t('password')} rules={[{ required: true, message: t('please_enter_password') }]}>
              <Input.Password prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder={t('password')} iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)} disabled={loading} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                size="large"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  height: 48
                }}
              >
                {t('login')}
              </Button>
            </Form.Item>
          </Form>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              {t('dont_have_account_question')}{' '}
              <Link onClick={onSwitchToSignup} disabled={loading}>
                {t('signup')}
              </Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}
