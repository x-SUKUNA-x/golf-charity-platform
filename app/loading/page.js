export default function Loading() {
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                <p className="text-white/30 text-sm">Loading...</p>
            </div>
        </main>
    )
}