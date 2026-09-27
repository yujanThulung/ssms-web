import { useState, useEffect } from 'react'
import { Checkbox, Col, Form, Input, Row, Select, Space, Typography } from 'antd'
import { NepaliDatePicker } from '../../components/nepali-calendar'
import { ProfilePicturePicker } from './StudentsPage'
import {
  nameValidationRules,
  dobValidationRules,
  phoneValidationRules,
  optionalPhoneValidationRules,
  emailValidationRules,
  optionalEmailValidationRules,
  addressValidationRules,
} from './studentValidation'

const { Text } = Typography

const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
]

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const BLOOD_GROUP_OPTIONS = BLOOD_GROUPS.map((g) => ({ label: g, value: g }))

interface PersonalInfoStepProps {
  photoUrl: string | null
  onPhotoChange: (url: string | null, publicId: string | null) => void
}

export function PersonalInfoStep({ photoUrl, onPhotoChange }: PersonalInfoStepProps) {
  const form = Form.useFormInstance()
  const [sameAs, setSameAs] = useState<'FATHER' | 'MOTHER' | null>(null)

  const fatherName = Form.useWatch('fatherName', form)
  const motherName = Form.useWatch('motherName', form)
  const parentPhone = Form.useWatch('parentPhone', form)
  const parentEmail = Form.useWatch('parentEmail', form)

  useEffect(() => {
    if (sameAs === 'FATHER') {
      form.setFieldsValue({
        guardianName: fatherName || '',
        guardianRelation: 'Father',
        ...(parentPhone ? { guardianPhone: parentPhone } : {}),
        ...(parentEmail ? { guardianEmail: parentEmail } : {}),
      })
    } else if (sameAs === 'MOTHER') {
      form.setFieldsValue({
        guardianName: motherName || '',
        guardianRelation: 'Mother',
        ...(parentPhone ? { guardianPhone: parentPhone } : {}),
        ...(parentEmail ? { guardianEmail: parentEmail } : {}),
      })
    }
  }, [sameAs, fatherName, motherName, parentPhone, parentEmail, form])

  return (
    <>
      <ProfilePicturePicker
        initialUrl={photoUrl}
        onUploadComplete={(url, publicId) => onPhotoChange(url, publicId)}
      />
      <Text strong style={{ fontSize: 13 }}>Personal Information</Text>
      <Row gutter={16} style={{ marginTop: 12 }}>
        <Col span={8}>
          <Form.Item name="firstName" label="First Name" rules={nameValidationRules('First Name', true)}>
            <Input placeholder="First name" maxLength={50} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="middleName" label="Middle Name" rules={nameValidationRules('Middle Name', false)}>
            <Input placeholder="Middle name" maxLength={50} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="lastName" label="Last Name" rules={nameValidationRules('Last Name', true)}>
            <Input placeholder="Last name" maxLength={50} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="dateOfBirth" label="Date of Birth (BS)" rules={dobValidationRules}>
            <NepaliDatePicker placeholder="मिति छान्नुहोस्" size="middle" locale="ne" zIndex={1100} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="gender" label="Gender" rules={[{ required: true, message: 'Please select gender' }]}>
            <Select placeholder="Select gender" options={GENDER_OPTIONS} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="bloodGroup" label="Blood Group">
            <Select allowClear placeholder="Select blood group" options={BLOOD_GROUP_OPTIONS} />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 }}>
        <Text strong style={{ fontSize: 13 }}>Parent & Guardian Information</Text>
        <Space size="middle">
          <Text type="secondary" style={{ fontSize: 12 }}>Guardian Same As:</Text>
          <Checkbox
            checked={sameAs === 'FATHER'}
            onChange={(e) => setSameAs(e.target.checked ? 'FATHER' : null)}
          >
            Father
          </Checkbox>
          <Checkbox
            checked={sameAs === 'MOTHER'}
            onChange={(e) => setSameAs(e.target.checked ? 'MOTHER' : null)}
          >
            Mother
          </Checkbox>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="fatherName" label="Father Name" rules={nameValidationRules('Father Name', false, 150)}>
            <Input placeholder="Father's full name" maxLength={150} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="motherName" label="Mother Name" rules={nameValidationRules('Mother Name', false, 150)}>
            <Input placeholder="Mother's full name" maxLength={150} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="guardianName" label="Guardian Name" rules={nameValidationRules('Guardian Name', false, 150)}>
            <Input placeholder="Guardian's full name" maxLength={150} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="guardianRelation" label="Guardian Relation" rules={[{ max: 50, message: 'Relation cannot exceed 50 characters' }]}>
            <Input placeholder="e.g. Uncle, Aunt, Grandparent" maxLength={50} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="guardianPhone" label="Guardian Phone" rules={optionalPhoneValidationRules('Guardian Phone')}>
            <Input placeholder="9800000000" maxLength={30} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="guardianEmail" label="Guardian Email" rules={optionalEmailValidationRules(150)}>
            <Input placeholder="guardian@example.com" type="email" maxLength={150} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="parentPhone" label="Primary Parent/Guardian Phone" rules={phoneValidationRules}>
            <Input placeholder="9800000000" maxLength={15} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="parentEmail" label="Primary Parent/Guardian Email" rules={emailValidationRules}>
            <Input placeholder="parent@example.com" type="email" maxLength={100} />
          </Form.Item>
        </Col>
      </Row>

      <Text strong style={{ fontSize: 13, marginTop: 8, display: 'block' }}>Address</Text>
      <Row gutter={16} style={{ marginTop: 12 }}>
        <Col span={12}>
          <Form.Item name="addressPermanent" label="Permanent Address" rules={addressValidationRules('Permanent')}>
            <Input.TextArea rows={2} placeholder="Kathmandu, Nepal" maxLength={200} showCount />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="addressTemporary" label="Temporary Address" rules={addressValidationRules('Temporary')}>
            <Input.TextArea rows={2} placeholder="Lalitpur, Nepal" maxLength={200} showCount />
          </Form.Item>
        </Col>
      </Row>
    </>
  )
}


