"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    LogOut,
    BarChart3,
    Loader2,
    Shield,
    Activity,
    Ticket,
    Target,
    BookOpen,
    Users,
    ClipboardCheck,
    History,
    Award
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/features/notifications/NotificationBell';
import { useEffect } from 'react';

const menuItems = [
    {
        href: '/admin',
        label: 'Home',
        icon: LayoutDashboard,
    },
    {
        href: '/admin/organization',
        label: 'Team',
        icon: Users,
    },
    {
        href: '/admin/operations',
        label: 'KRA',
        icon: ClipboardCheck,
    },
    {
        href: '/admin/performance',
        label: 'KPI',
        icon: Activity,
    },
    {
        href: '/admin/okr',
        label: 'OKR',
        icon: Target,
    },
    {
        href: '/admin/governance',
        label: 'Govern',
        icon: Award,
    },
    {
        href: '/admin/learning-hub',
        label: 'Guides',
        icon: BookOpen,
    },
    {
        href: '/admin/helpdesk',
        label: 'Help',
        icon: Ticket,
    },
    {
        href: '/admin/activity-log',
        label: 'Log',
        icon: History,
    },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-primary to-secondary animate-pulse shadow-2xl shadow-primary/20" />
                        <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-white" />
                    </div>
                    <p className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Top Brand Bar */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
                <div className="max-w-[1800px] mx-auto">
                    <div className="glass-panel px-6 py-3 flex items-center justify-between border-border shadow-xl shadow-primary/5">
                        {/* Brand */}
                        <div className="flex items-center gap-10">
                            <Link href="/admin" className="flex items-center group">
                                <div className="p-2.5 rounded-2xl bg-foreground group-hover:bg-primary transition-all duration-500 shadow-xl shadow-foreground/10">
                                    <Shield className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <div className="ml-4 flex flex-col">
                                    <span className="text-base font-bold tracking-tight text-foreground leading-none">
                                        JewelMatrix
                                    </span>
                                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1">
                                        Admin Panel
                                    </span>
                                </div>
                            </Link>

                            {/* Unified Header Menu (lg and above) */}
                            <div className="hidden lg:flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl border border-border/50">
                                {menuItems.map((item) => {
                                    const isActive = item.href === '/admin'
                                        ? pathname === '/admin'
                                        : pathname === item.href || pathname.startsWith(item.href + '/');
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
                                                isActive
                                                    ? "bg-background text-primary shadow-sm border border-border"
                                                    : "text-muted-foreground hover:text-primary hover:bg-background/40"
                                            )}
                                        >
                                            <item.icon className={cn("h-3 w-3", isActive ? "text-primary" : "text-muted-foreground/50")} />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="group h-11 w-11 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                            >
                                <LogOut className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>


            {/* Mobile Navigation Bar */}
            <div className="lg:hidden fixed top-[100px] left-0 right-0 z-40 px-6">
                <div className="glass-panel overflow-x-auto p-1.5 scrollbar-none border-border shadow-lg shadow-primary/5">
                    <div className="flex items-center gap-1.5 whitespace-nowrap min-w-max">
                        {menuItems.map((item) => {
                            const isActive = item.href === '/admin'
                                ? pathname === '/admin'
                                : pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className={cn("h-3 w-3", isActive ? "text-white" : "text-muted-foreground/60")} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 pt-40 lg:pt-28 pb-16">
                <div className="admin-container">
                    {children}
                </div>
            </main>
        </div>
    );
}


// End of file
