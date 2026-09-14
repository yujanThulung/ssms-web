import type { Section, MockTeacher } from './types'

export const MOCK_SECTIONS: Section[] = [
  { id: 'sec-1', classId: 'cls-1', name: 'A', code: 'CLS1-A', capacity: 40, classTeacherId: 'tch-1', status: 'ACTIVE',   createdAt: '2025-01-12T00:00:00.000Z', updatedAt: '2025-01-12T00:00:00.000Z', deletedAt: null },
  { id: 'sec-2', classId: 'cls-1', name: 'B', code: 'CLS1-B', capacity: 40, classTeacherId: 'tch-2', status: 'ACTIVE',   createdAt: '2025-01-12T00:00:00.000Z', updatedAt: '2025-01-12T00:00:00.000Z', deletedAt: null },
  { id: 'sec-3', classId: 'cls-2', name: 'A', code: 'CLS2-A', capacity: 35, classTeacherId: 'tch-3', status: 'ACTIVE',   createdAt: '2025-01-12T00:00:00.000Z', updatedAt: '2025-01-12T00:00:00.000Z', deletedAt: null },
  { id: 'sec-4', classId: 'cls-2', name: 'B', code: 'CLS2-B', capacity: 35, classTeacherId: null,    status: 'ACTIVE',   createdAt: '2025-01-12T00:00:00.000Z', updatedAt: '2025-01-12T00:00:00.000Z', deletedAt: null },
  { id: 'sec-5', classId: 'cls-3', name: 'A', code: 'CLS3-A', capacity: 40, classTeacherId: 'tch-4', status: 'ACTIVE',   createdAt: '2025-01-12T00:00:00.000Z', updatedAt: '2025-01-12T00:00:00.000Z', deletedAt: null },
  { id: 'sec-6', classId: 'cls-4', name: 'A', code: 'CLS4-A', capacity: 30, classTeacherId: null,    status: 'INACTIVE', createdAt: '2025-01-12T00:00:00.000Z', updatedAt: '2025-01-12T00:00:00.000Z', deletedAt: null },
]

export const MOCK_TEACHERS: MockTeacher[] = [
  { id: 'tch-1', name: 'Ram Prasad Sharma',   department: 'Mathematics', status: 'Active' },
  { id: 'tch-2', name: 'Sita Devi Adhikari',  department: 'English',     status: 'Active' },
  { id: 'tch-3', name: 'Hari Bahadur Thapa',  department: 'Science',     status: 'Active' },
  { id: 'tch-4', name: 'Kamala Kumari Rai',   department: 'Nepali',      status: 'Active' },
  { id: 'tch-5', name: 'Binod Kumar Gautam',  department: 'Social',      status: 'Inactive' },
]
