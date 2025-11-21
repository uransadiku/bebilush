import Link from 'next/link';
import { Menu, ShoppingBag, Sparkles } from 'lucide-react';

export default function Header() {
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

                <button className="md:hidden text-foreground" aria-label="Menu">
                    <Menu size={24} />
                </button>
            </div>
        </header>
    );
}
