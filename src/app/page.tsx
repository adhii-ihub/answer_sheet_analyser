"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Brain,
  FileCheck2,
  BarChart3,
  Upload,
  Clock,
  CheckCircle2,
  Star,
  Users,
  Globe,
  Award,
  TrendingUp,
  ChevronRight,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TiltCard } from "@/components/TiltCard";
import { SpotlightCard } from "@/components/SpotlightCard";

/* ─────────── Animated Counter ─────────── */
function AnimatedStat({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2500;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 5); // Quintic ease-out for smoother finish
            setCount(Math.round(value * eased));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─────────── Data ─────────── */
const features = [
  {
    icon: Zap,
    title: "Instant Scoring",
    description: "Results in seconds with our optimized phi3 model pipeline.",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    icon: Brain,
    title: "Deep Analysis",
    description: "Detailed feedback and improvement tips via llama3.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Shield,
    title: "Rubric Accuracy",
    description: "Perfect alignment with your custom grading rubrics.",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Rich Analytics",
    description: "Visual insights into class performance and trends.",
    gradient: "from-blue-400 to-cyan-500",
  },
];

const stats = [
  { value: 50000, suffix: "+", label: "Exams Evaluated", icon: FileCheck2 },
  { value: 12000, suffix: "+", label: "Active Users", icon: Users },
  { value: 98, suffix: "%", label: "Accuracy Rate", icon: TrendingUp },
  { value: 150, suffix: "+", label: "Institutions", icon: Globe },
];

const testimonials = [
  {
    name: "Dr. Priya S.",
    role: "Professor, IIT Delhi",
    content: "Transformed my grading workflow completely. The AI's feedback is indistinguishable from my own.",
    color: "from-violet-500 to-purple-600",
  },
  {
    name: "Rahul Mehta",
    role: "Founder, LearnPro",
    content: "Student satisfaction went up 40% due to instant feedback. A must-have tool for modern ed-tech.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    name: "Sarah Chen",
    role: "Dept Head, NUS",
    content: "The rubric adherence is spot on. It follows our complex criteria perfectly every single time.",
    color: "from-emerald-500 to-teal-600",
  },
];

/* ─────────── Page Component ─────────── */
export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: scrollRef });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div ref={scrollRef} className="relative min-h-screen overflow-x-hidden selection:bg-primary/30 selection:text-white">
      {/* 3D Grid Background */}
      <div className="fixed inset-0 z-[-1] bg-black/5 dark:bg-black/95">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.1]"
          style={{
            backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(3)',
            transformOrigin: 'top center',
          }}
        />
      </div>

      {/* Mesh Gradient Overlay */}
      <div className="mesh-gradient opacity-60 dark:opacity-40 pointer-events-none">
        <div className="mesh-orb mesh-orb-1 mix-blend-screen" />
        <div className="mesh-orb mesh-orb-2 mix-blend-screen" />
        <div className="mesh-orb mesh-orb-3 mix-blend-screen" />
      </div>

      {/* ═══════ Navigation ═══════ */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-center pointer-events-none"
      >
        <div className="pointer-events-auto glass rounded-full px-6 py-3 flex items-center gap-8 shadow-2xl shadow-primary/10 border border-white/20 backdrop-blur-3xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-purple-400 shadow-lg shadow-primary/40">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">EvalAI</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">Process</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Stories</a>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Login</Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full px-5 btn-glow bg-primary text-white hover:bg-primary/90 text-xs">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ═══════ Hero Section ═══════ */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-[140vh] flex flex-col items-center pt-48 px-4"
      >
        <div className="text-center space-y-8 max-w-4xl mx-auto z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">AI-Powered Grading V2.0</span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9]">
            <span className="block text-foreground drop-shadow-sm">Future of</span>
            <span className="gradient-text block mt-2">Evaluation</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Experience the next generation of exam grading.
            <span className="text-foreground font-medium"> Instant results. Deep insights. Zero latency.</span>
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 rounded-full text-lg btn-glow shadow-primary/30 shadow-2xl">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg glass hover:bg-white/10 border-white/20 gap-2 group">
              <Play className="h-4 w-4 fill-current group-hover:scale-110 transition-transform" /> Demo
            </Button>
          </div>
        </div>

        {/* 3D Dashboard Preview */}
        <div className="mt-24 relative w-full max-w-6xl perspective-[2000px] z-20">
          <TiltCard className="rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl shadow-primary/20 p-2">
            <div className="relative rounded-[2rem] overflow-hidden aspect-[16/10] bg-black/80 ring-1 ring-white/10 group">
              {/* Mock Dashboard UI */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black p-8 flex flex-col gap-6">
                {/* Header Mock */}
                <div className="h-16 w-full glass rounded-2xl flex items-center justify-between px-6">
                  <div className="flex gap-4">
                    <div className="h-4 w-4 rounded-full bg-red-500/20" />
                    <div className="h-4 w-4 rounded-full bg-yellow-500/20" />
                    <div className="h-4 w-4 rounded-full bg-green-500/20" />
                  </div>
                  <div className="h-2 w-32 bg-white/10 rounded-full" />
                </div>

                {/* Content Mock */}
                <div className="flex-1 grid grid-cols-12 gap-6">
                  <div className="col-span-3 glass rounded-3xl" />
                  <div className="col-span-9 grid grid-rows-2 gap-6">
                    <div className="row-span-1 grid grid-cols-3 gap-6">
                      <div className="glass rounded-3xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                      </div>
                      <div className="glass rounded-3xl" />
                      <div className="glass rounded-3xl" />
                    </div>
                    <div className="row-span-1 glass rounded-3xl relative">
                      {/* Chart Lines */}
                      <div className="absolute bottom-8 left-8 right-8 h-32 flex items-end justify-between gap-2">
                        {[40, 70, 50, 90, 60, 80, 50, 70, 60].map((h, i) => (
                          <div key={i} className="w-full bg-primary/30 rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="glass px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl animate-float">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="font-mono text-sm tracking-wider">Analysis Complete: 98% Score</span>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </motion.section>

      {/* ═══════ Stats Stagger ═══════ */}
      <section className="relative z-10 -mt-20 pb-32 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <SpotlightCard key={s.label} className="p-8 text-center bg-black/40 border-white/5">
              <div className="text-4xl font-bold mb-2 gradient-text">
                <AnimatedStat value={s.value} suffix={s.suffix} />
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">
                {s.label}
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ═══════ Features Grid ═══════ */}
      <section id="features" className="py-32 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Intelligence <br />
              <span className="text-muted-foreground">in every pixel.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <TiltCard key={f.title} className="h-full">
                <div className="glass-card p-8 h-full flex flex-col justify-between group hover:border-primary/30 transition-colors bg-black/20">
                  <div>
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                      <f.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0">
                    Learn more <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Testimonials Marquee ═══════ */}
      <section id="testimonials" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -skew-y-3 z-0 transform origin-top-left scale-110" />

        <div className="max-w-6xl mx-auto relative z-10 px-4">
          <h2 className="text-4xl font-bold mb-16 text-center">Loved by the best</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <SpotlightCard key={i} className="p-8 bg-black/40">
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map(star => <Star key={star} className="h-4 w-4 fill-amber-500 text-amber-500" />)}
                </div>
                <p className="text-lg leading-relaxed mb-8">"{t.content}"</p>
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.color}`} />
                  <div>
                    <p className="font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t.role}</p>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Footer ═══════ */}
      <footer className="py-20 px-4 border-t border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div className="space-y-6 max-w-sm">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <div className="h-8 w-8 rounded-lg bg-primary" /> EvalAI
            </div>
            <p className="text-muted-foreground">
              Pioneering the future of educational assessment with state-of-the-art AI models.
            </p>
            <div className="flex gap-4">
              <Button size="icon" variant="ghost" className="rounded-full hover:bg-white/10"><Twitter className="h-5 w-5" /></Button>
              <Button size="icon" variant="ghost" className="rounded-full hover:bg-white/10"><Github className="h-5 w-5" /></Button>
              <Button size="icon" variant="ghost" className="rounded-full hover:bg-white/10"><Linkedin className="h-5 w-5" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h4 className="font-bold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Features</a></li>
                <li><a href="#" className="hover:text-primary">Pricing</a></li>
                <li><a href="#" className="hover:text-primary">API</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">About</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
                <li><a href="#" className="hover:text-primary">Careers</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Privacy</a></li>
                <li><a href="#" className="hover:text-primary">Terms</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
