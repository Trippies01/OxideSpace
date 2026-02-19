import React, { useRef, useEffect, useCallback } from 'react';
import { Download, LogIn } from 'lucide-react';
import { SETUP_DOWNLOAD_URL } from '../constants';

export interface LandingPageProps {
    onLoginClick: () => void;
}

const LERP = 0.018;

export default function LandingPage({ onLoginClick }: LandingPageProps) {
    const bgRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const mouse = useRef({ x: 0.5, y: 0.5 });
    const current = useRef({ x: 0.5, y: 0.5 });
    const rafId = useRef<number>(0);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        current.current.x = e.clientX / window.innerWidth;
        current.current.y = e.clientY / window.innerHeight;
    }, []);

    useEffect(() => {
        const tick = () => {
            const cur = current.current;
            const pos = mouse.current;
            pos.x += (cur.x - pos.x) * LERP;
            pos.y += (cur.y - pos.y) * LERP;
            const mx = (pos.x - 0.5) * 32;
            const my = (pos.y - 0.5) * 32;
            const tiltX = (pos.x - 0.5) * 8;
            const tiltY = (pos.y - 0.5) * 6;
            if (bgRef.current) {
                bgRef.current.style.setProperty('--mx', `${mx}px`);
                bgRef.current.style.setProperty('--my', `${my}px`);
                bgRef.current.style.setProperty('--mouse-x', `${pos.x * 100}%`);
                bgRef.current.style.setProperty('--mouse-y', `${pos.y * 100}%`);
            }
            if (contentRef.current) {
                contentRef.current.style.setProperty('--tilt-x', String(-tiltX));
                contentRef.current.style.setProperty('--tilt-y', String(tiltY));
            }
            rafId.current = requestAnimationFrame(tick);
        };
        rafId.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId.current);
    }, []);

    return (
        <div
            className="min-h-screen w-full bg-[#0a0a0f] text-white flex flex-col overflow-hidden relative"
            onMouseMove={onMouseMove}
        >
            {/* Arka plan: CSS değişkenleri ile güncellenir (React re-render yok) */}
            <div ref={bgRef} className="absolute inset-0 pointer-events-none overflow-hidden" style={{ ['--mx' as string]: 0, ['--my' as string]: 0, ['--mouse-x' as string]: '50%', ['--mouse-y' as string]: '50%' }}>
                <div
                    className="absolute w-[min(80vw,600px)] h-[min(80vw,600px)] rounded-full blur-[80px] opacity-[0.12]"
                    style={{ left: 'var(--mouse-x)', top: 'var(--mouse-y)', transform: 'translate(-50%, -50%)', background: 'radial-gradient(circle, rgba(249,115,22,0.5) 0%, transparent 70%)' }}
                />
                <div
                    className="absolute inset-0 opacity-[0.04] transition-transform duration-700"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                        transform: 'translate(calc(var(--mx) * 0.3), calc(var(--my) * 0.3))',
                    }}
                />
                <div className="absolute left-[10%] top-[10%] w-[80vmax] h-[80vmax]" style={{ transform: 'translate(var(--mx), var(--my))' } as React.CSSProperties}>
                    <div className="absolute inset-0 rounded-full blur-[120px] opacity-20 animate-blob-slow" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)' }} />
                </div>
                <div className="absolute right-[5%] bottom-[20%] w-[60vmax] h-[60vmax]" style={{ transform: 'translate(calc(var(--mx) * -0.8), calc(var(--my) * -0.8))' } as React.CSSProperties}>
                    <div className="absolute inset-0 rounded-full blur-[100px] opacity-20 animate-blob-slow-reverse" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.35) 0%, transparent 70%)' }} />
                </div>
                <div className="absolute left-1/2 top-1/2 w-[50vmax] h-[50vmax] -translate-x-1/2 -translate-y-1/2" style={{ transform: 'translate(-50%, -50%) translate(calc(var(--mx) * 0.5), calc(var(--my) * 0.5))' } as React.CSSProperties}>
                    <div className="absolute inset-0 rounded-full blur-[90px] opacity-10 animate-blob-slower" style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.3) 0%, transparent 70%)' }} />
                </div>
            </div>

            <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10 md:py-5">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="OxideSpace" className="w-10 h-10 rounded-xl object-cover shadow-lg" />
                    <span className="font-bold text-xl tracking-tight text-white">Oxide<span className="text-orange-400">Space</span></span>
                </div>
                <button type="button" onClick={onLoginClick} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-[#0a0a0f] font-semibold text-sm hover:bg-gray-200 transition-colors">
                    <LogIn size={18} /> Giriş yap
                </button>
            </header>

            <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-20">
                <div
                    ref={contentRef}
                    className="text-center max-w-2xl transition-transform duration-500 ease-out"
                    style={{ ['--tilt-x' as string]: 0, ['--tilt-y' as string]: 0, transform: 'perspective(800px) rotateY(var(--tilt-x)deg) rotateX(var(--tilt-y)deg)' }}
                >
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 transition-transform duration-300">
                        Dijital iletişimde
                        <br />
                        <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">yeni bir element.</span>
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-xl mb-10">
                        Ses, görüntü ve sohbet hepsi bir arada. Arkadaşlarınla bağlan, sunucular kur.
                    </p>
                    <a
                        href={SETUP_DOWNLOAD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-lg shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
                    >
                        <Download size={24} />
                        Windows için indir
                    </a>
                    <p className="mt-6 text-zinc-500 text-sm">
                        Windows 10/11 (64-bit). Web’den de kullanabilirsin.
                    </p>
                    <button
                        type="button"
                        onClick={onLoginClick}
                        className="mt-4 text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors duration-300"
                    >
                        Zaten hesabın var mı? Giriş yap →
                    </button>
                </div>
            </main>
        </div>
    );
}
