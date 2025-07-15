import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI 剧情游戏',
  description: '由AI驱动的剧情游戏',
  generator: 'Eray',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
