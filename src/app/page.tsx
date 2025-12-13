'use client'

import Link from 'next/link'
import {
    Target,
    CheckCircle2,
    BarChart3,
    Users,
    Calendar,
    TrendingUp,
    Shield,
    Zap,
    Clock,
    Award,
    ArrowRight,
    Menu,
    X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const router = useRouter()
    const { user, loading } = useAuth()

    // Redirect logged-in users to dashboard
    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard')
        }
    }, [user, loading, router])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                                JewelMatrix
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">Features</a>
                            <a href="#benefits" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">Benefits</a>
                            <a href="#pricing" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">Pricing</a>
                            <Link href="/login" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
                                Login
                            </Link>
                            <Link href="/signup" className="btn-primary">
                                Get Started
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-200 animate-slide-down">
                        <div className="px-4 py-4 space-y-3">
                            <a href="#features" className="block text-gray-700 hover:text-primary-600 transition-colors font-medium">Features</a>
                            <a href="#benefits" className="block text-gray-700 hover:text-primary-600 transition-colors font-medium">Benefits</a>
                            <a href="#pricing" className="block text-gray-700 hover:text-primary-600 transition-colors font-medium">Pricing</a>
                            <Link href="/login" className="block text-gray-700 hover:text-primary-600 transition-colors font-medium">
                                Login
                            </Link>
                            <Link href="/signup" className="block btn-primary text-center">
                                Get Started
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="animate-slide-up">
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                                Transform Your Team's
                                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"> Performance</span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                Set clear KRAs, delegate tasks seamlessly, and track progress with automated weekly reports.
                                Empower your team to achieve more with data-driven insights.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/signup" className="btn-primary text-center inline-flex items-center justify-center group">
                                    Start Free Trial
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <button className="btn-secondary text-center">
                                    Request Demo
                                </button>
                            </div>
                            <div className="mt-8 flex items-center space-x-6">
                                <div className="flex -space-x-2">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white"></div>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Trusted by 500+ teams</p>
                                    <p className="text-xs text-gray-600">Join companies achieving 40% more productivity</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative animate-fade-in">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-3xl blur-3xl opacity-20 animate-pulse-slow"></div>
                            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                                                <CheckCircle2 className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Q4 Sales Target</p>
                                                <p className="text-sm text-gray-600">Due in 5 days</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-primary-600">87%</p>
                                            <p className="text-xs text-gray-600">Complete</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                                            <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                                            <p className="text-2xl font-bold text-gray-900">24</p>
                                            <p className="text-sm text-gray-600">Tasks Completed</p>
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                                            <Clock className="w-8 h-8 text-orange-600 mb-2" />
                                            <p className="text-2xl font-bold text-gray-900">98%</p>
                                            <p className="text-sm text-gray-600">On-Time Rate</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="font-semibold text-gray-900">Team Performance</p>
                                            <Award className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Sarah Johnson</span>
                                                <span className="font-semibold text-purple-600">95/100</span>
                                            </div>
                                            <div className="w-full bg-purple-200 rounded-full h-2">
                                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="section-padding bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Everything You Need to Excel
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Powerful features designed to streamline your workflow and boost team productivity
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Target,
                                title: 'KRA Management',
                                description: 'Set clear daily, weekly, and monthly KRAs with automatic recurrence and priority tracking',
                                gradient: 'from-blue-500 to-cyan-500'
                            },
                            {
                                icon: CheckCircle2,
                                title: 'Task Delegation',
                                description: 'Assign tasks with checklists, attachments, and real-time progress tracking',
                                gradient: 'from-purple-500 to-pink-500'
                            },
                            {
                                icon: BarChart3,
                                title: 'Performance Reports',
                                description: 'Automated weekly reports with scoring, analytics, and PDF export',
                                gradient: 'from-green-500 to-emerald-500'
                            },
                            {
                                icon: Calendar,
                                title: 'Smart Calendar',
                                description: 'Visualize tasks and KRAs in daily, weekly, and monthly calendar views',
                                gradient: 'from-orange-500 to-red-500'
                            },
                            {
                                icon: Users,
                                title: 'Team Collaboration',
                                description: 'Role-based permissions for admins, managers, and employees',
                                gradient: 'from-indigo-500 to-purple-500'
                            },
                            {
                                icon: Shield,
                                title: 'Secure & Compliant',
                                description: 'Enterprise-grade security with audit logs and encrypted data storage',
                                gradient: 'from-teal-500 to-green-500'
                            }
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="group p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 card-hover"
                            >
                                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="section-padding bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Why Teams Love JewelMatrix
                        </h2>
                        <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                            Join thousands of teams achieving unprecedented productivity
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Zap,
                                stat: '40%',
                                label: 'Productivity Increase',
                                description: 'Teams report significant productivity gains within the first month'
                            },
                            {
                                icon: TrendingUp,
                                stat: '95%',
                                label: 'On-Time Completion',
                                description: 'Average task completion rate with our automated reminders'
                            },
                            {
                                icon: Clock,
                                stat: '10hrs',
                                label: 'Time Saved Weekly',
                                description: 'Managers save hours on manual reporting and tracking'
                            }
                        ].map((benefit, index) => (
                            <div key={index} className="text-center p-8 glass-effect rounded-2xl">
                                <benefit.icon className="w-12 h-12 mx-auto mb-4" />
                                <p className="text-5xl font-bold mb-2">{benefit.stat}</p>
                                <p className="text-xl font-semibold mb-3">{benefit.label}</p>
                                <p className="text-blue-100">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section-padding bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Ready to Transform Your Team?
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Start your free trial today. No credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/signup" className="btn-primary text-center inline-flex items-center justify-center group">
                            Start Free Trial
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="btn-secondary text-center">
                            Schedule Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-lg font-bold text-white">JewelMatrix</span>
                            </div>
                            <p className="text-sm text-gray-400">
                                Empowering teams to achieve more through better task management and performance tracking.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
                        <p>&copy; 2025 JewelMatrix. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
