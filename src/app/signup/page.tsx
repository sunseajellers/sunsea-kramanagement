'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target, ArrowLeft, Loader2 } from 'lucide-react'
import { signInWithGoogle } from '@/lib/authService'
import toast from 'react-hot-toast'

export default function SignupPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGoogleSignup = async () => {
        setLoading(true)
        setError(null)

        try {
            const result = await signInWithGoogle(true)
            if (result.success) {
                toast.success('Welcome! Account created with Google successfully.', {
                    icon: '🎉',
                })
                router.push('/dashboard')
            } else {
                toast.error(result.error!)
                if (result.error === 'Account already exists. Please sign in instead.') {
                    router.push('/')
                }
            }
        } catch (err: any) {
            console.error(err)
            const errorMessage = err.message || 'Failed to sign up with Google. Please try again.'
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary-600 via-purple-600 to-primary-700 flex items-center justify-center p-4 py-12">
            {/* Background Animation */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -top-48 -right-48 animate-pulse-slow"></div>
                <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -bottom-48 -left-48 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Back to Home */}
                <Link
                    href="/"
                    className="inline-flex items-center text-white/90 hover:text-white mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                {/* Signup Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 animate-scale-in">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-secondary-600 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Target className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign Up</h1>
                        <p className="text-gray-600">Create your account with Google</p>
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

                    {/* Google Sign Up */}
                        <button
                            type="button"
                            onClick={handleGoogleSignup}
                            disabled={loading}
                            className="w-full btn-secondary flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Signing Up...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign up with Google
                                </>
                            )}
                        </button>

                    {/* Login Link */}
                    <p className="mt-8 text-center text-gray-600">
                        Already have an account?{' '}
                        <Link href="/" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                            Sign in
                        </Link>
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
