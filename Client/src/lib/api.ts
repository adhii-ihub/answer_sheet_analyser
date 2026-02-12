const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = "ApiError";
    }
}

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
}

function clearAuth() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
}

async function apiClient<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        clearAuth();
        throw new ApiError("Unauthorized", 401);
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.detail || errorData.message || "Something went wrong",
            response.status
        );
    }

    if (response.status === 204) return {} as T;
    return response.json();
}

// ─── Auth ────────────────────────────────────────────
export interface AuthResponse {
    access: string;
    refresh: string;
    user: { id: number; name: string; email: string };
}

export async function login(
    email: string,
    password: string
): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export async function register(
    name: string,
    email: string,
    password: string
): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/auth/register/", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
    });
}

// ─── Submissions ─────────────────────────────────────
export interface Submission {
    id: number;
    file_name: string;
    status: string;
    quick_score: number | null;
    final_score: number | null;
    feedback: string | null;
    strengths: string[];
    weaknesses: string[];
    created_at: string;
    updated_at: string;
}

export async function uploadSubmission(formData: FormData): Promise<Submission> {
    return apiClient<Submission>("/submissions/upload/", {
        method: "POST",
        body: formData,
    });
}

export async function getHistory(params?: {
    page?: number;
    ordering?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
}): Promise<{
    count: number;
    results: Submission[];
    next: string | null;
    previous: string | null;
}> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.ordering) searchParams.set("ordering", params.ordering);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.date_from) searchParams.set("date_from", params.date_from);
    if (params?.date_to) searchParams.set("date_to", params.date_to);

    const qs = searchParams.toString();
    return apiClient(`/submissions/${qs ? `?${qs}` : ""}`);
}

export async function getSubmission(id: number): Promise<Submission> {
    return apiClient<Submission>(`/submissions/${id}/`);
}

// ─── Dashboard ───────────────────────────────────────
export interface DashboardData {
    total_uploads: number;
    average_score: number;
    completed_evaluations: number;
    pending_evaluations: number;
    recent_submissions: Submission[];
    score_trend: { date: string; score: number }[];
}

export async function getDashboard(): Promise<DashboardData> {
    return apiClient<DashboardData>("/dashboard/");
}

// ─── Analytics ───────────────────────────────────────
export interface AnalyticsData {
    score_over_time: { date: string; score: number }[];
    performance_comparison: { subject: string; score: number }[];
    strengths_weaknesses: { name: string; value: number }[];
    total_submissions: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
}

export async function getAnalytics(): Promise<AnalyticsData> {
    return apiClient<AnalyticsData>("/analytics/");
}
