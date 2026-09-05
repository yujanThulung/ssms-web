import type { AuthUser } from "../../../context/AuthContext"

export interface LoginPayload {
    emailOrUsername: string
    password: string
}

export interface LoginResponse {
    user: AuthUser
    accessToken: string
    refreshToken: string
}