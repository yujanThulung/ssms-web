import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";

export function usePut<TBody, TResponse = TBody>(
    endpoint: string,
    invalidates: string[] = []
) {
    const qc = useQueryClient();

    return useMutation<TResponse, Error, TBody>({
        mutationFn: (body) =>
            client.put<TResponse>(endpoint, body).then((r) => r.data),
        onSuccess: () => {
            invalidates.forEach((key) => qc.invalidateQueries({ queryKey: [key] }))
        },
    })
}