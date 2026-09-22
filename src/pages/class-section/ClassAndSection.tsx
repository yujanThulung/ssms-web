import { useEffect, useState } from "react";
import {
  Table,
  Drawer,
  Button,
  Space,
  Select,
  Form,
  InputNumber,
  Row,
  Col,
  Descriptions,
  Avatar,
  Tabs,
  Typography,
  Input,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  BookOutlined,
  TeamOutlined,
  UserOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { colors, DRAWER, radius } from "../../lib/designTokens";
import { usePermission } from "../../context/PermissionContext";
import { FEATURES, ACTIONS } from "../../utils/permissions";
import { StatusBadge } from "../../components/common/StatusBadge";
import { AppTable } from "../../components/common/AppTable";
import { SearchAndFilter } from "../../components/common/SearchAndFilter";
import { StatCard } from "../../components/common/StatCard";
import { ENDPOINTS } from "../../lib/api/endpoints";
import { useGet } from "../../lib/api/hooks/useGet";
import type { ApiPaginatedResponse } from "../../lib/api/types";
import { useAcademicYears } from "../../features/academic-years";
import type { AcademicYear } from "../../features/academic-years";
import { useClasses, useClass, useCreateClass, useUpdateClass } from "../../features/classes";
import type { SchoolClass } from "../../features/classes";
import { useSections, useSection, useCreateSection, useUpdateSection } from "../../features/sections";
import type { Section } from "../../features/sections";
import { MOCK_TEACHERS } from "./mockData";
import { TableSkeleton } from "../../components/skeleton";

const { Title, Text } = Typography;

// ─── Helpers

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}



// ─── Mock student data (replace when student module is ready) ─────────────────

interface MockStudent {
  id: string;
  name: string;
  admissionNo: string;
  gender: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
}

const MOCK_STUDENTS: MockStudent[] = [
  {
    id: "stu-1",
    name: "Aarav Sharma",
    admissionNo: "ADM-001",
    gender: "Male",
    phone: "9841000001",
    status: "ACTIVE",
  },
  {
    id: "stu-2",
    name: "Priya Thapa",
    admissionNo: "ADM-002",
    gender: "Female",
    phone: "9841000002",
    status: "ACTIVE",
  },
  {
    id: "stu-3",
    name: "Rohan Adhikari",
    admissionNo: "ADM-003",
    gender: "Male",
    phone: "9841000003",
    status: "ACTIVE",
  },
  {
    id: "stu-4",
    name: "Sita Rai",
    admissionNo: "ADM-004",
    gender: "Female",
    phone: "9841000004",
    status: "INACTIVE",
  },
];

//  MAIN PAGE

export default function ClassAndSection() {
  const { can } = usePermission();
  const canCreate = can(FEATURES.CLASS_SECTION, ACTIONS.CREATE);
  const canUpdate = can(FEATURES.CLASS_SECTION, ACTIONS.UPDATE);
  const canDelete = can(FEATURES.CLASS_SECTION, ACTIONS.DELETE);
  const canCreateSection = can(FEATURES.CLASS_SECTION, ACTIONS.CREATE);

  const [activeTab, setActiveTab] = useState("classes");
  const [classDrawer, setClassDrawer] = useState(false);
  const [sectionDrawer, setSectionDrawer] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [editingSection, setEditingSection] = useState<Partial<Section> | null>(
    null,
  );
  const [viewClass, setViewClass] = useState<SchoolClass | null>(null);
  const [viewSection, setViewSection] = useState<Section | null>(null);

  const [classCounts, setClassCounts] = useState({ total: 0, active: 0 });
  const [sectionCounts, setSectionCounts] = useState({ total: 0, active: 0 });
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<
    string | undefined
  >(undefined);

  const kpiCards = [
    {
      icon: <BookOutlined />,
      label: "Total Classes",
      value: classCounts.total,
      color: colors.primary,
      bg: colors.primaryLight,
    },
    {
      icon: <AppstoreOutlined />,
      label: "Active Classes",
      value: classCounts.active,
      color: colors.success,
      bg: colors.successLight,
    },
    {
      icon: <TeamOutlined />,
      label: "Total Sections",
      value: sectionCounts.total,
      color: colors.info,
      bg: colors.infoLight,
    },
    {
      icon: <AppstoreOutlined />,
      label: "Active Sections",
      value: sectionCounts.active,
      color: colors.success,
      bg: colors.successLight,
    },
  ];

  const openAddClass = () => {
    setEditingClass(null);
    setClassDrawer(true);
  };
  const openEditClass = (c: SchoolClass) => {
    setEditingClass(c);
    setClassDrawer(true);
  };
  const openAddSection = (c?: SchoolClass) => {
    setEditingSection(c ? { classId: c.id } : null);
    setSectionDrawer(true);
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: colors.text }}>
            Classes &amp; Sections
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Configure classes and sections for each academic year
          </Text>
        </div>
        <Space>
          {canCreateSection && (
            <Button icon={<PlusOutlined />} onClick={() => openAddSection()}>
              Add Section
            </Button>
          )}
          {canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: colors.primary }}
              onClick={openAddClass}
            >
              Add Class
            </Button>
          )}
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {kpiCards.map((kpi) => (
          <Col key={kpi.label} xs={12} sm={8} md={6} lg={4}>
            <StatCard
              variant="default"
              size="middle"
              label={kpi.label}
              value={kpi.value}
              icon={kpi.icon}
              color={kpi.color}
              iconBg={kpi.bg}
            />
          </Col>
        ))}
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "classes",
            label: "Classes",
            children: (
              <ClassesTab
                canUpdate={canUpdate}
                canDelete={canDelete}
                canCreateSection={canCreateSection}
                onEdit={openEditClass}
                onView={(c) => setViewClass(c)}
                onAddSection={openAddSection}
                onCountsChange={setClassCounts}
                onAcademicYearChange={setSelectedAcademicYearId}
              />
            ),
          },
          {
            key: "sections",
            label: "Sections",
            children: (
              <SectionsTab
                canUpdate={canUpdate}
                onEdit={(s) => {
                  setEditingSection(s);
                  setSectionDrawer(true);
                }}
                onView={(s) => setViewSection(s)}
                onCountsChange={setSectionCounts}
              />
            ),
          },
        ]}
      />

      {/* Drawers */}
      <ClassFormDrawer
        open={classDrawer}
        academicYearId={selectedAcademicYearId}
        editing={editingClass}
        onClose={() => {
          setClassDrawer(false);
          setEditingClass(null);
        }}
      />
      <SectionFormDrawer
        open={sectionDrawer}
        academicYearId={selectedAcademicYearId}
        editing={editingSection}
        onClose={() => {
          setSectionDrawer(false);
          setEditingSection(null);
        }}
      />
      <ClassDetailDrawer
        schoolClass={viewClass}
        canUpdate={canUpdate}
        canCreateSection={canCreateSection}
        onClose={() => setViewClass(null)}
        onEdit={(c) => {
          setViewClass(null);
          openEditClass(c);
        }}
        onAddSection={(c) => {
          setViewClass(null);
          openAddSection(c);
        }}
        onViewSection={(s) => {
          setViewClass(null);
          setViewSection(s);
        }}
      />
      <SectionDetailDrawer
        section={viewSection}
        canUpdate={canUpdate}
        onClose={() => setViewSection(null)}
        onEdit={(s) => {
          setViewSection(null);
          setEditingSection(s);
          setSectionDrawer(true);
        }}
      />
    </div>
  );
}

//  CLASSES TAB

function ClassesTab({
  canUpdate,
  canCreateSection,
  onEdit,
  onView,
  onAddSection,
  onCountsChange,
  onAcademicYearChange,
}: {
  canUpdate: boolean;
  canDelete: boolean;
  canCreateSection: boolean;
  onEdit: (c: SchoolClass) => void;
  onView: (c: SchoolClass) => void;
  onAddSection: (c: SchoolClass) => void;
  onCountsChange: (counts: { total: number; active: number }) => void;
  onAcademicYearChange: (id: string | undefined) => void;
}) {
  const [q, setQ] = useState("");
  const [filterValues, setFilterValues] = useState<
    Record<string, string | undefined>
  >({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const statusFilter = filterValues["status"];
  const academicYearId = filterValues["academicYearId"];

  const { data: academicYearsResponse } = useAcademicYears();
  const academicYears = academicYearsResponse?.data ?? [];

  useEffect(() => {
    onAcademicYearChange(academicYearId);
  }, [academicYearId]);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
  });
  if (q) queryParams.append("search", q);
  if (statusFilter) queryParams.append("status", statusFilter);
  if (academicYearId) queryParams.append("academicYearId", academicYearId);

  const queryKey = `${ENDPOINTS.CLASSES.BASE}?${queryParams.toString()}`;
  const {
    data: listResponse,
    isLoading,
    isFetching,
  } = useGet<ApiPaginatedResponse<SchoolClass>>(queryKey);

  const rows = listResponse?.data ?? [];
  const meta = listResponse?.meta;

  useEffect(() => {
    onCountsChange({
      total: meta?.total ?? 0,
      active: rows.filter((c) => c.status === "ACTIVE").length,
    });
  }, [rows, meta?.total]);

  // const handleDelete = (c: SchoolClass) => {
  //   appConfirm({
  //     title: `Delete ${c.name}?`,
  //     content: 'This cannot be undone.',
  //     okText: 'Delete',
  //     okColor: 'danger',
  //     cancelText: 'Cancel',
  //     onOk: async () => {
  //       try {
  //         await client.delete(ENDPOINTS.CLASSES.DETAIL(c.id))
  //         toast.success(`${c.name} deleted`)
  //         invalidateClasses()
  //       } catch (err: any) {
  //         toast.error(err?.message || 'Failed to delete class')
  //       }
  //     },
  //   })
  // }

  const filterColumns = [
    { key: "name", title: "Class Name", isSearchable: true },
    {
      key: "academicYearId",
      title: "Academic Year",
      isFilterable: true,
      filterWidth: 200,
      filterOptions: academicYears.map((y) => ({
        label: `${y.name}${y.status === "CURRENT" ? " (Current)" : ""}`,
        value: y.id,
      })),
    },
    {
      key: "status",
      title: "Status",
      isFilterable: true,
      filterWidth: 130,
      filterOptions: [
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive", value: "INACTIVE" },
      ],
    },
  ];

  const columns: ColumnsType<SchoolClass> = [
    {
      title: "Class Name",
      dataIndex: "name",
      sorter: true,
      render: (name: string) => (
        <Space>
          <Avatar
            size={32}
            style={{
              background: colors.primaryLight,
              color: colors.primary,
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            {initials(name)}
          </Avatar>
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: "Code",
      dataIndex: "code",
      sorter: true,
      render: (v: string) => (
        <span style={{ fontFamily: "monospace" }}>{v}</span>
      ),
    },
    {
      title: "Academic Year",
      key: "academicYear",
      render: (_: unknown, c: SchoolClass) => c.academicYear?.name ?? "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      sorter: true,
      render: (v: string) => (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>
          {new Date(v).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      align: "center",
      render: (_: unknown, c: SchoolClass) => (
        <Space size={6} onClick={(e) => e.stopPropagation()}>
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            title="View Details"
            onClick={() => onView(c)}
            style={{
              borderRadius: radius.sm,
              borderColor: colors.border,
              color: colors.muted,
            }}
          />
          {canCreateSection && (
            <Button
              type="default"
              size="small"
              icon={<PlusOutlined />}
              title="Add Section"
              onClick={() => onAddSection(c)}
              style={{
                borderRadius: radius.sm,
                borderColor: colors.border,
                color: colors.muted,
              }}
            />
          )}
          {canUpdate && (
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              title="Edit"
              onClick={() => onEdit(c)}
              style={{
                borderRadius: radius.sm,
                borderColor: colors.border,
                color: colors.muted,
              }}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <SearchAndFilter
        columns={filterColumns}
        searchValue={q}
        onSearchChange={setQ}
        debounceMs={300}
        filterValues={filterValues}
        onFilterChange={(key, value) => {
          setFilterValues((prev) => ({ ...prev, [key]: value }));
          setPage(1);
        }}
      />
      {isLoading ? (
        <div
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <TableSkeleton rows={Math.min(limit, 5)} columns={5} />
        </div>
      ) : (
        <AppTable<SchoolClass>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          onRowClick={(c) => onView(c)}
          onChange={(pagination, _filters, sorter: any) => {
            setPage(pagination.current || 1);
            setLimit(pagination.pageSize || 10);
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            if (s?.field && s?.order) {
              setSortBy(s.field as string);
              setSortOrder(s.order === "ascend" ? "ASC" : "DESC");
            } else {
              setSortBy("name");
              setSortOrder("DESC");
            }
          }}
          pagination={{
            current: page,
            pageSize: limit,
            total: meta?.total ?? 0,
            showSizeChanger: true,
          }}
          scroll={{ x: 800 }}
          locale={{ emptyText: "No classes found." }}
        />
      )}
    </>
  );
}

// SECTIONS TAB

function SectionsTab({
  canUpdate,
  onEdit,
  onView,
  onCountsChange,
}: {
  canUpdate: boolean;
  onEdit: (s: Section) => void;
  onView: (s: Section) => void;
  onCountsChange: (counts: { total: number; active: number }) => void;
}) {
  const [q, setQ] = useState("");
  const [filterValues, setFilterValues] = useState<
    Record<string, string | undefined>
  >({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const statusFilter = filterValues["status"];
  const classId = filterValues["classId"];

  // Classes for the classId filter dropdown
  const { data: classesResponse } = useClasses({ requireAcademicYear: false });
  const classesForFilter = classesResponse?.data ?? [];

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
  });
  if (q) queryParams.append("search", q);
  if (statusFilter) queryParams.append("status", statusFilter);
  if (classId) queryParams.append("classId", classId);

  const queryKey = `${ENDPOINTS.SECTIONS.BASE}?${queryParams.toString()}`;
  const {
    data: listResponse,
    isLoading,
    isFetching,
  } = useGet<ApiPaginatedResponse<Section>>(queryKey);

  const rows = listResponse?.data ?? [];
  const meta = listResponse?.meta;

  useEffect(() => {
    onCountsChange({
      total: meta?.total ?? 0,
      active: rows.filter((s) => s.status === "ACTIVE").length,
    });
  }, [rows, meta?.total]);

  const filterColumns = [
    { key: "name", title: "Section", isSearchable: true },
    {
      key: "classId",
      title: "Class",
      isFilterable: true,
      filterWidth: 180,
      filterOptions: classesForFilter.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    },
    {
      key: "status",
      title: "Status",
      isFilterable: true,
      filterWidth: 130,
      filterOptions: [
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive", value: "INACTIVE" },
      ],
    },
  ];

  const columns: ColumnsType<Section> = [
    {
      title: "Section",
      key: "section",
      dataIndex: "name",
      sorter: true,
      render: (_: unknown, s: Section) => (
        <Space>
          <Avatar
            size={32}
            style={{
              background: colors.primaryLight,
              color: colors.primary,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {s.name}
          </Avatar>
          <span style={{ fontWeight: 500 }}>Section {s.name}</span>
        </Space>
      ),
    },
    {
      title: "Code",
      dataIndex: "code",
      sorter: true,
      render: (v: string) => (
        <span style={{ fontFamily: "monospace" }}>{v}</span>
      ),
    },
    {
      title: "Class",
      key: "class",
      render: (_: unknown, s: Section) => s.class?.name ?? "—",
    },
    {
      title: "Capacity",
      dataIndex: "capacity",
      width: 100,
      render: (v: number | null) =>
        v != null ? v : <span style={{ color: colors.muted }}>—</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 110,
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      sorter: true,
      render: (v: string) => (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>
          {new Date(v).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 90,
      align: "center",
      render: (_: unknown, s: Section) => (
        <Space size={6} onClick={(e) => e.stopPropagation()}>
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            title="View Details"
            onClick={() => onView(s)}
            style={{
              borderRadius: radius.sm,
              borderColor: colors.border,
              color: colors.muted,
            }}
          />
          {canUpdate && (
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              title="Edit"
              onClick={() => onEdit(s)}
              style={{
                borderRadius: radius.sm,
                borderColor: colors.border,
                color: colors.muted,
              }}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <SearchAndFilter
        columns={filterColumns}
        searchValue={q}
        onSearchChange={setQ}
        debounceMs={300}
        filterValues={filterValues}
        onFilterChange={(key, value) => {
          // Clearing academic year should also clear classId
          if (key === "academicYearId") {
            setFilterValues((prev) => ({
              ...prev,
              classId: undefined,
            }));
          } else {
            setFilterValues((prev) => ({ ...prev, [key]: value }));
          }
          setPage(1);
        }}
      />
      {isLoading ? (
        <div
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <TableSkeleton rows={Math.min(limit, 5)} columns={5} />
        </div>
      ) : (
        <AppTable<Section>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          onRowClick={(s) => onView(s)}
          onChange={(pagination, _filters, sorter: any) => {
            setPage(pagination.current || 1);
            setLimit(pagination.pageSize || 10);
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            if (s?.field && s?.order) {
              setSortBy(s.field as string);
              setSortOrder(s.order === "ascend" ? "ASC" : "DESC");
            } else {
              setSortBy("name");
              setSortOrder("ASC");
            }
          }}
          pagination={{
            current: page,
            pageSize: limit,
            total: meta?.total ?? 0,
            showSizeChanger: true,
          }}
          scroll={{ x: 800 }}
          locale={{ emptyText: "No sections found." }}
        />
      )}
    </>
  );
}

//  CLASS FORM DRAWER

type ClassFormValues = {
  name: string;
  academicYearId: string;
  status: "ACTIVE" | "INACTIVE";
};

function ClassFormDrawer({
  open,
  academicYearId,
  editing,
  onClose,
}: {
  open: boolean;
  academicYearId: string | undefined;
  editing: SchoolClass | null;
  onClose: () => void;
}) {
  const [form] = Form.useForm<ClassFormValues>();
  const isEditing = Boolean(editing);

  const { data: academicYearsResponse } = useAcademicYears();
  const academicYears = academicYearsResponse?.data ?? [];

  const { mutateAsync: createClass, isPending: isCreating } = useCreateClass();
  const { mutateAsync: updateClass, isPending: isUpdating } = useUpdateClass(editing?.id ?? "");
  const isSubmitting = isCreating || isUpdating;

  const onOpen = () => {
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        status: editing.status,
        academicYearId: editing.academicYearId,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: "ACTIVE",
        ...(academicYearId ? { academicYearId } : {}),
      });
    }
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name.trim(),
        status: values.status,
        academicYearId: values.academicYearId,
      };
      if (isEditing && editing) {
        await updateClass(payload);
        toast.success(`${values.name} updated`);
      } else {
        await createClass(payload);
        toast.success(`${values.name} created`);
      }
      form.resetFields();
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return;
      toast.error(err?.message || "Operation failed");
    }
  };

  return (
    <Drawer
      title={isEditing ? "Edit Class" : "Add Class"}
      open={open}
      onClose={() => {
        form.resetFields();
        onClose();
      }}
      size={DRAWER.width}
      afterOpenChange={(v) => v && onOpen()}
      extra={
        <Space>
          <Button
            onClick={() => {
              form.resetFields();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            style={{ background: colors.primary }}
            loading={isSubmitting}
            onClick={onSubmit}
          >
            {isEditing ? "Save Changes" : "Create Class"}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Typography.Text strong style={{ fontSize: 13 }}>
          Class Information
        </Typography.Text>
        <p style={{ margin: "4px 0 16px", fontSize: 12, color: colors.muted }}>
          Basic details that identify this class.
        </p>

        <Form.Item
          name="name"
          label="Class Name"
          rules={[
            { required: true, message: "Class name is required" },
            { max: 100, message: "Max 100 characters" },
          ]}
        >
          <Input placeholder="e.g. Class 1, Grade 10, Nursery" />
        </Form.Item>

        <Form.Item
          name="academicYearId"
          label="Academic Year"
          rules={[{ required: true, message: "Academic year is required" }]}
        >
          <Select
            placeholder="Select academic year"
            options={academicYears.map((y) => ({
              label: `${y.name}${y.status === "CURRENT" ? " (Current)" : ""}`,
              value: y.id,
            }))}
          />
        </Form.Item>

        <Typography.Text strong style={{ fontSize: 13 }}>
          Configuration
        </Typography.Text>
        <div style={{ marginTop: 12 }}>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "Active", value: "ACTIVE" },
                { label: "Inactive", value: "INACTIVE" },
              ]}
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
}

//  SECTION FORM DRAWER

type SectionFormValues = {
  classId: string;
  name: string;
  capacity: number | null;
  status: "ACTIVE" | "INACTIVE";
};

function SectionFormDrawer({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  academicYearId: string | undefined;
  editing: Partial<Section> | null;
  onClose: () => void;
}) {
  const [form] = Form.useForm<SectionFormValues>();
  const isEditing = Boolean(editing?.id);

  // Fetch all active classes once — response includes nested academicYear
  const { data: classesResponse } = useClasses({ requireAcademicYear: false });
  const allActiveClasses = classesResponse?.data ?? [];

  // Derive unique academic years from the classes response
  const academicYearsFromClasses = allActiveClasses.reduce<AcademicYear[]>(
    (acc, c) => {
      if (c.academicYear && !acc.find((y) => y.id === c.academicYear!.id)) {
        acc.push(c.academicYear);
      }
      return acc;
    },
    [],
  );

  const [selectedYearId, setSelectedYearId] = useState<string | undefined>(undefined);

  const currentYear = academicYearsFromClasses.find((y) => y.status === "CURRENT");
  const effectiveYearId = selectedYearId ?? currentYear?.id ?? academicYearsFromClasses[0]?.id;

  const activeClasses = allActiveClasses.filter(
    (c) => c.academicYear?.id === effectiveYearId,
  );

  const presetClassId = !isEditing ? editing?.classId : undefined;
  const { data: presetClassResponse } = useClass(presetClassId);
  const presetClass = presetClassResponse?.data;

  const { mutateAsync: createSection, isPending: isCreating } = useCreateSection();
  const { mutateAsync: updateSection, isPending: isUpdating } = useUpdateSection(editing?.id ?? "");
  const isSubmitting = isCreating || isUpdating;

  const onOpen = () => {
    setSelectedYearId(undefined);
    if (editing?.id) {
      form.setFieldsValue({
        classId: editing.classId,
        name: editing.name,
        capacity: editing.capacity ?? null,
        status: editing.status ?? "ACTIVE",
      });
    } else if (editing?.classId) {
      form.resetFields();
      form.setFieldsValue({ classId: editing.classId, status: "ACTIVE" });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: "ACTIVE" });
    }
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEditing && editing?.id) {
        await updateSection({
          name: values.name,
          capacity: values.capacity ?? null,
          status: values.status,
        });
        toast.success(`Section ${values.name} updated`);
      } else {
        await createSection({ classId: values.classId, name: values.name });
        toast.success(`Section ${values.name} created`);
      }

      form.resetFields();
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return;
      toast.error(err?.message || "Operation failed");
    }
  };

  return (
    <Drawer
      title={isEditing ? "Edit Section" : "Add Section"}
      open={open}
      onClose={() => {
        form.resetFields();
        onClose();
      }}
      size={DRAWER.width}
      afterOpenChange={(v) => v && onOpen()}
      extra={
        <Space>
          <Button
            onClick={() => {
              form.resetFields();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            style={{ background: colors.primary }}
            loading={isSubmitting}
            onClick={onSubmit}
          >
            {isEditing ? "Save Changes" : "Create Section"}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Typography.Text strong style={{ fontSize: 13 }}>
          Assignment
        </Typography.Text>
        <p style={{ margin: "4px 0 12px", fontSize: 12, color: colors.muted }}>
          Select the class this section belongs to.
        </p>

        {isEditing ? (
          // Edit mode — show class name as disabled input
          <Form.Item label="Class">
            <Input
              disabled
              value={
                editing?.class?.name ??
                activeClasses.find((c) => c.id === editing?.classId)?.name ??
                "—"
              }
            />
          </Form.Item>
        ) : editing?.classId ? (
          // Pre-selected from class row — show class name as disabled input
          <Form.Item label="Class">
            <Input
              disabled
              value={presetClass?.name ?? editing.class?.name ?? "—"}
            />
          </Form.Item>
        ) : (
          // Direct creation — academic year picker (defaults to CURRENT) then class select
          <>
            <Form.Item label="Filter by Academic Year">
              <Select
                value={effectiveYearId}
                onChange={(v) => {
                  setSelectedYearId(v);
                  form.setFieldValue("classId", undefined);
                }}
                options={academicYearsFromClasses.map((y) => ({
                  label: `${y.name}${y.status === "CURRENT" ? " (Current)" : ""}`,
                  value: y.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="classId"
              label="Class"
              rules={[{ required: true, message: "Class is required" }]}
            >
              <Select
                placeholder="Select class"
                showSearch
                filterOption={(input, opt) =>
                  ((opt?.label as string) ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={activeClasses.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
              />
            </Form.Item>
          </>
        )}

        <Typography.Text strong style={{ fontSize: 13 }}>
          Section Details
        </Typography.Text>
        <div style={{ marginTop: 12 }}>
          <Form.Item
            name="name"
            label="Section Name"
            rules={[{ required: true, message: "Section name is required" }]}
          >
            <Input placeholder="e.g. A, B, Crimson" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="capacity" label="Capacity">
                <InputNumber
                  min={1}
                  max={200}
                  style={{ width: "100%" }}
                  placeholder="e.g. 40"
                />
              </Form.Item>
            </Col>
            {isEditing && (
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="Status"
                  rules={[{ required: true }]}
                >
                  <Select
                    options={[
                      { label: "Active", value: "ACTIVE" },
                      { label: "Inactive", value: "INACTIVE" },
                    ]}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>
        </div>
      </Form>
    </Drawer>
  );
}

//  CLASS DETAIL DRAWER

function ClassDetailDrawer({
  schoolClass,
  canUpdate,
  canCreateSection,
  onClose,
  onEdit,
  onAddSection,
  onViewSection,
}: {
  schoolClass: SchoolClass | null;
  canUpdate: boolean;
  canCreateSection: boolean;
  onClose: () => void;
  onEdit: (c: SchoolClass) => void;
  onAddSection: (c: SchoolClass) => void;
  onViewSection: (s: Section) => void;
}) {
  // Fetch sections for this class from the real API
  const { data: sectionsResponse } = useSections({
    classId: schoolClass?.id,
    enabled: Boolean(schoolClass?.id),
  });
  const sections = sectionsResponse?.data ?? [];
  const totalCap = sections.reduce((sum, s) => sum + (s.capacity ?? 0), 0);

  if (!schoolClass) return null;

  const sectionColumns: ColumnsType<Section> = [
    {
      title: "Section",
      key: "section",
      render: (_: unknown, s: Section) => (
        <Space>
          <Avatar
            size={28}
            style={{
              background: colors.primaryLight,
              color: colors.primary,
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {s.name}
          </Avatar>
          <span>Section {s.name}</span>
        </Space>
      ),
    },
    {
      title: "Code",
      dataIndex: "code",
      sorter: true,
      render: (v: string) => (
        <span style={{ fontFamily: "monospace" }}>{v}</span>
      ),
    },
    {
      title: "Capacity",
      dataIndex: "capacity",
      render: (v: number | null) => v ?? "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (v: string) => <StatusBadge status={v} />,
    },
  ];

  return (
    <Drawer
      title={
        <Space>
          <Avatar
            size={36}
            style={{
              background: colors.primaryLight,
              color: colors.primary,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {initials(schoolClass.name)}
          </Avatar>
          <span>{schoolClass.name}</span>
        </Space>
      }
      open={!!schoolClass}
      onClose={onClose}
      size={DRAWER.widthLg}
      extra={
        <Space>
          {canCreateSection && (
            <Button
              icon={<PlusOutlined />}
              onClick={() => onAddSection(schoolClass)}
            >
              Add Section
            </Button>
          )}
          {canUpdate && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              style={{ background: colors.primary }}
              onClick={() => onEdit(schoolClass)}
            >
              Edit Class
            </Button>
          )}
        </Space>
      }
    >
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          {
            label: "Sections",
            value: sections.length,
            icon: <AppstoreOutlined />,
            color: colors.primary,
            bg: colors.primaryLight,
          },
          {
            label: "Total Capacity",
            value: totalCap || "—",
            icon: <TeamOutlined />,
            color: colors.info,
            bg: colors.infoLight,
          },
        ].map((k) => (
          <Col key={k.label} span={12}>
            <StatCard
              variant="compact"
              size="small"
              label={k.label}
              value={k.value}
              icon={k.icon}
              color={k.color}
              iconBg={k.bg}
            />
          </Col>
        ))}
      </Row>

      <Descriptions
        bordered
        size="small"
        column={2}
        style={{ marginBottom: 20 }}
      >
        <Descriptions.Item label="Academic Year">
          {schoolClass.academicYear?.name ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <StatusBadge status={schoolClass.status} />
        </Descriptions.Item>
        <Descriptions.Item label="Class Code">
          <span style={{ fontFamily: "monospace" }}>{schoolClass.code}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {new Date(schoolClass.createdAt).toLocaleDateString()}
        </Descriptions.Item>
      </Descriptions>

      <Typography.Title level={5} style={{ marginBottom: 12 }}>
        Sections
      </Typography.Title>

      {sections.length === 0 ? (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            background: colors.surfaceAlt,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Typography.Text type="secondary">
            No sections configured for {schoolClass.name}.
          </Typography.Text>
          {canCreateSection && (
            <div style={{ marginTop: 12 }}>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                style={{ background: colors.primary }}
                onClick={() => onAddSection(schoolClass)}
              >
                Add Section
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Table
          rowKey="id"
          columns={sectionColumns}
          dataSource={sections}
          size="small"
          pagination={false}
          onRow={(s) => ({
            onClick: () => onViewSection(s),
            style: { cursor: "pointer" },
          })}
        />
      )}
    </Drawer>
  );
}

//  SECTION DETAIL DRAWER

function SectionDetailDrawer({
  section,
  canUpdate,
  onClose,
  onEdit,
}: {
  section: Section | null;
  canUpdate: boolean;
  onClose: () => void;
  onEdit: (s: Section) => void;
}) {
  // Fetch fresh section data to get populated class field
  const { data: sectionResponse } = useSection(section?.id);
  const detail = sectionResponse?.data ?? section;

  const teacher = detail?.classTeacherId
    ? MOCK_TEACHERS.find((t) => t.id === detail.classTeacherId)
    : null;

  if (!section) return null;

  // Mock student columns — replace with real API when student module is ready
  const studentColumns: ColumnsType<MockStudent> = [
    {
      title: "Student",
      key: "student",
      render: (_: unknown, s: MockStudent) => (
        <Space>
          <Avatar
            size={28}
            style={{
              background: colors.primaryLight,
              color: colors.primary,
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            {initials(s.name)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{s.name}</div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: colors.muted,
              }}
            >
              {s.admissionNo}
            </div>
          </div>
        </Space>
      ),
    },
    { title: "Gender", dataIndex: "gender", width: 90 },
    {
      title: "Contact",
      dataIndex: "phone",
      render: (v: string) => (
        <span style={{ fontFamily: "monospace" }}>{v}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (v: string) => <StatusBadge status={v} />,
    },
  ];

  return (
    <Drawer
      title={
        <Space>
          <Avatar
            size={36}
            style={{
              background: colors.primaryLight,
              color: colors.primary,
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {detail?.name ?? ""}
          </Avatar>
          <div>
            <div>Section {detail?.name}</div>
            <div style={{ fontSize: 12, color: colors.muted, fontWeight: 400 }}>
              {detail?.class?.name ?? section.class?.name ?? "—"}
            </div>
          </div>
        </Space>
      }
      open={!!section}
      onClose={onClose}
      size={DRAWER.widthLg}
      extra={
        canUpdate && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            style={{ background: colors.primary }}
            onClick={() => onEdit(section)}
          >
            Edit Section
          </Button>
        )
      }
    >
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          {
            label: "Capacity",
            value: detail?.capacity ?? "—",
            icon: <TeamOutlined />,
            color: colors.info,
            bg: colors.infoLight,
          },
          {
            label: "Available Seats",
            value:
              detail?.capacity != null ? Math.max(0, detail.capacity) : "—",
            icon: <UserOutlined />,
            color: colors.success,
            bg: colors.successLight,
          },
        ].map((k) => (
          <Col key={k.label} span={12}>
            <StatCard
              variant="compact"
              size="small"
              label={k.label}
              value={k.value}
              icon={k.icon}
              color={k.color}
              iconBg={k.bg}
            />
          </Col>
        ))}
      </Row>

      <Descriptions
        bordered
        size="small"
        column={2}
        style={{ marginBottom: 20 }}
      >
        <Descriptions.Item label="Class">
          {detail?.class?.name ?? section.class?.name ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <StatusBadge status={detail?.status ?? section.status} />
        </Descriptions.Item>
        <Descriptions.Item label="Section Code">
          <span style={{ fontFamily: "monospace" }}>
            {detail?.code ?? section.code}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {new Date(
            detail?.createdAt ?? section.createdAt,
          ).toLocaleDateString()}
        </Descriptions.Item>
        <Descriptions.Item label="Class Teacher" span={2}>
          {teacher ? (
            <Space>
              <Avatar
                size={22}
                style={{
                  background: colors.primaryLight,
                  color: colors.primary,
                  fontSize: 10,
                }}
              >
                {initials(teacher.name)}
              </Avatar>
              {teacher.name} — {teacher.department}
            </Space>
          ) : (
            <span style={{ color: colors.muted }}>Not assigned</span>
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* Students in this Section — mock data, replace with real API when student module is ready */}
      <Typography.Title level={5} style={{ marginBottom: 12 }}>
        Students in this Section
      </Typography.Title>
      {MOCK_STUDENTS.length === 0 ? (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            background: colors.surfaceAlt,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Typography.Text type="secondary">
            No students assigned to this section.
          </Typography.Text>
        </div>
      ) : (
        <Table<MockStudent>
          rowKey="id"
          columns={studentColumns}
          dataSource={MOCK_STUDENTS}
          size="small"
          pagination={false}
          scroll={{ x: 500 }}
        />
      )}
    </Drawer>
  );
}
