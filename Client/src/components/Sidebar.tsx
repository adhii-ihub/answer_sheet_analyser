"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";
import {
    GraduationCap,
    LayoutDashboard,
    Upload,
    History,
    BarChart3,
    LogOut,
    Menu,
    User,
    ChevronRight,
} from "lucide-react";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/upload", label: "Upload", icon: Upload },
    { href: "/history", label: "History", icon: History },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

function NavContent({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [hoveredPath, setHoveredPath] = useState<string | null>(null);

    return (
        <div className="flex h-full flex-col backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-8">
                <motion.div
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-[0_8px_16px_rgba(124,58,237,0.3)] ring-1 ring-white/20"
                >
                    <GraduationCap className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                    <span className="text-xl font-bold tracking-tight block leading-tight gradient-text">
                        EvalAI
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.2em]">
                        V2.0 Beta
                    </span>
                </div>
            </div>

            <div className="px-6 mb-4">
                <Separator className="bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 px-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            onMouseEnter={() => setHoveredPath(item.href)}
                            onMouseLeave={() => setHoveredPath(null)}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-300",
                                isActive
                                    ? "text-white shadow-[0_4px_20px_rgba(124,58,237,0.25)]"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {/* Active Background */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute inset-0 rounded-2xl bg-primary/90"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            {/* Hover Background */}
                            {hoveredPath === item.href && !isActive && (
                                <motion.div
                                    layoutId="hoverNav"
                                    className="absolute inset-0 rounded-2xl bg-accent/50"
                                    transition={{ duration: 0.2 }}
                                />
                            )}

                            <item.icon className={cn(
                                "relative z-10 h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                                isActive ? "text-white" : "text-foreground/70"
                            )} />

                            <span className={cn(
                                "relative z-10 font-semibold tracking-wide",
                                isActive ? "text-white" : ""
                            )}>
                                {item.label}
                            </span>

                            {isActive && (
                                <motion.div
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="absolute right-4 z-10"
                                >
                                    <ChevronRight className="h-4 w-4 text-white/80" />
                                </motion.div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 mt-auto">
                <div className="rounded-3xl glass p-4 border border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
                            <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                                <span className="font-bold text-sm bg-gradient-to-br from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                    {user?.username?.charAt(0)?.toUpperCase() || "U"}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">
                                {user?.username || "User"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate opacity-70">
                                {user?.email || "user@evalai.dev"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 relative z-10">
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => {
                                logout();
                                router.push("/login");
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="relative min-h-screen">
            {/* Mesh Background */}
            <div className="mesh-gradient">
                <div className="mesh-orb mesh-orb-1" />
                <div className="mesh-orb mesh-orb-2" />
                <div className="mesh-orb mesh-orb-3" />
                <div className="mesh-orb mesh-orb-4" />
            </div>

            <div className="flex">
                {/* Desktop Floating Sidebar */}
                <aside className="hidden lg:block fixed left-4 top-4 bottom-4 w-72 z-40">
                    <div className="h-full rounded-[2rem] glass-sidebar overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 ring-1 ring-black/5">
                        <NavContent />
                    </div>
                </aside>

                {/* Mobile Menu */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="fixed top-4 left-4 z-50 lg:hidden rounded-xl glass h-10 w-10 shadow-lg border border-white/20"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="w-72 p-0 border-0 bg-transparent"
                    >
                        <div className="h-full rounded-r-[2rem] glass-sidebar overflow-hidden">
                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                            <NavContent onClose={() => setMobileOpen(false)} />
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Main Content */}
                <main className="flex-1 lg:pl-80 transition-all duration-300">
                    <div className="min-h-screen p-4 md:p-6 lg:p-8 pt-20 lg:pt-8 max-w-[1600px] mx-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={typeof window !== "undefined" ? window.location.pathname : ""}
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.02, y: -10 }}
                                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
}
