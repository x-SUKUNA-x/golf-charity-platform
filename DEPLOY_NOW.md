# 🚀 Deploy GolfGives to Vercel - Step by Step

## ✅ Step 1: Code Pushed to GitHub
**Status:** COMPLETE ✅

Your code is now at: https://github.com/x-SUKUNA-x/golf-charity-platform

---

## 🎯 Step 2: Deploy to Vercel (5 minutes)

### A. Create Vercel Account
1. Go to: https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub

### B. Import Project
1. Click "Add New..." → "Project"
2. Find "golf-charity-platform" in the list
3. Click "Import"

### C. Configure Project
**Framework Preset:** Next.js (auto-detected)
**Root Directory:** `./` (leave as default)
**Build Command:** `npm run build` (auto-detected)
**Output Directory:** `.next` (auto-detected)

Click "Deploy" (DON'T add environment variables yet)

### D. Wait for First Deployment
- Takes 2-3 minutes
- You'll get a URL like: `https://golf-charity-platform-xxx.vercel.app`
- First deployment will FAIL - that's expected (missing env vars)

---

## 🔐 Step 3: Add Environment Variables

### In Vercel Dashboard:
1. Go to your project
2. Click "Settings" → "Environment Variables"
3. Add these ONE BY ONE:

```env
NEXT_PUBLIC_SUPABASE_URL
[Your Supabase URL from .env.local]

NEXT_PUBLIC_SUPABASE_ANON_KEY
[Your Supabase Anon Key from .env.local]

SUPABASE_SERVICE_ROLE_KEY
[Your Supabase Service Role Key from .env.local]

STRIPE_SECRET_KEY
[Your Stripe Secret Key from .env.local]

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
[Your Stripe Publishable Key from .env.local]

STRIPE_WEBHOOK_SECRET
[Will be updated after creating webhook - see Step 5]

STRIPE_MONTHLY_PRICE_ID
[Your Monthly Price ID from .env.local]

STRIPE_YEARLY_PRICE_ID
[Your Yearly Price ID from .env.local]

NEXT_PUBLIC_APP_URL
https://golf-charity-platform-xxx.vercel.app
(⚠️ REPLACE with your actual Vercel URL)

RESEND_API_KEY
[Your Resend API Key from .env.local]
```

4. Click "Save" after each variable
5. Make sure to select "Production", "Preview", and "Development" for each

---

## 🔄 Step 4: Redeploy

1. Go to "Deployments" tab
2. Click "..." on the latest deployment
3. Click "Redeploy"
4. Wait 2-3 minutes
5. ✅ Your site should now be live!

---

## 🎪 Step 5: Configure Stripe Webhook

### A. Get Your Vercel URL
Copy your live URL: `https://golf-charity-platform-xxx.vercel.app`

### B. Add Webhook in Stripe
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://golf-charity-platform-xxx.vercel.app/api/webhook`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.deleted`
5. Click "Add endpoint"

### C. Update Webhook Secret
1. Click on your new webhook
2. Click "Reveal" under "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Go back to Vercel → Settings → Environment Variables
5. Update `STRIPE_WEBHOOK_SECRET` with the new value
6. Redeploy again

---

## ✅ Step 6: Test Everything

### Test Payment Flow
1. Visit your live site
2. Sign up: `test@example.com` / `password123`
3. Go to Subscribe
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. ✅ Should redirect to dashboard with "Active" subscription

### Test Admin Panel
1. Go to: `https://your-url.vercel.app/admin`
2. Login with admin account
3. Run a draw
4. Publish results
5. ✅ Everything should work!

---

## 🎉 You're Live!

Your platform is now deployed and fully functional!

**Share with client:**
- Live URL: `https://golf-charity-platform-xxx.vercel.app`
- Admin Panel: `https://golf-charity-platform-xxx.vercel.app/admin`
- Test Card: `4242 4242 4242 4242`

---

## 🐛 Troubleshooting

### Issue: Build fails
**Solution:** Check build logs in Vercel, usually missing env vars

### Issue: Payments don't activate subscription
**Solution:** Check Stripe webhook is configured correctly

### Issue: 500 error on API routes
**Solution:** Check environment variables are set correctly

### Issue: Can't login
**Solution:** Check Supabase URL and keys are correct

---

## 📞 Need Help?

If you encounter any issues during deployment, let me know and I'll help you fix them!
