'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [scores, setScores] = useState([])
    const [newScore, setNewScore] = useState('')
    const [newDate, setNewDate] = useState('')
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [charity, setCharity] = useState(null)

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) { router.push('/login'); return }
            setUser(session.user)
            fetchProfile(session.user.id)
            fetchScores(session.user.id)
        }
        getUser()
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

    const addScore = async () => {
        if (!newScore || !newDate) { setMessage('Please enter both score and date!'); return }
        if (newScore < 1 || newScore > 45) { setMessage('Score must be between 1 and 45!'); return }
        if (scores.length >= 5) {
            const oldest = scores[scores.length - 1]
            await supabase.from('scores').delete().eq('id', oldest.id)
        }
        const { error } = await supabase.from('scores').insert({
            user_id: user.id,
            score: parseInt(newScore),
            played_at: newDate,
        })
        if (error) { setMessage('Error adding score!'); return }
        setMessage('Score added!')
        setNewScore('')
        setNewDate('')
        fetchScores(user.id)
        setTimeout(() => setMessage(''), 3000)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        </main>
    )

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            {/* NAVBAR */}
            <nav className="flex justify-between items-center px-8 py-5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-black text-xs font-black">G</span>
                    </div>
                    <h1 className="text-base font-semibold">GolfGives</h1>
                </div>
                <div className="flex items-center gap-6">
                    <Link href="/admin" className="text-white/30 hover:text-white text-sm transition">
                        Admin
                    </Link>
                    <span className="text-white/30 text-sm">{user?.email}</span>
                    <button onClick={handleLogout} className="text-white/30 hover:text-white text-sm transition">
                        Sign out
                    </button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-10">
                {/* WELCOME */}
                <div className="mb-10">
                    <h2 className="text-3xl font-bold tracking-tight">Good to see you 👋</h2>
                    <p className="text-white/40 mt-1">Here's your GolfGives overview</p>
                </div>

                {/* TOP CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Subscription */}
                    <div className={`rounded-2xl p-6 border ${profile?.subscription_status === 'active'
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-white/[0.03] border-white/[0.06]'
                        }`}>
                        <p className="text-white/40 text-sm mb-3">Subscription</p>
                        {profile?.subscription_status === 'active' ? (
                            <>
                                <p className="text-green-400 font-semibold">Active ✓</p>
                                <p className="text-white/30 text-sm mt-1 capitalize">{profile?.plan} plan</p>
                            </>
                        ) : (
                            <>
                                <p className="text-white/60 font-semibold">Not subscribed</p>
                                <Link href="/subscribe" className="text-white text-sm mt-2 inline-block underline underline-offset-4">
                                    Subscribe now →
                                </Link>
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
                                <Link href="/charities" className="text-white text-sm mt-2 inline-block underline underline-offset-4">
                                    Choose charity →
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Next Draw */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                        <p className="text-white/40 text-sm mb-3">Next Draw</p>
                        <p className="text-white font-semibold">April 2026</p>
                        <p className="text-white/30 text-sm mt-1">
                            {scores.length}/5 scores entered
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SCORE ENTRY */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
                        <h3 className="font-semibold mb-1">Enter Score</h3>
                        <p className="text-white/30 text-sm mb-6">Stableford format · 1 to 45 points</p>

                        {message && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
                                <p className="text-white/60 text-sm">{message}</p>
                            </div>
                        )}

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
                    </div>

                    {/* SCORES LIST */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
                        <h3 className="font-semibold mb-1">My Scores</h3>
                        <p className="text-white/30 text-sm mb-6">Last 5 rounds · most recent first</p>

                        {scores.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-center">
                                <p className="text-white/20 text-sm">No scores yet</p>
                                <p className="text-white/10 text-xs mt-1">Add your first score to get started</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {scores.map((s, i) => (
                                    <div key={s.id} className="flex justify-between items-center p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                        <div className="flex items-center gap-4">
                                            <span className="text-white/20 text-xs font-mono w-4">{i + 1}</span>
                                            <span className="text-white font-semibold">{s.score} pts</span>
                                        </div>
                                        <span className="text-white/30 text-xs">{s.played_at}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* DRAW STATS */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 md:col-span-2">
                        <h3 className="font-semibold mb-1">Draw History</h3>
                        <p className="text-white/30 text-sm mb-6">Your participation and winnings</p>

                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Draws Entered', value: '0' },
                                { label: 'Total Won', value: '£0' },
                                { label: 'Best Match', value: '—' },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center p-6 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                    <p className="text-3xl font-bold">{stat.value}</p>
                                    <p className="text-white/30 text-sm mt-2">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}