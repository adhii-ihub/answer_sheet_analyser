"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Image, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UploadCardProps {
    label: string;
    description: string;
    accept?: string;
    file: File | null;
    onFileSelect: (file: File | null) => void;
}

export function UploadCard({
    label,
    description,
    accept = ".pdf,.png,.jpg,.jpeg,.gif,.webp",
    file,
    onFileSelect,
}: UploadCardProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) onFileSelect(droppedFile);
        },
        [onFileSelect]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selected = e.target.files?.[0];
            if (selected) onFileSelect(selected);
        },
        [onFileSelect]
    );

    const fileIcon = file?.type.startsWith("image/") ? Image : FileText;
    const FileIcon = fileIcon;

    return (
        <Card
            className={cn(
                "glass-card border-0 rounded-2xl transition-all duration-300 cursor-pointer group",
                isDragging && "ring-2 ring-primary/50 scale-[1.02]",
                file && "ring-1 ring-emerald-500/30"
            )}
        >
            <CardContent className="p-0">
                <label
                    className="block p-6 cursor-pointer"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleChange}
                        className="hidden"
                    />

                    {file ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-4"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                                <FileIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onFileSelect(null);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <motion.div
                                className={cn(
                                    "flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
                                    isDragging
                                        ? "bg-primary/20"
                                        : "bg-muted group-hover:bg-primary/10"
                                )}
                                animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                            >
                                <Upload
                                    className={cn(
                                        "h-6 w-6 transition-colors",
                                        isDragging
                                            ? "text-primary"
                                            : "text-muted-foreground group-hover:text-primary"
                                    )}
                                />
                            </motion.div>
                            <div className="text-center">
                                <p className="text-sm font-medium">{label}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {description}
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground/60">
                                Drag & drop or click to browse
                            </p>
                        </div>
                    )}
                </label>
            </CardContent>
        </Card>
    );
}
