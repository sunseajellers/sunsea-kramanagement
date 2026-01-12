import type { Metadata, Viewport } from 'next'
import { Rajdhani, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '@/components/common'
import './globals.css'

const rajdhani = Rajdhani({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    variable: '--font-rajdhani',
    display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
    weight: ['400', '700'],
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'Dot Panel - JewelMatrix',
    description: 'JewelMatrix Admin Panel - Task Delegation & Performance Tracking',
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning className={`${rajdhani.variable} ${jetbrainsMono.variable}`}>
            <body suppressHydrationWarning className="min-h-screen bg-white text-slate-900 font-sans selection:bg-purple-500 selection:text-white antialiased">
                <ErrorBoundary>
                    <AuthProvider>
                        {children}
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: '#fff',
                                    color: '#363636',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                },
                            }}
                        />
                    </AuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    )
}
