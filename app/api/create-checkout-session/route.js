import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
    const { plan, userId, userEmail } = await req.json()

    // Retrieve user's charity info if they previously set one
    const { data: userRecord } = await supabase.from('users').select('charity_id, charity_percent').eq('id', userId).single()
    let transferData = undefined

    if (userRecord?.charity_id) {
        const { data: charity } = await supabase.from('charities').select('stripe_account_id').eq('id', userRecord.charity_id).single()
        if (charity?.stripe_account_id) {
            transferData = {
                destination: charity.stripe_account_id,
                amount_percent: parseFloat(userRecord.charity_percent || 10)
            }
        }
    }

    const priceId = plan === 'monthly'
        ? process.env.STRIPE_MONTHLY_PRICE_ID
        : process.env.STRIPE_YEARLY_PRICE_ID

    const sessionParams = {
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: userEmail,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { userId, plan },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?cancelled=true`,
    }

    if (transferData) {
        sessionParams.subscription_data = { transfer_data: transferData }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url })
}
