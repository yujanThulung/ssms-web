import { createContext, useContext, useState, type ReactNode } from "react";
import type { AuthUser } from "./AuthContext";

export type RoleName = "SUPER_ADMIN" | "ADMIN" | "ACCOUNTANT" | "TEACHER";

export const ROLES: RoleName[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "ACCOUNTANT",
  "TEACHER",
];

export type PermissionModule = {
  key: string;
  label: string;
  group: string;
  actions: string[];
  /** Always shown in nav regardless of permission grants (Dashboard, Settings). */
  alwaysVisible?: boolean;
};

// Module catalog — keys match the `module` strings already used in sidebarItems.ts,
// so this stays in sync with what's actually enforced in the nav/routes.
export const permissionModules: PermissionModule[] = [
  { key: "dashboard", label: "Dashboard", group: "Overview", actions: ["VIEW"], alwaysVisible: true },
  { key: "student", label: "Students", group: "People", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  { key: "account", label: "Fee Collection", group: "Accounts", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  { key: "role", label: "Permissions", group: "Master Setup", actions: ["VIEW", "UPDATE"] },
  { key: "user", label: "User Management", group: "System", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  { key: "settings", label: "Settings", group: "System", actions: ["VIEW"], alwaysVisible: true },
];

/** module key -> granted action list, for one role */
export type PermissionSet = Record<string, string[]>;

const allPermissions = (): PermissionSet =>
  Object.fromEntries(permissionModules.map((m) => [m.key, [...m.actions]]));

const defaultRolePermissions: Record<RoleName, PermissionSet> = {
  SUPER_ADMIN: allPermissions(),
  ADMIN: {
    dashboard: ["VIEW"],
    student: ["VIEW", "CREATE", "UPDATE"],
    account: ["VIEW", "CREATE"],
    role: ["VIEW"],
    user: [],
    settings: ["VIEW"],
  },
  ACCOUNTANT: {
    dashboard: ["VIEW"],
    student: ["VIEW"],
    account: ["VIEW", "CREATE", "UPDATE"],
    role: [],
    user: [],
    settings: ["VIEW"],
  },
  TEACHER: {
    dashboard: ["VIEW"],
    student: ["VIEW"],
    account: [],
    role: [],
    user: [],
    settings: ["VIEW"],
  },
};

export const roleMeta: Record<RoleName, { description: string; users: number; system: boolean }> = {
  SUPER_ADMIN: { description: "Full system authority", users: 2, system: true },
  ADMIN: { description: "Administrative access across academics and accounts", users: 5, system: false },
  ACCOUNTANT: { description: "Finance focused access to fees and billing", users: 8, system: false },
  TEACHER: { description: "Classroom and student record access", users: 24, system: false },
};

const ROLE_PROFILE: Record<RoleName, { fullName: string; email: string; username: string }> = {
  SUPER_ADMIN: { fullName: "Ramesh Bhandari", email: "super@ssms.edu.np", username: "Super" },
  ADMIN: { fullName: "Sushmita Karki", email: "admin@ssms.edu.np", username: "Admin" },
  ACCOUNTANT: { fullName: "Binod Rai", email: "accountant@ssms.edu.np", username: "Accountant" },
  TEACHER: { fullName: "Anita Sharma", email: "teacher@ssms.edu.np", username: "Teacher" },
};

function toPermissionList(set: PermissionSet): { feature: string; action: string }[] {
  return Object.entries(set).flatMap(([feature, actions]) =>
    actions.map((action) => ({ feature, action })),
  );
}

interface PermissionContextValue {
  user: AuthUser;
  role: RoleName;
  setRole: (r: RoleName) => void;
  can: (feature: string, action: string) => boolean;
  permissions: Record<RoleName, PermissionSet>;
  setRolePermissions: (r: RoleName, p: PermissionSet) => void;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<RoleName>("SUPER_ADMIN");
  const [permissions, setPermissions] = useState<Record<RoleName, PermissionSet>>(
    defaultRolePermissions,
  );

  const setRolePermissions = (r: RoleName, p: PermissionSet) => {
    setPermissions((prev) => ({ ...prev, [r]: p }));
  };

  const can = (feature: string, action: string) =>
    (permissions[role][feature.toLowerCase()] ?? []).includes(action.toUpperCase());

  const profile = ROLE_PROFILE[role];
  const meta = roleMeta[role];
  const user: AuthUser = {
    id: `preview-${role.toLowerCase()}`,
    email: profile.email,
    username: profile.username,
    fullName: profile.fullName,
    phone: null,
    status: "ACTIVE",
    role: { id: role, name: role, description: meta.description, isSystemRole: meta.system },
    permissions: toPermissionList(permissions[role]),
  };

  return (
    <PermissionContext.Provider
      value={{ user, role, setRole, can, permissions, setRolePermissions }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const ctx = useContext(PermissionContext);
  if (!ctx)
    throw new Error("usePermission must be used inside PermissionProvider");
  return ctx;
}