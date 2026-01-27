'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { signInWithEmail } from '@/lib/authService'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

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
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-8 md:p-12 space-y-8 animate-float">
                {/* Logo */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <span className="text-4xl font-black text-white tracking-tighter">JM</span>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">JewelMatrix</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Operational Excellence Platform</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-2">
                            <span className="bg-rose-100 p-1 rounded-full">!</span> {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Work Email</label>
                            <input
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="premium-input bg-white/50 focus:bg-white"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="premium-input bg-white/50 focus:bg-white"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="premium-button w-full h-12 flex items-center justify-center gap-3 text-sm font-extrabold uppercase tracking-wider"
                        disabled={loginLoading}
                    >
                        {loginLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Authenticating...
                            </>
                        ) : (
                            'Access Dashboard'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
