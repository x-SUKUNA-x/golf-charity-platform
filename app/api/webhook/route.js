import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Use service role key here (server-side only, never exposed to browser)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Required: raw body for Stripe signature verification
export const runtime = 'nodejs'

export async function POST(req) {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')

    let event
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
        console.error('Webhook signature error:', err.message)
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    // ✅ Payment succeeded — subscription activated
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const { userId, plan } = session.metadata

        // Get full subscription to get period end date
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        const endDate = new Date(subscription.current_period_end * 1000).toISOString()

        await supabase.from('users').update({
            subscription_status: 'active',
            plan,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_end_date: endDate,
        }).eq('id', userId)

        console.log(`✅ Subscription activated for user ${userId}`)
    }

    // ❌ Subscription cancelled
    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object
        await supabase.from('users').update({
            subscription_status: 'inactive',
            stripe_subscription_id: null,
            subscription_end_date: null,
        }).eq('stripe_customer_id', subscription.customer)

        console.log(`❌ Subscription cancelled for customer ${subscription.customer}`)
    }

    // ⚠️ Payment failed — mark as lapsed
    if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object
        await supabase.from('users').update({
            subscription_status: 'lapsed',
        }).eq('stripe_customer_id', invoice.customer)

        console.log(`⚠️ Payment failed for customer ${invoice.customer}`)
    }

    // 🔄 Subscription renewed — update end date
    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object
        if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
            const endDate = new Date(subscription.current_period_end * 1000).toISOString()

            await supabase.from('users').update({
                subscription_status: 'active',
                subscription_end_date: endDate,
            }).eq('stripe_customer_id', invoice.customer)
        }
    }

    return NextResponse.json({ received: true })
}
