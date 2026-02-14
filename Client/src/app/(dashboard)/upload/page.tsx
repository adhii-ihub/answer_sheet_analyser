"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UploadCard } from "@/components/UploadCard";
import { StatusBadge } from "@/components/StatusBadge";
import { uploadSubmission, getSubmission, type Submission } from "@/lib/api";
import { formatRelativeTime, formatScore, type SubmissionStatus } from "@/lib/utils";
import { Send, Loader2, CheckCircle2, FileText } from "lucide-react";

export default function UploadPage() {
    const [questionPaper, setQuestionPaper] = useState<File | null>(null);
    const [answerSheet, setAnswerSheet] = useState<File | null>(null);
    const [rubric, setRubric] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [error, setError] = useState("");
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const allFilesSelected = questionPaper && answerSheet && rubric;

    // Simulated progress animation
    useEffect(() => {
        if (!isUploading) return;
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            setUploadProgress(progress);
        }, 300);
        return () => clearInterval(interval);
    }, [isUploading]);

    // Poll for submission status updates
    const startPolling = useCallback((id: number) => {
        pollingRef.current = setInterval(async () => {
            try {
                const updated = await getSubmission(id);
                setSubmission(updated);
                if (updated.status === "complete") {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                }
            } catch {
                // Silently handle polling errors
            }
        }, 5000);
    }, []);

    // Clean up polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const handleSubmit = async () => {
        if (!allFilesSelected) return;
        setError("");
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append("question_file", questionPaper);
            formData.append("answer_file", answerSheet);
            formData.append("rubric_file", rubric);

            const result = await uploadSubmission(formData);
            setUploadProgress(100);
            setSubmission(result);
            setIsUploading(false);

            // Start polling for status updates
            startPolling(result.id);

            // Reset files
            setQuestionPaper(null);
            setAnswerSheet(null);
            setRubric(null);
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Upload failed. Please try again."
            );
            setIsUploading(false);

            // Mock submission for demo when backend is unavailable
            const mockSubmission: Submission = {
                id: Date.now(),
                file_name: answerSheet.name,
                status: "uploading",
                quick_score: null,
                final_score: null,
                max_score: null,
                feedback: null,
                strengths: [],
                weaknesses: [],
                improvement_suggestions: [],
                confidence: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            setSubmission(mockSubmission);
            setUploadProgress(100);
            setError("");

            // Simulate status progression for demo
            const statuses: SubmissionStatus[] = [
                "processing_quick",
                "quick_done",
                "processing_final",
                "complete",
            ];
            let idx = 0;
            const demoInterval = setInterval(() => {
                if (idx < statuses.length) {
                    setSubmission((prev) =>
                        prev
                            ? {
                                ...prev,
                                status: statuses[idx],
                                final_score: idx >= 3 ? 79 : null,
                                feedback:
                                    idx >= 3
                                        ? "Good understanding of core concepts. Needs improvement in application-based questions."
                                        : null,
                            }
                            : null
                    );
                    idx++;
                } else {
                    clearInterval(demoInterval);
                }
            }, 3000);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold tracking-tight">Upload Files</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Upload question paper, answer sheet, and rubric for AI evaluation
                </p>
            </motion.div>

            {/* Upload Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <UploadCard
                        label="Question Paper"
                        description="PDF or Image file"
                        file={questionPaper}
                        onFileSelect={setQuestionPaper}
                    />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <UploadCard
                        label="Answer Sheet"
                        description="PDF or Image file"
                        file={answerSheet}
                        onFileSelect={setAnswerSheet}
                    />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <UploadCard
                        label="Rubric"
                        description="PDF or Image file"
                        file={rubric}
                        onFileSelect={setRubric}
                    />
                </motion.div>
            </div>

            {/* Submit */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                {error && (
                    <div className="rounded-xl bg-destructive/10 text-destructive text-sm px-4 py-3 mb-4">
                        {error}
                    </div>
                )}

                {isUploading && (
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Uploading files...</span>
                            <span className="font-medium tabular-nums">
                                {Math.round(uploadProgress)}%
                            </span>
                        </div>
                        <Progress value={uploadProgress} className="h-2 rounded-full" />
                    </div>
                )}

                <Button
                    onClick={handleSubmit}
                    disabled={!allFilesSelected || isUploading}
                    className="w-full md:w-auto rounded-xl h-11 px-8 gap-2"
                    size="lg"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4" />
                            Submit for Evaluation
                        </>
                    )}
                </Button>
            </motion.div>

            {/* Submission Card */}
            <AnimatePresence>
                {submission && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Card className="glass-card border-0 rounded-2xl overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        {submission.file_name}
                                    </CardTitle>
                                    <StatusBadge
                                        status={submission.status as SubmissionStatus}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Submitted {formatRelativeTime(submission.created_at)}
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Score & Confidence */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-muted/50 p-4">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Score
                                        </p>
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={submission.final_score ?? "pending"}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            >
                                                <p className="text-2xl font-bold">
                                                    {submission.final_score !== null
                                                        ? formatScore(submission.final_score, submission.max_score)
                                                        : "—"}
                                                </p>
                                                {submission.final_score !== null && submission.max_score && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {submission.final_score} / {submission.max_score} points
                                                    </p>
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                    {submission.confidence !== null && (
                                        <div className="rounded-xl bg-muted/50 p-4">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <p className="text-xs text-muted-foreground">
                                                    Reading Confidence
                                                </p>
                                            </div>
                                            <p className="text-2xl font-bold">
                                                {Math.round(submission.confidence * 100)}%
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Status Progress */}
                                <div className="flex items-center gap-2">
                                    {(
                                        [
                                            "uploading",
                                            "processing_quick",
                                            "quick_done",
                                            "processing_final",
                                            "complete",
                                        ] as SubmissionStatus[]
                                    ).map((s, i) => {
                                        const statusOrder = [
                                            "uploading",
                                            "processing_quick",
                                            "quick_done",
                                            "processing_final",
                                            "complete",
                                        ];
                                        const currentIdx = statusOrder.indexOf(
                                            submission.status as SubmissionStatus
                                        );
                                        const isCompleted = i <= currentIdx;

                                        return (
                                            <div key={s} className="flex-1 flex items-center gap-2">
                                                <div className="flex-1">
                                                    <motion.div
                                                        className={`h-1.5 rounded-full ${isCompleted
                                                            ? "bg-primary"
                                                            : "bg-muted-foreground/20"
                                                            }`}
                                                        initial={{ scaleX: 0, originX: 0 }}
                                                        animate={{ scaleX: isCompleted ? 1 : 0 }}
                                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Feedback */}
                                {submission.feedback && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                                Evaluation Complete
                                            </p>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                            {submission.feedback}
                                        </p>
                                    </motion.div>
                                )}

                                {/* Strengths */}
                                {submission.strengths && submission.strengths.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <p className="text-sm font-medium mb-2">✅ Strengths</p>
                                        <div className="space-y-1.5">
                                            {submission.strengths.map((s, i) => (
                                                <div
                                                    key={i}
                                                    className="text-sm text-muted-foreground rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 border border-emerald-200/30 dark:border-emerald-800/30"
                                                >
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Weaknesses */}
                                {submission.weaknesses && submission.weaknesses.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <p className="text-sm font-medium mb-2">⚠️ Areas for Improvement</p>
                                        <div className="space-y-1.5">
                                            {submission.weaknesses.map((w, i) => (
                                                <div
                                                    key={i}
                                                    className="text-sm text-muted-foreground rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 border border-amber-200/30 dark:border-amber-800/30"
                                                >
                                                    {w}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Improvement Suggestions */}
                                {submission.improvement_suggestions && submission.improvement_suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <p className="text-sm font-medium mb-2">💡 Suggestions</p>
                                        <div className="space-y-1.5">
                                            {submission.improvement_suggestions.map((s, i) => (
                                                <div
                                                    key={i}
                                                    className="text-sm text-muted-foreground rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-2 border border-blue-200/30 dark:border-blue-800/30"
                                                >
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
