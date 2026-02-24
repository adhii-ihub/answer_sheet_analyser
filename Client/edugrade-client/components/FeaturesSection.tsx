"use client";
import { motion } from "framer-motion";
import {
    Zap,
    BarChart3,
    ScanLine,
    Edit3,
    FileSpreadsheet,
    PieChart,
    Clock,
    CheckCircle2,
} from "lucide-react";

const features = [
    {
        icon: Zap,
        title: "Fast Batch Evaluation",
        desc: "Evaluate 60+ answer sheets simultaneously using parallel Celery workers. Minutes, not hours.",
        color: "#1A73E8",
        span: "md:col-span-2",
    },
    {
        icon: BarChart3,
        title: "Live Progress Tracking",
        desc: "Real-time batch progress board — watch OCR and AI evaluation stream live.",
        color: "#0f9b5f",
        span: "",
    },
    {
        icon: ScanLine,
        title: "Diagram & Numerical Recognition",
        desc: "Advanced OCR via LightNeonOCR2 recognizes handwritten text, equations, and diagrams.",
        color: "#7c3aed",
        span: "",
    },
    {
        icon: Edit3,
        title: "Teacher Override",
        desc: "Controllers can review AI marks and manually override any question's score with justification.",
        color: "#d97706",
        span: "",
    },
    {
        icon: FileSpreadsheet,
        title: "CSV / PDF Reports",
        desc: "Export complete mark sheets in CSV or professionally formatted PDF with one click.",
        color: "#0ea5e9",
        span: "",
    },
    {
        icon: PieChart,
        title: "Analytics Dashboard",
        desc: "Per-question averages, grade distributions, low-confidence flags, and class insights.",
        color: "#e11d48",
        span: "md:col-span-2",
    },
];

const perks = [
    { icon: Clock, text: "100× faster than manual grading" },
    { icon: CheckCircle2, text: "On-premise — no data leaves campus" },
];

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay: i * 0.09 },
    }),
};

export default function FeaturesSection() {
    return (
        <section
            id="features"
            className="py-28"
            style={{ background: "linear-gradient(160deg, #f4f6fb 0%, #fafafa 100%)" }}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div>
                        <p className="section-label mb-3">Platform Capabilities</p>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                            Everything the{" "}
                            <span className="text-[#1A73E8]">Examiner</span> Needs
                        </h2>
                    </div>
                    <div className="flex flex-col gap-3">
                        {perks.map((p) => (
                            <div key={p.text} className="flex items-center gap-2.5 text-sm text-gray-500">
                                <p.icon size={15} className="text-[#1A73E8] shrink-0" />
                                {p.text}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feature grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {features.map((f, i) => (
                        <motion.div
                            key={f.title}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            custom={i}
                            variants={fadeUp}
                            className={`bento-card feature-card p-7 flex flex-col gap-5 ${f.span}`}
                        >
                            {/* Icon */}
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${f.color}14` }}
                            >
                                <f.icon size={22} style={{ color: f.color }} strokeWidth={1.8} />
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-1.5">
                                    {f.title}
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                            </div>

                            {/* Bottom accent line */}
                            <div className="mt-auto">
                                <div className="h-[2px] w-10 rounded-full" style={{ backgroundColor: f.color }} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
