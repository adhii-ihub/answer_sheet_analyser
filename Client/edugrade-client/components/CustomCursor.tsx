"use client";
import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const trailRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<"normal" | "hovered" | "clicking">("normal");

    useEffect(() => {
        let mouseX = 0, mouseY = 0;
        let dotX = 0, dotY = 0;
        let trailX = 0, trailY = 0;
        let animFrame: number;

        // Near-instant dot, smooth trailing ring
        const DOT_SPEED = 0.92;
        const TRAIL_SPEED = 0.22;

        const onMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
        const onDown = () => setState("clicking");
        const onUp = () => setState((s) => s === "clicking" ? "normal" : s);
        const onEnter = () => setState("hovered");
        const onLeave = () => setState((s) => s !== "clicking" ? "normal" : s);

        const animate = () => {
            dotX += (mouseX - dotX) * DOT_SPEED;
            dotY += (mouseY - dotY) * DOT_SPEED;
            trailX += (mouseX - trailX) * TRAIL_SPEED;
            trailY += (mouseY - trailY) * TRAIL_SPEED;

            if (dotRef.current) {
                dotRef.current.style.transform = `translate(${dotX - 5}px, ${dotY - 5}px)`;
            }
            if (trailRef.current) {
                trailRef.current.style.transform = `translate(${trailX - 22}px, ${trailY - 22}px)`;
            }
            animFrame = requestAnimationFrame(animate);
        };

        const attachListeners = () => {
            document
                .querySelectorAll("a, button, input, textarea, select, label, [data-cursor]")
                .forEach((el) => {
                    el.addEventListener("mouseenter", onEnter);
                    el.addEventListener("mouseleave", onLeave);
                });
        };

        attachListeners();
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mousedown", onDown);
        window.addEventListener("mouseup", onUp);
        animFrame = requestAnimationFrame(animate);

        const observer = new MutationObserver(attachListeners);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mousedown", onDown);
            window.removeEventListener("mouseup", onUp);
            cancelAnimationFrame(animFrame);
            observer.disconnect();
        };
    }, []);

    const isHovered = state === "hovered";
    const isClicking = state === "clicking";

    const dotColor = isHovered ? "#1A73E8" : isClicking ? "#e11d48" : "#111";
    const dotSize = isClicking ? 7 : 10;
    const dotShadow = isHovered
        ? "0 0 0 3px rgba(26,115,232,0.22)"
        : isClicking
            ? "0 0 0 3px rgba(225,29,72,0.22)"
            : "none";

    const ringSize = isHovered ? 52 : isClicking ? 30 : 44;
    const ringBorderColor = isHovered ? "#1A73E8" : "rgba(17,17,17,0.28)";
    const ringBg = isHovered ? "rgba(26,115,232,0.05)" : "transparent";

    return (
        <>
            {/* Fast inner dot */}
            <div
                ref={dotRef}
                className="pointer-events-none fixed top-0 left-0 z-[99999] will-change-transform rounded-full"
                style={{
                    width: dotSize,
                    height: dotSize,
                    background: dotColor,
                    boxShadow: dotShadow,
                    transition: "background 0.15s, box-shadow 0.15s, width 0.15s, height 0.15s",
                }}
            />

            {/* Slow trailing ring */}
            <div
                ref={trailRef}
                className="pointer-events-none fixed top-0 left-0 z-[99998] will-change-transform rounded-full"
                style={{
                    width: ringSize,
                    height: ringSize,
                    border: `1.5px solid ${ringBorderColor}`,
                    background: ringBg,
                    transition: "border-color 0.2s, background 0.2s, width 0.25s, height 0.25s",
                }}
            />
        </>
    );
}
