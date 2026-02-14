"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { GraduationCap, Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
    const { register } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        setIsLoading(true);
        try {
            await register(name, email, password, confirmPassword);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    const fields = [
        { label: "Full Name", icon: User, type: "text", placeholder: "John Doe", value: name, onChange: setName, delay: 0.35 },
        { label: "Email", icon: Mail, type: "email", placeholder: "you@example.com", value: email, onChange: setEmail, delay: 0.4 },
        { label: "Password", icon: Lock, type: "password", placeholder: "••••••••", value: password, onChange: setPassword, delay: 0.45 },
        { label: "Confirm Password", icon: Lock, type: "password", placeholder: "••••••••", value: confirmPassword, onChange: setConfirmPassword, delay: 0.5 },
    ];

    return (
        <div className="relative min-h-screen flex items-center justify-center px-4 py-12 noise-overlay">
            {/* Mesh Background */}
            <div className="mesh-gradient">
                <div className="mesh-orb mesh-orb-1" />
                <div className="mesh-orb mesh-orb-2" />
                <div className="mesh-orb mesh-orb-4" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md"
            >
                <Card className="glass-card border-0 rounded-3xl overflow-hidden shadow-2xl shadow-primary/5">
                    <CardContent className="p-8 md:p-10">
                        {/* Logo */}
                        <Link href="/" className="flex items-center justify-center mb-8">
                            <motion.div
                                initial={{ scale: 0.5, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-xl shadow-primary/30"
                            >
                                <GraduationCap className="h-8 w-8 text-white" />
                            </motion.div>
                        </Link>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center mb-7"
                        >
                            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Start evaluating exams with AI today
                            </p>
                        </motion.div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="rounded-xl bg-destructive/10 text-destructive text-sm px-4 py-3"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {fields.map((field) => (
                                <motion.div
                                    key={field.label}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: field.delay }}
                                    className="space-y-1.5"
                                >
                                    <label className="text-sm font-medium">{field.label}</label>
                                    <div className="relative">
                                        <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type={field.type}
                                            placeholder={field.placeholder}
                                            value={field.value}
                                            onChange={(e) => field.onChange(e.target.value)}
                                            required
                                            className="pl-11 h-12 rounded-xl bg-muted/40 border-0 focus-visible:ring-2 focus-visible:ring-primary/30 text-sm"
                                        />
                                    </div>
                                </motion.div>
                            ))}

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                                className="pt-2"
                            >
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 rounded-xl text-sm font-semibold btn-glow gap-2 shadow-lg shadow-primary/20"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            Create Account
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        </form>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.65 }}
                            className="text-center text-sm text-muted-foreground mt-6"
                        >
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="text-primary font-medium hover:underline underline-offset-4"
                            >
                                Sign in
                            </Link>
                        </motion.p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
