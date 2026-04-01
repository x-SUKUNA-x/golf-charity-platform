'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useToast, ToastContainer, DashboardSkeleton } from '@/components/Toast'
import { NavLogo, Spinner } from '@/components/UI'

function DashboardContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [scores, setScores] = useState([])
    const [wins, setWins] = useState([])
    const [draws, setDraws] = useState([])
    const [newScore, setNewScore] = useState('')
    const [newDate, setNewDate] = useState('')
    const [editingScore, setEditingScore] = useState(null)
    const [loading, setLoading] = useState(true)
    const [charity, setCharity] = useState(null)
    const [uploadingFor, setUploadingFor] = useState(null)
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0 })
    const fileInputRef = useRef(null)
    const paymentSuccess = searchParams.get('payment') === 'success'
    const { toasts, dismiss, toast } = useToast()

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) { router.push('/login'); return }
            setUser(session.user)
            fetchProfile(session.user.id)
            fetchScores(session.user.id)
            fetchWins(session.user.id)
            fetchDraws()
        }
        getUser()
    }, [])

    useEffect(() => {
        if (!paymentSuccess || !user) return
        let attempts = 0
        const maxAttempts = 5
        const tryActivate = async () => {
            attempts++
            try {
                const { data: freshProfile } = await supabase.from('users').select('subscription_status, plan').eq('id', user.id).single()
                if (freshProfile?.subscription_status === 'active') {
                    fetchProfile(user.id)
                    toast.success('Subscription activated! Welcome to GolfGives 🎉')
                    return
                }
                const res = await fetch('/api/activate-subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, plan: freshProfile?.plan || 'monthly' })
                })
                if (res.ok) {
                    fetchProfile(user.id)
                    toast.success('Subscription activated! Welcome to GolfGives 🎉')
                } else if (attempts < maxAttempts) {
                    setTimeout(tryActivate, 2000)
                }
            } catch (err) {
                console.error('Activation attempt failed:', err)
                if (attempts < maxAttempts) setTimeout(tryActivate, 2000)
            }
        }
        const timer = setTimeout(tryActivate, 1500)
        return () => clearTimeout(timer)
    }, [paymentSuccess, user])

    useEffect(() => {
        const tick = () => {
            const now = new Date()
            const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
            const diff = next - now
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            setCountdown({ days, hours, mins })
        }
        tick()
        const id = setInterval(tick, 60000)
        return () => clearInterval(id)
    }, [])

    const fetchProfile = async (userId) => {
        const { data } = await supabase.from('users').select('*').eq('id', userId).single()
        setProfile(data)
        if (data?.charity_id) {
            const { data: charityData } = await supabase.from('charities').select('*').eq('id', data.charity_id).single()
            setCharity(charityData)
        }
    }
    const fetchScores = async (userId) => {
        const { data } = await supabase.from('scores').select('*').eq('user_id', userId).order('played_at', { ascending: false }).limit(5)
        setScores(data || [])
        setLoading(false)
    }
    const fetchWins = async (userId) => {
        const { data } = await supabase.from('winners').select('*, draws(month, winning_numbers)').eq('user_id', userId).order('created_at', { ascending: false })
        setWins(data || [])
    }
    const fetchDraws = async () => {
        const { data } = await supabase.from('draws').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(6)
        setDraws(data || [])
    }

    const addScore = async () => {
        if (!newScore || !newDate) { toast.warning('Please enter both score and date'); return }
        if (newScore < 1 || newScore > 45) { toast.warning('Score must be between 1 and 45'); return }
        if (scores.length >= 5) {
            const oldest = scores[scores.length - 1]
            await supabase.from('scores').delete().eq('id', oldest.id)
        }
        const { error } = await supabase.from('scores').insert({ user_id: user.id, score: parseInt(newScore), played_at: newDate })
        if (error) { toast.error('Error adding score — please try again'); return }
        toast.success('Score added successfully!')
        setNewScore('')
        setNewDate('')
        fetchScores(user.id)
    }
    const deleteScore = async (scoreId) => {
        await supabase.from('scores').delete().eq('id', scoreId)
        fetchScores(user.id)
    }
    const saveEdit = async () => {
        if (!editingScore) return
        await supabase.from('scores').update({ score: parseInt(editingScore.score), played_at: editingScore.played_at }).eq('id', editingScore.id)
        setEditingScore(null)
        fetchScores(user.id)
    }
    const uploadProof = async (winnerId, file) => {
        if (!file) return
        setUploadingFor(winnerId)
        const ext = file.name.split('.').pop()
        const path = `${winnerId}/proof.${ext}`
        const { error: uploadError } = await supabase.storage.from('winner-proofs').upload(path, file, { upsert: true })
        if (uploadError) { toast.error('Upload failed — please try again'); setUploadingFor(null); return }
        const { data: { publicUrl } } = supabase.storage.from('winner-proofs').getPublicUrl(path)
        await supabase.from('winners').update({ proof_url: publicUrl, payment_status: 'proof_uploaded' }).eq('id', winnerId)
        toast.success('Proof submitted! Admin will review shortly.')
        setUploadingFor(null)
        fetchWins(user.id)
    }
    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const totalWon = wins.filter(w => w.payment_status === 'paid').reduce((sum, w) => sum + (w.amount || 0), 0)
    const bestMatch = wins.length > 0
        ? wins.sort((a, b) => { const o = { '5-match': 3, '4-match': 2, '3-match': 1 }; return (o[b.tier] || 0) - (o[a.tier] || 0) })[0]?.tier || '—'
        : '—'
    const actionableWins = wins.filter(w => w.payment_status === 'pending' || w.payment_status === 'proof_uploaded')

    if (loading) return <DashboardSkeleton />

    /* ─── shared card style ─── */
    const card = { background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }
    const innerCard = { background: 'var(--bg)', borderColor: 'rgba(0,0,0,0.05)' }

    const inputCls = 'rounded-xl px-4 py-3 text-sm focus:outline-none border transition-all'
    const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }
    const inputFocus = (e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'rgba(232,160,32,0.04)' }
    const inputBlur = (e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg)' }

    return (
        <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
            <ToastContainer toasts={toasts} onDismiss={dismiss} />

            {/* NAV */}
            <nav className="flex justify-between items-center px-8 py-5 border-b"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <NavLogo />
                <div className="flex items-center gap-5">
                    <Link href="/admin" className="text-sm transition" style={{ color: 'var(--text-3)' }}>Admin</Link>
                    <span className="text-sm" style={{ color: 'var(--text-3)' }}>{user?.email}</span>
                    <button onClick={handleLogout} className="text-sm transition" style={{ color: 'var(--text-3)' }}>Sign out</button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-10">

                {/* PAYMENT SUCCESS */}
                {paymentSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
                        <span className="text-green-600 text-xl">🎉</span>
                        <div>
                            <p className="text-green-700 font-semibold text-sm">Payment successful! Welcome to GolfGives.</p>
                            <p className="text-green-600/70 text-xs mt-0.5">Your subscription is now active. Start entering your scores!</p>
                        </div>
                    </div>
                )}

                {/* WIN BANNER */}
                {actionableWins.length > 0 && (
                    <div className="rounded-2xl p-6 mb-6 border"
                        style={{ background: 'rgba(232,160,32,0.07)', borderColor: 'rgba(232,160,32,0.25)' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">🏆</span>
                            <div>
                                <p className="font-bold" style={{ color: 'var(--accent-dark)' }}>You won a prize draw!</p>
                                <p className="text-sm" style={{ color: 'var(--text-2)' }}>Upload proof of your scores to claim your prize.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {actionableWins.map((w) => (
                                <div key={w.id} className="rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border"
                                    style={{ background: 'var(--surface)', borderColor: 'rgba(232,160,32,0.15)' }}>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            w.tier === '5-match' ? 'bg-yellow-100 text-yellow-700' :
                                            w.tier === '4-match' ? 'bg-blue-100 text-blue-700' :
                                            'bg-purple-100 text-purple-700'}`}>
                                            {w.tier}
                                        </span>
                                        <span className="font-semibold" style={{ color: 'var(--text)' }}>£{w.amount}</span>
                                        <span className="text-sm" style={{ color: 'var(--text-3)' }}>{w.draws?.month}</span>
                                    </div>
                                    {w.payment_status === 'pending' && (
                                        <>
                                            <input type="file" ref={fileInputRef} accept="image/*,.pdf" className="hidden"
                                                onChange={(e) => uploadProof(w.id, e.target.files[0])} />
                                            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFor === w.id}
                                                className="btn-cta px-5 py-2 rounded-xl text-sm disabled:opacity-50">
                                                {uploadingFor === w.id ? 'Uploading...' : '📎 Upload Score Proof'}
                                            </button>
                                        </>
                                    )}
                                    {w.payment_status === 'proof_uploaded' && (
                                        <span className="text-sm rounded-xl px-4 py-2 border"
                                            style={{ color: 'var(--text-2)', background: 'var(--bg)', borderColor: 'var(--border)' }}>
                                            ⏳ Proof submitted — awaiting review
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* WELCOME */}
                <div className="mb-10">
                    <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                        Good to see you 👋
                    </h2>
                    <p className="mt-1" style={{ color: 'var(--text-2)' }}>Here's your GolfGives overview</p>
                </div>

                {/* TOP CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-up stagger">
                    {/* Subscription */}
                    <div className={`card-hover rounded-2xl p-6 border ${
                        profile?.subscription_status === 'active' ? 'bg-green-50 border-green-200' :
                        profile?.subscription_status === 'lapsed' ? 'bg-red-50 border-red-200' : ''}`}
                        style={profile?.subscription_status === 'active' || profile?.subscription_status === 'lapsed' ? {} : card}>
                        <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>Subscription</p>
                        {profile?.subscription_status === 'active' ? (
                            <>
                                <p className="text-green-700 font-semibold">Active ✓</p>
                                <p className="text-green-600/70 text-sm mt-1 capitalize">{profile?.plan} plan</p>
                                {profile?.subscription_end_date && (
                                    <p className="text-green-600/50 text-xs mt-2">
                                        Renews {new Date(profile.subscription_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                )}
                            </>
                        ) : profile?.subscription_status === 'lapsed' ? (
                            <>
                                <p className="text-red-600 font-semibold">Payment failed</p>
                                <Link href="/subscribe" className="text-sm mt-2 inline-block font-medium" style={{ color: 'var(--accent-dark)' }}>Resubscribe →</Link>
                            </>
                        ) : (
                            <>
                                <p className="font-semibold" style={{ color: 'var(--text)' }}>Not subscribed</p>
                                <Link href="/subscribe" className="text-sm mt-2 inline-block font-medium" style={{ color: 'var(--accent-dark)' }}>Subscribe now →</Link>
                            </>
                        )}
                    </div>

                    {/* Charity */}
                    <div className="card-hover rounded-2xl p-6 border" style={card}>
                        <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>Charity</p>
                        {charity ? (
                            <>
                                <p className="font-semibold" style={{ color: 'var(--text)' }}>{charity.name}</p>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{profile?.charity_percent}% contribution</p>
                            </>
                        ) : (
                            <>
                                <p className="font-semibold" style={{ color: 'var(--text)' }}>Not selected</p>
                                <Link href="/charities" className="text-sm mt-2 inline-block font-medium" style={{ color: 'var(--accent-dark)' }}>Choose charity →</Link>
                            </>
                        )}
                    </div>

                    {/* Next Draw */}
                    <div className="card-hover rounded-2xl p-6 border" style={card}>
                        <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>Next Draw</p>
                        <p className="font-semibold" style={{ color: 'var(--text)' }}>
                            {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                                .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </p>
                        <div className="flex gap-2 mt-3">
                            {[{ v: countdown.days, l: 'd' }, { v: countdown.hours, l: 'h' }, { v: countdown.mins, l: 'm' }].map(({ v, l }) => (
                                <div key={l} className="rounded-lg px-2.5 py-1.5 text-center min-w-[40px] border" style={innerCard}>
                                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{String(v).padStart(2, '0')}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{l}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>{scores.length}/5 scores entered</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up">
                    {/* SCORE ENTRY */}
                    <div className="card-hover rounded-2xl p-8 border" style={card}>
                        <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Enter Score</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Stableford format · 1 to 45 points</p>

                        {profile?.subscription_status !== 'active' ? (
                            <div className="flex flex-col items-center justify-center h-32 text-center gap-3">
                                <p className="text-sm" style={{ color: 'var(--text-3)' }}>Subscribe to enter scores</p>
                                <Link href="/subscribe"
                                    className="btn-cta px-5 py-2 rounded-xl text-sm">
                                    Subscribe now →
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <input type="number" min="1" max="45" placeholder="Score (e.g. 32)"
                                    value={newScore} onChange={(e) => setNewScore(e.target.value)}
                                    className={inputCls} style={inputStyle}
                                    onFocus={inputFocus} onBlur={inputBlur} />
                                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                                    className={inputCls} style={inputStyle}
                                    onFocus={inputFocus} onBlur={inputBlur} />
                                <button onClick={addScore}
                                    className="btn-cta py-3 rounded-xl text-sm">
                                    Add Score →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* SCORES LIST */}
                    <div className="rounded-2xl p-8 border" style={card}>
                        <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>My Scores</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Last 5 rounds · click to edit</p>
                        {scores.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-center">
                                <p className="text-sm" style={{ color: 'var(--text-3)' }}>No scores yet</p>
                                <p className="text-xs mt-1" style={{ color: 'rgba(0,0,0,0.2)' }}>Add your first score to get started</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {scores.map((s, i) => (
                                    <div key={s.id}>
                                        {editingScore?.id === s.id ? (
                                            <div className="p-3 rounded-xl border flex flex-col gap-2"
                                                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                                                <div className="flex gap-2">
                                                    <input type="number" min="1" max="45"
                                                        value={editingScore.score}
                                                        onChange={e => setEditingScore({ ...editingScore, score: e.target.value })}
                                                        className={inputCls + ' w-20'} style={inputStyle}
                                                        onFocus={inputFocus} onBlur={inputBlur} />
                                                    <input type="date" value={editingScore.played_at}
                                                        onChange={e => setEditingScore({ ...editingScore, played_at: e.target.value })}
                                                        className={inputCls + ' flex-1'} style={inputStyle}
                                                        onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={saveEdit} className="btn-cta px-3 py-1.5 rounded-lg text-xs">Save</button>
                                                    <button onClick={() => setEditingScore(null)} className="text-xs transition" style={{ color: 'var(--text-3)' }}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center p-4 rounded-xl border group transition-all"
                                                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-mono w-4" style={{ color: 'rgba(0,0,0,0.2)' }}>{i + 1}</span>
                                                    <span className="font-semibold" style={{ color: 'var(--text)' }}>{s.score} pts</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>{s.played_at}</span>
                                                    <button onClick={() => setEditingScore({ id: s.id, score: s.score, played_at: s.played_at })}
                                                        className="text-xs opacity-0 group-hover:opacity-100 transition" style={{ color: 'var(--text-2)' }}>Edit</button>
                                                    <button onClick={() => deleteScore(s.id)}
                                                        className="text-xs opacity-0 group-hover:opacity-100 transition text-red-500">✕</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* WINNINGS */}
                    <div className="rounded-2xl p-8 border md:col-span-2" style={card}>
                        <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>My Winnings</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Your prize draw history</p>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {[
                                { label: 'Total Wins', value: wins.length || '0' },
                                { label: 'Total Paid Out', value: totalWon > 0 ? `£${totalWon.toFixed(2)}` : '£0' },
                                { label: 'Best Match', value: bestMatch },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center p-6 rounded-xl border" style={innerCard}>
                                    <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{stat.value}</p>
                                    <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>{stat.label}</p>
                                </div>
                            ))}
                        </div>
                        {wins.length > 0 && (
                            <div className="flex flex-col gap-2">
                                {wins.map((w) => (
                                    <div key={w.id} className="flex justify-between items-center p-4 rounded-xl border" style={innerCard}>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                w.tier === '5-match' ? 'bg-yellow-100 text-yellow-700' :
                                                w.tier === '4-match' ? 'bg-blue-100 text-blue-700' :
                                                'bg-purple-100 text-purple-700'}`}>{w.tier}</span>
                                            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>£{w.amount}</span>
                                            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{w.draws?.month}</span>
                                        </div>
                                        <span className={`text-xs px-3 py-1 rounded-full ${
                                            w.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                            w.payment_status === 'rejected' ? 'bg-red-100 text-red-600' :
                                            w.payment_status === 'proof_uploaded' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'}`}>
                                            {w.payment_status === 'proof_uploaded' ? 'Under review' : w.payment_status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* DRAW PARTICIPATION */}
                    {draws.length > 0 && (
                        <div className="rounded-2xl p-8 border md:col-span-2" style={card}>
                            <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Draw Participation</h3>
                            <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Recent published draws — winning numbers</p>
                            <div className="flex flex-col gap-3">
                                {draws.map(d => (
                                    <div key={d.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border gap-3"
                                        style={innerCard}>
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{d.month}</p>
                                            {d.prize_pool && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Prize pool: £{d.prize_pool}</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            {(d.winning_numbers || []).map(n => (
                                                <span key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    scores.some(s => s.score === n)
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-black/[0.07] text-black/50'}`}>{n}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>Green numbers = matched one of your scores</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}

export default function Dashboard() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    )
}
