"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileCheck, TrendingUp, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { RecentActivity } from "@/components/RecentActivity";
import { getDashboard, type DashboardData } from "@/lib/api";
import type { SubmissionStatus } from "@/lib/utils";
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

// Mock data for when backend is unavailable
const mockDashboard: DashboardData = {
    total_uploads: 147,
    average_score: 78,
    completed_evaluations: 132,
    pending_evaluations: 15,
    recent_submissions: [
        {
            id: 1,
            file_name: "Physics_Final_2024.pdf",
            status: "complete",
            quick_score: 85,
            final_score: 82,
            feedback: "Good understanding of concepts",
            strengths: ["Problem solving", "Clarity"],
            weaknesses: ["Time management"],
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: 2,
            file_name: "Math_Midterm_Q3.pdf",
            status: "processing_final",
            quick_score: 72,
            final_score: null,
            feedback: null,
            strengths: [],
            weaknesses: [],
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: 3,
            file_name: "Chemistry_Lab_Report.pdf",
            status: "quick_done",
            quick_score: 91,
            final_score: null,
            feedback: null,
            strengths: [],
            weaknesses: [],
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: 4,
            file_name: "English_Essay_Final.pdf",
            status: "processing_quick",
            quick_score: null,
            final_score: null,
            feedback: null,
            strengths: [],
            weaknesses: [],
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: 5,
            file_name: "Biology_Quiz_Week12.pdf",
            status: "complete",
            quick_score: 67,
            final_score: 71,
            feedback: "Needs improvement in cellular biology",
            strengths: ["Genetics"],
            weaknesses: ["Cell biology", "Diagrams"],
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            updated_at: new Date().toISOString(),
        },
    ],
    score_trend: [
        { date: "Mon", score: 72 },
        { date: "Tue", score: 78 },
        { date: "Wed", score: 74 },
        { date: "Thu", score: 82 },
        { date: "Fri", score: 79 },
        { date: "Sat", score: 85 },
        { date: "Sun", score: 88 },
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
                // Use mock data when backend is unavailable
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
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
                    <Skeleton className="h-64 rounded-2xl" />
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
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Overview of your exam evaluations
                    </p>
                </div>
                <Link href="/upload">
                    <Button className="rounded-xl gap-2 h-10">
                        <Plus className="h-4 w-4" />
                        New Upload
                    </Button>
                </Link>
            </motion.div>

            {/* Stat Cards */}
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
                    trend={{ value: 3, positive: true }}
                    delay={0.1}
                    iconColor="text-emerald-600 dark:text-emerald-400"
                />
                <StatCard
                    title="Completed"
                    value={d.completed_evaluations}
                    icon={FileCheck}
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

            {/* Charts + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2"
                >
                    <Card className="glass-card border-0 rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">
                                Score Trend
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Average scores over the past week
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={d.score_trend}>
                                        <defs>
                                            <linearGradient
                                                id="scoreGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="oklch(0.55 0.2 265)"
                                                    stopOpacity={0.3}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="oklch(0.55 0.2 265)"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="oklch(0.5 0 0 / 10%)"
                                        />
                                        <XAxis
                                            dataKey="date"
                                            stroke="oklch(0.5 0 0 / 50%)"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="oklch(0.5 0 0 / 50%)"
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
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="score"
                                            stroke="oklch(0.55 0.2 265)"
                                            strokeWidth={2.5}
                                            fill="url(#scoreGradient)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="glass-card border-0 rounded-2xl h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <RecentActivity
                                items={d.recent_submissions.slice(0, 5).map((s) => ({
                                    ...s,
                                    status: s.status as SubmissionStatus,
                                }))}
                            />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
