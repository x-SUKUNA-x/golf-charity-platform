import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
    const { charityId, action } = await req.json()

    // 1. Verify Caller is Admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: adminUser }, error: verifyError } = await supabase.auth.getUser(token)
    if (verifyError || !adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: adminCheck } = await supabase.from('users').select('is_admin').eq('id', adminUser.id).single()
    if (!adminCheck?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: charity } = await supabase.from('charities').select('*').eq('id', charityId).single()
    if (!charity) return NextResponse.json({ error: 'Charity not found' }, { status: 404 })

    try {
        if (action === 'create_connect_account') {
            let accountId = charity.stripe_account_id

            // Create a new Express account if one doesn't exist
            if (!accountId) {
                const account = await stripe.accounts.create({
                    type: 'express',
                    capabilities: {
                        transfers: { requested: true },
                    },
                    business_type: 'non_profit',
                    business_profile: {
                        name: charity.name,
                        url: process.env.NEXT_PUBLIC_APP_URL,
                    }
                })
                accountId = account.id
                // Save it to the database
                await supabase.from('charities').update({ stripe_account_id: accountId }).eq('id', charityId)
            }

            // Generate an onboarding link to send to the charity (or for the admin to complete)
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?connect=refresh`,
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?connect=success`,
                type: 'account_onboarding',
            })

            return NextResponse.json({ url: accountLink.url })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (err) {
        console.error('Stripe connect error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
