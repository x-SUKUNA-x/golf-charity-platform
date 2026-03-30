'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Admin() {
    const router = useRouter()
    const [users, setUsers] = useState([])
    const [draws, setDraws] = useState([])
    const [charities, setCharities] = useState([])
    const [winners, setWinners] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('users')
    const [drawResult, setDrawResult] = useState(null)
    const [newCharity, setNewCharity] = useState({ name: '', description: '' })
    const [charityMsg, setCharityMsg] = useState('')

    useEffect(() => {
        fetchAll()
    }, [])

    const fetchAll = async () => {
        const { data: usersData } = await supabase.from('users').select('*')
        const { data: drawsData } = await supabase.from('draws').select('*').order('created_at', { ascending: false })
        const { data: charitiesData } = await supabase.from('charities').select('*')
        const { data: winnersData } = await supabase.from('winners').select('*, users(email)').order('created_at', { ascending: false })
        setUsers(usersData || [])
        setDraws(drawsData || [])
        setCharities(charitiesData || [])
        setWinners(winnersData || [])
        setLoading(false)
    }

    const runDraw = async () => {
        const numbers = []
        while (numbers.length < 5) {
            const n = Math.floor(Math.random() * 45) + 1
            if (!numbers.includes(n)) numbers.push(n)
        }
        numbers.sort((a, b) => a - b)
        setDrawResult(numbers)

        const month = new Date().toISOString().slice(0, 7)
        const { data: draw } = await supabase.from('draws').insert({
            month,
            winning_numbers: numbers,
            status: 'pending'
        }).select().single()

        // Check winners among users with scores
        if (draw) {
            const { data: allScores } = await supabase.from('scores').select('user_id, score')

            // Group scores by user
            const userScores = {}
            allScores?.forEach(s => {
                if (!userScores[s.user_id]) userScores[s.user_id] = []
                userScores[s.user_id].push(s.score)
            })

            // Check each user's scores against winning numbers
            for (const [userId, scores] of Object.entries(userScores)) {
                const matches = scores.filter(s => numbers.includes(s)).length
                let tier = null
                let amount = 0

                if (matches >= 5) { tier = '5-match'; amount = 1000 }
                else if (matches >= 4) { tier = '4-match'; amount = 500 }
                else if (matches >= 3) { tier = '3-match'; amount = 100 }

                if (tier) {
                    await supabase.from('winners').insert({
                        user_id: userId,
                        draw_id: draw.id,
                        tier,
                        amount,
                        payment_status: 'pending'
                    })
                }
            }
        }

        fetchAll()
    }

    const publishDraw = async (drawId) => {
        await supabase.from('draws').update({ status: 'published' }).eq('id', drawId)
        fetchAll()
    }

    const markAsPaid = async (winnerId) => {
        await supabase.from('winners').update({
            payment_status: 'paid',
            verified: true
        }).eq('id', winnerId)
        fetchAll()
    }

    const rejectWinner = async (winnerId) => {
        await supabase.from('winners').update({
            payment_status: 'rejected',
            verified: false
        }).eq('id', winnerId)
        fetchAll()
    }

    const addCharity = async () => {
        if (!newCharity.name) {
            setCharityMsg('Please enter charity name!')
            return
        }
        await supabase.from('charities').insert({
            name: newCharity.name,
            description: newCharity.description,
        })
        setNewCharity({ name: '', description: '' })
        setCharityMsg('Charity added! ✅')
        fetchAll()
    }

    const deleteCharity = async (id) => {
        await supabase.from('charities').delete().eq('id', id)
        fetchAll()
    }

    if (loading) return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        </main>
    )

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            {/* NAVBAR */}
            <nav className="flex justify-between items-center px-8 py-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-black">A</span>
                    </div>
                    <h1 className="text-lg font-semibold">Admin Panel</h1>
                </div>
                <button onClick={() => router.push('/dashboard')} className="text-white/40 hover:text-white text-sm transition">
                    ← Dashboard
                </button>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* STATS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'Total Users', value: users.length, color: 'text-white' },
                        { label: 'Active Subscribers', value: users.filter(u => u.subscription_status === 'active').length, color: 'text-green-400' },
                        { label: 'Total Draws', value: draws.length, color: 'text-blue-400' },
                        { label: 'Pending Winners', value: winners.filter(w => w.payment_status === 'pending').length, color: 'text-yellow-400' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                            <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
                            <p className="text-white/40 text-sm mt-2">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* TABS */}
                <div className="flex gap-1 mb-8 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
                    {['users', 'draws', 'winners', 'charities'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-lg font-medium capitalize text-sm transition ${activeTab === tab
                                    ? 'bg-white text-black'
                                    : 'text-white/40 hover:text-white'
                                }`}
                        >
                            {tab}
                            {tab === 'winners' && winners.filter(w => w.payment_status === 'pending').length > 0 && (
                                <span className="ml-2 bg-yellow-400 text-black text-xs font-black px-2 py-0.5 rounded-full">
                                    {winners.filter(w => w.payment_status === 'pending').length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/[0.06]">
                            <h2 className="font-semibold">All Users</h2>
                        </div>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="text-left p-4 text-white/30 font-normal text-sm">Email</th>
                                    <th className="text-left p-4 text-white/30 font-normal text-sm">Plan</th>
                                    <th className="text-left p-4 text-white/30 font-normal text-sm">Status</th>
                                    <th className="text-left p-4 text-white/30 font-normal text-sm">Charity %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                        <td className="p-4 text-white text-sm">{u.email}</td>
                                        <td className="p-4 text-white/40 text-sm capitalize">{u.plan || 'none'}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.subscription_status === 'active'
                                                    ? 'bg-green-500/10 text-green-400'
                                                    : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                {u.subscription_status || 'inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white/40 text-sm">{u.charity_percent || 10}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* DRAWS TAB */}
                {activeTab === 'draws' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-semibold">Draw Management</h2>
                            <button
                                onClick={runDraw}
                                className="bg-white text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-white/90 transition text-sm"
                            >
                                🎲 Run New Draw
                            </button>
                        </div>

                        {drawResult && (
                            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl mb-6">
                                <p className="text-green-400 font-semibold mb-4">🎉 New Draw Complete!</p>
                                <div className="flex gap-3">
                                    {drawResult.map((n) => (
                                        <span key={n} className="bg-white text-black font-black text-lg w-12 h-12 rounded-full flex items-center justify-center">
                                            {n}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            {draws.length === 0 ? (
                                <p className="text-white/30 text-sm">No draws yet.</p>
                            ) : draws.map((draw) => (
                                <div key={draw.id} className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <p className="font-medium mb-3 text-sm text-white/60">Month: {draw.month}</p>
                                        <div className="flex gap-2">
                                            {draw.winning_numbers.map((n) => (
                                                <span key={n} className="bg-white/10 text-white font-bold w-9 h-9 rounded-full flex items-center justify-center text-sm">
                                                    {n}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${draw.status === 'published'
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {draw.status}
                                        </span>
                                        {draw.status === 'pending' && (
                                            <button
                                                onClick={() => publishDraw(draw.id)}
                                                className="bg-white text-black font-semibold px-4 py-2 rounded-xl hover:bg-white/90 text-sm"
                                            >
                                                Publish →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* WINNERS TAB */}
                {activeTab === 'winners' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="font-semibold">Winner Verification</h2>
                            <p className="text-white/40 text-sm mt-1">Review and verify winner submissions</p>
                        </div>

                        {winners.length === 0 ? (
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-12 text-center">
                                <p className="text-white/30">No winners yet. Run a draw first!</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {winners.map((w) => (
                                    <div key={w.id} className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">{w.users?.email || 'Unknown'}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${w.tier === '5-match' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        w.tier === '4-match' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-purple-500/20 text-purple-400'
                                                    }`}>
                                                    {w.tier}
                                                </span>
                                                <span className="text-white/40 text-sm">£{w.amount}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${w.payment_status === 'paid' ? 'bg-green-500/10 text-green-400' :
                                                    w.payment_status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                                        'bg-yellow-500/10 text-yellow-400'
                                                }`}>
                                                {w.payment_status}
                                            </span>
                                            {w.payment_status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => markAsPaid(w.id)}
                                                        className="bg-green-500/20 text-green-400 font-semibold px-4 py-2 rounded-xl hover:bg-green-500/30 text-sm"
                                                    >
                                                        ✓ Mark Paid
                                                    </button>
                                                    <button
                                                        onClick={() => rejectWinner(w.id)}
                                                        className="bg-red-500/20 text-red-400 font-semibold px-4 py-2 rounded-xl hover:bg-red-500/30 text-sm"
                                                    >
                                                        ✗ Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* CHARITIES TAB */}
                {activeTab === 'charities' && (
                    <div>
                        <h2 className="font-semibold mb-6">Manage Charities</h2>

                        <div className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl mb-6">
                            <h3 className="font-medium mb-4 text-sm">Add New Charity</h3>
                            {charityMsg && <p className="text-green-400 mb-3 text-sm">{charityMsg}</p>}
                            <div className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    placeholder="Charity name"
                                    value={newCharity.name}
                                    onChange={(e) => setNewCharity({ ...newCharity, name: e.target.value })}
                                    className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 placeholder:text-white/20"
                                />
                                <input
                                    type="text"
                                    placeholder="Description"
                                    value={newCharity.description}
                                    onChange={(e) => setNewCharity({ ...newCharity, description: e.target.value })}
                                    className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 placeholder:text-white/20"
                                />
                                <button
                                    onClick={addCharity}
                                    className="bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 text-sm"
                                >
                                    Add Charity →
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {charities.map((c) => (
                                <div key={c.id} className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-sm">{c.name}</p>
                                        <p className="text-white/30 text-sm mt-1">{c.description}</p>
                                    </div>
                                    <button
                                        onClick={() => deleteCharity(c.id)}
                                        className="text-red-400/60 hover:text-red-400 text-sm transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}