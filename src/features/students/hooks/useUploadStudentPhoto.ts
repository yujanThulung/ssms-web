import { useUpload } from '../../../lib/api/hooks/useUpload'


export function useUploadStudentPhoto() {
  return useUpload({ purpose: 'STUDENT_PHOTO' })
}
