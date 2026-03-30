import Link from 'next/link'

export default function NotFound() {
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4">
            <p className="text-white/20 text-sm font-medium uppercase tracking-widest mb-4">404</p>
            <h1 className="text-5xl font-bold tracking-tight mb-4">Page not found</h1>
            <p className="text-white/40 text-lg mb-10">The page you're looking for doesn't exist.</p>
            <Link href="/" className="bg-white text-black font-semibold px-8 py-3 rounded-full hover:bg-white/90 transition">
                Go home →
            </Link>
        </main>
    )
}