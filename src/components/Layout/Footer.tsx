import React from 'react'
import { Layout, Space, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const { Footer: AntFooter } = Layout
const { Text } = Typography

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const { t } = useTranslation()

  return (
    <AntFooter
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 32,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: 'var(--surface-color)',
        borderTop: '1px solid var(--border-color)',
        zIndex: 90
      }}
    >
      <Space size="small" split="|" style={{ whiteSpace: 'nowrap' }}>
        <Link to="/privacy-policy" style={{ color: 'inherit', opacity: 0.65, fontSize: 12 }}>
          {t('privacy_policy')}
        </Link>
        <Link to="/terms-of-service" style={{ color: 'inherit', opacity: 0.65, fontSize: 12 }}>
          {t('terms_of_service')}
        </Link>
        <Link to="/disclaimer" style={{ color: 'inherit', opacity: 0.65, fontSize: 12 }}>
          {t('disclaimer')}
        </Link>
        <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
          © {currentYear} Food Truck Manager
        </Text>
      </Space>
    </AntFooter>
  )
}

export default Footer
