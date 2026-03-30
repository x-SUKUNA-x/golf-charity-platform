'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
            setError('Please fill in all fields!')
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
        <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
            <div className="bg-gray-900 p-10 rounded-2xl w-full max-w-md border border-gray-800">
                <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
                <p className="text-gray-400 mb-8">Login to your GolfGives account</p>

                {error && <p className="text-red-400 mb-4 bg-red-900/20 p-3 rounded-lg">{error}</p>}

                <div className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-400"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-400"
                    />
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="bg-green-400 text-black font-bold py-3 rounded-xl hover:bg-green-300 transition disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login →'}
                    </button>
                </div>

                <p className="text-gray-400 text-center mt-6">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-green-400 hover:underline">Sign Up</Link>
                </p>
            </div>
        </main>
    )
}