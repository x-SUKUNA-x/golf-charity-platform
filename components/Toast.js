'use client'
import { useEffect, useState } from 'react'

const ICONS = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
}

const COLORS = {
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-white/5 border-white/10 text-white/70',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
}

// ─── Single Toast ─────────────────────────────────────────────────────────
function Toast({ id, message, type = 'info', onDismiss }) {
    useEffect(() => {
        const t = setTimeout(() => onDismiss(id), 3500)
        return () => clearTimeout(t)
    }, [id, onDismiss])

    return (
        <div className={`animate-toast-in flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm shadow-xl ${COLORS[type]}`}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-current/10">
                {ICONS[type]}
            </span>
            <p className="text-sm font-medium">{message}</p>
            <button
                onClick={() => onDismiss(id)}
                className="ml-auto opacity-40 hover:opacity-100 transition text-sm leading-none"
            >
                ✕
            </button>
        </div>
    )
}

// ─── Toast Container ──────────────────────────────────────────────────────
export function ToastContainer({ toasts, onDismiss }) {
    if (toasts.length === 0) return null
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
            {toasts.map(t => (
                <Toast key={t.id} {...t} onDismiss={onDismiss} />
            ))}
        </div>
    )
}

// ─── Hook ────────────────────────────────────────────────────────────────
export function useToast() {
    const [toasts, setToasts] = useState([])

    const addToast = (message, type = 'info') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
    }

    const dismiss = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    return {
        toasts,
        dismiss,
        toast: {
            success: (msg) => addToast(msg, 'success'),
            error:   (msg) => addToast(msg, 'error'),
            info:    (msg) => addToast(msg, 'info'),
            warning: (msg) => addToast(msg, 'warning'),
        }
    }
}

// ─── Skeleton helpers ─────────────────────────────────────────────────────
export function SkeletonCard({ className = '' }) {
    return <div className={`skeleton ${className}`} />
}

export function DashboardSkeleton() {
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            <nav className="flex justify-between items-center px-8 py-5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-black text-xs font-black">G</span>
                    </div>
                    <span className="text-base font-semibold">GolfGives</span>
                </div>
                <div className="skeleton h-4 w-32 rounded-full" />
            </nav>
            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="mb-10">
                    <div className="skeleton h-8 w-56 mb-2" />
                    <div className="skeleton h-4 w-40" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[1,2,3].map(i => (
                        <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                            <div className="skeleton h-4 w-20 mb-3" />
                            <div className="skeleton h-6 w-24 mb-2" />
                            <div className="skeleton h-3 w-16" />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1,2].map(i => (
                        <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
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
