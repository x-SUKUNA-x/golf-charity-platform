'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { NavLogo, Spinner, CTAButton, CheckItem } from '@/components/UI'

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
                body: JSON.stringify({ plan: selected, userId: user.id, userEmail: user.email }),
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
            <Spinner />
        </main>
    )

    const plans = [
        {
            id: 'monthly',
            label: 'Monthly',
            price: '£9.99',
            per: '/month',
            sub: null,
            badge: null,
            features: ['Monthly prize draw entry', 'Score tracking & history', 'Charity contribution', 'Cancel anytime'],
        },
        {
            id: 'yearly',
            label: 'Yearly',
            price: '£99.99',
            per: '/year',
            sub: '£8.33/month billed annually',
            badge: 'Save 17%',
            features: ['Everything in Monthly', '2 months free', 'Priority support', 'Early draw access'],
        },
    ]

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Ambient glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center top, rgba(232,160,32,0.08) 0%, transparent 70%)' }} />

            {/* NAVBAR */}
            <nav className="flex justify-between items-center px-6 md:px-8 py-5 border-b border-white/[0.05]">
                <NavLogo />
                <Link href="/dashboard" className="text-white/30 hover:text-white text-sm transition">
                    ← Back
                </Link>
            </nav>

            <div className="max-w-3xl mx-auto px-6 py-16 relative">

                {/* CANCELLED */}
                {cancelled && (
                    <div className="rounded-2xl p-4 mb-8 text-center border border-white/10 bg-white/[0.03]">
                        <p className="text-white/50 text-sm">Payment was cancelled — choose a plan and try again.</p>
                    </div>
                )}

                {/* ERROR */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-8 text-center">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* HEADER */}
                <div className="text-center mb-14">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--accent)' }}>
                        Pricing
                    </p>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">
                        One simple plan.<br />One big impact.
                    </h1>
                    <p className="text-white/40 text-base">Cancel anytime. No hidden fees. Charity giving from day one.</p>
                </div>

                {/* PLANS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {plans.map((plan) => {
                        const isSelected = selected === plan.id
                        return (
                            <div
                                key={plan.id}
                                onClick={() => setSelected(plan.id)}
                                className="relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-200"
                                style={isSelected ? {
                                    borderColor: 'var(--accent)',
                                    background: 'rgba(232,160,32,0.07)',
                                } : {
                                    borderColor: 'rgba(255,255,255,0.08)',
                                    background: 'rgba(255,255,255,0.025)',
                                }}
                            >
                                {/* Save badge */}
                                {plan.badge && (
                                    <div className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full"
                                        style={{ background: 'var(--accent)', color: '#000' }}>
                                        {plan.badge}
                                    </div>
                                )}
                                {/* Selected indicator */}
                                {isSelected && (
                                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{ background: 'var(--accent)' }}>
                                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}

                                <p className="text-white/40 text-sm mb-4 mt-4">{plan.label}</p>
                                <div className="flex items-end gap-1 mb-1">
                                    <span className="text-5xl font-black">{plan.price}</span>
                                    <span className="text-white/30 mb-2 text-sm">{plan.per}</span>
                                </div>
                                {plan.sub && <p className="text-white/30 text-sm mb-6">{plan.sub}</p>}
                                <div className="flex flex-col gap-3 mt-5">
                                    {plan.features.map(f => <CheckItem key={f}>{f}</CheckItem>)}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* SUBSCRIBE BUTTON */}
                <CTAButton
                    onClick={handleSubscribe}
                    loading={loading}
                    className="w-full py-4 text-base rounded-2xl"
                >
                    {loading ? 'Processing...' : `Subscribe ${selected === 'monthly' ? 'Monthly' : 'Yearly'} →`}
                </CTAButton>

                {/* Trust line */}
                <div className="flex items-center justify-center gap-6 mt-5 text-white/20 text-xs">
                    <span className="flex items-center gap-1.5">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Secure checkout
                    </span>
                    <span>·</span>
                    <span>Cancel anytime</span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        10% to charity
                    </span>
                </div>

                {/* PRIZE BREAKDOWN */}
                <div className="mt-16 border-t border-white/[0.05] pt-12">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-center mb-8 text-white/30">
                        What you're playing for
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { match: '5 numbers', share: '40%', label: 'Jackpot', featured: true },
                            { match: '4 numbers', share: '35%', label: 'Major prize', featured: false },
                            { match: '3 numbers', share: '25%', label: 'Prize', featured: false },
                        ].map((tier) => (
                            <div key={tier.match}
                                className="text-center p-6 rounded-2xl border"
                                style={tier.featured ? {
                                    background: 'rgba(232,160,32,0.08)',
                                    borderColor: 'rgba(232,160,32,0.2)',
                                } : {
                                    background: 'rgba(255,255,255,0.025)',
                                    borderColor: 'rgba(255,255,255,0.06)',
                                }}>
                                <p className="text-3xl font-black" style={tier.featured ? { color: 'var(--accent)' } : {}}>
                                    {tier.share}
                                </p>
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
                <Spinner />
            </main>
        }>
            <SubscribeContent />
        </Suspense>
    )
}
