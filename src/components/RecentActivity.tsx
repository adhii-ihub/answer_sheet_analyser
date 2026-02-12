"use client";

import { motion } from "framer-motion";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRelativeTime, type SubmissionStatus } from "@/lib/utils";
import { FileText } from "lucide-react";

interface ActivityItem {
    id: number;
    file_name: string;
    status: SubmissionStatus;
    created_at: string;
    quick_score: number | null;
}

interface RecentActivityProps {
    items: ActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No recent submissions</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                    Upload an answer sheet to get started
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {items.map((item, i) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(item.created_at)}
                        </p>
                    </div>
                    <StatusBadge status={item.status} />
                </motion.div>
            ))}
        </div>
    );
}
