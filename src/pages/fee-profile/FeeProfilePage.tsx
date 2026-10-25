import { useParams } from 'react-router-dom'

import FeeProfilesList from './FeeProfilesList'
import FeeProfileDetail from './FeeProfileDetail'

export default function FeeProfilePage() {
  const { studentId } = useParams<{ studentId?: string }>()

  return studentId ? <FeeProfileDetail studentId={studentId} /> : <FeeProfilesList />
}
