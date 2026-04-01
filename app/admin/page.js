'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useAdminGuard } from '@/hooks/useAuthGuard'
import { Spinner } from '@/components/UI'

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
    const [drawMode, setDrawMode] = useState('random')
    const [simulationResult, setSimulationResult] = useState(null)
    const [drawRunning, setDrawRunning] = useState(false)
    const [drawMsg, setDrawMsg] = useState('')
    // Score editing state
    const [editingUserScores, setEditingUserScores] = useState(null) // userId
    const [userScores, setUserScores] = useState([]) // scores for editing user
    const [scoreEditMsg, setScoreEditMsg] = useState('')
    const [editingScore, setEditingScore] = useState(null)

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

    const calcPrizePool = () => {
        const activeUsers = users.filter(u => u.subscription_status === 'active')
        const monthlyRevenue = activeUsers.filter(u => u.plan === 'monthly').length * MONTHLY_PRICE
        const yearlyRevenue = activeUsers.filter(u => u.plan === 'yearly').length * (YEARLY_PRICE / 12)
        return (monthlyRevenue + yearlyRevenue) * 0.5
    }
    const prizePool = calcPrizePool()
    const jackpotAmount = (prizePool * 0.40).toFixed(2)
    const majorAmount = (prizePool * 0.35).toFixed(2)
    const prizeAmount = (prizePool * 0.25).toFixed(2)
    const lastDraw = draws[0]
    const jackpotRolledOver = lastDraw?.jackpot_rolled_over || 0

    const generateRandomNumbers = () => {
        const numbers = []
        while (numbers.length < 5) {
            const n = Math.floor(Math.random() * 45) + 1
            if (!numbers.includes(n)) numbers.push(n)
        }
        return numbers.sort((a, b) => a - b)
    }
    const generateAlgorithmicNumbers = async () => {
        const { data: allScores } = await supabase.from('scores').select('score')
        if (!allScores || allScores.length === 0) return generateRandomNumbers()
        const freq = {}
        for (let i = 1; i <= 45; i++) freq[i] = 0
        allScores.forEach(s => { if (s.score >= 1 && s.score <= 45) freq[s.score]++ })
        const sorted = Object.entries(freq).sort((a, b) => a[1] - b[1])
        const leastCommon = sorted.slice(0, 15).map(e => parseInt(e[0]))
        const numbers = []
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

    const simulateDraw = async () => {
        setDrawRunning(true); setDrawMsg('')
        const numbers = drawMode === 'algorithmic' ? await generateAlgorithmicNumbers() : generateRandomNumbers()
        setSimulationResult(numbers)
        setDrawRunning(false)
        setDrawMsg('Simulation only — not saved. Review numbers then click "Confirm & Run Draw" to save.')
    }

    const confirmDraw = async () => {
        if (!simulationResult) return
        setDrawRunning(true)

        // BUG FIX #3: Guard against running multiple draws in the same month
        const month = new Date().toISOString().slice(0, 7)
        const alreadyRan = draws.find(d => d.month === month)
        if (alreadyRan) {
            setDrawMsg(`⚠️ A draw has already been run for ${month}. You cannot run two draws in the same month.`)
            setDrawRunning(false)
            return
        }

        const numbers = simulationResult
        const prevJackpotRollover = draws.find(d => d.status === 'published' && d.jackpot_rolled_over > 0)?.jackpot_rolled_over || 0
        const totalJackpot = parseFloat(jackpotAmount) + prevJackpotRollover
        const { data: draw } = await supabase.from('draws').insert({
            month, winning_numbers: numbers, status: 'pending', draw_mode: drawMode,
            prize_pool: parseFloat(prizePool.toFixed(2)), jackpot_amount: totalJackpot, jackpot_rolled_over: 0,
        }).select().single()
        let jackpotWon = false
        if (draw) {
            const activeSubs = users.filter(u => u.subscription_status === 'active').map(u => u.id)
            const { data: allScores } = await supabase.from('scores').select('user_id, score')

            // Group scores per user (deduplicated — BUG FIX #2)
            const userScoresMap = {}
            allScores?.forEach(s => {
                if (activeSubs.includes(s.user_id)) {
                    if (!userScoresMap[s.user_id]) userScoresMap[s.user_id] = new Set()
                    userScoresMap[s.user_id].add(s.score)
                }
            })

            // Identify winners by tier and count per tier for prize splitting (BUG FIX #1)
            const tierWinners = { '5-match': [], '4-match': [], '3-match': [] }
            for (const [userId, scoresSet] of Object.entries(userScoresMap)) {
                const matches = [...scoresSet].filter(s => numbers.includes(s)).length
                if (matches >= 5) { tierWinners['5-match'].push(userId); jackpotWon = true }
                else if (matches >= 4) tierWinners['4-match'].push(userId)
                else if (matches >= 3) tierWinners['3-match'].push(userId)
            }

            // Calculate split amounts per tier
            const tierAmounts = {
                '5-match': jackpotWon ? (totalJackpot / tierWinners['5-match'].length) : 0,
                '4-match': tierWinners['4-match'].length > 0 ? (parseFloat(majorAmount) / tierWinners['4-match'].length) : 0,
                '3-match': tierWinners['3-match'].length > 0 ? (parseFloat(prizeAmount) / tierWinners['3-match'].length) : 0,
            }

            // Insert winners with split amounts
            for (const tier of ['5-match', '4-match', '3-match']) {
                for (const userId of tierWinners[tier]) {
                    const amount = parseFloat(tierAmounts[tier].toFixed(2))
                    const { data: newWinner } = await supabase.from('winners').insert({
                        user_id: userId, draw_id: draw.id, tier, amount, payment_status: 'pending'
                    }).select().single()
                    if (newWinner?.id) {
                        await fetch('/api/notify-winner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ winnerId: newWinner.id, type: 'won' }) })
                    }
                }
            }

            if (!jackpotWon) await supabase.from('draws').update({ jackpot_rolled_over: totalJackpot }).eq('id', draw.id)
        }
        setSimulationResult(null)
        setDrawMsg(jackpotWon ? '🎉 Draw complete! Jackpot was won!' : `🎲 Draw complete! No jackpot winner — £${totalJackpot.toFixed(2)} rolls over.`)
        setDrawRunning(false)
        fetchAll()
    }

    const publishDraw = async (drawId) => {
        await supabase.from('draws').update({ status: 'published' }).eq('id', drawId)
        const draw = draws.find(d => d.id === drawId)
        if (draw) {
            const nextJackpot = (parseFloat(jackpotAmount) + (draw.jackpot_rolled_over || 0)).toFixed(2)
            await fetch('/api/notify-winner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'draw_published', drawData: { month: draw.month, numbers: draw.winning_numbers, jackpot: nextJackpot } }) })
        }
        fetchAll()
    }
    const markAsPaid = async (winnerId) => {
        await supabase.from('winners').update({ payment_status: 'paid', verified: true }).eq('id', winnerId)
        await fetch('/api/notify-winner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ winnerId, type: 'paid' }) })
        fetchAll()
    }
    const rejectWinner = async (winnerId) => {
        await supabase.from('winners').update({ payment_status: 'rejected', verified: false }).eq('id', winnerId)
        fetchAll()
    }
    // BUG FIX #5: Admin score editing functions
    const openUserScores = async (userId) => {
        setScoreEditMsg('')
        setEditingScore(null)
        const { data } = await supabase.from('scores').select('*').eq('user_id', userId).order('played_at', { ascending: false })
        setUserScores(data || [])
        setEditingUserScores(userId)
    }
    const saveAdminScoreEdit = async () => {
        if (!editingScore) return
        if (editingScore.score < 1 || editingScore.score > 45) { setScoreEditMsg('Score must be between 1 and 45'); return }
        await supabase.from('scores').update({ score: parseInt(editingScore.score), played_at: editingScore.played_at }).eq('id', editingScore.id)
        setEditingScore(null)
        openUserScores(editingUserScores)
        setScoreEditMsg('Score updated!')
    }
    const deleteAdminScore = async (scoreId) => {
        await supabase.from('scores').delete().eq('id', scoreId)
        openUserScores(editingUserScores)
    }
    const addAdminScore = async (userId) => {
        const score = parseInt(prompt('Enter Stableford score (1–45):'))
        if (!score || score < 1 || score > 45) { setScoreEditMsg('Invalid score — must be 1 to 45'); return }
        const date = prompt('Enter date (YYYY-MM-DD):', new Date().toISOString().slice(0, 10))
        if (!date) return
        // Rolling 5-score logic
        if (userScores.length >= 5) {
            const oldest = userScores[userScores.length - 1]
            await supabase.from('scores').delete().eq('id', oldest.id)
        }
        await supabase.from('scores').insert({ user_id: userId, score, played_at: date })
        openUserScores(userId)
        setScoreEditMsg('Score added!')
    }

    const addCharity = async () => {
        if (!newCharity.name) { setCharityMsg('Please enter charity name!'); return }
        await supabase.from('charities').insert({ name: newCharity.name, description: newCharity.description, category: newCharity.category || null, is_featured: newCharity.is_featured || false })
        setNewCharity({ name: '', description: '', category: '', is_featured: false })
        setCharityMsg('Charity added!')
        fetchAll()
    }
    const deleteCharity = async (id) => {
        await supabase.from('charities').delete().eq('id', id)
        fetchAll()
    }

    const loadingEl = <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><Spinner /></main>
    if (authLoading) return loadingEl
    if (!adminUser) return null
    if (loading) return loadingEl

    /* shared styles */
    const card = { background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }
    const inputCls = 'w-full rounded-xl px-4 py-3 text-sm focus:outline-none border transition-all'
    const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }

    return (
        <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
            {/* NAV */}
            <nav className="flex justify-between items-center px-8 py-6 border-b"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-black">A</span>
                    </div>
                    <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Admin Panel</h1>
                </div>
                <button onClick={() => router.push('/dashboard')} className="text-sm transition" style={{ color: 'var(--text-3)' }}>← Dashboard</button>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* STATS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'Total Users', value: users.length, color: 'var(--text)' },
                        { label: 'Active Subscribers', value: users.filter(u => u.subscription_status === 'active').length, color: '#16a34a' },
                        { label: 'Total Draws', value: draws.length, color: '#2563eb' },
                        { label: 'Pending Winners', value: winners.filter(w => w.payment_status === 'pending').length, color: '#d97706' },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl p-6 border" style={card}>
                            <p className="text-4xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                            <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* TABS */}
                <div className="flex gap-1 mb-8 rounded-xl p-1 w-fit border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    {['users', 'draws', 'winners', 'charities', 'reports'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className="px-5 py-2 rounded-lg font-medium capitalize text-sm transition"
                            style={activeTab === tab ? {
                                background: 'var(--accent)', color: '#000',
                            } : {
                                color: 'var(--text-2)', background: 'transparent',
                            }}>
                            {tab}
                            {tab === 'winners' && winners.filter(w => w.payment_status === 'pending').length > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                                    {winners.filter(w => w.payment_status === 'pending').length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div className="rounded-2xl overflow-hidden border" style={card}>
                        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>All Users</h2>
                        </div>
                        {/* Score Edit Modal (BUG FIX #5) */}
                        {editingUserScores && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                                <div className="w-full max-w-md rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Edit Scores</h3>
                                        <button onClick={() => { setEditingUserScores(null); setEditingScore(null); setScoreEditMsg('') }}
                                            className="text-sm" style={{ color: 'var(--text-3)' }}>✕ Close</button>
                                    </div>
                                    {scoreEditMsg && <p className="text-sm text-green-600 mb-3">{scoreEditMsg}</p>}
                                    <div className="flex flex-col gap-2 mb-4">
                                        {userScores.length === 0 && <p className="text-sm" style={{ color: 'var(--text-3)' }}>No scores yet.</p>}
                                        {userScores.map((s) => (
                                            <div key={s.id}>
                                                {editingScore?.id === s.id ? (
                                                    <div className="flex gap-2 p-3 rounded-xl border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                                                        <input type="number" min="1" max="45" value={editingScore.score}
                                                            onChange={e => setEditingScore({ ...editingScore, score: e.target.value })}
                                                            className="w-20 rounded-lg px-3 py-2 text-sm border" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                                                        <input type="date" value={editingScore.played_at}
                                                            onChange={e => setEditingScore({ ...editingScore, played_at: e.target.value })}
                                                            className="flex-1 rounded-lg px-3 py-2 text-sm border" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                                                        <button onClick={saveAdminScoreEdit} className="btn-cta px-3 py-1.5 rounded-lg text-xs">Save</button>
                                                        <button onClick={() => setEditingScore(null)} className="text-xs" style={{ color: 'var(--text-3)' }}>Cancel</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-center px-4 py-3 rounded-xl border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                                                        <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{s.score} pts</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{s.played_at}</span>
                                                            <button onClick={() => setEditingScore({ id: s.id, score: s.score, played_at: s.played_at })} className="text-xs" style={{ color: 'var(--text-2)' }}>Edit</button>
                                                            <button onClick={() => deleteAdminScore(s.id)} className="text-xs text-red-500">✕</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => addAdminScore(editingUserScores)}
                                        className="w-full py-2.5 rounded-xl text-sm border transition"
                                        style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                                        + Add Score
                                    </button>
                                </div>
                            </div>
                        )}
                        <table className="w-full">
                            <thead>
                                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                                    {['Email', 'Plan', 'Status', 'Charity %', 'Renewal', 'Scores'].map(h => (
                                        <th key={h} className="text-left p-4 text-sm font-normal" style={{ color: 'var(--text-3)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b transition-colors" style={{ borderColor: 'rgba(0,0,0,0.04)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td className="p-4 text-sm" style={{ color: 'var(--text)' }}>{u.email}</td>
                                        <td className="p-4 text-sm capitalize" style={{ color: 'var(--text-2)' }}>{u.plan || 'none'}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                u.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                                                u.subscription_status === 'lapsed' ? 'bg-red-100 text-red-600' :
                                                'bg-gray-100 text-gray-500'}`}>
                                                {u.subscription_status || 'inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm" style={{ color: 'var(--text-2)' }}>{u.charity_percent || 10}%</td>
                                        <td className="p-4 text-sm" style={{ color: 'var(--text-3)' }}>
                                            {u.subscription_end_date ? new Date(u.subscription_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                        </td>
                                        <td className="p-4">
                                            <button onClick={() => openUserScores(u.id)}
                                                className="text-xs font-medium px-3 py-1.5 rounded-xl border transition"
                                                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                                                Edit Scores
                                            </button>
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: "This Month's Pool", value: `£${prizePool.toFixed(2)}`, sub: '50% of subscription revenue', color: 'var(--text)', bg: card },
                                { label: 'Jackpot (5-match · 40%)', value: `£${(parseFloat(jackpotAmount) + jackpotRolledOver).toFixed(2)}`, sub: jackpotRolledOver > 0 ? `Incl. £${jackpotRolledOver.toFixed(2)} rollover` : null, color: '#d97706', bg: { background: '#fffbeb', borderColor: '#fde68a', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' } },
                                { label: 'Major Prize (4-match · 35%)', value: `£${majorAmount}`, sub: null, color: '#2563eb', bg: { background: '#eff6ff', borderColor: '#bfdbfe', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' } },
                                { label: 'Prize (3-match · 25%)', value: `£${prizeAmount}`, sub: null, color: '#7c3aed', bg: { background: '#f5f3ff', borderColor: '#ddd6fe', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' } },
                            ].map(s => (
                                <div key={s.label} className="rounded-2xl p-5 border" style={s.bg}>
                                    <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                                    <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                                    {s.sub && <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{s.sub}</p>}
                                </div>
                            ))}
                        </div>

                        {/* Draw Controls */}
                        <div className="rounded-2xl p-6 mb-6 border" style={card}>
                            <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Draw Engine</h2>
                            <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Simulate first, then confirm to run the official draw.</p>
                            {/* BUG FIX #3: Show warning if draw already run this month */}
                            {draws.find(d => d.month === new Date().toISOString().slice(0, 7)) && (
                                <div className="rounded-xl p-4 mb-4 text-sm border bg-yellow-50 border-yellow-200 text-yellow-800">
                                    ⚠️ A draw has already been run for {new Date().toISOString().slice(0, 7)}. Running another draw this month is not allowed.
                                </div>
                            )}
                            <div className="flex gap-2 mb-6">
                                {['random', 'algorithmic'].map(mode => (
                                    <button key={mode} onClick={() => setDrawMode(mode)}
                                        className="px-4 py-2 rounded-xl text-sm font-medium transition border capitalize"
                                        style={drawMode === mode ? { background: 'var(--accent)', color: '#000', borderColor: 'var(--accent)' } : { background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                                        {mode === 'random' ? '🎲 Random Draw' : '🧠 Algorithmic Draw'}
                                    </button>
                                ))}
                            </div>
                            {drawMode === 'algorithmic' && (
                                <p className="text-xs mb-4 rounded-xl px-4 py-3 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                                    Algorithmic mode picks numbers weighted toward the <strong>least frequent</strong> scores, giving players with rare scores a fairer chance.
                                </p>
                            )}
                            {drawMsg && (
                                <div className={`rounded-xl p-4 mb-4 text-sm border ${drawMsg.includes('Jackpot was won') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                    {drawMsg}
                                </div>
                            )}
                            {simulationResult && (
                                <div className="rounded-2xl p-6 mb-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                                    <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-2)' }}>🔍 Simulation Preview — not saved yet</p>
                                    <div className="flex gap-3 mb-6">
                                        {simulationResult.map((n) => (
                                            <span key={n} className="font-black text-lg w-12 h-12 rounded-full flex items-center justify-center shadow"
                                                style={{ background: 'var(--accent)', color: '#000' }}>
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={confirmDraw} disabled={drawRunning}
                                            className="btn-cta px-6 py-2.5 rounded-xl text-sm disabled:opacity-50">
                                            ✓ Confirm & Run Draw
                                        </button>
                                        <button onClick={() => { setSimulationResult(null); setDrawMsg('') }}
                                            className="px-6 py-2.5 rounded-xl text-sm border transition"
                                            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                                            ✕ Discard
                                        </button>
                                    </div>
                                </div>
                            )}
                            {!simulationResult && (
                                <button onClick={simulateDraw} disabled={drawRunning}
                                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border transition disabled:opacity-50"
                                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                                    {drawRunning ? 'Generating...' : '🎲 Simulate Draw'}
                                </button>
                            )}
                        </div>

                        {/* Past draws */}
                        <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Past Draws</h2>
                        <div className="flex flex-col gap-3">
                            {draws.length === 0 ? (
                                <p className="text-sm" style={{ color: 'var(--text-3)' }}>No draws yet.</p>
                            ) : draws.map((draw) => (
                                <div key={draw.id} className="rounded-2xl p-6 flex justify-between items-center border" style={card}>
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <p className="font-medium text-sm" style={{ color: 'var(--text-2)' }}>{draw.month}</p>
                                            <span className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>{draw.draw_mode || 'random'} draw</span>
                                            {draw.jackpot_rolled_over > 0 && (
                                                <span className="text-yellow-600 text-xs">🔄 Jackpot rolled £{draw.jackpot_rolled_over}</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {draw.winning_numbers.map((n) => (
                                                <span key={n} className="font-bold w-9 h-9 rounded-full flex items-center justify-center text-sm"
                                                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                                                    {n}
                                                </span>
                                            ))}
                                        </div>
                                        {draw.prize_pool && <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>Prize pool: £{draw.prize_pool}</p>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${draw.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {draw.status}
                                        </span>
                                        {draw.status === 'pending' && (
                                            <button onClick={() => publishDraw(draw.id)}
                                                className="btn-cta px-4 py-2 rounded-xl text-sm">
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
                            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Winner Verification</h2>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Review proof submissions and approve or reject payouts</p>
                        </div>
                        {winners.length === 0 ? (
                            <div className="rounded-2xl p-12 text-center border" style={card}>
                                <p style={{ color: 'var(--text-3)' }}>No winners yet. Run a draw first!</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {winners.map((w) => (
                                    <div key={w.id} className="rounded-2xl p-6 border" style={card}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium" style={{ color: 'var(--text)' }}>{w.users?.email || 'Unknown'}</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        w.tier === '5-match' ? 'bg-yellow-100 text-yellow-700' :
                                                        w.tier === '4-match' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-purple-100 text-purple-700'}`}>{w.tier}</span>
                                                    <span className="text-sm" style={{ color: 'var(--text-2)' }}>£{w.amount}</span>
                                                </div>
                                                {w.proof_url && (
                                                    <a href={w.proof_url} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 mt-3 text-blue-600 text-sm hover:text-blue-800 transition">
                                                        📎 View Score Proof →
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    w.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                                    w.payment_status === 'rejected' ? 'bg-red-100 text-red-600' :
                                                    w.payment_status === 'proof_uploaded' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-700'}`}>
                                                    {w.payment_status === 'proof_uploaded' ? 'Proof submitted' : w.payment_status}
                                                </span>
                                                {w.payment_status === 'proof_uploaded' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => markAsPaid(w.id)} className="bg-green-100 text-green-700 font-semibold px-4 py-2 rounded-xl hover:bg-green-200 text-sm transition">✓ Mark Paid</button>
                                                        <button onClick={() => rejectWinner(w.id)} className="bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-xl hover:bg-red-200 text-sm transition">✗ Reject</button>
                                                    </div>
                                                )}
                                                {w.payment_status === 'pending' && (
                                                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>Awaiting proof upload</span>
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
                        <h2 className="font-semibold mb-6" style={{ color: 'var(--text)' }}>Manage Charities</h2>
                        <div className="rounded-2xl p-6 mb-6 border" style={card}>
                            <h3 className="font-medium mb-4 text-sm" style={{ color: 'var(--text)' }}>Add New Charity</h3>
                            {charityMsg && <p className="text-green-600 mb-3 text-sm">{charityMsg}</p>}
                            <div className="flex flex-col gap-3">
                                {[
                                    { placeholder: 'Charity name', key: 'name' },
                                    { placeholder: 'Description', key: 'description' },
                                    { placeholder: 'Category (e.g. health, environment, education)', key: 'category' },
                                ].map(({ placeholder, key }) => (
                                    <input key={key} type="text" placeholder={placeholder}
                                        value={newCharity[key] || ''}
                                        onChange={(e) => setNewCharity({ ...newCharity, [key]: e.target.value })}
                                        className={inputCls} style={inputStyle} />
                                ))}
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <input type="checkbox" checked={newCharity.is_featured || false}
                                        onChange={(e) => setNewCharity({ ...newCharity, is_featured: e.target.checked })}
                                        className="w-4 h-4" style={{ accentColor: 'var(--accent)' }} />
                                    <span className="text-sm" style={{ color: 'var(--text-2)' }}>Mark as featured charity</span>
                                </label>
                                <button onClick={addCharity}
                                    className="btn-cta py-3 rounded-xl text-sm">
                                    Add Charity →
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {charities.map((c) => (
                                <div key={c.id} className="rounded-2xl p-5 flex justify-between items-center border" style={card}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{c.name}</p>
                                            {c.is_featured && (
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,160,32,0.12)', color: 'var(--accent-dark)' }}>★ Featured</span>
                                            )}
                                            {c.category && (
                                                <span className="text-xs px-2 py-0.5 rounded-full border capitalize" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>{c.category}</span>
                                            )}
                                        </div>
                                        <p className="text-sm" style={{ color: 'var(--text-2)' }}>{c.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                        <button onClick={async () => { await supabase.from('charities').update({ is_featured: !c.is_featured }).eq('id', c.id); fetchAll() }}
                                            className="text-xs font-medium px-3 py-1.5 rounded-xl transition border"
                                            style={c.is_featured ? { background: 'rgba(232,160,32,0.1)', borderColor: 'rgba(232,160,32,0.2)', color: 'var(--accent-dark)' } : { background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                                            {c.is_featured ? '★ Unfeature' : '☆ Feature'}
                                        </button>
                                        <button onClick={() => deleteCharity(c.id)} className="text-sm text-red-500 hover:text-red-700 transition">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* REPORTS TAB */}
                {activeTab === 'reports' && (() => {
                    const activeSubs = users.filter(u => u.subscription_status === 'active')
                    const totalUsers = users.length
                    const conversionRate = totalUsers > 0 ? ((activeSubs.length / totalUsers) * 100).toFixed(1) : '0'
                    const monthlyRevenue = activeSubs.filter(u => u.plan === 'monthly').length * MONTHLY_PRICE
                    const yearlyRevenue = activeSubs.filter(u => u.plan === 'yearly').length * (YEARLY_PRICE / 12)
                    const totalMonthlyRevenue = monthlyRevenue + yearlyRevenue
                    const totalPaidOut = winners.filter(w => w.payment_status === 'paid').reduce((s, w) => s + (w.amount || 0), 0)
                    const totalCharityContrib = activeSubs.reduce((s, u) => {
                        const planPrice = u.plan === 'yearly' ? YEARLY_PRICE / 12 : MONTHLY_PRICE
                        return s + planPrice * ((u.charity_percent || 10) / 100)
                    }, 0)
                    const now = new Date()
                    const months = Array.from({ length: 6 }, (_, i) => {
                        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
                        return { label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
                    })
                    const signupsByMonth = {}
                    users.forEach(u => { if (!u.created_at) return; const k = u.created_at.slice(0, 7); signupsByMonth[k] = (signupsByMonth[k] || 0) + 1 })
                    const maxSignups = Math.max(1, ...months.map(m => signupsByMonth[m.key] || 0))
                    const charityBreakdown = charities.map(c => {
                        const supporters = users.filter(u => u.charity_id === c.id && u.subscription_status === 'active')
                        const estContrib = supporters.reduce((s, u) => { const price = u.plan === 'yearly' ? YEARLY_PRICE / 12 : MONTHLY_PRICE; return s + price * ((u.charity_percent || 10) / 100) }, 0)
                        return { name: c.name, supporters: supporters.length, estContrib }
                    }).sort((a, b) => b.supporters - a.supporters)
                    const totalRollovers = draws.reduce((s, d) => s + (d.jackpot_rolled_over || 0), 0)
                    const totalWinnersFound = winners.length
                    const totalWinnersPaid = winners.filter(w => w.payment_status === 'paid').length
                    const exportCSV = () => {
                        const rows = [['Email','Plan','Status','Charity %','Renewal Date'], ...users.map(u => [u.email||'',u.plan||'none',u.subscription_status||'inactive',u.charity_percent||10,u.subscription_end_date?new Date(u.subscription_end_date).toLocaleDateString('en-GB'):''])]
                        const csv = rows.map(r => r.join(',')).join('\n')
                        const blob = new Blob([csv], { type: 'text/csv' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a'); a.href = url; a.download = `golfgives-users-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url)
                    }
                    return (
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Analytics & Reports</h2>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Platform overview and performance metrics</p>
                                </div>
                                <button onClick={exportCSV} className="text-sm font-medium px-4 py-2 rounded-xl transition border"
                                    style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                                    ↓ Export Users CSV
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                                {[
                                    { label: 'Monthly Revenue', value: `£${totalMonthlyRevenue.toFixed(2)}`, sub: 'from active subs', color: '#16a34a' },
                                    { label: 'Total Paid Out', value: `£${totalPaidOut.toFixed(2)}`, sub: 'to winners all-time', color: '#d97706' },
                                    { label: 'Charity Contributions', value: `£${totalCharityContrib.toFixed(2)}`, sub: 'estimated this month', color: '#2563eb' },
                                    { label: 'Conversion Rate', value: `${conversionRate}%`, sub: `${activeSubs.length} of ${totalUsers} users`, color: '#7c3aed' },
                                ].map(s => (
                                    <div key={s.label} className="rounded-2xl p-6 border" style={card}>
                                        <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
                                        <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>{s.label}</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{s.sub}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-2xl p-6 mb-6 border" style={card}>
                                <h3 className="font-semibold mb-6" style={{ color: 'var(--text)' }}>Monthly Signups</h3>
                                <div className="flex items-end gap-3 h-32">
                                    {months.map(m => {
                                        const count = signupsByMonth[m.key] || 0
                                        const pct = Math.round((count / maxSignups) * 100)
                                        return (
                                            <div key={m.key} className="flex-1 flex flex-col items-center gap-2">
                                                <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{count}</span>
                                                <div className="w-full rounded-t-lg relative" style={{ height: '80px', background: 'var(--bg)' }}>
                                                    <div className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all"
                                                        style={{ height: `${Math.max(pct, 4)}%`, background: 'rgba(232,160,32,0.5)' }} />
                                                </div>
                                                <span className="text-xs" style={{ color: 'var(--text-3)' }}>{m.label}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="rounded-2xl p-6 border" style={card}>
                                    <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Draw Statistics</h3>
                                    <div className="flex flex-col gap-3">
                                        {[
                                            { label: 'Total Draws Run', value: draws.length },
                                            { label: 'Winners Found', value: totalWinnersFound },
                                            { label: 'Winners Paid', value: totalWinnersPaid },
                                            { label: 'Total Jackpot Rollovers', value: `£${totalRollovers.toFixed(2)}` },
                                        ].map(s => (
                                            <div key={s.label} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                                <span className="text-sm" style={{ color: 'var(--text-2)' }}>{s.label}</span>
                                                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{s.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl p-6 border" style={card}>
                                    <h3 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>Charity Contributions</h3>
                                    {charityBreakdown.length === 0 ? (
                                        <p className="text-sm" style={{ color: 'var(--text-3)' }}>No charities yet.</p>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {charityBreakdown.map(c => (
                                                <div key={c.name} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                                    <div>
                                                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{c.name}</p>
                                                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{c.supporters} supporter{c.supporters !== 1 ? 's' : ''}</p>
                                                    </div>
                                                    <span className="font-semibold text-sm text-blue-600">~£{c.estContrib.toFixed(2)}/mo</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })()}
            </div>
        </main>
    )
}
