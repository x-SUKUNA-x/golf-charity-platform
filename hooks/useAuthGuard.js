'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/**
 * useAuthGuard — Redirects to /login if user is not authenticated.
 * Use on any page that requires login.
 * Returns { user, loading } — render null while loading is true.
 */
export function useAuthGuard() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }
            setUser(session.user)
            setLoading(false)
        }
        checkAuth()
    }, [router])

    return { user, loading }
}

/**
 * useAdminGuard — Redirects to /login if not authenticated,
 * or to /dashboard if authenticated but NOT an admin.
 * Returns { user, loading } — render null while loading is true.
 */
export function useAdminGuard() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            // Not logged in → go to login
            if (!session) {
                router.push('/login')
                return
            }

            // Logged in → check if is_admin flag is true in users table
            const { data: profile } = await supabase
                .from('users')
                .select('is_admin')
                .eq('id', session.user.id)
                .single()

            if (!profile?.is_admin) {
                // Logged in but NOT an admin → send to dashboard
                router.push('/dashboard')
                return
            }

            setUser(session.user)
            setLoading(false)
        }
        checkAdmin()
    }, [router])

    return { user, loading }
}
