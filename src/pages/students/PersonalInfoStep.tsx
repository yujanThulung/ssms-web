import { Col, Form, Input, Row, Select, Typography } from 'antd'
import { NepaliDatePicker } from '../../components/nepali-calendar'
import { ProfilePicturePicker } from './StudentsPage'
import {
  nameValidationRules,
  dobValidationRules,
  phoneValidationRules,
  emailValidationRules,
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
        <Col span={12}>
          <Form.Item name="parentPhone" label="Parent / Guardian Phone" rules={phoneValidationRules}>
            <Input placeholder="9800000000" maxLength={15} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="parentEmail" label="Parent / Guardian Email" rules={emailValidationRules}>
            <Input placeholder="parent@example.com" type="email" maxLength={100} />
          </Form.Item>
        </Col>
      </Row>
      <Text strong style={{ fontSize: 13 }}>Address</Text>
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
