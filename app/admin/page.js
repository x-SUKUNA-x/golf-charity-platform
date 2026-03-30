'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useAdminGuard } from '@/hooks/useAuthGuard'

const MONTHLY_PRICE = 9.99
const YEARLY_PRICE = 99.99

export default function Admin() {
    const router = useRouter()
    const { user: adminUser, loading: authLoading } = useAdminGuard()
    const [users, setUsers] = useState([])
    const [draws, setDraws] = useState([])
    const [charities, setCharities] = useState([])
    const [winners, setWinners] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('users')
    const [newCharity, setNewCharity] = useState({ name: '', description: '' })
    const [charityMsg, setCharityMsg] = useState('')

    // Draw engine state
    const [drawMode, setDrawMode] = useState('random') // 'random' | 'algorithmic'
    const [simulationResult, setSimulationResult] = useState(null) // preview before saving
    const [drawRunning, setDrawRunning] = useState(false)
    const [drawMsg, setDrawMsg] = useState('')

    useEffect(() => {
        if (!authLoading && adminUser) fetchAll()
    }, [authLoading, adminUser])

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

    // ─── Prize pool helpers ──────────────────────────────────────────
    const calcPrizePool = () => {
        const activeUsers = users.filter(u => u.subscription_status === 'active')
        const monthlyRevenue = activeUsers.filter(u => u.plan === 'monthly').length * MONTHLY_PRICE
        const yearlyRevenue = activeUsers.filter(u => u.plan === 'yearly').length * (YEARLY_PRICE / 12)
        const totalMonthly = monthlyRevenue + yearlyRevenue
        // 50% of subscription revenue goes to prize pool
        return totalMonthly * 0.5
    }

    const prizePool = calcPrizePool()
    const jackpotAmount = (prizePool * 0.40).toFixed(2)
    const majorAmount = (prizePool * 0.35).toFixed(2)
    const prizeAmount = (prizePool * 0.25).toFixed(2)

    // Last unpaid jackpot rollover amount
    const lastDraw = draws[0]
    const jackpotRolledOver = lastDraw?.jackpot_rolled_over || 0

    // ─── Draw number generators ──────────────────────────────────────
    const generateRandomNumbers = () => {
        const numbers = []
        while (numbers.length < 5) {
            const n = Math.floor(Math.random() * 45) + 1
            if (!numbers.includes(n)) numbers.push(n)
        }
        return numbers.sort((a, b) => a - b)
    }

    const generateAlgorithmicNumbers = async () => {
        // Weighted by LEAST frequent user scores (gives players a better chance)
        const { data: allScores } = await supabase.from('scores').select('score')
        if (!allScores || allScores.length === 0) return generateRandomNumbers()

        const freq = {}
        for (let i = 1; i <= 45; i++) freq[i] = 0
        allScores.forEach(s => { if (s.score >= 1 && s.score <= 45) freq[s.score]++ })

        // Sort by frequency ascending (least common first = more likely to match)
        const sorted = Object.entries(freq).sort((a, b) => a[1] - b[1])
        const leastCommon = sorted.slice(0, 15).map(e => parseInt(e[0]))

        const numbers = []
        // Pick 3 from least common, 2 random
        while (numbers.length < 3) {
            const pick = leastCommon[Math.floor(Math.random() * leastCommon.length)]
            if (!numbers.includes(pick)) numbers.push(pick)
        }
        while (numbers.length < 5) {
            const n = Math.floor(Math.random() * 45) + 1
            if (!numbers.includes(n)) numbers.push(n)
        }
        return numbers.sort((a, b) => a - b)
    }

    // ─── Simulate draw (preview only, don't save) ──────────────────
    const simulateDraw = async () => {
        setDrawRunning(true)
        setDrawMsg('')
        const numbers = drawMode === 'algorithmic'
            ? await generateAlgorithmicNumbers()
            : generateRandomNumbers()
        setSimulationResult(numbers)
        setDrawRunning(false)
        setDrawMsg('Simulation only — not saved. Review numbers then click "Confirm & Run Draw" to save.')
    }

    // ─── Confirm and run real draw ──────────────────────────────────
    const confirmDraw = async () => {
        if (!simulationResult) return
        setDrawRunning(true)
        const numbers = simulationResult
        const month = new Date().toISOString().slice(0, 7)

        // Check if jackpot from previous draw should roll over
        const prevJackpotRollover = draws.find(d => d.status === 'published' && d.jackpot_rolled_over > 0)?.jackpot_rolled_over || 0
        const totalJackpot = parseFloat(jackpotAmount) + prevJackpotRollover

        const { data: draw } = await supabase.from('draws').insert({
            month,
            winning_numbers: numbers,
            status: 'pending',
            draw_mode: drawMode,
            prize_pool: parseFloat(prizePool.toFixed(2)),
            jackpot_amount: totalJackpot,
            jackpot_rolled_over: 0, // will be updated if no 5-match
        }).select().single()

        let jackpotWon = false

        if (draw) {
            // Only check users with active subscriptions
            const activeSubs = users.filter(u => u.subscription_status === 'active').map(u => u.id)
            const { data: allScores } = await supabase.from('scores').select('user_id, score')

            const userScores = {}
            allScores?.forEach(s => {
                if (activeSubs.includes(s.user_id)) {
                    if (!userScores[s.user_id]) userScores[s.user_id] = []
                    userScores[s.user_id].push(s.score)
                }
            })

            for (const [userId, scores] of Object.entries(userScores)) {
                const matches = scores.filter(s => numbers.includes(s)).length
                let tier = null
                let amount = 0

                if (matches >= 5) { tier = '5-match'; amount = totalJackpot; jackpotWon = true }
                else if (matches >= 4) { tier = '4-match'; amount = parseFloat(majorAmount) }
                else if (matches >= 3) { tier = '3-match'; amount = parseFloat(prizeAmount) }

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

            // Jackpot rollover — if no 5-match winner, add to next draw
            if (!jackpotWon) {
                await supabase.from('draws').update({
                    jackpot_rolled_over: totalJackpot
                }).eq('id', draw.id)
            }
        }

        setSimulationResult(null)
        setDrawMsg(jackpotWon
            ? '🎉 Draw complete! Jackpot was won!'
            : `🎲 Draw complete! No jackpot winner — £${totalJackpot.toFixed(2)} rolls over to next month.`)
        setDrawRunning(false)
        fetchAll()
    }

    const publishDraw = async (drawId) => {
        await supabase.from('draws').update({ status: 'published' }).eq('id', drawId)
        fetchAll()
    }

    const markAsPaid = async (winnerId) => {
        await supabase.from('winners').update({ payment_status: 'paid', verified: true }).eq('id', winnerId)
        fetchAll()
    }

    const rejectWinner = async (winnerId) => {
        await supabase.from('winners').update({ payment_status: 'rejected', verified: false }).eq('id', winnerId)
        fetchAll()
    }

    const addCharity = async () => {
        if (!newCharity.name) { setCharityMsg('Please enter charity name!'); return }
        await supabase.from('charities').insert({ name: newCharity.name, description: newCharity.description })
        setNewCharity({ name: '', description: '' })
        setCharityMsg('Charity added! ✅')
        fetchAll()
    }

    const deleteCharity = async (id) => {
        await supabase.from('charities').delete().eq('id', id)
        fetchAll()
    }

    if (authLoading) return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        </main>
    )

    if (!adminUser) return null

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
                            className={`px-5 py-2 rounded-lg font-medium capitalize text-sm transition ${activeTab === tab ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
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
                                    <th className="text-left p-4 text-white/30 font-normal text-sm">Renewal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                        <td className="p-4 text-white text-sm">{u.email}</td>
                                        <td className="p-4 text-white/40 text-sm capitalize">{u.plan || 'none'}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                u.subscription_status === 'active' ? 'bg-green-500/10 text-green-400' :
                                                u.subscription_status === 'lapsed' ? 'bg-red-500/10 text-red-400' :
                                                'bg-white/5 text-white/30'}`}>
                                                {u.subscription_status || 'inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white/40 text-sm">{u.charity_percent || 10}%</td>
                                        <td className="p-4 text-white/30 text-sm">
                                            {u.subscription_end_date
                                                ? new Date(u.subscription_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* DRAWS TAB */}
                {activeTab === 'draws' && (
                    <div>
                        {/* Prize Pool Calculator */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                                <p className="text-white/40 text-xs mb-2">This Month's Pool</p>
                                <p className="text-2xl font-black text-white">£{prizePool.toFixed(2)}</p>
                                <p className="text-white/20 text-xs mt-1">50% of subscription revenue</p>
                            </div>
                            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
                                <p className="text-yellow-400/60 text-xs mb-2">Jackpot (5-match · 40%)</p>
                                <p className="text-2xl font-black text-yellow-400">
                                    £{(parseFloat(jackpotAmount) + jackpotRolledOver).toFixed(2)}
                                </p>
                                {jackpotRolledOver > 0 && (
                                    <p className="text-yellow-400/50 text-xs mt-1">Incl. £{jackpotRolledOver.toFixed(2)} rollover</p>
                                )}
                            </div>
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
                                <p className="text-blue-400/60 text-xs mb-2">Major Prize (4-match · 35%)</p>
                                <p className="text-2xl font-black text-blue-400">£{majorAmount}</p>
                            </div>
                            <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5">
                                <p className="text-purple-400/60 text-xs mb-2">Prize (3-match · 25%)</p>
                                <p className="text-2xl font-black text-purple-400">£{prizeAmount}</p>
                            </div>
                        </div>

                        {/* Draw Controls */}
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-6">
                            <h2 className="font-semibold mb-1">Draw Engine</h2>
                            <p className="text-white/30 text-sm mb-6">Simulate first, then confirm to run the official draw.</p>

                            {/* Draw mode toggle */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => setDrawMode('random')}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${drawMode === 'random' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                                >
                                    🎲 Random Draw
                                </button>
                                <button
                                    onClick={() => setDrawMode('algorithmic')}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${drawMode === 'algorithmic' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                                >
                                    🧠 Algorithmic Draw
                                </button>
                            </div>

                            {drawMode === 'algorithmic' && (
                                <p className="text-white/30 text-xs mb-4 bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3">
                                    Algorithmic mode picks numbers weighted toward the <strong className="text-white/60">least frequent</strong> scores in the system, giving players with rare scores a fairer chance.
                                </p>
                            )}

                            {/* Message */}
                            {drawMsg && (
                                <div className={`rounded-xl p-4 mb-4 text-sm ${drawMsg.includes('Jackpot was won') ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                                    {drawMsg}
                                </div>
                            )}

                            {/* Simulation Result */}
                            {simulationResult && (
                                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-4">
                                    <p className="text-white/50 text-sm font-medium mb-4">🔍 Simulation Preview — not saved yet</p>
                                    <div className="flex gap-3 mb-6">
                                        {simulationResult.map((n) => (
                                            <span key={n} className="bg-white text-black font-black text-lg w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={confirmDraw}
                                            disabled={drawRunning}
                                            className="bg-white text-black font-semibold px-6 py-2.5 rounded-xl hover:bg-white/90 transition text-sm disabled:opacity-50"
                                        >
                                            ✓ Confirm & Run Draw
                                        </button>
                                        <button
                                            onClick={() => { setSimulationResult(null); setDrawMsg('') }}
                                            className="bg-white/5 text-white/40 font-semibold px-6 py-2.5 rounded-xl hover:text-white transition text-sm"
                                        >
                                            ✕ Discard
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!simulationResult && (
                                <button
                                    onClick={simulateDraw}
                                    disabled={drawRunning}
                                    className="bg-white text-black font-semibold px-6 py-2.5 rounded-xl hover:bg-white/90 transition text-sm disabled:opacity-50"
                                >
                                    {drawRunning ? 'Generating...' : '🎲 Simulate Draw'}
                                </button>
                            )}
                        </div>

                        {/* Past draws list */}
                        <h2 className="font-semibold mb-4">Past Draws</h2>
                        <div className="flex flex-col gap-3">
                            {draws.length === 0 ? (
                                <p className="text-white/30 text-sm">No draws yet.</p>
                            ) : draws.map((draw) => (
                                <div key={draw.id} className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <p className="font-medium text-sm text-white/60">{draw.month}</p>
                                            <span className="text-white/20 text-xs capitalize">{draw.draw_mode || 'random'} draw</span>
                                            {draw.jackpot_rolled_over > 0 && (
                                                <span className="text-yellow-400/70 text-xs">🔄 Jackpot rolled £{draw.jackpot_rolled_over}</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {draw.winning_numbers.map((n) => (
                                                <span key={n} className="bg-white/10 text-white font-bold w-9 h-9 rounded-full flex items-center justify-center text-sm">
                                                    {n}
                                                </span>
                                            ))}
                                        </div>
                                        {draw.prize_pool && (
                                            <p className="text-white/20 text-xs mt-3">Prize pool: £{draw.prize_pool}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${draw.status === 'published' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                            {draw.status}
                                        </span>
                                        {draw.status === 'pending' && (
                                            <button onClick={() => publishDraw(draw.id)} className="bg-white text-black font-semibold px-4 py-2 rounded-xl hover:bg-white/90 text-sm">
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
                            <p className="text-white/40 text-sm mt-1">Review proof submissions and approve or reject payouts</p>
                        </div>
                        {winners.length === 0 ? (
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-12 text-center">
                                <p className="text-white/30">No winners yet. Run a draw first!</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {winners.map((w) => (
                                    <div key={w.id} className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{w.users?.email || 'Unknown'}</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        w.tier === '5-match' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        w.tier === '4-match' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-purple-500/20 text-purple-400'}`}>
                                                        {w.tier}
                                                    </span>
                                                    <span className="text-white/40 text-sm">£{w.amount}</span>
                                                </div>
                                                {/* Proof link */}
                                                {w.proof_url && (
                                                    <a href={w.proof_url} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 mt-3 text-blue-400 text-sm hover:text-blue-300 transition">
                                                        📎 View Score Proof →
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    w.payment_status === 'paid' ? 'bg-green-500/10 text-green-400' :
                                                    w.payment_status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                                    w.payment_status === 'proof_uploaded' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-yellow-500/10 text-yellow-400'}`}>
                                                    {w.payment_status === 'proof_uploaded' ? 'Proof submitted' : w.payment_status}
                                                </span>
                                                {w.payment_status === 'proof_uploaded' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => markAsPaid(w.id)} className="bg-green-500/20 text-green-400 font-semibold px-4 py-2 rounded-xl hover:bg-green-500/30 text-sm">
                                                            ✓ Mark Paid
                                                        </button>
                                                        <button onClick={() => rejectWinner(w.id)} className="bg-red-500/20 text-red-400 font-semibold px-4 py-2 rounded-xl hover:bg-red-500/30 text-sm">
                                                            ✗ Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {w.payment_status === 'pending' && (
                                                    <span className="text-white/20 text-xs">Awaiting proof upload</span>
                                                )}
                                            </div>
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
                                <button onClick={addCharity} className="bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 text-sm">
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
                                    <button onClick={() => deleteCharity(c.id)} className="text-red-400/60 hover:text-red-400 text-sm transition">
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