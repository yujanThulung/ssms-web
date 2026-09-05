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
  alwaysVisible?: boolean;
};

export const permissionModules: PermissionModule[] = [
  { key: "dashboard", label: "Dashboard", group: "Overview", actions: ["VIEW"], alwaysVisible: true },
  { key: "student", label: "Students", group: "People", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  { key: "account", label: "Fee Collection", group: "Accounts", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  { key: "role", label: "Permissions", group: "Master Setup", actions: ["VIEW", "UPDATE"] },
  { key: "user", label: "User Management", group: "System", actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  { key: "settings", label: "Settings", group: "System", actions: ["VIEW"], alwaysVisible: true },
];

export type PermissionSet = Record<string, string[]>;

export const defaultRolePermissions: Record<RoleName, PermissionSet> = {
  SUPER_ADMIN: {
    dashboard: ["VIEW"],
    student: ["VIEW", "CREATE", "UPDATE", "DELETE"],
    account: ["VIEW", "CREATE", "UPDATE", "DELETE"],
    role: ["VIEW", "UPDATE"],
    user: ["VIEW", "CREATE", "UPDATE", "DELETE"],
    settings: ["VIEW"],
  },
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
