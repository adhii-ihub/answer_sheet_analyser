"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/ChartCard";
import { StatCard } from "@/components/StatCard";
import { getAnalytics, type AnalyticsData } from "@/lib/api";
import { BarChart3, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
} from "recharts";

const CHART_COLORS = [
    "oklch(0.55 0.2 265)",
    "oklch(0.65 0.18 160)",
    "oklch(0.75 0.15 80)",
    "oklch(0.6 0.22 320)",
    "oklch(0.7 0.2 40)",
];

const mockAnalytics: AnalyticsData = {
    score_over_time: [
        { date: "Week 1", score: 68 },
        { date: "Week 2", score: 72 },
        { date: "Week 3", score: 70 },
        { date: "Week 4", score: 76 },
        { date: "Week 5", score: 79 },
        { date: "Week 6", score: 82 },
        { date: "Week 7", score: 78 },
        { date: "Week 8", score: 85 },
    ],
    performance_comparison: [
        { subject: "Physics", score: 82 },
        { subject: "Math", score: 75 },
        { subject: "Chemistry", score: 88 },
        { subject: "English", score: 79 },
        { subject: "Biology", score: 71 },
        { subject: "History", score: 84 },
    ],
    strengths_weaknesses: [
        { name: "Problem Solving", value: 35 },
        { name: "Conceptual Understanding", value: 28 },
        { name: "Application", value: 20 },
        { name: "Needs Improvement", value: 17 },
    ],
    total_submissions: 147,
    average_score: 78,
    highest_score: 95,
    lowest_score: 52,
};

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getAnalytics();
                setData(result);
            } catch {
                setData(mockAnalytics);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-40" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-80 rounded-2xl" />
                    <Skeleton className="h-80 rounded-2xl" />
                </div>
            </div>
        );
    }

    const d = data || mockAnalytics;

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Performance insights and evaluation trends
                </p>
            </motion.div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Submissions"
                    value={d.total_submissions}
                    icon={BarChart3}
                    delay={0}
                />
                <StatCard
                    title="Average Score"
                    value={d.average_score}
                    suffix="%"
                    icon={TrendingUp}
                    delay={0.1}
                    iconColor="text-emerald-600 dark:text-emerald-400"
                />
                <StatCard
                    title="Highest Score"
                    value={d.highest_score}
                    suffix="%"
                    icon={ArrowUp}
                    delay={0.2}
                    iconColor="text-blue-600 dark:text-blue-400"
                />
                <StatCard
                    title="Lowest Score"
                    value={d.lowest_score}
                    suffix="%"
                    icon={ArrowDown}
                    delay={0.3}
                    iconColor="text-amber-600 dark:text-amber-400"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart – Score over time */}
                <ChartCard
                    title="Score Trend"
                    description="Average score progression over time"
                    delay={0}
                >
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={d.score_over_time}>
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
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke={CHART_COLORS[0]}
                                    strokeWidth={2.5}
                                    dot={{ r: 4, fill: CHART_COLORS[0] }}
                                    activeDot={{ r: 6 }}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Bar Chart – Performance comparison */}
                <ChartCard
                    title="Subject Performance"
                    description="Score comparison across subjects"
                    delay={0.1}
                >
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={d.performance_comparison}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="oklch(0.5 0 0 / 10%)"
                                />
                                <XAxis
                                    dataKey="subject"
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
                                <Bar
                                    dataKey="score"
                                    radius={[8, 8, 0, 0]}
                                    animationDuration={1200}
                                >
                                    {d.performance_comparison.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Pie Chart – Strengths & Weaknesses */}
                <ChartCard
                    title="Strengths & Weaknesses"
                    description="Distribution of evaluation categories"
                    className="lg:col-span-2"
                    delay={0.2}
                >
                    <div className="h-72 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={d.strengths_weaknesses}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={4}
                                    dataKey="value"
                                    animationDuration={1200}
                                >
                                    {d.strengths_weaknesses.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "oklch(0.18 0.015 265 / 90%)",
                                        border: "none",
                                        borderRadius: "12px",
                                        color: "#fff",
                                        fontSize: "13px",
                                    }}
                                />
                                <Legend
                                    verticalAlign="middle"
                                    align="right"
                                    layout="vertical"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: "13px" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>
        </div>
    );
}
