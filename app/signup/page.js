'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthCard, Input, CTAButton, ErrorBanner } from '@/components/UI'

export default function Signup() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSignup = async () => {
        setLoading(true)
        setError('')
        if (!name || !email || !password) {
            setError('Please fill in all fields.')
            setLoading(false)
            return
        }
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        })
        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }
        if (data?.user) {
            const { error: insertError } = await supabase.from('users').insert({
                id: data.user.id,
                email,
                full_name: name,
            })
            if (insertError) console.log('Insert error:', insertError)
            router.push('/dashboard')
        } else {
            setError('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    return (
        <AuthCard>
            {/* Impact nudge */}
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-6 text-xs font-medium border"
                style={{ background: 'rgba(232,160,32,0.08)', borderColor: 'rgba(232,160,32,0.15)', color: 'var(--accent)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                10% of your subscription funds a charity you choose
            </div>

            <h1 className="text-2xl font-black tracking-tight mb-1">Create your account</h1>
            <p className="text-white/40 text-sm mb-7">Join 2,400+ golfers making a difference</p>

            <ErrorBanner message={error} />

            <div className="flex flex-col gap-3">
                <Input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <CTAButton
                    onClick={handleSignup}
                    loading={loading}
                    className="w-full py-3 mt-1"
                >
                    Create account →
                </CTAButton>
            </div>

            <p className="text-white/20 text-xs text-center mt-4 leading-relaxed">
                By creating an account you agree to our terms. Cancel anytime.
            </p>

            <p className="text-white/30 text-sm text-center mt-4">
                Already a member?{' '}
                <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>
                    Sign in
                </Link>
            </p>
        </AuthCard>
    )
}
