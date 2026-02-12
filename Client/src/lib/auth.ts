"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    login as apiLogin,
    register as apiRegister,
    type AuthResponse,
} from "./api";

interface User {
    id: number;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ["/login", "/register", "/"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Restore session from localStorage
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("user");
            const token = localStorage.getItem("access_token");
            if (storedUser && token) {
                setUser(JSON.parse(storedUser));
            }
        } catch {
            // Invalid data, clear it
            localStorage.removeItem("user");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Guard protected routes
    useEffect(() => {
        if (isLoading) return;
        const isPublic = PUBLIC_PATHS.includes(pathname);
        if (!user && !isPublic) {
            router.push("/login");
        }
    }, [user, isLoading, pathname, router]);

    const handleAuthResponse = useCallback(
        (data: AuthResponse) => {
            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
            router.push("/dashboard");
        },
        [router]
    );

    const login = useCallback(
        async (email: string, password: string) => {
            const data = await apiLogin(email, password);
            handleAuthResponse(data);
        },
        [handleAuthResponse]
    );

    const register = useCallback(
        async (name: string, email: string, password: string) => {
            const data = await apiRegister(name, email, password);
            handleAuthResponse(data);
        },
        [handleAuthResponse]
    );

    const logout = useCallback(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        setUser(null);
        router.push("/login");
    }, [router]);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
    };

    return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
