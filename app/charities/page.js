'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { NavLogo, Spinner, CTAButton } from '@/components/UI'

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
        data?.forEach(u => { counts[u.charity_id] = (counts[u.charity_id] || 0) + 1 })
        setSupporterCounts(counts)
    }
    const handleSave = async () => {
        if (!selected) { setMessage('Please select a charity first!'); return }
        setSaving(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const res = await fetch('/api/user/update-charity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ userId: user.id, charityId: selected, percent: parseInt(percent) })
            })
            const data = await res.json()
            if (data.error) setMessage(`Error: ${data.error}`)
            else { 
                setMessage('Charity saved and subscription synced!')
                setTimeout(() => router.push('/dashboard'), 1500)
            }
        } catch (err) {
            setMessage('Failed to save charity.')
        }
        setSaving(false)
    }

    const categories = ['all', ...new Set(charities.map(c => c.category).filter(Boolean))]
    const filtered = charities.filter(c => {
        const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
        const matchCat = categoryFilter === 'all' || c.category === categoryFilter
        return matchSearch && matchCat
    })
    const featured = filtered.filter(c => c.is_featured)
    const regular = filtered.filter(c => !c.is_featured)

    if (authLoading || loading) return (
        <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
            <Spinner />
        </main>
    )

    return (
        <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
            {/* NAV */}
            <nav className="flex justify-between items-center px-6 md:px-8 py-5 border-b"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <NavLogo />
                <Link href="/dashboard" className="text-sm transition" style={{ color: 'var(--text-3)' }}>← Dashboard</Link>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* HEADER */}
                <div className="mb-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--accent-dark)' }}>Your impact</p>
                    <h1 className="text-4xl font-black tracking-tighter mb-2" style={{ color: 'var(--text)' }}>Choose your charity</h1>
                    <p style={{ color: 'var(--text-2)' }}>A portion of your subscription goes directly to your chosen cause every month.</p>
                </div>

                {/* CURRENT */}
                {currentCharity && (
                    <div className="rounded-2xl p-4 mb-8 flex items-center gap-3 border"
                        style={{ background: 'rgba(232,160,32,0.07)', borderColor: 'rgba(232,160,32,0.22)' }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--accent)' }}>
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'var(--accent-dark)' }}>
                            Currently supporting <strong>{charities.find(c => c.id === currentCharity)?.name}</strong> · {percent}% of your subscription
                        </p>
                    </div>
                )}

                {/* MESSAGE */}
                {message && (
                    <div className="rounded-2xl p-4 mb-6 border"
                        style={{ background: 'rgba(232,160,32,0.07)', borderColor: 'rgba(232,160,32,0.22)' }}>
                        <p className="text-sm font-medium" style={{ color: 'var(--accent-dark)' }}>{message}</p>
                    </div>
                )}

                {/* SEARCH + FILTERS */}
                <div className="flex flex-col md:flex-row gap-3 mb-8">
                    <div className="relative flex-1">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-3)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text" placeholder="Search charities..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none border transition-all"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>
                    {categories.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setCategoryFilter(cat)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition border"
                                    style={categoryFilter === cat ? {
                                        background: 'var(--accent)', color: '#000', borderColor: 'var(--accent)',
                                    } : {
                                        background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)',
                                    }}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* FEATURED */}
                {featured.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>Featured this month</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {featured.map(charity => (
                                <CharityCard key={charity.id} charity={charity} selected={selected} onSelect={setSelected} supporters={supporterCounts[charity.id] || 0} featured />
                            ))}
                        </div>
                    </div>
                )}

                {/* ALL CHARITIES */}
                {regular.length > 0 && (
                    <div className="mb-8">
                        {featured.length > 0 && (
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: 'var(--text-3)' }}>All charities</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {regular.map(charity => (
                                <CharityCard key={charity.id} charity={charity} selected={selected} onSelect={setSelected} supporters={supporterCounts[charity.id] || 0} />
                            ))}
                        </div>
                    </div>
                )}

                {filtered.length === 0 && (
                    <div className="text-center py-16" style={{ color: 'var(--text-3)' }}>
                        <p className="text-lg">No charities found</p>
                        <p className="text-sm mt-1">Try a different search or ask your admin to add charities.</p>
                    </div>
                )}

                {/* CONTRIBUTION SLIDER */}
                {selected && (
                    <div className="rounded-2xl p-8 mb-6 border"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                        <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Set your contribution</h2>
                        <p className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>Choose how much of your subscription goes to charity (minimum 10%)</p>
                        <div className="flex items-center gap-6 mb-3">
                            <input type="range" min="10" max="50" step="5" value={percent}
                                onChange={(e) => setPercent(e.target.value)} className="flex-1" />
                            <span className="text-4xl font-black w-20 text-right" style={{ color: 'var(--accent)' }}>{percent}%</span>
                        </div>
                        <div className="flex justify-between text-xs" style={{ color: 'var(--text-3)' }}>
                            <span>10% minimum</span><span>50% maximum</span>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {[
                                { label: 'To charity', value: `${percent}%` },
                                { label: 'To prize pool', value: `${100 - percent}%` },
                            ].map(item => (
                                <div key={item.label} className="rounded-xl p-4 text-center border"
                                    style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                                    <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{item.label}</p>
                                    <p className="font-semibold" style={{ color: 'var(--text)' }}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SAVE */}
                <CTAButton onClick={handleSave} disabled={!selected} loading={saving} className="w-full py-4 text-base rounded-2xl">
                    {saving ? 'Saving...' : selected ? `Support ${charities.find(c => c.id === selected)?.name} →` : 'Select a charity to continue'}
                </CTAButton>
            </div>
        </main>
    )
}

function CharityCard({ charity, selected, onSelect, supporters, featured }) {
    const isSelected = selected === charity.id
    return (
        <div onClick={() => onSelect(charity.id)}
            className="relative p-6 rounded-2xl border cursor-pointer transition-all duration-200"
            style={isSelected ? {
                borderColor: 'var(--accent)',
                background: 'rgba(232,160,32,0.06)',
                boxShadow: '0 4px 16px rgba(232,160,32,0.15)',
            } : featured ? {
                borderColor: 'rgba(232,160,32,0.2)',
                background: 'var(--surface)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            } : {
                borderColor: 'var(--border)',
                background: 'var(--surface)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
            {featured && !isSelected && (
                <span className="absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(232,160,32,0.12)', color: 'var(--accent-dark)' }}>
                    ★ Featured
                </span>
            )}
            {isSelected && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--accent)' }}>
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}
            <h3 className="text-base font-semibold mb-2 pr-16" style={{ color: 'var(--text)' }}>{charity.name}</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-2)' }}>{charity.description || 'Making a difference in the community.'}</p>
            <div className="flex items-center justify-between">
                {charity.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full border capitalize"
                        style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                        {charity.category}
                    </span>
                )}
                {supporters > 0 && (
                    <span className="text-xs ml-auto" style={{ color: 'var(--text-3)' }}>
                        {supporters} supporter{supporters !== 1 ? 's' : ''}
                    </span>
                )}
            </div>
        </div>
    )
}
