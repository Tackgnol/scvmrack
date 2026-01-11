import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/api";

// ============================================
// Types
// ============================================
interface SessionInfo {
    isGuest: boolean;
    expiresAt: string;
    daysUntilExpiry: number;
    canExtend: boolean;
}

// ============================================
// Session Status Hook
// ============================================
export function useSessionStatus() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: authKeys.sessionInfo(),
        queryFn: async (): Promise<SessionInfo | null> => {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/session/info`, { credentials: "include" });
            if (!res.ok) return null;
            return res.json();
        },
        staleTime: 1000 * 60 * 60, // 1 hour
        refetchOnWindowFocus: true,
        retry: false,
    });

    const extendMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/session/extend`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to extend session");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: authKeys.sessionInfo() });
        },
    });

    const isGuest = query.data?.isGuest ?? false;
    const daysUntilExpiry = query.data?.daysUntilExpiry ?? 7;
    const canExtend = query.data?.canExtend ?? false;

    // Show warning if guest and within 3 days of expiry
    const showWarning = isGuest && daysUntilExpiry <= 3;

    return {
        isGuest,
        daysUntilExpiry,
        expiresAt: query.data?.expiresAt,
        canExtend,
        showWarning,

        extend: extendMutation.mutateAsync,
        isExtending: extendMutation.isPending,
        extendError: extendMutation.error,

        isLoading: query.isLoading,
    };
}
