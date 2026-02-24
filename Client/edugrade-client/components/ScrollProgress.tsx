"use client";
import { useEffect, useState } from "react";

export default function ScrollProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent pointer-events-none">
            <div
                className="h-full transition-none"
                style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #1A73E8, #5fa8ff, #1A73E8)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s linear infinite",
                }}
            />
        </div>
    );
}
