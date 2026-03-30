'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthGuard } from '@/hooks/useAuthGuard'

export default function Charities() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuthGuard()
    const [charities, setCharities] = useState([])
    const [currentCharity, setCurrentCharity] = useState(null)
    const [selected, setSelected] = useState(null)
    const [percent, setPercent] = useState(10)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [supporterCounts, setSupporterCounts] = useState({})

    useEffect(() => {
        if (!authLoading && user) {
            fetchCharities()
            fetchUserProfile()
            fetchSupporterCounts()
        }
    }, [authLoading, user])

    const fetchCharities = async () => {
        const { data } = await supabase.from('charities').select('*').order('is_featured', { ascending: false })
        setCharities(data || [])
        setLoading(false)
    }

    const fetchUserProfile = async () => {
        const { data } = await supabase.from('users').select('charity_id, charity_percent').eq('id', user.id).single()
        if (data?.charity_id) {
            setSelected(data.charity_id)
            setCurrentCharity(data.charity_id)
            setPercent(data.charity_percent || 10)
        }
    }

    const fetchSupporterCounts = async () => {
        const { data } = await supabase.from('users').select('charity_id').not('charity_id', 'is', null)
        const counts = {}
        data?.forEach(u => {
            counts[u.charity_id] = (counts[u.charity_id] || 0) + 1
        })
        setSupporterCounts(counts)
    }

    const handleSave = async () => {
        if (!selected) { setMessage('Please select a charity first!'); return }
        setSaving(true)
        await supabase.from('users').update({
            charity_id: selected,
            charity_percent: parseInt(percent)
        }).eq('id', user.id)
        setMessage('Charity saved! ✅')
        setSaving(false)
        setTimeout(() => router.push('/dashboard'), 1200)
    }

    // Derive unique categories from charities (using description keywords or a category field)
    const categories = ['all', ...new Set(charities.map(c => c.category).filter(Boolean))]

    // Filter charities by search and category
    const filtered = charities.filter(c => {
        const matchSearch = !search ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.description?.toLowerCase().includes(search.toLowerCase())
        const matchCat = categoryFilter === 'all' || c.category === categoryFilter
        return matchSearch && matchCat
    })

    const featured = filtered.filter(c => c.is_featured)
    const regular = filtered.filter(c => !c.is_featured)

    if (authLoading || loading) return (
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
                    <span className="text-base font-semibold">GolfGives</span>
                </div>
                <Link href="/dashboard" className="text-white/40 hover:text-white text-sm transition">
                    ← Dashboard
                </Link>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* HEADER */}
                <div className="mb-10">
                    <p className="text-white/40 text-sm font-medium uppercase tracking-widest mb-3">Step 1 of 1</p>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Choose your charity</h1>
                    <p className="text-white/40">A portion of your subscription goes directly to your chosen cause every month.</p>
                </div>

                {/* CURRENT SELECTION BANNER */}
                {currentCharity && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-8 flex items-center gap-3">
                        <span className="text-green-400">✓</span>
                        <p className="text-green-400 text-sm">
                            You currently support <strong>{charities.find(c => c.id === currentCharity)?.name}</strong> · {percent}% of your subscription
                        </p>
                    </div>
                )}

                {/* MESSAGE */}
                {message && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6">
                        <p className="text-green-400 text-sm">{message}</p>
                    </div>
                )}

                {/* SEARCH + CATEGORY FILTERS */}
                <div className="flex flex-col md:flex-row gap-3 mb-8">
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm">🔍</span>
                        <input
                            type="text"
                            placeholder="Search charities..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 placeholder:text-white/20"
                        />
                    </div>
                    {categories.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${categoryFilter === cat
                                        ? 'bg-white text-black'
                                        : 'bg-white/[0.03] border border-white/10 text-white/40 hover:text-white'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* FEATURED CHARITIES */}
                {featured.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-yellow-400">⭐</span>
                            <p className="text-white/40 text-sm font-medium uppercase tracking-widest">Featured this month</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {featured.map(charity => (
                                <CharityCard
                                    key={charity.id}
                                    charity={charity}
                                    selected={selected}
                                    onSelect={setSelected}
                                    supporters={supporterCounts[charity.id] || 0}
                                    featured
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ALL CHARITIES */}
                {regular.length > 0 && (
                    <div className="mb-8">
                        {featured.length > 0 && (
                            <p className="text-white/40 text-sm font-medium uppercase tracking-widest mb-4">All charities</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {regular.map(charity => (
                                <CharityCard
                                    key={charity.id}
                                    charity={charity}
                                    selected={selected}
                                    onSelect={setSelected}
                                    supporters={supporterCounts[charity.id] || 0}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* EMPTY STATE */}
                {filtered.length === 0 && (
                    <div className="text-center py-16 text-white/30">
                        <p className="text-lg">No charities found</p>
                        <p className="text-sm mt-1">Try a different search or ask your admin to add charities.</p>
                    </div>
                )}

                {/* CONTRIBUTION % SLIDER */}
                {selected && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 mb-6">
                        <h2 className="font-semibold mb-1">Set your contribution</h2>
                        <p className="text-white/30 text-sm mb-8">Choose how much of your subscription goes to charity (minimum 10%)</p>

                        <div className="flex items-center gap-6 mb-3">
                            <input
                                type="range"
                                min="10"
                                max="50"
                                step="5"
                                value={percent}
                                onChange={(e) => setPercent(e.target.value)}
                                className="flex-1 accent-white h-1"
                            />
                            <span className="text-4xl font-black text-white w-20 text-right">{percent}%</span>
                        </div>

                        <div className="flex justify-between text-white/20 text-xs">
                            <span>10% minimum</span>
                            <span>50% maximum</span>
                        </div>

                        {/* breakdown */}
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 text-center">
                                <p className="text-white/30 text-xs mb-1">To charity</p>
                                <p className="text-white font-semibold">{percent}%</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 text-center">
                                <p className="text-white/30 text-xs mb-1">To prize pool</p>
                                <p className="text-white font-semibold">{100 - percent}%</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* SAVE BUTTON */}
                <button
                    onClick={handleSave}
                    disabled={saving || !selected}
                    className="w-full bg-white text-black font-bold text-base py-4 rounded-2xl hover:bg-white/90 transition disabled:opacity-30"
                >
                    {saving ? 'Saving...' : selected ? `Support ${charities.find(c => c.id === selected)?.name} →` : 'Select a charity to continue'}
                </button>
            </div>
        </main>
    )
}

// ─── Charity Card Component ──────────────────────────────────────────────────
function CharityCard({ charity, selected, onSelect, supporters, featured }) {
    const isSelected = selected === charity.id

    return (
        <div
            onClick={() => onSelect(charity.id)}
            className={`relative p-6 rounded-2xl border cursor-pointer transition-all ${isSelected
                ? 'border-white/40 bg-white/[0.06]'
                : featured
                    ? 'border-yellow-500/20 bg-yellow-500/[0.03] hover:border-yellow-500/40'
                    : 'border-white/[0.06] bg-white/[0.03] hover:border-white/20'
                }`}
        >
            {/* Featured badge */}
            {featured && (
                <span className="absolute top-4 right-4 bg-yellow-400/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">
                    ⭐ Featured
                </span>
            )}

            {/* Selected badge */}
            {isSelected && (
                <span className="absolute top-4 right-4 bg-white text-black text-xs font-black px-2 py-0.5 rounded-full">
                    ✓ Selected
                </span>
            )}

            <h3 className="text-base font-semibold mb-2 pr-20">{charity.name}</h3>
            <p className="text-white/40 text-sm leading-relaxed mb-4">{charity.description || 'Making a difference in the community.'}</p>

            <div className="flex items-center justify-between">
                {charity.category && (
                    <span className="bg-white/5 border border-white/10 text-white/40 text-xs px-2 py-0.5 rounded-full capitalize">
                        {charity.category}
                    </span>
                )}
                {supporters > 0 && (
                    <span className="text-white/20 text-xs ml-auto">
                        {supporters} supporter{supporters !== 1 ? 's' : ''}
                    </span>
                )}
            </div>
        </div>
    )
}