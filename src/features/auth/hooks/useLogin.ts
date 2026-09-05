import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import type { LoginPayload } from "../types/auth.types";
import type { AuthUser } from "../../../context/AuthContext";
import client from "../../../lib/api/client";
import { ENDPOINTS } from "../../../lib/api/endpoints";
import { toast } from "sonner";

interface LoginTokens {
    accessToken: string;
    refreshToken: string;
}

export function useLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (payload: LoginPayload) => {
            // 1. Authenticate credentials
            const loginRes = await client.post(ENDPOINTS.AUTH.LOGIN, payload);
            const rawTokens = loginRes.data?.data ?? loginRes.data;

            const tokenData: LoginTokens = {
                accessToken: rawTokens?.accessToken || rawTokens?.access_token,
                refreshToken: rawTokens?.refreshToken || rawTokens?.refresh_token,
            };

            if (!tokenData.accessToken) {
                throw new Error("No access token received from server");
            }

            // 2. Immediately fetch user profile & permissions using the new token
            const meRes = await client.get(ENDPOINTS.USERS.ME, {
                headers: {
                    Authorization: `Bearer ${tokenData.accessToken}`,
                },
            });
            const user: AuthUser = meRes.data?.data ?? meRes.data;

            return { user, tokens: tokenData };
        },
        onSuccess: ({ user, tokens }) => {
            if (user && tokens?.accessToken) {
                // 3. Stores user + permissions + tokens in localStorage and state
                login(user, tokens.accessToken, tokens.refreshToken);
                toast.success(`Welcome back, ${user.fullName || user.username}!`);
                navigate("/", { replace: true });
            } else {
                toast.error("Failed to retrieve user profile. Please try again.");
            }
        },
        onError: (error) => {
            toast.error(error.message || "Invalid credentials. Please try again.");
        },
    });
}
