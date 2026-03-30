import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'GolfGives <noreply@golfgives.co.uk>'

// ─── Base layout wrapper ────────────────────────────────────────────────────
function layout(content) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GolfGives</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Logo -->
        <tr>
          <td style="padding-bottom:32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#fff;width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;">
                  <span style="font-size:14px;font-weight:900;color:#000;">G</span>
                </td>
                <td style="padding-left:10px;color:#fff;font-size:16px;font-weight:600;">GolfGives</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Content card -->
        <tr>
          <td style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding-top:24px;color:rgba(255,255,255,0.2);font-size:12px;text-align:center;line-height:1.6;">
            GolfGives · Golf charity subscription platform<br/>
            <a href="https://golfgives.co.uk" style="color:rgba(255,255,255,0.3);">golfgives.co.uk</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Email templates ────────────────────────────────────────────────────────
const templates = {

    welcome: ({ name, plan }) => ({
        subject: 'Welcome to GolfGives 🏌️',
        html: layout(`
            <h1 style="color:#fff;font-size:28px;font-weight:700;margin:0 0 8px;">Welcome aboard! 👋</h1>
            <p style="color:rgba(255,255,255,0.5);font-size:15px;margin:0 0 32px;line-height:1.6;">
                Your <strong style="color:#fff;">${plan}</strong> subscription is now active.
                You're entered into this month's prize draw — start entering your scores!
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="padding-right:16px;vertical-align:top;">
                  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;width:140px;">
                    <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0 0 6px;">Enter up to</p>
                    <p style="color:#fff;font-weight:700;font-size:20px;margin:0;">5 scores</p>
                  </div>
                </td>
                <td style="vertical-align:top;">
                  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;width:140px;">
                    <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0 0 6px;">Draw every</p>
                    <p style="color:#fff;font-weight:700;font-size:20px;margin:0;">Month</p>
                  </div>
                </td>
              </tr>
            </table>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
              style="display:inline-block;background:#fff;color:#000;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">
              Go to Dashboard →
            </a>
        `)
    }),

    won: ({ amount, tier, month }) => ({
        subject: '🏆 You won a GolfGives prize!',
        html: layout(`
            <div style="font-size:48px;margin-bottom:16px;">🏆</div>
            <h1 style="color:#fff;font-size:28px;font-weight:700;margin:0 0 8px;">You won!</h1>
            <p style="color:rgba(255,255,255,0.5);font-size:15px;margin:0 0 32px;line-height:1.6;">
                Congratulations! You matched ${tier.replace('-', ' ')} in the <strong style="color:#fff;">${month}</strong> draw.
            </p>
            <div style="background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.2);border-radius:16px;padding:28px;margin-bottom:32px;text-align:center;">
                <p style="color:rgba(255,215,0,0.6);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Prize Amount</p>
                <p style="color:#fbbf24;font-size:48px;font-weight:900;margin:0;">£${amount}</p>
            </div>
            <p style="color:rgba(255,255,255,0.4);font-size:14px;margin:0 0 24px;line-height:1.6;">
                To claim your prize, <strong style="color:#fff;">upload proof of your scores</strong> on your dashboard. Our team will review and process payment within 3 business days.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
              style="display:inline-block;background:#fbbf24;color:#000;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">
              Upload Proof →
            </a>
        `)
    }),

    paymentFailed: () => ({
        subject: 'Action required — payment failed',
        html: layout(`
            <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
            <h1 style="color:#fff;font-size:28px;font-weight:700;margin:0 0 8px;">Payment failed</h1>
            <p style="color:rgba(255,255,255,0.5);font-size:15px;margin:0 0 24px;line-height:1.6;">
                We couldn't process your latest subscription payment. Your account has been paused and you won't be entered into the next draw.
            </p>
            <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:20px;margin-bottom:32px;">
                <p style="color:#f87171;font-size:14px;margin:0;line-height:1.6;">
                    To re-activate your subscription and keep your draw entries, please update your payment details.
                </p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscribe"
              style="display:inline-block;background:#fff;color:#000;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">
              Resubscribe →
            </a>
        `)
    }),

    winnerPaid: ({ amount, tier }) => ({
        subject: '✅ Your prize payment is on its way',
        html: layout(`
            <div style="font-size:48px;margin-bottom:16px;">✅</div>
            <h1 style="color:#fff;font-size:28px;font-weight:700;margin:0 0 8px;">Payment approved!</h1>
            <p style="color:rgba(255,255,255,0.5);font-size:15px;margin:0 0 32px;line-height:1.6;">
                Your <strong style="color:#fff;">${tier.replace('-', ' ')}</strong> prize of 
                <strong style="color:#22c55e;">£${amount}</strong> has been approved.
                Payment will arrive in your account within 3–5 business days.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
              style="display:inline-block;background:#fff;color:#000;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">
              View Dashboard →
            </a>
        `)
    }),

    drawPublished: ({ month, numbers, jackpot }) => ({
        subject: `🎱 ${month} draw results are in!`,
        html: layout(`
            <h1 style="color:#fff;font-size:28px;font-weight:700;margin:0 0 8px;">Draw results — ${month}</h1>
            <p style="color:rgba(255,255,255,0.5);font-size:15px;margin:0 0 32px;line-height:1.6;">
                This month's winning numbers have been drawn. Check if you matched!
            </p>
            <!-- Winning numbers -->
            <div style="margin-bottom:32px;">
              <p style="color:rgba(255,255,255,0.3);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Winning Numbers</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  ${numbers.map(n => `
                    <td style="padding-right:10px;">
                      <div style="width:48px;height:48px;background:#fff;border-radius:50%;text-align:center;line-height:48px;font-weight:900;font-size:18px;color:#000;">${n}</div>
                    </td>
                  `).join('')}
                </tr>
              </table>
            </div>
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:32px;">
              <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0 0 4px;">Next month's jackpot</p>
              <p style="color:#fff;font-weight:700;font-size:22px;margin:0;">£${jackpot}</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
              style="display:inline-block;background:#fff;color:#000;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">
              Check My Results →
            </a>
        `)
    }),
}

// ─── Main send function ─────────────────────────────────────────────────────
export async function sendEmail(type, to, data = {}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[email] RESEND_API_KEY not set — skipping email')
        return
    }

    const template = templates[type]
    if (!template) {
        console.error(`[email] Unknown template type: ${type}`)
        return
    }

    const { subject, html } = template(data)

    try {
        const result = await resend.emails.send({ from: FROM, to, subject, html })
        console.log(`[email] Sent ${type} to ${to}`, result)
        return result
    } catch (err) {
        console.error(`[email] Failed to send ${type} to ${to}:`, err)
    }
}
