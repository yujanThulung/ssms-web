import { useMemo, useState, useEffect } from 'react'
import { Table, Drawer, Checkbox, Input, Space, Tag, Dropdown, Modal, Button, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { MoreOutlined, EyeOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { toast } from 'sonner'
import { usePermission } from '../../context/PermissionContext'
import { DRAWER, colors } from '../../lib/designTokens'
import { FEATURES, ACTIONS } from '../../utils/permissions'
import { useRoles } from '../../features/roles/hooks/useRoles'
import { useRolePermissions } from '../../features/roles/hooks/useRolePermissions'
import { useUpdateRolePermissions } from '../../features/roles/hooks/useUpdateRolePermissions'
import type { Role, RolePermission } from '../../features/roles/types'

export default function PermissionsPage() {
  const { can } = usePermission()
  const canEdit = can(FEATURES.ROLE, ACTIONS.UPDATE)
  const { data: roles = [], isLoading } = useRoles()
  const [viewRole, setViewRole] = useState<Role | null>(null)

  const columns: ColumnsType<Role> = [
    {
      title: 'Role',
      key: 'role',
      render: (_, r) => (
        <Space>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: colors.text }}>
              {r.name.replace('_', ' ')}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>{r.description}</p>
          </div>
          <Tag>{r.userCount ?? 0} users</Tag>
          {r.isSystemRole ? <Tag color="blue">System</Tag> : null}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, r) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'view',
                label: 'View / Edit Permissions',
                icon: <EyeOutlined />,
                onClick: () => setViewRole(r),
              },
              {
                key: 'delete',
                label: 'Delete',
                icon: <DeleteOutlined />,
                danger: true,
                disabled: r.isSystemRole,
                onClick: () => {
                  Modal.confirm({
                    title: `Delete role "${r.name.replace('_', ' ')}"?`,
                    content:
                      'Users assigned to this role will lose their current access. This cannot be undone.',
                    okText: 'Delete',
                    okButtonProps: { danger: true },
                    onOk: () => toast.success(`${r.name.replace('_', ' ')} role deleted`),
                  })
                },
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: colors.text }}>Permissions</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.muted }}>
          Roles and their access across every module of the system
        </p>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={roles}
        loading={isLoading}
        pagination={false}
        onRow={(r) => ({ onClick: () => setViewRole(r), style: { cursor: 'pointer' } })}
      />

      {viewRole && (
        <RolePermissionsDrawer
          role={viewRole}
          canEdit={canEdit}
          onClose={() => setViewRole(null)}
        />
      )}
    </div>
  )
}

function RolePermissionsDrawer({
  role,
  canEdit,
  onClose,
}: {
  role: Role
  canEdit: boolean
  onClose: () => void
}) {
  const { data: permissions = [], isLoading } = useRolePermissions(role.id)
  const { mutate: updatePermissions, isPending: isSaving } = useUpdateRolePermissions()
  const [grantedIds, setGrantedIds] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  // Sync granted IDs when permissions data loads
  useEffect(() => {
    if (permissions) {
      const initialGranted = new Set(
        permissions.filter((p) => p.granted).map((p) => p.id)
      )
      setGrantedIds(initialGranted)
    }
  }, [permissions])

  // Group permissions by feature name
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, RolePermission[]> = {}
    permissions.forEach((p) => {
      const featureKey = p.feature.toLowerCase()
      if (!groups[featureKey]) {
        groups[featureKey] = []
      }
      groups[featureKey].push(p)
    })
    return groups
  }, [permissions])

  // Filter feature groups based on search query
  const filteredFeatures = useMemo(() => {
    const keys = Object.keys(groupedPermissions)
    if (!query.trim()) return keys
    const q = query.toLowerCase()
    return keys.filter(
      (feature) =>
        feature.includes(q) ||
        groupedPermissions[feature].some(
          (p) =>
            p.action.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        )
    )
  }, [groupedPermissions, query])

  const togglePermission = (id: string, checked: boolean) => {
    setGrantedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleGroup = (groupItems: RolePermission[], checked: boolean) => {
    setGrantedIds((prev) => {
      const next = new Set(prev)
      groupItems.forEach((item) => {
        if (checked) next.add(item.id)
        else next.delete(item.id)
      })
      return next
    })
  }

  const handleSave = () => {
    updatePermissions(
      {
        roleId: role.id,
        payload: { permissionIds: Array.from(grantedIds) },
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <Drawer
      title={`${role.name.replace('_', ' ')} permissions`}
      open
      onClose={onClose}
      width={DRAWER.widthXl}
      extra={
        canEdit ? (
          <Button
            type="primary"
            loading={isSaving}
            onClick={handleSave}
            style={{ background: colors.primary, borderColor: colors.primary }}
          >
            Save changes
          </Button>
        ) : null
      }
    >
      <p style={{ marginTop: -8, color: colors.muted, fontSize: 13 }}>{role.description}</p>
      <Input
        allowClear
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search modules or actions…"
        prefix={<SearchOutlined style={{ color: colors.muted }} />}
        style={{ marginBottom: 16 }}
      />

      {isLoading ? (
        <div style={{ display: 'grid', placeItems: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {filteredFeatures.map((feature) => {
            const items = groupedPermissions[feature]
            const allChecked = items.every((item) => grantedIds.has(item.id))

            return (
              <div
                key={feature}
                style={{ border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16 }}
              >
                <div
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: 14,
                        color: colors.text,
                        textTransform: 'capitalize',
                      }}
                    >
                      {feature} Module
                    </p>
                  </div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      color: colors.muted,
                      cursor: 'pointer',
                    }}
                  >
                    <Checkbox
                      checked={allChecked}
                      disabled={!canEdit}
                      onChange={(e) => toggleGroup(items, e.target.checked)}
                    />
                    Select all
                  </label>
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                  }}
                >
                  {items.map((item) => (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      <Checkbox
                        checked={grantedIds.has(item.id)}
                        disabled={!canEdit}
                        onChange={(e) => togglePermission(item.id, e.target.checked)}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <span style={{ fontWeight: 600, color: colors.text }}>{item.action}</span>
                        <p style={{ margin: 0, fontSize: 11, color: colors.muted }}>
                          {item.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
          {filteredFeatures.length === 0 && (
            <p style={{ padding: '40px 0', textAlign: 'center', color: colors.muted, fontSize: 13 }}>
              No permissions match your search.
            </p>
          )}
        </Space>
      )}
    </Drawer>
  )
}