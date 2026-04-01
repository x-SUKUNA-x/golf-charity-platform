'use client'
import Link from 'next/link'

export function LogoMark({ size = 7 }) {
    return (
        <div className={`w-${size} h-${size} rounded-lg flex items-center justify-center flex-shrink-0`}
            style={{ background: 'var(--accent)' }}>
            <span className="text-black font-black" style={{ fontSize: size <= 7 ? '11px' : '13px' }}>G</span>
        </div>
    )
}

export function NavLogo({ href = '/' }) {
    return (
        <Link href={href} className="flex items-center gap-2">
            <LogoMark />
            <span className="font-semibold tracking-tight text-base" style={{ color: 'var(--text)' }}>GolfGives</span>
        </Link>
    )
}

export function Spinner({ size = 8 }) {
    return (
        <div className={`w-${size} h-${size} rounded-full border-2 animate-spin`}
            style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--accent)' }} />
    )
}

export function LoadingScreen() {
    return (
        <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
            <div className="flex flex-col items-center gap-4">
                <Spinner />
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>Loading...</p>
            </div>
        </main>
    )
}

export function CTAButton({ onClick, disabled, loading, children, className = '', type = 'button' }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`btn-cta rounded-xl ${className}`}
        >
            {loading ? 'Loading...' : children}
        </button>
    )
}

export function AuthCard({ children }) {
    return (
        <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
            style={{ background: 'var(--bg)' }}>
            {/* Subtle top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[320px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center top, rgba(232,160,32,0.12) 0%, transparent 70%)' }} />
            <div className="relative w-full max-w-md animate-scale-in">
                <div className="flex justify-center mb-7">
                    <NavLogo href="/" />
                </div>
                <div className="rounded-2xl p-8 border"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                    {children}
                </div>
            </div>
        </main>
    )
}

export function Input({ type = 'text', placeholder, value, onChange, className = '', min, max }) {
    return (
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            className={`w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:outline-none ${className}`}
            style={{
                background: 'rgba(0,0,0,0.03)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'rgba(232,160,32,0.04)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'rgba(0,0,0,0.03)' }}
        />
    )
}

export function ErrorBanner({ message }) {
    if (!message) return null
    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
            <p className="text-red-600 text-sm">{message}</p>
        </div>
    )
}

export function SuccessBanner({ message }) {
    if (!message) return null
    return (
        <div className="rounded-xl p-3 mb-5 border"
            style={{ background: 'rgba(232,160,32,0.08)', borderColor: 'rgba(232,160,32,0.25)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--accent-dark)' }}>{message}</p>
        </div>
    )
}

export function CheckItem({ children }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(232,160,32,0.15)' }}>
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="var(--accent-dark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className="text-sm" style={{ color: 'var(--text-2)' }}>{children}</span>
        </div>
    )
}

export function SectionLabel({ children }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3"
            style={{ color: 'var(--accent-dark)' }}>
            {children}
        </p>
    )
}
