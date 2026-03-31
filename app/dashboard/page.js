'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useToast, ToastContainer, DashboardSkeleton } from '@/components/Toast'

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
    const [editingScore, setEditingScore] = useState(null) // { id, score, played_at }
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [charity, setCharity] = useState(null)
    const [proofMsg, setProofMsg] = useState('')
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

    // Live countdown to first of next month
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
        const { data } = await supabase
            .from('winners')
            .select('*, draws(month, winning_numbers)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
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
        const { error } = await supabase.from('scores').insert({
            user_id: user.id,
            score: parseInt(newScore),
            played_at: newDate,
        })
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
        await supabase.from('scores').update({
            score: parseInt(editingScore.score),
            played_at: editingScore.played_at
        }).eq('id', editingScore.id)
        setEditingScore(null)
        fetchScores(user.id)
    }

    const uploadProof = async (winnerId, file) => {
        if (!file) return
        setUploadingFor(winnerId)
        setProofMsg('')
        const ext = file.name.split('.').pop()
        const path = `${winnerId}/proof.${ext}`

        const { error: uploadError } = await supabase.storage
            .from('winner-proofs')
            .upload(path, file, { upsert: true })

        if (uploadError) {
            toast.error('Upload failed — please try again')
            setUploadingFor(null)
            return
        }

        const { data: { publicUrl } } = supabase.storage.from('winner-proofs').getPublicUrl(path)

        await supabase.from('winners').update({
            proof_url: publicUrl,
            payment_status: 'proof_uploaded'
        }).eq('id', winnerId)

        toast.success('Proof submitted! Admin will review shortly.')
        setUploadingFor(null)
        fetchWins(user.id)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    // Derived stats for draw history section
    const totalWon = wins.filter(w => w.payment_status === 'paid').reduce((sum, w) => sum + (w.amount || 0), 0)
    const bestMatch = wins.length > 0
        ? wins.sort((a, b) => {
            const order = { '5-match': 3, '4-match': 2, '3-match': 1 }
            return (order[b.tier] || 0) - (order[a.tier] || 0)
        })[0]?.tier || '—'
        : '—'

    // Wins needing action (pending proof or awaiting review)
    const actionableWins = wins.filter(w => w.payment_status === 'pending' || w.payment_status === 'proof_uploaded')

    if (loading) return <DashboardSkeleton />

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
            {/* NAVBAR */}
            <nav className="flex justify-between items-center px-8 py-5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-black text-xs font-black">G</span>
                    </div>
                    <h1 className="text-base font-semibold">GolfGives</h1>
                </div>
                <div className="flex items-center gap-6">
                    <Link href="/admin" className="text-white/30 hover:text-white text-sm transition">Admin</Link>
                    <span className="text-white/30 text-sm">{user?.email}</span>
                    <button onClick={handleLogout} className="text-white/30 hover:text-white text-sm transition">Sign out</button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-10">

                {/* PAYMENT SUCCESS BANNER */}
                {paymentSuccess && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
                        <span className="text-green-400 text-xl">🎉</span>
                        <div>
                            <p className="text-green-400 font-semibold text-sm">Payment successful! Welcome to GolfGives.</p>
                            <p className="text-white/40 text-xs mt-0.5">Your subscription is now active. Start entering your scores!</p>
                        </div>
                    </div>
                )}

                {/* 🏆 YOU WON BANNER */}
                {actionableWins.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">🏆</span>
                            <div>
                                <p className="text-yellow-400 font-bold">You won a prize draw!</p>
                                <p className="text-white/40 text-sm">Upload proof of your scores to claim your prize.</p>
                            </div>
                        </div>

                        {proofMsg && (
                            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4">
                                <p className="text-white/60 text-sm">{proofMsg}</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            {actionableWins.map((w) => (
                                <div key={w.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            w.tier === '5-match' ? 'bg-yellow-500/20 text-yellow-400' :
                                            w.tier === '4-match' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-purple-500/20 text-purple-400'}`}>
                                            {w.tier}
                                        </span>
                                        <span className="text-white font-semibold">£{w.amount}</span>
                                        <span className="text-white/30 text-sm">{w.draws?.month}</span>
                                    </div>

                                    {w.payment_status === 'pending' && (
                                        <>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="image/*,.pdf"
                                                className="hidden"
                                                onChange={(e) => uploadProof(w.id, e.target.files[0])}
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploadingFor === w.id}
                                                className="bg-yellow-400 text-black font-semibold px-5 py-2 rounded-xl text-sm hover:bg-yellow-300 transition disabled:opacity-50"
                                            >
                                                {uploadingFor === w.id ? 'Uploading...' : '📎 Upload Score Proof'}
                                            </button>
                                        </>
                                    )}

                                    {w.payment_status === 'proof_uploaded' && (
                                        <span className="text-white/40 text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                                            ⏳ Proof submitted — awaiting admin review
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* WELCOME */}
                <div className="mb-10">
                    <h2 className="text-3xl font-bold tracking-tight">Good to see you 👋</h2>
                    <p className="text-white/40 mt-1">Here's your GolfGives overview</p>
                </div>

                {/* TOP CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-up stagger">
                    {/* Subscription */}
                    <div className={`card-hover rounded-2xl p-6 border ${
                        profile?.subscription_status === 'active' ? 'bg-green-500/5 border-green-500/20' :
                        profile?.subscription_status === 'lapsed' ? 'bg-red-500/5 border-red-500/20' :
                        'bg-white/[0.03] border-white/[0.06]'}`}>
                        <p className="text-white/40 text-sm mb-3">Subscription</p>
                        {profile?.subscription_status === 'active' ? (
                            <>
                                <p className="text-green-400 font-semibold">Active ✓</p>
                                <p className="text-white/30 text-sm mt-1 capitalize">{profile?.plan} plan</p>
                                {profile?.subscription_end_date && (
                                    <p className="text-white/20 text-xs mt-2">
                                        Renews {new Date(profile.subscription_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                )}
                            </>
                        ) : profile?.subscription_status === 'lapsed' ? (
                            <>
                                <p className="text-red-400 font-semibold">Payment failed</p>
                                <Link href="/subscribe" className="text-white text-sm mt-2 inline-block underline underline-offset-4">Resubscribe →</Link>
                            </>
                        ) : (
                            <>
                                <p className="text-white/60 font-semibold">Not subscribed</p>
                                <Link href="/subscribe" className="text-white text-sm mt-2 inline-block underline underline-offset-4">Subscribe now →</Link>
                            </>
                        )}
                    </div>

                    {/* Charity */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                        <p className="text-white/40 text-sm mb-3">Charity</p>
                        {charity ? (
                            <>
                                <p className="text-white font-semibold">{charity.name}</p>
                                <p className="text-white/30 text-sm mt-1">{profile?.charity_percent}% contribution</p>
                            </>
                        ) : (
                            <>
                                <p className="text-white/60 font-semibold">Not selected</p>
                                <Link href="/charities" className="text-white text-sm mt-2 inline-block underline underline-offset-4">Choose charity →</Link>
                            </>
                        )}
                    </div>

                    {/* Next Draw — live countdown */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                        <p className="text-white/40 text-sm mb-3">Next Draw</p>
                        <p className="text-white font-semibold">
                            {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                                .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </p>
                        <div className="flex gap-3 mt-3">
                            {[{ v: countdown.days, l: 'd' }, { v: countdown.hours, l: 'h' }, { v: countdown.mins, l: 'm' }].map(({ v, l }) => (
                                <div key={l} className="bg-white/5 rounded-lg px-2.5 py-1.5 text-center min-w-[40px]">
                                    <p className="text-white font-bold text-sm">{String(v).padStart(2, '0')}</p>
                                    <p className="text-white/20 text-xs">{l}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-white/20 text-xs mt-3">{scores.length}/5 scores entered</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up">
                    {/* SCORE ENTRY */}
                    <div className="card-hover bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
                        <h3 className="font-semibold mb-1">Enter Score</h3>
                        <p className="text-white/30 text-sm mb-6">Stableford format · 1 to 45 points</p>

                        {profile?.subscription_status !== 'active' ? (
                            <div className="flex flex-col items-center justify-center h-32 text-center gap-3">
                                <p className="text-white/30 text-sm">Subscribe to enter scores</p>
                                <Link href="/subscribe" className="bg-white text-black font-semibold px-5 py-2 rounded-xl text-sm hover:bg-white/90 transition">
                                    Subscribe now →
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="number"
                                        min="1"
                                        max="45"
                                        placeholder="Score (e.g. 32)"
                                        value={newScore}
                                        onChange={(e) => setNewScore(e.target.value)}
                                        className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 placeholder:text-white/20"
                                    />
                                    <input
                                        type="date"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30"
                                    />
                                    <button
                                        onClick={addScore}
                                        className="bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition text-sm"
                                    >
                                        Add Score →
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* SCORES LIST */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
                        <h3 className="font-semibold mb-1">My Scores</h3>
                        <p className="text-white/30 text-sm mb-6">Last 5 rounds · click to edit</p>
                        {scores.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-center">
                                <p className="text-white/20 text-sm">No scores yet</p>
                                <p className="text-white/10 text-xs mt-1">Add your first score to get started</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {scores.map((s, i) => (
                                    <div key={s.id}>
                                        {editingScore?.id === s.id ? (
                                            <div className="p-3 bg-white/[0.04] rounded-xl border border-white/10 flex flex-col gap-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number" min="1" max="45"
                                                        value={editingScore.score}
                                                        onChange={e => setEditingScore({ ...editingScore, score: e.target.value })}
                                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm w-20 focus:outline-none"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={editingScore.played_at}
                                                        onChange={e => setEditingScore({ ...editingScore, played_at: e.target.value })}
                                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm flex-1 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={saveEdit} className="bg-white text-black font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-white/90 transition">Save</button>
                                                    <button onClick={() => setEditingScore(null)} className="text-white/30 hover:text-white text-xs transition">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center p-4 bg-white/[0.02] rounded-xl border border-white/[0.04] group">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-white/20 text-xs font-mono w-4">{i + 1}</span>
                                                    <span className="text-white font-semibold">{s.score} pts</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-white/30 text-xs">{s.played_at}</span>
                                                    <button
                                                        onClick={() => setEditingScore({ id: s.id, score: s.score, played_at: s.played_at })}
                                                        className="text-white/20 hover:text-white text-xs opacity-0 group-hover:opacity-100 transition"
                                                    >Edit</button>
                                                    <button
                                                        onClick={() => deleteScore(s.id)}
                                                        className="text-red-400/40 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition"
                                                    >✕</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* DRAW HISTORY — real data */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 md:col-span-2">
                        <h3 className="font-semibold mb-1">My Winnings</h3>
                        <p className="text-white/30 text-sm mb-6">Your prize draw history</p>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {[
                                { label: 'Total Wins', value: wins.length || '0' },
                                { label: 'Total Paid Out', value: totalWon > 0 ? `£${totalWon.toFixed(2)}` : '£0' },
                                { label: 'Best Match', value: bestMatch },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center p-6 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                    <p className="text-3xl font-bold">{stat.value}</p>
                                    <p className="text-white/30 text-sm mt-2">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {wins.length > 0 && (
                            <div className="flex flex-col gap-2">
                                {wins.map((w) => (
                                    <div key={w.id} className="flex justify-between items-center p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                w.tier === '5-match' ? 'bg-yellow-500/20 text-yellow-400' :
                                                w.tier === '4-match' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-purple-500/20 text-purple-400'}`}>
                                                {w.tier}
                                            </span>
                                            <span className="text-white text-sm font-semibold">£{w.amount}</span>
                                            <span className="text-white/30 text-xs">{w.draws?.month}</span>
                                        </div>
                                        <span className={`text-xs px-3 py-1 rounded-full ${
                                            w.payment_status === 'paid' ? 'bg-green-500/10 text-green-400' :
                                            w.payment_status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                            w.payment_status === 'proof_uploaded' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-yellow-500/10 text-yellow-400'}`}>
                                            {w.payment_status === 'proof_uploaded' ? 'Under review' : w.payment_status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* DRAW PARTICIPATION */}
                    {draws.length > 0 && (
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 md:col-span-2">
                            <h3 className="font-semibold mb-1">Draw Participation</h3>
                            <p className="text-white/30 text-sm mb-6">Recent published draws — winning numbers</p>
                            <div className="flex flex-col gap-3">
                                {draws.map(d => (
                                    <div key={d.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04] gap-3">
                                        <div>
                                            <p className="text-white text-sm font-semibold">{d.month}</p>
                                            {d.prize_pool && <p className="text-white/30 text-xs mt-0.5">Prize pool: £{d.prize_pool}</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            {(d.winning_numbers || []).map(n => (
                                                <span key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    scores.some(s => s.score === n)
                                                        ? 'bg-green-400 text-black'
                                                        : 'bg-white/10 text-white/60'
                                                }`}>{n}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-white/20 text-xs mt-3">Green numbers = matched one of your scores</p>
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
