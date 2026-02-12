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
    Settings,
    LogOut,
    Menu,
    User,
} from "lucide-react";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/upload", label: "Upload", icon: Upload },
    { href: "/history", label: "History", icon: History },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
];

function NavContent({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/25">
                    <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                    <span className="text-lg font-bold tracking-tight block leading-tight">
                        EvalAI
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                        AI Grading
                    </span>
                </div>
            </div>

            <Separator className="mx-5 w-auto opacity-30" />

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-5">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute inset-0 rounded-xl bg-primary/8 border border-primary/10"
                                    style={{
                                        boxShadow: "inset 0 1px 0 oklch(1 0 0 / 20%), 0 1px 3px oklch(0 0 0 / 5%)",
                                    }}
                                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                            )}
                            <item.icon className="relative z-10 h-[18px] w-[18px]" />
                            <span className="relative z-10">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="space-y-3 px-3 pb-5">
                <Separator className="mx-2 w-auto opacity-30" />
                <ThemeToggle />

                {/* User */}
                <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 bg-muted/30">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-purple-500 text-white text-xs font-bold shadow-md">
                        {user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            {user?.name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {user?.email || "user@evalai.dev"}
                        </p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl gap-2.5 text-sm px-3.5"
                    onClick={() => {
                        logout();
                        router.push("/login");
                    }}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="relative min-h-screen noise-overlay">
            {/* Mesh Background */}
            <div className="mesh-gradient">
                <div className="mesh-orb mesh-orb-1" />
                <div className="mesh-orb mesh-orb-2" />
                <div className="mesh-orb mesh-orb-3" />
                <div className="mesh-orb mesh-orb-4" />
            </div>

            <div className="flex">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-40 glass-sidebar">
                    <NavContent />
                </aside>

                {/* Mobile Menu */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="fixed top-4 left-4 z-50 lg:hidden rounded-xl glass h-10 w-10 shadow-lg"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="w-64 p-0 border-0 glass-sidebar"
                    >
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <NavContent onClose={() => setMobileOpen(false)} />
                    </SheetContent>
                </Sheet>

                {/* Main Content */}
                <main className="flex-1 lg:pl-64">
                    <div className="min-h-screen p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={typeof window !== "undefined" ? window.location.pathname : ""}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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
