import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";

export function useDelete(endpoint: string, invalidates: string[] = []) {
    const qc = useQueryClient()

    return useMutation<void, Error, string | number>({
        mutationFn: (id) =>
            client.delete(`${endpoint}/${id}`).then((r) => r.data),
        onSuccess: () => {
            invalidates.forEach((key) => qc.invalidateQueries({ queryKey: [key] }))
        },
    })
}