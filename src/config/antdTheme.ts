import { ThemeConfig } from 'antd'

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#7fd3c7',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    colorTextBase: '#1a1a1a',
    colorBgBase: '#ffffff',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#001529',
      bodyBg: '#f5f5f5',
    },
    Menu: {
      darkItemBg: '#001529',
      darkItemSelectedBg: '#1890ff',
      darkItemHoverBg: '#1f4662',
    },
    Card: {
      borderRadiusLG: 12,
      paddingLG: 24,
    },
    Button: {
      borderRadius: 6,
      controlHeight: 36,
      fontSizeLG: 16,
    },
    Table: {
      borderRadius: 8,
      headerBg: '#fafafa',
    },
  },
}

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#7fd3c7',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    colorTextBase: '#e0e0e0',
    colorBgBase: '#141414',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#1f1f1f',
      siderBg: '#001529',
      bodyBg: '#0a0a0a',
    },
    Menu: {
      darkItemBg: '#001529',
      darkItemSelectedBg: '#1890ff',
      darkItemHoverBg: '#1f4662',
    },
    Card: {
      borderRadiusLG: 12,
      paddingLG: 24,
    },
    Button: {
      borderRadius: 6,
      controlHeight: 36,
      fontSizeLG: 16,
    },
    Table: {
      borderRadius: 8,
      headerBg: '#1f1f1f',
    },
  },
  algorithm: 'darkAlgorithm' as any,
}
