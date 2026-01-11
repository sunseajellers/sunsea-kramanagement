'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Signup is disabled - users are created by admins only
// Redirect to login page
export default function SignupPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/')
    }, [router])

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 via-secondary-600 to-purple-700 flex items-center justify-center p-4">
            <div className="text-white text-xl">Redirecting...</div>
        </div>
    )
}
