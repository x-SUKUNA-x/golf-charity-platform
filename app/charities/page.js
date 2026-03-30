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
    const [selected, setSelected] = useState(null)
    const [percent, setPercent] = useState(10)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (!authLoading && user) {
            fetchCharities()
        }
    }, [authLoading, user])

    const fetchCharities = async () => {
        const { data } = await supabase.from('charities').select('*')
        setCharities(data || [])
        setLoading(false)
    }

    const handleSave = async () => {
        if (!selected) {
            setMessage('Please select a charity first!')
            return
        }
        setSaving(true)

        await supabase.from('users').update({
            charity_id: selected,
            charity_percent: percent
        }).eq('id', user.id)

        setMessage('Charity saved! ✅')
        setSaving(false)
        setTimeout(() => router.push('/dashboard'), 1000)
    }

    if (authLoading || loading) return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        </main>
    )

    return (
        <main className="min-h-screen bg-black text-white px-6 py-10">
            <div className="max-w-4xl mx-auto">
                {/* HEADER */}
                <div className="flex items-center gap-4 mb-10">
                    <Link href="/dashboard" className="text-gray-400 hover:text-white">← Back</Link>
                    <h1 className="text-3xl font-bold">❤️ Choose Your Charity</h1>
                </div>

                {message && (
                    <p className="text-green-400 mb-6 bg-green-900/20 p-4 rounded-xl">{message}</p>
                )}

                {/* CHARITY GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {charities.map((charity) => (
                        <div
                            key={charity.id}
                            onClick={() => setSelected(charity.id)}
                            className={`p-6 rounded-2xl border-2 cursor-pointer transition ${selected === charity.id
                                    ? 'border-green-400 bg-green-400/10'
                                    : 'border-gray-700 bg-gray-900'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-2">{charity.name}</h3>
                                    <p className="text-gray-400 text-sm">{charity.description}</p>
                                </div>
                                {selected === charity.id && (
                                    <span className="text-green-400 text-2xl ml-4">✅</span>
                                )}
                            </div>
                            {charity.is_featured && (
                                <span className="mt-3 inline-block bg-yellow-400/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full">
                                    ⭐ Featured
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* CONTRIBUTION PERCENTAGE */}
                {selected && (
                    <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 mb-8">
                        <h2 className="text-xl font-bold mb-4">💰 Contribution Percentage</h2>
                        <p className="text-gray-400 mb-6">Choose how much of your subscription goes to charity (minimum 10%)</p>
                        <div className="flex items-center gap-6">
                            <input
                                type="range"
                                min="10"
                                max="50"
                                value={percent}
                                onChange={(e) => setPercent(e.target.value)}
                                className="flex-1 accent-green-400"
                            />
                            <span className="text-3xl font-black text-green-400 w-16">{percent}%</span>
                        </div>
                        <div className="flex justify-between text-gray-600 text-sm mt-2">
                            <span>Min 10%</span>
                            <span>Max 50%</span>
                        </div>
                    </div>
                )}

                {/* SAVE BUTTON */}
                <button
                    onClick={handleSave}
                    disabled={saving || !selected}
                    className="w-full bg-green-400 text-black font-bold text-xl py-4 rounded-2xl hover:bg-green-300 transition disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Charity Selection →'}
                </button>
            </div>
        </main>
    )
}