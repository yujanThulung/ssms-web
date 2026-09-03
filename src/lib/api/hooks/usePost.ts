import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";

export function usePost<TBody, TResponse = TBody>(
    endpoint: string,
    invalidators: string[] = []
) {
    const qc = useQueryClient()

    return useMutation<TResponse, Error, TBody>({
        mutationFn: (body) =>
            client.post<TResponse>(endpoint, body).then((r) => r.data),
        onSuccess: () => {
            invalidators.forEach((key) => qc.invalidateQueries({ queryKey: [key] }))
        },
    })
}