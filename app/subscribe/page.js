'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthGuard } from '@/hooks/useAuthGuard'

function SubscribeContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, loading: authLoading } = useAuthGuard()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selected, setSelected] = useState('monthly')
    const cancelled = searchParams.get('cancelled')

    const handleSubscribe = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: selected,
                    userId: user.id,
                    userEmail: user.email,
                }),
            })
            const { url, error: apiError } = await res.json()
            if (apiError) throw new Error(apiError)
            window.location.href = url
        } catch (err) {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    if (authLoading) return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        </main>
    )

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            {/* NAVBAR */}
            <nav className="flex justify-between items-center px-6 md:px-8 py-5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-black text-xs font-black">G</span>
                    </div>
                    <h1 className="text-base font-semibold">GolfGives</h1>
                </div>
                <Link href="/dashboard" className="text-white/40 hover:text-white text-sm transition">
                    ← Back
                </Link>
            </nav>

            <div className="max-w-3xl mx-auto px-6 py-16">

                {/* CANCELLED BANNER */}
                {cancelled && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-8 text-center">
                        <p className="text-yellow-400 text-sm">Payment was cancelled. Choose a plan and try again.</p>
                    </div>
                )}

                {/* ERROR BANNER */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-8 text-center">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* HEADER */}
                <div className="text-center mb-16">
                    <p className="text-white/40 text-sm font-medium uppercase tracking-widest mb-4">Pricing</p>
                    <h1 className="text-5xl font-bold tracking-tight mb-4">Simple, transparent pricing</h1>
                    <p className="text-white/40 text-lg">Cancel anytime. No hidden fees.</p>
                </div>

                {/* PLANS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* MONTHLY */}
                    <div
                        onClick={() => setSelected('monthly')}
                        className={`relative p-8 rounded-3xl border-2 cursor-pointer transition-all ${selected === 'monthly'
                                ? 'border-white bg-white/5'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                            }`}
                    >
                        {selected === 'monthly' && (
                            <div className="absolute top-4 right-4 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                <span className="text-black text-xs font-black">✓</span>
                            </div>
                        )}
                        <p className="text-white/40 text-sm mb-4">Monthly</p>
                        <div className="flex items-end gap-1 mb-6">
                            <span className="text-5xl font-black">£9.99</span>
                            <span className="text-white/30 mb-2">/month</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {[
                                'Monthly prize draw entry',
                                'Score tracking & history',
                                'Charity contribution',
                                'Cancel anytime',
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white/60 text-xs">✓</span>
                                    </div>
                                    <span className="text-white/60 text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* YEARLY */}
                    <div
                        onClick={() => setSelected('yearly')}
                        className={`relative p-8 rounded-3xl border-2 cursor-pointer transition-all ${selected === 'yearly'
                                ? 'border-white bg-white/5'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                            }`}
                    >
                        <div className="absolute top-4 left-4 bg-white text-black text-xs font-bold px-3 py-1 rounded-full">
                            Save 17%
                        </div>
                        {selected === 'yearly' && (
                            <div className="absolute top-4 right-4 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                <span className="text-black text-xs font-black">✓</span>
                            </div>
                        )}
                        <p className="text-white/40 text-sm mb-4 mt-6">Yearly</p>
                        <div className="flex items-end gap-1 mb-1">
                            <span className="text-5xl font-black">£99.99</span>
                            <span className="text-white/30 mb-2">/year</span>
                        </div>
                        <p className="text-white/30 text-sm mb-6">£8.33/month billed annually</p>
                        <div className="flex flex-col gap-3">
                            {[
                                'Everything in Monthly',
                                '2 months free',
                                'Priority support',
                                'Early draw access',
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white/60 text-xs">✓</span>
                                    </div>
                                    <span className="text-white/60 text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SUBSCRIBE BUTTON */}
                <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full bg-white text-black font-semibold text-lg py-4 rounded-2xl hover:bg-white/90 transition disabled:opacity-50"
                >
                    {loading ? 'Processing...' : `Get started with ${selected === 'monthly' ? 'Monthly' : 'Yearly'} →`}
                </button>

                <p className="text-white/20 text-center text-sm mt-4">
                    Secure · Cancel anytime · 10% goes to your charity
                </p>

                {/* PRIZE BREAKDOWN */}
                <div className="mt-16 border-t border-white/5 pt-16">
                    <p className="text-white/40 text-sm font-medium uppercase tracking-widest text-center mb-8">
                        What you're playing for
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { match: '5 numbers', share: '40%', label: 'Jackpot', color: 'text-white' },
                            { match: '4 numbers', share: '35%', label: 'Major', color: 'text-white/70' },
                            { match: '3 numbers', share: '25%', label: 'Prize', color: 'text-white/50' },
                        ].map((tier) => (
                            <div key={tier.match} className="text-center p-6 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                                <p className={`text-3xl font-black ${tier.color}`}>{tier.share}</p>
                                <p className="text-white/40 text-sm mt-1">{tier.label}</p>
                                <p className="text-white/20 text-xs mt-1">Match {tier.match}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    )
}


export default function Subscribe() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </main>
        }>
            <SubscribeContent />
        </Suspense>
    )
}
