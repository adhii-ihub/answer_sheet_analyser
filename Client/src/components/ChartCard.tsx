"use client";

import { motion } from "framer-motion";
import { SpotlightCard } from "@/components/SpotlightCard";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface ChartCardProps {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    delay?: number;
}

export function ChartCard({
    title,
    description,
    children,
    className,
    delay = 0,
}: ChartCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
        >
            <SpotlightCard className={cn("p-6", className)}>
                <div className="mb-6 relative z-10">
                    <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-1 font-medium opacity-80">{description}</p>
                    )}
                </div>
                <div className="relative z-10">{children}</div>
            </SpotlightCard>
        </motion.div>
    );
}
