import { useQuery } from "@tanstack/react-query";
import client from "../client";

export function useGet<T>(endpoint: string, enabled = true) {
    return useQuery<T, Error>({
        queryKey: [endpoint],
        queryFn: () => client.get<T>(endpoint).then((r) => r.data),
        enabled,
    })
}