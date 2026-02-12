"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRelativeTime, type SubmissionStatus } from "@/lib/utils";
import { FileText, Clock } from "lucide-react";
import { type Submission } from "@/lib/api";

interface RecentActivityProps {
    items: Submission[];
}

export function RecentActivity({ items }: RecentActivityProps) {
    return (
        <Card className="glass-card border-0 rounded-2xl h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">No recent submissions</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Upload an answer sheet to get started
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {items.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                                className="flex items-center gap-3 rounded-xl p-3 hover:bg-accent/50 transition-colors cursor-pointer group"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 group-hover:bg-primary/12 transition-colors">
                                    <FileText className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.file_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatRelativeTime(item.created_at)}
                                    </p>
                                </div>
                                <StatusBadge status={item.status as SubmissionStatus} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
