"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

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
        const duration = 1200;
        const start = performance.now();
        const from = 0;

        const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
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
            {display}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
        >
            <Card
                className={cn(
                    "glass-card glass-card-hover border-0 rounded-2xl cursor-default",
                    className
                )}
            >
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground font-medium">{title}</p>
                            <p className="text-3xl font-bold tracking-tight">
                                <AnimatedCounter value={value} suffix={suffix} />
                            </p>
                            {trend && (
                                <p
                                    className={cn(
                                        "text-xs font-medium flex items-center gap-1",
                                        trend.positive
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-red-500 dark:text-red-400"
                                    )}
                                >
                                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-current/10 text-[10px]">
                                        {trend.positive ? "↑" : "↓"}
                                    </span>
                                    {Math.abs(trend.value)}% from last week
                                </p>
                            )}
                        </div>
                        <div
                            className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 shadow-inner",
                                iconColor
                            )}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
