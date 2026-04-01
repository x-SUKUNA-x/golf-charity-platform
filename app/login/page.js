'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthCard, CTAButton, ErrorBanner } from '@/components/UI'

export default function Login() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async () => {
        setLoading(true)
        setError('')
        if (!email || !password) { setError('Please fill in all fields.'); setLoading(false); return }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError(error.message); setLoading(false); return }
        router.push('/dashboard')
    }

    const inputCls = 'w-full rounded-xl px-4 py-3 text-sm focus:outline-none border transition-all'
    const inputStyle = { background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }
    const inputFocus = (e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'rgba(232,160,32,0.04)' }
    const inputBlur = (e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'rgba(0,0,0,0.03)' }

    return (
        <AuthCard>
            <h1 className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--text)' }}>Welcome back</h1>
            <p className="text-sm mb-7" style={{ color: 'var(--text-2)' }}>Sign in to your GolfGives account</p>

            <ErrorBanner message={error} />

            <div className="flex flex-col gap-3">
                <input type="email" placeholder="Email address" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls} style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur} />
                <input type="password" placeholder="Password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls} style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur} />
                <CTAButton onClick={handleLogin} loading={loading} className="w-full py-3 mt-1">
                    Sign in →
                </CTAButton>
            </div>

            <p className="text-sm text-center mt-6" style={{ color: 'var(--text-3)' }}>
                No account?{' '}
                <Link href="/signup" className="font-semibold" style={{ color: 'var(--accent-dark)' }}>Create one</Link>
            </p>
        </AuthCard>
    )
}
