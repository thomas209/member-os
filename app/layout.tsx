import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import MetaPixel from '@/components/MetaPixel'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Member Club',
    template: '%s | Member Club',
  },
  description: 'Indumentaria y zapatillas premium.',
  openGraph: {
    title: 'Member Club',
    description: 'Indumentaria y zapatillas premium.',
    url: SITE_URL,
    siteName: 'Member Club',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Member Club',
    description: 'Indumentaria y zapatillas premium.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-white text-[#0A0A0A] font-sans antialiased">
        {children}
        <Analytics />
        <MetaPixel />
      </body>
    </html>
  )
}
