"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCard } from "@/components/UploadCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ExamSelector } from "@/components/ExamSelector";
import { uploadSubmission, getSubmission, type Submission, type Exam } from "@/lib/api";
import { formatRelativeTime, formatScore, type SubmissionStatus } from "@/lib/utils";
import { Send, Loader2, CheckCircle2, FileText, User } from "lucide-react";

export default function UploadPage() {
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [examName, setExamName] = useState("");
    const [studentName, setStudentName] = useState("");
    const [examSelectorKey, setExamSelectorKey] = useState(0); // To force refresh

    // File states
    const [questionPaper, setQuestionPaper] = useState<File | null>(null);
    const [answerFiles, setAnswerFiles] = useState<File[]>([]);
    const [rubric, setRubric] = useState<File | null>(null);

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [error, setError] = useState("");

    // If new exam, need name + QP. If existing exam, need just answer(s).
    const isNewExam = !selectedExam;
    const canSubmit = isNewExam
        ? (!!examName && !!questionPaper && answerFiles.length > 0)
        : (!!selectedExam && answerFiles.length > 0);

    // Context for Student Name input availability
    const isBulkUpload = answerFiles.length > 1;

    // Simulated progress animation
    useEffect(() => {
        if (!isUploading) return;
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 5; // Slower progress for potentially multiple files
            if (progress > 95) progress = 95;
            setUploadProgress(progress);
        }, 500);
        return () => clearInterval(interval);
    }, [isUploading]);

    // Poll for status updates for all incomplete submissions
    useEffect(() => {
        const incompleteIds = submissions
            .filter(s => ["uploading", "processing_quick", "processing_final", "processing"].includes(s.status))
            .map(s => s.id);

        if (incompleteIds.length === 0) return;

        const interval = setInterval(async () => {
            for (const id of incompleteIds) {
                try {
                    const updated = await getSubmission(id);
                    setSubmissions(prev => prev.map(s => s.id === id ? updated : s));
                } catch {
                    // ignore
                }
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [submissions]);

    const handleExamSelect = (exam: Exam | null) => {
        setSelectedExam(exam);
        if (exam) {
            localStorage.setItem("activeExamId", exam.id.toString());
            setQuestionPaper(null);
            setRubric(null);
            setExamName("");
            setStudentName("");
        } else {
            localStorage.removeItem("activeExamId");
        }
    };

    const handleCreateNew = () => {
        handleExamSelect(null);
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setError("");
        setIsUploading(true);
        setUploadProgress(0);
        setSubmissions([]); // Clear previous batch

        try {
            let currentExamId = selectedExam?.id;
            const totalFiles = answerFiles.length;

            // Allow single student name if single file, else auto-name
            const getName = (f: File) => (!isBulkUpload && studentName) ? studentName : f.name.replace(/\.[^/.]+$/, "");

            // 1. Upload first file (creates Exam if needed)
            const firstFile = answerFiles[0];
            const firstFormData = new FormData();
            firstFormData.append("answer_file", firstFile);
            firstFormData.append("student_name", getName(firstFile));

            if (currentExamId) {
                firstFormData.append("exam_id", currentExamId.toString());
            } else {
                firstFormData.append("exam_name", examName);
                firstFormData.append("question_file", questionPaper!);
                if (rubric) firstFormData.append("rubric_file", rubric);
            }

            const firstResult = await uploadSubmission(firstFormData);
            setSubmissions([firstResult]);
            setUploadProgress(Math.round((1 / totalFiles) * 100));

            // capture new exam ID
            if (!currentExamId && firstResult.exam) {
                currentExamId = firstResult.exam;
                localStorage.setItem("activeExamId", currentExamId.toString());
                setExamSelectorKey(prev => prev + 1);
                // Also optimistically set selectedExam to avoid UI resetting if logic depends on it
                // But mostly we just need the ID for subsequent uploads
            }

            // 2. Upload remaining files
            for (let i = 1; i < totalFiles; i++) {
                const file = answerFiles[i];
                const formData = new FormData();
                formData.append("answer_file", file);
                formData.append("student_name", getName(file));
                formData.append("exam_id", currentExamId!.toString());

                const result = await uploadSubmission(formData);
                setSubmissions(prev => [result, ...prev]); // Add to top
                setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
            }

            setAnswerFiles([]);
            setStudentName("");
            setIsUploading(false);

        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Upload failed. Please try again."
            );
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-1"
            >
                <h1 className="text-2xl font-bold tracking-tight">Teacher Console</h1>
                <p className="text-sm text-muted-foreground">
                    Manage exams and evaluate student answer sheets efficiently.
                </p>
            </motion.div>

            {/* Exam Context Selector */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <ExamSelector
                    key={examSelectorKey}
                    selectedExam={selectedExam}
                    onSelect={handleExamSelect}
                    onCreateNew={handleCreateNew}
                />
            </motion.div>

            {/* Upload Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <Card className="border-border/50 shadow-sm h-full">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {isNewExam ? "1. Setup Exam Context" : "Exam Context Active"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isNewExam ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="examName">Exam Name</Label>
                                        <Input
                                            id="examName"
                                            placeholder="e.g. Mathematics Midterm 2024"
                                            value={examName}
                                            onChange={(e) => setExamName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Question Paper</Label>
                                        <UploadCard
                                            label="Question Paper"
                                            description="PDF or Image file"
                                            file={questionPaper}
                                            onFileSelect={setQuestionPaper}
                                            mini
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Rubric (Optional)</Label>
                                        <UploadCard
                                            label="Rubric"
                                            description="PDF marking scheme"
                                            file={rubric}
                                            onFileSelect={setRubric}
                                            mini
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-xl bg-muted/40 p-6 flex flex-col items-center justify-center text-center h-[280px] border border-dashed border-border">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                                    <h3 className="font-semibold text-foreground">{selectedExam?.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                                        Question paper and rubric are loaded and ready for grading.
                                    </p>
                                    <Button variant="outline" size="sm" className="mt-4" onClick={handleCreateNew}>
                                        Change Exam
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                >
                    <Card className="border-border/50 shadow-sm h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {isNewExam ? "2. Upload Answer Sheets" : "Upload Student Answers"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1">
                            <div className="space-y-2">
                                <Label htmlFor="studentName" className={isBulkUpload ? "text-muted-foreground" : ""}>
                                    Student Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="studentName"
                                        placeholder={isBulkUpload ? "Auto-detected from filenames" : "e.g. Alex Johnson"}
                                        className="pl-9"
                                        value={studentName}
                                        onChange={(e) => setStudentName(e.target.value)}
                                        disabled={isBulkUpload}
                                    />
                                </div>
                                {isBulkUpload && (
                                    <p className="text-xs text-muted-foreground ml-1">
                                        * Names will be set to filenames for bulk upload
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Answer Sheets {isBulkUpload && `(${answerFiles.length})`}</Label>
                                <UploadCard
                                    label="Answer Sheets"
                                    description="Student answers (PDF/Img)"
                                    files={answerFiles}
                                    onFilesSelect={setAnswerFiles}
                                    multiple={true}
                                />
                            </div>

                            <div className="pt-4 mt-auto">
                                {error && (
                                    <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-3 mb-4">
                                        {error}
                                    </div>
                                )}

                                {isUploading && (
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Uploading {answerFiles.length} files...</span>
                                            <span className="font-medium tabular-nums">
                                                {Math.round(uploadProgress)}%
                                            </span>
                                        </div>
                                        <Progress value={uploadProgress} className="h-2 rounded-full" />
                                    </div>
                                )}

                                <Button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || isUploading}
                                    className="w-full rounded-xl h-11 gap-2"
                                    size="lg"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Evaluating...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            {isNewExam ? "Create Exam & Grade" : "Grade Submissions"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Submission Results List */}
            <div className="space-y-4">
                <AnimatePresence>
                    {submissions.map((sub) => (
                        <motion.div
                            key={sub.id}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                        >
                            <Card className="glass-card border-0 rounded-2xl overflow-hidden">
                                <CardHeader className="pb-3 bg-white/5">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            {sub.file_name}
                                            <span className="text-muted-foreground font-normal">
                                                — {sub.student_name || "Unknown Student"}
                                            </span>
                                        </CardTitle>
                                        <StatusBadge status={sub.status as SubmissionStatus} />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-xl bg-muted/50 p-4">
                                            <p className="text-xs text-muted-foreground mb-1">Score</p>
                                            <p className="text-2xl font-bold">
                                                {sub.final_score !== null ? formatScore(sub.final_score, sub.max_score) : "—"}
                                            </p>
                                        </div>
                                        {sub.confidence !== null && (
                                            <div className="rounded-xl bg-muted/50 p-4">
                                                <p className="text-xs text-muted-foreground mb-1">Clarity</p>
                                                <p className="text-2xl font-bold">{Math.round(sub.confidence * 100)}%</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Feedback preview */}
                                    {sub.feedback && (
                                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/10 p-3">
                                            <p className="text-xs text-muted-foreground line-clamp-3">
                                                {sub.feedback}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
