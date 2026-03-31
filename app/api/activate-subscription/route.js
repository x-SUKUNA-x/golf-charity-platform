import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
    try {
        const { userId, plan } = await req.json()

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        // Only update columns that exist in the users table
        const { data, error } = await supabase
            .from('users')
            .update({
                subscription_status: 'active',
                plan: plan || 'monthly',
            })
            .eq('id', userId)
            .select()

        if (error) {
            console.error('Activation error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!data || data.length === 0) {
            console.error('No user found with id:', userId)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        console.log(`✅ Subscription activated for user ${userId}, plan: ${plan}`)
        return NextResponse.json({ success: true, user: data[0] })
    } catch (err) {
        console.error('Activation error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
