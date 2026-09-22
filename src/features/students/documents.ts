import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/api'
import { ENDPOINTS } from '../../lib/api/endpoints'
import type { StudentDocument, StudentDocumentType } from '../../pages/students/types'

interface ApiEnvelope<T> {
    success: boolean
    message: string
    data: T
}

export interface AttachDocumentPayload {
    documentType: StudentDocumentType
    url: string
    publicId: string
    fileName: string
}

const documentsKey = (studentId: string) => ['students', studentId, 'documents'] as const

async function fetchStudentDocuments(studentId: string): Promise<StudentDocument[]> {
    if (!studentId || studentId === 'undefined') return []
    const { data } = await apiClient.get<ApiEnvelope<StudentDocument[]>>(
        `/students/${studentId}/documents`,
    )
    return data.data
}

// Exported directly (not just as a hook) so it can be called in a loop
// right after student creation, when there's no stable studentId to bind
// a hook to yet.
export async function attachStudentDocument(
    studentId: string,
    payload: AttachDocumentPayload,
): Promise<StudentDocument> {
    if (!studentId || studentId === 'undefined') {
        throw new Error('Student ID is required to attach a document')
    }
    const { data } = await apiClient.post<ApiEnvelope<StudentDocument>>(
        `/students/${studentId}/documents`,
        payload,
    )
    return data.data
}

async function deleteStudentDocument(studentId: string, documentId: string): Promise<void> {
    if (!studentId || studentId === 'undefined') {
        throw new Error('Student ID is required to delete a document')
    }
    await apiClient.delete(`/students/${studentId}/documents/${documentId}`)
}

export function useStudentDocuments(studentId?: string) {
    const isValidId = Boolean(studentId && studentId !== 'undefined')
    return useQuery({
        queryKey: documentsKey(studentId ?? ''),
        queryFn: () => fetchStudentDocuments(studentId!),
        enabled: isValidId,
    })
}

export function useAttachStudentDocument(studentId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: AttachDocumentPayload) => attachStudentDocument(studentId, payload),
        onSuccess: () => {
            if (studentId && studentId !== 'undefined') {
                queryClient.invalidateQueries({ queryKey: documentsKey(studentId) })
                queryClient.invalidateQueries({ queryKey: [ENDPOINTS.STUDENTS.BASE, studentId] })
            }
        },
    })
}

export function useDeleteStudentDocument(studentId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (documentId: string) => deleteStudentDocument(studentId, documentId),
        onSuccess: () => {
            if (studentId && studentId !== 'undefined') {
                queryClient.invalidateQueries({ queryKey: documentsKey(studentId) })
                queryClient.invalidateQueries({ queryKey: [ENDPOINTS.STUDENTS.BASE, studentId] })
            }
        },
    })
}