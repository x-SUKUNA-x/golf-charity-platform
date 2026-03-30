import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST /api/notify-winner
// body: { winnerId, type } where type = 'won' | 'paid' | 'draw_published'
export async function POST(req) {
    try {
        const { winnerId, type, drawData } = await req.json()

        if (type === 'draw_published' && drawData) {
            // Notify all subscribers about draw results
            const { data: subscribers } = await supabase
                .from('users')
                .select('email')
                .eq('subscription_status', 'active')

            for (const sub of subscribers || []) {
                await sendEmail('drawPublished', sub.email, drawData)
            }
            return NextResponse.json({ sent: subscribers?.length || 0 })
        }

        // Get winner + user info
        const { data: winner } = await supabase
            .from('winners')
            .select('*, users(email)')
            .eq('id', winnerId)
            .single()

        if (!winner?.users?.email) {
            return NextResponse.json({ error: 'Winner not found' }, { status: 404 })
        }

        const email = winner.users.email

        if (type === 'won') {
            await sendEmail('won', email, {
                amount: winner.amount,
                tier: winner.tier,
                month: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
            })
        }

        if (type === 'paid') {
            await sendEmail('winnerPaid', email, {
                amount: winner.amount,
                tier: winner.tier
            })
        }

        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('[notify-winner]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
