"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { SpotlightCard } from "@/components/SpotlightCard";

interface StatCardProps {
    title: string;
    value: number;
    suffix?: string;
    icon: LucideIcon;
    trend?: { value: number; positive: boolean };
    delay?: number;
    className?: string;
    iconColor?: string;
}

function AnimatedCounter({
    value,
    suffix = "",
}: {
    value: number;
    suffix?: string;
}) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<number>(0);

    useEffect(() => {
        const duration = 1500;
        const start = performance.now();
        const from = 0;

        const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4); // Quartic ease-out
            setDisplay(Math.round(from + (value - from) * eased));

            if (progress < 1) {
                ref.current = requestAnimationFrame(tick);
            }
        };

        ref.current = requestAnimationFrame(tick);
        return () => {
            if (ref.current) cancelAnimationFrame(ref.current);
        };
    }, [value]);

    return (
        <span className="tabular-nums">
            {display.toLocaleString()}
            {suffix}
        </span>
    );
}

export function StatCard({
    title,
    value,
    suffix,
    icon: Icon,
    trend,
    delay = 0,
    className,
    iconColor = "text-primary",
}: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
        >
            <SpotlightCard className={cn("p-6", className)}>
                <div className="flex items-start justify-between relative z-10">
                    <div className="space-y-3">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{title}</p>
                        <p className="text-4xl font-extrabold tracking-tight gradient-text inline-block">
                            <AnimatedCounter value={value} suffix={suffix} />
                        </p>
                        {trend && (
                            <div
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                    trend.positive
                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                        : "bg-red-500/10 text-red-500 border-red-500/20"
                                )}
                            >
                                <span className="text-[10px]">{trend.positive ? "▲" : "▼"}</span>
                                {Math.abs(trend.value)}%
                            </div>
                        )}
                    </div>
                    <motion.div
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        className={cn(
                            "flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-inner backdrop-blur-md",
                            iconColor
                        )}
                    >
                        <Icon className="h-7 w-7 opacity-90" />
                    </motion.div>
                </div>
            </SpotlightCard>
        </motion.div>
    );
}
