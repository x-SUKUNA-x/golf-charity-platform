import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const runtime = 'nodejs'

// Helper: find user by Stripe customer ID directly, with email fallback
async function findUserByStripeCustomer(customerId) {
    try {
        // Try robust lookup first (requires stripe_customer_id column)
        const { data: directMatch } = await supabase
            .from('users')
            .select('*')
            .eq('stripe_customer_id', customerId)
            .single()
            
        if (directMatch) return directMatch

        // Fallback: lookup via Stripe API's customer email (brittle but works locally)
        const customer = await stripe.customers.retrieve(customerId)
        if (!customer || customer.deleted || !customer.email) return null
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('email', customer.email)
            .single()
        return data || null
    } catch (err) {
        console.error('Error finding user by customer:', err.message)
        return null
    }
}

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
        const { userId, plan } = session.metadata || {}

        if (!userId) {
            console.error('No userId in session metadata')
            return NextResponse.json({ received: true })
        }

        // Robust update: save stripe IDs
        let { error } = await supabase
            .from('users')
            .update({
                subscription_status: 'active',
                plan: plan || 'monthly',
                stripe_customer_id: session.customer,
                stripe_subscription_id: session.subscription
            })
            .eq('id', userId)

        // Fallback if stripe columns don't exist yet in the database schema
        if (error && error.message.includes('Could not find')) {
            console.error('Missing stripe columns in schema. Falling back to old update.')
            const res = await supabase
                .from('users')
                .update({
                    subscription_status: 'active',
                    plan: plan || 'monthly',
                })
                .eq('id', userId)
            error = res.error
        }

        if (error) {
            console.error('Error activating subscription:', error.message)
        } else {
            console.log(`✅ Subscription activated for user ${userId}, plan: ${plan}`)
        }

        // Send welcome email
        const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .single()

        if (userData?.email) {
            await sendEmail('welcome', userData.email, { plan }).catch(e =>
                console.error('Welcome email error:', e.message)
            )
        }
    }

    // ❌ Subscription cancelled
    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object
        const userData = await findUserByStripeCustomer(subscription.customer)

        if (userData) {
            await supabase
                .from('users')
                .update({ subscription_status: 'inactive' })
                .eq('id', userData.id)
            console.log(`❌ Subscription cancelled for user ${userData.email}`)
        }
    }

    // ⚠️ Payment failed — mark as lapsed + email user
    if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object
        const userData = await findUserByStripeCustomer(invoice.customer)

        if (userData) {
            await supabase
                .from('users')
                .update({ subscription_status: 'lapsed' })
                .eq('id', userData.id)

            await sendEmail('paymentFailed', userData.email, {}).catch(e =>
                console.error('Payment failed email error:', e.message)
            )
            console.log(`⚠️ Payment failed for user ${userData.email}`)
        }
    }

    // 🔄 Subscription renewed — keep active
    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object
        if (invoice.subscription) {
            const userData = await findUserByStripeCustomer(invoice.customer)
            if (userData) {
                await supabase
                    .from('users')
                    .update({ subscription_status: 'active' })
                    .eq('id', userData.id)
                console.log(`🔄 Subscription renewed for user ${userData.email}`)
            }
        }
    }

    return NextResponse.json({ received: true })
}
