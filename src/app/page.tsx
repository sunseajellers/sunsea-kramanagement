'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react'
import { signInWithEmail } from '@/lib/authService'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function LoginPage() {
    const router = useRouter()
    const { user, loading, getDefaultRoute } = useAuth()
    const [loginLoading, setLoginLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
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
            <div className="min-h-screen bg-white flex items-center justify-center font-sans">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    if (user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center font-sans">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md bg-white/90 backdrop-blur-xl border-slate-200 shadow-xl relative z-10">
                <CardHeader className="text-center space-y-3 pb-2">
                    {/* Logo */}
                    <div className="flex justify-center -mb-1">
                        <Image
                            src="/logo.png"
                            alt="JEWELMATRIX"
                            width={380}
                            height={95}
                            className="h-20 w-auto"
                            priority
                        />
                    </div>

                    {/* Restricted Area Badge */}
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200">
                            <Shield className="h-4 w-4 text-purple-600" />
                            <span className="text-xs font-bold uppercase tracking-widest text-purple-700">Admin Restricted Area</span>
                        </div>
                    </div>

                    <div>
                        <CardTitle className="text-xl font-bold text-slate-900 font-sans">
                            Internal Access Only
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs mt-1 font-sans">
                            Authorized personnel only. Secure login required.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-4">
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                            {error}
                        </div>
                    )}

                    {/* Email/Password Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@jewelmatrix.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500 h-11"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500 h-11"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-bold tracking-wide h-11 shadow-lg shadow-purple-500/20"
                            disabled={loginLoading}
                        >
                            {loginLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>

                    {/* Security Notice */}
                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-center text-xs text-slate-400 font-medium">
                            🔒 Encryption Active | v2.4.0 High-Density Secure Node
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
