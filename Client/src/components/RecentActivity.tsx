"use client";

import { motion } from "framer-motion";
import { SpotlightCard } from "@/components/SpotlightCard";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRelativeTime, type SubmissionStatus } from "@/lib/utils";
import { FileText, Clock, ArrowRight } from "lucide-react";
import { type Submission } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RecentActivityProps {
    items: Submission[];
}

export function RecentActivity({ items }: RecentActivityProps) {
    return (
        <SpotlightCard className="h-full flex flex-col">
            <div className="p-6 pb-2 flex items-center justify-between relative z-10">
                <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Recent Activity
                </h3>
                <Link href="/history">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary gap-1">
                        View All <ArrowRight className="h-3 w-3" />
                    </Button>
                </Link>
            </div>

            <div className="p-6 pt-2 flex-1 relative z-10">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3">
                        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                            <FileText className="h-8 w-8 opacity-50" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">No recent submissions</p>
                            <p className="text-xs opacity-60">Upload a file to get started</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {items.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                                className="group flex items-center gap-4 rounded-2xl p-4 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                                    <FileText className="h-5 w-5 text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate text-foreground/90 group-hover:text-primary transition-colors">
                                        {item.file_name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                                        {formatRelativeTime(item.created_at)}
                                    </p>
                                </div>

                                {item.status === 'complete' && item.final_score !== null && (
                                    <div className="text-right mr-2">
                                        <p className="text-sm font-bold text-foreground">
                                            {Math.round((item.final_score / (item.max_score || 100)) * 100)}%
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {item.final_score}/{item.max_score || 100}
                                        </p>
                                    </div>
                                )}

                                <StatusBadge status={item.status as SubmissionStatus} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </SpotlightCard>
    );
}
