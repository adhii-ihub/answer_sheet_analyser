"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import {
    formatDate,
    formatScore,
    type SubmissionStatus,
} from "@/lib/utils";
import { Eye, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Submission } from "@/lib/api";

interface SubmissionTableProps {
    submissions: Submission[];
    totalCount: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onSort: (field: string) => void;
    sortField: string;
    sortOrder: "asc" | "desc";
    isLoading: boolean;
}

export function SubmissionTable({
    submissions = [],
    totalCount,
    currentPage,
    onPageChange,
    onSort,
    sortField,
    sortOrder,
    isLoading,
}: SubmissionTableProps) {
    const [selectedSubmission, setSelectedSubmission] =
        useState<Submission | null>(null);
    const pageSize = 10;
    const totalPages = Math.ceil(totalCount / pageSize);

    const SortableHeader = ({
        field,
        children,
    }: {
        field: string;
        children: React.ReactNode;
    }) => (
        <TableHead>
            <button
                onClick={() => onSort(field)}
                className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
            >
                {children}
                <ArrowUpDown
                    className={`h-3 w-3 ${sortField === field ? "text-primary" : "text-muted-foreground/50"}`}
                />
            </button>
        </TableHead>
    );

    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="rounded-2xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <SortableHeader field="file_name">File Name</SortableHeader>
                                <SortableHeader field="final_score">Score</SortableHeader>
                                <TableHead>Status</TableHead>
                                <SortableHeader field="created_at">Date</SortableHeader>
                                <TableHead className="w-12">View</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <p className="text-sm text-muted-foreground">
                                            No submissions found
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                submissions.map((sub, i) => (
                                    <motion.tr
                                        key={sub.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: i * 0.03 }}
                                        className="group border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors"
                                        onClick={() => setSelectedSubmission(sub)}
                                    >
                                        <TableCell className="font-medium max-w-[200px] truncate">
                                            {sub.file_name}
                                        </TableCell>
                                        <TableCell>
                                            <span className="tabular-nums font-medium">
                                                {formatScore(sub.final_score, sub.max_score)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={sub.status as SubmissionStatus}
                                            />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(sub.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </motion.tr>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1}–
                        {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            disabled={currentPage <= 1}
                            onClick={() => onPageChange(currentPage - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                            const p = i + 1;
                            return (
                                <Button
                                    key={p}
                                    variant={currentPage === p ? "default" : "outline"}
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-xs"
                                    onClick={() => onPageChange(p)}
                                >
                                    {p}
                                </Button>
                            );
                        })}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            disabled={currentPage >= totalPages}
                            onClick={() => onPageChange(currentPage + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            <Dialog
                open={!!selectedSubmission}
                onOpenChange={() => setSelectedSubmission(null)}
            >
                <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl bg-background/95 backdrop-blur-md border border-border shadow-2xl">
                    <DialogHeader className="p-6 pb-2 shrink-0 bg-background/80 backdrop-blur-md z-10 sticky top-0 border-b border-border/10">
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <span className="truncate">{selectedSubmission?.file_name}</span>
                            {selectedSubmission && (
                                <StatusBadge status={selectedSubmission.status as SubmissionStatus} />
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedSubmission && (
                        <div className="overflow-y-auto p-6 pt-4 space-y-6">
                            {/* Score & Confidence */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl bg-muted/50 p-4 border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">
                                        Total Score
                                    </p>
                                    <div>
                                        <p className="text-3xl font-bold tracking-tight">
                                            {formatScore(selectedSubmission.final_score, selectedSubmission.max_score)}
                                        </p>
                                        {selectedSubmission.final_score !== null && selectedSubmission.max_score && (
                                            <p className="text-sm text-muted-foreground mt-1 font-medium">
                                                {selectedSubmission.final_score} / {selectedSubmission.max_score} points
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {selectedSubmission.confidence !== null && (
                                    <div className="rounded-xl bg-muted/50 p-4 border border-border/50">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                                Reading Confidence
                                            </p>
                                        </div>
                                        <p className="text-3xl font-bold tracking-tight">
                                            {Math.round(selectedSubmission.confidence * 100)}%
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            AI certainty in handwriting analysis
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground border-y border-border/50 py-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">Date:</span>
                                    {formatDate(selectedSubmission.created_at)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">ID:</span>
                                    #{selectedSubmission.id}
                                </div>
                            </div>

                            {selectedSubmission.feedback && (
                                <div>
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                        📝 Detailed Feedback
                                    </h4>
                                    <div className="text-sm text-muted-foreground leading-relaxed rounded-xl bg-muted/30 p-4 border border-border/50 whitespace-pre-line">
                                        {selectedSubmission.feedback}
                                    </div>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6">
                                {selectedSubmission.strengths && selectedSubmission.strengths.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                            ✅ Strengths
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedSubmission.strengths.map((s, i) => (
                                                <div
                                                    key={i}
                                                    className="text-sm text-foreground/80 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 px-3 py-2.5 border border-emerald-100 dark:border-emerald-900/20"
                                                >
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedSubmission.weaknesses && selectedSubmission.weaknesses.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                            ⚠️ Areas for Improvement
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedSubmission.weaknesses.map((w, i) => (
                                                <div
                                                    key={i}
                                                    className="text-sm text-foreground/80 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 px-3 py-2.5 border border-amber-100 dark:border-amber-900/20"
                                                >
                                                    {w}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedSubmission.improvement_suggestions && selectedSubmission.improvement_suggestions.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                        💡 Suggestions for Improvement
                                    </h4>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {selectedSubmission.improvement_suggestions.map((s, i) => (
                                            <div
                                                key={i}
                                                className="text-sm text-foreground/80 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 px-3 py-3 border border-blue-100 dark:border-blue-900/20 flex gap-3"
                                            >
                                                <span className="text-blue-500 font-bold shrink-0">{i + 1}.</span>
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
