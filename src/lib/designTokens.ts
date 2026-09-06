export const colors = {
    primary: '#15803d',
    primaryHover: '#166534',
    primaryActive: '#14532d',
    primaryLight: '#f0fdf4',
    primaryBorder: '#bbf7d0',
    secondary: '#f3f4f6',
    secondaryText: '#374151',
    background: '#f9fafb',
    surface: '#ffffff',
    surfaceAlt: '#f9fafb',
    border: '#e5e7eb',
    borderStrong: '#d1d5db',
    text: '#111827',
    textSecondary: '#374151',
    muted: '#6b7280',
    disabled: '#9ca3af',
    success: '#16a34a',
    successLight: '#f0fdf4',
    warning: '#d97706',
    warningLight: '#fffbeb',
    error: '#dc2626',
    errorLight: '#fef2f2',
    info: '#0ea5e9',
    infoLight: '#f0f9ff',
} as const


export const DRAWER = {
    width: 480,
    widthLg: 720,
    widthXl: 1080,
}

export const MODAL = {
    width: 520,
    widthLg: 720,
}

export const TABLE = {
    size: 'middle' as const,
    scrollX: 1100,
    pageSize: 10,
    pageSizeOptions: [' 10', '20', '50', '100'],
} as const;

export const radius = {
    sm: 6,
    md: 8,
    lg: 10,
    xl: 14,
    pill: 999,
} as const

export const shadow = {
    card: '0 1px 2px rgba(15,23,42,.06)',
    pop: '0 12px 40px -12px rgba(15,23,42,.28)',
} as const

export const sizing = {
    controlHeight: 36,
    controlHeightSm: 28,
    controlHeightLg: 40,
} as const

export const typography = {
    fontFamily:
        'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    xs: 12,
    sm: 13,
    base: 14,
    lg: 16,
    xl: 20,
} as const

export const BUTTON = {
    height: sizing.controlHeight,
    heightSm: sizing.controlHeightSm,
    radius: radius.md,
} as const