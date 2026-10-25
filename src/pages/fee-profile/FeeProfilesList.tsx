import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { Avatar, Button, Space, Tag, Typography } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import {
  EyeOutlined,
  TeamOutlined,
} from '@ant-design/icons'

import { colors, radius } from '../../lib/designTokens'
import { PageHeader } from '../../components/common/PageHeader'
import { SearchAndFilter } from '../../components/common/SearchAndFilter'
import type { SmartColumn } from '../../components/common/SearchAndFilter'
import { AppTable } from '../../components/common/AppTable'
import { TableSkeleton } from '../../components/skeleton'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useAcademicYears } from '../../features/academic-years'
import { useClasses } from '../../features/classes'
import { useSections } from '../../features/sections'
import { useStudents } from '../../features/students'
import { toListArray } from '../../features/fee-structures'
import type { Student } from '../students/types'

const { Text } = Typography

function fullName(student: Student) {
  return student.fullName ?? [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(' ')
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function enrollmentOf(student: Student) {
  return student.currentEnrollment ?? student.enrollment ?? null
}

export default function FeeProfilesList() {
  const navigate = useNavigate()

  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const [academicYearId, setAcademicYearId] = useQueryState('academicYearId')
  const [classId, setClassId] = useQueryState('classId')
  const [sectionId, setSectionId] = useQueryState('sectionId')
  const [status, setStatus] = useQueryState('status')
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [limit, setLimit] = useQueryState('limit', parseAsInteger.withDefault(10))

  const { data: yearsData, isLoading: yearsLoading } = useAcademicYears({ limit: 100 })
  const { data: classesData, isLoading: classesLoading } = useClasses({
    academicYearId: academicYearId || undefined,
    requireAcademicYear: false,
  })
  const { data: sectionsData, isLoading: sectionsLoading } = useSections({
    classId: classId || undefined,
    requireClassId: false,
  })

  const params = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      academicYearId: academicYearId || undefined,
      classId: classId || undefined,
      sectionId: sectionId || undefined,
      status: (status as Student['status']) || undefined,
      isEnrolled: true,
    }),
    [page, limit, search, academicYearId, classId, sectionId, status],
  )

  const { data, isLoading, isFetching } = useStudents(params)

  const students = data?.data?.items ?? []
  const meta = data?.meta

  const yearOptions = useMemo(
    () => toListArray<{ id: string; name: string; status?: string }>(yearsData).map((year) => ({
      label: `${year.name}${year.status === 'CURRENT' ? ' (Current)' : ''}`,
      value: year.id,
    })),
    [yearsData],
  )

  const classOptions = useMemo(
    () => toListArray<{ id: string; name: string }>(classesData).map((item) => ({
      label: item.name,
      value: item.id,
    })),
    [classesData],
  )

  const sectionOptions = useMemo(
    () => toListArray<{ id: string; name: string }>(sectionsData).map((item) => ({
      label: item.name,
      value: item.id,
    })),
    [sectionsData],
  )

  const filterColumns: SmartColumn[] = [
    { key: 'search', title: 'Student', isSearchable: true },
    {
      key: 'academicYearId',
      title: 'Academic Year',
      isFilterable: true,
      filterWidth: 190,
      filterOptions: yearOptions,
    },
    {
      key: 'classId',
      title: 'Class',
      isFilterable: true,
      filterWidth: 140,
      filterOptions: classOptions,
    },
    {
      key: 'sectionId',
      title: 'Section',
      isFilterable: true,
      filterWidth: 130,
      filterOptions: sectionOptions,
    },
    {
      key: 'status',
      title: 'Status',
      isFilterable: true,
      filterWidth: 140,
      filterOptions: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
        { label: 'Suspended', value: 'SUSPENDED' },
      ],
    },
  ]

  const columns: ColumnsType<Student> = [
    {
      title: 'Student',
      key: 'student',
      width: 250,
      render: (_, student) => {
        const name = fullName(student)
        return (
          <Space size={10}>
            <Avatar
              size={38}
              src={student.photoUrl ?? undefined}
              style={{
                background: colors.primaryLight,
                color: colors.primary,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {!student.photoUrl ? initials(name) : undefined}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ fontSize: 13, display: 'block' }}>{name}</Text>
              <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                {student.admissionNumber}
              </Text>
            </div>
          </Space>
        )
      },
    },
    {
      title: 'Roll No.',
      key: 'rollNumber',
      width: 100,
      render: (_, student) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {enrollmentOf(student)?.rollNumber ?? '—'}
        </Text>
      ),
    },
    {
      title: 'Class / Section',
      key: 'class',
      width: 170,
      render: (_, student) => {
        const enrollment = enrollmentOf(student)
        const className = enrollment?.className ?? enrollment?.class?.name
        const sectionName = enrollment?.sectionName ?? enrollment?.section?.name
        if (!className) return <Text type="secondary">—</Text>
        return (
          <Tag icon={<TeamOutlined />} style={{ borderRadius: radius.sm, margin: 0 }}>
            {className}{sectionName ? ` · ${sectionName}` : ''}
          </Tag>
        )
      },
    },
    {
      title: 'Academic Year',
      key: 'academicYear',
      width: 150,
      render: (_, student) => {
        const enrollment = enrollmentOf(student)
        return (
          <Text style={{ fontSize: 12 }}>
            {enrollment?.academicYearName ?? enrollment?.academicYear?.name ?? '—'}
          </Text>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: Student['status']) => <StatusBadge status={value} />,
    },
    {
      title: '',
      key: 'actions',
      fixed: 'right',
      width: 100,
      align: 'center',
      render: (_, student) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={(event) => {
            event.stopPropagation()
            navigate(`/accounts/fee-profiles/${student.id}`)
          }}
        >
          View
        </Button>
      ),
    },
  ]

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setPage(pagination.current)
    if (pagination.pageSize) {
      setLimit(pagination.pageSize)
      setPage(1)
    }
  }

  return (
    <div>
      <PageHeader
        title="Fee Profiles"
        description="Choose a student to view their fee breakdown."
      />

      <SearchAndFilter
        columns={filterColumns}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        debounceMs={300}
        filterValues={{
          academicYearId: academicYearId || undefined,
          classId: classId || undefined,
          sectionId: sectionId || undefined,
          status: status || undefined,
        }}
        onFilterChange={(key, value) => {
          if (key === 'academicYearId') setAcademicYearId(value || null)
          if (key === 'classId') setClassId(value || null)
          if (key === 'sectionId') setSectionId(value || null)
          if (key === 'status') setStatus(value || null)
          setPage(1)
        }}
        extra={
          <Tag style={{ borderRadius: radius.sm, padding: '4px 10px', margin: 0 }}>
            {meta?.total ?? students.length} students
          </Tag>
        }
      />

      {isLoading || yearsLoading || classesLoading || sectionsLoading ? (
        <div
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <TableSkeleton rows={Math.min(limit, 5)} columns={6} />
        </div>
      ) : (
        <AppTable<Student>
          rowKey="id"
          columns={columns}
          dataSource={students}
          loading={isFetching}
          onChange={handleTableChange}
          onRowClick={(student) => navigate(`/accounts/fee-profiles/${student.id}`)}
          pagination={{
            current: page,
            pageSize: limit,
            total: meta?.total ?? students.length,
            showSizeChanger: true,
          }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: 'No students found for these filters.' }}
        />
      )}
    </div>
  )
}
