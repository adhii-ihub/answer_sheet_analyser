"use client";
import { motion } from "framer-motion";
import {
    MapPin,
    Phone,
    Mail,
    Award,
    BookOpen,
    Trophy,
    Microscope,
    Users,
    Star,
} from "lucide-react";

const achievements = [
    { icon: Award, label: "ISO 9001:2015", sub: "Quality Certified" },
    { icon: Trophy, label: "National Academic Award", sub: "Excellence 2023" },
    { icon: Microscope, label: "Research Excellence", sub: "15+ Published Papers" },
    { icon: Star, label: "NAAC 'A++' Grade", sub: "Grade Accredited" },
    { icon: Users, label: "12,000+ Students", sub: "Across All Programs" },
    { icon: BookOpen, label: "45+ Programs", sub: "UG · PG · PhD" },
];

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay: i * 0.08 },
    }),
};

export default function AboutSection() {
    return (
        <section id="about" className="py-28 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                {/* Header */}
                <div className="max-w-2xl mb-16">
                    <p className="section-label mb-3">About the Institution</p>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-5">
                        Shaping the Future of{" "}
                        <span className="text-[#1A73E8]">Education</span>
                    </h2>
                    <p className="text-gray-500 text-lg leading-relaxed">
                        SNS Institutions is a premier educational hub committed to academic
                        excellence, innovation, and holistic development. EduGrade AI is our
                        flagship platform for intelligent examination management.
                    </p>
                </div>

                {/* Bento grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Location card — spans 2 cols */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        custom={0}
                        variants={fadeUp}
                        className="bento-card md:col-span-2 p-8 flex flex-col justify-between min-h-[200px]"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-xl bg-[#1A73E8]/10 flex items-center justify-center shrink-0">
                                <MapPin size={20} className="text-[#1A73E8]" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">
                                    Location
                                </p>
                                <p className="text-xl font-bold text-gray-900 leading-snug">
                                    SNS Institutions
                                </p>
                                <p className="text-gray-500 mt-1 text-sm leading-relaxed">
                                    Kurumbapalayam,
                                    <br />
                                    Coimbatore — 641 107,
                                    <br />
                                    Tamil Nadu, India.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 w-full h-1 rounded-full bg-gray-100">
                            <div className="h-full w-3/4 rounded-full" style={{ background: "linear-gradient(90deg, #1A73E8, #5fa8ff)" }} />
                        </div>
                    </motion.div>

                    {/* Contact card */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        custom={1}
                        variants={fadeUp}
                        className="bento-card p-8 flex flex-col gap-5"
                    >
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                            Contact
                        </p>
                        <div className="flex flex-col gap-4">
                            <a
                                href="tel:+914294226666"
                                className="flex items-center gap-3 group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:border-[#1A73E8]/30 transition-colors">
                                    <Phone size={15} className="text-gray-600 group-hover:text-[#1A73E8]" />
                                </div>
                                <span className="text-sm text-gray-700 font-medium">
                                    +91 - 4294 - 226666
                                </span>
                            </a>
                            <a
                                href="mailto:info@snsinstitutions.com"
                                className="flex items-center gap-3 group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:border-[#1A73E8]/30 transition-colors">
                                    <Mail size={15} className="text-gray-600 group-hover:text-[#1A73E8]" />
                                </div>
                                <span className="text-sm text-gray-700 font-medium break-all">
                                    info@snsinstitutions.com
                                </span>
                            </a>
                        </div>
                    </motion.div>

                    {/* Achievement cards */}
                    {achievements.map((a, i) => (
                        <motion.div
                            key={a.label}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            custom={i + 2}
                            variants={fadeUp}
                            className="bento-card p-6 flex items-center gap-4"
                        >
                            <div className="w-11 h-11 rounded-xl bg-[#1A73E8]/08 flex items-center justify-center shrink-0"
                                style={{ backgroundColor: "rgba(26,115,232,0.07)" }}>
                                <a.icon size={20} className="text-[#1A73E8]" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 leading-snug">{a.label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{a.sub}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
