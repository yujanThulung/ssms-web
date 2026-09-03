import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";

export function usePatch<TBody, TResponse = TBody>(
    endpoint: string,
    invalidates: string[] = [],
) {
    const qc = useQueryClient()

    return useMutation<TResponse, Error, TBody>({
        mutationFn: (body) =>
            client.patch<TResponse>(endpoint, body).then((r) => r.data),
        onSuccess: () => {
            invalidates.forEach((key) => qc.invalidateQueries({ queryKey: [key] }))
        },
    })
}