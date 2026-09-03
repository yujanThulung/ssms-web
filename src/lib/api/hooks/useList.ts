import { useQuery } from "@tanstack/react-query";
import type { ListParams, PaginatedResponse } from '../types'
import client from "../client";

export function useList<T>(endpoint: string, params: ListParams = {}) {
    return useQuery<PaginatedResponse<T>, Error>({
        queryKey: [endpoint, params],
        queryFn: () =>
            client
                .get<PaginatedResponse<T>>(endpoint, { params })
                .then((r) => r.data),
    })
}