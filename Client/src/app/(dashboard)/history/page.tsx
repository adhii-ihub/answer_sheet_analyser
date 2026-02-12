"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionTable } from "@/components/SubmissionTable";
import { getHistory, type Submission } from "@/lib/api";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data for when backend is unavailable
const mockSubmissions: Submission[] = [
    { id: 1, file_name: "Physics_Final_2024.pdf", status: "complete", quick_score: 85, final_score: 82, feedback: "Good understanding of mechanics and thermodynamics. Needs work on electromagnetism.", strengths: ["Problem solving", "Clarity", "Calculations"], weaknesses: ["Electromagnetism", "Diagrams"], created_at: "2026-02-12T10:30:00Z", updated_at: "2026-02-12T10:45:00Z" },
    { id: 2, file_name: "Math_Midterm_Q3.pdf", status: "processing_final", quick_score: 72, final_score: null, feedback: null, strengths: [], weaknesses: [], created_at: "2026-02-11T14:20:00Z", updated_at: "2026-02-11T14:25:00Z" },
    { id: 3, file_name: "Chemistry_Lab_Report.pdf", status: "complete", quick_score: 91, final_score: 88, feedback: "Excellent lab methodology. Conclusion could be more detailed.", strengths: ["Methodology", "Data analysis"], weaknesses: ["Conclusion writing"], created_at: "2026-02-10T09:15:00Z", updated_at: "2026-02-10T09:30:00Z" },
    { id: 4, file_name: "English_Essay_Final.pdf", status: "complete", quick_score: 78, final_score: 81, feedback: "Strong argumentation. Grammar errors need attention.", strengths: ["Arguments", "Structure"], weaknesses: ["Grammar", "Punctuation"], created_at: "2026-02-09T16:45:00Z", updated_at: "2026-02-09T17:00:00Z" },
    { id: 5, file_name: "Biology_Quiz_Week12.pdf", status: "complete", quick_score: 67, final_score: 71, feedback: "Needs improvement in cellular biology topics.", strengths: ["Genetics"], weaknesses: ["Cell biology", "Diagrams"], created_at: "2026-02-08T11:00:00Z", updated_at: "2026-02-08T11:15:00Z" },
    { id: 6, file_name: "History_Essay_WW2.pdf", status: "quick_done", quick_score: 88, final_score: null, feedback: null, strengths: [], weaknesses: [], created_at: "2026-02-07T13:30:00Z", updated_at: "2026-02-07T13:35:00Z" },
    { id: 7, file_name: "Computer_Science_Project.pdf", status: "complete", quick_score: 95, final_score: 93, feedback: "Outstanding implementation and documentation.", strengths: ["Code quality", "Documentation", "Testing"], weaknesses: ["Edge cases"], created_at: "2026-02-06T08:00:00Z", updated_at: "2026-02-06T08:20:00Z" },
    { id: 8, file_name: "Geography_Map_Test.pdf", status: "complete", quick_score: 74, final_score: 76, feedback: "Good knowledge of physical geography. Political geography needs work.", strengths: ["Physical geography"], weaknesses: ["Political geography", "Map reading"], created_at: "2026-02-05T15:00:00Z", updated_at: "2026-02-05T15:15:00Z" },
];

export default function HistoryPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState("created_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const ordering = sortOrder === "desc" ? `-${sortField}` : sortField;
            const data = await getHistory({
                page: currentPage,
                ordering,
                search: search || undefined,
            });
            setSubmissions(data.results);
            setTotalCount(data.count);
        } catch {
            // Use mock data when backend unavailable
            let filtered = [...mockSubmissions];
            if (search) {
                filtered = filtered.filter((s) =>
                    s.file_name.toLowerCase().includes(search.toLowerCase())
                );
            }
            filtered.sort((a, b) => {
                const aVal = a[sortField as keyof Submission] as string | number;
                const bVal = b[sortField as keyof Submission] as string | number;
                if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
                return aVal < bVal ? 1 : -1;
            });
            setSubmissions(filtered);
            setTotalCount(filtered.length);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, sortField, sortOrder, search]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold tracking-tight">History</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    View and manage all your past submissions
                </p>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="glass-card border-0 rounded-2xl">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search submissions..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="pl-10 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
                                />
                            </div>
                            <Button
                                variant="outline"
                                className="rounded-xl gap-2 h-10"
                                onClick={() => {
                                    setSearch("");
                                    setSortField("created_at");
                                    setSortOrder("desc");
                                    setCurrentPage(1);
                                }}
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <SubmissionTable
                    submissions={submissions}
                    totalCount={totalCount}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onSort={handleSort}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    isLoading={isLoading}
                />
            </motion.div>
        </div>
    );
}
