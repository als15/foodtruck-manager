import React, { useState } from 'react'
import { Card, Form, Input, Button, Typography, Alert, Space, Row, Col, Divider } from 'antd'
import { UserOutlined, MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

const { Title, Text, Link } = Typography

interface SignupFormProps {
  onSwitchToLogin: () => void
  onSuccess?: () => void
  initialEmail?: string
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin, onSuccess, initialEmail }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
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
      const { error } = await signUp(values.email, values.password, {
        first_name: values.firstName,
        last_name: values.lastName
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
        }, 2000)
      }
    } catch (err) {
      setError(t('unexpected_error'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px'
      }}>
        <Card style={{ maxWidth: 500, width: '100%' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message={t('account_created')}
              description={t('signup_success_message')}
              type="success"
              showIcon
            />
            <Button type="primary" block onClick={onSwitchToLogin}>
              {t('go_to_login')}
            </Button>
          </Space>
        </Card>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px'
    }}>
      <Card
        style={{
          maxWidth: 500,
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
                height: 120,
                width: 'auto',
                marginBottom: 24
              }}
            />
            <Title level={2} style={{ marginBottom: 8, color: '#667eea' }}>
              {t('signup')}
            </Title>
            <Text type="secondary">
              {t('create_your_account')}
            </Text>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
            requiredMark={false}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="firstName"
                  label={t('first_name')}
                  rules={[
                    { required: true, message: t('please_enter_first_name') }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                    placeholder={t('first_name')}
                    disabled={loading}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="lastName"
                  label={t('last_name')}
                  rules={[
                    { required: true, message: t('please_enter_last_name') }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                    placeholder={t('last_name')}
                    disabled={loading}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="email"
              label={t('email')}
              rules={[
                { required: true, message: t('please_enter_email') },
                { type: 'email', message: t('please_enter_valid_email') }
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder={t('email')}
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={t('password')}
              rules={[
                { required: true, message: t('please_enter_password') },
                { min: 6, message: t('password_too_short') }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder={t('password')}
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={t('confirm_password')}
              dependencies={['password']}
              rules={[
                { required: true, message: t('please_confirm_password') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error(t('passwords_dont_match')))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder={t('confirm_password')}
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                disabled={loading}
              />
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
                {t('signup')}
              </Button>
            </Form.Item>
          </Form>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              {t('already_have_account_question')}{' '}
              <Link onClick={onSwitchToLogin} disabled={loading}>
                {t('login')}
              </Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}
