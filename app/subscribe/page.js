'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Subscribe() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState('monthly')

    const handleSubscribe = async () => {
        setLoading(true)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }

        await supabase.from('users').update({
            plan: selected,
            subscription_status: 'active'
        }).eq('id', session.user.id)

        router.push('/dashboard')
    }

    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
            <div className="max-w-2xl w-full">
                <h1 className="text-4xl font-extrabold text-center mb-4">Choose Your Plan</h1>
                <p className="text-gray-400 text-center mb-12">Join the monthly draw and support your charity</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* MONTHLY */}
                    <div
                        onClick={() => setSelected('monthly')}
                        className={`p-8 rounded-2xl border-2 cursor-pointer transition ${selected === 'monthly'
                                ? 'border-green-400 bg-green-400/10'
                                : 'border-gray-700 bg-gray-900'
                            }`}
                    >
                        <p className="text-gray-400 mb-2">Monthly</p>
                        <p className="text-4xl font-black mb-1">£9.99<span className="text-lg font-normal text-gray-400">/mo</span></p>
                        <ul className="text-gray-400 text-sm mt-4 flex flex-col gap-2">
                            <li>✅ Enter monthly draws</li>
                            <li>✅ Track your scores</li>
                            <li>✅ Support your charity</li>
                            <li>✅ Cancel anytime</li>
                        </ul>
                    </div>

                    {/* YEARLY */}
                    <div
                        onClick={() => setSelected('yearly')}
                        className={`p-8 rounded-2xl border-2 cursor-pointer transition relative ${selected === 'yearly'
                                ? 'border-green-400 bg-green-400/10'
                                : 'border-gray-700 bg-gray-900'
                            }`}
                    >
                        <span className="absolute top-4 right-4 bg-green-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                            SAVE 17%
                        </span>
                        <p className="text-gray-400 mb-2">Yearly</p>
                        <p className="text-4xl font-black mb-1">£99.99<span className="text-lg font-normal text-gray-400">/yr</span></p>
                        <ul className="text-gray-400 text-sm mt-4 flex flex-col gap-2">
                            <li>✅ Everything in Monthly</li>
                            <li>✅ 2 months free</li>
                            <li>✅ Priority support</li>
                            <li>✅ Early draw access</li>
                        </ul>
                    </div>
                </div>

                <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full bg-green-400 text-black font-bold text-xl py-4 rounded-2xl hover:bg-green-300 transition disabled:opacity-50"
                >
                    {loading ? 'Processing...' : `Subscribe ${selected === 'monthly' ? '£9.99/mo' : '£99.99/yr'} →`}
                </button>

                <p className="text-gray-600 text-center text-sm mt-4">
                    Secure payment · Cancel anytime · No hidden fees
                </p>
            </div>
        </main>
    )
}