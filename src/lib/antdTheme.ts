import { theme as antTheme, type ThemeConfig } from 'antd'
import { colors } from './designTokens'

export const antdTheme: ThemeConfig = {
    token: {
        colorPrimary: colors.primary,
        colorPrimaryHover: colors.primaryHover,
        colorPrimaryActive: colors.primaryActive,
        colorPrimaryBg: colors.primaryLight,
    },
    components: {
        Breadcrumb: {
            lastItemColor: colors.primary,
        },
        Table: {
            headerBg: '#e8f3f2ff',
            headerColor: '#1e293b',
            headerSplitColor: 'transparent',
            borderColor: colors.border,
            rowHoverBg: colors.primaryLight,
            cellPaddingBlock: 12,
            cellPaddingInline: 16,
        },
        Tabs: {
            itemSelectedColor: colors.primary,
            inkBarColor: colors.primary,
            horizontalItemPadding: '12px 2px',
        },
    },
    algorithm: antTheme.defaultAlgorithm,
}