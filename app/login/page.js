'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthCard, Input, CTAButton, ErrorBanner } from '@/components/UI'

export default function Login() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async () => {
        setLoading(true)
        setError('')
        if (!email || !password) {
            setError('Please fill in all fields.')
            setLoading(false)
            return
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }
        router.push('/dashboard')
    }

    return (
        <AuthCard>
            <h1 className="text-2xl font-black tracking-tight mb-1">Welcome back</h1>
            <p className="text-white/40 text-sm mb-7">Sign in to your GolfGives account</p>

            <ErrorBanner message={error} />

            <div className="flex flex-col gap-3">
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
                    onClick={handleLogin}
                    loading={loading}
                    className="w-full py-3 mt-1"
                >
                    Sign in →
                </CTAButton>
            </div>

            <p className="text-white/30 text-sm text-center mt-6">
                No account?{' '}
                <Link href="/signup" className="font-semibold" style={{ color: 'var(--accent)' }}>
                    Create one
                </Link>
            </p>
        </AuthCard>
    )
}
