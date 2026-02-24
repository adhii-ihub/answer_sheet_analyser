"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, LayoutDashboard, ChevronRight, Zap, Shield, Star } from "lucide-react";

interface Node {
    x: number; y: number; vx: number; vy: number; r: number;
}

function NeuralCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        const nodes: Node[] = [];
        const count = 55;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        resize();
        window.addEventListener("resize", resize);

        for (let i = 0; i < count; i++) {
            nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.45,
                vy: (Math.random() - 0.5) * 0.45,
                r: Math.random() * 2.5 + 1,
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw edges
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 130) {
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = `rgba(26, 115, 232, ${(1 - dist / 130) * 0.15})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }

            // Draw nodes
            nodes.forEach((n) => {
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(26, 115, 232, 0.35)";
                ctx.fill();

                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
                if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
            });

            animId = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full opacity-60"
            style={{ pointerEvents: "none" }}
        />
    );
}

const badges = [
    { icon: Zap, text: "Instant OCR Processing" },
    { icon: Shield, text: "On-Premise & Secure" },
    { icon: Star, text: "ISO Certified Institution" },
];

export default function HeroSection() {
    return (
        <section
            id="hero"
            className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
            style={{
                background:
                    "linear-gradient(160deg, #fafafa 0%, #f4f6fb 40%, #eef3fc 100%)",
            }}
        >
            <NeuralCanvas />

            {/* Soft glow orb */}
            <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle, rgba(26,115,232,0.07) 0%, transparent 70%)",
                }}
            />

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                {/* Institution tag */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-gray-200 bg-white/80 shadow-sm text-xs font-semibold uppercase tracking-widest text-gray-500"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8] animate-pulse-ring" />
                    SNS Institutions · Kurumbapalayam, Coimbatore
                </motion.div>

                {/* Main heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-tight mb-4"
                >
                    <span className="gradient-text">EduGrade AI</span>
                </motion.h1>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.32 }}
                    className="text-lg md:text-xl font-medium text-gray-500 mb-5 tracking-wide"
                >
                    Controller of Examinations Portal
                </motion.h2>

                {/* Tagline */}
                <motion.p
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.42 }}
                    className="text-2xl md:text-3xl font-semibold text-gray-800 leading-snug mb-10 max-w-2xl mx-auto"
                >
                    Fast, Accurate,{" "}
                    <span className="text-[#1A73E8]">AI-powered</span> Answer Sheet
                    Evaluation.
                </motion.p>

                {/* CTA buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.52 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
                >
                    <button className="btn-accent flex items-center gap-2 text-base" id="cta-upload">
                        <Upload size={17} /> Upload Answer Sheets
                    </button>
                    <button className="btn-outline flex items-center gap-2 text-base">
                        <LayoutDashboard size={17} /> View Dashboard
                        <ChevronRight size={15} className="text-gray-400" />
                    </button>
                </motion.div>

                {/* Floating badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.68 }}
                    className="flex flex-wrap items-center justify-center gap-3"
                >
                    {badges.map((b, i) => (
                        <motion.div
                            key={b.text}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.72 + i * 0.12 }}
                            className="hero-badge"
                        >
                            <b.icon size={13} className="text-[#1A73E8]" />
                            {b.text}
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Scroll hint */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.3 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400"
            >
                <p className="text-xs tracking-widest uppercase font-medium">Scroll</p>
                <div className="w-[1px] h-8 bg-gradient-to-b from-gray-400 to-transparent" />
            </motion.div>
        </section>
    );
}
