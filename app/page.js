import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black text-sm font-black">G</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">GolfGives</h1>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-white/60 hover:text-white text-sm transition">
            Sign in
          </Link>
          <Link href="/signup" className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/90 transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-32 pb-24 relative">
        {/* Glow effect */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white/60 mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Monthly draws now live
        </div>

        <h2 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-none">
          Golf that gives<br />
          <span className="text-white/30">back.</span>
        </h2>

        <p className="text-white/50 text-xl max-w-lg mb-10 leading-relaxed">
          Track your scores, enter monthly prize draws, and support the charity you care about — all in one place.
        </p>

        <div className="flex items-center gap-4">
          <Link href="/signup" className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-white/90 transition text-lg">
            Start for free
          </Link>
          <Link href="/login" className="text-white/60 hover:text-white transition text-lg">
            Sign in →
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-12 mt-20 text-center">
          {[
            { value: '£40K+', label: 'Prize pool distributed' },
            { value: '2,400+', label: 'Active golfers' },
            { value: '12', label: 'Charity partners' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-white/40 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-8 py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <p className="text-white/40 text-sm font-medium uppercase tracking-widest text-center mb-4">How it works</p>
          <h3 className="text-4xl font-bold text-center mb-16 tracking-tight">Three steps to win and give</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Subscribe',
                desc: 'Choose a monthly or yearly plan. A portion automatically goes to your chosen charity.',
                icon: '⚡'
              },
              {
                num: '02',
                title: 'Enter scores',
                desc: 'Log your last 5 Stableford scores after each round. Simple, fast, mobile-friendly.',
                icon: '🏌️'
              },
              {
                num: '03',
                title: 'Win prizes',
                desc: 'Match 3, 4, or 5 numbers in our monthly draw. Jackpot rolls over if unclaimed.',
                icon: '🏆'
              },
            ].map((item) => (
              <div key={item.num} className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 hover:bg-white/[0.05] transition">
                <div className="text-3xl mb-6">{item.icon}</div>
                <p className="text-white/20 text-sm font-mono mb-3">{item.num}</p>
                <h4 className="text-xl font-semibold mb-3">{item.title}</h4>
                <p className="text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIZE TIERS */}
      <section className="px-8 py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-white/40 text-sm font-medium uppercase tracking-widest text-center mb-4">Prize pool</p>
          <h3 className="text-4xl font-bold text-center mb-16 tracking-tight">Every match wins something</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { match: '5 numbers', share: '40%', label: 'Jackpot', note: 'Rolls over if unclaimed', highlight: true },
              { match: '4 numbers', share: '35%', label: 'Major prize', note: 'Split among winners', highlight: false },
              { match: '3 numbers', share: '25%', label: 'Prize', note: 'Split among winners', highlight: false },
            ].map((tier) => (
              <div key={tier.match} className={`rounded-3xl p-8 text-center border ${tier.highlight
                  ? 'bg-white text-black border-white'
                  : 'bg-white/[0.03] border-white/[0.06] text-white'
                }`}>
                <p className={`text-5xl font-black mb-2 ${tier.highlight ? 'text-black' : 'text-white'}`}>
                  {tier.share}
                </p>
                <p className={`font-semibold text-lg mb-1 ${tier.highlight ? 'text-black' : 'text-white'}`}>
                  {tier.label}
                </p>
                <p className={`text-sm ${tier.highlight ? 'text-black/50' : 'text-white/40'}`}>
                  Match {tier.match}
                </p>
                <p className={`text-xs mt-3 ${tier.highlight ? 'text-black/40' : 'text-white/30'}`}>
                  {tier.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHARITY */}
      <section className="px-8 py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-white/40 text-sm font-medium uppercase tracking-widest mb-4">Charity</p>
          <h3 className="text-4xl font-bold mb-6 tracking-tight">Play with purpose</h3>
          <p className="text-white/40 text-xl leading-relaxed mb-10">
            Minimum 10% of every subscription goes directly to your chosen charity. You can give more if you want.
          </p>
          <Link href="/signup" className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-white/90 transition text-lg inline-block">
            Choose your charity →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-24 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-5xl font-bold mb-6 tracking-tight">Ready to play?</h3>
          <p className="text-white/40 text-xl mb-10">Join thousands of golfers winning prizes and changing lives.</p>
          <Link href="/signup" className="bg-white text-black px-10 py-4 rounded-full font-semibold hover:bg-white/90 transition text-xl inline-block">
            Get started free →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-8 py-8 border-t border-white/5 flex justify-between items-center text-white/20 text-sm">
        <p>© 2026 GolfGives</p>
        <p>Built for Digital Heroes</p>
      </footer>
    </main>
  )
}