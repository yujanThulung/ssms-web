import { useMutation } from "@tanstack/react-query";
import client from "../../../lib/api/client";
import { ENDPOINTS } from "../../../lib/api/endpoints";
import { toast } from "sonner";

export interface ChangePasswordPayload {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export function useChangePassword() {
    return useMutation({
        mutationFn: async (payload: ChangePasswordPayload) => {
            const res = await client.patch(ENDPOINTS.USERS.CHANGE_PASSWORD, payload)
            return res.data
        },
        onSuccess: () => {
            toast.success('Password changed successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to change password')
        }
    })
}