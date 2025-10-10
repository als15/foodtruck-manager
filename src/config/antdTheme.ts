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
    Switch: {
      colorPrimary: '#52c41a',
      colorPrimaryHover: '#73d13d',
      colorPrimaryBorder: '#52c41a',
    },
  },
}

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#5cdbd3',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    colorTextBase: '#e8f4f8',
    colorBgBase: '#00142a',
    colorBorder: 'rgba(24, 144, 255, 0.2)',
    colorBgContainer: '#001d3d',
    colorBgElevated: '#002855',
    colorBgLayout: '#000c1a',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#001d3d',
      siderBg: '#001529',
      bodyBg: '#000c1a',
      triggerBg: '#001d3d',
    },
    Menu: {
      darkItemBg: '#001529',
      darkItemSelectedBg: '#1890ff',
      darkItemHoverBg: '#003a70',
      darkItemColor: 'rgba(232, 244, 248, 0.7)',
      darkItemSelectedColor: '#ffffff',
    },
    Card: {
      borderRadiusLG: 12,
      paddingLG: 24,
      colorBgContainer: '#001d3d',
      colorBorder: 'rgba(24, 144, 255, 0.2)',
    },
    Button: {
      borderRadius: 6,
      controlHeight: 36,
      fontSizeLG: 16,
      colorBgContainer: '#001d3d',
      colorBorder: 'rgba(24, 144, 255, 0.3)',
      defaultBg: '#001d3d',
      defaultBorderColor: 'rgba(24, 144, 255, 0.3)',
      defaultColor: '#e8f4f8',
    },
    Table: {
      borderRadius: 8,
      headerBg: '#001d3d',
      headerColor: '#e8f4f8',
      rowHoverBg: '#002855',
      colorBgContainer: '#00142a',
      colorBorder: 'rgba(24, 144, 255, 0.2)',
    },
    Input: {
      colorBgContainer: '#001d3d',
      colorBorder: 'rgba(24, 144, 255, 0.3)',
      colorText: '#e8f4f8',
      colorTextPlaceholder: 'rgba(232, 244, 248, 0.45)',
      activeBorderColor: '#5cdbd3',
      hoverBorderColor: '#1890ff',
    },
    Select: {
      colorBgContainer: '#001d3d',
      colorBorder: 'rgba(24, 144, 255, 0.3)',
      colorText: '#e8f4f8',
      colorBgElevated: '#002855',
      optionSelectedBg: '#1890ff',
    },
    Switch: {
      colorPrimary: '#52c41a',
      colorPrimaryHover: '#73d13d',
      colorPrimaryBorder: '#52c41a',
      colorTextQuaternary: 'rgba(232, 244, 248, 0.25)',
    },
    Modal: {
      headerBg: '#001d3d',
      contentBg: '#001d3d',
      footerBg: '#001d3d',
      colorBgElevated: '#001d3d',
    },
    Dropdown: {
      colorBgElevated: '#002855',
      colorBorder: 'rgba(24, 144, 255, 0.2)',
    },
    Divider: {
      colorSplit: 'rgba(24, 144, 255, 0.2)',
    },
    Tag: {
      defaultBg: '#002855',
      defaultColor: '#e8f4f8',
    },
    Statistic: {
      contentFontSize: 24,
      titleFontSize: 14,
    },
  },
  algorithm: 'darkAlgorithm' as any,
}
