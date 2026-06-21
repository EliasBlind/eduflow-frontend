import { useEffect, useRef } from "react";

export default function NotFoundPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const particles: Particle[] = [];
        const count = 120;

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;
            opacity: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 3 + 1;
                this.speedX = (Math.random() - 0.5) * 0.6;
                this.speedY = (Math.random() - 0.5) * 0.6;
                this.opacity = Math.random() * 0.6 + 0.2;
                const colors = [
                    `rgba(255, 120, 0, ${this.opacity})`,
                    `rgba(255, 80, 0, ${this.opacity})`,
                    `rgba(200, 50, 0, ${this.opacity})`,
                    `rgba(255, 160, 50, ${this.opacity})`,
                ];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > width) this.x = 0;
                if (this.x < 0) this.x = width;
                if (this.y > height) this.y = 0;
                if (this.y < 0) this.y = height;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();

                ctx.shadowColor = "rgba(255, 120, 0, 0.3)";
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }

        let mouseX = -1000;
        let mouseY = -1000;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("resize", handleResize);

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        const opacity = (1 - dist / 150) * 0.2;
                        ctx.strokeStyle = `rgba(255, 120, 0, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            for (const p of particles) {
                const dx = p.x - mouseX;
                const dy = p.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    const force = (120 - dist) / 120 * 0.5;
                    p.x += (dx / dist) * force;
                    p.y += (dy / dist) * force;
                }
                p.update();
                p.draw();
            }

            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <div className="not-found-container">
            <canvas ref={canvasRef} className="particle-canvas" />

            <div className="content">
                <div className="glitch-wrapper">
                    <div className="glitch" data-text="404">
                        404
                    </div>
                </div>

                <div className="actions">
                    <a href="/" className="btn-primary">
                        <span>Go home</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12l9-9 9 9" />
                            <path d="M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
                        </svg>
                    </a>
                </div>
            </div>

            <style>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .not-found-container {
                    position: relative;
                    width: 100vw;
                    height: 100vh;
                    overflow: hidden;
                    background: #0a0a0a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                }

                .particle-canvas {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 0;
                    pointer-events: none;
                }

                .content {
                    position: relative;
                    z-index: 1;
                    text-align: center;
                    padding: 2rem;
                    max-width: 800px;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2.5rem;
                }

                /* Glitch 404 */
                .glitch-wrapper {
                    position: relative;
                    display: inline-block;
                }

                .glitch {
                    font-size: clamp(6rem, 18vw, 12rem);
                    font-weight: 900;
                    color: #ff6a00;
                    text-shadow:
                        0 0 10px rgba(255, 106, 0, 0.5),
                        0 0 30px rgba(255, 106, 0, 0.3),
                        0 0 60px rgba(255, 106, 0, 0.15);
                    position: relative;
                    letter-spacing: 0.1em;
                    line-height: 1;
                    animation: glitch 3s infinite;
                    user-select: none;
                }

                .glitch::before,
                .glitch::after {
                    content: attr(data-text);
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }

                .glitch::before {
                    color: #ff3d00;
                    animation: glitchShift 2.5s infinite linear alternate-reverse;
                    clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
                    transform: translate(-2px, -2px);
                    opacity: 0.8;
                }

                .glitch::after {
                    color: #ff9a00;
                    animation: glitchShift 2.5s infinite linear alternate-reverse;
                    clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
                    transform: translate(2px, 2px);
                    opacity: 0.8;
                }

                @keyframes glitch {
                    0%, 100% { transform: skew(0deg); }
                    2% { transform: skew(2deg); }
                    4% { transform: skew(-2deg); }
                    6% { transform: skew(0deg); }
                    20% { transform: scale(1); }
                    22% { transform: scale(1.02) skew(1deg); }
                    24% { transform: scale(1) skew(0deg); }
                }

                @keyframes glitchShift {
                    0% { transform: translate(-3px, -3px); }
                    20% { transform: translate(3px, -2px); }
                    40% { transform: translate(-2px, 4px); }
                    60% { transform: translate(4px, 2px); }
                    80% { transform: translate(-4px, -3px); }
                    100% { transform: translate(2px, 4px); }
                }

                .glitch-wrapper::after {
                    content: '';
                    position: absolute;
                    top: -40%;
                    left: -20%;
                    width: 140%;
                    height: 180%;
                    background: radial-gradient(ellipse at center, rgba(255, 106, 0, 0.06) 0%, transparent 70%);
                    pointer-events: none;
                    animation: glowPulse 4s ease-in-out infinite;
                }

                @keyframes glowPulse {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.1); }
                }

                /* Buttons */
                .actions {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.7rem;
                    padding: 0.85rem 2rem;
                    border-radius: 50px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    background: linear-gradient(135deg, #ff6a00, #e85500);
                    color: #fff;
                    box-shadow: 0 4px 25px rgba(255, 106, 0, 0.35);
                    border: none;
                }

                .btn-primary:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 8px 40px rgba(255, 106, 0, 0.5);
                }

                .btn-primary:active {
                    transform: scale(0.97);
                }

                .btn-primary svg {
                    width: 20px;
                    height: 20px;
                    transition: transform 0.3s;
                }

                .btn-primary:hover svg {
                    transform: translateY(-2px);
                }

                /* Responsive */
                @media (max-width: 640px) {
                    .glitch {
                        font-size: clamp(4rem, 20vw, 6rem);
                    }
                    .content {
                        gap: 1.8rem;
                    }
                    .btn-primary {
                        width: 100%;
                        justify-content: center;
                        padding: 0.75rem 1.5rem;
                    }
                }

                @media (max-width: 400px) {
                    .glitch {
                        font-size: 3.5rem;
                    }
                }

                /* Decorative orbs */
                .content::before,
                .content::after {
                    content: '';
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: -1;
                }

                .content::before {
                    width: 300px;
                    height: 300px;
                    top: -80px;
                    right: -100px;
                    background: radial-gradient(circle, rgba(255, 106, 0, 0.04) 0%, transparent 70%);
                    animation: floatOrb 8s ease-in-out infinite;
                }

                .content::after {
                    width: 400px;
                    height: 400px;
                    bottom: -120px;
                    left: -150px;
                    background: radial-gradient(circle, rgba(255, 60, 0, 0.03) 0%, transparent 70%);
                    animation: floatOrb 10s ease-in-out infinite reverse;
                }

                @keyframes floatOrb {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(20px, -30px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
            `}</style>
        </div>
    );
}

