import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { ENDPOINTS } from "../../../lib/api/endpoints";
import { toast } from "sonner";
import client from "../../../lib/api/client";

export function useLogOut() {
    const { logout } = useAuth()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: async () => {
            await client.post(ENDPOINTS.AUTH.LOGOUT).catch(() => { })
        },
        onSettled: () => {
            logout()
            toast.success('Logged out successfully')
            navigate('/login', { replace: true })
        }
    })
}
