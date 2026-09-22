import { ConfigProvider, Steps } from 'antd'
import { colors } from '../../lib/designTokens'

export interface StepBarItem {
  title: string
  subTitle?: string
}

export interface StepBarProps {
  steps: StepBarItem[]
  current: number
  onChange?: (index: number) => void
  freeNavigation?: boolean   // when true, any step is clickable (edit mode)
  style?: React.CSSProperties
}

/**
 * Reusable navigation step bar.
 * Keeps Ant Design's exact default navigation Steps design —
 * only replaces the blue accent with the system green.
 */
export function StepBar({ steps, current, onChange, freeNavigation = false, style }: StepBarProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: colors.primary,
        },
      }}
    >
      <Steps
        type="navigation"
        size="small"
        current={current}
        onChange={(i) => {
          if (freeNavigation || i < current) onChange?.(i)
        }}
        style={{ marginBottom: 24, ...style }}
        items={steps.map((s, i) => ({
          title:    s.title,
          subTitle: s.subTitle,
          status:   i < current ? 'finish' : i === current ? 'process' : 'wait',
          disabled: freeNavigation ? false : i > current,
        }))}
      />
    </ConfigProvider>
  )
}
