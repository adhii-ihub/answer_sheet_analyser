"use client";

import { motion, useScroll, useTransform } from "framer-motion";
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
  Mail,
  MapPin,
  Phone,
  ChevronRight,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
          const duration = 2000;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
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
    title: "Instant Quick Scoring",
    description:
      "Get preliminary scores in seconds using our phi3 model. No waiting, no blocking — results appear as they're ready.",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: Brain,
    title: "Deep AI Analysis",
    description:
      "Our llama3 model generates comprehensive feedback with detailed strengths, weaknesses, and improvement suggestions.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Shield,
    title: "Rubric-Based Accuracy",
    description:
      "Upload your own rubric and the AI follows it precisely. Consistent, fair, and transparent grading every single time.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: BarChart3,
    title: "Rich Analytics",
    description:
      "Track performance trends, compare subjects, identify patterns. Beautiful charts that make data actionable.",
    gradient: "from-blue-500 to-cyan-600",
  },
];

const stats = [
  { value: 50000, suffix: "+", label: "Exams Evaluated", icon: FileCheck2 },
  { value: 12000, suffix: "+", label: "Active Users", icon: Users },
  { value: 98, suffix: "%", label: "Accuracy Rate", icon: TrendingUp },
  { value: 150, suffix: "+", label: "Institutions Using", icon: Globe },
];

const howItWorks = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Your Files",
    description:
      "Upload the question paper, answer sheet, and rubric — PDFs or images. Drag & drop or click to browse.",
  },
  {
    step: "02",
    icon: Clock,
    title: "AI Processing",
    description:
      "phi3 delivers a quick score in seconds. llama3 then runs a deep analysis for detailed evaluation.",
  },
  {
    step: "03",
    icon: CheckCircle2,
    title: "Get Results",
    description:
      "View scores, feedback, strengths, and improvement areas — all in a beautiful, interactive dashboard.",
  },
];

const testimonials = [
  {
    name: "Dr. Priya Sharma",
    role: "Physics Professor, IIT Delhi",
    content:
      "EvalAI has completely transformed how I grade 300+ exam papers each semester. What used to take 2 weeks now takes hours. The AI feedback is remarkably consistent and detailed.",
    rating: 5,
    avatar: "PS",
    color: "from-violet-400 to-purple-600",
  },
  {
    name: "Rahul Mehta",
    role: "EdTech Founder, LearnPro",
    content:
      "We integrated EvalAI into our platform and our student satisfaction scores jumped 40%. The real-time status tracking means students know exactly when their results will be ready.",
    rating: 5,
    avatar: "RM",
    color: "from-blue-400 to-cyan-600",
  },
  {
    name: "Sarah Chen",
    role: "Department Head, NUS Singapore",
    content:
      "The rubric-based scoring is incredibly accurate. I've compared AI grades with manual grades across 1000+ papers and the correlation is above 0.95. Game changer for education.",
    rating: 5,
    avatar: "SC",
    color: "from-emerald-400 to-teal-600",
  },
];

const achievements = [
  { icon: Award, title: "Best EdTech Innovation 2025", subtitle: "Global Education Awards" },
  { icon: Star, title: "Top Rated AI Tool", subtitle: "ProductHunt #1 of the Day" },
  { icon: Globe, title: "Used in 25+ Countries", subtitle: "Growing Global Presence" },
  { icon: TrendingUp, title: "99.9% Uptime SLA", subtitle: "Enterprise-Grade Reliability" },
];

/* ─────────── Page Component ─────────── */
export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" as const },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <div className="relative min-h-screen noise-overlay">
      {/* Animated Mesh Background */}
      <div className="mesh-gradient">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
        <div className="mesh-orb mesh-orb-4" />
      </div>

      {/* ═══════ Navigation ═══════ */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
      >
        <div className="max-w-6xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/25">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">EvalAI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-xl">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-xl btn-glow gap-1.5">
                Get Started <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ═══════ Hero Section ═══════ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex items-center justify-center min-h-screen px-4 pt-24 pb-20"
      >
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {/* Animated Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 rounded-full glass px-5 py-2 text-sm font-medium"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Trusted by 12,000+ educators worldwide
            </motion.div>

            {/* Main Title */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9]">
              Grade Exams
              <br />
              <span className="gradient-text">with AI Precision</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upload question papers, answer sheets, and rubrics — get instant AI-powered
              scoring with detailed, rubric-aligned feedback. Built for educators who value
              accuracy and speed.
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link href="/register">
                <Button
                  size="lg"
                  className="rounded-2xl px-10 h-14 text-base gap-2.5 group btn-glow shadow-xl shadow-primary/20"
                >
                  <Sparkles className="h-4.5 w-4.5" />
                  Start Evaluating Free
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-2xl px-10 h-14 text-base glass border-0"
                >
                  See How It Works
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center justify-center gap-6 pt-6 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Free tier available
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Setup in 30 seconds
              </span>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════ Stats Section ═══════ */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="px-4 py-16"
      >
        <div className="max-w-5xl mx-auto">
          <div className="glass-card rounded-3xl p-8 md:p-12">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={staggerItem}
                  className="text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-3xl md:text-4xl font-bold tracking-tight">
                    <AnimatedStat value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ═══════ Features Section ═══════ */}
      <section id="features" className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Powerful Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Everything you need for
              <br />
              <span className="gradient-text">smart exam grading</span>
            </h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              Our AI models work together to deliver fast, accurate, and detailed evaluations — so you can focus on teaching.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={staggerItem}
                className="glass-card glass-card-hover rounded-3xl p-8 group cursor-pointer"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════ How It Works ═══════ */}
      <section id="how-it-works" className="px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-4">
              <CheckCircle2 className="h-3.5 w-3.5" /> Simple 3-Step Process
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              How <span className="gradient-text">EvalAI</span> works
            </h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-xl mx-auto">
              Start evaluating exams in under a minute. No complex setup needed.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.step}
                variants={staggerItem}
                className="relative glass-card glass-card-hover rounded-3xl p-8 text-center"
              >
                {/* Connector line */}
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary/40 to-transparent" />
                )}
                <span className="text-5xl font-bold gradient-text opacity-30 block mb-4">
                  {item.step}
                </span>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════ Achievements ═══════ */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="px-4 py-16"
      >
        <div className="max-w-5xl mx-auto">
          <div className="glass-card rounded-3xl p-8 md:p-12">
            <h3 className="text-center text-2xl font-bold mb-8">
              Our <span className="gradient-text">Achievements</span>
            </h3>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
            >
              {achievements.map((a) => (
                <motion.div
                  key={a.title}
                  variants={staggerItem}
                  className="text-center group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mx-auto mb-3 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                    <a.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.subtitle}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ═══════ Testimonials ═══════ */}
      <section id="testimonials" className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 mb-4">
              <Star className="h-3.5 w-3.5" /> Loved by Educators
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              What our users say
            </h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-xl mx-auto">
              Trusted by professors, institutions, and EdTech platforms worldwide
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={staggerItem}
                className="glass-card glass-card-hover rounded-3xl p-7"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                  &ldquo;{t.content}&rdquo;
                </p>
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-white text-sm font-bold shadow-lg`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════ CTA Banner ═══════ */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="px-4 py-20"
      >
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-blue-600" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(1_0_0/15%),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,oklch(1_0_0/10%),transparent_60%)]" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
                Ready to transform your grading?
              </h2>
              <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
                Join 12,000+ educators who are saving hours every week with AI-powered exam evaluation.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="rounded-2xl px-10 h-14 text-base bg-white text-primary hover:bg-white/90 shadow-xl gap-2 group"
                  >
                    Get Started for Free
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-2xl px-10 h-14 text-base border-white/30 text-white hover:bg-white/10"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════ Contact & Footer ═══════ */}
      <section id="contact" className="px-4 py-20 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            {/* Brand */}
            <div className="md:col-span-2 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/25">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">EvalAI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                EvalAI is an AI-powered exam evaluation website that helps educators
                grade exams faster and more accurately. Our mission is to make quality
                education assessment accessible to everyone.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Quick Links</h4>
              <nav className="space-y-2.5 text-sm text-muted-foreground">
                <a href="#features" className="block hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="block hover:text-foreground transition-colors">
                  How it Works
                </a>
                <a href="#testimonials" className="block hover:text-foreground transition-colors">
                  Testimonials
                </a>
                <Link href="/login" className="block hover:text-foreground transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="block hover:text-foreground transition-colors">
                  Get Started
                </Link>
              </nav>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Contact Us</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>support@evalai.dev</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <span>
                    Sector 62, Noida
                    <br />
                    Uttar Pradesh, India 201301
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-16 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © 2026 EvalAI. All rights reserved. Made with ❤️ for educators.
            </p>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
