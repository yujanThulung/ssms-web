import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Tabs, Select, Input, Divider, Button, Avatar, Form, Tag } from 'antd'
import { KeyRound, Mail, User, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { useChangePassword, type ChangePasswordPayload } from '../../features/auth/hooks/useChangePassword'
import { colors } from '../../lib/designTokens'

// Shared "card" surface
const cardStyle: React.CSSProperties = {
  backgroundColor: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
}

function Row({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 260px',
        alignItems: 'center',
        gap: 16,
        padding: '16px 0',
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: colors.text }}>{label}</p>
        {hint && <p style={{ margin: '2px 0 0', fontSize: 12, color: colors.muted }}>{hint}</p>}
      </div>
      <div style={{ justifySelf: 'end', width: 260 }}>{children}</div>
    </div>
  )
}

function LastRow(props: Parameters<typeof Row>[0]) {
  return (
    <div style={{ borderBottom: 'none' }}>
      <Row {...props} />
    </div>
  )
}

function ProfileTab() {
  const { user } = useAuth()
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword()
  const [form] = Form.useForm<ChangePasswordPayload>()
  const [pwExpanded, setPwExpanded] = useState(false)

  const displayName = user?.fullName || user?.username || 'User'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U'

  const handleChangePassword = (values: ChangePasswordPayload) => {
    changePassword(values, {
      onSuccess: () => {
        form.resetFields()
        setPwExpanded(false)
      },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>

      {/* ── User Info Card ── */}
      <section style={{ ...cardStyle, padding: '20px 24px' }}>
        <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Account
        </p>

        {/* Avatar + name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Avatar
            size={60}
            style={{ backgroundColor: colors.primary, fontSize: 22, fontWeight: 700, flexShrink: 0 }}
          >
            {initials}
          </Avatar>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.text }}>{displayName}</p>
            <Tag
              style={{
                marginTop: 4,
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: colors.primaryLight,
                color: colors.primary,
                borderColor: colors.primaryBorder,
              }}
            >
              {user?.role?.name?.replace('_', ' ') ?? 'Unknown role'}
            </Tag>
          </div>
        </div>

        <Divider style={{ margin: '0 0 16px' }} />

        {/* Detail rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mail size={14} color={colors.muted} />
            <div>
              <p style={{ margin: 0, fontSize: 11, color: colors.muted }}>Email</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: colors.text }}>{user?.email ?? '—'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={14} color={colors.muted} />
            <div>
              <p style={{ margin: 0, fontSize: 11, color: colors.muted }}>Username</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: colors.text }}>{user?.username ?? '—'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={14} color={colors.muted} />
            <div>
              <p style={{ margin: 0, fontSize: 11, color: colors.muted }}>Account status</p>
              <Tag
                style={{
                  marginTop: 2,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: user?.status === 'ACTIVE' ? colors.primaryLight : '#fef2f2',
                  color: user?.status === 'ACTIVE' ? colors.primary : colors.error,
                  borderColor: user?.status === 'ACTIVE' ? colors.primaryBorder : '#fecaca',
                }}
              >
                {user?.status ?? 'Unknown'}
              </Tag>
            </div>
          </div>
        </div>
      </section>

      {/* ── Change Password Card ── */}
      <section style={{ ...cardStyle, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: pwExpanded ? 20 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: colors.primaryLight,
              display: 'grid',
              placeItems: 'center',
            }}>
              <KeyRound size={15} color={colors.primary} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>Change Password</p>
              <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>Update your account password</p>
            </div>
          </div>
          <Button
            size="small"
            onClick={() => { setPwExpanded((v) => !v); form.resetFields() }}
          >
            {pwExpanded ? 'Cancel' : 'Change'}
          </Button>
        </div>

        {pwExpanded && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="oldPassword"
              label="Current Password"
              rules={[{ required: true, message: 'Enter your current password' }]}
            >
              <Input.Password placeholder="Current password" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Enter a new password' },
                { min: 8, message: 'At least 8 characters' },
              ]}
            >
              <Input.Password placeholder="New password" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your new password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('Passwords do not match'))
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Confirm new password" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isChangingPassword}
                style={{ backgroundColor: colors.primary, borderColor: colors.primary, width: '100%' }}
              >
                {isChangingPassword ? 'Saving…' : 'Save new password'}
              </Button>
            </Form.Item>
          </Form>
        )}
      </section>

    </div>
  )
}

export default function SettingsPage() {
  const location = useLocation()
  const defaultTab = (location.state as { tab?: string } | null)?.tab ?? 'general'



  const items = [
    // {
    //   key: 'general',
    //   label: 'General',
    //   children: (
    //     <section style={{ ...cardStyle, padding: '0 20px' }}>
    //       <Row label="Academic year" hint="Used across billing and reports">
    //         <Select
    //           style={{ width: '100%' }}
    //           defaultValue="2026"
    //           options={[
    //             { value: '2026', label: '2026' },
    //             { value: '2025', label: '2025' },
    //           ]}
    //         />
    //       </Row>
    //       <Row label="Financial year start" hint="Nepali fiscal calendar supported">
    //         <Input type="date" defaultValue="2026-07-16" />
    //       </Row>
    //       <Row label="Currency">
    //         <Select
    //           style={{ width: '100%' }}
    //           defaultValue="NPR"
    //           options={[
    //             { value: 'NPR', label: 'NPR — Nepalese Rupee' },
    //             { value: 'INR', label: 'INR — Indian Rupee' },
    //             { value: 'USD', label: 'USD — US Dollar' },
    //           ]}
    //         />
    //       </Row>
    //       <LastRow label="Restrict collection to finance role" hint="Permissions">
    //         <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
    //           <Switch defaultChecked />
    //         </div>
    //       </LastRow>
    //     </section>
    //   ),
    // },
    // {
    //   key: 'fees',
    //   label: 'Fees & Tax',
    //   children: (
    //     <section style={{ ...cardStyle, padding: 20 }}>
    //       <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>Fee categories</h2>
    //       <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    //         {feeCategories.map((c) => (
    //           <span
    //             key={c}
    //             style={{
    //               borderRadius: 9999,
    //               border: `1px solid ${colors.border}`,
    //               backgroundColor: colors.secondary,
    //               padding: '4px 12px',
    //               fontSize: 12,
    //               color: colors.secondaryText,
    //             }}
    //           >
    //             {c}
    //           </span>
    //         ))}
    //       </div>
    //       <Divider style={{ margin: '20px 0' }} />
    //       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
    //         <div>
    //           <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 500, color: colors.text }}>VAT rate (%)</p>
    //           <Input defaultValue="13" inputMode="numeric" />
    //         </div>
    //         <div>
    //           <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 500, color: colors.text }}>
    //             Late fine per day
    //           </p>
    //           <Input defaultValue="50" inputMode="numeric" />
    //         </div>
    //       </div>
    //     </section>
    //   ),
    // },
    {
      key: 'profile',
      label: 'Profile',
      children: <ProfileTab />,
    },
    {
      key: 'templates',
      label: 'Templates',
      children: (
        <section style={{ ...cardStyle, padding: '0 20px' }}>
          <Row label="Receipt template" hint="Printed after every collection">
            <Select
              style={{ width: '100%' }}
              defaultValue="compact"
              options={[
                { value: 'compact', label: 'Compact thermal' },
                { value: 'a5', label: 'A5 letterhead' },
              ]}
            />
          </Row>
          <LastRow label="Invoice template">
            <Select
              style={{ width: '100%' }}
              defaultValue="modern"
              options={[
                { value: 'modern', label: 'Modern' },
                { value: 'classic', label: 'Classic' },
              ]}
            />
          </LastRow>
        </section>
      ),
    },
    // {
    //   key: 'payments',
    //   label: 'Payments',
    //   children: (
    //     <section style={{ ...cardStyle, padding: '0 20px' }}>
    //       {paymentMethods.map((m) => (
    //         <Row key={m} label={m} hint="Enable as a collection channel">
    //           <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
    //             <Switch defaultChecked={m !== 'Cheque'} />
    //           </div>
    //         </Row>
    //       ))}
    //       <LastRow label="Bank account" hint="Primary settlement account">
    //         <Input defaultValue="NIC Asia · 0110xxxx4421" />
    //       </LastRow>
    //     </section>
    //   ),
    // },
    // {
    //   key: 'notifications',
    //   label: 'Notifications',
    //   children: (
    //     <section style={{ ...cardStyle, padding: '0 20px' }}>
    //       {notificationEvents.map((n, i) =>
    //         i === notificationEvents.length - 1 ? (
    //           <LastRow key={n} label={n} hint="Email · SMS · Push">
    //             <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
    //               <Switch defaultChecked />
    //             </div>
    //           </LastRow>
    //         ) : (
    //           <Row key={n} label={n} hint="Email · SMS · Push">
    //             <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
    //               <Switch defaultChecked />
    //             </div>
    //           </Row>
    //         ),
    //       )}
    //     </section>
    //   ),
    // },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: colors.text }}>Settings</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.muted }}>
            Configure how the accounts module behaves
          </p>
        </div>
        <Button
          type="primary"
          style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
          onClick={() => toast.success('Settings saved')}
        >
          Save changes
        </Button>
      </div>

      <Tabs defaultActiveKey={defaultTab} items={items} />
    </div>
  )
}