'use client'
import { useEffect, useState } from 'react'
import { NavLogo, Spinner } from '@/components/UI'

const ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }

const COLORS = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
    error:   { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
    info:    { bg: '#f8f8f6', border: 'rgba(0,0,0,0.09)', text: 'rgba(0,0,0,0.6)' },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#d97706' },
}

function Toast({ id, message, type = 'info', onDismiss }) {
    const c = COLORS[type] || COLORS.info
    useEffect(() => {
        const t = setTimeout(() => onDismiss(id), 3500)
        return () => clearTimeout(t)
    }, [id, onDismiss])

    return (
        <div
            className="animate-toast-in flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-sm"
            style={{ background: c.bg, borderColor: c.border }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: c.border, color: c.text }}>
                {ICONS[type]}
            </span>
            <p className="text-sm font-medium" style={{ color: c.text }}>{message}</p>
            <button onClick={() => onDismiss(id)}
                className="ml-auto text-sm leading-none opacity-40 hover:opacity-80 transition"
                style={{ color: c.text }}>✕</button>
        </div>
    )
}

export function ToastContainer({ toasts, onDismiss }) {
    if (toasts.length === 0) return null
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
            {toasts.map(t => <Toast key={t.id} {...t} onDismiss={onDismiss} />)}
        </div>
    )
}

export function useToast() {
    const [toasts, setToasts] = useState([])
    const addToast = (message, type = 'info') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
    }
    const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id))
    return {
        toasts, dismiss,
        toast: {
            success: (msg) => addToast(msg, 'success'),
            error:   (msg) => addToast(msg, 'error'),
            info:    (msg) => addToast(msg, 'info'),
            warning: (msg) => addToast(msg, 'warning'),
        }
    }
}

export function SkeletonCard({ className = '' }) {
    return <div className={`skeleton ${className}`} />
}

export function DashboardSkeleton() {
    return (
        <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
            <nav className="flex justify-between items-center px-8 py-5 border-b"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <NavLogo />
                <div className="skeleton h-4 w-32 rounded-full" />
            </nav>
            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="mb-10">
                    <div className="skeleton h-8 w-56 mb-2" />
                    <div className="skeleton h-4 w-40" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[1,2,3].map(i => (
                        <div key={i} className="rounded-2xl p-6 border"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="skeleton h-4 w-20 mb-3" />
                            <div className="skeleton h-6 w-24 mb-2" />
                            <div className="skeleton h-3 w-16" />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1,2].map(i => (
                        <div key={i} className="rounded-2xl p-8 border"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="skeleton h-5 w-32 mb-6" />
                            {[1,2,3].map(j => (
                                <div key={j} className="skeleton h-12 mb-2 rounded-xl" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}
