import { useState } from 'react'
import {
    Button,
    Drawer,
    Form,
    Input,
    Select,
    Tag,
    Space,
    Typography,
    message,
} from 'antd'
import { Plus, Search, UserPlus } from 'lucide-react'

import { AppTable } from '../../components/common/AppTable'
import { TableSkeleton } from '../../components/skeleton/TableSkeleton'
import { useList } from '../../lib/api/hooks/useList'
import { usePost } from '../../lib/api/hooks/usePost'
import { ENDPOINTS } from '../../lib/api/endpoints'
import { colors } from '../../lib/designTokens'

const { Title, Text } = Typography

export interface UserRole {
    id?: string | number
    name: string
    description?: string
    isSystemRole?: boolean
}

export interface User {
    id: string | number
    username: string
    email: string
    fullName: string
    role: UserRole | string
    createdAt?: string
}

export interface CreateUserInput {
    email: string
    username: string
    password?: string
    fullName: string
    role: string
}

// Static dropdown options for role selection
const ROLE_OPTIONS = [
    { label: 'Super Admin', value: 'SUPER_ADMIN' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Accountant', value: 'ACCOUNTANT' },
    { label: 'Teacher', value: 'TEACHER' },
]

// Tag colors for roles
const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: 'magenta',
    ADMIN: 'blue',
    ACCOUNTANT: 'green',
    TEACHER: 'orange',
}

export default function UsersPage() {
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [search, setSearch] = useState('')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const [form] = Form.useForm<CreateUserInput>()

    // Fetch users list: GET /users?page=1&limit=10
    const { data: usersData, isLoading } = useList<User>(ENDPOINTS.USERS.BASE, {
        page,
        limit,
        search: search || undefined,
    })

    // Create user mutation: POST /users
    const createUserMutation = usePost<CreateUserInput, User>(
        ENDPOINTS.USERS.BASE,
        [ENDPOINTS.USERS.BASE]
    )

    const handleOpenDrawer = () => {
        form.resetFields()
        setIsDrawerOpen(true)
    }

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false)
        form.resetFields()
    }

    const handleCreateUser = async (values: CreateUserInput) => {
        try {
            await createUserMutation.mutateAsync(values)
            message.success('User created successfully!')
            handleCloseDrawer()
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || 'Failed to create user'
            message.error(errorMsg)
        }
    }

    // AppTable Column Definitions (with lighter text color)
    const columns = [
        {
            title: 'Full Name',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text: string) => (
                <span style={{ fontWeight: 500, color: colors.textSecondary }}>
                    {text || 'N/A'}
                </span>
            ),
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            render: (text: string) => (
                <span style={{ color: colors.textSecondary }}>{text}</span>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (text: string) => (
                <span style={{ color: colors.textSecondary }}>{text}</span>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: UserRole | string | undefined) => {
                const roleName =
                    typeof role === 'object' && role !== null
                        ? role.name
                        : (role ?? 'N/A')

                return (
                    <Tag color={ROLE_COLORS[roleName] || 'default'} style={{ fontWeight: 500 }}>
                        {roleName}
                    </Tag>
                )
            },
        },
    ]

    return (
        <div style={{ padding: 24 }}>
            {/* Top Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                    flexWrap: 'wrap',
                    gap: 12,
                }}
            >
                <div>
                    <Title level={4} style={{ margin: 0, color: colors.text }}>
                        User Management
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Manage users, view access roles, and invite team members.
                    </Text>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={handleOpenDrawer}
                    style={{
                        backgroundColor: colors.primary,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    Add User
                </Button>
            </div>

            {/* Filter / Search Bar */}
            <div style={{ marginBottom: 16, maxWidth: 320 }}>
                <Input
                    placeholder="Search users..."
                    prefix={<Search size={16} color={colors.muted} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    allowClear
                />
            </div>

            {/* Skeleton Loading or Table Component */}
            {isLoading ? (
                <TableSkeleton rows={limit} columns={4} />
            ) : (
                <AppTable<User>
                    rowKey="id"
                    dataSource={usersData?.data || []}
                    columns={columns}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total: usersData?.total || 0,
                        showSizeChanger: true,
                        onChange: (p, l) => {
                            setPage(p)
                            setLimit(l)
                        },
                    }}
                />
            )}

            {/* Add User Drawer Form */}
            <Drawer
                title={
                    <Space>
                        <UserPlus size={18} color={colors.primary} />
                        <span>Add New User</span>
                    </Space>
                }
                size="large"
                onClose={handleCloseDrawer}
                open={isDrawerOpen}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateUser}
                    requiredMark="optional"
                    preserve={false}
                >
                    <Form.Item
                        name="fullName"
                        label="Full Name"
                        rules={[{ required: true, message: 'Please enter full name' }]}
                    >
                        <Input placeholder="e.g. Test Accountant" />
                    </Form.Item>

                    <Form.Item
                        name="username"
                        label="Username"
                        rules={[{ required: true, message: 'Please enter username' }]}
                    >
                        <Input placeholder="e.g. accountant1" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Please enter email' },
                            { type: 'email', message: 'Please enter a valid email' },
                        ]}
                    >
                        <Input placeholder="e.g. accountant1@school.com" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, message: 'Please enter password' }]}
                    >
                        <Input.Password placeholder="Enter initial password" />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Please select a role' }]}
                    >
                        <Select placeholder="Select role" options={ROLE_OPTIONS} />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={handleCloseDrawer}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={createUserMutation.isPending}
                                style={{ backgroundColor: colors.primary }}
                            >
                                Create User
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    )
}
