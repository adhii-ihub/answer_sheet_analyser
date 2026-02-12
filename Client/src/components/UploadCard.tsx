"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpotlightCard } from "@/components/SpotlightCard";
import { Upload, X, FileText, Image, CheckCircle, Smartphone } from "lucide-react";
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
        <SpotlightCard className="overflow-visible min-h-[220px] flex flex-col items-stretch">
            <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md rounded-t-3xl">
                <h3 className="text-sm font-bold tracking-wide flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary/70 animate-pulse" />
                    {label}
                </h3>
            </div>

            <div className="flex-1 p-6 flex flex-col justify-center relative z-10">
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleChange}
                    className="hidden"
                />

                <AnimatePresence mode="wait">
                    {!file ? (
                        <motion.div
                            key="dropzone"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={handleClick}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all duration-300 group hover:border-primary/50",
                                isDragging
                                    ? "bg-primary/10 border-primary"
                                    : "border-white/10 hover:bg-white/5"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                            <motion.div
                                animate={{
                                    y: isDragging ? -8 : 0,
                                    scale: isDragging ? 1.1 : 1,
                                    rotate: isDragging ? [0, -5, 5, 0] : 0
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 shadow-lg ring-1 ring-white/20 group-hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-shadow"
                            >
                                <Upload className="h-7 w-7 text-primary drop-shadow-lg" />
                            </motion.div>

                            <div className="text-center relative z-10">
                                <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                                    {isDragging ? "Drop file now!" : "Click or Drag to Upload"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="relative w-full"
                        >
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-1">
                                <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg">
                                        {isPdf ? (
                                            <FileText className="h-7 w-7 text-white" />
                                        ) : (
                                            <Image className="h-7 w-7 text-white" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate text-white">{file.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/70 font-medium">
                                                {formatSize(file.size)}
                                            </span>
                                            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" /> Ready
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFileSelect(null);
                                        }}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </SpotlightCard>
    );
}
