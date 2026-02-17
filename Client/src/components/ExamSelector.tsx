"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getExams, type Exam } from "@/lib/api";

interface ExamSelectorProps {
    selectedExam: Exam | null;
    onSelect: (exam: Exam | null) => void;
    onCreateNew: () => void;
}

export function ExamSelector({
    selectedExam,
    onSelect,
    onCreateNew,
}: ExamSelectorProps) {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        try {
            setLoading(true);
            const data = await getExams();
            setExams(data);

            // Auto-select from localStorage or most recent
            const storedId = localStorage.getItem("activeExamId");
            if (storedId) {
                const found = data.find(e => e.id.toString() === storedId);
                if (found) {
                    onSelect(found);
                } else if (data.length > 0) {
                    // Optionally default to most recent if stored ID not found?
                    // onSelect(data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to load exams", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    Exam Context
                    {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
                </label>
                {selectedExam && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/30">
                        Active
                    </span>
                )}
            </div>

            <div className="flex gap-2">
                <Select
                    value={selectedExam?.id.toString() || "new"}
                    onValueChange={(val) => {
                        if (val === "new") {
                            onCreateNew();
                            onSelect(null);
                        } else {
                            const exam = exams.find((e) => e.id.toString() === val);
                            onSelect(exam || null);
                        }
                    }}
                    disabled={loading}
                >
                    <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Select an exam..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="new" className="text-primary font-medium focus:bg-primary/10">
                            <span className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Create New Exam
                            </span>
                        </SelectItem>
                        {exams.length > 0 && <div className="h-px bg-border my-1 mx-2" />}
                        {exams.map((exam) => (
                            <SelectItem key={exam.id} value={exam.id.toString()}>
                                <span className="font-medium">{exam.name}</span>
                                <span className="text-muted-foreground text-xs ml-2">
                                    {new Date(exam.created_at).toLocaleDateString()}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedExam ? (
                <p className="text-xs text-muted-foreground">
                    Using stored Question Paper & Rubric from <strong>{selectedExam.name}</strong>
                </p>
            ) : (
                <p className="text-xs text-muted-foreground">
                    Create a new exam context to upload Question Paper & Rubric once.
                </p>
            )}
        </div>
    );
}
