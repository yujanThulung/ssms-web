import { createContext, useContext, useState, type ReactNode } from "react";
import type { AuthUser } from "./ AuthContext";

// Dummy user — replace with real /me API response later
const DUMMY_USER: AuthUser = {
  id: "c2cd8428-087c-4b1e-9ee1-32d967179f6d",
  email: "super@ssms.edu.np",
  username: "Super",
  fullName: "Ramesh Bhandari",
  phone: null,
  status: "ACTIVE",
  role: {
    id: "b6c0e43b-1b82-4cf6-859a-8c7ffdbfc78e",
    name: "SUPER_ADMIN",
    description: "Full system authority",
    isSystemRole: true,
  },
  permissions: [
    { feature: "student", action: "VIEW" },
    { feature: "student", action: "CREATE" },
    { feature: "student", action: "UPDATE" },
    { feature: "student", action: "DELETE" },
    { feature: "account", action: "VIEW" },
    { feature: "account", action: "CREATE" },
    { feature: "account", action: "UPDATE" },
    { feature: "account", action: "DELETE" },
    { feature: "role", action: "VIEW" },
    { feature: "role", action: "UPDATE" },
    { feature: "user", action: "VIEW" },
    { feature: "user", action: "CREATE" },
    { feature: "user", action: "UPDATE" },
    { feature: "user", action: "DELETE" },
    { feature: "dashboard", action: "VIEW" },
    { feature: "settings", action: "VIEW" },
  ],
};

export type RoleName = "SUPER_ADMIN" | "ADMIN" | "ACCOUNTANT" | "TEACHER";

export const ROLES: RoleName[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "ACCOUNTANT",
  "TEACHER",
];

// Dummy users per role — for UI preview switcher
const ROLE_USERS: Record<RoleName, AuthUser> = {
  SUPER_ADMIN: DUMMY_USER,
  ADMIN: {
    ...DUMMY_USER,
    fullName: "Sushmita Karki",
    email: "admin@ssms.edu.np",
    username: "Admin",
    role: {
      ...DUMMY_USER.role,
      name: "ADMIN",
      description: "Administrative access",
      isSystemRole: false,
    },
    permissions: [
      { feature: "student", action: "VIEW" },
      { feature: "student", action: "CREATE" },
      { feature: "student", action: "UPDATE" },
      { feature: "account", action: "VIEW" },
      { feature: "account", action: "CREATE" },
      { feature: "role", action: "VIEW" },
    ],
  },
  ACCOUNTANT: {
    ...DUMMY_USER,
    fullName: "Binod Rai",
    email: "accountant@ssms.edu.np",
    username: "Accountant",
    role: {
      ...DUMMY_USER.role,
      name: "ACCOUNTANT",
      description: "Finance access",
      isSystemRole: false,
    },
    permissions: [
      { feature: "account", action: "VIEW" },
      { feature: "account", action: "CREATE" },
      { feature: "account", action: "UPDATE" },
      { feature: "student", action: "VIEW" },
    ],
  },
  TEACHER: {
    ...DUMMY_USER,
    fullName: "Anita Sharma",
    email: "teacher@ssms.edu.np",
    username: "Teacher",
    role: {
      ...DUMMY_USER.role,
      name: "TEACHER",
      description: "Teacher access",
      isSystemRole: false,
    },
    permissions: [{ feature: "student", action: "VIEW" }],
  },
};

interface PermissionContextValue {
  user: AuthUser;
  role: RoleName;
  setRole: (r: RoleName) => void;
  can: (feature: string, action: string) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<RoleName>("SUPER_ADMIN");
  const user = ROLE_USERS[role];

  const can = (feature: string, action: string) =>
    user.permissions.some(
      (p) =>
        p.feature.toLowerCase() === feature.toLowerCase() &&
        p.action.toUpperCase() === action.toUpperCase(),
    );

  return (
    <PermissionContext.Provider value={{ user, role, setRole, can }}>
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
