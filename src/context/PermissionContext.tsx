import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { hasPermission, hasRole, isSuperAdmin, type ActionType, type FeatureType } from "../utils/permissions";


interface PermissionContextValue {
  can: (feature: FeatureType | string, action: ActionType | string) => boolean
  isSuperAdmin: boolean
  hasRole: (...roles: string[]) => boolean
}

const PermissionContext = createContext<PermissionContextValue | null>(null)


export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  return (
    <PermissionContext.Provider
      value={{
        can: (feature, action) => hasPermission(user, feature, action),
        isSuperAdmin: isSuperAdmin(user),
        hasRole: (...roles) => hasRole(user, ...roles)
      }}>
      {children}
    </PermissionContext.Provider>
  )
}



export function usePermission() {
  const ctx = useContext(PermissionContext);
  if (!ctx)
    throw new Error("usePermission must be used inside PermissionProvider");
  return ctx;
}