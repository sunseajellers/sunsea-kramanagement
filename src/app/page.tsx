'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Target, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { signInWithEmail } from '@/lib/authService'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
    const router = useRouter()
    const { user, userData, loading, getDefaultRoute } = useAuth()
    const [loginLoading, setLoginLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Redirect logged-in users to appropriate dashboard
    useEffect(() => {
        if (!loading && user && userData) {
            const defaultRoute = getDefaultRoute()
            console.log('🎯 Login redirect - userData:', userData)
            console.log('🎯 Login redirect - defaultRoute:', defaultRoute)
            router.push(defaultRoute)
        }
    }, [user, userData, loading, router, getDefaultRoute])

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
            // The useEffect above will handle the redirect
        } catch (err: any) {
            console.error(err)
            let errorMessage = 'Failed to sign in. Please try again.'

            // Parse Firebase error codes for user-friendly messages
            if (err.message.includes('user-not-found') || err.message.includes('wrong-password') || err.message.includes('invalid-credential')) {
                errorMessage = 'Invalid email or password'
            } else if (err.message.includes('too-many-requests')) {
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
            <div className="min-h-screen bg-gradient-to-br from-primary-600 via-secondary-600 to-purple-700 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 via-secondary-600 to-purple-700 flex items-center justify-center p-4">
            {/* Background Animation */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse-slow"></div>
                <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 animate-scale-in">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Target className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                        <p className="text-gray-600">Sign in to your account</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start">
                            <div className="flex-shrink-0 mt-0.5 mr-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    disabled={loginLoading}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    disabled={loginLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loginLoading}
                            className="w-full btn-primary flex items-center justify-center py-3"
                        >
                            {loginLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Forgot Password Link */}
                    <p className="mt-6 text-center text-gray-600 text-sm">
                        Forgot your password?{' '}
                        <button
                            type="button"
                            onClick={() => {
                                if (email) {
                                    import('@/lib/authService').then(({ resetPassword }) => {
                                        resetPassword(email)
                                            .then(() => toast.success('Password reset email sent!'))
                                            .catch(() => toast.error('Failed to send reset email'))
                                    })
                                } else {
                                    toast.error('Please enter your email first')
                                }
                            }}
                            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                        >
                            Reset it
                        </button>
                    </p>
                </div>

                {/* Trust Badge */}
                <div className="mt-6 text-center text-white/80 text-sm">
                    <p>🔒 Your data is secure and encrypted</p>
                </div>
            </div>
        </div>
    )
}
