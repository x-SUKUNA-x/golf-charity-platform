'use client'
import Link from 'next/link'

/* ─── Logo mark ─────────────────────────────────────────────────────────── */
export function LogoMark({ size = 7 }) {
    return (
        <div className={`w-${size} h-${size} rounded-lg flex items-center justify-center flex-shrink-0`}
            style={{ background: 'var(--accent)' }}>
            <span className="text-black font-black" style={{ fontSize: size <= 7 ? '11px' : '13px' }}>G</span>
        </div>
    )
}

/* ─── Branded nav link ───────────────────────────────────────────────────── */
export function NavLogo({ href = '/' }) {
    return (
        <Link href={href} className="flex items-center gap-2">
            <LogoMark />
            <span className="text-white font-semibold tracking-tight text-base">GolfGives</span>
        </Link>
    )
}

/* ─── Page spinner ───────────────────────────────────────────────────────── */
export function Spinner({ size = 8 }) {
    return (
        <div className={`w-${size} h-${size} rounded-full border-2 border-white/10 animate-spin`}
            style={{ borderTopColor: 'var(--accent)' }} />
    )
}

/* ─── Full-page loading screen ───────────────────────────────────────────── */
export function LoadingScreen() {
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Spinner />
                <p className="text-white/30 text-sm">Loading...</p>
            </div>
        </main>
    )
}

/* ─── Amber CTA button ───────────────────────────────────────────────────── */
export function CTAButton({ onClick, disabled, loading, children, className = '', type = 'button' }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`btn-cta font-bold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
        >
            {loading ? 'Loading...' : children}
        </button>
    )
}

/* ─── Auth card wrapper ──────────────────────────────────────────────────── */
export function AuthCard({ children }) {
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center top, rgba(232,160,32,0.1) 0%, transparent 70%)' }} />
            <div className="relative w-full max-w-md animate-scale-in">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <NavLogo href="/" />
                </div>
                {/* Card */}
                <div className="rounded-2xl p-8 border border-white/[0.08]"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {children}
                </div>
            </div>
        </main>
    )
}

/* ─── Styled input ───────────────────────────────────────────────────────── */
export function Input({ type = 'text', placeholder, value, onChange, className = '' }) {
    return (
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 transition-all duration-200 focus:outline-none focus:border-[var(--accent)] focus:bg-white/[0.06] ${className}`}
        />
    )
}

/* ─── Error / banner ─────────────────────────────────────────────────────── */
export function ErrorBanner({ message }) {
    if (!message) return null
    return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5">
            <p className="text-red-400 text-sm">{message}</p>
        </div>
    )
}

/* ─── Success banner ─────────────────────────────────────────────────────── */
export function SuccessBanner({ message }) {
    if (!message) return null
    return (
        <div className="rounded-xl p-3 mb-5 border"
            style={{ background: 'rgba(232,160,32,0.08)', borderColor: 'rgba(232,160,32,0.2)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{message}</p>
        </div>
    )
}

/* ─── Checkmark list item ────────────────────────────────────────────────── */
export function CheckItem({ children }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(232,160,32,0.15)' }}>
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className="text-white/60 text-sm">{children}</span>
        </div>
    )
}

/* ─── Section label ──────────────────────────────────────────────────────── */
export function SectionLabel({ children }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3"
            style={{ color: 'var(--accent)' }}>
            {children}
        </p>
    )
}
