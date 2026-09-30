import { Tabs, Typography } from 'antd'
import { colors } from '../../lib/designTokens'
import { ClassFeeStructureTab } from './tab-class/ClassFeeStructureTab'
import { AdditionalFeesTab } from './tab-student/AdditionalFeesTab'

const { Title, Text } = Typography

export default function FeeStructurePage() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: colors.text }}>Fee Structure</Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Class-wide defaults and student-specific add-ons are independent but connected
        </Text>
      </div>

      <Tabs
        defaultActiveKey="class"
        size="large"
        items={[
          {
            key: 'class',
            label: 'Class Fee Structure',
            children: <ClassFeeStructureTab />,
          },
          {
            key: 'student',
            label: 'Student Additional Fees',
            children: <AdditionalFeesTab />,
          },
        ]}
      />
    </div>
  )
}
