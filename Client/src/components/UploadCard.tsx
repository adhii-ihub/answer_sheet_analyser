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
    file?: File | null;
    files?: File[];
    onFileSelect?: (file: File | null) => void;
    onFilesSelect?: (files: File[]) => void;
    multiple?: boolean;
    accept?: string;
}

export function UploadCard({
    label,
    description,
    file,
    files,
    onFileSelect,
    onFilesSelect,
    multiple = false,
    accept = ".pdf,.png,.jpg,.jpeg",
    mini = false,
}: UploadCardProps & { mini?: boolean }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFiles = Array.from(e.dataTransfer.files);
            if (droppedFiles.length > 0) {
                if (multiple && onFilesSelect) {
                    onFilesSelect(droppedFiles);
                } else if (onFileSelect) {
                    onFileSelect(droppedFiles[0]);
                }
            }
        },
        [onFileSelect, onFilesSelect, multiple]
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
        if (e.target.files && e.target.files.length > 0) {
            if (multiple && onFilesSelect) {
                onFilesSelect(Array.from(e.target.files));
            } else if (onFileSelect) {
                onFileSelect(e.target.files[0]);
            }
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isPdf = file?.name.endsWith(".pdf");

    return (
        <SpotlightCard className={cn("overflow-visible flex flex-col items-stretch", mini ? "min-h-[120px]" : "min-h-[220px]")}>
            {!mini && (
                <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md rounded-t-3xl">
                    <h3 className="text-sm font-bold tracking-wide flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary/70 animate-pulse" />
                        {label}
                    </h3>
                </div>
            )}

            <div className={cn("flex-1 flex flex-col justify-center relative z-10", mini ? "p-3" : "p-6")}>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleChange}
                    className="hidden"
                />

                <AnimatePresence mode="wait">
                    {!file && (!files || files.length === 0) ? (
                        <div
                            key="dropzone"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={handleClick}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 group hover:border-primary/50",
                                mini ? "p-4" : "p-8",
                                isDragging
                                    ? "bg-primary/10 border-primary scale-[1.02]"
                                    : "border-white/10 hover:bg-white/5"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                            <div
                                className={cn(
                                    "flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 shadow-lg ring-1 ring-white/20 group-hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all duration-300",
                                    mini ? "h-10 w-10" : "h-16 w-16",
                                    isDragging && "-translate-y-2 scale-110"
                                )}
                            >
                                <Upload className={cn("text-primary drop-shadow-lg", mini ? "h-5 w-5" : "h-7 w-7")} />
                            </div>

                            <div className="text-center relative z-10">
                                <p className={cn("font-semibold group-hover:text-primary transition-colors", mini ? "text-xs" : "text-sm")}>
                                    {isDragging ? "Drop!" : (mini ? "Upload File" : "Click or Drag to Upload")}
                                </p>
                                {!mini && (
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto leading-relaxed">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full space-y-2">
                            {/* Single File View */}
                            {file && (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-1"
                                >
                                    <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg">
                                            {file.name.endsWith(".pdf") ? (
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
                                                onFileSelect?.(null);
                                            }}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Multiple Files View */}
                            {files && files.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-xs font-medium text-muted-foreground">{files.length} files selected</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onFilesSelect?.([]);
                                            }}
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {files.map((f, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3"
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                                                    {f.name.endsWith(".pdf") ? (
                                                        <FileText className="h-5 w-5 text-primary" />
                                                    ) : (
                                                        <Image className="h-5 w-5 text-primary" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold truncate text-white/90">{f.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{formatSize(f.size)}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newFiles = [...files];
                                                        newFiles.splice(i, 1);
                                                        onFilesSelect?.(newFiles);
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div >
        </SpotlightCard >
    );
}
