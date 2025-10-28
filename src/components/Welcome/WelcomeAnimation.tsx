import React, { useEffect, useState } from 'react'
import { Modal, Typography, Space } from 'antd'
import { CheckCircleOutlined, RocketOutlined, ThunderboltOutlined, StarOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import './WelcomeAnimation.css'

const { Title, Text } = Typography

interface WelcomeAnimationProps {
  visible: boolean
  onClose: () => void
  userName?: string
}

export const WelcomeAnimation: React.FC<WelcomeAnimationProps> = ({ visible, onClose, userName }) => {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (visible) {
      setStep(0)
      const timers = [
        setTimeout(() => setStep(1), 500),
        setTimeout(() => setStep(2), 1500),
        setTimeout(() => setStep(3), 2500),
        setTimeout(() => {
          setTimeout(onClose, 800)
        }, 4000)
      ]

      return () => timers.forEach(timer => clearTimeout(timer))
    }
  }, [visible, onClose])

  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      maskStyle={{
        background: 'linear-gradient(135deg, rgba(127, 211, 199, 0.95) 0%, rgba(92, 219, 211, 0.95) 100%)'
      }}
      modalRender={() => (
        <div className={`welcome-container ${visible ? 'slide-up' : ''}`}>
          <Space direction="vertical" size="large" align="center" style={{ width: '100%' }}>
            {/* Logo */}
            <div className={`welcome-logo ${step >= 1 ? 'fade-in' : ''}`}>
              <img
                src="/nomnom_logo.png"
                alt="NomNom"
                style={{
                  height: 120,
                  width: 'auto',
                  filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))'
                }}
              />
            </div>

            {/* Welcome Message */}
            <div className={`welcome-message ${step >= 1 ? 'fade-in' : ''}`}>
              <Title level={1} style={{ color: '#ffffff', marginBottom: 8, textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                {t('welcome_aboard')} {userName ? userName : ''}! 🎉
              </Title>
              <Text style={{ fontSize: 18, color: '#ffffff', opacity: 0.95 }}>
                {t('welcome_message')}
              </Text>
            </div>

            {/* Feature Icons */}
            <div className={`welcome-features ${step >= 2 ? 'fade-in' : ''}`}>
              <Space size="large" wrap>
                <div className="feature-icon">
                  <RocketOutlined style={{ fontSize: 40, color: '#ffffff' }} />
                  <Text style={{ color: '#ffffff', marginTop: 8 }}>{t('quick_setup')}</Text>
                </div>
                <div className="feature-icon">
                  <ThunderboltOutlined style={{ fontSize: 40, color: '#ffffff' }} />
                  <Text style={{ color: '#ffffff', marginTop: 8 }}>{t('powerful_tools')}</Text>
                </div>
                <div className="feature-icon">
                  <StarOutlined style={{ fontSize: 40, color: '#ffffff' }} />
                  <Text style={{ color: '#ffffff', marginTop: 8 }}>{t('grow_business')}</Text>
                </div>
              </Space>
            </div>

            {/* Success Icon */}
            <div className={`welcome-success ${step >= 3 ? 'scale-in' : ''}`}>
              <CheckCircleOutlined style={{ fontSize: 80, color: '#52c41a' }} />
            </div>
          </Space>
        </div>
      )}
    />
  )
}
