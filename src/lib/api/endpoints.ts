export const ENDPOINTS = {
  UPLOADS: {
    BASE: '/uploads',
  },
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
    DETAIL:     (id: string) => `/students/${id}`,
    STATUS:     (id: string) => `/students/${id}/status`,
    DEACTIVATE: (id: string) => `/students/${id}/deactivate`,
    RESTORE:    (id: string) => `/students/${id}/restore`,
    PROMOTE: '/students/promote',
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
  ACADEMIC_YEARS: {
    SUMMARY: '/academic-years/summary',
    LIST: '/academic-years',
    BASE: '/academic-years',
    DETAIL: (id: string | number) => `/academic-years/${id}`,
    SET_CURRENT: (id: string | number) => `/academic-years/${id}/set-current`,
    CLONE: (id: string | number) => `/academic-years/${id}/clone`,
    ARCHIVE: (id: string | number) => `/academic-years/${id}/archive`,
  },
  CLASSES: {
    BASE: '/classes',
    DETAIL: (id: string | number) => `/classes/${id}`,
  },
  SECTIONS: {
    BASE: '/sections',
    DETAIL: (id: string | number) => `/sections/${id}`,
  },
} as const