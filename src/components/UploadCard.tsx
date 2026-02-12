"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadCardProps {
    label: string;
    description: string;
    file: File | null;
    onFileSelect: (file: File | null) => void;
    accept?: string;
}

export function UploadCard({
    label,
    description,
    file,
    onFileSelect,
    accept = ".pdf,.png,.jpg,.jpeg",
}: UploadCardProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFile = e.dataTransfer.files?.[0];
            if (droppedFile) onFileSelect(droppedFile);
        },
        [onFileSelect]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) onFileSelect(selectedFile);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isPdf = file?.name.endsWith(".pdf");

    return (
        <Card className="glass-card glass-card-hover border-0 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{label}</CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleChange}
                    className="hidden"
                />

                {!file ? (
                    <motion.div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={handleClick}
                        animate={{
                            scale: isDragging ? 1.02 : 1,
                            borderColor: isDragging
                                ? "oklch(0.55 0.22 265)"
                                : "oklch(0.5 0 0 / 15%)",
                        }}
                        className={cn(
                            "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-colors group",
                            isDragging
                                ? "bg-primary/5"
                                : "hover:bg-muted/40 hover:border-primary/30"
                        )}
                    >
                        <motion.div
                            animate={{
                                y: isDragging ? -6 : 0,
                                scale: isDragging ? 1.15 : 1,
                            }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 group-hover:bg-primary/12 transition-colors"
                        >
                            <Upload className="h-5 w-5 text-primary" />
                        </motion.div>
                        <div className="text-center">
                            <p className="text-sm font-medium">
                                {isDragging ? "Drop file here" : "Drop or click to upload"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {description}
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative flex items-center gap-3 rounded-2xl bg-muted/30 p-4"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                            {isPdf ? (
                                <FileText className="h-5 w-5 text-primary" />
                            ) : (
                                <Image className="h-5 w-5 text-primary" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatSize(file.size)}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onFileSelect(null);
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
