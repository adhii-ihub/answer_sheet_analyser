"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { RecentActivity } from "@/components/RecentActivity";
import { getDashboard, type DashboardData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Upload, TrendingUp, FileCheck2, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

const mockDashboard: DashboardData = {
    total_uploads: 147,
    average_score: 78,
    completed_evaluations: 132,
    pending_evaluations: 15,
    score_trend: [
        { date: "Jan", score: 72 },
        { date: "Feb", score: 68 },
        { date: "Mar", score: 75 },
        { date: "Apr", score: 79 },
        { date: "May", score: 82 },
        { date: "Jun", score: 78 },
        { date: "Jul", score: 85 },
        { date: "Aug", score: 88 },
    ],
    recent_submissions: [
        {
            id: 1,
            file_name: "Physics_Final_2024.pdf",
            status: "complete",
            quick_score: 85,
            final_score: 82,
            max_score: 100,
            feedback: "Good work",
            strengths: [],
            weaknesses: [],
            improvement_suggestions: [],
            confidence: 0.95,
            created_at: "2026-02-12T10:30:00Z",
            updated_at: "2026-02-12T10:45:00Z",
        },
        {
            id: 2,
            file_name: "Math_Midterm_Q3.pdf",
            status: "processing_final",
            quick_score: 72,
            final_score: null,
            max_score: null,
            feedback: null,
            strengths: [],
            weaknesses: [],
            improvement_suggestions: [],
            confidence: null,
            created_at: "2026-02-11T14:20:00Z",
            updated_at: "2026-02-11T14:25:00Z",
        },
        {
            id: 3,
            file_name: "Chemistry_Lab.pdf",
            status: "complete",
            quick_score: 91,
            final_score: 88,
            max_score: 100,
            feedback: "Excellent",
            strengths: [],
            weaknesses: [],
            improvement_suggestions: [],
            confidence: 0.9,
            created_at: "2026-02-10T09:15:00Z",
            updated_at: "2026-02-10T09:30:00Z",
        },
        {
            id: 4,
            file_name: "English_Essay.pdf",
            status: "complete",
            quick_score: 78,
            final_score: 81,
            max_score: 100,
            feedback: "Good argumentation",
            strengths: [],
            weaknesses: [],
            improvement_suggestions: [],
            confidence: 0.88,
            created_at: "2026-02-09T16:45:00Z",
            updated_at: "2026-02-09T17:00:00Z",
        },
        {
            id: 5,
            file_name: "Biology_Quiz.pdf",
            status: "quick_done",
            quick_score: 67,
            final_score: null,
            max_score: null,
            feedback: null,
            strengths: [],
            weaknesses: [],
            improvement_suggestions: [],
            confidence: null,
            created_at: "2026-02-08T11:00:00Z",
            updated_at: "2026-02-08T11:15:00Z",
        },
    ],
};

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getDashboard();
                setData(result);
            } catch {
                setData(mockDashboard);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-60 rounded-xl" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
                    <Skeleton className="h-80 rounded-2xl" />
                </div>
            </div>
        );
    }

    const d = data || mockDashboard;

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"} 👋
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Here&apos;s an overview of your evaluation activity
                    </p>
                </div>
                <Link href="/upload">
                    <Button className="rounded-xl gap-2 btn-glow shadow-lg shadow-primary/20">
                        <Upload className="h-4 w-4" />
                        New Upload
                    </Button>
                </Link>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Uploads"
                    value={d.total_uploads}
                    icon={Upload}
                    trend={{ value: 12, positive: true }}
                    delay={0}
                />
                <StatCard
                    title="Average Score"
                    value={d.average_score}
                    suffix="%"
                    icon={TrendingUp}
                    delay={0.1}
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    trend={{ value: 3.5, positive: true }}
                />
                <StatCard
                    title="Completed"
                    value={d.completed_evaluations}
                    icon={FileCheck2}
                    delay={0.2}
                    iconColor="text-blue-600 dark:text-blue-400"
                />
                <StatCard
                    title="In Progress"
                    value={d.pending_evaluations}
                    icon={Clock}
                    delay={0.3}
                    iconColor="text-amber-600 dark:text-amber-400"
                />
            </div>

            {/* Charts & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart */}
                <ChartCard
                    title="Score Trend"
                    description="Average scores over the past months"
                    className="lg:col-span-2"
                    delay={0}
                >
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={d.score_trend}>
                                <defs>
                                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="oklch(0.55 0.22 265)" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="oklch(0.55 0.22 265)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="oklch(0.5 0 0 / 8%)"
                                />
                                <XAxis
                                    dataKey="date"
                                    stroke="oklch(0.5 0 0 / 40%)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="oklch(0.5 0 0 / 40%)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "oklch(0.18 0.015 265 / 90%)",
                                        border: "none",
                                        borderRadius: "12px",
                                        color: "#fff",
                                        fontSize: "13px",
                                        backdropFilter: "blur(20px)",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="oklch(0.55 0.22 265)"
                                    strokeWidth={2.5}
                                    fill="url(#scoreGrad)"
                                    animationDuration={1500}
                                    dot={{ r: 3, fill: "oklch(0.55 0.22 265)" }}
                                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <RecentActivity items={d.recent_submissions} />
                </motion.div>
            </div>

            {/* Quick Tip */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card rounded-2xl p-5 flex items-start gap-4"
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shrink-0 shadow-lg shadow-amber-500/20">
                    <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                    <p className="text-sm font-semibold mb-0.5">Pro Tip</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Upload rubrics alongside your answer sheets for the most accurate AI grading.
                        Our Gemini model uses the rubric to provide detailed, criteria-aligned feedback
                        with specific improvement suggestions.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
