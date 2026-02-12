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
    submissions,
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
                                <SortableHeader field="quick_score">Quick Score</SortableHeader>
                                <SortableHeader field="final_score">Final Score</SortableHeader>
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
                                                {formatScore(sub.quick_score)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="tabular-nums font-medium">
                                                {formatScore(sub.final_score)}
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
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            {selectedSubmission?.file_name}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedSubmission && (
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl bg-muted/50 p-3">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        Quick Score
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {formatScore(selectedSubmission.quick_score)}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-muted/50 p-3">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        Final Score
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {formatScore(selectedSubmission.final_score)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium mb-2">Status</p>
                                <StatusBadge
                                    status={selectedSubmission.status as SubmissionStatus}
                                />
                            </div>

                            <div>
                                <p className="text-sm font-medium mb-2">Date</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(selectedSubmission.created_at)}
                                </p>
                            </div>

                            {selectedSubmission.feedback && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Feedback</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed rounded-xl bg-muted/50 p-3">
                                        {selectedSubmission.feedback}
                                    </p>
                                </div>
                            )}

                            {selectedSubmission.strengths &&
                                selectedSubmission.strengths.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Strengths</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedSubmission.strengths.map((s, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-xs"
                                                >
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {selectedSubmission.weaknesses &&
                                selectedSubmission.weaknesses.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Weaknesses</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedSubmission.weaknesses.map((w, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2.5 py-0.5 text-xs"
                                                >
                                                    {w}
                                                </span>
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
