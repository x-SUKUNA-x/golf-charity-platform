'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

/* ─── Scroll reveal hook ─────────────────────────────────────────────────── */
function useReveal() {
    useEffect(() => {
        const els = document.querySelectorAll('.reveal')
        const io = new IntersectionObserver(
            (entries) => entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible')
                    io.unobserve(e.target)
                }
            }),
            { threshold: 0.12 }
        )
        els.forEach(el => io.observe(el))
        return () => io.disconnect()
    }, [])
}

/* ─── Animated counter ───────────────────────────────────────────────────── */
function CountUp({ end, prefix = '', suffix = '', duration = 1800 }) {
    const [val, setVal] = useState(0)
    const ref = useRef()
    const started = useRef(false)

    useEffect(() => {
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !started.current) {
                started.current = true
                const startTime = performance.now()
                const numeric = parseFloat(end.replace(/[^0-9.]/g, ''))
                const step = (now) => {
                    const progress = Math.min((now - startTime) / duration, 1)
                    const eased = 1 - Math.pow(1 - progress, 3)
                    setVal(Math.floor(eased * numeric))
                    if (progress < 1) requestAnimationFrame(step)
                    else setVal(numeric)
                }
                requestAnimationFrame(step)
            }
        }, { threshold: 0.5 })
        if (ref.current) io.observe(ref.current)
        return () => io.disconnect()
    }, [end, duration])

    const display = end.includes('K') ? (val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val) : val
    return <span ref={ref}>{prefix}{display}{suffix}</span>
}

/* ─── Impact ticker ──────────────────────────────────────────────────────── */
const tickerItems = [
    '£40K+ raised for charity',
    '2,400 members playing',
    '12 charity partners',
    'Monthly jackpots rolling',
    'Scores tracked every round',
    'Lives changed, one subscription at a time',
    '£40K+ raised for charity',
    '2,400 members playing',
    '12 charity partners',
    'Monthly jackpots rolling',
    'Scores tracked every round',
    'Lives changed, one subscription at a time',
]

/* ─── Nav ────────────────────────────────────────────────────────────────── */
function Nav() {
    const [scrolled, setScrolled] = useState(false)
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-10 py-5 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/[0.06]' : ''}`}>
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                    <span className="text-black text-sm font-black">G</span>
                </div>
                <span className="text-white font-semibold tracking-tight">GolfGives</span>
            </div>
            <div className="flex items-center gap-2">
                <Link href="/login" className="btn-ghost text-white/50 hover:text-white text-sm px-4 py-2 rounded-full font-medium">
                    Sign in
                </Link>
                <Link href="/signup" className="btn-cta px-5 py-2.5 rounded-full text-sm font-bold">
                    Subscribe now
                </Link>
            </div>
        </nav>
    )
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function Hero() {
    return (
        <section className="relative flex flex-col items-center justify-center text-center px-6 pt-40 pb-28 overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center top, rgba(232,160,32,0.12) 0%, transparent 70%)' }} />
            <div className="absolute top-40 left-1/4 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(232,160,32,0.06) 0%, transparent 70%)' }} />
            <div className="absolute top-40 right-1/4 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />

            {/* Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 border border-white/10 rounded-full px-4 py-2 mb-8 text-sm"
                style={{ background: 'rgba(232,160,32,0.08)', color: 'var(--accent)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-glow" style={{ background: 'var(--accent)' }} />
                Monthly draw is live — £12,000 jackpot unclaimed
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-7 max-w-4xl"
                style={{ animationDelay: '0.1s' }}>
                Your subscription<br />
                <span style={{ color: 'var(--accent)' }}>changes lives.</span>
            </h1>

            {/* Sub */}
            <p className="animate-fade-up text-white/50 text-lg md:text-xl max-w-md leading-relaxed mb-10"
                style={{ animationDelay: '0.2s' }}>
                Play golf. Win monthly prizes. Fund charities you believe in — automatically, every month.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up flex flex-col sm:flex-row items-center gap-3 mb-16"
                style={{ animationDelay: '0.3s' }}>
                <Link href="/signup"
                    className="btn-cta px-8 py-4 rounded-full text-base font-bold animate-pulse-glow inline-flex items-center gap-2">
                    Start your subscription
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
                <Link href="/charities" className="btn-ghost text-white/50 px-6 py-4 rounded-full text-sm font-medium">
                    See our charities →
                </Link>
            </div>

            {/* Social proof avatars */}
            <div className="animate-fade-up flex items-center gap-4" style={{ animationDelay: '0.4s' }}>
                <div className="flex -space-x-2">
                    {['#e8a020', '#6366f1', '#10b981', '#f43f5e', '#8b5cf6'].map((c, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-xs font-bold text-black"
                            style={{ background: c }}>
                            {['J', 'S', 'M', 'T', 'L'][i]}
                        </div>
                    ))}
                </div>
                <p className="text-white/40 text-sm">
                    <span className="text-white/70 font-medium">2,400+</span> golfers already giving back
                </p>
            </div>
        </section>
    )
}

/* ─── Impact ticker strip ────────────────────────────────────────────────── */
function ImpactTicker() {
    return (
        <div className="border-y border-white/[0.06] py-4 overflow-hidden relative"
            style={{ background: 'rgba(232,160,32,0.04)' }}>
            <div className="flex gap-0 animate-ticker whitespace-nowrap w-max">
                {tickerItems.map((item, i) => (
                    <span key={i} className="flex items-center gap-3 px-8 text-sm font-medium"
                        style={{ color: i % 2 === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.3)' }}>
                        {item}
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(232,160,32,0.4)' }} />
                    </span>
                ))}
            </div>
        </div>
    )
}

/* ─── Impact section (leads with charity) ────────────────────────────────── */
function ImpactSection() {
    return (
        <section className="px-6 py-24">
            <div className="max-w-5xl mx-auto">
                {/* Label */}
                <p className="reveal text-xs font-semibold uppercase tracking-[0.2em] text-center mb-4"
                    style={{ color: 'var(--accent)' }}>
                    Real impact, every month
                </p>

                {/* Heading */}
                <h2 className="reveal reveal-delay-1 text-4xl md:text-5xl font-black tracking-tighter text-center mb-6 leading-tight">
                    You play. You win.<br />
                    <span className="text-white/30">Charities thrive.</span>
                </h2>

                <p className="reveal reveal-delay-2 text-white/40 text-lg text-center max-w-lg mx-auto mb-16 leading-relaxed">
                    A minimum of 10% of every subscription goes straight to a charity you choose. No admin fees hidden in the fine print.
                </p>

                {/* Impact stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { value: '£40K+', label: 'Donated to charities', sub: 'since launch', color: 'var(--accent)' },
                        { value: '12', label: 'Charity partners', sub: 'and growing', color: '#10b981' },
                        { value: '2400+', label: 'Lives touched', sub: 'through member giving', color: '#6366f1' },
                    ].map((s, i) => (
                        <div key={s.label} className={`reveal reveal-delay-${i + 1} accent-card-hover rounded-2xl p-8 border border-white/[0.06]`}
                            style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <p className="text-4xl font-black mb-2" style={{ color: s.color }}>
                                <CountUp end={s.value} />
                            </p>
                            <p className="text-white font-semibold">{s.label}</p>
                            <p className="text-white/30 text-sm mt-1">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Charity callout */}
                <div className="reveal mt-6 rounded-2xl p-8 border flex flex-col md:flex-row items-center gap-6"
                    style={{ background: 'rgba(232,160,32,0.06)', borderColor: 'rgba(232,160,32,0.2)' }}>
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(232,160,32,0.15)' }}>
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <p className="font-semibold text-white mb-1">You choose who benefits</p>
                        <p className="text-white/40 text-sm leading-relaxed">
                            Pick from our verified charity partners when you sign up. Change your chosen charity anytime from your dashboard.
                        </p>
                    </div>
                    <Link href="/charities" className="flex-shrink-0 text-sm font-semibold px-5 py-2.5 rounded-full border whitespace-nowrap"
                        style={{ color: 'var(--accent)', borderColor: 'rgba(232,160,32,0.3)' }}>
                        Browse charities →
                    </Link>
                </div>
            </div>
        </section>
    )
}

/* ─── How it works ───────────────────────────────────────────────────────── */
function HowItWorks() {
    const steps = [
        {
            num: '01',
            title: 'Subscribe & choose your cause',
            desc: 'Pick a plan. Select the charity closest to your heart. Your giving starts immediately.',
            icon: (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            ),
        },
        {
            num: '02',
            title: 'Log your Stableford scores',
            desc: 'After each round, enter your last 5 scores. Takes 30 seconds. Works perfectly on mobile.',
            icon: (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            num: '03',
            title: 'Win prizes every month',
            desc: 'Match 3, 4, or 5 numbers in the monthly draw. Jackpot rolls over when unclaimed — it keeps growing.',
            icon: (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ]

    return (
        <section className="px-6 py-24 border-t border-white/[0.05]">
            <div className="max-w-5xl mx-auto">
                <p className="reveal text-xs font-semibold uppercase tracking-[0.2em] text-center mb-4 text-white/30">
                    How it works
                </p>
                <h2 className="reveal reveal-delay-1 text-4xl md:text-5xl font-black tracking-tighter text-center mb-16 leading-tight">
                    Three steps.<br />One big difference.
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {steps.map((step, i) => (
                        <div key={step.num}
                            className={`reveal reveal-delay-${i + 1} card-hover rounded-2xl p-8 border border-white/[0.06] relative overflow-hidden`}
                            style={{ background: 'rgba(255,255,255,0.025)' }}>
                            {/* Step number watermark */}
                            <span className="absolute -top-2 -right-1 text-8xl font-black text-white/[0.03] select-none leading-none">
                                {step.num}
                            </span>
                            {/* Icon */}
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-6 relative z-10"
                                style={{ background: 'rgba(232,160,32,0.1)', color: 'var(--accent)' }}>
                                {step.icon}
                            </div>
                            <p className="text-xs font-mono text-white/20 mb-3 relative z-10">{step.num}</p>
                            <h3 className="text-lg font-bold mb-3 leading-snug relative z-10">{step.title}</h3>
                            <p className="text-white/40 text-sm leading-relaxed relative z-10">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

/* ─── Prize tiers ────────────────────────────────────────────────────────── */
function PrizeTiers() {
    const tiers = [
        { match: '3 numbers', share: '25%', label: 'Prize', note: 'Split among all 3-number winners' },
        { match: '5 numbers', share: '40%', label: 'Jackpot', note: 'Rolls over if unclaimed', featured: true },
        { match: '4 numbers', share: '35%', label: 'Major prize', note: 'Split among all 4-number winners' },
    ]

    return (
        <section className="px-6 py-24 border-t border-white/[0.05]">
            <div className="max-w-4xl mx-auto">
                <p className="reveal text-xs font-semibold uppercase tracking-[0.2em] text-center mb-4 text-white/30">
                    Prize pool
                </p>
                <h2 className="reveal reveal-delay-1 text-4xl md:text-5xl font-black tracking-tighter text-center mb-4 leading-tight">
                    Every match wins.
                </h2>
                <p className="reveal reveal-delay-2 text-white/40 text-center mb-14 text-lg">
                    Match as few as 3 numbers and you're in the money.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {tiers.map((tier, i) => (
                        <div key={tier.match}
                            className={`reveal reveal-delay-${i + 1} rounded-2xl p-8 text-center border transition-all ${tier.featured
                                ? 'md:-mt-4 md:-mb-4 md:py-12'
                                : ''}`}
                            style={tier.featured ? {
                                background: 'var(--accent)',
                                borderColor: 'var(--accent)',
                                boxShadow: '0 20px 60px rgba(232,160,32,0.3)',
                            } : {
                                background: 'rgba(255,255,255,0.025)',
                                borderColor: 'rgba(255,255,255,0.06)',
                            }}>
                            {tier.featured && (
                                <span className="inline-block text-xs font-bold uppercase tracking-widest text-black/60 mb-4 bg-black/10 px-3 py-1 rounded-full">
                                    Top prize
                                </span>
                            )}
                            <p className={`text-5xl font-black mb-2 ${tier.featured ? 'text-black' : 'text-white'}`}>
                                {tier.share}
                            </p>
                            <p className={`font-semibold text-lg mb-1 ${tier.featured ? 'text-black' : 'text-white'}`}>
                                {tier.label}
                            </p>
                            <p className={`text-sm mb-3 ${tier.featured ? 'text-black/50' : 'text-white/30'}`}>
                                Match {tier.match}
                            </p>
                            <p className={`text-xs ${tier.featured ? 'text-black/40' : 'text-white/20'}`}>
                                {tier.note}
                            </p>
                        </div>
                    ))}
                </div>

                <p className="reveal text-center text-white/20 text-sm mt-8">
                    Prize pool is funded by 50% of all subscription revenue. The rest goes to charity + platform costs.
                </p>
            </div>
        </section>
    )
}

/* ─── Testimonials ───────────────────────────────────────────────────────── */
function Testimonials() {
    const quotes = [
        { text: "Finally a subscription that doesn't feel like throwing money away. I won £240 last month and my charity got a donation. Can't argue with that.", author: 'James H.', role: 'Member since 2024' },
        { text: "I play golf every weekend anyway. Now every round actually means something. The charity element made it an easy sell to my golf club friends.", author: 'Sarah M.', role: 'Club captain, Woking GC' },
        { text: "The jackpot rolled over three times before someone won it. It was over £8,000. I keep playing hoping next month is my turn.", author: 'David T.', role: 'Member, Yorkshire' },
    ]

    return (
        <section className="px-6 py-24 border-t border-white/[0.05]">
            <div className="max-w-5xl mx-auto">
                <p className="reveal text-xs font-semibold uppercase tracking-[0.2em] text-center mb-4 text-white/30">
                    Members say
                </p>
                <h2 className="reveal reveal-delay-1 text-4xl font-black tracking-tighter text-center mb-14">
                    Real people. Real wins.
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quotes.map((q, i) => (
                        <div key={q.author}
                            className={`reveal reveal-delay-${i + 1} card-hover rounded-2xl p-7 border border-white/[0.06]`}
                            style={{ background: 'rgba(255,255,255,0.025)' }}>
                            {/* Stars */}
                            <div className="flex gap-0.5 mb-4">
                                {Array(5).fill(null).map((_, j) => (
                                    <svg key={j} width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-white/60 text-sm leading-relaxed mb-5">"{q.text}"</p>
                            <div>
                                <p className="text-white font-semibold text-sm">{q.author}</p>
                                <p className="text-white/30 text-xs mt-0.5">{q.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

/* ─── Final CTA ──────────────────────────────────────────────────────────── */
function FinalCTA() {
    return (
        <section className="px-6 py-24 border-t border-white/[0.05]">
            <div className="max-w-3xl mx-auto text-center">
                <div className="reveal rounded-3xl p-12 md:p-16 border relative overflow-hidden"
                    style={{ background: 'rgba(232,160,32,0.07)', borderColor: 'rgba(232,160,32,0.2)' }}>
                    {/* Glow */}
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(232,160,32,0.15) 0%, transparent 60%)' }} />

                    <p className="relative text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--accent)' }}>
                        Join 2,400+ members
                    </p>
                    <h2 className="relative text-4xl md:text-5xl font-black tracking-tighter mb-5 leading-tight">
                        Start your round.<br />Start making a difference.
                    </h2>
                    <p className="relative text-white/40 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                        From £9.99/month. Cancel anytime. Charity giving starts on day one.
                    </p>

                    <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link href="/signup"
                            className="btn-cta px-10 py-4 rounded-full text-base font-bold inline-flex items-center gap-2">
                            Subscribe now — it's £9.99/mo
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                        <Link href="/login" className="btn-ghost text-white/40 px-6 py-4 rounded-full text-sm font-medium">
                            Already a member? Sign in
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="relative flex items-center justify-center gap-6 mt-8 text-white/20 text-xs">
                        <span className="flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Cancel anytime
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Stripe secured
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            10% to charity, guaranteed
                        </span>
                    </div>
                </div>
            </div>
        </section>
    )
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */
function Footer() {
    return (
        <footer className="px-6 py-10 border-t border-white/[0.05]">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                        <span className="text-black text-xs font-black">G</span>
                    </div>
                    <span className="text-white/40 text-sm">GolfGives</span>
                </div>
                <div className="flex items-center gap-6 text-white/20 text-xs">
                    <Link href="/login" className="hover:text-white/50 transition">Sign in</Link>
                    <Link href="/charities" className="hover:text-white/50 transition">Charities</Link>
                    <Link href="/signup" className="hover:text-white/50 transition">Subscribe</Link>
                    <span>© 2026 GolfGives</span>
                </div>
            </div>
        </footer>
    )
}

/* ─── Main export ────────────────────────────────────────────────────────── */
export default function HomePage() {
    useReveal()

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
            <Nav />
            <Hero />
            <ImpactTicker />
            <ImpactSection />
            <HowItWorks />
            <PrizeTiers />
            <Testimonials />
            <FinalCTA />
            <Footer />
        </main>
    )
}
