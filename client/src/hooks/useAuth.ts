import {authKeys} from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {magicLinkClient} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";


// ============================================
// Better Auth Client
//
// Session is managed via HTTP-only cookies:
// - Persists across page refreshes automatically
// - getSession() validates existing cookie
// - No localStorage needed for auth state
// ============================================
export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_BACKEND_URL || "",
    basePath: "/auth",
    plugins: [
        magicLinkClient() // Add the plugin here
    ]
});

// ============================================
// Types
// ============================================
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
}

export interface SignInCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface SignUpCredentials {
    email: string;
    password: string;
    name: string;
}

// ============================================
// Auth Hook
// ============================================
export function useAuth() {
    const queryClient = useQueryClient();

    // Session query - validates cookie on load
    const sessionQuery = useQuery({
        queryKey: authKeys.session(),
        queryFn: async () => {
            const { data, error } = await authClient.getSession();
            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 5,
        retry: false,
        refetchOnWindowFocus: false,
    });

    // Get decrypted user data from /me endpoint
    const meQuery = useQuery({
        queryKey: authKeys.me(),
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, { credentials: "include" });
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!sessionQuery.data,
        staleTime: 1000 * 60 * 5,
    });

    // Sign in
    const signIn = useMutation({
        mutationFn: async (creds: SignInCredentials) => {
            const { data, error } = await authClient.signIn.email({
                email: creds.email,
                password: creds.password,
                rememberMe: creds.rememberMe ?? true,
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: authKeys.all });
        },
    });

    // Sign up
    const signUp = useMutation({
        mutationFn: async (creds: SignUpCredentials) => {
            const { data, error } = await authClient.signUp.email(creds);
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: authKeys.all });
        },
    });

    // Sign out
    const signOut = useMutation({
        mutationFn: async () => {
            const { error } = await authClient.signOut();
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.setQueryData(authKeys.session(), null);
            queryClient.setQueryData(authKeys.me(), null);
            window.location.href = '/?logged-out=true';
        },
    });

    // Forgot password
    // const forgotPassword = useMutation({
    //     mutationFn: async (email: string) => {
    //         const { error } = await authClient.forgetPassword({
    //             email,
    //             redirectTo: "/reset-password",
    //         });
    //         if (error) throw error;
    //     },
    // });

    const signInMagicLink = useMutation({
        mutationFn: async (email: string) => {
            // We pass the email. The server interceptor in index.ts
            // will handle hashing it before Better Auth sees it.
            const { data, error } = await authClient.signIn.magicLink({
                email,
                callbackURL: "/", // Where to redirect after clicking link
            });

            if (error) throw error;
            return data;
        },
        // Note: We don't invalidate queries here because the user
        // isn't logged in until they click the link in their email.
    });

    return {
        user: (meQuery.data?.user ?? sessionQuery.data?.user) as AuthUser | null,
        session: sessionQuery.data,
        isAuthenticated: !!sessionQuery.data?.user,
        isGuest: !sessionQuery.data?.user && !sessionQuery.isLoading,
        isLoading: sessionQuery.isLoading,

        signIn,
        signUp,
        signOut,
        signInMagicLink
        // forgotPassword,
    };
}
