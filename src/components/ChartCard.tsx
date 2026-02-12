"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface ChartCardProps {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    delay?: number;
}

export function ChartCard({
    title,
    description,
    children,
    className,
    delay = 0,
}: ChartCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
        >
            <Card
                className={cn(
                    "glass-card border-0 rounded-2xl overflow-hidden",
                    className
                )}
            >
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </CardHeader>
                <CardContent className="pt-0">{children}</CardContent>
            </Card>
        </motion.div>
    );
}
