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

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }
            setUser(session.user)
            fetchProfile(session.user.id)
            fetchScores(session.user.id)
        }
        getUser()
    }, [])

    const fetchProfile = async (userId) => {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(data)
    }

    const fetchScores = async (userId) => {
        const { data } = await supabase
            .from('scores')
            .select('*')
            .eq('user_id', userId)
            .order('played_at', { ascending: false })
            .limit(5)
        setScores(data || [])
        setLoading(false)
    }

    const addScore = async () => {
        if (!newScore || !newDate) {
            setMessage('Please enter both score and date!')
            return
        }
        if (newScore < 1 || newScore > 45) {
            setMessage('Score must be between 1 and 45!')
            return
        }

        if (scores.length >= 5) {
            const oldest = scores[scores.length - 1]
            await supabase.from('scores').delete().eq('id', oldest.id)
        }

        const { error } = await supabase.from('scores').insert({
            user_id: user.id,
            score: parseInt(newScore),
            played_at: newDate,
        })

        if (error) {
            setMessage('Error adding score!')
            return
        }

        setMessage('Score added! ✅')
        setNewScore('')
        setNewDate('')
        fetchScores(user.id)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
            <p className="text-green-400 text-xl animate-pulse">Loading...</p>
        </main>
    )

    return (
        <main className="min-h-screen bg-black text-white">
            {/* NAVBAR */}
            <nav className="flex justify-between items-center px-8 py-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-green-400">⛳ GolfGives</h1>
                <div className="flex items-center gap-4">
                    <p className="text-gray-400 text-sm hidden md:block">{user?.email}</p>
                    <button
                        onClick={handleLogout}
                        className="text-red-400 hover:text-red-300 text-sm"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* SUBSCRIPTION STATUS */}
                <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
                    <h2 className="text-2xl font-bold mb-6">💳 Subscription</h2>
                    {profile?.subscription_status === 'active' ? (
                        <div>
                            <div className="bg-green-900/20 border border-green-600 p-4 rounded-xl mb-4">
                                <p className="text-green-400 font-bold">✅ Active Subscription</p>
                                <p className="text-gray-400 text-sm mt-1 capitalize">Plan: {profile?.plan}</p>
                            </div>
                            <p className="text-gray-500 text-sm">You are entered into this month's draw!</p>
                        </div>
                    ) : (
                        <div>
                            <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-xl mb-4">
                                <p className="text-yellow-400 font-bold">⚠️ No Active Subscription</p>
                                <p className="text-gray-400 text-sm mt-1">Subscribe to join monthly draws</p>
                            </div>
                            <Link href="/subscribe" className="block w-full text-center bg-green-400 text-black font-bold py-3 rounded-xl hover:bg-green-300 transition">
                                Subscribe Now →
                            </Link>
                        </div>
                    )}
                </div>

                {/* CHARITY */}
                <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
                    <h2 className="text-2xl font-bold mb-6">❤️ My Charity</h2>
                    {profile?.charity_id ? (
                        <div className="bg-gray-800 p-4 rounded-xl">
                            <p className="text-white font-bold">Charity Selected ✅</p>
                            <p className="text-gray-400 text-sm mt-1">Contribution: {profile?.charity_percent}%</p>
                        </div>
                    ) : (
                        <div>
                            <div className="bg-gray-800 p-4 rounded-xl mb-4">
                                <p className="text-gray-400">No charity selected yet</p>
                            </div>
                            <Link href="/charities" className="block w-full text-center bg-gray-700 text-white font-bold py-3 rounded-xl hover:bg-gray-600 transition">
                                Select a Charity →
                            </Link>
                        </div>
                    )}
                </div>

                {/* SCORE ENTRY */}
                <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
                    <h2 className="text-2xl font-bold mb-6">🏌️ Enter Score</h2>

                    {message && (
                        <p className="text-green-400 mb-4 bg-green-900/20 p-3 rounded-lg">{message}</p>
                    )}

                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-gray-400 text-sm mb-1 block">Stableford Score (1-45)</label>
                            <input
                                type="number"
                                min="1"
                                max="45"
                                placeholder="e.g. 32"
                                value={newScore}
                                onChange={(e) => setNewScore(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-400"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm mb-1 block">Date Played</label>
                            <input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-400"
                            />
                        </div>
                        <button
                            onClick={addScore}
                            className="bg-green-400 text-black font-bold py-3 rounded-xl hover:bg-green-300 transition"
                        >
                            Add Score →
                        </button>
                    </div>
                </div>

                {/* SCORES LIST */}
                <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
                    <h2 className="text-2xl font-bold mb-6">📊 My Last 5 Scores</h2>
                    {scores.length === 0 ? (
                        <p className="text-gray-500">No scores yet. Add your first score!</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {scores.map((s, i) => (
                                <div key={s.id} className="flex justify-between items-center bg-black p-4 rounded-xl border border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <span className="text-green-400 font-black text-lg w-6">{i + 1}</span>
                                        <span className="text-white font-bold text-xl">{s.score} pts</span>
                                    </div>
                                    <span className="text-gray-400 text-sm">{s.played_at}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* DRAW PARTICIPATION */}
                <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 md:col-span-2">
                    <h2 className="text-2xl font-bold mb-6">🎰 Draw Participation</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-black p-6 rounded-xl border border-gray-800 text-center">
                            <p className="text-4xl font-black text-green-400">0</p>
                            <p className="text-gray-400 mt-2">Draws Entered</p>
                        </div>
                        <div className="bg-black p-6 rounded-xl border border-gray-800 text-center">
                            <p className="text-4xl font-black text-yellow-400">£0</p>
                            <p className="text-gray-400 mt-2">Total Won</p>
                        </div>
                        <div className="bg-black p-6 rounded-xl border border-gray-800 text-center">
                            <p className="text-4xl font-black text-blue-400">April</p>
                            <p className="text-gray-400 mt-2">Next Draw</p>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    )
}