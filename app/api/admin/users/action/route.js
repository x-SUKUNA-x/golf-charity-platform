import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
    const { userId, action, plan } = await req.json()

    // 1. Verify caller is an admin (Security Check)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: adminUser }, error: verifyError } = await supabase.auth.getUser(token)
    if (verifyError || !adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: adminCheck } = await supabase.from('users').select('is_admin').eq('id', adminUser.id).single()
    if (!adminCheck?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 2. Fetch the target user's Stripe Subscription ID
    const { data: userRecord } = await supabase.from('users').select('stripe_subscription_id, email, subscription_status').eq('id', userId).single()
    
    if (!userRecord || !userRecord.stripe_subscription_id) {
        return NextResponse.json({ error: 'User does not have an active Stripe subscription ID linked.' }, { status: 400 })
    }

    try {
        if (action === 'cancel') {
            // Cancel subscription immediately in Stripe
            const canceledSub = await stripe.subscriptions.cancel(userRecord.stripe_subscription_id)
            
            // Sync Database immediately (don't ONLY rely on webhooks for admin actions so UI feels snappy)
            await supabase.from('users').update({ subscription_status: 'inactive' }).eq('id', userId)

            return NextResponse.json({ success: true, message: `Cancelled subscription for ${userRecord.email}` })
        }
        
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (err) {
        console.error('Stripe admin action error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
