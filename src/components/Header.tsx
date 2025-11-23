"use client";

import Link from 'next/link';
import { Menu, ShoppingBag, Sparkles, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function Header() {
    const { user, signOut } = useAuth();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 h-20 flex items-center">
            <div className="container flex items-center justify-between">
                <Link href="/" className="font-heading text-2xl font-bold text-primary tracking-tight">
                    Bebilush
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/emrat" className="flex items-center gap-2 font-medium text-foreground/80 hover:text-primary transition-colors">
                        <Sparkles size={18} />
                        <span>Emrat</span>
                    </Link>
                    <Link href="/dyqani" className="flex items-center gap-2 font-medium text-foreground/80 hover:text-primary transition-colors">
                        <ShoppingBag size={18} />
                        <span>Dyqani</span>
                    </Link>
                </nav>

                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-foreground/80">
                                {user.email}
                            </span>
                            <Button variant="ghost" size="sm" onClick={signOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Dil
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" asChild>
                                <Link href="/login">Kyçu</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/register">Regjistrohu</Link>
                            </Button>
                        </div>
                    )}
                </div>

                <button className="md:hidden text-foreground" aria-label="Menu">
                    <Menu size={24} />
                </button>
            </div>
        </header>
    );
}
