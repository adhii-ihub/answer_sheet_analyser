"use client";
import { motion } from "framer-motion";
import {
    GraduationCap,
    MapPin,
    Phone,
    Mail,
    Linkedin,
    Twitter,
    Github,
    ExternalLink,
} from "lucide-react";

const quickLinks = [
    { label: "About", href: "#about" },
    { label: "Features", href: "#features" },
    { label: "Dashboard", href: "#dashboard" },
    { label: "Contact", href: "#contact" },
];

const legal = [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Use", href: "#" },
    { label: "Data Security", href: "#" },
];

export default function Footer() {
    return (
        <footer id="contact" className="bg-gray-950 text-white">
            {/* CTA band */}
            <div className="border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight">
                            Ready to modernise your{" "}
                            <span className="text-[#1A73E8]">Examination Process?</span>
                        </h3>
                        <p className="text-gray-400 mt-2 text-sm">
                            Deploy EduGrade AI on your campus network today.
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button className="btn-accent text-sm">Get Started</button>
                        <button className="btn-outline text-sm border-gray-700 text-gray-300 hover:border-gray-500">
                            Learn More <ExternalLink size={13} className="inline ml-1" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main footer */}
            <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="w-9 h-9 rounded-lg bg-[#1A73E8] flex items-center justify-center">
                                <GraduationCap size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold leading-none">SNS Institutions</p>
                                <p className="text-xs text-gray-500 leading-none mt-0.5">EduGrade AI</p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
                            AI-powered answer sheet evaluation platform enabling fast, fair,
                            and fully on-premise examination assessment for academic
                            institutions.
                        </p>
                        <div className="flex flex-col gap-3 text-sm text-gray-400">
                            <span className="flex items-start gap-2">
                                <MapPin size={14} className="shrink-0 mt-0.5 text-[#1A73E8]" />
                                Kurumbapalayam, Coimbatore — 641 107, Tamil Nadu, India
                            </span>
                            <a href="tel:+914294226666" className="flex items-center gap-2 hover:text-white transition-colors">
                                <Phone size={14} className="text-[#1A73E8]" />
                                +91 - 4294 - 226666
                            </a>
                            <a href="mailto:info@snsinstitutions.com" className="flex items-center gap-2 hover:text-white transition-colors">
                                <Mail size={14} className="text-[#1A73E8]" />
                                info@snsinstitutions.com
                            </a>
                        </div>
                    </div>

                    {/* Quick links */}
                    <div>
                        <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-5">
                            Navigation
                        </p>
                        <ul className="flex flex-col gap-3">
                            {quickLinks.map((l) => (
                                <li key={l.label}>
                                    <a
                                        href={l.href}
                                        className="text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        {l.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-5">
                            Legal
                        </p>
                        <ul className="flex flex-col gap-3">
                            {legal.map((l) => (
                                <li key={l.label}>
                                    <a
                                        href={l.href}
                                        className="text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        {l.label}
                                    </a>
                                </li>
                            ))}
                        </ul>

                        <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mt-8 mb-4">
                            Follow Us
                        </p>
                        <div className="flex gap-3">
                            {[Linkedin, Twitter, Github].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-8 h-8 rounded-lg border border-gray-800 flex items-center justify-center text-gray-500 hover:text-white hover:border-gray-600 transition-all"
                                >
                                    <Icon size={14} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
                    <p>
                        © {new Date().getFullYear()} SNS Institutions. All rights reserved.
                    </p>
                    <p className="flex items-center gap-1.5">
                        Built with <span className="text-[#1A73E8]">EduGrade AI</span> ·
                        Powered by Ollama + Next.js
                    </p>
                </div>
            </div>
        </footer>
    );
}
