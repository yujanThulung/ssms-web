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
        Tabs: {
            itemSelectedColor: colors.primary,
            inkBarColor: colors.primary,
            horizontalItemPadding: '12px 2px',
        },
    },
    algorithm: antTheme.defaultAlgorithm,
}