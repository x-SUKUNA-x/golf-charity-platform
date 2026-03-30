import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(req) {
    const { plan, userId, userEmail } = await req.json()

    const priceId = plan === 'monthly'
        ? process.env.STRIPE_MONTHLY_PRICE_ID
        : process.env.STRIPE_YEARLY_PRICE_ID

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: userEmail,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { userId, plan },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
}
