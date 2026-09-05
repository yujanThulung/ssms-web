export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  USERS: {
    ME: '/users/me',
  },
  STUDENTS: {
    BASE: '/students',
    DETAIL: (id: string | number) => `/students/${id}`,
  },
  ACCOUNTS: {
    BASE: '/accounts',
    DETAIL: (id: string | number) => `/accounts/${id}`,
  },
  PERMISSIONS: {
    LIST: '/permissions',
    DETAIL: (id: string | number) => `/permissions/${id}`,
  },
} as const