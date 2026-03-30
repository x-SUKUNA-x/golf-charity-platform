import './globals.css'

export const metadata = {
  title: 'GolfGives',
  description: 'Play Golf. Win Prizes. Change Lives.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}