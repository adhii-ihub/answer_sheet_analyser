"use client";

import { motion } from "framer-motion";
import { cn, type SubmissionStatus, statusConfig } from "@/lib/utils";

interface StatusBadgeProps {
    status: SubmissionStatus;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status];

    if (!config) {
        return (
            <span className="text-xs text-muted-foreground">Unknown</span>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                config.bgColor,
                config.color,
                className
            )}
        >
            {config.pulse ? (
                <motion.span
                    className={cn("h-1.5 w-1.5 rounded-full", "bg-current")}
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
            )}
            {config.label}
        </span>
    );
}
