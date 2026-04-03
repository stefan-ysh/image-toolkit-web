'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-provider';
import { Button } from './ui/button';
import { useI18n } from '@/lib/i18n-context';

export function Navigation() {
    const pathname = usePathname();
    const { t, language, setLanguage } = useI18n();

    const navItems: { href: string; label: string; icon: LucideIcon }[] = [
        { href: '/', label: t('nav.home'), icon: Home },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center px-4">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <Image src="/logo.png" alt="Logo" width={24} height={24} className="h-6 w-6" />
                    <span className="hidden font-bold sm:inline-block">
                        Image Toolkit
                    </span>
                </Link>
                <nav className="hidden md:flex items-center gap-1 flex-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2 ml-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-9 px-0"
                        onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                    >
                        {language === 'en' ? '中' : 'En'}
                    </Button>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
