"use client";

import React, { useEffect, useRef } from 'react';

export const InteractiveGrid = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouse = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        resize();

        const handleMouseMove = (e: MouseEvent) => {
            mouse.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('mousemove', handleMouseMove);

        const dots: { x: number; y: number; originX: number; originY: number }[] = [];
        const gap = 32;

        for (let x = gap / 2; x < width; x += gap) {
            for (let y = gap / 2; y < height; y += gap) {
                dots.push({ x, y, originX: x, originY: y });
            }
        }

        const render = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';

            dots.forEach(dot => {
                const dx = mouse.current.x - dot.originX;
                const dy = mouse.current.y - dot.originY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Interaction radius
                const radius = 180;

                if (dist < radius) {
                    const force = (radius - dist) / radius;
                    const angle = Math.atan2(dy, dx);

                    // Push the dots away from the mouse
                    const moveX = Math.cos(angle) * force * 22;
                    const moveY = Math.sin(angle) * force * 22;

                    // Smooth lerp back to origin or to new forced position
                    dot.x += (dot.originX - moveX - dot.x) * 0.12;
                    dot.y += (dot.originY - moveY - dot.y) * 0.12;
                } else {
                    // Snap back to origin
                    dot.x += (dot.originX - dot.x) * 0.08;
                    dot.y += (dot.originY - dot.y) * 0.08;
                }

                ctx.beginPath();
                ctx.arc(dot.x, dot.y, 1.1, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)' }}
        />
    );
};
