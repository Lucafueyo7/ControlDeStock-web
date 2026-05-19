import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Stock IA · Sistema de gestión de inventario',
  description: 'Sistema de gestión de stock con productos, ventas e inventario',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" data-theme="dark" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body style={{ margin: 0, padding: 0, minHeight: '100vh' }}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
