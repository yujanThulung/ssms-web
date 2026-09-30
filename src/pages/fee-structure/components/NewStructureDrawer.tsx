import { useMemo } from 'react'
import { Alert, Button, Drawer, Form, Select, Space, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { toast } from 'sonner'

import { colors, DRAWER } from '../../../lib/designTokens'
import { useAcademicYears } from '../../../features/academic-years'
import { useClasses } from '../../../features/classes'
import type { AcademicYear } from '../../../features/academic-years'
import type { SchoolClass } from '../../../features/classes'
import { FEE_STRUCTURE_STATUS_LABEL, toListArray, useFindOrCreateFeeStructure } from '../../../features/fee-structures'
import type { StructureTarget } from '../target'

const { Text } = Typography

export interface NewStructureDrawerProps {
  onClose: () => void
  onCreated: (target: StructureTarget) => void
}

/** Mounted only while open, so the form always starts blank. */
export function NewStructureDrawer({ onClose, onCreated }: NewStructureDrawerProps) {
  const [form] = Form.useForm<{ academicYearId: string; classId: string }>()

  // Derived from the form so there is no parallel copy to keep in sync.
  const academicYearId = Form.useWatch('academicYearId', form)
  const classId = Form.useWatch('classId', form)

  const { data: yearData, isLoading: isLoadingYears } = useAcademicYears({ limit: 100 })
  const { data: classData, isFetching: isLoadingClasses } = useClasses({ academicYearId })

  const { mutateAsync: findOrCreate, isPending } = useFindOrCreateFeeStructure()

  const years = useMemo<AcademicYear[]>(() => toListArray<AcademicYear>(yearData), [yearData])
  const classes = useMemo<SchoolClass[]>(() => toListArray<SchoolClass>(classData), [classData])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const response = await findOrCreate({
        academicYearId: values.academicYearId,
        classId: values.classId,
      })

      const created = response?.data
      if (created?.status && created.status !== 'DRAFT') {
        toast.info(
          `This class already has a ${FEE_STRUCTURE_STATUS_LABEL[created.status].toLowerCase()} fee structure — opening it.`,
        )
      } else {
        toast.success('Draft fee structure created')
      }

      onCreated({
        classId: values.classId,
        className: classes.find((c) => c.id === values.classId)?.name ?? 'Fee Structure',
        academicYearId: values.academicYearId,
        academicYearName: years.find((y) => y.id === values.academicYearId)?.name ?? '—',
        structureId: created?.id ?? null,
      })
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      toast.error((err as Error)?.message ?? 'Failed to start fee structure setup')
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      size={DRAWER.widthLg}
      title={
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>New Fee Structure</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Pick the class and academic year to start building its default fee heads
          </Text>
        </div>
      }
      extra={
        <Space>
          <Button onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={isPending}
            disabled={!academicYearId || !classId}
            onClick={handleOk}
            style={{ background: colors.primary }}
          >
            Start Setup
          </Button>
        </Space>
      }
      styles={{ body: { padding: 20 } }}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          style={{ background: colors.surfaceAlt }}
          message={
            <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 1.5 }}>
              A fee structure belongs to a <Text strong>class</Text> and automatically applies to
              every section in that class. Starting setup creates a DRAFT you can edit freely until
              it is submitted for approval.
            </Text>
          }
        />

        <Form form={form} layout="vertical" requiredMark>
          <Form.Item
            name="academicYearId"
            label="Academic Year"
            rules={[{ required: true, message: 'Select an academic year' }]}
          >
            <Select
              placeholder="Select academic year"
              loading={isLoadingYears}
              onChange={() => form.setFieldsValue({ classId: undefined })}
              options={years.map((year) => ({
                value: year.id,
                label: year.status === 'CURRENT' ? `${year.name} (Current)` : year.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="classId"
            label="Class"
            rules={[{ required: true, message: 'Select a class' }]}
          >
            <Select
              placeholder={academicYearId ? 'Select class' : 'Select an academic year first'}
              disabled={!academicYearId}
              loading={isLoadingClasses}
              showSearch
              optionFilterProp="label"
              options={classes.map((item) => ({ value: item.id, label: item.name }))}
              notFoundContent={
                academicYearId
                  ? 'No classes found for this academic year'
                  : 'Select an academic year first'
              }
            />
          </Form.Item>
        </Form>
      </Space>
    </Drawer>
  )
}
