import { useState } from 'react'
import { Tabs, Typography } from 'antd'

import { colors } from '../../lib/designTokens'
import DiscountPage from '../discount/DiscountPage'
import ScholarshipPage from '../scholarship/ScholarshipPage'

const { Title, Text } = Typography

/**
 * Single Accounts entry for student fee benefits. Discounts and Scholarships are
 * independent lists but share the same permission, so they sit behind tabs
 * exactly like Fee Structure does.
 */
export default function DiscountScholarshipPage() {
  const [activeTab, setActiveTab] = useState('discounts')

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: colors.text }}>
          Discounts &amp; Scholarships
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Fee reductions and merit awards — independent programs, shared eligibility and beneficiary tracking
        </Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        destroyOnHidden
        size="large"
        items={[
          {
            key: 'discounts',
            label: 'Discounts',
            children: activeTab === 'discounts' ? <DiscountPage /> : null,
          },
          {
            key: 'scholarships',
            label: 'Scholarships',
            children: activeTab === 'scholarships' ? <ScholarshipPage /> : null,
          },
        ]}
      />
    </div>
  )
}