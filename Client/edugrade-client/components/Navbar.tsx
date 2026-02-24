"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Menu, X } from "lucide-react";
import Link from "next/link";

const links = [
    { label: "Home", href: "#hero" },
    { label: "About", href: "#about" },
    { label: "Features", href: "#features" },
    { label: "Dashboard", href: "#dashboard" },
    { label: "Contact", href: "#contact" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [active, setActive] = useState("Home");

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleNav = (label: string, href: string) => {
        setActive(label);
        setMobileOpen(false);
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <>
            <motion.nav
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "navbar-glass shadow-sm" : "bg-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#1A73E8] flex items-center justify-center shadow-sm">
                            <GraduationCap size={18} strokeWidth={2} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[13px] font-700 text-gray-900 leading-none font-medium">SNS Institutions</p>
                            <p className="text-[10px] text-gray-400 leading-none mt-0.5">EduGrade AI</p>
                        </div>
                    </div>

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map((l) => (
                            <button
                                key={l.label}
                                onClick={() => handleNav(l.label, l.href)}
                                className={`px-4 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-200 ${active === l.label
                                    ? "bg-[#1A73E8]/10 text-[#1A73E8]"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    }`}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/login" className="btn-outline text-sm">Sign In</Link>
                        <Link href="/signup" className="btn-accent text-sm">Get Started</Link>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.22 }}
                        className="fixed top-16 left-0 right-0 z-40 navbar-glass border-b border-gray-100 shadow-lg md:hidden"
                    >
                        <div className="px-6 py-4 flex flex-col gap-2">
                            {links.map((l) => (
                                <button
                                    key={l.label}
                                    onClick={() => handleNav(l.label, l.href)}
                                    className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${active === l.label
                                        ? "bg-[#1A73E8]/10 text-[#1A73E8]"
                                        : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    {l.label}
                                </button>
                            ))}
                            <div className="flex gap-3 pt-2">
                                <Link href="/login" className="btn-outline text-sm flex-1 text-center">Sign In</Link>
                                <Link href="/signup" className="btn-accent text-sm flex-1 text-center">Get Started</Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
