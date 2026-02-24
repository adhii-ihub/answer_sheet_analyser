"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
    const router = useRouter();
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirm) {
            setError("Passwords do not match.");
            return;
        }
        setError("");
        setLoading(true);
        // TODO: connect to Django registration API
        setTimeout(() => {
            setLoading(false);
            router.push("/login");
        }, 1200);
    };

    return (
        <main
            className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{ background: "linear-gradient(160deg, #f4f6fb 0%, #eef3fc 100%)" }}
        >
            <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="w-full max-w-md"
            >
                {/* Card */}
                <div className="bento-card p-8 md:p-10">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 mb-8">
                        <div className="w-9 h-9 rounded-lg bg-[#1A73E8] flex items-center justify-center shadow-sm">
                            <GraduationCap size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-none">SNS Institutions</p>
                            <p className="text-[10px] text-gray-400 leading-none mt-0.5">EduGrade AI</p>
                        </div>
                    </div>

                    <h1 className="text-2xl font-black text-gray-900 mb-1">Create your account</h1>
                    <p className="text-sm text-gray-500 mb-8">
                        Register as Controller of Examinations staff.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Name */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Full Name
                            </label>
                            <div className="relative">
                                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Dr. A. Ramachandran"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 transition-all"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Institutional Email
                            </label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    placeholder="controller@snsinstitutions.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPass ? "text" : "password"}
                                    required
                                    placeholder="Min. 8 characters"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                >
                                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm password */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPass ? "text" : "password"}
                                    required
                                    placeholder="Repeat your password"
                                    value={form.confirm}
                                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 transition-all"
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-accent w-full flex items-center justify-center gap-2 mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating Account…
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <p className="text-sm text-center text-gray-500 mt-6">
                        Already have an account?{" "}
                        <Link href="/login" className="text-[#1A73E8] font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Back link */}
                <Link
                    href="/"
                    className="mt-6 flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft size={14} /> Back to Home
                </Link>
            </motion.div>
        </main>
    );
}
