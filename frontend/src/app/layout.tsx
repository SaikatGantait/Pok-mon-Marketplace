import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers/Providers'
import Navbar from '@/components/layout/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pokémon Card Marketplace',
  description: 'Trade Pokémon cards on multiple blockchains',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <Navbar />
            <main className="container mx-auto px-4 py-8">{children}</main>
            <footer className="border-t border-gray-200 py-6 text-center text-gray-600">
              <p>Pokémon Card Marketplace - Built for Web3 Hackathon</p>
              <p className="text-sm mt-2">⚠️ Testnet Only - No Real Funds</p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
