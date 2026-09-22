import type { Rule } from 'antd/es/form'
import { bsIsoToAdIso } from '../../utils/nepaliDate'

export const nameValidationRules = (fieldName: string, required = true): Rule[] => [
  ...(required
    ? [
      { required: true, message: `Please enter ${fieldName.toLowerCase()}` },
      { whitespace: true, message: `${fieldName} cannot be empty` },
      { min: 3, message: `${fieldName} must be at least 3 characters` },
    ]
    : [
      {
        validator: async (_: unknown, value: string) => {
          if (!value || !value.trim()) return Promise.resolve()
          if (value.trim().length < 3) {
            return Promise.reject(new Error(`${fieldName} must be at least 3 characters`))
          }
          return Promise.resolve()
        },
      },
    ]),
  { max: 50, message: `${fieldName} cannot exceed 50 characters` },
  {
    // eslint-disable-next-line no-misleading-character-class
    pattern: /^[a-zA-Z\s'\-\u0900-\u097F]*$/,
    message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
  },
]

export const dobValidationRules: Rule[] = [
  { required: true, message: 'Please select date of birth' },
  {
    validator: async (_, value: string) => {
      if (!value) {
        return Promise.reject(new Error('Please select date of birth'))
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return Promise.reject(new Error('Please enter a valid BS date (YYYY-MM-DD)'))
      }
      try {
        const adDateStr = bsIsoToAdIso(value)
        const dob = new Date(adDateStr)
        if (isNaN(dob.getTime())) {
          return Promise.reject(new Error('Invalid date of birth'))
        }
        const today = new Date()
        if (dob > today) {
          return Promise.reject(new Error('Date of birth cannot be in the future'))
        }
        const ageDiffMs = today.getTime() - dob.getTime()
        const ageYears = ageDiffMs / (1000 * 60 * 60 * 24 * 365.25)
        if (ageYears < 2) {
          return Promise.reject(new Error('Student must be at least 2 years old'))
        }
        if (ageYears > 80) {
          return Promise.reject(new Error('Please check the date of birth'))
        }
      } catch {
        return Promise.reject(new Error('Invalid BS date format'))
      }
      return Promise.resolve()
    },
  },
]

export const phoneValidationRules: Rule[] = [
  { required: true, message: 'Please enter parent / guardian phone number' },
  { whitespace: true, message: 'Phone number cannot be empty' },
  {
    validator: async (_, value: string) => {
      if (!value || !value.trim()) {
        return Promise.reject(new Error('Please enter parent / guardian phone number'))
      }
      const cleaned = value.trim().replace(/^(\+977)?[- ]?/, '')
      if (!/^(9[678]\d{8}|0\d{1,2}\d{6,7}|\d{10})$/.test(cleaned)) {
        return Promise.reject(
          new Error('Please enter a valid 10-digit mobile number (e.g. 98XXXXXXXX)')
        )
      }
      return Promise.resolve()
    },
  },
]

export const emailValidationRules: Rule[] = [
  { type: 'email', message: 'Please enter a valid email address' },
  { max: 100, message: 'Email address cannot exceed 100 characters' },
]

export const addressValidationRules = (type: 'Permanent' | 'Temporary'): Rule[] => [
  { max: 200, message: `${type} address cannot exceed 200 characters` },
]

export const admissionDateValidationRules = (
  isEdit: boolean,
  getDobValue?: () => string | undefined
): Rule[] => [
    ...(isEdit ? [] : [{ required: true, message: 'Please select admission date' }]),
    {
      validator: async (_, value: string) => {
        if (isEdit || !value) return Promise.resolve()
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return Promise.reject(new Error('Please enter a valid BS date (YYYY-MM-DD)'))
        }
        try {
          const adDateStr = bsIsoToAdIso(value)
          const admDate = new Date(adDateStr)
          if (isNaN(admDate.getTime())) {
            return Promise.reject(new Error('Invalid admission date'))
          }
          const today = new Date()
          if (admDate > today) {
            return Promise.reject(new Error('Admission date cannot be in the future'))
          }

          const dobVal = getDobValue?.()
          if (dobVal && /^\d{4}-\d{2}-\d{2}$/.test(dobVal)) {
            const dobAdStr = bsIsoToAdIso(dobVal)
            const dobDate = new Date(dobAdStr)
            if (!isNaN(dobDate.getTime()) && admDate < dobDate) {
              return Promise.reject(new Error('Admission date cannot be before date of birth'))
            }
          }
        } catch {
          return Promise.reject(new Error('Invalid BS date format'))
        }
        return Promise.resolve()
      },
    },
  ]
