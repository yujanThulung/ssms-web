import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Form, Input, message } from 'antd'
import { Landmark } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePermission } from '../../context/PermissionContext'
import { colors } from '../../lib/designTokens'

interface LoginFormValues {
  email: string
  password: string
}

export default function LoginPage() {
  const { login } = useAuth()
  const { user } = usePermission()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<LoginFormValues>()

  // TODO: replace with a real POST /auth/login call once the backend exists.
  // For now this signs in as whichever demo role is currently selected in
  // PermissionContext, so the rest of the app (sidebar, permissions) behaves
  // consistently with what you're previewing.
  async function handleSubmit() {
    setSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      login(user, 'demo-token')
      navigate('/')
    } catch {
      message.error('Invalid credentials. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: colors.surface,
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: '40px 36px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: colors.primary,
              display: 'grid',
              placeItems: 'center',
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(21,128,61,0.3)',
            }}
          >
            <Landmark size={24} color="#ffffff" />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.text }}>SSMS</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: colors.muted }}>
            Sign in to your account
          </p>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} size="large">
          <Form.Item
            label="Email or Username"
            name="email"
            rules={[{ required: true, message: 'Please enter your email or username' }]}
          >
            <Input placeholder="you@school.edu" autoComplete="username" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
            style={{ marginBottom: 24 }}
          >
            <Input.Password placeholder="••••••••" autoComplete="current-password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              style={{
                height: 44,
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 10,
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}