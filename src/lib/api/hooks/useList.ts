import { useQuery } from "@tanstack/react-query";
import type { ListParams, ApiPaginatedResponse } from '../types'
import client from "../client";

export function useList<T>(endpoint: string, params: ListParams = {}) {
    return useQuery<ApiPaginatedResponse<T>, Error>({
        queryKey: [endpoint, params],
        queryFn: () =>
            client
                .get<ApiPaginatedResponse<T>>(endpoint, { params })
                .then((r) => r.data),
    })
}