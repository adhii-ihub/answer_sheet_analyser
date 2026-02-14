const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";

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
    tokens: {
        access: string;
        refresh: string;
    };
    user: { id: number; username: string; email: string };
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
    password: string,
    confirmPassword?: string
): Promise<AuthResponse> {
    return apiClient<AuthResponse>("/auth/register/", {
        method: "POST",
        body: JSON.stringify({
            username: name,
            email,
            password,
            password2: confirmPassword || password
        }),
    });
}

// ─── Submissions ─────────────────────────────────────
export interface Submission {
    id: number;
    file_name: string;
    status: string;
    quick_score: number | null;
    final_score: number | null;
    max_score: number | null;
    feedback: string | null;
    strengths: string[];
    weaknesses: string[];
    improvement_suggestions: string[];
    confidence: number | null;
    created_at: string;
    updated_at: string;
}

export async function uploadSubmission(formData: FormData): Promise<Submission> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await apiClient("/upload/", {
        method: "POST",
        body: formData,
    });
    const ev = raw.evaluation || {};
    return {
        id: raw.id,
        file_name: raw.file_name || (raw.answer_file ? String(raw.answer_file).split('/').pop()! : `Submission #${raw.id}`),
        status: raw.status,
        quick_score: ev.quick_score ?? raw.quick_score ?? null,
        final_score: ev.final_score ?? raw.final_score ?? null,
        max_score: ev.max_score ?? raw.max_score ?? null,
        feedback: ev.detailed_feedback || ev.quick_feedback || raw.feedback || null,
        strengths: ev.strengths || raw.strengths || [],
        weaknesses: ev.mistakes || raw.weaknesses || [],
        improvement_suggestions: ev.improvement_suggestions || raw.improvement_suggestions || [],
        confidence: ev.confidence ?? raw.confidence ?? null,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
    };
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
    const data = await apiClient<Submission[] | { count: number; results: Submission[] }>(`/history/${qs ? `?${qs}` : ""}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalize = (s: any): Submission => ({
        id: s.id,
        file_name: s.file_name || `Submission #${s.id}`,
        status: s.status,
        quick_score: s.quick_score ?? null,
        final_score: s.final_score ?? null,
        max_score: s.max_score ?? null,
        feedback: s.feedback ?? null,
        strengths: s.strengths || [],
        weaknesses: s.weaknesses || [],
        improvement_suggestions: s.improvement_suggestions || [],
        confidence: s.confidence ?? null,
        created_at: s.created_at,
        updated_at: s.updated_at,
    });

    // Handle both flat array (no pagination) and paginated response
    if (Array.isArray(data)) {
        const results = data.map(normalize);
        return { count: results.length, results, next: null, previous: null };
    }
    const results = (data.results || []).map(normalize);
    return { count: data.count, results, next: null, previous: null };
}

export async function getSubmission(id: number): Promise<Submission> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await apiClient(`/submissions/${id}/`);
    const ev = raw.evaluation || {};
    return {
        id: raw.id,
        file_name: raw.file_name || (raw.answer_file ? raw.answer_file.split('/').pop() : `Submission #${raw.id}`),
        status: raw.status,
        quick_score: ev.quick_score ?? raw.quick_score ?? null,
        final_score: ev.final_score ?? raw.final_score ?? null,
        max_score: ev.max_score ?? raw.max_score ?? null,
        feedback: ev.detailed_feedback || ev.quick_feedback || raw.feedback || null,
        strengths: ev.strengths || raw.strengths || [],
        weaknesses: ev.mistakes || raw.weaknesses || [],
        improvement_suggestions: ev.improvement_suggestions || raw.improvement_suggestions || [],
        confidence: ev.confidence ?? raw.confidence ?? null,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
    };
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await apiClient("/dashboard/");

    const recentSubs: Submission[] = (raw.recent_submissions || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any) => ({
            id: s.id,
            file_name: s.file_name || `Submission #${s.id}`,
            status: s.status,
            quick_score: s.quick_score ?? null,
            final_score: s.final_score ?? null,
            feedback: s.feedback ?? null,
            strengths: s.strengths || [],
            weaknesses: s.weaknesses || [],
            created_at: s.created_at,
            updated_at: s.updated_at,
        })
    );

    const totalUploads = raw.total_uploads ?? 0;
    const pending = raw.pending_evaluations ?? 0;

    // Build score_trend from recent_submissions if backend doesn't provide it
    const scoreTrend = raw.score_trend || recentSubs
        .filter((s: Submission) => s.final_score !== null)
        .map((s: Submission) => ({
            date: new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            score: s.final_score!,
        }));

    return {
        total_uploads: totalUploads,
        average_score: raw.average_score ?? 0,
        completed_evaluations: raw.completed_evaluations ?? (totalUploads - pending),
        pending_evaluations: pending,
        recent_submissions: recentSubs,
        score_trend: scoreTrend,
    };
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await apiClient("/analytics/");

    // Transform backend response to frontend format
    const scoreTimeline = raw.score_timeline || raw.score_over_time || [];
    const scores = scoreTimeline
        .map((s: { final_score?: number; score?: number }) => s.final_score ?? s.score ?? 0)
        .filter((s: number) => s > 0);

    // Convert performance_distribution object to performance_comparison array
    const perfDist = raw.performance_distribution || {};
    const performance_comparison = Object.entries(perfDist).map(([subject, score]) => ({
        subject,
        score: score as number,
    }));

    // Convert strengths_vs_weaknesses object to strengths_weaknesses array
    const sw = raw.strengths_vs_weaknesses || {};
    const strengths_weaknesses = Object.entries(sw).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: value as number,
    }));

    return {
        score_over_time: scoreTimeline.map((s: { date: string; final_score?: number; score?: number }) => ({
            date: s.date,
            score: s.final_score ?? s.score ?? 0,
        })),
        performance_comparison,
        strengths_weaknesses,
        total_submissions: raw.total_submissions ?? 0,
        average_score: raw.average_final_score ?? raw.average_score ?? 0,
        highest_score: raw.highest_score ?? (scores.length ? Math.max(...scores) : 0),
        lowest_score: raw.lowest_score ?? (scores.length ? Math.min(...scores) : 0),
    };
}
