'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { signInWithEmail } from '@/lib/authService'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'

export default function LoginPage() {
    const router = useRouter()
    const { user, loading, getDefaultRoute } = useAuth()
    const [loginLoading, setLoginLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    // Redirect logged-in users to appropriate dashboard
    useEffect(() => {
        if (!loading && user) {
            const defaultRoute = getDefaultRoute()
            router.push(defaultRoute)
        }
    }, [user, loading, router, getDefaultRoute])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email || !password) {
            setError('Please enter both email and password')
            return
        }

        setLoginLoading(true)
        setError(null)

        try {
            await signInWithEmail(email, password)
            toast.success('Welcome back!', {
                icon: '🎉',
            })
        } catch (err: any) {
            console.error(err)
            let errorMessage = 'Invalid credentials. Please try again.'

            if (err.message.includes('too-many-requests')) {
                errorMessage = 'Too many attempts. Please try again later.'
            } else if (err.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection.'
            }

            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setLoginLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    if (user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Logo */}
                <div className="flex justify-center">
                    <Image
                        src="/logo.png"
                        alt="SunSea"
                        width={380}
                        height={95}
                        className="h-20 w-auto"
                        priority
                    />
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-semibold">
                            {error}
                        </div>
                    )}

                    {/* Email Field */}
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-700 hover:to-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        disabled={loginLoading}
                    >
                        {loginLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
