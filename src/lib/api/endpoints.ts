export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  USERS: {
    BASE: '/users',
    ME: '/users/me',
    CHANGE_PASSWORD: '/users/me/password',
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
  ROLES: {
    BASE: '/roles',
    PERMISSIONS: (roleId: string) => `/roles/${roleId}/permissions`,
  },
} as const