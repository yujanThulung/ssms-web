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
  border: '#e5e7eb',
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


export const DRAWER ={
    width: 480,
    widthLg: 720,
    widthXl: 1080,
}

export const MODAL ={
    width: 520,
    widthLg: 720,
}

export const TABLE ={
    size: 'middle' as const,
    scrollX: 1100,
    pageSize: 10,
    pageSizeOptions: [' 10', '20', '50', '100'],
} as const;