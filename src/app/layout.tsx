import { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { Rajdhani, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryProvider } from '@/components/common/QueryProvider'
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
    title: 'BOH - Business Operations Hub',
    description: 'Business Operations Hub - Unified Operational Excellence Platform',
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
}

export default function RootLayout({
    children,
}: {
    children: ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning className={`${rajdhani.variable} ${jetbrainsMono.variable}`} data-scroll-behavior="smooth">
            <body suppressHydrationWarning className="min-h-screen selection:bg-indigo-500/30 selection:text-indigo-900">
                <ErrorBoundary>
                    <QueryProvider>
                        <AuthProvider>
                            {children}
                            <Toaster
                                position="top-right"
                                toastOptions={{
                                    duration: 4000,
                                    style: {
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        backdropFilter: 'blur(12px)',
                                        color: '#1e293b',
                                        border: '1px solid rgba(255, 255, 255, 0.5)',
                                        borderRadius: '16px',
                                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        padding: '16px 24px',
                                    },
                                }}
                            />
                        </AuthProvider>
                    </QueryProvider>
                </ErrorBoundary>
            </body>
        </html>
    )
}
