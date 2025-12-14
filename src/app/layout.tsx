import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { PermissionsProvider } from '@/contexts/PermissionsContext'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '@/components/common'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'JewelMatrix - Task Delegation & Performance Tracking',
    description: 'A comprehensive platform for setting KRAs, delegating tasks, monitoring progress, and generating automatic performance reports with scoring.',
    keywords: 'JewelMatrix, KRA, task management, performance tracking, team collaboration, productivity',
    authors: [{ name: 'JewelMatrix' }],
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
        <html lang="en">
            <body className={inter.className}>
                <ErrorBoundary>
                    <AuthProvider>
                        <PermissionsProvider>
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
                                    success: {
                                        iconTheme: {
                                            primary: '#10B981',
                                            secondary: '#fff',
                                        },
                                    },
                                    error: {
                                        iconTheme: {
                                            primary: '#EF4444',
                                            secondary: '#fff',
                                        },
                                    },
                                }}
                            />
                        </PermissionsProvider>
                    </AuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    )
}
