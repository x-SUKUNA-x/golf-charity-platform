import Link from 'next/link'
import './globals.css'

export const metadata = {
    title: 'GolfGives — Play Golf. Win Prizes. Change Lives.',
    description: 'A subscription-based golf platform combining performance tracking, monthly prize draws, and charitable giving.',
    keywords: ['golf', 'charity', 'prize draw', 'subscription', 'GolfGives'],
    authors: [{ name: 'GolfGives' }],
    openGraph: {
        title: 'GolfGives — Play Golf. Win Prizes. Change Lives.',
        description: 'Enter your Stableford scores, win monthly prizes, and support your favourite charity — all in one platform.',
        type: 'website',
        url: 'https://golfgives.co.uk',
        siteName: 'GolfGives',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'GolfGives — Golf Charity Platform',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'GolfGives — Play Golf. Win Prizes. Change Lives.',
        description: 'Monthly prize draws + charitable giving for golfers.',
        images: ['/og-image.png'],
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
            </head>
            <body suppressHydrationWarning>
                {children}
            </body>
        </html>
    )
}