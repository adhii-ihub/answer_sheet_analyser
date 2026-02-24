"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
    FileCheck2,
    Users,
    AlertTriangle,
    Clock4,
    TrendingUp,
    ChevronRight,
} from "lucide-react";

function useCounter(target: number, isActive: boolean, duration = 1600) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!isActive) return;
        let start = 0;
        const step = duration / target;
        const timer = setInterval(() => {
            start += 1;
            setValue(start);
            if (start >= target) clearInterval(timer);
        }, step);
        return () => clearInterval(timer);
    }, [isActive, target, duration]);
    return value;
}

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: number;
    suffix?: string;
    color: string;
    isActive: boolean;
    progress?: number;
    caption?: string;
}

function StatCard({ icon: Icon, label, value, suffix = "", color, isActive, progress, caption }: StatCardProps) {
    const count = useCounter(value, isActive, 1400);
    return (
        <div className="stat-card flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}14` }}
                >
                    <Icon size={18} style={{ color }} strokeWidth={2} />
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                    {label}
                </span>
            </div>
            <div>
                <p className="text-4xl font-black text-gray-900 tabular-nums">
                    {count.toLocaleString()}
                    <span className="text-xl font-semibold text-gray-400 ml-1">{suffix}</span>
                </p>
                {caption && (
                    <p className="text-xs text-gray-400 mt-1">{caption}</p>
                )}
            </div>
            {progress !== undefined && (
                <div className="progress-bar-track">
                    <div
                        className="progress-bar-fill transition-all duration-1000"
                        style={{ width: isActive ? `${progress}%` : "0%", backgroundColor: color }}
                    />
                </div>
            )}
        </div>
    );
}

const stats = [
    { icon: FileCheck2, label: "Total Exams", value: 128, suffix: "", color: "#1A73E8", progress: 78, caption: "Active semester exams tracked" },
    { icon: Users, label: "Students Evaluated", value: 4860, suffix: "+", color: "#0f9b5f", progress: 91, caption: "AI evaluations completed this year" },
    { icon: AlertTriangle, label: "Low Confidence Flags", value: 47, suffix: "", color: "#d97706", progress: 22, caption: "Awaiting teacher review" },
    { icon: Clock4, label: "Pending Reviews", value: 12, suffix: "", color: "#7c3aed", progress: 10, caption: "Manual override needed" },
];

const barData = [
    { label: "CS3301", avg: 72 },
    { label: "MA2201", avg: 65 },
    { label: "PH1101", avg: 80 },
    { label: "EC4401", avg: 58 },
    { label: "ME2302", avg: 76 },
];

export default function DashboardPreview() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section
            id="dashboard"
            className="py-28"
            style={{ background: "linear-gradient(160deg, #fafafa 0%, #f0f4fd 100%)" }}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
                    <div>
                        <p className="section-label mb-3">Live Dashboard</p>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                            Real-time{" "}
                            <span className="text-[#1A73E8]">Evaluation</span> Insights
                        </h2>
                        <p className="text-gray-500 mt-3 text-base max-w-lg">
                            Monitor batch progress, flag anomalies, and act on pending reviews — all in one view.
                        </p>
                    </div>
                    <button className="btn-accent flex items-center gap-2 self-start md:self-auto">
                        Open Full Dashboard <ChevronRight size={15} />
                    </button>
                </div>

                {/* Metric cards */}
                <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                    {stats.map((s) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <StatCard {...s} isActive={inView} />
                        </motion.div>
                    ))}
                </div>

                {/* Bottom row — Analytics chart + Progress panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Bar chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bento-card md:col-span-2 p-7"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="font-bold text-gray-900">Subject-wise Average Score</p>
                                <p className="text-xs text-gray-400 mt-0.5">Current Semester · All Departments</p>
                            </div>
                            <TrendingUp size={18} className="text-[#1A73E8]" />
                        </div>
                        <div className="flex items-end gap-4 h-36">
                            {barData.map((b, i) => (
                                <div key={b.label} className="flex flex-col items-center gap-2 flex-1">
                                    <span className="text-xs font-bold text-gray-700">{b.avg}%</span>
                                    <motion.div
                                        className="w-full rounded-t-lg"
                                        style={{ backgroundColor: "#1A73E8", opacity: 0.15 + i * 0.17 }}
                                        initial={{ height: 0 }}
                                        whileInView={{ height: `${b.avg}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: "easeOut" }}
                                    />
                                    <span className="text-[10px] text-gray-400 font-medium">{b.label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Batch progress */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bento-card p-7 flex flex-col gap-5"
                    >
                        <div>
                            <p className="font-bold text-gray-900">Batch Progress</p>
                            <p className="text-xs text-gray-400 mt-0.5">CS3301 · 60 students</p>
                        </div>
                        {[
                            { stage: "OCR Completed", pct: 100, color: "#0f9b5f" },
                            { stage: "AI Evaluated", pct: 78, color: "#1A73E8" },
                            { stage: "Reviewed", pct: 45, color: "#7c3aed" },
                            { stage: "Finalized", pct: 30, color: "#d97706" },
                        ].map((row) => (
                            <div key={row.stage} className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600 font-medium">{row.stage}</span>
                                    <span className="text-gray-400">{row.pct}%</span>
                                </div>
                                <div className="progress-bar-track">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: row.color }}
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${row.pct}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1, delay: 0.3 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
