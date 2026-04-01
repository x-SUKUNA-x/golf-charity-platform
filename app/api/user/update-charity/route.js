import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
    const { userId, charityId, percent } = await req.json()

    // 1. Verify Caller is User
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: verifyError } = await supabase.auth.getUser(token)
    
    // Allow users to change their own, or allow admins
    if (verifyError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.id !== userId) {
        const { data: adminCheck } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
        if (!adminCheck?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        // Find User's active Stripe Subscription
        const { data: userRecord } = await supabase.from('users').select('stripe_subscription_id, subscription_status').eq('id', userId).single()

        // Find Charity's connected Stripe Account ID
        const { data: charityRecord } = await supabase.from('charities').select('stripe_account_id').eq('id', charityId).single()

        if (!charityRecord) {
            return NextResponse.json({ error: 'Charity not found' }, { status: 404 })
        }

        const charityStripeAccountId = charityRecord.stripe_account_id

        // If user has an active Stripe subscription, update it to route the percentage there
        if (userRecord?.stripe_subscription_id && userRecord?.subscription_status === 'active') {
            
            if (charityStripeAccountId) {
                // Route funds automatically to the connected charity account
                await stripe.subscriptions.update(userRecord.stripe_subscription_id, {
                    transfer_data: {
                        destination: charityStripeAccountId,
                        amount_percent: parseFloat(percent), 
                    }
                })
            } else {
                // If the charity is NOT onboarded yet, clear any existing transfer data so the platform holds it safely
                await stripe.subscriptions.update(userRecord.stripe_subscription_id, {
                    transfer_data: ''
                })
            }
        }

        // 3. Update Databsae
        const { error: dbError } = await supabase.from('users').update({ 
            charity_id: charityId, 
            charity_percent: parseFloat(percent) 
        }).eq('id', userId)

        if (dbError) throw dbError

        return NextResponse.json({ success: true, message: 'Charity updated and Stripe subscription synced successfully.' })
    } catch (err) {
        console.error('Update charity error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
